import { useEffect } from 'react';
import { GameState, Card as CardI, Color } from '../types';
import { canPlayCard, COLORS } from '../utils/gameLogic';

interface BotAIProps {
  gameState: GameState;
  playCard: (card: CardI) => void;
  drawCards: (playerIndex: number, count: number, forceUntilPlayable?: boolean) => void;
  handleWildChoice: (color: Color, botCard?: CardI) => void;
}

export const useBotAI = ({ gameState, playCard, drawCards, handleWildChoice }: BotAIProps) => {
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (gameState.status === 'playing' && currentPlayer?.isBot) {
      const timer = setTimeout(() => {
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const playableCard = currentPlayer.hand.find(c => 
          canPlayCard(c, topCard, gameState.currentColor, gameState.drawStack)
        );

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
  }, [
    gameState.currentPlayerIndex, 
    gameState.status, 
    gameState.drawStack, 
    gameState.currentColor, 
    gameState.discardPile, 
    gameState.players, 
    handleWildChoice, 
    playCard, 
    drawCards
  ]);
};
