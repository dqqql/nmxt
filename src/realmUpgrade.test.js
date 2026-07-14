import { describe, expect, it } from 'vitest';
import { methodOptions, realmOptions, sourceOptions } from './data';
import {
  aggregateUpgradeChoices,
  applyAttributeIncrease,
  createUpgradeStep,
  getDefaultRealmIndex,
  getFixedBreakthroughEffects,
  getInitialSourceArts,
  getInitialSourceSkills,
  getMethodFoundationInsights,
  getMethodFoundationOriginInsights,
  getMethodFoundationUpgradeInsights,
  getMethodInitialInsights,
  getMethodQiInsights,
  getMethodQiOriginInsights,
  getMethodQiUpgradeInsights,
  getMaxReachedRealmAfterSelection,
  getNextRealmIndex,
  getNonCoreAttributeChoices,
  getReachableRealmOptions,
  getSourceFoundationUpgradeArts,
  getSourceFoundationUpgradeSkills,
  getSourceQiUpgradeSkills,
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
  initialSkill: { name: '金芒术', text: '神通一' },
  qiUpgradeSkills: [
    { name: '金罡斩', text: '练气中期一' },
    { name: '锋芒毕露', text: '练气中期二' },
  ],
  foundationUpgradeSkills: [
    { name: '金锋化刃', text: '筑基中期一' },
    { name: '金芒连刺', text: '筑基中期二' },
  ],
  initialArt: { name: '金芒破元斩', text: '秘法一' },
  foundationUpgradeArts: [
    { name: '庚金破法诀', text: '筑基秘法一' },
    { name: '金戈镇妖诀', text: '筑基秘法二' },
  ],
};

