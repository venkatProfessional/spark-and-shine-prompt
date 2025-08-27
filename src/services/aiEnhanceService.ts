// AI Enhancement Service using DeepSeek V3-0324 via OpenRouter
const OPENROUTER_API_KEY = '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';
const DEEPSEEK_MODEL = 'deepseek/deepseek-chat-v3-0324';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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

export const enhancePromptWithAI = async (options: AIEnhanceOptions): Promise<EnhancementResult> => {
  try {
    const prompt = getEnhancementPrompt(options.content, options.level, options.context);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PromptCraft AI Enhancer'
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI model');
    }

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(aiResponse);
      
      // Validate the response structure
      if (!parsedResponse.enhancedContent || !Array.isArray(parsedResponse.improvementsSummary)) {
        throw new Error('Invalid response structure from AI');
      }

      return {
        enhancedContent: parsedResponse.enhancedContent,
        improvementsSummary: parsedResponse.improvementsSummary || [],
        confidence: parsedResponse.confidence || 0.8
      };
    } catch (parseError) {
      // Fallback: treat the entire response as enhanced content
      return {
        enhancedContent: aiResponse,
        improvementsSummary: ['AI enhancement applied'],
        confidence: 0.7
      };
    }
  } catch (error) {
    console.error('AI Enhancement Error:', error);
    
    // Fallback to local enhancement
    return {
      enhancedContent: getLocalFallbackEnhancement(options.content, options.level),
      improvementsSummary: ['Applied local enhancement (AI unavailable)'],
      confidence: 0.5
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
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PromptCraft Connection Test'
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
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