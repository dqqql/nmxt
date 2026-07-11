import { describe, expect, it } from 'vitest';
import { buildInitialMethodInsightPrompt, getDisplayedInsightCards, getDisplayedOriginInsightCards } from './methodSelectionFlow';

describe('method selection flow helpers', () => {
  it('builds an initial method prompt from all qi insights', () => {
    const method = {
      name: '剑修',
      insights: [
        { name: '练气·剑感初开', text: '初始一' },
        { name: '练气·气贯剑身', text: '初始二' },
        { name: '练气·步随剑走', text: '初始三' },
        { name: '练气·剑心通明', text: '初始四' },
      ],
      qiInitialInsights: [
        { name: '练气·旧初始一', text: '不应被读取' },
        { name: '练气·旧初始二', text: '不应被读取' },
      ],
    };

    const prompt = buildInitialMethodInsightPrompt(method, 0);

    expect(prompt.sections[0]).toMatchObject({
      key: 'initial-method-insight',
      title: '初始感悟',
      hint: '来自 剑修',
      limit: 1,
      target: 'initialInsights',
      sourceKind: 'method',
    });
    expect(prompt.sections[0].options.map((card) => card.name)).toEqual([
      '练气·剑感初开',
      '练气·气贯剑身',
      '练气·步随剑走',
      '练气·剑心通明',
    ]);
  });

  it('returns only explicitly selected insight cards with display names for page two', () => {
    const upgradeCards = {
      initialInsights: [{ name: '练气·剑感初开', text: 'A' }],
      insights: [{ name: '练气·步随剑走', text: 'B' }],
      originInsights: [{ name: '筑基本源·剑光分化', text: 'C' }],
    };

    expect(getDisplayedInsightCards(upgradeCards).map((card) => card.name)).toEqual(['剑感初开', '步随剑走']);
  });

  it('returns selected origin insight cards with display names for page two', () => {
    const upgradeCards = {
      originInsights: [
        { name: '练气本源·剑气初成', text: 'A' },
        { name: '筑基本源·剑光分化', text: 'B' },
      ],
    };

    expect(getDisplayedOriginInsightCards(upgradeCards).map((card) => card.name)).toEqual(['剑气初成', '剑光分化']);
  });
});
