import { useState, useEffect, useRef } from 'react';
import { enhancePromptWithAI } from '../services/aiEnhanceService';

interface SuggestionOptions {
  content: string;
  debounceMs?: number;
  minLength?: number;
  context?: string;
  enabled?: boolean;
}

interface Suggestion {
  text: string;
  type: 'completion' | 'improvement' | 'alternative';
  confidence: number;
}

export const useRealtimeSuggestions = ({
  content,
  debounceMs = 2000,
  minLength = 20,
  context = 'general',
  enabled = true
}: SuggestionOptions) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state if content is too short or feature disabled
    if (!enabled || !content || content.length < minLength) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Set loading state immediately for better UX
    setIsLoading(true);
    setError(null);

    // Debounce the suggestion request
    timeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Generate quick suggestions using AI with 3-line constraint
        const enhancementPrompt = `Enhance the following text into EXACTLY 3 lines. Keep it concise, clear, and impactful. Make sure the output is exactly 3 lines, no more, no less.

Original text:
${content}

Enhanced version (must be exactly 3 lines):`;

        const enhanced = await enhancePromptWithAI({
          content: enhancementPrompt,
          level: 'spark',
          context,
          signal: controller.signal
        });

        // Ensure exactly 3 lines
        const lines = enhanced.trim().split('\n').filter(line => line.trim().length > 0);
        let threeLineVersion: string;
        
        if (lines.length > 3) {
          // Take first 3 lines if more
          threeLineVersion = lines.slice(0, 3).join('\n');
        } else if (lines.length < 3) {
          // Pad with the original content split if less
          const originalLines = content.split('\n').filter(l => l.trim());
          threeLineVersion = [...lines, ...originalLines].slice(0, 3).join('\n');
        } else {
          threeLineVersion = lines.join('\n');
        }

        // Create suggestions
        const newSuggestions: Suggestion[] = [{
          text: threeLineVersion,
          type: 'improvement',
          confidence: 0.85
        }];

        setSuggestions(newSuggestions);
        setIsLoading(false);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Suggestion error:', err);
          setError('Failed to generate suggestions');
          setSuggestions([]);
        }
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [content, debounceMs, minLength, context, enabled]);

  const clearSuggestions = () => {
    setSuggestions([]);
    setError(null);
  };

  return {
    suggestions,
    isLoading,
    error,
    clearSuggestions
  };
};
