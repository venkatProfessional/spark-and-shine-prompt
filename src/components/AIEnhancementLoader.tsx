import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Wand2, Zap, X } from 'lucide-react';
import { Button } from './ui/button';

interface AIEnhancementLoaderProps {
  isVisible: boolean;
  onCancel?: () => void;
}

const loadingMessages = [
  "🤖 Your AI assistant is analyzing your prompt...",
  "✨ Applying enhancement magic...",
  "🧠 Thinking through improvements...",
  "⚡ Optimizing for clarity and impact...",
  "🎯 Fine-tuning the perfect prompt...",
  "🔮 Crafting something amazing...",
  "💫 Almost ready with your enhanced prompt..."
];

const AIEnhancementLoader: React.FC<AIEnhancementLoaderProps> = ({ isVisible, onCancel }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Cycle through messages
  useEffect(() => {
    if (!isVisible) return;
    
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, [isVisible]);

  // Animate dots
  useEffect(() => {
    if (!isVisible) return;
    
    const dotInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <div className="text-center space-y-6">
          {/* Animated Icons */}
          <div className="relative">
            <div className="flex justify-center space-x-2">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              <Brain className="w-8 h-8 text-secondary animate-pulse delay-200" />
              <Wand2 className="w-8 h-8 text-accent animate-pulse delay-300" />
              <Zap className="w-8 h-8 text-primary animate-pulse delay-500" />
            </div>
            
            {/* Orbiting particles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 relative">
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 animate-spin origin-bottom-12">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-secondary rounded-full transform -translate-x-1/2 animate-spin origin-bottom-12 delay-1000" style={{animationDirection: 'reverse'}}>
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                </div>
                <div className="absolute top-0 left-1/2 w-1 h-1 bg-accent rounded-full transform -translate-x-1/2 animate-spin origin-bottom-12 delay-500">
                  <div className="w-1 h-1 bg-accent rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-gradient-to-r from-primary via-secondary to-accent h-2 rounded-full animate-pulse" 
                 style={{
                   width: '100%',
                   animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, progress 3s ease-in-out infinite'
                 }}>
            </div>
          </div>

          {/* Dynamic Message */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground animate-fade-in">
              AI Enhancement in Progress
            </h3>
            <p className="text-muted-foreground animate-fade-in" key={messageIndex}>
              {loadingMessages[messageIndex]}
              <span className="inline-block w-6 text-left">{dots}</span>
            </p>
          </div>

          {/* Floating particles */}
          <div className="relative h-20 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary/60 rounded-full animate-float"
                style={{
                  left: `${10 + i * 15}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Cancel Button */}
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Enhancement
            </Button>
          )}

          {/* Tips */}
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
            💡 <strong>Tip:</strong> AI enhancement uses advanced models to improve clarity, add context, and optimize your prompts for better results.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEnhancementLoader;