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

  it('gates the third-page formation, follower, and beast sections by learned methods and beast kind', () => {
    expect(mainSource).toContain('function getLearnedMethodNames(current, upgradeCards = {})');
    expect(mainSource).toContain("const hasFormationMethod = learnedMethodNames.includes('阵修');");
    expect(mainSource).toContain("const hasPuppetMethod = learnedMethodNames.includes('傀修');");
    expect(mainSource).toContain("const hasBeastMethod = learnedMethodNames.includes('兽修');");
    expect(mainSource).toContain('const showsFollowerPanel = hasFormationMethod || hasPuppetMethod || hasBeastMethod;');
    expect(mainSource).toContain("const hasSelectedBeastFollower = Boolean(markStates['p3-follower-kind-beast:0']?.filled);");
    expect(mainSource).toContain('{showsFollowerPanel ? (');
    expect(mainSource).toContain('{showsFollowerPanel && hasSelectedBeastFollower ? (');
    expect(mainSource).toContain('阵修专属页面');
    expect(mainSource).toContain('随从专属页面');
    expect(mainSource).toContain('灵兽专属页面');
    expect(ruleBody('.methodExclusiveBlankFormation')).toContain('grid-column: 1');
    expect(ruleBody('.methodExclusiveBlankPuppet')).toContain('grid-column: 2');
    expect(ruleBody('.methodExclusiveBlankPuppet')).toContain('grid-row: 1 / 3');
    expect(ruleBody('.methodExclusiveBlankBeast')).toContain('grid-column: 2');
    expect(ruleBody('.methodExclusiveBlankBeast')).toContain('grid-row: 3');
  });

  it('adds a printable character background page with three editable profile fields', () => {
    expect(mainSource).toContain("{ id: 'background', label: '角色背景' }");
    expect(mainSource).toContain('function PageBackground()');
    expect(mainSource).toContain('className="pdfPageBody backgroundPrintGrid"');
    expect(mainSource).toContain('getSpecialQuestionnaireAnswersForOption(');
    expect(mainSource).toContain('className="backgroundProfileFields"');
    ['角色简介', '角色形象', '仙途小记'].forEach((title) => expect(mainSource).toContain(`title: '${title}'`));
    expect(mainSource).toContain('return <PageBackground />');
    expect(ruleBody('.backgroundPrintGrid')).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(ruleBody('.backgroundProfileFields')).toContain('grid-column: 1 / -1');
    expect(ruleBody('.backgroundProfileFields')).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(ruleBody('.backgroundProfileTextarea')).toContain('line-height: 2');
  });

  it('uses the same image logo on page one as the later pages', () => {
    expect(mainSource).toContain('<img src={gameLogo} alt="逆命仙途" className="sheetLogo" />');
    expect(mainSource).toContain('<img src={gameLogo} alt="逆命仙途" className="pdfLogo" />');
    expect(ruleBody('.sheetLogo')).toContain('width: 124px');
    expect(ruleBody('.sheetLogo')).toContain('height: 48px');
  });

  it('keeps the fixed profile questionnaire in the questionnaire flow but removes it beside origin', () => {
    expect(mainSource).toContain('questionnaireSpecialSection questionnaireProfileSection');
    expect(mainSource).toContain('你可以参考以下的问卷来完善你的角色形象。');
    const infoPanelSource = mainSource.slice(mainSource.indexOf('function InfoPanel()'), mainSource.indexOf('function SideTextPanel('));
    expect(infoPanelSource).not.toContain('originQuestionnaireButton');
    expect(infoPanelSource).not.toContain('问卷');
  });

  it('enlarges, bolds, and centers all text in the follower damage thresholds', () => {
    const thresholdCells = ruleBody('.thresholdBand span,\n.thresholdBand b,\n.thresholdBand em');
    expect(thresholdCells).toContain('place-items: center');
    expect(thresholdCells).toContain('font-size: 15px');
    expect(thresholdCells).toContain('font-weight: 800');
    expect(thresholdCells).toContain('text-align: center');
  });

  it('keeps long special questionnaires inside a scrollable modal body', () => {
    expect(ruleBody('.specialQuestionnaireModal')).toContain('grid-template-rows: auto minmax(0, 1fr)');
    expect(ruleBody('.specialQuestionnaireModal')).toContain('overflow: hidden');
    expect(ruleBody('.specialQuestionnaireModalBody')).toContain('min-height: 0');
    expect(ruleBody('.specialQuestionnaireModalBody')).toContain('overflow: auto');
    expect(ruleBody('.specialQuestionnaireModalBody')).toContain('overscroll-behavior: contain');
  });

  it('removes the redundant right-side hint tool while keeping the inline quick reference', () => {
    expect(mainSource).not.toContain('hintOpen');
    expect(mainSource).not.toContain('conflict-popover');
    expect(mainSource).not.toContain('className="hintAction"');
    expect(mainSource).toContain('className="panel quickReferencePanel"');
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
