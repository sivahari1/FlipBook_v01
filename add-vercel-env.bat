@echo off
echo Adding DATABASE_URL to Vercel...
echo.
vercel env add DATABASE_URL production
echo.
echo Done! Now redeploy your app.
pause
