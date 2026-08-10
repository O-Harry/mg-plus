import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { runTurn } from '../engine/calculations';
import {
  CONSTANTS,
  createInitialState,
  DEFAULT_COMPANY_NAME,
  DIFFICULTY_LABELS,
} from '../engine/constants';
import {
  createScenarioState,
  getScenarioById,
} from '../engine/scenarios';
import type {
  Decision,
  Difficulty,
  GameState,
  ScenarioId,
  ViewState,
} from '../types/game';
import { getMaxTurns, isGameComplete } from '../utils/gameHelpers';
import {
  normalizeDecision,
  normalizeGameState,
  normalizeView,
  type PersistedSlice,
} from './migrate';

export const STORAGE_KEY = 'mg-plus-save';
const SAVE_VERSION = 2;

export type SaveSummary = {
  companyName: string;
  difficultyLabel: string;
  turn: number;
  completed: boolean;
  gameOver: boolean;
  savedAt: number | null;
};

type GameStore = {
  view: ViewState;
  game: GameState | null;
  lastDecision: Decision | null;
  savedAt: number | null;
  saveFlash: boolean;
  /** お手本プレイ中（通常セーブと区別） */
  demoMode: boolean;

  setView: (view: ViewState) => void;
  initGame: (name: string, difficulty: Difficulty) => void;
  startScenario: (scenarioId: ScenarioId) => void;
  beginScenarioPlay: () => void;
  startDemoPlayback: (scenarioId: ScenarioId) => void;
  executeDemoTurn: (decision: Decision) => void;
  finishDemoAndPlay: () => void;
  exitDemoPlayback: () => void;
  continueGame: () => void;
  executeTurn: (decision: Decision) => void;
  advanceToNextTurn: () => void;
  replayGame: () => void;
  resetGame: () => void;
  clearSave: () => void;
  hasInProgressSave: () => boolean;
  getSaveSummary: () => SaveSummary | null;
  clearSaveFlash: () => void;
};

const emptyDecision = (): Decision => ({
  materialPurchase: 0,
  productionQty: 0,
  unitPrice: CONSTANTS.BASE_PRICE,
  employeeChange: 0,
  investments: [],
});

