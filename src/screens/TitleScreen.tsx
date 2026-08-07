import { DIFFICULTY_LABELS } from '../engine/constants';
import { getScenarioById } from '../engine/scenarios';
import { useGameStore } from '../store/gameStore';
import { getMaxTurns, isGameComplete } from '../utils/gameHelpers';

function formatSavedAt(ts: number | null): string {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function TitleScreen() {
  const setView = useGameStore((s) => s.setView);
  const continueGame = useGameStore((s) => s.continueGame);
  const clearSave = useGameStore((s) => s.clearSave);
  const game = useGameStore((s) => s.game);
  const savedAt = useGameStore((s) => s.savedAt);

  const canContinue = game !== null && !game.gameOver;
  const hasInProgress =
    game !== null && !game.gameOver && !isGameComplete(game);
  const completed = game !== null && isGameComplete(game);
  const maxTurns = game ? getMaxTurns(game) : 12;
  const scenarioTitle =
    game?.mode === 'scenario' && game.scenarioId
      ? getScenarioById(game.scenarioId)?.title
      : undefined;

  const startNew = () => {
    if (hasInProgress) {
      const ok = window.confirm(
        `進行中の「${game.companyName}」第${game.currentTurn}期のセーブがあります。\n新規ゲームを始めると上書きされます。よろしいですか？`,
      );
      if (!ok) return;
    }
    setView('setup');
  };

  const openScenarios = () => {
    if (hasInProgress) {
      const ok = window.confirm(
        '進行中のセーブがあります。シナリオ選択へ進みますか？（開始時に上書き確認があります）',
      );
      if (!ok) return;
    }
    setView('scenarioSelect');
  };

  return (
    <div className="flex flex-1 flex-col items-center animate-fade-in">
      <div className="flex flex-1 flex-col items-center justify-center pt-6">
        <p className="text-sm font-medium tracking-[0.2em] text-mg-accent">
          経営シミュレーション
        </p>
        <h1 className="mt-2 text-6xl font-bold tracking-tight text-mg-primary">
          MG+
        </h1>
        <p className="mt-1 text-base text-slate-600">エムジープラス</p>

        <img
          src="/assets/kropi.png"
          alt="クロピー"
          className="mt-8 h-44 w-44 object-contain drop-shadow-md"
        />
        <p className="mt-3 max-w-[280px] text-center text-base leading-relaxed text-slate-700">
          こんにちは、クロピーです。
          <br />
          12期の経営、一緒に頑張りましょう。
        </p>

        {canContinue && game && (
          <div className="mt-5 w-full rounded-xl border border-mg-primary/20 bg-white/90 px-4 py-3 text-left text-sm shadow-sm">
            <p className="text-xs font-bold text-mg-accent">セーブデータ</p>
            <p className="mt-1 font-bold text-mg-primary">
              {scenarioTitle ?? game.companyName}
            </p>
            <p className="text-slate-600">
              {game.mode === 'scenario'
                ? 'シナリオ'
                : DIFFICULTY_LABELS[game.difficulty]}
              　
              {completed
                ? `${maxTurns}期クリア済み`
                : `第${game.currentTurn}期 / 全${maxTurns}期`}
            </p>
            {savedAt && (
              <p className="mt-0.5 text-xs text-slate-400">
                保存: {formatSavedAt(savedAt)}
              </p>
            )}
          </div>
        )}
      </div>

      <nav className="mt-auto flex w-full flex-col gap-3 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
        <button
          type="button"
          className="btn-accent w-full text-base"
          onClick={openScenarios}
        >
          シナリオモード ▶
        </button>
        <button
          type="button"
          className="btn-primary w-full text-base"
          onClick={startNew}
        >
          NEW GAME（フリープレイ）
        </button>
        <button
          type="button"
          className="min-h-[44px] w-full rounded-lg border-2 border-mg-primary bg-white px-4 py-3 text-base font-semibold text-mg-primary transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canContinue}
          onClick={continueGame}
        >
          {completed
            ? game?.mode === 'scenario'
              ? 'シナリオ結果を見る'
              : '最終結果を見る'
            : 'CONTINUE'}
          {!canContinue && (
            <span className="ml-2 text-xs font-normal opacity-80">
              (セーブなし)
            </span>
          )}
        </button>
        <button
          type="button"
          className="min-h-[44px] w-full rounded-lg border-2 border-mg-primary bg-white px-4 py-3 text-base font-semibold text-mg-primary transition active:scale-[0.98]"
          onClick={() => setView('howto')}
        >
          HOW TO PLAY
        </button>
        {canContinue && (
          <button
            type="button"
            className="min-h-[44px] w-full text-sm text-slate-500 underline-offset-2 active:text-mg-danger"
            onClick={() => {
              if (
                window.confirm('セーブデータを削除してタイトルに戻りますか？')
              ) {
                clearSave();
              }
            }}
          >
            セーブを削除
          </button>
        )}
      </nav>
    </div>
  );
}
