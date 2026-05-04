import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { GameState, Card as CardI } from '../types';
import CardComponent from './Card';
import { canPlayCard } from '../utils/gameLogic';

interface PlayerDashboardProps {
  gameState: GameState;
  onPlayCard: (card: CardI) => void;
  mercyLimit: number;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ gameState, onPlayCard, mercyLimit }) => {
  const player = gameState.players[0];
  const isPlayerTurn = gameState.currentPlayerIndex === 0;

  return (
    <footer className="hologram-panel p-4 md:p-6 !bg-slate-900/40">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src={player.avatar} className={`w-12 h-12 rounded-full border-2 ${isPlayerTurn ? 'border-jedi-blue shadow-[0_0_15px_rgba(0,247,255,0.4)]' : 'border-white/20'}`} />
            <div className="absolute -bottom-1 -right-1 bg-jedi-blue text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-950">
              VOCÊ
            </div>
          </div>
          <div className="space-y-1">
             <h3 className="text-[10px] font-black tracking-[0.2em] text-jedi-blue uppercase">Misericórdia Meter</h3>
             <div className="flex items-center gap-3">
                <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    animate={{ 
                      width: `${(player.hand.length / mercyLimit) * 100}%`,
                      backgroundColor: player.hand.length > 20 ? '#ff0000' : player.hand.length > 15 ? '#FFE81F' : '#00f7ff'
                    }}
                    className="h-full"
                  />
                </div>
                <span className="text-xs font-black font-mono">{player.hand.length}/{mercyLimit}</span>
             </div>
          </div>
        </div>

        {isPlayerTurn && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 px-6 py-2 bg-jedi-blue text-slate-950 rounded-xl shadow-[0_0_25px_rgba(0,247,255,0.3)]"
          >
            <RefreshCw size={18} className="animate-spin-slow" />
            <span className="text-xs font-black uppercase tracking-widest">Sua Vez de Atacar</span>
          </motion.div>
        )}
      </div>

      <div className="flex justify-center gap-1 h-44 overflow-x-auto overflow-y-hidden pb-4 px-12 scrollbar-hide">
        {player.hand.map((card, idx) => {
          const isPlayable = canPlayCard(card, gameState.discardPile[gameState.discardPile.length - 1], gameState.currentColor, gameState.drawStack);
          return (
            <motion.div 
              key={card.id} 
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ 
                marginLeft: idx === 0 ? 0 : -50,
                zIndex: 10 + idx 
              }}
              className="relative group"
            >
              <CardComponent 
                card={card} 
                layoutId={card.id}
                onClick={() => onPlayCard(card)}
                disabled={!isPlayerTurn || !isPlayable}
                isUnplayable={isPlayerTurn && !isPlayable}
              />
            </motion.div>
          );
        })}
      </div>
    </footer>
  );
};

export default PlayerDashboard;
