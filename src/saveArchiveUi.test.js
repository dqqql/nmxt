import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function functionBody(name) {
  const start = mainSource.indexOf(`function ${name}`);
  const end = mainSource.indexOf('\nfunction ', start + 1);
  return mainSource.slice(start, end < 0 ? undefined : end);
}

describe('save archive UI', () => {
  it('offers an explicit edit flow alongside switching and deleting', () => {
    const modal = functionBody('SaveArchiveModal');

    expect(modal).toContain('>\n                      切换\n');
    expect(modal).toContain('>\n                      编辑\n');
    expect(modal).toContain('>\n                      保存名称\n');
    expect(modal).toContain('>\n                      取消\n');
    expect(modal).toContain('className="saveDeleteButton"');
  });

  it('only persists a non-empty trimmed name and supports keyboard confirmation', () => {
    const modal = functionBody('SaveArchiveModal');

    expect(modal).toContain('const nextName = draftName.trim()');
    expect(modal).toContain('renameSlot(editingSlotId, nextName)');
    expect(modal).toContain("event.key === 'Enter'");
    expect(modal).toContain("event.key === 'Escape'");
    expect(modal).toContain('disabled={!draftName.trim()}');
  });

  it('shows a stable, truncated name until the user enters edit mode', () => {
    const modal = functionBody('SaveArchiveModal');

    expect(modal).toContain('<strong className="saveSlotName">{slot.name}</strong>');
    expect(modal).toContain('editingSlotId === slot.id');
    expect(cssSource).toMatch(/\.saveSlotName\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s);
  });
});
