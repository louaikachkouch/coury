import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Demo users for testing
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

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken');
    
    if (storedUser && authToken) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check against demo users
        const demoUser = DEMO_USERS.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        
        if (demoUser) {
          const { password: _, ...userData } = demoUser;
          
          // Store auth data
          localStorage.setItem('authToken', 'demo-token-' + Date.now());
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
    // Simulate API call - replace with actual API integration
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length >= 8 && fullName) {
          const userData = {
            id: '1',
            email,
            name: fullName,
            avatar: `https://i.pravatar.cc/150?u=${email}`,
          };
          
          // Store auth data
          localStorage.setItem('authToken', 'demo-token-' + Date.now());
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          resolve(userData);
        } else {
          reject(new Error('Please fill in all fields correctly'));
        }
      }, 800); // Simulate network delay
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    sessionStorage.clear();
    setUser(null);
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
