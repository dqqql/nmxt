import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const railSource = readFileSync(new URL('./ToolRail.jsx', import.meta.url), 'utf8');
const panelSource = readFileSync(new URL('./QuickReferencePanel.jsx', import.meta.url), 'utf8');
const panelCss = readFileSync(new URL('./quickReferencePanel.css', import.meta.url), 'utf8');

describe('quick reference panel', () => {
  it('places a quick-reference action after the save archive action', () => {
    const saveIndex = railSource.indexOf('<span>存档</span>');
    const quickReferenceIndex = railSource.indexOf('<span>速查</span>');

    expect(saveIndex).toBeGreaterThan(-1);
    expect(quickReferenceIndex).toBeGreaterThan(saveIndex);
    expect(railSource).toContain('setQuickReferenceOpen(true)');
  });

  it('uses an accessible modal that closes with its button, backdrop, or Escape', () => {
    expect(panelSource).toContain('role="dialog"');
    expect(panelSource).toContain('aria-modal="true"');
    expect(panelSource).toContain("event.key === 'Escape'");
    expect(panelSource).toContain("event.key === 'Tab'");
    expect(panelSource).toContain('event.target === event.currentTarget');
    expect(panelSource).toContain('aria-label="关闭规则速查"');
    expect(railSource).toContain('quickReferenceButtonRef.current?.focus()');
  });

  it('includes all requested reference sections and responsive waterfall columns', () => {
    ['雷霆', '古兽', '圣灵', '星宿', '通用储物格'].forEach((heading) => {
      expect(panelSource).toContain(`title="${heading}"`);
    });
    expect(panelCss).toContain('column-count: 3');
    expect(panelCss).toContain('column-count: 2');
    expect(panelCss).toContain('column-count: 1');
  });

  it('exports the complete quick-reference dialog as a PNG', () => {
    expect(panelSource).toContain("import { toPng } from 'html-to-image'");
    expect(panelSource).toContain('await toPng(exportClone');
    expect(panelSource).toContain("link.download = '逆命仙途-规则速查.png'");
    expect(panelSource).toContain("exportClone.querySelector('.quickReferenceHeaderActions')?.remove()");
    expect(panelSource).toContain("column.className = 'quickReferenceExportColumn'");
    expect(panelSource).toContain('waterfall.replaceChildren(...columns)');
    expect(panelSource).toContain("exportClone.classList.add('quickReferenceExportClone')");
    expect(panelSource).toContain("exporting ? '生成中' : '导出 PNG'");
    expect(panelCss).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
  });

  it('keeps header actions on one row with legible text and no export caption', () => {
    expect(panelSource).toContain('className="quickReferenceHeaderActions"');
    expect(panelSource).not.toContain('PNG 已导出');
    expect(panelCss).toContain('flex-direction: row');
    expect(panelCss).toContain('.quickReferenceExportButton span');
    expect(panelCss).toContain('color: inherit');
  });
});
