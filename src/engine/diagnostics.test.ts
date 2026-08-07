import { describe, expect, it } from 'vitest';
import type { Decision, PL, TurnResult } from '../types/game';
import { diagnosePriceHike, diagnoseHiring } from './diagnostics';

function makeTurn(
  turn: number,
  overrides: {
    unitPrice?: number;
    productionQty?: number;
    salesQty?: number;
    demandRealized?: number;
    operatingProfit?: number;
    revenue?: number;
    grossProfit?: number;
  } = {},
): TurnResult {
  const unitPrice = overrides.unitPrice ?? 8;
  const salesQty = overrides.salesQty ?? 100;
  const revenue = overrides.revenue ?? unitPrice * salesQty;
  const grossProfit = overrides.grossProfit ?? revenue * 0.25;
  const decision: Decision = {
    materialPurchase: 500,
    productionQty: overrides.productionQty ?? 100,
    unitPrice,
    employeeChange: 0,
    investments: [],
  };
  const pl: PL = {
    revenue,
    cogs: revenue - grossProfit,
    grossProfit,
    sga: 400,
    operatingProfit: overrides.operatingProfit ?? 100,
    interestExpense: 0,
    ordinaryProfit: overrides.operatingProfit ?? 100,
    tax: 0,
    netProfit: overrides.operatingProfit ?? 100,
  };
  return {
    turn,
    decision,
    event: null,
    pl,
    bs: {
      cash: 0,
      accountsReceivable: 0,
      inventory: 0,
      totalCurrentAssets: 0,
      equipment: 0,
      totalAssets: 0,
      accountsPayable: 0,
      shortTermDebt: 0,
      totalCurrentLiabilities: 0,
      longTermDebt: 0,
      totalLiabilities: 0,
      capital: 0,
      retainedEarnings: 0,
      totalEquity: 0,
      equityRatio: 0,
    },
    cf: { operating: 0, investing: 0, financing: 0, netChange: 0 },
    coachComment: '',
    demandRealized: overrides.demandRealized ?? salesQty,
    salesQty,
  };
}

describe('diagnosePriceHike', () => {
  it('据置→後から値上げで「判断が遅れた」', () => {
    const turns = [
      makeTurn(1, { unitPrice: 8, operatingProfit: -500 }),
      makeTurn(2, { unitPrice: 8, operatingProfit: -200 }),
      makeTurn(3, { unitPrice: 10, operatingProfit: 100, grossProfit: 500, revenue: 2000 }),
    ];
    const d = diagnosePriceHike(turns);
    expect(d.pattern).toBe('値上げの判断が遅れた');
  });

  it('ほぼ値上げなしパターン', () => {
    const turns = [
      makeTurn(1, { unitPrice: 8 }),
      makeTurn(2, { unitPrice: 8.2 }),
      makeTurn(3, { unitPrice: 8.1, revenue: 1000, grossProfit: 100 }),
    ];
    const d = diagnosePriceHike(turns);
    expect(d.pattern).toBe('値上げをほぼ行わなかった');
  });

  it('過剰値上げで需要減', () => {
    const turns = [
      makeTurn(1, { unitPrice: 11, demandRealized: 80 }),
      makeTurn(2, { unitPrice: 11.5, demandRealized: 70 }),
      makeTurn(3, {
        unitPrice: 12,
        demandRealized: 50,
        revenue: 600,
        grossProfit: 300,
      }),
    ];
    const d = diagnosePriceHike(turns);
    expect(d.pattern).toBe('過剰な値上げで需要が減った');
  });
});

describe('diagnoseHiring', () => {
  it('採用せず機会損失', () => {
    const turns = [
      makeTurn(1, { demandRealized: 200, salesQty: 100 }),
      makeTurn(2, { demandRealized: 200, salesQty: 100 }),
      makeTurn(3, { demandRealized: 200, salesQty: 100 }),
    ];
    const d = diagnoseHiring(turns, {
      employees: 5,
    } as never);
    expect(d.pattern).toBe('採用を見送り、機会損失が発生');
  });
});
