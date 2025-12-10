
import { DocumentFile } from '../types';

// Change this to your actual backend URL
const API_BASE_URL = 'http://localhost:8000';

export interface UploadResponse {
  content: string;
  accuracy?: number;
  error?: string;
}

export const api = {
  /**
   * Uploads a file to the backend for text extraction.
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content || '',
        accuracy: data.accuracy || 0
      };
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },

  /**
   * Health check to see if backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
};
