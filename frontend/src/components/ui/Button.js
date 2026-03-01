import React from 'react';

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm",
    ghost: "hover:bg-muted hover:text-foreground hover:shadow-sm",
    outline: "border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary",
    link: "text-muted-foreground hover:text-primary underline-offset-4",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/25",
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-9 w-9",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
