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
