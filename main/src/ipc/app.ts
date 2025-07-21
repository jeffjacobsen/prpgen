import { IpcMain, shell, app, BrowserWindow } from 'electron';
import type { AppServices } from './types';

export function registerAppHandlers(ipcMain: IpcMain, services: AppServices): void {
  // Basic app info handlers
  ipcMain.handle('app:version', () => {
    return app.getVersion();
  });

  ipcMain.handle('get-platform', () => {
    return process.platform;
  });

  ipcMain.handle('is-packaged', () => {
    return app.isPackaged;
  });

  // System utilities
  ipcMain.handle('app:open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Failed to open external URL:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to open URL' };
    }
  });

  // Dev tools toggle
  ipcMain.handle('app:toggle-dev-tools', () => {
    const mainWindow = services.mainWindow;
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
      return { success: true };
    }
    return { success: false, error: 'No main window found' };
  });

  // Quit app
  ipcMain.handle('app:quit', () => {
    app.quit();
    return { success: true };
  });
}