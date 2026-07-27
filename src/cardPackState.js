export const CARD_PACK_STORAGE_KEY = 'nmxt.cardPacks.v1';
export const CARD_PACK_MAX_BYTES = 2 * 1024 * 1024;
export const CARD_PACK_MAX_RESOURCES = 500;

const idPattern = /^[a-z0-9][a-z0-9._-]*$/;
const parentKinds = new Set(['source', 'method', 'dao']);
const fateKinds = new Set(['talent', 'punishment']);
const fateTiers = new Set(['凡', '人', '地', '天', '仙']);
const realms = new Set([
  'qi-early',
  'qi-middle',
  'qi-late',
  'foundation-early',
  'foundation-middle',
  'foundation-late',
  'golden-core',
]);
const acquisitions = new Set(['initial', 'realm-choice']);

const allowedPlacements = new Set([
  'source:source-ability:qi-early:initial',
  'source:source-effect:qi-early:initial',
  'source:skill:qi-early:initial',
  'source:skill:qi-middle:realm-choice',
  'source:skill:foundation-middle:realm-choice',
  'source:art:qi-early:initial',
  'source:art:foundation-middle:realm-choice',
  'method:attack-buff:qi-early:initial',
  'method:attack-buff:foundation-early:realm-choice',
  'method:technique:qi-early:initial',
  'method:technique:foundation-early:realm-choice',
  'method:insight:qi-early:initial',
  'method:insight:qi-late:realm-choice',
  'method:insight:foundation-early:realm-choice',
  'method:insight:foundation-late:realm-choice',
  'method:origin-insight:foundation-early:realm-choice',
  'method:origin-insight:golden-core:realm-choice',
  'dao:dao-effect:qi-early:initial',
  'dao:dao-method:qi-late:realm-choice',
  'dao:dao-method:foundation-late:realm-choice',
]);

export const RESOURCE_TYPE_LABELS = {
  'source-ability': '道源能力',
  'source-effect': '道源效果',
  skill: '神通',
  art: '秘法',
  'attack-buff': '攻击增益',
  technique: '技艺',
  insight: '感悟',
  'origin-insight': '本源感悟',
  'dao-effect': '大道效果',
  'dao-method': '功法',
  'fate-entry': '天赋 / 天谴',
};

export const REALM_LABELS = {
  'qi-early': '练气前期',
  'qi-middle': '练气中期',
  'qi-late': '练气后期',
  'foundation-early': '筑基前期',
  'foundation-middle': '筑基中期',
  'foundation-late': '筑基后期',
  'golden-core': '金丹前期',
};

function safeClone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function coreId(...parts) {
  return `core:${parts.map((part) => encodeURIComponent(String(part))).join(':')}`;
}

function asCoreCard(card, ...parts) {
  if (!card) return null;
  return {
    ...safeClone(card),
    _resourceId: coreId(...parts, card.name || 'resource'),
    _packId: null,
    _packName: '核心规则',
  };
}

function asPackCard(pack, resource) {
  return {
    ...safeClone(resource),
    _resourceId: `${pack.id}:${resource.id}`,
    _packId: pack.id,
    _packName: pack.name,
    _parentKind: resource.parent.kind,
    _parentName: resource.parent.name,
    _realm: resource.realm,
    _acquisition: resource.acquisition,
  };
}

function addError(errors, path, message, resourceIndex = null) {
  errors.push({ path, message, resourceIndex });
}

export class CardPackValidationError extends Error {
  constructor(errors) {
    super('卡包格式校验失败');
    this.name = 'CardPackValidationError';
    this.errors = errors;
  }
}

