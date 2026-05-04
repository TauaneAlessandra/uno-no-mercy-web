import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Color } from '../../types';
import { COLORS } from '../../utils/gameLogic';

interface WildColorModalProps {
  isOpen: boolean;
  onSelect: (color: Color) => void;
}

const WildColorModal: React.FC<WildColorModalProps> = ({ isOpen, onSelect }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="w-full max-w-xs p-8 bg-slate-900/90 border border-jedi-blue/30 rounded-3xl shadow-[0_0_50px_rgba(0,247,255,0.15)] text-center relative overflow-hidden"
          >
            {/* Hologram lines effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,247,255,0.05)_1px,transparent_1px)] bg-[size:100%_4px]" />
            
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-jedi-blue mb-8 relative z-10">
              Harmonizar Frequência da Força
            </h3>
            
            <div className="grid grid-cols-2 gap-6 relative z-10">
              {COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => onSelect(c)}
                  className="group relative aspect-square rounded-2xl border-2 border-white/5 transition-all hover:scale-110 active:scale-95 shadow-lg overflow-hidden"
                  style={{ backgroundColor: `var(--color-${c === 'red' ? 'sith-red' : c === 'blue' ? 'jedi-blue' : c === 'green' ? 'yoda-green' : 'starwars-yellow'})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1/2 h-1/2 rounded-full border-2 border-white/20 scale-150 opacity-10 group-hover:scale-100 group-hover:opacity-30 transition-all duration-500" />
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-8 text-[8px] font-bold text-white/30 uppercase tracking-widest">
              A cor selecionada definirá o rumo da galáxia
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WildColorModal;
