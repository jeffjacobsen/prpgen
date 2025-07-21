import { IpcMain } from 'electron';
import type { AppServices } from './types';

export function registerProjectHandlers(ipcMain: IpcMain, services: AppServices): void {
  const { databaseService } = services;

  ipcMain.handle('projects:get-all', async () => {
    try {
      const projects = databaseService.getAllProjects();
      return { success: true, data: projects };
    } catch (error) {
      console.error('Failed to get projects:', error);
      return { success: false, error: 'Failed to get projects' };
    }
  });

  ipcMain.handle('projects:create', async (_event, projectData: any) => {
    try {
      console.log('[Main] Creating project:', projectData);

      // Import fs and exec utilities
      const { mkdirSync, existsSync } = require('fs');
      const { execSync: nodeExecSync } = require('child_process');

      // Create directory if it doesn't exist
      if (!existsSync(projectData.path)) {
        console.log('[Main] Creating directory:', projectData.path);
        mkdirSync(projectData.path, { recursive: true });
      }

      // Check if it's a git repository
      let isGitRepo = false;
      try {
        nodeExecSync(`cd "${projectData.path}" && git rev-parse --is-inside-work-tree`, { encoding: 'utf-8' });
        isGitRepo = true;
        console.log('[Main] Directory is already a git repository');
      } catch (error) {
        console.log('[Main] Directory is not a git repository, initializing...');
      }

      // Initialize git if needed
      if (!isGitRepo) {
        try {
          // Use the specified main branch name if provided
          const branchName = projectData.mainBranch || 'main';

          nodeExecSync(`cd "${projectData.path}" && git init`, { encoding: 'utf-8' });
          console.log('[Main] Git repository initialized successfully');

          // Create and checkout the specified branch
          nodeExecSync(`cd "${projectData.path}" && git checkout -b ${branchName}`, { encoding: 'utf-8' });
          console.log(`[Main] Created and checked out branch: ${branchName}`);

          // Create initial commit
          nodeExecSync(`cd "${projectData.path}" && git commit -m "Initial commit" --allow-empty`, { encoding: 'utf-8' });
          console.log('[Main] Created initial empty commit');
        } catch (error) {
          console.error('[Main] Failed to initialize git repository:', error);
          // Continue anyway - let the user handle git setup manually if needed
        }
      }

      // Detect or use the provided main branch
      let mainBranch: string | undefined = projectData.mainBranch;
      if (!mainBranch && isGitRepo) {
        try {
          // Default to 'main' if not specified
          mainBranch = 'main';
          console.log('[Main] Detected main branch:', mainBranch);
        } catch (error) {
          console.log('[Main] Could not detect main branch, skipping:', error);
          // Not a git repository or error detecting, that's okay
        }
      }

      const project = databaseService.createProject(
        projectData.name,
        projectData.path,
        projectData.systemPrompt,
        projectData.runScript,
        mainBranch,
        projectData.buildScript,
        undefined, // default_permission_mode
        projectData.openIdeCommand
      );

      // If run_script was provided, also create run commands
      if (projectData.runScript && project) {
        const commands = projectData.runScript.split('\n').filter((cmd: string) => cmd.trim());
        commands.forEach((command: string, index: number) => {
          databaseService.createRunCommand(
            project.id,
            command.trim(),
            `Command ${index + 1}`,
            index
          );
        });
      }

      console.log('[Main] Project created successfully:', project);
      return { success: true, data: project };
    } catch (error) {
      console.error('[Main] Failed to create project:', error);

      // Extract detailed error information
      let errorMessage = 'Failed to create project';
      let errorDetails = '';
      let command = '';

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || error.toString();

        // Check if it's a command error
        const cmdError = error as any;
        if (cmdError.cmd) {
          command = cmdError.cmd;
        }

        // Include command output if available
        if (cmdError.stderr) {
          errorDetails = cmdError.stderr;
        } else if (cmdError.stdout) {
          errorDetails = cmdError.stdout;
        }
      }

      return {
        success: false,
        error: errorMessage,
        details: errorDetails,
        command: command
      };
    }
  });

  ipcMain.handle('projects:update', async (_event, projectId: string, updates: any) => {
    try {
      // Update the project
      const project = databaseService.updateProject(parseInt(projectId), updates);

      // If run_script was updated, also update the run commands table
      if (updates.run_script !== undefined) {
        const projectIdNum = parseInt(projectId);

        // Delete existing run commands
        databaseService.deleteProjectRunCommands(projectIdNum);

        // Add new run commands from the multiline script
        if (updates.run_script) {
          const commands = updates.run_script.split('\n').filter((cmd: string) => cmd.trim());
          commands.forEach((command: string, index: number) => {
            databaseService.createRunCommand(
              projectIdNum,
              command.trim(),
              `Command ${index + 1}`,
              index
            );
          });
        }
      }

      return { success: true, data: project };
    } catch (error) {
      console.error('Failed to update project:', error);
      return { success: false, error: 'Failed to update project' };
    }
  });

  ipcMain.handle('projects:delete', async (_event, projectId: string) => {
    try {
      const projectIdNum = parseInt(projectId);
      
      // Now safe to delete the project
      const success = databaseService.deleteProject(projectIdNum);
      return { success: true, data: success };
    } catch (error) {
      console.error('Failed to delete project:', error);
      return { success: false, error: 'Failed to delete project' };
    }
  });

  ipcMain.handle('projects:reorder', async (_event, projectOrders: Array<{ id: number; displayOrder: number }>) => {
    try {
      databaseService.reorderProjects(projectOrders);
      return { success: true };
    } catch (error) {
      console.error('Failed to reorder projects:', error);
      return { success: false, error: 'Failed to reorder projects' };
    }
  });

  ipcMain.handle('projects:detect-branch', async (_event, path: string) => {
    try {
      // Default to 'main' branch
      const branch = 'main';
      return { success: true, data: branch };
    } catch (error) {
      console.log('[Main] Could not detect branch:', error);
      return { success: true, data: 'main' }; // Return default if detection fails
    }
  });

  ipcMain.handle('projects:list-branches', async (_event, projectId: string) => {
    try {
      const project = databaseService.getProject(parseInt(projectId));
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Return empty branches list since worktreeManager is removed
      const branches: string[] = [];
      return { success: true, data: branches };
    } catch (error) {
      console.error('[Main] Failed to list branches:', error);
      return { success: false, error: 'Failed to list branches' };
    }
  });
}