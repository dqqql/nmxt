import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const railSource = readFileSync(new URL('./ToolRail.jsx', import.meta.url), 'utf8');

function conditionalMenu(name, nextName) {
  const start = railSource.indexOf(`openMenu === '${name}'`);
  const end = railSource.indexOf(`openMenu === '${nextName}'`, start + 1);
  return railSource.slice(start, end < 0 ? undefined : end);
}

describe('grouped tool rail', () => {
  it('shows the author and official builder credit in the space above the actions', () => {
    const creditIndex = railSource.indexOf('className="toolRailCredit"');
    const firstActionIndex = railSource.indexOf('className="toolRailAction"');

    expect(creditIndex).toBeGreaterThan(-1);
    expect(creditIndex).toBeLessThan(firstActionIndex);
    expect(railSource).toContain('作者：不冻港');
    expect(railSource).toContain('逆命仙途官方车卡器');
  });

  it('uses one active-menu state so opening a menu replaces the previous menu', () => {
    expect(railSource).toContain('const [openMenu, setOpenMenu] = useState(null)');
    expect(railSource).toContain('onClick={() => setOpenMenu(open ? null : menu)}');
    expect(railSource).not.toMatch(/\[settingsOpen,\s*setSettingsOpen\]/);
    expect(railSource).not.toMatch(/\[exportOpen,\s*setExportOpen\]/);
    expect(railSource).not.toMatch(/\[cardOpen,\s*setCardOpen\]/);
  });

  it('keeps settings limited to the extra-page switch', () => {
    const settingsMenu = conditionalMenu('settings', 'export');

    expect(settingsMenu).toContain('额外页面');
    expect(settingsMenu).toContain('role="switch"');
    expect(settingsMenu).toContain('checked={Boolean(extraPagesEnabled)}');
    expect(settingsMenu).toContain('onExtraPagesChange?.(event.target.checked)');
    expect(settingsMenu).not.toContain('JSON');
    expect(settingsMenu).not.toContain('PDF');
  });

  it('offers JSON/PDF under export and exactly three card-building actions', () => {
    const exportMenu = conditionalMenu('export', 'card');
    const cardMenu = conditionalMenu('card', '__missing__');

    expect(exportMenu).toContain('runAndClose(onJsonExport)');
    expect(exportMenu).toContain('onPdfExport?.()');
    expect(exportMenu).toContain('JSON');
    expect(exportMenu).toContain("{exporting ? '准备中' : 'PDF'}");

    expect(cardMenu).toContain('runAndClose(onQuestionnaire)');
    expect(cardMenu).toContain('runAndClose(onGuided)');
    expect(cardMenu).toContain('runAndClose(onRandom)');
    expect(cardMenu.match(/<button type="button"/g)).toHaveLength(3);
  });

  it('closes an expanded menu before opening the save archive modal', () => {
    expect(railSource).toMatch(/setOpenMenu\(null\);\s*onOpenSave\?\.\(\);/s);
  });
});
