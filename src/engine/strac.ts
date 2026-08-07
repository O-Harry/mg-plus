import type { PL, STRAC } from '../types/game';
import { CONSTANTS } from './constants';

/**
 * STRAC (未来会計) の計算
 * 既存 PL から変動費/固定費ベースに再分類する
 */
export function calculateSTRAC(
  pl: PL,
  salesQty: number,
  unitPrice: number,
  employees: number,
  depreciation: number,
): STRAC {
  const V = CONSTANTS.MATERIAL_COST_PER_UNIT;
  const P = unitPrice;
  const M = P - V;
  const Q = salesQty;
  const PQ = P * Q;
  const VQ = V * Q;
  const MQ = PQ - VQ;

  const totalLabor = employees * CONSTANTS.EMPLOYEE_SALARY_PER_TURN;
  const laborInSGA = totalLabor * 0.4;
  const otherSga = Math.max(0, pl.sga - laborInSGA);
  const interest = pl.interestExpense;
  const F = totalLabor + depreciation + otherSga + interest;
  const G = MQ - F;

  return {
    P,
    V,
    M,
    Q,
    PQ,
    VQ,
    MQ,
    F,
    G,
    marginRatio: PQ > 0 ? MQ / PQ : 0,
    laborShare: MQ > 0 ? totalLabor / MQ : 0,
    fixedCostBreakdown: {
      labor: totalLabor,
      depreciation,
      otherSga,
      interest,
    },
  };
}

export function evaluateLaborShare(laborShare: number): {
  level: 'excellent' | 'good' | 'warning' | 'danger';
  message: string;
} {
  if (laborShare < 0.4) {
    return { level: 'excellent', message: '労働生産性が非常に高い状態' };
  }
  if (laborShare <= 0.6) {
    return { level: 'good', message: '健全な労働分配率(業界標準)' };
  }
  if (laborShare <= 0.8) {
    return { level: 'warning', message: '人件費負担が重い' };
  }
  return { level: 'danger', message: '労働分配率が過大。人件費見直し必須' };
}

export type BEPAnalysis = {
  bepRevenue: number;
  bepQuantity: number;
  bepRatio: number;
  safetyMargin: number;
  level: 'excellent' | 'good' | 'warning' | 'danger';
  message: string;
};

export function calculateBEP(strac: STRAC): BEPAnalysis {
  const { PQ, MQ, F, M } = strac;
  const marginRatio = PQ > 0 ? MQ / PQ : 0;
  const bepRevenue = marginRatio > 0 ? F / marginRatio : 0;
  const bepQuantity = M > 0 ? F / M : 0;
  const bepRatio = PQ > 0 ? bepRevenue / PQ : 999;
  const safetyMargin = 1 - bepRatio;

  let level: BEPAnalysis['level'];
  let message: string;
  if (bepRatio <= 0.6) {
    level = 'excellent';
    message =
      '優良企業水準(60%以下)。売上が4割減っても赤字にならない体質';
  } else if (bepRatio <= 0.8) {
    level = 'good';
    message = '健全な水準(80%以下)。売上変動に耐えられる';
  } else if (bepRatio <= 1.0) {
    level = 'warning';
    message = '注意水準。売上減少に脆弱';
  } else {
    level = 'danger';
    message = '損益分岐点未達。既に赤字状態';
  }

  return { bepRevenue, bepQuantity, bepRatio, safetyMargin, level, message };
}

export function simulateWhatIf(
  baseline: STRAC,
  changes: {
    priceChange?: number;
    fixedCostChange?: number;
    variableCostChange?: number;
  },
) {
  const P2 = baseline.P * (1 + (changes.priceChange ?? 0));
  const V2 = baseline.V * (1 + (changes.variableCostChange ?? 0));
  const F2 = baseline.F * (1 + (changes.fixedCostChange ?? 0));
  const Q2 = baseline.Q;
  const MQ2 = (P2 - V2) * Q2;
  const G2 = MQ2 - F2;
  const pq2 = P2 * Q2;
  const marginRatio2 = pq2 > 0 ? MQ2 / pq2 : 0;
  const bep2 = marginRatio2 > 0 ? F2 / marginRatio2 : 0;
  const bepRatio2 = pq2 > 0 ? bep2 / pq2 : 999;
  return {
    P: P2,
    V: V2,
    F: F2,
    MQ: MQ2,
    G: G2,
    bepRatio: bepRatio2,
    gDelta: G2 - baseline.G,
  };
}

/** 旧セーブなど strac 欠損時の推定（減価償却は内訳から近似） */
export function estimateSTRACFromResult(
  pl: PL,
  salesQty: number,
  unitPrice: number,
  employees: number,
  depreciation = 0,
): STRAC {
  return calculateSTRAC(pl, salesQty, unitPrice, employees, depreciation);
}