const method = {
  name: '剑修',
  insights: [
    { name: '练气·剑感初开', text: '初始感悟一' },
    { name: '练气·气贯剑身', text: '初始感悟二' },
    { name: '练气·步随剑走', text: '练气感悟一' },
    { name: '练气·剑心通明', text: '练气感悟二' },
    { name: '筑基·御剑攻敌', text: '筑基感悟一' },
    { name: '筑基·剑气破体', text: '筑基感悟二' },
    { name: '筑基·剑影分身', text: '筑基感悟三' },
    { name: '筑基·识剑心明', text: '筑基感悟四' },
  ],
  qiInitialInsights: [
    { name: '练气·旧初始一', text: '不应被读取' },
    { name: '练气·旧初始二', text: '不应被读取' },
  ],
  qiUpgradeInsights: [
    { name: '练气·旧升级一', text: '不应被读取' },
    { name: '练气·旧升级二', text: '不应被读取' },
  ],
  foundationInsights: [
    { name: '筑基·旧筑基一', text: '不应被读取' },
  ],
  originInsights: [
    { name: '练气本源·剑气初成', text: '练气本源一' },
    { name: '练气本源·剑势凝一', text: '练气本源二' },
    { name: '筑基本源·剑光分化', text: '筑基本源' },
    { name: '筑基本源·人剑合一', text: '筑基本源二' },
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

  it('names the current highest realm golden-core early', () => {
    expect(realmOptions.at(-1).name).toBe('金丹前期');
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
    expect(step.selectionPrompt.sections[0].options.map((card) => card.name)).toEqual(['金罡斩', '锋芒毕露']);
    expect(step.selectionPrompt.sections[1].options[0].name).toBe('玄龟甲');
  });

  it('opens qi insight and qi dao method choices when reaching qi late', () => {
    const step = createUpgradeStep({
      fromRealmName: '练气中期',
      nextRealmName: '练气后期',
      source,
      method,
      dao,
      upgradeCards: {
        initialInsights: [{ name: '练气·剑感初开', text: '初始感悟一' }],
      },
    });

    expect(step.selectionPrompt.sections.map((section) => section.key)).toEqual(['method-insight', 'dao-method']);
    expect(step.selectionPrompt.sections[0].options.map((card) => card.name)).toEqual([
      '练气·气贯剑身',
      '练气·步随剑走',
      '练气·剑心通明',
    ]);
    expect(step.selectionPrompt.sections[1].options.map((card) => card.name)).toEqual(['血怒诀']);
  });

  it('applies explicit foundation effects and asks for qi origin, foundation insight, and treasure', () => {
    const step = createUpgradeStep({
      fromRealmName: '练气后期',
      nextRealmName: '筑基前期',
      source,
      method,
      dao,
    });

    expect(step.autoEffects).toContain('realm-breakthrough');
    expect(step.automaticEffects).toEqual({
      realmMultiplier: 1,
      qiCapacity: 2,
      coreAttribute: 1,
      allThresholds: 3,
      methodAdvancement: 1,
      trueEssenceCapacity: 1,
    });
    expect(step.breakthroughChoices.limit).toBe(2);
    expect(step.breakthroughChoices.options).toHaveLength(7);
    expect(step.selectionPrompt.sections.map((section) => section.key)).toEqual([
      'origin-insight',
      'method-insight',
      'treasure',
    ]);
    expect(step.selectionPrompt.sections[0].options.map((card) => card.name)).toEqual(['练气本源·剑气初成', '练气本源·剑势凝一']);
    expect(step.selectionPrompt.sections[1].options.map((card) => card.name)).toEqual([
      '筑基·御剑攻敌',
      '筑基·剑气破体',
      '筑基·剑影分身',
      '筑基·识剑心明',
    ]);
    expect(step.selectionPrompt.sections[2].options).toHaveLength(4);
    expect(step.toast).toContain('真元上限 +1');
  });

  it('applies explicit golden-core effects and asks for foundation origin insight', () => {
    const step = createUpgradeStep({
      fromRealmName: '筑基后期',
      nextRealmName: '金丹前期',
      source,
      method,
      dao,
    });

    expect(step.automaticEffects).toEqual({
      realmMultiplier: 1,
      qiCapacity: 2,
      coreAttribute: 0,
      allThresholds: 3,
      methodAdvancement: 0,
      trueEssenceCapacity: 0,
    });
    expect(step.breakthroughChoices.options).toHaveLength(6);
    expect(step.breakthroughChoices.options.map((option) => option.id)).not.toContain('extra-method');
    expect(step.selectionPrompt.sections[0].options.map((card) => card.name)).toEqual([
      '筑基本源·剑光分化',
      '筑基本源·人剑合一',
    ]);
  });

  it('excludes the foundation insight already selected at foundation early from foundation late', () => {
    const step = createUpgradeStep({
      fromRealmName: '筑基中期',
      nextRealmName: '筑基后期',
      source,
      method,
      dao,
      upgradeCards: {
        insights: [{ name: '筑基·御剑攻敌', text: '已选' }],
      },
    });

    expect(step.selectionPrompt.sections[0].options.map((card) => card.name)).toEqual([
      '筑基·剑气破体',
      '筑基·剑影分身',
      '筑基·识剑心明',
    ]);
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
    expect(getSourceQiUpgradeSkills(source).map((card) => card.name)).toEqual(['金罡斩', '锋芒毕露']);
    expect(getSourceFoundationUpgradeSkills(source).map((card) => card.name)).toEqual(['金锋化刃', '金芒连刺']);
    expect(getSourceFoundationUpgradeArts(source).map((card) => card.name)).toEqual(['庚金破法诀', '金戈镇妖诀']);
  });

  it('exposes method insight pools from unified insight data', () => {
    expect(getMethodQiInsights(method).map((card) => card.name)).toEqual([
      '练气·剑感初开',
      '练气·气贯剑身',
      '练气·步随剑走',
      '练气·剑心通明',
    ]);
    expect(getMethodInitialInsights(method).map((card) => card.name)).toEqual([
      '练气·剑感初开',
      '练气·气贯剑身',
      '练气·步随剑走',
      '练气·剑心通明',
    ]);
    expect(getMethodQiUpgradeInsights(method, [{ name: '练气·剑感初开' }]).map((card) => card.name)).toEqual([
      '练气·气贯剑身',
      '练气·步随剑走',
      '练气·剑心通明',
    ]);
    expect(getMethodFoundationInsights(method).map((card) => card.name)).toEqual([
      '筑基·御剑攻敌',
      '筑基·剑气破体',
      '筑基·剑影分身',
      '筑基·识剑心明',
    ]);
    expect(getMethodFoundationUpgradeInsights(method, [{ name: '筑基·御剑攻敌' }]).map((card) => card.name)).toEqual([
      '筑基·剑气破体',
      '筑基·剑影分身',
      '筑基·识剑心明',
    ]);
    expect(getMethodQiOriginInsights(method)).toHaveLength(2);
    expect(getMethodFoundationOriginInsights(method)).toHaveLength(2);
  });

  it('keeps all source progression groups fully populated from resource data', () => {
    sourceOptions.forEach((entry) => {
      expect(getInitialSourceSkills(entry)).toHaveLength(1);
      expect(getInitialSourceArts(entry)).toHaveLength(1);
      expect(getSourceQiUpgradeSkills(entry)).toHaveLength(2);
      expect(getSourceFoundationUpgradeSkills(entry)).toHaveLength(2);
      expect(getSourceFoundationUpgradeArts(entry)).toHaveLength(2);
    });
  });

  it('keeps all method insight groups fully populated from resource data', () => {
    methodOptions.forEach((entry) => {
      const selectedInitial = getMethodInitialInsights(entry)[0];
      expect(getMethodQiInsights(entry)).toHaveLength(4);
      expect(getMethodInitialInsights(entry)).toHaveLength(4);
      expect(getMethodQiUpgradeInsights(entry, [selectedInitial])).toHaveLength(3);
      expect(getMethodFoundationInsights(entry)).toHaveLength(4);
      expect(getMethodQiOriginInsights(entry)).toHaveLength(2);
      expect(getMethodFoundationOriginInsights(entry)).toHaveLength(2);
      expect(entry.attackBuffs).toHaveLength(2);
    });
  });

  it('keeps crafting technique progression populated from resource data', () => {
    const craftingMethods = new Map([
      ['丹修', ['初阶炼丹', '中阶炼丹']],
      ['器修', ['初阶铸器', '中阶铸器']],
      ['符修', ['初阶制符', '中阶制符']],
      ['阵修', ['初级制阵', '中阶制阵']],
      ['傀修', ['初阶制傀', '中阶制傀']],
    ]);
    methodOptions.forEach((entry) => {
      const expectedNames = craftingMethods.get(entry.name);
      if (!expectedNames) {
        expect(entry.techniques).toBeUndefined();
        return;
      }
      expect(entry.techniques.qi.name).toBe(expectedNames[0]);
      expect(entry.techniques.qi.text).toBeTruthy();
      expect(entry.techniques.foundation.name).toBe(expectedNames[1]);
      expect(entry.techniques.foundation.text).toBeTruthy();
      expect(entry.techniques.foundation.storageCapacityBonus).toBe(1);
    });
  });

  it('returns independent fixed-effect records', () => {
    const effects = getFixedBreakthroughEffects('foundation-early');
    effects.qiCapacity = 99;
    expect(getFixedBreakthroughEffects('foundation-early').qiCapacity).toBe(2);
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
