import { describe, expect, it } from 'vitest';
import { fateCards, fateDraws } from './data';

describe('fate talent tier policy', () => {
  it('uses the configured draw tiers, including the plain fate human-tier option', () => {
    const plans = Object.values(fateDraws).flat();
    const talentItems = plans.flatMap((plan) => plan.items.filter((item) => item.kind === 'talent'));
    const plainPlans = fateDraws['平平无奇'];

    expect(talentItems.length).toBeGreaterThan(0);
    expect(plainPlans.map((plan) => plan.label)).toEqual([
      '一凡阶天赋',
      '一人阶天赋 + 一凡阶天谴',
    ]);
    expect(plainPlans[1].items).toEqual([
      { kind: 'talent', tier: '人', count: 1 },
      { kind: 'punishment', tier: '凡', count: 1 },
    ]);
  });

  it('shows the human-tier plain fate branch in the first-page fate ribbon copy', () => {
    const plainFateCard = fateCards.find(([title]) => title === '平平无奇');

    expect(plainFateCard?.[2]).toBe('一凡阶天赋\n或一人阶天赋 + 一凡阶天谴');
  });
});
