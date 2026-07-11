import { describe, expect, it } from 'vitest';
import { appendUpgradeChoices, removeMethodInsightChoices } from './upgradeChoiceState';

describe('upgrade choice state helpers', () => {
  it('stores sourceKind and promptKey when appending selected cards', () => {
    const next = appendUpgradeChoices([], {
      realmIndex: 0,
      cardsBySection: [
        {
          key: 'initial-method-insight',
          target: 'initialInsights',
          sourceKind: 'method',
          cards: [{ name: '练气·剑感初开', text: '...' }],
        },
      ],
    });

    expect(next).toEqual([
      {
        realmIndex: 0,
        target: 'initialInsights',
        sourceKind: 'method',
        promptKey: 'initial-method-insight',
        card: { name: '练气·剑感初开', text: '...' },
      },
    ]);
  });

  it('removes only method-derived insight records when switching methods', () => {
    const choices = [
      { realmIndex: 0, target: 'initialInsights', sourceKind: 'method', promptKey: 'initial-method-insight', card: { name: '练气·剑感初开', text: 'A' } },
      { realmIndex: 2, target: 'insights', sourceKind: 'method', promptKey: 'qi-upgrade-insight', card: { name: '练气·步随剑走', text: 'B' } },
      { realmIndex: 3, target: 'originInsights', sourceKind: 'method', promptKey: 'foundation-origin-insight', card: { name: '筑基本源·剑光分化', text: 'C' } },
      { realmIndex: 1, target: 'skills', sourceKind: 'source', promptKey: 'qi-middle-source-skill', card: { name: '金罡斩', text: 'D' } },
    ];

    expect(removeMethodInsightChoices(choices)).toEqual([
      { realmIndex: 1, target: 'skills', sourceKind: 'source', promptKey: 'qi-middle-source-skill', card: { name: '金罡斩', text: 'D' } },
    ]);
  });
});
