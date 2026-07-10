# Guided Card Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent `/guide` step-by-step card builder that persists per-save progress, previews the character vertically, confirms back into the main sheet, and moves random generation to the guide preview page.

**Architecture:** Put all guide data shaping in a pure `src/guidedCardState.js` module with Vitest coverage. Keep the route and UI in `src/main.jsx` to match the existing single-file app structure, using small local components for the guide page. Reuse existing card data, `createRandomCardState`, `fateValueToTitle`, `drawByPlan`, and the main app result-consumption pattern already used by `/wj`.

**Tech Stack:** React, Vite, Vitest, localStorage, existing CSS in `src/style.css`, lucide-react icons.

## Global Constraints

- `/guide` is an independent page, selected by `window.location.pathname`.
- Main toolbar adds “引导车卡” below “问卷车卡”.
- Main toolbar no longer shows “随机生成”.
- Guide steps are exactly: 信息、出身、分配属性、道源、法门、大道、因果值、预览确认.
- Last guide page shows “随机生成” next to “确认”.
- Random generation keeps the existing card-body behavior from `createRandomCardState`.
- After random generation, the user can jump through the top progress bar to revise individual steps.
- Draft progress persists by active save slot; no active slot uses `slot:default`.
- Confirming clears only the current guide draft and returns to `/`.
- Existing `/wj` questionnaire behavior remains unchanged.
- Existing five-page formal sheet and print export layout remain unchanged.

---

## File Structure

- Create `src/guidedCardState.js`: constants, default draft creation, step clamping, per-slot draft key helpers, draft collection updates, validation, conversion to guide result, random result merging.
- Create `src/guidedCardState.test.js`: pure state tests for every conversion and persistence helper.
- Modify `src/main.jsx`: import guide helpers and icons; add `/guide` route; add `GuidedCardPage` and small guide components; consume guide result in `App`; remove main toolbar random button; add guide toolbar button.
- Modify `src/style.css`: add guide page, step nav, option cards, attribute controls, fate selector, preview pages, mobile responsive styles.
- Modify no data JSON files.

---

### Task 1: Guide State Module

**Files:**
- Create: `src/guidedCardState.test.js`
- Create: `src/guidedCardState.js`

**Interfaces:**
- Consumes: `fateValueToTitle(value)` from `src/randomCardState.js`; option arrays shaped as `{ name, desc, ... }[]`.
- Produces:
  - `GUIDED_DRAFTS_KEY: string`
  - `GUIDED_RESULT_KEY: string`
  - `GUIDE_STEPS: Array<{ id: string, label: string }>`
  - `createEmptyGuideDraft(): GuideDraft`
  - `clampGuideStep(step: number): number`
  - `getGuideDraftSlotKey(activeSlotId?: string | null): string`
  - `getGuideDraft(drafts: object, activeSlotId?: string | null): GuideDraft`
  - `setGuideDraft(drafts: object, activeSlotId: string | null, draft: GuideDraft): object`
  - `clearGuideDraft(drafts: object, activeSlotId?: string | null): object`
  - `validateGuideValues(values: GuideValues): Array<{ field: string, step: number, message: string }>`
  - `createGuidedCardResult({ draft, options, fateDraws, drawPlan, defaultRealmIndex, getFateState, now }): GuidedResult`
  - `mergeRandomCardIntoGuideDraft(draft, randomState): GuideDraft`

- [ ] **Step 1: Write failing tests**

Create `src/guidedCardState.test.js` with these tests:

