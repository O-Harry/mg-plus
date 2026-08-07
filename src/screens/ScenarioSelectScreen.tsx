import { ScreenHeader } from '../components/ScreenHeader';
import {
  SCENARIOS,
  SCENARIO_DIFFICULTY_LABELS,
} from '../engine/scenarios';
import { useGameStore } from '../store/gameStore';
import type { ScenarioId } from '../types/game';

export function ScenarioSelectScreen() {
  const setView = useGameStore((s) => s.setView);
  const startScenario = useGameStore((s) => s.startScenario);
  const hasInProgressSave = useGameStore((s) => s.hasInProgressSave);

  const pick = (id: ScenarioId) => {
    if (hasInProgressSave()) {
      const ok = window.confirm(
        '進行中のセーブがあります。シナリオを始めると上書きされます。よろしいですか？',
      );
      if (!ok) return;
    }
    startScenario(id);
  };

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <ScreenHeader
        title="シナリオモード"
        subtitle="3期完結の学習シナリオ"
        onBack={() => setView('title')}
      />

      <p className="py-3 text-sm leading-relaxed text-slate-600">
        実務に近いテーマで、短い期間に集中して経営判断を練習します。
      </p>

      <div className="flex flex-col gap-3 pb-8">
        {SCENARIOS.map((scenario) => (
          <article
            key={scenario.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-mg-primary">
                {scenario.title}
              </h2>
              <span className="shrink-0 rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-mg-accent">
                {SCENARIO_DIFFICULTY_LABELS[scenario.difficulty]}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {scenario.description}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {scenario.learningFocus.map((focus) => (
                <li
                  key={focus}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                >
                  {focus}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              目標: {scenario.successCriteria.description}
            </p>
            <button
              type="button"
              className="btn-accent mt-3 w-full text-sm"
              onClick={() => pick(scenario.id)}
            >
              このシナリオを始める
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
