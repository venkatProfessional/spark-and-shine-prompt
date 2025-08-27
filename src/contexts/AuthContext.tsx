import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded admin account
const ADMIN_ACCOUNT = {
  username: 'admin',
  password: 'admin',
  role: 'admin' as const
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('promptcraft_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('promptcraft_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check admin account
      if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
        const adminUser: User = {
          id: 'admin',
          username: ADMIN_ACCOUNT.username,
          role: ADMIN_ACCOUNT.role
        };
        setUser(adminUser);
        localStorage.setItem('promptcraft_user', JSON.stringify(adminUser));
        return true;
      }

      // Check registered users in localStorage
      const registeredUsers = JSON.parse(localStorage.getItem('promptcraft_registered_users') || '[]');
      const foundUser = registeredUsers.find((u: any) => u.username === username && u.password === password);
      
      if (foundUser) {
        const loggedInUser: User = {
          id: foundUser.id,
          username: foundUser.username,
          role: 'user'
        };
        setUser(loggedInUser);
        localStorage.setItem('promptcraft_user', JSON.stringify(loggedInUser));
        return true;
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check if username already exists
      const registeredUsers = JSON.parse(localStorage.getItem('promptcraft_registered_users') || '[]');
      
      if (registeredUsers.some((u: any) => u.username === username) || username === ADMIN_ACCOUNT.username) {
        return false; // Username already exists
      }

      const newUser = {
        id: `user_${Date.now()}`,
        username,
        password,
        role: 'user'
      };

      registeredUsers.push(newUser);
      localStorage.setItem('promptcraft_registered_users', JSON.stringify(registeredUsers));

      const loggedInUser: User = {
        id: newUser.id,
        username: newUser.username,
        role: 'user'
      };
      
      setUser(loggedInUser);
      localStorage.setItem('promptcraft_user', JSON.stringify(loggedInUser));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('promptcraft_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};