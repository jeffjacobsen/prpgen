import { IpcMain } from 'electron';
import type { AppServices } from './types';

export function registerTemplateHandlers(ipcMain: IpcMain, services: AppServices) {
  const { templateService } = services;
  
  if (!templateService) {
    console.error('Template service not initialized');
    return;
  }

  // Template operations
  ipcMain.handle('templates:get-all', async (_) => {
    try {
      const templates = await templateService.getAllTemplates();
      return { success: true, data: templates };
    } catch (error) {
      console.error('Failed to get templates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get templates' };
    }
  });

  ipcMain.handle('templates:get', async (_, templateId: number) => {
    try {
      const template = await templateService.getTemplate(templateId);
      return { success: true, data: template };
    } catch (error) {
      console.error('Failed to get template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get template' };
    }
  });

  ipcMain.handle('templates:create', async (_, title: string, content: string, category?: string, tags?: string[], filePath?: string, url?: string) => {
    try {
      const template = await templateService.createTemplate(
        title, 
        content, 
        category || 'general', 
        tags || [], 
        url, 
        filePath
      );
      return { success: true, data: template };
    } catch (error) {
      console.error('Failed to create template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create template' };
    }
  });

  ipcMain.handle('templates:update', async (_, templateId: number, updates: any) => {
    try {
      await templateService.updateTemplate(templateId, updates);
      const template = await templateService.getTemplate(templateId);
      return { success: true, data: template };
    } catch (error) {
      console.error('Failed to update template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update template' };
    }
  });

  ipcMain.handle('templates:delete', async (_, templateId: number) => {
    try {
      await templateService.deleteTemplate(templateId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete template' };
    }
  });

  ipcMain.handle('templates:search', async (_, query: string, limit?: number) => {
    try {
      const results = await templateService.searchTemplates(query);
      return { success: true, data: results };
    } catch (error) {
      console.error('Failed to search templates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to search templates' };
    }
  });

  // PRP Template specific operations
  ipcMain.handle('templates:get-prp-templates', async (_) => {
    try {
      const prpTemplates = services.databaseService.getPRPTemplates();
      return { success: true, data: prpTemplates };
    } catch (error) {
      console.error('Failed to get PRP templates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get PRP templates' };
    }
  });

  ipcMain.handle('templates:create-prp-template', async (_, template: any) => {
    try {
      const createdTemplate = services.databaseService.createPRPTemplate(template);
      return { success: true, data: createdTemplate };
    } catch (error) {
      console.error('Failed to create PRP template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create PRP template' };
    }
  });
}