import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Mic, 
  MessageSquare, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  Cpu, 
  Activity, 
  Database,
  Menu,
  X
} from 'lucide-react';
import api from '../services/api';

const MainDashboardLayout = ({ children }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modelMode, setModelMode] = useState('gemini'); // 'gemini' | 'openai'
  const [dbStatus, setDbStatus] = useState('Checking'); // 'Online' | 'Offline'

  // Poll server status on mount
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        await api.getPlatformAnalytics();
        setDbStatus('Online');
      } catch (err) {
        setDbStatus('Offline');
      }
    };
    fetchHealth();
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Document Analysis', path: '/docs', icon: FileText },
    { name: 'Image Analysis', path: '/images', icon: ImageIcon },
    { name: 'AI Chat Page', path: '/chat', icon: MessageSquare },
    { name: 'Analytics Page', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-bg text-slate-100 font-sans">
      
      {/* 1. Mobile Top Header Panel */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-4 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Cpu className="text-primary w-7 h-7 filter drop-shadow-[0_0_8px_#6C63FF]" />
          <span className="font-extrabold text-lg tracking-wider text-gradient">DocuMind AI</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 2. Left Navigation Sidebar (Desktop) */}
      <motion.aside 
        className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-xl z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Sidebar Brand Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-900">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <Cpu className="text-primary w-8 h-8 filter drop-shadow-[0_0_8px_#6C63FF]" />
                <span className="font-extrabold text-xl tracking-wider text-gradient">DocuMind AI</span>
              </motion.div>
            ) : (
              <motion.div 
                className="mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Cpu className="text-primary w-8 h-8 filter drop-shadow-[0_0_8px_#6C63FF]" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center p-1 rounded-full hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Sidebar List */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link to={item.path} key={item.name}>
                <motion.div
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer group transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-primary/20 to-secondary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'}`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                  {!isCollapsed && (
                    <span className="font-medium text-sm tracking-wide">{item.name}</span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Telemetry Status Section (Bottom of Sidebar) */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/40 text-xs text-slate-500 space-y-3.5">
          {!isCollapsed ? (
            <motion.div 
              className="space-y-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Database size={12} className="text-slate-400" /> Database</span>
                <span className={`font-semibold flex items-center gap-1 ${dbStatus === 'Online' ? 'text-accent' : 'text-rose-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${dbStatus === 'Online' ? 'bg-accent animate-pulse' : 'bg-rose-500'}`}></span>
                  {dbStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Activity size={12} className="text-slate-400" /> API Gateway</span>
                <span className="text-accent font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                  Active
                </span>
              </div>
              <div className="text-[10px] text-center pt-2 text-slate-600 border-t border-slate-900">
                DocuMind v1.0.0 • Production Ready
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Database size={16} className={dbStatus === 'Online' ? 'text-accent' : 'text-rose-500'} />
              <Activity size={16} className="text-accent" />
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Drawer Navigation (Side-Menu overlay) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside 
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-950 z-50 border-r border-slate-800 flex flex-col pt-20"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link to={item.path} key={item.name} onClick={() => setMobileOpen(false)}>
                      <div className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer ${isActive ? 'bg-gradient-to-r from-primary/20 to-secondary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'}`}>
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
              
              <div className="p-4 border-t border-slate-900 space-y-2 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Database</span>
                  <span className={`font-semibold ${dbStatus === 'Online' ? 'text-accent' : 'text-rose-500'}`}>{dbStatus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Layer</span>
                  <span className="text-accent font-semibold">Active</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Container */}
      <div className={`flex-1 flex flex-col min-w-0 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'} pt-16 md:pt-0`}>
        
        {/* Top Header Panel (Desktop Model-Switcher & Global Search) */}
        <header className="h-20 bg-slate-950/40 border-b border-slate-900/80 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-wide">
              {navItems.find(item => item.path === location.pathname)?.name || 'DocuMind Workspace'}
            </h1>
          </div>

          {/* Glowing AI Model Switcher (Pill Layout) */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-full shadow-inner">
            <button
              onClick={() => setModelMode('gemini')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${modelMode === 'gemini' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_8px_rgba(108,99,255,0.2)]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${modelMode === 'gemini' ? 'bg-primary animate-pulse' : 'bg-slate-500'}`}></span>
              Gemini Pro
            </button>
            <button
              onClick={() => setModelMode('openai')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${modelMode === 'openai' ? 'bg-secondary/20 text-secondary border border-secondary/30 shadow-[0_0_8px_rgba(139,92,246,0.2)]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${modelMode === 'openai' ? 'bg-secondary animate-pulse' : 'bg-slate-500'}`}></span>
              OpenAI GPT
            </button>
          </div>
        </header>

        {/* 4. Active Subview Render */}
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

    </div>
  );
};

export default MainDashboardLayout;
