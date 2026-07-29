import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const marketplaceCss = readFileSync(new URL('./resourceMarketplace.css', import.meta.url), 'utf8');

describe('resource marketplace card layout', () => {
  it('uses three desktop columns with responsive two- and one-column fallbacks', () => {
    expect(marketplaceCss).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(marketplaceCss).toContain('@media (max-width: 900px)');
    expect(marketplaceCss).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(marketplaceCss).toContain('@media (max-width: 700px)');
    expect(marketplaceCss).toContain('grid-template-columns: 1fr');
  });
});
