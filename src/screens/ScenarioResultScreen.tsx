import { useMemo, useState } from 'react';
import { AnalysisAccordion } from '../components/AnalysisAccordion';
import { BEPPanel } from '../components/BEPPanel';
import { BSChart } from '../components/BSChart';
import { CoachBubble } from '../components/CoachBubble';
import { PLStackChart } from '../components/PLStackChart';
import { StanceEvaluationPanel } from '../components/StanceEvaluationPanel';
import { StickyFooter } from '../components/StickyFooter';
import { STRACPanel } from '../components/STRACPanel';
import { TabSwitcher } from '../components/TabSwitcher';
import { TrendChart } from '../components/TrendChart';
import {
  calculateBSMetricsFromState,
  calculateBSMetricsFromTurn,
  evaluateStance,
} from '../engine/bsMetrics';
import { diagnoseScenario } from '../engine/diagnostics';
import {
  evaluateScenario,
  getScenarioById,
  SCENARIO_DIFFICULTY_LABELS,
} from '../engine/scenarios';
import { useGameStore } from '../store/gameStore';
import { resolveSTRACForGame } from '../utils/stracHelpers';
import { formatNumber, formatYen, signedColorClass } from '../utils/format';

type DetailTab = 'strac' | 'bep' | 'bsgraph';

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'strac', label: 'STRAC' },
  { id: 'bep', label: 'BEP' },
  { id: 'bsgraph', label: 'BSグラフ' },
];

export function ScenarioResultScreen() {
  const game = useGameStore((s) => s.game);
  const setView = useGameStore((s) => s.setView);
  const replayGame = useGameStore((s) => s.replayGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const [detailTab, setDetailTab] = useState<DetailTab>('strac');

  const diagnosis = useMemo(
    () => (game ? diagnoseScenario(game) : null),
    [game],
  );

  const bsHistory = useMemo(() => {
    if (!game) return [];
    return game.history.map((h) => calculateBSMetricsFromTurn(h));
  }, [game]);

  const stance = useMemo(() => {
    if (!game || bsHistory.length === 0) return null;
    const current =
      calculateBSMetricsFromState(
        game,
        game.history[game.history.length - 1]?.pl.revenue ?? 0,
      ) ?? bsHistory[bsHistory.length - 1]!;
    const previous =
      bsHistory.length >= 2 ? bsHistory[bsHistory.length - 2]! : null;
    return {
      evaluation: evaluateStance(current, previous),
      metrics: current,
    };
  }, [game, bsHistory]);

  if (!game || game.mode !== 'scenario' || !game.scenarioId) {
    return (
      <div className="py-8 text-center text-sm text-slate-600">
        結果がありません
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

  const scenario = getScenarioById(game.scenarioId);
  const result = evaluateScenario(game);
  if (!scenario || !result || !diagnosis) return null;

  const last = game.history[game.history.length - 1];
  const totalOp = game.history.reduce((s, r) => s + r.pl.operatingProfit, 0);
  const lastStrac = last ? resolveSTRACForGame(last, game) : null;

  return (
    <div className="relative flex flex-1 flex-col animate-fade-in">
      <header
        className={`sticky top-0 z-30 -mx-4 border-b px-4 py-3 backdrop-blur ${
          result.success
            ? 'border-green-200 bg-green-50/95'
            : 'border-orange-200 bg-orange-50/95'
        }`}
      >
        <p className="text-xs font-medium text-mg-accent">シナリオ結果</p>
        <h1 className="text-lg font-bold text-mg-primary">{scenario.title}</h1>
        <p className="text-xs text-slate-500">
          {SCENARIO_DIFFICULTY_LABELS[scenario.difficulty]}
        </p>
      </header>

      <div className="flex flex-col gap-3 py-4 pb-2">
        <section
          className={`rounded-2xl px-4 py-6 text-center text-white shadow-md ${
            result.success ? 'bg-mg-success' : 'bg-mg-primary'
          }`}
        >
          <p className="text-sm font-medium opacity-90">
            {result.success ? 'CLEAR' : 'チャレンジ継続'}
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums">
            {formatNumber(result.score)}
            <span className="ml-1 text-base font-normal opacity-80">点</span>
          </p>
          <p className="mt-2 text-sm opacity-90">
            {scenario.successCriteria.description}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs text-slate-500">最終売上</p>
            <p className="font-bold text-mg-primary">
              {formatYen(last?.pl.revenue ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs text-slate-500">累積営業利益</p>
            <p className={`font-bold ${signedColorClass(totalOp)}`}>
              {formatYen(totalOp)}
            </p>
          </div>
        </section>

        <TrendChart history={game.history} />
        <PLStackChart history={game.history} />

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-mg-primary">総評</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {result.message}
          </p>
        </section>

        <section className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
          <p className="text-sm font-bold text-orange-700">
            あなたの意思決定パターン
          </p>
          <p className="mt-2 text-lg font-bold text-mg-primary">
            {diagnosis.pattern}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-800">
            {diagnosis.detail}
          </p>
          {diagnosis.keyMetric.label && (
            <div className="mt-3 rounded-lg bg-white p-2 text-sm">
              <span className="font-bold text-slate-700">
                {diagnosis.keyMetric.label}:{' '}
              </span>
              <span className="font-bold">{diagnosis.keyMetric.value}</span>
              <span className="ml-2 text-slate-500">
                ({diagnosis.keyMetric.benchmark})
              </span>
            </div>
          )}
          {diagnosis.advice && (
            <div className="mt-3 border-t border-orange-200 pt-3">
              <p className="text-sm font-bold text-orange-700">実務への示唆</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">
                {diagnosis.advice}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-mg-accent/30 bg-orange-50/60 p-4">
          <h2 className="text-sm font-bold text-mg-primary">学びのまとめ</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {result.keyLearning}
          </p>
        </section>

        {lastStrac && stance && (
          <AnalysisAccordion>
            <TabSwitcher
              tabs={DETAIL_TABS}
              value={detailTab}
              onChange={setDetailTab}
            />
            {detailTab === 'strac' && <STRACPanel strac={lastStrac} />}
            {detailTab === 'bep' && <BEPPanel strac={lastStrac} />}
            {detailTab === 'bsgraph' && (
              <div className="space-y-3">
                <BSChart
                  history={bsHistory}
                  labels={game.history.map((h) => `${h.turn}期`)}
                />
                <StanceEvaluationPanel
                  evaluation={stance.evaluation}
                  metrics={stance.metrics}
                />
              </div>
            )}
          </AnalysisAccordion>
        )}

        <CoachBubble
          comment={
            result.success
              ? 'よく判断できました。この感覚を、実務の会議でも思い出してみてください。'
              : '惜しい結果でも、学びは残ります。条件を変えてもう一度挑戦してみましょう。'
          }
        />
      </div>

      <StickyFooter>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn-accent w-full" onClick={replayGame}>
            もう一度
          </button>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => setView('scenarioSelect')}
          >
            別のシナリオへ
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