export function readStoredCardPacks(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem(CARD_PACK_STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeStoredCardPacks(packs, storage = globalThis.localStorage) {
  storage?.setItem(CARD_PACK_STORAGE_KEY, JSON.stringify(Array.isArray(packs) ? packs : []));
}

export function countPackReferences(packId, snapshots = []) {
  const serializedId = JSON.stringify(packId);
  return (snapshots || []).filter((snapshot) => JSON.stringify(snapshot || {}).includes(serializedId)).length;
}

function validateResource(resource, index, parentLibraries, errors) {
  const base = `resources[${index}]`;
  if (!resource || typeof resource !== 'object' || Array.isArray(resource)) {
    addError(errors, base, '资源必须是对象。', index);
    return;
  }
  ['id', 'type', 'realm', 'acquisition', 'name', 'text'].forEach((field) => {
    if (typeof resource[field] !== 'string' || !resource[field].trim()) {
      addError(errors, `${base}.${field}`, '此字段为必填字符串。', index);
    }
  });
  if (resource.id && !idPattern.test(resource.id)) {
    addError(errors, `${base}.id`, '资源 ID 只能包含小写字母、数字、点、下划线和连字符。', index);
  }
  if (!resource.parent || typeof resource.parent !== 'object' || Array.isArray(resource.parent)) {
    addError(errors, `${base}.parent`, '必须标记父资源。', index);
    return;
  }
  const { kind, name } = resource.parent;
  if (!parentKinds.has(kind)) {
    addError(errors, `${base}.parent.kind`, '父资源类型必须是 source、method 或 dao。', index);
  }
  if (typeof name !== 'string' || !name.trim()) {
    addError(errors, `${base}.parent.name`, '必须填写父资源名称。', index);
  } else if (parentKinds.has(kind) && !parentLibraries[kind]?.has(name)) {
    addError(errors, `${base}.parent.name`, `找不到已有${kind === 'source' ? '道源' : kind === 'method' ? '法门' : '大道'}「${name}」。`, index);
  }
  if (resource.realm && !realms.has(resource.realm)) {
    addError(errors, `${base}.realm`, '不支持这个境界代码。', index);
  }
  if (resource.acquisition && !acquisitions.has(resource.acquisition)) {
    addError(errors, `${base}.acquisition`, '获取方式必须是 initial 或 realm-choice。', index);
  }
  if (kind && resource.type && resource.realm && resource.acquisition) {
    const placement = `${kind}:${resource.type}:${resource.realm}:${resource.acquisition}`;
    if (!allowedPlacements.has(placement)) {
      addError(errors, base, '资源类型、父资源、境界和获取方式的组合不受支持。', index);
    }
  }
  if (resource.type === 'source-ability' && resource.buff != null && typeof resource.buff !== 'string') {
    addError(errors, `${base}.buff`, '道源能力的 buff 必须是字符串。', index);
  }
  if (resource.type === 'technique') {
    if (resource.grants != null && (!Array.isArray(resource.grants) || resource.grants.some((item) => typeof item !== 'string'))) {
      addError(errors, `${base}.grants`, '技艺 grants 必须是字符串数组。', index);
    }
    if (
      resource.storageCapacityBonus != null
      && (!Number.isInteger(resource.storageCapacityBonus) || resource.storageCapacityBonus < 0 || resource.storageCapacityBonus > 20)
    ) {
      addError(errors, `${base}.storageCapacityBonus`, '储物格加成必须是 0 到 20 的整数。', index);
    }
  }
}

function validateFateEntry(entry, index, errors) {
  const base = `talents[${index}]`;
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    addError(errors, base, '天赋 / 天谴必须是对象。', index);
    return;
  }
  ['id', 'kind', 'tier', 'name', 'effect'].forEach((field) => {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) {
      addError(errors, `${base}.${field}`, '此字段为必填字符串。', index);
    }
  });
  if (entry.id && !idPattern.test(entry.id)) {
    addError(errors, `${base}.id`, '天赋 / 天谴 ID 只能包含小写字母、数字、点、下划线和连字符。', index);
  }
  if (entry.kind && !fateKinds.has(entry.kind)) {
    addError(errors, `${base}.kind`, '类型必须是 talent（天赋）或 punishment（天谴）。', index);
  }
  if (entry.tier && !fateTiers.has(entry.tier)) {
    addError(errors, `${base}.tier`, '品阶必须是 凡、人、地、天 或 仙。', index);
  }
}

function slotKey(resource) {
  return [
    resource.parent?.kind,
    resource.parent?.name,
    resource.type,
    resource.realm,
    resource.acquisition,
  ].join('|');
}

function fateSlotKey(entry) {
  return [entry.kind, entry.tier].join('|');
}

