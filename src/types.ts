export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'black';

export type CardType = 
  | 'number' 
  | 'skip' 
  | 'reverse' 
  | 'draw2' 
  | 'draw4' 
  | 'draw6' 
  | 'draw10' 
  | 'wild' 
  | 'wildDraw6' 
  | 'wildDraw10' 
  | 'discardAll' 
  | 'skipEveryone'
  | 'swapHand'
  | 'rotateHands'
  | 'wildReverseDraw4'
  | 'wildRoulette';

export interface Card {
  id: string;
  color: Color;
  type: CardType;
  value?: number; // for number cards 0-9
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isBot: boolean;
  score: number;
  avatar?: string;
}

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  status: 'lobby' | 'playing' | 'gameOver';
  winner?: Player;
  drawStack: number; // For stacking +2, +4, etc.
  currentColor: Color; // For wild cards
  mercyLimit: number; // 25 for No Mercy
}
