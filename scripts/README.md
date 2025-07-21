# Scripts Directory

This directory contains build and maintenance scripts for the PRPGen application.

## generate-notices.js

Generates a NOTICES file containing all third-party licenses for dependencies included in the PRPGen distribution.

### Usage

```bash
# Generate NOTICES file
pnpm run generate-notices

# Or run directly
node scripts/generate-notices.js
```

### How it works

1. Scans all node_modules directories in the workspace
2. Collects license information from LICENSE files and package.json
3. Excludes development-only dependencies that aren't distributed
4. Creates a NOTICES file in the project root

### When to run

- Automatically runs during `pnpm run build:mac` and `pnpm run release:mac`
- Should be run whenever dependencies change
- CI/CD runs this in the license-compliance workflow

### License compliance

The script helps ensure PRPGen complies with open source license requirements by:
- Including all third-party license texts in distributions
- Identifying packages with missing license information
- Supporting the license-compliance GitHub workflow