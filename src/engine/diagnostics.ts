import type { GameState, TurnResult } from '../types/game';
import { CONSTANTS } from './constants';

export type Diagnosis = {
  pattern: string;
  detail: string;
  advice: string;
  keyMetric: {
    label: string;
    value: string;
    benchmark: string;
  };
};

const EMPTY_DIAGNOSIS: Diagnosis = {
  pattern: '未プレイ',
  detail: 'まだプレイされていません',
  advice: '',
  keyMetric: { label: '', value: '', benchmark: '' },
};

export function diagnoseScenario(state: GameState): Diagnosis {
  const turns = state.history;
  if (turns.length === 0) return EMPTY_DIAGNOSIS;

  switch (state.scenarioId) {
    case 'price-hike':
      return diagnosePriceHike(turns);
    case 'hiring':
      return diagnoseHiring(turns, state);
    case 'post-boom':
      return diagnosePostBoom(turns, state);
    default:
      return {
        pattern: '不明',
        detail: '',
        advice: '',
        keyMetric: { label: '', value: '', benchmark: '' },
      };
  }
}

/** テスト・内部利用向けに export */
export function diagnosePriceHike(turns: TurnResult[]): Diagnosis {
  const BASE_PRICE = CONSTANTS.BASE_PRICE;
  const OVER_INCREASE_THRESHOLD = 0.3;

  const priceChanges = turns.map(
    (t) => (t.decision.unitPrice - BASE_PRICE) / BASE_PRICE,
  );
  const avgChange =
    priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  const maxChange = Math.max(...priceChanges);
  const minChange = Math.min(...priceChanges);
  const finalTurn = turns[turns.length - 1]!;
  const firstTurn = turns[0]!;
  const finalMargin =
    finalTurn.pl.revenue > 0
      ? finalTurn.pl.grossProfit / finalTurn.pl.revenue
      : 0;
  const finalDemand = finalTurn.demandRealized;
  const inventoryBuildup = turns.some(
    (t) => t.salesQty < t.decision.productionQty * 0.7,
  );

  if (avgChange < 0.05) {
    return {
      pattern: '値上げをほぼ行わなかった',
      detail: `3期平均の価格は基準比${(avgChange * 100).toFixed(0)}%上昇のみ。材料費20%上昇に対して転嫁できず、粗利率は${(finalMargin * 100).toFixed(1)}%まで低下しました。`,
      advice:
        '価格改定は経営者の最重要意思決定の一つ。取引先との交渉や説明の手間を惜しむと、粗利が消え、会社の存続基盤が揺らぎます。「値上げしにくい」という感情を、数字で乗り越える訓練を。',
      keyMetric: {
        label: '粗利率',
        value: `${(finalMargin * 100).toFixed(1)}%`,
        benchmark: '業界平均25%',
      },
    };
  }

  if (priceChanges[0]! < 0.05 && priceChanges[priceChanges.length - 1]! > 0.15) {
    return {
      pattern: '値上げの判断が遅れた',
      detail: `1期目は基準比${(priceChanges[0]! * 100).toFixed(0)}%と据置に近く、材料費上昇を吸収して1期目の営業利益は${firstTurn.pl.operatingProfit.toLocaleString()}千円。その後値上げに転じましたが、初期の赤字が累積を圧迫しました。`,
      advice:
        'コスト上昇時の価格改定は「早め・小刻み」が原則。1期様子見の間に消える粗利は取り戻せません。実務では、材料費上昇の一報が入った瞬間に、値上げシナリオを準備し始めるべき。',
      keyMetric: {
        label: '1期目営業利益',
        value: `${firstTurn.pl.operatingProfit.toLocaleString()}千円`,
        benchmark: '本来+3,000千円以上必要',
      },
    };
  }

  if (avgChange > OVER_INCREASE_THRESHOLD && finalDemand < 100) {
    return {
      pattern: '過剰な値上げで需要が減った',
      detail: `3期平均の値上げ率${(avgChange * 100).toFixed(0)}%は、材料費上昇分(20%)を大きく上回りました。需要は${finalDemand}個まで減少し、売上規模自体が縮小。粗利率${(finalMargin * 100).toFixed(1)}%は確保できましたが売上量が失われました。`,
      advice:
        '価格弾力性を無視した値上げは、粗利率を守っても売上総額が痩せます。市場が受け入れる価格の上限を意識し、原価上昇分＋α程度に抑えるのが定石。ブランド強化投資と併用することで許容度は上がります。',
      keyMetric: {
        label: '最終期の実現需要',
        value: `${finalDemand}個`,
        benchmark: '通常需要200個',
      },
    };
  }

  const variance = maxChange - minChange;
  if (variance > 0.25) {
    return {
      pattern: '価格戦略が期ごとにブレた',
      detail: `価格変動幅が大きく(${(minChange * 100).toFixed(0)}%〜${(maxChange * 100).toFixed(0)}%)、一貫した戦略が読み取れません。取引先から見ると価格の安定感がなく、長期信頼を損ないます。`,
      advice:
        '価格は一度動かしたら、しばらく維持するのが原則。試行錯誤は市場の反応を見る意味では正しいが、B2B取引では価格の安定性が信頼に直結する。戦略を先に決めてから動かす習慣を。',
      keyMetric: {
        label: '価格変動幅',
        value: `${(variance * 100).toFixed(0)}%`,
        benchmark: '10%以内が理想',
      },
    };
  }

  if (avgChange >= 0.15 && avgChange <= 0.25 && inventoryBuildup) {
    return {
      pattern: '値上げは適切だったが生産量が過剰',
      detail: `平均値上げ率${(avgChange * 100).toFixed(0)}%は妥当な水準。ただし値上げによる需要減を織り込まず生産を続けた結果、在庫が積み上がりました。`,
      advice:
        '価格を上げるなら、生産量も同時に見直すこと。「作る量 = 売れる量」を意識する。売れ残りは資産として計上されるが、実質的には「眠っている現金」です。',
      keyMetric: {
        label: '製造/販売比',
        value: `${Math.round(
          (finalTurn.salesQty /
            Math.max(finalTurn.decision.productionQty, 1)) *
            100,
        )}%`,
        benchmark: '90%以上が理想',
      },
    };
  }

  if (finalMargin >= 0.2 && avgChange >= 0.15) {
    return {
      pattern: '適切な値上げで粗利を維持',
      detail: `平均値上げ率${(avgChange * 100).toFixed(0)}%で材料費上昇を吸収。粗利率${(finalMargin * 100).toFixed(1)}%は業界平均25%と比較しても健全な水準。取引先との交渉も想定内で完了できたはず。`,
      advice:
        '価格改定は経営の最重要判断。今回の判断は、実務でも通用するレベル。次はブランド強化や生産効率化と組み合わせて、値上げなしでも利益が伸びる体質を作ることが目標。',
      keyMetric: {
        label: '粗利率',
        value: `${(finalMargin * 100).toFixed(1)}%`,
        benchmark: '業界平均25%',
      },
    };
  }

  return {
    pattern: '判断は行ったが、結果が伴わなかった',
    detail: `平均値上げ率${(avgChange * 100).toFixed(0)}%、最終粗利率${(finalMargin * 100).toFixed(1)}%、需要${finalDemand}個。個別要素は判断していますが、全体最適に至りませんでした。`,
    advice:
      '価格・生産量・投資判断は連動します。個別の意思決定ではなく、3期通しての戦略を先に描いてから動かす訓練を。',
    keyMetric: {
      label: '粗利率',
      value: `${(finalMargin * 100).toFixed(1)}%`,
      benchmark: '業界平均25%',
    },
  };
}

