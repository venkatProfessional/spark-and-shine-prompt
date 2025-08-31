// AI Enhancement Service using Mistral models via OpenRouter
const OPENROUTER_API_KEY = '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';
const MISTRAL_MODELS = {
  primary: 'mistralai/mistral-large-2407',
  fallback: 'mistralai/mistral-small-2402',
  fast: 'mistralai/mistral-7b-instruct'
};
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Production-ready configuration
const REQUEST_CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2
};

export interface AIEnhanceOptions {
  level: 'spark' | 'glow' | 'shine';
  content: string;
  context?: string;
}

export interface EnhancementResult {
  enhancedContent: string;
  improvementsSummary: string[];
  confidence: number;
}

const getEnhancementPrompt = (content: string, level: string, context: string = 'general'): string => {
  const contextMap = {
    technical: 'software development, programming, and technical documentation',
    creative: 'creative writing, storytelling, and artistic expression',
    analytical: 'data analysis, research, and analytical thinking',
    general: 'general knowledge and communication'
  };

  const levelDescriptions = {
    spark: 'Basic enhancement focusing on clarity and structure',
    glow: 'Moderate enhancement with role-playing, examples, and improved organization',
    shine: 'Advanced enhancement with systematic thinking, error checking, and comprehensive optimization'
  };

  const roleInstructions = {
    spark: 'You are a helpful assistant focused on improving clarity and readability.',
    glow: 'You are an expert consultant specializing in prompt engineering and clear communication.',
    shine: 'You are a master prompt engineer with deep expertise in systematic thinking and optimization.'
  };

  return `${roleInstructions[level as keyof typeof roleInstructions]}

**Context:** ${contextMap[context as keyof typeof contextMap]}
**Enhancement Level:** ${levelDescriptions[level as keyof typeof levelDescriptions]}

**Original Prompt:**
${content}

**Instructions:**
Enhance the above prompt according to the ${level} level. Your response should be a JSON object with this exact structure:

{
  "enhancedContent": "The enhanced version of the prompt",
  "improvementsSummary": ["List of specific improvements made"],
  "confidence": 0.85
}

**Enhancement Guidelines:**

${level === 'spark' ? `
- Improve clarity and readability
- Fix grammar and structure issues
- Make the request more specific
- Add basic context if missing
` : level === 'glow' ? `
- Add appropriate role-playing context
- Include step-by-step instructions
- Provide examples or analogies
- Improve structure and organization
- Add context-aware suggestions
` : `
- Implement systematic thinking framework
- Add multi-step reasoning process
- Include error checking and validation
- Provide comprehensive analysis structure
- Add optimization suggestions
- Include quality assurance measures
`}

Respond ONLY with the JSON object, no additional text.`;
};

// Format enhanced content for better readability
const formatEnhancedContent = (content: string): string => {
  return content
    // Replace escaped newlines with actual newlines
    .replace(/\\n/g, '\n')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Clean up extra whitespace around newlines
    .replace(/\n\s+/g, '\n')
    .replace(/\s+\n/g, '\n')
    // Remove leading/trailing whitespace
    .trim();
};

// Production-ready AI enhancement with retry logic and model fallbacks
// Enhanced AI service with improved reliability and state management
class AIEnhancementService {
  private static instance: AIEnhancementService;
  private connectionState: 'unknown' | 'connected' | 'disconnected' = 'unknown';
  private lastSuccessfulRequest: number = 0;
  private consecutiveFailures: number = 0;
  private isOfflineMode: boolean = false;
  
  public static getInstance(): AIEnhancementService {
    if (!AIEnhancementService.instance) {
      AIEnhancementService.instance = new AIEnhancementService();
    }
    return AIEnhancementService.instance;
  }
  
