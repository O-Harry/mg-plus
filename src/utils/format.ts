/** 千円単位の数値をカンマ区切りで表示 */
export function formatYen(value: number): string {
  return `${Math.round(value).toLocaleString('ja-JP')}千円`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('ja-JP');
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** 符号付き（プラスは+付き） */
export function formatSigned(value: number): string {
  const n = Math.round(value);
  const body = Math.abs(n).toLocaleString('ja-JP');
  if (n > 0) return `+${body}`;
  if (n < 0) return `-${body}`;
  return body;
}

export function signedColorClass(value: number): string {
  if (value > 0) return 'text-mg-success';
  if (value < 0) return 'text-mg-danger';
  return 'text-slate-800';
}
