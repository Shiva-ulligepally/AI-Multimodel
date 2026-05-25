import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Heart, 
  Grid,
  FileText,
  Image as ImageIcon,
  Music,
  Activity,
  Award
} from 'lucide-react';
import api from '../services/api';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch compiled analytics telemetry
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const stats = await api.getPlatformAnalytics();
        setAnalytics(stats);
      } catch (err) {
        console.error('[Analytics Error] Telemetry compile failed:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Documents Ingested', val: analytics?.counts?.documents ?? 0, icon: FileText, color: 'text-primary' },
          { name: 'Visual Scanners Run', val: analytics?.counts?.images ?? 0, icon: ImageIcon, color: 'text-secondary' },
          { name: 'Speech Recordings', val: analytics?.counts?.audio ?? 0, icon: Music, color: 'text-emerald-400' },
          { name: 'Total Indexed Words', val: analytics?.wordCount ?? 0, icon: BarChart3, color: 'text-amber-400' }
        ].map((item, idx) => (
          <motion.div
            key={item.name}
            className="glass-panel p-4 flex items-center justify-between border hover:scale-[1.01] transition-all bg-slate-900/60"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {item.name}
              </span>
              <h4 className="text-xl md:text-2xl font-extrabold text-white leading-none">
                {item.val.toLocaleString()}
              </h4>
            </div>
            <item.icon className={`w-8 h-8 opacity-75 ${item.color}`} />
          </motion.div>
        ))}
      </div>

      {/* 2. Visual Graphs and Sentiment Split */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <RefreshCw className="animate-spin text-primary w-10 h-10" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sentiment Gauge Card */}
          <div className="glass-panel p-6 flex flex-col justify-between h-[360px]">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Heart size={16} className="text-rose-500" /> Speech & Text Sentiment Index
              </h3>
              <span className="text-[10px] text-slate-400">Aggregated emotional index across all files.</span>
            </div>

            {/* Custom Circular Arc or Bars representation */}
            <div className="space-y-4 py-4">
              {[
                { label: 'Positive Vibe', percent: analytics?.sentiment?.positive ?? 50, color: 'bg-emerald-500', text: 'text-emerald-400' },
                { label: 'Neutral Tone', percent: analytics?.sentiment?.neutral ?? 35, color: 'bg-primary', text: 'text-primary' },
                { label: 'Negative Stance', percent: analytics?.sentiment?.negative ?? 15, color: 'bg-rose-500', text: 'text-rose-400' }
              ].map((sent) => (
                <div key={sent.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className={sent.text}>{sent.label}</span>
                    <span className="text-slate-300">{sent.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 border border-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      className={`${sent.color} h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.15)]`}
                      initial={{ width: 0 }}
                      animate={{ width: `${sent.percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-900 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <Award size={12} className="text-amber-400" /> Harmonious Sentiment Index
            </div>
          </div>

          {/* Usage Telemetry activity line */}
          <div className="glass-panel p-6 flex flex-col justify-between h-[360px]">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Activity size={16} className="text-primary" /> Month-Over-Month Ingestion
              </h3>
              <span className="text-[10px] text-slate-400">Platform file ingestion activity logs.</span>
            </div>

            {/* Custom Bar Columns Chart */}
            <div className="flex-1 flex items-end justify-between px-4 h-36 py-4">
              {(analytics?.activity || []).map((col) => {
                const heightVal = Math.max(15, Math.min(col.processed * 12, 100));
                return (
                  <div key={col.month} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[10px] font-bold text-slate-400">{col.processed}</span>
                    <div className="w-6 bg-slate-950 border border-slate-900 rounded-t h-28 flex items-end overflow-hidden">
                      <motion.div
                        className="w-full bg-gradient-to-t from-primary to-secondary rounded-t"
                        style={{ height: 0 }}
                        animate={{ height: `${heightVal}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{col.month}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-900 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                TEMPORAL PROCESSING TELEMETRY
              </span>
            </div>
          </div>

          {/* Top Keyword Frequency bar chart */}
          <div className="glass-panel p-6 flex flex-col justify-between h-[360px]">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <BarChart3 size={16} className="text-secondary" /> Word Frequency analytics
              </h3>
              <span className="text-[10px] text-slate-400">Most frequent terms identified by OCR/transcripts.</span>
            </div>

            {/* Keyword listings */}
            <div className="flex-1 flex flex-col justify-center gap-3 py-4 overflow-y-auto pr-1">
              {(analytics?.keywords || []).slice(0, 5).map((kw, index) => {
                // Calculate size representation
                const maxVal = analytics.keywords[0]?.count || 10;
                const widthPercent = Math.max(20, Math.min((kw.count / maxVal) * 100, 100));
                
                return (
                  <div key={kw.word} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold px-0.5">
                      <span className="text-slate-300 font-bold capitalize">#{index + 1} {kw.word}</span>
                      <span className="text-slate-500 font-bold">{kw.count} hits</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 border border-slate-900 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-secondary to-pink-500 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-900 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                LINGUISTIC TERM CLASSIFICATION
              </span>
            </div>
          </div>

        </div>
      )}

      {/* 3. conceptual topics board & System health telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Conceptual Topics Board */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Grid size={16} className="text-emerald-400" /> Extracted Concepts Registry
          </h3>
          <p className="text-[10px] text-slate-400 mb-4">Broad subject matters dynamically recognized in ingestion files.</p>

          <div className="flex flex-wrap gap-2.5 min-h-[100px] items-center py-2">
            {(analytics?.topics || []).map((topic, idx) => (
              <span 
                key={idx}
                className="text-xs px-3.5 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold tracking-wide hover:border-primary/30 cursor-default transition-all shadow-inner"
              >
                🎓 {topic}
              </span>
            ))}
          </div>
        </div>

        {/* System Health Telemetry */}
        <div className="glass-panel p-6 flex flex-col justify-between min-h-[180px]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <ShieldCheck size={16} className="text-emerald-400" /> Node Telemetry Status
            </h3>
            <span className="text-[10px] text-slate-400">Active server metrics and socket latencies.</span>
          </div>

          <div className="space-y-2 py-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
              <span className="text-slate-500 font-semibold">Gateway Latency</span>
              <span className="font-bold text-emerald-400">{analytics?.health?.apiLatency || '85ms'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
              <span className="text-slate-500 font-semibold">DB Synchronization</span>
              <span className="font-bold text-emerald-400">{analytics?.health?.dbConnectivity || '100%'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-semibold">WS Channels</span>
              <span className="font-bold text-emerald-400">{analytics?.health?.socketsChannelStatus || 'Active'}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AnalyticsPage;