  private constructor() {
    // Check initial connection status
    this.checkConnectionStatus();
    
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOfflineMode = false;
        this.checkConnectionStatus();
      });
      
      window.addEventListener('offline', () => {
        this.isOfflineMode = true;
        this.connectionState = 'disconnected';
      });
    }
  }
  
  private async checkConnectionStatus(): Promise<void> {
    try {
      const isConnected = await testAIConnection();
      this.connectionState = isConnected ? 'connected' : 'disconnected';
      if (isConnected) {
        this.consecutiveFailures = 0;
        this.lastSuccessfulRequest = Date.now();
      }
    } catch (error) {
      this.connectionState = 'disconnected';
    }
  }
  
  public getConnectionState(): 'unknown' | 'connected' | 'disconnected' {
    return this.connectionState;
  }
  
  public isReliable(): boolean {
    const timeSinceLastSuccess = Date.now() - this.lastSuccessfulRequest;
    return (
      !this.isOfflineMode &&
      this.connectionState === 'connected' &&
      this.consecutiveFailures < 3 &&
      timeSinceLastSuccess < 5 * 60 * 1000 // 5 minutes
    );
  }
  
  private async enhanceWithRetry(options: AIEnhanceOptions): Promise<EnhancementResult> {
    const models = [MISTRAL_MODELS.primary, MISTRAL_MODELS.fallback, MISTRAL_MODELS.fast];
    let lastError: Error | null = null;
    
    // Only use local fallback if explicitly offline
    if (this.isOfflineMode) {
      throw new Error('Device is offline. Please check your internet connection and try again.');
    }
    
    // Always attempt AI enhancement when explicitly requested
    console.log('Starting AI enhancement with models:', models);
    
    // Try each model with persistent retry logic
    for (const model of models) {
      const maxRetries = 4; // More aggressive retries
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempting AI enhancement with ${model}, attempt ${attempt}`);
          const result = await this.makeAIRequestWithTimeout(options, model, attempt);
          
          // Success! Update our connection state
          this.consecutiveFailures = 0;
          this.lastSuccessfulRequest = Date.now();
          this.connectionState = 'connected';
          
          console.log('AI enhancement successful!');
          return result;
        } catch (error) {
          console.warn(`AI Enhancement attempt ${attempt} failed with model ${model}:`, error);
          lastError = error as Error;
          this.consecutiveFailures++;
          
          // Shorter delays for more responsive retries
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * attempt, 3000); // Max 3 second delay
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }
    
    // All models failed - throw error instead of falling back
    this.connectionState = 'disconnected';
    const errorMessage = `AI enhancement failed after trying all models. ${lastError?.message || 'Unknown error'}`;
    console.error(errorMessage);
    
    throw new Error(errorMessage);
  }
  
  private async makeAIRequestWithTimeout(
    options: AIEnhanceOptions, 
    model: string, 
    attempt: number
  ): Promise<EnhancementResult> {
    // Adaptive timeout based on previous failures
    const baseTimeout = 30000; // 30 seconds base
    const adaptiveTimeout = Math.min(baseTimeout + (this.consecutiveFailures * 5000), 60000);
    
    return Promise.race([
      makeAIRequest(options, model, attempt),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), adaptiveTimeout)
      )
    ]);
  }
  
  private getLocalFallback(options: AIEnhanceOptions): EnhancementResult {
    const localResult = getLocalFallbackEnhancement(options.content, options.level);
    return {
      enhancedContent: localResult,
      improvementsSummary: [
        'Applied local enhancement (AI service unavailable)',
        'Content structure improved',
        'Basic formatting applied'
      ],
      confidence: 0.4
    };
  }
  
  // Public method for external use
  public async enhance(options: AIEnhanceOptions): Promise<EnhancementResult> {
    return this.enhanceWithRetry(options);
  }
  
  // Method to force connection check
  public async refreshConnection(): Promise<boolean> {
    await this.checkConnectionStatus();
    return this.connectionState === 'connected';
  }
}

// Enhanced main export function
export const enhancePromptWithAI = async (options: AIEnhanceOptions): Promise<EnhancementResult> => {
  const service = AIEnhancementService.getInstance();
  return service.enhance(options);
};

// Export service instance for advanced usage
export const getAIService = (): AIEnhancementService => {
  return AIEnhancementService.getInstance();
};

// Separate function for making AI requests
const makeAIRequest = async (options: AIEnhanceOptions, model: string, attempt: number): Promise<EnhancementResult> => {
  const prompt = getEnhancementPrompt(options.content, options.level, options.context);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_CONFIG.timeout);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PromptCraft AI Enhancer'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Details:', {
        model,
        attempt: attempt + 1,
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Check if it's a rate limit error
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI model');
    }

    // Parse and validate JSON response
    try {
      // Clean the AI response - sometimes it comes wrapped in ```json blocks
      const cleanedResponse = aiResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const parsedResponse = JSON.parse(cleanedResponse);
      
      if (!parsedResponse.enhancedContent || !Array.isArray(parsedResponse.improvementsSummary)) {
        throw new Error('Invalid response structure from AI');
      }

      // Format the enhanced content for better readability
      const formattedContent = formatEnhancedContent(parsedResponse.enhancedContent);

      return {
        enhancedContent: formattedContent,
        improvementsSummary: parsedResponse.improvementsSummary || [],
        confidence: Math.min(Math.max(parsedResponse.confidence || 0.8, 0), 1)
      };
    } catch (parseError) {
      // Fallback: treat entire response as enhanced content
      const formattedContent = formatEnhancedContent(aiResponse);
      return {
        enhancedContent: formattedContent,
        improvementsSummary: ['AI enhancement applied (partial parsing)'],
        confidence: 0.7
      };
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

// Fallback enhancement when AI is unavailable
const getLocalFallbackEnhancement = (content: string, level: string): string => {
  const roleMap = {
    spark: "You are a helpful assistant.",
    glow: "You are an expert consultant with deep knowledge in your field.",
    shine: "You are a master expert with systematic thinking and comprehensive analysis skills."
  };

  const instructions = {
    spark: "Please provide a clear, well-structured response.",
    glow: "Please think through this step-by-step and provide a detailed, organized response with examples where helpful.",
    shine: "Please analyze this systematically: 1) Understand the core request, 2) Consider context and constraints, 3) Develop a comprehensive approach, 4) Provide detailed guidance, 5) Include validation methods, 6) Suggest optimizations."
  };

  return `${roleMap[level as keyof typeof roleMap]}

${content}

${instructions[level as keyof typeof instructions]}`;
};

export const testAIConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PromptCraft Connection Test'
      },
      body: JSON.stringify({
        model: MISTRAL_MODELS.fast,
        messages: [{ role: 'user', content: 'Hello, can you respond with just "OK"?' }],
        max_tokens: 10
      })
    });

    return response.ok;
  } catch (error) {
    console.error('AI Connection Test Failed:', error);
    return false;
  }
};