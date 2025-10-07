// Grammar and Style Checking Service using AI
import { enhancePromptFull } from './aiEnhanceService';

export interface GrammarIssue {
  type: 'grammar' | 'spelling' | 'punctuation' | 'style';
  message: string;
  context: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high';
  position?: { start: number; end: number };
}

export interface StyleAnalysis {
  tone: 'formal' | 'casual' | 'technical' | 'creative' | 'mixed';
  readabilityScore: number; // 0-100
  sentenceComplexity: 'simple' | 'moderate' | 'complex';
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced';
  suggestions: string[];
}

export interface GrammarCheckResult {
  issues: GrammarIssue[];
  styleAnalysis: StyleAnalysis;
  overallScore: number;
}

// Basic readability calculation (Flesch Reading Ease approximation)
const calculateReadability = (text: string): number => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
};

// Approximate syllable counter
const countSyllables = (word: string): number => {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let syllableCount = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      syllableCount++;
    }
    previousWasVowel = isVowel;
  }
  
  // Adjust for silent e
  if (word.endsWith('e')) {
    syllableCount--;
  }
  
  return Math.max(1, syllableCount);
};

// Detect tone from content
const detectTone = (text: string): StyleAnalysis['tone'] => {
  const formalIndicators = /\b(furthermore|moreover|consequently|therefore|thus|hereby|pursuant)\b/gi;
  const casualIndicators = /\b(cool|awesome|yeah|gonna|wanna|kinda|sorta)\b/gi;
  const technicalIndicators = /\b(algorithm|function|parameter|variable|implementation|architecture)\b/gi;
  const creativeIndicators = /\b(imagine|vibrant|magical|enchanting|brilliant|magnificent)\b/gi;
  
  const formalCount = (text.match(formalIndicators) || []).length;
  const casualCount = (text.match(casualIndicators) || []).length;
  const technicalCount = (text.match(technicalIndicators) || []).length;
  const creativeCount = (text.match(creativeIndicators) || []).length;
  
  const maxCount = Math.max(formalCount, casualCount, technicalCount, creativeCount);
  
  if (maxCount === 0) return 'mixed';
  if (formalCount === maxCount) return 'formal';
  if (casualCount === maxCount) return 'casual';
  if (technicalCount === maxCount) return 'technical';
  if (creativeCount === maxCount) return 'creative';
  
  return 'mixed';
};

// Analyze sentence complexity
const analyzeSentenceComplexity = (text: string): StyleAnalysis['sentenceComplexity'] => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 'simple';
  
  const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  
  if (avgLength < 12) return 'simple';
  if (avgLength < 20) return 'moderate';
  return 'complex';
};

// Detect vocabulary level
const detectVocabularyLevel = (text: string): StyleAnalysis['vocabularyLevel'] => {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  
  if (avgWordLength < 5) return 'basic';
  if (avgWordLength < 7) return 'intermediate';
  return 'advanced';
};

// Basic grammar checks (client-side patterns)
const performBasicGrammarCheck = (text: string): GrammarIssue[] => {
  const issues: GrammarIssue[] = [];
  
  // Check for double spaces
  const doubleSpaceRegex = /\s{2,}/g;
  let match;
  while ((match = doubleSpaceRegex.exec(text)) !== null) {
    issues.push({
      type: 'style',
      message: 'Multiple consecutive spaces found',
      context: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + 20)),
      suggestion: 'Use single space',
      severity: 'low',
      position: { start: match.index, end: match.index + match[0].length }
    });
  }
  
  // Check for missing capitalization after period
  const capitalizationRegex = /[.!?]\s+[a-z]/g;
  while ((match = capitalizationRegex.exec(text)) !== null) {
    issues.push({
      type: 'grammar',
      message: 'Sentence should start with capital letter',
      context: text.substring(Math.max(0, match.index - 10), Math.min(text.length, match.index + 20)),
      suggestion: 'Capitalize the first letter',
      severity: 'medium',
      position: { start: match.index, end: match.index + match[0].length }
    });
  }
  
  // Check for common spelling errors
  const commonErrors: Record<string, string> = {
    'teh': 'the',
    'thier': 'their',
    'recieve': 'receive',
    'occured': 'occurred',
    'seperate': 'separate',
  };
  
  Object.entries(commonErrors).forEach(([error, correction]) => {
    const errorRegex = new RegExp(`\\b${error}\\b`, 'gi');
    while ((match = errorRegex.exec(text)) !== null) {
      issues.push({
        type: 'spelling',
        message: `Possible spelling error: "${error}"`,
        context: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + 20)),
        suggestion: correction,
        severity: 'high',
        position: { start: match.index, end: match.index + match[0].length }
      });
    }
  });
  
  return issues;
};

// AI-powered deep grammar and style analysis
export const checkGrammarAndStyle = async (
  text: string,
  signal?: AbortSignal
): Promise<GrammarCheckResult> => {
  if (!text.trim()) {
    return {
      issues: [],
      styleAnalysis: {
        tone: 'mixed',
        readabilityScore: 0,
        sentenceComplexity: 'simple',
        vocabularyLevel: 'basic',
        suggestions: []
      },
      overallScore: 0
    };
  }

  // Perform basic checks immediately
  const basicIssues = performBasicGrammarCheck(text);
  
  // Calculate style metrics
  const readabilityScore = calculateReadability(text);
  const tone = detectTone(text);
  const sentenceComplexity = analyzeSentenceComplexity(text);
  const vocabularyLevel = detectVocabularyLevel(text);
  
  // Build style analysis prompt for AI
  const analysisPrompt = `Analyze the following text for grammar, style, and clarity issues. Provide specific, actionable feedback.

Text to analyze:
"""
${text}
"""

Provide your analysis in the following areas:
1. Grammar and punctuation errors
2. Style inconsistencies
3. Clarity improvements
4. Tone consistency
5. Suggestions for better word choice

Format your response as constructive feedback points.`;

  try {
    // Use AI for deep analysis
    const aiResult = await enhancePromptFull({
      content: analysisPrompt,
      level: 'glow',
      context: 'analytical',
      signal
    });
    
    // Parse AI suggestions
    const aiSuggestions = aiResult.improvementsSummary || [];
    
    // Calculate overall score based on issues and readability
    const issueCount = basicIssues.length;
    const issuesPenalty = Math.min(50, issueCount * 5);
    const overallScore = Math.max(0, Math.min(100, 
      (readabilityScore * 0.6) + (50 - issuesPenalty)
    ));
    
    return {
      issues: basicIssues,
      styleAnalysis: {
        tone,
        readabilityScore: Math.round(readabilityScore),
        sentenceComplexity,
        vocabularyLevel,
        suggestions: aiSuggestions
      },
      overallScore: Math.round(overallScore)
    };
  } catch (error) {
    console.error('AI grammar check failed, using basic analysis:', error);
    
    // Fallback to basic analysis only
    const overallScore = Math.max(0, Math.min(100, 
      readabilityScore - (basicIssues.length * 5)
    ));
    
    return {
      issues: basicIssues,
      styleAnalysis: {
        tone,
        readabilityScore: Math.round(readabilityScore),
        sentenceComplexity,
        vocabularyLevel,
        suggestions: ['Consider reviewing for clarity and conciseness']
      },
      overallScore: Math.round(overallScore)
    };
  }
};
