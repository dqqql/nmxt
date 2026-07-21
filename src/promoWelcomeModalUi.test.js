import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const componentSource = readFileSync(new URL('./PromoWelcomeModal.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./promoWelcomeModal.css', import.meta.url), 'utf8');

describe('promotional welcome modal', () => {
  it('offers a session acknowledgement and a permanent opt-out', () => {
    expect(componentSource).toContain('我知道了');
    expect(componentSource).toContain('以后不再提示');
    expect(componentSource).toContain('window.sessionStorage, PROMO_ACKNOWLEDGED_KEY');
    expect(componentSource).toContain('window.localStorage, PROMO_DISMISSED_KEY');
  });

  it('is an accessible modal with keyboard handling', () => {
    expect(componentSource).toContain('role="dialog"');
    expect(componentSource).toContain('aria-modal="true"');
    expect(componentSource).toContain("event.key === 'Escape'");
    expect(componentSource).toContain("event.key !== 'Tab'");
    expect(componentSource).toContain('alt="逆命仙途修仙题材 TRPG 规则宣传 Logo"');
  });

  it('fades in with a translucent image and respects reduced motion', () => {
    expect(cssSource).toContain('animation: promoWelcomeFade');
    expect(cssSource).toContain('opacity: 0.82');
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce)');
    expect(cssSource).toContain('@media print');
  });
});
