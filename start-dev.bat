@echo off
echo ========================================
echo  Grand Horizon Hotel - Development Server
echo ========================================
echo.
echo Loading environment from .env file...
echo.
set NODE_ENV=development
npx tsx server/index.ts
echo.
echo Server stopped.
pause
