import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

/** スマホ375px基準の共通シェル */
export function AppShell({ children }: Props) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-[#E8EEF6] via-white to-[#FFF8F0]">
      <div className="mx-auto flex min-h-svh w-full max-w-[375px] flex-col px-4 pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
    </div>
  );
}
