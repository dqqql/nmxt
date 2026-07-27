import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function functionBody(name) {
  const start = mainSource.indexOf(`function ${name}`);
  const end = mainSource.indexOf('\nfunction ', start + 1);
  return mainSource.slice(start, end < 0 ? undefined : end);
}

describe('fate selection UI', () => {
  it('shows cumulative effects and talent rules below the guided fate choices and in preview', () => {
    const guideFateStep = functionBody('GuideFateStep');
    const guidePreviewCards = functionBody('getGuidePreviewCards');

    expect(mainSource).toContain('function getFateDisplayDetails');
    expect(mainSource).toContain('getFateState(title).inheritedEffects');
    expect(guideFateStep).toContain('className="guideFateSummary"');
    expect(guideFateStep).toContain('<h3>数值效果</h3>');
    expect(guideFateStep).toContain('<h3>天赋 / 天谴</h3>');
    expect(guidePreviewCards).toContain("{ label: '数值效果', value: fateDetails.numericEffects.join('；') }");
    expect(guidePreviewCards).toContain("{ label: '天赋 / 天谴', value: fateDetails.talentRule }");
    expect(guidePreviewCards).toContain("{ label: '抽取结果', value: drawnTalentSummary }");
    expect(cssSource).toContain('.guideFateSummaryBody');
  });

  it('keeps random drawing on the original selected plan', () => {
    const fateDrawDialog = functionBody('FateDrawDialog');
    const fateChoices = functionBody('getFateChoices');

    expect(fateDrawDialog).toContain('setResults(drawFatePlan(selectedPlan, availableTalentPool, availablePunishmentPool))');
    expect(fateChoices).toContain('formatManualFatePlanLabel(onlyPlan, fateDraw.title, tierMeta)');
    expect(fateDrawDialog).toContain('getFatePlanSlots(plan, {');
  });

  it('allows hand-written talent entries from an empty slot and deletes filled entries directly', () => {
    const talentBoard = functionBody('TalentBoard');
    const talentEditor = functionBody('TalentEditorModal');

    expect(talentBoard).toContain('onClick={() => openTalentEditor(index)}');
    expect(talentBoard).toContain("label: '删除'");
    expect(talentBoard).toContain('onSelect: () => deleteTalentEntry(index)');
    expect(talentBoard).toContain('点击添加天赋 / 天谴');
    expect(talentEditor).toContain('<span>类型</span>');
    expect(talentEditor).toContain('<span>品阶</span>');
    expect(talentEditor).toContain('<span>具体内容</span>');
    expect(talentEditor).toContain('addCustomTalent(talentEditorSlot, { kind, tier, name, effect })');
    expect(mainSource).toContain('drawnTalents: normalizeDrawnTalents(snapshot.drawnTalents)');
    expect(cssSource).toContain('.talentBoxButton');
  });

  it('uses the active card-pack talent pools for manual selection and random draws', () => {
    const fateDrawDialog = functionBody('FateDrawDialog');
    const fateDrawModal = functionBody('FateDrawModal');

    expect(mainSource).toContain('function drawFatePlan(plan, availableTalentPool, availablePunishmentPool)');
    expect(fateDrawDialog).toContain('drawFatePlan(selectedPlan, availableTalentPool, availablePunishmentPool)');
    expect(fateDrawModal).toContain('availableTalentPool={runtimeTalentPool}');
    expect(fateDrawModal).toContain('availablePunishmentPool={runtimePunishmentPool}');
  });

  it('marks both separators beside the selected fate card without relying on :has', () => {
    const fateRibbon = functionBody('FateRibbon');

    expect(fateRibbon).toContain("index === selectedIndex - 1 ? ' before-selected' : ''");
    expect(cssSource).toContain('.fateStep.selected::after,\n.fateStep.before-selected::after');
    expect(cssSource).toContain('.printPage .fateStep.selected::after,\n  .printPage .fateStep.before-selected::after');
    expect(cssSource).not.toContain('.fateStep:has(');
  });
});
