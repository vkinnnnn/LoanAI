
import React, { useState, useRef, useEffect } from 'react';
import { 
    Send, FileText, Bot, PanelRightClose, PanelRightOpen, Sparkles, 
    MessageSquarePlus, Maximize2, Upload, ChevronRight, ScanLine, 
    AlertTriangle, Calendar, DollarSign, BrainCircuit, Volume2, Globe, Copy, Check, Loader2, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createGeminiClient } from '../services/gemini';
import { ChatMessage, DocumentFile } from '../types';

interface DocumentIntegratorProps {
    documents: DocumentFile[];
    activeDocId: string | null;
    setActiveDocId: (id: string) => void;
    onUploadRequest: () => void;
}

// Simulated Extracted Data (In a real app, this comes from the backend analysis)
const MOCK_INSIGHTS = [
    { type: 'risk', label: 'Default Clause', page: 1 },
    { type: 'financial', label: '5.5% Interest Rate', page: 1 },
    { type: 'date', label: 'Due: Oct 24, 2028', page: 1 },
    { type: 'entity', label: 'Global Finance Corp', page: 1 },
];

const SUGGESTED_QUESTIONS = [
    "What are the prepayment penalties?",
    "Explain the interest rate structure.",
    "Are there any hidden fees?",
    "Summarize the default conditions."
];

const PLACEHOLDERS = [
    "Ask about specific clauses...",
    "What risks should I be aware of?",
    "Explain the financial terms...",
    "Translate this section..."
];

