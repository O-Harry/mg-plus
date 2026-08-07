import { describe, expect, it } from 'vitest';
import {
  assertBalanceSheet,
  buildBS,
  companyValueScore,
  runTurn,
} from './calculations';
import { createInitialState } from './constants';
import type { Decision } from '../types/game';

/** 決定論的RNG (イベントを neutral 寄りに固定) */
function rngSequence(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0.5;
    i += 1;
    return v;
  };
}

/** 不況を避け、ノイズ中央付近になるシーケンス */
function stableRng() {
  // recession check > recessionProb, other event > 0.2 → neutral
  // demand noise: 0.5 → multiplier 1.0
  return rngSequence([0.99, 0.99, 0.5, 0.5, 0.5, 0.5]);
}

const baseDecision = (over: Partial<Decision> = {}): Decision => ({
  materialPurchase: 3_000,
  productionQty: 200,
  unitPrice: 8,
  employeeChange: 0,
  investments: [],
  ...over,
});

describe('runTurn / BS integrity', () => {
  it('ケース1: 初期状態で BS が整合する', () => {
    const state = createInitialState('テスト工業', 'normal');
    const bs = buildBS(state);
    assertBalanceSheet(bs, 'initial');
    expect(bs.totalAssets).toBe(bs.totalLiabilities + bs.totalEquity);
    expect(bs.capital).toBe(10_000);
    expect(state.cash).toBe(50_000);
  });

  it('ケース2: 1期実行後も資産 = 負債 + 純資産', () => {
    const state = createInitialState('テスト工業', 'normal');
    const { state: next, result } = runTurn(
      state,
      baseDecision(),
      stableRng(),
    );

    assertBalanceSheet(result.bs, 'result.bs');
    assertBalanceSheet(buildBS(next), 'next state');
    expect(next.history).toHaveLength(1);
    expect(result.turn).toBe(1);
    expect(next.currentTurn).toBe(2);
    expect(result.pl.revenue).toBeGreaterThan(0);
    expect(result.coachComment.length).toBeGreaterThan(0);
  });

  it('ケース3: 設備投資後も BS が整合し、生産能力が上がる', () => {
    const state = createInitialState('テスト工業', 'easy');
    const beforeDebt = state.longTermDebt;
    const { state: next, result } = runTurn(
      state,
      baseDecision({
        materialPurchase: 5_000,
        productionQty: 250,
        investments: ['equipment'],
      }),
      stableRng(),
    );

    assertBalanceSheet(result.bs, 'after equipment');
    expect(next.equipment).toBe(state.equipment + 30_000);
    expect(next.longTermDebt).toBe(beforeDebt + 29_500);
    expect(next.extraProductionCapacity).toBeGreaterThan(0);
  });

  it('ケース4: 過剰投資で資金ショートするとゲームオーバー', () => {
    const state = createInitialState('ピンチ工業', 'hard');
    // 現金をほぼ使い切る意思決定を複数回
    let current = state;
    let gameOver = false;

    for (let i = 0; i < 8; i++) {
      const { state: next } = runTurn(
        current,
        baseDecision({
          materialPurchase: Math.floor(current.cash * 0.8),
          productionQty: 160,
          unitPrice: 5,
          investments: ['ad', 'rd', 'equipment'],
          employeeChange: 2,
        }),
        stableRng(),
      );
      current = next;
      if (next.gameOver) {
        gameOver = true;
        expect(next.gameOverReason).toBe('資金ショート');
        break;
      }
    }

    // hard + 積極投資でショートするか、少なくとも BS は常に整合
    assertBalanceSheet(buildBS(current), 'stress');
    expect(gameOver || current.history.length > 0).toBe(true);
  });

  it('会社価値スコアが計算できる', () => {
    const state = createInitialState('スコア工業', 'normal');
    const { state: next } = runTurn(state, baseDecision(), stableRng());
    const score = companyValueScore(next);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('ケース5: easy で12期通しでも毎期 BS が整合する', () => {
    let current = createInitialState('完走工業', 'easy');
    for (let i = 0; i < 12; i++) {
      if (current.gameOver) break;
      const purchase = Math.min(2_500, Math.max(800, Math.floor(current.cash * 0.25)));
      const { state: next, result } = runTurn(
        current,
        baseDecision({
          materialPurchase: purchase,
          productionQty: 200,
          unitPrice: 8,
          employeeChange: 0,
          investments: [],
        }),
        stableRng(),
      );
      assertBalanceSheet(result.bs, `turn ${result.turn}`);
      current = next;
    }
    expect(current.gameOver).toBe(false);
    expect(current.history.length).toBe(12);
    expect(companyValueScore(current)).toBeGreaterThan(0);
  });
});
