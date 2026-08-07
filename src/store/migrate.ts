import { CONSTANTS } from '../engine/constants';
import type {
  Decision,
  GameMode,
  GameState,
  ScenarioId,
  ViewState,
} from '../types/game';

const VIEWS: ViewState[] = [
  'title',
  'setup',
  'howto',
  'scenarioSelect',
  'scenarioBriefing',
  'dashboard',
  'decisions',
  'result',
  'scenarioResult',
  'final',
  'gameover',
];

const SCENARIO_IDS: ScenarioId[] = ['price-hike', 'hiring', 'post-boom'];

/** 古いセーブに欠けているフィールドを補完 */
export function normalizeGameState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Partial<GameState>;
  if (typeof g.companyName !== 'string' || typeof g.cash !== 'number') {
    return null;
  }

  const mode: GameMode = g.mode === 'scenario' ? 'scenario' : 'free';
  const scenarioId =
    g.scenarioId && SCENARIO_IDS.includes(g.scenarioId)
      ? g.scenarioId
      : undefined;

  return {
    currentTurn: typeof g.currentTurn === 'number' ? g.currentTurn : 1,
    companyName: g.companyName,
    difficulty: g.difficulty ?? 'normal',
    mode,
    scenarioId: mode === 'scenario' ? scenarioId : undefined,
    totalTurns:
      typeof g.totalTurns === 'number'
        ? g.totalTurns
        : mode === 'scenario'
          ? 3
          : CONSTANTS.TOTAL_TURNS,

    cash: g.cash,
    accountsReceivable: g.accountsReceivable ?? 0,
    materialInventory: g.materialInventory ?? 0,
    productInventory: g.productInventory ?? 0,
    accountsPayable: g.accountsPayable ?? 0,
    shortTermDebt: g.shortTermDebt ?? 0,
    longTermDebt: g.longTermDebt ?? 0,
    equipment: g.equipment ?? 0,
    accumulatedDepreciation: g.accumulatedDepreciation ?? 0,
    capital: g.capital ?? CONSTANTS.INITIAL_CAPITAL,
    retainedEarnings: g.retainedEarnings ?? 0,

    employees: g.employees ?? 5,
    brandValue: g.brandValue ?? 50,
    rdBonus: g.rdBonus ?? 0,
    rdPending: g.rdPending ?? 0,
    materialUnitCost:
      g.materialUnitCost ?? CONSTANTS.MATERIAL_COST_PER_UNIT,
    productInventoryValue: g.productInventoryValue ?? 0,
    extraProductionCapacity: g.extraProductionCapacity ?? 0,

    history: Array.isArray(g.history) ? g.history : [],
    eventLog: Array.isArray(g.eventLog) ? g.eventLog : [],

    gameOver: Boolean(g.gameOver),
    gameOverReason: g.gameOverReason,
    consecutiveLosses: g.consecutiveLosses ?? 0,
    warningMessage: g.warningMessage,
  };
}

export function normalizeView(view: unknown, game: GameState | null): ViewState {
  const v = VIEWS.includes(view as ViewState) ? (view as ViewState) : 'title';
  if (!game) {
    if (
      v === 'howto' ||
      v === 'setup' ||
      v === 'title' ||
      v === 'scenarioSelect'
    ) {
      return v;
    }
    return 'title';
  }
  if (game.gameOver && (v === 'dashboard' || v === 'decisions')) {
    return 'gameover';
  }
  const maxTurns = game.totalTurns || CONSTANTS.TOTAL_TURNS;
  if (
    !game.gameOver &&
    game.history.length >= maxTurns &&
    (v === 'dashboard' || v === 'decisions')
  ) {
    return game.mode === 'scenario' ? 'scenarioResult' : 'final';
  }
  return v;
}

export function normalizeDecision(raw: unknown): Decision | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<Decision>;
  return {
    materialPurchase: d.materialPurchase ?? 0,
    productionQty: d.productionQty ?? 0,
    unitPrice: d.unitPrice ?? CONSTANTS.BASE_PRICE,
    employeeChange: d.employeeChange ?? 0,
    investments: Array.isArray(d.investments) ? d.investments : [],
  };
}

export type PersistedSlice = {
  view: ViewState;
  game: GameState | null;
  lastDecision: Decision | null;
  savedAt: number | null;
};
