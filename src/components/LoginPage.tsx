import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useToast } from '../hooks/use-toast';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, loginAsGuest } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let success = false;
      
      if (isLogin) {
        success = await login(username, password);
        if (!success) {
          toast({
            title: "Login Failed",
            description: "Invalid username or password. Try 'admin'/'admin' for demo!",
            variant: "destructive"
          });
        }
      } else {
        success = await signup(username, password);
        if (!success) {
          toast({
            title: "Signup Failed",
            description: "Username already exists. Please choose a different one.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome to PromptCraft! 🎉",
            description: "Your account has been created successfully!",
            variant: "default"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log(`🔄 Password Reset Code: ${resetCode}`);
    toast({
      title: "Password Reset",
      description: `Reset code logged to console: ${resetCode}`,
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 bg-gradient-primary opacity-10 animate-gradient"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-success/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      
      <Card className="w-full max-w-md p-8 bg-card/90 backdrop-blur-md shadow-glow border border-border/50 relative z-10 hover:shadow-elegant transition-all duration-500">
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary shadow-glow animate-float mb-4 relative">
              <span className="text-3xl font-bold text-white animate-sparkle">✨</span>
              <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-30 blur-md animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            PromptCraft
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Join us and start crafting amazing prompts!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary text-white font-medium py-2 px-4 rounded-lg shadow-elegant hover:shadow-glow transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={loginAsGuest}
            className="w-full mb-4"
            disabled={isLoading}
          >
            Continue as Guest
          </Button>

          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            
            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="block w-full text-muted-foreground hover:text-foreground text-sm transition-colors"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 <strong>Demo Account:</strong> admin / admin<br/>
            🎯 <strong>Features:</strong> Rich editor, prompt enhancement, export/import
          </p>
        </div>
      </Card>
    </div>
  );
};