-- Add metadata fields to templates table for PRP generation
ALTER TABLE templates ADD COLUMN description TEXT;
ALTER TABLE templates ADD COLUMN template_version TEXT DEFAULT '1.0.0';
ALTER TABLE templates ADD COLUMN author TEXT;
ALTER TABLE templates ADD COLUMN complexity TEXT DEFAULT 'medium';
ALTER TABLE templates ADD COLUMN use_case TEXT;
ALTER TABLE templates ADD COLUMN prerequisites TEXT DEFAULT '{}';
ALTER TABLE templates ADD COLUMN is_prp_template BOOLEAN DEFAULT 0;

-- Update existing templates to mark them as non-PRP templates
UPDATE templates SET is_prp_template = 0 WHERE is_prp_template IS NULL;