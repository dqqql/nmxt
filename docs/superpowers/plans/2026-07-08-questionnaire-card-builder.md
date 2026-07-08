# Questionnaire Card Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/wj` as a JSON-driven questionnaire that produces a usable card on the main page.

**Architecture:** Keep vote counting and result-to-card conversion in a pure `src/questionnaireState.js` module with Vitest coverage. Keep questionnaire content in `src/data/questionnaire/`, and render `/wj` from the existing React entry using `window.location.pathname`.

**Tech Stack:** Vite, React, Vitest, lucide-react, localStorage.

## Global Constraints

- Replace the visible “建卡指引” tool action with “问卷车卡”.
- Do not build `/wj/admin`.
- Store questionnaire JSON and README under `src/data/questionnaire/`.
- Questionnaire page is one vertical page with only single-choice and multiple-choice questions.
- Draft answers persist in `localStorage` until submit.
- Submitted questionnaire result redirects to `/` and is consumed once by the main page.
- Questionnaire-generated `仙躯`, `身法`, `神魂`, `灵蕴` values are all `"0"`.
- Use existing random-generation-compatible targets: `realm`, `origin`, `source`, `method`, `dao`, `fate`.

---

## File Structure

- Create `src/questionnaireState.js`: pure helpers for answer validation, vote counting, result creation, and converting result names into main-page state.
- Create `src/questionnaireState.test.js`: Vitest coverage for the pure helpers.
- Create `src/data/questionnaire/questions.json`: editable questionnaire content.
- Create `src/data/questionnaire/README.md`: editor guidance for the JSON file.
- Modify `src/data/index.js`: export questionnaire config.
- Modify `src/main.jsx`: add `/wj` rendering, localStorage flow, tool button navigation, and main-page result consumption.
- Modify `src/style.css`: add questionnaire page styles matching the current app.

## Task 1: Pure Questionnaire State

**Files:**
- Create: `src/questionnaireState.js`
- Create: `src/questionnaireState.test.js`

**Interfaces:**
- Produces: `QUESTIONNAIRE_DRAFT_KEY`, `QUESTIONNAIRE_RESULT_KEY`
- Produces: `createEmptyAnswers(questionnaire): Record<string, string | string[]>`
- Produces: `validateQuestionnaireAnswers(questionnaire, answers): string[]`
- Produces: `resolveQuestionnaireResult({ questionnaire, answers, libraries }): { version: 1, createdAt: string, selections: Record<string, string> }`
- Produces: `createQuestionnaireCardState({ result, options, fateDraws, drawPlan }): { selections, attributes, selectedFateTitle, drawnTalents }`

- [ ] **Step 1: Write failing tests**

Add tests in `src/questionnaireState.test.js` for single-choice voting, multiple-choice voting, tie order, invalid target fallback, and card-state conversion with zero attributes.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/questionnaireState.test.js`
Expected: FAIL because `src/questionnaireState.js` does not exist.

- [ ] **Step 3: Implement minimal helper module**

Implement constants, answer initialization, validation, vote resolution, fallback handling, name-to-index conversion, and zero attributes.

- [ ] **Step 4: Run tests and verify pass**

Run: `npm test -- src/questionnaireState.test.js`
Expected: PASS.

## Task 2: Questionnaire Data

**Files:**
- Create: `src/data/questionnaire/questions.json`
- Create: `src/data/questionnaire/README.md`
- Modify: `src/data/index.js`

**Interfaces:**
- Consumes: existing `realmOptions`, `originOptions`, `sourceOptions`, `methodOptions`, `daoOptions`, `fateDraws` names.
- Produces: `questionnaireConfig` export from `src/data/index.js`.

- [ ] **Step 1: Write data smoke test**

Extend `src/questionnaireState.test.js` to import `questionnaireConfig` and real libraries, then assert the questionnaire resolves all supported keys to known names when using first options.

- [ ] **Step 2: Run test and verify failure**

Run: `npm test -- src/questionnaireState.test.js`
Expected: FAIL because `questionnaireConfig` is not exported yet.

- [ ] **Step 3: Add JSON, README, and export**

Add a compact default questionnaire with questions for `realm`, `origin`, `source`, `method`, `dao`, and `fate`. Document exact-name mapping rules in README.

- [ ] **Step 4: Run test and verify pass**

Run: `npm test -- src/questionnaireState.test.js`
Expected: PASS.

## Task 3: React Integration

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `questionnaireConfig` from `src/data/index.js`.
- Consumes: helpers from `src/questionnaireState.js`.
- Produces: `/wj` page, main toolbar navigation, localStorage draft/result flow.

- [ ] **Step 1: Add UI integration**

In `src/main.jsx`, render `QuestionnairePage` when `window.location.pathname === '/wj'`. Replace the guide action button behavior with `window.location.href = '/wj'`. On main app mount, consume `QUESTIONNAIRE_RESULT_KEY`, apply returned card state, set attributes to zero, clear result, and show “问卷车卡完成！”.

- [ ] **Step 2: Add styles**

In `src/style.css`, add `.questionnaireShell`, `.questionnairePaper`, `.questionnaireQuestion`, `.questionnaireOption`, validation, header, and action styles using current neutral paper colors and green primary action.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all tests pass.

## Task 4: Build and Browser Verification

**Files:**
- Verify only.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified app.

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Vite build succeeds.

- [ ] **Step 2: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`
Expected: local Vite URL is available.

- [ ] **Step 3: Verify in browser**

Visit `/wj`, answer questions, refresh to verify draft persistence, submit, verify redirect to `/`, selected fields are filled, and four attributes are `0`.

- [ ] **Step 4: Inspect git diff**

Run: `git diff --stat`
Expected: only planned files changed.
