const selectionCategories = ['realm', 'origin', 'source', 'method', 'dao'];
const attributeTitles = ['仙躯', '身法', '神魂', '灵蕴'];
const fateTitlesByValue = {
  '-3': '逆命叁',
  '-2': '逆命贰',
  '-1': '逆命壹',
  0: '平平无奇',
  1: '天命壹',
  2: '天命贰',
  3: '天命叁',
};

function pickIndex(length, random) {
  if (!length) return null;
  return Math.min(Math.floor(random() * length), length - 1);
}

function shuffled(values, random) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(Math.floor(random() * (index + 1)), index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function fateValueToTitle(value) {
  return fateTitlesByValue[value] || '';
}

export function createRandomCardState({
  options,
  fateDraws,
  random = Math.random,
  drawPlan,
}) {
  const selections = Object.fromEntries(
    selectionCategories.map((category) => [category, pickIndex(options[category]?.length || 0, random)]),
  );
  const attributeValues = shuffled(['3', '2', '1', '0'], random);
  const attributes = Object.fromEntries(
    attributeTitles.map((title, index) => [title, attributeValues[index]]),
  );
  const fateValue = pickIndex(7, random) - 3;
  const selectedFateTitle = fateValueToTitle(fateValue);
  const plans = fateDraws[selectedFateTitle] || [];
  const planChoices = selectedFateTitle === '平平无奇' ? plans.slice(0, 2) : plans;
  const selectedPlan = planChoices[pickIndex(planChoices.length, random)];

  return {
    selections,
    attributes,
    fateValue,
    selectedFateTitle,
    drawnTalents: selectedPlan && drawPlan ? drawPlan(selectedPlan) : [],
  };
}
