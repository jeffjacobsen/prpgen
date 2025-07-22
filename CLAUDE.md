# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PRPGen (Product Requirement Prompt Generator) is a desktop application built with Tauri and React for creating, managing, and generating comprehensive Product Requirement Prompts (PRPs) that guide AI-assisted development. PRPs provide structured templates and context for longer coding sessions with Claude Code.

## Common Development Commands

```bash
# Install dependencies
pnpm install

# Run in development mode (most common)
pnpm tauri dev

# Build commands
pnpm build:frontend     # Build frontend only
pnpm typecheck         # Run TypeScript type checking
pnpm lint              # Run ESLint
pnpm format            # Format code with Prettier

# Production builds
pnpm tauri build      # Build for current platform

# Development with custom data directory
# Useful when testing without affecting your main PRPGen data:
PRPGEN_DIR=~/.prpgen_test pnpm tauri dev
```

## High-Level Architecture

PRPGen uses Tauri's architecture with clear separation of concerns:

### Backend (Rust + Tauri)
- **SQLite database** with sqlx for async operations
- **Tauri commands** for secure IPC with automatic serialization
- **Services**:
  - `ClaudeService`: Integration with Claude CLI for PRP generation
  - `DatabaseService`: Database management and migrations
  - Template and PRP management
- **OTLP Telemetry**: Built-in receiver for real-time Claude progress tracking

### Frontend (React + TypeScript)
- **React 19** with modern hooks and patterns
- **Tailwind CSS** for responsive styling
- **Rich Markdown Editor** with syntax highlighting
- **Real-time Updates** via Tauri events
- **API Abstraction Layer** for clean backend communication

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

- **`src-tauri/src/main.rs`**: Core Tauri application entry point
- **`src-tauri/src/commands/`**: Tauri commands organized by functionality
  - `prp.rs`: PRP operations
  - `template.rs`: Template management
  - `config.rs`: Configuration handlers
  - `generation.rs`: PRP generation with Claude
- **`src-tauri/src/services/`**: Business logic services
  - `database.rs`: SQLite database management
  - `claude.rs`: Claude integration

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

### Seeding Default Templates

To populate the database with default PRP templates:

1. Start the app in development mode: `pnpm tauri dev`
2. Open Settings (gear icon in sidebar)
3. Click "Seed Default Templates" button
4. This will create 4 default templates: Base, React Component, Backend Service, Bug Fix

## Tauri Commands

Main Tauri commands:
- `get_all_prps`, `get_prp`, `create_prp`, `update_prp`, `delete_prp` - PRP operations
- `get_all_templates`, `get_template`, `create_template`, `update_template`, `delete_template` - Template management
- `get_prp_templates`, `seed_default_templates` - PRP template specific operations
- `get_config`, `update_config`, `test_claude` - Configuration management
- `generate_prp_with_claude`, `cancel_prp_generation` - AI-assisted generation

Events emitted:
- `prp-generation:progress` - Real-time PRP generation updates

## Migration from Electron to Tauri

PRPGen has been completely migrated from Electron to Tauri, bringing:
- **Better Performance**: Native Rust backend instead of Node.js
- **Smaller Bundle Size**: ~10MB vs ~100MB
- **Enhanced Security**: No exposed Node.js APIs
- **Native Feel**: Better OS integration

The migration also focused the app on its core PRP functionality:

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
- Configuration stored in app data directory:
  - macOS: `~/Library/Application Support/com.prpgen.app/config.json`
  - Windows: `%APPDATA%/com.prpgen.app/config.json`
  - Linux: `~/.config/com.prpgen.app/config.json`
- Main setting: Claude executable path
- Database stored in same directory as `prpgen.db`

## Development Guidelines

1. **Keep It Focused**: PRPGen is specifically for PRP management, avoid feature creep
2. **Database First**: All data should be persisted in SQLite
3. **Type Safety**: Use TypeScript strictly in frontend, leverage Rust's type system in backend
4. **Error Handling**: Graceful error handling with user-friendly messages
5. **Performance**: Keep the UI responsive during AI generation
6. **Async Operations**: Use Rust's async/await for all database and I/O operations
7. **Security**: Follow Tauri's security best practices, validate all IPC inputs

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.