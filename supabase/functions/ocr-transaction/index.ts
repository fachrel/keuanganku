import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.2.0';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Gemini AI
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to validate image
function validateImage(contentType: string, fileSize: number) {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(contentType)) {
    return {
      isValid: false,
      error: 'Unsupported file format. Please use JPG, PNG, or PDF.',
    };
  }

  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 10MB.',
    };
  }

  return { isValid: true };
}

// Create prompt for Gemini AI
function createPrompt(categories: any[]) {
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

// Validate and sanitize the AI response
function validateAndSanitizeResponse(data: any, categories: any[]) {
  const validateDate = (dateStr: string): string => {
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
  };

  const sanitized = {
    description: String(data.description || 'Transaction').trim(),
    amount: Math.max(0, Number(data.amount) || 0),
    date: validateDate(data.date),
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

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Check if Gemini API key is configured
  if (!geminiApiKey) {
    return new Response(
      JSON.stringify({
        error: 'Gemini API key not configured',
        isConfigured: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const userId = formData.get('userId') as string;

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate image
    const validation = validateImage(image.type, image.size);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch user's categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (categoriesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch categories', details: categoriesError }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Convert image to base64
    const arrayBuffer = await image.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64Image = btoa(String.fromCharCode(...bytes));

    // Create Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create prompt
    const prompt = createPrompt(categories);

    // Process with Gemini AI
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: image.type,
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const responseText = response.text();

    // Parse JSON from response
    let extractedData;
    try {
      // Clean the response text (remove any markdown formatting)
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response', 
          details: 'The image might be unclear or contain no transaction data.' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate and sanitize the extracted data
    const sanitizedData = validateAndSanitizeResponse(extractedData, categories);

    return new Response(
      JSON.stringify(sanitizedData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing OCR request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process image', 
        details: error.message || 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});