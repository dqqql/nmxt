import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function functionBody(name) {
  const start = mainSource.indexOf(`function ${name}`);
  const end = mainSource.indexOf('\nfunction ', start + 1);
  return mainSource.slice(start, end < 0 ? undefined : end);
}

describe('standalone random card UI', () => {
  it('places the random card action immediately after the guided card action', () => {
    const guidedIndex = mainSource.indexOf('className="guidedAction"');
    const randomIndex = mainSource.indexOf('className="randomAction"');

    expect(guidedIndex).toBeGreaterThan(-1);
    expect(randomIndex).toBeGreaterThan(guidedIndex);
    expect(mainSource.slice(guidedIndex, randomIndex)).not.toContain('className="toolButton randomButton"');
  });

  it('reuses guided preview cards in a modal with all three requested actions', () => {
    const modal = functionBody('RandomCardModal');

    expect(modal).toContain('<GuidePreviewCards values={values} />');
    expect(modal).toContain('取消');
    expect(modal).toContain('重新抽取');
    expect(modal).toContain('确认');
    expect(modal).toContain("event.key === 'Escape'");
    expect(cssSource).toContain('.randomCardOverlay');
    expect(cssSource).toContain('.randomCardActions');
  });

  it('applies only the confirmed preview and removes random generation from the guide', () => {
    const guidePreview = functionBody('GuidePreviewStep');

    expect(mainSource).toContain('applyRandomCard(randomPreview)');
    expect(mainSource).toContain('onRedraw={() => setRandomPreview(drawRandomCard())}');
    expect(guidePreview).not.toContain('随机生成');
    expect(guidePreview).not.toContain('onRandom');
  });
});
