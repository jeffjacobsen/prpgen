export interface Project {
  id: number;
  name: string;
  path: string;
  permission_mode?: string;
  dev_command?: string | null;
  build_command?: string | null;
  test_command?: string | null;
  lint_command?: string | null;
  typecheck_command?: string | null;
  last_viewed_at?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectRunCommand {
  id: number;
  project_id: number;
  command: string;
  display_name?: string;
  order_index: number;
  created_at: string;
}

// Template interface (renamed from Document)
export interface Template {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  word_count?: number;
  url?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

// PRP interfaces
export interface ProductRequirementPrompt {
  id: number;
  title: string;
  content: string;
  version: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PRPVersion {
  id: number;
  prp_id: number;
  title: string;
  content: string;
  version: number;
  created_at: string;
}