function existingNamesForSlot(runtime, resource) {
  const parent = runtime[resource.parent?.kind]?.find((entry) => entry.name === resource.parent?.name);
  if (!parent) return [];
  let candidates = [];
  if (resource.parent.kind === 'source') {
    if (resource.type === 'source-ability') candidates = parent.abilityOptions;
    else if (resource.type === 'source-effect') candidates = parent.effectOptions;
    else if (resource.type === 'skill' && resource.acquisition === 'initial') candidates = parent.initialSkillOptions;
    else if (resource.type === 'skill' && resource.realm === 'qi-middle') candidates = parent.qiUpgradeSkills;
    else if (resource.type === 'skill') candidates = parent.foundationUpgradeSkills;
    else if (resource.type === 'art' && resource.acquisition === 'initial') candidates = parent.initialArtOptions;
    else candidates = parent.foundationUpgradeArts;
  } else if (resource.parent.kind === 'method') {
    if (resource.type === 'attack-buff') {
      candidates = resource.realm === 'qi-early' ? parent.initialAttackBuffOptions : parent.foundationAttackBuffOptions;
    } else if (resource.type === 'technique') {
      candidates = resource.realm === 'qi-early' ? parent.initialTechniqueOptions : parent.foundationTechniqueOptions;
    } else if (resource.type === 'insight') {
      const prefix = resource.realm.startsWith('foundation') ? '筑基·' : '练气·';
      const core = (parent.insights || []).filter((card) => card.name?.startsWith(prefix));
      const additions = resource.acquisition === 'initial'
        ? parent.packInitialInsights
        : resource.realm === 'qi-late'
          ? parent.packQiInsights
          : resource.realm === 'foundation-early'
            ? parent.packFoundationEarlyInsights
            : parent.packFoundationLateInsights;
      candidates = [...core, ...(additions || [])];
    } else {
      const prefix = resource.realm === 'golden-core' ? '筑基本源·' : '练气本源·';
      const core = (parent.originInsights || []).filter((card) => card.name?.startsWith(prefix));
      candidates = [
        ...core,
        ...(resource.realm === 'golden-core' ? parent.packFoundationOriginInsights : parent.packQiOriginInsights),
      ];
    }
  } else if (resource.type === 'dao-effect') {
    candidates = parent.effectOptions;
  } else {
    candidates = resource.realm === 'qi-late' ? parent.qiMethods : parent.foundationMethods;
  }
  return candidates.map((entry) => entry?.name).filter(Boolean);
}

