import { MOCK_LOAN_DOC_CONTENT } from './gemini';

export interface UploadResponse {
  content: string;
  accuracy?: number;
  error?: string;
}

export const api = {
  /**
   * Uploads a file to the backend for text extraction.
   * MOCKED for frontend-only demo to prevent "Failed to fetch" errors.
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    console.log("Mocking upload for:", file.name);
    
    // Simulate network processing delay (1.5s) to allow UI animations to play
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return mock data derived from the provided mock content
    // In a real production app, this would be a fetch call:
    // await fetch('/upload', { method: 'POST', body: formData })
    return {
      content: MOCK_LOAN_DOC_CONTENT,
      accuracy: 0.98
    };
  },

  /**
   * Health check stub
   */
  async checkHealth(): Promise<boolean> {
    return true;
  }
};