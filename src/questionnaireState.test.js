import { describe, expect, it } from 'vitest';
import {
  daoOptions,
  fateDraws as realFateDraws,
  methodOptions,
  originOptions,
  questionnaireConfig,
  realmOptions,
  sourceOptions,
} from './data';
import {
  createEmptyAnswers,
  createQuestionnaireCardState,
  resolveQuestionnaireResult,
  validateQuestionnaireAnswers,
} from './questionnaireState';

const libraries = {
  realm: ['练气前期', '筑基前期'],
  origin: ['宗门弟子', '寒门学子'],
  source: ['木道源', '金道源', '火道源'],
  method: ['剑修', '法修'],
  dao: ['护佑之道', '修罗之道'],
  fate: ['平平无奇', '天命壹'],
};

const options = {
  realm: [{ name: '练气前期' }, { name: '筑基前期' }],
  origin: [{ name: '宗门弟子' }, { name: '寒门学子' }],
  source: [{ name: '木道源' }, { name: '金道源' }, { name: '火道源' }],
  method: [{ name: '剑修' }, { name: '法修' }],
  dao: [{ name: '护佑之道' }, { name: '修罗之道' }],
};

const fateDraws = {
  平平无奇: [
    { label: '一凡阶天赋', items: [{ kind: 'talent', tier: '凡', count: 1 }] },
  ],
  天命壹: [
    { label: '一地阶天赋 + 一地阶天谴', items: [{ kind: 'talent', tier: '地', count: 1 }] },
  ],
};

describe('questionnaire state', () => {
  it('creates empty answers with arrays for multiple choice and strings for single choice', () => {
    const questionnaire = {
      questions: [
        { id: 'temper', type: 'single' },
        { id: 'values', type: 'multiple' },
      ],
    };

    expect(createEmptyAnswers(questionnaire)).toEqual({
      temper: '',
      values: [],
    });
  });

  it('validates unanswered required questions', () => {
    const questionnaire = {
      questions: [
        { id: 'temper', type: 'single', required: true },
        { id: 'values', type: 'multiple', required: true },
        { id: 'optional', type: 'single', required: false },
      ],
    };

    expect(validateQuestionnaireAnswers(questionnaire, {
      temper: '',
      values: [],
      optional: '',
    })).toEqual(['temper', 'values']);
  });

  it('resolves single-choice votes to the highest voted target', () => {
    const questionnaire = {
      questions: [
        {
          id: 'source-one',
          type: 'single',
          mapsTo: 'source',
          options: [
            { id: 'patient', label: '稳扎稳打', targets: ['木道源'] },
            { id: 'sharp', label: '锋芒毕露', targets: ['金道源'] },
          ],
        },
        {
          id: 'source-two',
          type: 'single',
          mapsTo: 'source',
          options: [
            { id: 'growth', label: '生生不息', targets: ['木道源'] },
            { id: 'flame', label: '炽烈直接', targets: ['火道源'] },
          ],
        },
      ],
    };

    const result = resolveQuestionnaireResult({
      questionnaire,
      answers: { 'source-one': 'sharp', 'source-two': 'growth' },
      libraries,
      now: () => new Date('2026-07-08T00:00:00.000Z'),
    });

    expect(result.selections.source).toBe('金道源');
  });

  it('counts all selected targets from multiple-choice answers', () => {
    const questionnaire = {
      questions: [
        {
          id: 'source-multi',
          type: 'multiple',
          mapsTo: 'source',
          options: [
            { id: 'heal', label: '恢复', targets: ['木道源'] },
            { id: 'grow', label: '成长', targets: ['木道源'] },
            { id: 'burn', label: '燃烧', targets: ['火道源'] },
          ],
        },
      ],
    };

    const result = resolveQuestionnaireResult({
      questionnaire,
      answers: { 'source-multi': ['heal', 'grow', 'burn'] },
      libraries,
    });

    expect(result.selections.source).toBe('木道源');
  });

  it('breaks ties by the first encountered target', () => {
    const questionnaire = {
      questions: [
        {
          id: 'source-tie',
          type: 'multiple',
          mapsTo: 'source',
          options: [
            { id: 'wood', label: '木', targets: ['木道源'] },
            { id: 'metal', label: '金', targets: ['金道源'] },
          ],
        },
      ],
    };

    const result = resolveQuestionnaireResult({
      questionnaire,
      answers: { 'source-tie': ['wood', 'metal'] },
      libraries,
    });

    expect(result.selections.source).toBe('木道源');
  });

  it('ignores invalid target names and falls back to the first valid library entry', () => {
    const questionnaire = {
      questions: [
        {
          id: 'source-invalid',
          type: 'single',
          mapsTo: 'source',
          options: [
            { id: 'missing', label: '不存在', targets: ['不存在道源'] },
          ],
        },
      ],
    };

    const result = resolveQuestionnaireResult({
      questionnaire,
      answers: { 'source-invalid': 'missing' },
      libraries,
    });

    expect(result.selections.source).toBe('木道源');
  });

  it('builds main page state and keeps questionnaire attributes at zero', () => {
    const draws = [];
    const state = createQuestionnaireCardState({
      result: {
        selections: {
          realm: '筑基前期',
          origin: '寒门学子',
          source: '火道源',
          method: '法修',
          dao: '修罗之道',
          fate: '天命壹',
        },
      },
      options,
      fateDraws,
      drawPlan: (plan) => {
        draws.push(plan.label);
        return [{ kind: 'talent', tier: '地', name: '厚土命格', effect: '测试效果' }];
      },
    });

    expect(state.selections).toEqual({
      realm: 1,
      origin: 1,
      source: 2,
      method: 1,
      dao: 1,
    });
    expect(state.attributes).toEqual({
      仙躯: '0',
      身法: '0',
      神魂: '0',
      灵蕴: '0',
    });
    expect(state.selectedFateTitle).toBe('天命壹');
    expect(draws).toEqual(['一地阶天赋 + 一地阶天谴']);
    expect(state.drawnTalents).toEqual([
      { kind: 'talent', tier: '地', name: '厚土命格', effect: '测试效果' },
    ]);
  });

  it('resolves the bundled questionnaire config against the real data libraries', () => {
    const realLibraries = {
      realm: realmOptions.map((option) => option.name),
      origin: originOptions.map((option) => option.name),
      source: sourceOptions.map((option) => option.name),
      method: methodOptions.map((option) => option.name),
      dao: daoOptions.map((option) => option.name),
      fate: Object.keys(realFateDraws),
    };
    const answers = Object.fromEntries(questionnaireConfig.questions.map((question) => [
      question.id,
      question.type === 'multiple'
        ? [question.options[0].id]
        : question.options[0].id,
    ]));

    const result = resolveQuestionnaireResult({
      questionnaire: questionnaireConfig,
      answers,
      libraries: realLibraries,
    });

    expect(Object.keys(result.selections).sort()).toEqual(['dao', 'fate', 'method', 'origin', 'realm', 'source']);
    Object.entries(result.selections).forEach(([category, selectedName]) => {
      expect(realLibraries[category]).toContain(selectedName);
    });
  });
});
