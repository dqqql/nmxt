import { describe, expect, it } from 'vitest';
import {
  createCardKey,
  createManualCard,
  deleteLibraryCard,
  exchangeCards,
  getCardLibraryView,
  moveCard,
  normalizeManualCards,
} from './cardLibraryState';

const cards = (count) => Array.from({ length: count }, (_, index) => ({
  name: `卡片 ${index + 1}`,
  text: `效果 ${index + 1}`,
}));

describe('card library state', () => {
  it('fills visible slots first and puts overflow into the matching library', () => {
    const view = getCardLibraryView('arts', cards(4), {});
    expect(view.slots.map((card) => card.name)).toEqual(['卡片 1', '卡片 2']);
    expect(view.library.map((card) => card.name)).toEqual(['卡片 3', '卡片 4']);
    expect(view.slotFull).toBe(true);
    expect(view.libraryFull).toBe(true);
  });

  it('moves a card when the destination has capacity', () => {
    const initial = getCardLibraryView('spells', cards(2), {});
    const state = moveCard({}, initial.slots[0].key, 'library');
    const view = getCardLibraryView('spells', cards(2), state);
    expect(view.slots.map((card) => card.name)).toEqual(['卡片 2']);
    expect(view.library.map((card) => card.name)).toEqual(['卡片 1']);
  });

  it('exchanges a full slot and library without changing either count', () => {
    let state = {};
    const initial = getCardLibraryView('arts', cards(4), state);
    state = exchangeCards(state, initial.slots[0].key, initial.library[0].key);
    const view = getCardLibraryView('arts', cards(4), state);
    expect(view.slots).toHaveLength(2);
    expect(view.library).toHaveLength(2);
    expect(view.slots.map((card) => card.name)).toContain('卡片 3');
    expect(view.library.map((card) => card.name)).toContain('卡片 1');
  });

  it('deleting a library card permanently frees capacity', () => {
    const initial = getCardLibraryView('arts', cards(3), {});
    const state = deleteLibraryCard({}, initial.library[0].key);
    const view = getCardLibraryView('arts', cards(3), state);
    expect(view.library).toHaveLength(0);
    expect(view.libraryFull).toBe(false);
  });

  it('keeps manual cards independent even when their title and content match', () => {
    const first = createManualCard({ name: '自定义', text: '效果', id: () => 'one' });
    const second = createManualCard({ name: '自定义', text: '效果', id: () => 'two' });
    expect(createCardKey('spells', first)).not.toBe(createCardKey('spells', second));
    expect(normalizeManualCards({ spells: [first, second] }).spells).toHaveLength(2);
  });
});
