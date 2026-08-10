import { useState } from 'react';
import { CoachBubble } from '../components/CoachBubble';
import { PLTable } from '../components/PLTable';
import { StickyFooter } from '../components/StickyFooter';
import { getPlaybook, type PlaybookTurn } from '../engine/playbooks';
import { getScenarioById } from '../engine/scenarios';
import { useGameStore } from '../store/gameStore';
import type { Decision, TurnResult } from '../types/game';
import { formatYen, signedColorClass } from '../utils/format';

type Step =
  | { kind: 'overview' }
  | { kind: 'situation'; turn: number }
  | { kind: 'decision'; turn: number }
  | { kind: 'result'; turn: number }
  | { kind: 'summary' };

const INVEST_LABELS: Record<string, string> = {
  ad: '広告',
  equipment: '設備',
  rd: '研究開発',
};

export function DemoPlaybackScreen() {
  const game = useGameStore((s) => s.game);
  const executeDemoTurn = useGameStore((s) => s.executeDemoTurn);
  const finishDemoAndPlay = useGameStore((s) => s.finishDemoAndPlay);
  const exitDemoPlayback = useGameStore((s) => s.exitDemoPlayback);
  const [step, setStep] = useState<Step>({ kind: 'overview' });

  const scenarioId = game?.scenarioId;
  const playbook = scenarioId ? getPlaybook(scenarioId) : undefined;
  const scenario = scenarioId ? getScenarioById(scenarioId) : undefined;

  if (!game || !playbook || !scenario || !scenarioId) {
    return (
      <div className="py-8 text-center text-sm text-slate-600">
        お手本データがありません
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={exitDemoPlayback}
        >
          シナリオ選択へ
        </button>
      </div>
    );
  }

  const goNext = () => {
    if (step.kind === 'overview') {
      setStep({ kind: 'situation', turn: 1 });
      return;
    }
    if (step.kind === 'situation') {
      setStep({ kind: 'decision', turn: step.turn });
      return;
    }
    if (step.kind === 'decision') {
      const pbTurn = playbook.turns[step.turn - 1];
      if (!pbTurn) return;
      executeDemoTurn(pbTurn.recommendedDecision);
      setStep({ kind: 'result', turn: step.turn });
      return;
    }
    if (step.kind === 'result') {
      if (step.turn < playbook.turns.length) {
        setStep({ kind: 'situation', turn: step.turn + 1 });
      } else {
        setStep({ kind: 'summary' });
      }
      return;
    }
    if (step.kind === 'summary') {
      finishDemoAndPlay();
    }
  };

  const stepLabel =
    step.kind === 'situation'
      ? '状況分析'
      : step.kind === 'decision'
        ? '意思決定'
        : step.kind === 'result'
          ? '結果'
          : null;

  return (
    <div className="relative flex flex-1 flex-col animate-fade-in">
      <header className="sticky top-0 z-30 -mx-4 border-b border-orange-200 bg-orange-50/95 px-4 py-3 backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-mg-accent">
              クロピーのお手本
            </p>
            <h1 className="text-lg font-bold text-mg-primary">
              {scenario.title}
            </h1>
            {stepLabel && 'turn' in step && (
              <p className="text-xs text-slate-500">
                第{step.turn}期 — {stepLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            className="min-h-[44px] shrink-0 px-2 text-sm font-semibold text-slate-500"
            onClick={exitDemoPlayback}
          >
            閉じる
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 py-4 pb-2">
        {step.kind === 'overview' && <OverviewCard playbook={playbook} />}
        {step.kind === 'situation' && (
          <SituationCard turn={playbook.turns[step.turn - 1]!} />
        )}
        {step.kind === 'decision' && (
          <DecisionCard turn={playbook.turns[step.turn - 1]!} />
        )}
        {step.kind === 'result' && (
          <ResultCard
            result={game.history[step.turn - 1]}
            keyLesson={playbook.turns[step.turn - 1]!.keyLesson}
          />
        )}
        {step.kind === 'summary' && (
          <SummaryCard history={game.history} />
        )}
      </div>

      <StickyFooter>
        <button type="button" className="btn-accent w-full text-base" onClick={goNext}>
          {step.kind === 'summary' ? '自分でやってみる ▶' : '次へ ▶'}
        </button>
      </StickyFooter>
    </div>
  );
}

function OverviewCard({
  playbook,
}: {
  playbook: { overview: string; strategy: string };
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-mg-primary">このシナリオの学び</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        {playbook.overview}
      </p>
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="text-sm font-bold text-mg-accent">3期通しての戦略</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          {playbook.strategy}
        </p>
      </div>
    </div>
  );
}

function SituationCard({ turn }: { turn: PlaybookTurn }) {
  return <CoachBubble comment={turn.situationAnalysis} />;
}

function DecisionCard({ turn }: { turn: PlaybookTurn }) {
  const d: Decision = turn.recommendedDecision;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
        <p className="mb-2 text-sm font-bold text-orange-700">クロピーの推奨</p>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-slate-600">材料仕入</span>
          <span className="text-right font-bold">
            {d.materialPurchase.toLocaleString('ja-JP')}千円
          </span>
          <span className="text-slate-600">生産量</span>
          <span className="text-right font-bold">{d.productionQty}個</span>
          <span className="text-slate-600">販売価格</span>
          <span className="text-right font-bold">{d.unitPrice}千円/個</span>
          <span className="text-slate-600">人員調整</span>
          <span className="text-right font-bold">
            {d.employeeChange >= 0 ? '+' : ''}
            {d.employeeChange}人
          </span>
          <span className="text-slate-600">投資</span>
          <span className="text-right font-bold">
            {d.investments.length > 0
              ? d.investments.map((i) => INVEST_LABELS[i] ?? i).join('・')
              : 'なし'}
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-bold text-mg-primary">なぜこの判断か</p>
        <ul className="space-y-2 text-sm text-slate-700">
          {turn.reasoning.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-mg-accent">▪</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ResultCard({
  result,
  keyLesson,
}: {
  result: TurnResult | undefined;
  keyLesson: string;
}) {
  if (!result) {
    return (
      <p className="text-sm text-slate-500">結果の読み込みに失敗しました</p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-bold text-mg-primary">決算結果</p>
        <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-slate-50 px-2 py-2">
            <p className="text-xs text-slate-500">売上高</p>
            <p className="font-bold text-mg-primary">
              {formatYen(result.pl.revenue)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-2">
            <p className="text-xs text-slate-500">営業利益</p>
            <p
              className={`font-bold ${signedColorClass(result.pl.operatingProfit)}`}
            >
              {formatYen(result.pl.operatingProfit)}
            </p>
          </div>
        </div>
        <PLTable pl={result.pl} />
      </div>
      <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
        <p className="mb-1 text-sm font-bold text-green-700">この期の教訓</p>
        <p className="text-sm text-slate-800">{keyLesson}</p>
      </div>
    </div>
  );
}

function SummaryCard({ history }: { history: TurnResult[] }) {
  const finalPL = history[history.length - 1]?.pl;
  const totalOp = history.reduce((s, h) => s + h.pl.operatingProfit, 0);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-mg-primary">お手本プレイ完了</h2>
        <p className="mt-2 text-sm text-slate-700">
          クロピーの判断で3期を通した結果:
        </p>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            3期目営業利益:{' '}
            <span
              className={`font-bold ${signedColorClass(finalPL?.operatingProfit ?? 0)}`}
            >
              {formatYen(finalPL?.operatingProfit ?? 0)}
            </span>
          </p>
          <p>
            3期累積営業利益:{' '}
            <span className={`font-bold ${signedColorClass(totalOp)}`}>
              {formatYen(totalOp)}
            </span>
          </p>
        </div>
      </div>
      <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
        <p className="mb-2 text-sm font-bold text-orange-700">次はあなたの番</p>
        <p className="text-sm leading-relaxed text-slate-800">
          お手本を見た後は、自分でやってみましょう。全く同じ判断でも良いし、少しずつアレンジしてもOK。「守破離」の「守」の段階です。真似から始めて、自分のスタイルを見つけていきましょう。
        </p>
      </div>
    </div>
  );
}