```js
import { describe, expect, it } from 'vitest';
import {
  clearGuideDraft,
  clampGuideStep,
  createEmptyGuideDraft,
  createGuidedCardResult,
  getGuideDraft,
  getGuideDraftSlotKey,
  mergeRandomCardIntoGuideDraft,
  setGuideDraft,
  validateGuideValues,
} from './guidedCardState';

const options = {
  realm: [{ name: '练气前期' }, { name: '筑基前期' }],
  origin: [{ name: '宗门弟子' }, { name: '寒门学子' }],
  source: [{ name: '木道源' }, { name: '火道源' }],
  method: [{ name: '剑修' }, { name: '法修' }],
  dao: [{ name: '守正之道' }, { name: '修罗之道' }],
};

const fateDraws = {
  平平无奇: [{ label: '一凡阶天赋', items: [] }],
  天命贰: [{ label: '二地阶天赋', items: [] }],
};

describe('guided card state', () => {
  it('creates an empty draft with the first step and blank guide values', () => {
    expect(createEmptyGuideDraft()).toEqual({
      version: 1,
      step: 0,
      values: {
        name: '',
        race: '',
        belong: '',
        daoHeart: '',
        identity: '',
        origin: null,
        attributes: {
          仙躯: '',
          身法: '',
          神魂: '',
          灵蕴: '',
        },
        coreAttribute: null,
        source: null,
        method: null,
        dao: null,
        fateValue: 0,
      },
    });
  });

  it('clamps guide steps to the configured range', () => {
    expect(clampGuideStep(-4)).toBe(0);
    expect(clampGuideStep(3)).toBe(3);
    expect(clampGuideStep(99)).toBe(7);
  });

  it('separates draft slots by active save slot and falls back to default', () => {
    expect(getGuideDraftSlotKey(null)).toBe('slot:default');
    expect(getGuideDraftSlotKey('abc')).toBe('slot:abc');
    const empty = createEmptyGuideDraft();
    const draft = { ...empty, step: 4 };
    const withDraft = setGuideDraft({}, 'abc', draft);
    expect(getGuideDraft(withDraft, 'abc').step).toBe(4);
    expect(getGuideDraft(withDraft, null).step).toBe(0);
  });

  it('clears only the selected draft slot', () => {
    const one = { ...createEmptyGuideDraft(), step: 2 };
    const two = { ...createEmptyGuideDraft(), step: 5 };
    const drafts = setGuideDraft(setGuideDraft({}, null, one), 'abc', two);
    expect(clearGuideDraft(drafts, null)).toEqual({ 'slot:abc': two });
  });

  it('validates required selections, integer attributes, and fate range', () => {
    const draft = createEmptyGuideDraft();
    const errors = validateGuideValues({
      ...draft.values,
      attributes: { 仙躯: '3', 身法: 'x', 神魂: '', 灵蕴: '0' },
      fateValue: 5,
    });
    expect(errors.map((error) => error.field)).toEqual([
      'origin',
      'attributes.身法',
      'attributes.神魂',
      'source',
      'method',
      'dao',
      'fateValue',
    ]);
  });

  it('creates a main-sheet compatible result from a valid guide draft', () => {
    const draft = {
      ...createEmptyGuideDraft(),
      values: {
        ...createEmptyGuideDraft().values,
        name: '李青',
        race: '人族',
        belong: '青云观',
        daoHeart: '不负此生',
        identity: '外门弟子',
        origin: 1,
        attributes: { 仙躯: '3', 身法: '2', 神魂: '1', 灵蕴: '0' },
        coreAttribute: '仙躯',
        source: 1,
        method: 1,
        dao: 1,
        fateValue: 2,
      },
    };
    const draws = [];
    const result = createGuidedCardResult({
      draft,
      options,
      fateDraws,
      drawPlan: (plan) => {
        draws.push(plan.label);
        return [{ name: '天眷', kind: 'talent' }];
      },
      defaultRealmIndex: 0,
      getFateState: (title) => ({ diceEffects: [`dice:${title}`] }),
      now: () => new Date('2026-07-10T00:00:00.000Z'),
    });

    expect(result.createdAt).toBe('2026-07-10T00:00:00.000Z');
    expect(result.snapshot.selections).toEqual({
      realm: 0,
      origin: 1,
      source: 1,
      method: 1,
      dao: 1,
    });
    expect(result.snapshot.texts).toMatchObject({
      name: '李青',
      race: '人族',
      belong: '青云观',
      daoHeart: '不负此生',
      identity: '外门弟子',
    });
    expect(result.snapshot.attributes).toEqual({ 仙躯: '3', 身法: '2', 神魂: '1', 灵蕴: '0' });
    expect(result.snapshot.coreAttribute).toBe('仙躯');
    expect(result.snapshot.selectedFateTitle).toBe('天命贰');
    expect(result.snapshot.diceEffects).toEqual(['dice:天命贰']);
    expect(result.snapshot.drawnTalents).toEqual([{ name: '天眷', kind: 'talent' }]);
    expect(draws).toEqual(['二地阶天赋']);
  });

  it('merges random card state back into a guide draft while keeping basic text', () => {
    const draft = {
      ...createEmptyGuideDraft(),
      values: { ...createEmptyGuideDraft().values, name: '旧名' },
    };
    const next = mergeRandomCardIntoGuideDraft(draft, {
      selections: { realm: 0, origin: 1, source: 0, method: 1, dao: 0 },
      attributes: { 仙躯: '0', 身法: '1', 神魂: '2', 灵蕴: '3' },
      fateValue: -1,
    });
    expect(next.values.name).toBe('旧名');
    expect(next.values.origin).toBe(1);
    expect(next.values.source).toBe(0);
    expect(next.values.method).toBe(1);
    expect(next.values.dao).toBe(0);
    expect(next.values.attributes).toEqual({ 仙躯: '0', 身法: '1', 神魂: '2', 灵蕴: '3' });
    expect(next.values.fateValue).toBe(-1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/guidedCardState.test.js`

