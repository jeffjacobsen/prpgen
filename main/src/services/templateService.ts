import { DatabaseService, Template } from '../database/database';

export class TemplateService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // Template operations
  async getAllTemplates(): Promise<Template[]> {
    try {
      return this.db.getAllTemplates();
    } catch (error) {
      throw error;
    }
  }

  async getTemplate(templateId: number): Promise<Template> {
    try {
      const template = this.db.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }
      return template;
    } catch (error) {
      throw error;
    }
  }

  async createTemplate(title: string, content: string, category: string, tags: string[], url?: string, filePath?: string): Promise<Template> {
    try {
      return this.db.createTemplate(title, content, category, tags, url, filePath);
    } catch (error) {
      throw error;
    }
  }

  async updateTemplate(templateId: number, updates: Partial<Template>): Promise<void> {
    try {
      this.db.updateTemplate(templateId, updates);
    } catch (error) {
      throw error;
    }
  }

  async deleteTemplate(templateId: number): Promise<void> {
    try {
      this.db.deleteTemplate(templateId);
    } catch (error) {
      throw error;
    }
  }

  async searchTemplates(query: string): Promise<Template[]> {
    try {
      return this.db.searchTemplates(query);
    } catch (error) {
      throw error;
    }
  }

  // PRP Template validation (for PRP template files, not database templates)
  async validateTemplate(templatePath: string): Promise<{ valid: boolean; error?: string }> {
    // This would validate PRP template files
    // For now, just return valid
    return { valid: true };
  }

  // Load PRP templates from filesystem
  async loadTemplates(customPaths?: string[]): Promise<void> {
    // This would load PRP templates from filesystem
    // For now, no-op
  }
}