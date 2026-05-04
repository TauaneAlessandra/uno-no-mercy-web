import { useState, useCallback } from 'react';
import { Card as CardI, Player, GameState, Color } from '../types';
import { createDeck, canPlayCard, shuffle } from '../utils/gameLogic';
import confetti from 'canvas-confetti';
import { useBotAI } from './useBotAI';

const MERCY_LIMIT = 25;

export const useUnoGame = (selectedCharId: string, botCount: number, characters: any[], bots: any[]) => {
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

  const startGame = useCallback(() => {
    const fullDeck = createDeck();
    const userChar = characters.find(c => c.id === selectedCharId)!;
    
    const players: Player[] = [
      { id: 'player', name: userChar.name, hand: [], isBot: false, score: 0, avatar: userChar.avatar },
    ];

    for (let i = 0; i < botCount; i++) {
      const botTemplate = bots[i];
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
  }, [botCount, selectedCharId, characters, bots]);

  const nextTurn = useCallback((skipCount = 1) => {
    setGameState(prev => {
      let nextIndex = (prev.currentPlayerIndex + prev.direction * skipCount) % prev.players.length;
      if (nextIndex < 0) nextIndex = prev.players.length + nextIndex;
      return { ...prev, currentPlayerIndex: nextIndex };
    });
  }, []);

  const drawCards = useCallback((playerIndex: number, count: number, forceUntilPlayable: boolean = false) => {
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
  }, [nextTurn]);

  const handleWildChoice = useCallback((color: Color, botCard?: CardI) => {
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
    
    setGameState(prev => {
      const skipCount = card.type === 'skipEveryone' ? prev.players.length : 1;
      let nextIndex = (prev.currentPlayerIndex + prev.direction * skipCount) % prev.players.length;
      if (nextIndex < 0) nextIndex = prev.players.length + nextIndex;
      return { ...prev, currentPlayerIndex: nextIndex };
    });
  }, [pendingCard]);

  const playCard = useCallback((card: CardI) => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      if (!canPlayCard(card, prev.discardPile[prev.discardPile.length - 1], prev.currentColor, prev.drawStack)) return prev;

      if (card.color === 'black') {
        setPendingCard(card);
        setShowWildModal(true);
        return prev;
      }

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
           return { ...prev, players: newPlayers };
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

      const skipCount = card.type === 'skip' ? 2 : (card.type === 'skipEveryone' ? prev.players.length : 1);
      let nextIndex = (prev.currentPlayerIndex + nextDir * skipCount) % prev.players.length;
      if (nextIndex < 0) nextIndex = prev.players.length + nextIndex;

      return {
        ...prev,
        players: newPlayers,
        discardPile: [...prev.discardPile, card],
        currentColor: card.color,
        direction: nextDir,
        drawStack: nextDrawStack,
        currentPlayerIndex: nextIndex
      };
    });
  }, []);

  const handleSwapChoice = useCallback((targetId: string) => {
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const pIndex = prev.currentPlayerIndex;
      const tIndex = newPlayers.findIndex(p => p.id === targetId);
      
      const tempHand = newPlayers[pIndex].hand;
      newPlayers[pIndex].hand = newPlayers[tIndex].hand;
      newPlayers[tIndex].hand = tempHand;

      let nextIndex = (prev.currentPlayerIndex + prev.direction) % prev.players.length;
      if (nextIndex < 0) nextIndex = prev.players.length + nextIndex;

      return { ...prev, players: newPlayers, currentPlayerIndex: nextIndex };
    });
    setShowSwapModal(false);
  }, []);

  // Use Bot AI
  useBotAI({
    gameState,
    playCard,
    drawCards,
    handleWildChoice
  });

  return {
    gameState,
    startGame,
    drawCards,
    playCard,
    handleWildChoice,
    handleSwapChoice,
    showWildModal,
    setShowWildModal,
    showSwapModal,
    setShowSwapModal,
    pendingCard
  };
};
