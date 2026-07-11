function getRealmInsightPrefix(realm) {
  if (!realm?.name) return '练气';
  if (realm.name.startsWith('筑基') || realm.name.startsWith('金丹')) return '筑基';
  return '练气';
}

function getUnlockedMethodAttackBuffCount(realm) {
  if (!realm?.name) return 1;
  if (realm.name.startsWith('筑基') || realm.name.startsWith('金丹')) return 2;
  return 1;
}

function getCardsByNamePrefix(cards = [], prefix) {
  return cards.filter((card) => card?.name?.startsWith(prefix));
}

function withDisplayName(card) {
  return card ? { ...card, name: formatCardDisplayName(card) } : card;
}

export function formatCardDisplayName(nameOrCard) {
  const name = typeof nameOrCard === 'string' ? nameOrCard : nameOrCard?.name || '';
  return name.replace(/^(练气本源·|筑基本源·|练气·|筑基·)/, '');
}

export function getMethodQiInsights(method) {
  return getCardsByNamePrefix(method?.insights || [], '练气·');
}

export function getMethodFoundationInsights(method) {
  return getCardsByNamePrefix(method?.insights || [], '筑基·');
}

export function getMethodInitialInsights(method) {
  return getMethodQiInsights(method);
}

export function getMethodQiUpgradeInsights(method, selectedInitialInsights = []) {
  const selectedNames = new Set((selectedInitialInsights || []).map((card) => card?.name).filter(Boolean));
  return getMethodQiInsights(method).filter((card) => !selectedNames.has(card.name));
}

export function getMethodQiOriginInsights(method) {
  return getCardsByNamePrefix(method?.originInsights || [], '练气本源·');
}

export function getMethodFoundationOriginInsights(method) {
  return getCardsByNamePrefix(method?.originInsights || [], '筑基本源·');
}

export function getMethodResourceSections(method) {
  if (!method) return [];
  return [
    { title: '入门攻击增益', items: method.attackBuffs?.[0] ? [method.attackBuffs[0]] : [] },
    { title: '练气感悟', items: getMethodQiInsights(method).map(withDisplayName) },
  ].filter((section) => section.items.length > 0);
}

export function getFirstRealmInsight(method, realm) {
  if (!method?.insights?.length) return null;
  const prefix = getRealmInsightPrefix(realm);
  return method.insights.find((card) => card.name.startsWith(prefix)) || method.insights[0];
}

export function formatInsightCard(card) {
  return card ? `${formatCardDisplayName(card)}：${card.text}` : '';
}

export function getUnlockedMethodAttackBuffs(method, realm, upgradeCards = {}) {
  if (!method?.attackBuffs?.length) return [];
  const count = getUnlockedMethodAttackBuffCount(realm);
  const buffs = method.attackBuffs.slice(0, count);
  const extraQiBuff = upgradeCards.extraMethods?.[0]?.attackBuffs?.[0];
  if (count >= 2 && extraQiBuff) {
    buffs[1] = extraQiBuff;
  }
  return buffs;
}
