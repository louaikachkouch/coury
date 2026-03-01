import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => {
  const baseStyles = "bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm transition-all duration-200 ease-out";
  const hoverStyles = hover ? "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-border cursor-pointer" : "";
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
