import { describe, expect, it } from 'vitest';
import { getPlaybook, PLAYBOOKS } from './playbooks';
import { getRecommendation } from './recommendations';
import { createScenarioState, getScenarioById } from './scenarios';

describe('playbooks', () => {
  it('3シナリオすべてに3期分のお手本がある', () => {
    expect(PLAYBOOKS).toHaveLength(3);
    for (const pb of PLAYBOOKS) {
      expect(pb.turns).toHaveLength(3);
      expect(getPlaybook(pb.scenarioId)?.scenarioId).toBe(pb.scenarioId);
    }
  });
});

describe('getRecommendation', () => {
  it('シナリオ1期目の推奨を返す', () => {
    const scenario = getScenarioById('price-hike')!;
    const state = createScenarioState(scenario);
    const rec = getRecommendation(state);
    expect(rec?.decision.unitPrice).toBe(96);
    expect(rec?.reasoning.length).toBeGreaterThan(0);
  });

  it('フリープレイでは null', () => {
    const scenario = getScenarioById('price-hike')!;
    const state = { ...createScenarioState(scenario), mode: 'free' as const };
    expect(getRecommendation(state)).toBeNull();
  });
});
