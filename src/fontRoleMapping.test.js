import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const styleSource = fs.readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const mainSource = fs.readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const headersSource = fs.readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');

describe('legacy font roles in the redesigned layout', () => {
  it('loads common-character subsets first and keeps complete fonts as fallbacks', () => {
    expect(styleSource).toContain('url("/fonts/kinghwa-old-song-gb2312-ed19104931f9.woff2") format("woff2")');
    expect(styleSource).toContain('url("/fonts/kinghwa-old-song-full-v1.woff2") format("woff2")');
    expect(styleSource).toContain('url("/fonts/jiangxi-zhuokai-2.0-full-v1.woff2") format("woff2")');
    expect(styleSource).toContain('--font-old-song: "Niming KingHwa OldSong Subset", "Niming KingHwa OldSong Full"');
    expect(styleSource).toContain('--font-jiangcheng-kai: "Niming Jiangxi Zhuokai", "江城楷"');
    expect(styleSource).toContain('unicode-range: U+0000-024F');
    for (const filename of [
      'kinghwa-old-song-gb2312-ed19104931f9.woff2',
      'kinghwa-old-song-full-v1.woff2',
      'jiangxi-zhuokai-2.0-full-v1.woff2',
    ]) {
      expect(fs.existsSync(new URL(`../public/fonts/${filename}`, import.meta.url))).toBe(true);
    }

    expect(fs.statSync(new URL('../public/fonts/kinghwa-old-song-gb2312-ed19104931f9.woff2', import.meta.url)).size)
      .toBeLessThan(fs.statSync(new URL('../public/fonts/kinghwa-old-song-full-v1.woff2', import.meta.url)).size);
  });

  it('gives only versioned font binaries a long-lived browser cache', () => {
    expect(headersSource).toContain('/fonts/*.woff2');
    expect(headersSource).toContain('Cache-Control: public, max-age=31556952, immutable');
    expect(headersSource).not.toContain('/fonts/*\n');
  });

  it('maps labels and every redesigned card name to Jinghua Old Song', () => {
    expect(styleSource).toMatch(/\.fieldLabel,[\s\S]*?\.pageTwoCard h3 \{\s*font-family: var\(--font-old-song\);/);
    expect(mainSource).toContain('className="originEffectPanel"');
  });

  it('maps all redesigned large card bodies and matching explanatory copy to Jiangcheng Kai', () => {
    expect(styleSource).toMatch(/\.fortuneCounterBox \.counterNote,[\s\S]*?\.pageTwoCardText \{\s*font-family: var\(--font-jiangcheng-kai\);/);
  });
});
