@echo off
echo ========================================
echo FlipBook DRM - Database Setup
echo ========================================
echo.
echo This script will create all necessary database tables in your Supabase database.
echo.
pause

echo.
echo Running Prisma DB Push...
echo.
npx prisma db push

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now test registration at:
echo https://flip-book-drm.vercel.app/auth/sign-up
echo.
pause
