import {
  getMethodFoundationInsights,
  getMethodFoundationOriginInsights,
  getMethodInitialInsights,
  getMethodQiInsights,
  getMethodQiOriginInsights,
  getMethodQiUpgradeInsights,
} from './methodProgression';

export {
  getMethodFoundationInsights,
  getMethodFoundationOriginInsights,
  getMethodInitialInsights,
  getMethodQiInsights,
  getMethodQiOriginInsights,
  getMethodQiUpgradeInsights,
} from './methodProgression';

const qiTreasurePlaceholders = [
  {
    name: '玄龟甲',
    text: '灵器。一片巴掌大小、质地温润如玉的黑色龟甲。当你受到严重伤害时减少 1 血量格的扣除，骰 1D6 如果为 3 及以上，则还可继续使用；破损后本次聚会结束前无法再次使用。',
  },
  {
    name: '引灵佩',
    text: '灵器。一枚青白玉佩，中心有一点天然灵光缓缓流转。内部存有 1 灵气格供使用，休息时补充。',
  },
  {
    name: '御风印',
    text: '灵器。一张淡青色印章，以朱砂绘制风纹。一次聚会一次，进行一次困难检定，成功则可以立刻从此场景离开。',
  },
  {
    name: '匿踪纱',
    text: '灵器。一块轻薄如烟、近乎透明的纱巾。一次聚会一次，扣除 1 灵气格，短暂在本场景隐藏自身踪迹；快速移动或攻击时隐匿失效，对方通过神识探查你的检定获得劣势。',
  },
];

const foundationTreasurePlaceholders = [
  {
    name: '分光剑',
    text: '灵器。一柄剑身细长、寒光内敛的长剑。【气尽】无需动作地使用一次普通攻击。',
  },
  {
    name: '同心结',
    text: '灵器。一对特殊红线绳结。你选定一个自愿单位，距离不超过一个旅行日时可互相感应情绪与位置；任意一人受到伤害时，一次双方会面一次，对方可以为你分担一次伤害。',
  },
  {
    name: '寻宝鼠',
    text: '灵宠。一只通体银灰色、对灵气和宝光异常敏感的鼠类灵兽。每次到达新场景时骰 2D6，大于等于 10 则找到一些线索或有用物品。',
  },
  {
    name: '地心灵乳',
    text: '灵材。盛放在小玉瓶中的乳白色液体。每次休息两次，你可以使用轻巧动作饮用灵乳恢复 2 血量格；同一场景中再次饮用效果降低为 1 血量格。',
  },
];

const emptyUpgradeCards = {
  skills: [],
  arts: [],
  initialInsights: [],
  insights: [],
  originInsights: [],
  daoMethods: [],
  treasures: [],
  extraMethods: [],
};

export function getTreasureOptions(stage = 'qi') {
  return stage === 'foundation' ? foundationTreasurePlaceholders : qiTreasurePlaceholders;
}

function cardSections(sections) {
  return sections.map((section) => ({
    ...section,
    options: section.options || [],
  }));
}

function numberFromAttribute(value) {
  const match = String(value ?? '').match(/[+-]?\d+/);
  return match ? Number(match[0]) : 0;
}

export function getDefaultRealmIndex(realms = []) {
  if (!realms.length) return null;
  const index = realms.findIndex((realm) => realm.name === '练气前期');
  return index >= 0 ? index : 0;
}

export function getNextRealmIndex(realms = [], currentIndex) {
  if (!realms.length) return null;
  if (currentIndex == null || currentIndex < 0) return getDefaultRealmIndex(realms);
  return Math.min(currentIndex + 1, realms.length - 1);
}

export function getReachableRealmOptions(realms = [], maxReachedIndex = 0) {
  return realms.slice(0, Math.max(0, maxReachedIndex) + 1);
}

export function getMaxReachedRealmAfterSelection(maxReachedIndex, selectedRealmIndex) {
  return Math.min(maxReachedIndex, selectedRealmIndex);
}

