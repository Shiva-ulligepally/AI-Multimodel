# DocuMind AI - Technical Architecture

## 🎯 Refactoring Objectives (Completed)

This document outlines the architectural changes made to convert DocuMind AI into a production-ready, Vercel-compatible serverless monorepo.

### Original Issues
1. ❌ Backend used `server.listen()` - incompatible with serverless
2. ❌ Local disk file storage - not persistent in serverless
3. ❌ Multer disk storage - cannot be used in Vercel
4. ❌ Socket.io long-lived connections - not supported by Vercel Functions
5. ❌ Audio feature created persistent server requirements
6. ❌ No cloud storage integration

### Solutions Implemented
1. ✅ Express app exports as default (no `server.listen()`)
2. ✅ Cloudinary cloud storage for all files
3. ✅ Multer memory storage (buffers instead of disk)
4. ✅ Removed Socket.io and live listening feature
5. ✅ Removed audio processing pipeline
6. ✅ Cloudinary URL-based file references throughout

---

## 📁 File Structure Transformation

### Frontend (src/)
**No changes** - React + Vite structure remains unchanged except for API client.

#### Changes:
- `src/services/api.js`: 
  - **Before:** `VITE_API_URL || 'http://localhost:5000/api'`
  - **After:** `VITE_API_URL || '/api'` (relative path for Vercel)

---

### Backend Migration (backend/ → api/)

#### Core Application (api/index.js)
**Before:** Backend structure with `server.listen(process.env.PORT || 5000)`

**After:** Express app export format for Vercel
```javascript
export default app; // Vercel serverless handler
```

**Key additions:**
- Helmet.js security middleware
- Compression middleware
- Rate limiting (100 req/15min per IP)
- CORS configuration
- Global error handler
- Health check endpoint (`GET /api/health`)

---

#### Configuration Layer (api/config/)

##### 1. Database (db.js)
**Changes:**
- Same Mongoose connection logic
- JSON fallback for testing (connects to `../../db_store.json`)
- Connection pooling compatible with serverless

##### 2. AI Providers (ai.js)
**No changes to logic:**
- Tries: Gemini 2.5-flash → OpenAI gpt-4o-mini → Mock
- Logs active provider status

##### 3. Cloudinary (cloudinary.js) - NEW
**New file purpose:** Cloud file storage integration
```javascript
uploadToCloudinary(fileBuffer, fileName)  // Returns {secure_url, public_id}
deleteFromCloudinary(publicId)            // Removes from Cloudinary
```

---

#### Routes Layer (api/routes/)

##### File Routes (fileRoutes.js)
| Endpoint | Method | Changes |
|----------|--------|---------|
| `/api/files/upload` | POST | Now uses Cloudinary URLs instead of local paths |
| `/api/files` | GET | Same logic, returns cloudinaryUrl + publicId |
| `/api/files/:id` | GET | Includes full file analysis with Cloudinary URL |
| `/api/files/:id` | DELETE | Deletes from Cloudinary first, then DB |

##### AI Routes (aiRoutes.js)
| Endpoint | Method | Changes |
|----------|--------|---------|
| `/api/ai/chat` | POST | Now receives fileContext with Cloudinary URL |
| `/api/ai/chat/history` | GET | No changes |
| `/api/ai/flashcards/:fileId` | GET | No changes |

##### Analytics Routes (analyticsRoutes.js)
**Changes:**
- Removed "audio" category from counts
- Same aggregation logic for documents/images only

---

#### Middleware Layer (api/middleware/)

##### Upload Middleware (uploadMiddleware.js)
**Before:** Multer disk storage
```javascript
const upload = multer({ 
  dest: 'backend/uploads/',  // Local filesystem
  fileFilter: ...
});
```

**After:** Memory storage for serverless
```javascript
const upload = multer({ 
  storage: memoryStorage(),  // Buffers in RAM
  fileFilter: ...
});
```

