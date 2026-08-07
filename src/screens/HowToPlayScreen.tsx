import { useGameStore } from '../store/gameStore';

const STEPS = [
  {
    title: '1. 状況を読む',
    body: '各期のはじめに、前期の業績と市場ニュースを確認します。',
  },
  {
    title: '2. 5つの意思決定',
    body: '材料仕入・生産量・販売価格・人員・追加投資を決めます。キーボード入力はほぼ不要です。',
  },
  {
    title: '3. 決算を見る',
    body: 'PL・BS・CFが自動計算されます。クロピーがポイントをコメントします。',
  },
  {
    title: '4. 12期で会社価値を最大化',
    body: '会社価値 = 純資産 + (直近3期平均純利益 × 5)。資金ショートするとゲームオーバーです。',
  },
  {
    title: '5. 自動セーブ',
    body: '進捗は端末に自動保存されます。途中で閉じても CONTINUE から再開できます。',
  },
];

export function HowToPlayScreen() {
  const setView = useGameStore((s) => s.setView);

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
          <h1 className="text-lg font-bold text-mg-primary">遊び方</h1>
        </div>
      </header>

      <div className="flex items-start gap-3 py-5">
        <img
          src="/assets/kropi.png"
          alt="クロピー"
          className="h-16 w-16 shrink-0 object-contain"
        />
        <p className="text-sm leading-relaxed text-slate-700">
          中小製造業の社長になって、3年間（12四半期）経営してみましょう。PL/BSの感覚が体に染み込みます。
        </p>
      </div>

      <ol className="flex flex-col gap-3 pb-6">
        {STEPS.map((step) => (
          <li
            key={step.title}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <h2 className="text-base font-bold text-mg-primary">{step.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {step.body}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-auto pb-8">
        <button
          type="button"
          className="btn-accent w-full"
          onClick={() => setView('setup')}
        >
          NEW GAME へ
        </button>
      </div>
    </div>
  );
}
