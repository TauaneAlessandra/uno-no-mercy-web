import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { GameState } from '../types';
import CardComponent from './Card';

interface GameBoardProps {
  gameState: GameState;
  onDraw: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onDraw }) => {
  const currentColorStyle = {
    backgroundColor: `var(--color-${
      gameState.currentColor === 'red' ? 'sith-red' : 
      gameState.currentColor === 'blue' ? 'jedi-blue' : 
      gameState.currentColor === 'green' ? 'yoda-green' : 
      'starwars-yellow'
    })`
  };

  const currentColorName = gameState.currentColor === 'red' ? 'Sith Red' : 
                           gameState.currentColor === 'blue' ? 'Jedi Blue' : 
                           gameState.currentColor === 'green' ? 'Yoda Green' : 
                           'Star Yellow';

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Top Bar - Bots */}
      <header className="flex justify-center gap-4 py-2">
        {gameState.players.filter(p => p.isBot).map((bot) => {
          const index = gameState.players.indexOf(bot);
          const isActive = gameState.currentPlayerIndex === index;
          return (
            <motion.div 
              key={bot.id} 
              animate={{ scale: isActive ? 1.05 : 1 }}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${isActive ? 'bg-jedi-blue/20 border-jedi-blue active-player-glow' : 'bg-slate-900/50 border-white/10 opacity-60'}`}
            >
              <div className="relative">
                <img src={bot.avatar} className={`w-10 h-10 rounded-full border-2 ${isActive ? 'border-jedi-blue' : 'border-white/20'}`} />
                <div className="absolute -bottom-2 -right-2 bg-sith-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-slate-950">
                  {bot.hand.length}
                </div>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider">{bot.name}</span>
                <span className="text-[8px] font-bold text-white/40 uppercase">{isActive ? 'Jogando...' : 'Aguardando'}</span>
              </div>
            </motion.div>
          );
        })}
      </header>

      {/* Middle Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center space-y-8">
        {/* Turn Status Floating */}
        <div className="absolute top-0 left-0 flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
             <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-sm" style={currentColorStyle}>
                {gameState.currentColor[0].toUpperCase()}
             </div>
             <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Cor Atual</span>
               <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: currentColorStyle.backgroundColor }}>
                 {currentColorName}
               </span>
             </div>
          </div>

          {gameState.drawStack > 0 && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-sith-red border border-sith-red/50 rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.3)]"
            >
              <ShieldAlert size={16} className="text-white" />
              <span className="text-xs font-black text-white uppercase">Acumulado +{gameState.drawStack}</span>
            </motion.div>
          )}
        </div>

        {/* Center Play Area */}
        <div className="flex items-center gap-12 md:gap-24">
          <div className="relative group">
            <button 
              onClick={onDraw}
              disabled={gameState.currentPlayerIndex !== 0}
              className={`relative w-28 h-40 md:w-32 md:h-48 rounded-xl border-2 border-white/20 bg-slate-900 transition-all flex flex-col items-center justify-center shadow-2xl ${gameState.currentPlayerIndex === 0 ? 'hover:border-starwars-yellow hover:scale-105 cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'}`}
            >
              <div className="text-white/10 font-black text-3xl tracking-tighter mb-2">UNO</div>
              <div className="w-12 h-1 bg-white/5 rounded-full" />
            </button>
            {gameState.currentPlayerIndex === 0 && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-starwars-yellow text-black text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap animate-bounce shadow-lg">
                COMPRAR
              </div>
            )}
          </div>

          <div className="relative">
            <div className={`direction-arrow ${gameState.direction === -1 ? 'reverse' : ''}`} />
            <div className={`direction-arrow p-4 opacity-30 ${gameState.direction === -1 ? 'reverse' : ''}`} style={{ animationDuration: '15s' }} />
            
            <div className="relative z-10 w-28 h-40 md:w-32 md:h-48 flex items-center justify-center">
              <AnimatePresence mode="popLayout">
                <CardComponent 
                  key={gameState.discardPile[gameState.discardPile.length - 1].id} 
                  card={gameState.discardPile[gameState.discardPile.length - 1]} 
                  layoutId={gameState.discardPile[gameState.discardPile.length - 1].id}
                />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GameBoard;