**Key differences:**
- `req.file.buffer` contains file contents in memory
- No disk I/O - upload to Cloudinary directly
- Supported types: PDF, DOCX, PPTX, TXT, PNG, JPG (audio removed)
- Max size: 30MB

---

#### Models Layer (api/models/)

##### UploadedFile Schema
**Before:**
```javascript
{
  filename: String,
  path: String,              // Local file path
  mimeType: String,
  category: ['document', 'image', 'audio'], // Audio removed
}
```

**After:**
```javascript
{
  filename: String,
  originalName: String,
  mimeType: String,
  cloudinaryUrl: String,     // NEW - from Cloudinary
  cloudinaryPublicId: String, // NEW - for deletion
  category: ['document', 'image'],  // Removed 'audio'
  status: ['pending', 'processing', 'completed', 'failed'],
  processedState: {
    textExtracted: Boolean,
    analysisDone: Boolean,
    ocrDone: Boolean,
  },
  error: String,
  createdAt: Date,
}
```

##### Other Models
**ChatHistory, Summary, Transcript, Analytics:**
- Removed references to `'audio'` session type
- Changed to: `['document', 'image', 'general']`
- No changes to core logic

---

#### Controllers Layer (api/controllers/)

##### File Controller (fileController.js)
**Major refactoring for Cloudinary:**

1. **uploadFile(req, res):**
   - Receives `req.file.buffer` from memory storage
   - Calls `uploadToCloudinary(buffer, fileName)`
   - Stores response: `{secure_url, public_id}`
   - Saves to UploadedFile: `cloudinaryUrl` + `cloudinaryPublicId`
   - Extracts text using Cloudinary URL instead of local path
   - Removes audio handling

2. **getFileDetails(req, res):**
   - Returns file record with all analysis (Summary, Transcript, Analytics)
   - Uses cloudinaryUrl for display

3. **deleteFile(req, res):**
   - Calls `deleteFromCloudinary(publicId)` FIRST
   - Then deletes all DB records
   - No local filesystem cleanup

##### AI Controller (aiController.js)
**Changes for Cloudinary URLs:**
- `chatSession()` receives file context with `cloudinaryUrl`
- Text extraction calls `extractTextFromDocument(cloudinaryUrl)`
- No changes to AI logic or response format

##### Analytics Controller (analyticsController.js)
**Changes:**
- Removed audio file counting
- Aggregation logic unchanged
- Still tracks: documents, images, keywords, sentiment, topics

---

#### Services Layer (api/services/)

##### Document Parser (documentParser.js)
**Complete refactor for URL-based processing:**

**Before:**
```javascript
const fs = require('fs');
const data = fs.readFileSync(filePath); // Local file
```

**After:**
```javascript
const response = await fetch(cloudinaryUrl); // URL fetch
const buffer = await response.buffer();
// Process buffer for PDF, DOCX, PPTX, TXT
```

**Supported formats:**
- PDF: `pdf-parse` library
- DOCX/PPTX: `officeparser` library
- TXT: Direct UTF-8 decoding
- Returns extracted text (up to 15KB)

##### OCR Service (ocrService.js)
**Complete refactor for URL-based OCR:**

**Before:**
```javascript
const { data } = await Tesseract.recognize('/path/to/image.jpg');
```

**After:**
```javascript
const { data } = await Tesseract.recognize(cloudinaryUrl);
// Tesseract.js supports URL input directly
```

**Returns:**
- `text`: Extracted OCR text
- `words`: Array of word objects with bounding boxes

##### LLM Service (llmService.js)
**Changes for Cloudinary context:**

Functions remain same:
- `analyzeDocument(fileName, text)` - Analyzes document text
- `analyzeImage(fileName, ocrText)` - Analyzes OCR from image
- `chatWithContext(contextType, fileName, contextText, chatHistory, userMessage)` - Chat with context

**All functions now work with text content** (not file paths):
- Document Parser extracts text from Cloudinary URL
- OCR extracts text from Cloudinary image URL
- LLM services receive pre-extracted text, not file references

---

## 🔄 Data Flow Architecture

