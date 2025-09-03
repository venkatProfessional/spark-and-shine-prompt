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
  RefreshCw,
  Brain
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
    <div className="flex-1 flex flex-col relative">
      {/* Subtle background elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl animate-float"></div>
      <div className="absolute bottom-20 left-10 w-24 h-24 bg-success/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>
      
      {/* Enhanced Header */}
      <div className="p-4 lg:p-6 border-b border-border/50 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="✨ Give your prompt a magical title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base lg:text-lg font-medium border-none bg-transparent focus:bg-card/50 shadow-none px-0 placeholder:text-muted-foreground/60"
            />
          </div>
          
          <div className="flex items-center justify-between lg:justify-end space-x-3">
            {/* AI Connection Status */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-muted/30 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshConnection}
                disabled={isRefreshingConnection}
                className="p-1 opacity-70 hover:opacity-100 hover:scale-110 transition-all"
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
              <span className="text-xs font-medium">
                {aiConnectionState === 'connected' ? 'AI Ready' : 
                 aiConnectionState === 'disconnected' ? 'Offline' : 'Checking...'}
              </span>
            </div>
            
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="p-2 hover:bg-muted/50 hover:scale-110 transition-all duration-300"
                title={isPreviewMode ? 'Hide Preview' : 'Show Preview'}
              >
                {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            
            {currentPrompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 hover:scale-110 transition-all duration-300"
                title="Delete Prompt"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              size={isMobile ? "sm" : "default"}
              className="gradient-primary text-white shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 group"
            >
              <Save className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
              {isMobile ? "" : "Save"}
            </Button>
          </div>
        </div>

        {/* Enhanced Tags and Category - Responsive */}
        <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-6 p-4 bg-muted/20 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {tags.map((tag, index) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/20 transition-all duration-300 hover:scale-105 group"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <span className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity">×</span>
                </Badge>
              ))}
              <div className="flex items-center space-x-1">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="w-24 h-7 text-xs border-none bg-card/50 focus:bg-card shadow-none px-2 rounded-md"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddTag}
                  className="h-7 px-3 text-xs hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 to-success/10">
              <Settings className="h-4 w-4 text-accent" />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 focus:border-primary outline-none transition-all duration-300 hover:border-primary/50 hover:bg-card"
            >
              <option value="general">🌟 General</option>
              <option value="technical">⚙️ Technical</option>
              <option value="creative">🎨 Creative</option>
              <option value="analytical">📊 Analytical</option>
              <option value="business">💼 Business</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Content Area - Responsive */}
      <div className="flex-1 p-4 lg:p-6 relative z-10">
        {!isPreviewMode || isMobile ? (
          <div className={`grid gap-6 lg:gap-8 h-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>
            {/* Enhanced Editor */}
            <div className="space-y-6 order-1">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-gradient-to-r from-card/40 to-muted/20 rounded-xl backdrop-blur-sm border border-border/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg gradient-primary shadow-soft">
                    <Sparkles className="h-4 w-4 text-white animate-sparkle" />
                  </div>
                  <h3 className="font-semibold text-lg">Craft Your Prompt</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseAI(!useAI)}
                    className={`transition-all duration-300 hover:scale-105 ${useAI ? 'bg-success/20 text-success border-success/30 hover:bg-success/30' : 'bg-muted/50 hover:bg-muted/80'}`}
                  >
                    <Brain className="h-3 w-3 mr-2" />
                    {useAI ? 'AI Mode' : 'Local Mode'}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEnhancementLevel('spark')}
                      className={`transition-all duration-300 hover:scale-105 ${enhancementLevel === 'spark' ? 'bg-primary/20 text-primary border-primary/30' : 'hover:bg-muted/50'}`}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {isMobile ? '✨' : 'Spark'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEnhancementLevel('glow')}
                      className={`transition-all duration-300 hover:scale-105 ${enhancementLevel === 'glow' ? 'bg-warning/20 text-warning border-warning/30' : 'hover:bg-muted/50'}`}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {isMobile ? '🌟' : 'Glow'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEnhancementLevel('shine')}
                      className={`transition-all duration-300 hover:scale-105 ${enhancementLevel === 'shine' ? 'bg-accent/20 text-accent border-accent/30' : 'hover:bg-muted/50'}`}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {isMobile ? '💫' : 'Shine'}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="✨ Enter your prompt here... Be creative!"
                className={`resize-none prompt-editor transition-all duration-300 ${isMobile ? 'min-h-[300px]' : 'min-h-[400px]'} bg-card/30 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-card/50`}
              />

              <div className="flex items-center justify-center">
                <Button
                  onClick={isEnhancing ? handleRestartEnhancement : handleEnhance}
                  disabled={!content.trim()}
                  size={isMobile ? "sm" : "lg"}
                  className="gradient-success text-white shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed px-8"
                >
                  <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                  {isEnhancing ? 'Restart Enhancement' : (isMobile ? 'Enhance' : 'Enhance with AI')}
                </Button>
              </div>
            </div>
            {/* Enhanced Results Panel */}
            <div className={`space-y-6 ${isMobile ? 'order-3' : 'order-2'}`}>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-success/10 to-accent/10 rounded-xl backdrop-blur-sm border border-border/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg gradient-success shadow-soft">
                    <Star className="h-4 w-4 text-white animate-sparkle" />
                  </div>
                  <h3 className="font-semibold text-lg">Enhanced Result</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {isMobile && enhancedContent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className="p-2 hover:bg-muted/50 hover:scale-110 transition-all duration-300"
                      title={isPreviewMode ? 'Hide Preview' : 'Show Preview'}
                    >
                      {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEnhanced}
                    disabled={!enhancedContent}
                    className="text-xs transition-all duration-300 hover:bg-success/10 hover:text-success hover:scale-105 disabled:opacity-50"
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy Enhanced
                  </Button>
                </div>
              </div>
              
              <div className={`bg-gradient-to-br from-success/5 to-accent/5 border-2 border-success/20 rounded-xl p-6 transition-all duration-300 ${isMobile ? 'min-h-[300px]' : 'min-h-[400px]'} backdrop-blur-sm`}>
                {enhancedContent ? (
                  <div className="space-y-6">
                    <div className="bg-card/50 rounded-lg p-4 backdrop-blur-sm">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground">
                        {enhancedContent}
                      </pre>
                    </div>
                    {enhancementSummary.length > 0 && (
                      <div className="border-t border-border/50 pt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                          <Zap className="h-4 w-4 mr-2 text-success" />
                          Improvements Applied:
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                          {enhancementSummary.map((improvement, index) => (
                            <li key={index} className="flex items-start p-2 bg-card/30 rounded-lg">
                              <span className="text-success mr-2 flex-shrink-0 mt-0.5">✨</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-30 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-primary opacity-20 animate-ping"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-medium">Enhanced content will appear here</p>
                        <p className="text-sm">Click "Enhance with AI" to transform your prompt!</p>
                      </div>
                      <div className="flex items-center justify-center space-x-2 mt-4 p-3 bg-card/30 rounded-lg">
                        {aiConnectionState === 'connected' ? (
                          <div className="flex items-center space-x-2 text-success">
                            <Wifi className="h-4 w-4" />
                            <span className="text-sm font-medium">AI-powered enhancement ready</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-warning">
                            <WifiOff className="h-4 w-4" />
                            <span className="text-sm font-medium">Local enhancement available</span>
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
          // Enhanced Preview Mode - Side by side diff
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl backdrop-blur-sm border border-border/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg gradient-primary shadow-soft">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-lg">Preview - Side by Side Comparison</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEnhanced}
                disabled={!enhancedContent}
                className="hover:bg-accent/10 hover:text-accent transition-all duration-300 hover:scale-105"
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