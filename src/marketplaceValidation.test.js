import { describe, expect, it } from 'vitest';
import { validateMarketplaceDraft } from './marketplaceValidation';

describe('marketplace resource validation', () => {
  it('derives community package metadata and item count from JSON', () => {
    expect(validateMarketplaceDraft({
      source: 'third-party',
      resourceType: 'community',
      status: 'published',
      version: '1.2',
      description: '玩家内容',
      payload: {
        name: '散修手札',
        author: '云游散修',
        cards: [{ type: '神通', name: '流云指', text: '造成轻度伤害。' }],
      },
    })).toMatchObject({
      name: '散修手札',
      author: '云游散修',
      packageKey: '散修手札',
      version: '1.2',
      itemCount: 1,
    });
  });

  it('rejects missing versions and invalid catalog metadata', () => {
    expect(() => validateMarketplaceDraft({
      source: 'unknown',
      resourceType: 'community',
      status: 'published',
      version: '',
      description: '',
      payload: { name: '包', author: '作者', cards: [{ type: '神通', name: '卡', text: '内容' }] },
    })).toThrow(/格式无效/);
  });
});
