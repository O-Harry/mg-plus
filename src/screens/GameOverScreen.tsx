import { BSTable } from '../components/BSTable';
import { CoachBubble } from '../components/CoachBubble';
import { StickyFooter } from '../components/StickyFooter';
import { buildBS } from '../engine/calculations';
import { DIFFICULTY_LABELS } from '../engine/constants';
import { useGameStore } from '../store/gameStore';
import { formatYen } from '../utils/format';

export function GameOverScreen() {
  const game = useGameStore((s) => s.game);
  const resetGame = useGameStore((s) => s.resetGame);
  const replayGame = useGameStore((s) => s.replayGame);
  const setView = useGameStore((s) => s.setView);

  if (!game) {
    return (
      <div className="py-8 text-center text-sm text-slate-600">
        データがありません
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={() => setView('title')}
        >
          タイトルへ
        </button>
      </div>
    );
  }

  const survived = game.history.length;
  const last = game.history[game.history.length - 1];
  const bs = last?.bs ?? buildBS(game);
  const reason = game.gameOverReason ?? '事業継続困難';

  const coachComment =
    reason === '資金ショート'
      ? `第${survived}期で資金ショートです。現預金がマイナスになりました。仕入・投資を抑え、売上の現金化（売掛の管理）を意識しましょう。`
      : `第${survived}期で経営を終了しました。原因: ${reason}。現金と利益のバランスを見直して再チャレンジを。`;

  return (
    <div className="relative flex flex-1 flex-col animate-fade-in">
      <header className="sticky top-0 z-30 -mx-4 border-b border-red-200 bg-red-50/95 px-4 py-3 backdrop-blur">
        <p className="text-xs font-medium text-mg-danger">GAME OVER</p>
        <h1 className="text-lg font-bold text-mg-danger">経営終了</h1>
        <p className="text-xs text-slate-600">
          {game.companyName}　/　{DIFFICULTY_LABELS[game.difficulty]}
        </p>
      </header>

      <div className="flex flex-col gap-3 py-4 pb-2">
        <section className="rounded-2xl border border-red-200 bg-white px-4 py-5 text-center">
          <p className="text-sm text-slate-500">生き延びた期間</p>
          <p className="mt-1 text-4xl font-bold text-mg-primary">
            {survived}
            <span className="ml-1 text-base font-normal text-slate-500">
              / 12 期
            </span>
          </p>
          <p className="mt-2 text-sm font-semibold text-mg-danger">{reason}</p>
          {last && (
            <p className="mt-1 text-xs text-slate-500">
              最終売上 {formatYen(last.pl.revenue)} / 純利益{' '}
              {formatYen(last.pl.netProfit)}
            </p>
          )}
        </section>

        <CoachBubble comment={coachComment} />

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-2 text-sm font-bold text-mg-primary">最終BS</h2>
          <BSTable bs={bs} />
        </section>
      </div>

      <StickyFooter>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn-accent w-full" onClick={replayGame}>
            もう一度プレイ
          </button>
          <button
            type="button"
            className="min-h-[44px] w-full rounded-lg border-2 border-mg-primary bg-white px-4 py-3 text-base font-semibold text-mg-primary"
            onClick={resetGame}
          >
            タイトルへ
          </button>
        </div>
      </StickyFooter>
    </div>
  );
}
