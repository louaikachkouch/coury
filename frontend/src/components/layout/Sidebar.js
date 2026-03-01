import React, { useState, useRef, useCallback } from 'react';
import { BookOpen, Home, Calendar, Settings, Moon, Sun, ChevronRight, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const collapseTimeoutRef = useRef(null);
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleMouseEnter = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsExpanded(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 150);
  }, []);

  return (
    <aside 
      className={`flex-shrink-0 flex flex-col border-r border-border/50 bg-card z-20 hidden md:flex shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.3)] will-change-[width] ${
        isExpanded ? 'w-64' : 'w-[72px]'
      }`}
      style={{
        transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-border/50 overflow-hidden ${isExpanded ? 'px-4' : 'justify-center px-3'}`}
        style={{ transition: 'padding 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <NavLink to="/" className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Coury" 
            className={`transition-all duration-300 object-contain ${isExpanded ? 'h-12' : 'h-10'}`}
          />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex items-center rounded-xl group relative overflow-hidden py-2.5 ${
              isExpanded ? 'gap-3 px-3' : 'justify-center w-11 mx-auto px-0'
            } ${
              isActive(item.path)
                ? 'text-primary bg-primary/10 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            style={{ transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            title={!isExpanded ? item.label : undefined}
          >
            <item.icon
              className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'
              }`}
            />
            <span 
              className={`whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-2 w-0'
              }`}
            >
              {item.label}
            </span>
            {isActive(item.path) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Expand indicator */}
      <div 
        className={`flex justify-center py-2 ${isExpanded ? 'opacity-0 scale-75' : 'opacity-40 scale-100'}`}
        style={{
          transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <div 
          className={`flex gap-2 mb-2 ${
            isExpanded ? 'flex-row items-center' : 'flex-col items-center'
          }`}
          style={{
            transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <NavLink
            to="/settings"
            className={`flex items-center justify-center rounded-xl overflow-hidden ${
              isExpanded ? 'flex-1 gap-3 px-3 py-2.5' : 'w-11 h-11'
            } ${
              isActive('/settings')
                ? 'text-primary bg-primary/10 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            style={{ transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            title={!isExpanded ? 'Settings' : undefined}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span 
              className={`whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-2 w-0'
              }`}
            >
              Settings
            </span>
          </NavLink>
          <button
            onClick={toggleDarkMode}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <NavLink to="/settings" className="block mt-2">
          <div 
            className={`flex items-center rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer overflow-hidden ${
              isExpanded ? 'gap-3 px-2 py-2' : 'justify-center p-2'
            }`}
            style={{
              transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div 
              className="rounded-full bg-primary/20 flex items-center justify-center border border-background shadow-sm overflow-hidden flex-shrink-0 h-9 w-9"
            >
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
            <div 
              className={`flex flex-col transition-all duration-300 ${
                isExpanded ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-2 w-0'
              }`}
            >
              <span className="text-sm font-medium leading-none whitespace-nowrap">{user?.name || 'Guest'}</span>
              <span className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">{user?.major || 'Student'}</span>
            </div>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
