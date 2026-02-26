import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-card text-card-foreground rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
