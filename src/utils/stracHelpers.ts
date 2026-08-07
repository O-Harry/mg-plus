import { estimateSTRACFromResult } from '../engine/strac';
import type { GameState, STRAC, TurnResult } from '../types/game';

/** TurnResult の strac を取得（欠損時は推定） */
export function resolveSTRAC(
  result: TurnResult,
  employees: number,
): STRAC {
  if (result.strac) return result.strac;
  return estimateSTRACFromResult(
    result.pl,
    result.salesQty,
    result.decision.unitPrice,
    employees,
    0,
  );
}

export function resolveSTRACForGame(
  result: TurnResult,
  game: GameState,
): STRAC {
  return resolveSTRAC(result, game.employees);
}
