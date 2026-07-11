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

export function applyFoundationBreakthroughMarkEffects(store = {}) {
  let next = unlockNextGhostMark(store, 'p1-stat-灵气-ghost', 4);
  next = fillNextSolidMark(next, 'p1-stat-灵气-solid', 8);
  next = fillNextSolidMark(next, 'p1-stat-灵气-solid', 8);
  next = unlockNextGhostMark(next, 'p1-zhenyuan-ghost', 4);
  return next;
}
