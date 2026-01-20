import React, { useEffect, useState } from 'react';
import { FloatingText as FloatingTextType } from '../types';

interface Props {
  items: FloatingTextType[];
  onComplete: (id: number) => void;
}

export const FloatingTextOverlay: React.FC<Props> = ({ items, onComplete }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {items.map((item) => (
        <TextItem key={item.id} item={item} onComplete={onComplete} />
      ))}
    </div>
  );
};

const TextItem: React.FC<{ item: FloatingTextType; onComplete: (id: number) => void }> = ({
  item,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(item.id);
    }, 1500); // Animation duration
    return () => clearTimeout(timer);
  }, [item.id, onComplete]);

  return (
    <div
      className="absolute text-2xl font-bold animate-float shadow-sm"
      style={{
        left: item.x,
        top: item.y,
        color: item.color || 'white',
        textShadow: '0px 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      {item.text}
    </div>
  );
};