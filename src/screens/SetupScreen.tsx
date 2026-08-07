import { useState } from 'react';
import {
  DIFFICULTY_CONFIG,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_LABELS,
  DEFAULT_COMPANY_NAME,
} from '../engine/constants';
import { useGameStore } from '../store/gameStore';
import type { Difficulty } from '../types/game';
import { formatNumber } from '../utils/format';

const DIFFICULTIES = Object.keys(DIFFICULTY_CONFIG) as Difficulty[];

export function SetupScreen() {
  const initGame = useGameStore((s) => s.initGame);
  const setView = useGameStore((s) => s.setView);
  const hasInProgressSave = useGameStore((s) => s.hasInProgressSave);
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const start = () => {
    if (hasInProgressSave()) {
      const ok = window.confirm(
        '進行中のセーブを上書きして新しいゲームを始めます。よろしいですか？',
      );
      if (!ok) return;
    }
    initGame(companyName, difficulty);
  };

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <header className="sticky top-0 z-10 -mx-4 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-mg-primary"
            onClick={() => setView('title')}
            aria-label="戻る"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-mg-primary">新規ゲーム</h1>
            <p className="text-xs text-slate-500">会社名と難易度を設定</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 py-5">
        <div className="flex items-center gap-3">
          <img
            src="/assets/kropi.png"
            alt="クロピー"
            className="h-14 w-14 object-contain"
          />
          <p className="text-sm leading-relaxed text-slate-700">
            会社名はあとから変えられません。好きな名前をつけてください。
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-mg-primary">
            会社名
          </span>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            maxLength={20}
            placeholder={DEFAULT_COMPANY_NAME}
            className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none ring-mg-accent focus:ring-2"
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-mg-primary">
            難易度
          </legend>
          <div className="flex flex-col gap-2.5">
            {DIFFICULTIES.map((key) => {
              const cfg = DIFFICULTY_CONFIG[key];
              const selected = difficulty === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDifficulty(key)}
                  className={`min-h-[44px] rounded-xl border-2 px-3 py-3 text-left transition active:scale-[0.99] ${
                    selected
                      ? 'border-mg-accent bg-orange-50 shadow-sm'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-mg-primary">
                      {DIFFICULTY_LABELS[key]}
                    </span>
                    {selected && (
                      <span className="text-xs font-semibold text-mg-accent">
                        選択中
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-snug text-slate-600">
                    {DIFFICULTY_DESCRIPTIONS[key]}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    現預金 {formatNumber(cfg.cash)}千円 / 借入{' '}
                    {formatNumber(cfg.shortDebt + cfg.longDebt)}千円 / 需要目安{' '}
                    {cfg.baseDemand}個
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
        <button type="button" className="btn-accent w-full text-base" onClick={start}>
          ゲーム開始
        </button>
      </div>
    </div>
  );
}
