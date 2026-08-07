import type { PL } from '../types/game';
import { StatementRows } from './StatementRows';

type Props = {
  pl: PL;
};

export function PLTable({ pl }: Props) {
  return (
    <StatementRows
      rows={[
        { label: '売上高', term: '売上高', value: pl.revenue },
        { label: '売上原価', term: '売上原価', value: -pl.cogs, signed: true },
        {
          label: '売上総利益',
          term: '売上総利益',
          value: pl.grossProfit,
          emphasis: true,
          signed: true,
        },
        { label: '販管費', term: '販管費', value: -pl.sga, signed: true },
        {
          label: '営業利益',
          term: '営業利益',
          value: pl.operatingProfit,
          emphasis: true,
          signed: true,
        },
        { label: '支払利息', value: -pl.interestExpense, signed: true },
        {
          label: '経常利益',
          term: '経常利益',
          value: pl.ordinaryProfit,
          emphasis: true,
          signed: true,
        },
        { label: '法人税等', value: -pl.tax, signed: true },
        {
          label: '当期純利益',
          term: '当期純利益',
          value: pl.netProfit,
          emphasis: true,
          signed: true,
        },
      ]}
    />
  );
}
