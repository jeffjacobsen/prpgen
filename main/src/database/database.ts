import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { Project, ProjectRunCommand } from './models';

// Template interface (renamed from Document)
export interface Template {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  word_count?: number;
  url?: string;
  file_path?: string;
  description?: string;
  template_version?: string;
  author?: string;
  complexity?: string;
  use_case?: string;
  prerequisites?: any;
  is_prp_template?: boolean;
  created_at: string;
  updated_at: string;
}

// PRP interfaces
export interface ProductRequirementPrompt {
  id: number;
  title: string;
  content: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PRPVersion {
  id: number;
  prp_id: number;
  title: string;
  content: string;
  version: number;
  created_at: string;
}

export class DatabaseService {
  db: Database.Database;

  constructor(dbPath: string) {
    // Ensure the directory exists before creating the database
    const dir = dirname(dbPath);
    mkdirSync(dir, { recursive: true });
    
    this.db = new Database(dbPath);
  }

  initialize(): void {
    this.initializeSchema();
    this.runMigrations();
  }

  private initializeSchema(): void {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute schema in parts (sqlite3 doesn't support multiple statements in exec)
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        this.db.prepare(statement.trim()).run();
      }
    }
  }

  private runMigrations(): void {
    // Get all migration files
    const migrationsDir = join(__dirname, 'migrations');
    const migrationFiles = [
      'add_project_support.sql',
      'add_build_commands.sql',
      'add_permission_mode.sql',
      'add_display_order.sql',
      'add_last_viewed_field.sql',
      'add_documents_prd_support.sql',
      'rename_prd_to_prp.sql',
      'make_documents_project_independent.sql',
      'remove_project_id_from_documents_and_prps.sql',
      'remove_sessions_rename_to_templates.sql',
      'add_template_metadata_fields.sql'
    ];

    // Create migrations tracking table if it doesn't exist
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS migrations (
        name TEXT PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Apply migrations in order
    for (const migrationFile of migrationFiles) {
      const applied = this.db.prepare('SELECT * FROM migrations WHERE name = ?').get(migrationFile);
      
      if (!applied) {
        try {
          const migrationPath = join(migrationsDir, migrationFile);
          const migration = readFileSync(migrationPath, 'utf-8');
          
          // Execute migration statements
          const statements = migration.split(';').filter(stmt => stmt.trim());
          this.db.transaction(() => {
            for (const statement of statements) {
              if (statement.trim()) {
                this.db.prepare(statement.trim()).run();
              }
            }
            
            // Mark migration as applied
            this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationFile);
          })();
          
          console.log(`Applied migration: ${migrationFile}`);
        } catch (error) {
          console.error(`Failed to apply migration ${migrationFile}:`, error);
        }
      }
    }
  }

  close(): void {
    this.db.close();
  }

