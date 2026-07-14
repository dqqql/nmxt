export function unlockNextGhostMark(store = {}, groupId, count) {
  const next = { ...store };
  for (let index = 0; index < count; index += 1) {
    const key = `${groupId}:${index}`;
    if (!Object.prototype.hasOwnProperty.call(next, key) || next[key]?.ghost) {
      next[key] = { filled: false, ghost: false };
      break;
    }
  }
  return next;
}

export function lockPreviousUnlockedGhostMark(store = {}, groupId, count) {
  const next = { ...store };
  for (let index = count - 1; index >= 0; index -= 1) {
    const key = `${groupId}:${index}`;
    if (Object.prototype.hasOwnProperty.call(next, key) && !next[key]?.ghost) {
      next[key] = { filled: false, ghost: true };
      break;
    }
  }
  return next;
}

export function fillNextSolidMark(store = {}, groupId, count) {
  const next = { ...store };
  for (let index = 0; index < count; index += 1) {
    const key = `${groupId}:${index}`;
    if (!next[key]?.filled) {
      next[key] = { filled: true, ghost: false };
      break;
    }
  }
  return next;
}

export const QI_CAPACITY_GHOST_COUNT = 7;

export function applyQiCapacityDelta(store = {}, amount = 0) {
  let next = { ...store };
  const operation = amount >= 0 ? unlockNextGhostMark : lockPreviousUnlockedGhostMark;
  for (let index = 0; index < Math.abs(amount); index += 1) {
    next = operation(next, 'p1-stat-灵气-ghost', QI_CAPACITY_GHOST_COUNT);
  }
  return next;
}

export function applyFoundationBreakthroughMarkEffects(store = {}) {
  let next = applyQiCapacityDelta(store, 2);
  next = unlockNextGhostMark(next, 'p1-zhenyuan-ghost', 4);
  return next;
}

export function revertFoundationBreakthroughMarkEffects(store = {}) {
  let next = applyQiCapacityDelta(store, -2);
  next = lockPreviousUnlockedGhostMark(next, 'p1-zhenyuan-ghost', 4);
  return next;
}

export function applyGoldenCoreBreakthroughMarkEffects(store = {}) {
  return applyQiCapacityDelta(store, 2);
}

export function revertGoldenCoreBreakthroughMarkEffects(store = {}) {
  return applyQiCapacityDelta(store, -2);
}

export function applyOptionalQiCapacityMarkEffect(store = {}) {
  return applyQiCapacityDelta(store, 1);
}

export function revertOptionalQiCapacityMarkEffect(store = {}) {
  return applyQiCapacityDelta(store, -1);
}