Expected: FAIL because `src/guidedCardState.js` does not exist.

- [ ] **Step 3: Implement the pure state module**

Create `src/guidedCardState.js` with the exported constants and functions named above. Use these exact details:

```js
import { fateValueToTitle } from './randomCardState';

export const GUIDED_DRAFTS_KEY = 'nmxt.guidedCard.drafts.v1';
export const GUIDED_RESULT_KEY = 'nmxt.guidedCard.result.v1';

export const GUIDE_STEPS = [
  { id: 'info', label: '信息' },
  { id: 'origin', label: '出身' },
  { id: 'attributes', label: '分配属性' },
  { id: 'source', label: '道源' },
  { id: 'method', label: '法门' },
  { id: 'dao', label: '大道' },
  { id: 'fate', label: '因果值' },
  { id: 'preview', label: '预览确认' },
];

const attributeTitles = ['仙躯', '身法', '神魂', '灵蕴'];
const textFields = ['name', 'race', 'belong', 'daoHeart', 'identity'];
const selectionFields = ['origin', 'source', 'method', 'dao'];
const selectionSteps = { origin: 1, source: 3, method: 4, dao: 5 };

export function createEmptyGuideDraft() {
  return {
    version: 1,
    step: 0,
    values: {
      name: '',
      race: '',
      belong: '',
      daoHeart: '',
      identity: '',
      origin: null,
      attributes: Object.fromEntries(attributeTitles.map((title) => [title, ''])),
      coreAttribute: null,
      source: null,
      method: null,
      dao: null,
      fateValue: 0,
    },
  };
}

export function clampGuideStep(step) {
  const numeric = Number.isFinite(Number(step)) ? Math.trunc(Number(step)) : 0;
  return Math.min(Math.max(numeric, 0), GUIDE_STEPS.length - 1);
}
```

Implement the rest by normalizing any malformed draft against `createEmptyGuideDraft()`. `createGuidedCardResult` must return:

```js
{
  version: 1,
  createdAt: now().toISOString(),
  snapshot: {
    selections: {
      realm: defaultRealmIndex,
      origin: values.origin,
      source: values.source,
      method: values.method,
      dao: values.dao,
    },
    texts,
    attributes,
    coreAttribute,
    selectedFateTitle,
    diceEffects: getFateState(selectedFateTitle).diceEffects,
    drawnTalents,
    thresholdBonuses: { all: 0, bodyMedium: 0, soulMedium: 0, bodyHeavy: 0, soulHeavy: 0 },
    upgradeChoices: [],
    maxRealmIndexReached: defaultRealmIndex,
  },
}
```

