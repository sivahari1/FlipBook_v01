@echo off
echo Running Prisma Migrations on Production Database...
echo.
echo Make sure your .env file has the correct DATABASE_URL
echo.
pause

npx prisma migrate deploy

echo.
echo Migration complete!
pause
