# PRPGen - Product Requirement Prompt Generator

PRPGen is a desktop application built with Tauri for creating, managing, and generating comprehensive Product Requirement Prompts (PRPs) that guide AI-assisted development with Claude Code.

## Features

- 📝 **PRP Templates**: Pre-built templates for common development patterns
- 🤖 **AI-Assisted Generation**: Generate PRPs from feature descriptions using Claude
- 📚 **Template Library**: Database-stored templates with categories and metadata
- ✏️ **Rich Markdown Editor**: Edit PRPs with live preview
- 📊 **Real-time Progress**: Track PRP generation progress with telemetry
- 🔄 **Version Control**: Track changes to PRPs over time
- 🎯 **Smart Path Detection**: Automatically finds Claude installation

## Installation

### Prerequisites

- Node.js 18 or higher
- pnpm 8+ package manager
- Rust and Cargo (latest stable)
- Claude Code CLI (optional - for AI-powered PRP generation)

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/prpgen.git
cd prpgen

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev
```

### Building

```bash
# Build for current platform
pnpm tauri build

# Build frontend only
pnpm build:frontend
```

## Usage

1. **Launch PRPGen**: Start the application
2. **Configure Claude** (optional): Go to Settings to set Claude path if not auto-detected
3. **Browse Templates**: Navigate to the Templates section
4. **Generate PRP**: Click "Generate PRP" button
5. **Select Template**: Choose from Base, React Component, Backend Service, or Bug Fix templates
6. **Input Requirements**: Provide your feature description and optional codebase path
7. **Generate**: Let Claude create a comprehensive PRP (or get a mock PRP if Claude isn't available)
8. **Edit & Save**: Review the generated PRP and save to your library

## Configuration

PRPGen stores its configuration and data in platform-specific locations:

### macOS
- Config: `~/Library/Application Support/com.prpgen.app/config.json`
- Database: `~/Library/Application Support/com.prpgen.app/prpgen.db`

### Windows
- Config: `%APPDATA%/com.prpgen.app/config.json`
- Database: `%APPDATA%/com.prpgen.app/prpgen.db`

### Linux
- Config: `~/.config/com.prpgen.app/config.json`
- Database: `~/.config/com.prpgen.app/prpgen.db`

The only configuration option is the path to your Claude executable (automatically detected in most cases).

## Development

```bash
# Run development server
pnpm tauri dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Build for production
pnpm tauri build
```

## Default Templates

PRPGen comes with four default PRP templates:

1. **Base PRP Template** - General-purpose template for any feature development
2. **React Component PRP** - Specialized for React component development
3. **Backend Service PRP** - For backend API and service development
4. **Bug Fix PRP** - For documenting and fixing bugs

To seed these templates, click "Seed Default Templates" in the Settings dialog.

## Architecture

PRPGen is built with modern web technologies:

- **Frontend**: React 19 with TypeScript and Tailwind CSS
- **Backend**: Rust with Tauri framework
- **Database**: SQLite with sqlx (Rust async driver)
- **IPC**: Type-safe Tauri commands with automatic serialization
- **Telemetry**: Built-in OTLP receiver for real-time Claude progress tracking

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Credits

PRPGen is a focused rebuild inspired by Crystal, concentrating specifically on PRP management functionality.