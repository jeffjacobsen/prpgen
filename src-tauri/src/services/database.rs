use sqlx::sqlite::SqlitePool;
use std::path::Path;
use crate::models::{PRP, CreatePRP, UpdatePRP, PRPVersion, Template, TemplateRow, CreateTemplate, UpdateTemplate};

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(db_path: &Path) -> Result<Self, sqlx::Error> {
        // Ensure the parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                sqlx::Error::Io(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to create database directory: {}", e),
                ))
            })?;
        }

        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
        let pool = SqlitePool::connect(&db_url).await?;
        
        let db = Self { pool };
        db.initialize().await?;
        Ok(db)
    }

    async fn initialize(&self) -> Result<(), sqlx::Error> {
        // Create tables
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS product_requirement_prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS prp_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prp_id INTEGER NOT NULL,
                version_number INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prp_id) REFERENCES product_requirement_prompts(id) ON DELETE CASCADE
            );
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create templates table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                tags TEXT DEFAULT '[]',
                word_count INTEGER DEFAULT 0,
                url TEXT,
                file_path TEXT,
                description TEXT,
                template_version TEXT,
                author TEXT,
                complexity TEXT,
                use_case TEXT,
                prerequisites TEXT,
                is_prp_template BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create indexes
        sqlx::query(
            "CREATE INDEX IF NOT EXISTS idx_prp_versions_prp_id ON prp_versions(prp_id);",
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            "CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);",
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            "CREATE INDEX IF NOT EXISTS idx_templates_is_prp ON templates(is_prp_template);",
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_all_prps(&self) -> Result<Vec<PRP>, sqlx::Error> {
        let prps = sqlx::query_as::<_, PRP>(
            "SELECT * FROM product_requirement_prompts ORDER BY updated_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(prps)
    }

    pub async fn get_prp(&self, id: i64) -> Result<Option<PRP>, sqlx::Error> {
        let prp = sqlx::query_as::<_, PRP>(
            "SELECT * FROM product_requirement_prompts WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(prp)
    }

    pub async fn create_prp(&self, create_prp: CreatePRP) -> Result<PRP, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        // Insert the PRP
        let id = sqlx::query(
            "INSERT INTO product_requirement_prompts (title, content) VALUES (?, ?)"
        )
        .bind(&create_prp.title)
        .bind(&create_prp.content)
        .execute(&mut *tx)
        .await?
        .last_insert_rowid();

        // Create initial version
        sqlx::query(
            "INSERT INTO prp_versions (prp_id, version_number, title, content) VALUES (?, 1, ?, ?)"
        )
        .bind(id)
        .bind(&create_prp.title)
        .bind(&create_prp.content)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        // Fetch and return the created PRP
        self.get_prp(id).await?.ok_or_else(|| {
            sqlx::Error::RowNotFound
        })
    }

    pub async fn update_prp(&self, id: i64, update_prp: UpdatePRP) -> Result<PRP, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        // Get current version
        let current_version: i32 = sqlx::query_scalar(
            "SELECT version FROM product_requirement_prompts WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or(sqlx::Error::RowNotFound)?;

        let new_version = current_version + 1;

        // Update the PRP
        sqlx::query(
            "UPDATE product_requirement_prompts SET title = ?, content = ?, version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(&update_prp.title)
        .bind(&update_prp.content)
        .bind(new_version)
        .bind(id)
        .execute(&mut *tx)
        .await?;

        // Create version history
        sqlx::query(
            "INSERT INTO prp_versions (prp_id, version_number, title, content) VALUES (?, ?, ?, ?)"
        )
        .bind(id)
        .bind(new_version)
        .bind(&update_prp.title)
        .bind(&update_prp.content)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        // Fetch and return the updated PRP
        self.get_prp(id).await?.ok_or_else(|| {
            sqlx::Error::RowNotFound
        })
    }

    pub async fn delete_prp(&self, id: i64) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM product_requirement_prompts WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn get_prp_versions(&self, prp_id: i64) -> Result<Vec<PRPVersion>, sqlx::Error> {
        let versions = sqlx::query_as::<_, PRPVersion>(
            "SELECT * FROM prp_versions WHERE prp_id = ? ORDER BY version_number DESC"
        )
        .bind(prp_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(versions)
    }

    // Template methods
    pub async fn get_all_templates(&self) -> Result<Vec<Template>, sqlx::Error> {
        let templates = sqlx::query_as::<_, TemplateRow>(
            "SELECT * FROM templates ORDER BY updated_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(templates.into_iter().map(Template::from).collect())
    }

    pub async fn get_prp_templates(&self) -> Result<Vec<Template>, sqlx::Error> {
        let templates = sqlx::query_as::<_, TemplateRow>(
            "SELECT * FROM templates WHERE is_prp_template = 1 ORDER BY updated_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(templates.into_iter().map(Template::from).collect())
    }

    pub async fn get_template(&self, id: i64) -> Result<Option<Template>, sqlx::Error> {
        let template = sqlx::query_as::<_, TemplateRow>(
            "SELECT * FROM templates WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(template.map(Template::from))
    }

    pub async fn create_template(&self, template: CreateTemplate) -> Result<Template, sqlx::Error> {
        let tags_json = serde_json::to_string(&template.tags.unwrap_or_default())
            .map_err(|e| sqlx::Error::Protocol(e.to_string()))?;
        
        let prerequisites_json = template.prerequisites
            .map(|p| serde_json::to_string(&p))
            .transpose()
            .map_err(|e| sqlx::Error::Protocol(e.to_string()))?;

        let word_count = template.content.split_whitespace().count() as i32;

        let result = sqlx::query(
            r#"
            INSERT INTO templates (
                title, content, category, tags, word_count, url, file_path,
                description, template_version, author, complexity, use_case,
                prerequisites, is_prp_template
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&template.title)
        .bind(&template.content)
        .bind(template.category.as_deref().unwrap_or("general"))
        .bind(&tags_json)
        .bind(word_count)
        .bind(&template.url)
        .bind(&template.file_path)
        .bind(&template.description)
        .bind(&template.template_version)
        .bind(&template.author)
        .bind(&template.complexity)
        .bind(&template.use_case)
        .bind(&prerequisites_json)
        .bind(template.is_prp_template.unwrap_or(false))
        .execute(&self.pool)
        .await?;

        let id = result.last_insert_rowid();
        self.get_template(id).await?.ok_or_else(|| {
            sqlx::Error::RowNotFound
        })
    }

    pub async fn update_template(&self, id: i64, template: UpdateTemplate) -> Result<Template, sqlx::Error> {
        let mut query = String::from("UPDATE templates SET ");
        let mut updates = Vec::new();
        
        if template.title.is_some() {
            updates.push("title = ?");
        }
        if template.content.is_some() {
            updates.push("content = ?");
            updates.push("word_count = ?");
        }
        if template.category.is_some() {
            updates.push("category = ?");
        }
        if template.tags.is_some() {
            updates.push("tags = ?");
        }
        if template.url.is_some() {
            updates.push("url = ?");
        }
        if template.file_path.is_some() {
            updates.push("file_path = ?");
        }
        if template.description.is_some() {
            updates.push("description = ?");
        }
        if template.template_version.is_some() {
            updates.push("template_version = ?");
        }
        if template.author.is_some() {
            updates.push("author = ?");
        }
        if template.complexity.is_some() {
            updates.push("complexity = ?");
        }
        if template.use_case.is_some() {
            updates.push("use_case = ?");
        }
        if template.prerequisites.is_some() {
            updates.push("prerequisites = ?");
        }
        if template.is_prp_template.is_some() {
            updates.push("is_prp_template = ?");
        }
        
        updates.push("updated_at = CURRENT_TIMESTAMP");
        
        query.push_str(&updates.join(", "));
        query.push_str(" WHERE id = ?");

        let mut q = sqlx::query(&query);
        
        if let Some(title) = &template.title {
            q = q.bind(title);
        }
        if let Some(content) = &template.content {
            q = q.bind(content);
            let word_count = content.split_whitespace().count() as i32;
            q = q.bind(word_count);
        }
        if let Some(category) = &template.category {
            q = q.bind(category);
        }
        if let Some(tags) = &template.tags {
            let tags_json = serde_json::to_string(tags)
                .map_err(|e| sqlx::Error::Protocol(e.to_string()))?;
            q = q.bind(tags_json);
        }
        if let Some(url) = &template.url {
            q = q.bind(url);
        }
        if let Some(file_path) = &template.file_path {
            q = q.bind(file_path);
        }
        if let Some(description) = &template.description {
            q = q.bind(description);
        }
        if let Some(template_version) = &template.template_version {
            q = q.bind(template_version);
        }
        if let Some(author) = &template.author {
            q = q.bind(author);
        }
        if let Some(complexity) = &template.complexity {
            q = q.bind(complexity);
        }
        if let Some(use_case) = &template.use_case {
            q = q.bind(use_case);
        }
        if let Some(prerequisites) = &template.prerequisites {
            let prerequisites_json = serde_json::to_string(prerequisites)
                .map_err(|e| sqlx::Error::Protocol(e.to_string()))?;
            q = q.bind(prerequisites_json);
        }
        if let Some(is_prp_template) = template.is_prp_template {
            q = q.bind(is_prp_template);
        }
        
        q = q.bind(id);
        q.execute(&self.pool).await?;

        self.get_template(id).await?.ok_or_else(|| {
            sqlx::Error::RowNotFound
        })
    }

    pub async fn delete_template(&self, id: i64) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM templates WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn search_templates(&self, query: &str) -> Result<Vec<Template>, sqlx::Error> {
        let search_pattern = format!("%{}%", query);
        let templates = sqlx::query_as::<_, TemplateRow>(
            r#"
            SELECT * FROM templates 
            WHERE title LIKE ? OR content LIKE ? OR category LIKE ? OR description LIKE ?
            ORDER BY updated_at DESC
            "#
        )
        .bind(&search_pattern)
        .bind(&search_pattern)
        .bind(&search_pattern)
        .bind(&search_pattern)
        .fetch_all(&self.pool)
        .await?;

        Ok(templates.into_iter().map(Template::from).collect())
    }
}