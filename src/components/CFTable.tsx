import type { CF } from '../types/game';
import { StatementRows } from './StatementRows';

type Props = {
  cf: CF;
};

export function CFTable({ cf }: Props) {
  return (
    <StatementRows
      rows={[
        { label: '営業CF', term: '営業CF', value: cf.operating, signed: true },
        { label: '投資CF', term: '投資CF', value: cf.investing, signed: true },
        { label: '財務CF', term: '財務CF', value: cf.financing, signed: true },
        {
          label: '現金増減',
          term: '現金増減',
          value: cf.netChange,
          emphasis: true,
          signed: true,
        },
      ]}
    />
  );
}
