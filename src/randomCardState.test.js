import { describe, expect, it } from 'vitest';
import { createRandomCardState, fateValueToTitle } from './randomCardState';

const options = {
  realm: [{ name: '练气前期' }, { name: '练气中期' }, { name: '筑基前期' }],
  origin: [{ name: '凡人' }, { name: '宗门弟子' }],
  source: [{ name: '木道源' }, { name: '火道源' }],
  method: [{ name: '丹修' }, { name: '剑修' }, { name: '符修' }],
  dao: [{ name: '守正之道' }, { name: '护佑之道' }],
};

const fateDraws = {
  '平平无奇': [
    { label: '一凡阶天赋', items: [{ kind: 'talent', tier: '凡', count: 1 }] },
    { label: '一人阶天赋 + 一凡阶天谴', items: [{ kind: 'talent', tier: '人', count: 1 }] },
    { label: '不应被随机使用', items: [{ kind: 'punishment', tier: '仙', count: 1 }] },
  ],
  '天命壹': [
    { label: '一地阶天赋 + 一地阶天谴', items: [{ kind: 'talent', tier: '地', count: 1 }] },
  ],
};

describe('random card state', () => {
  it('maps the seven supported fate values to their card titles', () => {
    expect([-3, -2, -1, 0, 1, 2, 3].map(fateValueToTitle)).toEqual([
      '逆命叁',
      '逆命贰',
      '逆命壹',
      '平平无奇',
      '天命壹',
      '天命贰',
      '天命叁',
    ]);
  });

  it('randomizes selections, shuffles attributes, and draws talents without animation', () => {
    const draws = [];
    const randomValues = [
      0.99, // realm -> last
      0, // origin -> first
      0.51, // source -> second
      0.34, // method -> second
      0.99, // dao -> second
      0, // shuffle 3 with 0
      0, // shuffle 2 with 0
      0, // shuffle 1 with 0
      4 / 7, // fate value -> 1 / 天命壹
    ];
    const random = () => randomValues.shift() ?? 0;

    const result = createRandomCardState({
      options,
      fateDraws,
      random,
      drawPlan: (plan) => {
        draws.push(plan.label);
        return [{ kind: 'talent', tier: '地', name: '厚土命格', effect: '测试效果' }];
      },
    });

    expect(result.selections).toEqual({
      realm: 2,
      origin: 0,
      source: 1,
      method: 1,
      dao: 1,
    });
    expect(result.attributes).toEqual({
      '仙躯': '2',
      '身法': '1',
      '神魂': '0',
      '灵蕴': '3',
    });
    expect(result.fateValue).toBe(1);
    expect(result.selectedFateTitle).toBe('天命壹');
    expect(draws).toEqual(['一地阶天赋 + 一地阶天谴']);
    expect(result.drawnTalents).toEqual([
      { kind: 'talent', tier: '地', name: '厚土命格', effect: '测试效果' },
    ]);
  });

  it('chooses randomly between the two plain fate plans', () => {
    const result = createRandomCardState({
      options,
      fateDraws,
      random: () => 0.5,
      drawPlan: (plan) => [{ chosenPlan: plan.label }],
    });

    expect(result.fateValue).toBe(0);
    expect(result.selectedFateTitle).toBe('平平无奇');
    expect(result.drawnTalents).toEqual([{ chosenPlan: '一人阶天赋 + 一凡阶天谴' }]);
  });
});
