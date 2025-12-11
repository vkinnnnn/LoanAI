
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TalkToDocuments from './components/TalkToDocuments';
import UploadDocuments from './components/UploadDocuments';
import DocumentIntegrator from './components/DocumentIntegrator';
import LandingPage from './components/LandingPage';
import { ViewMode, DocumentFile } from './types';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.UPLOAD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Global Document State
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  useEffect(() => {
    // Sync React state with localStorage/DOM on mount
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Enforce Workflow: If no documents, force view to UPLOAD
  useEffect(() => {
    if (documents.length === 0 && currentView !== ViewMode.UPLOAD) {
      setCurrentView(ViewMode.UPLOAD);
    }
  }, [documents, currentView]);

  // Safety Check: Ensure activeDocId points to a valid document
  useEffect(() => {
    if (documents.length > 0) {
      if (!activeDocId || !documents.find(d => d.id === activeDocId)) {
        setActiveDocId(documents[0].id);
      }
    } else {
      setActiveDocId(null);
    }
  }, [documents, activeDocId]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleUploadFiles = (newFiles: DocumentFile[]) => {
    setDocuments(prev => {
        const updated = [...newFiles, ...prev];
        if (!activeDocId && newFiles.length > 0) {
            setActiveDocId(newFiles[0].id);
        }
        return updated;
    });
    if (!activeDocId && newFiles.length > 0) {
        setActiveDocId(newFiles[0].id);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewMode.TALK_TO_DOCS:
        return (
            <TalkToDocuments 
                documents={documents}
                activeDocId={activeDocId}
                setActiveDocId={setActiveDocId}
                onUploadRequest={() => setCurrentView(ViewMode.UPLOAD)}
            />
        );
      case ViewMode.UPLOAD:
        return (
            <UploadDocuments 
                documents={documents} 
                setDocuments={setDocuments} 
                onUpload={handleUploadFiles}
            />
        );
      case ViewMode.COPILOT:
        return (
            <DocumentIntegrator 
                documents={documents}
                activeDocId={activeDocId}
                setActiveDocId={setActiveDocId}
                onUploadRequest={() => setCurrentView(ViewMode.UPLOAD)}
            />
        );
      default:
        return <UploadDocuments documents={documents} setDocuments={setDocuments} onUpload={handleUploadFiles} />;
    }
  };

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  return (
    <div className="flex h-screen w-screen bg-background text-text overflow-hidden font-sans transition-colors duration-500 relative selection:bg-primary/20">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
           style={{
             backgroundImage: `linear-gradient(to right, var(--color-border) 1px, transparent 1px),
                               linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }}
      />

      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        toggleTheme={toggleTheme}
        hasDocuments={documents.length > 0}
      />
      
      <main className="flex-1 relative flex flex-col min-w-0 z-10">
        {!process.env.API_KEY && (
           <div className="absolute top-0 left-0 right-0 bg-red-500/10 backdrop-blur-md text-red-200 p-2 text-center text-xs z-50 border-b border-red-500/20 font-mono">
             [System Warning] API_KEY environment variable missing.
           </div>
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 h-full w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
