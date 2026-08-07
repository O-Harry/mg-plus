import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  valueLabel: string;
  hint: string;
  children: ReactNode;
  /** 現在値タップで数値入力を開く */
  onValueClick?: () => void;
};

export function DecisionCard({
  title,
  subtitle,
  valueLabel,
  hint,
  children,
  onValueClick,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-mg-primary">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs leading-snug text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
        {onValueClick ? (
          <button
            type="button"
            onClick={onValueClick}
            className="min-h-[44px] shrink-0 rounded-lg border border-dashed border-mg-accent/60 bg-orange-50/50 px-2 text-right text-base font-bold tabular-nums text-mg-primary active:bg-orange-100"
            aria-label={`${title}の数値を直接入力`}
          >
            {valueLabel}
            <span className="mt-0.5 block text-[10px] font-normal text-mg-accent">
              タップで入力
            </span>
          </button>
        ) : (
          <p className="shrink-0 text-right text-base font-bold tabular-nums text-slate-800">
            {valueLabel}
          </p>
        )}
      </div>
      <div className="mt-3">{children}</div>
      <p className="mt-2 text-right text-xs text-slate-500">{hint}</p>
    </section>
  );
}
