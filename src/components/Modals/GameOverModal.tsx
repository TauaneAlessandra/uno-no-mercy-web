import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Player } from '../../types';

interface GameOverModalProps {
  status: string;
  winner?: Player;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ status, winner, onRestart }) => {
  return (
    <AnimatePresence>
      {status === 'gameOver' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-sm p-10 bg-slate-900 border border-starwars-yellow/30 rounded-[2rem] text-center shadow-[0_0_100px_rgba(255,232,31,0.15)] relative overflow-hidden"
          >
            {/* Celebration background effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-starwars-yellow/5 to-transparent" />
            
            <Trophy size={80} className="mx-auto mb-8 text-starwars-yellow animate-bounce" />
            
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 text-white">Vitória!</h2>
            <p className="text-starwars-yellow font-bold text-lg mb-8 tracking-widest uppercase">{winner?.name}</p>
            
            <div className="flex flex-col items-center gap-4 mb-10">
              <img src={winner?.avatar} className="w-24 h-24 rounded-full border-4 border-starwars-yellow shadow-[0_0_30px_rgba(255,232,31,0.4)]" />
              <p className="text-slate-400 text-xs font-medium max-w-[200px]">A paz (ou o caos) foi restaurada na galáxia através da sua maestria nas cartas.</p>
            </div>

            <button 
              onClick={onRestart} 
              className="w-full py-5 bg-starwars-yellow text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,232,31,0.3)]"
            >
              Nova Batalha
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GameOverModal;
