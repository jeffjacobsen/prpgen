use crate::services::ClaudeService;
use crate::telemetry::GenerationProgress;
use crate::models::CreatePRP;
use crate::commands::DbState;
use crate::commands::cancel::{set_active_claude_service, clear_active_claude_service};
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{State, Window, Emitter};

#[tauri::command]
pub async fn generate_prp_with_claude(
    window: Window,
    db: State<'_, DbState>,
    template_id: i64,
    feature_request: String,
    additional_context: Option<String>,
    codebase_path: Option<String>,
) -> Result<i64, String> {
    // Get template from database
    let db_lock = db.lock().await;
    let template = db_lock.get_template(template_id).await
        .map_err(|e| format!("Failed to fetch template: {}", e))?
        .ok_or_else(|| "Template not found".to_string())?;
    
    // Get template content
    let mut template_content = template.content;
    
    // Add additional context if provided
    if let Some(context) = additional_context {
        template_content = format!("{}\n\n## Additional Context\n{}", template_content, context);
    }
    
    // Generate a title based on the feature request
    let prp_title = format!("PRP: {}", 
        feature_request.lines().next().unwrap_or("Generated PRP")
            .chars().take(100).collect::<String>()
    );
    
    // Drop the database lock before the long-running operation
    drop(db_lock);
    
    // Get config to check for custom Claude path
    let config = crate::commands::config::get_config().await?;
    
    // Create Claude service with config path if available
    let claude_service = Arc::new(ClaudeService::new(config.claude_executable_path));
    
    // Set as active service for cancellation
    set_active_claude_service(claude_service.clone()).await;
    
    // Create progress callback that emits events to frontend
    let progress_callback = Arc::new(Mutex::new(move |progress: GenerationProgress| {
        println!("Command: Emitting progress to frontend - stage: {}, percentage: {}%", 
            progress.stage, progress.percentage);
        match window.emit("prp-generation:progress", &progress) {
            Ok(_) => println!("Command: Progress event emitted successfully"),
            Err(e) => println!("Command: Failed to emit progress event: {:?}", e),
        }
    }));
    
    // Generate PRP content using Claude
    let result = claude_service
        .generate_prp(template_content, feature_request, codebase_path, progress_callback)
        .await;
    
    // Clear active service
    clear_active_claude_service().await;
    
    // Check result
    let generated_content = result?;
    
    // Validate the generated content
    if generated_content.trim().is_empty() {
        return Err("Generated content is empty".to_string());
    }
    
    // Check for common error patterns
    if generated_content.contains("Execution error") || 
       generated_content.contains("Failed to execute") ||
       generated_content.len() < 50 {
        return Err(format!("Invalid generated content: {}", 
            generated_content.chars().take(100).collect::<String>()));
    }
    
    // Save to database
    let db_lock = db.lock().await;
    let create_prp = CreatePRP {
        title: prp_title,
        content: generated_content,
    };
    
    let prp = db_lock.create_prp(create_prp).await
        .map_err(|e| format!("Failed to save PRP: {}", e))?;
    
    Ok(prp.id)
}

