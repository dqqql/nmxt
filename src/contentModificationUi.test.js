import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(cssSource.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')))
    .map((match) => match[1])
    .join('\n');
}

describe('requested content and layout modifications', () => {
  it('reuses the manual/draw fate dialog in guided card creation', () => {
    expect(mainSource).toContain('function FateDrawDialog({ fateDraw, closeFateDraw, setDrawnTalents })');
    expect(mainSource).toContain('setGuideFateDraw({ title, plans, fateValue })');
    expect(mainSource).toContain('选择自选或抽取');
    expect(mainSource).toContain('drawnTalentsFateValue: fateValue');
  });

  it('shows an extra selected method beside the original method and not as a dao method', () => {
    expect(mainSource).toContain("[option?.name, ...extraMethodNames].filter(Boolean).join(' / ')");
    expect(mainSource).toContain("if (title === '功法') return uniqueCards(upgradeCards.daoMethods);");
    expect(mainSource).not.toContain("uniqueCards([...upgradeCards.daoMethods, ...upgradeCards.extraMethods])");
  });

  it('vertically centers all second-page table text cells', () => {
    expect(ruleBody('.pdfTableRow > div')).toContain('align-items: center');
  });

  it('keeps breakthrough results within their panel and uses compact option spacing', () => {
    const result = ruleBody('.breakthroughResult');
    const checks = ruleBody('.resultChecks');
    expect(result).toContain('grid-template-rows: auto auto minmax(0, 1fr)');
    expect(result).toContain('overflow: hidden');
    expect(checks).toContain('align-content: center');
    expect(checks).toContain('min-height: 0');
  });
});
