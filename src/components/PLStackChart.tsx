import type { TurnResult } from '../types/game';

type Props = {
  history: TurnResult[];
};

/** 売上=100%スケールのPL積み上げ（期ごとの棒幅は売上規模に比例） */
export function PLStackChart({ history }: Props) {
  const maxRevenue = Math.max(...history.map((h) => h.pl.revenue), 1);

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
        PLデータがありません
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h2 className="mb-2 text-sm font-bold text-mg-primary">
        PLの内訳（売上スケール比較）
      </h2>
      <div className="space-y-4">
        {history.map((h) => {
          const { revenue, cogs, sga, operatingProfit } = h.pl;
          const totalWidth = (revenue / maxRevenue) * 100;
          const cogsPct = revenue > 0 ? (cogs / revenue) * 100 : 0;
          const sgaPct = revenue > 0 ? (sga / revenue) * 100 : 0;
          const opPct = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;
          const isLoss = operatingProfit < 0;
          const costOver = cogs + sga > revenue && revenue > 0;
          const overAmount = Math.max(0, cogs + sga - revenue);

          return (
            <div key={h.turn}>
              <div className="mb-1 flex justify-between text-sm font-bold">
                <span>{h.turn}期</span>
                <span className="font-normal text-slate-500">
                  売上 {revenue.toLocaleString('ja-JP')}千円
                </span>
              </div>
              <div
                className="relative h-8 overflow-hidden rounded bg-slate-100"
                style={{ width: `${Math.max(totalWidth, 8)}%` }}
              >
                <div
                  className="absolute flex h-full items-center justify-center bg-red-400 text-xs font-bold text-white"
                  style={{ width: `${Math.min(cogsPct, 100)}%`, left: 0 }}
                  title={`売上原価 ${cogs.toLocaleString('ja-JP')}千円`}
                >
                  {cogsPct > 12 ? `原価${Math.round(cogsPct)}%` : ''}
                </div>
                <div
                  className="absolute flex h-full items-center justify-center bg-orange-400 text-xs font-bold text-white"
                  style={{
                    width: `${Math.min(sgaPct, 100)}%`,
                    left: `${Math.min(cogsPct, 100)}%`,
                  }}
                  title={`販管費 ${sga.toLocaleString('ja-JP')}千円`}
                >
                  {sgaPct > 12 ? `販管${Math.round(sgaPct)}%` : ''}
                </div>
                {!isLoss && (
                  <div
                    className="absolute flex h-full items-center justify-center bg-green-600 text-xs font-bold text-white"
                    style={{
                      width: `${Math.min(Math.abs(opPct), 100)}%`,
                      left: `${Math.min(cogsPct + sgaPct, 100)}%`,
                    }}
                    title={`営業利益 ${operatingProfit.toLocaleString('ja-JP')}千円`}
                  >
                    {Math.abs(opPct) > 10
                      ? `利${Math.round(opPct)}%`
                      : ''}
                  </div>
                )}
              </div>
              {isLoss && (
                <div className="mt-1 flex h-5 items-center rounded bg-red-800 px-2 text-xs font-bold text-white">
                  営業損失 {operatingProfit.toLocaleString('ja-JP')}千円 (
                  {Math.round(opPct)}%)
                </div>
              )}
              {costOver && (
                <p className="mt-1 text-xs font-medium text-red-700">
                  原価+販管が売上を {overAmount.toLocaleString('ja-JP')}千円 超過
                </p>
              )}
              <div className="mt-1 flex justify-between text-xs text-slate-600">
                <span>原価 {cogs.toLocaleString('ja-JP')}</span>
                <span>販管 {sga.toLocaleString('ja-JP')}</span>
                <span
                  className={
                    isLoss
                      ? 'font-bold text-red-700'
                      : 'font-bold text-green-700'
                  }
                >
                  {isLoss ? '損' : '利'}{' '}
                  {operatingProfit.toLocaleString('ja-JP')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-400" />
          売上原価
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-orange-400" />
          販管費
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-green-600" />
          営業利益
        </div>
      </div>
    </div>
  );
}
