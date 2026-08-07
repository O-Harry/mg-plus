type TabItem<T extends string> = {
  id: T;
  label: string;
};

type Props<T extends string> = {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
};

export function TabSwitcher<T extends string>({
  tabs,
  value,
  onChange,
}: Props<T>) {
  // 4タブ超は横スクロール（375pxで潰れないように）
  const scrollable = tabs.length > 4;

  if (scrollable) {
    return (
      <div
        className="-mx-1 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1"
        role="tablist"
      >
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`min-h-[44px] shrink-0 rounded-lg px-3 text-sm font-bold transition active:scale-[0.98] ${
                active
                  ? 'bg-white text-mg-primary shadow-sm'
                  : 'text-slate-500'
              }`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="grid gap-1 rounded-xl bg-slate-100 p-1"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`min-h-[44px] rounded-lg text-sm font-bold transition active:scale-[0.98] ${
              active
                ? 'bg-white text-mg-primary shadow-sm'
                : 'text-slate-500'
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
