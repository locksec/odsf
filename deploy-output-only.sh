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

# Save the current directory
PROJECT_DIR=$(pwd)

# Build the project locally
echo "🔨 Building ODSF locally..."
npm run build

# Check if output directory exists
if [ ! -d "output" ]; then
    echo "❌ Error: Output directory not found. Build may have failed."
    exit 1
fi

# Create a completely separate directory for deployment
DEPLOY_DIR=$(mktemp -d)
echo "📁 Creating deployment directory: $DEPLOY_DIR"

# Initialize a new git repo in the deployment directory
cd "$DEPLOY_DIR"
git init
git checkout -b gh-pages

# Copy output files
cp -r "$PROJECT_DIR/output/"* .

# Create CNAME file
echo "odsf.psysecure.com" > CNAME
echo "🌐 Added CNAME file for domain: odsf.psysecure.com"

# Add all files
git add -A

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy ODSF to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')"

# Add remote
git remote add origin git@github.com:locksec/odsf.git

# Push to remote
echo "📤 Pushing to GitHub..."
git push origin gh-pages --force

# Go back to project directory
cd "$PROJECT_DIR"

# Clean up
rm -rf "$DEPLOY_DIR"

echo "✅ Deployment complete!"
echo ""
echo "Your site will be available at https://odsf.psysecure.com"
echo ""
echo "Note: Your framework JSON file remains private and was never committed to git."