export function validateCardPack(pack, {
  baseOptions,
  installedPacks = [],
  replacingId = null,
} = {}) {
  const errors = [];
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) {
    throw new CardPackValidationError([{ path: '$', message: '卡包根节点必须是对象。', resourceIndex: null }]);
  }
  if (pack.schemaVersion !== 1) addError(errors, 'schemaVersion', '只支持 schemaVersion 1。');
  ['id', 'name', 'version'].forEach((field) => {
    if (typeof pack[field] !== 'string' || !pack[field].trim()) addError(errors, field, '此字段为必填字符串。');
  });
  if (pack.id && !idPattern.test(pack.id)) {
    addError(errors, 'id', '卡包 ID 只能包含小写字母、数字、点、下划线和连字符。');
  }
  if (pack.author != null && typeof pack.author !== 'string') addError(errors, 'author', '作者必须是字符串。');
  if (pack.description != null && typeof pack.description !== 'string') addError(errors, 'description', '说明必须是字符串。');
  if (pack.resources != null && !Array.isArray(pack.resources)) addError(errors, 'resources', 'resources 必须是数组。');
  if (pack.talents != null && !Array.isArray(pack.talents)) addError(errors, 'talents', 'talents 必须是数组。');
  if (!Array.isArray(pack.resources) && !Array.isArray(pack.talents)) {
    addError(errors, '$', '卡包至少需要 resources 或 talents 数组。');
  }
  if (pack.resources?.length > CARD_PACK_MAX_RESOURCES) addError(errors, 'resources', `单个卡包最多包含 ${CARD_PACK_MAX_RESOURCES} 个资源。`);
  if (((pack.resources?.length || 0) + (pack.talents?.length || 0)) > CARD_PACK_MAX_RESOURCES) {
    addError(errors, '$', `单个卡包最多包含 ${CARD_PACK_MAX_RESOURCES} 项内容。`);
  }

  const parentLibraries = {
    source: new Set((baseOptions?.source || []).map((entry) => entry.name)),
    method: new Set((baseOptions?.method || []).map((entry) => entry.name)),
    dao: new Set((baseOptions?.dao || []).map((entry) => entry.name)),
  };
  const ids = new Set();
  const namesBySlot = new Map();
  (pack.resources || []).forEach((resource, index) => {
    validateResource(resource, index, parentLibraries, errors);
    if (resource?.id) {
      if (ids.has(resource.id)) addError(errors, `resources[${index}].id`, `资源 ID「${resource.id}」重复。`, index);
      ids.add(resource.id);
    }
    if (resource?.name) {
      const key = slotKey(resource);
      const normalizedName = resource.name.trim();
      if (!namesBySlot.has(key)) namesBySlot.set(key, new Set());
      if (namesBySlot.get(key).has(normalizedName)) {
        addError(errors, `resources[${index}].name`, `同一候选槽中名称「${normalizedName}」重复。`, index);
      }
      namesBySlot.get(key).add(normalizedName);
    }
  });
  const namesByFateSlot = new Map();
  (pack.talents || []).forEach((entry, index) => {
    validateFateEntry(entry, index, errors);
    if (entry?.id) {
      if (ids.has(entry.id)) addError(errors, `talents[${index}].id`, `ID「${entry.id}」重复。`, index);
      ids.add(entry.id);
    }
    if (entry?.name) {
      const key = fateSlotKey(entry);
      const normalizedName = entry.name.trim();
      if (!namesByFateSlot.has(key)) namesByFateSlot.set(key, new Set());
      if (namesByFateSlot.get(key).has(normalizedName)) {
        addError(errors, `talents[${index}].name`, `同一品阶和类型中名称「${normalizedName}」重复。`, index);
      }
      namesByFateSlot.get(key).add(normalizedName);
    }
  });

  const otherResources = installedPacks
    .filter((entry) => entry.id !== replacingId)
    .flatMap((entry) => entry.resources || []);
  (pack.resources || []).forEach((resource, index) => {
    if (!resource?.name) return;
    const conflict = otherResources.find((entry) => slotKey(entry) === slotKey(resource) && entry.name === resource.name);
    if (conflict) {
      addError(errors, `resources[${index}].name`, `与已安装卡包中的同槽资源「${resource.name}」重名。`, index);
    }
  });
  const otherTalents = installedPacks
    .filter((entry) => entry.id !== replacingId)
    .flatMap((entry) => entry.talents || []);
  (pack.talents || []).forEach((entry, index) => {
    if (!entry?.name) return;
    const conflict = otherTalents.find((other) => fateSlotKey(other) === fateSlotKey(entry) && other.name === entry.name);
    if (conflict) {
      addError(errors, `talents[${index}].name`, `与已安装卡包中的同品阶${entry.kind === 'talent' ? '天赋' : '天谴'}「${entry.name}」重名。`, index);
    }
  });
  const existingRuntime = buildRuntimeOptions(
    baseOptions,
    installedPacks.filter((entry) => entry.id !== replacingId),
  );
  (pack.resources || []).forEach((resource, index) => {
    if (!resource?.name || !resource?.parent) return;
    if (existingNamesForSlot(existingRuntime, resource).includes(resource.name)) {
      addError(errors, `resources[${index}].name`, `与核心规则或已安装卡包中的同槽资源「${resource.name}」重名。`, index);
    }
  });
  (pack.talents || []).forEach((entry, index) => {
    if (!entry?.name || !fateKinds.has(entry.kind) || !fateTiers.has(entry.tier)) return;
    const pool = entry.kind === 'talent' ? baseOptions?.talentPool : baseOptions?.punishmentPool;
    if ((pool?.[entry.tier] || []).some((other) => other.name === entry.name)) {
      addError(errors, `talents[${index}].name`, `与核心规则中的${entry.tier}阶${entry.kind === 'talent' ? '天赋' : '天谴'}「${entry.name}」重名。`, index);
    }
  });

  if (errors.length) throw new CardPackValidationError(errors);
  return {
    ...safeClone(pack),
    resources: safeClone(pack.resources || []),
    talents: safeClone(pack.talents || []),
  };
}

