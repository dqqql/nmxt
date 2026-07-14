import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import PageSix from './PageSix';

const componentSource = readFileSync(new URL('./PageSix.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./pageSix.css', import.meta.url), 'utf8');

describe('static sixth sheet page', () => {
  it('renders the shared card heading and all six static libraries', () => {
    expect(PageSix).toBeTypeOf('function');
    expect(componentSource).toContain("import gameLogo from './assets/game-logo.png'");
    expect(componentSource).toContain('角色卡 - 基础信息');

    ['神通库', '感悟库', '秘法库', '本源感悟库', '储物袋', '魂海额外记录库'].forEach((title) => {
      expect(componentSource).toContain(`title: '${title}'`);
    });

    expect(componentSource).not.toMatch(/<(input|textarea|button|select)\b/);
  });

  it('keeps the requested row counts and only shows column headings in the upper four libraries', () => {
    expect(componentSource.match(/rowCount: 4/g)).toHaveLength(4);
    expect(componentSource.match(/rowCount: 2/g)).toHaveLength(2);
    expect(componentSource.match(/showHeader: true/g)).toHaveLength(4);
    expect(componentSource.match(/showHeader: false/g)).toHaveLength(2);
    expect(componentSource).toContain('<span>名称</span>');
    expect(componentSource).toContain('<span>效果</span>');
  });

  it('uses a two-column, three-level layout on the existing print canvas', () => {
    expect(cssSource).toMatch(/\.pageSixSheet\s*\{[^}]*width:\s*1760px;[^}]*height:\s*1245px;/s);
    expect(cssSource).toMatch(/\.pageSixBody\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s);
    expect(cssSource).toMatch(/\.pageSixBody\s*\{[^}]*grid-template-rows:\s*405px 264px minmax\(0, 1fr\);/s);
    expect(cssSource).toContain('"spells insights"');
    expect(cssSource).toContain('"arts originInsights"');
    expect(cssSource).toContain('"storage soulSea"');
    expect(cssSource).toMatch(/\.pageSixBody\s*\{[^}]*gap:\s*0 44px;/s);
  });

  it('keeps all page-specific CSS scoped to pageSix selectors or print media', () => {
    const selectorLines = cssSource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('.'));

    selectorLines.forEach((selector) => {
      expect(selector).toMatch(/^\.pageSix/);
    });
  });
});
