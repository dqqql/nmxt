import { describe, expect, it } from 'vitest';
import {
  formatCardDisplayName,
  formatInsightCard,
  getFirstRealmInsight,
  getMethodFoundationInsights,
  getMethodFoundationOriginInsights,
  getMethodInitialInsights,
  getMethodResourceSections,
  getMethodQiInsights,
  getMethodQiOriginInsights,
  getMethodQiUpgradeInsights,
  getUnlockedMethodAttackBuffs,
} from './methodProgression';

const swordMethod = {
  name: '剑修',
  attackBuffs: [
    '剑势凛冽：剑未出，意先临，锋芒自生。你每个回合的第1次普攻攻击检定获得优势。',
    '剑气激荡：锐利的剑气可以击破对手的架势。你普通攻击的破罡值-1。',
  ],
  insights: [
    {
      name: '练气·剑感初开',
      text: '你与手中的剑产生共鸣。当你攻击未拆招敌人时，你可以消耗1灵气格使破罡值-1',
    },
    {
      name: '练气·气贯剑身',
      text: '你学会了将灵气灌入剑身，使其更为锋利之法。',
    },
    {
      name: '练气·步随剑走',
      text: '你的步法与剑招相合，进退有度。',
    },
    {
      name: '练气·剑心通明',
      text: '你以剑观心，不易被外物所困。',
    },
    {
      name: '筑基·御剑攻敌',
      text: '将这个感悟放置于你的魂海之中，永久生效。',
    },
    {
      name: '筑基·剑气破体',
      text: '你的剑气可以轻易击破对方的护体真气。',
    },
    {
      name: '筑基·剑影分身',
      text: '你出剑极快，留下道道残影。',
    },
    {
      name: '筑基·识剑心明',
      text: '你与剑朝夕相处，对剑的了解达到了新的高峰。',
    },
  ],
  originInsights: [
    { name: '练气本源·剑气初成', text: '练气本源一' },
    { name: '练气本源·剑势凝一', text: '练气本源二' },
    { name: '筑基本源·剑光分化', text: '筑基本源一' },
    { name: '筑基本源·人剑合一', text: '筑基本源二' },
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
};

const bodyMethod = {
  name: '体修',
  attackBuffs: [
    '筋骨齐鸣：你的筋骨坚韧有力，可轻易阻挡对方的攻势。',
    '强身健体：你的普攻让你可以更好地运转体内的血气用以防御。',
  ],
};

describe('method progression helpers', () => {
  it('keeps realm insights available for the insights table', () => {
    expect(formatInsightCard(getFirstRealmInsight(swordMethod, { name: '练气前期' }))).toContain('剑感初开');
    expect(formatInsightCard(getFirstRealmInsight(swordMethod, { name: '筑基前期' }))).toContain('御剑攻敌');
    expect(formatInsightCard(getFirstRealmInsight(swordMethod, { name: '练气前期' }))).not.toContain('练气·');
    expect(formatInsightCard(getFirstRealmInsight(swordMethod, { name: '筑基前期' }))).not.toContain('筑基·');
  });

  it('unlocks only the first method attack buff during qi refinement', () => {
    expect(getUnlockedMethodAttackBuffs(swordMethod, { name: '练气前期' })).toEqual([
      swordMethod.attackBuffs[0],
    ]);
  });

  it('unlocks both method attack buffs during foundation building', () => {
    expect(getUnlockedMethodAttackBuffs(swordMethod, { name: '筑基前期' })).toEqual(swordMethod.attackBuffs);
  });

  it('replaces the advanced method buff with the extra qi method buff when breakthrough skips method advancement', () => {
    expect(getUnlockedMethodAttackBuffs(swordMethod, { name: '筑基前期' }, {
      extraMethods: [bodyMethod],
    })).toEqual([
      swordMethod.attackBuffs[0],
      bodyMethod.attackBuffs[0],
    ]);
  });

  it('does not use insight cards as method attack buffs', () => {
    expect(getUnlockedMethodAttackBuffs(swordMethod, { name: '练气前期' }).join('\n')).not.toContain('剑感初开');
  });

  it('derives qi and foundation insight pools from the unified insights list', () => {
    expect(getMethodQiInsights(swordMethod).map((card) => card.name)).toEqual([
      '练气·剑感初开',
      '练气·气贯剑身',
      '练气·步随剑走',
      '练气·剑心通明',
    ]);
    expect(getMethodInitialInsights(swordMethod).map((card) => card.name)).toEqual([
      '练气·剑感初开',
      '练气·气贯剑身',
      '练气·步随剑走',
      '练气·剑心通明',
    ]);
    expect(getMethodFoundationInsights(swordMethod).map((card) => card.name)).toEqual([
      '筑基·御剑攻敌',
      '筑基·剑气破体',
      '筑基·剑影分身',
      '筑基·识剑心明',
    ]);
  });

  it('removes selected initial qi insights from the qi-late upgrade pool', () => {
    const selected = [{ name: '练气·剑感初开', text: '已选' }];

    expect(getMethodQiUpgradeInsights(swordMethod, selected).map((card) => card.name)).toEqual([
      '练气·气贯剑身',
      '练气·步随剑走',
      '练气·剑心通明',
    ]);
  });

  it('splits origin insights by phase and formats all card display prefixes', () => {
    expect(getMethodQiOriginInsights(swordMethod).map((card) => card.name)).toEqual([
      '练气本源·剑气初成',
      '练气本源·剑势凝一',
    ]);
    expect(getMethodFoundationOriginInsights(swordMethod).map((card) => card.name)).toEqual([
      '筑基本源·剑光分化',
      '筑基本源·人剑合一',
    ]);
    expect(formatCardDisplayName('练气·剑感初开')).toBe('剑感初开');
    expect(formatCardDisplayName({ name: '筑基·御剑攻敌' })).toBe('御剑攻敌');
    expect(formatCardDisplayName('练气本源·剑气初成')).toBe('剑气初成');
    expect(formatCardDisplayName({ name: '筑基本源·剑光分化' })).toBe('剑光分化');
  });

  it('builds guided method resource sections from the qi-stage screenshot scope', () => {
    const sections = getMethodResourceSections(swordMethod);

    expect(sections.map((section) => section.title)).toEqual([
      '入门攻击增益',
      '练气感悟',
    ]);
    expect(sections[0].items).toEqual([swordMethod.attackBuffs[0]]);
    expect(sections[1].items.map((card) => card.name)).toEqual(['剑感初开', '气贯剑身', '步随剑走', '剑心通明']);
  });
});