export function parseCardPackJson(text, options = {}) {
  if (new TextEncoder().encode(String(text || '')).length > CARD_PACK_MAX_BYTES) {
    throw new CardPackValidationError([{ path: '$', message: '卡包文件不能超过 2 MiB。', resourceIndex: null }]);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new CardPackValidationError([{ path: '$', message: `JSON 语法错误：${error.message}`, resourceIndex: null }]);
  }
  return validateCardPack(parsed, options);
}

export function upsertCardPack(packs, pack) {
  const index = (packs || []).findIndex((entry) => entry.id === pack.id);
  if (index < 0) return [...(packs || []), safeClone(pack)];
  return packs.map((entry, currentIndex) => (currentIndex === index ? safeClone(pack) : entry));
}

export function removeCardPack(packs, packId) {
  return (packs || []).filter((entry) => entry.id !== packId);
}

function prepareSources(sources) {
  return sources.map((source) => ({
    ...safeClone(source),
    initialSkillOptions: [asCoreCard(source.initialSkill || source.skills?.[0], 'source', source.name, 'skill', 'qi-early')].filter(Boolean),
    initialArtOptions: [asCoreCard(source.initialArt || source.arts?.[0], 'source', source.name, 'art', 'qi-early')].filter(Boolean),
    abilityOptions: [{
      name: `${source.name}能力`,
      text: source.ability || '',
      buff: source.buff || '',
      _resourceId: coreId('source', source.name, 'source-ability'),
      _packId: null,
      _packName: '核心规则',
    }],
    effectOptions: [{
      name: `${source.name}效果`,
      text: source.effect || '',
      _resourceId: coreId('source', source.name, 'source-effect'),
      _packId: null,
      _packName: '核心规则',
    }],
    qiUpgradeSkills: (source.qiUpgradeSkills || source.skills?.slice(1, 3) || []).map((card) => asCoreCard(card, 'source', source.name, 'skill', 'qi-middle')),
    foundationUpgradeSkills: (source.foundationUpgradeSkills || source.skills?.slice(3) || []).map((card) => asCoreCard(card, 'source', source.name, 'skill', 'foundation-middle')),
    foundationUpgradeArts: (source.foundationUpgradeArts || source.arts?.slice(1) || []).map((card) => asCoreCard(card, 'source', source.name, 'art', 'foundation-middle')),
  }));
}

function prepareMethods(methods) {
  return methods.map((method) => ({
    ...safeClone(method),
    initialAttackBuffOptions: method.attackBuffs?.[0] ? [{
      name: '入门攻击增益',
      text: method.attackBuffs[0],
      _resourceId: coreId('method', method.name, 'attack-buff', 'qi-early'),
      _packId: null,
      _packName: '核心规则',
    }] : [],
    foundationAttackBuffOptions: method.attackBuffs?.[1] ? [{
      name: '进阶攻击增益',
      text: method.attackBuffs[1],
      _resourceId: coreId('method', method.name, 'attack-buff', 'foundation-early'),
      _packId: null,
      _packName: '核心规则',
    }] : [],
    initialTechniqueOptions: method.techniques?.qi ? [asCoreCard(method.techniques.qi, 'method', method.name, 'technique', 'qi-early')] : [],
    foundationTechniqueOptions: method.techniques?.foundation ? [asCoreCard(method.techniques.foundation, 'method', method.name, 'technique', 'foundation-early')] : [],
    packInitialInsights: [],
    packQiInsights: [],
    packFoundationEarlyInsights: [],
    packFoundationLateInsights: [],
    packQiOriginInsights: [],
    packFoundationOriginInsights: [],
  }));
}

