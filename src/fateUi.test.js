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
    const guidePreviewStep = functionBody('GuidePreviewStep');

    expect(mainSource).toContain('function getFateDisplayDetails');
    expect(mainSource).toContain('getFateState(title).inheritedEffects');
    expect(guideFateStep).toContain('className="guideFateSummary"');
    expect(guideFateStep).toContain('<h3>数值效果</h3>');
    expect(guideFateStep).toContain('<h3>天赋 / 天谴</h3>');
    expect(guidePreviewStep).toContain("{ label: '数值效果', value: fateDetails.numericEffects.join('；') }");
    expect(guidePreviewStep).toContain("{ label: '天赋 / 天谴', value: fateDetails.talentRule }");
    expect(cssSource).toContain('.guideFateSummaryBody');
  });

  it('keeps random drawing on the original selected plan', () => {
    const fateDrawModal = functionBody('FateDrawModal');
    const fateChoices = functionBody('getFateChoices');

    expect(fateDrawModal).toContain('setResults(drawByPlan(selectedPlan))');
    expect(fateChoices).toContain('formatManualFatePlanLabel(onlyPlan, fateDraw.title, tierMeta)');
    expect(fateDrawModal).toContain('getFatePlanSlots(plan, {');
  });

  it('marks both separators beside the selected fate card without relying on :has', () => {
    const fateRibbon = functionBody('FateRibbon');

    expect(fateRibbon).toContain("index === selectedIndex - 1 ? ' before-selected' : ''");
    expect(cssSource).toContain('.fateStep.selected::after,\n.fateStep.before-selected::after');
    expect(cssSource).toContain('.printPage .fateStep.selected::after,\n  .printPage .fateStep.before-selected::after');
    expect(cssSource).not.toContain('.fateStep:has(');
  });
});
