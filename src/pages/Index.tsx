import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Zap,
  Star,
  ArrowRight,
  Layers,
  Brain,
  Palette,
  Rocket,
  Globe,
  Users,
  Trophy,
  Target
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Enhancement",
      description: "Transform your prompts with cutting-edge AI technology",
      color: "text-primary"
    },
    {
      icon: Sparkles,
      title: "Smart Organization",
      description: "Intuitive categorization and tagging system",
      color: "text-accent"
    },
    {
      icon: Palette,
      title: "Beautiful Interface",
      description: "Stunning, responsive design that adapts to your workflow",
      color: "text-success"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance for seamless prompt crafting",
      color: "text-warning"
    },
    {
      icon: Globe,
      title: "Cross-Platform",
      description: "Access your prompts anywhere, on any device",
      color: "text-accent"
    },
    {
      icon: Users,
      title: "Collaboration Ready",
      description: "Share and collaborate on prompts with your team",
      color: "text-primary"
    }
  ];

  const stats = [
    { value: "10k+", label: "Prompts Enhanced", icon: Trophy },
    { value: "99.9%", label: "Uptime", icon: Target },
    { value: "500+", label: "Happy Users", icon: Users },
    { value: "24/7", label: "AI Support", icon: Brain }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5 animate-gradient"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-success/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary shadow-glow animate-float mb-8">
            <Sparkles className="w-10 h-10 text-white animate-sparkle" />
          </div>
          
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium shadow-soft">
            <Star className="w-4 h-4 mr-2" />
            Next-Generation Prompt Engineering
          </Badge>
          
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-primary bg-clip-text text-transparent animate-gradient">
              PromptCraft
            </span>
            <br />
            <span className="text-foreground">Reimagined</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Experience the future of prompt engineering with our visually stunning, 
            AI-powered platform that transforms how you create and enhance prompts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="gradient-primary text-white font-semibold px-8 py-4 text-lg shadow-elegant hover:shadow-glow transition-all duration-300 group"
            >
              Start Crafting
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold border-2 hover:bg-accent/10 hover:border-accent transition-all duration-300"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 py-16 border-y border-border bg-card/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 bg-card/50 backdrop-blur-sm shadow-soft hover:shadow-elegant transition-all duration-300 group">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 shadow-soft">
              <Layers className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Everything you need to
              <span className="gradient-primary bg-clip-text text-transparent"> craft perfect prompts</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive suite of tools and features makes prompt engineering 
              effortless, efficient, and enjoyable.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-8 bg-card/40 backdrop-blur-sm shadow-soft hover:shadow-elegant hover:bg-card/60 transition-all duration-300 group hover:-translate-y-2"
              >
                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-card to-muted/20 ${feature.color} group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-24 bg-gradient-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Rocket className="w-16 h-16 mx-auto mb-6 text-primary animate-float" />
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to revolutionize your
              <span className="gradient-primary bg-clip-text text-transparent"> prompt workflow?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators who are already crafting amazing prompts 
              with PromptCraft's intuitive and powerful platform.
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="gradient-primary text-white font-semibold px-12 py-4 text-xl shadow-elegant hover:shadow-glow transition-all duration-300 group"
            >
              Get Started Free
              <Sparkles className="ml-2 w-6 h-6 group-hover:rotate-12 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-border bg-card/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <div className="gradient-primary bg-clip-text text-transparent font-bold text-2xl mb-4">
            PromptCraft
          </div>
          <p className="text-muted-foreground">
            Crafting the future of AI prompts, one enhancement at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
