const MANUAL_TALENT_TIER = '凡';

function numberLabel(value) {
  const labels = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return labels[value] || String(value);
}

export function usesPlainManualTalents(fateTitle) {
  return typeof fateTitle === 'string' && fateTitle.startsWith('天命');
}

export function getFatePlanSlots(plan, { fateTitle = '', manual = false, tierMeta = {} } = {}) {
  if (!plan?.items) return [];
  const forcePlainTalent = manual && usesPlainManualTalents(fateTitle);

  return plan.items.flatMap((item, itemIndex) => {
    const tier = forcePlainTalent && item.kind === 'talent' ? MANUAL_TALENT_TIER : item.tier;
    const kindLabel = item.kind === 'talent' ? '天赋' : '天谴';
    const tierLabel = tierMeta[tier]?.label || tier;
    return Array.from({ length: item.count }, (_, index) => ({
      kind: item.kind,
      tier,
      key: `${item.kind}-${tier}-${itemIndex}-${index}`,
      label: `${tierLabel}${kindLabel}`,
    }));
  });
}

export function formatManualFatePlanLabel(plan, fateTitle, tierMeta = {}) {
  if (!plan) return '';
  if (!usesPlainManualTalents(fateTitle)) return plan.label || '';

  return (plan.items || []).map((item) => {
    const tier = item.kind === 'talent' ? MANUAL_TALENT_TIER : item.tier;
    const tierLabel = tierMeta[tier]?.label || tier;
    const kindLabel = item.kind === 'talent' ? '天赋' : '天谴';
    return `${numberLabel(item.count)}${tierLabel}${kindLabel}`;
  }).join(' + ');
}

export function getPoolForFateSlot(slot, { talentPool, punishmentPool }) {
  return slot.kind === 'talent' ? talentPool[slot.tier] : punishmentPool[slot.tier];
}

export function createManualFateEntry(slot, entry) {
  return entry ? { ...entry, kind: slot.kind, tier: slot.tier } : null;
}
