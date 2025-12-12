import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, X, Trash2, AlertCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentFile } from '../types';
import { api } from '../services/api';

interface UploadDocumentsProps {
    documents: DocumentFile[];
    setDocuments: React.Dispatch<React.SetStateAction<DocumentFile[]>>;
    onUpload: (files: DocumentFile[]) => void;
}

const UploadDocuments: React.FC<UploadDocumentsProps> = ({ documents, setDocuments, onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

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

  const processFiles = async (uploadedFiles: File[]) => {
    const newDocs: DocumentFile[] = uploadedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
        status: 'uploading',
        uploadDate: new Date().toLocaleDateString(),
        content: '', 
        accuracy: 0
    }));
    onUpload(newDocs);

    for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const docId = newDocs[i].id;
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'processing' } : d));
        try {
            const result = await api.uploadDocument(file);
            setDocuments(prev => prev.map(d => d.id === docId ? { 
                ...d, status: 'ready', content: result.content, accuracy: result.accuracy
            } : d));
        } catch (error) {
            setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d));
        }
    }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'ready': 
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]"></div>
                    Ready
                </div>
            );
          case 'processing': 
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing
                </div>
            );
          case 'error': 
             return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                    <AlertCircle className="w-3 h-3" />
                    Error
                </div>
            );
          default: 
            return <div className="text-[10px] text-textMuted uppercase">Uploading...</div>;
      }
  };

  return (
    <div className="h-full bg-background p-6 md:p-12 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="space-y-4">
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-primary"
            >
                <Lock className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-widest text-primary/80">Secure Environment</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-text tracking-tight">Initialize Workspace</h1>
            <p className="text-lg text-textMuted max-w-2xl font-light">
                Upload your contracts for <span className="text-white font-medium">real-time semantic analysis</span>. 
                Data is processed in-memory and discarded after the session.
            </p>
        </div>

        {/* Holographic Drop Zone */}
        <div 
            ref={divRef}
            onMouseMove={handleMouseMove}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
            className={`
                relative h-72 rounded-3xl border border-dashed transition-all duration-500 cursor-pointer overflow-hidden group
                ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-surface/30 hover:bg-surface/50 hover:border-primary/30'}
            `}
        >
             {/* Mouse Spotlight */}
             <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500"
                style={{ background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(50, 184, 198, 0.15), transparent 40%)` }}
             />
             
             {/* Grid */}
             <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

             <input id="file-upload" type="file" multiple className="hidden" onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))} />
             
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
                <div className={`
                    w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl
                    ${dragActive ? 'bg-primary scale-110 rotate-12' : 'bg-surfaceHighlight border border-white/10 group-hover:scale-105 group-hover:border-primary/50'}
                `}>
                    <Upload className={`w-8 h-8 ${dragActive ? 'text-black' : 'text-primary'}`} strokeWidth={1.5} />
                </div>
                
                <div className="text-center space-y-1">
                    <h3 className="text-xl font-medium text-white group-hover:text-primary transition-colors">
                        {dragActive ? "Release to Ingest" : "Drop Document Here"}
                    </h3>
                    <p className="text-sm text-textMuted">Support for PDF, TXT, OCR Images</p>
                </div>
             </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-lg font-medium text-white flex items-center gap-2">
                    Session Files <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-zinc-400">{documents.length}</span>
                </h2>
                {documents.length > 0 && (
                     <button onClick={() => setDocuments([])} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                         <Trash2 className="w-3 h-3" /> Clear
                     </button>
                )}
            </div>
            
            <AnimatePresence mode="popLayout">
                {documents.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-6 h-6 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm">No documents in active memory.</p>
                    </motion.div>
                ) : (
                    <div className="grid gap-3">
                        {documents.map((file, i) => (
                            <motion.div 
                                key={file.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="group relative bg-surface/40 hover:bg-surface/80 border border-white/5 hover:border-white/10 rounded-xl p-4 flex items-center gap-4 transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/5 to-white/0 border border-white/10 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-primary opacity-80" strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-medium text-sm text-zinc-200 truncate">{file.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                                        <span>{file.size}</span>
                                        <span>•</span>
                                        <span>{file.uploadDate}</span>
                                    </div>
                                </div>
                                <div>{getStatusBadge(file.status)}</div>
                                
                                {/* Hover Actions */}
                                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-surface pl-4">
                                     <button onClick={() => setDocuments(prev => prev.filter(d => d.id !== file.id))} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-zinc-500 transition-colors">
                                        <X className="w-4 h-4" />
                                     </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default UploadDocuments;