import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Sparkles, 
  HelpCircle, 
  MessageSquare, 
  ChevronRight, 
  Send,
  RefreshCw,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

const DocAnalysis = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [docDetails, setDocDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'flashcards' | 'chat'
  
  // Flashcard states
  const [flashcards, setFlashcards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Chat states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Load document list on mount
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const files = await api.getFiles();
        const docs = files.filter(f => f.category === 'document' && f.processedState === 'completed');
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocId(docs[0]._id);
        }
      } catch (err) {
        console.error('[DocAnalysis Ingest Error] Failed to fetch documents list:', err.message);
      }
    };
    fetchDocs();
  }, []);

  // Fetch document details when selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) return;

    const loadDetails = async () => {
      setIsLoading(true);
      try {
        const details = await api.getFileDetails(selectedDocId);
        setDocDetails(details);
        
        // Fetch flashcards
        const cards = await api.getFlashcards(selectedDocId);
        setFlashcards(cards);
        setActiveCardIndex(0);
        setIsFlipped(false);

        // Fetch chat history
        const chatLogs = await api.getChatHistory(selectedDocId);
        setChatHistory(chatLogs.messages || []);
      } catch (err) {
        console.error('[DocAnalysis Error] Failed to load details:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [selectedDocId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Highlight Text Matches
  const getHighlightedText = (text, highlight) => {
    if (!text) return '';
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-400/30 text-yellow-200 px-0.5 rounded border-b border-yellow-500/50 font-bold">{part}</mark>
      ) : (
        part
      )
    );
  };

  // Submit Chat Question
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedDocId) return;

    const userQuery = chatMessage;
    setChatMessage('');
    setIsTyping(true);

    // Optimistically update UI
    setChatHistory(prev => [...prev, { role: 'user', content: userQuery, timestamp: new Date() }]);

    try {
      const response = await api.chatSession(selectedDocId, userQuery, 'document');
      setChatHistory(response.history.messages || []);
    } catch (err) {
      console.error('[DocAnalysis Chat Error] Question loop failed:', err.message);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Selector Navigation Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4">
        <div className="flex items-center gap-3">
          <FolderOpen className="text-primary w-6 h-6" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider leading-none">Active Document Session</h3>
            <span className="text-[10px] text-slate-400">Select processed files from the list</span>
          </div>
        </div>

        <div className="w-full md:w-auto">
          {documents.length === 0 ? (
            <div className="text-slate-400 text-xs font-semibold">No documents parsed yet. Please upload files in Dashboard.</div>
          ) : (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="glass-input w-full md:w-64 text-xs font-semibold cursor-pointer border border-slate-700 bg-slate-900 focus:border-primary/50 rounded-lg text-slate-100"
            >
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id} className="bg-slate-950 font-semibold">
                  {doc.originalName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Workspace Frame */}
      {documents.length === 0 ? (
        <motion.div 
          className="glass-panel p-12 text-center space-y-4 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FileText className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
          <h3 className="text-lg font-bold text-white">No Document Assets Available</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please navigate to the Dashboard upload center and submit a PDF, Word document, PowerPoint review, or TXT file to run the AI extractor.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* LEFT PANEL: Document raw text scroller */}
          <div className="glass-panel p-6 flex flex-col h-[650px] relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={16} className="text-primary" /> Parsed Document Text
              </h3>
              
              {/* Dynamic search bar */}
              <div className="relative w-48 md:w-64">
                <input 
                  type="text"
                  placeholder="Highlight terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full pl-8 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                />
                <Search size={14} className="text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Document contents display */}
            <div className="flex-1 overflow-y-auto pr-2 text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line text-justify selection:bg-primary/30 selection:text-white">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="animate-spin text-primary w-8 h-8" />
                </div>
              ) : docDetails?.file?.processedState === 'failed' ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
                  Text Ingestion failed: {docDetails.file.error}
                </div>
              ) : (
                getHighlightedText(docDetails?.data?.extractedText || docDetails?.transcript?.rawText || 'Loading document body...', searchTerm)
              )}
            </div>

            <div className="pt-3 border-t border-slate-900 text-[10px] text-slate-500 flex justify-between">
              <span>Characters: {docDetails?.data?.extractedText?.length ?? 0}</span>
              <span>Words: {docDetails?.analytics?.wordCount ?? 0}</span>
            </div>
          </div>

          {/* RIGHT PANEL: Dynamic Tabbed AI Panel */}
          <div className="glass-panel p-6 flex flex-col h-[650px]">
            {/* Tabs Toggle buttons */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-900 rounded-xl p-1 mb-6">
              {[
                { id: 'summary', label: 'AI Summary', icon: Sparkles },
                { id: 'flashcards', label: 'Flashcards', icon: HelpCircle },
                { id: 'chat', label: 'Document Chat', icon: MessageSquare }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary/20 text-primary border border-primary/20 shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="animate-spin text-secondary w-8 h-8" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: Summary Panel */}
                  {activeTab === 'summary' && (
                    <motion.div 
                      key="summary" 
                      className="space-y-6"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <div className="space-y-2">
                        <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">Executive Overview</span>
                        <p className="text-xs md:text-sm text-slate-200 leading-relaxed text-justify">
                          {docDetails?.summary?.summaryText || 'No summary compiled.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">Core Takeaways</span>
                        <ul className="space-y-2 text-xs md:text-sm text-slate-300">
                          {(docDetails?.summary?.keyPoints || []).map((pt, index) => (
                            <li key={index} className="flex gap-2.5">
                              <span className="text-primary font-bold">0{index + 1}.</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">Study Suggestions</span>
                        <div className="flex flex-wrap gap-2">
                          {(docDetails?.summary?.recommendations || []).map((rec, index) => (
                            <span key={index} className="text-xs px-3 py-1 bg-slate-900 border border-slate-800/80 rounded-full font-medium text-slate-300">
                              💡 {rec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: Study Flashcards Panel */}
                  {activeTab === 'flashcards' && (
                    <motion.div 
                      key="flashcards" 
                      className="h-full flex flex-col justify-between"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      {flashcards.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs">No flashcards compiled.</div>
                      ) : (
                        <div className="flex-1 flex flex-col justify-center items-center gap-6">
                          
                          {/* Flip Card Container */}
                          <div 
                            className="w-full max-w-sm h-64 cursor-pointer relative perspective"
                            onClick={() => setIsFlipped(!isFlipped)}
                          >
                            <motion.div 
                              className={`w-full h-full duration-500 preserve-3d relative rounded-2xl ${
                                isFlipped 
                                  ? 'bg-secondary/15 border-secondary/40 text-slate-100' 
                                  : 'bg-slate-900/60 border-slate-800 text-slate-200'
                              }`}
                              animate={{ rotateY: isFlipped ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                              style={{ transformStyle: 'preserve-3d' }}
                            >
                              {/* Front Side: Question */}
                              <div className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center text-center p-6 select-none">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-4">Question</span>
                                <h4 className="text-sm md:text-base font-extrabold text-white leading-snug">
                                  {flashcards[activeCardIndex]?.question}
                                </h4>
                                <span className="text-[10px] text-primary font-semibold uppercase tracking-wider block mt-6 animate-pulse">Click to Reveal Answer</span>
                              </div>

                              {/* Back Side: Answer */}
                              <div 
                                className="absolute inset-0 w-full h-full backface-hidden rotateY-180 flex flex-col items-center justify-center text-center p-6 select-none px-4"
                                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                              >
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-4">Answer</span>
                                <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-semibold">
                                  {flashcards[activeCardIndex]?.answer}
                                </p>
                              </div>
                            </motion.div>
                          </div>

                          {/* Deck controls */}
                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <button
                              disabled={activeCardIndex === 0}
                              onClick={() => {
                                setIsFlipped(false);
                                setTimeout(() => setActiveCardIndex(prev => prev - 1), 100);
                              }}
                              className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 text-slate-300 hover:text-white"
                            >
                              Previous
                            </button>
                            <span className="text-slate-500">
                              {activeCardIndex + 1} / {flashcards.length}
                            </span>
                            <button
                              disabled={activeCardIndex === flashcards.length - 1}
                              onClick={() => {
                                setIsFlipped(false);
                                setTimeout(() => setActiveCardIndex(prev => prev + 1), 100);
                              }}
                              className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 text-slate-300 hover:text-white"
                            >
                              Next
                            </button>
                          </div>

                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: Interactive Chat Assistant Panel */}
                  {activeTab === 'chat' && (
                    <motion.div 
                      key="chat" 
                      className="h-full flex flex-col"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      {/* Message Thread Scroll view */}
                      <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 mb-4 text-xs md:text-sm">
                        {chatHistory.length === 0 ? (
                          <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 gap-2">
                            <MessageSquare className="w-8 h-8 opacity-40 animate-pulse" />
                            <p className="font-semibold text-xs text-slate-400">Contextual In-File Assistant Active</p>
                            <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                              Ask arbitrary or highly specific questions regarding figures, insights, or conclusions contained in this document!
                            </p>
                          </div>
                        ) : (
                          chatHistory.map((msg, index) => (
                            <div 
                              key={index} 
                              className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 border ${
                                msg.role === 'user' 
                                  ? 'ml-auto bg-slate-900 border-slate-800 text-slate-200 rounded-tr-none' 
                                  : 'bg-primary/10 border-primary/20 text-slate-100 rounded-tl-none'
                              }`}
                            >
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                                {msg.role === 'user' ? 'You' : 'DocuMind Assistant'}
                              </span>
                              <p className="leading-relaxed leading-normal whitespace-pre-line text-justify selection:bg-primary/20">
                                {msg.content}
                              </p>
                            </div>
                          ))
                        )}

                        {isTyping && (
                          <div className="flex flex-col bg-slate-900/60 border border-slate-800 max-w-[80%] rounded-2xl p-3 rounded-tl-none gap-2">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Assistant</span>
                            <div className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-150"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-300"></span>
                            </div>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Chat Typing controls */}
                      <form onSubmit={handleChatSubmit} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Query this document..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          className="glass-input flex-1 text-xs md:text-sm py-2.5"
                          disabled={isTyping}
                        />
                        <button
                          type="submit"
                          className="p-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-primary/30 transition-shadow active:scale-95 disabled:opacity-40"
                          disabled={isTyping || !chatMessage.trim()}
                        >
                          <Send size={14} />
                        </button>
                      </form>

                    </motion.div>
                  )}

                </AnimatePresence>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default DocAnalysis;
