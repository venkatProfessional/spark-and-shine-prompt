import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { checkGrammarAndStyle, GrammarCheckResult } from '../services/grammarStyleService';
import { useToast } from '../hooks/use-toast';

interface GrammarStyleCheckerProps {
  content: string;
}

export const GrammarStyleChecker: React.FC<GrammarStyleCheckerProps> = ({ content }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<GrammarCheckResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please enter some content to check",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    try {
      const checkResult = await checkGrammarAndStyle(content);
      setResult(checkResult);
      setIsExpanded(true);
      
      toast({
        title: "✅ Analysis Complete",
        description: `Overall score: ${checkResult.overallScore}/100`,
      });
    } catch (error) {
      console.error('Grammar check failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not complete grammar and style check",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <Info className="h-4 w-4 text-warning" />;
      case 'low':
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          onClick={handleCheck}
          disabled={isChecking || !content.trim()}
          size="sm"
          variant="outline"
          className="hover:bg-accent/10 transition-all duration-300"
        >
          {isChecking ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          {isChecking ? 'Analyzing...' : 'Check Grammar & Style'}
        </Button>
        
        {result && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Show'} Details
          </Button>
        )}
      </div>

      {result && isExpanded && (
        <Card className="p-4 space-y-4 bg-card/50 backdrop-blur-sm border-border/50">
          {/* Overall Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Quality Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}>
                {result.overallScore}/100
              </span>
            </div>
            <Progress value={result.overallScore} className="h-2" />
          </div>

          {/* Style Analysis */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Tone</span>
              <Badge variant="secondary" className="w-full justify-center">
                {result.styleAnalysis.tone}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Readability</span>
              <Badge variant="secondary" className="w-full justify-center">
                {result.styleAnalysis.readabilityScore}/100
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Complexity</span>
              <Badge variant="secondary" className="w-full justify-center">
                {result.styleAnalysis.sentenceComplexity}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Vocabulary</span>
              <Badge variant="secondary" className="w-full justify-center">
                {result.styleAnalysis.vocabularyLevel}
              </Badge>
            </div>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Issues Found ({result.issues.length})</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.issues.map((issue, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(issue.severity)}
                        <span className="text-xs font-medium capitalize">{issue.type}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-sm">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-success flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Suggestion: {issue.suggestion}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {result.styleAnalysis.suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">AI Suggestions</span>
              </div>
              <ul className="space-y-2">
                {result.styleAnalysis.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="text-sm p-2 bg-accent/5 rounded-lg border border-accent/20"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.issues.length === 0 && (
            <div className="flex items-center justify-center p-4 text-success">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">No major issues found!</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
