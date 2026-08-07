import type { GameState, TurnResult } from '../types/game';

export const BS_TARGETS = {
  equityRatio: 0.5,
  currentRatio: 1.9,
  fixedLongTermRatio: 1.0,
  debtToMonthlySales: 4.04,
  laborSalesRatio: 0.38,
  operatingMargin: 0.1,
  totalAssetTurnover: 1.03,
} as const;

export type BSMetrics = {
  totalAssets: number;
  currentAssets: number;
  fixedAssets: number;
  currentLiabilities: number;
  fixedLiabilities: number;
  equity: number;
  equityRatio: number;
  currentRatio: number;
  fixedLongTermRatio: number;
  debtToMonthlySales: number;
  interestBearingDebt: number;
};

/**
 * BS指標を算出。
 * 月商は 1期=3ヶ月想定で revenue/3。
 * snapshot は期末 GameState、または履歴の BS + 在庫内訳が無い場合は BS から近似。
 */
export function calculateBSMetricsFromState(
  state: GameState,
  periodRevenue: number,
): BSMetrics {
  const currentAssets =
    state.cash +
    state.accountsReceivable +
    state.materialInventory +
    state.productInventoryValue;
  const fixedAssets = Math.max(
    0,
    state.equipment - state.accumulatedDepreciation,
  );
  const totalAssets = currentAssets + fixedAssets;
  const currentLiabilities = state.accountsPayable + state.shortTermDebt;
  const fixedLiabilities = state.longTermDebt;
  const equity = state.capital + state.retainedEarnings;
  const interestBearingDebt = state.shortTermDebt + state.longTermDebt;
  const monthlyRevenue = periodRevenue / 3;

  return {
    totalAssets,
    currentAssets,
    fixedAssets,
    currentLiabilities,
    fixedLiabilities,
    equity,
    equityRatio: totalAssets > 0 ? equity / totalAssets : 0,
    currentRatio:
      currentLiabilities > 0 ? currentAssets / currentLiabilities : 999,
    fixedLongTermRatio:
      equity + fixedLiabilities > 0
        ? fixedAssets / (equity + fixedLiabilities)
        : 999,
    debtToMonthlySales:
      monthlyRevenue > 0 ? interestBearingDebt / monthlyRevenue : 999,
    interestBearingDebt,
  };
}

/** 履歴の BS から指標を構築（期末 state が無い過去期用） */
export function calculateBSMetricsFromTurn(result: TurnResult): BSMetrics {
  const { bs } = result;
  const currentAssets = bs.totalCurrentAssets;
  const fixedAssets = Math.max(0, bs.totalAssets - bs.totalCurrentAssets);
  const totalAssets = bs.totalAssets;
  const currentLiabilities = bs.totalCurrentLiabilities;
  const fixedLiabilities = bs.longTermDebt;
  const equity = bs.totalEquity;
  const interestBearingDebt = bs.shortTermDebt + bs.longTermDebt;
  const monthlyRevenue = result.pl.revenue / 3;

  return {
    totalAssets,
    currentAssets,
    fixedAssets,
    currentLiabilities,
    fixedLiabilities,
    equity,
    equityRatio: bs.equityRatio,
    currentRatio:
      currentLiabilities > 0 ? currentAssets / currentLiabilities : 999,
    fixedLongTermRatio:
      equity + fixedLiabilities > 0
        ? fixedAssets / (equity + fixedLiabilities)
        : 999,
    debtToMonthlySales:
      monthlyRevenue > 0 ? interestBearingDebt / monthlyRevenue : 999,
    interestBearingDebt,
  };
}

export type Stance =
  | 'aggressive'
  | 'defensive'
  | 'growth'
  | 'crisis'
  | 'stable';

export type StanceEvaluation = {
  stance: Stance;
  label: string;
  emoji: string;
  message: string;
  warnings: string[];
};

export function evaluateStance(
  current: BSMetrics,
  previous: BSMetrics | null,
): StanceEvaluation {
  const warnings: string[] = [];
  if (current.equityRatio < BS_TARGETS.equityRatio) {
    warnings.push(
      `自己資本比率${(current.equityRatio * 100).toFixed(0)}%が目標50%未満`,
    );
  }
  if (current.currentRatio < BS_TARGETS.currentRatio) {
    warnings.push(
      `当座比率${(current.currentRatio * 100).toFixed(0)}%が目標190%未満`,
    );
  }
  if (current.fixedLongTermRatio > BS_TARGETS.fixedLongTermRatio) {
    warnings.push(
      `固定長期適合率${(current.fixedLongTermRatio * 100).toFixed(0)}%が100%超(投資過剰)`,
    );
  }
  if (current.debtToMonthlySales > BS_TARGETS.debtToMonthlySales) {
    warnings.push(
      `借入金月商倍率${current.debtToMonthlySales.toFixed(1)}ヶ月が目標4ヶ月超`,
    );
  }

  if (!previous) {
    return {
      stance: 'stable',
      label: '初期',
      emoji: '🔄',
      message: '基準期です。次期以降の変化で攻め/守りが見えてきます。',
      warnings,
    };
  }

  const equityDown = current.equityRatio < previous.equityRatio - 0.02;
  const equityUp = current.equityRatio > previous.equityRatio + 0.02;
  const debtUp =
    current.interestBearingDebt > previous.interestBearingDebt * 1.1;
  const debtDown =
    current.interestBearingDebt < previous.interestBearingDebt * 0.9;
  const fixedAssetsUp = current.fixedAssets > previous.fixedAssets * 1.1;
  const cashUp = current.currentAssets > previous.currentAssets * 1.1;

  if (
    equityDown &&
    debtUp &&
    current.totalAssets < previous.totalAssets * 0.9
  ) {
    return {
      stance: 'crisis',
      label: '危機',
      emoji: '⚠️',
      message:
        '自己資本比率が下がり、借入が増え、資産規模も縮小しています。資金繰りに要注意。',
      warnings,
    };
  }
  if (debtUp && fixedAssetsUp) {
    return {
      stance: 'growth',
      label: '積極拡大',
      emoji: '🚀',
      message:
        '借入を活用して設備投資を進めている状態。リターンが伴えば良い攻めですが、需要見込みに要注意。',
      warnings,
    };
  }
  if (debtUp || equityDown) {
    return {
      stance: 'aggressive',
      label: '攻め',
      emoji: '⚔️',
      message: 'リスクを取って前進する体制。攻めの経営判断が続いています。',
      warnings,
    };
  }
  if (debtDown && equityUp && cashUp) {
    return {
      stance: 'defensive',
      label: '守り',
      emoji: '🛡️',
      message:
        '借入を減らし、自己資本と現金を厚くしている状態。安全性を最優先しています。',
      warnings,
    };
  }
  return {
    stance: 'stable',
    label: '安定',
    emoji: '📊',
    message: '大きな変化なく、現状維持の経営。',
    warnings,
  };
}
