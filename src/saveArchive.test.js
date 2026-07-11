import { describe, expect, it } from 'vitest';
import {
  SAVE_SLOT_LIMIT,
  createSaveSlot,
  ensureInitialSaveSlot,
  deleteSaveSlot,
  renameSaveSlot,
  saveSlot,
  startNewSaveSlot,
  updateSaveSlotSnapshot,
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

  it('creates and activates the first default slot when no archive exists', () => {
    const result = ensureInitialSaveSlot([], {
      activeSlotId: null,
      snapshot,
      now: () => new Date('2026-07-09T12:00:00.000Z'),
      id: () => 'slot-1',
    });

    expect(result.activeSlotId).toBe('slot-1');
    expect(result.slots).toEqual([
      {
        id: 'slot-1',
        name: '存档 1',
        createdAt: '2026-07-09T12:00:00.000Z',
        updatedAt: '2026-07-09T12:00:00.000Z',
        snapshot,
      },
    ]);
  });

  it('starts a new active slot with an empty snapshot while preserving the previous slot', () => {
    const original = createSaveSlot({
      snapshot: { selections: { realm: 0, origin: 1 }, texts: { name: '旧角色' } },
      name: '存档 1',
      now: () => new Date('2026-07-09T12:00:00.000Z'),
      id: () => 'slot-1',
    });
    const currentSnapshot = { selections: { realm: 0, origin: 2 }, texts: { name: '已编辑角色' } };
    const emptySnapshot = { selections: { realm: 0, origin: null }, texts: { name: '' } };

    const result = startNewSaveSlot([original], {
      activeSlotId: 'slot-1',
      currentSnapshot,
      emptySnapshot,
      now: () => new Date('2026-07-09T13:00:00.000Z'),
      id: () => 'slot-2',
    });

    expect(result.activeSlotId).toBe('slot-2');
    expect(result.slots).toHaveLength(2);
    expect(result.slots[0]).toMatchObject({
      id: 'slot-2',
      name: '存档 2',
      snapshot: emptySnapshot,
    });
    expect(result.slots[1]).toMatchObject({
      id: 'slot-1',
      name: '存档 1',
      snapshot: currentSnapshot,
    });
  });

  it('updates only an existing active slot snapshot before switching away', () => {
    const slots = [
      createSaveSlot({ snapshot: { texts: { name: '旧一' } }, name: '一', id: () => 'a' }),
      createSaveSlot({ snapshot: { texts: { name: '旧二' } }, name: '二', id: () => 'b' }),
    ];
    const currentSnapshot = { texts: { name: '新一' } };

    const next = updateSaveSlotSnapshot(slots, {
      slotId: 'a',
      snapshot: currentSnapshot,
      now: () => new Date('2026-07-09T14:00:00.000Z'),
    });

    expect(next[0]).toMatchObject({
      id: 'a',
      snapshot: currentSnapshot,
      updatedAt: '2026-07-09T14:00:00.000Z',
    });
    expect(next[1]).toBe(slots[1]);
  });
});
