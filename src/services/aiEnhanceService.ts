// AI Enhancement Service using Mistral models via OpenRouter
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key') || '';
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
  lineCount?: number;
  signal?: AbortSignal;
}

export interface EnhancementResult {
  enhancedContent: string;
  improvementsSummary: string[];
  confidence: number;
}

const getEnhancementPrompt = (content: string, level: string, context: string = 'general', lineCount?: number): string => {
  const contextMap = {
    technical: 'software development, programming, and technical documentation',
    creative: 'creative writing, storytelling, and artistic expression',
    analytical: 'data analysis, research, and analytical thinking',
    business: 'business strategy, management, and commercial applications',
    general: 'general knowledge and communication'
  };

  // Map 'shine' to 'blaze' for the new prompt structure
  const normalizedLevel = level === 'shine' ? 'blaze' : level;
  
  // Add line count constraint if specified
  const lineConstraint = lineCount ? `\n\n**CRITICAL LINE COUNT CONSTRAINT:** The enhanced content must be EXACTLY ${lineCount} lines long. This is MANDATORY. Count each line carefully and ensure the final output has exactly ${lineCount} lines - no more, no less. Each line should end with a line break (\\n). This constraint overrides all other formatting preferences. STRICT REQUIREMENT: ${lineCount} lines only.` : '';

  return `You are an *Elite Prompt Enhancement AI* with mastery in linguistic precision, contextual intelligence, structured reasoning, and deep domain expertise. Your responsibility is to transform any given prompt (${content}) into a *brilliantly reimagined, comprehensive, professional-grade version* that exceeds expectations and demonstrates profound technical knowledge. The refinement level is determined by ${normalizedLevel}, and you must adapt your enhancement strategy accordingly.${lineConstraint}

You must analyze every phrase, detect missing context, expand technical depth, optimize readability, and reconstruct the prompt into a flawless form that feels natural, authoritative, and demonstrates expert-level understanding of the subject matter.

Your final answer must strictly follow this JSON structure:

{
  "enhancedContent": "The fully enhanced, polished, and professional version of the given prompt with comprehensive technical details, implementation guidance, and expert insights.",
  "improvementsSummary": ["Detailed bullet points describing what was improved (clarity, structure, depth, examples, reasoning, optimizations, technical specifications, etc.)."],
  "confidence": 0.85
}

### Enhancement Framework:

*1. Spark (Foundational Level)*  
- Fix grammar, spelling, and structure inconsistencies.  
- Improve readability and precision of wording.  
- Add essential context and clarifications.  
- Make the request clear, specific, and unambiguous.  
- Add basic technical considerations if applicable.

*2. Glow (Intermediate Level)*  
- Add comprehensive role-playing context (assign AI expert persona with specific credentials).  
- Restructure into logical, step-by-step instructions with detailed sub-steps.  
- Provide illustrative examples, analogies, and real-world applications.  
- Ensure smooth narrative flow and professional tone.  
- Tailor refinements to the implied use-case with industry best practices.
- Add technical specifications, requirements, and implementation guidelines.
- Include content structure suggestions and feature recommendations.

*3. Blaze (Expert Level)*  
- Apply systematic thinking and multi-layered reasoning frameworks.  
- Integrate validation, error-checking, and comprehensive fallback strategies.  
- Provide detailed analytical structures for deep problem-solving.  
- Suggest optimizations for performance, efficiency, scalability, and user experience.  
- Add quality assurance measures, testing strategies, and success metrics.
- Include advanced technical architecture, technology stack recommendations, and industry standards.
- Provide detailed implementation roadmap, timeline considerations, and resource requirements.
- Add compliance, security, accessibility, and maintenance considerations.

### Special Instructions for Technical Contexts:
When enhancing technical prompts, you MUST:

**Technical Depth Enhancement:**
- Demonstrate deep technical knowledge of the subject domain
- Include specific technologies, frameworks, tools, and methodologies
- Provide detailed technical specifications and requirements
- Add architecture considerations, scalability factors, and performance metrics
- Include security, compliance, and accessibility requirements
- Suggest modern best practices and industry standards

**Content & Structure Guidance:**
- Outline comprehensive content structure and information architecture
- Specify required features, functionalities, and user interactions
- Include detailed wireframes descriptions, user flows, and navigation patterns
- Provide content strategy, SEO considerations, and marketing aspects
- Add technical documentation requirements and API specifications

**Implementation Details:**
- Include technology stack recommendations with justifications
- Provide development methodology suggestions (Agile, DevOps, etc.)
- Add testing strategies, deployment considerations, and monitoring requirements
- Include timeline estimates, resource allocation, and budget considerations
- Specify maintenance, updates, and long-term scalability plans

**Professional Expertise:**
- Write as if you have 10+ years of experience in the specific domain
- Reference industry standards, regulatory requirements, and compliance needs
- Include real-world challenges, common pitfalls, and proven solutions
- Add competitive analysis insights and market positioning strategies

### Core Directives:
- Always *respect and preserve the original intent* while dramatically expanding depth and technical accuracy.  
- Produce enhancements that are *intellectually rigorous, technically comprehensive, and demonstrate world-class expertise*.  
- For technical prompts, include detailed specifications, architecture, implementation guidance, and industry best practices.
- Respond **only with the JSON object**.  
- Ensure every enhancement feels like it was crafted by a **world-class technical expert and professional prompt engineer**.

**Context:** ${contextMap[context as keyof typeof contextMap]}${lineConstraint}
**Original Prompt to Enhance:**
${content}

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
    
    // Check if API key is available, prompt user to add it
    if (!OPENROUTER_API_KEY) {
      const apiKey = prompt('Please enter your OpenRouter API key to use AI enhancement:');
      if (apiKey) {
        localStorage.setItem('openrouter_api_key', apiKey);
        // Update the key for this session
        (window as any).OPENROUTER_API_KEY = apiKey;
      } else {
        throw new Error('OpenRouter API key is required for AI enhancement. Please get one from https://openrouter.ai');
      }
    }
    
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
    // Check if already cancelled
    if (options.signal?.aborted) {
      throw new Error('Enhancement cancelled by user');
    }
    
    // Adaptive timeout based on previous failures
    const baseTimeout = 30000; // 30 seconds base
    const adaptiveTimeout = Math.min(baseTimeout + (this.consecutiveFailures * 5000), 60000);
    
    return Promise.race([
      makeAIRequest(options, model, attempt),
      new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Request timeout')), adaptiveTimeout);
        
        // Listen for abort signal
        options.signal?.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Enhancement cancelled by user'));
        });
      })
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

// Main export function - returns only the enhanced content string
export const enhancePromptWithAI = async (options: AIEnhanceOptions): Promise<string> => {
  const service = AIEnhancementService.getInstance();
  const result = await service.enhance(options);
  return result.enhancedContent;
};

// Full enhancement function - returns complete structured result
export const enhancePromptFull = async (options: AIEnhanceOptions): Promise<EnhancementResult> => {
  const service = AIEnhancementService.getInstance();
  return service.enhance(options);
};

// Export service instance for advanced usage
export const getAIService = (): AIEnhancementService => {
  return AIEnhancementService.getInstance();
};

// Separate function for making AI requests
const makeAIRequest = async (options: AIEnhanceOptions, model: string, attempt: number): Promise<EnhancementResult> => {
  const prompt = getEnhancementPrompt(options.content, options.level, options.context, options.lineCount);
  
  // Use external abort signal if provided, otherwise create our own
  const controller = new AbortController();
  const combinedSignal = options.signal ? 
    AbortSignal.any([options.signal, controller.signal]) : 
    controller.signal;
  
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_CONFIG.timeout);
  
  try {
    // Get current API key (might have been updated)
    const currentApiKey = OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key') || (window as any).OPENROUTER_API_KEY || '';
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentApiKey}`,
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
      signal: combinedSignal
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

    // Robust parsing logic that always extracts clean content
    return parseAIResponse(aiResponse);
  } finally {
    clearTimeout(timeoutId);
  }
};

