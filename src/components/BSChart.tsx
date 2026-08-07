import type { BSMetrics } from '../engine/bsMetrics';

type Props = {
  history: BSMetrics[];
  labels: string[];
};

export function BSChart({ history, labels }: Props) {
  const maxAssets = Math.max(...history.map((m) => m.totalAssets), 1);

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
        BSデータがありません
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-mg-primary">
        BSグラフ（期別比較）
      </h3>
      <div className="flex items-end justify-around" style={{ height: 240 }}>
        {history.map((m, i) => (
          <BSColumn
            key={labels[i] ?? i}
            metrics={m}
            label={labels[i] ?? `${i + 1}期`}
            maxAssets={maxAssets}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-600">
        <Legend color="bg-green-400" label="流動資産" />
        <Legend color="bg-blue-500" label="固定資産" />
        <Legend color="bg-red-400" label="流動負債" />
        <Legend color="bg-orange-400" label="固定負債" />
        <Legend color="bg-indigo-600" label="純資産" />
      </div>
    </div>
  );
}

function BSColumn({
  metrics,
  label,
  maxAssets,
}: {
  metrics: BSMetrics;
  label: string;
  maxAssets: number;
}) {
  const heightRatio = metrics.totalAssets / maxAssets;
  const totalHeight = Math.max(40, 200 * heightRatio);
  const {
    currentAssets,
    fixedAssets,
    currentLiabilities,
    fixedLiabilities,
    equity,
    totalAssets,
  } = metrics;
  const denom = Math.max(totalAssets, 1);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-1" style={{ height: totalHeight }}>
        <div
          className="flex w-8 flex-col justify-end overflow-hidden rounded-t"
          style={{ height: totalHeight }}
        >
          <div
            className="bg-blue-500"
            style={{ height: `${(fixedAssets / denom) * 100}%` }}
            title={`固定資産 ${Math.round(fixedAssets).toLocaleString('ja-JP')}`}
          />
          <div
            className="bg-green-400"
            style={{ height: `${(currentAssets / denom) * 100}%` }}
            title={`流動資産 ${Math.round(currentAssets).toLocaleString('ja-JP')}`}
          />
        </div>
        <div
          className="flex w-8 flex-col justify-end overflow-hidden rounded-t"
          style={{ height: totalHeight }}
        >
          <div
            className="bg-indigo-600"
            style={{ height: `${(equity / denom) * 100}%` }}
            title={`純資産 ${Math.round(equity).toLocaleString('ja-JP')}`}
          />
          <div
            className="bg-orange-400"
            style={{ height: `${(fixedLiabilities / denom) * 100}%` }}
            title={`固定負債 ${Math.round(fixedLiabilities).toLocaleString('ja-JP')}`}
          />
          <div
            className="bg-red-400"
            style={{ height: `${(currentLiabilities / denom) * 100}%` }}
            title={`流動負債 ${Math.round(currentLiabilities).toLocaleString('ja-JP')}`}
          />
        </div>
      </div>
      <div className="mt-1 text-xs font-bold">{label}</div>
      <div className="text-[10px] text-slate-500">
        {Math.round(totalAssets / 1000)}M
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`h-3 w-3 rounded ${color}`} />
      {label}
    </div>
  );
}
