#!/bin/bash

# Deploy script for GitHub Pages (output files only)
# This script builds locally and deploys only the output files to GitHub Pages
# Your JSON source file remains private and is never committed

set -e

echo "🚀 Starting GitHub Pages deployment (output only)..."

# Check if we're in the right directory
if [ ! -f "build-odsf.js" ]; then
    echo "❌ Error: build-odsf.js not found. Make sure you're in the project root."
    exit 1
fi

# Check if JSON file exists
if ! ls odsf-framework-v*.json 1> /dev/null 2>&1; then
    echo "❌ Error: No framework JSON file found."
    exit 1
fi

# Build the project locally
echo "🔨 Building ODSF locally..."
npm run build

# Check if output directory exists
if [ ! -d "output" ]; then
    echo "❌ Error: Output directory not found. Build may have failed."
    exit 1
fi

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Using temporary directory: $TEMP_DIR"

# Copy output files to temp directory
cp -r output/* "$TEMP_DIR/"

# Create CNAME file
echo "odsf.psysecure.com" > "$TEMP_DIR/CNAME"
echo "🌐 Added CNAME file for domain: odsf.psysecure.com"

# Switch to gh-pages branch
echo "🔄 Switching to gh-pages branch..."
if git show-ref --verify --quiet refs/heads/gh-pages; then
    git checkout gh-pages
    # Remove all existing files
    git rm -rf . 2>/dev/null || true
else
    git checkout --orphan gh-pages
    # Remove all files from git tracking
    git rm -rf . 2>/dev/null || true
    # Clean the working directory
    rm -rf * 2>/dev/null || true
    rm -rf .* 2>/dev/null || true
fi

# Copy files from temp directory
cp -r "$TEMP_DIR"/* .

# Add all files
git add -A

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy ODSF to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')" || {
    echo "⚠️  No changes to commit"
    git checkout "$CURRENT_BRANCH"
    rm -rf "$TEMP_DIR"
    exit 0
}

# Push to remote
echo "📤 Pushing to GitHub..."
git push origin gh-pages --force

# Switch back to original branch
git checkout "$CURRENT_BRANCH"

# Clean up
rm -rf "$TEMP_DIR"

echo "✅ Deployment complete!"
echo ""
echo "Your site will be available at https://odsf.psysecure.com"
echo ""
echo "Note: Your framework JSON file remains private and was never committed to git."