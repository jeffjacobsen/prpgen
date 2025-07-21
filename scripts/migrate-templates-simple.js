// Simple migration script to move PRP templates to database
// Run this in the Electron DevTools console

(async function() {
  console.log('Starting PRP template migration to database...\n');
  
  // Hardcoded templates based on the file structure
  const templates = [
    {
      title: 'Base PRP Template',
      content: `# Product Requirement Prompt

## Overview
[Provide a high-level overview of the feature/project]

## Requirements
### Functional Requirements
- [List functional requirements]
- [Be specific and measurable]

### Non-Functional Requirements
- Performance requirements
- Security requirements
- Scalability requirements

## Technical Approach
### Architecture
[Describe the architectural approach]

### Implementation Details
[Provide implementation specifics]

### Dependencies
[List any dependencies or integrations]

## Success Criteria
[Define what success looks like for this feature]

## Testing Strategy
[Outline the testing approach]

## Documentation Requirements
[Specify documentation needs]`,
      category: 'general',
      tags: ['general', 'base'],
      description: 'A general-purpose template for any feature development',
      template_version: '1.0.0',
      author: 'PRPGen Team',
      complexity: 'medium',
      use_case: 'General feature development requiring comprehensive planning',
      prerequisites: {},
      is_prp_template: true
    },
    {
      title: 'React Component PRP',
      content: `# React Component Development PRP

## Component Overview
{{FEATURE_REQUEST}}

## Component Requirements
### Props Interface
- Define all props with TypeScript interfaces
- Document prop purposes and types

### State Management
- Local state requirements
- Global state integration needs

### UI/UX Requirements
- Visual design specifications
- Responsive behavior
- Accessibility requirements (WCAG 2.1 AA)

## Technical Implementation
### Component Structure
- Component hierarchy
- Shared components usage
- Custom hooks requirements

### Performance Considerations
- Memoization needs
- Lazy loading requirements
- Bundle size impact

### Testing Requirements
- Unit tests with React Testing Library
- Integration tests
- Visual regression tests

## Success Criteria
- Component renders correctly across breakpoints
- All interactive elements are keyboard accessible
- Performance metrics meet requirements
- Test coverage > 80%`,
      category: 'frontend',
      tags: ['react', 'frontend', 'component'],
      description: 'Template for React component development with TypeScript',
      template_version: '1.0.0',
      author: 'PRPGen Team',
      complexity: 'medium',
      use_case: 'Creating new React components with proper structure and testing',
      prerequisites: { react: '18.0.0', typescript: '5.0.0' },
      is_prp_template: true
    },
    {
      title: 'Backend Service PRP',
      content: `# Backend Service Development PRP

## Service Overview
{{FEATURE_REQUEST}}

## API Specification
### Endpoints
- Define all endpoints with methods and paths
- Request/response schemas
- Authentication requirements

### Data Models
- Database schemas
- Validation rules
- Relationships between entities

## Technical Requirements
### Performance
- Response time targets
- Throughput requirements
- Caching strategy

### Security
- Authentication method
- Authorization rules
- Data encryption needs

### Scalability
- Expected load patterns
- Horizontal scaling approach
- Database optimization

## Implementation Plan
### Service Architecture
- Microservice boundaries
- Inter-service communication
- Error handling strategy

### Database Design
- Schema design
- Indexing strategy
- Migration approach

## Testing Strategy
- Unit tests for business logic
- Integration tests for APIs
- Load testing requirements

## Monitoring & Observability
- Logging requirements
- Metrics to track
- Alerting rules`,
      category: 'backend',
      tags: ['backend', 'api', 'service'],
      description: 'Template for backend service and API development',
      template_version: '1.0.0',
      author: 'PRPGen Team',
      complexity: 'high',
      use_case: 'Developing backend services with proper architecture and monitoring',
      prerequisites: {},
      is_prp_template: true
    },
    {
      title: 'Bug Fix PRP',
      content: `# Bug Fix PRP

## Bug Description
{{FEATURE_REQUEST}}

## Current Behavior
- What is happening now
- Steps to reproduce
- Error messages or logs

## Expected Behavior
- What should happen instead
- Success criteria for the fix

## Root Cause Analysis
- Investigation findings
- Why the bug occurs
- Related code areas

## Fix Approach
### Code Changes
- Files to modify
- Specific changes needed
- Potential side effects

### Testing Plan
- Test cases to verify fix
- Regression testing needed
- Edge cases to consider

## Rollout Strategy
- Deployment approach
- Rollback plan
- Monitoring after deployment`,
      category: 'maintenance',
      tags: ['bug', 'fix', 'maintenance'],
      description: 'Template for bug fixes and issue resolution',
      template_version: '1.0.0',
      author: 'PRPGen Team',
      complexity: 'low',
      use_case: 'Systematic approach to fixing bugs and preventing regressions',
      prerequisites: {},
      is_prp_template: true
    }
  ];
  
  console.log(`Migrating ${templates.length} PRP templates to database...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const template of templates) {
    try {
      const result = await window.electronAPI.invoke('templates:create-prp-template', template);
      if (result.success) {
        console.log(`✓ Created: ${template.title}`);
        successCount++;
      } else {
        console.error(`✗ Failed to create ${template.title}:`, result.error);
        errorCount++;
      }
    } catch (error) {
      console.error(`✗ Error creating ${template.title}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\nMigration complete!`);
  console.log(`Success: ${successCount} templates`);
  console.log(`Errors: ${errorCount} templates`);
  
  // Verify the templates were created
  console.log('\nVerifying templates in database...');
  const prpTemplates = await window.electronAPI.invoke('prp:get-templates');
  if (prpTemplates.success) {
    console.log(`Total PRP templates in database: ${prpTemplates.data.length}`);
    console.log('\nTemplates:');
    prpTemplates.data.forEach(t => {
      console.log(`  - ${t.name} (${t.category}) - ${t.complexity}`);
    });
  }
})();