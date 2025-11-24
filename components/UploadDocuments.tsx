import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, Loader2, X, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentFile } from '../types';
import { MOCK_LOAN_DOC_CONTENT } from '../services/gemini';

interface UploadDocumentsProps {
    documents: DocumentFile[];
    setDocuments: React.Dispatch<React.SetStateAction<DocumentFile[]>>;
    onUpload: (files: DocumentFile[]) => void;
}

const UploadDocuments: React.FC<UploadDocumentsProps> = ({ documents, setDocuments, onUpload }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processFiles = (uploadedFiles: File[]) => {
    const newDocs: DocumentFile[] = uploadedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
        status: 'uploading',
        uploadDate: 'Just now',
        // In a real app, this would be the result of the backend OCR
        content: `Content for ${file.name}\n\n${MOCK_LOAN_DOC_CONTENT}`, 
        accuracy: 0
    }));

    // Add to global state immediately as 'uploading'
    onUpload(newDocs);

    // Simulate individual processing
    newDocs.forEach(doc => {
        setTimeout(() => {
            setDocuments(prev => prev.map(f => f.id === doc.id ? {...f, status: 'processing'} : f));
            setTimeout(() => {
                setDocuments(prev => prev.map(f => f.id === doc.id ? {...f, status: 'ready', accuracy: Math.random() * (98 - 90) + 90} : f));
            }, 2000);
        }, 800);
    });
  };

  const handleRemoveFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDocuments(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    setDocuments([]);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ready': return 'text-green-400 bg-green-400/10 border-green-400/20';
          case 'processing': return 'text-primary bg-primary/10 border-primary/20';
          case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
          default: return 'text-textMuted bg-surfaceHighlight';
      }
  };

  return (
    <div className="h-full bg-background p-8 overflow-y-auto transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Upload Documents</h1>
            <p className="text-textMuted">Ingest loan documents. These will be used as context for the Voice Agent and Integrator.</p>
        </div>

        {/* Drag Drop Zone */}
        <div 
            className={`
                relative h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300
                ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-surface hover:border-textMuted'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
             <input 
                type="file" 
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={(e) => {
                    if (e.target.files) {
                        processFiles(Array.from(e.target.files));
                    }
                }}
             />
             <div className="w-12 h-12 rounded-full bg-surfaceHighlight flex items-center justify-center mb-3 text-primary">
                <Upload className="w-6 h-6" />
             </div>
             <h3 className="text-base font-medium text-text mb-1">Drag & drop files here</h3>
             <p className="text-xs text-textMuted">Supported: PDF, JPG, PNG (Max 50MB)</p>
        </div>

        {/* File List */}
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-text">
                    Uploaded Context
                    {documents.length > 0 && <span className="text-xs font-normal text-textMuted bg-surfaceHighlight px-2 py-1 rounded-full">{documents.length}</span>}
                </h2>
                {documents.length > 0 && (
                    <button 
                        onClick={handleClearAll}
                        className="text-xs text-textMuted hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-surfaceHighlight"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {documents.map((file) => (
                        <motion.div 
                            key={file.id}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="bg-surface border border-border rounded-xl p-4 flex items-start gap-4 hover:border-primary/30 transition-colors group relative"
                        >
                            <div className="w-10 h-10 rounded-lg bg-surfaceHighlight flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-textMuted group-hover:text-primary transition-colors" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-0.5">
                                    <h4 className="font-medium text-sm text-text truncate pr-4">{file.name}</h4>
                                    <button 
                                        onClick={(e) => handleRemoveFile(e, file.id)}
                                        className="p-1 -mr-1 rounded-md text-textMuted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                        title="Remove file"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-textMuted mb-2">{file.size} • {file.uploadDate}</p>
                                
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${getStatusColor(file.status)}`}>
                                        {file.status === 'processing' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                        {file.status === 'ready' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                        {file.status.toUpperCase()}
                                    </span>
                                    
                                    {file.accuracy && (
                                        <span className="text-[10px] font-mono text-textMuted">
                                            Accuracy: <span className="text-green-400">{file.accuracy.toFixed(1)}%</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {documents.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="col-span-full py-12 text-center border border-dashed border-border rounded-xl bg-surface/30"
                    >
                        <p className="text-textMuted text-sm mb-2">No documents in context.</p>
                        <p className="text-xs text-textMuted opacity-50">Upload files to start analyzing.</p>
                    </motion.div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default UploadDocuments;