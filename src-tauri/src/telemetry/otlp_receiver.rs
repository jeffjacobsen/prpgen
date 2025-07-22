use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tower_http::cors::CorsLayer;
use tracing::{error, info};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryData {
    pub tokens_input: u64,
    pub tokens_output: u64,
    pub tokens_total: u64,
    pub cache_read_tokens: Option<u64>,
    pub cache_creation_tokens: Option<u64>,
    pub cost_usd: f64,
    pub tool_usage: std::collections::HashMap<String, u64>,
    pub active_time_ms: u64,
    pub last_update: Option<String>,
}

impl Default for TelemetryData {
    fn default() -> Self {
        Self {
            tokens_input: 0,
            tokens_output: 0,
            tokens_total: 0,
            cache_read_tokens: None,
            cache_creation_tokens: None,
            cost_usd: 0.0,
            tool_usage: std::collections::HashMap::new(),
            active_time_ms: 0,
            last_update: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationProgress {
    pub stage: String,
    pub message: String,
    pub percentage: u8,
    pub telemetry: Option<TelemetryData>,
}

#[derive(Debug, Deserialize)]
struct OtlpMetric {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    gauge: Option<MetricPoints>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sum: Option<MetricPoints>,
}

#[derive(Debug, Deserialize)]
struct MetricPoints {
    #[serde(rename = "dataPoints")]
    data_points: Vec<DataPoint>,
}

#[derive(Debug, Deserialize)]
struct DataPoint {
    #[serde(rename = "asInt", skip_serializing_if = "Option::is_none")]
    as_int: Option<i64>,
    #[serde(rename = "asDouble", skip_serializing_if = "Option::is_none")]
    as_double: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    attributes: Option<Vec<Attribute>>,
}

#[derive(Debug, Deserialize)]
struct Attribute {
    key: String,
    value: AttributeValue,
}

#[derive(Debug, Deserialize)]
struct AttributeValue {
    #[serde(rename = "stringValue", skip_serializing_if = "Option::is_none")]
    string_value: Option<String>,
    #[serde(rename = "intValue", skip_serializing_if = "Option::is_none")]
    int_value: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct OtlpPayload {
    #[serde(rename = "resourceMetrics")]
    resource_metrics: Vec<ResourceMetrics>,
}

#[derive(Debug, Deserialize)]
struct ResourceMetrics {
    #[serde(rename = "scopeMetrics")]
    scope_metrics: Vec<ScopeMetrics>,
}

#[derive(Debug, Deserialize)]
struct ScopeMetrics {
    metrics: Vec<OtlpMetric>,
}

#[derive(Debug, Deserialize)]
struct OtlpLogsPayload {
    #[serde(rename = "resourceLogs")]
    resource_logs: Vec<ResourceLogs>,
}

#[derive(Debug, Deserialize)]
struct ResourceLogs {
    #[serde(rename = "scopeLogs")]
    scope_logs: Vec<ScopeLogs>,
}

#[derive(Debug, Deserialize)]
struct ScopeLogs {
    #[serde(rename = "logRecords")]
    log_records: Vec<LogRecord>,
}

#[derive(Debug, Deserialize)]
struct LogRecord {
    #[allow(dead_code)]
    body: Option<LogBody>,
    attributes: Option<Vec<Attribute>>,
}

#[derive(Debug, Deserialize)]
struct LogBody {
    #[serde(rename = "stringValue")]
    #[allow(dead_code)]
    string_value: Option<String>,
}

#[derive(Clone)]
struct AppState {
    telemetry: Arc<RwLock<TelemetryData>>,
    progress_tx: broadcast::Sender<GenerationProgress>,
}

pub struct OtlpReceiver {
    port: u16,
    telemetry: Arc<RwLock<TelemetryData>>,
    progress_tx: broadcast::Sender<GenerationProgress>,
    server_handle: Option<tokio::task::JoinHandle<()>>,
}

impl OtlpReceiver {
    pub fn new(port: u16) -> Self {
        let (progress_tx, _) = broadcast::channel(100);
        Self {
            port,
            telemetry: Arc::new(RwLock::new(TelemetryData::default())),
            progress_tx,
            server_handle: None,
        }
    }

    pub fn port(&self) -> u16 {
        self.port
    }

    pub async fn start(&mut self) -> Result<(), String> {
        let state = AppState {
            telemetry: self.telemetry.clone(),
            progress_tx: self.progress_tx.clone(),
        };

        let app = Router::new()
            .route("/v1/metrics", post(handle_metrics))
            .route("/v1/logs", post(handle_logs))
            .route("/v1/traces", post(handle_traces))
            .route("/status", get(get_status))
            .route("/health", get(health_check))
            .layer(CorsLayer::permissive())
            .layer(tower_http::trace::TraceLayer::new_for_http()
                .on_request(|request: &axum::http::Request<_>, _span: &tracing::Span| {
                    //println!("OTLP: Incoming request: {} {}", request.method(), request.uri());
                    //println!("OTLP: Headers: {:?}", request.headers());
                }))
            .with_state(state);

        let addr = format!("127.0.0.1:{}", self.port);
        info!("Starting OTLP receiver on {}", addr);
        println!("OTLP: Starting receiver on {}", addr);
        //println!("OTLP: Test endpoints:");
        //println!("  curl http://localhost:{}/health", self.port);
        //println!("  curl http://localhost:{}/status", self.port);

        let listener = tokio::net::TcpListener::bind(&addr).await
            .map_err(|e| format!("Failed to bind to {}: {}", addr, e))?;
        
        let server = axum::serve(listener, app);
        
        let handle = tokio::spawn(async move {
            if let Err(e) = server.await {
                error!("OTLP server error: {}", e);
            }
        });

        self.server_handle = Some(handle);
        Ok(())
    }

    pub async fn stop(&mut self) {
        if let Some(handle) = self.server_handle.take() {
            handle.abort();
            info!("OTLP receiver stopped");
        }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<GenerationProgress> {
        self.progress_tx.subscribe()
    }

    pub async fn get_telemetry(&self) -> TelemetryData {
        self.telemetry.read().await.clone()
    }

    pub async fn reset_telemetry(&self) {
        let mut telemetry = self.telemetry.write().await;
        *telemetry = TelemetryData::default();
        println!("OTLP: Telemetry data reset");
    }
}

async fn handle_metrics(
    State(_state): State<AppState>,
    Json(payload): Json<OtlpPayload>,
) -> StatusCode {    
    StatusCode::OK
}

async fn handle_logs(
    State(state): State<AppState>,
    Json(payload): Json<OtlpLogsPayload>,
) -> StatusCode {
    println!("OTLP: ====== Received logs request ======");
    //println!("OTLP: Timestamp: {}", chrono::Utc::now().to_rfc3339());
    let mut telemetry = state.telemetry.write().await;
    
    let mut _log_count = 0;
    for rl in payload.resource_logs {
        for sl in rl.scope_logs {
            //println!("OTLP: Processing {} log records", sl.log_records.len());
            for log in sl.log_records {
                _log_count += 1;
                if let Some(attrs) = log.attributes {
                //    println!("OTLP: Processing log with {} attributes", attrs.len());
                    process_log_attributes(&mut telemetry, attrs);
                }
            }
        }
    }
    
    //println!("OTLP: Processed {} log records total", _log_count);
    telemetry.last_update = Some(chrono::Utc::now().to_rfc3339());
    
    // Calculate progress based on telemetry

    println!("OTLP: After logs - tokens: {}, cost: ${:.3}", 
        telemetry.tokens_total, telemetry.cost_usd);
    
    // Send progress update if we got meaningful data
    if telemetry.tokens_total > 0 {
        let result = state.progress_tx.send(GenerationProgress {
            stage: "processing".to_string(),
            message: format!("Processing... ({} tokens)", telemetry.tokens_total),
            percentage: 50,
            telemetry: Some(telemetry.clone()),
        });
        
        match result {
            Ok(count) => {
            //    println!("OTLP: Progress update sent to {} receivers from logs", count);
                println!("OTLP: Sent progress from logs - tokens: {}", telemetry.tokens_total);
            },
            Err(e) => println!("OTLP: Failed to send progress update from logs: {:?}", e),
        }
    }
    
    StatusCode::OK
}

async fn handle_traces(
    State(_state): State<AppState>,
    Json(_payload): Json<serde_json::Value>,
) -> StatusCode {
    // We don't process traces for now
    StatusCode::OK
}

async fn get_status(State(state): State<AppState>) -> Json<TelemetryData> {
    Json(state.telemetry.read().await.clone())
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

fn update_telemetry(telemetry: &mut TelemetryData, metric: &OtlpMetric) {
    let value = get_metric_value(metric);
    println!("OTLP: Metric '{}' = {}", metric.name, value);
    
    match metric.name.as_str() {
        "claude.tokens.total" | "claude_code.token.usage" => {
            if let Some(token_type) = get_attribute(metric, "type")
                .or_else(|| get_attribute(metric, "token_type"))
            {
                println!("OTLP: Token type: {}, value: {}", token_type, value);
                match token_type.as_str() {
                    "input" => telemetry.tokens_input += value as u64,
                    "output" => telemetry.tokens_output += value as u64,
                    _ => println!("OTLP: Unknown token type: {}", token_type),
                }
                telemetry.tokens_total = telemetry.tokens_input + telemetry.tokens_output;
            }
        }
        "claude.api_cost.total" | "claude_code.cost.usage" => {
            println!("OTLP: Adding cost: ${}", value);
            telemetry.cost_usd += value;
        }
        "claude.active_time.duration" | "claude_code.active_time.ms" => {
            println!("OTLP: Active time: {}ms", value);
            telemetry.active_time_ms = value as u64;
        }
        "claude.tool_usage.total" | "claude_code.tool_usage.count" => {
            if let Some(tool_name) = get_attribute(metric, "tool")
                .or_else(|| get_attribute(metric, "tool_name"))
            {
                println!("OTLP: Tool '{}' used {} times", tool_name, value);
                *telemetry.tool_usage.entry(tool_name).or_insert(0) += value as u64;
            }
        }
        _ => println!("OTLP: Unhandled metric: {}", metric.name),
    }
}

fn get_metric_value(metric: &OtlpMetric) -> f64 {
    let binding = vec![];
    let data_points = metric
        .sum
        .as_ref()
        .or(metric.gauge.as_ref())
        .map(|m| &m.data_points)
        .unwrap_or(&binding);
    
    if let Some(point) = data_points.first() {
        point.as_double.unwrap_or_else(|| point.as_int.unwrap_or(0) as f64)
    } else {
        0.0
    }
}

fn get_attribute(metric: &OtlpMetric, key: &str) -> Option<String> {
    let binding = vec![];
    let data_points = metric
        .sum
        .as_ref()
        .or(metric.gauge.as_ref())
        .map(|m| &m.data_points)
        .unwrap_or(&binding);
    
    if let Some(point) = data_points.first() {
        if let Some(attrs) = &point.attributes {
            for attr in attrs {
                if attr.key == key {
                    return attr.value.string_value.clone()
                        .or_else(|| attr.value.int_value.map(|v| v.to_string()));
                }
            }
        }
    }
    
    None
}

fn process_log_attributes(telemetry: &mut TelemetryData, attrs: Vec<Attribute>) {
    let mut event_name = None;
    let mut input_tokens = 0u64;
    let mut output_tokens = 0u64;
    let mut cache_read_tokens = 0u64;
    let mut cache_creation_tokens = 0u64;
    let mut cost = 0.0;
    
    //println!("OTLP: Processing log attributes:");
    for attr in attrs {
        // println!("OTLP:   {} = {:?}{:?}", attr.key, attr.value.string_value, attr.value.int_value);
        match attr.key.as_str() {
            "event.name" => event_name = attr.value.string_value,
            "input_tokens" => {
                // Parse from string value since it's coming as a string
                if let Some(s) = &attr.value.string_value {
                    input_tokens = s.parse::<u64>().unwrap_or(0);
                } else {
                    input_tokens = attr.value.int_value.unwrap_or(0) as u64;
                }
            },
            "output_tokens" => {
                if let Some(s) = &attr.value.string_value {
                    output_tokens = s.parse::<u64>().unwrap_or(0);
                } else {
                    output_tokens = attr.value.int_value.unwrap_or(0) as u64;
                }
            },
            "cache_read_tokens" => {
                if let Some(s) = &attr.value.string_value {
                    cache_read_tokens = s.parse::<u64>().unwrap_or(0);
                } else {
                    cache_read_tokens = attr.value.int_value.unwrap_or(0) as u64;
                }
            },
            "cache_creation_tokens" => {
                if let Some(s) = &attr.value.string_value {
                    cache_creation_tokens = s.parse::<u64>().unwrap_or(0);
                } else {
                    cache_creation_tokens = attr.value.int_value.unwrap_or(0) as u64;
                }
            },
            "cost_usd" => {
                if let Some(s) = attr.value.string_value {
                    cost = s.parse::<f64>().unwrap_or(0.0);
                }
            }
            _ => {}
        }
    }
    
    if let Some(name) = event_name {
        println!("OTLP: Event '{}' - input: {}, output: {}, cache_read: {}, cache_creation: {}, cost: ${}", 
            name, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, cost);
        if name == "api_request" || name == "user_prompt" {
            telemetry.tokens_input += input_tokens;
            telemetry.tokens_output += output_tokens;
            telemetry.tokens_total = telemetry.tokens_input + telemetry.tokens_output;
            telemetry.cost_usd += cost;
            
            // Track cache tokens separately
            if !telemetry.cache_read_tokens.is_some() {
                telemetry.cache_read_tokens = Some(0);
            }
            if !telemetry.cache_creation_tokens.is_some() {
                telemetry.cache_creation_tokens = Some(0);
            }
            *telemetry.cache_read_tokens.as_mut().unwrap() += cache_read_tokens;
            *telemetry.cache_creation_tokens.as_mut().unwrap() += cache_creation_tokens;
            
            println!("OTLP: Updated totals - tokens: {} (cache read: {}, cache creation: {}), cost: ${}", 
                telemetry.tokens_total, 
                telemetry.cache_read_tokens.unwrap_or(0),
                telemetry.cache_creation_tokens.unwrap_or(0),
                telemetry.cost_usd);
        }
    }
}

fn calculate_progress(telemetry: &TelemetryData) -> u8 {
    // Simple progress calculation based on tokens
    // Assume average PRP generation uses ~2000-5000 tokens
    let token_progress = (telemetry.tokens_total as f64 / 3000.0 * 100.0).min(90.0);
    token_progress as u8
}