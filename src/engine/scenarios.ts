import { buildBS, netEquipment } from './calculations';
import { CONSTANTS, createInitialState, DEFAULT_COMPANY_NAME } from './constants';
import type { GameState, Scenario, ScenarioResult } from '../types/game';

const salary = CONSTANTS.EMPLOYEE_SALARY_PER_TURN;

export const SCENARIOS: Scenario[] = [
  {
    id: 'price-hike',
    title: '値上げの決断',
    difficulty: 'beginner',
    description:
      '材料費が20%上昇。売上規模を守りつつ、価格戦略で粗利と営業利益率を取り戻せ。3期で戦え。',
    learningFocus: ['価格弾力性', '粗利率の維持', 'ブランド影響'],
    initialState: {
      cash: 30_000,
      accountsReceivable: 8_000,
      materialInventory: 4_000,
      productInventory: 0,
      productInventoryValue: 0,
      accountsPayable: 2_000,
      shortTermDebt: 10_000,
      longTermDebt: 20_000,
      equipment: 40_000,
      accumulatedDepreciation: 5_000,
      capital: 10_000,
      retainedEarnings: 35_000,
      employees: 6,
      brandValue: 40,
      rdBonus: 0,
      materialUnitCost: CONSTANTS.MATERIAL_COST_PER_UNIT,
    },
    turns: 3,
    scriptedEvents: [
      {
        type: 'material_price_up',
        message: '材料仕入価格が20%上昇しています',
        demandMultiplier: 1.0,
        costMultiplier: 1.2,
      },
      {
        type: 'neutral',
        message: '市場は落ち着いています',
        demandMultiplier: 1.0,
        costMultiplier: 1.2,
      },
      {
        type: 'neutral',
        message: '材料価格は高止まりのままです',
        demandMultiplier: 1.0,
        costMultiplier: 1.2,
      },
    ],
    advisorPrompts: [
      {
        turn: 1,
        before: [
          '材料費が20%上がりました。あなたの粗利率を守るには、どんな選択肢がありますか?',
          '販売価格を上げる、生産量を減らす、コスト削減、それとも一時的に粗利を犠牲にする?',
          '価格を上げると需要は減る可能性があります。どこまで受け入れられますか?',
        ],
        after:
          '価格を{price}千円に設定しました。実現需要は{demand}個。粗利率は{grossMargin}%。業界平均25%と比べてどうでしょう?',
      },
      {
        turn: 2,
        before: [
          '2期目です。前期の結果を踏まえて、価格戦略を続けますか?変えますか?',
          'ブランド値は{brand}。ブランドが強いほど、価格を上げても需要が落ちにくくなります。',
        ],
        after:
          '2期連続の価格{price}千円。累積の営業利益は{cumProfit}千円。目標達成へ進んでいますか?',
      },
      {
        turn: 3,
        before: [
          '最終期です。3期目の営業利益率5%以上が目標。今の路線で達成できそうですか?',
          '最後の一手で、価格・生産量・投資、どこを動かしますか?',
        ],
        after:
          'シナリオ終了。最終価格{price}千円、需要{demand}個、累積営業利益{cumProfit}千円。総合評価を確認しましょう。',
      },
    ],
    successCriteria: {
      description: '3期目の営業利益率が5%以上',
      evaluate: (state) => {
        const lastPL = state.history[state.history.length - 1]?.pl;
        const margin = lastPL
          ? lastPL.operatingProfit / Math.max(lastPL.revenue, 1)
          : 0;
        const score = Math.min(100, Math.max(0, Math.round(margin * 1000)));
        return {
          success: margin >= 0.05,
          score,
          message:
            margin >= 0.05
              ? `営業利益率${(margin * 100).toFixed(1)}%を維持。値上げ判断が奏功しました。`
              : `営業利益率${(margin * 100).toFixed(1)}%。値上げの遅れや過剰値上げが粗利を圧迫した可能性があります。`,
          keyLearning:
            '材料費上昇時、粗利率を守るには「同率以上の値上げ」か「原価削減」しかない。値上げは需要減リスクを伴うが、粗利を犠牲にすると赤字体質になる。',
        };
      },
    },
  },
  {
    id: 'hiring',
    title: '人を採るか、我慢するか',
    difficulty: 'intermediate',
    description:
      '需要旺盛だが、少人数では回らない。採用すべきか?人件費は固定化する。3期で判断せよ。',
    learningFocus: ['労働生産性', '人件費の固定化リスク', '生産能力'],
    initialState: {
      cash: 40_000,
      accountsReceivable: 12_000,
      materialInventory: 5_000,
      productInventory: 0,
      productInventoryValue: 0,
      accountsPayable: 3_000,
      shortTermDebt: 5_000,
      longTermDebt: 20_000,
      equipment: 40_000,
      accumulatedDepreciation: 8_000,
      capital: 10_000,
      retainedEarnings: 51_000,
      employees: 5,
      brandValue: 60,
      rdBonus: 0,
    },
    turns: 3,
    scriptedEvents: [
      {
        type: 'boom',
        message: '好況で需要が30%増加',
        demandMultiplier: 1.3,
        costMultiplier: 1.0,
      },
      {
        type: 'boom',
        message: '需要旺盛が続いています',
        demandMultiplier: 1.3,
        costMultiplier: 1.0,
      },
      {
        type: 'neutral',
        message: '需要は落ち着き通常水準に',
        demandMultiplier: 1.0,
        costMultiplier: 1.0,
      },
    ],
    advisorPrompts: [
      {
        turn: 1,
        before: [
          `需要が30%増加。現在の人員では生産能力に上限があります。`,
          '選択肢は3つ。①現状維持で機会損失を受け入れる ②採用して能力を増やす ③価格を上げて需要を絞る',
          `採用した人件費は毎期${salary}千円の固定費。需要が落ちても払い続けます。この覚悟はありますか?`,
        ],
        after:
          '従業員{employees}人、生産{produced}個、販売{sold}個。労働生産性は{productivity}千円/人。業界平均765千円と比較して?',
      },
      {
        turn: 2,
        before: [
          '2期目。需要旺盛は続いています。前期の判断は正しかったですか?',
          '追加採用しますか?それとも今の体制で回しますか?',
        ],
        after:
          '現金は{cash}千円。人を増やすほど固定費が膨らみますが、生産能力も上がります。',
      },
      {
        turn: 3,
        before: [
          '3期目。ここで需要が通常水準に戻る予想。あなたの人員体制は?',
          '好況が終わっても人は簡単に減らせません。この期の意思決定が最も難しい。',
        ],
        after:
          'シナリオ終了。最終{employees}人体制、累積営業利益{cumOp}千円。労働生産性とのバランスを確認しましょう。',
      },
    ],
    successCriteria: {
      description: '3期後の労働生産性1,000千円/人以上 かつ 累積営業利益が黒字',
      evaluate: (state) => {
        const totalOp = state.history.reduce(
          (s, r) => s + r.pl.operatingProfit,
          0,
        );
        const lastPL = state.history[state.history.length - 1]?.pl;
        const periodSalary = state.employees * salary;
        const productivity = lastPL
          ? (lastPL.operatingProfit + periodSalary) /
            Math.max(state.employees, 1)
          : 0;
        const success = productivity >= 1000 && totalOp > 0;
        const score = Math.min(
          100,
          Math.round(productivity / 20 + (totalOp > 0 ? 30 : 0)),
        );
        return {
          success,
          score,
          message: success
            ? `労働生産性${productivity.toFixed(0)}千円/人、累積利益黒字。適切な採用判断でした。`
            : `労働生産性${productivity.toFixed(0)}千円/人、累積利益${totalOp}千円。人員規模と需要のミスマッチ、または過剰採用の可能性。`,
          keyLearning:
            '人件費は固定費化する。需要ピーク時の採用は、需要後退期に重荷になる。労働生産性(1人当たり付加価値)を業界平均以上に保てるかが基準。',
        };
      },
    },
  },
  {
    id: 'post-boom',
    title: '特需のあと、どう立て直す',
    difficulty: 'advanced',
    description:
      '大口案件終了直後。従業員10人、売上急落、赤字転落寸前。キャッシュを守り黒字化せよ。',
    learningFocus: ['固定費対応', '撤退判断', '需要開拓', 'キャッシュフロー'],
    initialState: {
      cash: 20_000,
      accountsReceivable: 25_000,
      materialInventory: 6_000,
      productInventory: 100,
      productInventoryValue: 800,
      accountsPayable: 8_000,
      shortTermDebt: 15_000,
      longTermDebt: 35_000,
      equipment: 60_000,
      accumulatedDepreciation: 15_000,
      capital: 10_000,
      retainedEarnings: 28_000,
      employees: 10,
      brandValue: 50,
      rdBonus: 0,
    },
    turns: 3,
    scriptedEvents: [
      {
        type: 'recession',
        message: '大口案件終了で需要50%減',
        demandMultiplier: 0.5,
        costMultiplier: 1.0,
      },
      {
        type: 'recession',
        message: '需要低迷が続く',
        demandMultiplier: 0.6,
        costMultiplier: 1.0,
      },
      {
        type: 'neutral',
        message: '需要はやや回復基調',
        demandMultiplier: 0.8,
        costMultiplier: 1.0,
      },
    ],
    advisorPrompts: [
      {
        turn: 1,
        before: [
          `大口案件が終わりました。需要は半減、しかし人件費(10人×${salary}=${10 * salary}千円/期)と減価償却は動きません。`,
          'このまま何もしなければ大赤字。①人員削減 ②新規需要開拓(広告投資) ③生産縮小で在庫調整',
          'キャッシュは限られています。3期持ちこたえられますか?',
        ],
        after:
          '営業利益{op}千円、現金{cash}千円。危機的な状況ですが、次期の一手が生死を分けます。',
      },
      {
        turn: 2,
        before: [
          '2期目。前期の判断で現金は{cash}千円。あと2期。',
          '固定費削減と需要開拓、どちらを優先しますか?',
        ],
        after: '累積営業利益は{cumOp}千円。改善傾向にありますか?',
      },
      {
        turn: 3,
        before: [
          '最終期。需要はやや回復。ここで黒字化できるかが評価軸です。',
          '生き延びる会社は、危機の後により強くなります。今期の意思決定が結果を決めます。',
        ],
        after:
          'シナリオ終了。営業利益{op}千円、現金{cash}千円。生き残れましたか?',
      },
    ],
    successCriteria: {
      description: '3期目の営業利益黒字 かつ 現金プラス維持',
      evaluate: (state) => {
        const lastPL = state.history[state.history.length - 1]?.pl;
        const opProfit = lastPL?.operatingProfit ?? 0;
        const cashOk = state.cash > 0;
        const success = opProfit > 0 && cashOk;
        const score = Math.max(
          0,
          Math.min(100, Math.round(opProfit / 200 + (cashOk ? 50 : 0))),
        );
        return {
          success,
          score,
          message: success
            ? '営業利益黒字化・現金維持。危機管理と再建判断が奏功しました。'
            : opProfit <= 0
              ? `営業利益${opProfit}千円。固定費の削減が不足した可能性。`
              : '現金枯渇。売上回復より先に、キャッシュを守る意思決定が必要でした。',
          keyLearning:
            '特需依存の会社は、特需終了時に固定費が牙を剥く。危機時の優先順位は「キャッシュ確保 > 売上維持」。人員体制と設備規模は、平常時の需要に合わせるのが原則。',
        };
      },
    },
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

/** シナリオ用初期状態。BSが整合するよう利益剰余金を再計算する */
export function createScenarioState(scenario: Scenario): GameState {
  const base = createInitialState(DEFAULT_COMPANY_NAME, 'normal');
  const merged: GameState = {
    ...base,
    ...scenario.initialState,
    companyName: DEFAULT_COMPANY_NAME,
    mode: 'scenario',
    scenarioId: scenario.id,
    totalTurns: scenario.turns,
    currentTurn: 1,
    history: [],
    eventLog: [],
    gameOver: false,
    gameOverReason: undefined,
    consecutiveLosses: 0,
    warningMessage: undefined,
    rdPending: scenario.initialState.rdPending ?? 0,
    extraProductionCapacity:
      scenario.initialState.extraProductionCapacity ?? 0,
    productInventoryValue:
      scenario.initialState.productInventoryValue ??
      (scenario.initialState.productInventory ?? 0) *
        (scenario.initialState.materialUnitCost ??
          CONSTANTS.MATERIAL_COST_PER_UNIT),
  };

  const inventory =
    merged.materialInventory + merged.productInventoryValue;
  const assets =
    merged.cash +
    merged.accountsReceivable +
    inventory +
    netEquipment(merged);
  const liabilities =
    merged.accountsPayable + merged.shortTermDebt + merged.longTermDebt;
  merged.retainedEarnings = Math.round(
    assets - liabilities - merged.capital,
  );

  // 検算
  buildBS(merged);
  return merged;
}

export function evaluateScenario(state: GameState): ScenarioResult | null {
  if (!state.scenarioId) return null;
  const scenario = getScenarioById(state.scenarioId);
  if (!scenario) return null;
  return scenario.successCriteria.evaluate(state);
}

export const SCENARIO_DIFFICULTY_LABELS = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
} as const;
