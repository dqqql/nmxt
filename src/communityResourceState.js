export const COMMUNITY_RESOURCE_STORAGE_KEY = 'nmxt.communityResources.v1';

export const COMMUNITY_CARD_TYPES = {
  spells: '神通',
  arts: '秘法',
  insights: '感悟',
  originInsights: '本源感悟',
  treasures: '灵宝',
  talent: '天赋',
  punishment: '天谴',
};

export const COMMUNITY_FATE_TIERS = ['凡', '人', '地', '天', '仙'];

const TYPE_ALIASES = Object.fromEntries([
  ...Object.keys(COMMUNITY_CARD_TYPES).map((key) => [key, key]),
  ...Object.entries(COMMUNITY_CARD_TYPES).map(([key, label]) => [label, key]),
]);

export class CommunityResourceValidationError extends Error {
  constructor(errors) {
    super('社区资源包格式无效。');
    this.name = 'CommunityResourceValidationError';
    this.errors = errors;
  }
}

function safeClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCard(card, index, errors) {
  const path = `cards[${index}]`;
  if (!card || typeof card !== 'object' || Array.isArray(card)) {
    errors.push({ path, message: '卡片必须是对象。' });
    return null;
  }

  const type = TYPE_ALIASES[card.type];
  if (!type) {
    errors.push({
      path: `${path}.type`,
      message: `卡片类型必须是${Object.values(COMMUNITY_CARD_TYPES).join('、')}之一。`,
    });
  }
  if (typeof card.name !== 'string' || !card.name.trim()) {
    errors.push({ path: `${path}.name`, message: '卡片名称不能为空。' });
  }
  if (typeof card.text !== 'string' || !card.text.trim()) {
    errors.push({ path: `${path}.text`, message: '卡片内容不能为空。' });
  }
  const isFateCard = type === 'talent' || type === 'punishment';
  if (isFateCard && !COMMUNITY_FATE_TIERS.includes(card.tier)) {
    errors.push({ path: `${path}.tier`, message: '天赋 / 天谴的品阶必须是凡、人、地、天或仙。' });
  }

  if (!type || typeof card.name !== 'string' || !card.name.trim()
    || typeof card.text !== 'string' || !card.text.trim()
    || (isFateCard && !COMMUNITY_FATE_TIERS.includes(card.tier))) return null;

  return {
    type,
    name: card.name.trim(),
    text: card.text.trim(),
    ...(isFateCard ? { tier: card.tier } : {}),
  };
}

export function validateCommunityResourcePack(pack, installedPacks = []) {
  const errors = [];
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) {
    throw new CommunityResourceValidationError([{ path: '$', message: '资源包根节点必须是对象。' }]);
  }
  if (typeof pack.name !== 'string' || !pack.name.trim()) {
    errors.push({ path: 'name', message: '包名不能为空。' });
  }
  if (typeof pack.author !== 'string' || !pack.author.trim()) {
    errors.push({ path: 'author', message: '作者不能为空。' });
  }
  if (!Array.isArray(pack.cards) || !pack.cards.length) {
    errors.push({ path: 'cards', message: 'cards 必须是至少包含一张卡片的数组。' });
  }

  const normalizedName = typeof pack.name === 'string' ? pack.name.trim() : '';
  const normalizedAuthor = typeof pack.author === 'string' ? pack.author.trim() : '';
  if (normalizedName && installedPacks.some((entry) => entry.name === normalizedName)) {
    errors.push({ path: 'name', message: `包名「${normalizedName}」已存在，请换一个包名。` });
  }

  const cards = Array.isArray(pack.cards)
    ? pack.cards.map((card, index) => normalizeCard(card, index, errors)).filter(Boolean)
    : [];

  if (errors.length) throw new CommunityResourceValidationError(errors);
  return { name: normalizedName, author: normalizedAuthor, cards };
}

export function parseCommunityResourceJson(text, installedPacks = []) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new CommunityResourceValidationError([
      { path: '$', message: `JSON 语法错误：${error.message}` },
    ]);
  }
  return validateCommunityResourcePack(parsed, installedPacks);
}

export function readStoredCommunityResources(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem(COMMUNITY_RESOURCE_STORAGE_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    const result = [];
    value.forEach((pack) => {
      try {
        result.push(validateCommunityResourcePack(pack, result));
      } catch {
        // Ignore stale or malformed local entries without breaking the builder.
      }
    });
    return result;
  } catch {
    return [];
  }
}

export function writeStoredCommunityResources(packs, storage = globalThis.localStorage) {
  storage?.setItem(COMMUNITY_RESOURCE_STORAGE_KEY, JSON.stringify(safeClone(packs || [])));
}

export function addCommunityResourcePack(packs, pack) {
  return [...(packs || []), safeClone(pack)];
}

export function upsertCommunityResourcePack(packs, pack) {
  const index = (packs || []).findIndex((entry) => entry.name === pack.name);
  if (index < 0) return addCommunityResourcePack(packs, pack);
  return (packs || []).map((entry, currentIndex) => (
    currentIndex === index ? safeClone(pack) : entry
  ));
}

export function removeCommunityResourcePack(packs, packName) {
  return (packs || []).filter((pack) => pack.name !== packName);
}
