@echo off
echo Starting Grand Horizon Hotel Development Server...
echo.
set NODE_ENV=development
npx tsx server/index.ts
pause
