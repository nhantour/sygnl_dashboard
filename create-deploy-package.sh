#!/bin/bash
# Complete deployment package for Vercel

echo "📦 Creating Vercel deployment package..."

# Create deploy package
tar -czf /tmp/sygnl-vercel-deploy.tar.gz \
  dist/ \
  package.json \
  next.config.js \
  tailwind.config.js \
  postcss.config.js \
  README.md \
  DEPLOY.md

echo "✅ Package created: /tmp/sygnl-vercel-deploy.tar.gz"
echo ""
echo "Deployment Instructions:"
echo "========================"
echo ""
echo "Option 1: Vercel CLI (Recommended)"
echo "-----------------------------------"
echo "1. Download package:"
echo "   scp ubuntu@your-vps:/tmp/sygnl-vercel-deploy.tar.gz ."
echo ""
echo "2. Extract and deploy:"
echo "   tar -xzf sygnl-vercel-deploy.tar.gz"
echo "   cd sygnl-dashboard"
echo "   npm i -g vercel"
echo "   vercel login"
echo "   vercel --prod"
echo ""
echo "3. Add environment variables in Vercel dashboard:"
echo "   ALPACA_API_KEY=PKMP5VADWPMYNGKPZUIZPZTFAX"
echo "   ALPACA_SECRET_KEY=CWEhv5aS2sT85e4kL3uzyxuijhneeGGNJxF6qyjDzf2k"
echo ""
echo "Option 2: Vercel Web Interface"
echo "-------------------------------"
echo "1. Go to https://vercel.com/new"
echo "2. Choose 'Import Git Repository'"
echo "3. After import fails, choose 'Upload' instead"
echo "4. Upload the dist/ folder from the extracted package"
echo ""
echo "Password: sygnl2026"
