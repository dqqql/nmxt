import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

describe('source capacity bonus UI', () => {
  it('connects every supported source capacity to the page-one stat rows', () => {
    expect(mainSource).toContain("getSourceCapacityBonusForLabel(source, label)");
    expect(mainSource).toContain("capacityBonus={sourceCapacityBonus('正常血量')}");
    expect(mainSource).toContain("capacityBonus={sourceCapacityBonus('险境血量')}");
    expect(mainSource).toContain("capacityBonus={sourceCapacityBonus('灵气')}");
    expect(mainSource).toContain("capacityBonus={sourceCapacityBonus('储物格')}");
  });

  it('unlocks source capacity on top of existing mark-state capacity', () => {
    expect(mainSource).toContain('getCapacityBonusUnlockIndexes(');
    expect(mainSource).toContain('forceUnlocked={forceUnlockedIndexes.includes(index)}');
  });
});
