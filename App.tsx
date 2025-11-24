import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TalkToDocuments from './components/TalkToDocuments';
import UploadDocuments from './components/UploadDocuments';
import DocumentIntegrator from './components/DocumentIntegrator';
import { ViewMode, DocumentFile } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.UPLOAD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Global Document State
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Derived active document
  const activeDocument = documents.find(d => d.id === activeDocId);

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

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleUploadFiles = (newFiles: DocumentFile[]) => {
    setDocuments(prev => {
        const updated = [...newFiles, ...prev];
        // If no active doc, set the first new one as active
        if (!activeDocId && newFiles.length > 0) {
            setActiveDocId(newFiles[0].id);
        }
        return updated;
    });
    // If we have new files, verify active ID is set if it was null
    if (!activeDocId && newFiles.length > 0) {
        setActiveDocId(newFiles[0].id);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewMode.TALK_TO_DOCS:
        return (
            <TalkToDocuments 
                activeDocument={activeDocument} 
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
      case ViewMode.INTEGRATOR:
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

  return (
    <div className="flex h-screen w-screen bg-background text-text overflow-hidden font-sans transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        toggleTheme={toggleTheme}
        hasDocuments={documents.length > 0}
      />
      
      <main className="flex-1 relative flex flex-col min-w-0">
        {/* API Key Warning Overlay (Only if env is missing) */}
        {!process.env.API_KEY && (
           <div className="absolute top-0 left-0 right-0 bg-red-500/10 text-red-200 p-2 text-center text-xs z-50 border-b border-red-500/20">
             Warning: process.env.API_KEY is missing. AI features will not function correctly.
           </div>
        )}
        
        {renderView()}
      </main>
    </div>
  );
};

export default App;