export function getInitialSourceSkills(source) {
  if (source?.initialSkill) return [source.initialSkill];
  return source?.skills?.[0] ? [source.skills[0]] : [];
}

export function getInitialSourceArts(source) {
  if (source?.initialArt) return [source.initialArt];
  return source?.arts?.[0] ? [source.arts[0]] : [];
}

export function getSourceQiUpgradeSkills(source) {
  if (source?.qiUpgradeSkills) return source.qiUpgradeSkills;
  return source?.skills?.slice(1, 3) || [];
}

export function getSourceFoundationUpgradeSkills(source) {
  if (source?.foundationUpgradeSkills) return source.foundationUpgradeSkills;
  return source?.skills?.slice(3) || [];
}

export function getSourceFoundationUpgradeArts(source) {
  if (source?.foundationUpgradeArts) return source.foundationUpgradeArts;
  return source?.arts?.slice(1) || [];
}

export function pruneUpgradeChoicesForRealm(choices = [], realmIndex) {
  return choices.filter((choice) => choice.realmIndex <= realmIndex);
}

export function aggregateUpgradeChoices(choices = [], realmIndex = Number.POSITIVE_INFINITY) {
  const next = Object.fromEntries(Object.entries(emptyUpgradeCards).map(([key, value]) => [key, [...value]]));
  const seen = new Set();
  choices
    .filter((choice) => choice.realmIndex <= realmIndex)
    .forEach((choice) => {
      if (!choice?.target || !choice.card) return;
      const key = `${choice.target}:${choice.card.name}`;
      if (seen.has(key)) return;
      seen.add(key);
      next[choice.target] = [...(next[choice.target] || []), choice.card];
    });
  return next;
}

export function applyAttributeIncrease(attributes, titles) {
  return Object.fromEntries(Object.entries(attributes || {}).map(([title, value]) => [
    title,
    titles.includes(title) ? String(numberFromAttribute(value) + 1) : value,
  ]));
}

export function getNonCoreAttributeChoices(attributes, coreAttribute) {
  return Object.entries(attributes || {})
    .map(([title, value], index) => ({
      title,
      value,
      index,
      numericValue: numberFromAttribute(value),
    }))
    .filter((choice) => choice.title !== coreAttribute)
    .sort((left, right) => {
      if (left.numericValue !== right.numericValue) return left.numericValue - right.numericValue;
      return left.index - right.index;
    });
}

