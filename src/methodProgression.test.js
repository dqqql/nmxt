import { describe, expect, it } from 'vitest';
import {
  formatInsightCard,
  getFirstRealmInsight,
  getUnlockedMethodAttackBuffs,
} from './methodProgression';

const swordMethod = {
  name: '剑修',
  attackBuffs: [
    '剑势凛冽：剑未出，意先临，锋芒自生。你每个回合的第1次普攻攻击检定获得优势。',
    '剑气激荡：锐利的剑气可以击破对手的架势。你普通攻击的破罡值-1。',
  ],
  insights: [
    {
      name: '练气·剑感初开',
      text: '你与手中的剑产生共鸣。当你攻击未拆招敌人时，你可以消耗1灵气格使破罡值-1',
    },
    {
      name: '筑基·御剑攻敌',
      text: '将这个感悟放置于你的魂海之中，永久生效。',
    },
  ],
};

describe('method progression helpers', () => {
  it('keeps realm insights available for the insights table', () => {
    expect(formatInsightCard(getFirstRealmInsight(swordMethod, { name: '练气前期' }))).toContain('练气·剑感初开');
    expect(formatInsightCard(getFirstRealmInsight(swordMethod, { name: '筑基前期' }))).toContain('筑基·御剑攻敌');
  });

  it('unlocks only the first method attack buff during qi refinement', () => {
    expect(getUnlockedMethodAttackBuffs(swordMethod, { name: '练气前期' })).toEqual([
      swordMethod.attackBuffs[0],
    ]);
  });

  it('unlocks both method attack buffs during foundation building', () => {
    expect(getUnlockedMethodAttackBuffs(swordMethod, { name: '筑基前期' })).toEqual(swordMethod.attackBuffs);
  });

  it('does not use insight cards as method attack buffs', () => {
    expect(getUnlockedMethodAttackBuffs(swordMethod, { name: '练气前期' }).join('\n')).not.toContain('剑感初开');
  });
});
