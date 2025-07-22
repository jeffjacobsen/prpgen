use crate::models::{Template, CreateTemplate, UpdateTemplate};
use crate::commands::DbState;
use tauri::State;
use serde_json::json;

#[tauri::command]
pub async fn get_all_templates(db: State<'_, DbState>) -> Result<Vec<Template>, String> {
    let db = db.lock().await;
    db.get_all_templates()
        .await
        .map_err(|e| format!("Failed to fetch templates: {}", e))
}

#[tauri::command]
pub async fn get_prp_templates(db: State<'_, DbState>) -> Result<Vec<Template>, String> {
    let db = db.lock().await;
    db.get_prp_templates()
        .await
        .map_err(|e| format!("Failed to fetch PRP templates: {}", e))
}

#[tauri::command]
pub async fn get_template(db: State<'_, DbState>, id: i64) -> Result<Option<Template>, String> {
    let db = db.lock().await;
    db.get_template(id)
        .await
        .map_err(|e| format!("Failed to fetch template: {}", e))
}

#[tauri::command]
pub async fn create_template(db: State<'_, DbState>, template: CreateTemplate) -> Result<Template, String> {
    let db = db.lock().await;
    db.create_template(template)
        .await
        .map_err(|e| format!("Failed to create template: {}", e))
}

#[tauri::command]
pub async fn update_template(db: State<'_, DbState>, id: i64, template: UpdateTemplate) -> Result<Template, String> {
    let db = db.lock().await;
    db.update_template(id, template)
        .await
        .map_err(|e| format!("Failed to update template: {}", e))
}

#[tauri::command]
pub async fn delete_template(db: State<'_, DbState>, id: i64) -> Result<(), String> {
    let db = db.lock().await;
    db.delete_template(id)
        .await
        .map_err(|e| format!("Failed to delete template: {}", e))
}

#[tauri::command]
pub async fn search_templates(db: State<'_, DbState>, query: String) -> Result<Vec<Template>, String> {
    let db = db.lock().await;
    db.search_templates(&query)
        .await
        .map_err(|e| format!("Failed to search templates: {}", e))
}

#[tauri::command]
pub async fn create_prp_template(db: State<'_, DbState>, template: CreateTemplate) -> Result<Template, String> {
    let db = db.lock().await;
    
    // Ensure it's marked as a PRP template
    let mut prp_template = template;
    prp_template.is_prp_template = Some(true);
    
    db.create_template(prp_template)
        .await
        .map_err(|e| format!("Failed to create PRP template: {}", e))
}

#[tauri::command]
pub async fn seed_default_templates(db: State<'_, DbState>) -> Result<String, String> {
    let db_lock = db.lock().await;
    
    // Check if templates already exist
    let existing_templates = db_lock.get_prp_templates().await
        .map_err(|e| format!("Failed to check existing templates: {}", e))?;
    
    if !existing_templates.is_empty() {
        return Ok(format!("Templates already seeded. Found {} PRP templates.", existing_templates.len()));
    }
    
    // Default templates data
    let templates = vec![
        CreateTemplate {
            title: "Base PRP Template".to_string(),
            content: r#"# Product Requirement Prompt: {{FEATURE_NAME}}

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
Any other relevant information"#.to_string(),
            category: Some("general".to_string()),
            tags: Some(vec!["base".to_string(), "starter".to_string()]),
            url: None,
            file_path: None,
            description: Some("A basic template for general feature development".to_string()),
            template_version: Some("1.0.0".to_string()),
            author: Some("PRPGen Team".to_string()),
            complexity: Some("low".to_string()),
            use_case: Some("General feature development".to_string()),
            prerequisites: Some(json!({ "codebase_knowledge": "basic" })),
            is_prp_template: Some(true),
        },
        CreateTemplate {
            title: "React Component PRP".to_string(),
            content: r#"# Product Requirement Prompt: {{COMPONENT_NAME}} Component

## Overview
Create a new React component with the following specifications.

## Component Requirements

### Props Interface
```typescript
interface {{COMPONENT_NAME}}Props {
  // Define props here
}
```

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
```
src/components/{{COMPONENT_NAME}}/
├── index.tsx
├── {{COMPONENT_NAME}}.tsx
├── {{COMPONENT_NAME}}.css
└── {{COMPONENT_NAME}}.test.tsx
```

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
- [ ] Storybook story created"#.to_string(),
            category: Some("frontend".to_string()),
            tags: Some(vec!["react".to_string(), "component".to_string(), "ui".to_string()]),
            url: None,
            file_path: None,
            description: Some("Template for creating new React components".to_string()),
            template_version: Some("1.0.0".to_string()),
            author: Some("PRPGen Team".to_string()),
            complexity: Some("medium".to_string()),
            use_case: Some("React component development".to_string()),
            prerequisites: Some(json!({ "react": true, "typescript": true })),
            is_prp_template: Some(true),
        },
        CreateTemplate {
            title: "Backend Service PRP".to_string(),
            content: r#"# Product Requirement Prompt: {{SERVICE_NAME}} Service

## Overview
Implement a new backend service with the specified functionality.

## Service Specifications

### API Endpoints
```
GET    /api/{{resource}}     - List all resources
GET    /api/{{resource}}/:id - Get single resource
POST   /api/{{resource}}     - Create new resource
PUT    /api/{{resource}}/:id - Update resource
DELETE /api/{{resource}}/:id - Delete resource
```

### Data Model
```typescript
interface {{MODEL_NAME}} {
  id: string;
  // Add fields here
  createdAt: Date;
  updatedAt: Date;
}
```

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
```
src/services/{{SERVICE_NAME}}/
├── controller.ts
├── service.ts
├── repository.ts
├── validation.ts
└── tests/
```

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
- [ ] API documentation updated"#.to_string(),
            category: Some("backend".to_string()),
            tags: Some(vec!["api".to_string(), "service".to_string(), "backend".to_string()]),
            url: None,
            file_path: None,
            description: Some("Template for backend service development".to_string()),
            template_version: Some("1.0.0".to_string()),
            author: Some("PRPGen Team".to_string()),
            complexity: Some("high".to_string()),
            use_case: Some("Backend API service creation".to_string()),
            prerequisites: Some(json!({ "api_design": true, "database": true })),
            is_prp_template: Some(true),
        },
        CreateTemplate {
            title: "Bug Fix PRP".to_string(),
            content: r#"# Product Requirement Prompt: Fix {{BUG_DESCRIPTION}}

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
- [ ] Fix verified in development environment"#.to_string(),
            category: Some("maintenance".to_string()),
            tags: Some(vec!["bug-fix".to_string(), "maintenance".to_string()]),
            url: None,
            file_path: None,
            description: Some("Template for bug fix documentation and implementation".to_string()),
            template_version: Some("1.0.0".to_string()),
            author: Some("PRPGen Team".to_string()),
            complexity: Some("low".to_string()),
            use_case: Some("Bug fixing and maintenance".to_string()),
            prerequisites: Some(json!({ "debugging": true })),
            is_prp_template: Some(true),
        },
    ];
    
    let mut created_count = 0;
    for template_data in templates {
        match db_lock.create_template(template_data).await {
            Ok(_) => created_count += 1,
            Err(e) => eprintln!("Failed to create template: {}", e),
        }
    }
    
    Ok(format!("Successfully seeded {} default templates.", created_count))
}