export function diagnoseHiring(
  turns: TurnResult[],
  state: GameState,
): Diagnosis {
  const employees = state.employees;
  const initialEmployees = 5;
  const employeeChange = employees - initialEmployees;
  const finalTurn = turns[turns.length - 1]!;
  const totalOp = turns.reduce((s, r) => s + r.pl.operatingProfit, 0);
  const salary = employees * CONSTANTS.EMPLOYEE_SALARY_PER_TURN;
  const productivity =
    finalTurn.pl.revenue > 0
      ? (finalTurn.pl.operatingProfit + salary) / employees
      : 0;
  const totalMissed = turns.reduce(
    (s, t) => s + Math.max(0, t.demandRealized - t.salesQty),
    0,
  );

  if (employeeChange === 0 && totalMissed > 100) {
    return {
      pattern: '採用を見送り、機会損失が発生',
      detail: `3期通じて従業員${initialEmployees}人のまま。取り逃した需要は累計${totalMissed}個。売れる商品を作れず、成長の機会を逃しました。`,
      advice:
        '人件費の固定化を恐れるあまり、目の前の需要を見逃すのは典型的な保守的経営。労働生産性が業界平均を大きく超えている場合、追加採用の余地が十分にあります。「採らない判断」も、数字で正当化できるかが問われます。',
      keyMetric: {
        label: '機会損失(累計)',
        value: `${totalMissed}個`,
        benchmark: '0個が理想',
      },
    };
  }

  if (employeeChange >= 2 && productivity < 500) {
    return {
      pattern: '需要を超えて採用してしまった',
      detail: `従業員は${initialEmployees}人から${employees}人へ増加。労働生産性は${productivity.toFixed(0)}千円/人と、業界平均765千円を大きく下回りました。人件費が固定化し、需要低下期に重荷になります。`,
      advice:
        '好況期の採用は、需要が続く保証がある時のみ。「1人採用したら、需要が半減しても払い続けられるか」を常に自問すること。派遣・パートを先に使うのも選択肢。',
      keyMetric: {
        label: '労働生産性',
        value: `${productivity.toFixed(0)}千円/人`,
        benchmark: '業界平均765千円',
      },
    };
  }

  if (employeeChange >= 1 && productivity >= 1000 && totalOp > 0) {
    return {
      pattern: '需要増を捉えた適切な採用',
      detail: `${employeeChange}人採用し従業員${employees}人体制へ。労働生産性${productivity.toFixed(0)}千円/人、累積営業利益${totalOp.toLocaleString()}千円と好結果。`,
      advice:
        '需要ピーク時の採用が奏功しました。次の課題は、需要が落ちた際に労働生産性を維持できるか。多能工化や自動化投資で、少人数でも稼げる体制を並行して作ること。',
      keyMetric: {
        label: '労働生産性',
        value: `${productivity.toFixed(0)}千円/人`,
        benchmark: '業界平均765千円',
      },
    };
  }

  return {
    pattern: `従業員${initialEmployees}→${employees}人、業績はまちまち`,
    detail: `労働生産性${productivity.toFixed(0)}千円/人、累積営業利益${totalOp.toLocaleString()}千円。採用判断は行ったが、需要変動への対応が課題として残りました。`,
    advice:
      '採用は「今の需要」ではなく「継続する需要」に対して行うこと。1期の判断でなく、3期先を見据えた人員計画が経営者の仕事。',
    keyMetric: {
      label: '労働生産性',
      value: `${productivity.toFixed(0)}千円/人`,
      benchmark: '業界平均765千円',
    },
  };
}