export function createUpgradeStep({
  fromRealmName,
  nextRealmName,
  source,
  method,
  dao,
  upgradeCards = {},
}) {
  if (nextRealmName === '练气中期') {
    return {
      id: 'qi-middle',
      toast: '境界提升至练气中期，请选择 1 个自选神通和 1 个练气凡阶灵宝。',
      autoEffects: [],
      selectionPrompt: {
        title: '练气中期升级选项',
        sections: cardSections([
          {
            key: 'source-skill',
            title: '自选神通',
            hint: source ? `来自 ${source.name}` : '请先选择道源',
            limit: 1,
            target: 'skills',
            sourceKind: 'source',
            options: getSourceQiUpgradeSkills(source),
          },
          {
            key: 'treasure',
            title: '练气凡阶灵宝',
            hint: '临时占位池，稍后可替换为正式灵宝数据',
            limit: 1,
            target: 'treasures',
            sourceKind: 'treasure',
            options: getTreasureOptions('qi'),
          },
        ]),
      },
    };
  }

  if (nextRealmName === '练气后期') {
    return {
      id: 'qi-late',
      toast: '境界提升至练气后期，请选择 1 张练气感悟卡和 1 个练气功法。',
      autoEffects: [],
      selectionPrompt: {
        title: '练气后期升级选项',
        sections: cardSections([
          {
            key: 'method-insight',
            title: '练气感悟卡',
            hint: method ? `来自 ${method.name}` : '请先选择法门',
            limit: 1,
            target: 'insights',
            sourceKind: 'method',
            options: getMethodQiUpgradeInsights(method, upgradeCards.initialInsights),
          },
          {
            key: 'dao-method',
            title: '练气功法',
            hint: dao ? `来自 ${dao.name}` : '请先选择大道',
            limit: 1,
            target: 'daoMethods',
            sourceKind: 'dao',
            options: dao?.qiMethods || [],
          },
        ]),
      },
    };
  }

  if (fromRealmName === '练气后期' && nextRealmName === '筑基前期') {
    return {
      id: 'foundation-early',
      toast: '突破成功：境界乘值 +1，真元上限 +1，核心属性 +1，所有阈值 +3，灵气格 +2。',
      autoEffects: ['realm-breakthrough'],
      selectionPrompt: {
        title: '筑基前期突破选项',
        sections: cardSections([
          {
            key: 'origin-insight',
            title: '本源感悟卡',
            hint: method ? `来自 ${method.name}` : '请先选择法门',
            limit: 1,
            target: 'originInsights',
            sourceKind: 'method',
            options: getMethodFoundationOriginInsights(method),
          },
        ]),
      },
    };
  }

  if (nextRealmName === '筑基中期') {
    return {
      id: 'foundation-middle',
      toast: '境界提升至筑基中期，请选择 1 个自选神通和 1 个秘法。',
      autoEffects: [],
      selectionPrompt: {
        title: '筑基中期升级选项',
        sections: cardSections([
          {
            key: 'source-skill',
            title: '自选神通',
            hint: source ? `来自 ${source.name}` : '请先选择道源',
            limit: 1,
            target: 'skills',
            sourceKind: 'source',
            options: getSourceFoundationUpgradeSkills(source),
          },
          {
            key: 'source-art',
            title: '秘法',
            hint: source ? `来自 ${source.name}` : '请先选择道源',
            limit: 1,
            target: 'arts',
            sourceKind: 'source',
            options: getSourceFoundationUpgradeArts(source),
          },
        ]),
      },
    };
  }

  if (nextRealmName === '筑基后期') {
    return {
      id: 'foundation-late',
      toast: '境界提升至筑基后期，请选择 1 张筑基感悟卡和 1 个筑基功法。',
      autoEffects: [],
      selectionPrompt: {
        title: '筑基后期升级选项',
        sections: cardSections([
          {
            key: 'method-insight',
            title: '筑基感悟卡',
            hint: method ? `来自 ${method.name}` : '请先选择法门',
            limit: 1,
            target: 'insights',
            sourceKind: 'method',
            options: getMethodFoundationInsights(method),
          },
          {
            key: 'dao-method',
            title: '筑基功法',
            hint: dao ? `来自 ${dao.name}` : '请先选择大道',
            limit: 1,
            target: 'daoMethods',
            sourceKind: 'dao',
            options: dao?.foundationMethods || [],
          },
        ]),
      },
    };
  }

  if (fromRealmName === '筑基后期' && nextRealmName?.startsWith('金丹')) {
    return {
      id: 'golden-core',
      toast: '筑基渡劫成功：境界乘值 +1，所有阈值 +3，灵气格 +2。',
      autoEffects: ['realm-breakthrough'],
      selectionPrompt: {
        title: '金丹突破选项',
        sections: cardSections([
          {
            key: 'origin-insight',
            title: '本源感悟卡',
            hint: method ? `来自 ${method.name}` : '请先选择法门',
            limit: 1,
            target: 'originInsights',
            sourceKind: 'method',
            options: getMethodFoundationOriginInsights(method),
          },
        ]),
      },
    };
  }

  return {
    id: 'realm-upgrade',
    toast: nextRealmName ? `境界提升至${nextRealmName}。` : '已是当前版本最高境界。',
    autoEffects: [],
    selectionPrompt: null,
  };
}
