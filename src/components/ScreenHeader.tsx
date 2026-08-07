import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  return (
    <header className="sticky top-0 z-30 -mx-4 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg text-mg-primary active:bg-slate-100"
            onClick={onBack}
            aria-label="戻る"
          >
            ←
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold tracking-wide text-mg-accent">
              MG+
            </span>
            {subtitle && (
              <span className="truncate text-xs text-slate-500">{subtitle}</span>
            )}
          </div>
          <h1 className="truncate text-lg font-bold text-mg-primary">{title}</h1>
        </div>
        {right}
      </div>
    </header>
  );
}
