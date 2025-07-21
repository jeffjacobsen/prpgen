import { ipcMain } from 'electron';
import type { AppServices } from './types';
import { registerAppHandlers } from './app';
import { registerProjectHandlers } from './project';
import { registerConfigHandlers } from './config';
import { registerDialogHandlers } from './dialog';
import { registerTemplateHandlers } from './templates';
import { registerPRPHandlers } from './prp';

export function registerIpcHandlers(services: AppServices): void {
  // Initialize services that need to be created
  const { PRPService } = require('../services/prpService');
  const { TemplateService } = require('../services/templateService');
  const { PRPGenerationService } = require('../services/prpGenerationService');
  
  services.prpService = new PRPService(services.databaseService);
  services.templateService = new TemplateService(services.databaseService);
  services.prpGenerationService = new PRPGenerationService(services.configManager, services.databaseService);
  
  // Register handlers
  registerAppHandlers(ipcMain, services);
  registerProjectHandlers(ipcMain, services);
  registerConfigHandlers(ipcMain, services);
  registerDialogHandlers(ipcMain, services);
  registerTemplateHandlers(ipcMain, services);
  registerPRPHandlers(ipcMain, services);
}