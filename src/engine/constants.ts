import type { Difficulty, GameState } from '../types/game';

export const DIFFICULTY_CONFIG = {
  easy: {
    cash: 70_000,
    material: 5_000,
    equipment: 40_000,
    shortDebt: 5_000,
    longDebt: 20_000,
    employees: 5,
    baseDemand: 250,
    demandVolatility: 0.1,
    recessionProb: 0.03,
    priceVolatility: 0,
  },
  normal: {
    cash: 50_000,
    material: 3_000,
    equipment: 40_000,
    shortDebt: 10_000,
    longDebt: 30_000,
    employees: 5,
    baseDemand: 200,
    demandVolatility: 0.2,
    recessionProb: 0.08,
    priceVolatility: 0.1,
  },
  hard: {
    cash: 30_000,
    material: 2_000,
    equipment: 40_000,
    shortDebt: 15_000,
    longDebt: 40_000,
    employees: 5,
    baseDemand: 160,
    demandVolatility: 0.3,
    recessionProb: 0.15,
    priceVolatility: 0.2,
  },
} as const;

export const CONSTANTS = {
  INITIAL_CAPITAL: 10_000,
  /** 千円/人/期 — 価格帯(BASE_PRICE≈8)で12期遊べるよう調整 */
  EMPLOYEE_SALARY_PER_TURN: 120,
  EMPLOYEE_CAPACITY: 50,
  EQUIPMENT_CAPACITY_RATIO: 0.0075,
  /** 期あたり定率。0.05だと減価が大きく常時赤字になるため調整 */
  DEPRECIATION_RATE: 0.015,
  MATERIAL_COST_PER_UNIT: 3,
  FIXED_SGA_BASE: 400,
  INVESTMENT_COST_EACH: 500,
  INTEREST_RATE_PER_TURN: 0.005,
  TAX_RATE: 0.3,
  BASE_PRICE: 8,
  RECEIVABLE_RATIO: 0.3,
  PAYABLE_RATIO: 0.2,
  TOTAL_TURNS: 12,
  BRAND_DECAY_PER_TURN: 2,
  BRAND_AD_BOOST: 15,
  BRAND_MAX: 100,
  EQUIPMENT_INVESTMENT_AMOUNT: 30_000,
  RD_BONUS_TURNS: 2,
  RD_COST_REDUCTION: 0.1,
  CASH_CRISIS_THRESHOLD: 5_000,
} as const;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '簡単',
  normal: '普通',
  hard: '難しい',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: '現預金に余裕あり。需要も安定。はじめての方向け。',
  normal: '町工場らしいバランス。標準的な経営難易度。',
  hard: '資金がタイト。需要の振れも大きく、不況も多い。',
};

export const DEFAULT_COMPANY_NAME = 'ハリー工業';

/** 資産 = 負債 + 純資産 が成立する初期状態を生成 */
export function createInitialState(
  companyName: string,
  difficulty: Difficulty,
): GameState {
  const config = DIFFICULTY_CONFIG[difficulty];
  const cash = config.cash;
  const materialInventory = config.material;
  const equipment = config.equipment;
  const shortTermDebt = config.shortDebt;
  const longTermDebt = config.longDebt;
  const capital = CONSTANTS.INITIAL_CAPITAL;

  const totalAssets = cash + materialInventory + equipment;
  const totalLiabilities = shortTermDebt + longTermDebt;
  const retainedEarnings = totalAssets - totalLiabilities - capital;

  return {
    currentTurn: 1,
    companyName: companyName.trim() || DEFAULT_COMPANY_NAME,
    difficulty,
    mode: 'free',
    scenarioId: undefined,
    totalTurns: CONSTANTS.TOTAL_TURNS,

    cash,
    accountsReceivable: 0,
    materialInventory,
    productInventory: 0,
    accountsPayable: 0,
    shortTermDebt,
    longTermDebt,
    equipment,
    accumulatedDepreciation: 0,
    capital,
    retainedEarnings,

    employees: config.employees,
    brandValue: 50,
    rdBonus: 0,
    rdPending: 0,
    materialUnitCost: CONSTANTS.MATERIAL_COST_PER_UNIT,
    productInventoryValue: 0,
    extraProductionCapacity: 0,

    history: [],
    eventLog: [],

    gameOver: false,
    gameOverReason: undefined,
    consecutiveLosses: 0,
    warningMessage: undefined,
  };
}
