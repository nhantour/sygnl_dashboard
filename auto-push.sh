#!/bin/bash
# Auto-deploy script - I can run this anytime to push updates

cd /home/ubuntu/.openclaw/workspace/sygnl-dashboard

# Add all changes
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "No changes to push"
    exit 0
fi

# Commit with timestamp
git commit -m "Update: $(date '+%Y-%m-%d %H:%M UTC') - $1"

# Push to GitHub
git push origin master

if [ $? -eq 0 ]; then
    echo "✅ Pushed to GitHub successfully"
    echo "Vercel will auto-deploy if connected"
else
    echo "❌ Push failed"
    exit 1
fi