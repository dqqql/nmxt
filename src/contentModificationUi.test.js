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

  it('gates the third-page formation, puppet, and beast sections by learned methods', () => {
    expect(mainSource).toContain('function getLearnedMethodNames(current, upgradeCards = {})');
    expect(mainSource).toContain("const hasFormationMethod = learnedMethodNames.includes('阵修');");
    expect(mainSource).toContain("const hasPuppetMethod = learnedMethodNames.includes('傀修');");
    expect(mainSource).toContain("const hasBeastMethod = learnedMethodNames.includes('兽修');");
    expect(mainSource).toContain('阵修专属页面');
    expect(mainSource).toContain('傀修专属页面');
    expect(mainSource).toContain('兽修专属页面');
    expect(ruleBody('.methodExclusiveBlankFormation')).toContain('grid-column: 1');
    expect(ruleBody('.methodExclusiveBlankPuppet')).toContain('grid-column: 2');
    expect(ruleBody('.methodExclusiveBlankPuppet')).toContain('grid-row: 1 / 3');
    expect(ruleBody('.methodExclusiveBlankBeast')).toContain('grid-column: 2');
    expect(ruleBody('.methodExclusiveBlankBeast')).toContain('grid-row: 3');
  });

  it('uses the shared interactive solid and ghost mark system for the formation break track', () => {
    expect(mainSource).toContain('<PdfClickableMarks solid={4} ghost={2} label="破阵命盘" groupId="p3-formation-break-track" />');
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
