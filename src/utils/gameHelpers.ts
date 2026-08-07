import { CONSTANTS } from '../engine/constants';
import type { GameState } from '../types/game';

export function getMaxTurns(game: GameState): number {
  if (game.totalTurns > 0) return game.totalTurns;
  return game.mode === 'scenario' ? 3 : CONSTANTS.TOTAL_TURNS;
}

export function isGameComplete(game: GameState): boolean {
  return !game.gameOver && game.history.length >= getMaxTurns(game);
}
