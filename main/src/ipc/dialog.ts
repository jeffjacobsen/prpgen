import { IpcMain, dialog } from 'electron';
import type { AppServices } from './types';

export function registerDialogHandlers(ipcMain: IpcMain, services: AppServices): void {
  ipcMain.handle('dialog:select-file', async (_event, options?: Electron.OpenDialogOptions) => {
    try {
      const mainWindow = services.mainWindow;
      if (!mainWindow) {
        return { success: false, error: 'No main window available' };
      }

      const defaultOptions: Electron.OpenDialogOptions = {
        properties: ['openFile'],
        ...options
      };

      const result = await dialog.showOpenDialog(mainWindow, defaultOptions);

      if (result.canceled) {
        return { success: true, data: null };
      }

      return { success: true, data: result.filePaths[0] };
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      return { success: false, error: 'Failed to open file dialog' };
    }
  });

  ipcMain.handle('dialog:select-directory', async (_event, options?: Electron.OpenDialogOptions) => {
    try {
      const mainWindow = services.mainWindow;
      if (!mainWindow) {
        return { success: false, error: 'No main window available' };
      }

      const defaultOptions: Electron.OpenDialogOptions = {
        properties: ['openDirectory'],
        ...options
      };

      const result = await dialog.showOpenDialog(mainWindow, defaultOptions);

      if (result.canceled) {
        return { success: true, data: null };
      }

      return { success: true, data: result.filePaths[0] };
    } catch (error) {
      console.error('Failed to open directory dialog:', error);
      return { success: false, error: 'Failed to open directory dialog' };
    }
  });
}