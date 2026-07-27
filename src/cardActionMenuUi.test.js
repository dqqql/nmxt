import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const componentSource = readFileSync(new URL('./CardActionMenu.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

describe('card action menu interaction', () => {
  it('opens from the full-card trigger and closes from outside or Escape', () => {
    expect(componentSource).toContain('className="cardActionTrigger"');
    expect(componentSource).toContain('aria-haspopup="menu"');
    expect(componentSource).toContain("event.key === 'Escape'");
    expect(componentSource).toContain("document.addEventListener('pointerdown', closeFromOutside)");
  });

  it('lifts interactive cards and respects reduced motion', () => {
    expect(cssSource).toMatch(/\.interactiveCardSurface:hover,[\s\S]*transform:\s*translateY\(-3px\)/);
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('offers Add on empty managed slots and collects a title and content', () => {
    expect(mainSource).toContain("label: '添加'");
    expect(mainSource).toContain('function ManualCardModal()');
    expect(mainSource).toContain('<span>标题</span>');
    expect(mainSource).toContain('<span>内容</span>');
    expect(mainSource).toContain('disabled={!ready}');
    expect(mainSource).toContain('手动卡 · 不参与自动生成');
  });
});
