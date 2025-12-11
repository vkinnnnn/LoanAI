
import React, { useState, useRef, useEffect } from 'react';
import { 
    Send, Mic, MicOff, Sparkles, Upload, PanelRightClose, PanelRightOpen,
    Loader2, Volume2, Globe, Copy, BrainCircuit, ScanLine, Maximize2, X,
    FileText, Bot
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

const LoanAssistant: React.FC<LoanAssistantProps> = ({ documents, activeDocId, setActiveDocId, onUploadRequest }) => {
    const activeDoc = documents.find(d => d.id === activeDocId);
    
    // UI State
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [showInsights, setShowInsights] = useState(true);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

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

    // Buffers for streaming transcripts
    const inputBuffer = useRef('');
    const outputBuffer = useRef('');
    const [streamedInput, setStreamedInput] = useState('');
    const [streamedOutput, setStreamedOutput] = useState('');

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamedInput, streamedOutput, isLoadingText]);

    // Cleanup Audio on Unmount
    useEffect(() => {
        return () => cleanupAudio();
    }, []);

    // Initial Welcome Message
    useEffect(() => {
        if (activeDoc && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'model',
                text: `I've loaded **${activeDoc.name}**. \n\nYou can ask me questions via **Text** or toggle **Voice Mode** to have a conversation.`,
                timestamp: new Date(),
                mode: 'text'
            }]);
        }
    }, [activeDoc?.id]);

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
        streamRef.current?.getAudioTracks().forEach(t => t.enabled = isMuted); // Logic inverted: if isMuted is true, enabling it makes it false. Wait.
        // Actually: if currently muted, we want to unmute (enable=true).
        // Correct logic: t.enabled = !isMuted (which is the new state? No.)
        // Let's rely on state update.
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted); // If isMuted was true, now it's false, so enable.
        }
    };

    // --- TEXT HANDLING ---

    const handleSendText = async (textOverride?: string) => {
        const text = textOverride || input;
        if (!text.trim() || !activeDoc) return;

        // If Voice is active, we could sendRealtimeInput, but for reliability we'll pause voice or just use text API separate.
        // For this unified UX, we'll just treat text as a separate channel into the same history.
        
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: new Date(),
            mode: 'text'
        };

        setMessages(prev => [...prev, newMessage]);
        if (!textOverride) setInput('');
        setIsLoadingText(true);

        try {
            const ai = createGeminiClient();
            // Build context from previous messages (simple)
            const history = messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Model'}: ${m.text}`).join('\n');
            
            const prompt = `
            Context Document: ${activeDoc.content}
            
            Chat History:
            ${history}
            
            User Question: ${text}
            
            Answer as a helpful Loan Assistant. Use markdown for bolding key terms.
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
                     <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
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
                                            <button className="text-textMuted hover:text-primary transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                                                <Volume2 className="w-3 h-3" /> Listen
                                            </button>
                                            <button className="text-textMuted hover:text-primary transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                                                <Globe className="w-3 h-3" /> Translate
                                            </button>
                                            <button className="text-textMuted hover:text-primary transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ml-auto">
                                                <Copy className="w-3 h-3" />
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

                    {/* Unified Input Area */}
                    <div className="p-4 border-t border-border bg-surface/80 backdrop-blur-md min-w-[450px]">
                        
                        {/* Suggestion Chips */}
                        {!input && !isVoiceActive && (
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
                                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                                disabled={isVoiceActive} // Disable text input during live voice session for simplicity
                                placeholder={isVoiceActive ? "Listening..." : "Ask about your loan..."}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text placeholder:text-textMuted/50 h-10"
                            />

                            {/* Send Button */}
                            <button 
                                onClick={() => handleSendText()}
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
