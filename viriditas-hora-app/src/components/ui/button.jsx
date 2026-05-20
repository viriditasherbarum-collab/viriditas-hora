import React from 'react';
export function Button({ className = '', children, ...props }) {
  return <button className={`vh-button ${className}`} {...props}>{children}</button>;
}
