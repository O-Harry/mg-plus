import { describe, expect, it } from 'vitest';
import type { PL } from '../types/game';
import { CONSTANTS } from './constants';
import {
  calculateBEP,
  calculateSTRAC,
  evaluateLaborShare,
  simulateWhatIf,
} from './strac';

const samplePl: PL = {
  revenue: 1600,
  cogs: 800,
  grossProfit: 800,
  sga: 500,
  operatingProfit: 300,
  interestExpense: 50,
  ordinaryProfit: 250,
  tax: 75,
  netProfit: 175,
};

describe('calculateSTRAC', () => {
  it('P/Q/V/M と MQ/F/G を計算する', () => {
    const strac = calculateSTRAC(samplePl, 200, 8, 5, 100);
    expect(strac.P).toBe(8);
    expect(strac.V).toBe(CONSTANTS.MATERIAL_COST_PER_UNIT);
    expect(strac.M).toBe(5);
    expect(strac.Q).toBe(200);
    expect(strac.PQ).toBe(1600);
    expect(strac.VQ).toBe(600);
    expect(strac.MQ).toBe(1000);
    expect(strac.fixedCostBreakdown.labor).toBe(
      5 * CONSTANTS.EMPLOYEE_SALARY_PER_TURN,
    );
    expect(strac.F).toBeGreaterThan(0);
    expect(strac.G).toBe(strac.MQ - strac.F);
  });
});

describe('calculateBEP', () => {
  it('損益分岐点比率を算出する', () => {
    const strac = calculateSTRAC(samplePl, 200, 8, 5, 100);
    const bep = calculateBEP(strac);
    expect(bep.bepRevenue).toBeGreaterThan(0);
    expect(bep.bepRatio).toBeGreaterThan(0);
    expect(['excellent', 'good', 'warning', 'danger']).toContain(bep.level);
  });
});

describe('simulateWhatIf / evaluateLaborShare', () => {
  it('価格上昇で利益が増える', () => {
    const strac = calculateSTRAC(samplePl, 200, 8, 5, 100);
    const whatif = simulateWhatIf(strac, { priceChange: 0.1 });
    expect(whatif.G).toBeGreaterThan(strac.G);
  });

  it('労働分配率の評価帯', () => {
    expect(evaluateLaborShare(0.3).level).toBe('excellent');
    expect(evaluateLaborShare(0.5).level).toBe('good');
    expect(evaluateLaborShare(0.7).level).toBe('warning');
    expect(evaluateLaborShare(0.9).level).toBe('danger');
  });
});
