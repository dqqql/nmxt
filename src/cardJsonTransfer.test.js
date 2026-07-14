import { describe, expect, it } from 'vitest';
import { createCardJson, getCardJsonFileName, parseCardJson } from './cardJsonTransfer';

describe('card JSON transfer', () => {
  it('omits the portrait when exporting', () => {
    const result = JSON.parse(createCardJson({ version: 1, texts: { name: '云舒' }, portrait: 'data:image/png;base64,abc' }));
    expect(result).toEqual({ version: 1, texts: { name: '云舒' } });
    expect(result).not.toHaveProperty('portrait');
  });

  it('ignores a portrait supplied by an imported file', () => {
    const result = parseCardJson('{"version":1,"portrait":"data:image/png;base64,abc","texts":{"name":"云舒"}}');
    expect(result).toEqual({ version: 1, texts: { name: '云舒' } });
  });

  it('rejects invalid JSON and non-object roots', () => {
    expect(() => parseCardJson('{')).toThrow('无法解析 JSON 文件');
    expect(() => parseCardJson('[]')).toThrow('不是有效的角色卡数据');
    expect(() => parseCardJson('{"hello":"world"}')).toThrow('没有找到角色卡数据');
  });

  it('creates a Windows-safe JSON file name', () => {
    expect(getCardJsonFileName(' 云舒/问道:*? ')).toBe('云舒_问道___.json');
    expect(getCardJsonFileName('')).toBe('逆命仙途角色卡.json');
  });
});
