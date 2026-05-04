import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardI } from '../types';

interface CardProps {
  card: CardI;
  onClick?: () => void;
  disabled?: boolean;
  isUnplayable?: boolean;
  layoutId?: string;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled, isUnplayable, layoutId }) => {
  const getContent = () => {
    switch (card.type) {
      case 'number': return card.value;
      case 'skip': return 'SKIP';
      case 'reverse': return 'REV';
      case 'draw2': return '+2';
      case 'draw4': return '+4';
      case 'draw6': return '+6';
      case 'draw10': return '+10';
      case 'wild': return 'W';
      case 'wildDraw6': return '+6';
      case 'wildDraw10': return '+10';
      case 'wildReverseDraw4': return 'REV+4';
      case 'wildRoulette': return 'WHEEL';
      case 'discardAll': return 'CLEAR';
      case 'skipEveryone': return 'ALL-S';
      case 'swapHand': return '7';
      case 'rotateHands': return '0';
      default: return '';
    }
  };

  const colorClass = card.color === 'red' ? 'bg-sith-red shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-sith-red' : 
                     card.color === 'blue' ? 'bg-jedi-blue shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-jedi-blue' : 
                     card.color === 'green' ? 'bg-yoda-green shadow-[inset_0_0_20_rgba(0,0,0,0.5)] border-yoda-green' : 
                     card.color === 'yellow' ? 'bg-starwars-yellow shadow-[inset_0_0_20_rgba(0,0,0,0.5)] border-starwars-yellow' : 
                     'bg-slate-900 border-white/20';

  const glowColor = card.color === 'red' ? 'rgba(255,0,0,0.4)' : 
                     card.color === 'blue' ? 'rgba(0,247,255,0.4)' : 
                     card.color === 'green' ? 'rgba(57,255,20,0.4)' : 
                     card.color === 'yellow' ? 'rgba(255,232,31,0.4)' : 
                     'rgba(255,255,255,0.1)';

  return (
    <motion.div
      layoutId={layoutId}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={!disabled ? { y: -20, scale: 1.05, zIndex: 50 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`relative w-28 h-40 rounded-lg p-1.5 border game-card ${colorClass} ${disabled ? 'grayscale brightness-50 opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-[0_0_25px_var(--glow)]'} ${isUnplayable ? 'brightness-50' : ''}`}
      style={{ '--glow': glowColor } as any}
    >
      <div className="w-full h-full border border-white/20 rounded-md flex items-center justify-center relative overflow-hidden bg-black/20">
        <span className="text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{getContent()}</span>
        <div className="absolute top-1 left-1.5 text-[8px] font-black opacity-80">{getContent()}</div>
        <div className="absolute bottom-1 right-1.5 text-[8px] font-black opacity-80">{getContent()}</div>
      </div>
    </motion.div>
  );
};

export default React.memo(Card);
