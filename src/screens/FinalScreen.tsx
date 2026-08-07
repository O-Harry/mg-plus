import { CoachBubble } from '../components/CoachBubble';
import { HistoryChart } from '../components/HistoryChart';
import { StickyFooter } from '../components/StickyFooter';
import { buildBS, companyValueScore } from '../engine/calculations';
import { DIFFICULTY_LABELS } from '../engine/constants';
import { useGameStore } from '../store/gameStore';
import { formatNumber, formatPercent, formatYen, signedColorClass } from '../utils/format';

export function FinalScreen() {
  const game = useGameStore((s) => s.game);
  const resetGame = useGameStore((s) => s.resetGame);
  const replayGame = useGameStore((s) => s.replayGame);
  const setView = useGameStore((s) => s.setView);

  if (!game || game.history.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-600">
        結果データがありません
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={() => setView('title')}
        >
          タイトルへ
        </button>
      </div>
    );
  }

  const score = companyValueScore(game);
  const bs = buildBS(game);
  const recent = game.history.slice(-3);
  const avgNet =
    recent.reduce((s, r) => s + r.pl.netProfit, 0) / Math.max(recent.length, 1);

  const bestRevenue = game.history.reduce((best, r) =>
    r.pl.revenue > best.pl.revenue ? r : best,
  );
  const bestProfit = game.history.reduce((best, r) =>
    r.pl.netProfit > best.pl.netProfit ? r : best,
  );
  const totalNet = game.history.reduce((s, r) => s + r.pl.netProfit, 0);

  const rank =
    score >= 120_000
      ? 'S 経営の達人'
      : score >= 90_000
        ? 'A 安定成長'
        : score >= 60_000
          ? 'B まずまず'
          : score >= 40_000
            ? 'C 修行中'
            : 'D 立て直しが必要';

  const coachMsg =
    score >= 90_000
      ? `素晴らしい経営でした。会社価値 ${score.toLocaleString()} 千円。純資産と利益のバランスが取れてます。`
      : score >= 60_000
        ? `12期完走おつかれさまです。会社価値は ${score.toLocaleString()} 千円。次は粗利率と現金の厚みを意識してみましょう。`
        : `12期走り切りました。会社価値は ${score.toLocaleString()} 千円。値付け・在庫・投資のタイミングをもう一段磨くと伸びます。`;

  return (
    <div className="relative flex flex-1 flex-col animate-fade-in">
      <header className="sticky top-0 z-30 -mx-4 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
        <p className="text-xs font-medium text-mg-accent">MG+</p>
        <h1 className="text-lg font-bold text-mg-primary">最終結果</h1>
        <p className="text-xs text-slate-500">
          {game.companyName}　/　{DIFFICULTY_LABELS[game.difficulty]}
        </p>
      </header>

      <div className="flex flex-col gap-4 py-4 pb-2">
        {/* スコアホヒーロー */}
        <section className="rounded-2xl bg-mg-primary px-4 py-6 text-center text-white shadow-md">
          <p className="text-sm font-medium tracking-wide text-orange-200">
            会社価値スコア
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
            {formatNumber(score)}
            <span className="ml-1 text-base font-normal opacity-80">千円</span>
          </p>
          <p className="mt-2 text-sm text-orange-100">{rank}</p>
          <p className="mt-3 text-xs leading-relaxed text-blue-100">
            純資産 {formatNumber(bs.totalEquity)} ＋ 直近3期平均純利益{' '}
            {formatNumber(avgNet)} × 5
          </p>
        </section>

        {/* ハイライト3枚 */}
        <section className="grid grid-cols-1 gap-2">
          <HighlightCard
            title="最高売上"
            value={`第${bestRevenue.turn}期`}
            detail={formatYen(bestRevenue.pl.revenue)}
          />
          <HighlightCard
            title="最高純利益"
            value={`第${bestProfit.turn}期`}
            detail={formatYen(bestProfit.pl.netProfit)}
            detailClass={signedColorClass(bestProfit.pl.netProfit)}
          />
          <HighlightCard
            title="12期累計純利益"
            value={formatYen(totalNet)}
            detail={`自己資本比率 ${formatPercent(bs.equityRatio)}`}
            valueClass={signedColorClass(totalNet)}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-1 text-sm font-bold text-mg-primary">
            売上・純利益の推移
          </h2>
          <HistoryChart history={game.history} height={280} />
        </section>

        <CoachBubble comment={coachMsg} />
      </div>

      <StickyFooter>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn-accent w-full" onClick={replayGame}>
            もう一度プレイ
          </button>
          <button
            type="button"
            className="min-h-[44px] w-full rounded-lg border-2 border-mg-primary bg-white px-4 py-3 text-base font-semibold text-mg-primary"
            onClick={resetGame}
          >
            タイトルへ
          </button>
        </div>
      </StickyFooter>
    </div>
  );
}

function HighlightCard({
  title,
  value,
  detail,
  valueClass = 'text-mg-primary',
  detailClass = 'text-slate-600',
}: {
  title: string;
  value: string;
  detail: string;
  valueClass?: string;
  detailClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${valueClass}`}>
        {value}
      </p>
      <p className={`text-sm tabular-nums ${detailClass}`}>{detail}</p>
    </div>
  );
}
