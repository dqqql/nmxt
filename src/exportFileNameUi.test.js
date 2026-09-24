import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

describe('character export file names', () => {
  it('uses the character name for JSON and PDF exports', () => {
    expect(mainSource).toContain('fileName: getExportFileName(texts.name)');
    expect(mainSource).toContain('link.download = getCardJsonFileName(texts.name)');
  });
});
