export const BEAST_BLOODLINE_SPELLS = {
  'p3-bloodline-3': {
    name: '习得神通-疗愈',
    text: '【气尽】轻巧动作。恢复一名友军2血量格',
  },
  'p3-bloodline-4': {
    name: '习得神通-缚身',
    text: '【气尽】轻巧动作，命中敌人拆招未成功则施加【禁行】',
  },
};

const AUTO_FILLED_SPELLS = Object.values(BEAST_BLOODLINE_SPELLS);

export function getBloodlineSelectionText(current, bloodlineId, selected) {
  const spell = BEAST_BLOODLINE_SPELLS[bloodlineId];
  if (!selected) {
    const isUntouchedSelection = spell
      && current.name === spell.name
      && current.text === spell.text;
    return isUntouchedSelection ? { name: '', text: '' } : current;
  }
  if (spell) return spell;

  const isUntouchedAutoFill = AUTO_FILLED_SPELLS.some((entry) => (
    current.name === entry.name && current.text === entry.text
  ));
  return isUntouchedAutoFill ? { name: '', text: '' } : current;
}

export function hydrateBloodlineSpell(current, bloodlineId, defaultText = '') {
  const spell = BEAST_BLOODLINE_SPELLS[bloodlineId];
  if (!spell) return current;
  return {
    name: current.name || spell.name,
    text: !current.text || current.text === defaultText ? spell.text : current.text,
  };
}

export function hydrateBloodlineSpellSnapshot(texts, markStates, defaultText = '') {
  const bloodlineId = Object.keys(BEAST_BLOODLINE_SPELLS)
    .find((id) => markStates[`${id}:0`]?.filled) || '';
  const current = {
    name: texts.followerMoveName1 || '',
    text: texts.followerMoveEffect1 || '',
  };
  const next = hydrateBloodlineSpell(current, bloodlineId, defaultText);
  if (next.name === current.name && next.text === current.text) return texts;
  return {
    ...texts,
    followerMoveName1: next.name,
    followerMoveEffect1: next.text,
  };
}
