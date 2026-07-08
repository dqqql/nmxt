export const QUESTIONNAIRE_DRAFT_KEY = 'nmxt.questionnaire.draft.v1';
export const QUESTIONNAIRE_RESULT_KEY = 'nmxt.questionnaire.result.v1';

const selectionCategories = ['realm', 'origin', 'source', 'method', 'dao'];
const attributeTitles = ['仙躯', '身法', '神魂', '灵蕴'];

export function createEmptyAnswers(questionnaire) {
  return Object.fromEntries((questionnaire?.questions || []).map((question) => [
    question.id,
    question.type === 'multiple' ? [] : '',
  ]));
}

export function validateQuestionnaireAnswers(questionnaire, answers) {
  return (questionnaire?.questions || [])
    .filter((question) => question.required !== false)
    .filter((question) => {
      const answer = answers?.[question.id];
      return Array.isArray(answer) ? answer.length === 0 : !answer;
    })
    .map((question) => question.id);
}

function getSelectedOptionIds(question, answer) {
  if (question.type === 'multiple') {
    return Array.isArray(answer) ? answer : [];
  }
  return answer ? [answer] : [];
}

function getFallback(category, libraries) {
  if (category === 'fate') {
    return libraries?.fate?.includes('平平无奇') ? '平平无奇' : libraries?.fate?.[0] || '';
  }
  return libraries?.[category]?.[0] || '';
}

export function resolveQuestionnaireResult({
  questionnaire,
  answers,
  libraries,
  now = () => new Date(),
}) {
  const votes = {};
  const order = {};
  let seen = 0;

  (questionnaire?.questions || []).forEach((question) => {
    const category = question.mapsTo;
    if (!category || !libraries?.[category]) return;

    const selectedIds = new Set(getSelectedOptionIds(question, answers?.[question.id]));
    (question.options || []).forEach((option) => {
      if (!selectedIds.has(option.id)) return;

      (option.targets || []).forEach((target) => {
        if (!libraries[category].includes(target)) return;
        votes[category] = votes[category] || {};
        order[category] = order[category] || {};
        votes[category][target] = (votes[category][target] || 0) + 1;
        if (order[category][target] == null) {
          order[category][target] = seen;
          seen += 1;
        }
      });
    });
  });

  const selections = Object.fromEntries(Object.keys(libraries || {}).map((category) => {
    const categoryVotes = votes[category] || {};
    const winner = Object.keys(categoryVotes).sort((left, right) => {
      const voteDelta = categoryVotes[right] - categoryVotes[left];
      if (voteDelta !== 0) return voteDelta;
      return order[category][left] - order[category][right];
    })[0];

    return [category, winner || getFallback(category, libraries)];
  }));

  return {
    version: 1,
    createdAt: now().toISOString(),
    selections,
  };
}

function findOptionIndex(options, name) {
  const index = (options || []).findIndex((option) => option.name === name);
  return index >= 0 ? index : 0;
}

export function createQuestionnaireCardState({
  result,
  options,
  fateDraws,
  drawPlan,
}) {
  const selections = Object.fromEntries(selectionCategories.map((category) => [
    category,
    findOptionIndex(options?.[category], result?.selections?.[category]),
  ]));
  const attributes = Object.fromEntries(attributeTitles.map((title) => [title, '0']));
  const selectedFateTitle = result?.selections?.fate || '平平无奇';
  const plans = fateDraws?.[selectedFateTitle] || [];
  const selectedPlan = plans[0];

  return {
    selections,
    attributes,
    selectedFateTitle,
    drawnTalents: selectedPlan && drawPlan ? drawPlan(selectedPlan) : [],
  };
}
