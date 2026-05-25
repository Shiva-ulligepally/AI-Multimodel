import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  BarChart, 
  Clock, 
  HelpCircle,
  FileUp
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch initial files list and system analytics
  const loadDashboardData = async () => {
    try {
      const filesList = await api.getFiles();
      setFiles(filesList);
      
      const stats = await api.getPlatformAnalytics();
      setAnalytics(stats);
    } catch (err) {
      console.error('[Dashboard Ingest Error] Failed to load statistics:', err.message);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format File Size
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(10);
    
    // Simulate upload progress steps for visual feedback
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 80) {
          clearInterval(interval);
          return 80;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const response = await api.uploadFile(file);
      setUploadProgress(100);
      clearInterval(interval);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        loadDashboardData();
        
        // Dynamic route depending on processed category
        const fileCategory = response.file.category;
        if (fileCategory === 'document') navigate('/docs');
        else if (fileCategory === 'image') navigate('/images');
      }, 500);

    } catch (err) {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
      setErrorMessage(err.response?.data?.error || err.message || 'File upload and analysis failed.');
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.deleteFile(id);
      loadDashboardData();
    } catch (err) {
      console.error('[Dashboard Error] Delete failed:', err.message);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'document': return <FileText className="text-primary w-5 h-5" />;
      case 'image': return <ImageIcon className="text-secondary w-5 h-5" />;
      default: return <FileText className="text-slate-400 w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Welcoming Dynamic AI Jumbotron Card */}
      <motion.div 
        className="glass-panel p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-3 z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={12} className="animate-spin" /> Next-Gen Multimodal Analyzer
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Unlock Intelligence Across All Media formats
          </h2>
          <p className="text-slate-300 max-w-xl text-sm leading-relaxed">
            DocuMind AI instantly processes PDF files, PowerPoint slide reviews, OCR scanner images, and audio logs.
          </p>
        </div>
        <div className="relative w-full md:w-auto flex justify-center md:justify-end z-10">
          <motion.button
            onClick={() => navigate('/docs')}
            className="cyber-button flex items-center gap-2 group whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Open Document Analysis <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </motion.button>
        </div>
        {/* Glow Layer */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-primary/10 to-transparent blur-3xl pointer-events-none"></div>
      </motion.div>

      {/* 2. Platform telemetry Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            name: 'Document Reviews', 
            count: analytics?.counts?.documents ?? 0, 
            unit: 'files', 
            icon: FileText, 
            color: 'from-primary/20 to-primary/5 border-primary/20' 
          },
          { 
            name: 'OCR Visual Scans', 
            count: analytics?.counts?.images ?? 0, 
            unit: 'scans', 
            icon: ImageIcon, 
            color: 'from-secondary/20 to-secondary/5 border-secondary/20' 
          },
          { 
            name: 'Total Words Processed', 
            count: analytics?.wordCount ?? 0, 
            unit: 'words', 
            icon: BarChart, 
            color: 'from-amber-500/20 to-amber-500/5 border-amber-500/20' 
          }
        ].map((stat, idx) => (
          <motion.div
            key={stat.name}
            className={`glass-panel p-4 flex flex-col justify-between border bg-gradient-to-br ${stat.color} h-28 hover:scale-[1.02] transition-all`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold tracking-wider uppercase">{stat.name}</span>
              <stat.icon className="w-5 h-5 opacity-70" />
            </div>
            <div>
              <span className="text-2xl md:text-3xl font-extrabold text-white leading-none">
                {stat.count.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5 uppercase font-medium">{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Dropzone Upload Center & Topic Bubble Analytics split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Ingestion Dropzone */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="glass-panel p-6 flex-1 flex flex-col justify-between min-h-[300px]">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileUp size={18} className="text-primary" /> Multi-Format Upload Center
              </h3>
              <p className="text-xs text-slate-400">PDF, DOCX, TXT, PPT, PNG, JPG allowed (Max 30MB)</p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer p-8 text-center transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-800 hover:border-slate-700/60'}`}
              onClick={() => document.getElementById('dashboard-file-input').click()}
            >
              <input 
                id="dashboard-file-input"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <AnimatePresence mode="wait">
                {isUploading ? (
                  <motion.div 
                    className="flex flex-col items-center gap-3 w-full max-w-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <UploadCloud size={48} className="text-primary animate-bounce" />
                    <span className="text-sm font-semibold text-slate-200">Analyzing Document Structure...</span>
                    
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <motion.div 
                        className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">{uploadProgress}% Complete</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="p-4 rounded-full bg-slate-900 border border-slate-800/80 shadow-md group-hover:scale-105 transition-transform duration-200">
                      <UploadCloud size={36} className="text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-200">Drag & Drop or Click to browse</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        DocuMind AI automatically parses text, images, and audio segments.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Dynamic Topic Bubble Card */}
        <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[300px]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-secondary" /> Semantic Topics Cloud
            </h3>
            <p className="text-xs text-slate-400 mb-4">Core conceptual areas extracted from platform uploads.</p>
          </div>

          <div className="flex-1 flex flex-wrap gap-2 items-center justify-center content-center py-4">
            {(analytics?.topics || []).map((topic, idx) => {
              const sizes = ['text-xs', 'text-sm', 'text-base'];
              const opacities = ['opacity-70', 'opacity-85', 'opacity-100'];
              const backgrounds = [
                'bg-primary/10 border-primary/20 text-primary',
                'bg-secondary/10 border-secondary/20 text-secondary',
                'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              ];
              const randomSelect = (idx * 7) % 3;

              return (
                <motion.span
                  key={topic}
                  className={`px-3 py-1.5 rounded-full border font-semibold ${sizes[randomSelect]} ${opacities[randomSelect]} ${backgrounds[randomSelect]} cursor-default`}
                  whileHover={{ scale: 1.05, border: '1px solid rgba(108, 99, 255, 0.4)' }}
                >
                  {topic}
                </motion.span>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-900 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              AUTO-COMPILED BY MULTIMODAL INFERENCE
            </span>
          </div>
        </div>

      </div>

      {/* 4. Recent Ingestions & Analyses Table/Grid */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-emerald-400" /> Recent Ingestion Registry
            </h3>
            <p className="text-xs text-slate-400">Direct workspace shortcuts to detailed analyses.</p>
          </div>
          <span className="text-xs font-semibold bg-slate-900 text-slate-400 py-1 px-3 border border-slate-800 rounded-full">
            {files.length} active files
          </span>
        </div>

        <div className="overflow-x-auto">
          {files.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl space-y-3">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-500 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">No analyzed files registered yet.</p>
              <p className="text-xs text-slate-500">Upload a PDF document, image OCR, or MP3 audio above to get started!</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-3">
                  <th className="pb-3 pr-4">File Name</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">File Size</th>
                  <th className="pb-3 px-4">Analysis Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs">
                {files.map((file) => (
                  <tr 
                    key={file._id} 
                    className="hover:bg-slate-900/20 group cursor-pointer transition-colors"
                    onClick={() => {
                      if (file.category === 'document') navigate('/docs');
                      else if (file.category === 'image') navigate('/images');
                    }}
                  >
                    <td className="py-4 pr-4 font-bold text-slate-200 group-hover:text-primary transition-colors flex items-center gap-3 max-w-[280px] truncate">
                      {getCategoryIcon(file.category)}
                      <span className="truncate">{file.originalName}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-semibold capitalize">
                      {file.category}
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-medium">
                      {formatBytes(file.size)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        file.processedState === 'completed' ? 'bg-accent/10 text-accent border border-accent/20' : 
                        file.processedState === 'processing' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' :
                        'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          file.processedState === 'completed' ? 'bg-accent' : 
                          file.processedState === 'processing' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></span>
                        {file.processedState}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <button
                        onClick={(e) => handleDelete(e, file._id)}
                        className="p-1.5 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                        title="Delete registry entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