// Enhanced parsing function that ensures clean content extraction
const parseAIResponse = (aiResponse: string): EnhancementResult => {
  try {
    let cleanedResponse = aiResponse.trim();
    
    // Remove markdown code blocks if present
    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    
    // Try to parse as JSON first
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (jsonError) {
      // If it's not valid JSON, treat the entire response as enhanced content
      const formattedContent = formatEnhancedContent(aiResponse);
      return {
        enhancedContent: formattedContent,
        improvementsSummary: ['AI enhancement applied'],
        confidence: 0.8
      };
    }
    
    // Successfully parsed JSON - extract enhancedContent
    if (parsedResponse && typeof parsedResponse === 'object') {
      // Case 1: Standard JSON response with enhancedContent field
      if (parsedResponse.enhancedContent) {
        const formattedContent = formatEnhancedContent(parsedResponse.enhancedContent);
        return {
          enhancedContent: formattedContent,
          improvementsSummary: Array.isArray(parsedResponse.improvementsSummary) 
            ? parsedResponse.improvementsSummary 
            : [parsedResponse.improvementsSummary || 'AI enhancement applied'],
          confidence: Math.min(Math.max(Number(parsedResponse.confidence) || 0.8, 0), 1)
        };
      }
      
      // Case 2: AI returned JSON as a string value
      if (typeof parsedResponse === 'string' && parsedResponse.includes('enhancedContent')) {
        try {
          const innerParsed = JSON.parse(parsedResponse);
          if (innerParsed.enhancedContent) {
            const formattedContent = formatEnhancedContent(innerParsed.enhancedContent);
            return {
              enhancedContent: formattedContent,
              improvementsSummary: Array.isArray(innerParsed.improvementsSummary) 
                ? innerParsed.improvementsSummary 
                : [innerParsed.improvementsSummary || 'AI enhancement applied'],
              confidence: Math.min(Math.max(Number(innerParsed.confidence) || 0.8, 0), 1)
            };
          }
        } catch {
          // Fall through to next case
        }
      }
      
      // Case 3: JSON object without enhancedContent field - use entire content
      const contentToUse = typeof parsedResponse === 'string' ? parsedResponse : JSON.stringify(parsedResponse, null, 2);
      const formattedContent = formatEnhancedContent(contentToUse);
      return {
        enhancedContent: formattedContent,
        improvementsSummary: ['AI enhancement applied'],
        confidence: 0.7
      };
    }
    
    // Case 4: Parsed response is not an object
    const formattedContent = formatEnhancedContent(String(parsedResponse));
    return {
      enhancedContent: formattedContent,
      improvementsSummary: ['AI enhancement applied'],
      confidence: 0.7
    };
    
  } catch (error) {
    // Final fallback: treat entire response as enhanced content
    console.warn('Failed to parse AI response:', error);
    const formattedContent = formatEnhancedContent(aiResponse);
    return {
      enhancedContent: formattedContent,
      improvementsSummary: ['AI enhancement applied (fallback parsing)'],
      confidence: 0.6
    };
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
    // Get current API key
    const currentApiKey = OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key') || '';
    
    if (!currentApiKey) {
      return false; // No API key = disconnected
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentApiKey}`,
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