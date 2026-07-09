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

export function getFirstRealmInsight(method, realm) {
  if (!method?.insights?.length) return null;
  const prefix = getRealmInsightPrefix(realm);
  return method.insights.find((card) => card.name.startsWith(prefix)) || method.insights[0];
}

export function formatInsightCard(card) {
  return card ? `${card.name}：${card.text}` : '';
}

export function getUnlockedMethodAttackBuffs(method, realm) {
  if (!method?.attackBuffs?.length) return [];
  return method.attackBuffs.slice(0, getUnlockedMethodAttackBuffCount(realm));
}
