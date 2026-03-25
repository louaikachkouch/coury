import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Helper function to restore session from storage
  const restoreSession = useCallback(async (apiAvailable) => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // If there's no stored data, skip restoration
    if (!token || !storedUser) {
      return false;
    }

    // If API is available, validate the token is still valid
    if (apiAvailable) {
      try {
        const data = await authAPI.getMe();
        setUser(data.user);
        // Update stored user with latest data from server
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      } catch (error) {
        // Token is invalid/expired, clear storage
        console.log('Session token expired or invalid');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        return false;
      }
    } else {
      // API not available, restore from cached user data
      try {
        const cachedUser = JSON.parse(storedUser);
        setUser(cachedUser);
        return true;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        return false;
      }
    }
  }, []);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if API is available
        const apiAvailable = await healthCheck();
        setIsApiAvailable(apiAvailable);

        // Try to restore existing session
        await restoreSession(apiAvailable);
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear storage on critical errors
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [restoreSession]);

  const login = async (email, password, rememberMe = false) => {
    // Try API first
    if (isApiAvailable) {
      try {
        const data = await authAPI.login(email, password);
        
        // Store auth data in localStorage with timestamp
        const loginData = {
          token: data.token,
          user: data.user,
          loginTime: Date.now(),
          rememberMe: rememberMe
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('authData', JSON.stringify(loginData));
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          // Set a persistent session (30 days)
          localStorage.setItem('sessionExpiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('sessionExpiry');
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
          
          const demoToken = 'demo-token-' + Date.now();
          localStorage.setItem('token', demoToken);
          localStorage.setItem('user', JSON.stringify(userData));
          
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('sessionExpiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
          } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('sessionExpiry');
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
        // Auto-remember user on registration
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('sessionExpiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
        
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
          
          const demoToken = 'demo-token-' + Date.now();
          localStorage.setItem('token', demoToken);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('sessionExpiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
          
          setUser(userData);
          resolve(userData);
        } else {
          reject(new Error('Please fill in all fields correctly'));
        }
      }, 800);
    });
  };

  const logout = () => {
    // Clear all auth-related storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('authData');
    localStorage.removeItem('sessionExpiry');
    sessionStorage.clear();
    setUser(null);
  };

  const updateUser = async (updates) => {
    // Try API first
    if (isApiAvailable && localStorage.getItem('token')) {
      try {
        const data = await userAPI.updateProfile(updates);
        setUser(data.user);
        // Update stored user while preserving session data
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
