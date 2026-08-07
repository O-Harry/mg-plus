import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** フッター上部のサマリ行など */
  summary?: ReactNode;
};

/** 主要アクション用スティッキーフッター */
export function StickyFooter({ children, summary }: Props) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-auto border-t border-slate-200/80 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      {summary && <div className="mb-2">{summary}</div>}
      {children}
    </div>
  );
}
