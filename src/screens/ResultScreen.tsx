import { useMemo, useState } from 'react';
import { BEPPanel } from '../components/BEPPanel';
import { BSChart } from '../components/BSChart';
import { BSTable } from '../components/BSTable';
import { CFTable } from '../components/CFTable';
import { CoachBubble } from '../components/CoachBubble';
import {
  buildFinancialMetrics,
  FinancialMetricsProvider,
} from '../components/FinancialMetricsContext';
import { PLTable } from '../components/PLTable';
import { StanceEvaluationPanel } from '../components/StanceEvaluationPanel';
import { StickyFooter } from '../components/StickyFooter';
import { STRACPanel } from '../components/STRACPanel';
import { TabSwitcher } from '../components/TabSwitcher';
import { TermTooltip } from '../components/TermTooltip';
import {
  buildAdvisorContext,
  fillAdvisorTemplate,
} from '../engine/advisorTemplate';
import {
  calculateBSMetricsFromState,
  calculateBSMetricsFromTurn,
  evaluateStance,
} from '../engine/bsMetrics';
import { getScenarioById } from '../engine/scenarios';
import { useGameStore } from '../store/gameStore';
import { getMaxTurns } from '../utils/gameHelpers';
import { resolveSTRACForGame } from '../utils/stracHelpers';
import { formatNumber, formatYen, signedColorClass } from '../utils/format';

type TabId = 'pl' | 'bs' | 'cf' | 'strac' | 'bep' | 'bsgraph';

const TABS: { id: TabId; label: string }[] = [
  { id: 'pl', label: 'PL' },
  { id: 'bs', label: 'BS' },
  { id: 'cf', label: 'CF' },
  { id: 'strac', label: 'STRAC' },
  { id: 'bep', label: 'BEP' },
  { id: 'bsgraph', label: 'BSグラフ' },
];

