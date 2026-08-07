import { createContext, useContext, type ReactNode } from 'react';
import { CONSTANTS } from '../engine/constants';
import type { BenchmarkMetric } from '../engine/industryBenchmarks';
import type { GameState, TurnResult } from '../types/game';

export type FinancialMetrics = Partial<Record<BenchmarkMetric, number>> & {
  revenue?: number;
  operatingProfit?: number;
  cash?: number;
};

const FinancialMetricsContext = createContext<FinancialMetrics | null>(null);

export function useFinancialMetrics(): FinancialMetrics | null {
  return useContext(FinancialMetricsContext);
}

export function FinancialMetricsProvider({
  children,
  metrics,
}: {
  children: ReactNode;
  metrics: FinancialMetrics | null;
}) {
  return (
    <FinancialMetricsContext.Provider value={metrics}>
      {children}
    </FinancialMetricsContext.Provider>
  );
}

/** 決算結果 + 期末状態から比較用指標を組み立てる */
export function buildFinancialMetrics(
  game: GameState,
  result: TurnResult,
): FinancialMetrics {
  const { pl, bs } = result;
  const revenue = Math.max(pl.revenue, 1);
  const salary = game.employees * CONSTANTS.EMPLOYEE_SALARY_PER_TURN;
  const laborProductivity =
    (pl.operatingProfit + salary) / Math.max(game.employees, 1);

  return {
    revenue: pl.revenue,
    operatingProfit: pl.operatingProfit,
    cash: bs.cash,
    operatingMargin: pl.operatingProfit / revenue,
    grossMargin: pl.grossProfit / revenue,
    sgaRatio: pl.sga / revenue,
    equityRatio: bs.equityRatio,
    laborProductivity,
  };
}
