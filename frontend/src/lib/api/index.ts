/**
 * Tauri API abstraction layer
 */

import { invoke } from '@tauri-apps/api/core';

// PRP API
export const prpApi = {
  getAll: () => invoke<any[]>('get_all_prps'),
  
  get: (id: number) => invoke<any>('get_prp', { id }),
  
  create: (title: string, content: string) => 
    invoke<any>('create_prp', { prp: { title, content } }),
  
  update: (id: number, title: string, content: string) => 
    invoke<any>('update_prp', { id, prp: { title, content } }),
  
  delete: (id: number) => 
    invoke<void>('delete_prp', { id }),
  
  generateFromTemplate: async (request: {
    templateId: string | number;
    featureRequest: string;
    additionalContext?: string;
    codebasePath?: string;
  }) => {
    const response = await invoke<number>('generate_prp_with_claude', {
      templateId: typeof request.templateId === 'string' ? parseInt(request.templateId) : request.templateId,
      featureRequest: request.featureRequest,
      additionalContext: request.additionalContext,
      codebasePath: request.codebasePath,
    });
    
    // Get the generated PRP
    const prp = await invoke<any>('get_prp', { id: response });
    return prp;
  },
  
  cancelGeneration: () => 
    invoke<void>('cancel_prp_generation'),
};

// Template API
export const templateApi = {
  getAll: () => invoke<any[]>('get_all_templates'),
  
  get: (id: number) => invoke<any>('get_template', { id }),
  
  getPRPTemplates: () => invoke<any[]>('get_prp_templates'),
  
  create: (template: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    url?: string;
    file_path?: string;
    description?: string;
    template_version?: string;
    author?: string;
    complexity?: string;
    use_case?: string;
    prerequisites?: any;
    is_prp_template?: boolean;
  }) => {
    return invoke('create_template', { template });
  },
  
  update: (id: number, updates: any) => 
    invoke('update_template', { id, template: updates }),
  
  delete: (id: number) => 
    invoke('delete_template', { id }),
  
  search: (query: string) => 
    invoke('search_templates', { query }),
  
  createPRPTemplate: (template: any) =>
    invoke('create_template', { template: { ...template, is_prp_template: true } }),
  
  seedDefaultTemplates: () => {
    return invoke<string>('seed_default_templates');
  },
};

// Config API
export const configApi = {
  get: () => invoke('get_config'),
  
  update: (updates: any) => 
    invoke('update_config', { config: updates }),
  
  testClaude: (customPath?: string) => {
    return invoke('test_claude', { claudePath: customPath });
  },
};

// Dialog API
export const dialogApi = {
  openFile: async (options?: any) => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      multiple: false,
      filters: options?.filters,
    });
    return selected;
  },
  
  openDirectory: async (_options?: any) => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
    });
    return selected;
  },
};

// Event handling
export const events = {
  onPRPGenerationProgress: (callback: (progress: any) => void) => {
    let unlisten: (() => void) | null = null;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('prp-generation:progress', (event) => {
        callback(event.payload);
      }).then(unlistenFn => {
        unlisten = unlistenFn;
      });
    });
    // Return cleanup function
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  },
};

// App info
export const appApi = {
  getVersion: () => {
    return import('@tauri-apps/api/app').then(({ getVersion }) => getVersion());
  },
  
  getPlatform: () => {
    return import('@tauri-apps/plugin-os').then(({ platform }) => platform());
  },
};

// Export for backward compatibility
export const currentBackend = 'tauri';