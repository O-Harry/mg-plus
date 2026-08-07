import { DIFFICULTY_CONFIG } from './constants';
import type { Difficulty, MarketEvent } from '../types/game';

type Rng = () => number;

const NEUTRAL: MarketEvent = {
  type: 'neutral',
  message: '今期の市場は穏やか。大きなニュースはありません。',
  demandMultiplier: 1,
  costMultiplier: 1,
};

const EVENT_POOL: Omit<MarketEvent, 'message'>[] = [
  {
    type: 'boom',
    demandMultiplier: 1.25,
    costMultiplier: 1,
  },
  {
    type: 'recession',
    demandMultiplier: 0.7,
    costMultiplier: 1,
  },
  {
    type: 'special_order',
    demandMultiplier: 1.4,
    costMultiplier: 1,
  },
  {
    type: 'complaint',
    demandMultiplier: 0.85,
    costMultiplier: 1,
  },
  {
    type: 'material_price_up',
    demandMultiplier: 1,
    costMultiplier: 1.15,
  },
  {
    type: 'material_price_down',
    demandMultiplier: 1,
    costMultiplier: 0.9,
  },
];

const EVENT_MESSAGES: Record<MarketEvent['type'], string[]> = {
  boom: [
    '好況の兆し。顧客の引き合いが増えています。',
    '業界全体が活気づき、需要が押し上がっています。',
  ],
  recession: [
    '不況の影。受注が冷え込んでいます。',
    '景気後退で顧客の発注が慎重になっています。',
  ],
  special_order: [
    '大口の特需注文が入る気配です！',
    '新規顧客からまとまった引き合いが来ています。',
  ],
  complaint: [
    '品質クレームが話題に。ブランドに影響が出そうです。',
    '納期遅延の噂で、一部顧客が様子見しています。',
  ],
  material_price_up: [
    '原材料価格が高騰しています。',
    '仕入先から値上げ通告。材料費に注意。',
  ],
  material_price_down: [
    '原材料が値下がり。仕入の好機です。',
    '材料相場が軟化。原価改善のチャンス。',
  ],
  neutral: [NEUTRAL.message],
};

function pickMessage(type: MarketEvent['type'], rng: Rng): string {
  const list = EVENT_MESSAGES[type];
  return list[Math.floor(rng() * list.length)] ?? NEUTRAL.message;
}

/**
 * 難易度に応じた市場イベントを生成。
 * 不況は recessionProb で優先抽選し、それ以外は低確率でランダムイベント。
 */
export function generateMarketEvent(
  difficulty: Difficulty,
  rng: Rng = Math.random,
): MarketEvent {
  const { recessionProb } = DIFFICULTY_CONFIG[difficulty];

  if (rng() < recessionProb) {
    return {
      type: 'recession',
      message: pickMessage('recession', rng),
      demandMultiplier: 0.7,
      costMultiplier: 1,
    };
  }

  // その他イベント: 約20%で発生
  if (rng() > 0.2) {
    return { ...NEUTRAL, message: pickMessage('neutral', rng) };
  }

  const pool = EVENT_POOL.filter((e) => e.type !== 'recession');
  const picked = pool[Math.floor(rng() * pool.length)] ?? EVENT_POOL[0];
  return {
    ...picked,
    message: pickMessage(picked.type, rng),
  };
}
