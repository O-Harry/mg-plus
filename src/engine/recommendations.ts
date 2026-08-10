import type { Decision, GameState } from '../types/game';
import { getPlaybook } from './playbooks';

export type Recommendation = {
  decision: Decision;
  reasoning: string[];
  keyPoint: string;
};

export function getRecommendation(state: GameState): Recommendation | null {
  if (state.mode !== 'scenario' || !state.scenarioId) return null;
  const playbook = getPlaybook(state.scenarioId);
  if (!playbook) return null;
  const pbTurn = playbook.turns[state.currentTurn - 1];
  if (!pbTurn) return null;
  return {
    decision: pbTurn.recommendedDecision,
    reasoning: pbTurn.reasoning,
    keyPoint: pbTurn.keyLesson,
  };
}
