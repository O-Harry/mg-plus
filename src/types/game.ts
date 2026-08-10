export type Difficulty = 'easy' | 'normal' | 'hard';

export type GameMode = 'free' | 'scenario';

export type ScenarioId = 'price-hike' | 'hiring' | 'post-boom';

export type ViewState =
  | 'title'
  | 'setup'
  | 'howto'
  | 'scenarioSelect'
  | 'scenarioBriefing'
  | 'demoPlayback'
  | 'dashboard'
  | 'decisions'
  | 'result'
  | 'scenarioResult'
  | 'final'
  | 'gameover';

export type Investment = 'ad' | 'equipment' | 'rd';

export type Decision = {
  materialPurchase: number;
  productionQty: number;
  unitPrice: number;
  employeeChange: number;
  investments: Investment[];
};

export type MarketEvent = {
  type:
    | 'boom'
    | 'recession'
    | 'special_order'
    | 'complaint'
    | 'material_price_up'
    | 'material_price_down'
    | 'neutral';
  message: string;
  demandMultiplier: number;
  costMultiplier: number;
};

export type PL = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  sga: number;
  operatingProfit: number;
  interestExpense: number;
  ordinaryProfit: number;
  tax: number;
  netProfit: number;
};

export type BS = {
  cash: number;
  accountsReceivable: number;
  inventory: number;
  totalCurrentAssets: number;
  equipment: number;
  totalAssets: number;
  accountsPayable: number;
  shortTermDebt: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  totalLiabilities: number;
  capital: number;
  retainedEarnings: number;
  totalEquity: number;
  equityRatio: number;
};

export type CF = {
  operating: number;
  investing: number;
  financing: number;
  netChange: number;
};

/** STRAC / MQ会計（変動費・固定費ベース） */
export type STRAC = {
  P: number;
  V: number;
  M: number;
  Q: number;
  PQ: number;
  VQ: number;
  MQ: number;
  F: number;
  G: number;
  marginRatio: number;
  laborShare: number;
  fixedCostBreakdown: {
    labor: number;
    depreciation: number;
    otherSga: number;
    interest: number;
  };
};

export type TurnResult = {
  turn: number;
  decision: Decision;
  event: MarketEvent | null;
  pl: PL;
  bs: BS;
  cf: CF;
  coachComment: string;
  demandRealized: number;
  salesQty: number;
  /** 旧セーブでは欠損しうる */
  strac?: STRAC;
};

export type GameState = {
  currentTurn: number;
  companyName: string;
  difficulty: Difficulty;
  mode: GameMode;
  scenarioId?: ScenarioId;
  /** フリー=12 / シナリオ=3 など */
  totalTurns: number;

  cash: number;
  accountsReceivable: number;
  materialInventory: number;
  productInventory: number;
  accountsPayable: number;
  shortTermDebt: number;
  longTermDebt: number;
  equipment: number;
  accumulatedDepreciation: number;
  capital: number;
  retainedEarnings: number;

  employees: number;
  brandValue: number;
  /** 原価低下ボーナスの残期数 (効果発動中) */
  rdBonus: number;
  /** 研究開発が効き始めるまでの待機期数 (次々期 = 2) */
  rdPending: number;
  materialUnitCost: number;
  /** 製品在庫の簿価合計 (千円) */
  productInventoryValue: number;
  /** 設備投資による追加生産能力 (個/期) */
  extraProductionCapacity: number;

  history: TurnResult[];
  eventLog: MarketEvent[];

  gameOver: boolean;
  gameOverReason?: string;
  consecutiveLosses: number;
  /** 3期連続赤字などの警告メッセージ */
  warningMessage?: string;
};

export type ScenarioResult = {
  success: boolean;
  score: number;
  message: string;
  keyLearning: string;
};

export type AdvisorPrompt = {
  turn: number;
  before: string[];
  after: string;
};

export type Scenario = {
  id: ScenarioId;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  learningFocus: string[];
  initialState: Partial<GameState>;
  turns: number;
  fixedDecisions?: Partial<Decision>[];
  scriptedEvents: MarketEvent[];
  advisorPrompts: AdvisorPrompt[];
  successCriteria: {
    description: string;
    evaluate: (finalState: GameState) => ScenarioResult;
  };
};
