import { describe, expect, it } from 'vitest';
import {
  parseCommunityResourceJson,
  readStoredCommunityResources,
  removeCommunityResourcePack,
  upsertCommunityResourcePack,
  writeStoredCommunityResources,
  validateCommunityResourcePack,
} from './communityResourceState';

describe('community resource packs', () => {
  it('accepts Chinese card type names and stores only the simple pack fields', () => {
    const pack = parseCommunityResourceJson(JSON.stringify({
      name: '散修手札',
      author: '云游散修',
      ignored: '不会进入运行时数据',
      cards: [{ type: '神通', name: '流云指', text: '造成轻度伤害。', id: 'not-needed' }],
    }));

    expect(pack).toEqual({
      name: '散修手札',
      author: '云游散修',
      cards: [{ type: 'spells', name: '流云指', text: '造成轻度伤害。' }],
    });
  });

  it('only applies pack-name uniqueness across installed packs', () => {
    const installed = [{
      name: '同名包',
      cards: [{ type: 'arts', name: '同名卡', text: '相同内容' }],
    }];
    expect(() => validateCommunityResourcePack({
      name: '同名包',
      author: '作者甲',
      cards: [{ type: '秘法', name: '另一张卡', text: '内容' }],
    }, installed)).toThrow(/格式无效/);

    expect(() => validateCommunityResourcePack({
      name: '另一个包',
      author: '作者乙',
      cards: [
        { type: '秘法', name: '同名卡', text: '相同内容' },
        { type: '秘法', name: '同名卡', text: '相同内容' },
      ],
    }, installed)).not.toThrow();
  });

  it('removes a pack by its unique name', () => {
    expect(removeCommunityResourcePack([{ name: '甲' }, { name: '乙' }], '甲'))
      .toEqual([{ name: '乙' }]);
  });

  it('updates a same-name marketplace package without duplicating it', () => {
    expect(upsertCommunityResourcePack(
      [{ name: '同名包', author: '旧作者', cards: [] }],
      { name: '同名包', author: '新作者', cards: [{ type: 'arts', name: '新卡', text: '内容' }] },
    )).toEqual([
      { name: '同名包', author: '新作者', cards: [{ type: 'arts', name: '新卡', text: '内容' }] },
    ]);
  });

  it('supports manually loadable talents and punishments with a tier', () => {
    expect(parseCommunityResourceJson(JSON.stringify({
      name: '命数集',
      author: '司命',
      cards: [
        { type: '天赋', tier: '地', name: '观星', text: '知晓星轨。' },
        { type: '天谴', tier: '人', name: '失期', text: '错失良机。' },
      ],
    })).cards).toEqual([
      { type: 'talent', tier: '地', name: '观星', text: '知晓星轨。' },
      { type: 'punishment', tier: '人', name: '失期', text: '错失良机。' },
    ]);
  });

  it('preserves internal type keys after a storage round trip', () => {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    };
    const packs = [{
      name: '往返测试',
      author: '测试者',
      cards: [
        { type: 'spells', name: '神通卡', text: '内容' },
        { type: 'treasures', name: '灵宝卡', text: '内容' },
      ],
    }];
    writeStoredCommunityResources(packs, storage);
    expect(readStoredCommunityResources(storage)).toEqual(packs);
  });
});
