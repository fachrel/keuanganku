import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface OCRResponse {
  description: string;
  amount: number;
  date: string;
  merchant?: string;
  tax?: number;
  tip?: number;
  confidence: number;
  suggestedCategory?: {
    id: string;
    name: string;
    confidence: number;
  };
  uncertainties: string[];
  rawText?: string;
}

export class OCRService {
  /**
   * Validates image file before processing
   */
  validateImage(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Unsupported file format. Please use JPG, PNG, or PDF.',
      };
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 10MB.',
      };
    }
    
    return { isValid: true };
  }

  /**
   * Processes image with server-side OCR for transaction extraction
   */
  async extractTransactionData(file: File, userId: string): Promise<OCRResponse> {
    // Validate image first
    const validation = this.validateImage(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', userId);

      // Get Supabase URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call the edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/ocr-transaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OCR processing error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      return data as OCRResponse;

    } catch (error) {
      console.error('OCR extraction error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to process image. Please try again or enter transaction data manually.');
    }
  }

  /**
   * Gets the current configuration status
   */
  async getConfigStatus(): Promise<{ isConfigured: boolean; missingConfig: string[] }> {
    try {
      // Get Supabase URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        return {
          isConfigured: false,
          missingConfig: ['VITE_SUPABASE_URL'],
        };
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          isConfigured: false,
          missingConfig: ['Authentication required'],
        };
      }

      // Call the edge function with a status check
      const response = await fetch(`${supabaseUrl}/functions/v1/ocr-transaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: new FormData(), // Empty form data for status check
      });

      const data = await response.json();
      
      if (data.isConfigured === false) {
        return {
          isConfigured: false,
          missingConfig: ['GEMINI_API_KEY (server-side)'],
        };
      }

      return {
        isConfigured: true,
        missingConfig: [],
      };
    } catch (error) {
      console.error('Error checking OCR configuration:', error);
      return {
        isConfigured: false,
        missingConfig: ['Server connection error'],
      };
    }
  }
}

export const ocrService = new OCRService();