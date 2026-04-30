import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardI, Player, GameState, Color } from './types';
import { createDeck, canPlayCard, shuffle, COLORS } from './utils/gameLogic';
import { Trophy, RefreshCw, Zap, Skull, Users, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import './index.css';

const MERCY_LIMIT = 25;

const SELECTABLE_CHARACTERS = [
  { id: 'luke', name: 'Luke Skywalker', avatar: '/src/assets/avatars/luke.png' },
  { id: 'leia', name: 'Leia Organa', avatar: '/src/assets/avatars/leia.png' },
  { id: 'han', name: 'Han Solo', avatar: '/src/assets/avatars/han.png' },
  { id: 'yoda', name: 'Mestre Yoda', avatar: '/src/assets/avatars/yoda.png' },
];

const ALL_BOTS = [
  { id: 'vader', name: 'Darth Vader', avatar: '/src/assets/avatars/vader.png' },
  { id: 'r2d2', name: 'R2-D2', avatar: '/src/assets/avatars/r2d2.png' },
  { id: 'chewie', name: 'Chewbacca', avatar: '/src/assets/avatars/chewbacca.png' },
  { id: 'boba', name: 'Boba Fett', avatar: '/src/assets/avatars/boba.png' },
  { id: 'storm', name: 'Stormtrooper', avatar: '/src/assets/avatars/stormtrooper.png' },
  { id: 'grievous', name: 'Gen. Grievous', avatar: '/src/assets/avatars/grievous.png' },
];

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
  const [pendingCard, setPendingCard] = useState<CardI | null>(null);
  
  const [botCount, setBotCount] = useState(3);
  const [selectedCharId, setSelectedCharId] = useState(SELECTABLE_CHARACTERS[0].id);

  const startGame = useCallback(() => {
    const fullDeck = createDeck();
    const userChar = SELECTABLE_CHARACTERS.find(c => c.id === selectedCharId)!;
    
    const players: Player[] = [
      { id: 'player', name: userChar.name, hand: [], isBot: false, score: 0, avatar: userChar.avatar },
    ];

    for (let i = 0; i < botCount; i++) {
      const botTemplate = ALL_BOTS[i];
      players.push({ 
        id: `bot${i+1}`, 
        name: botTemplate.name, 
        hand: [], 
        isBot: true, 
        score: 0, 
        avatar: botTemplate.avatar 
      });
    }

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
  }, [botCount, selectedCharId]);

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

      if (card.type === 'wildRoulette') {
         nextDrawStack += 5;
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
    if (!canPlayCard(card, gameState.discardPile[gameState.discardPile.length - 1], gameState.currentColor, gameState.drawStack)) return;

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
           const tIndex = 0;
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
    <div className="relative w-full h-screen flex justify-center items-center bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <div className="star-field" />
      
      <AnimatePresence mode="wait">
        {gameState.status === 'lobby' && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 w-full max-w-2xl p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl text-center"
          >
            <h1 className="text-6xl font-black mb-2 tracking-tighter text-starwars-yellow uppercase">
              UNO <span className="block text-3xl text-white opacity-90 -mt-2">NO MERCY</span>
            </h1>
            <p className="text-slate-400 mb-8 font-medium">A versão mais implacável do clássico, agora em uma galáxia distante.</p>
            
            <div className="space-y-8 mb-10">
              <section className="text-left">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-jedi-blue mb-4">Escolha seu Herói</h3>
                <div className="grid grid-cols-4 gap-4">
                  {SELECTABLE_CHARACTERS.map(char => (
                    <button 
                      key={char.id} 
                      onClick={() => setSelectedCharId(char.id)}
                      className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${selectedCharId === char.id ? 'bg-jedi-blue/20 ring-1 ring-jedi-blue shadow-[0_0_20px_rgba(0,247,255,0.2)]' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      <img src={char.avatar} alt={char.name} className={`w-14 h-14 rounded-full border-2 transition-transform group-hover:scale-105 ${selectedCharId === char.id ? 'border-jedi-blue' : 'border-transparent'}`} />
                      <span className="text-[10px] font-bold text-center leading-tight uppercase opacity-80">{char.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="text-left">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-jedi-blue">Oponentes do Império</h3>
                  <span className="text-sm font-bold text-starwars-yellow">{botCount} Bots</span>
                </div>
                <input 
                  type="range" min="1" max="6" value={botCount} 
                  onChange={(e) => setBotCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-starwars-yellow mb-6"
                />
                <div className="flex justify-center gap-3 min-h-[40px]">
                  {ALL_BOTS.slice(0, botCount).map(bot => (
                    <motion.img layout key={bot.id} src={bot.avatar} className="w-10 h-10 rounded-full border border-white/20 opacity-60 grayscale hover:grayscale-0 transition-all" />
                  ))}
                </div>
              </section>
            </div>

            <button 
              onClick={startGame}
              className="w-full py-4 bg-transparent border-2 border-starwars-yellow text-starwars-yellow font-black text-lg tracking-[0.2em] uppercase rounded-xl hover:bg-starwars-yellow hover:text-black transition-all shadow-[0_0_15px_rgba(255,232,31,0.2)] hover:shadow-[0_0_30px_rgba(255,232,31,0.4)] mb-8"
            >
              Iniciar Duelo
            </button>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider justify-center"><Zap size={14} className="text-starwars-yellow" /> Stacking</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider justify-center"><Skull size={14} className="text-sith-red" /> 25 Cartas</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider justify-center"><RefreshCw size={14} className="text-jedi-blue" /> Regras 7/0</div>
            </div>
          </motion.div>
        )}

        {gameState.status === 'playing' && (
          <div key="board" className="w-full h-full flex flex-col p-6 space-y-6">
            <header className="flex justify-between items-center bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/5">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-black" style={{ backgroundColor: `var(--color-${gameState.currentColor === 'red' ? 'sith-red' : gameState.currentColor === 'blue' ? 'jedi-blue' : gameState.currentColor === 'green' ? 'yoda-green' : 'starwars-yellow'})` }}>
                    {gameState.currentColor[0].toUpperCase()}
                 </div>
                 <span className="text-xs font-black tracking-widest uppercase opacity-60">Cor do Turno</span>
               </div>
               {gameState.drawStack > 0 && (
                 <div className="flex items-center gap-2 px-4 py-2 bg-sith-red/20 border border-sith-red/50 rounded-full animate-pulse">
                    <ShieldAlert size={16} className="text-sith-red" />
                    <span className="text-xs font-black text-sith-red">ACUMULADO: +{gameState.drawStack}</span>
                 </div>
               )}
               <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {gameState.players.map((p, i) => (
                      <div key={p.id} className={`w-8 h-8 rounded-full border-2 transition-all ${gameState.currentPlayerIndex === i ? 'border-jedi-blue scale-110 shadow-[0_0_10px_rgba(0,247,255,0.5)] z-10' : 'border-transparent opacity-40'}`}>
                        <img src={p.avatar} className="w-full h-full rounded-full" />
                      </div>
                    ))}
                  </div>
               </div>
            </header>

            <main className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <section className="flex md:flex-col justify-center gap-4">
                {gameState.players.filter(p => p.isBot).map((bot, i) => {
                   const index = gameState.players.indexOf(bot);
                   return (
                    <div key={bot.id} className={`p-4 rounded-2xl border transition-all ${gameState.currentPlayerIndex === index ? 'bg-jedi-blue/10 border-jedi-blue shadow-[0_0_20px_rgba(0,247,255,0.1)]' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={bot.avatar} className={`w-10 h-10 rounded-full border ${gameState.currentPlayerIndex === index ? 'border-jedi-blue' : 'border-white/20'}`} />
                          <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full px-1.5 py-0.5 text-[8px] font-black border border-white/10">{bot.hand.length}</div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-wider text-white/80 leading-none mb-1">{bot.name}</span>
                          <span className="text-[8px] font-bold uppercase text-white/40 leading-none">{gameState.currentPlayerIndex === index ? 'Analisando...' : 'Aguardando'}</span>
                        </div>
                      </div>
                    </div>
                   );
                })}
              </section>

              <section className="md:col-span-2 flex justify-center items-center gap-12 py-12">
                <button 
                  onClick={() => gameState.currentPlayerIndex === 0 && drawCards(0, gameState.drawStack || 1)}
                  className={`group relative w-32 h-48 rounded-xl border-2 border-white/10 transition-all flex items-center justify-center font-black text-2xl tracking-[0.2em] bg-slate-900 shadow-2xl ${gameState.currentPlayerIndex === 0 ? 'hover:border-starwars-yellow hover:shadow-[0_0_30px_rgba(255,232,31,0.2)] scale-105' : 'opacity-80 grayscale cursor-not-allowed'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[9px]" />
                  <span className="text-white/20 group-hover:text-starwars-yellow transition-colors">UNO</span>
                </button>

                <div className="w-32 h-48 flex items-center justify-center">
                  <AnimatePresence mode="popLayout">
                    <CardComponent 
                      key={gameState.discardPile[gameState.discardPile.length - 1].id} 
                      card={gameState.discardPile[gameState.discardPile.length - 1]} 
                    />
                  </AnimatePresence>
                </div>
              </section>

              <section className="hidden md:flex flex-col gap-4 text-center opacity-40">
                 <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
                    <Users className="mx-auto mb-2" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Controle Tático</span>
                 </div>
              </section>
            </main>

            <footer className="hologram-panel p-6">
              <div className="flex justify-between items-end mb-6">
                <div className="space-y-2">
                   <h3 className="text-[10px] font-black tracking-[0.3em] text-jedi-blue uppercase opacity-80">Arsenal de Batalha</h3>
                   <div className="flex items-center gap-3">
                      <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <motion.div 
                          initial={false}
                          animate={{ 
                            width: `${Math.min((gameState.players[0].hand.length / MERCY_LIMIT) * 100, 100)}%`,
                            backgroundColor: gameState.players[0].hand.length > 18 ? '#ff0000' : gameState.players[0].hand.length > 12 ? '#FFE81F' : '#00f7ff'
                          }}
                          className="h-full shadow-[0_0_10px_currentColor]"
                        />
                      </div>
                      <span className="text-sm font-black font-mono tracking-tighter">{gameState.players[0].hand.length} / {MERCY_LIMIT}</span>
                   </div>
                </div>
                {gameState.currentPlayerIndex === 0 && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-6 py-2 bg-jedi-blue/20 border border-jedi-blue/50 rounded-lg shadow-[0_0_15px_rgba(0,247,255,0.2)]">
                    <span className="text-xs font-black text-jedi-blue tracking-[0.2em] uppercase">Seu Turno</span>
                  </motion.div>
                )}
              </div>

              <div className="flex justify-center gap-2 h-40 overflow-x-auto pb-4 px-8 scrollbar-hide">
                {gameState.players[0].hand.map((card, idx) => {
                  const isPlayable = canPlayCard(card, gameState.discardPile[gameState.discardPile.length - 1], gameState.currentColor, gameState.drawStack);
                  return (
                    <div key={card.id} style={{ marginLeft: idx === 0 ? 0 : -40 }}>
                      <CardComponent 
                        card={card} 
                        onClick={() => playCard(card)}
                        disabled={gameState.currentPlayerIndex !== 0 || !isPlayable}
                        isUnplayable={gameState.currentPlayerIndex === 0 && !isPlayable}
                      />
                    </div>
                  );
                })}
              </div>
            </footer>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {gameState.status === 'gameOver' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm p-8 bg-slate-900 border border-starwars-yellow/30 rounded-3xl text-center shadow-[0_0_50px_rgba(255,232,31,0.1)]">
              <Trophy size={64} className="mx-auto mb-6 text-starwars-yellow animate-bounce" />
              <h2 className="text-2xl font-black uppercase tracking-wider mb-2">{gameState.winner?.name}</h2>
              <p className="text-slate-400 font-bold text-sm mb-8">Dominou a Galáxia!</p>
              <button onClick={startGame} className="w-full py-4 bg-starwars-yellow text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">Recomeçar</button>
            </motion.div>
          </div>
        )}

        {showWildModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-xs p-6 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl text-center">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-6">Escolha a Cor da Força</h3>
              <div className="grid grid-cols-2 gap-4">
                {COLORS.map(c => (
                  <button 
                    key={c} 
                    onClick={() => handleWildChoice(c)}
                    className="aspect-square rounded-xl border-2 border-white/5 transition-all hover:scale-110 shadow-lg"
                    style={{ backgroundColor: `var(--color-${c === 'red' ? 'sith-red' : c === 'blue' ? 'jedi-blue' : c === 'green' ? 'yoda-green' : 'starwars-yellow'})` }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showSwapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm p-8 bg-slate-900 border border-jedi-blue/30 rounded-3xl shadow-[0_0_30px_rgba(0,247,255,0.1)]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-jedi-blue text-center mb-8">Trocar Arsenal com Alvo</h3>
                <div className="space-y-3">
                   {gameState.players.filter(p => p.id !== 'player').map(p => (
                     <button 
                        key={p.id} 
                        onClick={() => handleSwapChoice(p.id)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-jedi-blue/10 border border-white/10 hover:border-jedi-blue rounded-xl transition-all group"
                      >
                       <div className="flex items-center gap-3">
                         <img src={p.avatar} className="w-8 h-8 rounded-full" />
                         <span className="text-xs font-black uppercase tracking-wider group-hover:text-jedi-blue">{p.name}</span>
                       </div>
                       <span className="text-[10px] font-bold opacity-40">{p.hand.length} Cartas</span>
                     </button>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CardComponent = React.forwardRef<HTMLDivElement, { card: CardI, onClick?: () => void, disabled?: boolean, isUnplayable?: boolean }>(
  ({ card, onClick, disabled, isUnplayable }, ref) => {
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
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={!disabled ? { y: -20, scale: 1.05, zIndex: 50 } : {}}
        onClick={!disabled ? onClick : undefined}
        className={`relative w-28 h-40 rounded-lg p-1.5 border transition-all ${colorClass} ${disabled ? 'grayscale brightness-50 opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-[0_0_25px_var(--glow)]'} ${isUnplayable ? 'brightness-50' : ''}`}
        style={{ '--glow': glowColor } as any}
      >
        <div className="w-full h-full border border-white/20 rounded-md flex items-center justify-center relative overflow-hidden bg-black/20">
          <span className="text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{getContent()}</span>
          <div className="absolute top-1 left-1.5 text-[8px] font-black opacity-80">{getContent()}</div>
          <div className="absolute bottom-1 right-1.5 text-[8px] font-black opacity-80">{getContent()}</div>
        </div>
      </motion.div>
    );
  }
);

export default App;
