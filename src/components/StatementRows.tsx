import { formatNumber, formatSigned, signedColorClass } from '../utils/format';
import { TermTooltip } from './TermTooltip';

export type StatementRow = {
  label: string;
  value: number;
  /** 用語解説のキー（GLOSSARY） */
  term?: string;
  emphasis?: boolean;
  percent?: boolean;
  signed?: boolean;
  indent?: boolean;
};

type Props = {
  rows: StatementRow[];
  unit?: string;
};

export function StatementRows({ rows, unit = '千円' }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[280px] text-sm">
        <tbody>
          {rows.map((row) => {
            const display = row.percent
              ? `${Math.round(row.value * 100)}%`
              : row.signed
                ? formatSigned(row.value)
                : formatNumber(row.value);

            const suffix = row.percent ? '' : unit === '千円' ? '' : unit;
            const color = row.signed
              ? signedColorClass(row.value)
              : row.emphasis
                ? 'text-mg-primary'
                : 'text-slate-800';

            return (
              <tr
                key={row.label}
                className={`border-b border-slate-100 last:border-0 ${
                  row.emphasis ? 'bg-slate-50' : ''
                }`}
              >
                <th
                  scope="row"
                  className={`py-2.5 pr-3 text-left font-medium ${
                    row.indent ? 'pl-4 text-slate-500' : 'text-slate-600'
                  } ${row.emphasis ? 'font-bold text-mg-primary' : ''}`}
                >
                  {row.term ? (
                    <TermTooltip term={row.term}>{row.label}</TermTooltip>
                  ) : (
                    row.label
                  )}
                </th>
                <td
                  className={`py-2.5 text-right font-semibold tabular-nums ${color} ${
                    row.emphasis ? 'font-bold' : ''
                  }`}
                >
                  {display}
                  {suffix}
                  {!row.percent && unit === '千円' && (
                    <span className="ml-0.5 text-xs font-normal text-slate-400">
                      千円
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
