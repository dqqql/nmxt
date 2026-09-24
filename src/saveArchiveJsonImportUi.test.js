import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

function functionBody(name) {
  const start = mainSource.indexOf(`function ${name}`);
  const end = mainSource.indexOf('\nfunction ', start + 1);
  return mainSource.slice(start, end < 0 ? undefined : end);
}

describe('save archive JSON import', () => {
  it('places the JSON file picker inside the save archive modal', () => {
    const modal = functionBody('SaveArchiveModal');

    expect(modal).toContain('导入 JSON');
    expect(modal).toContain('type="file"');
    expect(modal).toContain('accept=".json,application/json"');
    expect(modal).toContain('function SaveArchiveModal({ onJsonImport })');
    expect(modal).toContain('onChange={onJsonImport}');
  });

  it('creates and activates a named save slot while preserving the current portrait', () => {
    const app = functionBody('App');

    expect(app).toContain('const importedSnapshot = parseCardJson(await file.text())');
    expect(app).toContain('const nextSnapshot = { ...importedSnapshot, portrait }');
    expect(app).toContain('const nextArchive = startNewSaveSlot(saveSlots');
    expect(app).toContain('currentSnapshot: createCardSnapshot()');
    expect(app).toContain('name: importedSnapshot.texts?.name');
    expect(app).toContain('persistSaveSlots(nextArchive.slots)');
    expect(app).toContain('setActiveSlot(nextArchive.activeSlotId)');
    expect(app).toContain('restoreCardSnapshot(nextSnapshot)');
    expect(app).toContain('setSaveOpen(false)');
    expect(app).toContain("showNotice('角色卡导入。')");
  });
});
