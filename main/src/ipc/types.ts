import type { BrowserWindow } from 'electron';
import type { ConfigManager } from '../services/configManager';
import type { DatabaseService } from '../database/database';
import type { RunCommandManager } from '../services/runCommandManager';
import type { Logger } from '../utils/logger';
import type { TemplateService } from '../services/templateService';
import type { PRPService } from '../services/prpService';
import type { PRPGenerationService } from '../services/prpGenerationService';

export interface AppServices {
  mainWindow: BrowserWindow | null;
  configManager: ConfigManager;
  databaseService: DatabaseService;
  runCommandManager: RunCommandManager;
  logger: Logger;
  templateService?: TemplateService;
  prpService?: PRPService;
  prpGenerationService?: PRPGenerationService;
}