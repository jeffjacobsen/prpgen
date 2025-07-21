import { DatabaseService } from '../main/dist/database/database.js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize database
const dbPath = join(process.env.HOME || '', '.prpgen', 'sessions.db');
const db = new DatabaseService(dbPath);
db.initialize();

// Path to templates
const templatesPath = join(__dirname, '..', 'resources', 'prp-templates');

function migrateTemplates() {
  console.log('Starting PRP template migration...');
  
  // Process default templates
  const defaultPath = join(templatesPath, 'default');
  if (existsSync(defaultPath)) {
    const templates = readdirSync(defaultPath);
    
    for (const templateDir of templates) {
      const templatePath = join(defaultPath, templateDir);
      const metadataPath = join(templatePath, 'metadata.json');
      const contentPath = join(templatePath, 'template.md');
      
      if (existsSync(metadataPath) && existsSync(contentPath)) {
        try {
          const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
          const content = readFileSync(contentPath, 'utf-8');
          
          // Create template in database
          const template = db.createPRPTemplate({
            title: metadata.name,
            content: content,
            category: metadata.category || 'general',
            tags: metadata.tags || [],
            description: metadata.description,
            template_version: metadata.version,
            author: metadata.author,
            complexity: metadata.complexity,
            use_case: metadata.useCase,
            prerequisites: metadata.prerequisites || {},
            is_prp_template: true
          });
          
          console.log(`✓ Migrated template: ${metadata.name}`);
        } catch (error) {
          console.error(`✗ Failed to migrate ${templateDir}:`, error);
        }
      }
    }
  }
  
  // Process example templates
  const examplesPath = join(templatesPath, 'examples');
  if (existsSync(examplesPath)) {
    const examples = readdirSync(examplesPath);
    
    for (const exampleDir of examples) {
      const examplePath = join(examplesPath, exampleDir);
      const metadataPath = join(examplePath, 'metadata.json');
      const contentPath = join(examplePath, 'template.md');
      
      if (existsSync(metadataPath) && existsSync(contentPath)) {
        try {
          const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
          const content = readFileSync(contentPath, 'utf-8');
          
          // Create template in database
          const template = db.createPRPTemplate({
            title: metadata.name,
            content: content,
            category: metadata.category || 'examples',
            tags: metadata.tags || [],
            description: metadata.description,
            template_version: metadata.version,
            author: metadata.author,
            complexity: metadata.complexity,
            use_case: metadata.useCase,
            prerequisites: metadata.prerequisites || {},
            is_prp_template: true
          });
          
          console.log(`✓ Migrated example: ${metadata.name}`);
        } catch (error) {
          console.error(`✗ Failed to migrate ${exampleDir}:`, error);
        }
      }
    }
  }
  
  console.log('\nMigration complete!');
  
  // Show summary
  const prpTemplates = db.getPRPTemplates();
  console.log(`\nTotal PRP templates in database: ${prpTemplates.length}`);
  
  // Group by category
  const byCategory = prpTemplates.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\nTemplates by category:');
  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });
}

// Run migration
try {
  migrateTemplates();
  db.close();
} catch (error) {
  console.error('Migration failed:', error);
  db.close();
  process.exit(1);
}