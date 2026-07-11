function uniqueCards(cards = []) {
  const seen = new Set();
  return cards.filter((card) => {
    const key = card?.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildInitialMethodInsightPrompt(method, realmIndex) {
  const options = method?.qiInitialInsights || [];
  if (!options.length) return null;
  return {
    title: '初始感悟选择',
    realmIndex,
    sections: [
      {
        key: 'initial-method-insight',
        title: '初始感悟',
        hint: method ? `来自 ${method.name}` : '请先选择法门',
        limit: 1,
        target: 'initialInsights',
        sourceKind: 'method',
        options,
      },
    ],
  };
}

export function getDisplayedInsightCards(upgradeCards = {}) {
  return uniqueCards([
    ...(upgradeCards.initialInsights || []),
    ...(upgradeCards.insights || []),
  ]);
}
