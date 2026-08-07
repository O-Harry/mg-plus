import { CONSTANTS } from './constants';
import type { GameState, TurnResult } from '../types/game';

export type AdvisorContext = Record<string, string | number>;

/** 決算結果からテンプレート置換用の値を組み立てる */
export function buildAdvisorContext(
  state: GameState,
  result: TurnResult,
): AdvisorContext {
  const { pl, decision } = result;
  const revenue = Math.max(pl.revenue, 1);
  const grossMargin = Math.round((pl.grossProfit / revenue) * 100);
  const cumProfit = state.history.reduce(
    (s, r) => s + r.pl.operatingProfit,
    0,
  );
  const salary = state.employees * CONSTANTS.EMPLOYEE_SALARY_PER_TURN;
  const productivity = Math.round(
    (pl.operatingProfit + salary) / Math.max(state.employees, 1),
  );

  return {
    price: decision.unitPrice,
    demand: result.demandRealized,
    sold: result.salesQty,
    produced: decision.productionQty,
    grossMargin,
    brand: state.brandValue,
    cumProfit,
    cumOp: cumProfit,
    employees: state.employees,
    productivity,
    cash: state.cash,
    op: pl.operatingProfit,
    revenue: pl.revenue,
    netProfit: pl.netProfit,
  };
}

/** 意思決定前の助言用（現在の状態ベース） */
export function buildAdvisorContextBefore(state: GameState): AdvisorContext {
  const prev = state.history[state.history.length - 1];
  const cumProfit = state.history.reduce(
    (s, r) => s + r.pl.operatingProfit,
    0,
  );
  return {
    brand: state.brandValue,
    cash: state.cash,
    employees: state.employees,
    cumProfit,
    cumOp: cumProfit,
    price: prev?.decision.unitPrice ?? CONSTANTS.BASE_PRICE,
    demand: prev?.demandRealized ?? '—',
    sold: prev?.salesQty ?? '—',
    produced: prev?.decision.productionQty ?? '—',
    grossMargin: prev
      ? Math.round(
          (prev.pl.grossProfit / Math.max(prev.pl.revenue, 1)) * 100,
        )
      : '—',
    op: prev?.pl.operatingProfit ?? '—',
    productivity: '—',
  };
}

/** `{price}` のようなプレースホルダを置換 */
export function fillAdvisorTemplate(
  template: string,
  ctx: AdvisorContext,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = ctx[key];
    if (value === undefined || value === null) return `{${key}}`;
    if (typeof value === 'number') {
      return Number.isInteger(value)
        ? value.toLocaleString('ja-JP')
        : value.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
    }
    return String(value);
  });
}
