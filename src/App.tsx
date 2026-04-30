import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardI, Player, GameState, Color } from './types';
import { createDeck, canPlayCard, shuffle, COLORS } from './utils/gameLogic';
import { Trophy, RefreshCw, Zap, Skull } from 'lucide-react';
import confetti from 'canvas-confetti';
import './App.css';

const MERCY_LIMIT = 25;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    players: [],
    currentPlayerIndex: 0,
    direction: 1,
    status: 'lobby',
    drawStack: 0,
    currentColor: 'red',
    mercyLimit: MERCY_LIMIT
  });

  const [showWildModal, setShowWildModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'swap' | 'none'>('none');
  const [pendingCard, setPendingCard] = useState<CardI | null>(null);

  const startGame = useCallback(() => {
    const fullDeck = createDeck();
    const players: Player[] = [
      { id: 'player', name: 'Você', hand: [], isBot: false, score: 0 },
      { id: 'bot1', name: 'Robo Alpha', hand: [], isBot: true, score: 0 },
      { id: 'bot2', name: 'Robo Beta', hand: [], isBot: true, score: 0 },
      { id: 'bot3', name: 'Robo Gamma', hand: [], isBot: true, score: 0 },
    ];

    for (let i = 0; i < 7; i++) {
      players.forEach(p => p.hand.push(fullDeck.pop()!));
    }

    let firstCard = fullDeck.pop()!;
    while (firstCard.color === 'black') {
      fullDeck.unshift(firstCard);
      shuffle(fullDeck);
      firstCard = fullDeck.pop()!;
    }

    setGameState({
      deck: fullDeck,
      discardPile: [firstCard],
      players,
      currentPlayerIndex: 0,
      direction: 1,
      status: 'playing',
      drawStack: 0,
      currentColor: firstCard.color,
      mercyLimit: MERCY_LIMIT
    });
  }, []);

  const nextTurn = useCallback((skipCount = 1) => {
    setGameState(prev => {
      let nextIndex = (prev.currentPlayerIndex + prev.direction * skipCount) % prev.players.length;
      if (nextIndex < 0) nextIndex = prev.players.length + nextIndex;
      return { ...prev, currentPlayerIndex: nextIndex };
    });
  }, []);

  const drawCards = (playerIndex: number, count: number, forceUntilPlayable: boolean = false) => {
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const newDeck = [...prev.deck];
      const discardPile = [...prev.discardPile];
      const drawnCards: CardI[] = [];
      const p = newPlayers[playerIndex];
      const topCard = discardPile[discardPile.length - 1];

      const pull = () => {
        let deckRef = newDeck;
        let discardRef = discardPile;
        if (deckRef.length === 0) {
          const top = discardRef.pop()!;
          deckRef.push(...shuffle(discardRef));
          discardRef.length = 0;
          discardRef.push(top);
        }
        return deckRef.pop();
      };

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const c = pull();
          if (c) drawnCards.push(c);
        }
      } else if (forceUntilPlayable) {
        let playable = false;
        while (!playable) {
          const c = pull();
          if (!c) break;
          drawnCards.push(c);
          if (canPlayCard(c, topCard, prev.currentColor, 0)) playable = true;
        }
      }

      p.hand.push(...drawnCards);
      
      if (p.hand.length >= MERCY_LIMIT) {
        const winnerIndex = (playerIndex + 1) % newPlayers.length;
        return { ...prev, status: 'gameOver', winner: newPlayers[winnerIndex], players: newPlayers, deck: newDeck, discardPile, drawStack: 0 };
      }

      return { ...prev, players: newPlayers, deck: newDeck, discardPile, drawStack: 0 };
    });

    nextTurn();
  };

  const handleWildChoice = (color: Color, botCard?: CardI) => {
    const card = botCard || pendingCard;
    if (!card) return;
    
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const pIndex = prev.currentPlayerIndex;
      const currentPlayer = newPlayers[pIndex];
      currentPlayer.hand = currentPlayer.hand.filter(c => c.id !== card.id);
      
      let nextDrawStack = prev.drawStack;
      let nextDir = prev.direction;

      if (card.type === 'wildDraw6') nextDrawStack += 6;
      if (card.type === 'wildDraw10') nextDrawStack += 10;
      
      if (card.type === 'wildReverseDraw4') {
         nextDir = (nextDir === 1 ? -1 : 1);
         nextDrawStack += 4;
      }

      // Simplified Roulette: Next player draws until color is found
      if (card.type === 'wildRoulette') {
         // The next player will be handled by a special logic or just draw a lot
         nextDrawStack += 5; // Placeholder for Roulette penalty
      }

      if (currentPlayer.hand.length === 0) {
        confetti();
        return { ...prev, status: 'gameOver', winner: currentPlayer };
      }

      return {
        ...prev,
        players: newPlayers,
        discardPile: [...prev.discardPile, card],
        currentColor: color,
        drawStack: nextDrawStack,
        direction: nextDir,
      };
    });

    setShowWildModal(false);
    setPendingCard(null);
    
    const skipCount = card.type === 'skipEveryone' ? gameState.players.length : 1;
    nextTurn(skipCount);
  };

  const handleSwapChoice = (targetId: string) => {
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const pIndex = prev.currentPlayerIndex;
      const tIndex = newPlayers.findIndex(p => p.id === targetId);
      
      const tempHand = newPlayers[pIndex].hand;
      newPlayers[pIndex].hand = newPlayers[tIndex].hand;
      newPlayers[tIndex].hand = tempHand;

      return { ...prev, players: newPlayers };
    });
    setShowSwapModal(false);
    nextTurn();
  };

  const playCard = (card: CardI) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    // if (currentPlayer.isBot && gameState.status === 'playing') return; // REMOVED THIS BLOCK


    if (!canPlayCard(card, gameState.discardPile[gameState.discardPile.length - 1], gameState.currentColor, gameState.drawStack)) {
      return;
    }

    if (card.color === 'black') {
      setPendingCard(card);
      setShowWildModal(true);
      return;
    }

    setGameState(prev => {
      const newPlayers = [...prev.players];
      const pIndex = prev.currentPlayerIndex;
      const p = newPlayers[pIndex];
      
      if (card.type === 'discardAll') {
        p.hand = p.hand.filter(c => c.color !== card.color && c.id !== card.id);
      } else {
        p.hand = p.hand.filter(c => c.id !== card.id);
      }

      let nextDir: 1 | -1 = prev.direction;
      let nextDrawStack = prev.drawStack;

      if (card.type === 'reverse') nextDir = nextDir === 1 ? -1 : 1;
      if (card.type === 'draw2') nextDrawStack += 2;
      if (card.type === 'draw4') nextDrawStack += 4;
      if (card.type === 'draw6') nextDrawStack += 6;
      if (card.type === 'draw10') nextDrawStack += 10;

      if (card.type === 'rotateHands') {
        const hands = newPlayers.map(pl => pl.hand);
        if (nextDir === 1) {
          const lastHand = hands.pop()!;
          hands.unshift(lastHand);
        } else {
          const firstHand = hands.shift()!;
          hands.push(firstHand);
        }
        newPlayers.forEach((pl, i) => pl.hand = hands[i]);
      }

      if (card.type === 'swapHand') {
        if (!p.isBot) {
           setPendingCard(card);
           setShowSwapModal(true);
        } else {
           const tIndex = 0; // Bot swaps with human
           const temp = newPlayers[pIndex].hand;
           newPlayers[pIndex].hand = newPlayers[tIndex].hand;
           newPlayers[tIndex].hand = temp;
        }
      }
      
      if (p.hand.length === 0) {
        confetti();
        return { ...prev, status: 'gameOver', winner: p };
      }

      return {
        ...prev,
        players: newPlayers,
        discardPile: [...prev.discardPile, card],
        currentColor: card.color,
        direction: nextDir,
        drawStack: nextDrawStack,
      };
    });

    if (card.type === 'swapHand' && !currentPlayer.isBot) return;

    const skipCount = card.type === 'skip' ? 2 : (card.type === 'skipEveryone' ? gameState.players.length : 1);
    nextTurn(skipCount);
  };

  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (gameState.status === 'playing' && currentPlayer?.isBot) {
      const timer = setTimeout(() => {
        const bot = gameState.players[gameState.currentPlayerIndex];
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const playableCard = bot.hand.find(c => canPlayCard(c, topCard, gameState.currentColor, gameState.drawStack));

        if (playableCard) {
          if (playableCard.color === 'black') {
             const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
             handleWildChoice(randomColor, playableCard);
          } else {
             playCard(playableCard);
          }
        } else {
          drawCards(gameState.currentPlayerIndex, gameState.drawStack, true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayerIndex, gameState.status, gameState.drawStack, gameState.currentColor, gameState.discardPile]);

  return (
    <div className="game-container">
      {gameState.status === 'lobby' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lobby-screen">
          <h1 className="title">UNO <span className="no-mercy">NO MERCY</span></h1>
          <p className="subtitle">Prepare-se para a versão mais implacável do clássico.</p>
          <div className="features">
            <div className="feature"><Zap size={20} /> Stacking Infinito</div>
            <div className="feature"><Skull size={20} /> Mercy Rule (25 cartas)</div>
            <div className="feature"><RefreshCw size={20} /> Cartas +6 e +10</div>
          </div>
          <button className="start-btn" onClick={startGame}>JOGAR AGORA</button>
        </motion.div>
      )}

      {gameState.status === 'playing' && (
        <div className="board">
          <div className="top-bar">
            <div className="current-color" style={{ backgroundColor: `var(--uno-${gameState.currentColor})` }}>
              {gameState.currentColor.toUpperCase()}
            </div>
            {gameState.drawStack > 0 && (
              <div className="draw-stack-alert">
                ACUMULADO: +{gameState.drawStack}
              </div>
            )}
          </div>

          <div className="opponents">
            {gameState.players.filter(p => p.isBot).map((bot) => (
              <div key={bot.id} className={`opponent ${gameState.currentPlayerIndex === gameState.players.indexOf(bot) ? 'active' : ''}`}>
                <div className="avatar">{bot.name[0]}</div>
                <div className="info">
                  <div className="name">{bot.name}</div>
                  <div className="cards-count">{bot.hand.length} cartas</div>
                </div>
              </div>
            ))}
          </div>

          <div className="center-pile">
            <div 
              className={`deck-pile ${gameState.drawStack > 0 && gameState.currentPlayerIndex === 0 ? 'must-draw' : ''}`} 
              onClick={() => gameState.currentPlayerIndex === 0 && drawCards(0, gameState.drawStack || 1)}
            >
              <div className="card-back">UNO</div>
            </div>
            <div className="discard-pile">
              <AnimatePresence mode="popLayout">
                <CardComponent 
                  key={gameState.discardPile[gameState.discardPile.length - 1].id} 
                  card={gameState.discardPile[gameState.discardPile.length - 1]} 
                />
              </AnimatePresence>
            </div>
          </div>

          <div className="player-area">
             <div className="player-info">
                <h3>Sua Mão ({gameState.players[0].hand.length}/{MERCY_LIMIT})</h3>
                {gameState.currentPlayerIndex === 0 && <span className="turn-indicator">SUA VEZ!</span>}
             </div>
             <div className="hand-container">
                {gameState.players[0].hand.map((card) => {
                  const isPlayable = canPlayCard(
                    card, 
                    gameState.discardPile[gameState.discardPile.length - 1], 
                    gameState.currentColor, 
                    gameState.drawStack
                  );
                  return (
                    <CardComponent 
                      key={card.id} 
                      card={card} 
                      onClick={() => playCard(card)}
                      disabled={gameState.currentPlayerIndex !== 0 || !isPlayable}
                      isUnplayable={gameState.currentPlayerIndex === 0 && !isPlayable}
                    />
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {gameState.status === 'gameOver' && (
        <motion.div className="game-over" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Trophy size={80} color="var(--accent)" />
          <h2>{gameState.winner?.name} Venceu!</h2>
          <button className="start-btn" onClick={startGame}>RECOMEÇAR</button>
        </motion.div>
      )}

      {showWildModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Escolha uma cor</h3>
            <div className="color-grid">
              {COLORS.map(c => (
                <div key={c} className="color-option" style={{ backgroundColor: `var(--uno-${c})` }} onClick={() => handleWildChoice(c)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {showSwapModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Escolha com quem trocar de mão</h3>
            <div className="player-selection">
               {gameState.players.filter(p => p.id !== 'player').map(p => (
                 <button key={p.id} className="player-btn" onClick={() => handleSwapChoice(p.id)}>
                   {p.name} ({p.hand.length} cartas)
                 </button>
               ))}
            </div>
          </div>
        </div>
      )}

      {showSwapModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Escolha com quem trocar de mão</h3>
            <div className="player-selection">
               {gameState.players.filter(p => p.id !== 'player').map(p => (
                 <button key={p.id} className="player-btn" onClick={() => handleSwapChoice(p.id)}>
                   {p.name} ({p.hand.length} cartas)
                 </button>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CardComponent: React.FC<{ card: CardI, onClick?: () => void, disabled?: boolean, isUnplayable?: boolean }> = ({ card, onClick, disabled, isUnplayable }) => {
  const getCardContent = () => {
    switch (card.type) {
      case 'number': return card.value;
      case 'skip': return '∅';
      case 'reverse': return '⇄';
      case 'draw2': return '+2';
      case 'draw4': return '+4';
      case 'draw6': return '+6';
      case 'draw10': return '+10';
      case 'wild': return 'W';
      case 'wildDraw6': return '+6';
      case 'wildDraw10': return '+10';
      case 'wildReverseDraw4': return '⇄+4';
      case 'wildRoulette': return '🎡';
      case 'discardAll': return '⊘';
      case 'skipEveryone': return '!!!';
      case 'swapHand': return '🤝';
      case 'rotateHands': return '♻️';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={!disabled ? { y: -15, zIndex: 10 } : {}}
      className={`card ${card.color} ${disabled ? 'disabled' : ''} ${isUnplayable ? 'unplayable' : ''}`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="card-inner">
        <div className="top-left">{getCardContent()}</div>
        <div className="center">{getCardContent()}</div>
        <div className="bottom-right">{getCardContent()}</div>
      </div>
    </motion.div>
  );
};

export default App;
