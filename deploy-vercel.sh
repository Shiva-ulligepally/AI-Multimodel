#!/bin/bash

# DocuMind AI - Vercel Deployment Helper Script

echo ""
echo "======================================================"
echo "🚀 DocuMind AI - Vercel Deployment Helper"
echo "======================================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo ""
    echo "Install Vercel CLI with:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

VERCEL_VERSION=$(vercel --version)
echo "✅ Vercel CLI detected: $VERCEL_VERSION"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Initialize with:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    echo ""
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Menu
echo "Choose deployment option:"
echo ""
echo "  1) Preview Deploy (test before production)"
echo "  2) Production Deploy (to custom domain)"
echo "  3) Set Environment Variables"
echo "  4) View Deployment Status"
echo "  5) View Recent Logs"
echo "  6) Rollback to Previous Deployment"
echo ""
read -p "Enter option (1-6): " OPTION

case $OPTION in
  1)
    echo ""
    echo "📋 Starting preview deployment..."
    echo ""
    vercel
    ;;
  
  2)
    echo ""
    echo "📋 Starting production deployment..."
    echo ""
    vercel --prod
    ;;
  
  3)
    echo ""
    echo "🔐 Setting environment variables..."
    echo ""
    echo "Enter your variables (or press Ctrl+C to cancel):"
    echo ""
    
    read -p "MongoDB URI: " MONGO_URI
    if [ ! -z "$MONGO_URI" ]; then
      vercel env add MONGO_URI
    fi
    
    read -p "Gemini API Key: " GEMINI_KEY
    if [ ! -z "$GEMINI_KEY" ]; then
      vercel env add GEMINI_API_KEY
    fi
    
    read -p "OpenAI API Key: " OPENAI_KEY
    if [ ! -z "$OPENAI_KEY" ]; then
      vercel env add OPENAI_API_KEY
    fi
    
    read -p "CORS Origin (e.g., https://domain.com): " CORS
    if [ ! -z "$CORS" ]; then
      vercel env add CORS_ORIGIN
    fi
    
    echo ""
    echo "✅ Environment variables configured"
    echo ""
    ;;
  
  4)
    echo ""
    echo "📊 Deployment Status:"
    echo ""
    vercel list
    echo ""
    ;;
  
  5)
    echo ""
    echo "📜 Recent Deployments & Logs:"
    echo ""
    vercel logs --follow
    echo ""
    ;;
  
  6)
    echo ""
    echo "⏮️  Rollback to Previous Deployment:"
    echo ""
    vercel rollback
    echo ""
    ;;
  
  *)
    echo "❌ Invalid option"
    exit 1
    ;;
esac

echo ""
echo "======================================================"
echo "✅ Done!"
echo "======================================================"
echo ""
echo "📖 For more help, see VERCEL_DEPLOYMENT.md"
echo ""
