import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

describe('breakthrough UI integration', () => {
  it('renders controlled breakthrough choices with the correct foundation and golden-core copy', () => {
    expect(mainSource).toContain("getBreakthroughChoiceOptions(breakthroughId)");
    expect(mainSource).toContain("breakthroughChoices[breakthroughId]?.selectedOptionIds?.includes(action)");
    expect(mainSource).toContain('将真元上限增加 1 格');
    expect(mainSource).toContain('灵气格 +2');
    expect(mainSource).toContain('breakthroughId="foundation-early"');
    expect(mainSource).toContain('breakthroughId="golden-core"');
  });

  it('applies and reverses fixed and optional capacity effects instead of filling resource marks', () => {
    expect(mainSource).toContain('applyFoundationBreakthroughMarkEffects(store)');
    expect(mainSource).toContain('applyGoldenCoreBreakthroughMarkEffects(store)');
    expect(mainSource).toContain('revertFoundationBreakthroughMarkEffects(store)');
    expect(mainSource).toContain('revertGoldenCoreBreakthroughMarkEffects(store)');
    expect(mainSource).toContain("applyQiCapacityDelta(store, amount)");
    expect(mainSource).toContain('<StatRow label="灵气" filled={8} ghost={7} />');
  });

  it('commits popup-backed choices only after confirmation and persists their controlled state', () => {
    expect(mainSource).toContain('upgradePrompt?.breakthroughOption');
    expect(mainSource).toContain('attributeChoicePrompt?.breakthroughOption');
    expect(mainSource).toContain('commitBreakthroughChoice(pending.breakthroughId, pending.optionId');
    expect(mainSource).toContain('breakthroughChoices,\n    breakthroughChoiceDetails,');
    expect(mainSource).toContain('setBreakthroughChoices(next.breakthroughChoices)');
  });

  it('connects the static sixth page to screen tabs and the print page sequence', () => {
    expect(mainSource).toContain("import PageSix from './PageSix'");
    expect(mainSource).toContain("{ id: 'p6', label: '第六页' }");
    expect(mainSource).toContain('return <PageSix />');
    expect(mainSource).toContain('return renderSheetPage(tab)');
  });
});
