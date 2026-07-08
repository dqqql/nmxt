export function createMarkState(initialState = 'solid') {
  return {
    filled: initialState === 'filled',
    ghost: initialState === 'ghost',
  };
}

export function toggleMarkFilled(state) {
  return {
    ...state,
    filled: !state.filled,
  };
}

export function toggleMarkGhost(state, allowGhost = true) {
  if (!allowGhost) return state;
  return {
    ...state,
    ghost: !state.ghost,
  };
}

export function updateKeyedMarkState(store, key, initialState, updater) {
  return {
    ...store,
    [key]: updater(store[key] || createMarkState(initialState)),
  };
}