const DocumentIntegrator: React.FC<DocumentIntegratorProps> = ({ documents, activeDocId, setActiveDocId, onUploadRequest }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const activeDoc = documents.find(d => d.id === activeDocId);

  // Initial Scanning Effect & Greeting
  useEffect(() => {
    if (activeDoc) {
        setIsScanning(true);
        setMessages([]); // Clear previous chat
        
        // Simulate Analysis Delay
        setTimeout(() => {
            setIsScanning(false);
            setMessages([{ 
                id: 'welcome-analysis',
                role: 'model', 
                text: `**Analysis Complete.**\n\nI've scanned **${activeDoc.name}** and identified several key financial terms and 1 potential risk factor.\n\nI am ready to explain clauses, translate terms, or highlight specific data points. What would you like to tackle first?`, 
                timestamp: new Date() 
            }]);
        }, 2500);
    } else {
        setMessages([]);
    }
  }, [activeDoc?.id]);

  // Rotate Placeholders
  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length);
      }, 4000);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading || !activeDoc) return;

    const userMsg: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: textToSend, 
        timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);
    
    if (!textOverride) setInput('');
    setIsLoading(true);

    try {
        const ai = createGeminiClient();
        const prompt = `
        You are LoanSight, an expert AI Document Analyst.
        
        DOCUMENT CONTEXT (${activeDoc.name}):
        ${activeDoc.content || "No text content available."}
        
        USER QUESTION: ${textToSend}
        
        INSTRUCTIONS:
        1. Answer clearly and professionally.
        2. Use bolding (**text**) for key figures, dates, or terms.
        3. If there is a risk, explicitly mention it with a warning tone.
        4. Keep paragraphs short.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const responseText = response.text;
        setMessages(prev => [...prev, { 
            id: Date.now().toString() + '_ai',
            role: 'model', 
            text: responseText || "I couldn't generate a response at this time.", 
            timestamp: new Date() 
        }]);
    } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { 
            id: Date.now().toString() + '_err',
            role: 'model', 
            text: "Connection error. Please check your API key and try again.", 
            timestamp: new Date() 
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  if (documents.length === 0) {
      return (
          <div className="flex flex-col h-full items-center justify-center bg-background text-textMuted space-y-6">
              <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
                  <div className="w-24 h-24 bg-surfaceHighlight border border-border rounded-3xl flex items-center justify-center relative z-10 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    <FileText className="w-10 h-10 text-textMuted group-hover:text-primary transition-colors" strokeWidth={1.5} />
                  </div>
              </div>
              <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-text tracking-tight">No Documents Loaded</h2>
                  <p className="max-w-md text-sm leading-relaxed text-textMuted">Upload a loan agreement, mortgage contract, or financial statement to unlock the <span className="text-primary">Deep Analysis</span> tools.</p>
              </div>
              <button onClick={onUploadRequest} className="flex items-center gap-2 px-8 py-3 bg-primary text-background font-bold rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(50,184,198,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                  <Upload className="w-4 h-4" /> Import Document
              </button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
        
        {/* Navigation Bar */}
        <div className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center px-4 gap-3 overflow-x-auto no-scrollbar shrink-0 z-20">
            {documents.map((doc) => (
                <button 
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`
                        relative group flex items-center gap-3 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all border
                        ${activeDocId === doc.id 
                            ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' 
                            : 'bg-transparent border-transparent text-textMuted hover:bg-surfaceHighlight hover:text-text'}
                    `}
                >
                    <FileText className="w-4 h-4" />
                    <span className="font-medium truncate max-w-[150px]">{doc.name}</span>
                    {activeDocId === doc.id && (
                        <motion.div layoutId="activeDocIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary mx-4 rounded-t-full" />
                    )}
                </button>
            ))}
        </div>

        <div className="flex-1 flex overflow-hidden relative">
            
            {/* Document Viewer (Paper Metaphor) */}
            <div 
                ref={documentRef}
                className="flex-1 bg-zinc-100/5 dark:bg-[#0c0c0e] relative flex overflow-hidden"
            >
                 {/* Scanning Overlay Effect */}
                 <AnimatePresence>
                    {isScanning && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 pointer-events-none bg-primary/5"
                        >
                            <motion.div 
                                initial={{ top: 0 }}
                                animate={{ top: "100%" }}
                                transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                                className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_40px_rgba(50,184,198,0.8)]"
                            />
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-surface/90 backdrop-blur border border-primary/30 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                <span className="text-sm font-mono text-primary tracking-widest uppercase">Analyzing Logic...</span>
                            </div>
                        </motion.div>
                    )}
                 </AnimatePresence>

                 {/* Insights Sidebar (Left Rail) */}
                 <AnimatePresence>
                    {showInsights && activeDoc && (
                        <motion.div 
                            initial={{ x: -250, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -250, opacity: 0 }}
                            className="w-64 bg-surface border-r border-border flex flex-col z-20 shadow-xl"
                        >
                            <div className="p-4 border-b border-border flex items-center justify-between bg-surfaceHighlight/50">
                                <span className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                                    <BrainCircuit className="w-3 h-3 text-primary" /> Key Findings
                                </span>
                                <button onClick={() => setShowInsights(false)} className="text-textMuted hover:text-text"><X className="w-3 h-3" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {MOCK_INSIGHTS.map((item, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-3 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group"
                                        onClick={() => handleSend(`Explain the "${item.label}" found in the document.`)}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {item.type === 'risk' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                            {item.type === 'financial' && <DollarSign className="w-3 h-3 text-emerald-500" />}
                                            {item.type === 'date' && <Calendar className="w-3 h-3 text-blue-500" />}
                                            {item.type === 'entity' && <Bot className="w-3 h-3 text-purple-500" />}
                                            <span className="text-[10px] uppercase font-bold text-textMuted group-hover:text-primary">{item.type}</span>
                                        </div>
                                        <div className="text-xs font-medium text-text group-hover:text-white">{item.label}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                 </AnimatePresence>

                 {/* Main Content Area */}
                 <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth bg-[#0c0c0e]">
                     <div className="absolute top-6 right-8 flex gap-2 z-20">
                         {!showInsights && (
                            <button onClick={() => setShowInsights(true)} className="p-2 bg-surface/50 hover:bg-surface border border-border/50 rounded-lg text-textMuted hover:text-primary transition-colors backdrop-blur-md">
                                <BrainCircuit className="w-4 h-4" />
                            </button>
                         )}
                        <AnimatePresence>
                            {!isPanelOpen && (
                                <motion.button 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setIsPanelOpen(true)}
                                    className="p-2.5 bg-primary text-white rounded-lg shadow-xl hover:bg-primary/90 transition-all"
                                >
                                    <PanelRightOpen className="w-4 h-4" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                        {isPanelOpen && (
                            <button onClick={() => setIsPanelOpen(false)} className="p-2 bg-surface/50 hover:bg-surface border border-border/50 rounded-lg text-textMuted hover:text-text transition-colors backdrop-blur-md">
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        )}
                     </div>

                     {/* Paper Sheet */}
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-[850px] mx-auto bg-white min-h-[1100px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] p-14 text-zinc-900 font-serif relative"
                     >
                        {activeDoc ? (
                            <>
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-purple-500 opacity-80"></div>
                                <div className="flex justify-between items-center mb-10 border-b border-zinc-200 pb-4">
                                    <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-1">
                                        <ScanLine className="w-3 h-3" /> LoanSight Verified
                                    </span>
                                    <span className="text-xs font-mono text-zinc-400">{activeDoc.id}</span>
                                </div>
                                <h1 className="text-3xl font-bold mb-8 text-zinc-900 leading-tight">{activeDoc.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}</h1>
                                <div className="prose prose-zinc max-w-none text-justify leading-loose text-zinc-800 whitespace-pre-wrap font-serif text-[15px]">
                                    {/* MOCK: In a real app, this would be mapped to spans for highlighting */}
                                    {activeDoc.content}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-300 italic">Select a document to view contents</div>
                        )}
                     </motion.div>
                 </div>
            </div>

            {/* Chat Panel */}
            <motion.div 
                initial={{ width: 450, opacity: 1 }}
                animate={{ width: isPanelOpen ? 450 : 0, opacity: isPanelOpen ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-surface/95 backdrop-blur-md border-l border-border flex flex-col z-30 shadow-2xl relative"
            >
                <div className="min-w-[450px] flex flex-col h-full"> 
                    
                    {/* Chat Header */}
                    <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface animate-pulse"></div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-text">Loan Copilot</h3>
                                <div className="text-[10px] text-textMuted font-mono uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-accent" /> Intelligence Active
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsPanelOpen(false)} className="p-2 hover:bg-surfaceHighlight rounded-lg text-textMuted hover:text-text transition-colors">
                            <PanelRightClose className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {messages.length === 0 && !isScanning && (
                             <div className="flex flex-col items-center justify-center h-full text-textMuted opacity-50 space-y-3">
                                 <Bot className="w-12 h-12 stroke-1" />
                                 <p className="text-sm text-center font-medium">Ready to analyze <br/> <span className="text-primary">{activeDoc?.name}</span></p>
                             </div>
                        )}

                        {messages.map((msg, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`
                                    max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm relative group
                                    ${msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-br-sm' 
                                        : 'bg-surfaceHighlight border border-border text-text rounded-bl-sm'}
                                `}>
                                    {/* Markdown-lite rendering */}
                                    <div className="whitespace-pre-wrap">
                                        {msg.text.split('**').map((part, idx) => 
                                            idx % 2 === 1 ? <span key={idx} className={msg.role === 'model' ? "text-primary font-bold" : "font-bold"}>{part}</span> : part
                                        )}
                                    </div>

                                    {/* Action Bar for AI Messages */}
                                    {msg.role === 'model' && (
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface text-[10px] font-medium text-textMuted hover:text-primary transition-colors" title="Read Aloud">
                                                <Volume2 className="w-3 h-3" /> Listen
                                            </button>
                                            <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface text-[10px] font-medium text-textMuted hover:text-primary transition-colors" title="Translate">
                                                <Globe className="w-3 h-3" /> Translate
                                            </button>
                                            <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface text-[10px] font-medium text-textMuted hover:text-primary transition-colors ml-auto" title="Copy Text">
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-textMuted mt-1 px-1 opacity-50">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex justify-start">
                                 <div className="bg-surfaceHighlight border border-border rounded-2xl px-4 py-3 rounded-bl-sm flex gap-2 items-center">
                                    <div className="flex space-x-1">
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
                                    </div>
                                    <span className="text-xs text-textMuted font-medium animate-pulse">Thinking...</span>
                                 </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-5 border-t border-border bg-surface/50">
                        {/* Suggestion Chips */}
                        {!input && !isLoading && (
                            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                                {SUGGESTED_QUESTIONS.map((q, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleSend(q)}
                                        className="whitespace-nowrap px-3 py-1.5 rounded-full border border-border bg-surface hover:border-primary/50 hover:bg-primary/5 text-xs text-textMuted hover:text-primary transition-all flex-shrink-0"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={!activeDoc || isLoading}
                                placeholder={activeDoc ? PLACEHOLDERS[placeholderIndex] : "Select a document first..."}
                                className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-textMuted/40 text-text shadow-inner"
                            />
                            <button 
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading || !activeDoc}
                                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-primary rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-md active:scale-95"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="text-[10px] text-center text-textMuted mt-2 opacity-60">
                            AI can make mistakes. Verify critical financial details.
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
  );
};

export default DocumentIntegrator;
