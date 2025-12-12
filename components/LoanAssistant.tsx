
import React, { useState, useRef, useEffect } from 'react';
import { 
    Send, Mic, MicOff, Sparkles, Upload, PanelRightClose, PanelRightOpen,
    Loader2, Volume2, Globe, Copy, BrainCircuit, ScanLine, Maximize2, X,
    FileText, Bot, Play, Pause, FastForward, Check, ChevronDown, BookOpen, AlertTriangle, Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { base64ToUint8Array, decodeAudioData, pcmToBlob } from '../services/audioUtils';
import { createGeminiClient } from '../services/gemini';
import { ChatMessage, DocumentFile } from '../types';

const SAMPLE_RATE = 16000;
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

interface LoanAssistantProps {
    documents: DocumentFile[];
    activeDocId: string | null;
    setActiveDocId: (id: string) => void;
    onUploadRequest: () => void;
}

const SUGGESTED_QUESTIONS = [
    "What is the interest rate?",
    "Are there penalties?",
    "Summarize risks",
    "Explain defaults"
];

const LANGUAGES = [
    { code: 'Spanish', label: 'Español', flag: '🇪🇸' },
    { code: 'Hindi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'French', label: 'Français', flag: '🇫🇷' },
    { code: 'German', label: 'Deutsch', flag: '🇩🇪' },
];

const LoanAssistant: React.FC<LoanAssistantProps> = ({ documents, activeDocId, setActiveDocId, onUploadRequest }) => {
    const activeDoc = documents.find(d => d.id === activeDocId);
    
    // UI State
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [showInsights, setShowInsights] = useState(true);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Selection State
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [showTranslateMenu, setShowTranslateMenu] = useState(false);

    // TTS State
    const [isReading, setIsReading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [readingSpeed, setReadingSpeed] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoadingText, setIsLoadingText] = useState(false);

    // Voice State
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    // Audio Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionRef = useRef<Promise<any> | null>(null);
    const isActiveRef = useRef(false); // Safety ref for async callbacks
    const inputBuffer = useRef('');
    const outputBuffer = useRef('');
    const [streamedInput, setStreamedInput] = useState('');
    const [streamedOutput, setStreamedOutput] = useState('');

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamedInput, streamedOutput, isLoadingText, selectedText]);

    useEffect(() => {
        return () => { cleanupAudio(); stopReading(); };
    }, []);

    useEffect(() => {
        if (activeDoc && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'model',
                text: `I've analyzed **${activeDoc.name}**. \n\nYou can ask questions, use **Voice Mode** for a conversation, or select text on the left to analyze specific clauses.`,
                timestamp: new Date(),
                mode: 'text'
            }]);
        }
    }, [activeDoc?.id]);

    // --- TTS (Web Speech) ---
    useEffect(() => { if (typeof window !== 'undefined') synthRef.current = window.speechSynthesis; }, []);

    const startReading = (text: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = readingSpeed;
        utterance.onend = () => { setIsReading(false); setIsPaused(false); };
        synthRef.current.speak(utterance);
        setIsReading(true);
        setIsPaused(false);
    };

    const stopReading = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsReading(false);
            setIsPaused(false);
        }
    };

    // --- SELECTION ---
    const handleDocumentMouseUp = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            setSelectedText(selection.toString());
            if (!isPanelOpen) setIsPanelOpen(true);
        }
    };

    const clearSelection = () => {
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
        stopReading();
    };

    const handleAction = async (type: 'explain' | 'translate', extra?: string) => {
        if (!selectedText) return;
        const prompt = type === 'explain' 
            ? `Explain this clause in simple terms:\n"${selectedText}"`
            : `Translate to ${extra}:\n"${selectedText}"`;
        
        const display = type === 'explain' 
            ? `Explain: "${selectedText.substring(0, 20)}..."` 
            : `Translate (${extra}): "${selectedText.substring(0, 20)}..."`;
            
        handleSendText(prompt, display);
        clearSelection();
    };

    // --- AUDIO ---
    const cleanupAudio = () => {
        isActiveRef.current = false;
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current.onaudioprocess = null; }
        if (sourceRef.current) sourceRef.current.disconnect();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (inputContextRef.current) inputContextRef.current.close();
        if (audioContextRef.current) audioContextRef.current.close();
        processorRef.current = null; sourceRef.current = null; streamRef.current = null;
        inputContextRef.current = null; audioContextRef.current = null; sessionRef.current = null;
        setIsVoiceActive(false); setStreamedInput(''); setStreamedOutput('');
    };

    const toggleVoiceSession = async () => {
        if (isVoiceActive) { cleanupAudio(); return; }
        try {
            if (!activeDoc) return;
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API Key missing");

            setIsVoiceActive(true); setIsMuted(false);
            isActiveRef.current = true;
            const ai = new GoogleGenAI({ apiKey });
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            sessionRef.current = ai.live.connect({
                model: LIVE_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    systemInstruction: `You are a Loan Assistant. Context: ${activeDoc.content}. Be concise.`,
                },
                callbacks: {
                    onopen: () => {
                        if (!isActiveRef.current || !inputContextRef.current) return;
                        const ctx = inputContextRef.current!;
                        const source = ctx.createMediaStreamSource(streamRef.current!);
                        const processor = ctx.createScriptProcessor(4096, 1, 1);
                        processor.onaudioprocess = (e) => {
                            if (!isActiveRef.current) return;
                            const blob = pcmToBlob(e.inputBuffer.getChannelData(0), SAMPLE_RATE);
                            sessionRef.current?.then(session => session.sendRealtimeInput({ media: blob }));
                        };
                        source.connect(processor); processor.connect(ctx.destination);
                        sourceRef.current = source; processorRef.current = processor;
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (!isActiveRef.current) return;
                        if (msg.serverContent?.inputTranscription?.text) setStreamedInput(p => p + msg.serverContent!.inputTranscription!.text);
                        if (msg.serverContent?.outputTranscription?.text) setStreamedOutput(p => p + msg.serverContent!.outputTranscription!.text);
                        
                        if (msg.serverContent?.turnComplete) {
                            if (inputBuffer.current) {
                                setMessages(prev => [...prev, { id: Date.now()+'u', role: 'user', text: inputBuffer.current, timestamp: new Date(), mode: 'voice' }]);
                                inputBuffer.current = ''; setStreamedInput('');
                            }
                            if (outputBuffer.current) {
                                setMessages(prev => [...prev, { id: Date.now()+'m', role: 'model', text: outputBuffer.current, timestamp: new Date(), mode: 'voice' }]);
                                outputBuffer.current = ''; setStreamedOutput('');
                            }
                        }
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
                            const buffer = await decodeAudioData(base64ToUint8Array(audioData), audioContextRef.current);
                            const source = audioContextRef.current.createBufferSource();
                            source.buffer = buffer; source.connect(audioContextRef.current.destination);
                            const t = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
                            source.start(t); nextStartTimeRef.current = t + buffer.duration;
                        }
                    },
                    onclose: cleanupAudio, onerror: cleanupAudio
                }
            });
        } catch (e) { console.error(e); cleanupAudio(); }
    };

    const handleSendText = async (text: string, display?: string) => {
        if (!text.trim() || !activeDoc) return;
        setMessages(p => [...p, { id: Date.now().toString(), role: 'user', text: display || text, timestamp: new Date(), mode: 'text' }]);
        if (!display) setInput('');
        setIsLoadingText(true);
        try {
            const ai = createGeminiClient();
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Context: ${activeDoc.content}\n\nUser: ${text}\n\nProvide a clear, expert answer using markdown bolding for key terms.`
            });
            setMessages(p => [...p, { id: Date.now()+'r', role: 'model', text: result.text, timestamp: new Date(), mode: 'text' }]);
        } catch (e) {
            setMessages(p => [...p, { id: Date.now()+'e', role: 'system', text: "Error processing request.", timestamp: new Date() }]);
        } finally { setIsLoadingText(false); }
    };

    if (documents.length === 0) return <div className="h-full flex items-center justify-center text-textMuted"><p>No document active.</p></div>;

    return (
        <div className="flex h-full bg-background overflow-hidden relative">
            {/* Viewer */}
            <div className="flex-1 bg-[#0c0c0e] relative flex flex-col overflow-hidden">
                
                {/* Document Navigation Bar */}
                <div className="h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shrink-0 z-20">
                    <div className="flex items-center gap-2 mr-2 px-2 py-1 rounded bg-white/5 border border-white/5 text-zinc-500">
                        <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Session Docs</span>
                    </div>
                    
                    {documents.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => setActiveDocId(doc.id)}
                            className={`
                                group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all whitespace-nowrap
                                ${activeDocId === doc.id 
                                    ? 'bg-primary/10 border-primary/20 text-primary' 
                                    : 'bg-transparent border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                }
                            `}
                        >
                            <FileText className={`w-3.5 h-3.5 ${activeDocId === doc.id ? 'text-primary' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                            <span className="max-w-[150px] truncate font-medium">{doc.name}</span>
                        </button>
                    ))}

                    <div className="w-px h-6 bg-white/5 mx-2"></div>

                    <button 
                        onClick={onUploadRequest}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-zinc-800 text-zinc-500 hover:text-primary hover:border-primary/30 hover:bg-primary/5 text-xs transition-all whitespace-nowrap"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Add</span>
                    </button>
                </div>

                {/* Content Wrapper */}
                <div className="flex-1 relative flex overflow-hidden">
                    <AnimatePresence>
                        {showInsights && (
                            <motion.div initial={{x:-280}} animate={{x:0}} exit={{x:-280}} className="absolute left-0 top-0 bottom-0 w-72 bg-surface border-r border-border z-20 shadow-xl">
                                <div className="p-4 border-b border-white/5 flex justify-between"><span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Key Findings</span><button onClick={()=>setShowInsights(false)}><X className="w-4 h-4 text-zinc-500"/></button></div>
                                <div className="p-4 space-y-3">
                                    <div className="p-3 rounded-lg bg-surfaceHighlight border border-white/5 hover:border-amber-500/50 transition-colors group">
                                        <div className="text-[10px] text-amber-500 font-bold mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> RISK DETECTED</div>
                                        <div className="text-sm font-medium text-zinc-300">Variable Interest Rate</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div onMouseUp={handleDocumentMouseUp} className="flex-1 overflow-y-auto p-12 scroll-smooth selection:bg-primary/20 selection:text-black">
                        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="max-w-[800px] mx-auto bg-white min-h-[1000px] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-12 text-zinc-900 font-serif leading-loose">
                            <h1 className="text-3xl font-bold mb-8">{activeDoc?.name}</h1>
                            <div className="whitespace-pre-wrap">{activeDoc?.content}</div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Chat Panel */}
            <motion.div initial={{width:450}} animate={{width: isPanelOpen ? 450 : 0}} className="bg-surface/90 backdrop-blur-xl border-l border-white/5 flex flex-col z-30 shadow-2xl relative">
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-white/5 min-w-[450px]">
                    <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-primary"/><span className="font-bold text-sm">Loan Assistant</span></div>
                    
                    <div className="flex items-center gap-2">
                        {/* Settings Toggle */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                            >
                                <Settings2 className="w-4 h-4" />
                            </button>
                            
                            {/* Popover */}
                            <AnimatePresence>
                                {showSettings && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl p-4 z-50 backdrop-blur-lg"
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">TTS Speed</label>
                                                    <span className="text-xs font-mono text-primary">{readingSpeed.toFixed(1)}x</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0.5" 
                                                    max="2" 
                                                    step="0.1" 
                                                    value={readingSpeed} 
                                                    onChange={(e) => setReadingSpeed(parseFloat(e.target.value))}
                                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                                <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                                                    <span>0.5x</span>
                                                    <span>Normal</span>
                                                    <span>2.0x</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button onClick={()=>setIsPanelOpen(!isPanelOpen)}><PanelRightClose className="w-4 h-4 text-zinc-500 hover:text-white"/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 min-w-[450px]">
                    {messages.map((msg) => (
                        <motion.div key={msg.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-md border ${
                                msg.role === 'user' 
                                    ? 'bg-primary/20 border-primary/20 text-white rounded-br-sm' 
                                    : 'bg-white/5 border-white/10 text-zinc-200 rounded-bl-sm'
                            }`}>
                                <div className="whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '')}</div> 
                                {msg.role === 'model' && (
                                    <div className="flex gap-3 mt-3 pt-3 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity">
                                        <button onClick={()=>startReading(msg.text)} className="flex items-center gap-1 text-[10px] uppercase font-bold hover:text-primary"><Volume2 className="w-3 h-3"/> Listen</button>
                                        <button className="flex items-center gap-1 text-[10px] uppercase font-bold hover:text-primary"><Copy className="w-3 h-3"/> Copy</button>
                                    </div>
                                )}
                             </div>
                        </motion.div>
                    ))}
                    {(streamedInput || streamedOutput) && (
                        <div className="flex flex-col gap-2">
                            {streamedInput && <div className="self-end p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs animate-pulse">{streamedInput}</div>}
                            {streamedOutput && <div className="self-start p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-xs flex gap-2"><div className="w-2 h-2 bg-primary rounded-full animate-bounce"/> {streamedOutput}</div>}
                        </div>
                    )}
                    {isLoadingText && <div className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="w-3 h-3 animate-spin"/> Processing...</div>}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/5 bg-[#080808] min-w-[450px] relative">
                    <AnimatePresence>
                        {selectedText && (
                            <motion.div 
                                initial={{y:20, opacity:0, scale: 0.95}} 
                                animate={{y:0, opacity:1, scale: 1}} 
                                exit={{y:20, opacity:0, scale: 0.95}} 
                                className="absolute bottom-full left-4 right-4 mb-4 p-4 bg-[#0a0a0a] border border-primary/40 rounded-xl shadow-[0_0_30px_rgba(50,184,198,0.15)] z-50 overflow-hidden"
                            >
                                {/* Shimmer Effect Background */}
                                <div className="absolute inset-0 pointer-events-none opacity-20">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                                </div>

                                <div className="flex justify-between mb-3 text-[10px] uppercase font-bold text-primary tracking-wider relative z-10">
                                    <div className="flex items-center gap-2">
                                        <ScanLine className="w-3 h-3 animate-pulse"/> 
                                        <span>Context Selected</span>
                                    </div>
                                    <button onClick={clearSelection} className="hover:text-white transition-colors"><X className="w-3 h-3"/></button>
                                </div>
                                
                                <div className="relative mb-4 group">
                                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-primary/50 rounded-full"></div>
                                    <div className="text-xs text-zinc-300 italic line-clamp-2 pl-2 font-medium">"{selectedText}"</div>
                                    {/* Text highlight scan effect */}
                                    <motion.div 
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
                                    />
                                </div>

                                <div className="flex gap-2 relative z-10">
                                    <button onClick={()=>handleAction('explain')} className="flex-1 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-xs font-bold text-primary flex items-center justify-center gap-2 transition-all">
                                        <BrainCircuit className="w-3 h-3"/> Explain Clause
                                    </button>
                                    <button onClick={()=>handleAction('translate', 'Spanish')} className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs font-bold text-zinc-300 flex items-center justify-center gap-2 transition-all">
                                        <Globe className="w-3 h-3"/> Translate
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!input && !isVoiceActive && !selectedText && (
                        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <button key={i} onClick={() => handleSendText(q)} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className={`relative flex items-center gap-2 p-1.5 rounded-xl border transition-all ${isVoiceActive ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(50,184,198,0.1)]' : 'border-white/10 bg-white/5 focus-within:border-primary/50'}`}>
                        <button onClick={toggleVoiceSession} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isVoiceActive ? 'bg-primary text-black animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                            {isVoiceActive ? <Mic className="w-4 h-4"/> : <MicOff className="w-4 h-4"/>}
                        </button>
                        <input type="text" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleSendText(input)} disabled={isVoiceActive} placeholder={isVoiceActive ? "Listening..." : "Type a message..."} className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-zinc-600"/>
                        <button onClick={()=>handleSendText(input)} disabled={!input.trim()||isVoiceActive} className="w-9 h-9 rounded-lg bg-primary text-black flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:bg-white/10 disabled:text-zinc-500"><Send className="w-4 h-4"/></button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoanAssistant;
