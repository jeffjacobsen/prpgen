import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { ConfigManager } from './services/configManager';
import { DatabaseService } from './database/database';
import { RunCommandManager } from './services/runCommandManager';
import { Logger } from './utils/logger';
import { setPRPGenDirectory } from './utils/crystalDirectory';
import { registerIpcHandlers } from './ipc';
import { AppServices } from './ipc/types';

let mainWindow: BrowserWindow | null = null;

// Service instances
let configManager: ConfigManager;
let logger: Logger;
let databaseService: DatabaseService;
let runCommandManager: RunCommandManager;

// Store original console methods before overriding
const originalLog: typeof console.log = console.log;
const originalError: typeof console.error = console.error;
const originalWarn: typeof console.warn = console.warn;
const originalInfo: typeof console.info = console.info;

const isDevelopment = process.env.NODE_ENV !== 'production' && !app.isPackaged;

// Parse command-line arguments for custom PRPGen directory
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  // Support both --prpgen-dir=/path and --prpgen-dir /path formats (also maintain --crystal-dir for compatibility)
  if (arg.startsWith('--prpgen-dir=') || arg.startsWith('--crystal-dir=')) {
    const dir = arg.substring(arg.indexOf('=') + 1);
    setPRPGenDirectory(dir);
    console.log(`[Main] Using custom PRPGen directory: ${dir}`);
  } else if ((arg === '--prpgen-dir' || arg === '--crystal-dir') && i + 1 < args.length) {
    const dir = args[i + 1];
    setPRPGenDirectory(dir);
    console.log(`[Main] Using custom PRPGen directory: ${dir}`);
    i++; // Skip the next argument since we've consumed it
  }
}

// Install Devtron in development
if (isDevelopment) {
  console.log('[Main] Development mode - Devtron can be installed in DevTools console');
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Don't show window until ready
    backgroundColor: '#111827', // Match dark theme (gray-900)
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    ...(process.platform === 'darwin' ? {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 10, y: 10 }
    } : {})
  });

  // Show window when ready to prevent white flash (set up listener before loading)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDevelopment) {
    await mainWindow.loadURL('http://localhost:4521');
    // Delay dev tools opening to reduce startup sounds
    setTimeout(() => {
      mainWindow?.webContents.openDevTools();
    }, 1000);
    
    // Enable IPC debugging in development
    console.log('[Main] 🔍 IPC debugging enabled - check DevTools console for IPC call logs');
  } else {
    const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external link clicks
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  try {
    console.log('[Main] App is ready, initializing services...');
    
    // Initialize all services
    await initializeServices();
    
    // Create the main window
    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
    
    console.log('[Main] App initialized successfully');
  } catch (error) {
    console.error('[Main] Failed to initialize app:', error);
    app.quit();
  }
});

async function initializeServices() {
  console.log('[Main] Starting service initialization...');
  
  // Initialize core services
  configManager = new ConfigManager();
  
  // Initialize database
  const dbPath = configManager.getDatabasePath();
  console.log('[Main] Database path:', dbPath);
  databaseService = new DatabaseService(dbPath);
  databaseService.initialize();
  
  // Initialize logger after database is ready
  logger = new Logger(configManager);
  
  // Override console methods with our logger after initialization
  console.log = logger.log.bind(logger);
  console.error = logger.error.bind(logger);
  console.warn = logger.warn.bind(logger);
  console.info = logger.info.bind(logger);
  
  // Initialize other services
  runCommandManager = new RunCommandManager(databaseService);
  
  // Create service container for IPC handlers
  const services: AppServices = {
    mainWindow: null, // Will be set after window creation
    configManager,
    logger,
    databaseService,
    runCommandManager,
  };
  
  // Register all IPC handlers
  registerIpcHandlers(services);
  
  // Set mainWindow reference after it's created
  app.on('browser-window-created', (event, window) => {
    if (window === mainWindow) {
      services.mainWindow = mainWindow;
    }
  });
  
  console.log('[Main] All services initialized successfully');
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  console.log('[Main] App is quitting, cleaning up...');
  
  try {
    // Close database connection
    if (databaseService) {
      databaseService.close();
    }
    
    console.log('[Main] Cleanup completed');
  } catch (error) {
    console.error('[Main] Error during cleanup:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log app version and environment
console.log('[Main] PRPGen version:', app.getVersion());
console.log('[Main] Electron version:', process.versions.electron);
console.log('[Main] Node version:', process.versions.node);
console.log('[Main] Chrome version:', process.versions.chrome);
console.log('[Main] Platform:', process.platform);
console.log('[Main] Environment:', isDevelopment ? 'development' : 'production');