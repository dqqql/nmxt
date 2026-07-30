const capacityKeys = ['normalHealth', 'dangerHealth', 'qi', 'storage'];

function normalizeBonus(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function bonusAfter(text, pattern) {
  const match = String(text || '').match(pattern);
  return match ? normalizeBonus(match[1]) : 0;
}

export function getSourceCapacityBonuses(source) {
  const structured = source?.capacityBonuses;
  if (structured && typeof structured === 'object') {
    return Object.fromEntries(capacityKeys.map((key) => [key, normalizeBonus(structured[key])]));
  }

  const buff = source?.buff || '';
  const sharedHealth = bonusAfter(buff, /正常(?:血量格)?\s*[与和及、]\s*险境血量格\s*\+\s*(\d+)/);
  return {
    normalHealth: sharedHealth || bonusAfter(buff, /正常血量格\s*\+\s*(\d+)/),
    dangerHealth: sharedHealth || bonusAfter(buff, /险境血量格\s*\+\s*(\d+)/),
    qi: bonusAfter(buff, /灵气格\s*\+\s*(\d+)/),
    storage: bonusAfter(buff, /储物格\s*\+\s*(\d+)/),
  };
}

export function getSourceCapacityBonusForLabel(source, label) {
  const bonuses = getSourceCapacityBonuses(source);
  const keyByLabel = {
    正常血量: 'normalHealth',
    险境血量: 'dangerHealth',
    灵气: 'qi',
    储物格: 'storage',
  };
  return bonuses[keyByLabel[label]] || 0;
}

export function getCapacityBonusUnlockIndexes(markStates, groupId, count, bonus) {
  const indexes = [];
  for (let index = 0; index < count && indexes.length < bonus; index += 1) {
    const state = markStates?.[`${groupId}:${index}`];
    if (!state || state.ghost) indexes.push(index);
  }
  return indexes;
}
