type Props = {
  open: boolean;
  onClose: () => void;
  fieldLabel: string;
  recommendedValue: string;
  reasoning: string[];
  keyPoint: string;
};

export function RecommendationModal({
  open,
  onClose,
  fieldLabel,
  recommendedValue,
  reasoning,
  keyPoint,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="クロピーの推奨"
    >
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-mg-primary">クロピーの推奨</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-2xl text-slate-500"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <div className="mb-3 rounded-xl bg-orange-50 p-3">
          <p className="text-xs text-slate-500">{fieldLabel}</p>
          <p className="text-2xl font-bold text-mg-accent">{recommendedValue}</p>
        </div>
        <div className="mb-3">
          <p className="mb-2 text-sm font-bold text-mg-primary">なぜこの値か</p>
          <ul className="space-y-2 text-sm text-slate-700">
            {reasoning.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-mg-accent">▪</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-3 rounded-xl bg-green-50 p-3">
          <p className="text-sm font-bold text-green-700">この期のポイント</p>
          <p className="mt-1 text-sm text-slate-800">{keyPoint}</p>
        </div>
        <button type="button" className="btn-accent w-full" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
