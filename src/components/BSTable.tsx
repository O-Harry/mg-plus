import type { BS } from '../types/game';
import { StatementRows } from './StatementRows';

type Props = {
  bs: BS;
};

export function BSTable({ bs }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-1 text-xs font-bold tracking-wide text-slate-500">
          資産の部
        </h3>
        <StatementRows
          rows={[
            { label: '現預金', term: '現預金', value: bs.cash, indent: true },
            {
              label: '売掛金',
              term: '売掛金',
              value: bs.accountsReceivable,
              indent: true,
            },
            {
              label: '棚卸資産',
              term: '棚卸資産',
              value: bs.inventory,
              indent: true,
            },
            {
              label: '流動資産合計',
              value: bs.totalCurrentAssets,
              emphasis: true,
            },
            { label: '設備（簿価）', value: bs.equipment, indent: true },
            { label: '資産合計', value: bs.totalAssets, emphasis: true },
          ]}
        />
      </div>

      <div>
        <h3 className="mb-1 text-xs font-bold tracking-wide text-slate-500">
          負債の部
        </h3>
        <StatementRows
          rows={[
            {
              label: '買掛金',
              term: '買掛金',
              value: bs.accountsPayable,
              indent: true,
            },
            {
              label: '短期借入金',
              term: '短期借入金',
              value: bs.shortTermDebt,
              indent: true,
            },
            {
              label: '流動負債合計',
              value: bs.totalCurrentLiabilities,
              emphasis: true,
            },
            {
              label: '長期借入金',
              term: '長期借入金',
              value: bs.longTermDebt,
              indent: true,
            },
            { label: '負債合計', value: bs.totalLiabilities, emphasis: true },
          ]}
        />
      </div>

      <div>
        <h3 className="mb-1 text-xs font-bold tracking-wide text-slate-500">
          純資産の部
        </h3>
        <StatementRows
          rows={[
            { label: '資本金', value: bs.capital, indent: true },
            {
              label: '利益剰余金',
              value: bs.retainedEarnings,
              indent: true,
              signed: true,
            },
            { label: '純資産合計', value: bs.totalEquity, emphasis: true },
            {
              label: '自己資本比率',
              term: '自己資本比率',
              value: bs.equityRatio,
              percent: true,
              emphasis: true,
            },
          ]}
        />
      </div>
    </div>
  );
}
