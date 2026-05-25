@echo off
REM DocuMind AI - Vercel Deployment Helper Script for Windows

setlocal enabledelayedexpansion

echo.
echo ======================================================
echo 🚀 DocuMind AI - Vercel Deployment Helper
echo ======================================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Vercel CLI is not installed.
    echo.
    echo Install Vercel CLI with:
    echo   npm install -g vercel
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('vercel --version') do set VERCEL_VERSION=%%i
echo ✅ Vercel CLI detected: %VERCEL_VERSION%
echo.

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Initialize with:
    echo   git init
    echo   git add .
    echo   git commit -m "Initial commit"
    echo.
    pause
    exit /b 1
)

echo ✅ Git repository found
echo.

REM Menu
echo Choose deployment option:
echo.
echo   1) Preview Deploy (test before production)
echo   2) Production Deploy (to custom domain)
echo   3) Set Environment Variables
echo   4) View Deployment Status
echo   5) View Recent Logs
echo   6) Rollback to Previous Deployment
echo.
set /p OPTION="Enter option (1-6): "

if "%OPTION%"=="1" (
    echo.
    echo 📋 Starting preview deployment...
    echo.
    call vercel
) else if "%OPTION%"=="2" (
    echo.
    echo 📋 Starting production deployment...
    echo.
    call vercel --prod
) else if "%OPTION%"=="3" (
    echo.
    echo 🔐 Setting environment variables...
    echo.
    echo.
    echo Visit https://vercel.com/dashboard/project/settings/environment-variables
    echo and add these variables:
    echo.
    echo   - MONGO_URI
    echo   - GEMINI_API_KEY
    echo   - OPENAI_API_KEY
    echo   - CLOUDINARY_CLOUD_NAME (optional)
    echo   - CLOUDINARY_API_KEY (optional)
    echo   - CLOUDINARY_API_SECRET (optional)
    echo   - CORS_ORIGIN
    echo.
    echo Or use vercel CLI:
    echo   vercel env add MONGO_URI
    echo   vercel env add GEMINI_API_KEY
    echo   etc...
    echo.
) else if "%OPTION%"=="4" (
    echo.
    echo 📊 Deployment Status:
    echo.
    call vercel list
    echo.
) else if "%OPTION%"=="5" (
    echo.
    echo 📜 Recent Deployments:
    echo.
    call vercel list
    echo.
    echo To view logs for a specific deployment, use:
    echo   vercel logs --follow
    echo.
) else if "%OPTION%"=="6" (
    echo.
    echo ⏮️  Rollback to Previous Deployment:
    echo.
    call vercel rollback
    echo.
) else (
    echo ❌ Invalid option
    pause
    exit /b 1
)

echo.
echo ======================================================
echo ✅ Done!
echo ======================================================
echo.
echo 📖 For more help, see VERCEL_DEPLOYMENT.md
echo.

pause
