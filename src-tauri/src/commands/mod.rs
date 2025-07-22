pub mod prp;
pub mod generation;
pub mod template;
pub mod cancel;
pub mod config;

pub use prp::*;
pub use generation::*;
pub use template::*;
pub use cancel::*;
pub use config::*;

use std::sync::Arc;
use tokio::sync::Mutex;
use crate::services::Database;

pub type DbState = Arc<Mutex<Database>>;