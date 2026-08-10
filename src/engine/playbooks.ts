import type { Decision, ScenarioId } from '../types/game';

export type PlaybookTurn = {
  turn: number;
  situationAnalysis: string;
  recommendedDecision: Decision;
  reasoning: string[];
  keyLesson: string;
};

export type Playbook = {
  scenarioId: ScenarioId;
  overview: string;
  strategy: string;
  turns: PlaybookTurn[];
};

export const PLAYBOOKS: Playbook[] = [
  {
    scenarioId: 'price-hike',
    overview:
      '材料費20%上昇という外部ショックにどう対応するか。粗利率を守るには「同率以上の値上げ」か「原価削減」しかありません。ただし値上げは需要減リスクを伴うため、ブランド強化と組み合わせるのが定石です。',
    strategy:
      '1期目に材料費上昇分をそのまま価格転嫁(20%値上げ)し、2期目以降はブランド強化投資と組み合わせて価格を定着させる。',
    turns: [
      {
        turn: 1,
        situationAnalysis:
          '材料費が20%上昇(25→30千円/個)。何もしなければ粗利率が5-8ポイント悪化します。',
        recommendedDecision: {
          materialPurchase: 6_000,
          productionQty: 200,
          unitPrice: 96,
          employeeChange: 0,
          investments: [],
        },
        reasoning: [
          '材料費20%上昇に対し、価格も同率20%値上げ(80→96千円)で粗利率維持',
          '生産量200個は需要見込み範囲内',
          '1期目は投資控えて市場反応を見る',
          'ブランド値40なので20%値上げの需要影響は限定的',
        ],
        keyLesson: 'コスト上昇は「早め・同率で」価格転嫁するのが原則',
      },
      {
        turn: 2,
        situationAnalysis:
          '1期目の値上げが市場に浸透したはず。ここで戻すと信頼を失います。',
        recommendedDecision: {
          materialPurchase: 5_500,
          productionQty: 180,
          unitPrice: 96,
          employeeChange: 0,
          investments: ['ad'],
        },
        reasoning: [
          '価格96千円を維持、値上げを市場に定着',
          '広告500千円でブランド値+15、需要減リスクを緩和',
          '生産量は需要見込みに合わせて微減',
          '人員現状維持',
        ],
        keyLesson: '一度動かした価格は維持。ブランド強化で許容度を上げる',
      },
      {
        turn: 3,
        situationAnalysis:
          '最終評価期。営業利益率5%以上を確実に取りに行く。',
        recommendedDecision: {
          materialPurchase: 5_500,
          productionQty: 180,
          unitPrice: 98,
          employeeChange: 0,
          investments: ['rd'],
        },
        reasoning: [
          '価格を98千円に微調整(ブランド強化効果を利益反映)',
          'R&D投資で次期以降の変動費-10%を仕込む',
          '生産量は安定水準を維持',
          '営業利益率10%以上を狙える',
        ],
        keyLesson: '短期利益と長期競争力を両立させる',
      },
    ],
  },
  {
    scenarioId: 'hiring',
    overview:
      '需要が旺盛でも、人件費は固定費化します。「今の需要」ではなく「継続する需要」に対して採用するのが原則。稼働率で吸収する選択肢も常に残しておくこと。',
    strategy:
      '1期目に1人だけ採用し、2期目は追加せず稼働率で対応。3期目に需要が落ち着いた際、人員体制を維持できるか試される。',
    turns: [
      {
        turn: 1,
        situationAnalysis:
          '需要+30%(=260個)。5人×50個=250個の生産能力ではギリギリ。1人採用で余裕を作る。',
        recommendedDecision: {
          materialPurchase: 8_000,
          productionQty: 260,
          unitPrice: 85,
          employeeChange: 1,
          investments: [],
        },
        reasoning: [
          '1人採用で生産能力300個、追加需要をキャプチャ',
          '価格を85千円に微上げ(需要旺盛で許容範囲)',
          '3人以上の一気採用は将来リスク大。まず1人でテスト',
          '投資控えめで、まず需要を利益化',
        ],
        keyLesson: '人件費は固定費化する。「1人ずつ」の判断が原則',
      },
      {
        turn: 2,
        situationAnalysis:
          '好況継続。ここで追加採用の誘惑があるが、3期目は需要落ち着き予想。',
        recommendedDecision: {
          materialPurchase: 7_500,
          productionQty: 260,
          unitPrice: 85,
          employeeChange: 0,
          investments: ['rd'],
        },
        reasoning: [
          '追加採用せず、6人体制で稼働率100%運用',
          'R&D投資で次期以降の変動費-10%を仕込む',
          '「もう1人採ればもっと売れる」の誘惑に負けない',
        ],
        keyLesson: '好況期の追加採用は禁物。稼働率で対応',
      },
      {
        turn: 3,
        situationAnalysis:
          '需要通常水準(200個)へ。1期目採用の1人が必要だったかが問われる。',
        recommendedDecision: {
          materialPurchase: 5_500,
          productionQty: 200,
          unitPrice: 82,
          employeeChange: 0,
          investments: [],
        },
        reasoning: [
          '生産量200個。需要通常水準+安全余裕',
          '価格82千円に微下げして需要維持',
          '人員6人体制を維持(1期目採用は正解)',
          'R&D効果で原価-10%が効いて利益率保てる',
        ],
        keyLesson: '需要変動期こそ、労働生産性が問われる',
      },
    ],
  },
  {
    scenarioId: 'post-boom',
    overview:
      '特需依存企業の宿命的な危機。優先順位は「①キャッシュ確保 → ②固定費削減 → ③新規需要開拓」の順。人件費は簡単に減らせないため、生産と在庫の調整でしのぎながら、新規需要を仕込むのが定石です。',
    strategy:
      '1-2期目は減産で在庫を絞りつつ広告投資で需要開拓を仕込み、3期目に緩やかに回復基調に乗せる。',
    turns: [
      {
        turn: 1,
        situationAnalysis:
          '需要50%減(=100個)、10人体制の人件費8,000千円が重荷。現金防衛と固定費削減を同時に進める。',
        recommendedDecision: {
          materialPurchase: 3_500,
          productionQty: 100,
          unitPrice: 80,
          employeeChange: -2,
          investments: ['ad'],
        },
        reasoning: [
          '生産100個に絞り、在庫積み上げ回避',
          '価格80千円維持。値下げは需要をさらに冷やす',
          '2人削減で人件費を1,600千円圧縮(最終手段だが必要)',
          '広告500千円で新規需要開拓を仕込む',
        ],
        keyLesson: '危機時の鉄則は「利益より現金」',
      },
      {
        turn: 2,
        situationAnalysis:
          '需要低迷継続。人件費はまだ重い。追加の人員調整と需要開拓を続ける。',
        recommendedDecision: {
          materialPurchase: 4_000,
          productionQty: 120,
          unitPrice: 80,
          employeeChange: -2,
          investments: ['ad'],
        },
        reasoning: [
          'さらに2人削減し、平常需要に近い人員へ近づける',
          '広告継続でブランド値を積み上げる',
          '生産量120個に微増。需要開拓の兆しを確認',
          '価格80千円維持。安売り禁止',
        ],
        keyLesson: '危機時こそ、将来の需要への投資を止めない',
      },
      {
        turn: 3,
        situationAnalysis:
          '需要やや回復。人員を適正化したうえで、営業黒字化と現金維持を狙う。',
        recommendedDecision: {
          materialPurchase: 5_000,
          productionQty: 160,
          unitPrice: 85,
          employeeChange: -2,
          investments: [],
        },
        reasoning: [
          '6人体制へ(累計-6)。特需前の需要に見合う規模',
          '生産160個。需要回復に対応',
          '価格85千円に微上げ(ブランド値高で許容)',
          '投資控えて利益確保に集中',
        ],
        keyLesson: '危機を乗り越えた企業は平常時に強くなる',
      },
    ],
  },
];

export function getPlaybook(scenarioId: ScenarioId): Playbook | undefined {
  return PLAYBOOKS.find((p) => p.scenarioId === scenarioId);
}
