use crate::services::ClaudeService;
use std::sync::Arc;
use tokio::sync::Mutex;

// Global reference to the active Claude service
static ACTIVE_CLAUDE_SERVICE: once_cell::sync::Lazy<Arc<Mutex<Option<Arc<ClaudeService>>>>> = 
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(None)));

pub async fn set_active_claude_service(service: Arc<ClaudeService>) {
    let mut guard = ACTIVE_CLAUDE_SERVICE.lock().await;
    *guard = Some(service);
}

pub async fn clear_active_claude_service() {
    let mut guard = ACTIVE_CLAUDE_SERVICE.lock().await;
    *guard = None;
}

#[tauri::command]
pub async fn cancel_generation() -> Result<(), String> {
    println!("Cancel generation requested");
    
    let guard = ACTIVE_CLAUDE_SERVICE.lock().await;
    if let Some(service) = guard.as_ref() {
        service.stop_generation().await;
        println!("Generation cancelled");
        Ok(())
    } else {
        println!("No active generation to cancel");
        Ok(())
    }
}