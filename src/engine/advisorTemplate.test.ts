import { describe, expect, it } from 'vitest';
import { fillAdvisorTemplate } from './advisorTemplate';

describe('fillAdvisorTemplate', () => {
  it('プレースホルダを数値で置換する', () => {
    const text = fillAdvisorTemplate(
      '価格{price}千円、需要{demand}個、粗利{grossMargin}%',
      { price: 10, demand: 180, grossMargin: 28 },
    );
    expect(text).toBe('価格10千円、需要180個、粗利28%');
  });
});
