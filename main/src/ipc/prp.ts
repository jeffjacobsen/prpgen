import { IpcMain } from 'electron';
import type { AppServices } from './types';
import type { PRPGenerationRequest } from '../types/prp';

export function registerPRPHandlers(ipcMain: IpcMain, services: AppServices) {
  const { prpService, prpGenerationService, templateService, databaseService } = services;
  
  if (!prpService || !prpGenerationService || !templateService || !databaseService) {
    console.error('Required services not initialized for PRP handlers');
    return;
  }

  // PRP (Product Requirement Prompt) operations
  ipcMain.handle('prp:get', async (_, prpId: number) => {
    try {
      const prp = await prpService.getPRP(prpId);
      return { success: true, data: prp };
    } catch (error) {
      console.error('Failed to get PRP:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get PRP' };
    }
  });

  ipcMain.handle('prp:get-all', async (_) => {
    try {
      const prps = await prpService.getAllPRPs();
      return { success: true, data: prps };
    } catch (error) {
      console.error('Failed to get all PRPs:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get all PRPs' };
    }
  });

  ipcMain.handle('prp:create', async (_, title: string, content: string) => {
    try {
      const prp = await prpService.createPRP(title, content);
      return { success: true, data: prp };
    } catch (error) {
      console.error('[IPC] Failed to create PRP:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create PRP' };
    }
  });

  ipcMain.handle('prp:update', async (_, prpId: number, title: string, content: string) => {
    try {
      await prpService.updatePRP(prpId, title, content);
      const prp = await prpService.getPRP(prpId);
      return { success: true, data: prp };
    } catch (error) {
      console.error('[IPC] Failed to update PRP:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update PRP' };
    }
  });

  ipcMain.handle('prp:delete', async (_, prpId: number) => {
    try {
      await prpService.deletePRP(prpId);
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to delete PRP:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete PRP' };
    }
  });

  ipcMain.handle('prp:generate-from-template', async (event, request: PRPGenerationRequest) => {
    try {
      // Set up progress listener
      const progressHandler = (progress: any) => {
        event.sender.send('prp-generation:progress', progress);
      };
      
      // Add progress listener
      prpGenerationService.on('progress', progressHandler);
      
      try {
        const result = await prpGenerationService.generateFromTemplate(request);
        return { success: true, data: result };
      } finally {
        // Clean up listener
        prpGenerationService.removeListener('progress', progressHandler);
      }
    } catch (error) {
      console.error('Failed to generate PRP from template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate PRP' };
    }
  });

  ipcMain.handle('prp:cancel-generation', async (_event) => {
    try {
      prpGenerationService.cancelGeneration();
      return { success: true };
    } catch (error) {
      console.error('[IPC] Failed to cancel PRP generation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel generation' };
    }
  });

  // PRP Template operations
  ipcMain.handle('prp:get-templates', async () => {
    try {
      // Get PRP templates from database instead of file system
      const dbTemplates = databaseService.getPRPTemplates();
      
      // Transform database templates to match frontend PRPTemplate interface
      const templates = dbTemplates.map(template => ({
        id: template.id.toString(),
        name: template.title,
        description: template.description || '',
        category: template.category,
        tags: template.tags,
        complexity: (template.complexity || 'medium') as 'low' | 'medium' | 'high',
        useCase: template.use_case || '',
        author: template.author,
        version: template.template_version,
        isCustom: false,
        // Store the full content in a path field for compatibility
        path: template.content
      }));
      
      return { success: true, data: templates };
    } catch (error) {
      console.error('Failed to get templates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get templates' };
    }
  });

  ipcMain.handle('prp:validate-template', async (_, templatePath: string) => {
    try {
      const result = await templateService.validateTemplate(templatePath);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to validate template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to validate template' };
    }
  });

  ipcMain.handle('prp:reload-templates', async (_, customPaths?: string[]) => {
    try {
      await templateService.loadTemplates(customPaths);
      const templates = templateService.getAllTemplates();
      return { success: true, data: templates };
    } catch (error) {
      console.error('Failed to reload templates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to reload templates' };
    }
  });

  // PRP Versions
  ipcMain.handle('prp:get-versions', async (_, prpId: number) => {
    try {
      const versions = await prpService.getPRPVersions(prpId);
      return { success: true, data: versions };
    } catch (error) {
      console.error('Failed to get PRP versions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get PRP versions' };
    }
  });
}