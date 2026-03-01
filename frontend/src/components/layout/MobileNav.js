import React from 'react';
import { BookOpen, Home, Calendar, Settings, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MobileHeader = () => {
  const { user } = useAuth();
  
  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border/50 bg-card md:hidden">
      <NavLink to="/" className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
          <BookOpen className="h-4 w-4" />
        </div>
        <span className="font-heading font-bold text-foreground tracking-tight">
          Coury
        </span>
      </NavLink>
      <NavLink to="/settings">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name || 'User'} 
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-primary" />
          )}
        </div>
      </NavLink>
    </header>
  );
};

const MobileNav = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: Calendar, label: 'Calendar', path: '/schedule' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border/50 flex items-center justify-around px-2 md:hidden z-20">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive(item.path)
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-xs font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export { MobileHeader, MobileNav };
