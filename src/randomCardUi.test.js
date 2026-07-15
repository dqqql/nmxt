import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function functionBody(name) {
  const start = mainSource.indexOf(`function ${name}`);
  const end = mainSource.indexOf('\nfunction ', start + 1);
  return mainSource.slice(start, end < 0 ? undefined : end);
}

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(cssSource.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')))
    .map((match) => match[1])
    .join('\n');
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

  it('shows drawn talent and punishment effect details in the shared preview', () => {
    const previewBuilder = functionBody('getGuidePreviewCards');

    expect(previewBuilder).toContain('drawnTalentDetails');
    expect(previewBuilder).toContain("entry.effect || '暂无说明'");
    expect(previewBuilder).toContain("label: '抽取详情'");
    expect(ruleBody('.guidePreviewField strong')).toContain('white-space: pre-line');
  });

  it('uses a content-sized waterfall layout for the desktop random preview', () => {
    const modal = ruleBody('.randomCardModal');
    const preview = ruleBody('.randomCardPreview');
    const masonry = ruleBody('.randomCardPreview .guidePreviewMasonry');
    const card = ruleBody('.randomCardPreview .guidePreviewCard');
    const heading = ruleBody('.randomCardPreview .guidePreviewCard header h3');
    const body = ruleBody('.randomCardPreview .guidePreviewField strong');

    expect(modal).toContain('width: min(1360px, calc(100vw - 96px))');
    expect(modal).toContain('height: auto');
    expect(preview).toContain('overflow: auto');
    expect(masonry).toContain('column-count: 3');
    expect(masonry).not.toContain('grid-template-rows');
    expect(card).toContain('height: auto');
    expect(card).toContain('break-inside: avoid');
    expect(heading).toContain('font-size: 24px');
    expect(body).toContain('font-size: 15px');
    expect(cssSource).not.toContain('.randomCardPreview .guidePreviewCard:last-child');
  });

  it('applies only the confirmed preview and removes random generation from the guide', () => {
    const guidePreview = functionBody('GuidePreviewStep');

    expect(mainSource).toContain('applyRandomCard(randomPreview)');
    expect(mainSource).toContain('setCoreAttribute(result.coreAttribute)');
    expect(mainSource).toContain('coreAttribute: randomPreview.coreAttribute');
    expect(mainSource).toContain('onRedraw={() => setRandomPreview(drawRandomCard())}');
    expect(guidePreview).not.toContain('随机生成');
    expect(guidePreview).not.toContain('onRandom');
  });
});
