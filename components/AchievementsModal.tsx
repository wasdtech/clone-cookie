import React from 'react';
import { ACHIEVEMENTS } from '../constants';
import { GameState } from '../types';
import { X, Trophy, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
}

export const AchievementsModal: React.FC<Props> = ({ isOpen, onClose, gameState }) => {
  if (!isOpen) return null;

  const unlockedCount = gameState.achievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const percentage = Math.floor((unlockedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 border-2 border-amber-600 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center rounded-t-lg">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-500/20 rounded-full">
                <Trophy className="text-amber-500" size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white">Conquistas</h2>
                <div className="text-xs text-gray-400">Progresso: {unlockedCount}/{totalCount} ({percentage}%)</div>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="text-gray-400 hover:text-white" size={24} />
           </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-800 scrollbar-thin scrollbar-thumb-gray-600">
            {ACHIEVEMENTS.map(ach => {
                const isUnlocked = gameState.achievements.includes(ach.id);
                return (
                    <div 
                        key={ach.id}
                        className={`
                            flex items-center p-3 rounded border 
                            ${isUnlocked 
                                ? 'bg-gray-700/50 border-amber-500/30' 
                                : 'bg-gray-900/50 border-gray-700 opacity-60'}
                        `}
                    >
                        <div className={`
                            w-12 h-12 rounded-lg flex items-center justify-center mr-3 shrink-0
                            ${isUnlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-600'}
                        `}>
                            {isUnlocked ? <ach.icon size={24} /> : <Lock size={20} />}
                        </div>
                        <div>
                            <div className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                                {ach.name}
                            </div>
                            <div className="text-xs text-gray-400 leading-tight">
                                {isUnlocked ? ach.description : '???'}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};