
export enum ViewMode {
  ASSISTANT = 'ASSISTANT', // Unified Voice + Chat
  UPLOAD = 'UPLOAD'
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  content?: string; // Simulated extracted content
  uploadDate: string;
  accuracy?: number; // From Lab3 extractor
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  mode?: 'voice' | 'text'; // Track how the message was generated
  isStreaming?: boolean;
}

export interface AudioVisualizerProps {
  isRecording: boolean;
  volume: number;
}
