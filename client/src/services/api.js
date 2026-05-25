import axios from 'axios';

// Use /api prefix for Vercel deployment, or full URL for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // 1. Files & Ingestions
  getFiles: async () => {
    const res = await apiClient.get('/files');
    return res.data;
  },

  getFileDetails: async (id) => {
    const res = await apiClient.get(`/files/${id}`);
    return res.data;
  },

  uploadFile: async (fileObject) => {
    const formData = new FormData();
    formData.append('file', fileObject);
    
    const res = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  deleteFile: async (id) => {
    const res = await apiClient.delete(`/files/${id}`);
    return res.data;
  },

  // 2. Chat & AI dialogue
  chatSession: async (fileId, message, sessionType = 'general') => {
    const res = await apiClient.post('/ai/chat', { fileId, message, sessionType });
    return res.data;
  },

  getChatHistory: async (fileId = null) => {
    const params = fileId ? { fileId } : {};
    const res = await apiClient.get('/ai/chat/history', { params });
    return res.data;
  },

  getFlashcards: async (fileId) => {
    const res = await apiClient.get(`/ai/flashcards/${fileId}`);
    return res.data;
  },

  // 3. Analytics Telemetry
  getPlatformAnalytics: async () => {
    const res = await apiClient.get('/analytics');
    return res.data;
  }
};

export default api;
