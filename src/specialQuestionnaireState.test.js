import { describe, expect, it } from 'vitest';
import {
  createEmptySpecialQuestionnaireAnswers,
  getSpecialQuestionnaireAnswersForOption,
  normalizeSpecialQuestionnaireAnswers,
  pickSpecialQuestionnaireAnswersForSelections,
  updateSpecialQuestionnaireAnswer,
} from './specialQuestionnaireState';

describe('special questionnaire state', () => {
  it('creates an empty answer store for every supported category', () => {
    expect(createEmptySpecialQuestionnaireAnswers()).toEqual({
      source: {},
      method: {},
      dao: {},
    });
  });

  it('normalizes non-string answers into blank strings', () => {
    expect(normalizeSpecialQuestionnaireAnswers({
      source: { 金道源: ['甲', 2, null] },
      method: {},
      dao: { 修罗之道: ['乙'] },
    })).toEqual({
      source: { 金道源: ['甲', '', ''] },
      method: {},
      dao: { 修罗之道: ['乙'] },
    });
  });

  it('updates answers by category and option name', () => {
    const next = updateSpecialQuestionnaireAnswer({}, {
      category: 'source',
      optionName: '金道源',
      index: 1,
      value: '第二问答案',
      questionCount: 3,
    });

    expect(getSpecialQuestionnaireAnswersForOption(next, 'source', '金道源', 3)).toEqual([
      '',
      '第二问答案',
      '',
    ]);
  });

  it('picks only the selected option answers for submission snapshots', () => {
    const store = {
      source: { 金道源: ['金1', '金2', '金3'], 木道源: ['木1', '木2', '木3'] },
      method: { 剑修: ['剑1', '剑2', '剑3'] },
      dao: { 修罗之道: ['修1', '修2', '修3'] },
    };

    expect(pickSpecialQuestionnaireAnswersForSelections(store, {
      source: '木道源',
      method: '剑修',
      dao: '修罗之道',
    })).toEqual({
      source: { 木道源: ['木1', '木2', '木3'] },
      method: { 剑修: ['剑1', '剑2', '剑3'] },
      dao: { 修罗之道: ['修1', '修2', '修3'] },
    });
  });
});
