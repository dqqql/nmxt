// 资源库数据汇总入口。
//
// 所有与游戏机制有关的文本都集中在本文件夹的 JSON 中（见同目录 README.md）。
// 需要更新文案时，只改对应的 .json 即可，无需改动任何渲染代码。
// 本文件只负责把 JSON 读出来、按原有命名导出，并保留抽卡所需的随机逻辑。

import realms from './realms.json';
import origins from './origins.json';
import sources from './sources.json';
import methods from './methods.json';
import daos from './daos.json';
import talents from './talents.json';
import fate from './fate.json';
import attributes from './attributes.json';
import spellGroupsData from './spellGroups.json';
import resourcesData from './resources.json';
import buildGuide from './buildGuide.json';
import questionnaire from './questionnaire/questions.json';

// —— 资源库五大分类 ——
export const realmOptions = realms;        // 境界
export const originOptions = origins;       // 出身
export const sourceOptions = sources;       // 道源
export const methodOptions = methods;       // 法门
export const daoOptions = daos;             // 大道

// —— 天赋 / 天谴 ——
export const talentPool = talents.talentPool;
export const punishmentPool = talents.punishmentPool;
export const tierMeta = talents.tierMeta;

// —— 因果（因果卡 / 骰子 / 因果进度 / 抽卡方案）——
export const fateCards = fate.fateCards;
export const diceLabels = fate.diceLabels;
export const diceEffectCycle = fate.diceEffectCycle;
export const baseDiceEffects = fate.baseDiceEffects;
export const fateProgression = fate.fateProgression;
export const fateDraws = fate.fateDraws;

// —— 其他卡面机制文本 ——
export const attributeDefs = attributes;    // 四属性：仙躯 / 身法 / 神魂 / 灵蕴
export const spellGroups = spellGroupsData; // 术法分组：神通 / 秘法 / 功法 / 灵宝
export const resourceGroups = resourcesData;// 灵石资源
export const buildGuideSteps = buildGuide;  // 建卡指引
export const questionnaireConfig = questionnaire; // 问卷车卡

// —— 抽卡逻辑（非文本，保留在代码中）——
// 从池中无重复随机抽取 n 个。
function sampleN(pool, n) {
  const copy = [...pool];
  const out = [];
  for (let i = 0; i < n && copy.length > 0; i += 1) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// 按抽取方案随机生成结果数组：[{ kind, tier, name, effect }]
export function drawByPlan(plan) {
  return plan.items.flatMap(({ kind, tier, count }) => {
    const pool = kind === 'talent' ? talentPool[tier] : punishmentPool[tier];
    return sampleN(pool, count).map((entry) => ({ kind, tier, ...entry }));
  });
}
