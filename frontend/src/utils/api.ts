// Utility for making API calls using Electron IPC

// Type for IPC response
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// Check if we're running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

// Wrapper class for API calls that provides error handling and consistent interface
export class API {
  // Template management (formerly documents)
  static templates = {
    async getAll() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('templates:get-all');
    },

    async get(templateId: number) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('templates:get', templateId);
    },

    async create(template: { title: string; content: string; category?: string; tags?: string[]; file_path?: string; url?: string }) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('templates:create', template.title, template.content, template.category, template.tags, template.file_path, template.url);
    },

    async update(templateId: number, updates: any) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('templates:update', templateId, updates);
    },

    async delete(templateId: number) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('templates:delete', templateId);
    },

    async search(query: string) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('templates:search', query);
    },

    async scrapeUrl(url: string, options?: any) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('templates:scrape-url', url, options);
    },

    async getPRPTemplates() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('templates:get-prp-templates');
    },

    async createPRPTemplate(template: any) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('templates:create-prp-template', template);
    }
  };

  // Product Requirement Prompts
  static prp = {
    async get(prpId: number) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:get', prpId);
    },

    async getAll() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:get-all');
    },

    async create(title: string, content: string) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:create', title, content);
    },

    async update(prpId: number, title: string, content: string) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:update', prpId, title, content);
    },

    async delete(prpId: number) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:delete', prpId);
    },

    async generateFromTemplate(request: any) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:generate-from-template', request);
    },

    async cancelGeneration() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:cancel-generation');
    },

    async getTemplates() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:get-templates');
    },

    async validateTemplate(templatePath: string) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:validate-template', templatePath);
    },

    async reloadTemplates(customPaths?: string[]) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:reload-templates', customPaths);
    },

    async getVersions(prpId: number) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('prp:get-versions', prpId);
    }
  };

  // Project management
  static projects = {
    async getAll() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('projects:get-all');
    },

    async get(projectId: number) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('projects:get', projectId);
    },

    async create(name: string, path: string) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('projects:create', name, path);
    },

    async update(projectId: number, updates: any) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('projects:update', projectId, updates);
    },

    async delete(projectId: number) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('projects:delete', projectId);
    },

    async reorder(projectIds: number[]) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('projects:reorder', projectIds);
    }
  };

  // Configuration
  static config = {
    async get() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('config:get');
    },

    async update(updates: any) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('config:update', updates);
    },

    async getVersion() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('app:version');
    },

    async testClaude(customPath?: string) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('config:test-claude', customPath);
    }
  };

  // App utilities
  static app = {
    async openExternal(url: string) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('app:open-external', url);
    },

    async toggleDevTools() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('app:toggle-dev-tools');
    },

    async quit() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('app:quit');
    }
  };

  // Dialog utilities
  static dialog = {
    async selectDirectory() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('dialog:select-directory');
    },

    async openDirectory() {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('dialog:select-directory');
    },

    async selectFile(options?: any) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('dialog:select-file', options);
    },

    async openFile(options?: any) {
      if (!isElectron()) throw new Error('Electron API not available');
      return window.electronAPI.invoke('dialog:select-file', options);
    }
  };
}