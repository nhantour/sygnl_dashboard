#!/bin/bash
# Auto-deploy script - I can run this anytime to push updates
# Usage: ./auto-push.sh "Description of changes"

cd /home/ubuntu/.openclaw/workspace/sygnl-dashboard

# Use stored credentials (configured during setup)
git config credential.helper store

# Add all changes
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "No changes to push"
    exit 0
fi

# Commit with timestamp and description
DESCRIPTION=${1:-"Automated update"}
git commit -m "Update: $(date '+%Y-%m-%d %H:%M UTC') - $DESCRIPTION"

# Push to GitHub (token handled by credential helper)
git push origin master

if [ $? -eq 0 ]; then
    echo "✅ Pushed to GitHub successfully"
    echo "Vercel will auto-deploy if connected"
    echo "https://github.com/nhantour/sygnl_dashboard/commit/$(git rev-parse --short HEAD)"
else
    echo "❌ Push failed - check credentials"
    exit 1
fi