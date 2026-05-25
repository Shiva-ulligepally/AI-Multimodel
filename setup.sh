#!/bin/bash

# DocuMind AI - Automated Setup Script

echo "🚀 DocuMind AI - Setting up your development environment..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION detected"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm $NPM_VERSION detected"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install root dependencies"
    exit 1
fi

echo "✅ Root dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"
cd ..
echo ""

# Verify .env files
echo "🔍 Checking environment configuration..."

if [ ! -f ".env" ]; then
    echo "⚠️  Environment .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your API keys"
fi

echo "✅ Environment files configured"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Setup Complete! Your DocuMind AI is ready to run"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🚀 To start the application:"
echo ""
echo "   Option 1 (Run both servers at once):"
echo "   → npm run dev:all"
echo ""
echo "   Option 2 (Run separately in two terminals):"
echo "   Terminal 1: npm run dev:backend"
echo "   Terminal 2: npm run dev"
echo ""
echo "📱 Access the application:"
echo "   → http://localhost:5173"
echo ""
echo "📖 For more information, check STARTUP_GUIDE.md"
echo "═══════════════════════════════════════════════════════════════"