  // Project methods
  createProject(
    name: string, 
    path: string,
    systemPrompt?: string,
    runScript?: string,
    mainBranch?: string,
    buildScript?: string,
    defaultPermissionMode?: string,
    openIdeCommand?: string
  ): Project {
    const result = this.db.prepare(`
      INSERT INTO projects (name, path, system_prompt, run_script, main_branch, build_script, default_permission_mode, open_ide_command)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, 
      path, 
      systemPrompt || null,
      runScript || null,
      mainBranch || null,
      buildScript || null,
      defaultPermissionMode || null,
      openIdeCommand || null
    );

    return this.getProject(result.lastInsertRowid as number)!;
  }

  getProject(id: number): Project | null {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return row ? this.rowToProject(row) : null;
  }

  getProjectByName(name: string): Project | null {
    const row = this.db.prepare('SELECT * FROM projects WHERE name = ?').get(name);
    return row ? this.rowToProject(row) : null;
  }

  getAllProjects(): Project[] {
    const rows = this.db.prepare('SELECT * FROM projects ORDER BY display_order ASC, name ASC').all();
    return rows.map(row => this.rowToProject(row));
  }

  updateProject(id: number, updates: Partial<Project>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.path !== undefined) {
      fields.push('path = ?');
      values.push(updates.path);
    }
    if (updates.permission_mode !== undefined) {
      fields.push('permission_mode = ?');
      values.push(updates.permission_mode);
    }
    if (updates.dev_command !== undefined) {
      fields.push('dev_command = ?');
      values.push(updates.dev_command);
    }
    if (updates.build_command !== undefined) {
      fields.push('build_command = ?');
      values.push(updates.build_command);
    }
    if (updates.test_command !== undefined) {
      fields.push('test_command = ?');
      values.push(updates.test_command);
    }
    if (updates.lint_command !== undefined) {
      fields.push('lint_command = ?');
      values.push(updates.lint_command);
    }
    if (updates.typecheck_command !== undefined) {
      fields.push('typecheck_command = ?');
      values.push(updates.typecheck_command);
    }
    if (updates.display_order !== undefined) {
      fields.push('display_order = ?');
      values.push(updates.display_order);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);
    }
  }

  updateProjectLastViewed(id: number): void {
    this.db.prepare(`
      UPDATE projects 
      SET last_viewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
  }

  deleteProject(id: number): void {
    this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  reorderProjects(projectOrders: Array<{ id: number; displayOrder: number }>): void {
    const updateStmt = this.db.prepare('UPDATE projects SET display_order = ? WHERE id = ?');
    
    this.db.transaction(() => {
      for (const order of projectOrders) {
        updateStmt.run(order.displayOrder, order.id);
      }
    })();
  }

  // Run command methods
  createRunCommand(projectId: number, command: string, name: string, displayOrder: number): any {
    const result = this.db.prepare(`
      INSERT INTO run_commands (project_id, command, name, display_order)
      VALUES (?, ?, ?, ?)
    `).run(projectId, command, name, displayOrder);
    
    return { id: result.lastInsertRowid };
  }

  getProjectRunCommands(projectId: number): any[] {
    return this.db.prepare(`
      SELECT * FROM run_commands 
      WHERE project_id = ? 
      ORDER BY display_order
    `).all(projectId);
  }

  deleteProjectRunCommands(projectId: number): void {
    this.db.prepare('DELETE FROM run_commands WHERE project_id = ?').run(projectId);
  }

  private rowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      permission_mode: row.permission_mode || 'review',
      dev_command: row.dev_command || null,
      build_command: row.build_command || null,
      test_command: row.test_command || null,
      lint_command: row.lint_command || null,
      typecheck_command: row.typecheck_command || null,
      last_viewed_at: row.last_viewed_at || null,
      display_order: row.display_order || 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // Template methods (renamed from Document methods)
  createTemplate(title: string, content: string, category: string, tags: string[], url?: string, filePath?: string): Template {
    const wordCount = content.trim().split(/\s+/).length;
    const tagsJson = JSON.stringify(tags);

    const result = this.db.prepare(`
      INSERT INTO templates (title, content, category, tags, word_count, url, file_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, content, category, tagsJson, wordCount, url || null, filePath || null);

    return this.getTemplate(result.lastInsertRowid as number)!;
  }

  getTemplate(id: number): Template | null {
    const row = this.db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    return row ? this.rowToTemplate(row) : null;
  }

  getAllTemplates(): Template[] {
    const rows = this.db.prepare('SELECT * FROM templates ORDER BY updated_at DESC').all();
    return rows.map(row => this.rowToTemplate(row));
  }

  searchTemplates(query: string): Template[] {
    const rows = this.db.prepare(`
      SELECT * FROM templates 
      WHERE title LIKE ? OR content LIKE ? OR category LIKE ?
      ORDER BY updated_at DESC
    `).all(`%${query}%`, `%${query}%`, `%${query}%`);
    
    return rows.map(row => this.rowToTemplate(row));
  }

  updateTemplate(id: number, updates: Partial<Template>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
      fields.push('word_count = ?');
      values.push(updates.content.trim().split(/\s+/).length);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const sql = `UPDATE templates SET ${fields.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);
    }
  }

  deleteTemplate(id: number): void {
    this.db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  }

  // Create a PRP template with full metadata
  createPRPTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'word_count'>): Template {
    const wordCount = template.content.trim().split(/\s+/).length;
    const tagsJson = JSON.stringify(template.tags);
    const prerequisitesJson = JSON.stringify(template.prerequisites || {});

    const result = this.db.prepare(`
      INSERT INTO templates (
        title, content, category, tags, word_count, url, file_path,
        description, template_version, author, complexity, use_case, prerequisites, is_prp_template
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      template.title,
      template.content,
      template.category,
      tagsJson,
      wordCount,
      template.url || null,
      template.file_path || null,
      template.description || null,
      template.template_version || '1.0.0',
      template.author || null,
      template.complexity || 'medium',
      template.use_case || null,
      prerequisitesJson,
      template.is_prp_template !== false ? 1 : 0
    );

    return this.getTemplate(result.lastInsertRowid as number)!;
  }

  // Get all PRP templates
  getPRPTemplates(): Template[] {
    const rows = this.db.prepare('SELECT * FROM templates WHERE is_prp_template = 1 ORDER BY category, title').all();
    return rows.map(row => this.rowToTemplate(row));
  }

  private rowToTemplate(row: any): Template {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      tags: JSON.parse(row.tags || '[]'),
      word_count: row.word_count,
      url: row.url,
      file_path: row.file_path,
      description: row.description,
      template_version: row.template_version,
      author: row.author,
      complexity: row.complexity,
      use_case: row.use_case,
      prerequisites: row.prerequisites ? JSON.parse(row.prerequisites) : {},
      is_prp_template: row.is_prp_template,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // PRP methods
  createPRP(title: string, content: string): ProductRequirementPrompt {
    const result = this.db.prepare(`
      INSERT INTO product_requirement_prompts (title, content)
      VALUES (?, ?)
    `).run(title, content);

    // Also create initial version
    this.createPRPVersion(result.lastInsertRowid as number, title, content, 1);

    return this.getPRP(result.lastInsertRowid as number)!;
  }

  getPRP(id: number): ProductRequirementPrompt | null {
    const row = this.db.prepare('SELECT * FROM product_requirement_prompts WHERE id = ?').get(id);
    return row ? this.rowToPRP(row) : null;
  }

  getAllPRPs(): ProductRequirementPrompt[] {
    const rows = this.db.prepare('SELECT * FROM product_requirement_prompts ORDER BY updated_at DESC').all();
    return rows.map(row => this.rowToPRP(row));
  }

  updatePRP(id: number, title: string, content: string): void {
    // Get current version
    const current = this.getPRP(id);
    if (!current) return;

    const newVersion = current.version + 1;

    // Update PRP
    this.db.prepare(`
      UPDATE product_requirement_prompts 
      SET title = ?, content = ?, version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, content, newVersion, id);

    // Create version history
    this.createPRPVersion(id, title, content, newVersion);
  }

  deletePRP(id: number): void {
    this.db.prepare('UPDATE product_requirement_prompts SET is_active = 0 WHERE id = ?').run(id);
  }

  private createPRPVersion(prpId: number, title: string, content: string, version: number): void {
    this.db.prepare(`
      INSERT INTO prp_versions (prp_id, title, content, version)
      VALUES (?, ?, ?, ?)
    `).run(prpId, title, content, version);
  }

  getPRPVersions(prpId: number): PRPVersion[] {
    const rows = this.db.prepare(`
      SELECT * FROM prp_versions 
      WHERE prp_id = ? 
      ORDER BY version DESC
    `).all(prpId);
    
    return rows.map((row: any) => ({
      id: row.id,
      prp_id: row.prp_id,
      title: row.title,
      content: row.content,
      version: row.version,
      created_at: row.created_at
    }));
  }

  private rowToPRP(row: any): ProductRequirementPrompt {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      version: row.version,
      is_active: true, // All PRPs are active in this simplified version
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}