# DocuMind AI — Multimodal Intelligent Analyzer 🤖📄🖼️

DocuMind AI is a professional, production-ready multimodal AI platform optimized for **Vercel serverless deployment**. Extract, analyze, and converse about documents, images with OCR, and get AI-powered insights using Google Gemini or OpenAI APIs.

**Now refactored for enterprise deployment:** Monorepo architecture with serverless Express backend, Cloudinary cloud storage, and MongoDB connections with automatic fallback to JSON mock database.

---

## 🏗️ Architecture Overview

### Monorepo Structure
```
/
├── src/                      # React + Vite frontend
│   ├── pages/               # Dashboard, DocAnalysis, ImageAnalysis, AIChat
│   ├── services/            # API client (axios)
│   ├── sockets/             # Socket service (removed for serverless)
│   └── layouts/             # Main layout component
├── api/                      # Express backend (Vercel-compatible)
│   ├── index.js            # Main serverless entry point (exports app)
│   ├── config/             # AI, Database, Cloudinary configs
│   ├── routes/             # /api/files, /api/ai, /api/analytics
│   ├── controllers/        # Business logic
│   ├── models/             # MongoDB schemas
│   ├── middleware/         # Upload handling (memory storage)
│   └── services/           # Document parsing, OCR, LLM calls
├── public/                  # Static assets
├── package.json            # Full monorepo dependencies
├── vite.config.js          # Frontend build config
├── vercel.json            # Vercel deployment config
└── .env.example           # Environment template
```

### Tech Stack
- **Frontend:** React 19 + Vite + React Router + Tailwind CSS + Framer Motion
- **Backend:** Express.js (serverless export, no `server.listen()`)
- **Database:** MongoDB (Mongoose) + JSON fallback for demo mode
- **File Storage:** Cloudinary (replaces local disk storage)
- **AI Engines:** 
  - Primary: Google Gemini 2.5-flash
  - Secondary: OpenAI GPT-4o-mini
  - Tertiary: Mock generators (always works offline)
- **Document Processing:** pdf-parse, officeparser, Tesseract.js OCR
- **Production Middleware:** helmet, compression, CORS, rate-limiting

---

## 🚀 Deployment

