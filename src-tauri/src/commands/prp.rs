use crate::models::{PRP, CreatePRP, UpdatePRP, PRPVersion};
use crate::commands::DbState;
use tauri::State;

#[tauri::command]
pub async fn get_all_prps(db: State<'_, DbState>) -> Result<Vec<PRP>, String> {
    let db = db.lock().await;
    db.get_all_prps()
        .await
        .map_err(|e| format!("Failed to fetch PRPs: {}", e))
}

#[tauri::command]
pub async fn get_prp(db: State<'_, DbState>, id: i64) -> Result<Option<PRP>, String> {
    let db = db.lock().await;
    db.get_prp(id)
        .await
        .map_err(|e| format!("Failed to fetch PRP: {}", e))
}

#[tauri::command]
pub async fn create_prp(db: State<'_, DbState>, prp: CreatePRP) -> Result<PRP, String> {
    let db = db.lock().await;
    db.create_prp(prp)
        .await
        .map_err(|e| format!("Failed to create PRP: {}", e))
}

#[tauri::command]
pub async fn update_prp(db: State<'_, DbState>, id: i64, prp: UpdatePRP) -> Result<PRP, String> {
    let db = db.lock().await;
    db.update_prp(id, prp)
        .await
        .map_err(|e| format!("Failed to update PRP: {}", e))
}

#[tauri::command]
pub async fn delete_prp(db: State<'_, DbState>, id: i64) -> Result<(), String> {
    let db = db.lock().await;
    db.delete_prp(id)
        .await
        .map_err(|e| format!("Failed to delete PRP: {}", e))
}

#[tauri::command]
pub async fn get_prp_versions(db: State<'_, DbState>, prp_id: i64) -> Result<Vec<PRPVersion>, String> {
    let db = db.lock().await;
    db.get_prp_versions(prp_id)
        .await
        .map_err(|e| format!("Failed to fetch PRP versions: {}", e))
}