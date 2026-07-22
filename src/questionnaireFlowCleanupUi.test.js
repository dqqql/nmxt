import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function functionBody(name) {
  const start = mainSource.indexOf(`function ${name}`);
  const end = mainSource.indexOf('\nfunction ', start + 1);
  return mainSource.slice(start, end < 0 ? undefined : end);
}

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(cssSource.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')))
    .map((match) => match[1])
    .join('\n');
}

describe('questionnaire entry cleanup and result preview', () => {
  it('removes source, method, and dao questionnaire entry points from page one', () => {
    const selectorPanel = functionBody('SelectorPanel');

    expect(selectorPanel).not.toContain('openSpecialQuestionnaire');
    expect(selectorPanel).not.toContain('selectorQuestionnaireButton');
    expect(selectorPanel).not.toContain('问卷');
    expect(mainSource).not.toContain('function SpecialQuestionnaireModal');
  });

  it('removes the optional selection questionnaires from questionnaire and guided flows', () => {
    const questionnairePage = functionBody('QuestionnairePage');
    const guideOptionStep = functionBody('GuideOptionStep');

    expect(questionnairePage).not.toContain('可选问卷');
    expect(questionnairePage).not.toContain('specialQuestionnaireGroups');
    expect(guideOptionStep).not.toContain('SpecialQuestionnaireFields');
    expect(guideOptionStep).not.toContain('onSpecialQuestionnaireAnswerChange');
  });

  it('removes the fixed profile questionnaire from questionnaire card creation', () => {
    const questionnairePage = functionBody('QuestionnairePage');

    expect(questionnairePage).not.toContain('固定问卷');
    expect(questionnairePage).not.toContain('questionnaireProfileSection');
    expect(questionnairePage).not.toContain('profileQuestions');
  });

  it('keeps the changing questionnaires editable only on the character background page', () => {
    const backgroundPage = functionBody('PageBackground');

    expect(backgroundPage).toContain("['source', 'method', 'dao']");
    expect(backgroundPage).toContain('className="backgroundAnswerText"');
    expect(backgroundPage).toContain('setSpecialQuestionnaireValue(');
    expect(ruleBody('.backgroundAnswerText')).toContain('resize: none');
    expect(ruleBody('.backgroundAnswerText:focus-visible')).toContain('box-shadow');
  });

  it('shows the completed questionnaire result in a responsive waterfall at the page bottom', () => {
    const questionnairePage = functionBody('QuestionnairePage');
    const resultCards = functionBody('QuestionnaireResultCards');

    expect(questionnairePage).toContain('provisionalResult ? (');
    expect(questionnairePage).toContain('<QuestionnaireResultCards result={provisionalResult} />');
    expect(resultCards).toContain('questionnaireResultMasonry');
    expect(resultCards).toContain('cards.map');
    expect(questionnairePage).toContain('<h2>你的角色</h2>');
    expect(questionnairePage).not.toContain('问卷结果');
    expect(ruleBody('.questionnaireResultMasonry')).toContain('column-count: 2');
    expect(ruleBody('.questionnaireResultMasonry .questionnaireResultCard')).toContain('break-inside: avoid');
    expect(resultCards).toContain('questionnaireResultCard-${card.kind}');
    expect(mainSource).toContain("replace(/\\s*\\n\\s*/g, ' ')");
    expect(ruleBody('.questionnaireResultCard-fate .guidePreviewField')).toContain('grid-template-columns: 1fr');
    expect(ruleBody('.questionnaireResultCard-fate .guidePreviewField span')).toContain('border-radius: 999px');
  });
});
