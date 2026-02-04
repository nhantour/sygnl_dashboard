#!/bin/bash
# Quick deployment script for SYGNL Dashboard

echo "🚀 SYGNL Dashboard Deployment"
echo "=============================="
echo ""

# Build the project
echo "📦 Building..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Output: ./dist/ (1.3MB)"
    echo ""
    echo "Deployment options:"
    echo ""
    echo "1️⃣  Vercel (Recommended):"
    echo "   - Push to GitHub"
    echo "   - Import at vercel.com/new"
    echo "   - Or run: vercel --prod"
    echo ""
    echo "2️⃣  Netlify Drop (Fastest):"
    echo "   - Go to app.netlify.com/drop"
    echo "   - Drag 'dist' folder"
    echo ""
    echo "3️⃣  Cloudflare Pages:"
    echo "   - Upload 'dist' folder to Pages"
    echo ""
    echo "📖 Full guide: DEPLOY.md"
else
    echo "❌ Build failed"
    exit 1
fi