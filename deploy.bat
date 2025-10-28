@echo off
REM 🚀 FlipBook DRM - Quick Deployment Script for Windows
REM This script will help you deploy your app to GitHub and Vercel

echo 🚀 FlipBook DRM - Production Deployment
echo =======================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the flipbook-drm directory
    pause
    exit /b 1
)

echo 📋 Current directory: %CD%
echo.

REM Step 1: Git Setup
echo 📝 Step 1: Setting up Git repository...

if not exist ".git" (
    echo    Initializing Git repository...
    git init
) else (
    echo    ✅ Git repository already exists
)

REM Add all files
echo    Adding files to Git...
git add .

REM Commit
echo    Creating commit...
git commit -m "Production deployment: FlipBook DRM with real analytics - %date% %time%"

echo ✅ Git setup complete!
echo.

REM Step 2: GitHub Repository
echo 📝 Step 2: GitHub Repository Setup
echo    Please create a GitHub repository manually:
echo    1. Go to https://github.com/new
echo    2. Repository name: flipbook-drm-production
echo    3. Make it Public
echo    4. Don't initialize with README
echo    5. Click 'Create repository'
echo.

set /p github_created="   Have you created the GitHub repository? (y/n): "

if /i "%github_created%"=="y" (
    set /p github_username="   Enter your GitHub username: "
    
    echo    Adding GitHub remote...
    git remote remove origin 2>nul
    git remote add origin "https://github.com/!github_username!/flipbook-drm-production.git"
    
    echo    Pushing to GitHub...
    git branch -M main
    git push -u origin main
    
    echo ✅ Code pushed to GitHub!
    echo    Repository: https://github.com/!github_username!/flipbook-drm-production
) else (
    echo    Please create the GitHub repository first, then run this script again.
    pause
    exit /b 1
)

echo.

REM Step 3: Vercel Deployment
echo 📝 Step 3: Vercel Deployment
echo    Checking if Vercel CLI is installed...

where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo    Installing Vercel CLI...
    npm install -g vercel
) else (
    echo    ✅ Vercel CLI already installed
)

echo    Deploying to Vercel...
echo    (You may need to login to Vercel if this is your first time)

vercel --prod

echo.
echo 🎉 Deployment Complete!
echo ========================
echo.
echo Your FlipBook DRM application is now live!
echo.
echo 🔗 GitHub Repository: https://github.com/%github_username%/flipbook-drm-production
echo 🌐 Live Application: Check the Vercel output above for your URL
echo.
echo ✅ Features Available Immediately:
echo    • Professional landing page with animations
echo    • Document upload and viewing (session-based)
echo    • Real analytics tracking
echo    • Email sharing system
echo    • DRM security features
echo    • Mobile responsive design
echo.
echo 🔧 Optional: Add Database for Persistence
echo    • Visit your Vercel dashboard
echo    • Add DATABASE_URL environment variable
echo    • Follow the Supabase setup guide in SUPABASE_VERCEL_SETUP.md
echo.
echo 🎯 Test Your Deployment:
echo    1. Visit your live URL
echo    2. Sign up for an account
echo    3. Upload a PDF document
echo    4. Check analytics at /analytics
echo    5. Try sharing a document
echo.
echo Happy deploying! 🚀
pause