import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const dataIndexSource = readFileSync(new URL('./data/index.js', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

describe('legacy build guide removal', () => {
  it('does not keep the old build guide UI or data wiring', () => {
    expect(mainSource).not.toContain('BuildGuidePopover');
    expect(mainSource).not.toContain('buildGuideSteps');
    expect(mainSource).not.toContain('guideOpen');
    expect(mainSource).not.toContain('建卡指引');
    expect(dataIndexSource).not.toContain('buildGuide');
    expect(cssSource).not.toContain('buildGuide');
  });
});
