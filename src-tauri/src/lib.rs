mod commands;
mod models;
mod services;
mod telemetry;

use std::sync::Arc;
use tokio::sync::Mutex;
use services::Database;
use commands::DbState;
use tauri::Manager;
use std::path::PathBuf;
use once_cell::sync::OnceCell;

static APP_DATA_DIR: OnceCell<PathBuf> = OnceCell::new();

pub fn get_app_data_dir() -> PathBuf {
    APP_DATA_DIR.get().expect("App data dir not initialized").clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize database
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data directory");
            
            // Store app data dir for global access
            APP_DATA_DIR.set(app_data_dir.clone())
                .expect("Failed to set app data dir");
            
            // Ensure the directory exists
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");
                
            let db_path = app_data_dir.join("prpgen.db");
            
            println!("App data directory: {:?}", app_data_dir);
            println!("Database path: {:?}", db_path);
            println!("Directory exists: {}", app_data_dir.exists());
            println!("Is directory: {}", app_data_dir.is_dir());
            
            // Create database connection
            let db = tauri::async_runtime::block_on(async {
                match Database::new(&db_path).await {
                    Ok(db) => db,
                    Err(e) => {
                        eprintln!("Database error: {:?}", e);
                        panic!("Failed to initialize database: {:?}", e);
                    }
                }
            });
            
            // Wrap in Arc<Mutex> for thread-safe access
            let db_state: DbState = Arc::new(Mutex::new(db));
            
            // Store in app state
            app.manage(db_state);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // PRP commands
            commands::get_all_prps,
            commands::get_prp,
            commands::create_prp,
            commands::update_prp,
            commands::delete_prp,
            commands::get_prp_versions,
            // Template commands
            commands::get_all_templates,
            commands::get_prp_templates,
            commands::get_template,
            commands::create_template,
            commands::update_template,
            commands::delete_template,
            commands::search_templates,
            commands::create_prp_template,
            commands::seed_default_templates,
            // Generation commands
            commands::generate_prp_with_claude,
            commands::cancel_generation,
            // Config commands
            commands::get_config,
            commands::update_config,
            commands::test_claude,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}