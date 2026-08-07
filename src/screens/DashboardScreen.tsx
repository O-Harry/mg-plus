import { useState } from 'react';
import { KPIMiniChart } from '../components/KPIMiniChart';
import { StickyFooter } from '../components/StickyFooter';
import { buildBS } from '../engine/calculations';
import { DIFFICULTY_LABELS } from '../engine/constants';
import { getScenarioById } from '../engine/scenarios';
import { useGameStore } from '../store/gameStore';
import { getMaxTurns } from '../utils/gameHelpers';
import { formatNumber, formatPercent, formatYen } from '../utils/format';

export function DashboardScreen() {
  const game = useGameStore((s) => s.game);
  const setView = useGameStore((s) => s.setView);
  const resetGame = useGameStore((s) => s.resetGame);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!game) {
    return null;
  }

  const maxTurns = getMaxTurns(game);
  const canDecide = !game.gameOver && game.history.length < maxTurns;
  const scenario =
    game.mode === 'scenario' && game.scenarioId
      ? getScenarioById(game.scenarioId)
      : undefined;

  const prev = game.history[game.history.length - 1];
  const bs = buildBS(game);
  const progress = (game.currentTurn / maxTurns) * 100;

  const opMargin =
    prev && prev.pl.revenue > 0
      ? prev.pl.operatingProfit / prev.pl.revenue
      : null;

  const newsMessage = prev?.event?.message
    ?? '創業の期です。市場を見極めながら、無理のない仕入と生産から始めましょう。';

  const profitColor = (n: number) =>
    n > 0 ? 'text-mg-success' : n < 0 ? 'text-mg-danger' : 'text-slate-700';

  return (
    <div className="relative flex flex-1 flex-col animate-fade-in">
      {/* ヘッダー固定 */}
      <header className="sticky top-0 z-30 -mx-4 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold tracking-wide text-mg-accent">
                MG+
              </span>
              <span className="text-xs text-slate-500">
                第{game.currentTurn}期
              </span>
            </div>
            <h1 className="truncate text-lg font-bold text-mg-primary">
              {game.companyName}
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="メニュー"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <button
              type="button"
              className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-mg-primary"
              onClick={() => {
                setMenuOpen(false);
                setView('title');
              }}
            >
              タイトルへ（自動セーブ済み）
            </button>
            <button
              type="button"
              className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-mg-danger"
              onClick={() => {
                setMenuOpen(false);
                resetGame();
              }}
            >
              ゲームを捨ててタイトルへ
            </button>
          </div>
        )}
      </header>

      {/* スクロールコンテンツ */}
      <div className="flex flex-col gap-3 pb-4 pt-4">
        {/* プログレス */}
        <section>
          <div className="flex items-end justify-between text-sm">
            <p className="font-semibold text-mg-primary">
              第{game.currentTurn}期 / 全{maxTurns}期
            </p>
            <p className="text-xs text-slate-500">
              {scenario
                ? scenario.title
                : DIFFICULTY_LABELS[game.difficulty]}
            </p>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-mg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {game.warningMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-mg-danger">
            {game.warningMessage}
          </div>
        )}

        {/* カード1: 前期業績 */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-mg-primary">前期業績</h2>
          {prev ? (
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">売上高</dt>
                <dd className="font-semibold tabular-nums">
                  {formatYen(prev.pl.revenue)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">営業利益</dt>
                <dd
                  className={`font-semibold tabular-nums ${profitColor(prev.pl.operatingProfit)}`}
                >
                  {formatYen(prev.pl.operatingProfit)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">営業利益率</dt>
                <dd
                  className={`font-semibold tabular-nums ${
                    opMargin === null
                      ? ''
                      : profitColor(opMargin)
                  }`}
                >
                  {opMargin === null ? '—' : formatPercent(opMargin)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                <dt className="text-slate-500">当期純利益</dt>
                <dd
                  className={`font-semibold tabular-nums ${profitColor(prev.pl.netProfit)}`}
                >
                  {formatYen(prev.pl.netProfit)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              第1期のスタートです。前期データはありません。期初現預金は{' '}
              <span className="font-semibold text-mg-primary">
                {formatYen(game.cash)}
              </span>
              です。
            </p>
          )}
        </section>

        {/* カード2: BS要約 */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-mg-primary">BS要約</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">総資産</dt>
              <dd className="font-semibold tabular-nums">
                {formatYen(bs.totalAssets)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">純資産</dt>
              <dd className="font-semibold tabular-nums">
                {formatYen(bs.totalEquity)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">自己資本比率</dt>
              <dd
                className={`font-semibold tabular-nums ${
                  bs.equityRatio < 0.3 ? 'text-mg-danger' : 'text-mg-success'
                }`}
              >
                {formatPercent(bs.equityRatio)}
              </dd>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
              <p>
                現預金{' '}
                <span className="font-semibold text-slate-800">
                  {formatNumber(bs.cash)}
                </span>
              </p>
              <p>
                借入{' '}
                <span className="font-semibold text-slate-800">
                  {formatNumber(bs.shortTermDebt + bs.longTermDebt)}
                </span>
              </p>
            </div>
          </dl>
        </section>

        {/* カード3: KPI */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-mg-primary">
            KPI推移（直近5期）
          </h2>
          <div className="mt-2">
            <KPIMiniChart history={game.history} limit={5} />
          </div>
        </section>

        {/* 市場ニュース */}
        <section className="rounded-xl border border-orange-200 bg-orange-50/80 p-4">
          <div className="flex gap-3">
            <img
              src="/assets/kropi.png"
              alt="クロピー"
              className="h-12 w-12 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-mg-primary">市場ニュース</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {newsMessage}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                従業員 {game.employees}人 / ブランド {game.brandValue} /
                材料単価 {game.materialUnitCost.toFixed(1)}千円
              </p>
            </div>
          </div>
        </section>
      </div>

      <StickyFooter>
        {canDecide ? (
          <button
            type="button"
            className="btn-accent w-full text-base"
            onClick={() => setView('decisions')}
          >
            意思決定へ ▶
          </button>
        ) : (
          <button
            type="button"
            className="btn-accent w-full text-base"
            onClick={() =>
              setView(
                game.gameOver
                  ? 'gameover'
                  : game.mode === 'scenario'
                    ? 'scenarioResult'
                    : 'final',
              )
            }
          >
            {game.gameOver
              ? 'ゲームオーバーへ ▶'
              : game.mode === 'scenario'
                ? 'シナリオ結果へ ▶'
                : '最終結果へ ▶'}
          </button>
        )}
      </StickyFooter>
    </div>
  );
}
