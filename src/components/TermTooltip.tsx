import { useState, type ReactNode } from 'react';
import { getGlossaryEntry } from '../engine/glossary';
import {
  evaluateAgainstBenchmark,
  formatBenchmarkValue,
  INDUSTRY_BENCHMARKS,
  LEVEL_LABEL,
  type BenchmarkMetric,
} from '../engine/industryBenchmarks';
import { useFinancialMetrics } from './FinancialMetricsContext';

type Props = {
  term: string;
  children?: ReactNode;
  /** 実績値を明示指定（なければ Context から取得） */
  actualValue?: number;
};

const LEVEL_STYLE = {
  safe: 'bg-green-50 text-mg-success border-green-200',
  average: 'bg-slate-50 text-slate-700 border-slate-200',
  warning: 'bg-orange-50 text-mg-accent border-orange-200',
  danger: 'bg-red-50 text-mg-danger border-red-200',
} as const;

/** 用語タップで解説モーダルを開く */
export function TermTooltip({ term, children, actualValue }: Props) {
  const [open, setOpen] = useState(false);
  const metrics = useFinancialMetrics();
  const entry = getGlossaryEntry(term);

  const label = children ?? entry?.term ?? term;

  if (!entry) {
    return <span>{label}</span>;
  }

  const resolvedActual =
    actualValue ??
    (entry.benchmarkMetric
      ? metrics?.[entry.benchmarkMetric]
      : undefined);

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-[36px] min-w-[36px] items-center border-b border-dashed border-mg-accent/70 text-left text-inherit"
        onClick={() => setOpen(true)}
        aria-label={`${entry.term}の解説`}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85svh] w-full max-w-[343px] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-mg-primary">{entry.term}</h2>

            <Section title="定義">
              <p>{entry.definition}</p>
            </Section>

            <Section title="なぜ経営で重要か">
              <p>{entry.whyItMatters}</p>
            </Section>

            {entry.formula && (
              <Section title="計算式">
                <p className="font-mono text-sm">{entry.formula}</p>
              </Section>
            )}

            {entry.benchmark && (
              <Section title="業界基準">
                <p>
                  {entry.benchmark.label}:{' '}
                  <span className="font-semibold">{entry.benchmark.value}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  出典: {entry.benchmark.source} /{' '}
                  {INDUSTRY_BENCHMARKS.industry}
                </p>
              </Section>
            )}

            {entry.benchmarkMetric && resolvedActual !== undefined && (
              <BenchmarkBlock
                metric={entry.benchmarkMetric}
                actual={resolvedActual}
              />
            )}

            <button
              type="button"
              className="btn-primary mt-4 w-full"
              onClick={() => setOpen(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-3">
      <h3 className="text-xs font-bold tracking-wide text-slate-500">{title}</h3>
      <div className="mt-1 text-sm leading-relaxed text-slate-800">
        {children}
      </div>
    </div>
  );
}

function BenchmarkBlock({
  metric,
  actual,
}: {
  metric: BenchmarkMetric;
  actual: number;
}) {
  const evaluation = evaluateAgainstBenchmark(metric, actual);
  const bench = INDUSTRY_BENCHMARKS.metrics[metric];

  return (
    <Section title="今期の値と業界比較">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p>
          【今期の値】{' '}
          <span className="font-bold text-mg-primary">
            {formatBenchmarkValue(metric, actual)}
          </span>
        </p>
        <p className="mt-1">
          【業界平均】 {formatBenchmarkValue(metric, bench)}
          <span className="ml-1 text-xs text-slate-500">
            (TKC 黒字企業平均)
          </span>
        </p>
        <p
          className={`mt-2 rounded-lg border px-2 py-1.5 text-sm font-semibold ${LEVEL_STYLE[evaluation.level]}`}
        >
          【評価】 {LEVEL_LABEL[evaluation.level]} — {evaluation.message}
        </p>
      </div>
    </Section>
  );
}
