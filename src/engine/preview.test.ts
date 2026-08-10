import { describe, expect, it } from 'vitest';
import { createInitialState } from './constants';
import { createDefaultDecision } from './preview';
import type { Decision } from '../types/game';

describe('createDefaultDecision', () => {
  it('前期の仕入・生産・価格を初期値として引き継ぐ', () => {
    const state = createInitialState('継承工業', 'normal');
    const prev: Decision = {
      materialPurchase: 5_000,
      productionQty: 150,
      unitPrice: 90,
      employeeChange: 1,
      investments: ['ad'],
    };

    // 前期決算後の状態を模す
    const afterTurn1 = {
      ...state,
      currentTurn: 2,
      history: [
        {
          turn: 1,
          decision: prev,
          event: null,
          pl: {
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            sga: 0,
            operatingProfit: 0,
            interestExpense: 0,
            ordinaryProfit: 0,
            tax: 0,
            netProfit: 0,
          },
          bs: {
            cash: state.cash,
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
          demandRealized: 0,
          salesQty: 0,
        },
      ],
    };

    const next = createDefaultDecision(afterTurn1);
    expect(next.unitPrice).toBe(90);
    expect(next.materialPurchase).toBe(5_000);
    expect(next.productionQty).toBe(150);
    // 人員・投資は引き継がない
    expect(next.employeeChange).toBe(0);
    expect(next.investments).toEqual([]);
  });
});
