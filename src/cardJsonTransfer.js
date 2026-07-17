const INVALID_FILE_NAME_CHARACTERS = /[<>:"/\\|?*\u0000-\u001f]/g;
const CARD_SNAPSHOT_KEYS = [
  'selections',
  'texts',
  'attributes',
  'coreAttribute',
  'drawnTalents',
  'selectedFateTitle',
  'diceEffects',
  'fortuneOverflow',
  'markStates',
  'thresholdBonuses',
  'upgradeChoices',
  'breakthroughChoices',
  'breakthroughChoiceDetails',
  'maxRealmIndexReached',
  'specialQuestionnaires',
];

function getSnapshotFromJsonValue(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('JSON 内容不是有效的角色卡数据。');
  }

  // Accept both the current raw snapshot format and a possible wrapped export.
  const snapshot = value.card && typeof value.card === 'object' && !Array.isArray(value.card)
    ? value.card
    : value;
  if (!CARD_SNAPSHOT_KEYS.some((key) => Object.hasOwn(snapshot, key))) {
    throw new Error('JSON 文件中没有找到角色卡数据。');
  }
  const { portrait: _ignoredPortrait, ...cardWithoutImage } = snapshot;
  return cardWithoutImage;
}

export function createCardJson(snapshot) {
  const cardWithoutImage = getSnapshotFromJsonValue(snapshot);
  return `${JSON.stringify(cardWithoutImage, null, 2)}\n`;
}

export function parseCardJson(jsonText) {
  let value;
  try {
    value = JSON.parse(jsonText);
  } catch {
    throw new Error('无法解析 JSON 文件，请检查文件格式。');
  }
  return getSnapshotFromJsonValue(value);
}

export function getCardJsonFileName(characterName) {
  const safeName = String(characterName || '')
    .trim()
    .replace(INVALID_FILE_NAME_CHARACTERS, '_')
    .replace(/[. ]+$/g, '');
  return `${safeName || '逆命仙途角色卡'}.json`;
}
