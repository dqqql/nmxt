import { describe, expect, it } from 'vitest';
import {
  getCapacityBonusUnlockIndexes,
  getSourceCapacityBonusForLabel,
  getSourceCapacityBonuses,
} from './sourceCapacityBonuses';
import sources from './data/sources.json';

describe('source capacity bonuses', () => {
  it('reads the existing health and qi source buff copy', () => {
    expect(getSourceCapacityBonuses({ buff: '正常与险境血量格+1' })).toEqual({
      normalHealth: 1,
      dangerHealth: 1,
      qi: 0,
      storage: 0,
    });
    expect(getSourceCapacityBonusForLabel({ buff: '灵气格+1' }, '灵气')).toBe(1);
  });

  it('defines the official source bonuses as structured capacity data', () => {
    expect(Object.fromEntries(sources.map((source) => [
      source.name,
      getSourceCapacityBonuses(source),
    ]))).toMatchObject({
      金道源: { normalHealth: 1, dangerHealth: 1, qi: 0 },
      木道源: { normalHealth: 1, dangerHealth: 1, qi: 0 },
      水道源: { normalHealth: 0, dangerHealth: 0, qi: 1 },
      雷道源: { normalHealth: 0, dangerHealth: 0, qi: 1 },
      圣灵道源: { normalHealth: 1, dangerHealth: 1, qi: 0 },
    });
  });

  it('prefers structured bonuses and normalizes invalid values', () => {
    expect(getSourceCapacityBonuses({
      buff: '灵气格+9',
      capacityBonuses: { normalHealth: 2, dangerHealth: 1, qi: '2', storage: -1 },
    })).toEqual({
      normalHealth: 2,
      dangerHealth: 1,
      qi: 2,
      storage: 0,
    });
  });

  it('stacks a source bonus after capacity already unlocked by breakthroughs', () => {
    const markStates = {
      'p1-stat-灵气-ghost:0': { filled: false, ghost: false },
      'p1-stat-灵气-ghost:1': { filled: false, ghost: false },
    };

    expect(getCapacityBonusUnlockIndexes(markStates, 'p1-stat-灵气-ghost', 7, 1)).toEqual([2]);
    expect(getCapacityBonusUnlockIndexes(markStates, 'p1-stat-灵气-ghost', 7, 2)).toEqual([2, 3]);
  });
});
