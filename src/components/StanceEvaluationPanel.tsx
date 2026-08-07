import { BS_TARGETS, type StanceEvaluation } from '../engine/bsMetrics';
import type { BSMetrics } from '../engine/bsMetrics';

type Props = {
  evaluation: StanceEvaluation;
  metrics: BSMetrics;
};

export function StanceEvaluationPanel({ evaluation, metrics }: Props) {
  const colorMap: Record<string, string> = {
    aggressive: 'border-orange-400 bg-orange-50',
    defensive: 'border-blue-400 bg-blue-50',
    growth: 'border-violet-400 bg-violet-50',
    crisis: 'border-red-500 bg-red-50',
    stable: 'border-slate-400 bg-slate-50',
  };

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border-2 p-4 ${colorMap[evaluation.stance] ?? ''}`}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="text-3xl" aria-hidden>
            {evaluation.emoji}
          </span>
          <div>
            <p className="text-xs text-slate-500">今の会社の姿勢</p>
            <p className="text-xl font-bold">{evaluation.label}</p>
          </div>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{evaluation.message}</p>
        {evaluation.warnings.length > 0 && (
          <div className="mt-3 border-t border-slate-300 pt-3">
            <p className="mb-1 text-xs font-bold text-red-700">
              目標値からの乖離
            </p>
            <ul className="space-y-1 text-xs text-slate-700">
              {evaluation.warnings.map((w) => (
                <li key={w}>・{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-bold text-mg-primary">
          目標値との比較
        </h3>
        <table className="w-full text-sm">
          <tbody>
            <TargetRow
              label="自己資本比率"
              actual={metrics.equityRatio}
              target={BS_TARGETS.equityRatio}
              higherBetter
              format={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <TargetRow
              label="当座比率"
              actual={metrics.currentRatio}
              target={BS_TARGETS.currentRatio}
              higherBetter
              format={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <TargetRow
              label="固定長期適合率"
              actual={metrics.fixedLongTermRatio}
              target={BS_TARGETS.fixedLongTermRatio}
              higherBetter={false}
              format={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <TargetRow
              label="借入金月商倍率"
              actual={metrics.debtToMonthlySales}
              target={BS_TARGETS.debtToMonthlySales}
              higherBetter={false}
              format={(v) => `${v.toFixed(1)}ヶ月`}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TargetRow({
  label,
  actual,
  target,
  higherBetter,
  format,
}: {
  label: string;
  actual: number;
  target: number;
  higherBetter: boolean;
  format: (v: number) => string;
}) {
  const ok = higherBetter ? actual >= target : actual <= target;
  const near = higherBetter
    ? actual >= target * 0.8
    : actual <= target * 1.2;
  const color = ok
    ? 'text-green-700'
    : near
      ? 'text-amber-700'
      : 'text-red-700';

  return (
    <tr className="border-b border-slate-100">
      <td className="py-1.5 text-slate-600">{label}</td>
      <td className={`py-1.5 text-right font-bold ${color}`}>
        {format(actual)}
      </td>
      <td className="py-1.5 text-right text-xs text-slate-400">
        目標 {format(target)}
      </td>
    </tr>
  );
}
