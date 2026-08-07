import { describe, expect, it } from 'vitest';
import { createInitialState } from './constants';
import {
  calculateBSMetricsFromState,
  evaluateStance,
} from './bsMetrics';

describe('calculateBSMetricsFromState', () => {
  it('自己資本比率などを算出する', () => {
    const state = createInitialState('テスト', 'normal');
    const m = calculateBSMetricsFromState(state, 3000);
    expect(m.totalAssets).toBeGreaterThan(0);
    expect(m.equityRatio).toBeGreaterThan(0);
    expect(m.debtToMonthlySales).toBeGreaterThan(0);
  });
});

describe('evaluateStance', () => {
  it('前期なしは初期', () => {
    const state = createInitialState('テスト', 'normal');
    const m = calculateBSMetricsFromState(state, 3000);
    const e = evaluateStance(m, null);
    expect(e.stance).toBe('stable');
    expect(e.label).toBe('初期');
  });

  it('借入増は攻め寄り', () => {
    const state = createInitialState('テスト', 'normal');
    const prev = calculateBSMetricsFromState(state, 3000);
    const current = {
      ...prev,
      interestBearingDebt: prev.interestBearingDebt * 1.2,
      equityRatio: prev.equityRatio - 0.05,
    };
    const e = evaluateStance(current, prev);
    expect(['aggressive', 'growth', 'crisis']).toContain(e.stance);
  });
});
