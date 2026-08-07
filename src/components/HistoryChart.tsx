import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TurnResult } from '../types/game';

type Props = {
  history: TurnResult[];
  height?: number;
};

/** 全期の売上・純利益推移（最終結果向け・縦長でも読める） */
export function HistoryChart({ history, height = 260 }: Props) {
  const rows = history.map((h) => ({
    turn: `${h.turn}`,
    売上: h.pl.revenue,
    純利益: h.pl.netProfit,
  }));

  if (rows.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500"
        style={{ height }}
      >
        データがありません
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 12, right: 8, left: -8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="turn"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            label={{
              value: '期',
              position: 'insideBottomRight',
              offset: -4,
              fontSize: 11,
              fill: '#94a3b8',
            }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            width={52}
            tickFormatter={(v: number) =>
              Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}千` : String(v)
            }
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
            labelFormatter={(label) => `第${label}期`}
            formatter={(value) =>
              `${Math.round(Number(value)).toLocaleString('ja-JP')}千円`
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="売上"
            stroke="#1F3864"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="純利益"
            stroke="#F57C00"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
