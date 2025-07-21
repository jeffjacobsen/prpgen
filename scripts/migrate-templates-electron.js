// This script is designed to be run from within the Electron console
// Copy and paste this into the DevTools console of the running app

(async function() {
  const fs = require('fs');
  const path = require('path');
  
  // Get the templates from the file system
  const templatesPath = path.join(__dirname, 'resources', 'prp-templates');
  
  const templates = [];
  
  // Process default templates
  const defaultPath = path.join(templatesPath, 'default');
  if (fs.existsSync(defaultPath)) {
    const templateDirs = fs.readdirSync(defaultPath);
    
    for (const templateDir of templateDirs) {
      const templatePath = path.join(defaultPath, templateDir);
      const metadataPath = path.join(templatePath, 'metadata.json');
      const contentPath = path.join(templatePath, 'template.md');
      
      if (fs.existsSync(metadataPath) && fs.existsSync(contentPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          const content = fs.readFileSync(contentPath, 'utf-8');
          
          templates.push({
            title: metadata.name,
            content: content,
            category: metadata.category || 'general',
            tags: metadata.tags || [],
            description: metadata.description,
            template_version: metadata.version,
            author: metadata.author,
            complexity: metadata.complexity || 'medium',
            use_case: metadata.useCase,
            prerequisites: metadata.prerequisites || {},
            is_prp_template: true
          });
          
          console.log(`Found template: ${metadata.name}`);
        } catch (error) {
          console.error(`Failed to read ${templateDir}:`, error);
        }
      }
    }
  }
  
  // Process example templates
  const examplesPath = path.join(templatesPath, 'examples');
  if (fs.existsSync(examplesPath)) {
    const exampleDirs = fs.readdirSync(examplesPath);
    
    for (const exampleDir of exampleDirs) {
      const examplePath = path.join(examplesPath, exampleDir);
      const metadataPath = path.join(examplePath, 'metadata.json');
      const contentPath = path.join(examplePath, 'template.md');
      
      if (fs.existsSync(metadataPath) && fs.existsSync(contentPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          const content = fs.readFileSync(contentPath, 'utf-8');
          
          templates.push({
            title: metadata.name,
            content: content,
            category: metadata.category || 'examples',
            tags: metadata.tags || [],
            description: metadata.description,
            template_version: metadata.version,
            author: metadata.author,
            complexity: metadata.complexity || 'medium',
            use_case: metadata.useCase,
            prerequisites: metadata.prerequisites || {},
            is_prp_template: true
          });
          
          console.log(`Found example: ${metadata.name}`);
        } catch (error) {
          console.error(`Failed to read ${exampleDir}:`, error);
        }
      }
    }
  }
  
  // Now insert them using the API
  console.log(`\nInserting ${templates.length} templates into database...`);
  
  for (const template of templates) {
    try {
      const result = await window.electronAPI.invoke('templates:create-prp-template', template);
      if (result.success) {
        console.log(`✓ Created: ${template.title}`);
      } else {
        console.error(`✗ Failed to create ${template.title}:`, result.error);
      }
    } catch (error) {
      console.error(`✗ Error creating ${template.title}:`, error);
    }
  }
  
  console.log('\nMigration complete!');
  
  // Verify the templates were created
  const prpTemplates = await window.electronAPI.invoke('templates:get-prp-templates');
  if (prpTemplates.success) {
    console.log(`\nTotal PRP templates in database: ${prpTemplates.data.length}`);
  }
})();