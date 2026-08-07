import { describe, expect, it } from 'vitest';
import { assertBalanceSheet, buildBS, runTurn } from './calculations';
import {
  createScenarioState,
  evaluateScenario,
  getScenarioById,
  SCENARIOS,
} from './scenarios';

describe('scenarios', () => {
  it('3シナリオの初期BSが整合する', () => {
    for (const scenario of SCENARIOS) {
      const state = createScenarioState(scenario);
      assertBalanceSheet(buildBS(state), scenario.id);
      expect(state.mode).toBe('scenario');
      expect(state.totalTurns).toBe(3);
    }
  });

  it('値上げシナリオを3期スクリプトイベントで完走できる', () => {
    const scenario = getScenarioById('price-hike')!;
    let state = createScenarioState(scenario);

    for (let i = 0; i < 3; i++) {
      const event = scenario.scriptedEvents[i];
      const { state: next, result } = runTurn(
        state,
        {
          materialPurchase: 2_000,
          productionQty: 180,
          unitPrice: 10,
          employeeChange: 0,
          investments: [],
        },
        { event, skipPriceVolatility: true, rng: () => 0.5 },
      );
      expect(result.event?.type).toBe(event.type);
      assertBalanceSheet(result.bs, `price-hike t${i + 1}`);
      state = next;
    }

    expect(state.history).toHaveLength(3);
    const evaluation = evaluateScenario(state);
    expect(evaluation).not.toBeNull();
    expect(evaluation!.score).toBeGreaterThanOrEqual(0);
  });
});
