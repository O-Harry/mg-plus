type Props = {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
};

/** スマホでドラッグしやすいレンジスライダー */
export function TouchSlider({
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel,
}: Props) {
  const safeMax = Math.max(min, max);
  const safeValue = Math.min(safeMax, Math.max(min, value));

  return (
    <input
      type="range"
      min={min}
      max={safeMax}
      step={step}
      value={safeValue}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
      className="touch-slider w-full"
      disabled={safeMax <= min}
    />
  );
}
