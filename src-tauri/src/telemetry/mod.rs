pub mod otlp_receiver;

pub use otlp_receiver::{GenerationProgress};
#[allow(unused_imports)]
pub use otlp_receiver::TelemetryData;

use std::sync::Arc;
use tokio::sync::{Mutex, OnceCell, broadcast};

// Global OTLP receiver state
struct OtlpState {
    receiver: otlp_receiver::OtlpReceiver,
    port: u16,
}

static OTLP_STATE: OnceCell<Arc<Mutex<OtlpState>>> = OnceCell::const_new();

pub async fn get_or_start_otlp_receiver() -> Result<(u16, broadcast::Receiver<GenerationProgress>), String> {
    let state = OTLP_STATE.get_or_try_init(|| async move {
        // Generate random ports inside async but drop rng before await
        let random_ports: Vec<u16> = {
            use rand::Rng;
            let mut rng = rand::thread_rng();
            (0..5).map(|_| rng.gen_range(40000..50000)).collect()
        };
        
        // Use random ports to avoid conflicts with other Claude instances
        for port in random_ports {
            let mut receiver = otlp_receiver::OtlpReceiver::new(port);
            match receiver.start().await {
                Ok(_) => {
                    println!("OTLP receiver started on port {}", port);
                    
                    let state = OtlpState {
                        receiver,
                        port,
                    };
                    
                    return Ok(Arc::new(Mutex::new(state)));
                }
                Err(e) => {
                    println!("Failed to start OTLP receiver on port {}: {}", port, e);
                }
            }
        }
        
        Err("Failed to start OTLP receiver on any port".to_string())
    }).await?;
    
    let state_guard = state.lock().await;
    let port = state_guard.port;
    // Get a fresh subscription from the actual receiver
    let receiver = state_guard.receiver.subscribe();
    
    println!("Returning OTLP port {} with new subscription", port);
    Ok((port, receiver))
}

pub async fn get_otlp_telemetry() -> Option<TelemetryData> {
    if let Some(state) = OTLP_STATE.get() {
        let state_guard = state.lock().await;
        Some(state_guard.receiver.get_telemetry().await)
    } else {
        None
    }
}

pub async fn reset_otlp_telemetry() {
    if let Some(state) = OTLP_STATE.get() {
        let state_guard = state.lock().await;
        state_guard.receiver.reset_telemetry().await;
    }
}