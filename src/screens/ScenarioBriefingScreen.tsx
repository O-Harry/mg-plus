import { ScreenHeader } from '../components/ScreenHeader';
import { StickyFooter } from '../components/StickyFooter';
import { buildBS } from '../engine/calculations';
import {
  getScenarioById,
  SCENARIO_DIFFICULTY_LABELS,
} from '../engine/scenarios';
import { useGameStore } from '../store/gameStore';
import { formatNumber, formatPercent, formatYen } from '../utils/format';

export function ScenarioBriefingScreen() {
  const game = useGameStore((s) => s.game);
  const setView = useGameStore((s) => s.setView);
  const beginScenarioPlay = useGameStore((s) => s.beginScenarioPlay);

  if (!game || game.mode !== 'scenario' || !game.scenarioId) {
    return (
      <div className="py-8 text-center text-sm text-slate-600">
        シナリオがありません
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={() => setView('scenarioSelect')}
        >
          シナリオ選択へ
        </button>
      </div>
    );
  }

  const scenario = getScenarioById(game.scenarioId);
  if (!scenario) return null;

  const bs = buildBS(game);

  return (
    <div className="relative flex flex-1 flex-col animate-fade-in">
      <ScreenHeader
        title={scenario.title}
        subtitle={`${SCENARIO_DIFFICULTY_LABELS[scenario.difficulty]} / ${scenario.turns}期`}
        onBack={() => setView('scenarioSelect')}
      />

      <div className="flex flex-col gap-3 py-4 pb-2">
        <div className="flex gap-3 rounded-xl bg-orange-50 p-3">
          <img
            src="/assets/kropi.png"
            alt="クロピー"
            className="h-14 w-14 shrink-0 object-contain"
          />
          <p className="text-sm leading-relaxed text-slate-800">
            {scenario.description}
          </p>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-mg-primary">学びのポイント</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {scenario.learningFocus.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-mg-primary">クリア条件</h2>
          <p className="mt-2 text-sm text-slate-700">
            {scenario.successCriteria.description}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-mg-primary">初期BSサマリ</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">現預金</dt>
              <dd className="font-semibold">{formatYen(game.cash)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">総資産</dt>
              <dd className="font-semibold">{formatYen(bs.totalAssets)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">純資産</dt>
              <dd className="font-semibold">{formatYen(bs.totalEquity)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">自己資本比率</dt>
              <dd className="font-semibold">
                {formatPercent(bs.equityRatio)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">従業員</dt>
              <dd className="font-semibold">{formatNumber(game.employees)}人</dd>
            </div>
          </dl>
        </section>
      </div>

      <StickyFooter>
        <button
          type="button"
          className="btn-accent w-full text-base"
          onClick={beginScenarioPlay}
        >
          開始する ▶
        </button>
      </StickyFooter>
    </div>
  );
}
