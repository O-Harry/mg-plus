import { useState } from 'react';
import { calculateBEP, simulateWhatIf } from '../engine/strac';
import type { STRAC } from '../types/game';

type Props = { strac: STRAC };

export function BEPPanel({ strac }: Props) {
  const bep = calculateBEP(strac);
  const [priceChange, setPriceChange] = useState(0);
  const [fixedChange, setFixedChange] = useState(0);
  const whatif = simulateWhatIf(strac, {
    priceChange: priceChange / 100,
    fixedCostChange: fixedChange / 100,
  });

  const levelColor: Record<string, string> = {
    excellent: 'border-green-300 bg-green-50 text-green-700',
    good: 'border-green-200 bg-green-50 text-green-600',
    warning: 'border-orange-300 bg-orange-50 text-orange-700',
    danger: 'border-red-300 bg-red-50 text-red-700',
  };

  const pq = Math.max(strac.PQ, 1);

  return (
    <div className="space-y-3">
      <div className={`rounded-xl border-2 p-3 ${levelColor[bep.level]}`}>
        <h3 className="mb-2 text-sm font-bold">損益分岐点分析</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>損益分岐点売上高</span>
            <span className="font-bold">
              {Math.round(bep.bepRevenue).toLocaleString('ja-JP')}千円
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>損益分岐点比率</span>
            <span className="text-lg font-bold">
              {(bep.bepRatio * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>安全余裕率</span>
            <span className="font-bold">
              {(bep.safetyMargin * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm">{bep.message}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-mg-primary">
          未来会計の流れ
        </h3>
        <FlowRow label="売上高 PQ" value={strac.PQ} color="blue" width={100} />
        <FlowArrow />
        <FlowRow
          label="変動費 VQ"
          value={strac.VQ}
          color="red"
          width={(strac.VQ / pq) * 100}
          sub="材料費など"
        />
        <FlowArrow />
        <FlowRow
          label="限界利益 MQ"
          value={strac.MQ}
          color="green"
          width={(strac.MQ / pq) * 100}
          sub={`限界利益率 ${(strac.marginRatio * 100).toFixed(1)}%`}
          bold
        />
        <FlowArrow />
        <FlowRow
          label="固定費 F"
          value={strac.F}
          color="orange"
          width={(strac.F / pq) * 100}
          sub="人件費・減価償却など"
        />
        <FlowArrow />
        <FlowRow
          label="利益 G"
          value={strac.G}
          color={strac.G >= 0 ? 'green' : 'red'}
          width={Math.abs((strac.G / pq) * 100)}
          bold
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-mg-primary">
          What-if シミュレーション
        </h3>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>販売価格 P を</span>
              <span className="font-bold">
                {priceChange >= 0 ? '+' : ''}
                {priceChange}%
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={20}
              value={priceChange}
              onChange={(e) => setPriceChange(Number(e.target.value))}
              className="w-full accent-mg-accent"
            />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>固定費 F を</span>
              <span className="font-bold">
                {fixedChange >= 0 ? '+' : ''}
                {fixedChange}%
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={20}
              value={fixedChange}
              onChange={(e) => setFixedChange(Number(e.target.value))}
              className="w-full accent-mg-accent"
            />
          </div>
        </div>
        <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-2">
          <div className="flex justify-between text-sm">
            <span>予想利益 G</span>
            <span
              className={`font-bold ${
                whatif.G >= 0 ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {Math.round(whatif.G).toLocaleString('ja-JP')}千円
              <span className="ml-1 text-xs text-slate-500">
                ({whatif.gDelta >= 0 ? '+' : ''}
                {Math.round(whatif.gDelta).toLocaleString('ja-JP')})
              </span>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>損益分岐点比率</span>
            <span className="font-bold">
              {(whatif.bepRatio * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          価格を上げるほど利益が伸び、固定費を下げるほど損益分岐点が下がる。
        </p>
      </div>
    </div>
  );
}

function FlowRow({
  label,
  value,
  color,
  width,
  sub,
  bold,
}: {
  label: string;
  value: number;
  color: string;
  width: number;
  sub?: string;
  bold?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    red: 'bg-red-400',
    green: 'bg-green-500',
    orange: 'bg-orange-400',
  };
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-sm">
        <span className={bold ? 'font-bold' : ''}>{label}</span>
        <span className={bold ? 'font-bold' : ''}>
          {Math.round(value).toLocaleString('ja-JP')}千円
        </span>
      </div>
      <div className="h-4 overflow-hidden rounded bg-slate-100">
        <div
          className={`h-full ${colorMap[color] ?? 'bg-slate-400'}`}
          style={{ width: `${Math.min(Math.max(width, 0), 100)}%` }}
        />
      </div>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function FlowArrow() {
  return <div className="my-1 text-center text-xs text-slate-400">▼</div>;
}
