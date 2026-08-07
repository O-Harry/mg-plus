import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/** 自動セーブ直後に短く表示 */
export function SaveToast() {
  const saveFlash = useGameStore((s) => s.saveFlash);
  const clearSaveFlash = useGameStore((s) => s.clearSaveFlash);

  useEffect(() => {
    if (!saveFlash) return;
    const id = window.setTimeout(() => clearSaveFlash(), 1200);
    return () => window.clearTimeout(id);
  }, [saveFlash, clearSaveFlash]);

  if (!saveFlash) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-mg-primary/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg animate-fade-in"
      role="status"
    >
      自動保存しました
    </div>
  );
}
