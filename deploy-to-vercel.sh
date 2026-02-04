#!/bin/bash
# SYGNL Dashboard Deployment Script
# Pushes to GitHub and triggers Vercel deployment

set -e

echo "🚀 SYGNL Dashboard Deployment"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: GITHUB_TOKEN not set${NC}"
    echo ""
    echo "To fix this, either:"
    echo "1. Set environment variable: export GITHUB_TOKEN=your_token_here"
    echo "2. Or create a token at: https://github.com/settings/tokens"
    echo "   Required scopes: repo"
    echo ""
    echo "Then run: GITHUB_TOKEN=your_token ./deploy-to-vercel.sh"
    exit 1
fi

# Navigate to project
PROJECT_DIR="/home/ubuntu/.openclaw/workspace/sygnl-dashboard"
cd "$PROJECT_DIR"

echo "📦 Building dashboard..."
npm run build

echo ""
echo "📁 Configuring git..."
git config user.email "heykofta@gmail.com"
git config user.name "Kofta"

# Set remote with token
GITHUB_USER="nhantour"
REPO_NAME="sygnl_dashboard"
REMOTE_URL="https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo "🔄 Setting up remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"

echo ""
echo "⬆️  Pushing to GitHub..."
if git push -u origin master --force; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
else
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi

echo ""
echo "🌐 Vercel Deployment"
echo "===================="
echo ""
echo -e "${GREEN}Your code is now on GitHub.${NC}"
echo ""
echo "Next steps for Vercel:"
echo ""
echo "1. Go to https://vercel.com/new"
echo "2. Import repository: ${GITHUB_USER}/${REPO_NAME}"
echo "3. Framework: Next.js"
echo "4. Build Command: npm run build"
echo "5. Output Directory: dist"
echo "6. Add Environment Variables:"
echo "   - ALPACA_API_KEY=PKMP5VADWPMYNGKPZUIZPZTFAX"
echo "   - ALPACA_SECRET_KEY=CWEhv5aS2sT85e4kL3uzyxuijhneeGGNJxF6qyjDzf2k"
echo "7. Click Deploy"
echo ""
echo "Or use Vercel CLI:"
echo "  vercel --prod"
echo ""
echo -e "${GREEN}✅ Deployment script complete!${NC}"
