import React, { useState, useRef, useEffect } from 'react';
import { usePrompts } from '../contexts/PromptContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { useToast } from '../hooks/use-toast';
import { useIsMobile } from '../hooks/use-mobile';
import { getAIService, enhancePromptWithAI } from '../services/aiEnhanceService';
import { 
  Save, 
  Sparkles, 
  Zap, 
  Star, 
  Copy, 
  Trash2, 
  Tag, 
  Eye,
  EyeOff,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import AIEnhancementLoader from './AIEnhancementLoader';

export const PromptEditor: React.FC = React.memo(() => {
  const { 
    currentPrompt, 
    savePrompt, 
    updatePrompt, 
    deletePrompt, 
    enhancePrompt,
    setCurrentPrompt 
  } = usePrompts();
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const editorRef = useRef<HTMLDivElement>(null);
  const aiService = React.useMemo(() => getAIService(), []);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [enhancedContent, setEnhancedContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('general');
  const [newTag, setNewTag] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [enhancementLevel, setEnhancementLevel] = useState<'spark' | 'glow' | 'shine'>('glow');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [enhancementSummary, setEnhancementSummary] = useState<string[]>([]);
  const [aiConnectionState, setAiConnectionState] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [isRefreshingConnection, setIsRefreshingConnection] = useState(false);
  const [enhancementAbortController, setEnhancementAbortController] = useState<AbortController | null>(null);

  // Load current prompt data
  useEffect(() => {
    if (currentPrompt) {
      setTitle(currentPrompt.title);
      setContent(currentPrompt.content);
      setEnhancedContent(currentPrompt.enhancedContent || '');
      setTags(currentPrompt.tags);
      setCategory(currentPrompt.category);
    } else {
      // Reset for new prompt
      setTitle('');
      setContent('');
      setEnhancedContent('');
      setTags([]);
      setCategory('general');
    }
  }, [currentPrompt]);

  // Monitor AI connection state
  useEffect(() => {
    const updateConnectionState = () => {
      setAiConnectionState(aiService.getConnectionState());
    };
    
    updateConnectionState();
    const interval = setInterval(updateConnectionState, 10000); // Check every 10s
    
    return () => clearInterval(interval);
  }, [aiService]);

  // Auto-save functionality
  useEffect(() => {
    if (!currentPrompt || !content.trim()) return;
    
    const autoSaveDelay = 3000; // 3 seconds
    const timeoutId = setTimeout(() => {
      const promptData = {
        title: title.trim() || 'Untitled Prompt',
        content: content.trim(),
        enhancedContent,
        tags,
        category
      };
      updatePrompt(currentPrompt.id, promptData);
    }, autoSaveDelay);
    
    return () => clearTimeout(timeoutId);
  }, [title, content, enhancedContent, tags, category, currentPrompt, updatePrompt]);

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your prompt",
        variant: "destructive"
      });
      return;
    }

    const promptData = {
      title: title.trim() || 'Untitled Prompt',
      content: content.trim(),
      enhancedContent,
      tags,
      category
    };

    if (currentPrompt) {
      updatePrompt(currentPrompt.id, promptData);
      toast({
        title: "✅ Prompt Updated",
        description: "Your prompt has been saved successfully!",
      });
    } else {
      savePrompt(promptData);
      toast({
        title: "🎉 Prompt Created",
        description: "Your new prompt has been saved!",
      });
    }
  };

  const handleEnhance = React.useCallback(async () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content to enhance",
        variant: "destructive"
      });
      return;
    }

    // Create new AbortController for this enhancement
    const abortController = new AbortController();
    setEnhancementAbortController(abortController);
    setIsEnhancing(true);
    
    try {
      let enhanced: string;
      let summary: string[] = [];
      
      if (useAI) {
        try {
          const result = await enhancePromptWithAI({
            content,
            level: enhancementLevel,
            context: category,
            signal: abortController.signal
          });
          enhanced = result.enhancedContent;
          summary = result.improvementsSummary;
        } catch (aiError: any) {
          // Check if it was cancelled
          if (aiError.name === 'AbortError' || aiError.message?.includes('cancelled')) {
            toast({
              title: "Enhancement Cancelled",
              description: "AI enhancement was cancelled by user.",
            });
            return;
          }
          
          console.error('AI Enhancement failed:', aiError);
          toast({
            title: "AI Enhancement Failed",
            description: "Falling back to local enhancement. Please check your connection and try again.",
            variant: "destructive",
          });
          
          // Fallback to local enhancement
          enhanced = enhancePrompt(content, enhancementLevel);
          summary = ['Applied local enhancement (AI service unavailable)', 'Content structure improved', 'Basic formatting applied'];
        }
        setEnhancementSummary(summary);
        
        // Update connection state based on success
        setAiConnectionState('connected');
      } else {
        enhanced = enhancePrompt(content, enhancementLevel);
        summary = ['Applied local enhancement'];
        setEnhancementSummary(summary);
      }
      
      setEnhancedContent(enhanced);
      
      const levelEmojis = {
        spark: '✨',
        glow: '🌟',
        shine: '💫'
      };
      
      toast({
        title: `${levelEmojis[enhancementLevel]} ${useAI ? 'AI' : 'Local'} Enhancement Complete`,
        description: `Applied ${enhancementLevel} level enhancement to your prompt!`,
      });
    } catch (error: any) {
      // Check if it was cancelled
      if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
        toast({
          title: "Enhancement Cancelled",
          description: "AI enhancement was cancelled by user.",
        });
        return;
      }
      
      console.error('Enhancement error:', error);
      
      // Update connection state and fallback to local enhancement
      setAiConnectionState('disconnected');
      const enhanced = enhancePrompt(content, enhancementLevel);
      setEnhancedContent(enhanced);
      setEnhancementSummary(['Applied local enhancement (AI unavailable)']);
      
      toast({
        title: "⚠️ AI Enhancement Failed",
        description: "Used local enhancement instead",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
      setEnhancementAbortController(null);
    }
  }, [content, enhancementLevel, category, useAI, enhancePrompt, toast]);

  const handleRefreshConnection = React.useCallback(async () => {
    setIsRefreshingConnection(true);
    try {
      const isConnected = await aiService.refreshConnection();
      setAiConnectionState(isConnected ? 'connected' : 'disconnected');
      
      toast({
        title: isConnected ? "🟢 AI Connected" : "🔴 AI Offline",
        description: isConnected 
          ? "AI enhancement is available" 
          : "Using local enhancement only",
        variant: isConnected ? "default" : "destructive"
      });
    } catch (error) {
      setAiConnectionState('disconnected');
      toast({
        title: "🔴 Connection Failed",
        description: "Could not connect to AI service",
        variant: "destructive"
      });
    } finally {
      setIsRefreshingConnection(false);
    }
    }, [aiService, toast]);

  const handleCancelEnhancement = React.useCallback(() => {
    if (enhancementAbortController) {
      enhancementAbortController.abort();
      setEnhancementAbortController(null);
      setIsEnhancing(false);
    }
  }, [enhancementAbortController]);

  const handleRestartEnhancement = React.useCallback(() => {
    // This will be called if user clicks enhance while cancellation countdown is running
    if (enhancementAbortController) {
      enhancementAbortController.abort();
      setEnhancementAbortController(null);
    }
    setIsEnhancing(false);
    // Start enhancement again immediately
    setTimeout(() => {
      handleEnhance();
    }, 100);
  }, [enhancementAbortController, handleEnhance]);

  const handleDelete = () => {
    if (currentPrompt && window.confirm('Are you sure you want to delete this prompt?')) {
      deletePrompt(currentPrompt.id);
      toast({
        title: "🗑️ Prompt Deleted",
        description: "Your prompt has been removed",
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCopyEnhanced = () => {
    if (enhancedContent) {
      navigator.clipboard.writeText(enhancedContent);
      toast({
        title: "📋 Copied!",
        description: "Enhanced prompt copied to clipboard",
      });
    }
  };

  const renderDiffView = () => {
    if (!content || !enhancedContent) return null;

    // Simple diff highlighting - this is a basic implementation
    const originalLines = content.split('\n');
    const enhancedLines = enhancedContent.split('\n');

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2 text-muted-foreground">Original</h4>
          <div className="space-y-1">
            {originalLines.map((line, index) => (
              <div key={index} className="text-sm diff-unchanged">
                {line || '\u00A0'}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-success/10 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2 text-success">Enhanced</h4>
          <div className="space-y-1">
            {enhancedLines.map((line, index) => (
              <div key={index} className="text-sm">
                {line || '\u00A0'}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-border bg-card/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Prompt title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base lg:text-lg font-medium border-none bg-transparent focus:bg-card shadow-none px-0"
            />
          </div>
          
          <div className="flex items-center justify-between lg:justify-end space-x-2">
            {/* AI Connection Status */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshConnection}
                disabled={isRefreshingConnection}
                className="p-1 opacity-60 hover:opacity-100"
                title="Refresh AI Connection"
              >
                {isRefreshingConnection ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : aiConnectionState === 'connected' ? (
                  <Wifi className="h-3 w-3 text-success" />
                ) : aiConnectionState === 'disconnected' ? (
                  <WifiOff className="h-3 w-3 text-destructive" />
                ) : (
                  <RefreshCw className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </div>
            
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="p-2"
              >
                {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            
            {currentPrompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="p-2 text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              size={isMobile ? "sm" : "default"}
              className="gradient-primary text-white shadow-elegant hover:shadow-glow"
            >
              <Save className="h-4 w-4 mr-2" />
              {isMobile ? "" : "Save"}
            </Button>
          </div>
        </div>

        {/* Tags and Category - Responsive */}
        <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4">
          <div className="flex items-center space-x-2 flex-1">
            <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-wrap gap-1 flex-1">
              {tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/20 transition-colors"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
              <div className="flex items-center space-x-1">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="w-20 h-6 text-xs border-none bg-transparent focus:bg-card shadow-none px-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddTag}
                  className="h-6 px-2 text-xs hover:bg-muted/50 transition-colors"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs bg-transparent border border-border rounded px-2 py-1 focus:border-primary outline-none transition-colors hover:border-primary/50"
          >
            <option value="general">General</option>
            <option value="technical">Technical</option>
            <option value="creative">Creative</option>
            <option value="analytical">Analytical</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* Content Area - Responsive */}
      <div className="flex-1 p-4 lg:p-6">
        {!isPreviewMode || isMobile ? (
          <div className={`grid gap-4 lg:gap-6 h-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>
            {/* Editor */}
            <div className="space-y-4 order-1">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h3 className="font-medium">Content</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseAI(!useAI)}
                    className={`transition-all ${useAI ? 'bg-success text-success-foreground hover:bg-success/90' : 'bg-muted hover:bg-muted/80'}`}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    {useAI ? 'AI' : 'Local'}
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEnhancementLevel('spark')}
                      className={`transition-all ${enhancementLevel === 'spark' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {isMobile ? '' : 'Spark'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEnhancementLevel('glow')}
                      className={`transition-all ${enhancementLevel === 'glow' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {isMobile ? '' : 'Glow'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEnhancementLevel('shine')}
                      className={`transition-all ${enhancementLevel === 'shine' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {isMobile ? '' : 'Shine'}
                    </Button>
                  </div>
                   <Button
                     onClick={isEnhancing ? handleRestartEnhancement : handleEnhance}
                     disabled={!content.trim()}
                     size={isMobile ? "sm" : "default"}
                     className="gradient-success text-white transition-all hover:shadow-glow disabled:opacity-50"
                   >
                     <Sparkles className="h-4 w-4 mr-2" />
                     {isEnhancing ? 'Restart' : isMobile ? 'Enhance' : 'Enhance'}
                   </Button>
                </div>
              </div>
              
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your prompt here... Be creative! ✨"
                className={`resize-none prompt-editor transition-all ${isMobile ? 'min-h-[300px]' : 'min-h-[400px]'}`}
              />
            </div>

            {/* Enhanced Content */}
            <div className={`space-y-4 ${isMobile ? 'order-3' : 'order-2'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Enhanced Content</h3>
                <div className="flex items-center space-x-2">
                  {isMobile && enhancedContent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className="p-2"
                    >
                      {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEnhanced}
                    disabled={!enhancedContent}
                    className="text-xs transition-colors hover:bg-muted/50"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
              
              <div className={`bg-success/5 border-2 border-success/20 rounded-lg p-4 transition-all ${isMobile ? 'min-h-[300px]' : 'min-h-[400px]'}`}>
                {enhancedContent ? (
                  <div className="space-y-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                      {enhancedContent}
                    </pre>
                    {enhancementSummary.length > 0 && (
                      <div className="border-t border-border pt-3">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Improvements Applied:</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {enhancementSummary.map((improvement, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-success mr-1 flex-shrink-0">•</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                      <p className="text-sm">Enhanced content will appear here</p>
                      <p className="text-xs mt-1">Click "Enhance" to get started!</p>
                      <div className="flex items-center justify-center space-x-1 mt-2">
                        {aiConnectionState === 'connected' ? (
                          <div className="flex items-center space-x-1 text-primary">
                            <Wifi className="h-3 w-3" />
                            <span className="text-xs">AI-powered enhancement available</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <WifiOff className="h-3 w-3" />
                            <span className="text-xs">Local enhancement only</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Preview Mode - Side by side diff
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Preview - Side by Side Comparison</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEnhanced}
                disabled={!enhancedContent}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Enhanced
              </Button>
            </div>
            {renderDiffView()}
          </div>
        )}
      </div>

      {/* AI Enhancement Loader */}
      <AIEnhancementLoader 
        isVisible={isEnhancing} 
        onCancel={handleCancelEnhancement}
        onRestart={handleRestartEnhancement}
      />
    </div>
  );
});