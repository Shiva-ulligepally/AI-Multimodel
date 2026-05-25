# DocuMind AI - Vercel Deployment Guide

This guide walks you through deploying the DocuMind AI monorepo to Vercel as a single, unified deployment with both frontend and backend.

## ✅ Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git configured and initialized
- [ ] All dependencies resolved (`npm install` succeeds)
- [ ] Local `.env` file created (copy from `.env.example`)

### 2. Services Setup
Create accounts and get API keys from:
- [ ] MongoDB Atlas: Get `MONGO_URI` (connection string)
- [ ] Google Cloud: Get `GEMINI_API_KEY`
- [ ] OpenAI (optional): Get `OPENAI_API_KEY`
- [ ] Cloudinary: Get `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 3. Local Testing
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Fill in environment variables in .env
# Frontend: http://localhost:5173
# Backend: http://localhost:3001

# Terminal 1: Start frontend dev server
npm run dev

# Terminal 2: Start backend
npm start

# Test health endpoint
curl http://localhost:3001/api/health
```

## 🚀 Deployment to Vercel

### Step 1: Prepare Repository

```bash
# Create git commit
git add .
git commit -m "Ready for Vercel deployment: monorepo with serverless API"

# Create GitHub repository (if not already done)
# Push to GitHub
git push origin main
```

### Step 2: Create Vercel Project

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Select "Import Git Repository"
3. Paste your GitHub repo URL
4. Vercel auto-detects:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist/`
5. Click "Import"

### Step 3: Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

Add the following variables:

```
MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/documind
GEMINI_API_KEY = your_gemini_api_key
OPENAI_API_KEY = your_openai_api_key (optional)
CLOUDINARY_CLOUD_NAME = your_cloudinary_name
CLOUDINARY_API_KEY = your_cloudinary_api_key
CLOUDINARY_API_SECRET = your_cloudinary_api_secret
NODE_ENV = production
CORS_ORIGIN = https://your-project.vercel.app
```

### Step 4: Deploy

1. Click "Deploy" button
2. Vercel automatically:
   - Installs dependencies
   - Runs `npm run build` (builds React frontend to `/dist`)
   - Creates serverless function from `/api/index.js`
   - Routes `/api/*` to the serverless backend
   - Routes `/*` to static frontend assets

3. Monitor deployment progress in the Logs tab

### Step 5: Verify Deployment

After deployment completes:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Should respond:
# {
#   "status": "Healthy",
#   "service": "DocuMind AI Multimodal Analyzer API",
#   "timestamp": "...",
#   "environment": "production"
# }

# Test frontend
# Visit https://your-project.vercel.app
```

## 📦 Architecture Details

### Frontend (React + Vite)
- **Entry Point:** `index.html`
- **Build Output:** `/dist/` (served by Vercel static)
- **API Calls:** All use relative path `/api` (no hardcoded URLs)
- **Environment:** `VITE_API_URL` defaults to `/api` for production

### Backend (Express.js - Serverless)
- **Entry Point:** `api/index.js`
- **Export:** `export default app;` (Vercel requirement)
- **No `server.listen()`:** Vercel manages the server lifecycle
- **File Storage:** Cloudinary (URLs passed between frontend/backend)
- **Database:** MongoDB (connection pooling must be configured)

### Routes Structure
```
/api/health                          GET    Health check
/api/files/upload                   POST   Upload file to Cloudinary + analyze
/api/files                          GET    List all files
/api/files/:id                      GET    Get file details (with analysis)
/api/files/:id                      DELETE Remove from Cloudinary + DB
/api/ai/chat                        POST   Chat with AI
/api/ai/chat/history                GET    Retrieve chat history
/api/ai/flashcards/:fileId          GET    Generate study flashcards
/api/analytics                      GET    Platform analytics
```

## 🔧 Troubleshooting

### Issue: 404 on `/api/*` endpoints
**Cause:** `vercel.json` routing not configured correctly
**Solution:** Verify `vercel.json` has routes section with `/api/(.*)`

### Issue: 503 Service Unavailable
**Cause:** Serverless function cold start or startup error
**Solution:** Check Vercel Function logs for startup errors (MongoDB connection, missing env vars)

### Issue: Files not uploading
**Cause:** Cloudinary credentials missing or incorrect
**Solution:** Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` in Vercel env vars

### Issue: AI responses not working
**Cause:** Missing API keys
**Solution:** Verify `GEMINI_API_KEY` or `OPENAI_API_KEY` in Vercel env vars (fallback to mock will work)

### Issue: Frontend API calls fail with CORS error
**Cause:** `CORS_ORIGIN` not matching deployment URL
**Solution:** Update `CORS_ORIGIN` in Vercel env to `https://your-project.vercel.app`

## 📝 Post-Deployment

### Monitor Production
- Check Vercel Dashboard for function logs
- Monitor MongoDB connection usage
- Review Cloudinary storage usage

### Enable Custom Domain
1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS (instructions provided by Vercel)

### Set Up Monitoring
Consider adding:
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Database monitoring (MongoDB Atlas)

## 🔐 Security Checklist

- [ ] All API keys stored in Vercel environment variables (not in code)
- [ ] `.env.local` added to `.gitignore`
- [ ] CORS restricted to your domain (`CORS_ORIGIN`)
- [ ] Rate limiting enabled (15 min window, 100 requests per IP)
- [ ] Helmet.js enabled (security headers)
- [ ] MongoDB credentials use strong passwords

## 📞 Support

For issues:
1. Check Vercel Function Logs
2. Review MongoDB connection string format
3. Verify Cloudinary credentials
4. Check CORS_ORIGIN matches your domain
5. Ensure all environment variables are set

---

**Deployment successful! Your DocuMind AI instance is now live on Vercel.** 🎉
