import { describe, expect, it } from 'vitest';
import {
  applyFoundationBreakthroughMarkEffects,
  fillNextSolidMark,
  unlockNextGhostMark,
} from './realmBreakthroughEffects';

describe('realm breakthrough mark effects', () => {
  it('turns the next ghost capacity mark into a real empty mark', () => {
    expect(unlockNextGhostMark({}, 'p1-zhenyuan-ghost', 4)).toEqual({
      'p1-zhenyuan-ghost:0': { filled: false, ghost: false },
    });
  });

  it('fills real empty marks from left to right without keeping ghost styling', () => {
    const next = fillNextSolidMark({
      'p1-stat-灵气-solid:0': { filled: true, ghost: false },
    }, 'p1-stat-灵气-solid', 8);

    expect(next['p1-stat-灵气-solid:0']).toEqual({ filled: true, ghost: false });
    expect(next['p1-stat-灵气-solid:1']).toEqual({ filled: true, ghost: false });
  });

  it('applies all qi-late to foundation-early automatic mark effects', () => {
    expect(applyFoundationBreakthroughMarkEffects({})).toEqual({
      'p1-stat-灵气-ghost:0': { filled: false, ghost: false },
      'p1-stat-灵气-solid:0': { filled: true, ghost: false },
      'p1-stat-灵气-solid:1': { filled: true, ghost: false },
      'p1-zhenyuan-ghost:0': { filled: false, ghost: false },
    });
  });
});
