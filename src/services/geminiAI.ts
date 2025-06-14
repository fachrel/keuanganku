// Gemini AI Service for OCR Transaction Recognition
// This service handles the integration with Google's Gemini AI API

interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

interface OCRRequest {
  image: string; // base64 encoded image
  categories: Array<{
    id: string;
    name: string;
    type: 'income' | 'expense';
  }>;
  prompt?: string;
}

interface OCRResponse {
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

class GeminiAIService {
  private config: GeminiConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      model: 'gemini-2.0-flash-exp',
      maxTokens: 2048,
    };
  }

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

    // For images, we could add resolution check here
    // This would require loading the image and checking dimensions
    
    return { isValid: true };
  }

  /**
   * Converts file to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Creates optimized prompt for transaction extraction
   */
  private createPrompt(categories: OCRRequest['categories']): string {
    const categoryList = categories.map(cat => `- ${cat.name} (${cat.type})`).join('\n');
    
    return `
You are an expert OCR system specialized in extracting financial transaction data from receipts, invoices, and bills. 

Analyze this image and extract transaction information with high accuracy. Return ONLY a valid JSON response with this exact structure:

{
  "description": "Brief, clear description of the transaction/merchant",
  "amount": number,
  "date": "YYYY-MM-DD",
  "merchant": "Merchant/store name if identifiable",
  "tax": number,
  "tip": number,
  "confidence": number,
  "suggestedCategory": {
    "id": "category_id_from_list",
    "name": "category_name",
    "confidence": number
  },
  "uncertainties": ["list of fields that need verification"],
  "rawText": "all text extracted from image"
}

AVAILABLE CATEGORIES:
${categoryList}

EXTRACTION RULES:
1. Amount: Extract the FINAL TOTAL amount (look for "Total", "Jumlah", "Grand Total", etc.)
2. Date: Convert to YYYY-MM-DD format. If unclear, use today's date and mark as uncertain
3. Merchant: Extract business/store name from header or footer
4. Category: Match to the most appropriate category from the list above
5. Currency: Convert all amounts to Indonesian Rupiah (IDR)
6. Confidence: Rate 0-100 based on text clarity and extraction certainty
7. Uncertainties: List any fields where the extraction is unclear or ambiguous

IMPORTANT:
- Be conservative with confidence scores
- Only use high confidence (80+) when text is very clear
- Mark unclear dates, amounts, or merchant names as uncertain
- If multiple amounts exist, prioritize the final total
- For Indonesian receipts, look for common terms: "Total", "Jumlah", "Bayar", "Kembalian"
- Return valid JSON only, no additional text or explanations
`;
  }

  /**
   * Processes image with Gemini AI for transaction extraction
   */
  async extractTransactionData(file: File, categories: OCRRequest['categories']): Promise<OCRResponse> {
    // Validate image first
    const validation = this.validateImage(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    if (!this.config.apiKey) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(file);
      
      // Prepare the request
      const prompt = this.createPrompt(categories);
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
          temperature: 0.1, // Low temperature for consistent, factual extraction
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      // Make API call to Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Parse JSON response
      let extractedData: OCRResponse;
      try {
        // Clean the response text (remove any markdown formatting)
        const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
        extractedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', generatedText);
        throw new Error('Failed to parse AI response. The image might be unclear or contain no transaction data.');
      }

      // Validate and sanitize the extracted data
      return this.validateAndSanitizeResponse(extractedData, categories);

    } catch (error) {
      console.error('Gemini AI extraction error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to process image with AI. Please try again or enter transaction data manually.');
    }
  }

  /**
   * Validates and sanitizes the AI response
   */
  private validateAndSanitizeResponse(data: any, categories: OCRRequest['categories']): OCRResponse {
    const sanitized: OCRResponse = {
      description: String(data.description || 'Transaction').trim(),
      amount: Math.max(0, Number(data.amount) || 0),
      date: this.validateDate(data.date),
      merchant: data.merchant ? String(data.merchant).trim() : undefined,
      tax: data.tax ? Math.max(0, Number(data.tax)) : undefined,
      tip: data.tip ? Math.max(0, Number(data.tip)) : undefined,
      confidence: Math.min(100, Math.max(0, Number(data.confidence) || 0)),
      uncertainties: Array.isArray(data.uncertainties) ? data.uncertainties.map(String) : [],
      rawText: data.rawText ? String(data.rawText) : undefined,
    };

    // Validate suggested category
    if (data.suggestedCategory && data.suggestedCategory.id) {
      const category = categories.find(cat => cat.id === data.suggestedCategory.id);
      if (category) {
        sanitized.suggestedCategory = {
          id: category.id,
          name: category.name,
          confidence: Math.min(100, Math.max(0, Number(data.suggestedCategory.confidence) || 0)),
        };
      }
    }

    // Add validation uncertainties
    if (sanitized.amount === 0) {
      sanitized.uncertainties.push('Amount extraction unclear');
    }
    
    if (!sanitized.merchant) {
      sanitized.uncertainties.push('Merchant name not detected');
    }

    if (sanitized.confidence < 70) {
      sanitized.uncertainties.push('Low confidence in overall extraction');
    }

    return sanitized;
  }

  /**
   * Validates and formats date string
   */
  private validateDate(dateStr: string): string {
    if (!dateStr) {
      return new Date().toISOString().split('T')[0];
    }

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Gets the current configuration status
   */
  getConfigStatus(): { isConfigured: boolean; missingConfig: string[] } {
    const missing: string[] = [];
    
    if (!this.config.apiKey) {
      missing.push('VITE_GEMINI_API_KEY');
    }

    return {
      isConfigured: missing.length === 0,
      missingConfig: missing,
    };
  }
}

export const geminiAI = new GeminiAIService();
export type { OCRResponse, OCRRequest };