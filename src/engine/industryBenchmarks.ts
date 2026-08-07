// TKC 黒字企業平均 (機械・同部分品製造修理業)
// 出典: 令和8年版 ロカベンレポート（仕様書より）

export const INDUSTRY_BENCHMARKS = {
  industry: '機械・同部分品製造修理業',
  scale: '売上1億〜2.5億円未満、小規模事業者',
  metrics: {
    salesGrowthRate: 0.069,
    operatingMargin: 0.054,
    laborProductivity: 765,
    ebitdaToDebt: 0.0,
    workingCapitalMonths: 1.9,
    equityRatio: 0.571,
    grossMargin: 0.25,
    sgaRatio: 0.2,
  },
} as const;

export type BenchmarkMetric = keyof typeof INDUSTRY_BENCHMARKS.metrics;

export type BenchmarkLevel = 'safe' | 'average' | 'warning' | 'danger';

export function evaluateAgainstBenchmark(
  metric: BenchmarkMetric,
  actualValue: number,
): { level: BenchmarkLevel; message: string; deviation: number } {
  const benchmark = INDUSTRY_BENCHMARKS.metrics[metric];
  const deviation =
    benchmark === 0 ? 0 : (actualValue - benchmark) / Math.abs(benchmark);

  const higherIsBetter = [
    'operatingMargin',
    'laborProductivity',
    'equityRatio',
    'grossMargin',
    'salesGrowthRate',
  ].includes(metric);

  let level: BenchmarkLevel;
  if (higherIsBetter) {
    if (deviation >= 0.2) level = 'safe';
    else if (deviation >= -0.1) level = 'average';
    else if (deviation >= -0.3) level = 'warning';
    else level = 'danger';
  } else {
    if (deviation <= -0.2) level = 'safe';
    else if (deviation <= 0.1) level = 'average';
    else if (deviation <= 0.3) level = 'warning';
    else level = 'danger';
  }

  const pct = (deviation * 100).toFixed(0);
  const messages: Record<BenchmarkLevel, string> = {
    safe: `安全域。業界平均より${pct}%良好`,
    average: '業界平均水準',
    warning: `注意域。業界平均より${pct}%乖離`,
    danger: `危険域。業界平均から${pct}%乖離`,
  };

  return { level, message: messages[level], deviation };
}

export const LEVEL_LABEL: Record<BenchmarkLevel, string> = {
  safe: '🟢 安全域',
  average: '🟡 平均水準',
  warning: '🟠 注意域',
  danger: '🔴 危険域',
};

export function formatBenchmarkValue(
  metric: BenchmarkMetric,
  value: number,
): string {
  if (
    metric === 'operatingMargin' ||
    metric === 'grossMargin' ||
    metric === 'equityRatio' ||
    metric === 'sgaRatio' ||
    metric === 'salesGrowthRate'
  ) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (metric === 'laborProductivity') {
    return `${Math.round(value).toLocaleString('ja-JP')}千円/人`;
  }
  if (metric === 'workingCapitalMonths') {
    return `${value.toFixed(1)}ヶ月`;
  }
  return value.toLocaleString('ja-JP');
}
