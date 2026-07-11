import { describe, expect, it } from 'vitest';
import { buildInitialMethodInsightPrompt, getDisplayedInsightCards } from './methodSelectionFlow';

describe('method selection flow helpers', () => {
  it('builds an initial method prompt from the explicit qi-initial pool', () => {
    const method = {
      name: '剑修',
      qiInitialInsights: [
        { name: '练气·剑感初开', text: '初始一' },
        { name: '练气·气贯剑身', text: '初始二' },
      ],
    };

    expect(buildInitialMethodInsightPrompt(method, 0)).toEqual({
      title: '初始感悟选择',
      realmIndex: 0,
      sections: [
        {
          key: 'initial-method-insight',
          title: '初始感悟',
          hint: '来自 剑修',
          limit: 1,
          target: 'initialInsights',
          sourceKind: 'method',
          options: method.qiInitialInsights,
        },
      ],
    });
  });

  it('returns only explicitly selected insight cards for page-two display', () => {
    const upgradeCards = {
      initialInsights: [{ name: '练气·剑感初开', text: 'A' }],
      insights: [{ name: '练气·步随剑走', text: 'B' }],
      originInsights: [{ name: '筑基本源·剑光分化', text: 'C' }],
    };

    expect(getDisplayedInsightCards(upgradeCards).map((card) => card.name)).toEqual(['练气·剑感初开', '练气·步随剑走']);
  });
});
