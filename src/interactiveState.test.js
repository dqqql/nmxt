import { describe, expect, it } from 'vitest';
import {
  createMarkState,
  toggleMarkFilled,
  toggleMarkGhost,
  updateKeyedMarkState,
} from './interactiveState';

describe('interactive mark state', () => {
  it('stores mark state by stable key so duplicate renderers can share it', () => {
    let store = {};

    store = updateKeyedMarkState(store, 'page-one:hurt:0', 'solid', toggleMarkFilled);

    expect(store['page-one:hurt:0']).toEqual({ filled: true, ghost: false });

    store = updateKeyedMarkState(store, 'page-one:hurt:0', 'solid', toggleMarkGhost);

    expect(store['page-one:hurt:0']).toEqual({ filled: true, ghost: true });
  });

  it('keeps initial filled and ghost states available for first render', () => {
    expect(createMarkState('filled')).toEqual({ filled: true, ghost: false });
    expect(createMarkState('ghost')).toEqual({ filled: false, ghost: true });
  });
});
