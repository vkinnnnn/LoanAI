import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Bot, PanelRightClose, PanelRightOpen, Sparkles, MessageSquarePlus, Maximize2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createGeminiClient } from '../services/gemini';
import { ChatMessage, DocumentFile } from '../types';

interface DocumentIntegratorProps {
    documents: DocumentFile[];
    activeDocId: string | null;
    setActiveDocId: (id: string) => void;
    onUploadRequest: () => void;
}

const DocumentIntegrator: React.FC<DocumentIntegratorProps> = ({ documents, activeDocId, setActiveDocId, onUploadRequest }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, text: string} | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  const activeDoc = documents.find(d => d.id === activeDocId);

  // Initialize chat when doc changes
  useEffect(() => {
    if (activeDoc) {
        setMessages([{ 
            role: 'model', 
            text: `Hello! I have loaded "${activeDoc.name}". I am ready to analyze its specific clauses, risks, or data points.`, 
            timestamp: new Date() 
        }]);
    } else {
        setMessages([]);
    }
  }, [activeDoc?.id]); // Only trigger if ID changes

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading || !activeDoc) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    
    if (!textOverride) setInput('');
    setIsLoading(true);

    try {
        const ai = createGeminiClient();
        
        // Context injection using the ACTUAL document content
        const prompt = `
        You are an expert Document Analyst.
        
        DOCUMENT CONTEXT (${activeDoc.name}):
        ${activeDoc.content || "No text content available."}
        
        USER QUESTION: 
        ${textToSend}
        
        Please provide a specific, evidence-based answer citing the document where possible.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a professional assistant. Be concise and precise."
            }
        });

        const responseText = response.text;
        setMessages(prev => [...prev, { role: 'model', text: responseText || "No response generated.", timestamp: new Date() }]);
    } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { role: 'model', text: "Error analyzing document. Check API Key.", timestamp: new Date() }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectionMenu(null);
        return;
    }

    const text = selection.toString();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if (documentRef.current) {
         const containerRect = documentRef.current.getBoundingClientRect();
         setSelectionMenu({
             x: (rect.left + rect.width / 2) - containerRect.left,
             y: rect.top - containerRect.top - 45,
             text: text
         });
    }
  };

  const handleAskAboutSelection = () => {
      if (selectionMenu) {
          if (!isPanelOpen) setIsPanelOpen(true);
          handleSend(`Analyze this specific section:\n"${selectionMenu.text}"`);
          setSelectionMenu(null);
          window.getSelection()?.removeAllRanges();
      }
  };

  if (documents.length === 0) {
      return (
          <div className="flex flex-col h-full items-center justify-center bg-background text-textMuted space-y-4">
              <div className="w-16 h-16 bg-surfaceHighlight rounded-full flex items-center justify-center mb-2">
                  <FileText className="w-8 h-8 opacity-50" />
              </div>
              <h2 className="text-xl font-semibold text-text">No Documents Available</h2>
              <p className="max-w-md text-center text-sm">Upload documents to start using the deep analysis tools.</p>
              <button 
                onClick={onUploadRequest}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                  <Upload className="w-4 h-4" /> Go to Upload
              </button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden transition-colors duration-300">
        
        {/* Top Carousel Navigation */}
        <div className="h-14 bg-surface border-b border-border flex items-center px-4 gap-3 overflow-x-auto no-scrollbar transition-colors duration-300 shrink-0">
            {documents.map((doc) => (
                <button 
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap transition-all
                        ${activeDocId === doc.id 
                            ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(76,139,245,0.1)]' 
                            : 'bg-surfaceHighlight border-transparent text-textMuted hover:text-text hover:bg-surfaceHighlight/80'}
                    `}
                >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px]">{doc.name}</span>
                </button>
            ))}
        </div>

        {/* Split Screen Content */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Left Panel: Document Viewer */}
            <div 
                ref={documentRef}
                className="flex-1 bg-background border-r border-border p-8 overflow-y-auto relative transition-all duration-300 scroll-smooth"
                onMouseUp={handleMouseUp}
            >
                 {/* Toolbar */}
                 <div className="absolute top-4 right-8 flex gap-2 z-10">
                    <AnimatePresence>
                        {!isPanelOpen && (
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => setIsPanelOpen(true)}
                                className="p-2 bg-primary/90 rounded hover:bg-primary text-white shadow-lg transition"
                                title="Open Assistant"
                            >
                                <PanelRightOpen className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                    {isPanelOpen && (
                        <button 
                            onClick={() => setIsPanelOpen(false)}
                            className="p-2 bg-black/10 hover:bg-black/20 dark:bg-black/50 dark:hover:bg-black/80 rounded text-text transition"
                            title="Maximize Document"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    )}
                 </div>

                 {/* Document Rendering Area */}
                 <div className="max-w-[800px] mx-auto bg-white min-h-[1000px] shadow-2xl p-12 text-black font-serif selection:bg-blue-200 selection:text-black">
                    {activeDoc ? (
                        <>
                            <div className="text-xs text-gray-400 mb-8 border-b pb-2 flex justify-between select-none">
                                <span>CONFIDENTIAL</span>
                                <span>{activeDoc.name}</span>
                            </div>
                            <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 uppercase">{activeDoc.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}</h1>
                            <p className="text-justify leading-relaxed text-gray-800 whitespace-pre-wrap font-mono text-sm">
                                {activeDoc.content}
                            </p>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">Select a document</div>
                    )}
                 </div>

                 {/* Floating Context Menu */}
                 <AnimatePresence>
                    {selectionMenu && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute z-50 transform -translate-x-1/2"
                            style={{ left: selectionMenu.x, top: selectionMenu.y }}
                        >
                            <button 
                                onClick={handleAskAboutSelection}
                                className="bg-surface border border-border text-text shadow-xl rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-primary hover:text-white hover:border-primary transition-all group"
                            >
                                <Sparkles className="w-4 h-4 text-accent group-hover:text-white" />
                                <span className="text-sm font-medium">Ask Copilot</span>
                            </button>
                            <div className="w-3 h-3 bg-surface border-b border-r border-border transform rotate-45 absolute left-1/2 -ml-1.5 -bottom-1.5 shadow-sm"></div>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </div>

            {/* Right Panel: Context Aware Assistant */}
            <motion.div 
                initial={{ width: 450, opacity: 1 }}
                animate={{ 
                    width: isPanelOpen ? 450 : 0, 
                    opacity: isPanelOpen ? 1 : 0 
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-surface flex flex-col border-l border-border overflow-hidden transition-colors duration-300"
            >
                <div className="min-w-[450px] flex flex-col h-full"> 
                    <div className="p-4 border-b border-border flex items-center justify-between bg-surface transition-colors duration-300">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-text">Loan Copilot</h3>
                                <p className="text-[10px] text-textMuted flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${activeDoc ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {activeDoc ? 'Context Active' : 'No Context'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsPanelOpen(false)}
                            className="p-2 hover:bg-surfaceHighlight rounded text-textMuted hover:text-text transition-colors"
                        >
                            <PanelRightClose className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                             <div className="text-center text-textMuted text-xs mt-10">
                                 Ask me anything about <br/> <span className="text-primary font-medium">{activeDoc?.name}</span>
                             </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap
                                    ${msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-br-none' 
                                        : 'bg-surfaceHighlight text-text rounded-bl-none border border-border'}
                                `}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                 <div className="bg-surfaceHighlight rounded-2xl p-3 rounded-bl-none flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce delay-100"></span>
                                    <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce delay-200"></span>
                                 </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-border bg-surface transition-colors duration-300">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={!activeDoc}
                                placeholder={activeDoc ? "Ask about specific clauses..." : "Select a document first..."}
                                className="w-full bg-surfaceHighlight border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-textMuted/50 text-text disabled:opacity-50"
                            />
                            <button 
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading || !activeDoc}
                                className="absolute right-2 top-2 p-1.5 bg-primary rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

        </div>
    </div>
  );
};

export default DocumentIntegrator;