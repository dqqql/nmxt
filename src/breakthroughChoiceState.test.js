import { describe, expect, it } from 'vitest';
import {
  aggregateBreakthroughChoiceEffects,
  BREAKTHROUGH_CHOICE_LIMIT,
  createBreakthroughChoiceState,
  getBreakthroughChoiceEffectDelta,
  getBreakthroughChoiceOptions,
  toggleBreakthroughChoice,
  validateBreakthroughChoices,
} from './breakthroughChoiceState';

describe('breakthrough optional choice state', () => {
  it('exposes seven foundation options and six golden-core options', () => {
    expect(getBreakthroughChoiceOptions('foundation-early')).toHaveLength(7);
    expect(getBreakthroughChoiceOptions('golden-core')).toHaveLength(6);
    expect(getBreakthroughChoiceOptions('foundation-early').map((option) => option.id)).toContain('extra-method');
    expect(getBreakthroughChoiceOptions('golden-core').map((option) => option.id)).not.toContain('extra-method');
    expect(BREAKTHROUGH_CHOICE_LIMIT).toBe(2);
    expect(getBreakthroughChoiceOptions('foundation-early').map((option) => option.id)).toEqual([
      'normal-health',
      'non-core-attributes',
      'danger-health',
      'qi-treasure',
      'spirit',
      'storage',
      'extra-method',
    ]);
    expect(getBreakthroughChoiceOptions('golden-core').map((option) => option.id)).toEqual([
      'normal-health',
      'non-core-attributes',
      'danger-health',
      'foundation-treasure',
      'spirit',
      'storage',
    ]);
  });

  it('adds and removes effects when an option is toggled', () => {
    const empty = createBreakthroughChoiceState('foundation-early');
    const selected = toggleBreakthroughChoice(empty, 'normal-health');
    const removed = toggleBreakthroughChoice(selected, 'normal-health');

    expect(selected.effects).toEqual({
      normalHealthCapacity: 1,
      bodyMediumThreshold: 1,
      soulMediumThreshold: 1,
    });
    expect(getBreakthroughChoiceEffectDelta(empty, selected)).toEqual(selected.effects);
    expect(getBreakthroughChoiceEffectDelta(selected, removed)).toEqual({
      normalHealthCapacity: -1,
      bodyMediumThreshold: -1,
      soulMediumThreshold: -1,
    });
    expect(removed.effects).toEqual({});
  });

  it('rejects a third selection without changing the two accepted choices', () => {
    let state = createBreakthroughChoiceState('golden-core');
    state = toggleBreakthroughChoice(state, 'normal-health');
    state = toggleBreakthroughChoice(state, 'spirit');
    const rejected = toggleBreakthroughChoice(state, 'storage');

    expect(rejected.selectedOptionIds).toEqual(['normal-health', 'spirit']);
    expect(rejected.validation).toMatchObject({ valid: false, reason: 'choice-limit' });
  });

  it('aggregates capacity and threshold effects and validates unknown choices', () => {
    expect(aggregateBreakthroughChoiceEffects('golden-core', ['danger-health', 'spirit'])).toEqual({
      dangerHealthCapacity: 1,
      bodyHeavyThreshold: 1,
      soulHeavyThreshold: 1,
      qiCapacity: 1,
    });
    expect(validateBreakthroughChoices('golden-core', ['extra-method'])).toMatchObject({
      valid: false,
      reason: 'unknown-option',
    });
  });
});
