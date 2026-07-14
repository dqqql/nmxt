import { describe, expect, it } from 'vitest';
import { fateCards, fateDraws } from './data';

describe('fate talent tier policy', () => {
  it('uses plain-tier talents in every configured draw plan', () => {
    const plans = Object.values(fateDraws).flat();
    const talentItems = plans.flatMap((plan) => plan.items.filter((item) => item.kind === 'talent'));

    expect(talentItems.length).toBeGreaterThan(0);
    expect(talentItems.every((item) => item.tier === '凡')).toBe(true);
    expect(plans.every((plan) => !/[人地天仙]阶天赋/.test(plan.label))).toBe(true);
  });

  it('shows only plain-tier talents in the first-page fate ribbon copy', () => {
    const talentCopies = fateCards.map(([, , talentRule]) => talentRule).filter(Boolean);

    expect(talentCopies.length).toBeGreaterThan(0);
    expect(talentCopies.every((copy) => !/[人地天仙][级阶]天赋/.test(copy))).toBe(true);
  });
});
