#!/bin/bash

# 🚀 FlipBook DRM - Quick Deployment Script
# This script will help you deploy your app to GitHub and Vercel

echo "🚀 FlipBook DRM - Production Deployment"
echo "======================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the flipbook-drm directory"
    exit 1
fi

echo "📋 Current directory: $(pwd)"
echo ""

# Step 1: Git Setup
echo "📝 Step 1: Setting up Git repository..."

if [ ! -d ".git" ]; then
    echo "   Initializing Git repository..."
    git init
else
    echo "   ✅ Git repository already exists"
fi

# Add all files
echo "   Adding files to Git..."
git add .

# Commit
echo "   Creating commit..."
git commit -m "Production deployment: FlipBook DRM with real analytics - $(date)"

echo "✅ Git setup complete!"
echo ""

# Step 2: GitHub Repository
echo "📝 Step 2: GitHub Repository Setup"
echo "   Please create a GitHub repository manually:"
echo "   1. Go to https://github.com/new"
echo "   2. Repository name: flipbook-drm-production"
echo "   3. Make it Public"
echo "   4. Don't initialize with README"
echo "   5. Click 'Create repository'"
echo ""

read -p "   Have you created the GitHub repository? (y/n): " github_created

if [ "$github_created" = "y" ] || [ "$github_created" = "Y" ]; then
    read -p "   Enter your GitHub username: " github_username
    
    echo "   Adding GitHub remote..."
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/$github_username/flipbook-drm-production.git"
    
    echo "   Pushing to GitHub..."
    git branch -M main
    git push -u origin main
    
    echo "✅ Code pushed to GitHub!"
    echo "   Repository: https://github.com/$github_username/flipbook-drm-production"
else
    echo "   Please create the GitHub repository first, then run this script again."
    exit 1
fi

echo ""

# Step 3: Vercel Deployment
echo "📝 Step 3: Vercel Deployment"
echo "   Checking if Vercel CLI is installed..."

if ! command -v vercel &> /dev/null; then
    echo "   Installing Vercel CLI..."
    npm install -g vercel
else
    echo "   ✅ Vercel CLI already installed"
fi

echo "   Deploying to Vercel..."
echo "   (You may need to login to Vercel if this is your first time)"

vercel --prod

echo ""
echo "🎉 Deployment Complete!"
echo "========================"
echo ""
echo "Your FlipBook DRM application is now live!"
echo ""
echo "🔗 GitHub Repository: https://github.com/$github_username/flipbook-drm-production"
echo "🌐 Live Application: Check the Vercel output above for your URL"
echo ""
echo "✅ Features Available Immediately:"
echo "   • Professional landing page with animations"
echo "   • Document upload and viewing (session-based)"
echo "   • Real analytics tracking"
echo "   • Email sharing system"
echo "   • DRM security features"
echo "   • Mobile responsive design"
echo ""
echo "🔧 Optional: Add Database for Persistence"
echo "   • Visit your Vercel dashboard"
echo "   • Add DATABASE_URL environment variable"
echo "   • Follow the Supabase setup guide in SUPABASE_VERCEL_SETUP.md"
echo ""
echo "🎯 Test Your Deployment:"
echo "   1. Visit your live URL"
echo "   2. Sign up for an account"
echo "   3. Upload a PDF document"
echo "   4. Check analytics at /analytics"
echo "   5. Try sharing a document"
echo ""
echo "Happy deploying! 🚀"