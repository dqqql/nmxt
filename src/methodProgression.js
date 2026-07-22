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

export function getMethodFoundationUpgradeInsights(method, selectedInsights = []) {
  const selectedNames = new Set((selectedInsights || []).map((card) => card?.name).filter(Boolean));
  return getMethodFoundationInsights(method).filter((card) => !selectedNames.has(card.name));
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

export function getMethodTechniqueProgression(method) {
  if (!method?.techniques) return [];
  return [
    method.techniques.qi ? { stage: 'qi', ...method.techniques.qi } : null,
    method.techniques.foundation ? { stage: 'foundation', ...method.techniques.foundation } : null,
  ].filter(Boolean);
}

function getMethodTechniqueResourceItems(method) {
  return getMethodTechniqueProgression(method).map((technique) => {
    const stageLabel = technique.stage === 'foundation' ? '筑基期升级' : '练气期';
    const grants = technique.grants?.length ? `同时：${technique.grants.join('、')}。` : '';
    const storage = technique.storageCapacityBonus
      ? `储物格上限 +${technique.storageCapacityBonus}。`
      : '';
    return {
      name: `${stageLabel} · ${technique.name}`,
      text: [technique.text, grants, storage].filter(Boolean).join(' '),
    };
  });
}

export function getMethodResourceSections(method) {
  if (!method) return [];
  return [
    { title: '入门攻击增益', items: method.attackBuffs?.[0] ? [method.attackBuffs[0]] : [] },
    { title: '技艺', items: getMethodTechniqueResourceItems(method) },
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

export function getUnlockedMethodTechniques(method, realm, upgradeCards = {}) {
  const primaryTechniques = getMethodTechniqueProgression(method);
  if (!primaryTechniques.length) return [];

  const isFoundation = realm?.name?.startsWith('筑基') || realm?.name?.startsWith('金丹');
  if (!isFoundation) return primaryTechniques.slice(0, 1);

  const techniques = primaryTechniques.slice(0, 2);
  const extraQiTechnique = getMethodTechniqueProgression(upgradeCards.extraMethods?.[0])
    .find((technique) => technique.stage === 'qi');
  if (extraQiTechnique) techniques[1] = extraQiTechnique;
  return techniques;
}
