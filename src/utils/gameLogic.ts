import { Card, CardType, Color } from '../types';

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let id = 0;

  const addCard = (color: Color, type: CardType, value?: number) => {
    deck.push({ id: (id++).toString(), color, type, value });
  };

  COLORS.forEach(color => {
    // Number cards (0-9) - in No Mercy there are more
    for (let i = 0; i <= 9; i++) {
      const type: CardType = i === 7 ? 'swapHand' : (i === 0 ? 'rotateHands' : 'number');
      addCard(color, type, i);
      addCard(color, type, i);
    }
    
    // Special colored cards
    for (let i = 0; i < 2; i++) {
      addCard(color, 'skip');
      addCard(color, 'reverse');
      addCard(color, 'draw2');
      addCard(color, 'discardAll');
    }
    
    // Draw 4 (No Mercy has colored +4)
    addCard(color, 'draw4');
    addCard(color, 'draw4');
    
    // Draw 6 (No Mercy has colored +6)
    addCard(color, 'draw6');
  });

  // Wild cards (Black)
  for (let i = 0; i < 4; i++) {
    addCard('black', 'wild');
    addCard('black', 'wildDraw6');
    addCard('black', 'wildDraw10');
    addCard('black', 'skipEveryone');
    addCard('black', 'wildReverseDraw4');
    addCard('black', 'wildRoulette');
  }

  return shuffle(deck);
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const canPlayCard = (card: Card, topCard: Card, currentColor: Color, drawStack: number): boolean => {
  // If there's a stack, you must play a compatible draw card or draw
  if (drawStack > 0) {
    const isDrawCard = ['draw2', 'draw4', 'draw6', 'draw10', 'wildDraw6', 'wildDraw10', 'wildReverseDraw4'].includes(card.type);
    if (!isDrawCard) return false;

    // In No Mercy, you can stack same or higher draw cards
    const getDrawValue = (type: string) => {
      if (type.includes('10')) return 10;
      if (type.includes('6')) return 6;
      if (type.includes('4')) return 4;
      if (type.includes('2')) return 2;
      return 0;
    };

    const currentDrawVal = getDrawValue(card.type);
    const topDrawVal = getDrawValue(topCard.type);

    return currentDrawVal >= topDrawVal;
  }

  if (card.color === 'black') return true;
  if (card.color === currentColor) return true;
  if (card.type === topCard.type && card.type !== 'number' && card.type !== 'swapHand' && card.type !== 'rotateHands') return true;
  if ((card.type === 'number' || card.type === 'swapHand' || card.type === 'rotateHands') && 
      (topCard.type === 'number' || topCard.type === 'swapHand' || topCard.type === 'rotateHands') && 
      card.value === topCard.value) return true;

  return false;
};
