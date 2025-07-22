use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// Custom serializer for tags
fn deserialize_tags<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let s: String = String::deserialize(deserializer)?;
    serde_json::from_str(&s).map_err(serde::de::Error::custom)
}

fn serialize_tags<S>(tags: &Vec<String>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_some(tags)
}

// Database row representation
#[derive(Debug, Clone, FromRow)]
pub struct TemplateRow {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub category: String,
    pub tags: String, // JSON string
    pub word_count: Option<i32>,
    pub url: Option<String>,
    pub file_path: Option<String>,
    pub description: Option<String>,
    pub template_version: Option<String>,
    pub author: Option<String>,
    pub complexity: Option<String>,
    pub use_case: Option<String>,
    pub prerequisites: Option<String>, // JSON string
    pub is_prp_template: bool,
    pub created_at: String,
    pub updated_at: String,
}

// API representation with proper types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Template {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub category: String,
    #[serde(deserialize_with = "deserialize_tags", serialize_with = "serialize_tags")]
    pub tags: Vec<String>,
    pub word_count: Option<i32>,
    pub url: Option<String>,
    pub file_path: Option<String>,
    pub description: Option<String>,
    pub template_version: Option<String>,
    pub author: Option<String>,
    pub complexity: Option<String>,
    pub use_case: Option<String>,
    pub prerequisites: Option<serde_json::Value>,
    pub is_prp_template: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<TemplateRow> for Template {
    fn from(row: TemplateRow) -> Self {
        Template {
            id: row.id,
            title: row.title,
            content: row.content,
            category: row.category,
            tags: serde_json::from_str(&row.tags).unwrap_or_else(|_| vec![]),
            word_count: row.word_count,
            url: row.url,
            file_path: row.file_path,
            description: row.description,
            template_version: row.template_version,
            author: row.author,
            complexity: row.complexity,
            use_case: row.use_case,
            prerequisites: row.prerequisites.and_then(|p| serde_json::from_str(&p).ok()),
            is_prp_template: row.is_prp_template,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateTemplate {
    pub title: String,
    pub content: String,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub url: Option<String>,
    pub file_path: Option<String>,
    pub description: Option<String>,
    pub template_version: Option<String>,
    pub author: Option<String>,
    pub complexity: Option<String>,
    pub use_case: Option<String>,
    pub prerequisites: Option<serde_json::Value>,
    pub is_prp_template: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTemplate {
    pub title: Option<String>,
    pub content: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub url: Option<String>,
    pub file_path: Option<String>,
    pub description: Option<String>,
    pub template_version: Option<String>,
    pub author: Option<String>,
    pub complexity: Option<String>,
    pub use_case: Option<String>,
    pub prerequisites: Option<serde_json::Value>,
    pub is_prp_template: Option<bool>,
}