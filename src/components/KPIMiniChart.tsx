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
  /** 直近何期分を表示するか */
  limit?: number;
};

type ChartRow = {
  turn: string;
  売上: number;
  営業利益: number;
};

/** 直近N期の売上・営業利益スパークライン */
export function KPIMiniChart({ history, limit = 5 }: Props) {
  const rows: ChartRow[] = history.slice(-limit).map((h) => ({
    turn: `${h.turn}期`,
    売上: h.pl.revenue,
    営業利益: h.pl.operatingProfit,
  }));

  if (rows.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
        まだ業績データがありません
      </div>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="turn"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            width={48}
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
            formatter={(value) =>
              `${Math.round(Number(value)).toLocaleString('ja-JP')}千円`
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="売上"
            stroke="#1F3864"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="営業利益"
            stroke="#F57C00"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
