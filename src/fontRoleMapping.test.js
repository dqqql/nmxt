import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const styleSource = fs.readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const mainSource = fs.readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

describe('legacy font roles in the redesigned layout', () => {
  it('embeds the requested fonts and keeps local aliases as fallbacks', () => {
    expect(styleSource).toContain('url("/fonts/kinghwa-old-song.woff2") format("woff2")');
    expect(styleSource).toContain('url("/fonts/jiangxi-zhuokai-2.0.woff2") format("woff2")');
    expect(styleSource).toContain('--font-old-song: "Niming KingHwa OldSong", "_KingHwa_OldSong"');
    expect(styleSource).toContain('--font-jiangcheng-kai: "Niming Jiangxi Zhuokai", "江城楷", "江西拙楷2.0"');
    expect(fs.existsSync(new URL('../public/fonts/kinghwa-old-song.woff2', import.meta.url))).toBe(true);
    expect(fs.existsSync(new URL('../public/fonts/jiangxi-zhuokai-2.0.woff2', import.meta.url))).toBe(true);
  });

  it('maps labels and every redesigned card name to Jinghua Old Song', () => {
    expect(styleSource).toMatch(/\.fieldLabel,[\s\S]*?\.pageTwoCard h3 \{\s*font-family: var\(--font-old-song\);/);
    expect(mainSource).toContain('className="originEffectPanel"');
  });

  it('maps all redesigned large card bodies and matching explanatory copy to Jiangcheng Kai', () => {
    expect(styleSource).toMatch(/\.fortuneCounterBox \.counterNote,[\s\S]*?\.pageTwoCardText \{\s*font-family: var\(--font-jiangcheng-kai\);/);
  });
});
