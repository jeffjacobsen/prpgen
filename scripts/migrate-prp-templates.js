const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Initialize database
const dbPath = path.join(process.env.HOME || '', '.prpgen', 'prpgen.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

// Path to templates
const templatesPath = path.join(__dirname, '..', 'resources', 'prp-templates');

function migrateTemplates() {
  console.log('Starting PRP template migration...');
  
  // First, check if templates table has the new columns
  const tableInfo = db.prepare("PRAGMA table_info(templates)").all();
  const hasIsPrpTemplate = tableInfo.some(col => col.name === 'is_prp_template');
  
  if (!hasIsPrpTemplate) {
    console.log('New template columns not found. Please run the application once to apply migrations.');
    return;
  }
  
  // Clear existing PRP templates to avoid duplicates
  db.prepare('DELETE FROM templates WHERE is_prp_template = 1').run();
  
  // Process default templates
  const defaultPath = path.join(templatesPath, 'default');
  if (fs.existsSync(defaultPath)) {
    const templates = fs.readdirSync(defaultPath);
    
    for (const templateDir of templates) {
      const templatePath = path.join(defaultPath, templateDir);
      const metadataPath = path.join(templatePath, 'metadata.json');
      const contentPath = path.join(templatePath, 'template.md');
      
      if (fs.existsSync(metadataPath) && fs.existsSync(contentPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          const content = fs.readFileSync(contentPath, 'utf-8');
          
          const wordCount = content.trim().split(/\s+/).length;
          const tagsJson = JSON.stringify(metadata.tags || []);
          const prerequisitesJson = JSON.stringify(metadata.prerequisites || {});
          
          // Insert template into database
          const stmt = db.prepare(`
            INSERT INTO templates (
              title, content, category, tags, word_count,
              description, template_version, author, complexity, use_case, prerequisites, is_prp_template
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `);
          
          stmt.run(
            metadata.name,
            content,
            metadata.category || 'general',
            tagsJson,
            wordCount,
            metadata.description,
            metadata.version,
            metadata.author,
            metadata.complexity || 'medium',
            metadata.useCase,
            prerequisitesJson
          );
          
          console.log(`✓ Migrated template: ${metadata.name}`);
        } catch (error) {
          console.error(`✗ Failed to migrate ${templateDir}:`, error.message);
        }
      }
    }
  }
  
  // Process example templates
  const examplesPath = path.join(templatesPath, 'examples');
  if (fs.existsSync(examplesPath)) {
    const examples = fs.readdirSync(examplesPath);
    
    for (const exampleDir of examples) {
      const examplePath = path.join(examplesPath, exampleDir);
      const metadataPath = path.join(examplePath, 'metadata.json');
      const contentPath = path.join(examplePath, 'template.md');
      
      if (fs.existsSync(metadataPath) && fs.existsSync(contentPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          const content = fs.readFileSync(contentPath, 'utf-8');
          
          const wordCount = content.trim().split(/\s+/).length;
          const tagsJson = JSON.stringify(metadata.tags || []);
          const prerequisitesJson = JSON.stringify(metadata.prerequisites || {});
          
          // Insert template into database
          const stmt = db.prepare(`
            INSERT INTO templates (
              title, content, category, tags, word_count,
              description, template_version, author, complexity, use_case, prerequisites, is_prp_template
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `);
          
          stmt.run(
            metadata.name,
            content,
            metadata.category || 'examples',
            tagsJson,
            wordCount,
            metadata.description,
            metadata.version,
            metadata.author,
            metadata.complexity || 'medium',
            metadata.useCase,
            prerequisitesJson
          );
          
          console.log(`✓ Migrated example: ${metadata.name}`);
        } catch (error) {
          console.error(`✗ Failed to migrate ${exampleDir}:`, error.message);
        }
      }
    }
  }
  
  console.log('\nMigration complete!');
  
  // Show summary
  const prpTemplates = db.prepare('SELECT * FROM templates WHERE is_prp_template = 1').all();
  console.log(`\nTotal PRP templates in database: ${prpTemplates.length}`);
  
  // Group by category
  const byCategory = prpTemplates.reduce((acc, template) => {
    const tags = JSON.parse(template.tags || '[]');
    acc[template.category] = (acc[template.category] || 0) + 1;
    return acc;
  }, {});
  
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