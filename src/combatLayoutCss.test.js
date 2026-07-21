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
    expect(mainSource).toContain("{ title: '神通', rows: 4");
    expect(mainSource).toContain("{ title: '秘法', rows: 2");
    expect(mainSource).toContain("{ title: '灵宝', rows: 3");
    expect(mainSource).toContain("{ title: '功法', rows: 3");
    expect(mainSource).toContain('<b>法门普攻增益一</b>');
    expect(mainSource).toContain('<b>法门普攻增益二</b>');
    expect(pageTwoSource).toContain("{ name: '道源效果', text: source?.effect || '' }");
    expect(pageTwoSource).not.toContain('道源本源效果');
    expect(pageTwoSource).toContain("{ name: '大道效果', text: dao?.effect || '' }");
    expect(pageTwoSource).toContain('<PageTwoCardGroup title="秘法" rows={rowsFor(\'秘法\')} cards={prefillFor(\'秘法\')} />');
    expect(pageTwoSource).not.toContain('title="秘法" rows={rowsFor(\'秘法\')} cards={prefillFor(\'秘法\')} className="pageTwoThreeAcross"');
  });

  it('uses double line spacing for multi-line page-two content', () => {
    expect(ruleBody('.pageTwoAttackGroup .combatSkill > div')).toContain('line-height: 2');
    expect(ruleBody('.pageTwoCardText')).toContain('line-height: 2');
  });

  it('makes page-one threshold labels and values fill their cells legibly', () => {
    const cells = ruleBody('.thresholdPanel .damageScale > span');
    const steps = ruleBody('.thresholdPanel .damageScale .thresholdStep');
    const inputs = ruleBody('.thresholdPanel .thresholdStep input');
    expect(cells).toContain('font-size: 15px');
    expect(cells).toContain('font-weight: 900');
    expect(steps).toContain('grid-template-rows: 16px minmax(0, 1fr)');
    expect(inputs).toContain('font-size: 16px');
    expect(inputs).toContain('font-weight: 900');
    expect(inputs).toContain('text-align: center');
  });

  it('lays out training supply beside its note and fortune above its mark row', () => {
    const pageOneSource = mainSource.slice(
      mainSource.indexOf('function PageOne()'),
      mainSource.indexOf('function SpellTable'),
    );

    expect(pageOneSource.indexOf('title="历练点补充"')).toBeLessThan(pageOneSource.indexOf('title="福缘点"'));
    expect(pageOneSource).toContain('className="trainingCounterBox"');
    expect(pageOneSource).toContain('className="fortuneCounterBox"');
    expect(ruleBody('.middlePane')).toContain('grid-template-rows: minmax(0, 1fr) 76px 106px');
    expect(ruleBody('.trainingCounterBox')).toContain('grid-template-columns: minmax(0, 1fr) 88px');
    expect(ruleBody('.trainingCounterBox .counterNote')).toContain('font-size: 10.5px');
    expect(ruleBody('.trainingCounterBox .counterBody')).toContain('border-left: 1px solid var(--line)');
    expect(ruleBody('.fortuneCounterBox .counterTitle')).toContain('padding: 8px 10px');
    expect(ruleBody('.fortuneCounterBox .counterNote')).toContain('font-size: 11px');
  });
});
