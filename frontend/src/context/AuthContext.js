import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI, healthCheck } from '../services/api';

const AuthContext = createContext();

// Demo users for fallback when API is unavailable
const DEMO_USERS = [
  {
    id: '1',
    email: 'demo@coury.com',
    password: 'demo123',
    name: 'Alex Rivera',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    major: 'Computer Science',
    year: 'Junior Year',
  },
  {
    id: '2',
    email: 'student@coury.com',
    password: 'student123',
    name: 'Jordan Smith',
    avatar: 'https://i.pravatar.cc/150?u=student',
    major: 'Data Science',
    year: 'Senior Year',
  },
  {
    id: '3',
    email: 'test@test.com',
    password: 'test123',
    name: 'Test User',
    avatar: 'https://i.pravatar.cc/150?u=test',
    major: 'Engineering',
    year: 'Sophomore Year',
  },
];

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check if API is available
      const apiAvailable = await healthCheck();
      setIsApiAvailable(apiAvailable);

      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && apiAvailable) {
        try {
          const data = await authAPI.getMe();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else if (storedUser) {
        // Fallback to stored user for demo mode
        setUser(JSON.parse(storedUser));
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    // Try API first
    if (isApiAvailable) {
      try {
        const data = await authAPI.login(email, password);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        setUser(data.user);
        return data.user;
      } catch (error) {
        throw error;
      }
    }
    
    // Fallback to demo users
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const demoUser = DEMO_USERS.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        
        if (demoUser) {
          const { password: _, ...userData } = demoUser;
          
          localStorage.setItem('token', 'demo-token-' + Date.now());
          localStorage.setItem('user', JSON.stringify(userData));
          
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
          
          setUser(userData);
          resolve(userData);
        } else {
          reject(new Error('Invalid email or password. Try: demo@coury.com / demo123'));
        }
      }, 800);
    });
  };

  const register = async (fullName, email, password) => {
    // Try API first
    if (isApiAvailable) {
      try {
        const data = await authAPI.register(fullName, email, password);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setUser(data.user);
        return data.user;
      } catch (error) {
        throw error;
      }
    }
    
    // Fallback to demo mode
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length >= 8 && fullName) {
          const userData = {
            id: 'demo-' + Date.now(),
            email,
            name: fullName,
            avatar: `https://i.pravatar.cc/150?u=${email}`,
          };
          
          localStorage.setItem('token', 'demo-token-' + Date.now());
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          resolve(userData);
        } else {
          reject(new Error('Please fill in all fields correctly'));
        }
      }, 800);
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    sessionStorage.clear();
    setUser(null);
  };

  const updateUser = async (updates) => {
    // Try API first
    if (isApiAvailable && localStorage.getItem('token')) {
      try {
        const data = await userAPI.updateProfile(updates);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      } catch (error) {
        throw error;
      }
    }
    
    // Fallback to local storage
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      login, 
      register, 
      logout,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
