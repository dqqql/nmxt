import { describe, expect, it } from 'vitest';
import { daoOptions, methodOptions, sourceOptions } from './data';
import {
  CardPackValidationError,
  buildRuntimeOptions,
  parseCardPackJson,
  removeCardPack,
  upsertCardPack,
} from './cardPackState';

const baseOptions = { source: sourceOptions, method: methodOptions, dao: daoOptions };
const validPack = {
  schemaVersion: 1,
  id: 'tests.fire-pack',
  name: '火焰扩展',
  version: '1.0.0',
  resources: [{
    id: 'fire-skill',
    parent: { kind: 'source', name: '火道源' },
    type: 'skill',
    realm: 'qi-middle',
    acquisition: 'realm-choice',
    name: '流火术',
    text: '测试效果',
  }],
};

describe('card pack state', () => {
  it('parses and merges a valid pack into its parent candidate pool', () => {
    const pack = parseCardPackJson(JSON.stringify(validPack), { baseOptions });
    const runtime = buildRuntimeOptions(baseOptions, [pack]);
    expect(runtime.source.find((entry) => entry.name === '火道源').qiUpgradeSkills.at(-1)).toMatchObject({
      name: '流火术',
      _resourceId: 'tests.fire-pack:fire-skill',
      _packName: '火焰扩展',
    });
  });

  it('reports all schema errors with paths and resource indexes', () => {
    let error;
    try {
      parseCardPackJson(JSON.stringify({
        schemaVersion: 1,
        id: 'Bad ID',
        name: '坏包',
        version: '1',
        resources: [{
          id: 'x',
          parent: { kind: 'source', name: '不存在道源' },
          type: 'skill',
          realm: 'qi-late',
          acquisition: 'initial',
          name: '错误资源',
          text: 'x',
        }],
      }), { baseOptions });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(CardPackValidationError);
    expect(error.errors.some((entry) => entry.path === 'id')).toBe(true);
    expect(error.errors.some((entry) => entry.path === 'resources[0].parent.name')).toBe(true);
    expect(error.errors.some((entry) => entry.resourceIndex === 0 && entry.message.includes('组合'))).toBe(true);
  });

  it('rejects duplicate ids and same-slot names atomically', () => {
    const duplicated = {
      ...validPack,
      resources: [validPack.resources[0], { ...validPack.resources[0] }],
    };
    expect(() => parseCardPackJson(JSON.stringify(duplicated), { baseOptions })).toThrow(CardPackValidationError);
  });

  it('rejects a resource name that conflicts with a core candidate in the same slot', () => {
    const coreName = sourceOptions.find((entry) => entry.name === '火道源').qiUpgradeSkills[0].name;
    const conflict = {
      ...validPack,
      resources: [{ ...validPack.resources[0], name: coreName }],
    };
    expect(() => parseCardPackJson(JSON.stringify(conflict), { baseOptions })).toThrow(CardPackValidationError);
  });

  it('builds multiple initial candidates for abilities, skills, buffs, and dao effects', () => {
    const multiPack = {
      ...validPack,
      resources: [
        {
          id: 'ability',
          parent: { kind: 'source', name: '火道源' },
          type: 'source-ability',
          realm: 'qi-early',
          acquisition: 'initial',
          name: '炎心',
          text: '能力',
          buff: '增益',
        },
        {
          id: 'initial-skill',
          parent: { kind: 'source', name: '火道源' },
          type: 'skill',
          realm: 'qi-early',
          acquisition: 'initial',
          name: '火星',
          text: '神通',
        },
        {
          id: 'method-buff',
          parent: { kind: 'method', name: '剑修' },
          type: 'attack-buff',
          realm: 'qi-early',
          acquisition: 'initial',
          name: '剑意',
          text: '增益',
        },
        {
          id: 'dao-effect',
          parent: { kind: 'dao', name: '修罗之道' },
          type: 'dao-effect',
          realm: 'qi-early',
          acquisition: 'initial',
          name: '战魂',
          text: '效果',
        },
      ],
    };
    const pack = parseCardPackJson(JSON.stringify(multiPack), { baseOptions });
    const runtime = buildRuntimeOptions(baseOptions, [pack]);
    expect(runtime.source.find((entry) => entry.name === '火道源').abilityOptions).toHaveLength(2);
    expect(runtime.source.find((entry) => entry.name === '火道源').initialSkillOptions).toHaveLength(2);
    expect(runtime.method.find((entry) => entry.name === '剑修').initialAttackBuffOptions).toHaveLength(2);
    expect(runtime.dao.find((entry) => entry.name === '修罗之道').effectOptions).toHaveLength(2);
  });

  it('upserts by stable pack id and removes without mutating other packs', () => {
    const oldPack = { ...validPack, version: '1.0.0' };
    const newPack = { ...validPack, version: '2.0.0' };
    expect(upsertCardPack([oldPack], newPack)).toHaveLength(1);
    expect(upsertCardPack([oldPack], newPack)[0].version).toBe('2.0.0');
    expect(removeCardPack([oldPack, { ...oldPack, id: 'other' }], oldPack.id).map((entry) => entry.id)).toEqual(['other']);
  });
});
