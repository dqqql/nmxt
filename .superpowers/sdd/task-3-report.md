Status: DONE

Task summary:
- Updated `src/main.jsx` only for product code changes, replacing the `/guide` placeholder with a full guided-card flow.
- Added local guide UI components in `src/main.jsx`: `GuideStepNav`, `GuideInfoStep`, `GuideOptionStep`, `GuideAttributeStep`, `GuideFateStep`, and `GuidePreviewStep`.
- Implemented guided draft persistence per active save slot via `GUIDED_DRAFTS_KEY`, including step navigation, value updates, attribute updates, and preview error state.
- Implemented the required final-step actions: `随机生成` uses `createRandomCardState` + `mergeRandomCardIntoGuideDraft`, and `确认` validates with `validateGuideValues`, builds the result via `createGuidedCardResult`, writes `GUIDED_RESULT_KEY`, clears the draft, and returns to `/`.
- Matched the brief's required preview selection computation and page shell/footer structure.
- Passed `now: () => new Date()` when confirming so the existing `createGuidedCardResult` helper receives the timestamp factory it currently requires.

Build / verification:
1. `npm run build` -> PASS
2. Vite emitted the existing `lucide-react` "use client" bundling notices, but the production build completed successfully.

Commit:
- `bef289c feat: add guided card builder page`

Concerns:
- None.

Fix report append:
- Removed the guided-result apply effect's `setActiveSlot(null)` call in `src/main.jsx`, so consuming `GUIDED_RESULT_KEY` no longer writes `CARD_ACTIVE_SAVE_SLOT_KEY = null` or clears the active save-slot context on return to the main page.
- Kept questionnaire and other existing active-slot clearing paths unchanged.
- Fixed `GuideOptionStep` preview priority so hover/focus state now takes precedence over the selected value, and the panel falls back to the selected option, then index `0`, when no option is actively hovered/focused.

Build / verification:
- `npm run build` -> PASS

Notes:
- Vite still reports the existing `lucide-react` `"use client"` bundling warnings during build, but the build completes successfully.

Task 3 re-review fix:
- Root cause: guided-page `随机生成` was calling `createRandomCardState`, but `mergeRandomCardIntoGuideDraft` only persisted selections / attributes / fate. The random `drawnTalents` payload was dropped from the guide draft.
- Fixed `src/guidedCardState.js` so guide draft values now include normalized `drawnTalents` with a default empty array, random merge persists `randomState.drawnTalents`, and `createGuidedCardResult` prefers the saved draft `drawnTalents` before falling back to the existing fate-plan redraw path.
- Added regression coverage in `src/guidedCardState.test.js` proving random merge preserves `drawnTalents` and guided confirm reuses the saved random result instead of re-running `drawPlan`.

Task 3 stale random talents fix:
- Root cause: after the earlier fix started persisting `drawnTalents`, guided confirm always reused any saved random talents whenever `values.drawnTalents.length > 0`, even if the user later changed `因果值` via the step nav. That let stale random talents / 天谴 override the current fate on confirm.
- Fixed `src/guidedCardState.js` by adding a normalized `drawnTalentsFateValue` marker to guide draft values, storing the random state's `fateValue` alongside `drawnTalents` in `mergeRandomCardIntoGuideDraft`, and reusing saved `drawnTalents` in `createGuidedCardResult` only when the saved marker still matches the current `values.fateValue`; otherwise it falls back to the current fate's `drawPlan`.
- Updated `src/guidedCardState.test.js` to cover both branches: saved random talents are preserved when `fateValue` is unchanged, and stale saved talents are ignored when `fateValue` changes so the current fate plan is redrawn.

Build / verification:
- `npm test -- src/guidedCardState.test.js` -> PASS
- `npm run build` -> PASS

Notes:
- Vite still reports the existing `lucide-react` `"use client"` bundling warnings during build, but the build completes successfully.
