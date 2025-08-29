import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePrompts } from '../contexts/PromptContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Sparkles,
  FileText,
  Tags,
  User
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { prompts, searchPrompts, exportPrompts, importPrompts, setCurrentPrompt } = usePrompts();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPrompts, setFilteredPrompts] = useState(prompts);
  const [isDarkMode, setIsDarkMode] = useState(false);

  React.useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('promptcraft_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  React.useEffect(() => {
    // Update filtered prompts when search query changes
    setFilteredPrompts(searchPrompts(searchQuery));
  }, [searchQuery, prompts, searchPrompts]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('promptcraft_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('promptcraft_theme', 'light');
    }
    
    toast({
      title: `${newMode ? '🌙' : '☀️'} Theme Changed`,
      description: `Switched to ${newMode ? 'dark' : 'light'} mode`,
    });
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importPrompts(file);
      toast({
        title: success ? '✅ Import Successful' : '❌ Import Failed',
        description: success ? 'Prompts imported successfully!' : 'Failed to import prompts. Please check the file format.',
        variant: success ? 'default' : 'destructive'
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: '👋 See you soon!',
      description: 'You have been logged out successfully.',
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - Responsive */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 bg-card border-r border-border shadow-soft flex-col">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              PromptCraft
            </h1>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 text-destructive hover:text-destructive/80"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{user?.username}</span>
              {user?.role === 'admin' && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportPrompts}
                className="p-2"
                title="Export Prompts"
              >
                <Download className="h-4 w-4" />
              </Button>
              <label className="cursor-pointer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  title="Import Prompts"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Prompts List */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              Your Prompts ({filteredPrompts.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPrompt(null)}
              className="p-2 hover:bg-muted/50 transition-colors"
              title="New Prompt"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => setCurrentPrompt(prompt)}
                className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {prompt.title || 'Untitled Prompt'}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {prompt.enhancedContent && (
                      <Sparkles className="h-3 w-3 text-accent animate-sparkle" />
                    )}
                    <FileText className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {prompt.content}
                </p>
                
                {prompt.tags.length > 0 && (
                  <div className="flex items-center space-x-1 mb-2">
                    <Tags className="h-3 w-3 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {prompt.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {prompt.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{prompt.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  {new Date(prompt.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}

            {filteredPrompts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? 'No prompts found' : 'No prompts yet'}
                </p>
                <p className="text-xs mt-1">
                  {searchQuery ? 'Try a different search term' : 'Create your first prompt to get started!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
            PromptCraft
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPrompt(null)}
              className="p-2"
              title="New Prompt"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <div className="lg:hidden h-16" /> {/* Spacer for mobile header */}
        {children}
      </div>
    </div>
  );
};