function prepareDaos(daos) {
  return daos.map((dao) => ({
    ...safeClone(dao),
    effectOptions: [{
      name: dao.effectName || `${dao.name}效果`,
      text: dao.effect || '',
      _resourceId: coreId('dao', dao.name, 'dao-effect'),
      _packId: null,
      _packName: '核心规则',
    }],
    qiMethods: (dao.qiMethods || []).map((card) => asCoreCard(card, 'dao', dao.name, 'dao-method', 'qi-late')),
    foundationMethods: (dao.foundationMethods || []).map((card) => asCoreCard(card, 'dao', dao.name, 'dao-method', 'foundation-late')),
  }));
}

function prepareFatePool(pool) {
  return Object.fromEntries(
    [...fateTiers].map((tier) => [tier, safeClone(pool?.[tier] || [])]),
  );
}

function asPackFateEntry(pack, entry) {
  return {
    name: entry.name,
    effect: entry.effect,
    _resourceId: `${pack.id}:${entry.id}`,
    _packId: pack.id,
    _packName: pack.name,
  };
}

export function buildRuntimeOptions(baseOptions, packs = []) {
  const source = prepareSources(baseOptions?.source || []);
  const method = prepareMethods(baseOptions?.method || []);
  const dao = prepareDaos(baseOptions?.dao || []);
  const talentPool = prepareFatePool(baseOptions?.talentPool);
  const punishmentPool = prepareFatePool(baseOptions?.punishmentPool);
  const maps = {
    source: new Map(source.map((entry) => [entry.name, entry])),
    method: new Map(method.map((entry) => [entry.name, entry])),
    dao: new Map(dao.map((entry) => [entry.name, entry])),
  };

  (packs || []).forEach((pack) => {
    (pack.resources || []).forEach((resource) => {
      const parent = maps[resource.parent.kind]?.get(resource.parent.name);
      if (!parent) return;
      const card = asPackCard(pack, resource);
      if (resource.parent.kind === 'source') {
        if (resource.type === 'source-ability') parent.abilityOptions.push(card);
        else if (resource.type === 'source-effect') parent.effectOptions.push(card);
        else if (resource.type === 'skill' && resource.acquisition === 'initial') parent.initialSkillOptions.push(card);
        else if (resource.type === 'skill' && resource.realm === 'qi-middle') parent.qiUpgradeSkills.push(card);
        else if (resource.type === 'skill') parent.foundationUpgradeSkills.push(card);
        else if (resource.type === 'art' && resource.acquisition === 'initial') parent.initialArtOptions.push(card);
        else if (resource.type === 'art') parent.foundationUpgradeArts.push(card);
      } else if (resource.parent.kind === 'method') {
        if (resource.type === 'attack-buff' && resource.realm === 'qi-early') parent.initialAttackBuffOptions.push(card);
        else if (resource.type === 'attack-buff') parent.foundationAttackBuffOptions.push(card);
        else if (resource.type === 'technique' && resource.realm === 'qi-early') parent.initialTechniqueOptions.push(card);
        else if (resource.type === 'technique') parent.foundationTechniqueOptions.push(card);
        else if (resource.type === 'insight' && resource.acquisition === 'initial') parent.packInitialInsights.push(card);
        else if (resource.type === 'insight' && resource.realm === 'qi-late') parent.packQiInsights.push(card);
        else if (resource.type === 'insight' && resource.realm === 'foundation-early') parent.packFoundationEarlyInsights.push(card);
        else if (resource.type === 'insight') parent.packFoundationLateInsights.push(card);
        else if (resource.type === 'origin-insight' && resource.realm === 'foundation-early') parent.packQiOriginInsights.push(card);
        else if (resource.type === 'origin-insight') parent.packFoundationOriginInsights.push(card);
      } else if (resource.type === 'dao-effect') {
        parent.effectOptions.push(card);
      } else if (resource.realm === 'qi-late') {
        parent.qiMethods.push(card);
      } else {
        parent.foundationMethods.push(card);
      }
    });
    (pack.talents || []).forEach((entry) => {
      const pool = entry.kind === 'talent' ? talentPool : punishmentPool;
      if (pool[entry.tier]) pool[entry.tier].push(asPackFateEntry(pack, entry));
    });
  });
  return { source, method, dao, talentPool, punishmentPool };
}
