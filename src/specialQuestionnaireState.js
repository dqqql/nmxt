export const SPECIAL_QUESTIONNAIRE_DRAFT_KEY = 'nmxt.questionnaire.specialDraft.v1';

export const specialQuestionnaireCategories = ['source', 'method', 'dao'];

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeAnswerList(value) {
  return Array.isArray(value) ? value.map((entry) => (typeof entry === 'string' ? entry : '')) : [];
}

export function createEmptySpecialQuestionnaireAnswers() {
  return {
    source: {},
    method: {},
    dao: {},
  };
}

export function normalizeSpecialQuestionnaireAnswers(value) {
  const next = createEmptySpecialQuestionnaireAnswers();
  if (!isPlainObject(value)) return next;

  specialQuestionnaireCategories.forEach((category) => {
    const categoryStore = value[category];
    if (!isPlainObject(categoryStore)) return;
    next[category] = Object.fromEntries(
      Object.entries(categoryStore)
        .filter(([optionName]) => typeof optionName === 'string' && optionName.trim().length > 0)
        .map(([optionName, answers]) => [optionName, normalizeAnswerList(answers)]),
    );
  });

  return next;
}

export function getSpecialQuestionnaireAnswersForOption(store, category, optionName, questionCount = 0) {
  const normalized = normalizeSpecialQuestionnaireAnswers(store);
  const existing = optionName ? normalized[category]?.[optionName] || [] : [];
  return Array.from({ length: questionCount }, (_, index) => existing[index] || '');
}

export function updateSpecialQuestionnaireAnswer(store, {
  category,
  optionName,
  index,
  value,
  questionCount = 0,
}) {
  const normalized = normalizeSpecialQuestionnaireAnswers(store);
  if (!specialQuestionnaireCategories.includes(category) || !optionName) {
    return normalized;
  }

  const nextAnswers = getSpecialQuestionnaireAnswersForOption(
    normalized,
    category,
    optionName,
    Math.max(questionCount, index + 1),
  );
  nextAnswers[index] = typeof value === 'string' ? value : '';

  return {
    ...normalized,
    [category]: {
      ...normalized[category],
      [optionName]: nextAnswers,
    },
  };
}

export function pickSpecialQuestionnaireAnswersForSelections(store, selectionsByCategory) {
  const normalized = normalizeSpecialQuestionnaireAnswers(store);
  const next = createEmptySpecialQuestionnaireAnswers();

  specialQuestionnaireCategories.forEach((category) => {
    const optionName = selectionsByCategory?.[category];
    if (!optionName) return;
    if (normalized[category]?.[optionName]) {
      next[category][optionName] = [...normalized[category][optionName]];
    }
  });

  return next;
}
