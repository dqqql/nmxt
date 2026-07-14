export const BREAKTHROUGH_CHOICE_LIMIT = 2;

const sharedChoices = {
  normalHealth: {
    id: 'normal-health',
    label: '正常血量格 +1 并所有中伤阈值 +1',
    effects: { normalHealthCapacity: 1, bodyMediumThreshold: 1, soulMediumThreshold: 1 },
  },
  nonCoreAttributes: {
    id: 'non-core-attributes',
    label: '将两个非核心属性 +1',
    effects: { nonCoreAttributeIncreases: 2 },
  },
  dangerHealth: {
    id: 'danger-health',
    label: '险境血量格 +1 并所有重伤阈值 +1',
    effects: { dangerHealthCapacity: 1, bodyHeavyThreshold: 1, soulHeavyThreshold: 1 },
  },
  spirit: {
    id: 'spirit',
    label: '灵气格 +1',
    effects: { qiCapacity: 1 },
  },
  storage: {
    id: 'storage',
    label: '储物格 +1',
    effects: { storageCapacity: 1 },
  },
};

const breakthroughChoiceSets = {
  'foundation-early': [
    sharedChoices.normalHealth,
    sharedChoices.nonCoreAttributes,
    sharedChoices.dangerHealth,
    {
      id: 'qi-treasure',
      label: '获得一个练气期凡阶灵宝',
      effects: { qiTreasureChoices: 1 },
    },
    sharedChoices.spirit,
    sharedChoices.storage,
    {
      id: 'extra-method',
      label: '不再升级法门，改为修习额外一个法门',
      effects: { replaceMethodAdvancement: 1, extraMethodChoices: 1 },
    },
  ],
  'golden-core': [
    sharedChoices.normalHealth,
    sharedChoices.nonCoreAttributes,
    sharedChoices.dangerHealth,
    {
      id: 'foundation-treasure',
      label: '获得一个筑基期凡阶灵宝',
      effects: { foundationTreasureChoices: 1 },
    },
    sharedChoices.spirit,
    sharedChoices.storage,
  ],
};

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function subtractEffects(after = {}, before = {}) {
  const keys = new Set([...Object.keys(after), ...Object.keys(before)]);
  return Object.fromEntries([...keys]
    .map((key) => [key, (after[key] || 0) - (before[key] || 0)])
    .filter(([, value]) => value !== 0));
}

export function getBreakthroughChoiceOptions(breakthroughId) {
  return (breakthroughChoiceSets[breakthroughId] || []).map((option) => ({
    ...option,
    effects: { ...option.effects },
  }));
}

export function aggregateBreakthroughChoiceEffects(breakthroughId, selectedOptionIds = []) {
  const selected = new Set(unique(selectedOptionIds));
  return getBreakthroughChoiceOptions(breakthroughId)
    .filter((option) => selected.has(option.id))
    .reduce((effects, option) => {
      Object.entries(option.effects).forEach(([key, value]) => {
        effects[key] = (effects[key] || 0) + value;
      });
      return effects;
    }, {});
}

export function validateBreakthroughChoices(breakthroughId, selectedOptionIds = []) {
  const selected = unique(selectedOptionIds);
  const availableIds = new Set(getBreakthroughChoiceOptions(breakthroughId).map((option) => option.id));
  const unknownOptionIds = selected.filter((optionId) => !availableIds.has(optionId));
  if (!availableIds.size) {
    return { valid: false, reason: 'unknown-breakthrough', unknownOptionIds };
  }
  if (unknownOptionIds.length) {
    return { valid: false, reason: 'unknown-option', unknownOptionIds };
  }
  if (selected.length > BREAKTHROUGH_CHOICE_LIMIT) {
    return { valid: false, reason: 'choice-limit', unknownOptionIds: [] };
  }
  return { valid: true, reason: null, unknownOptionIds: [] };
}

export function createBreakthroughChoiceState(breakthroughId, selectedOptionIds = []) {
  const selected = unique(selectedOptionIds);
  return {
    breakthroughId,
    selectedOptionIds: selected,
    effects: aggregateBreakthroughChoiceEffects(breakthroughId, selected),
    validation: validateBreakthroughChoices(breakthroughId, selected),
  };
}

export function toggleBreakthroughChoice(state, optionId) {
  const current = createBreakthroughChoiceState(
    state?.breakthroughId,
    state?.selectedOptionIds,
  );
  const availableIds = new Set(getBreakthroughChoiceOptions(current.breakthroughId).map((option) => option.id));
  if (!availableIds.has(optionId)) {
    return {
      ...current,
      validation: { valid: false, reason: 'unknown-option', unknownOptionIds: [optionId] },
    };
  }

  const alreadySelected = current.selectedOptionIds.includes(optionId);
  if (!alreadySelected && current.selectedOptionIds.length >= BREAKTHROUGH_CHOICE_LIMIT) {
    return {
      ...current,
      validation: { valid: false, reason: 'choice-limit', unknownOptionIds: [] },
    };
  }

  const selectedOptionIds = alreadySelected
    ? current.selectedOptionIds.filter((selectedId) => selectedId !== optionId)
    : [...current.selectedOptionIds, optionId];
  return createBreakthroughChoiceState(current.breakthroughId, selectedOptionIds);
}

export function getBreakthroughChoiceEffectDelta(previousState, nextState) {
  return subtractEffects(nextState?.effects, previousState?.effects);
}
