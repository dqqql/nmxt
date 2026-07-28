import {
  daoOptions,
  methodOptions,
  punishmentPool,
  sourceOptions,
  talentPool,
} from './data';
import { CARD_PACK_MAX_BYTES, validateCardPack } from './cardPackState';
import { validateCommunityResourcePack } from './communityResourceState';

export const MARKETPLACE_SOURCES = ['official', 'third-party'];
export const MARKETPLACE_RESOURCE_TYPES = ['card-pack', 'community'];
export const MARKETPLACE_STATUSES = ['draft', 'published'];

const BASE_RESOURCE_OPTIONS = {
  source: sourceOptions,
  method: methodOptions,
  dao: daoOptions,
  talentPool,
  punishmentPool,
};

export class MarketplaceValidationError extends Error {
  constructor(fields) {
    super('商城资源格式无效。');
    this.name = 'MarketplaceValidationError';
    this.fields = fields;
  }
}

function byteLength(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function validateMarketplaceDraft(input) {
  const fields = [];
  if (!MARKETPLACE_SOURCES.includes(input?.source)) {
    fields.push({ path: 'source', message: '来源必须是官方或第三方。' });
  }
  if (!MARKETPLACE_RESOURCE_TYPES.includes(input?.resourceType)) {
    fields.push({ path: 'resourceType', message: '资源类型必须是卡包或社区资源。' });
  }
  if (!MARKETPLACE_STATUSES.includes(input?.status)) {
    fields.push({ path: 'status', message: '状态必须是草稿或已上架。' });
  }
  if (!input?.payload || typeof input.payload !== 'object' || Array.isArray(input.payload)) {
    fields.push({ path: 'payload', message: '资源包 JSON 必须是对象。' });
  } else if (byteLength(input.payload) > CARD_PACK_MAX_BYTES) {
    fields.push({ path: 'payload', message: '资源包 JSON 不能超过 2 MiB。' });
  }
  if (typeof input?.description !== 'string' || input.description.length > 500) {
    fields.push({ path: 'description', message: '简介必须是不超过 500 字的文本。' });
  }
  if (fields.length) throw new MarketplaceValidationError(fields);

  try {
    if (input.resourceType === 'card-pack') {
      const payload = validateCardPack(input.payload, { baseOptions: BASE_RESOURCE_OPTIONS });
      return {
        source: input.source,
        resourceType: input.resourceType,
        status: input.status,
        version: payload.version,
        name: payload.name,
        author: payload.author?.trim() || '佚名',
        packageKey: payload.id,
        description: input.description.trim(),
        itemCount: (payload.resources?.length || 0) + (payload.talents?.length || 0) + (payload.treasures?.length || 0),
        payload,
      };
    }
    if (typeof input.version !== 'string' || !input.version.trim()) {
      throw new MarketplaceValidationError([{ path: 'version', message: '社区资源必须填写商城版本。' }]);
    }
    const payload = validateCommunityResourcePack(input.payload);
    return {
      source: input.source,
      resourceType: input.resourceType,
      status: input.status,
      version: input.version.trim(),
      name: payload.name,
      author: payload.author,
      packageKey: payload.name,
      description: input.description.trim(),
      itemCount: payload.cards.length,
      payload,
    };
  } catch (error) {
    if (error instanceof MarketplaceValidationError) throw error;
    throw new MarketplaceValidationError(
      (error?.errors || [{ path: 'payload', message: error?.message || '资源包格式无效。' }])
        .map((field) => ({ path: field.path, message: field.message })),
    );
  }
}
