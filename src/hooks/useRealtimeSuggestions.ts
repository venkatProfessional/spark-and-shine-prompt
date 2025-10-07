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
        // Generate quick suggestions using AI
        const enhanced = await enhancePromptWithAI({
          content,
          level: 'spark', // Use quick enhancement for real-time
          context,
          signal: controller.signal
        });

        // Create suggestions from the enhanced content
        const newSuggestions: Suggestion[] = [];

        // Completion suggestion (if enhanced is longer)
        if (enhanced.length > content.length) {
          const completion = enhanced.slice(content.length).trim();
          if (completion) {
            newSuggestions.push({
              text: completion,
              type: 'completion',
              confidence: 0.8
            });
          }
        }

        // Improvement suggestion (shortened enhanced version)
        const improvementSnippet = enhanced.split('\n').slice(0, 3).join('\n');
        if (improvementSnippet !== content && improvementSnippet.length <= 200) {
          newSuggestions.push({
            text: improvementSnippet,
            type: 'improvement',
            confidence: 0.75
          });
        }

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
