use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub claude_executable_path: Option<String>,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            claude_executable_path: None,
        }
    }
}

fn get_config_path() -> PathBuf {
    let app_data_dir = crate::get_app_data_dir();
    app_data_dir.join("config.json")
}

fn load_config() -> Config {
    let config_path = get_config_path();
    if config_path.exists() {
        match fs::read_to_string(&config_path) {
            Ok(content) => {
                match serde_json::from_str(&content) {
                    Ok(config) => config,
                    Err(e) => {
                        eprintln!("Failed to parse config: {}", e);
                        Config::default()
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to read config: {}", e);
                Config::default()
            }
        }
    } else {
        Config::default()
    }
}

fn save_config(config: &Config) -> Result<(), String> {
    let config_path = get_config_path();
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}

#[derive(Debug, Serialize)]
pub struct ClaudeTestResult {
    pub available: bool,
    pub version: Option<String>,
    pub path: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn get_config() -> Result<Config, String> {
    Ok(load_config())
}

#[tauri::command]
pub async fn update_config(config: Config) -> Result<Config, String> {
    save_config(&config)?;
    Ok(config)
}

#[tauri::command]
pub async fn test_claude(claude_path: Option<String>) -> Result<ClaudeTestResult, String> {
    use crate::services::ClaudeService;
    
    // If no path is provided, check the config first
    let path = if let Some(p) = claude_path {
        Some(p)
    } else {
        let config = load_config();
        config.claude_executable_path
    };
    
    // Create ClaudeService with the path (None defaults to automatic detection)
    let claude_service = ClaudeService::new(path.clone());
    
    // Get the actual path that will be used
    let actual_path = claude_service.get_path();
    
    // Test using the service
    match claude_service.test_claude().await {
        Ok(version) => {
            Ok(ClaudeTestResult {
                available: true,
                version: Some(version.trim().to_string()),
                path: Some(actual_path),
                error: None,
            })
        }
        Err(e) => {
            Ok(ClaudeTestResult {
                available: false,
                version: None,
                path: Some(actual_path),
                error: Some(e),
            })
        }
    }
}