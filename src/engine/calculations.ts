import { generateCoachComment } from './coach';
import { CONSTANTS, DIFFICULTY_CONFIG } from './constants';
import { generateMarketEvent } from './events';
import { calculateSTRAC } from './strac';
import type {
  BS,
  CF,
  Decision,
  GameState,
  Investment,
  MarketEvent,
  PL,
  TurnResult,
} from '../types/game';

type Rng = () => number;

export type TurnExecution = {
  state: GameState;
  result: TurnResult;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function roundYen(n: number): number {
  return Math.round(n);
}

/** 設備の簿価 (取得価額 - 減価償却累計) */
export function netEquipment(
  state: Pick<GameState, 'equipment' | 'accumulatedDepreciation'>,
): number {
  return Math.max(0, state.equipment - state.accumulatedDepreciation);
}

export function inventoryYen(
  state: Pick<GameState, 'materialInventory' | 'productInventoryValue'>,
): number {
  return state.materialInventory + state.productInventoryValue;
}

export function buildBS(state: GameState): BS {
  const equipmentNet = netEquipment(state);
  const inventory = inventoryYen(state);
  const totalCurrentAssets =
    state.cash + state.accountsReceivable + inventory;
  const totalAssets = totalCurrentAssets + equipmentNet;
  const totalCurrentLiabilities =
    state.accountsPayable + state.shortTermDebt;
  const totalLiabilities = totalCurrentLiabilities + state.longTermDebt;
  const totalEquity = state.capital + state.retainedEarnings;
  const equityRatio = totalAssets > 0 ? totalEquity / totalAssets : 0;

  return {
    cash: state.cash,
    accountsReceivable: state.accountsReceivable,
    inventory,
    totalCurrentAssets,
    equipment: equipmentNet,
    totalAssets,
    accountsPayable: state.accountsPayable,
    shortTermDebt: state.shortTermDebt,
    totalCurrentLiabilities,
    longTermDebt: state.longTermDebt,
    totalLiabilities,
    capital: state.capital,
    retainedEarnings: state.retainedEarnings,
    totalEquity,
    equityRatio,
  };
}

/** 資産 = 負債 + 純資産 を検証 */
export function assertBalanceSheet(bs: BS, context = ''): void {
  const rhs = bs.totalLiabilities + bs.totalEquity;
  const diff = Math.abs(bs.totalAssets - rhs);
  if (diff > 1) {
    throw new Error(
      `BS unbalanced ${context}: assets=${bs.totalAssets} liab+equity=${rhs} diff=${diff}`,
    );
  }
}

export function calculateDemand(
  state: GameState,
  price: number,
  event: MarketEvent,
  rng: Rng = Math.random,
): number {
  const config = DIFFICULTY_CONFIG[state.difficulty];
  const safePrice = Math.max(price, 0.1);
  const brandBoost = 1 + state.brandValue / 200;
  const priceElasticity = Math.pow(CONSTANTS.BASE_PRICE / safePrice, 1.5);
  const noise = 1 + (rng() - 0.5) * 2 * config.demandVolatility;
  return Math.max(
    0,
    Math.floor(
      config.baseDemand *
        event.demandMultiplier *
        brandBoost *
        priceElasticity *
        noise,
    ),
  );
}

export function getProductionLimits(
  state: GameState,
  employees: number,
  materialUnitCost: number,
  materialInventory: number,
): { labor: number; equipment: number; material: number; max: number } {
  const labor = employees * CONSTANTS.EMPLOYEE_CAPACITY;
  const equipment =
    Math.floor(netEquipment(state) * CONSTANTS.EQUIPMENT_CAPACITY_RATIO) +
    state.extraProductionCapacity;
  const material = Math.floor(
    materialInventory / Math.max(materialUnitCost, 0.1),
  );
  return {
    labor,
    equipment,
    material,
    max: Math.max(0, Math.min(labor, equipment, material)),
  };
}

export function companyValueScore(state: GameState): number {
  const bs = buildBS(state);
  const recent = state.history.slice(-3);
  const avgNet =
    recent.length === 0
      ? 0
      : recent.reduce((s, r) => s + r.pl.netProfit, 0) / recent.length;
  return roundYen(bs.totalEquity + avgNet * 5);
}

function uniqueInvestments(list: Investment[]): Investment[] {
  return [...new Set(list)].filter(
    (i): i is Investment => i === 'ad' || i === 'equipment' || i === 'rd',
  );
}

export type RunTurnOptions = {
  /** 指定時はランダム生成せずこのイベントを使う (シナリオ用) */
  event?: MarketEvent;
  rng?: Rng;
  /** true で材料単価の難易度ボラティリティを無効化 */
  skipPriceVolatility?: boolean;
};

/**
 * 1期分の経営シミュレーションを実行する。
 * 終了後の state.currentTurn は「次にプレイする期」(最終期クリア時は totalTurns のまま)。
 */
export function runTurn(
  state: GameState,
  rawDecision: Decision,
  rngOrOptions: Rng | RunTurnOptions = Math.random,
): TurnExecution {
  if (state.gameOver) {
    throw new Error('Game is already over');
  }

  const options: RunTurnOptions =
    typeof rngOrOptions === 'function' ? { rng: rngOrOptions } : rngOrOptions;
  const rng = options.rng ?? Math.random;

  const turn = state.currentTurn;
  const cashStart = state.cash;
  const totalTurns = state.totalTurns || CONSTANTS.TOTAL_TURNS;

  const investments = uniqueInvestments(rawDecision.investments);
  const employeeChange = clamp(rawDecision.employeeChange, -2, 2);
  const employees = Math.max(1, state.employees + employeeChange);

  const maxPurchase = Math.floor(Math.max(0, state.cash) * 0.8);
  const materialPurchase = clamp(
    roundYen(rawDecision.materialPurchase),
    0,
    maxPurchase,
  );

  const event =
    options.event ?? generateMarketEvent(state.difficulty, rng);
  const config = DIFFICULTY_CONFIG[state.difficulty];

  // 材料単価: 前期ベース × ボラティリティ × イベント × R&D
  let baseUnitCost = state.materialUnitCost;
  if (!options.skipPriceVolatility && config.priceVolatility > 0) {
    baseUnitCost *= 1 + (rng() - 0.5) * 2 * config.priceVolatility;
  }
  baseUnitCost = Math.max(0.5, Math.round(baseUnitCost * 100) / 100);

  let effectiveUnitCost = baseUnitCost * event.costMultiplier;
  if (state.rdBonus > 0) {
    effectiveUnitCost *= 1 - CONSTANTS.RD_COST_REDUCTION;
  }
  effectiveUnitCost = Math.max(
    0.5,
    Math.round(effectiveUnitCost * 100) / 100,
  );

  let cash = state.cash;
  let accountsReceivable = state.accountsReceivable;
  let accountsPayable = state.accountsPayable;
  let materialInventory = state.materialInventory;
  let productInventory = state.productInventory;
  let productInventoryValue = state.productInventoryValue;
  let equipment = state.equipment;
  let accumulatedDepreciation = state.accumulatedDepreciation;
  let shortTermDebt = state.shortTermDebt;
  let longTermDebt = state.longTermDebt;
  let brandValue = state.brandValue;
  let rdBonus = state.rdBonus;
  let rdPending = state.rdPending;
  let extraProductionCapacity = state.extraProductionCapacity;
  let retainedEarnings = state.retainedEarnings;

  // 期首: 前期売掛回収・買掛支払
  cash += accountsReceivable;
  accountsReceivable = 0;
  cash -= accountsPayable;
  accountsPayable = 0;

  // 1. 材料仕入
  const purchaseCash = roundYen(
    materialPurchase * (1 - CONSTANTS.PAYABLE_RATIO),
  );
  const purchasePayable = materialPurchase - purchaseCash;
  materialInventory += materialPurchase;
  cash -= purchaseCash;
  accountsPayable += purchasePayable;

  // 減価償却 (投資前の簿価)
  const bookBefore = Math.max(0, equipment - accumulatedDepreciation);
  const depreciation = roundYen(bookBefore * CONSTANTS.DEPRECIATION_RATE);
  accumulatedDepreciation += depreciation;

  // 人員コスト (現金)
  const laborCost = employees * CONSTANTS.EMPLOYEE_SALARY_PER_TURN;
  cash -= laborCost;

  // 2. 生産
  const limits = getProductionLimits(
    {
      ...state,
      equipment,
      accumulatedDepreciation,
      extraProductionCapacity,
    },
    employees,
    effectiveUnitCost,
    materialInventory,
  );
  const productionQty = clamp(
    Math.floor(rawDecision.productionQty),
    0,
    limits.max,
  );

  const materialConsumed = roundYen(productionQty * effectiveUnitCost);
  materialInventory = Math.max(0, materialInventory - materialConsumed);

  // 3. 原価 (吸収原価: 材料+労務+減価)
  let periodCostInSga = 0;
  if (productionQty > 0) {
    const mfgCost = materialConsumed + laborCost + depreciation;
    productInventory += productionQty;
    productInventoryValue += mfgCost;
  } else {
    // 生産ゼロなら労務・減価は期間費用
    periodCostInSga = laborCost + depreciation;
  }

  // 4. 販売
  const unitPrice = Math.max(0.1, rawDecision.unitPrice);
  const demandRealized = calculateDemand(
    { ...state, brandValue, employees },
    unitPrice,
    event,
    rng,
  );
  const salesQty = Math.min(demandRealized, productInventory);
  let revenue = 0;
  let cogs = 0;

  if (salesQty > 0 && productInventory > 0) {
    revenue = roundYen(salesQty * unitPrice);
    const avgCost = productInventoryValue / productInventory;
    cogs = roundYen(salesQty * avgCost);
    productInventory -= salesQty;
    productInventoryValue = Math.max(
      0,
      roundYen(productInventoryValue - cogs),
    );
    if (productInventory === 0) productInventoryValue = 0;

    const cashSales = roundYen(revenue * (1 - CONSTANTS.RECEIVABLE_RATIO));
    accountsReceivable = revenue - cashSales;
    cash += cashSales;
  }

  // 5. 販管費 (PL上は広告・研究も含める。現金は固定を先に、投資分は後で)
  const fixedSga = CONSTANTS.FIXED_SGA_BASE;
  const adExpense = investments.includes('ad')
    ? CONSTANTS.INVESTMENT_COST_EACH
    : 0;
  const rdExpense = investments.includes('rd')
    ? CONSTANTS.INVESTMENT_COST_EACH
    : 0;
  const didAdvertise = adExpense > 0;
  const sga = fixedSga + adExpense + rdExpense + periodCostInSga;
  cash -= fixedSga;

  // 7. 支払利息 (設備投資の借入増の前)
  const interestExpense = roundYen(
    (shortTermDebt + longTermDebt) * CONSTANTS.INTEREST_RATE_PER_TURN,
  );
  cash -= interestExpense;

  const grossProfit = revenue - cogs;
  const operatingProfit = grossProfit - sga;
  const ordinaryProfit = operatingProfit - interestExpense;

  // 8. 税金
  const tax =
    ordinaryProfit > 0
      ? roundYen(ordinaryProfit * CONSTANTS.TAX_RATE)
      : 0;
  cash -= tax;
  const netProfit = ordinaryProfit - tax;
  retainedEarnings += netProfit;

  // 9. 追加投資の現金・BS処理
  let investingOutflow = 0;
  let financingInflow = 0;

  for (const inv of investments) {
    if (inv === 'ad') {
      cash -= CONSTANTS.INVESTMENT_COST_EACH;
      investingOutflow += CONSTANTS.INVESTMENT_COST_EACH;
    } else if (inv === 'rd') {
      cash -= CONSTANTS.INVESTMENT_COST_EACH;
      investingOutflow += CONSTANTS.INVESTMENT_COST_EACH;
      rdPending = CONSTANTS.RD_BONUS_TURNS;
    } else if (inv === 'equipment') {
      // 頭金500 + 長期借入29,500 で設備30,000取得 → BS整合
      const down = CONSTANTS.INVESTMENT_COST_EACH;
      const amount = CONSTANTS.EQUIPMENT_INVESTMENT_AMOUNT;
      const financed = amount - down;
      cash -= down;
      equipment += amount;
      longTermDebt += financed;
      investingOutflow += down;
      financingInflow += financed;
      const fromBook = Math.floor(amount * CONSTANTS.EQUIPMENT_CAPACITY_RATIO);
      extraProductionCapacity += Math.max(0, 300 - fromBook);
    }
  }

  // 13. ブランド減衰 / 広告
  brandValue = clamp(
    brandValue -
      CONSTANTS.BRAND_DECAY_PER_TURN +
      (didAdvertise ? CONSTANTS.BRAND_AD_BOOST : 0),
    0,
    CONSTANTS.BRAND_MAX,
  );

  // R&D: 期末にタイマー更新
  if (rdBonus > 0) rdBonus -= 1;
  if (rdPending > 0) {
    rdPending -= 1;
    if (rdPending === 0) {
      rdBonus = CONSTANTS.RD_BONUS_TURNS;
    }
  }

  const consecutiveLosses =
    netProfit < 0 ? state.consecutiveLosses + 1 : 0;
  const warningMessage =
    consecutiveLosses >= 3
      ? '事業継続困難の警告: 3期連続で赤字です。経営方針の見直しを。'
      : undefined;

  let gameOver = false;
  let gameOverReason: string | undefined;
  if (cash < 0) {
    gameOver = true;
    gameOverReason = '資金ショート';
  }

  const nextTurn = turn + 1;
  const finishedAllTurns = !gameOver && nextTurn > totalTurns;

  const nextStateBase: GameState = {
    ...state,
    currentTurn: gameOver || finishedAllTurns ? turn : nextTurn,
    cash: roundYen(cash),
    accountsReceivable: roundYen(accountsReceivable),
    accountsPayable: roundYen(accountsPayable),
    materialInventory: roundYen(materialInventory),
    productInventory,
    productInventoryValue: roundYen(productInventoryValue),
    equipment: roundYen(equipment),
    accumulatedDepreciation: roundYen(accumulatedDepreciation),
    shortTermDebt: roundYen(shortTermDebt),
    longTermDebt: roundYen(longTermDebt),
    retainedEarnings: roundYen(retainedEarnings),
    employees,
    brandValue,
    rdBonus,
    rdPending,
    extraProductionCapacity,
    materialUnitCost: baseUnitCost,
    consecutiveLosses,
    warningMessage,
    gameOver,
    gameOverReason,
    eventLog: [...state.eventLog, event],
    history: state.history,
  };

  const pl: PL = {
    revenue: roundYen(revenue),
    cogs: roundYen(cogs),
    grossProfit: roundYen(grossProfit),
    sga: roundYen(sga),
    operatingProfit: roundYen(operatingProfit),
    interestExpense: roundYen(interestExpense),
    ordinaryProfit: roundYen(ordinaryProfit),
    tax: roundYen(tax),
    netProfit: roundYen(netProfit),
  };

  const bs = buildBS(nextStateBase);
  assertBalanceSheet(bs, `turn ${turn}`);

  const cashEnd = nextStateBase.cash;
  const netChange = roundYen(cashEnd - cashStart);
  const cf: CF = {
    investing: roundYen(-investingOutflow),
    financing: roundYen(financingInflow),
    netChange,
    operating: roundYen(netChange + investingOutflow - financingInflow),
  };

  const decision: Decision = {
    materialPurchase,
    productionQty,
    unitPrice,
    employeeChange,
    investments,
  };

  const strac = calculateSTRAC(
    pl,
    salesQty,
    unitPrice,
    employees,
    depreciation,
  );

  const resultDraft: TurnResult = {
    turn,
    decision,
    event,
    pl,
    bs,
    cf,
    coachComment: '',
    demandRealized,
    salesQty,
    strac,
  };

  const withHistory: GameState = {
    ...nextStateBase,
    history: [...state.history, resultDraft],
  };
  const coachComment = generateCoachComment(withHistory, resultDraft);
  const result: TurnResult = { ...resultDraft, coachComment };
  const finalState: GameState = {
    ...nextStateBase,
    history: [...state.history, result],
  };

  return { state: finalState, result };
}
