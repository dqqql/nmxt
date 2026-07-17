import { describe, expect, it } from 'vitest';
import { fateCards, fateDraws } from './data';

describe('fate talent tier policy', () => {
  it('uses the configured draw tiers, including reverse fate upgrades and the plain fate human-tier option', () => {
    const plans = Object.values(fateDraws).flat();
    const talentItems = plans.flatMap((plan) => plan.items.filter((item) => item.kind === 'talent'));
    const plainPlans = fateDraws['平平无奇'];
    const reversePlans = ['逆命壹', '逆命贰', '逆命叁'].map((title) => fateDraws[title][0]);

    expect(talentItems.length).toBeGreaterThan(0);
    expect(reversePlans.map((plan) => plan.label)).toEqual([
      '一地阶天赋',
      '一天阶天赋',
      '一仙阶天赋',
    ]);
    expect(reversePlans.map((plan) => plan.items)).toEqual([
      [{ kind: 'talent', tier: '地', count: 1 }],
      [{ kind: 'talent', tier: '天', count: 1 }],
      [{ kind: 'talent', tier: '仙', count: 1 }],
    ]);
    expect(plainPlans.map((plan) => plan.label)).toEqual([
      '一凡阶天赋',
      '一人阶天赋 + 一凡阶天谴',
    ]);
    expect(plainPlans[1].items).toEqual([
      { kind: 'talent', tier: '人', count: 1 },
      { kind: 'punishment', tier: '凡', count: 1 },
    ]);
  });

  it('shows the updated reverse fate talent tiers and the human-tier plain branch in the first-page fate ribbon copy', () => {
    const plainFateCard = fateCards.find(([title]) => title === '平平无奇');
    const reverseFateCards = Object.fromEntries(
      ['逆命壹', '逆命贰', '逆命叁'].map((title) => [title, fateCards.find(([cardTitle]) => cardTitle === title)]),
    );

    expect(reverseFateCards['逆命壹']?.[2]).toBe('一地阶天赋');
    expect(reverseFateCards['逆命贰']?.[2]).toBe('一天阶天赋');
    expect(reverseFateCards['逆命叁']?.[2]).toBe('一仙阶天赋');
    expect(plainFateCard?.[2]).toBe('一凡阶天赋\n或一人阶天赋 + 一凡阶天谴');
  });
});
