import { DatabaseService, ProductRequirementPrompt, PRPVersion } from '../database/database';

export class PRPService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // Get a specific PRP by ID
  async getPRP(prpId: number): Promise<ProductRequirementPrompt> {
    try {
      const prp = this.db.getPRP(prpId);
      if (!prp) {
        throw new Error(`PRP ${prpId} not found`);
      }
      return prp;
    } catch (error) {
      throw error;
    }
  }

  // Get all PRPs
  async getAllPRPs(): Promise<ProductRequirementPrompt[]> {
    try {
      return this.db.getAllPRPs();
    } catch (error) {
      throw error;
    }
  }

  // Create a new PRP
  async createPRP(title: string, content: string): Promise<ProductRequirementPrompt> {
    try {
      return this.db.createPRP(title, content);
    } catch (error) {
      throw error;
    }
  }

  // Update an existing PRP
  async updatePRP(prpId: number, title: string, content: string): Promise<void> {
    try {
      this.db.updatePRP(prpId, title, content);
    } catch (error) {
      throw error;
    }
  }

  // Delete a PRP
  async deletePRP(prpId: number): Promise<void> {
    try {
      this.db.deletePRP(prpId);
    } catch (error) {
      throw error;
    }
  }

  // Get version history for a PRP
  async getPRPVersions(prpId: number): Promise<PRPVersion[]> {
    try {
      return this.db.getPRPVersions(prpId);
    } catch (error) {
      throw error;
    }
  }
}