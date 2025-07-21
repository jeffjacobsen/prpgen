#!/bin/bash

# Script to prepare PRPGen as a new repository
# This script helps copy the current code to a new directory for a fresh git repo

echo "Preparing PRPGen for new repository..."

# Get the target directory from user
if [ -z "$1" ]; then
    echo "Usage: ./prepare-new-repo.sh <target-directory>"
    echo "Example: ./prepare-new-repo.sh ~/code/prpgen"
    exit 1
fi

TARGET_DIR="$1"
SOURCE_DIR="$(pwd)"

# Check if target directory already exists
if [ -d "$TARGET_DIR" ]; then
    echo "Error: Target directory $TARGET_DIR already exists"
    exit 1
fi

echo "Creating new directory at $TARGET_DIR..."
mkdir -p "$TARGET_DIR"

# Copy all files except git history and node_modules
echo "Copying files..."
rsync -av \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='dist-electron' \
    --exclude='.turbo' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='frontend/dist' \
    --exclude='main/dist' \
    --exclude='tests/test-results' \
    --exclude='tests/playwright-report' \
    --exclude='.prpgen' \
    --exclude='.crystal' \
    "$SOURCE_DIR/" "$TARGET_DIR/"

# Update remaining Crystal references to PRPGen
echo "Updating remaining references..."
cd "$TARGET_DIR"

# Update any remaining crystal references in documentation
find . -name "*.md" -type f -exec sed -i '' 's/Crystal/PRPGen/g' {} \;
find . -name "*.md" -type f -exec sed -i '' 's/crystal/prpgen/g' {} \;

# Initialize new git repository
echo "Initializing new git repository..."
git init
git add .
git commit -m "Initial commit: PRPGen - Product Requirement Prompt Generator

PRPGen is a focused Electron application for creating and managing Product Requirement Prompts (PRPs) that guide AI-assisted development with Claude Code.

Forked from Crystal, with session/worktree management removed to focus solely on PRP functionality."

echo ""
echo "✅ PRPGen repository created at: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "1. cd $TARGET_DIR"
echo "2. pnpm install"
echo "3. pnpm dev"
echo "4. Create a new GitHub repository and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/prpgen.git"
echo "   git branch -M main"
echo "   git push -u origin main"