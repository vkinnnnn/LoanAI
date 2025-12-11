
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, Loader2, X, Trash2, File, AlertCircle, ShieldCheck, BrainCircuit, Mic, Globe, Lock, ScanLine } from 'lucide-react';
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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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
    // 1. Create initial entries with "uploading" status
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

    // Update state to show loading immediately
    onUpload(newDocs);

    // 2. Process each file via Backend API
    for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const docId = newDocs[i].id;

        // Set to processing
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'processing' } : d));

        try {
            // CALL REAL BACKEND
            const result = await api.uploadDocument(file);
            
            setDocuments(prev => prev.map(d => d.id === docId ? { 
                ...d, 
                status: 'ready', 
                content: result.content,
                accuracy: result.accuracy
            } : d));
        } catch (error) {
            console.error(`Failed to process ${file.name}`, error);
            setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d));
        }
    }
  };

  const handleRemoveFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDocuments(prev => prev.filter(f => f.id !== id));
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ready': return 'text-primary bg-primary/10 border-primary/20';
          case 'processing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
          case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
          default: return 'text-zinc-500 bg-zinc-500/10';
      }
  };

  return (
    <div className="h-full bg-background p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header - Empowering Copy */}
        <div className="space-y-3 relative z-10">
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surfaceHighlight border border-white/5 text-[10px] uppercase tracking-widest text-textMuted font-mono mb-2"
            >
                <Lock className="w-3 h-3 text-primary" /> Private Ephemeral Session
            </motion.div>
            <h1 className="text-4xl font-bold text-text tracking-tight">Initialize Loan Intelligence</h1>
            <p className="text-textMuted max-w-2xl text-lg font-light leading-relaxed">
                Transform dense legalese into clear, actionable answers. <br/>
                Upload your agreement to enable <span className="text-primary font-medium">Risk Detection</span>, <span className="text-accent font-medium">Voice Analysis</span>, and <span className="text-white font-medium">Instant Clarity</span>.
            </p>
        </div>

        {/* Intelligence Portal Drop Zone */}
        <div 
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`
                relative h-64 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden group border border-dashed
                ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-surface/30 hover:bg-surface/50 hover:border-primary/50'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
        >
             {/* Spotlight Gradient */}
             <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(50, 184, 198, 0.1), transparent 40%)`,
                }}
             />
             
             {/* Animated Background Grid */}
             <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" 
                  style={{ backgroundImage: 'linear-gradient(#32b8c6 1px, transparent 1px), linear-gradient(90deg, #32b8c6 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
             </div>

             <input 
                id="file-upload"
                type="file" 
                multiple
                className="hidden" 
                onChange={(e) => {
                    if (e.target.files) {
                        processFiles(Array.from(e.target.files));
                    }
                }}
             />
             
             <div className="flex flex-col items-center gap-6 z-10 relative">
                <div className="relative">
                    {/* Pulsing Rings */}
                    <div className={`absolute inset-0 bg-primary rounded-full blur-xl opacity-20 ${dragActive ? 'animate-pulse' : 'group-hover:animate-pulse'}`}></div>
                    <div className={`
                        w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 border border-white/10 shadow-2xl
                        ${dragActive ? 'bg-primary text-white scale-110 rotate-3' : 'bg-surfaceHighlight text-primary group-hover:scale-110 group-hover:bg-surface'}
                    `}>
                        <Upload className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                </div>
                
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-medium text-text group-hover:text-white transition-colors">
                        {dragActive ? "Drop to Analyze" : "Drag & Drop to Decode"}
                    </h3>
                    <p className="text-sm text-textMuted max-w-sm">
                        Support for PDF, Images, and Text. <br/>
                        <span className="opacity-50 text-xs">Files are processed securely in memory.</span>
                    </p>
                </div>

                <div className="flex gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                     <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-textMuted">
                        <FileText className="w-3 h-3" /> PDF
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-textMuted">
                        <ScanLine className="w-3 h-3" /> OCR
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-textMuted">
                        <ShieldCheck className="w-3 h-3" /> Secure
                     </div>
                </div>
             </div>
        </div>

        {/* Content Area: Feature Preview OR File List */}
        <div className="space-y-6">
            
            {documents.length === 0 ? (
                /* Empty State: Feature Preview */
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {[
                        { icon: ShieldCheck, title: "Risk Guard", desc: "Auto-detects hidden fees, variable rates, and default clauses." },
                        { icon: Mic, title: "Voice Agent", desc: "Have a real-time conversation with your loan document." },
                        { icon: Globe, title: "Universal Translator", desc: "Instantly translate complex terms into your native language." }
                    ].map((feature, i) => (
                        <div key={i} className="p-6 rounded-xl bg-surface/30 border border-white/5 hover:border-primary/20 hover:bg-surface/50 transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-surfaceHighlight flex items-center justify-center mb-4 text-textMuted group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                <feature.icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-text mb-2">{feature.title}</h3>
                            <p className="text-xs text-textMuted leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </motion.div>
            ) : (
                /* Active State: Document List */
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-text">
                            Active Context <span className="text-xs font-normal text-textMuted ml-2 bg-surfaceHighlight px-2 py-0.5 rounded-full border border-white/5">{documents.length}</span>
                        </h2>
                        <button 
                            onClick={() => setDocuments([])}
                            className="text-xs font-medium text-textMuted hover:text-red-400 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-md hover:bg-red-400/10"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Clear Session
                        </button>
                    </div>

                    <div className="border border-border rounded-xl bg-surface/30 backdrop-blur-sm overflow-hidden min-h-[300px] flex flex-col">
                        <div className="w-full">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-surfaceHighlight/30 text-[11px] font-bold text-textMuted uppercase tracking-wider">
                                <div className="col-span-5">File Name</div>
                                <div className="col-span-2">Size</div>
                                <div className="col-span-2">Date</div>
                                <div className="col-span-2">Analysis Status</div>
                                <div className="col-span-1 text-right"></div>
                            </div>
                            
                            {/* Table Rows */}
                            <div className="divide-y divide-border/50">
                                <AnimatePresence mode="popLayout">
                                    {documents.map((file, i) => (
                                        <motion.div 
                                            key={file.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors text-sm group"
                                        >
                                            {/* Name */}
                                            <div className="col-span-5 flex items-center gap-4 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-surfaceHighlight border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                                                    <FileText className="w-5 h-5 text-textMuted group-hover:text-primary transition-colors" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="truncate font-medium text-text group-hover:text-primary transition-colors">{file.name}</span>
                                                    <span className="text-[10px] text-textMuted md:hidden">{file.size}</span>
                                                </div>
                                            </div>

                                            {/* Size */}
                                            <div className="col-span-2 text-textMuted text-xs font-mono hidden md:block">{file.size}</div>

                                            {/* Date */}
                                            <div className="col-span-2 text-textMuted text-xs hidden md:block">{file.uploadDate}</div>

                                            {/* Status */}
                                            <div className="col-span-3 md:col-span-2">
                                                 <span className={`text-[10px] px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 font-medium shadow-sm uppercase tracking-wide ${getStatusColor(file.status)}`}>
                                                    {file.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                                                    {file.status === 'ready' && <BrainCircuit className="w-3 h-3" />}
                                                    {file.status === 'error' && <AlertCircle className="w-3 h-3" />}
                                                    {file.status === 'ready' ? 'Analyzed' : file.status}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-2 md:col-span-1 flex justify-end">
                                                <button 
                                                    onClick={(e) => handleRemoveFile(e, file.id)}
                                                    className="p-2 rounded-lg text-textMuted hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Remove file"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>

      </div>
    </div>
  );
};

export default UploadDocuments;
