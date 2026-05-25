@echo off
REM DocuMind AI - Automated Setup Script for Windows

echo.
echo 🚀 DocuMind AI - Setting up your development environment...
echo.

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js v16+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detected

REM Check for npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% detected
echo.

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

echo ✅ Root dependencies installed
echo.

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)

echo ✅ Frontend dependencies installed
cd ..
echo.

REM Verify .env files
echo 🔍 Checking environment configuration...

if not exist ".env" (
    echo ⚠️  Environment .env file not found. Creating from .env.example...
    copy .env.example .env
    echo ⚠️  Please update .env with your API keys
) else (
    echo ✅ Environment .env file exists
)

echo ✅ Environment files configured
echo.

REM Summary
echo ═══════════════════════════════════════════════════════════════
echo ✅ Setup Complete! Your DocuMind AI is ready to run
echo ═══════════════════════════════════════════════════════════════
echo.
echo 🚀 To start the application:
echo.
echo    Option 1 (Run both servers at once):
echo    ^> npm run dev:all
echo.
echo    Option 2 (Run separately in two terminals):
echo    Terminal 1: npm run dev:backend
echo    Terminal 2: npm run dev
echo.
echo 📱 Access the application:
echo    ^> http://localhost:5173
echo.
echo 📖 For more information, check STARTUP_GUIDE.md
echo ═══════════════════════════════════════════════════════════════
echo.

pause
