import { calculateDemand, getProductionLimits } from './calculations';
import { CONSTANTS } from './constants';
import type { Decision, GameState, MarketEvent } from '../types/game';

const NEUTRAL: MarketEvent = {
  type: 'neutral',
  message: '',
  demandMultiplier: 1,
  costMultiplier: 1,
};

export type DecisionPreview = {
  employeesAfter: number;
  unitCost: number;
  /** 材料+労務の目安原価（価格レンジ用） */
  estimatedUnitCost: number;
  maxPurchase: number;
  maxProduction: number;
  productionCap: {
    labor: number;
    equipment: number;
    material: number;
  };
  priceMin: number;
  priceMax: number;
  expectedDemand: number;
  expectedSales: number;
  expectedRevenue: number;
  expectedCash: number;
  cashDelta: number;
  investmentCash: number;
  affordWarning: string | null;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 仕様の「単位原価」= 材料単価 + 労務単価目安 */
export function estimatedManufacturingUnitCost(
  materialUnitCost: number,
): number {
  const laborPerUnit =
    CONSTANTS.EMPLOYEE_SALARY_PER_TURN / CONSTANTS.EMPLOYEE_CAPACITY;
  return materialUnitCost + laborPerUnit;
}

function priceRange(materialUnitCost: number): { min: number; max: number } {
  const unit = estimatedManufacturingUnitCost(materialUnitCost);
  const min = Math.max(0.5, Math.round(unit * 0.8 * 10) / 10);
  const max = Math.max(min + 0.1, Math.round(unit * 3 * 10) / 10);
  return { min, max };
}

/** UI用のリアルタイム予想（イベント・乱数なしの中央値想定） */
export function estimateDecisionPreview(
  state: GameState,
  decision: Decision,
): DecisionPreview {
  const maxPurchase = Math.floor(Math.max(0, state.cash) * 0.8);
  const materialPurchase = clamp(decision.materialPurchase, 0, maxPurchase);
  const employeeChange = clamp(decision.employeeChange, -2, 2);
  const employeesAfter = Math.max(1, state.employees + employeeChange);

  const unitCost =
    state.materialUnitCost *
    (state.rdBonus > 0 ? 1 - CONSTANTS.RD_COST_REDUCTION : 1);
  const estimatedUnitCost = estimatedManufacturingUnitCost(unitCost);

  const materialAfter = state.materialInventory + materialPurchase;
  const caps = getProductionLimits(
    state,
    employeesAfter,
    unitCost,
    materialAfter,
  );
  const productionQty = clamp(Math.floor(decision.productionQty), 0, caps.max);

  const { min: priceMin, max: priceMax } = priceRange(unitCost);
  const unitPrice = clamp(decision.unitPrice, priceMin, priceMax);

  const expectedDemand = calculateDemand(
    { ...state, employees: employeesAfter },
    unitPrice,
    NEUTRAL,
    () => 0.5,
  );
  const availableProducts = state.productInventory + productionQty;
  const expectedSales = Math.min(expectedDemand, availableProducts);
  const expectedRevenue = Math.round(expectedSales * unitPrice);

  const investmentCash =
    decision.investments.length * CONSTANTS.INVESTMENT_COST_EACH;
  const purchaseCash = Math.round(
    materialPurchase * (1 - CONSTANTS.PAYABLE_RATIO),
  );
  const labor = employeesAfter * CONSTANTS.EMPLOYEE_SALARY_PER_TURN;
  const interest = Math.round(
    (state.shortTermDebt + state.longTermDebt) *
      CONSTANTS.INTEREST_RATE_PER_TURN,
  );
  const cashIn =
    state.accountsReceivable +
    Math.round(expectedRevenue * (1 - CONSTANTS.RECEIVABLE_RATIO));
  const cashOut =
    state.accountsPayable +
    purchaseCash +
    labor +
    CONSTANTS.FIXED_SGA_BASE +
    investmentCash +
    interest;

  const expectedCash = Math.round(state.cash + cashIn - cashOut);
  const cashDelta = expectedCash - state.cash;

  let affordWarning: string | null = null;
  const immediateOut = purchaseCash + investmentCash;
  if (immediateOut > state.cash + state.accountsReceivable) {
    affordWarning = '仕入・投資が手元資金に対して大きすぎる可能性があります';
  } else if (expectedCash < CONSTANTS.CASH_CRISIS_THRESHOLD) {
    affordWarning = '期末現金がかなり少なくなりそうです';
  }

  const equipBoost = decision.investments.includes('equipment') ? 300 : 0;

  return {
    employeesAfter,
    unitCost: Math.round(unitCost * 100) / 100,
    estimatedUnitCost: Math.round(estimatedUnitCost * 100) / 100,
    maxPurchase,
    maxProduction: caps.max,
    productionCap: {
      labor: caps.labor,
      equipment: caps.equipment + equipBoost,
      material: caps.material,
    },
    priceMin,
    priceMax,
    expectedDemand,
    expectedSales,
    expectedRevenue,
    expectedCash,
    cashDelta,
    investmentCash,
    affordWarning,
  };
}

/**
 * 期初の意思決定初期値。
 * 前期の仕入・生産・価格を引き継ぎ、今期の上限内にクリップする。
 */
export function createDefaultDecision(
  state: GameState,
  previous?: Decision | null,
): Decision {
  const prev =
    previous ?? state.history[state.history.length - 1]?.decision ?? null;

  const maxPurchase = Math.floor(Math.max(0, state.cash) * 0.8);
  const unitCost =
    state.materialUnitCost *
    (state.rdBonus > 0 ? 1 - CONSTANTS.RD_COST_REDUCTION : 1);
  const { min: priceMin, max: priceMax } = priceRange(unitCost);

  const fallbackPurchase = Math.min(
    maxPurchase,
    Math.max(0, Math.round(employeesMaterialBudget(state))),
  );
  const materialPurchase = clamp(
    prev?.materialPurchase ?? fallbackPurchase,
    0,
    maxPurchase,
  );

  const employees = state.employees;
  const caps = getProductionLimits(
    state,
    employees,
    unitCost,
    state.materialInventory + materialPurchase,
  );
  const fallbackProduction = Math.min(
    caps.max,
    Math.floor(caps.max * 0.75),
  );
  const productionQty = clamp(
    prev?.productionQty ?? fallbackProduction,
    0,
    caps.max,
  );

  const mid = Math.round(((priceMin + priceMax) / 2) * 10) / 10;
  const fallbackPrice =
    CONSTANTS.BASE_PRICE >= priceMin && CONSTANTS.BASE_PRICE <= priceMax
      ? CONSTANTS.BASE_PRICE
      : mid;
  const unitPrice = clamp(prev?.unitPrice ?? fallbackPrice, priceMin, priceMax);

  return {
    materialPurchase,
    productionQty,
    unitPrice,
    // 人員・投資は毎期ゼロから（意図的な操作）
    employeeChange: 0,
    investments: [],
  };
}

function employeesMaterialBudget(state: GameState): number {
  const need =
    state.employees *
    CONSTANTS.EMPLOYEE_CAPACITY *
    state.materialUnitCost *
    0.55;
  return need;
}
