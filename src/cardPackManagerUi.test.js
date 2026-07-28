import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const managerSource = readFileSync(new URL('./CardPackManager.jsx', import.meta.url), 'utf8');
const railSource = readFileSync(new URL('./ToolRail.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./cardPackManager.css', import.meta.url), 'utf8');

describe('card pack manager UI', () => {
  it('opens from resources and offers import, inspect, filter, replacement, and deletion flows', () => {
    expect(railSource).toContain('runAndClose(onOpenCardPacks)');
    expect(railSource).toContain('卡包管理');
    expect(managerSource).toContain('accept=".json,application/json"');
    expect(managerSource).toContain('按父资源筛选');
    expect(managerSource).toContain('按资源类型筛选');
    expect(managerSource).toContain('按境界筛选');
    expect(managerSource).toContain('替换同 ID 卡包？');
    expect(managerSource).toContain('确认删除');
  });

  it('uses a modal dialog, keyboard escape handling, focus wrapping, and visible validation errors', () => {
    expect(managerSource).toContain('aria-modal="true"');
    expect(managerSource).toContain("event.key === 'Escape'");
    expect(managerSource).toContain("event.key !== 'Tab'");
    expect(managerSource).toContain('role="alert"');
    expect(managerSource).toContain('error.path');
  });

  it('collapses to a single-column full-screen layout on narrow screens', () => {
    expect(cssSource).toContain('@media (max-width: 760px)');
    expect(cssSource).toMatch(/\.cardPackModal\s*\{[^}]*width:\s*100%[^}]*height:\s*100%/s);
    expect(cssSource).toMatch(/\.cardPackLayout\s*\{\s*grid-template-columns:\s*1fr/);
  });

  it('uses the main project palette and flat panel components', () => {
    expect(cssSource).toContain('background: var(--dark, #252021)');
    expect(cssSource).toContain('background: var(--paper, #fff)');
    expect(cssSource).toContain('background: #16864d');
    expect(cssSource).toMatch(/\.cardPackModal\s*\{[^}]*border-radius:\s*0/s);
    expect(cssSource).toMatch(/\.cardPackListItem\s*\{[^}]*border-radius:\s*0/s);
    expect(cssSource).toMatch(/\.cardPackResourceLayout\s*\{[^}]*border-radius:\s*0/s);
    expect(cssSource).toMatch(/\.cardPackConfirm > div\s*\{[^}]*border-radius:\s*0/s);
    expect(cssSource).not.toMatch(/border-radius:\s*(?:[1-9]\d*px|999px)/);
  });

  it('shows a guided first-import state and uses concise acquisition badges', () => {
    expect(managerSource).toContain('cardPackWelcomeImport');
    expect(managerSource).toContain('支持的内容');
    expect(managerSource).toContain('文件格式');
    expect(managerSource).toContain('导入行为');
    expect(managerSource).not.toContain('支持 .json 格式文件');
    expect(managerSource).not.toContain('导入 JSON 卡包后，资源会立即接入车卡流程。');
    expect(managerSource).toContain('<span>初始资源</span>');
    expect(managerSource).toContain("resource.entryKind === 'resource'");
    expect(managerSource).toContain("? fateKindLabels[entry.kind] || '天赋 / 天谴'");
    expect(managerSource).toContain('getPackItemCount(pack)');
    expect(managerSource).not.toContain('初始自带');
    expect(managerSource).not.toContain('境界可选');
  });

  it('keeps the selected pack heading free of technical ID and description copy', () => {
    expect(managerSource).not.toContain('<span>{selectedPack.id}</span>');
    expect(managerSource).not.toContain("selectedPack.description || '这个卡包没有填写说明。'");
  });

  it('pins the main layout to the flexible final grid row with or without errors', () => {
    expect(cssSource).toMatch(/\.cardPackHeader\s*\{[^}]*grid-row:\s*1/s);
    expect(cssSource).toMatch(/\.cardPackErrors\s*\{[^}]*grid-row:\s*2/s);
    expect(cssSource).toMatch(/\.cardPackLayout\s*\{[^}]*grid-row:\s*3/s);
  });
});
