use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PRP {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub version: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePRP {
    pub title: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePRP {
    pub title: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PRPVersion {
    pub id: i64,
    pub prp_id: i64,
    pub version_number: i32,
    pub title: String,
    pub content: String,
    pub created_at: String,
}