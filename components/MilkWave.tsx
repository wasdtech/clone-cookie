
import React from 'react';
import { GameState } from '../types';
import { ACHIEVEMENTS } from '../constants';

interface Props {
  gameState: GameState;
}

export const MilkWave: React.FC<Props> = ({ gameState }) => {
  const totalAchievements = ACHIEVEMENTS.length;
  const unlocked = gameState.achievements.length;
  
  // Altura baseada nas conquistas (máximo 45% da tela)
  const progress = Math.min(unlocked / totalAchievements, 1);
  const milkHeightPercentage = progress * 45;

  if (milkHeightPercentage < 2) return null;

  // SVG de onda suave e contínua para permitir repetição perfeita
  const waveSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.25' fill='%23FFFFFF'/%3E%3Cpath d='M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z' opacity='.5' fill='%23FFFFFF'/%3E%3Cpath d='M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z' fill='%23FFFFFF'/%3E%3C/svg%3E";

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none transition-all duration-[2000ms] ease-out" 
      style={{ height: `${milkHeightPercentage}%` }}
    >
        <style>{`
          @keyframes wave-flow {
            0% { background-position-x: 0px; }
            100% { background-position-x: 1200px; }
          }
          @keyframes wave-swell {
            0%, 100% { transform: scaleY(-1) translateY(0px); }
            50% { transform: scaleY(-1) translateY(15px); }
          }
          .milk-layer {
            position: absolute;
            left: 0;
            width: 200%;
            height: 100%;
            background-repeat: repeat-x;
            background-position: bottom;
            background-size: 1200px 100%; /* Largura fixa para loop perfeito */
            /* ScaleY(-1) inverte o SVG para que a parte plana fique embaixo e as ondas em cima */
            /* A animação wave-swell aplica o scaleY(-1) novamente em cada frame para manter */
          }
        `}</style>

       {/* Fundo Sólido (Cor do leite) - Ajustado para ficar abaixo das ondas invertidas */}
       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] translate-y-4"></div>

       {/* Camada 3 (Fundo - Mais lenta, mais escura) */}
       <div 
         className="milk-layer opacity-20"
         style={{ 
             backgroundImage: `url("${waveSvg}")`,
             animation: 'wave-flow 25s linear infinite, wave-swell 7s ease-in-out infinite alternate',
             bottom: '10px', // Ajuste de posição
             filter: 'brightness(0.7)'
         }}
       />

       {/* Camada 2 (Meio - Velocidade média) */}
       <div 
         className="milk-layer opacity-40"
         style={{ 
             backgroundImage: `url("${waveSvg}")`,
             animation: 'wave-flow 15s linear infinite reverse, wave-swell 5s ease-in-out infinite alternate-reverse',
             bottom: '5px',
             backgroundPositionX: '200px',
             filter: 'brightness(0.9)'
         }}
       />

       {/* Camada 1 (Frente - Mais rápida, branca pura) */}
       <div 
         className="milk-layer opacity-90"
         style={{ 
             backgroundImage: `url("${waveSvg}")`,
             animation: 'wave-flow 10s linear infinite, wave-swell 3s ease-in-out infinite alternate',
             bottom: '0px',
             backgroundPositionX: '0px',
         }}
       />
       
       {/* Preenchimento Sólido Branco para cobrir o fundo da tela até a borda */}
       <div className="absolute top-full left-0 right-0 h-[100vh] bg-white/90 -z-10 blur-sm"></div>
    </div>
  );
};
