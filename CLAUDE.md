# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PRPGen (Product Requirement Prompt Generator) is an Electron desktop application for creating, managing, and generating comprehensive Product Requirement Prompts (PRPs) that guide AI-assisted development. PRPs provide structured templates and context for longer coding sessions with Claude Code.

## Common Development Commands

```bash
# One-time setup (install dependencies, build, and rebuild native modules)
pnpm run setup

# Run in development mode (most common)
pnpm run dev
# Or:
pnpm electron-dev

# Build commands
pnpm build              # Build all packages
pnpm build:frontend     # Build frontend only
pnpm build:main        # Build main process only
pnpm typecheck         # Run TypeScript type checking across all packages
pnpm lint              # Run ESLint across all packages

# Testing
pnpm test              # Run Playwright tests
pnpm test:ui           # Run tests with UI mode
pnpm test:headed       # Run tests in headed browser

# Production builds
pnpm build:mac         # Build for macOS (universal binary)
pnpm build:mac:x64     # Build for macOS x64 only
pnpm build:mac:arm64   # Build for macOS ARM64 only
pnpm build:linux       # Build for Linux (deb and AppImage)

# If developing PRPGen with PRPGen
# Set this as your run script in PRPGen project settings:
pnpm run setup && PRPGEN_DIR=~/.prpgen_test pnpm electron-dev
```

## High-Level Architecture

PRPGen uses a multi-process Electron architecture with clear separation of concerns:

### Process Architecture
- **Main Process** (Electron + Node.js):
  - SQLite database for persistent storage of PRPs and templates
  - IPC handlers for secure communication with renderer
  - Template management and PRP generation services
  - Configuration management

- **Renderer Process** (React 19):
  - React with TypeScript
  - Tailwind CSS for styling
  - Rich Markdown editor for PRP editing
  - Real-time PRP generation with progress tracking

### Key Architectural Patterns

1. **Database-Driven Templates**: All PRP templates are stored in SQLite database, allowing for easy management and versioning.

2. **PRP Lifecycle**:
   - Template selection → Feature input → AI generation
   - Real-time progress tracking → PRP editing → Save to database
   - Export and share capabilities

3. **State Management**:
   - Database as single source of truth
   - Event-driven updates between processes
   - Efficient state synchronization

## Critical Implementation Details

### Modular Architecture

The application is organized into clear modules:

- **`index.ts`**: Core Electron setup and initialization
- **`ipc/`**: IPC handlers organized by functionality
  - `prp.ts`: PRP operations
  - `templates.ts`: Template management
  - `config.ts`: Configuration handlers
  - `app.ts`: Application lifecycle
  - `dialog.ts`: File/folder dialogs
  - `project.ts`: Legacy project support (minimal)

### Product Requirement Prompts (PRP) System

PRPGen's core functionality revolves around the PRP system:

#### Key Components:
- **PRP Templates**: Database-stored templates for common development patterns
- **AI-Assisted Generation**: Uses feature descriptions to generate comprehensive PRPs
- **Version Control**: Track PRP changes over time
- **Rich Editing**: Markdown editor with preview capabilities

#### PRP Workflow:
1. **Select Template**: Choose from pre-built templates (Base, React Component, Backend Service, Bug Fix)
2. **Input Requirements**: Provide feature description and optional codebase path
3. **Generate with AI**: Real-time generation with progress tracking
4. **Edit and Refine**: Use the rich Markdown editor to customize
5. **Save and Export**: Store in database or export for use

#### Template System:
- Templates stored in `templates` table with metadata
- Supports categories: general, frontend, backend, maintenance
- Complexity levels: low, medium, high
- Variable substitution for dynamic content

### Database Schema

Key tables:
- `product_requirement_prompts`: PRP storage with versioning
- `prp_versions`: Version history for PRPs
- `templates`: Template storage with PRP-specific metadata
- `documents`: Documentation references

Template fields for PRP templates:
- `title`: Template name
- `content`: Template markdown content
- `description`: Brief description
- `template_version`: Version number
- `author`: Template author
- `complexity`: Difficulty level
- `use_case`: Best use case description
- `prerequisites`: JSON object of requirements
- `is_prp_template`: Boolean flag for PRP templates

### Migrating PRP Templates

To populate the database with default PRP templates:

1. Start the app in development mode: `pnpm dev`
2. Open DevTools (Cmd+Option+I or Ctrl+Shift+I)
3. Run the migration script from `/scripts/migrate-templates-simple.js` in the console
4. This will create 4 default templates: Base, React Component, Backend Service, Bug Fix

## IPC Communication

Main IPC channels:
- `prp:*` - Product Requirement Prompt operations
- `templates:*` - Template management
- `config:*` - Settings and configuration
- `app:*` - Application lifecycle
- `dialog:*` - File/folder selection
- `prp-generation:*` - AI-assisted PRP generation

Events emitted:
- `prp-generation:progress` - Real-time PRP generation updates

## Recent Changes from PRPGen

PRPGen is a focused rebuild of PRPGen, removing multi-session and git worktree functionality:

### Removed Features:
- Git worktree management
- Multiple Claude Code sessions
- Session output tracking
- Git diff viewing
- Commit management
- Project-based organization
- Permission dialogs
- Notification system

### Simplified Architecture:
- Single-purpose PRP management
- Streamlined settings (only Claude executable path)
- Focused UI on templates and PRPs
- Removed complex state management for sessions

### Retained Features:
- PRP creation and management
- Template system (now database-based)
- AI-assisted PRP generation
- Rich Markdown editing
- Document management

## Configuration

PRPGen uses a simplified configuration:
- Configuration stored in `~/.prpgen/config.json`
- Main setting: Claude executable path
- Database stored in `~/.prpgen/prpgen.db`

## Development Guidelines

1. **Keep It Focused**: PRPGen is specifically for PRP management, avoid feature creep
2. **Database First**: All data should be persisted in SQLite
3. **Type Safety**: Use TypeScript strictly
4. **Error Handling**: Graceful error handling with user-friendly messages
5. **Performance**: Keep the UI responsive during AI generation

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.