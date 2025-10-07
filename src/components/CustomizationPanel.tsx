import React from 'react';
import { Settings2, FileText, Volume2, Ruler } from 'lucide-react';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';

export interface CustomizationOptions {
  tone: 'formal' | 'casual' | 'professional' | 'friendly' | 'persuasive' | 'educational';
  length: 'concise' | 'moderate' | 'detailed' | 'comprehensive';
  style: 'default' | 'bullet-points' | 'narrative' | 'technical' | 'creative';
  complexity: number; // 1-5
}

interface CustomizationPanelProps {
  options: CustomizationOptions;
  onChange: (options: CustomizationOptions) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  options,
  onChange,
  isExpanded = false,
  onToggle
}) => {
  const handleChange = (key: keyof CustomizationOptions, value: any) => {
    onChange({ ...options, [key]: value });
  };

  if (!isExpanded) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors" onClick={onToggle}>
        <div className="flex items-center space-x-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Customization</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">{options.tone}</Badge>
          <Badge variant="secondary" className="text-xs">{options.length}</Badge>
          <Badge variant="secondary" className="text-xs">{options.style}</Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-4 bg-gradient-to-br from-card/80 to-muted/20 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Customization Options</h3>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Collapse
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tone Selection */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Volume2 className="h-3 w-3 text-accent" />
            <span>Tone</span>
          </Label>
          <Select value={options.tone} onValueChange={(value) => handleChange('tone', value)}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal - Professional and polished</SelectItem>
              <SelectItem value="casual">Casual - Relaxed and friendly</SelectItem>
              <SelectItem value="professional">Professional - Business-focused</SelectItem>
              <SelectItem value="friendly">Friendly - Warm and approachable</SelectItem>
              <SelectItem value="persuasive">Persuasive - Convincing and compelling</SelectItem>
              <SelectItem value="educational">Educational - Clear and instructive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Length Selection */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Ruler className="h-3 w-3 text-success" />
            <span>Length</span>
          </Label>
          <Select value={options.length} onValueChange={(value) => handleChange('length', value)}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concise">Concise - Brief and to the point</SelectItem>
              <SelectItem value="moderate">Moderate - Balanced detail</SelectItem>
              <SelectItem value="detailed">Detailed - Comprehensive coverage</SelectItem>
              <SelectItem value="comprehensive">Comprehensive - In-depth analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Style Selection */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <FileText className="h-3 w-3 text-primary" />
            <span>Style Template</span>
          </Label>
          <Select value={options.style} onValueChange={(value) => handleChange('style', value)}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default - Standard format</SelectItem>
              <SelectItem value="bullet-points">Bullet Points - Structured lists</SelectItem>
              <SelectItem value="narrative">Narrative - Story-like flow</SelectItem>
              <SelectItem value="technical">Technical - Spec-focused</SelectItem>
              <SelectItem value="creative">Creative - Imaginative expression</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Complexity Slider */}
        <div className="space-y-2">
          <Label className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Settings2 className="h-3 w-3 text-warning" />
              <span>Complexity Level</span>
            </span>
            <Badge variant="secondary" className="text-xs">
              {options.complexity}/5
            </Badge>
          </Label>
          <Slider
            value={[options.complexity]}
            onValueChange={(value) => handleChange('complexity', value[0])}
            min={1}
            max={5}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Simple</span>
            <span>Moderate</span>
            <span>Advanced</span>
          </div>
        </div>
      </div>

      {/* Style Descriptions */}
      <div className="pt-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          {options.style === 'default' && '📝 Standard paragraph format with clear structure'}
          {options.style === 'bullet-points' && '• Organized points for easy scanning and comprehension'}
          {options.style === 'narrative' && '📖 Flowing prose that tells a story or guides the reader'}
          {options.style === 'technical' && '⚙️ Specification-focused with technical accuracy'}
          {options.style === 'creative' && '🎨 Imaginative and expressive with vivid language'}
        </p>
      </div>
    </Card>
  );
};