function stamp<T extends object>(
  partial: T,
  flash = false,
): T & { savedAt: number; saveFlash: boolean } {
  return {
    ...partial,
    savedAt: Date.now(),
    saveFlash: flash,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      view: 'title',
      game: null,
      lastDecision: null,
      savedAt: null,
      saveFlash: false,
      demoMode: false,

      clearSaveFlash: () => set({ saveFlash: false }),

      setView: (view) => set({ view, savedAt: Date.now() }),

      initGame: (name, difficulty) => {
        const game = createInitialState(name, difficulty);
        set(
          stamp(
            {
              game,
              view: 'dashboard' as ViewState,
              lastDecision: emptyDecision(),
              demoMode: false,
            },
            true,
          ),
        );
      },

      startScenario: (scenarioId) => {
        const scenario = getScenarioById(scenarioId);
        if (!scenario) return;
        const game = createScenarioState(scenario);
        set(
          stamp(
            {
              game,
              view: 'scenarioBriefing' as ViewState,
              lastDecision: emptyDecision(),
              demoMode: false,
            },
            true,
          ),
        );
      },

      beginScenarioPlay: () => {
        const { game } = get();
        if (!game || game.mode !== 'scenario') return;
        set({ view: 'decisions', demoMode: false });
      },

      startDemoPlayback: (scenarioId) => {
        const scenario = getScenarioById(scenarioId);
        if (!scenario) return;
        const game = createScenarioState(scenario);
        set({
          game,
          view: 'demoPlayback' as ViewState,
          lastDecision: emptyDecision(),
          demoMode: true,
          savedAt: Date.now(),
          saveFlash: false,
        });
      },

      executeDemoTurn: (decision) => {
        const { game, demoMode } = get();
        if (!game || !demoMode || game.gameOver) return;
        if (game.history.length >= getMaxTurns(game)) return;

        let state: GameState;
        if (game.mode === 'scenario' && game.scenarioId) {
          const scenario = getScenarioById(game.scenarioId);
          const event = scenario?.scriptedEvents[game.currentTurn - 1];
          state = runTurn(game, decision, {
            event,
            skipPriceVolatility: true,
            rng: () => 0.5,
          }).state;
        } else {
          state = runTurn(game, decision).state;
        }

        set({
          game: state,
          lastDecision: decision,
          view: 'demoPlayback',
          demoMode: true,
          savedAt: Date.now(),
          saveFlash: false,
        });
      },

      finishDemoAndPlay: () => {
        const id = get().game?.scenarioId;
        if (!id) {
          set({
            view: 'scenarioSelect',
            game: null,
            demoMode: false,
            lastDecision: null,
          });
          return;
        }
        const scenario = getScenarioById(id);
        if (!scenario) return;
        const game = createScenarioState(scenario);
        set(
          stamp(
            {
              game,
              view: 'decisions' as ViewState,
              lastDecision: emptyDecision(),
              demoMode: false,
            },
            true,
          ),
        );
      },

      exitDemoPlayback: () => {
        set({
          view: 'scenarioSelect',
          game: null,
          lastDecision: null,
          demoMode: false,
          savedAt: Date.now(),
          saveFlash: false,
        });
      },

      continueGame: () => {
        const { game } = get();
        if (!game) return;
        if (game.gameOver) {
          set({ view: 'gameover' });
          return;
        }
        if (isGameComplete(game)) {
          set({
            view:
              game.mode === 'scenario' ? 'scenarioResult' : 'final',
          });
          return;
        }
        if (game.mode === 'scenario' && game.history.length === 0) {
          set({ view: 'scenarioBriefing' });
          return;
        }
        set({ view: 'dashboard' });
      },

      executeTurn: (decision) => {
        const { game } = get();
        if (!game || game.gameOver) return;
        if (game.history.length >= getMaxTurns(game)) return;

        let state: GameState;
        if (game.mode === 'scenario' && game.scenarioId) {
          const scenario = getScenarioById(game.scenarioId);
          const event = scenario?.scriptedEvents[game.currentTurn - 1];
          const result = runTurn(game, decision, {
            event,
            skipPriceVolatility: true,
            rng: () => 0.5,
          });
          state = result.state;
        } else {
          state = runTurn(game, decision).state;
        }

        set(
          stamp(
            {
              game: state,
              lastDecision: decision,
              view: 'result' as ViewState,
              demoMode: false,
            },
            true,
          ),
        );
      },

      advanceToNextTurn: () => {
        const { game } = get();
        if (!game) return;
        if (game.gameOver) {
          set(stamp({ view: 'gameover' as ViewState }, true));
          return;
        }
        if (isGameComplete(game)) {
          set(
            stamp(
              {
                view: (game.mode === 'scenario'
                  ? 'scenarioResult'
                  : 'final') as ViewState,
              },
              true,
            ),
          );
          return;
        }
        set(stamp({ view: 'dashboard' as ViewState }, true));
      },

      replayGame: () => {
        const { game } = get();
        if (game?.mode === 'scenario' && game.scenarioId) {
          get().startScenario(game.scenarioId);
          return;
        }
        const name = game?.companyName ?? DEFAULT_COMPANY_NAME;
        const difficulty = game?.difficulty ?? 'normal';
        const next = createInitialState(name, difficulty);
        set(
          stamp(
            {
              game: next,
              view: 'dashboard' as ViewState,
              lastDecision: emptyDecision(),
            },
            true,
          ),
        );
      },

      resetGame: () => {
        set(
          stamp({
            view: 'title' as ViewState,
            game: null,
            lastDecision: null,
            demoMode: false,
          }),
        );
      },

      clearSave: () => {
        set({
          view: 'title',
          game: null,
          lastDecision: null,
          savedAt: null,
          saveFlash: false,
          demoMode: false,
        });
      },

      hasInProgressSave: () => {
        const { game, demoMode } = get();
        // お手本プレイは通常セーブとみなさない
        if (demoMode) return false;
        return (
          game !== null &&
          !game.gameOver &&
          game.history.length < getMaxTurns(game)
        );
      },

      getSaveSummary: () => {
        const { game, savedAt } = get();
        if (!game) return null;
        return {
          companyName: game.companyName,
          difficultyLabel: DIFFICULTY_LABELS[game.difficulty],
          turn: game.currentTurn,
          completed: isGameComplete(game),
          gameOver: game.gameOver,
          savedAt,
        };
      },
    }),
    {
      name: STORAGE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // デモ中は永続化しない（通常セーブを汚さない）
        if (state.demoMode || state.view === 'demoPlayback') {
          return {
            view: 'scenarioSelect' as ViewState,
            game: null,
            lastDecision: null,
            savedAt: state.savedAt,
          } satisfies PersistedSlice;
        }
        return {
          view: state.view,
          game: state.game,
          lastDecision: state.lastDecision,
          savedAt: state.savedAt,
        } satisfies PersistedSlice;
      },
      migrate: (persisted) => {
        try {
          const p = (persisted ?? {}) as Partial<PersistedSlice>;
          const game = normalizeGameState(p.game);
          let view = normalizeView(p.view, game);
          if (view === 'demoPlayback') {
            view = 'scenarioSelect';
          }
          return {
            view,
            game: view === 'scenarioSelect' && !game ? null : game,
            lastDecision: normalizeDecision(p.lastDecision),
            savedAt: typeof p.savedAt === 'number' ? p.savedAt : null,
            demoMode: false,
          };
        } catch (e) {
          console.warn('MG+ save migrate failed', e);
          return {
            view: 'title' as ViewState,
            game: null,
            lastDecision: null,
            savedAt: null,
            demoMode: false,
          };
        }
      },
      merge: (persisted, current) => {
        try {
          const p = (persisted ?? {}) as Partial<PersistedSlice>;
          const game = normalizeGameState(p.game) ?? current.game;
          let view = normalizeView(p.view ?? current.view, game);
          if (view === 'demoPlayback') {
            view = 'scenarioSelect';
          }
          return {
            ...current,
            game,
            view,
            lastDecision:
              normalizeDecision(p.lastDecision) ?? current.lastDecision,
            savedAt: p.savedAt ?? current.savedAt,
            demoMode: false,
          };
        } catch (e) {
          console.warn('MG+ save merge failed', e);
          return current;
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('MG+ save rehydrate failed', error);
        }
      },
    },
  ),
);

export function getDefaultCompanyName(): string {
  return DEFAULT_COMPANY_NAME;
}
