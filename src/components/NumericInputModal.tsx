import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  title: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onConfirm: (value: number) => void;
  onClose: () => void;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 意思決定の数値を直接入力するモーダル */
export function NumericInputModal({
  open,
  title,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onConfirm,
  onClose,
}: Props) {
  const [text, setText] = useState(String(value));
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setText(String(value));
      setWarning(null);
    }
  }, [open, value]);

  if (!open) return null;

  const parse = (): number | null => {
    const n = Number(text.replace(/,/g, ''));
    if (!Number.isFinite(n)) return null;
    return n;
  };

  const applyDelta = (delta: number) => {
    const base = parse() ?? value;
    const next = clamp(
      Math.round((base + delta) / step) * step,
      min,
      max,
    );
    setText(String(Number(next.toFixed(4))));
    setWarning(
      base + delta < min || base + delta > max
        ? `範囲外のため ${min}〜${max} に調整しました`
        : null,
    );
  };

  const applyPercent = (ratio: number) => {
    const base = parse() ?? value;
    const next = clamp(
      Math.round((base * (1 + ratio)) / step) * step,
      min,
      max,
    );
    setText(String(Number(next.toFixed(4))));
  };

  const confirm = () => {
    const n = parse();
    if (n === null) {
      setWarning('数値を入力してください');
      return;
    }
    const clipped = clamp(n, min, max);
    if (clipped !== n) {
      setWarning(`範囲外のため ${clipped} に調整して確定します`);
      setText(String(clipped));
      // 次タップで確定でもよいが、仕様どおりクリップして確定
      onConfirm(Number(clipped.toFixed(4)));
      onClose();
      return;
    }
    onConfirm(Number(clipped.toFixed(4)));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[343px] rounded-2xl bg-white p-4 shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-mg-primary">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">
          範囲: {min} 〜 {max}
          {unit ? ` ${unit}` : ''}
        </p>

        <input
          type="number"
          inputMode="decimal"
          value={text}
          min={min}
          max={max}
          step={step}
          autoFocus
          onChange={(e) => {
            setText(e.target.value);
            setWarning(null);
          }}
          className="mt-3 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 text-lg font-bold tabular-nums outline-none ring-mg-accent focus:ring-2"
        />

        {warning && (
          <p className="mt-2 text-xs text-mg-danger">{warning}</p>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <AdjustButton label="-10%" onClick={() => applyPercent(-0.1)} />
          <AdjustButton label="+10%" onClick={() => applyPercent(0.1)} />
          <AdjustButton label="±0" onClick={() => setText(String(value))} />
          <AdjustButton label="-100" onClick={() => applyDelta(-100)} />
          <AdjustButton label="+100" onClick={() => applyDelta(100)} />
          <AdjustButton label="+1000" onClick={() => applyDelta(1000)} />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-lg border border-slate-300 px-3 font-semibold text-slate-700"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="btn-accent flex-1"
            onClick={confirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function AdjustButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="min-h-[40px] rounded-lg bg-slate-100 text-xs font-semibold text-mg-primary active:bg-slate-200"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
