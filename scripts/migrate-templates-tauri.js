/**
 * Script to populate default PRP templates in the Tauri database
 * Run this after the Tauri app has created the database
 */

const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Default templates data
const defaultTemplates = [
  {
    title: 'Base PRP Template',
    content: `# Product Requirement Prompt: {{FEATURE_NAME}}

## Overview
Provide a clear, concise overview of what needs to be built.

## Context
- Current state of the system
- Problems this feature solves
- Business value

## Requirements

### Functional Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

### Technical Requirements
- Performance expectations
- Security considerations
- Compatibility requirements

## Implementation Guidelines
- Preferred patterns and approaches
- Key files to modify
- Testing requirements

## Success Criteria
- [ ] All functional requirements met
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed

## Additional Notes
Any other relevant information`,
    category: 'general',
    tags: ['base', 'starter'],
    description: 'A basic template for general feature development',
    template_version: '1.0.0',
    author: 'PRPGen Team',
    complexity: 'low',
    use_case: 'General feature development',
    prerequisites: { codebase_knowledge: 'basic' },
    is_prp_template: true
  },
  {
    title: 'React Component PRP',
    content: `# Product Requirement Prompt: {{COMPONENT_NAME}} Component

## Overview
Create a new React component with the following specifications.

## Component Requirements

### Props Interface
\`\`\`typescript
interface {{COMPONENT_NAME}}Props {
  // Define props here
}
\`\`\`

### Visual Design
- Layout description
- Styling requirements
- Responsive behavior

### Behavior
- User interactions
- State management
- Side effects

### Integration
- Where component will be used
- Data flow
- Event handling

## Implementation Guidelines

### File Structure
\`\`\`
src/components/{{COMPONENT_NAME}}/
├── index.tsx
├── {{COMPONENT_NAME}}.tsx
├── {{COMPONENT_NAME}}.css
└── {{COMPONENT_NAME}}.test.tsx
\`\`\`

### Code Standards
- Use functional components with hooks
- Implement proper TypeScript types
- Follow existing component patterns

## Testing Requirements
- Unit tests for all props
- Integration tests for user interactions
- Accessibility tests

## Success Criteria
- [ ] Component renders correctly
- [ ] All props work as specified
- [ ] Tests achieve 90%+ coverage
- [ ] No accessibility violations
- [ ] Storybook story created`,
    category: 'frontend',
    tags: ['react', 'component', 'ui'],
    description: 'Template for creating new React components',
    template_version: '1.0.0',
    author: 'PRPGen Team',
    complexity: 'medium',
    use_case: 'React component development',
    prerequisites: { react: true, typescript: true },
    is_prp_template: true
  },
  {
    title: 'Backend Service PRP',
    content: `# Product Requirement Prompt: {{SERVICE_NAME}} Service

## Overview
Implement a new backend service with the specified functionality.

## Service Specifications

### API Endpoints
\`\`\`
GET    /api/{{resource}}     - List all resources
GET    /api/{{resource}}/:id - Get single resource
POST   /api/{{resource}}     - Create new resource
PUT    /api/{{resource}}/:id - Update resource
DELETE /api/{{resource}}/:id - Delete resource
\`\`\`

### Data Model
\`\`\`typescript
interface {{MODEL_NAME}} {
  id: string;
  // Add fields here
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

### Business Logic
- Validation rules
- Authorization requirements
- Data transformations

## Implementation Requirements

### Technology Stack
- Framework/runtime
- Database requirements
- External dependencies

### Code Organization
\`\`\`
src/services/{{SERVICE_NAME}}/
├── controller.ts
├── service.ts
├── repository.ts
├── validation.ts
└── tests/
\`\`\`

### Error Handling
- Expected error cases
- Error response format
- Logging requirements

## Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Load testing for performance

## Success Criteria
- [ ] All endpoints functional
- [ ] Input validation complete
- [ ] Error handling implemented
- [ ] Tests passing with 80%+ coverage
- [ ] API documentation updated`,
    category: 'backend',
    tags: ['api', 'service', 'backend'],
    description: 'Template for backend service development',
    template_version: '1.0.0',
    author: 'PRPGen Team',
    complexity: 'high',
    use_case: 'Backend API service creation',
    prerequisites: { api_design: true, database: true },
    is_prp_template: true
  },
  {
    title: 'Bug Fix PRP',
    content: `# Product Requirement Prompt: Fix {{BUG_DESCRIPTION}}

## Bug Report
- **Issue ID**: {{ISSUE_ID}}
- **Severity**: {{SEVERITY}}
- **Reported Date**: {{DATE}}

## Problem Description
Describe the bug in detail, including:
- Current behavior
- Expected behavior
- Steps to reproduce

## Root Cause Analysis
- Investigate and identify the root cause
- List affected components/files
- Explain why the bug occurs

## Proposed Solution
- Technical approach to fix
- Files that need modification
- Potential side effects

## Testing Plan
- How to verify the fix
- Regression test cases
- Edge cases to consider

## Implementation Notes
- Code changes required
- Configuration updates
- Database migrations (if any)

## Success Criteria
- [ ] Bug no longer reproducible
- [ ] No regression in existing features
- [ ] Tests added to prevent recurrence
- [ ] Fix verified in development environment`,
    category: 'maintenance',
    tags: ['bug-fix', 'maintenance'],
    description: 'Template for bug fix documentation and implementation',
    template_version: '1.0.0',
    author: 'PRPGen Team',
    complexity: 'low',
    use_case: 'Bug fixing and maintenance',
    prerequisites: { debugging: true },
    is_prp_template: true
  }
];

// Get the Tauri app data directory
function getTauriDataDir() {
  const platform = process.platform;
  const homeDir = os.homedir();
  
  if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'com.prpgen.app');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'com.prpgen.app');
  } else {
    return path.join(homeDir, '.config', 'com.prpgen.app');
  }
}

async function migrateTemplates() {
  const dbPath = path.join(getTauriDataDir(), 'prpgen.db');
  
  console.log('Database path:', dbPath);
  
  // Check if database exists
  const fs = require('fs');
  if (!fs.existsSync(dbPath)) {
    console.error('Database not found. Please run the Tauri app first to create the database.');
    process.exit(1);
  }
  
  const db = new Database(dbPath);
  
  try {
    // Clear existing PRP templates
    db.prepare('DELETE FROM templates WHERE is_prp_template = 1').run();
    console.log('Cleared existing PRP templates');
    
    // Insert new templates
    const stmt = db.prepare(`
      INSERT INTO templates (
        title, content, category, tags, word_count,
        description, template_version, author, complexity,
        use_case, prerequisites, is_prp_template
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const template of defaultTemplates) {
      const wordCount = template.content.split(/\s+/).length;
      const tagsJson = JSON.stringify(template.tags);
      const prerequisitesJson = JSON.stringify(template.prerequisites);
      
      stmt.run(
        template.title,
        template.content,
        template.category,
        tagsJson,
        wordCount,
        template.description,
        template.template_version,
        template.author,
        template.complexity,
        template.use_case,
        prerequisitesJson,
        template.is_prp_template ? 1 : 0
      );
      
      console.log(`✓ Migrated template: ${template.title}`);
    }
    
    // Show summary
    const count = db.prepare('SELECT COUNT(*) as count FROM templates WHERE is_prp_template = 1').get();
    console.log(`\nMigration complete! Total PRP templates: ${count.count}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run migration
migrateTemplates();