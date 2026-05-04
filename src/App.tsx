import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, Skull, ShieldAlert } from 'lucide-react';
import { useUnoGame } from './hooks/useUnoGame';
import { canPlayCard } from './utils/gameLogic';
import { SELECTABLE_CHARACTERS, ALL_BOTS } from './data/characters';
import CardComponent from './components/Card';
import WildColorModal from './components/Modals/WildColorModal';
import SwapHandModal from './components/Modals/SwapHandModal';
import GameOverModal from './components/Modals/GameOverModal';
import './index.css';

const MERCY_LIMIT = 25;

import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import PlayerDashboard from './components/PlayerDashboard';

const App: React.FC = () => {
  const [botCount, setBotCount] = useState(3);
  const [selectedCharId, setSelectedCharId] = useState(SELECTABLE_CHARACTERS[0].id);

  const {
    gameState,
    startGame,
    drawCards,
    playCard,
    handleWildChoice,
    handleSwapChoice,
    showWildModal,
    showSwapModal,
    pendingCard
  } = useUnoGame(selectedCharId, botCount, SELECTABLE_CHARACTERS, ALL_BOTS);

  return (
    <div className="relative w-full h-screen flex justify-center items-center bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <div className="star-field" />
      
      <AnimatePresence mode="wait">
        {gameState.status === 'lobby' && (
          <Lobby 
            botCount={botCount}
            setBotCount={setBotCount}
            selectedCharId={selectedCharId}
            setSelectedCharId={setSelectedCharId}
            characters={SELECTABLE_CHARACTERS}
            bots={ALL_BOTS}
            onStart={startGame}
          />
        )}

        {gameState.status === 'playing' && (
          <div key="board" className="w-full h-full flex flex-col p-4 md:p-8 space-y-4">
            <GameBoard 
              gameState={gameState} 
              onDraw={() => drawCards(0, gameState.drawStack || 1)} 
            />
            
            <PlayerDashboard 
              gameState={gameState} 
              onPlayCard={playCard} 
              mercyLimit={MERCY_LIMIT}
            />
          </div>
        )}
      </AnimatePresence>

      <WildColorModal 
        isOpen={showWildModal} 
        onSelect={handleWildChoice} 
      />

      <SwapHandModal 
        isOpen={showSwapModal} 
        players={gameState.players} 
        onSelect={handleSwapChoice} 
      />

      <GameOverModal 
        status={gameState.status} 
        winner={gameState.winner} 
        onRestart={startGame} 
      />
    </div>
  );
};

export default App;
