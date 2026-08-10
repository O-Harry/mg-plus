import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { SaveToast } from './components/SaveToast';
import { DashboardScreen } from './screens/DashboardScreen';
import { DecisionsScreen } from './screens/DecisionsScreen';
import { DemoPlaybackScreen } from './screens/DemoPlaybackScreen';
import { FinalScreen } from './screens/FinalScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { HowToPlayScreen } from './screens/HowToPlayScreen';
import { ResultScreen } from './screens/ResultScreen';
import { ScenarioBriefingScreen } from './screens/ScenarioBriefingScreen';
import { ScenarioResultScreen } from './screens/ScenarioResultScreen';
import { ScenarioSelectScreen } from './screens/ScenarioSelectScreen';
import { SetupScreen } from './screens/SetupScreen';
import { TitleScreen } from './screens/TitleScreen';
import { useGameStore } from './store/gameStore';
import type { ViewState } from './types/game';

function App() {
  const view = useGameStore((s) => s.view);
  const [ready, setReady] = useState(() => {
    try {
      return useGameStore.persist.hasHydrated();
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    const unsub = useGameStore.persist.onFinishHydration(markReady);
    if (useGameStore.persist.hasHydrated()) {
      markReady();
    }

    const fallback = window.setTimeout(markReady, 50);

    return () => {
      cancelled = true;
      unsub();
      window.clearTimeout(fallback);
    };
  }, []);

  if (!ready) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
          <img
            src="/assets/kropi.png"
            alt=""
            className="h-20 w-20 object-contain opacity-80"
          />
          <p className="text-sm font-semibold text-mg-primary">読み込み中…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {renderScreen(view)}
      <SaveToast />
    </AppShell>
  );
}

function renderScreen(view: ViewState) {
  switch (view) {
    case 'title':
      return <TitleScreen />;
    case 'setup':
      return <SetupScreen />;
    case 'howto':
      return <HowToPlayScreen />;
    case 'scenarioSelect':
      return <ScenarioSelectScreen />;
    case 'scenarioBriefing':
      return <ScenarioBriefingScreen />;
    case 'demoPlayback':
      return <DemoPlaybackScreen />;
    case 'dashboard':
      return <DashboardScreen />;
    case 'decisions':
      return <DecisionsScreen />;
    case 'result':
      return <ResultScreen />;
    case 'scenarioResult':
      return <ScenarioResultScreen />;
    case 'final':
      return <FinalScreen />;
    case 'gameover':
      return <GameOverScreen />;
    default:
      return <TitleScreen />;
  }
}

export default App;
