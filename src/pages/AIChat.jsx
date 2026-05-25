import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  FolderOpen, 
  Cpu,
  FileText,
  Image as ImageIcon,
  Music,
  User,
  Plus
} from 'lucide-react';
import api from '../services/api';

const AIChat = () => {
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Chat dialogue handles
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Load files list on mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const filesList = await api.getFiles();
        // Filter processed files
        const processed = filesList.filter(f => f.processedState === 'completed');
        setFiles(processed);
      } catch (err) {
        console.error('[AIChat Ingest Error] Failed to load files list:', err.message);
      }
    };
    fetchFiles();
  }, []);

  // Fetch chat history when selected context file changes
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsTyping(false);
      
      if (selectedFileId) {
        const matchingFile = files.find(f => f._id === selectedFileId);
        setSelectedFile(matchingFile || null);
        
        try {
          const response = await api.getChatHistory(selectedFileId);
          setChatHistory(response.messages || []);
        } catch (err) {
          console.error('[AIChat Error] Failed to load chat history:', err.message);
        }
      } else {
        // General Chat Session
        setSelectedFile(null);
        try {
          const response = await api.getChatHistory(null);
          setChatHistory(response.messages || []);
        } catch (err) {
          console.error('[AIChat Error] Failed to load general chat history:', err.message);
        }
      }
    };
    loadChatHistory();
  }, [selectedFileId, files]);

  // Scroll chat bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Submit message
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userQuery = message;
    setMessage('');
    setIsTyping(true);

    // Optimistically update UI
    setChatHistory(prev => [...prev, { role: 'user', content: userQuery, timestamp: new Date() }]);

    try {
      const response = await api.chatSession(
        selectedFileId || null,
        userQuery,
        selectedFile ? selectedFile.category : 'general'
      );
      setChatHistory(response.history.messages || []);
    } catch (err) {
      console.error('[AIChat Controller Error] Message submit failed:', err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const getFileCategoryIcon = (category) => {
    switch (category) {
      case 'document': return <FileText className="text-primary w-4 h-4" />;
      case 'image': return <ImageIcon className="text-secondary w-4 h-4" />;
      default: return <Cpu className="text-slate-400 w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* 1. Context Selector Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 mb-4">
        <div className="flex items-center gap-3">
          <FolderOpen className="text-primary w-6 h-6" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider leading-none">AI Dialogue Context</h3>
            <span className="text-[10px] text-slate-400">Choose active file context or generic chat</span>
          </div>
        </div>

        <div className="w-full md:w-auto">
          <select
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            className="glass-input w-full md:w-72 text-xs font-semibold cursor-pointer border border-slate-700 bg-slate-900 focus:border-primary/50 rounded-lg text-slate-100"
          >
            <option value="" className="bg-slate-950 font-semibold">🤖 General System Assistant (No active file)</option>
            {files.map((file) => (
              <option key={file._id} value={file._id} className="bg-slate-950 font-semibold">
                {file.category === 'document' ? '📄 [DOC] ' : '🖼️ [IMG] '}
                {file.originalName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Chat Conversation Box Frame */}
      <div className="flex-1 glass-panel p-6 flex flex-col min-h-0 relative overflow-hidden">
        
        {/* Active context label */}
        <div className="pb-3 border-b border-slate-900 flex items-center justify-between mb-4 z-10 text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider">Conversation Log</span>
          {selectedFile ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full font-bold text-slate-300">
              {getFileCategoryIcon(selectedFile.category)}
              Context: {selectedFile.originalName}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full font-bold text-slate-400">
              <Cpu className="text-primary w-4 h-4" />
              General Assistant Mode
            </span>
          )}
        </div>

        {/* Message Thread Scroll view */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 text-xs md:text-sm">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 gap-2">
              <MessageSquare className="w-10 h-10 text-primary opacity-40 animate-pulse" />
              <p className="font-extrabold text-sm text-slate-300">DocuMind Multimodal Dialogue Assistant</p>
              <p className="text-xs text-slate-400 max-w-sm leading-normal">
                {selectedFile 
                  ? `I am ready. Ask me anything regarding the facts, topics, or insights inside "${selectedFile.originalName}"!` 
                  : "Welcome! Ask general questions, request translations, draft structures, or select an analyzed file context above!"
                }
              </p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-3.5 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 border-slate-800 text-slate-200' 
                    : 'bg-primary/20 border-primary/30 text-white shadow-lg shadow-primary/10'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                </div>

                <div 
                  className={`flex flex-col rounded-2xl p-4 border ${
                    msg.role === 'user' 
                      ? 'bg-slate-900/60 border-slate-800 text-slate-200 rounded-tr-none' 
                      : 'bg-primary/10 border-primary/20 text-slate-100 rounded-tl-none shadow-sm'
                  }`}
                >
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                    {msg.role === 'user' ? 'You' : 'DocuMind AI'}
                  </span>
                  <p className="leading-relaxed leading-normal whitespace-pre-line text-justify selection:bg-primary/20">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex gap-3.5 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-xl border flex items-center justify-center bg-primary/20 border-primary/30 text-white shrink-0">
                <Sparkles size={14} className="animate-spin" />
              </div>
              <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl p-4 rounded-tl-none gap-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Assistant</span>
                <div className="flex items-center gap-1.5 py-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-150"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-300"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Form controls */}
        <form onSubmit={handleChatSubmit} className="flex gap-3 pt-2 border-t border-slate-900/80">
          <input
            type="text"
            placeholder={selectedFile ? `Ask about "${selectedFile.originalName}"...` : "Ask a general question..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="glass-input flex-1 text-xs md:text-sm py-3 px-4 focus:ring-1 focus:ring-primary shadow-inner"
            disabled={isTyping}
          />
          <button
            type="submit"
            className="p-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white rounded-lg shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-40 shrink-0"
            disabled={isTyping || !message.trim()}
          >
            <Send size={16} />
          </button>
        </form>

      </div>

    </div>
  );
};

export default AIChat;
