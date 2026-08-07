type Props = {
  comment: string;
  /** 小さめ表示 */
  compact?: boolean;
};

/** クロピーの吹き出しコメント */
export function CoachBubble({ comment, compact = false }: Props) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-orange-200 bg-orange-50 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <img
        src="/assets/kropi.png"
        alt="クロピー"
        className={`shrink-0 object-contain ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold tracking-wide text-mg-accent">
          クロピー先生
        </p>
        <div className="relative mt-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-800">{comment}</p>
        </div>
      </div>
    </div>
  );
}
