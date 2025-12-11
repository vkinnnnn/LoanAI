
import React, { useState, useRef, useEffect } from 'react';
import { 
    Send, Mic, MicOff, Sparkles, Upload, PanelRightClose, PanelRightOpen,
    Loader2, Volume2, Globe, Copy, BrainCircuit, ScanLine, Maximize2, X,
    FileText, Bot, Play, Pause, FastForward, Check, ChevronDown, BookOpen, AlertTriangle
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
    "Are there prepayment penalties?",
    "Summarize the key risks",
    "Explain the default clause"
];

const LANGUAGES = [
    { code: 'Spanish', label: 'Español', flag: '🇪🇸' },
    { code: 'Hindi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'French', label: 'Français', flag: '🇫🇷' },
    { code: 'Chinese', label: '中文', flag: '🇨🇳' },
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
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoadingText, setIsLoadingText] = useState(false);

    // Voice State
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    // Audio Refs (Live API)
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionRef = useRef<Promise<any> | null>(null);

    // Buffers for streaming transcripts
    const inputBuffer = useRef('');
    const outputBuffer = useRef('');
    const [streamedInput, setStreamedInput] = useState('');
    const [streamedOutput, setStreamedOutput] = useState('');

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamedInput, streamedOutput, isLoadingText, selectedText]);

    // Cleanup Audio on Unmount
    useEffect(() => {
        return () => {
            cleanupAudio();
            stopReading();
        };
    }, []);

    // Initial Welcome Message
    useEffect(() => {
        if (activeDoc && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'model',
                text: `I've loaded **${activeDoc.name}**. \n\nYou can ask me questions via **Text**, toggle **Voice Mode**, or **Select Text** in the document to Explain, Translate, or Read it aloud.`,
                timestamp: new Date(),
                mode: 'text'
            }]);
        }
    }, [activeDoc?.id]);

    // --- TTS HANDLING (Web Speech API) ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const startReading = (text: string) => {
        if (!synthRef.current) return;
        
        // Stop any current speaking
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = readingSpeed;
        utterance.pitch = 1.0;
        
        // Attempt to find a "Google" voice or a decent default
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            setIsReading(false);
            setIsPaused(false);
        };

        utteranceRef.current = utterance;
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

    const togglePause = () => {
        if (!synthRef.current) return;
        if (synthRef.current.paused) {
            synthRef.current.resume();
            setIsPaused(false);
        } else {
            synthRef.current.pause();
            setIsPaused(true);
        }
    };

    const changeSpeed = () => {
        const speeds = [0.5, 1, 1.5, 2];
        const currentIndex = speeds.indexOf(readingSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setReadingSpeed(nextSpeed);
        
        // If currently reading, restart with new speed at current position? 
        // Web Speech API doesn't support seeking easily. 
        // For simple UX, we'll just update state for next read or restart if user wants.
        // Actually, updating rate on the fly isn't supported by all browsers on the active utterance.
        // We will just set it for the next utterance or restart if we want to be fancy, 
        // but for now let's just update the indicator.
        
        if (isReading) {
            stopReading();
            // Optionally auto-restart:
            if (selectedText) setTimeout(() => startReading(selectedText), 100);
        }
    };

    // --- SELECTION HANDLING ---
    const handleDocumentMouseUp = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const text = selection.toString();
            setSelectedText(text);
            // Ensure panel is open to show the context actions
            if (!isPanelOpen) setIsPanelOpen(true);
        } else {
            // Optional: Auto-clear selection if clicking empty space? 
            // Better to keep it until manually dismissed or new selection to avoid frustration.
        }
    };

    const clearSelection = () => {
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
        stopReading();
    };

    // --- ACTION BUTTON HANDLERS ---
    
    const handleExplain = () => {
        if (!selectedText) return;
        const prompt = `Explain this clause from the document in plain English, highlighting any risks:\n\n"${selectedText}"`;
        handleSendText(prompt, `Explain: "${selectedText.substring(0, 30)}..."`);
        // We keep the selection active so they can still read it aloud etc, or clear it?
        // Let's clear it to show the chat moving forward.
        clearSelection();
    };

    const handleTranslate = (targetLang: string) => {
        if (!selectedText) return;
        const prompt = `Translate the following text to ${targetLang}. Maintain financial accuracy for terms like APR, Escrow, etc.\n\n"${selectedText}"`;
        handleSendText(prompt, `Translate to ${targetLang}: "${selectedText.substring(0, 30)}..."`);
        setShowTranslateMenu(false);
        clearSelection();
    };

    const handleReadAloud = () => {
        if (!selectedText) return;
        startReading(selectedText);
    };

    // --- AUDIO HANDLING ---

    const cleanupAudio = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        if (sourceRef.current) sourceRef.current.disconnect();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (inputContextRef.current) inputContextRef.current.close();
        if (audioContextRef.current) audioContextRef.current.close();
        
        processorRef.current = null;
        sourceRef.current = null;
        streamRef.current = null;
        inputContextRef.current = null;
        audioContextRef.current = null;
        sessionRef.current = null;
        
        setIsVoiceActive(false);
        setStreamedInput('');
        setStreamedOutput('');
    };

    const toggleVoiceSession = async () => {
        if (isVoiceActive) {
            cleanupAudio();
            return;
        }

        try {
            if (!activeDoc) return;
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API Key missing");

            setIsVoiceActive(true);
            setIsMuted(false);
            
            const ai = new GoogleGenAI({ apiKey });
            
            // Audio Contexts
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
            
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Connect Live Session
            sessionRef.current = ai.live.connect({
                model: LIVE_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are a Loan Assistant. Context: ${activeDoc.content}. Be concise and helpful.`,
                },
                callbacks: {
                    onopen: () => {
                        const ctx = inputContextRef.current!;
                        const source = ctx.createMediaStreamSource(streamRef.current!);
                        const processor = ctx.createScriptProcessor(4096, 1, 1);
                        
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const blob = pcmToBlob(inputData, SAMPLE_RATE);
                            sessionRef.current?.then(session => session.sendRealtimeInput({ media: blob }));
                        };
                        
                        source.connect(processor);
                        processor.connect(ctx.destination);
                        sourceRef.current = source;
                        processorRef.current = processor;
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Transcriptions
                        if (msg.serverContent?.inputTranscription?.text) {
                            inputBuffer.current += msg.serverContent.inputTranscription.text;
                            setStreamedInput(inputBuffer.current);
                        }
                        if (msg.serverContent?.outputTranscription?.text) {
                            outputBuffer.current += msg.serverContent.outputTranscription.text;
                            setStreamedOutput(outputBuffer.current);
                        }

                        // Handle Turn Complete (Commit to History)
                        if (msg.serverContent?.turnComplete) {
                            if (inputBuffer.current.trim()) {
                                setMessages(prev => [...prev, {
                                    id: Date.now() + 'u',
                                    role: 'user',
                                    text: inputBuffer.current,
                                    timestamp: new Date(),
                                    mode: 'voice'
                                }]);
                                inputBuffer.current = '';
                                setStreamedInput('');
                            }
                            if (outputBuffer.current.trim()) {
                                setMessages(prev => [...prev, {
                                    id: Date.now() + 'm',
                                    role: 'model',
                                    text: outputBuffer.current,
                                    timestamp: new Date(),
                                    mode: 'voice'
                                }]);
                                outputBuffer.current = '';
                                setStreamedOutput('');
                            }
                        }

                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
                            const ctx = audioContextRef.current;
                            const buffer = await decodeAudioData(base64ToUint8Array(audioData), ctx);
                            const source = ctx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(ctx.destination);
                            const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
                            source.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;
                        }
                    },
                    onclose: cleanupAudio,
                    onerror: (e) => {
                        console.error(e);
                        cleanupAudio();
                    }
                }
            });

        } catch (e) {
            console.error(e);
            cleanupAudio();
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
        }
    };

    // --- TEXT HANDLING ---

    const handleSendText = async (text: string, displayOverride?: string) => {
        if (!text.trim() || !activeDoc) return;
        
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: displayOverride || text,
            timestamp: new Date(),
            mode: 'text'
        };

        setMessages(prev => [...prev, newMessage]);
        if (!displayOverride) setInput('');
        setIsLoadingText(true);

        try {
            const ai = createGeminiClient();
            const history = messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Model'}: ${m.text}`).join('\n');
            
            const prompt = `
            Context Document: ${activeDoc.content}
            
            Chat History:
            ${history}
            
            User Request: ${text}
            
            Answer as a helpful Loan Assistant. 
            If explaining, use "## Explanation" header.
            If translating, just provide the translation.
            Use bolding for key terms.
            `;

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const responseText = result.text;
            setMessages(prev => [...prev, {
                id: Date.now() + 'r',
                role: 'model',
                text: responseText,
                timestamp: new Date(),
                mode: 'text'
            }]);

        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, {
                id: Date.now() + 'e',
                role: 'system',
                text: "Error generating response. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoadingText(false);
        }
    };

    // --- RENDER ---

    if (documents.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-background text-textMuted space-y-6">
                <div className="w-20 h-20 bg-surfaceHighlight rounded-3xl flex items-center justify-center mb-2">
                    <Upload className="w-10 h-10 opacity-50" />
                </div>
                <h2 className="text-xl font-semibold text-text">No Document Loaded</h2>
                <button onClick={onUploadRequest} className="px-6 py-2 bg-primary text-white rounded-full">
                    Upload Document
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            
            {/* Header / Tabs */}
            <div className="h-14 border-b border-border bg-surface/50 backdrop-blur flex items-center px-4 justify-between shrink-0 z-20">
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Active:</span>
                    <div className="flex items-center gap-2 px-2 py-1 bg-surfaceHighlight rounded text-xs text-text font-medium truncate">
                        <FileText className="w-3 h-3 text-primary" />
                        {activeDoc?.name}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowInsights(!showInsights)} className={`p-2 rounded-lg transition-colors ${showInsights ? 'bg-primary/10 text-primary' : 'text-textMuted hover:text-text'}`}>
                        <BrainCircuit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="p-2 rounded-lg text-textMuted hover:text-text transition-colors">
                        {isPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                
                {/* Left Panel: Document Viewer */}
                <div className="flex-1 relative bg-[#0c0c0e] flex overflow-hidden">
                     {/* Insights Drawer */}
                     <AnimatePresence>
                        {showInsights && (
                            <motion.div 
                                initial={{ x: -280, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -280, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="absolute top-0 left-0 bottom-0 w-72 bg-surface border-r border-border z-20 shadow-xl flex flex-col"
                            >
                                <div className="p-4 border-b border-border flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-textMuted">Key Findings</span>
                                    <button onClick={() => setShowInsights(false)}><X className="w-4 h-4 text-textMuted" /></button>
                                </div>
                                <div className="p-4 space-y-3 overflow-y-auto">
                                    <div className="p-3 rounded bg-surfaceHighlight border border-border">
                                        <div className="text-xs text-amber-500 font-bold mb-1">RISK DETECTED</div>
                                        <div className="text-sm font-medium">Variable Interest Rate</div>
                                    </div>
                                    <div className="p-3 rounded bg-surfaceHighlight border border-border">
                                        <div className="text-xs text-emerald-500 font-bold mb-1">TERM</div>
                                        <div className="text-sm font-medium">60 Months</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                     </AnimatePresence>

                     {/* Document Content */}
                     <div 
                        onMouseUp={handleDocumentMouseUp}
                        className="flex-1 overflow-y-auto p-8 scroll-smooth cursor-text selection:bg-primary/30 selection:text-white"
                     >
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-[800px] mx-auto bg-white min-h-[1000px] shadow-2xl p-12 text-zinc-900 font-serif"
                        >
                            <h1 className="text-3xl font-bold mb-8">{activeDoc?.name}</h1>
                            <div className="whitespace-pre-wrap leading-loose text-lg text-justify">
                                {activeDoc?.content}
                            </div>
                        </motion.div>
                     </div>
                </div>

                {/* Right Panel: Unified Assistant */}
                <motion.div 
                    initial={{ width: 450, opacity: 1 }}
                    animate={{ width: isPanelOpen ? 450 : 0, opacity: isPanelOpen ? 1 : 0 }}
                    className="bg-surface border-l border-border flex flex-col relative z-30 shadow-2xl"
                >
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 min-w-[450px]">
                        {messages.map((msg) => (
                            <motion.div 
                                key={msg.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm relative group ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-br-none' 
                                        : 'bg-surfaceHighlight border border-border text-text rounded-bl-none'
                                }`}>
                                    {msg.mode === 'voice' && (
                                        <div className="flex items-center gap-2 mb-2 opacity-70 border-b border-white/20 pb-1">
                                            <Mic className="w-3 h-3" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Voice Input</span>
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {msg.text.split('**').map((part, i) => 
                                            i % 2 === 1 ? <span key={i} className="font-bold underline decoration-accent/50 underline-offset-2">{part}</span> : part
                                        )}
                                    </div>
                                    
                                    {/* Message Actions */}
                                    {msg.role === 'model' && (
                                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-textMuted hover:text-primary transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider" onClick={() => startReading(msg.text)}>
                                                <Volume2 className="w-3 h-3" /> Listen
                                            </button>
                                            <button className="text-textMuted hover:text-primary transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                                                <Copy className="w-3 h-3" /> Copy
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Streaming Indicators */}
                        {streamedInput && (
                             <div className="flex justify-end">
                                <div className="max-w-[85%] bg-primary/50 text-white rounded-2xl p-4 text-sm rounded-br-none animate-pulse italic">
                                    {streamedInput}
                                </div>
                             </div>
                        )}
                        {streamedOutput && (
                             <div className="flex justify-start">
                                <div className="max-w-[85%] bg-surfaceHighlight border border-border text-text rounded-2xl p-4 text-sm rounded-bl-none">
                                    {streamedOutput}
                                    <span className="inline-block w-1.5 h-3 ml-1 bg-primary animate-pulse align-middle"></span>
                                </div>
                             </div>
                        )}
                        {isLoadingText && (
                            <div className="flex justify-start">
                                <div className="bg-surfaceHighlight border border-border px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    <span className="text-xs text-textMuted">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* SELECTION CONTEXT PANEL */}
                    <AnimatePresence>
                        {selectedText && (
                            <motion.div 
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className="absolute bottom-[80px] left-4 right-4 bg-surface/95 backdrop-blur-xl border border-primary/20 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden z-40"
                            >
                                <div className="p-3 bg-surfaceHighlight border-b border-border flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                                        <ScanLine className="w-3 h-3" /> Selected Text
                                    </div>
                                    <button onClick={clearSelection} className="p-1 hover:bg-white/10 rounded">
                                        <X className="w-3 h-3 text-textMuted" />
                                    </button>
                                </div>
                                <div className="p-4">
                                    <div className="text-xs text-textMuted italic line-clamp-2 mb-4 font-serif bg-black/20 p-2 rounded border border-white/5">
                                        "{selectedText}"
                                    </div>

                                    {/* Action Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* READ OUT LOUD */}
                                        <div className="col-span-1">
                                            {!isReading ? (
                                                <button 
                                                    onClick={handleReadAloud}
                                                    className="w-full flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group h-full"
                                                >
                                                    <Volume2 className="w-5 h-5 text-textMuted group-hover:text-primary" />
                                                    <span className="text-[10px] font-bold uppercase text-textMuted group-hover:text-text">Read Aloud</span>
                                                </button>
                                            ) : (
                                                <div className="w-full p-2 rounded-lg bg-primary/10 border border-primary/30 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-0.5 items-end h-3">
                                                            {[1,2,3,4].map(i => <motion.div key={i} animate={{ height: [3, 10, 3] }} transition={{ repeat: Infinity, duration: 0.5, delay: i*0.1 }} className="w-0.5 bg-primary rounded-full" />)}
                                                        </div>
                                                        <button onClick={changeSpeed} className="text-[9px] font-mono bg-surface/50 px-1 rounded hover:text-white transition-colors">{readingSpeed}x</button>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <button onClick={togglePause} className="p-1 rounded hover:bg-white/10 text-primary">
                                                            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                                        </button>
                                                        <button onClick={stopReading} className="p-1 rounded hover:bg-white/10 text-red-400">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* EXPLAIN */}
                                        <button 
                                            onClick={handleExplain}
                                            className="col-span-1 flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                        >
                                            <BrainCircuit className="w-5 h-5 text-textMuted group-hover:text-accent" />
                                            <span className="text-[10px] font-bold uppercase text-textMuted group-hover:text-text">Explain</span>
                                        </button>

                                        {/* TRANSLATE */}
                                        <div className="col-span-1 relative">
                                            <button 
                                                onClick={() => setShowTranslateMenu(!showTranslateMenu)}
                                                className={`w-full h-full flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all group ${showTranslateMenu ? 'bg-primary/10 border-primary text-white' : 'bg-surface border-border hover:border-primary/50 hover:bg-primary/5'}`}
                                            >
                                                <Globe className={`w-5 h-5 ${showTranslateMenu ? 'text-primary' : 'text-textMuted group-hover:text-emerald-400'}`} />
                                                <span className={`text-[10px] font-bold uppercase ${showTranslateMenu ? 'text-primary' : 'text-textMuted group-hover:text-text'}`}>Translate</span>
                                            </button>
                                            
                                            <AnimatePresence>
                                                {showTranslateMenu && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute bottom-full right-0 mb-2 w-40 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50"
                                                    >
                                                        {LANGUAGES.map(lang => (
                                                            <button 
                                                                key={lang.code}
                                                                onClick={() => handleTranslate(lang.code)}
                                                                className="w-full text-left px-3 py-2 text-xs text-textMuted hover:text-text hover:bg-surfaceHighlight flex items-center gap-2"
                                                            >
                                                                <span>{lang.flag}</span> {lang.label}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Unified Input Area */}
                    <div className="p-4 border-t border-border bg-surface/80 backdrop-blur-md min-w-[450px]">
                        
                        {/* Suggestion Chips */}
                        {!input && !isVoiceActive && !selectedText && (
                            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                                {SUGGESTED_QUESTIONS.map((q, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleSendText(q)}
                                        className="whitespace-nowrap px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surfaceHighlight text-xs text-textMuted hover:text-primary transition-colors flex-shrink-0"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className={`relative flex items-center gap-2 p-1.5 rounded-2xl transition-all duration-300 ${isVoiceActive ? 'bg-primary/5 border border-primary/50 shadow-[0_0_20px_rgba(50,184,198,0.2)]' : 'bg-surfaceHighlight border border-border focus-within:ring-2 ring-primary/20'}`}>
                            
                            {/* Voice Toggle */}
                            <button
                                onClick={toggleVoiceSession}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                    isVoiceActive 
                                        ? 'bg-primary text-white shadow-lg animate-pulse' 
                                        : 'bg-surface hover:bg-white/10 text-textMuted hover:text-primary'
                                }`}
                                title={isVoiceActive ? "Stop Voice Mode" : "Start Voice Mode"}
                            >
                                {isVoiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </button>

                            {/* Text Input */}
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendText(input)}
                                disabled={isVoiceActive} // Disable text input during live voice session for simplicity
                                placeholder={isVoiceActive ? "Listening..." : "Ask about your loan..."}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text placeholder:text-textMuted/50 h-10"
                            />

                            {/* Send Button */}
                            <button 
                                onClick={() => handleSendText(input)}
                                disabled={!input.trim() || isVoiceActive}
                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-white disabled:opacity-50 disabled:bg-surfaceHighlight disabled:text-textMuted transition-all hover:bg-primary/90"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-[10px] text-center mt-2 text-textMuted/50 font-medium">
                            {isVoiceActive ? "Voice Mode Active • Speak freely" : "LoanSight AI • Voice & Text Enabled"}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoanAssistant;