Pick the first plan from `fateDraws[selectedFateTitle]` and call `drawPlan(plan)` when present.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/guidedCardState.test.js`

Expected: PASS for all guide state tests.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/guidedCardState.js src/guidedCardState.test.js
git commit -m "feat: add guided card state helpers"
```

---

### Task 2: Main App Routing, Toolbar Entry, and Result Consumption

**Files:**
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes from Task 1: `GUIDED_DRAFTS_KEY`, `GUIDED_RESULT_KEY`, `clearGuideDraft`, `createGuidedCardResult`, `getGuideDraft`, `setGuideDraft`, `GUIDE_STEPS`, `validateGuideValues`, `mergeRandomCardIntoGuideDraft`.
- Produces: `/guide` route, main toolbar “引导车卡”, main app consumption of `GUIDED_RESULT_KEY`.

- [ ] **Step 1: Write a temporary failing assertion through build**

Before implementation, run: `npm run build`

Expected: PASS before changes. This is the baseline; after adding imports and route, every later build must keep passing.

- [ ] **Step 2: Update imports**

In `src/main.jsx`, add `Map` or `Route` from `lucide-react` for the guide button and import Task 1 helpers:

```js
import { ChevronRight, CircleAlert, Info, ListChecks, Map, Minus, Plus, Printer, Save, Settings, Shuffle, Star, Trash2, X } from 'lucide-react';
import {
  GUIDE_STEPS,
  GUIDED_DRAFTS_KEY,
  GUIDED_RESULT_KEY,
  clearGuideDraft,
  clampGuideStep,
  createEmptyGuideDraft,
  createGuidedCardResult,
  getGuideDraft,
  mergeRandomCardIntoGuideDraft,
  setGuideDraft,
  validateGuideValues,
} from './guidedCardState';
```

- [ ] **Step 3: Consume guide result in `App`**

Add a `useEffect` beside the existing questionnaire result effect. It must read `GUIDED_RESULT_KEY`, apply `snapshot`, remove the result key, and show “引导车卡完成！”.

Required setter behavior:

```js
setSelections({ ...snapshot.selections, realm: defaultRealmIndex });
setTexts({ ...defaultTexts, ...(snapshot.texts || {}) });
setAttributes({ ...defaultAttributes, ...(snapshot.attributes || {}) });
setCoreAttribute(snapshot.coreAttribute || null);
setThresholdBonuses({ ...defaultThresholdBonuses, ...(snapshot.thresholdBonuses || {}) });
setUpgradeChoices(snapshot.upgradeChoices || []);
setMaxRealmIndexReached(snapshot.maxRealmIndexReached ?? defaultRealmIndex);
setRealmHistoryOpen(false);
setActiveSlot(null);
setUpgradePrompt(null);
setAttributeChoicePrompt(null);
setSelectedFateTitle(snapshot.selectedFateTitle || null);
setDiceEffects(snapshot.diceEffects || baseDiceEffects);
setDrawnTalents(snapshot.drawnTalents || []);
setFateDraw(null);
setLibrary(null);
removeStorage(GUIDED_RESULT_KEY);
showNotice('引导车卡完成！', 2200);
```

- [ ] **Step 4: Update toolbar**

Remove the `.randomAction` button block from the main toolbar. Under `.questionnaireAction`, add:

```jsx
<div className="guidedAction">
  <button
    type="button"
    className="toolButton"
    onClick={() => { window.location.href = '/guide'; }}
    aria-label="引导车卡"
    title="引导车卡"
  >
    <Map size={20} strokeWidth={2.2} aria-hidden="true" />
    <span>引导车卡</span>
  </button>
</div>
```

- [ ] **Step 5: Add route selection**

Change the render call at the bottom to:

