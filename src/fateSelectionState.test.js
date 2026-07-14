import { describe, expect, it } from 'vitest';
import {
  createManualFateEntry,
  formatManualFatePlanLabel,
  getFatePlanSlots,
  getPoolForFateSlot,
  usesPlainManualTalents,
} from './fateSelectionState';

const tierMeta = {
  '凡': { label: '凡阶' },
  '地': { label: '地阶' },
  '天': { label: '天阶' },
};

const plan = {
  label: '一地阶天赋 + 一地阶天谴',
  items: [
    { kind: 'talent', tier: '地', count: 1 },
    { kind: 'punishment', tier: '地', count: 1 },
  ],
};

describe('fate manual selection policy', () => {
  it('uses plain-tier talents for every fate path in manual selection', () => {
    expect(usesPlainManualTalents('天命壹')).toBe(true);
    expect(usesPlainManualTalents('逆命壹')).toBe(true);
    expect(usesPlainManualTalents('平平无奇')).toBe(true);
    expect(usesPlainManualTalents('')).toBe(false);

    expect(getFatePlanSlots(plan, {
      fateTitle: '天命壹',
      manual: true,
      tierMeta,
    })).toMatchObject([
      { kind: 'talent', tier: '凡', label: '凡阶天赋' },
      { kind: 'punishment', tier: '地', label: '地阶天谴' },
    ]);
  });

  it.each(['逆命贰', '平平无奇', '天命贰'])('maps talents from %s to plain tier while preserving punishment tier', (fateTitle) => {
    const tierPlan = {
      label: '测试方案',
      items: [
        { kind: 'talent', tier: '天', count: 1 },
        { kind: 'punishment', tier: '天', count: 1 },
      ],
    };
    const [talentSlot, punishmentSlot] = getFatePlanSlots(tierPlan, {
      fateTitle,
      manual: true,
      tierMeta,
    });

    expect(talentSlot.tier).toBe('凡');
    expect(punishmentSlot.tier).toBe('天');
  });

  it('keeps the original plan untouched for draw mode while inverse manual selection becomes plain tier', () => {
    const original = structuredClone(plan);

    expect(getFatePlanSlots(plan, {
      fateTitle: '天命壹',
      manual: false,
      tierMeta,
    })).toMatchObject([
      { kind: 'talent', tier: '地' },
      { kind: 'punishment', tier: '地' },
    ]);
    expect(getFatePlanSlots(plan, {
      fateTitle: '逆命壹',
      manual: true,
      tierMeta,
    })[0].tier).toBe('凡');
    expect(plan).toEqual(original);
  });

  it('updates every manual label and writes the effective tier into the result', () => {
    const slots = getFatePlanSlots(plan, {
      fateTitle: '天命壹',
      manual: true,
      tierMeta,
    });
    const pools = {
      talentPool: { '凡': [{ name: '凡阶天赋' }], '地': [{ name: '地阶天赋' }] },
      punishmentPool: { '地': [{ name: '地阶天谴' }] },
    };

    expect(formatManualFatePlanLabel(plan, '天命壹', tierMeta)).toBe('一凡阶天赋 + 一地阶天谴');
    expect(formatManualFatePlanLabel({
      label: '一天阶天赋',
      items: [{ kind: 'talent', tier: '天', count: 1 }],
    }, '逆命贰', tierMeta)).toBe('一凡阶天赋');
    expect(getPoolForFateSlot(slots[0], pools)).toEqual([{ name: '凡阶天赋' }]);
    expect(getPoolForFateSlot(slots[1], pools)).toEqual([{ name: '地阶天谴' }]);
    expect(createManualFateEntry(slots[0], { name: '手选天赋' })).toEqual({
      kind: 'talent',
      tier: '凡',
      name: '手选天赋',
    });
  });
});
