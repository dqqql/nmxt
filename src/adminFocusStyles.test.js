import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cssSource = readFileSync(new URL('./adminPage.css', import.meta.url), 'utf8');

describe('admin focus styles', () => {
  it('keeps admin focus rules scoped so they do not add an outer ring to other pages', () => {
    expect(cssSource).not.toMatch(/(^|})\s*(?:button|input|select|textarea):focus-visible/m);
    expect(cssSource).toContain(':is(.adminShell, .adminLoginShell) :is(input, select, textarea):focus-visible');
  });

  it('uses a single inset green focus indicator for admin form controls', () => {
    expect(cssSource).toMatch(
      /:is\(\.adminShell, \.adminLoginShell\) :is\(input, select, textarea\):focus-visible\s*{[^}]*border-color:\s*#16864d;[^}]*outline:\s*2px solid #16864d;[^}]*outline-offset:\s*-2px;/s,
    );
    expect(cssSource).not.toContain('#b6842e');
  });
});
