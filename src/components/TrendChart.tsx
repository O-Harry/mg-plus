import {
  Bar,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TurnResult } from '../types/game';

type Props = {
  history: TurnResult[];
};

/** シナリオ結果向け: 売上・営業利益・販売価格の推移 */
export function TrendChart({ history }: Props) {
  const data = history.map((h) => ({
    turn: `${h.turn}期`,
    売上高: h.pl.revenue,
    営業利益: h.pl.operatingProfit,
    販売価格: h.decision.unitPrice,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
        推移データがありません
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h2 className="mb-2 text-sm font-bold text-mg-primary">3期の推移</h2>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 5, left: 0 }}>
          <XAxis dataKey="turn" fontSize={12} />
          <YAxis
            yAxisId="left"
            fontSize={10}
            width={36}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <YAxis yAxisId="right" orientation="right" fontSize={10} width={28} />
          <Tooltip
            formatter={(v) =>
              typeof v === 'number' ? v.toLocaleString('ja-JP') : String(v)
            }
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar yAxisId="left" dataKey="売上高" fill="#1F3864" />
          <Bar yAxisId="left" dataKey="営業利益" fill="#F57C00" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="販売価格"
            stroke="#2E7D32"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs text-slate-500">
        左軸: 千円 / 右軸: 販売価格(千円/個)
      </p>
    </div>
  );
}
