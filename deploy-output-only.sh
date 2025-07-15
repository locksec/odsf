#!/bin/bash

# Deploy script for GitHub Pages (output files only)
# This script builds locally and deploys only the output files to GitHub Pages
# Your JSON source file remains private and is never committed

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting GitHub Pages deployment (output only)...${NC}"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "build-odsf.js" ]; then
    echo -e "${RED}Error: build-odsf.js not found. Make sure you're in the project root.${NC}"
    exit 1
fi

# Check if JSON file exists
if ! ls odsf-framework-v*.json 1> /dev/null 2>&1; then
    echo -e "${RED}Error: No framework JSON file found.${NC}"
    exit 1
fi

# Save the current directory
PROJECT_DIR=$(pwd)

# Clean output directory first
echo -e "\n${YELLOW}Step 1/5:${NC} Cleaning output directory..."
npm run clean

# Build the project locally
echo -e "\n${YELLOW}Step 2/5:${NC} Building ODSF locally..."
npm run build

# Check if output directory exists
if [ ! -d "output" ]; then
    echo -e "${RED}Error: Output directory not found. Build may have failed.${NC}"
    exit 1
fi

# Create a completely separate directory for deployment
DEPLOY_DIR=$(mktemp -d)
echo -e "\n${YELLOW}Step 3/5:${NC} Creating deployment directory..."
echo "Directory: $DEPLOY_DIR"

# Initialize a new git repo in the deployment directory
cd "$DEPLOY_DIR"
git init -q
git checkout -q -b gh-pages

# Copy output files
cp -r "$PROJECT_DIR/output/"* .

# Create CNAME file
echo "odsf.psysecure.com" > CNAME
echo "Added CNAME file for domain: odsf.psysecure.com"

# Add all files
git add -A

# Commit changes
echo -e "\n${YELLOW}Step 4/5:${NC} Committing changes..."
git commit -q -m "Deploy ODSF to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')"

# Add remote
git remote add origin git@github.com:locksec/odsf.git

# Push to remote
echo -e "\n${YELLOW}Step 5/5:${NC} Pushing to GitHub..."
git push origin gh-pages --force

# Go back to project directory
cd "$PROJECT_DIR"

# Clean up
rm -rf "$DEPLOY_DIR"

echo -e "\n${GREEN}Deployment complete!${NC}"
echo "=================================================="
echo -e "Your site will be available at: ${BLUE}https://odsf.psysecure.com${NC}"
echo -e "\n${YELLOW}Note:${NC} Your framework JSON file remains private and was never committed to git."