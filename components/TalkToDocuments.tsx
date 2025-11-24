import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, PhoneOff, Sparkles, MessageSquare, Check, Loader2, Bot, FileText, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { base64ToUint8Array, decodeAudioData, pcmToBlob } from '../services/audioUtils';
import { createGeminiClient } from '../services/gemini';
import { DocumentFile } from '../types';

const SAMPLE_RATE = 16000;
const ALIAS_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const MIN_PANEL_WIDTH = 350;
const MAX_PANEL_WIDTH = 800;

interface TranscriptItem {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

interface TalkToDocumentsProps {
    activeDocument?: DocumentFile;
}

const TalkToDocuments: React.FC<TalkToDocumentsProps> = ({ activeDocument }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chat & Transcription State
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Selection & Context State
  const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, text: string} | null>(null);
  const [contextSent, setContextSent] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  // Resize State
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  // Gemini Session
  const sessionRef = useRef<Promise<any> | null>(null);
  const inputBuffer = useRef('');
  const outputBuffer = useRef('');

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, currentInput, currentOutput]);

  const cleanupAudio = () => {
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
        processorRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    setIsActive(false);
    setIsMuted(false);
    
    // Trigger Summary if we have a conversation
    if (transcripts.length > 0 && !isSummarizing) {
        generateSummary();
    }
  };

  const generateSummary = async () => {
      setIsSummarizing(true);
      try {
          const ai = createGeminiClient();
          const conversationText = transcripts
              .filter(t => t.role !== 'system')
              .map(t => `${t.role.toUpperCase()}: ${t.text}`)
              .join('\n');
          
          if (!conversationText) {
              setIsSummarizing(false);
              return;
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Analyze the following conversation about the document "${activeDocument?.name || 'Loan Document'}" and provide a structured summary.
              
              Conversation:
              ${conversationText}`,
              config: {
                  systemInstruction: "You are a professional Loan Officer assistant. Output nicely formatted markdown."
              }
          });
          
          setTranscripts(prev => [...prev, {
              id: Date.now().toString(),
              role: 'system',
              text: response.text || "Could not generate summary.",
              timestamp: new Date()
          }]);

      } catch (e) {
          console.error("Summary failed", e);
      } finally {
          setIsSummarizing(false);
      }
  };

  const toggleMute = () => {
      const nextMuteState = !isMuted;
      setIsMuted(nextMuteState);
      if (streamRef.current) {
          streamRef.current.getAudioTracks().forEach(track => {
              track.enabled = !nextMuteState;
          });
      }
  };

  const startSessionRevised = async () => {
      if (!activeDocument) return;

      try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key not found");
  
        setIsActive(true);
        setIsMuted(false);
        setError(null);
        setTranscripts([]);
        setCurrentInput('');
        setCurrentOutput('');
        inputBuffer.current = '';
        outputBuffer.current = '';
  
        const ai = new GoogleGenAI({ apiKey });
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const outputNode = audioContextRef.current.createGain();
        outputNode.connect(audioContextRef.current.destination);
  
        inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Use ACTUAL content from the active document
        const documentContext = activeDocument.content || "No document content found.";

        sessionRef.current = ai.live.connect({
          model: ALIAS_MODEL,
          config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction: `You are a helpful LoanAI specialist. 
              
              CONTEXT DOCUMENT: ${activeDocument.name}
              CONTENT: ${documentContext}
              
              Answer questions about this document. Keep answers relatively short and conversational.`,
          },
          callbacks: {
              onopen: () => {
                  console.log("Connected");
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
                  if (msg.serverContent?.inputTranscription?.text) {
                      inputBuffer.current += msg.serverContent.inputTranscription.text;
                      setCurrentInput(inputBuffer.current);
                  }
                  if (msg.serverContent?.outputTranscription?.text) {
                      outputBuffer.current += msg.serverContent.outputTranscription.text;
                      setCurrentOutput(outputBuffer.current);
                  }

                  if (msg.serverContent?.turnComplete) {
                      if (inputBuffer.current.trim()) {
                           const text = inputBuffer.current;
                           setTranscripts(prev => [...prev, { id: Date.now() + 'u', role: 'user', text, timestamp: new Date() }]);
                           inputBuffer.current = '';
                           setCurrentInput('');
                      }
                      if (outputBuffer.current.trim()) {
                           const text = outputBuffer.current;
                           setTranscripts(prev => [...prev, { id: Date.now() + 'm', role: 'model', text, timestamp: new Date() }]);
                           outputBuffer.current = '';
                           setCurrentOutput('');
                      }
                  }

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
              onclose: () => cleanupAudio(),
              onerror: (e) => {
                  console.error(e);
                  setError("Connection lost");
                  cleanupAudio();
              }
          }
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        cleanupAudio();
      }
  };

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  // --- Resizing Logic ---
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
            setPanelWidth(newWidth);
        }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);


  // --- Selection Logic ---
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) {
        setSelectionMenu(null);
        setContextSent(false);
        return;
    }
    const text = selection.toString();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (documentRef.current) {
        const containerRect = documentRef.current.getBoundingClientRect();
        setSelectionMenu({
            x: (rect.left + rect.width / 2) - containerRect.left,
            y: rect.top - containerRect.top - 10,
            text: text
        });
        setContextSent(false);
    }
  };

  const handleContextShare = () => {
    if (!selectionMenu) return;
    setContextSent(true);
    
    // Send selected text as user input to the model via live session
    if (sessionRef.current) {
        sessionRef.current.then(session => {
            session.sendRealtimeInput([{ text: `Context: "${selectionMenu.text}". Explain this.` }]);
        });
    }
    
    setTimeout(() => {
        setSelectionMenu(null);
        setContextSent(false);
        window.getSelection()?.removeAllRanges();
    }, 1500);
  };

  if (!activeDocument) {
      return (
          <div className="flex flex-col h-full items-center justify-center bg-background text-textMuted space-y-4">
              <div className="w-16 h-16 bg-surfaceHighlight rounded-full flex items-center justify-center mb-2">
                  <Upload className="w-8 h-8 opacity-50" />
              </div>
              <h2 className="text-xl font-semibold text-text">No Document Selected</h2>
              <p className="max-w-md text-center text-sm">Please upload and select a document to start a voice session.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-background text-text overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-surface/50 backdrop-blur-sm z-10 shrink-0">
        <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Talk to Docs
            </h1>
            <p className="text-textMuted text-xs flex items-center gap-1">
                Active: <span className="font-semibold text-primary">{activeDocument.name}</span>
            </p>
        </div>
        <div className="flex items-center gap-3">
            {isActive && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-full border border-red-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="font-mono text-[10px] font-bold">LIVE</span>
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative" onMouseUp={handleMouseUp}>
        
        {/* Document Canvas */}
        <div ref={documentRef} className="flex-1 p-8 overflow-y-auto relative bg-background transition-colors duration-300 scroll-smooth">
            <div className="max-w-3xl mx-auto bg-surface p-12 min-h-[800px] shadow-2xl rounded-lg text-text/90 font-mono leading-relaxed selection:bg-primary/20 selection:text-primary border border-border">
                <h2 className="text-center text-xl font-bold mb-8 pb-4 border-b border-border uppercase">{activeDocument.name.replace(/\.[^/.]+$/, "")}</h2>
                <p className="whitespace-pre-wrap">{activeDocument.content || "No content available."}</p>
            </div>
            {/* Selection Menu */}
            <AnimatePresence>
                {selectionMenu && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute z-50 transform -translate-x-1/2 -translate-y-full mb-2"
                        style={{ left: selectionMenu.x, top: selectionMenu.y }}
                    >
                        <div className="bg-surfaceHighlight border border-border rounded-lg shadow-xl p-1.5 flex flex-col gap-1 min-w-[180px]">
                            {contextSent ? (
                                <div className="flex items-center justify-center gap-2 px-3 py-2 text-green-500 text-xs font-medium"><Check className="w-4 h-4"/> Sent to Assistant</div>
                            ) : (
                                <button onClick={handleContextShare} disabled={!isActive} className="w-full text-left px-3 py-2 rounded hover:bg-primary/20 hover:text-primary transition-colors text-xs flex items-center gap-2 font-medium disabled:opacity-50">
                                    <Sparkles className="w-3.5 h-3.5" /> {isActive ? 'Ask Assistant' : 'Start Session First'}
                                </button>
                            )}
                        </div>
                        <div className="w-3 h-3 bg-surfaceHighlight border-b border-r border-border transform rotate-45 absolute left-1/2 -ml-1.5 -bottom-1.5"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Resizer */}
        <div className={`w-1 bg-border hover:bg-primary cursor-col-resize z-20 transition-colors ${isResizing ? 'bg-primary' : ''}`} onMouseDown={startResizing} />

        {/* Improved Right Panel: Hybrid Voice + Chat */}
        <div className="bg-surface border-l border-border flex flex-col shrink-0 transition-all" style={{ width: panelWidth }}>
            
            {/* 1. Live Transcript Chat (NOW TOP) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 flex flex-col">
                {transcripts.length === 0 && !currentInput && !isActive && (
                    <div className="flex-1 flex flex-col items-center justify-center text-textMuted opacity-50">
                        <MessageSquare className="w-12 h-12 mb-2 stroke-1" />
                        <p className="text-sm text-center">Start a voice session to discuss<br/> <span className="text-primary">{activeDocument.name}</span></p>
                    </div>
                )}

                {transcripts.map((t) => (
                    <div key={t.id} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                            t.role === 'user' ? 'bg-primary text-white rounded-br-none' : 
                            t.role === 'system' ? 'bg-surfaceHighlight border border-accent/30 w-full' :
                            'bg-surface border border-border text-text rounded-bl-none'
                        }`}>
                            {t.role === 'system' ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-accent font-semibold text-xs uppercase tracking-wider border-b border-border/50 pb-1">
                                        <FileText className="w-3 h-3" /> Session Summary
                                    </div>
                                    <div className="prose prose-invert prose-xs max-w-none text-text/80 whitespace-pre-wrap leading-relaxed">
                                        {t.text}
                                    </div>
                                </div>
                            ) : (
                                t.text
                            )}
                        </div>
                    </div>
                ))}

                {/* Real-time Streaming Bubbles */}
                {isActive && currentInput && (
                    <div className="flex justify-end">
                        <div className="max-w-[85%] bg-primary/70 text-white/90 rounded-2xl p-3 text-sm rounded-br-none animate-pulse">
                            {currentInput}
                        </div>
                    </div>
                )}
                {isActive && currentOutput && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] bg-surface border border-border text-text/80 rounded-2xl p-3 text-sm rounded-bl-none">
                            {currentOutput}
                            <span className="inline-block w-1.5 h-3 ml-1 bg-primary/50 animate-pulse align-middle"></span>
                        </div>
                    </div>
                )}
                
                {isSummarizing && (
                    <div className="flex flex-col items-center gap-2 p-4 animate-pulse">
                         <Loader2 className="w-6 h-6 text-accent animate-spin" />
                         <span className="text-xs text-accent font-medium">Generating Session Summary...</span>
                    </div>
                )}
                
                <div ref={chatEndRef} />
            </div>

            {/* 2. Compact Voice Visualizer & Controls (NOW BOTTOM) */}
            <div className="p-4 border-t border-border bg-surfaceHighlight/30 flex items-center justify-between shrink-0 h-auto">
                 <div className="flex items-center gap-3">
                     <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary/10' : 'bg-surfaceHighlight'}`}>
                        {isActive && !isMuted ? (
                            <>
                                <div className="absolute inset-0 rounded-full border border-primary/30 animate-spin-slow"></div>
                                <div className="flex gap-0.5 items-end h-3">
                                     {[1,2,3].map(i => (
                                         <motion.div key={i} animate={{ height: [3, 10, 3] }} transition={{ repeat: Infinity, duration: 0.6, delay: i*0.1 }} className="w-0.5 bg-primary rounded-full" />
                                     ))}
                                </div>
                            </>
                        ) : isActive && isMuted ? (
                             <MicOff className="w-4 h-4 text-red-400" />
                        ) : (
                             <Bot className="w-5 h-5 text-textMuted" />
                        )}
                     </div>
                     <div>
                         <h3 className="font-semibold text-sm">Loan Assistant</h3>
                         <p className="text-[10px] text-textMuted">
                             {isActive ? (isMuted ? 'Muted' : 'Listening...') : 'Idle'}
                         </p>
                     </div>
                 </div>
                 
                 {/* Action Buttons */}
                 <div className="flex items-center gap-2">
                     {!isActive ? (
                        <button onClick={startSessionRevised} className="px-4 py-2 bg-primary text-white text-sm rounded-lg shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 flex items-center gap-2">
                            <Mic className="w-4 h-4" /> Start
                        </button>
                     ) : (
                        <>
                            <button 
                                onClick={toggleMute}
                                className={`p-2.5 rounded-lg border transition-all ${isMuted ? 'bg-red-500 text-white border-red-500' : 'bg-surface border-border text-textMuted hover:text-text hover:bg-surfaceHighlight'}`}
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>
                            <button 
                                onClick={cleanupAudio} 
                                className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                title="End Session"
                            >
                                <PhoneOff className="w-4 h-4" />
                            </button>
                        </>
                     )}
                 </div>
            </div>
            
        </div>

      </div>
    </div>
  );
};

export default TalkToDocuments;