# First Print Page Height Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first character-sheet page fill an A4 landscape print page without changing its screen layout or distorting its contents.

**Architecture:** Keep the existing fixed-width print renderer and its uniform scale. Change only the print-media height override for `.sheetPageOne`, allowing its existing CSS Grid layout to distribute the additional height naturally.

**Tech Stack:** React, CSS print media rules, Vitest, Vite, Chromium PDF printing

## Global Constraints

- The screen version of page one remains `1760 × 990`.
- All five printed pages use a `1760 × 1245` source canvas inside A4 landscape pages.
- Do not apply non-uniform transforms or change pages two through five.

---

### Task 1: Lock the page-height contract with a regression test

**Files:**
- Create: `src/printLayoutCss.test.js`
- Modify: `src/style.css:6298`

**Interfaces:**
- Consumes: the existing `@media screen` and browser-native `@media print` rules in `src/style.css`
- Produces: a regression contract that the screen first page is `990px` high while printed first and PDF pages are `1245px` high

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/printLayoutCss.test.js`

Expected: FAIL because `.printPage .sheetPageOne` still contains `height: 990px !important`.

- [ ] **Step 3: Implement the minimal print-only change**

In `src/style.css`, change only the first-page print override:

```css
.printPage .sheetPageOne {
  height: 1245px !important;
  min-height: 0 !important;
}
```

- [ ] **Step 4: Run focused and full automated verification**

Run: `npm test -- src/printLayoutCss.test.js`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS with no failures.

Run: `npm run build`

Expected: Vite production build succeeds.

- [ ] **Step 5: Verify the real Chromium print output**

Start the Vite app, open it in Chromium, invoke the print action, save to PDF with A4 landscape and no margins, and inspect/render the PDF.

Expected: exactly five A4 landscape pages; page one content extends to the same bottom boundary as pages two through five; no unexpected sixth page or clipping.

- [ ] **Step 6: Commit and push**

```powershell
git add -- src/printLayoutCss.test.js src/style.css docs/superpowers/plans/2026-07-12-first-print-page-height.md
git commit -m "fix: fill first printed character sheet page"
git push origin main
```

Expected: commit succeeds and `origin/main` advances to the new commit.
