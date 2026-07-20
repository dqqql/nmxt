import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

function sourceBetween(startText, endText) {
  const start = mainSource.indexOf(startText);
  const end = mainSource.indexOf(endText, start + startText.length);
  return mainSource.slice(start, end < 0 ? undefined : end);
}

describe('optional fifth and sixth pages', () => {
  it('defaults extra pages off and persists the explicit preference', () => {
    expect(mainSource).toMatch(/readJsonStorage\(EXTRA_PAGES_ENABLED_KEY,\s*false\)\s*===\s*true/);
    expect(mainSource).toContain('writeJsonStorage(EXTRA_PAGES_ENABLED_KEY, extraPagesEnabled)');
  });

  it('always shows pages one to four and the background tab, adding only pages five and six', () => {
    const visibleTabs = sourceBetween('const visiblePageTabs', 'const printablePageTabs');

    expect(visibleTabs).toContain("page.id === 'background'");
    expect(visibleTabs).toContain("['p1', 'p2', 'p3', 'p4'].includes(page.id)");
    expect(visibleTabs).toContain("extraPagesEnabled && ['p5', 'p6'].includes(page.id)");
    expect(mainSource).toContain('{visiblePageTabs.map((page) => (');
  });

  it('prints only the first four pages by default and never prints the background page', () => {
    const printableTabs = sourceBetween('const printablePageTabs', 'useEffect(() =>');

    expect(printableTabs).toContain("['p1', 'p2', 'p3', 'p4'].includes(page.id)");
    expect(printableTabs).toContain("extraPagesEnabled && ['p5', 'p6'].includes(page.id)");
    expect(printableTabs).not.toContain('background');
    expect(mainSource).toContain('<PrintPageRenderer pages={printablePageTabs} />');
  });

  it('returns to page one if disabling extra pages hides the active tab', () => {
    expect(mainSource).toContain("if (!visiblePageTabs.some((page) => page.id === tab)) setTab('p1')");
  });
});
