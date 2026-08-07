import { evaluateLaborShare } from '../engine/strac';
import type { STRAC } from '../types/game';

type Props = { strac: STRAC };

export function STRACPanel({ strac }: Props) {
  const { P, V, M, Q, PQ, VQ, MQ, F, G, marginRatio, laborShare } = strac;
  const laborEval = evaluateLaborShare(laborShare);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-bold text-mg-primary">
          単位あたり（1個ごと）
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <MetricCard label="P" fullName="単価" value={P.toFixed(1)} unit="千円" color="blue" />
          <MetricCard label="V" fullName="変動費" value={V.toFixed(1)} unit="千円" color="red" />
          <MetricCard label="M" fullName="限界利益" value={M.toFixed(1)} unit="千円" color="green" />
        </div>
        <p className="mt-2 text-xs text-slate-500">M = P − V（1個売って残る利益）</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-bold text-mg-primary">総額（今期実績）</h3>
        <div className="space-y-2">
          <BigMetric label="Q" fullName="販売数量" value={`${Q}`} unit="個" />
          <BigMetric label="PQ" fullName="売上高" value={PQ.toLocaleString('ja-JP')} unit="千円" bold />
          <BigMetric label="VQ" fullName="変動費総額" value={VQ.toLocaleString('ja-JP')} unit="千円" color="red" />
          <BigMetric label="MQ" fullName="限界利益" value={MQ.toLocaleString('ja-JP')} unit="千円" color="green" bold />
          <BigMetric label="F" fullName="固定費" value={F.toLocaleString('ja-JP')} unit="千円" color="orange" />
          <BigMetric
            label="G"
            fullName="利益"
            value={G.toLocaleString('ja-JP')}
            unit="千円"
            color={G >= 0 ? 'green' : 'red'}
            bold
          />
        </div>
        <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2 text-xs text-slate-500">
          <p>MQ = PQ − VQ（売上から材料費を引いた粗利）</p>
          <p>G = MQ − F（粗利から固定費を引いた利益）</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-bold text-mg-primary">派生指標</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>限界利益率 (MQ/PQ)</span>
            <span className="font-bold">{(marginRatio * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>労働分配率 (人件費/MQ)</span>
            <div className="text-right">
              <div className="font-bold">{(laborShare * 100).toFixed(1)}%</div>
              <div
                className={`text-xs ${
                  laborEval.level === 'good' || laborEval.level === 'excellent'
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`}
              >
                {laborEval.message}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-sm font-bold text-mg-primary">固定費 F の内訳</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>人件費</span>
            <span>{strac.fixedCostBreakdown.labor.toLocaleString('ja-JP')}</span>
          </div>
          <div className="flex justify-between">
            <span>減価償却費</span>
            <span>
              {strac.fixedCostBreakdown.depreciation.toLocaleString('ja-JP')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>その他販管費</span>
            <span>
              {strac.fixedCostBreakdown.otherSga.toLocaleString('ja-JP')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>支払利息</span>
            <span>
              {strac.fixedCostBreakdown.interest.toLocaleString('ja-JP')}
            </span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-100 pt-1 font-bold">
            <span>合計 F</span>
            <span>{F.toLocaleString('ja-JP')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  fullName,
  value,
  unit,
  color,
}: {
  label: string;
  fullName: string;
  value: string;
  unit: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    green: 'border-green-200 bg-green-50 text-green-700',
  };
  return (
    <div className={`rounded-lg border p-2 ${colorMap[color] ?? ''}`}>
      <div className="text-xs font-bold">{label}</div>
      <div className="text-[10px] opacity-80">{fullName}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
      <div className="text-[10px] text-slate-500">{unit}</div>
    </div>
  );
}

function BigMetric({
  label,
  fullName,
  value,
  unit,
  color,
  bold,
}: {
  label: string;
  fullName: string;
  value: string;
  unit: string;
  color?: string;
  bold?: boolean;
}) {
  const colorMap: Record<string, string> = {
    red: 'text-red-700',
    green: 'text-green-700',
    orange: 'text-orange-700',
  };
  return (
    <div className="flex items-baseline justify-between">
      <div>
        <span className={`font-bold ${bold ? 'text-base' : 'text-sm'}`}>
          {label}
        </span>
        <span className="ml-2 text-xs text-slate-500">{fullName}</span>
      </div>
      <div
        className={`${bold ? 'text-lg font-bold' : 'text-base'} ${
          color ? colorMap[color] : ''
        }`}
      >
        {value}
        <span className="ml-1 text-xs text-slate-500">{unit}</span>
      </div>
    </div>
  );
}
