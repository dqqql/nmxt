import { describe, expect, it } from 'vitest';
import {
  SAVE_SLOT_LIMIT,
  createSaveSlot,
  deleteSaveSlot,
  renameSaveSlot,
  saveSlot,
} from './saveArchive';

const snapshot = { selections: { realm: 0 }, texts: { name: '青衫客' } };

describe('save archive helpers', () => {
  it('creates a named save slot with timestamp and snapshot', () => {
    const slot = createSaveSlot({
      snapshot,
      name: '第一幕',
      now: () => new Date('2026-07-09T12:00:00.000Z'),
      id: () => 'slot-a',
    });

    expect(slot).toEqual({
      id: 'slot-a',
      name: '第一幕',
      createdAt: '2026-07-09T12:00:00.000Z',
      updatedAt: '2026-07-09T12:00:00.000Z',
      snapshot,
    });
  });

  it('adds a new save until the ten slot limit', () => {
    const slots = Array.from({ length: SAVE_SLOT_LIMIT }, (_, index) => createSaveSlot({
      snapshot,
      name: `存档 ${index + 1}`,
      now: () => new Date(`2026-07-09T12:00:0${index % 10}.000Z`),
      id: () => `slot-${index}`,
    }));

    expect(() => saveSlot(slots, { snapshot, id: () => 'slot-overflow' })).toThrow('存档上限为 10 个');
  });

  it('updates an existing active slot instead of creating a new one', () => {
    const original = createSaveSlot({
      snapshot,
      name: '旧存档',
      now: () => new Date('2026-07-09T12:00:00.000Z'),
      id: () => 'slot-a',
    });
    const nextSnapshot = { selections: { realm: 2 }, texts: { name: '归云' } };

    const next = saveSlot([original], {
      activeSlotId: 'slot-a',
      snapshot: nextSnapshot,
      now: () => new Date('2026-07-09T13:00:00.000Z'),
    });

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      id: 'slot-a',
      name: '旧存档',
      createdAt: '2026-07-09T12:00:00.000Z',
      updatedAt: '2026-07-09T13:00:00.000Z',
      snapshot: nextSnapshot,
    });
  });

  it('renames and deletes slots without mutating others', () => {
    const slots = [
      createSaveSlot({ snapshot, name: '一', id: () => 'a' }),
      createSaveSlot({ snapshot, name: '二', id: () => 'b' }),
    ];

    expect(renameSaveSlot(slots, 'b', '第二幕').map((slot) => slot.name)).toEqual(['一', '第二幕']);
    expect(deleteSaveSlot(slots, 'a').map((slot) => slot.id)).toEqual(['b']);
  });
});