### File Upload Pipeline (NEW)

```
Frontend (React)
  ↓
POST /api/files/upload
  ↓
uploadMiddleware (memoryStorage)
  ↓ req.file.buffer
fileController.uploadFile()
  ↓
uploadToCloudinary(buffer, fileName)
  ↓ {secure_url, public_id}
Save UploadedFile (cloudinaryUrl + publicId)
  ↓
Extract text from Cloudinary URL
  ↓
Generate Summary (AI)
  ↓
Generate Transcript
  ↓
Generate Analytics
  ↓
Response: File record + analysis
```

### AI Analysis Pipeline (NEW)

```
User requests analysis/chat
  ↓
FileController gets file record (has cloudinaryUrl)
  ↓
documentParser.extractTextFromDocument(cloudinaryUrl)
  ↓ Text content
llmService.analyzeDocument(fileName, text)
  ↓ {summary, keyPoints, flashcards, ...}
Database storage + Response
```

### Image Analysis Pipeline (NEW)

```
User uploads image
  ↓
Cloudinary storage (cloudinaryUrl)
  ↓
ocrService.performOCR(cloudinaryUrl)
  ↓ OCR text + word boundaries
llmService.analyzeImage(fileName, ocrText)
  ↓ {caption, objects, sentiment, ...}
Display with bounding boxes (frontend receives cloudinaryUrl directly)
```

---

## 🚀 Serverless Compatibility

### Vercel Function Lifecycle
1. Cold start: Imports modules, connects to DB
2. Request handler: Express receives request
3. Response: Express sends response
4. Function ends (no persistent connections)

### What Changed
- ✅ No `server.listen()` - Vercel manages server
- ✅ Memory-based file uploads - No disk I/O
- ✅ Cloudinary for storage - Persistent across invocations
- ✅ MongoDB connection pooling - For serverless environments
- ✅ Stateless services - No server-side state needed

### What Was Removed
- ❌ Socket.io - Long-lived WebSocket connections incompatible
- ❌ Live transcription - Required persistent server
- ❌ Local file storage - Not available in serverless
- ❌ Session persistence - Each function invocation is isolated

---

## 📊 Performance Implications

### Before (Local Server)
- File uploads: Disk I/O (fast for small files)
- File storage: Local filesystem (limited by disk space)
- Scaling: Single server, limited concurrent connections
- Cold start: N/A (always running)

### After (Vercel Serverless + Cloudinary)
- File uploads: Memory upload → Cloudinary (faster, async possible)
- File storage: Cloudinary CDN (unlimited, globally distributed)
- Scaling: Automatic, unlimited concurrent functions
- Cold start: ~1-2 seconds (first request after idle)

---

## 🔒 Security Improvements

1. **No local files exposed** - All files behind Cloudinary authentication
2. **API Rate Limiting** - 100 requests per 15 minutes per IP
3. **Security Headers** - Helmet.js (X-Frame-Options, etc.)
4. **CORS Configuration** - Restricted to deployment domain
5. **Environment Variables** - All secrets in Vercel (not in code)

---

## 📋 Deployment Checklist

- [x] Frontend: React + Vite (builds to /dist)
- [x] Backend: Express as serverless function (api/index.js)
- [x] Routes: All /api/* go to serverless function
- [x] Static: /dist/* served as static files
- [x] Environment: All secrets in Vercel env vars
- [x] Database: MongoDB connection pooling configured
- [x] File Storage: Cloudinary integration complete
- [x] AI: Multiple provider fallback chain
- [x] Monitoring: Health check endpoint
- [x] Error Handling: Global error handler with stack traces in dev

---

## 🎓 Key Learnings

1. **Serverless constraints shaped architecture** - No persistent state, stateless services
2. **URL-based file processing** - Easier than buffering large files
3. **CDN storage is essential** - Local filesystem doesn't work in FaaS
4. **Connection pooling matters** - Database connections in serverless are resource-intensive
5. **Fallback chains improve reliability** - Multiple AI providers ensure service continuity

