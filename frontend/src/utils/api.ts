/**
 * API utility that wraps Tauri API calls with consistent error handling
 */

import { 
  prpApi, 
  templateApi, 
  configApi, 
  dialogApi, 
  events, 
  appApi,
  currentBackend 
} from '../lib/api';

// Response interface for consistent API responses
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// Helper function to wrap API calls with error handling
async function wrapApiCall<T>(apiCall: Promise<T>): Promise<IPCResponse<T>> {
  try {
    const data = await apiCall;
    return { success: true, data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An error occurred',
      details: error.stack
    };
  }
}

// Wrapper class for API calls that provides error handling and consistent interface
export class API {
  // Template management (formerly documents)
  static templates = {
    async getAll(): Promise<IPCResponse<any[]>> {
      return wrapApiCall(templateApi.getAll());
    },

    async get(templateId: number): Promise<IPCResponse<any>> {
      return wrapApiCall(templateApi.get(templateId));
    },

    async create(template: { title: string; content: string; category?: string; tags?: string[]; file_path?: string; url?: string }): Promise<IPCResponse<any>> {
      return wrapApiCall(templateApi.create(template));
    },

    async update(templateId: number, updates: any): Promise<IPCResponse<any>> {
      return wrapApiCall(templateApi.update(templateId, updates));
    },

    async delete(templateId: number): Promise<IPCResponse<void>> {
      return wrapApiCall(templateApi.delete(templateId)) as Promise<IPCResponse<void>>;
    },

    async search(query: string): Promise<IPCResponse<any[]>> {
      return wrapApiCall(templateApi.search(query)) as Promise<IPCResponse<any[]>>;
    },

    async scrapeUrl(_url: string, _options?: any): Promise<IPCResponse<any>> {
      return { 
        success: false, 
        error: 'URL scraping not yet implemented in Tauri' 
      };
    },

    async getPRPTemplates(): Promise<IPCResponse<any[]>> {
      return wrapApiCall(templateApi.getPRPTemplates());
    },

    async createPRPTemplate(template: any): Promise<IPCResponse<any>> {
      return wrapApiCall(templateApi.createPRPTemplate(template));
    },

    async seedDefaultTemplates(): Promise<IPCResponse<string>> {
      return wrapApiCall(templateApi.seedDefaultTemplates());
    }
  };

  // PRP management
  static prp = {
    async getAll(): Promise<IPCResponse<any[]>> {
      return wrapApiCall(prpApi.getAll());
    },

    async get(prpId: number): Promise<IPCResponse<any>> {
      return wrapApiCall(prpApi.get(prpId));
    },

    async create(title: string, content: string): Promise<IPCResponse<any>> {
      return wrapApiCall(prpApi.create(title, content));
    },

    async update(prpId: number, title: string, content: string): Promise<IPCResponse<any>> {
      return wrapApiCall(prpApi.update(prpId, title, content));
    },

    async delete(prpId: number): Promise<IPCResponse<void>> {
      return wrapApiCall(prpApi.delete(prpId)) as Promise<IPCResponse<void>>;
    },

    async generateFromTemplate(request: any): Promise<IPCResponse<any>> {
      return wrapApiCall(prpApi.generateFromTemplate(request));
    },

    async cancelGeneration(): Promise<IPCResponse<void>> {
      return wrapApiCall(prpApi.cancelGeneration()) as Promise<IPCResponse<void>>;
    },

    async getTemplates(): Promise<IPCResponse<any[]>> {
      return API.templates.getPRPTemplates();
    }
  };

  // Configuration
  static config = {
    async get(): Promise<IPCResponse<any>> {
      return wrapApiCall(configApi.get());
    },

    async update(updates: any): Promise<IPCResponse<any>> {
      return wrapApiCall(configApi.update(updates));
    },

    async testClaude(customPath?: string): Promise<IPCResponse<string>> {
      return wrapApiCall(configApi.testClaude(customPath)) as Promise<IPCResponse<string>>;
    }
  };

  // Dialog
  static dialog = {
    async openFile(options?: any): Promise<IPCResponse<string | null>> {
      return wrapApiCall(dialogApi.openFile(options));
    },

    async openDirectory(options?: any): Promise<IPCResponse<string | null>> {
      return wrapApiCall(dialogApi.openDirectory(options));
    }
  };

  // App info
  static app = {
    async getVersion(): Promise<IPCResponse<string>> {
      return wrapApiCall(appApi.getVersion());
    },

    async getPlatform(): Promise<IPCResponse<string>> {
      return wrapApiCall(appApi.getPlatform());
    },

    async getState(): Promise<IPCResponse<never>> {
      return { 
        success: false, 
        error: 'App state not available in Tauri' 
      };
    },

    async openSettings(): Promise<IPCResponse<never>> {
      return { 
        success: false, 
        error: 'Settings dialog not available in Tauri' 
      };
    },

    async openExternal(url: string): Promise<IPCResponse<void>> {
      try {
        const { open } = await import('@tauri-apps/plugin-shell');
        await open(url);
        return { success: true };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message || 'Failed to open external URL' 
        };
      }
    }
  };

  // Events
  static events = events;
}

// Export individual APIs for direct use
export { prpApi, templateApi, configApi, dialogApi, events, appApi, currentBackend };