import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainDashboardLayout from './layouts/MainDashboardLayout';

// Pages
import Dashboard from './pages/Dashboard';
import DocAnalysis from './pages/DocAnalysis';
import ImageAnalysis from './pages/ImageAnalysis';
import AIChat from './pages/AIChat';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <Router>
      <MainDashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/docs" element={<DocAnalysis />} />
          <Route path="/images" element={<ImageAnalysis />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          {/* Fallback Route redirects to Dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </MainDashboardLayout>
    </Router>
  );
}

export default App;
