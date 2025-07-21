import { EventEmitter } from 'events';
import { ConfigManager } from './configManager';
import { DatabaseService } from '../database/database';
import { PRPGenerationRequest, PRPGenerationProgress } from '../types/prp';

export class PRPGenerationService extends EventEmitter {
  private configManager: ConfigManager;
  private databaseService: DatabaseService;
  private isGenerating = false;
  private shouldCancel = false;

  constructor(configManager: ConfigManager, databaseService: DatabaseService) {
    super();
    this.configManager = configManager;
    this.databaseService = databaseService;
  }

  async generateFromTemplate(request: PRPGenerationRequest): Promise<{ content: string }> {
    if (this.isGenerating) {
      throw new Error('Generation already in progress');
    }

    this.isGenerating = true;
    this.shouldCancel = false;

    try {
      this.emitProgress({
        stage: 'starting',
        message: 'Starting PRP generation...',
        progress: 0
      });

      // Fetch the template from the database
      const templateId = parseInt(request.templateId, 10);
      const template = this.databaseService.getTemplate(templateId);
      
      if (!template || !template.is_prp_template) {
        throw new Error('Template not found or is not a PRP template');
      }

      this.emitProgress({
        stage: 'analyzing',
        message: 'Processing template and requirements...',
        progress: 30
      });

      // Process the template content
      let content = template.content;

      // Simple variable substitution for now
      // Replace {{FEATURE_REQUEST}} with the actual feature request
      content = content.replace(/\{\{FEATURE_REQUEST\}\}/g, request.featureRequest);
      
      // Replace {{CODEBASE_PATH}} with the codebase path if provided
      if (request.codebasePath) {
        content = content.replace(/\{\{CODEBASE_PATH\}\}/g, request.codebasePath);
      } else {
        content = content.replace(/\{\{CODEBASE_PATH\}\}/g, 'No existing codebase specified');
      }

      // Add feature request context at the beginning if not already included
      if (!content.includes(request.featureRequest)) {
        content = `# Product Requirement Prompt

## Feature Request
${request.featureRequest}

${request.codebasePath ? `## Codebase Context
Path: ${request.codebasePath}

` : ''}
${content}`;
      }

      this.emitProgress({
        stage: 'complete',
        message: 'PRP generation complete!',
        progress: 100
      });

      return { content };
    } finally {
      this.isGenerating = false;
      this.shouldCancel = false;
    }
  }

  cancelGeneration(): void {
    if (this.isGenerating) {
      this.shouldCancel = true;
      this.emitProgress({
        stage: 'cancelled',
        message: 'Generation cancelled by user',
        progress: 0
      });
    }
  }

  private emitProgress(progress: PRPGenerationProgress): void {
    this.emit('progress', progress);
  }
}