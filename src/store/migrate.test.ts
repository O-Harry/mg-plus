import { describe, expect, it } from 'vitest';
import { normalizeGameState, normalizeView } from './migrate';

describe('save migration', () => {
  it('欠けたフィールドを補完できる', () => {
    const normalized = normalizeGameState({
      companyName: '旧セーブ工業',
      cash: 40_000,
      difficulty: 'normal',
    });
    expect(normalized).not.toBeNull();
    expect(normalized?.rdPending).toBe(0);
    expect(normalized?.productInventoryValue).toBe(0);
    expect(normalized?.extraProductionCapacity).toBe(0);
    expect(normalized?.history).toEqual([]);
  });

  it('不正データは null', () => {
    expect(normalizeGameState(null)).toBeNull();
    expect(normalizeGameState({ cash: 1 })).toBeNull();
  });

  it('ゲームなしでは gameplay 画面を title に戻す', () => {
    expect(normalizeView('dashboard', null)).toBe('title');
    expect(normalizeView('howto', null)).toBe('howto');
  });
});
