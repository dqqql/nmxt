const qiTreasurePlaceholders = [
  {
    name: '练气凡阶灵宝（占位）',
    text: '占位数据：选择后先填入灵宝栏，完整灵宝库到位后会替换为正式条目。',
  },
  {
    name: '护身玉佩（占位）',
    text: '占位数据：一次休息一次，受到伤害时可让伤害下降一级。',
  },
  {
    name: '聚灵珠（占位）',
    text: '占位数据：一次休息一次，恢复 1 灵气格。',
  },
];

const foundationTreasurePlaceholders = [
  {
    name: '筑基灵宝（占位）',
    text: '占位数据：选择后先填入灵宝栏，完整灵宝库到位后会替换为正式条目。',
  },
  {
    name: '御风环（占位）',
    text: '占位数据：一次场景一次，移动距离提升一个等级。',
  },
];

export function getTreasureOptions(stage = 'qi') {
  return stage === 'foundation' ? foundationTreasurePlaceholders : qiTreasurePlaceholders;
}

function startsWithRealmPrefix(card, prefix) {
  return card?.name?.startsWith(prefix);
}

function cardsForRealm(cards = [], prefix) {
  const filtered = cards.filter((card) => startsWithRealmPrefix(card, prefix));
  return filtered.length ? filtered : cards;
}

function cardSections(sections) {
  const next = sections.filter((section) => section.options?.length);
  return next.length ? next : null;
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
            options: source?.skills || [],
          },
          {
            key: 'treasure',
            title: '练气凡阶灵宝',
            hint: '临时占位池，稍后可替换为正式灵宝数据',
            limit: 1,
            target: 'treasures',
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
            options: cardsForRealm(method?.insights, '练气'),
          },
          {
            key: 'dao-method',
            title: '练气功法',
            hint: dao ? `来自 ${dao.name}` : '请先选择大道',
            limit: 1,
            target: 'daoMethods',
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
            options: cardsForRealm(method?.originInsights, '筑基'),
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
            options: source?.skills || [],
          },
          {
            key: 'source-art',
            title: '秘法',
            hint: source ? `来自 ${source.name}` : '请先选择道源',
            limit: 1,
            target: 'arts',
            options: source?.arts || [],
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
            options: cardsForRealm(method?.insights, '筑基'),
          },
          {
            key: 'dao-method',
            title: '筑基功法',
            hint: dao ? `来自 ${dao.name}` : '请先选择大道',
            limit: 1,
            target: 'daoMethods',
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
            options: cardsForRealm(method?.originInsights, '筑基'),
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
