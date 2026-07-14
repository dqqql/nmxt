import { describe, expect, it } from 'vitest';
import {
  applyFoundationBreakthroughMarkEffects,
  applyGoldenCoreBreakthroughMarkEffects,
  applyOptionalQiCapacityMarkEffect,
  applyQiCapacityDelta,
  fillNextSolidMark,
  lockPreviousUnlockedGhostMark,
  QI_CAPACITY_GHOST_COUNT,
  revertFoundationBreakthroughMarkEffects,
  revertGoldenCoreBreakthroughMarkEffects,
  revertOptionalQiCapacityMarkEffect,
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

  it('turns the last unlocked capacity mark back into a ghost', () => {
    expect(lockPreviousUnlockedGhostMark({
      'p1-stat-灵气-ghost:0': { filled: false, ghost: false },
      'p1-stat-灵气-ghost:1': { filled: true, ghost: false },
    }, 'p1-stat-灵气-ghost', QI_CAPACITY_GHOST_COUNT)).toEqual({
      'p1-stat-灵气-ghost:0': { filled: false, ghost: false },
      'p1-stat-灵气-ghost:1': { filled: false, ghost: true },
    });
  });

  it('unlocks two qi capacity marks and one true essence capacity mark for foundation without filling qi', () => {
    expect(applyFoundationBreakthroughMarkEffects({})).toEqual({
      'p1-stat-灵气-ghost:0': { filled: false, ghost: false },
      'p1-stat-灵气-ghost:1': { filled: false, ghost: false },
      'p1-zhenyuan-ghost:0': { filled: false, ghost: false },
    });
  });

  it('unlocks two more qi capacity marks for golden core and can reverse both breakthroughs', () => {
    const foundation = applyFoundationBreakthroughMarkEffects({});
    const goldenCore = applyGoldenCoreBreakthroughMarkEffects(foundation);

    expect(goldenCore['p1-stat-灵气-ghost:2']).toEqual({ filled: false, ghost: false });
    expect(goldenCore['p1-stat-灵气-ghost:3']).toEqual({ filled: false, ghost: false });
    expect(revertGoldenCoreBreakthroughMarkEffects(goldenCore)).toEqual({
      ...foundation,
      'p1-stat-灵气-ghost:2': { filled: false, ghost: true },
      'p1-stat-灵气-ghost:3': { filled: false, ghost: true },
    });
    expect(revertFoundationBreakthroughMarkEffects(foundation)).toEqual({
      'p1-stat-灵气-ghost:0': { filled: false, ghost: true },
      'p1-stat-灵气-ghost:1': { filled: false, ghost: true },
      'p1-zhenyuan-ghost:0': { filled: false, ghost: true },
    });
  });

  it('applies and reverses the optional qi-capacity choice without filling it', () => {
    const applied = applyOptionalQiCapacityMarkEffect({});
    expect(applied).toEqual({
      'p1-stat-灵气-ghost:0': { filled: false, ghost: false },
    });
    expect(revertOptionalQiCapacityMarkEffect(applied)).toEqual({
      'p1-stat-灵气-ghost:0': { filled: false, ghost: true },
    });
    expect(applyQiCapacityDelta({}, 0)).toEqual({});
  });
});