export function ResultScreen() {
  const game = useGameStore((s) => s.game);
  const advanceToNextTurn = useGameStore((s) => s.advanceToNextTurn);
  const setView = useGameStore((s) => s.setView);
  const [tab, setTab] = useState<TabId>('pl');

  const result = game?.history[game.history.length - 1];
  const metrics = useMemo(
    () => (game && result ? buildFinancialMetrics(game, result) : null),
    [game, result],
  );

  const scenarioComment = useMemo(() => {
    if (!game || !result || game.mode !== 'scenario' || !game.scenarioId) {
      return null;
    }
    const scenario = getScenarioById(game.scenarioId);
    const prompt = scenario?.advisorPrompts.find((p) => p.turn === result.turn);
    if (!prompt?.after) return null;
    return fillAdvisorTemplate(
      prompt.after,
      buildAdvisorContext(game, result),
    );
  }, [game, result]);

  const strac = useMemo(
    () => (game && result ? resolveSTRACForGame(result, game) : null),
    [game, result],
  );

  const bsPanel = useMemo(() => {
    if (!game || !result) return null;
    const historyMetrics = game.history
      .slice(-3)
      .map((h) => calculateBSMetricsFromTurn(h));
    const labels = game.history.slice(-3).map((h) => `${h.turn}期`);
    const current = calculateBSMetricsFromState(game, result.pl.revenue);
    const previous =
      historyMetrics.length >= 2
        ? historyMetrics[historyMetrics.length - 2]!
        : null;
    return {
      history: historyMetrics,
      labels,
      evaluation: evaluateStance(current, previous),
      metrics: current,
    };
  }, [game, result]);

  if (!game || !result) {
    return (
      <div className="py-8 text-center text-sm text-slate-600">
        決算データがありません
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={() => setView('dashboard')}
        >
          ダッシュボードへ
        </button>
      </div>
    );
  }

  const maxTurns = getMaxTurns(game);
  const isLastTurn = result.turn >= maxTurns;
  const footerLabel = game.gameOver
    ? 'ゲームオーバーへ ▶'
    : isLastTurn
      ? game.mode === 'scenario'
        ? 'シナリオ結果へ ▶'
        : '最終結果へ ▶'
      : '次の期へ ▶';

  const onNext = () => {
    advanceToNextTurn();
  };

  const opMargin =
    result.pl.revenue > 0
      ? result.pl.operatingProfit / result.pl.revenue
      : 0;

  return (
    <FinancialMetricsProvider metrics={metrics}>
      <div className="relative flex flex-1 flex-col animate-fade-in">
        <header className="sticky top-0 z-30 -mx-4 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-mg-accent">MG+</p>
              <h1 className="text-lg font-bold text-mg-primary">
                第{result.turn}期 決算結果
              </h1>
            </div>
            <p className="text-xs text-slate-500">{game.companyName}</p>
          </div>
        </header>

        <div className="flex flex-col gap-3 py-4 pb-2">
          <section className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-xs text-slate-500">
                <TermTooltip term="売上高">売上高</TermTooltip>
              </p>
              <p className="text-base font-bold tabular-nums text-mg-primary">
                {formatYen(result.pl.revenue)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-xs text-slate-500">
                <TermTooltip term="当期純利益">当期純利益</TermTooltip>
              </p>
              <p
                className={`text-base font-bold tabular-nums ${signedColorClass(result.pl.netProfit)}`}
              >
                {formatYen(result.pl.netProfit)}
              </p>
            </div>
          </section>

          <p className="text-sm text-slate-600">
            <TermTooltip term="営業利益率">営業利益率</TermTooltip>{' '}
            <span className={`font-semibold ${signedColorClass(opMargin)}`}>
              {(opMargin * 100).toFixed(1)}%
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              {result.event?.message}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              需要 {formatNumber(result.demandRealized)}個 → 販売{' '}
              {formatNumber(result.salesQty)}個
            </span>
          </p>

          <p className="text-xs text-slate-500">
            科目名をタップすると用語解説と業界比較が見られます
          </p>

          <TabSwitcher tabs={TABS} value={tab} onChange={setTab} />

          <section role="tabpanel">
            {(tab === 'pl' || tab === 'bs' || tab === 'cf') && (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                {tab === 'pl' && (
                  <>
                    <h2 className="mb-2 text-sm font-bold text-mg-primary">
                      損益計算書 (PL)
                    </h2>
                    <PLTable pl={result.pl} />
                  </>
                )}
                {tab === 'bs' && (
                  <>
                    <h2 className="mb-2 text-sm font-bold text-mg-primary">
                      貸借対照表 (BS)
                    </h2>
                    <BSTable bs={result.bs} />
                    <p className="mt-2 text-xs text-slate-500">
                      検算: 資産 {formatNumber(result.bs.totalAssets)} =
                      負債+純資産{' '}
                      {formatNumber(
                        result.bs.totalLiabilities + result.bs.totalEquity,
                      )}
                    </p>
                  </>
                )}
                {tab === 'cf' && (
                  <>
                    <h2 className="mb-2 text-sm font-bold text-mg-primary">
                      キャッシュ・フロー (CF)
                    </h2>
                    <CFTable cf={result.cf} />
                    <p className="mt-2 text-xs text-slate-500">
                      期末現預金 {formatYen(result.bs.cash)}
                    </p>
                  </>
                )}
              </div>
            )}
            {tab === 'strac' && strac && <STRACPanel strac={strac} />}
            {tab === 'bep' && strac && <BEPPanel strac={strac} />}
            {tab === 'bsgraph' && bsPanel && (
              <div className="space-y-3">
                <BSChart history={bsPanel.history} labels={bsPanel.labels} />
                <StanceEvaluationPanel
                  evaluation={bsPanel.evaluation}
                  metrics={bsPanel.metrics}
                />
              </div>
            )}
          </section>

          <CoachBubble comment={scenarioComment ?? result.coachComment} />
          {scenarioComment && (
            <p className="text-xs text-slate-500">
              ※シナリオモードではクロピーのシナリオ助言を表示しています
            </p>
          )}

          {game.warningMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-mg-danger">
              {game.warningMessage}
            </p>
          )}
        </div>

        <StickyFooter>
          <button
            type="button"
            className="btn-accent w-full text-base"
            onClick={onNext}
          >
            {footerLabel}
          </button>
        </StickyFooter>
      </div>
    </FinancialMetricsProvider>
  );
}
