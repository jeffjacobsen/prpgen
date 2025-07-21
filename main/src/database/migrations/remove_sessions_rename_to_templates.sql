-- Remove all session-related tables
DROP TABLE IF EXISTS session_outputs;
DROP TABLE IF EXISTS session_documents;
DROP TABLE IF EXISTS session_prp;
DROP TABLE IF EXISTS session_milestones;
DROP TABLE IF EXISTS session_metrics;
DROP TABLE IF EXISTS conversation_messages;
DROP TABLE IF EXISTS prompt_markers;
DROP TABLE IF EXISTS execution_diffs;
DROP TABLE IF EXISTS sessions;

-- Drop session-related indexes
DROP INDEX IF EXISTS idx_session_outputs_session_id;
DROP INDEX IF EXISTS idx_session_outputs_timestamp;
DROP INDEX IF EXISTS idx_conversation_messages_session_id;
DROP INDEX IF EXISTS idx_conversation_messages_timestamp;
DROP INDEX IF EXISTS idx_execution_diffs_session_id;
DROP INDEX IF EXISTS idx_execution_diffs_timestamp;
DROP INDEX IF EXISTS idx_session_favorites;
DROP INDEX IF EXISTS idx_prompt_markers_session_id;
DROP INDEX IF EXISTS idx_prompt_markers_timestamp;

-- Rename documents table to templates
ALTER TABLE documents RENAME TO templates;

-- Update any foreign key references if needed (none in this case as documents/templates are project-independent)