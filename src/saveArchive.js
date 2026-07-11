export const SAVE_SLOT_LIMIT = 10;

function defaultNow() {
  return new Date();
}

function defaultId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createSaveSlot({
  snapshot,
  name = '未命名存档',
  now = defaultNow,
  id = defaultId,
} = {}) {
  const timestamp = now().toISOString();
  return {
    id: id(),
    name: String(name || '未命名存档').trim() || '未命名存档',
    createdAt: timestamp,
    updatedAt: timestamp,
    snapshot,
  };
}

export function saveSlot(slots = [], {
  activeSlotId = null,
  snapshot,
  name,
  now = defaultNow,
  id = defaultId,
} = {}) {
  if (activeSlotId && slots.some((slot) => slot.id === activeSlotId)) {
    const updatedAt = now().toISOString();
    return slots.map((slot) => (
      slot.id === activeSlotId
        ? { ...slot, updatedAt, snapshot }
        : slot
    ));
  }

  if (slots.length >= SAVE_SLOT_LIMIT) {
    throw new Error('存档上限为 10 个');
  }

  const nextName = name || `存档 ${slots.length + 1}`;
  return [
    createSaveSlot({ snapshot, name: nextName, now, id }),
    ...slots,
  ];
}

export function ensureInitialSaveSlot(slots = [], {
  activeSlotId = null,
  snapshot,
  now = defaultNow,
  id = defaultId,
} = {}) {
  const normalizedSlots = normalizeSaveSlots(slots);
  if (normalizedSlots.length > 0) {
    const nextActiveSlotId = normalizedSlots.some((slot) => slot.id === activeSlotId)
      ? activeSlotId
      : normalizedSlots[0].id;
    return { slots: normalizedSlots, activeSlotId: nextActiveSlotId };
  }

  const firstSlot = createSaveSlot({
    snapshot,
    name: '存档 1',
    now,
    id,
  });
  return { slots: [firstSlot], activeSlotId: firstSlot.id };
}

export function updateSaveSlotSnapshot(slots = [], {
  slotId = null,
  snapshot,
  now = defaultNow,
} = {}) {
  if (!slotId || !slots.some((slot) => slot.id === slotId)) return slots;
  const updatedAt = now().toISOString();
  return slots.map((slot) => (
    slot.id === slotId
      ? { ...slot, updatedAt, snapshot }
      : slot
  ));
}

export function startNewSaveSlot(slots = [], {
  activeSlotId = null,
  currentSnapshot,
  emptySnapshot,
  now = defaultNow,
  id = defaultId,
} = {}) {
  if (slots.length >= SAVE_SLOT_LIMIT) {
    throw new Error('存档上限为 10 个');
  }

  const preservedSlots = updateSaveSlotSnapshot(slots, {
    slotId: activeSlotId,
    snapshot: currentSnapshot,
    now,
  });
  const nextSlot = createSaveSlot({
    snapshot: emptySnapshot,
    name: `存档 ${preservedSlots.length + 1}`,
    now,
    id,
  });

  return {
    slots: [nextSlot, ...preservedSlots],
    activeSlotId: nextSlot.id,
  };
}

export function renameSaveSlot(slots = [], slotId, name) {
  const nextName = String(name || '').trim();
  if (!nextName) return slots;
  return slots.map((slot) => (
    slot.id === slotId ? { ...slot, name: nextName } : slot
  ));
}

export function deleteSaveSlot(slots = [], slotId) {
  return slots.filter((slot) => slot.id !== slotId);
}

export function normalizeSaveSlots(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((slot) => slot?.id && slot?.snapshot)
    .slice(0, SAVE_SLOT_LIMIT);
}
