const methodInsightTargets = new Set(['initialInsights', 'insights', 'originInsights']);

export function appendUpgradeChoices(existingChoices = [], { realmIndex, cardsBySection = [] }) {
  return [
    ...existingChoices,
    ...cardsBySection.flatMap((section) => (
      (section.cards || []).map((card) => ({
        realmIndex,
        target: section.target,
        sourceKind: section.sourceKind,
        promptKey: section.key,
        card,
      }))
    )),
  ];
}

export function removeMethodInsightChoices(existingChoices = []) {
  return existingChoices.filter((choice) => !(choice?.sourceKind === 'method' && methodInsightTargets.has(choice?.target)));
}
