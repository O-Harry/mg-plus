import { describe, expect, it } from 'vitest';
import {
  assertBalanceSheet,
  buildBS,
  companyValueScore,
  getProductionLimits,
  runTurn,
} from './calculations';
import { CONSTANTS, createInitialState } from './constants';
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
  return rngSequence([0.99, 0.99, 0.5, 0.5, 0.5, 0.5]);
}

const baseDecision = (over: Partial<Decision> = {}): Decision => ({
  materialPurchase: 5_000,
  productionQty: 200,
  unitPrice: CONSTANTS.BASE_PRICE,
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

  it('ケース3: 設備投資で生産能力+30、投資CFで500支出', () => {
    const state = createInitialState('テスト工業', 'normal');
    const opts = {
      event: {
        type: 'neutral' as const,
        message: '',
        demandMultiplier: 1,
        costMultiplier: 1,
      },
      skipPriceVolatility: true,
      rng: () => 0.5,
    };
    const { state: next, result } = runTurn(
      state,
      baseDecision({
        materialPurchase: 5_000,
        productionQty: 200,
        investments: ['equipment'],
      }),
      opts,
    );

    assertBalanceSheet(result.bs, 'after equipment');
    expect(next.equipment).toBe(state.equipment);
    expect(next.extraProductionCapacity).toBe(
      CONSTANTS.EQUIPMENT_BONUS_CAPACITY,
    );
    expect(result.cf.investing).toBe(-CONSTANTS.INVESTMENT_COST_EACH);

    const noInv = runTurn(
      state,
      baseDecision({ materialPurchase: 5_000, productionQty: 200 }),
      opts,
    );
    expect(next.cash).toBeLessThan(noInv.state.cash);
  });

  it('ケース4: 過剰投資で資金ショートするとゲームオーバー', () => {
    const state = createInitialState('ピンチ工業', 'hard');
    let current = state;
    let gameOver = false;

    for (let i = 0; i < 8; i++) {
      const { state: next } = runTurn(
        current,
        baseDecision({
          materialPurchase: Math.floor(current.cash * 0.8),
          productionQty: 160,
          unitPrice: 50,
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
      const purchase = Math.min(
        8_000,
        Math.max(3_000, Math.floor(current.cash * 0.2)),
      );
      const { state: next, result } = runTurn(
        current,
        baseDecision({
          materialPurchase: purchase,
          productionQty: 200,
          unitPrice: CONSTANTS.BASE_PRICE,
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

describe('Rebalanced constants (Phase G)', () => {
  const fixedOpts = {
    event: {
      type: 'neutral' as const,
      message: '',
      demandMultiplier: 1,
      costMultiplier: 1,
    },
    skipPriceVolatility: true,
    rng: () => 0.5,
  };

  it('baseline: 5人・200個・80千円で営業利益がプラス帯', () => {
    const state = createInitialState('基準工業', 'normal');
    const { result } = runTurn(
      state,
      {
        materialPurchase: 5_000,
        productionQty: 200,
        unitPrice: 80,
        employeeChange: 0,
        investments: [],
      },
      fixedOpts,
    );
    expect(result.pl.revenue).toBeGreaterThanOrEqual(14_000);
    expect(result.pl.revenue).toBeLessThanOrEqual(19_000);
    expect(result.pl.operatingProfit).toBeGreaterThan(1_000);
    expect(result.pl.operatingProfit).toBeLessThan(6_000);
  });

  it('粗利率はおおむね 25-55%(労務・減価の吸収原価込み)', () => {
    const state = createInitialState('粗利工業', 'normal');
    const { result } = runTurn(
      state,
      {
        materialPurchase: 5_000,
        productionQty: 200,
        unitPrice: 80,
        employeeChange: 0,
        investments: [],
      },
      fixedOpts,
    );
    const grossMargin = result.pl.grossProfit / result.pl.revenue;
    expect(grossMargin).toBeGreaterThan(0.25);
    expect(grossMargin).toBeLessThan(0.55);
  });
});

describe('Investment effects (Phase G)', () => {
  const fixedOpts = {
    event: {
      type: 'neutral' as const,
      message: '',
      demandMultiplier: 1,
      costMultiplier: 1,
    },
    skipPriceVolatility: true,
    rng: () => 0.5,
  };

  it('広告投資でブランド値が+15(減衰-2込みで+13以上)', () => {
    const state = createInitialState('広告工業', 'normal');
    const initialBrand = state.brandValue;
    const { state: next } = runTurn(
      state,
      baseDecision({ investments: ['ad'] }),
      fixedOpts,
    );
    expect(next.brandValue).toBeGreaterThanOrEqual(initialBrand + 13);
    expect(next.brandValue).toBeLessThanOrEqual(CONSTANTS.BRAND_MAX);
  });

  it('広告しない期はブランドが-2減衰', () => {
    const state = createInitialState('減衰工業', 'normal');
    const { state: next } = runTurn(state, baseDecision(), fixedOpts);
    expect(next.brandValue).toBe(state.brandValue - CONSTANTS.BRAND_DECAY_PER_TURN);
  });

  it('設備投資で生産能力が+30', () => {
    const state = createInitialState('設備工業', 'normal');
    const before = getProductionLimits(
      state,
      state.employees,
      state.materialUnitCost,
      state.materialInventory + 20_000,
    ).max;
    const { state: next } = runTurn(
      state,
      baseDecision({ investments: ['equipment'] }),
      fixedOpts,
    );
    const after = getProductionLimits(
      next,
      next.employees,
      next.materialUnitCost,
      next.materialInventory + 20_000,
    ).max;
    expect(next.extraProductionCapacity).toBe(30);
    expect(after - before).toBe(CONSTANTS.EQUIPMENT_BONUS_CAPACITY);
  });

  it('R&D投資で次期・次々期に材料費-10%が効き、その後消える', () => {
    let withRd = createInitialState('研究工業', 'normal');
    let withoutRd = createInitialState('対照工業', 'normal');

    // 投資期: 効果はまだ効かない(rdBonusは期末に立つ)
    ({ state: withRd } = runTurn(
      withRd,
      baseDecision({ investments: ['rd'] }),
      fixedOpts,
    ));
    ({ state: withoutRd } = runTurn(withoutRd, baseDecision(), fixedOpts));
    expect(withRd.rdBonus).toBe(CONSTANTS.RD_BONUS_TURNS);
    expect(withRd.history[0]!.pl.cogs).toBe(withoutRd.history[0]!.pl.cogs);

    // 次期: R&D効果あり → COGSが下がる
    ({ state: withRd } = runTurn(withRd, baseDecision(), fixedOpts));
    ({ state: withoutRd } = runTurn(withoutRd, baseDecision(), fixedOpts));
    expect(withRd.rdBonus).toBe(1);
    expect(withRd.history[1]!.pl.cogs).toBeLessThan(
      withoutRd.history[1]!.pl.cogs,
    );

    // 次々期: まだ効果あり
    ({ state: withRd } = runTurn(withRd, baseDecision(), fixedOpts));
    ({ state: withoutRd } = runTurn(withoutRd, baseDecision(), fixedOpts));
    expect(withRd.rdBonus).toBe(0);
    expect(withRd.history[2]!.pl.cogs).toBeLessThan(
      withoutRd.history[2]!.pl.cogs,
    );

    // その次の期: 効果消失
    ({ state: withRd } = runTurn(withRd, baseDecision(), fixedOpts));
    ({ state: withoutRd } = runTurn(withoutRd, baseDecision(), fixedOpts));
    expect(withRd.history[3]!.pl.cogs).toBe(withoutRd.history[3]!.pl.cogs);
  });
});
