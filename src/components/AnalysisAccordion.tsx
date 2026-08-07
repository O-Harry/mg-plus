import { useState, type ReactNode } from 'react';

type Props = {
  title?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

/** シナリオ結果の詳細分析を折りたたむ */
export function AnalysisAccordion({
  title = '詳細分析を見る（STRAC / BEP / BS）',
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-mg-primary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{open ? '詳細分析を閉じる' : title}</span>
        <span className="text-mg-accent" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && <div className="space-y-3 border-t border-slate-100 p-3">{children}</div>}
    </div>
  );
}
