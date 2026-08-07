import type { GameState, TurnResult } from '../types/game';

export function generateCoachComment(
  state: GameState,
  result: TurnResult,
): string {
  const { pl, bs } = result;
  const prev = state.history[state.history.length - 2];

  if (bs.cash < 5_000) {
    return (
      '⚠️ 現預金が' +
      bs.cash.toLocaleString() +
      '千円まで減りました。仕入や投資を絞って、現金を厚くしましょう。'
    );
  }
  if (pl.operatingProfit < 0 && prev && prev.pl.operatingProfit < 0) {
    return (
      '❌ 2期連続の営業赤字。粗利率' +
      Math.round((pl.grossProfit / Math.max(pl.revenue, 1)) * 100) +
      '%は健全水準を下回っています。値付けか原価を見直しましょう。'
    );
  }
  if (pl.revenue > 0 && pl.grossProfit / pl.revenue < 0.2) {
    return (
      '📉 粗利率が' +
      Math.round((pl.grossProfit / pl.revenue) * 100) +
      '%まで低下。値下げしすぎか、原価上昇が疑われます。'
    );
  }
  if (bs.equityRatio < 0.3) {
    return (
      '🏦 自己資本比率が' +
      Math.round(bs.equityRatio * 100) +
      '%まで低下。借入依存が強まっています。'
    );
  }
  if (result.salesQty < result.decision.productionQty * 0.7) {
    return (
      '📦 生産' +
      result.decision.productionQty +
      '個に対し販売' +
      result.salesQty +
      '個。在庫が積み上がっています。需要見極めを。'
    );
  }
  if (pl.operatingProfit > 0 && bs.cash > 30_000) {
    return '💪 好調です。現金余裕もあるので、設備投資や研究開発で将来の武器を仕込むタイミング。';
  }
  return (
    '📊 今期は営業利益' +
    pl.operatingProfit.toLocaleString() +
    '千円、営業利益率' +
    Math.round((pl.operatingProfit / Math.max(pl.revenue, 1)) * 100) +
    '%。着実な経営です。'
  );
}
