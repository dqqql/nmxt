import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')))
    .map((match) => match[1])
    .join('\n');
}

describe('combat layout CSS', () => {
  it('keeps the relocated page-two combat cards bounded when method text is long', () => {
    expect(ruleBody('.pageTwoAttackGroup')).toContain('grid-template-rows: 34px minmax(0, 1fr)');
    expect(ruleBody('.pageTwoAttackGroup')).toContain('overflow: hidden');
    expect(ruleBody('.pageTwoAttackGroup .combatSkills')).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(ruleBody('.pageTwoAttackGroup .combatSkills')).toContain('grid-template-rows: minmax(0, 1fr)');
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

  it('gives page one separate status, quick-reference, threshold, and talent regions', () => {
    const statRowSource = mainSource.slice(
      mainSource.indexOf('function StatRow'),
      mainSource.indexOf('function DamageThreshold'),
    );

    expect(ruleBody('.rightPane')).toContain('grid-template-rows: 92px minmax(0, 0.84fr) 174px minmax(0, 1.16fr)');
    expect(ruleBody('.pageOneStatusRow')).toContain('grid-template-columns: minmax(0, 1fr) 246px');
    expect(ruleBody('.thresholdPanelBody')).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(ruleBody('.thresholdPanelBody')).toContain('grid-template-rows: repeat(2, minmax(0, 1fr))');
    expect(ruleBody('.thresholdPanel .damageThreshold')).toContain('grid-template-columns: 128px minmax(0, 1fr)');
    expect(ruleBody('.pageOneStatusRow .statRow.hasNote')).toContain('grid-template-columns: 82px max-content minmax(0, 1fr)');
    expect(ruleBody('.pageOneStatusRow .statNote')).toContain('white-space: nowrap');
    expect(ruleBody('.quickReferencePanel .conflictContent p')).toContain('white-space: nowrap');
    expect(statRowSource).not.toContain('stacked');
    expect(statRowSource).toContain('separator="，"');
  });

  it('moves combat into page two and keeps every existing ability group', () => {
    const pageOneSource = mainSource.slice(
      mainSource.indexOf('function PageOne()'),
      mainSource.indexOf('function SpellTable'),
    );
    const pageTwoSource = mainSource.slice(
      mainSource.indexOf('function PageTwo()'),
      mainSource.indexOf('function PageThree()'),
    );

    expect(pageOneSource).not.toContain('<CombatPanel />');
    expect(pageOneSource).toContain('pageOneStatusRow');
    expect(pageOneSource).toContain('thresholdPanel');
    expect(pageTwoSource).toContain('<CombatPanel />');
    ['神通', '秘法', '灵宝', '感悟', '本源感悟', '功法'].forEach((title) => {
      expect(pageTwoSource).toContain(`title="${title}"`);
      expect(pageTwoSource).toContain(`rows={rowsFor('${title}')}`);
    });
    expect(pageTwoSource).toContain("{ name: '道源效果', text: source?.effect || '' }");
    expect(pageTwoSource).toContain("{ name: '大道效果', text: dao?.effect || '' }");
  });
});
