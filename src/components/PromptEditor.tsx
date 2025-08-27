import React, { useState, useRef, useEffect } from 'react';
import { usePrompts } from '../contexts/PromptContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { useToast } from '../hooks/use-toast';
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
  RotateCcw,
  Settings
} from 'lucide-react';

export const PromptEditor: React.FC = () => {
  const { 
    currentPrompt, 
    savePrompt, 
    updatePrompt, 
    deletePrompt, 
    enhancePrompt,
    setCurrentPrompt 
  } = usePrompts();
  
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [enhancedContent, setEnhancedContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('general');
  const [newTag, setNewTag] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [enhancementLevel, setEnhancementLevel] = useState<'spark' | 'glow' | 'shine'>('glow');

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

  const handleEnhance = () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content to enhance",
        variant: "destructive"
      });
      return;
    }

    const enhanced = enhancePrompt(content, enhancementLevel);
    setEnhancedContent(enhanced);
    
    const levelEmojis = {
      spark: '✨',
      glow: '🌟',
      shine: '💫'
    };
    
    toast({
      title: `${levelEmojis[enhancementLevel]} Enhancement Complete`,
      description: `Applied ${enhancementLevel} level enhancement to your prompt!`,
    });
  };

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
      <div className="p-6 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Prompt title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium border-none bg-transparent focus:bg-card shadow-none px-0"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="p-2"
            >
              {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
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
              className="gradient-primary text-white shadow-elegant hover:shadow-glow"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Tags and Category */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/20"
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
                  className="h-6 px-2 text-xs"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs bg-transparent border border-border rounded px-2 py-1 focus:border-primary outline-none"
          >
            <option value="general">General</option>
            <option value="technical">Technical</option>
            <option value="creative">Creative</option>
            <option value="analytical">Analytical</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6">
        {!isPreviewMode ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
            {/* Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Content</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhancementLevel('spark')}
                    className={enhancementLevel === 'spark' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Spark
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhancementLevel('glow')}
                    className={enhancementLevel === 'glow' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Glow
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhancementLevel('shine')}
                    className={enhancementLevel === 'shine' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Shine
                  </Button>
                  <Button
                    onClick={handleEnhance}
                    className="gradient-success text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Enhance
                  </Button>
                </div>
              </div>
              
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your prompt here... Be creative! ✨"
                className="min-h-[400px] resize-none prompt-editor"
              />
            </div>

            {/* Enhanced Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Enhanced Content</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyEnhanced}
                  disabled={!enhancedContent}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              
              <div className="min-h-[400px] bg-success/5 border-2 border-success/20 rounded-lg p-4">
                {enhancedContent ? (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {enhancedContent}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Enhanced content will appear here</p>
                      <p className="text-xs mt-1">Click "Enhance" to get started!</p>
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
    </div>
  );
};