import React from 'react';
import { Lightbulb, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Suggestion {
  text: string;
  type: 'completion' | 'improvement' | 'alternative';
  confidence: number;
}

interface RealtimeSuggestionsProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
  onApplySuggestion: (suggestion: Suggestion) => void;
  onDismiss: () => void;
}

export const RealtimeSuggestions: React.FC<RealtimeSuggestionsProps> = ({
  suggestions,
  isLoading,
  error,
  onApplySuggestion,
  onDismiss
}) => {
  if (!isLoading && suggestions.length === 0 && !error) {
    return null;
  }

  return (
    <Card className="absolute bottom-full left-0 right-0 mb-2 p-3 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm z-50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-foreground">AI Suggestions</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 hover:bg-muted"
        >
          ×
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center space-x-2 text-muted-foreground py-2">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span className="text-xs">Generating suggestions...</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-destructive py-2">
          {error}
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => onApplySuggestion(suggestion)}
            >
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {suggestion.type === 'completion' && 'Continue with:'}
                    {suggestion.type === 'improvement' && 'Improve to:'}
                    {suggestion.type === 'alternative' && 'Alternative:'}
                  </div>
                  <p className="text-sm text-foreground line-clamp-2 group-hover:line-clamp-none">
                    {suggestion.text}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Confidence: {Math.round(suggestion.confidence * 100)}%
                    </span>
                    <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to apply →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
