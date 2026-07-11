import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function ruleBodies(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(cssSource.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')))
    .map((match) => match[1]);
}

describe('browser print page dimensions', () => {
  it('keeps the screen sheet compact and gives every printed sheet the full A4 source height', () => {
    expect(ruleBodies('.sheet').some((body) => body.includes('height: 990px'))).toBe(true);
    expect(ruleBodies('.printPage .sheetPageOne')).toEqual([
      expect.stringContaining('height: 1245px !important'),
    ]);
    expect(ruleBodies('.printPage .pdfSheet')).toEqual([
      expect.stringContaining('height: 1245px !important'),
    ]);
  });
});
