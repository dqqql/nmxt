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
  applyGuideAttributeValue,
} from './guidedCardState';
import { createEmptySpecialQuestionnaireAnswers } from './specialQuestionnaireState';

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
        specialQuestionnaires: createEmptySpecialQuestionnaireAnswers(),
        fateValue: 0,
        drawnTalents: [],
        drawnTalentsFateValue: null,
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

  it('requires an explicit manual or drawn fate result for the selected guide fate value', () => {
    const values = {
      ...createEmptyGuideDraft().values,
      origin: 0,
      attributes: { 仙躯: '0', 身法: '1', 神魂: '2', 灵蕴: '3' },
      source: 0,
      method: 0,
      dao: 0,
      fateValue: 0,
    };

    expect(validateGuideValues(values, { fateDraws }).map((error) => error.field)).toContain('drawnTalents');
    expect(validateGuideValues({
      ...values,
      drawnTalents: [{ name: '自选天赋', kind: 'talent' }],
      drawnTalentsFateValue: 0,
    }, { fateDraws })).toEqual([]);
  });

  it('automatically marks the attribute assigned 3 as the guide core attribute', () => {
    const values = createEmptyGuideDraft().values;
    const withBodyThree = applyGuideAttributeValue(values, '仙躯', '3');
    const movedToAgility = applyGuideAttributeValue(withBodyThree, '身法', '3');
    const clearedAgility = applyGuideAttributeValue(movedToAgility, '身法', '');

    expect(withBodyThree.coreAttribute).toBe('仙躯');
    expect(movedToAgility.coreAttribute).toBe('身法');
    expect(clearedAgility.coreAttribute).toBe(null);
  });

  it('rejects invalid or blank 仙躯 values during guide validation', () => {
    const draft = createEmptyGuideDraft();

    const invalidErrors = validateGuideValues({
      ...draft.values,
      attributes: { 仙躯: 'not-an-int', 身法: '1', 神魂: '2', 灵蕴: '3' },
    });
    expect(invalidErrors.map((error) => error.field)).toContain('attributes.仙躯');

    const blankErrors = validateGuideValues({
      ...draft.values,
      attributes: { 仙躯: '', 身法: '1', 神魂: '2', 灵蕴: '3' },
    });
    expect(blankErrors.map((error) => error.field)).toContain('attributes.仙躯');
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
        specialQuestionnaires: {
          source: { 火道源: ['火答1', '火答2', '火答3'] },
          method: { 法修: ['法答1', '法答2', '法答3'] },
          dao: { 修罗之道: ['道答1', '道答2', '道答3'] },
        },
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
    expect(result.snapshot.specialQuestionnaires).toEqual({
      source: { 火道源: ['火答1', '火答2', '火答3'] },
      method: { 法修: ['法答1', '法答2', '法答3'] },
      dao: { 修罗之道: ['道答1', '道答2', '道答3'] },
    });
    expect(result.snapshot.attributes).toEqual({ 仙躯: '3', 身法: '2', 神魂: '1', 灵蕴: '0' });
    expect(result.snapshot.coreAttribute).toBe('仙躯');
    expect(result.snapshot.selectedFateTitle).toBe('天命贰');
    expect(result.snapshot.diceEffects).toEqual(['dice:天命贰']);
    expect(result.snapshot.drawnTalents).toEqual([{ name: '天眷', kind: 'talent' }]);
    expect(draws).toEqual(['二地阶天赋']);
  });

  it('normalizes out-of-range selection indexes when creating a guided result', () => {
    const draft = {
      ...createEmptyGuideDraft(),
      values: {
        ...createEmptyGuideDraft().values,
        origin: 99,
        source: null,
        method: 7,
        dao: undefined,
      },
    };

    const result = createGuidedCardResult({
      draft,
      options,
      fateDraws,
      drawPlan: () => [],
      defaultRealmIndex: 8,
      getFateState: () => ({ diceEffects: [] }),
      now: () => new Date('2026-07-10T00:00:00.000Z'),
    });

    expect(result.snapshot.selections).toEqual({
      realm: 0,
      origin: 0,
      source: 0,
      method: 0,
      dao: 0,
    });
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
      drawnTalents: [{ name: '平平无奇-随机结果', kind: 'talent' }],
    });
    expect(next.values.name).toBe('旧名');
    expect(next.values.origin).toBe(1);
    expect(next.values.source).toBe(0);
    expect(next.values.method).toBe(1);
    expect(next.values.dao).toBe(0);
    expect(next.values.attributes).toEqual({ 仙躯: '0', 身法: '1', 神魂: '2', 灵蕴: '3' });
    expect(next.values.specialQuestionnaires).toEqual(createEmptySpecialQuestionnaireAnswers());
    expect(next.values.fateValue).toBe(-1);
    expect(next.values.drawnTalents).toEqual([{ name: '平平无奇-随机结果', kind: 'talent' }]);
    expect(next.values.drawnTalentsFateValue).toBe(-1);
  });

  it('reuses saved drawn talents when fateValue still matches the saved random result', () => {
    const drawPlanCalls = [];
    const draft = {
      ...createEmptyGuideDraft(),
      values: {
        ...createEmptyGuideDraft().values,
        origin: 0,
        attributes: { 仙躯: '1', 身法: '2', 神魂: '3', 灵蕴: '4' },
        source: 0,
        method: 0,
        dao: 0,
        fateValue: 0,
        drawnTalents: [{ name: '已保存的随机天赋', kind: 'talent' }],
        drawnTalentsFateValue: 0,
      },
    };

    const result = createGuidedCardResult({
      draft,
      options,
      fateDraws,
      drawPlan: (plan) => {
        drawPlanCalls.push(plan.label);
        return [{ name: '重新抽取的结果', kind: 'talent' }];
      },
      defaultRealmIndex: 1,
      getFateState: () => ({ diceEffects: [] }),
      now: () => new Date('2026-07-10T00:00:00.000Z'),
    });

    expect(result.snapshot.drawnTalents).toEqual([{ name: '已保存的随机天赋', kind: 'talent' }]);
    expect(drawPlanCalls).toEqual([]);
  });

  it('redraws talents for the current fateValue when saved random talents belong to a stale fateValue', () => {
    const drawPlanCalls = [];
    const draft = {
      ...createEmptyGuideDraft(),
      values: {
        ...createEmptyGuideDraft().values,
        origin: 0,
        attributes: { 仙躯: '1', 身法: '2', 神魂: '3', 灵蕴: '4' },
        source: 0,
        method: 0,
        dao: 0,
        fateValue: 2,
        drawnTalents: [{ name: '旧随机天赋', kind: 'talent' }],
        drawnTalentsFateValue: 0,
      },
    };

    const result = createGuidedCardResult({
      draft,
      options,
      fateDraws,
      drawPlan: (plan) => {
        drawPlanCalls.push(plan.label);
        return [{ name: '当前因果的新结果', kind: 'talent' }];
      },
      defaultRealmIndex: 1,
      getFateState: () => ({ diceEffects: [] }),
      now: () => new Date('2026-07-10T00:00:00.000Z'),
    });

    expect(result.snapshot.selectedFateTitle).toBe('天命贰');
    expect(result.snapshot.drawnTalents).toEqual([{ name: '当前因果的新结果', kind: 'talent' }]);
    expect(drawPlanCalls).toEqual(['二地阶天赋']);
  });
});
