
import React, { useEffect, useState, useRef } from 'react';

interface Props {
  value: number;
  className?: string;
}

export const AnimatedNumber: React.FC<Props> = ({ value, className }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const currentValueRef = useRef(value);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      const diff = value - currentValueRef.current;
      
      // Se a diferença for muito pequena, arredonda para o valor final para economizar processamento
      if (Math.abs(diff) < 0.5) {
        currentValueRef.current = value;
        setDisplayValue(value);
        return;
      }

      // Fator de suavização (0.1 = lento/muito suave, 0.3 = rápido/responsivo)
      // Usamos 0.2 para um bom equilíbrio em clickers
      const ease = 0.2;
      currentValueRef.current += diff * ease;
      
      setDisplayValue(currentValueRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [value]);

  return (
    <span className={className}>
      {Math.floor(displayValue).toLocaleString()}
    </span>
  );
};
