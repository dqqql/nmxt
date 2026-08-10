import { describe, expect, it } from 'vitest';
import {
  BEAST_BLOODLINE_SPELLS,
  getBloodlineSelectionText,
  hydrateBloodlineSpell,
  hydrateBloodlineSpellSnapshot,
} from './beastBloodlineSpells';

describe('beast bloodline spell text', () => {
  it('fills the exact healing and binding spell text when selected', () => {
    expect(getBloodlineSelectionText({ name: '自定义', text: '自定义效果' }, 'p3-bloodline-3', true))
      .toEqual(BEAST_BLOODLINE_SPELLS['p3-bloodline-3']);
    expect(getBloodlineSelectionText({ name: '', text: '' }, 'p3-bloodline-4', true))
      .toEqual(BEAST_BLOODLINE_SPELLS['p3-bloodline-4']);
  });

  it('clears an untouched auto-fill when another bloodline is selected', () => {
    expect(getBloodlineSelectionText(BEAST_BLOODLINE_SPELLS['p3-bloodline-3'], 'p3-bloodline-0', true))
      .toEqual({ name: '', text: '' });
  });

  it('clears an untouched auto-fill when its bloodline is deselected', () => {
    expect(getBloodlineSelectionText(BEAST_BLOODLINE_SPELLS['p3-bloodline-4'], 'p3-bloodline-4', false))
      .toEqual({ name: '', text: '' });
  });

  it('preserves edited text when another bloodline is selected', () => {
    const edited = { name: '疗愈·改', text: '玩家自定义效果' };
    expect(getBloodlineSelectionText(edited, 'p3-bloodline-0', true)).toEqual(edited);
  });

  it('hydrates blank or legacy-default fields without overwriting edits', () => {
    const defaultText = '旧版默认攻击效果';
    expect(hydrateBloodlineSpell({ name: '', text: defaultText }, 'p3-bloodline-3', defaultText))
      .toEqual(BEAST_BLOODLINE_SPELLS['p3-bloodline-3']);
    expect(hydrateBloodlineSpell({ name: '自定义', text: '自定义效果' }, 'p3-bloodline-3', defaultText))
      .toEqual({ name: '自定义', text: '自定义效果' });
  });

  it('hydrates a restored snapshot even when the selected bloodline id did not change', () => {
    const restored = hydrateBloodlineSpellSnapshot(
      { followerMoveName1: '', followerMoveEffect1: '旧版默认攻击效果', other: '保留' },
      { 'p3-bloodline-3:0': { filled: true, ghost: false } },
      '旧版默认攻击效果',
    );
    expect(restored).toEqual({
      followerMoveName1: '习得神通-疗愈',
      followerMoveEffect1: '【气尽】轻巧动作。恢复一名友军2血量格',
      other: '保留',
    });
  });
});
