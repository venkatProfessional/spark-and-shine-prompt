import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Prompt {
  id: string;
  title: string;
  content: string;
  enhancedContent?: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  history: Array<{
    content: string;
    timestamp: string;
    version: number;
  }>;
}

interface PromptContextType {
  prompts: Prompt[];
  currentPrompt: Prompt | null;
  savePrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history'>) => void;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  setCurrentPrompt: (prompt: Prompt | null) => void;
  searchPrompts: (query: string) => Prompt[];
  exportPrompts: () => void;
  importPrompts: (file: File) => Promise<boolean>;
  enhancePrompt: (content: string, level: 'spark' | 'glow' | 'shine') => string;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    // Load prompts from localStorage
    const savedPrompts = localStorage.getItem('promptcraft_prompts');
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts));
      } catch (error) {
        console.error('Error loading prompts:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save prompts to localStorage whenever prompts change
    localStorage.setItem('promptcraft_prompts', JSON.stringify(prompts));
  }, [prompts]);

  const savePrompt = (promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history'>) => {
    const now = new Date().toISOString();
    const newPrompt: Prompt = {
      ...promptData,
      id: `prompt_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      version: 1,
      history: [{
        content: promptData.content,
        timestamp: now,
        version: 1
      }]
    };

    setPrompts(prev => [...prev, newPrompt]);
    setCurrentPrompt(newPrompt);
  };

  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setPrompts(prev => prev.map(prompt => {
      if (prompt.id === id) {
        const now = new Date().toISOString();
        const updatedPrompt = {
          ...prompt,
          ...updates,
          updatedAt: now,
          version: prompt.version + 1
        };

        // Add to history if content changed
        if (updates.content && updates.content !== prompt.content) {
          updatedPrompt.history = [
            ...prompt.history,
            {
              content: updates.content,
              timestamp: now,
              version: updatedPrompt.version
            }
          ];
        }

        return updatedPrompt;
      }
      return prompt;
    }));
  };

  const deletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(prompt => prompt.id !== id));
    if (currentPrompt?.id === id) {
      setCurrentPrompt(null);
    }
  };

  const searchPrompts = (query: string): Prompt[] => {
    if (!query.trim()) return prompts;
    
    const lowercaseQuery = query.toLowerCase();
    return prompts.filter(prompt =>
      prompt.title.toLowerCase().includes(lowercaseQuery) ||
      prompt.content.toLowerCase().includes(lowercaseQuery) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      prompt.category.toLowerCase().includes(lowercaseQuery)
    );
  };

  const exportPrompts = () => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `promptcraft-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importPrompts = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const importedPrompts = JSON.parse(text);
      
      if (Array.isArray(importedPrompts)) {
        setPrompts(prev => [...prev, ...importedPrompts]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing prompts:', error);
      return false;
    }
  };

  const enhancePrompt = (content: string, level: 'spark' | 'glow' | 'shine'): string => {
    if (!content.trim()) return content;

    // Detect content type using regex patterns
    const codeKeywords = /\b(code|programming|function|variable|algorithm|debug|script)\b/i;
    const creativeKeywords = /\b(story|creative|writing|poem|narrative|character|plot)\b/i;
    const analyticalKeywords = /\b(analyze|research|data|statistics|report|findings)\b/i;

    let enhancement = '';
    
    // Determine context
    let context = 'general';
    if (codeKeywords.test(content)) context = 'technical';
    else if (creativeKeywords.test(content)) context = 'creative';
    else if (analyticalKeywords.test(content)) context = 'analytical';

    // Apply enhancement based on level
    switch (level) {
      case 'spark':
        enhancement = applySparkEnhancement(content, context);
        break;
      case 'glow':
        enhancement = applyGlowEnhancement(content, context);
        break;
      case 'shine':
        enhancement = applyShineEnhancement(content, context);
        break;
    }

    return enhancement;
  };

  return (
    <PromptContext.Provider value={{
      prompts,
      currentPrompt,
      savePrompt,
      updatePrompt,
      deletePrompt,
      setCurrentPrompt,
      searchPrompts,
      exportPrompts,
      importPrompts,
      enhancePrompt
    }}>
      {children}
    </PromptContext.Provider>
  );
};

// Enhancement helper functions
const applySparkEnhancement = (content: string, context: string): string => {
  const roleMap = {
    technical: "You are an expert software engineer and technical architect.",
    creative: "You are a master storyteller and creative writing expert.",
    analytical: "You are a senior data analyst and research specialist.",
    general: "You are a knowledgeable assistant with expertise across multiple domains."
  };

  return `${roleMap[context as keyof typeof roleMap]}

${content}

Please provide a clear, well-structured response.`;
};

const applyGlowEnhancement = (content: string, context: string): string => {
  const roleMap = {
    technical: "You are an expert software engineer and technical architect with years of experience in system design and best practices.",
    creative: "You are a master storyteller and creative writing expert with a deep understanding of narrative structure and character development.",
    analytical: "You are a senior data analyst and research specialist with expertise in statistical analysis and insight generation.",
    general: "You are a knowledgeable assistant with expertise across multiple domains and a talent for clear communication."
  };

  return `${roleMap[context as keyof typeof roleMap]}

**Request:** ${content}

**Instructions:**
1. Understand the core objective and any specific requirements
2. Consider relevant context and best practices
3. Structure your response logically with clear explanations
4. Include practical examples or analogies where helpful
5. Ensure your response is actionable and comprehensive

Please provide a detailed, well-organized response that addresses all aspects of the request.`;
};

const applyShineEnhancement = (content: string, context: string): string => {
  const roleMap = {
    technical: "You are an expert software engineer and technical architect with years of experience in system design, best practices, and mentoring others.",
    creative: "You are a master storyteller and creative writing expert with a deep understanding of narrative structure, character development, and the craft of compelling writing.",
    analytical: "You are a senior data analyst and research specialist with expertise in statistical analysis, insight generation, and translating complex data into actionable recommendations.",
    general: "You are a knowledgeable assistant with expertise across multiple domains, excellent critical thinking skills, and a talent for clear, engaging communication."
  };

  return `${roleMap[context as keyof typeof roleMap]}

**Request:** ${content}

**Analysis Framework:**
1. **Understanding**: First, let me break down the key components of this request
2. **Context**: Consider the relevant background and constraints
3. **Approach**: Outline the most effective strategy to address this
4. **Implementation**: Provide step-by-step guidance with examples
5. **Validation**: Include ways to verify success and handle potential issues
6. **Enhancement**: Suggest improvements and advanced considerations

**Please think through each step systematically:**

Step 1: Analyze the request and identify the core objectives
Step 2: Consider any assumptions or clarifications needed
Step 3: Develop a comprehensive approach
Step 4: Provide detailed, actionable guidance
Step 5: Include error-checking and quality assurance measures
Step 6: Offer suggestions for optimization and future improvements

Please provide a thorough, methodical response that demonstrates deep expertise and practical wisdom.`;
};

export const usePrompts = () => {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
};