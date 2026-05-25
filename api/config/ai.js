import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

let geminiClient = null;
let openAIClient = null;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('[AI Config] Google Gemini API Client initialized.');
  } catch (err) {
    console.error(`[AI Config Error] Could not initialize Gemini: ${err.message}`);
  }
} else {
  console.warn("Missing GEMINI_API_KEY");
  console.log('[AI Config Warning] GEMINI_API_KEY is not defined. Using mock responses.');
}

if (OPENAI_API_KEY) {
  try {
    openAIClient = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log('[AI Config] OpenAI API Client initialized.');
  } catch (err) {
    console.error(`[AI Config Error] Could not initialize OpenAI: ${err.message}`);
  }
} else {
  console.warn("Missing OPENAI_API_KEY");
  console.log('[AI Config Warning] OPENAI_API_KEY is not defined. Using mock responses.');
}

export const getGemini = () => geminiClient;
export const getOpenAI = () => openAIClient;
export const isAIConfigured = () => !!(geminiClient || openAIClient);
export const activeModelMode = () => {
  if (GEMINI_API_KEY && OPENAI_API_KEY) return 'dual';
  if (GEMINI_API_KEY) return 'gemini';
  if (OPENAI_API_KEY) return 'openai';
  return 'mock';
};
