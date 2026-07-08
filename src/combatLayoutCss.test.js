import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')))
    .map((match) => match[1])
    .join('\n');
}

describe('combat layout CSS', () => {
  it('keeps combat rows fixed so long method text cannot push rows outside the panel', () => {
    expect(ruleBody('.rightPane')).toContain('grid-template-rows: 92px minmax(0, 1fr) 392px');
    expect(ruleBody('.bottomSection')).toContain('height: 100%');
    expect(ruleBody('.bottomSection')).toContain('overflow: hidden');
    expect(ruleBody('.bottomSection > *')).toContain('min-height: 0');
    expect(ruleBody('.combatPanel')).toContain('grid-template-rows: minmax(0, 1fr)');
    expect(ruleBody('.combatSkills')).toContain('grid-template-rows: repeat(3, minmax(0, 1fr))');
    expect(ruleBody('.combatSkills')).toContain('min-height: 0');
    expect(ruleBody('.combatSkills')).toContain('overflow: hidden');
    expect(ruleBody('.combatSkill')).toContain('grid-template-columns: 104px minmax(0, 1fr)');
    expect(ruleBody('.combatSkill')).toContain('grid-template-rows: minmax(0, 1fr)');
    expect(ruleBody('.combatSkill')).toContain('height: 100%');
    expect(ruleBody('.combatSkill > *')).toContain('min-height: 0');
    expect(ruleBody('.combatSkill > div')).toContain('overflow: hidden');
    expect(ruleBody('.combatSkill > .autoFit')).toContain('max-height: 100%');
    expect(ruleBody('.combatBoostText')).toContain('overflow: hidden');
  });
});
