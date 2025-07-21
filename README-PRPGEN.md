# PRPGen - Product Requirement Prompt Generator

PRPGen is an Electron desktop application for creating, managing, and generating comprehensive Product Requirement Prompts (PRPs) that guide AI-assisted development with Claude Code.

## Features

- 📝 **PRP Templates**: Pre-built templates for common development patterns
- 🤖 **AI-Assisted Generation**: Generate PRPs from feature descriptions
- 📚 **Template Library**: Database-stored templates with categories and metadata
- ✏️ **Rich Markdown Editor**: Edit PRPs with live preview
- 📊 **Real-time Progress**: Track PRP generation progress
- 🔄 **Version Control**: Track changes to PRPs over time

## Installation

### Prerequisites

- Node.js 18 or higher
- pnpm package manager
- Claude Code CLI (for PRP generation features)

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/prpgen.git
cd prpgen

# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

### Building

```bash
# Build for macOS
pnpm build:mac

# Build for Linux
pnpm build:linux

# Build for Windows (coming soon)
pnpm build:win
```

## Usage

1. **Launch PRPGen**: Start the application
2. **Browse Templates**: Navigate to the Templates section
3. **Generate PRP**: Click "Generate PRP" button
4. **Select Template**: Choose from Base, React Component, Backend Service, or Bug Fix templates
5. **Input Requirements**: Provide your feature description
6. **Generate**: Let AI create a comprehensive PRP
7. **Edit & Save**: Customize the generated PRP and save to your library

## Configuration

PRPGen stores its configuration and data in:
- Config: `~/.prpgen/config.json`
- Database: `~/.prpgen/prpgen.db`

The only required configuration is the path to your Claude executable (if not in PATH).

## Development

```bash
# Run development server
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run tests
pnpm test
```

## Migrating Templates

To populate the database with default PRP templates:

1. Start the app: `pnpm dev`
2. Open DevTools (Cmd+Option+I)
3. Run the script from `/scripts/migrate-templates-simple.js`

## License

MIT License - see LICENSE file for details

## Credits

PRPGen is derived from PRPGen, focusing specifically on PRP management functionality.