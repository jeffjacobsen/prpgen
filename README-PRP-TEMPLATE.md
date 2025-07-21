# PRPGen PRP & Template Manager

A focused Electron application for managing Product Requirement Prompts (PRPs) and Templates for AI-assisted development.

## Overview

PRPGen PRP & Template Manager is a streamlined version of PRPGen that focuses on:
- **Product Requirement Prompts (PRPs)**: Create, edit, and manage structured prompts for AI coding assistants
- **Templates**: Store and organize reusable code templates, documentation, and reference materials

## Features

### PRP Management
- Create and edit PRPs with a rich Markdown editor
- Generate PRPs from templates using AI assistance
- Version control for PRP history
- Export PRPs for use in any AI coding tool

### Template Management
- Store code templates, API documentation, and reference materials
- Import content from files or URLs
- Organize templates with categories and tags
- Full-text search across all templates

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/prpgen-prp-template.git
cd prpgen-prp-template

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build:mac   # For macOS
pnpm build:linux # For Linux
```

## Usage

1. **PRPs Tab**: Create and manage your Product Requirement Prompts
   - Click "Generate PRP" to create a new PRP from templates
   - Edit existing PRPs with the built-in editor
   - Export PRPs to use with Claude, GitHub Copilot, or other AI tools

2. **Templates Tab**: Store and organize your reference materials
   - Click "New Template" to create a template manually
   - Use "Import URL" to scrape documentation from websites
   - Use "Import File" to add local files as templates
   - Search and filter templates by category or content

## Development

This is a simplified version of PRPGen focused on PRP and Template management. The codebase has been streamlined by removing:
- Session management functionality
- Git worktree operations
- Claude Code integration
- Terminal emulation

The application now provides a clean, focused interface for managing development prompts and templates.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Electron, SQLite
- **Build**: Vite, electron-builder

## License

MIT