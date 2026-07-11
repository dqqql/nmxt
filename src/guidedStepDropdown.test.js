import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function functionBody(name) {
  const start = mainSource.indexOf(`function ${name}`);
  const end = mainSource.indexOf(`function `, start + 1);
  return mainSource.slice(start, end);
}

describe('guided option dropdown selection', () => {
  it('uses an upper native select instead of the left option card grid', () => {
    const guideOptionStep = functionBody('GuideOptionStep');

    expect(guideOptionStep).toContain('<select');
    expect(guideOptionStep).toContain('className="guideOptionSelect"');
    expect(guideOptionStep).toContain('onChange={(event) => onChange(Number(event.target.value))}');
    expect(guideOptionStep).not.toContain('className={`guideOptionCard');
    expect(cssSource).toContain('.guideOptionSelect');
  });

  it('keeps the detail panel empty until an option is selected', () => {
    const guideOptionStep = functionBody('GuideOptionStep');

    expect(guideOptionStep).toContain('const hasSelection = value !== null && value !== undefined && value !== \'\';');
    expect(guideOptionStep).toContain('const detail = hasSelection ? options[Number(value)] || null : null;');
    expect(guideOptionStep).not.toContain('value ?? 0');
    expect(guideOptionStep).not.toContain('options[0]');
    expect(guideOptionStep).not.toContain('暂无可展示内容。');
  });
});