export function diagnosePostBoom(
  turns: TurnResult[],
  state: GameState,
): Diagnosis {
  const finalTurn = turns[turns.length - 1]!;
  const cashOk = state.cash > 0;
  const opProfit = finalTurn.pl.operatingProfit;
  const employees = state.employees;
  const initialEmployees = 10;
  const employeeChange = employees - initialEmployees;
  const salary = employees * CONSTANTS.EMPLOYEE_SALARY_PER_TURN;

  if (!cashOk) {
    return {
      pattern: '資金ショート寸前、キャッシュ管理が失敗',
      detail: `現金が${state.cash.toLocaleString()}千円まで減少。売上や利益より先に、現金の流れを守るべき局面でした。`,
      advice:
        '危機時の鉄則は「利益より現金」。売上を追うより先に、固定費削減と支払サイト調整で手元流動性を確保する。金融機関との関係も、平時から作っておくのが経営者の仕事。',
      keyMetric: {
        label: '現金残高',
        value: `${state.cash.toLocaleString()}千円`,
        benchmark: '月商1-2ヶ月分以上',
      },
    };
  }

  if (employeeChange >= 0 && opProfit < 0) {
    return {
      pattern: '固定費(人件費)削減が遅れた',
      detail: `従業員${initialEmployees}人体制を維持したまま需要半減に対応。人件費${salary}千円/期が重く、営業赤字${opProfit.toLocaleString()}千円で終着。`,
      advice:
        '特需依存の会社は、平常時の需要に見合う人員体制を平時から準備するべき。人員削減は経営判断として最も難しいが、避けると全員を失うリスクがある。派遣・出向・配置転換など、複数の選択肢を持つこと。',
      keyMetric: {
        label: '営業利益',
        value: `${opProfit.toLocaleString()}千円`,
        benchmark: '黒字化が最低目標',
      },
    };
  }

  if (cashOk && opProfit > 0) {
    return {
      pattern: '危機を乗り越えた立て直し',
      detail: `現金${state.cash.toLocaleString()}千円を維持し、営業利益${opProfit.toLocaleString()}千円で黒字化。危機時の意思決定が奏功しました。`,
      advice:
        '危機を乗り越えた経験は、平常時に活きる財産です。「なぜ特需に依存する体質だったか」を反省し、需要ポートフォリオの分散、固定費比率の低下、緊急時プロトコルの整備に取り組むこと。',
      keyMetric: {
        label: '営業利益',
        value: `${opProfit.toLocaleString()}千円`,
        benchmark: '黒字化達成',
      },
    };
  }

  return {
    pattern: '生き延びたが、収益回復には至らず',
    detail: `現金${state.cash.toLocaleString()}千円、営業利益${opProfit.toLocaleString()}千円。危機対応の意思決定は行ったものの、黒字化には届きませんでした。`,
    advice:
      '危機時の優先順位: ①キャッシュ確保 → ②固定費削減 → ③新規需要開拓、の順。順序を逆にすると、投資が実る前に資金が尽きます。',
    keyMetric: {
      label: '営業利益',
      value: `${opProfit.toLocaleString()}千円`,
      benchmark: '黒字化目標',
    },
  };
}
