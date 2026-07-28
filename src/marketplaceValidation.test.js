import { describe, expect, it } from 'vitest';
import { validateMarketplaceDraft } from './marketplaceValidation';

describe('marketplace resource validation', () => {
  it('derives community package metadata and item count from JSON', () => {
    expect(validateMarketplaceDraft({
      source: 'third-party',
      resourceType: 'community',
      status: 'published',
      version: '1.2',
      author: '手动作者',
      description: '玩家内容',
      payload: {
        name: '散修手札',
        cards: [{ type: '神通', name: '流云指', text: '造成轻度伤害。' }],
      },
    })).toMatchObject({
      name: '散修手札',
      author: '手动作者',
      packageKey: '散修手札',
      version: '1.2',
      itemCount: 1,
      payload: {
        author: '手动作者',
      },
    });
  });

  it('rejects missing versions and invalid catalog metadata', () => {
    expect(() => validateMarketplaceDraft({
      source: 'unknown',
      resourceType: 'community',
      status: 'published',
      version: '',
      author: '',
      description: '',
      payload: { name: '包', author: '作者', cards: [{ type: '神通', name: '卡', text: '内容' }] },
    })).toThrow(/格式无效/);
  });

  it('uses manually entered version and author instead of card-pack JSON metadata', () => {
    expect(validateMarketplaceDraft({
      source: 'official',
      resourceType: 'card-pack',
      status: 'draft',
      version: '2.5.0',
      author: '后台填写作者',
      description: '',
      payload: {
        schemaVersion: 1,
        id: 'tests.manual-metadata',
        name: '手动元数据测试包',
        resources: [],
      },
    })).toMatchObject({
      version: '2.5.0',
      author: '后台填写作者',
      payload: {
        version: '2.5.0',
        author: '后台填写作者',
      },
    });
  });
});
