// Test script to verify PRP generation with database templates
// Run this in the Electron DevTools console

(async function() {
  console.log('Testing PRP Generation with Database Templates');
  
  // Step 1: Create a test PRP template
  console.log('\n1. Creating test PRP template...');
  
  const testTemplate = {
    title: 'Test PRP Template',
    content: `# Product Requirement Prompt for {{FEATURE_REQUEST}}

## Overview
This PRP defines the requirements for: {{FEATURE_REQUEST}}

## Codebase Context
Working with codebase at: {{CODEBASE_PATH}}

## Requirements
1. Implement the core functionality
2. Add comprehensive tests
3. Update documentation

## Technical Approach
Describe the technical implementation here.

## Success Criteria
- Feature works as specified
- All tests pass
- Documentation is complete`,
    category: 'test',
    tags: ['test', 'example'],
    description: 'A test template for verifying PRP generation',
    template_version: '1.0.0',
    author: 'Test Script',
    complexity: 'low',
    use_case: 'Testing PRP generation functionality',
    prerequisites: {},
    is_prp_template: true
  };
  
  const createResult = await window.electronAPI.invoke('templates:create-prp-template', testTemplate);
  if (createResult.success) {
    console.log('✓ Created test template:', createResult.data);
  } else {
    console.error('✗ Failed to create template:', createResult.error);
    return;
  }
  
  // Step 2: Get all PRP templates to verify
  console.log('\n2. Fetching PRP templates...');
  const templatesResult = await window.electronAPI.invoke('prp:get-templates');
  
  if (templatesResult.success) {
    console.log(`✓ Found ${templatesResult.data.length} PRP templates`);
    const testTemplateFound = templatesResult.data.find(t => t.name === 'Test PRP Template');
    if (testTemplateFound) {
      console.log('✓ Test template found in list:', testTemplateFound);
      
      // Step 3: Generate PRP from template
      console.log('\n3. Generating PRP from template...');
      const generateRequest = {
        templateId: testTemplateFound.id,
        featureRequest: 'A user authentication system with email verification',
        codebasePath: '/path/to/test/project'
      };
      
      console.log('Generate request:', generateRequest);
      
      const generateResult = await window.electronAPI.invoke('prp:generate-from-template', generateRequest);
      
      if (generateResult.success) {
        console.log('✓ PRP generated successfully!');
        console.log('\nGenerated content:');
        console.log('=====================================');
        console.log(generateResult.data.content);
        console.log('=====================================');
        
        // Verify variable substitution
        const content = generateResult.data.content;
        if (content.includes('{{FEATURE_REQUEST}}') || content.includes('{{CODEBASE_PATH}}')) {
          console.warn('⚠️  Variables were not substituted properly');
        } else if (content.includes('A user authentication system') && content.includes('/path/to/test/project')) {
          console.log('✓ Variable substitution worked correctly');
        }
      } else {
        console.error('✗ Failed to generate PRP:', generateResult.error);
      }
      
      // Step 4: Clean up - delete test template
      console.log('\n4. Cleaning up test template...');
      const deleteResult = await window.electronAPI.invoke('templates:delete', createResult.data.id);
      if (deleteResult.success) {
        console.log('✓ Test template deleted');
      } else {
        console.error('✗ Failed to delete test template:', deleteResult.error);
      }
    } else {
      console.error('✗ Test template not found in templates list');
    }
  } else {
    console.error('✗ Failed to get templates:', templatesResult.error);
  }
  
  console.log('\nTest complete!');
})();