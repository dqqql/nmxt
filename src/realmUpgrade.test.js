import { describe, expect, it } from 'vitest';
import {
  aggregateUpgradeChoices,
  applyAttributeIncrease,
  createUpgradeStep,
  getDefaultRealmIndex,
  getInitialSourceArts,
  getInitialSourceSkills,
  getMaxReachedRealmAfterSelection,
  getNextRealmIndex,
  getNonCoreAttributeChoices,
  getReachableRealmOptions,
  getSourceUpgradeArts,
  getSourceUpgradeSkills,
  pruneUpgradeChoicesForRealm,
} from './realmUpgrade';

const realms = [
  { name: '练气前期' },
  { name: '练气中期' },
  { name: '练气后期' },
  { name: '筑基前期' },
];

const source = {
  name: '金道源',
  skills: [
    { name: '金芒术', text: '神通一' },
    { name: '金罡斩', text: '神通二' },
  ],
  arts: [{ name: '金芒破元斩', text: '秘法一' }],
};

const method = {
  name: '剑修',
  insights: [
    { name: '练气·剑感初开', text: '练气感悟' },
    { name: '筑基·御剑攻敌', text: '筑基感悟' },
  ],
  originInsights: [
    { name: '练气本源·剑气初成', text: '练气本源' },
    { name: '筑基本源·剑光分化', text: '筑基本源' },
  ],
};

const dao = {
  name: '修罗之道',
  qiMethods: [{ name: '血怒诀', text: '练气功法' }],
  foundationMethods: [{ name: '戮杀诀', text: '筑基功法' }],
};

describe('realm upgrade rules', () => {
  it('defaults realm selection to qi refinement early', () => {
    expect(getDefaultRealmIndex(realms)).toBe(0);
    expect(getDefaultRealmIndex([{ name: '筑基前期' }, { name: '练气前期' }])).toBe(1);
  });

  it('moves to the next realm in order', () => {
    expect(getNextRealmIndex(realms, 0)).toBe(1);
    expect(getNextRealmIndex(realms, 2)).toBe(3);
    expect(getNextRealmIndex(realms, 3)).toBe(3);
  });

  it('opens source skill and treasure choices when reaching qi middle', () => {
    const step = createUpgradeStep({
      fromRealmName: '练气前期',
      nextRealmName: '练气中期',
      source,
      method,
      dao,
    });

    expect(step.selectionPrompt.title).toBe('练气中期升级选项');
    expect(step.selectionPrompt.sections.map((section) => section.key)).toEqual(['source-skill', 'treasure']);
    expect(step.selectionPrompt.sections[0].options.map((card) => card.name)).toEqual(['金罡斩']);
    expect(step.selectionPrompt.sections[1].options[0].name).toBe('玄龟甲');
  });

  it('opens qi insight and qi dao method choices when reaching qi late', () => {
    const step = createUpgradeStep({
      fromRealmName: '练气中期',
      nextRealmName: '练气后期',
      source,
      method,
      dao,
    });

    expect(step.selectionPrompt.sections.map((section) => section.key)).toEqual(['method-insight', 'dao-method']);
    expect(step.selectionPrompt.sections[0].options.map((card) => card.name)).toEqual(['练气·剑感初开']);
    expect(step.selectionPrompt.sections[1].options.map((card) => card.name)).toEqual(['血怒诀']);
  });

  it('applies breakthrough effects and asks for foundation origin insight', () => {
    const step = createUpgradeStep({
      fromRealmName: '练气后期',
      nextRealmName: '筑基前期',
      source,
      method,
      dao,
    });

    expect(step.autoEffects).toContain('realm-breakthrough');
    expect(step.selectionPrompt.sections[0].key).toBe('origin-insight');
    expect(step.selectionPrompt.sections[0].options.map((card) => card.name)).toEqual(['筑基本源·剑光分化']);
  });

  it('keeps upgrade prompts visible even when the matching source data is missing', () => {
    const step = createUpgradeStep({
      fromRealmName: '练气中期',
      nextRealmName: '练气后期',
      source: null,
      method: null,
      dao: null,
    });

    expect(step.selectionPrompt.sections.map((section) => section.key)).toEqual(['method-insight', 'dao-method']);
    expect(step.selectionPrompt.sections[0].options).toEqual([]);
  });

  it('prefills only initial source skill and initial source art', () => {
    expect(getInitialSourceSkills(source).map((card) => card.name)).toEqual(['金芒术']);
    expect(getInitialSourceArts(source).map((card) => card.name)).toEqual(['金芒破元斩']);
    expect(getSourceUpgradeSkills(source).map((card) => card.name)).toEqual(['金罡斩']);
    expect(getSourceUpgradeArts(source)).toEqual([]);
  });

  it('keeps only card choices at or below the selected realm when rolling realm back', () => {
    const choices = [
      { realmIndex: 1, target: 'skills', card: { name: '中期神通', text: 'A' } },
      { realmIndex: 2, target: 'insights', card: { name: '后期感悟', text: 'B' } },
      { realmIndex: 3, target: 'originInsights', card: { name: '筑基本源', text: 'C' } },
    ];

    expect(pruneUpgradeChoicesForRealm(choices, 1)).toEqual([choices[0]]);
    expect(aggregateUpgradeChoices(choices, 2).originInsights).toEqual([]);
    expect(aggregateUpgradeChoices(choices, 2).insights).toEqual([choices[1].card]);
  });

  it('exposes only reached realms for manual realm selection', () => {
    expect(getReachableRealmOptions(realms, 2).map((realm) => realm.name)).toEqual(['练气前期', '练气中期', '练气后期']);
  });

  it('shrinks reached realm history when selecting an earlier realm', () => {
    expect(getMaxReachedRealmAfterSelection(3, 1)).toBe(1);
    expect(getReachableRealmOptions(realms, getMaxReachedRealmAfterSelection(3, 1)).map((realm) => realm.name)).toEqual(['练气前期', '练气中期']);
  });

  it('sorts non-core attribute choices by current assigned values before applying increases', () => {
    const attributes = { 仙躯: '3', 身法: '0', 神魂: '+2', 灵蕴: '' };

    expect(getNonCoreAttributeChoices(attributes, '仙躯').map((choice) => choice.title)).toEqual(['身法', '灵蕴', '神魂']);
    expect(applyAttributeIncrease(attributes, ['身法', '灵蕴'])).toEqual({
      仙躯: '3',
      身法: '1',
      神魂: '+2',
      灵蕴: '1',
    });
  });
});
