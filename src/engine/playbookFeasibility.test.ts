import { describe, expect, it } from 'vitest';
import { runTurn } from './calculations';
import { CONSTANTS } from './constants';
import { getPlaybook } from './playbooks';
import {
  createScenarioState,
  evaluateScenario,
  getScenarioById,
} from './scenarios';

function runPlaybook(scenarioId: 'price-hike' | 'hiring' | 'post-boom') {
  const scenario = getScenarioById(scenarioId)!;
  const playbook = getPlaybook(scenarioId)!;
  let state = createScenarioState(scenario);

  for (let i = 0; i < playbook.turns.length; i++) {
    const pbTurn = playbook.turns[i]!;
    const event = scenario.scriptedEvents[i];
    const { state: next } = runTurn(state, pbTurn.recommendedDecision, {
      event,
      skipPriceVolatility: true,
      rng: () => 0.5,
    });
    state = next;
  }
  return state;
}

describe('Playbook feasibility (Phase G)', () => {
  it('price-hike お手本で最終期営業利益率が5%以上', () => {
    const state = runPlaybook('price-hike');
    const finalPL = state.history[state.history.length - 1]!.pl;
    expect(finalPL.operatingProfit).toBeGreaterThan(0);
    expect(finalPL.operatingProfit / finalPL.revenue).toBeGreaterThan(0.05);
    const evaluation = evaluateScenario(state);
    expect(evaluation?.success).toBe(true);
  });

  it('hiring お手本で成功条件を満たす', () => {
    const state = runPlaybook('hiring');
    const evaluation = evaluateScenario(state);
    expect(evaluation?.success).toBe(true);
    const totalOp = state.history.reduce(
      (s, r) => s + r.pl.operatingProfit,
      0,
    );
    expect(totalOp).toBeGreaterThan(0);
  });

  it('post-boom お手本で現金プラスかつ最終期黒字', () => {
    const state = runPlaybook('post-boom');
    expect(state.cash).toBeGreaterThan(0);
    const finalPL = state.history[state.history.length - 1]!.pl;
    expect(finalPL.operatingProfit).toBeGreaterThan(0);
    const evaluation = evaluateScenario(state);
    expect(evaluation?.success).toBe(true);
  });

  it('値上げお手本の1期目価格は BASE_PRICE×1.2', () => {
    const pb = getPlaybook('price-hike')!;
    expect(pb.turns[0]!.recommendedDecision.unitPrice).toBeCloseTo(
      CONSTANTS.BASE_PRICE * 1.2,
      5,
    );
  });
});
