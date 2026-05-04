import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../../types';

interface SwapHandModalProps {
  isOpen: boolean;
  players: Player[];
  onSelect: (targetId: string) => void;
}

const SwapHandModal: React.FC<SwapHandModalProps> = ({ isOpen, players, onSelect }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="w-full max-w-sm p-8 bg-slate-900/90 border border-jedi-blue/30 rounded-3xl shadow-[0_0_40px_rgba(0,247,255,0.1)] relative overflow-hidden"
          >
             {/* Scanning line effect */}
             <motion.div 
               animate={{ top: ['0%', '100%', '0%'] }} 
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               className="absolute left-0 right-0 h-0.5 bg-jedi-blue/20 pointer-events-none z-0" 
             />

             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-jedi-blue text-center mb-8 relative z-10">
               Sincronizar Transferência de Arsenal
             </h3>
             
             <div className="space-y-3 relative z-10">
                {players.filter(p => p.id !== 'player').map(p => (
                  <button 
                     key={p.id} 
                     onClick={() => onSelect(p.id)}
                     className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-jedi-blue/10 border border-white/10 hover:border-jedi-blue rounded-xl transition-all group"
                   >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={p.avatar} className="w-10 h-10 rounded-full border border-white/10 group-hover:border-jedi-blue" />
                        <div className="absolute inset-0 rounded-full bg-jedi-blue/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-black uppercase tracking-wider group-hover:text-jedi-blue">{p.name}</span>
                        <span className="text-[8px] font-bold text-white/40 uppercase">Assinatura de Energia Detectada</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-jedi-blue">{p.hand.length}</span>
                      <span className="text-[8px] font-bold opacity-30 uppercase">Cartas</span>
                    </div>
                  </button>
                ))}
             </div>

             <div className="mt-8 pt-6 border-t border-white/5 text-center">
               <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">
                 A troca é imediata e irreversível
               </p>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SwapHandModal;
