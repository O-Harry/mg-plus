import { useEffect, useState } from 'react';
import {
  buildAdvisorContextBefore,
  fillAdvisorTemplate,
} from '../engine/advisorTemplate';
import type { GameState } from '../types/game';

type Props = {
  prompts: string[];
  game: GameState;
  open: boolean;
  onComplete: () => void;
};

/** シナリオ意思決定前のクロピー助言（ステップ送り） */
export function AdvisorOverlay({ prompts, game, open, onComplete }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open, game.currentTurn, prompts]);

  if (!open || prompts.length === 0) return null;

  const ctx = buildAdvisorContextBefore(game);
  const text = fillAdvisorTemplate(prompts[step] ?? '', ctx);
  const isLast = step >= prompts.length - 1;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col justify-end bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="クロピーからの助言"
    >
      <div className="mx-auto w-full max-w-[343px] rounded-2xl bg-white p-4 shadow-xl animate-fade-in">
        <div className="flex items-start gap-3">
          <img
            src="/assets/kropi.png"
            alt="クロピー"
            className="h-16 w-16 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wide text-mg-accent">
              クロピー先生　助言 {step + 1}/{prompts.length}
            </p>
            <div className="relative mt-1 rounded-2xl rounded-tl-sm bg-orange-50 px-3 py-3">
              <p className="text-sm leading-relaxed text-slate-800">{text}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-1">
          {prompts.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? 'bg-mg-accent' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {!isLast ? (
            <button
              type="button"
              className="btn-accent w-full"
              onClick={() => setStep((s) => s + 1)}
            >
              次へ ▶
            </button>
          ) : (
            <button
              type="button"
              className="btn-accent w-full"
              onClick={onComplete}
            >
              意思決定を始める ✓
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              className="min-h-[44px] w-full text-sm font-semibold text-slate-500"
              onClick={onComplete}
            >
              スキップして意思決定へ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
