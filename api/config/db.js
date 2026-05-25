import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = process.env.VERCEL 
  ? '/tmp/db_store.json' 
  : path.join(process.cwd(), 'db_store.json');

// Global mock indicator
const useMockDB = { active: false };

// Initialize local JSON file if not exists
const initJSONFile = () => {
  if (!fs.existsSync(DB_FILE_PATH)) {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify({
      UploadedFile: [],
      Transcript: [],
      Summary: [],
      Analytics: [],
      ChatHistory: []
    }, null, 2));
  }
};

const readDB = () => {
  initJSONFile();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));
  } catch (err) {
    return { UploadedFile: [], Transcript: [], Summary: [], Analytics: [], ChatHistory: [] };
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
};

// Create a local Mock Model engine that mimics basic Mongoose queries
function createMockModel(modelName) {
  const getCollection = () => {
    const db = readDB();
    return db[modelName] || [];
  };

  const saveCollection = (records) => {
    const db = readDB();
    db[modelName] = records;
    writeDB(db);
  };

  return {
    find: async (query) => getCollection().filter((item) => Object.keys(query).every((k) => item[k] === query[k])),
    findById: async (id) => getCollection().find((item) => item._id === id),
    create: async (data) => {
      const id = Date.now().toString();
      const newRecord = { ...data, _id: id };
      saveCollection([...getCollection(), newRecord]);
      return newRecord;
    },
    updateOne: async (query, updates) => {
      const collection = getCollection();
      const index = collection.findIndex((item) => Object.keys(query).every((k) => item[k] === query[k]));
      if (index > -1) {
        collection[index] = { ...collection[index], ...updates };
        saveCollection(collection);
      }
      return { modifiedCount: index > -1 ? 1 : 0 };
    },
    deleteOne: async (query) => {
      const collection = getCollection();
      const filtered = collection.filter((item) => !Object.keys(query).every((k) => item[k] === query[k]));
      const deleted = collection.length - filtered.length;
      saveCollection(filtered);
      return { deletedCount: deleted };
    }
  };
}

// Ensure DB connection
const connectDB = async () => {
  let MONGO_URI = process.env.MONGO_URI;

  if (MONGO_URI) {
    MONGO_URI = MONGO_URI.trim();
    // Strip accidental prefix if user pasted the key name in Vercel value field
    if (MONGO_URI.startsWith('MONGO_URI=')) {
      MONGO_URI = MONGO_URI.replace('MONGO_URI=', '').trim();
    } else if (MONGO_URI.startsWith('MONGODB_URI=')) {
      MONGO_URI = MONGO_URI.replace('MONGODB_URI=', '').trim();
    }
  }

  if (!MONGO_URI) {
    console.warn('[DB Config] MONGO_URI not set. Using local JSON mock database.');
    useMockDB.active = true;
    return;
  }

  // Skip if already connected (important for serverless reuse)
  if (mongoose.connection.readyState === 1) {
    console.log('[DB Config] Using existing MongoDB connection.');
    return;
  }

  try {
    console.log('[DB Config] Connecting to MongoDB...');
    
    // Optimized for Vercel serverless environment
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Connection pooling for serverless
      maxPoolSize: 10,
      minPoolSize: 5,
      
      // Timeout settings (important for serverless)
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Prevent unneeded reconnection
      retryWrites: true,
      w: 'majority',
      
      // Connection name for debugging
      appName: 'DocuMind-Vercel',
    });
    
    console.log('[DB Config] ✅ Connected to MongoDB successfully.');
    useMockDB.active = false;
  } catch (err) {
    console.error('[DB Config Error]', err.message);
    console.warn('[DB Config] ⚠️  Falling back to local JSON mock database.');
    useMockDB.active = true;
  }
};

// Export Mock Model Creator
export { createMockModel, useMockDB };
export default connectDB;
