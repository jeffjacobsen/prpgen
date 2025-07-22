use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::process::Command;
use tokio::io::AsyncWriteExt;
use crate::telemetry::{GenerationProgress, get_or_start_otlp_receiver, get_otlp_telemetry, reset_otlp_telemetry};

pub struct ClaudeService {
    claude_path: String,
    active_process: Arc<Mutex<Option<tokio::process::Child>>>,
}

impl ClaudeService {
    pub fn new(claude_path: Option<String>) -> Self {
        let path = claude_path.unwrap_or_else(|| {
            // Build the home path once
            let home_claude_path = format!("{}/.claude/local/claude", 
                std::env::var("HOME").unwrap_or_default());
            
            // Try common locations if not specified
            let common_paths = vec![
                "claude".to_string(),  // Default PATH lookup
                "/usr/local/bin/claude".to_string(),
                "/opt/homebrew/bin/claude".to_string(),
                home_claude_path,
            ];
            
            // Find the first working path
            for path in common_paths {
                if std::path::Path::new(&path).exists() {
                    println!("Claude: Found claude at {}", path);
                    return path;
                }
            }
            
            // Default to "claude" for PATH lookup
            "claude".to_string()
        });
        
        println!("Claude: Using path {}", path);
        
        Self {
            claude_path: path,
            active_process: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn generate_prp(
        &self,
        template_content: String,
        feature_request: String,
        codebase_path: Option<String>,
        progress_callback: Arc<Mutex<dyn Fn(GenerationProgress) + Send>>,
    ) -> Result<String, String> {
        // Get or start the global OTLP receiver
        let (otlp_port, otlp_receiver) = match get_or_start_otlp_receiver().await {
            Ok((port, receiver)) => {
                // Reset telemetry data for new generation
                reset_otlp_telemetry().await;
                (port, Some(receiver))
            },
            Err(e) => {
                println!("Failed to start OTLP receiver: {}", e);
                (0, None) // Signal that OTLP is not available
            }
        };
        // Prepare the prompt - try to match what works in Crystal
        let prompt = format!(
            "Generate a comprehensive Product Requirement Prompt (PRP) based on the following template and feature request.\n\n\
             Template:\n{}\n\n\
             Feature Request:\n{}\n\n\
             Please generate a detailed PRP following the template structure. Replace any template variables (like {{{{FEATURE_NAME}}}}) with appropriate values based on the feature request.\n\n\
             Output the result as a complete markdown document.",
            template_content,
            feature_request
        );
        
        println!("Claude: Prompt length: {} characters", prompt.len());
        println!("Claude: Template length: {} characters", template_content.len());
        println!("Claude: Feature request: {}", feature_request);

        // Send initial progress
        {
            let callback = progress_callback.lock().await;
            callback(GenerationProgress {
                stage: "init".to_string(),
                message: "Starting Claude Code...".to_string(),
                percentage: 10,
                telemetry: None,
            });
        }
        
        // Check if Claude is available first
        println!("Claude: Checking if Claude is available at: {}", &self.claude_path);
        
        // If Claude is not available, generate a mock PRP for testing
        if !self.is_claude_available().await {
            println!("Claude: Not available, generating mock PRP");
            
            // Send progress updates
            {
                let callback = progress_callback.lock().await;
                callback(GenerationProgress {
                    stage: "processing".to_string(),
                    message: "Generating mock PRP (Claude not available)...".to_string(),
                    percentage: 50,
                    telemetry: None,
                });
            }
            
            // Generate mock content based on the template
            let mock_prp = format!(
                "# Product Requirement Prompt: {}\n\n\
                ## Overview\n\
                This is a mock PRP generated because Claude is not available.\n\n\
                ## Feature Request\n\
                {}\n\n\
                ## Implementation Notes\n\
                - This is a placeholder PRP\n\
                - Install and configure Claude to generate real PRPs\n\
                - Template used: Mock template\n\n\
                ## Next Steps\n\
                1. Install Claude Code\n\
                2. Configure the path in Settings\n\
                3. Regenerate this PRP\n\n\
                ---\n\
                *Generated at: {}*",
                feature_request.lines().next().unwrap_or("Mock Feature"),
                feature_request,
                chrono::Local::now().format("%Y-%m-%d %H:%M:%S")
            );
            
            // Send completion
            {
                let callback = progress_callback.lock().await;
                callback(GenerationProgress {
                    stage: "complete".to_string(),
                    message: "Mock generation complete".to_string(),
                    percentage: 100,
                    telemetry: None,
                });
            }
            
            return Ok(mock_prp);
        }
        
        // Build the command
        println!("Claude: Using executable path: {}", &self.claude_path);
        let mut cmd = tokio::process::Command::new(&self.claude_path);
        cmd.arg("--print"); // Use --print flag like Crystal does
        cmd.arg("--verbose"); // Add verbose flag to see more output
        
        // Configure telemetry based on OTLP availability
        if otlp_port > 0 {
            // Use OTLP exporter
            cmd.env("CLAUDE_CODE_ENABLE_TELEMETRY", "1");
            cmd.env("OTEL_METRICS_EXPORTER", "otlp");
            cmd.env("OTEL_TRACES_EXPORTER", "otlp");
            cmd.env("OTEL_LOGS_EXPORTER", "otlp");
            cmd.env("OTEL_EXPORTER_OTLP_ENDPOINT", format!("http://localhost:{}", otlp_port));
            cmd.env("OTEL_EXPORTER_OTLP_PROTOCOL", "http/json");
            // Disable compression since our Rust OTLP receiver doesn't handle gzip yet
            cmd.env("OTEL_EXPORTER_OTLP_COMPRESSION", "none");
            // Also set specific endpoints as Crystal does
            cmd.env("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", format!("http://localhost:{}/v1/metrics", otlp_port));
            cmd.env("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT", format!("http://localhost:{}/v1/logs", otlp_port));
            cmd.env("OTEL_SERVICE_NAME", "prp-generator");
            cmd.env("OTEL_RESOURCE_ATTRIBUTES", "service.name=prp-generator");
            cmd.env("OTEL_METRIC_EXPORT_INTERVAL", "2000"); // 2 seconds for frequent updates
            cmd.env("OTEL_BSP_SCHEDULE_DELAY", "1000"); // 1 second for trace batching
            
            println!("Claude: Telemetry enabled with OTLP exporter on port {}", otlp_port);
            //println!("Claude: Environment variables set:");
            //println!("  OTEL_EXPORTER_OTLP_ENDPOINT={}", format!("http://localhost:{}", otlp_port));
            //println!("  OTEL_METRICS_EXPORTER=otlp");
            //println!("  OTEL_LOGS_EXPORTER=otlp");
        } else {
            // Disable telemetry if OTLP is not available
            cmd.env("CLAUDE_CODE_ENABLE_TELEMETRY", "0");
            println!("Claude: Telemetry disabled (OTLP receiver not available)");
        }
        
        if let Some(path) = codebase_path {
            cmd.current_dir(path); // Set working directory
        }
        
        cmd.stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        // Subscribe to OTLP receiver progress events if available
        let otlp_progress_callback = progress_callback.clone();
        let otlp_progress_task = if let Some(mut receiver) = otlp_receiver {
            Some(tokio::spawn(async move {
                println!("OTLP progress task started, waiting for events...");
                while let Ok(progress) = receiver.recv().await {
                    println!("OTLP progress received: stage={}, tokens={:?}", 
                        progress.stage, 
                        progress.telemetry.as_ref().map(|t| t.tokens_total)
                    );
                    let callback = otlp_progress_callback.lock().await;
                    callback(progress);
                }
                println!("OTLP progress task ended");
            }))
        } else {
            None
        };
        
        // Clone for the async block
        let active_process_clone = self.active_process.clone();
        
        // Execute the command
        let mut child = cmd
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn Claude: {}", e))?;
        
        // Write prompt to stdin
        if let Some(mut stdin) = child.stdin.take() {
            stdin.write_all(prompt.as_bytes()).await
                .map_err(|e| format!("Failed to write prompt: {}", e))?;
            stdin.shutdown().await
                .map_err(|e| format!("Failed to close stdin: {}", e))?;
        }
        
        // Store the child process
        {
            let mut process_guard = active_process_clone.lock().await;
            *process_guard = Some(child);
        }
        
        // Spawn task to read stderr
        let stderr = {
            let mut process_guard = active_process_clone.lock().await;
            process_guard.as_mut().and_then(|child| child.stderr.take())
        };
        
        if let Some(stderr) = stderr {
            tokio::spawn(async move {
                use tokio::io::{AsyncBufReadExt, BufReader};
                let mut reader = BufReader::new(stderr).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    if !line.trim().is_empty() {
                        println!("Claude stderr: {}", line);
                        if line.contains("OTEL") || line.contains("telemetry") || line.contains("otlp") {
                            println!("Claude OTLP-related: {}", line);
                        }
                    }
                }
            });
        }
        
        // Wait for completion
        let output = {
            let mut process_guard = active_process_clone.lock().await;
            if let Some(child) = process_guard.take() {
                child.wait_with_output().await
                    .map_err(|e| format!("Failed to execute Claude: {}", e))?
            } else {
                return Err("Process was stopped".to_string());
            }
        };
        
        // Stop OTLP progress task if it exists
        if let Some(task) = otlp_progress_task {
            task.abort();
        }
        
        // Get final telemetry from OTLP receiver if available
        let final_telemetry = if otlp_port > 0 {
            get_otlp_telemetry().await
        } else {
            None
        };
        
        // Note: We don't stop the OTLP receiver here since it's shared globally
        
        // Send completion progress with final telemetry
        let callback = progress_callback.lock().await;
        callback(GenerationProgress {
            stage: "complete".to_string(),
            message: "Generation complete".to_string(),
            percentage: 100,
            telemetry: final_telemetry,
        });

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Claude failed: {}", error));
        }

        let result = String::from_utf8_lossy(&output.stdout).to_string();
        
        // Log the raw output for debugging
        println!("Claude: Raw output length: {} characters", result.len());
        if result.len() < 100 {
            println!("Claude: Raw output: {:?}", result);
        }
        
        // Check if the output is empty or contains an error
        if result.trim().is_empty() {
            return Err("Claude returned no output".to_string());
        }
        
        // Check if the output is an error message
        if result.trim() == "Execution error" || result.contains("error") || result.len() < 50 {
            let stderr_output = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Claude returned an error. Output: '{}', Stderr: '{}'", 
                result.trim(), stderr_output.trim()));
        }
        
        // Extract the content between markdown code blocks if present
        if let Some(start) = result.find("```markdown") {
            if let Some(end) = result[start..].find("```\n") {
                let content_start = start + "```markdown\n".len();
                let content_end = start + end;
                return Ok(result[content_start..content_end].to_string());
            }
        }
        
        // If no markdown blocks found, return the raw result
        Ok(result)
    }

    async fn is_claude_available(&self) -> bool {
        match Command::new(&self.claude_path)
            .arg("--version")
            .output()
            .await {
            Ok(output) => output.status.success(),
            Err(_) => false,
        }
    }
    
    
    #[allow(dead_code)]
    pub async fn test_claude(&self) -> Result<String, String> {
        let output = Command::new(&self.claude_path)
            .arg("--version")
            .output()
            .await
            .map_err(|e| format!("Failed to execute Claude: {}", e))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Claude test failed: {}", error));
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    pub async fn stop_generation(&self) {
        let mut process_guard = self.active_process.lock().await;
        if let Some(mut child) = process_guard.take() {
            println!("Stopping Claude process...");
            match child.kill().await {
                Ok(_) => println!("Claude process stopped successfully"),
                Err(e) => println!("Failed to stop Claude process: {}", e),
            }
        }
    }
    
    pub fn get_path(&self) -> String {
        self.claude_path.clone()
    }
}

