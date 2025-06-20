import React from 'react';
import './action-button.css';

export const ActionButton = ({ text, onClick, style, className = '' }) => {
  return (
    <button
      className={`action-btn ${className}`}
      style={style}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick(true);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        onClick(false);
      }}
      onPointerLeave={(e) => { // a bit of a hack, but works for now
        e.stopPropagation();
        onClick(false);
      }}
    >
      {text}
    </button>
  );
}; 