### Prerequisites
1. **Node.js 18+** - Required for Vercel deployment
2. **MongoDB Atlas Account** - For database (or use JSON mock)
3. **Cloudinary Account** - For cloud file storage (free tier available)
4. **AI API Keys:**
   - [Google Gemini API](https://aistudio.google.com/app/apikey) - Free tier: 60 requests/minute
   - [OpenAI API](https://platform.openai.com/account/api-keys) - Optional fallback
5. **Vercel Account** - Free tier supports deployment

### Local Development

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Fill in your API keys in .env
# MONGO_URI=mongodb+srv://...
# GEMINI_API_KEY=...
# CLOUDINARY_CLOUD_NAME=...

# Start frontend dev server (http://localhost:5173)
npm run dev

# Start backend in another terminal (http://localhost:3001)
npm start

# Frontend will proxy API calls to http://localhost:3001/api
```

### Vercel Deployment (One Single Deployment)

```bash
# 1. Push to Git repository
git add .
git commit -m "Vercel monorepo deployment"
git push origin main

# 2. Import repository in Vercel dashboard
# https://vercel.com/new

# 3. Configure Environment Variables in Vercel dashboard:
# Settings → Environment Variables
# Add: MONGO_URI, GEMINI_API_KEY, OPENAI_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NODE_ENV=production

# 4. Deploy! ✨
# Vercel automatically:
# - Runs: npm run build (builds frontend to /dist)
# - Runs: api/index.js (serverless function handler)
# - Routes /api/* to serverless function
# - Routes /* to static /dist files
```

**Your app will be live at:** https://your-project.vercel.app

---

## 📚 Primary Features

### 1. Dashboard
- Real-time analytics of uploaded documents and images
- Quick access to recently processed files
- Semantic topic cloud visualization
- Global platform statistics

### 2. Document Analysis
- Upload PDF, DOCX, PPTX, TXT files
- Extract and view raw text with OCR support
- **AI Features:**
  - Executive summary generation
  - Key points extraction (bullet points)
  - Study flashcards (auto-generated)
  - Contextual document chat
  - Sentiment analysis
- Search and highlight capabilities

### 3. Image Analysis
- Upload PNG, JPG images
- **Optical Character Recognition (OCR)** using Tesseract.js
- Word-level bounding box visualization (hover to highlight)
- **AI Features:**
  - Image caption generation
  - Object detection
  - OCR text analysis
  - Image context chat
  - Sentiment scoring

### 4. AI Chat
- Chat with context about analyzed documents/images
- Multi-turn conversation history
- Message streaming with LLM provider fallback
- Auto-suggestions based on file content
- Mock responses when offline (always works)
* Controls for play/pause, volume range, audio speed rates (0.5x to 2.0x), and waveform timeline zoom.
* **Interactive dialogue seek triggers**: Scroll segments complete with timestamp anchors and speaker tagging (Speaker 1 vs Speaker 2). Clicking any dialogue seeks the WaveSurfer audio timeline directly to that starting timestamp!
* Dial bars indicating voice emotions (calmness index, energetic levels, professional stances).

### 5. Live WebSocket Microphone Listening
* Web Audio API captures microphone stream buffers, transforming Float32 arrays to Int16 PCM chunks for optimal latency.
* SVG Voice activity soundwave pulsing height adapts dynamically to the speaker's vocal amplitude!
* Real-time Socket.io channels stream audio to the backend, returning rolling subtitles, flickering keyword detected clouds, and live AI meeting notes.

---

## 🛠️ Technology Stack

* **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion, WaveSurfer.js, Socket.io-client, Axios, Lucide React, React Router DOM.
* **Backend**: Node.js, Express.js, Socket.io, Multer, Mongoose, Tesseract.js, pdf-parse, officeparser.
* **AI Inferences**: Google Gemini API (`gemini-1.5-flash`), OpenAI API (`gpt-4o-mini`), OpenAI Whisper (`whisper-1`).
* **Database**: MongoDB (Mongoose ORM).

---

## 📂 Project Directory Structure

```
e:/GENAI/AI_MULTIMODEL/
 ├── package.json              <-- Frontend package.json (Vite React App)
 ├── vite.config.js
 ├── tailwind.config.js
 ├── postcss.config.js
 ├── index.html
 ├── src/                      <-- Frontend React Code
 │    ├── assets/              <-- SVG assets, animations, background grids
 │    ├── components/          <-- Sidebar, DynamicUpload, AudioVisualizer, WaveformPlayer, ChatWindow, DashboardCards, KeywordBadges
 │    ├── pages/               <-- Dashboard, DocAnalysis, AudioAnalysis, ImageAnalysis, LiveListening, ChatPage, AnalyticsPage
 │    ├── hooks/               <-- useSocket, useAudioRecorder, useTypewriter
 │    ├── layouts/             <-- MainDashboardLayout
 │    ├── services/            <-- api.js (Axios Client)
 │    ├── sockets/             <-- socketService.js
 │    ├── animations/          <-- framerMotionVariants.js
 │    ├── utils/               <-- formatters.js
 │    ├── App.jsx
 │    ├── index.css            <-- Global custom glassmorphism styles, dark gradients
 │    └── main.jsx
 └── backend/                  <-- Backend Node.js/Express App
      ├── package.json
      ├── server.js
      ├── config/              <-- db.js, ai.js, socket.js
      ├── models/              <-- UploadedFile.js, Transcript.js, Summary.js, ChatHistory.js, Analytics.js
      ├── controllers/         <-- fileController.js, aiController.js, liveController.js, analyticsController.js
      ├── routes/              <-- fileRoutes.js, aiRoutes.js, liveRoutes.js, analyticsRoutes.js
      ├── middleware/          <-- uploadMiddleware.js, errorHandler.js
      ├── services/            <-- documentParser.js, ocrService.js, whisperService.js, llmService.js
      ├── sockets/             <-- liveSocketHandler.js
      └── uploads/             <-- Local file buffer storage (git-ignored)
```

---

## 🚀 Setup & Launch Guide

### 1. Ingestion Variables Configuration

Setup environment variables by duplicating `.env.example` configurations.

* **Frontend Configuration** (Create `.env` at root):
  ```env
  VITE_API_URL=http://localhost:5000/api
  VITE_SOCKET_URL=http://localhost:5000
  ```

* **Backend Configuration** (Create `backend/.env`):
  ```env
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/documind
  GEMINI_API_KEY=your_google_gemini_api_key
  OPENAI_API_KEY=your_openai_api_key
  ```

> [!NOTE]
> **Hybrid Model Execution:** If Google/OpenAI API Keys are omitted, the server activates a smart, context-aware Mock engine. This reads your files locally, generating rich summaries, OCR words overlays, timestamped transcript dialogue, and sentiment charts natively, keeping the entire platform fully functional out of the box!

### 2. Install Packages & Launch Databases

Ensure your local **MongoDB** server is running (`mongod` command).

* **Launch Backend Server**:
  ```bash
  cd backend
  npm run dev
  ```
  *(Server starts on http://localhost:5000, listening for WS channels at ws://localhost:5000)*

* **Launch Frontend client**:
  ```bash
  # In a new terminal window, at the workspace root
  npm run dev
  ```
  *(Vite client starts on http://localhost:5173)*

Open your browser and navigate to `http://localhost:5173` to experience the DocuMind AI SaaS Dashboard!
