export const CARD_LIBRARY_CONFIG = {
  spells: { title: '神通', libraryTitle: '神通库', slotCapacity: 4, libraryCapacity: 4 },
  insights: { title: '感悟', libraryTitle: '感悟库', slotCapacity: 4, libraryCapacity: 4 },
  arts: { title: '秘法', libraryTitle: '秘法库', slotCapacity: 2, libraryCapacity: 2 },
  originInsights: { title: '本源感悟', libraryTitle: '本源感悟库', slotCapacity: 2, libraryCapacity: 2 },
  treasures: { title: '灵宝', libraryTitle: '灵宝库', slotCapacity: 3, libraryCapacity: 4 },
};

export function createCardKey(category, card) {
  if (card?.manualId) return `${category}:manual:${card.manualId}`;
  return `${category}:${card?.name || ''}\u001f${card?.text || ''}`;
}

export function normalizeManualCards(value) {
  return Object.fromEntries(Object.keys(CARD_LIBRARY_CONFIG).map((category) => [
    category,
    Array.isArray(value?.[category])
      ? value[category].filter((card) => card?.manualId && card?.name && typeof card?.text === 'string')
      : [],
  ]));
}

export function createManualCard({ name, text, id = () => globalThis.crypto?.randomUUID?.() || `manual-${Date.now()}` } = {}) {
  return {
    manualId: id(),
    name: String(name || '').trim(),
    text: String(text || '').trim(),
    manual: true,
  };
}

export function normalizeCardLibraryState(value) {
  return {
    locations: value?.locations && typeof value.locations === 'object' ? value.locations : {},
    deleted: Array.isArray(value?.deleted) ? value.deleted : [],
  };
}

export function getCardLibraryView(category, cards = [], state = {}) {
  const config = CARD_LIBRARY_CONFIG[category];
  if (!config) return { slots: [], library: [], slotFull: false, libraryFull: false };

  const normalized = normalizeCardLibraryState(state);
  const deleted = new Set(normalized.deleted);
  const entries = cards
    .map((card) => ({ ...card, key: createCardKey(category, card) }))
    .filter((card) => !deleted.has(card.key));
  const explicitSlots = entries.filter((card) => normalized.locations[card.key] === 'slot');
  const defaultSlots = entries.filter((card) => !normalized.locations[card.key]);
  const explicitLibrary = entries.filter((card) => normalized.locations[card.key] === 'library');
  const slotCandidates = [...explicitSlots, ...defaultSlots];
  const slots = slotCandidates.slice(0, config.slotCapacity);
  const overflow = slotCandidates.slice(config.slotCapacity);
  const library = [...explicitLibrary, ...overflow]
    .filter((card, index, list) => list.findIndex((item) => item.key === card.key) === index)
    .slice(0, config.libraryCapacity);

  return {
    slots,
    library,
    slotFull: slots.length >= config.slotCapacity,
    libraryFull: library.length >= config.libraryCapacity,
  };
}

export function moveCard(state, key, location) {
  const normalized = normalizeCardLibraryState(state);
  return {
    ...normalized,
    locations: { ...normalized.locations, [key]: location },
  };
}

export function exchangeCards(state, slotKey, libraryKey) {
  const normalized = normalizeCardLibraryState(state);
  return {
    ...normalized,
    locations: {
      ...normalized.locations,
      [slotKey]: 'library',
      [libraryKey]: 'slot',
    },
  };
}

export function deleteLibraryCard(state, key) {
  const normalized = normalizeCardLibraryState(state);
  const locations = { ...normalized.locations };
  delete locations[key];
  return {
    locations,
    deleted: [...new Set([...normalized.deleted, key])],
  };
}