```jsx
const path = window.location.pathname;

createRoot(document.getElementById('root')).render(
  path === '/wj' ? <QuestionnairePage /> : path === '/guide' ? <GuidedCardPage /> : <App />,
);
```

`GuidedCardPage` can be a temporary minimal component returning `<main className="guideShell">引导车卡</main>` until Task 3 fills it in.

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/main.jsx
git commit -m "feat: add guided card route and toolbar entry"
```

---

### Task 3: Guided Card Page UI and Flow

**Files:**
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: state helpers from Task 1; `readJsonStorage`, `writeJsonStorage`, `removeStorage`, `CARD_ACTIVE_SAVE_SLOT_KEY`, data option arrays, `createRandomCardState`.
- Produces: Fully interactive `GuidedCardPage`.

- [ ] **Step 1: Add guide page component skeleton**

Replace the temporary `GuidedCardPage` with a component using this state shape:

```jsx
function GuidedCardPage() {
  const defaultRealmIndex = getDefaultRealmIndex(realmOptions);
  const activeSlotId = readJsonStorage(CARD_ACTIVE_SAVE_SLOT_KEY, null);
  const [drafts, setDrafts] = useState(() => readJsonStorage(GUIDED_DRAFTS_KEY, {}));
  const [draft, setDraft] = useState(() => getGuideDraft(readJsonStorage(GUIDED_DRAFTS_KEY, {}), activeSlotId));
  const [errors, setErrors] = useState([]);
  const step = clampGuideStep(draft.step);
  const values = draft.values;

  const persistDraft = (updater) => {
    setDraft((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      setDrafts((currentDrafts) => {
        const nextDrafts = setGuideDraft(currentDrafts, activeSlotId, next);
        writeJsonStorage(GUIDED_DRAFTS_KEY, nextDrafts);
        return nextDrafts;
      });
      return next;
    });
  };

  const setStep = (nextStep) => persistDraft((current) => ({ ...current, step: clampGuideStep(nextStep) }));
  const updateValue = (field, value) => persistDraft((current) => ({
    ...current,
    values: { ...current.values, [field]: value },
  }));
  const updateAttribute = (field, value) => persistDraft((current) => ({
    ...current,
    values: {
      ...current.values,
      attributes: { ...current.values.attributes, [field]: value },
    },
  }));

  return <main className="guideShell">...</main>;
}
```

- [ ] **Step 2: Add step navigation**

Add `GuideStepNav`:

```jsx
function GuideStepNav({ step, onStep }) {
  return (
    <nav className="guideStepNav" aria-label="引导车卡步骤">
      {GUIDE_STEPS.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={`${index === step ? 'active' : ''} ${index < step ? 'past' : ''}`.trim()}
          onClick={() => onStep(index)}
          aria-current={index === step ? 'step' : undefined}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <b>{item.label}</b>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Add render function for all steps**

Implement `renderGuideStep()` inside `GuidedCardPage`:

```jsx
const renderGuideStep = () => {
  if (step === 0) return <GuideInfoStep values={values} onChange={updateValue} />;
  if (step === 1) return <GuideOptionStep title="出身" category="origin" options={originOptions} value={values.origin} onChange={(value) => updateValue('origin', value)} />;
  if (step === 2) return <GuideAttributeStep values={values.attributes} coreAttribute={values.coreAttribute} onAttributeChange={updateAttribute} onCoreChange={(value) => updateValue('coreAttribute', value)} />;
  if (step === 3) return <GuideOptionStep title="道源" category="source" options={sourceOptions} value={values.source} onChange={(value) => updateValue('source', value)} />;
  if (step === 4) return <GuideOptionStep title="法门" category="method" options={methodOptions} value={values.method} onChange={(value) => updateValue('method', value)} />;
  if (step === 5) return <GuideOptionStep title="大道" category="dao" options={daoOptions} value={values.dao} onChange={(value) => updateValue('dao', value)} />;
  if (step === 6) return <GuideFateStep value={values.fateValue} onChange={(value) => updateValue('fateValue', value)} />;
  return <GuidePreviewStep values={values} errors={errors} onErrorStep={setStep} onRandom={handleRandomGuide} onConfirm={handleConfirmGuide} />;
};
```

- [ ] **Step 4: Add info, option, attribute, fate, and preview components**

Implement these local components in `src/main.jsx` before `GuidedCardPage`:

- `GuideInfoStep`: controlled text inputs for `name`, `race`, `belong`, `daoHeart`, `identity`.
- `GuideOptionStep`: card grid for option arrays; detail card shows `desc`, `effect`, `ability`, `buff`, `bodyThreshold`, `soulThreshold`, first two `attackBuffs`, first two `insights` where present.
- `GuideAttributeStep`: four numeric inputs and core attribute star toggle.
- `GuideFateStep`: seven buttons for `-3..3`, each showing value and `fateValueToTitle(value)`.
- `GuidePreviewStep`: vertical A4-like preview cards and action buttons.

`GuidePreviewStep` must compute selected records with:

```js
const selected = {
  origin: values.origin != null ? originOptions[values.origin] : null,
  source: values.source != null ? sourceOptions[values.source] : null,
  method: values.method != null ? methodOptions[values.method] : null,
  dao: values.dao != null ? daoOptions[values.dao] : null,
  fateTitle: fateValueToTitle(values.fateValue),
};
```

- [ ] **Step 5: Add random handler**

Inside `GuidedCardPage`, add:

```js
const handleRandomGuide = () => {
  const result = createRandomCardState({
    options: {
      realm: realmOptions,
      origin: originOptions,
      source: sourceOptions,
      method: methodOptions,
      dao: daoOptions,
    },
    fateDraws,
    drawPlan: drawByPlan,
  });
  persistDraft((current) => mergeRandomCardIntoGuideDraft({ ...current, step: GUIDE_STEPS.length - 1 }, result));
  setErrors([]);
};
```

- [ ] **Step 6: Add confirm handler**

Inside `GuidedCardPage`, add:

```js
const handleConfirmGuide = () => {
  const nextErrors = validateGuideValues(values);
  setErrors(nextErrors);
  if (nextErrors.length > 0) return;

  const result = createGuidedCardResult({
    draft,
    options: {
      realm: realmOptions,
      origin: originOptions,
      source: sourceOptions,
      method: methodOptions,
      dao: daoOptions,
    },
    fateDraws,
    drawPlan: drawByPlan,
    defaultRealmIndex,
    getFateState,
  });
  writeJsonStorage(GUIDED_RESULT_KEY, result);
  const nextDrafts = clearGuideDraft(drafts, activeSlotId);
  writeJsonStorage(GUIDED_DRAFTS_KEY, nextDrafts);
  window.location.href = '/';
};
```

- [ ] **Step 7: Add page shell and footer**

`GuidedCardPage` must return:

```jsx
<main className="guideShell">
  <section className="guidePaper">
    <header className="guideHeader">
      <div>
        <span className="guideKicker">逆命仙途</span>
        <h1>引导车卡</h1>
      </div>
      <button type="button" className="questionnaireBack" onClick={() => { window.location.href = '/'; }}>
        返回主界面
      </button>
    </header>
    <GuideStepNav step={step} onStep={setStep} />
    <div className="guideBody">{renderGuideStep()}</div>
  </section>
  <footer className="guideFooter">
    <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0}>上一步</button>
    <span>{step + 1} / {GUIDE_STEPS.length}</span>
    {step < GUIDE_STEPS.length - 1 ? (
      <button type="button" onClick={() => setStep(step + 1)}>下一步</button>
    ) : null}
  </footer>
</main>
```

- [ ] **Step 8: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```powershell
git add src/main.jsx
git commit -m "feat: add guided card builder page"
```

---

### Task 4: Guided Page Styling and Responsive Polish

**Files:**
- Modify: `src/style.css`

**Interfaces:**
- Consumes class names from Task 3.
- Produces: UI matching the current project: gray page background, white paper, dark headers/buttons, green action accents, square-ish cards.

- [ ] **Step 1: Add guide CSS**

Append a new section before the existing `@media print` block:

```css
.guidedAction {
  position: relative;
}

.guideShell {
  min-height: 100vh;
  padding: 24px 18px 86px;
  background: var(--bg);
  color: var(--ink);
}

.guidePaper {
  width: min(1080px, 100%);
  margin: 0 auto;
  border: 1px solid #cfcac6;
  background: #fff;
  box-shadow: 0 18px 44px #00000018;
}

.guideHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 26px;
  border-bottom: 1px solid #ded9d5;
  background: #fbfaf8;
}

.guideKicker {
  display: block;
  margin-bottom: 7px;
  color: #16864d;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

.guideHeader h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.05;
  letter-spacing: 0;
}
```

Continue the same section with concrete styles for:

- `.guideStepNav`
- `.guideBody`
- `.guideSectionHeader`
- `.guideFormGrid`
- `.guideField`
- `.guideOptionLayout`
- `.guideOptionList`
- `.guideOptionCard`
- `.guideDetailCard`
- `.guideAttributeGrid`
- `.guideCoreButton`
- `.guideFateGrid`
- `.guidePreviewStack`
- `.guidePreviewPage`
- `.guidePreviewGrid`
- `.guidePreviewBlock`
- `.guidePreviewActions`
- `.guideErrors`
- `.guideFooter`

Use `border-radius: 8px` or less. Use no gradient-orb decoration. Keep text wrapping with `min-width: 0`, `overflow-wrap: anywhere`, and `line-height: 1.45`.

- [ ] **Step 2: Add mobile CSS**

Add:

```css
@media (max-width: 760px) {
  .guideShell {
    padding: 12px 10px 92px;
  }

  .guideHeader {
    flex-direction: column;
    align-items: stretch;
    padding: 20px 18px;
  }

  .guideStepNav,
  .guideFormGrid,
  .guideOptionLayout,
  .guideAttributeGrid,
  .guideFateGrid,
  .guidePreviewGrid {
    grid-template-columns: 1fr;
  }

  .guideFooter {
    left: 0;
    right: 0;
    width: auto;
  }
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/style.css
git commit -m "style: polish guided card builder"
```

---

### Task 5: Final Verification

**Files:**
- Verify only; edit prior task files if failures appear.

**Interfaces:**
- Confirms all requirements from the design spec.

- [ ] **Step 1: Run full tests**

Run: `npm test`

Expected: PASS for all test files.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 4: Manual browser verification**

Open `/`, `/guide`, and `/wj`. Verify:

- Main toolbar shows “问卷车卡” and “引导车卡”.
- Main toolbar does not show “随机生成”.
- `/guide` loads the guide page.
- Fill information, move to step 3, return to `/`, then revisit `/guide`; the draft resumes at step 3.
- Select origin/source/method/dao, attributes, and fate; preview shows the selected records in vertical blocks.
- Click “随机生成” on the preview; preview updates and top progress buttons still allow editing prior steps.
- Click “确认”; app returns to `/`, shows toast “引导车卡完成！”, and main sheet fields are populated.
- `/wj` still loads the questionnaire page.

- [ ] **Step 5: Stop dev server**

Stop the Vite server with `Ctrl+C` in the terminal session.

- [ ] **Step 6: Commit any verification fixes**

If verification required code changes, commit them:

```powershell
git add src
git commit -m "fix: verify guided card builder flow"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: route, toolbar entry, random relocation, per-slot draft persistence, guide steps, preview, confirmation, and main-page result consumption are covered by Tasks 1-5.
- No deferred backend, print-layout, or questionnaire changes are included.
- Type consistency: all helper names used by UI tasks are produced by Task 1.
- Test-first: Task 1 begins with failing Vitest coverage before production helper code. UI tasks use build baselines and final manual verification because the project currently has no React component test harness.
