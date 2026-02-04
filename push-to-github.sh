#!/bin/bash
# SYGNL Dashboard Auto-Deploy Script
# Run this on your VPS to push to GitHub

echo "🚀 SYGNL Dashboard GitHub Push Script"
echo "======================================"
echo ""

# Check if git is configured
if [ -z "$(git config --global user.email)" ]; then
    echo "⚠️  Git needs configuration first"
    echo ""
    echo "Run these commands:"
    echo "  git config --global user.email 'your@email.com'"
    echo "  git config --global user.name 'Your Name'"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Navigate to project
cd /home/ubuntu/.openclaw/workspace/sygnl-dashboard

# Initialize git if needed
if [ ! -d .git ]; then
    git init
    echo "✅ Git initialized"
fi

# Add remote
git remote remove origin 2>/dev/null
git remote add origin https://github.com/nhantour/sygnl_dashboard.git

# Add all files
echo "📦 Adding files..."
git add -A

# Commit
echo "💾 Committing..."
git commit -m "Initial dashboard deployment - $(date '+%Y-%m-%d %H:%M')" --allow-empty

# Push
echo ""
echo "⬆️  Pushing to GitHub..."
echo "You may be prompted for your GitHub username and password/token"
echo ""

git push -u origin master --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Dashboard pushed to GitHub"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://vercel.com/new"
    echo "2. Import nhantour/sygnl_dashboard"
    echo "3. Add environment variables (see DEPLOY.md)"
    echo "4. Deploy and add sygnliq.com domain"
else
    echo ""
    echo "❌ Push failed"
    echo ""
    echo "Common fixes:"
    echo "1. Generate GitHub token: https://github.com/settings/tokens"
    echo "2. Use token as password when prompted"
    echo "3. Or set up SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
fi