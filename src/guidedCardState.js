import { fateValueToTitle } from './randomCardState';

export const GUIDED_DRAFTS_KEY = 'nmxt.guidedCard.drafts.v1';
export const GUIDED_RESULT_KEY = 'nmxt.guidedCard.result.v1';

export const GUIDE_STEPS = [
  { id: 'info', label: '信息' },
  { id: 'origin', label: '出身' },
  { id: 'attributes', label: '分配属性' },
  { id: 'source', label: '道源' },
  { id: 'method', label: '法门' },
  { id: 'dao', label: '大道' },
  { id: 'fate', label: '因果值' },
  { id: 'preview', label: '预览确认' },
];

const attributeTitles = ['仙躯', '身法', '神魂', '灵蕴'];
const textFields = ['name', 'race', 'belong', 'daoHeart', 'identity'];
const selectionFields = ['origin', 'source', 'method', 'dao'];
const selectionSteps = { origin: 1, source: 3, method: 4, dao: 5 };

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return typeof value === 'string' ? value : '';
}

function normalizeSelection(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  const integer = Math.trunc(numeric);
  return integer >= 0 ? integer : null;
}

function normalizeAttributes(value) {
  const source = isPlainObject(value) ? value : {};
  return Object.fromEntries(attributeTitles.map((title) => [title, normalizeText(source[title])]));
}

function normalizeCoreAttribute(value) {
  return attributeTitles.includes(value) ? value : null;
}

function normalizeGuideValues(values) {
  const source = isPlainObject(values) ? values : {};
  return {
    name: normalizeText(source.name),
    race: normalizeText(source.race),
    belong: normalizeText(source.belong),
    daoHeart: normalizeText(source.daoHeart),
    identity: normalizeText(source.identity),
    origin: normalizeSelection(source.origin),
    attributes: normalizeAttributes(source.attributes),
    coreAttribute: normalizeCoreAttribute(source.coreAttribute),
    source: normalizeSelection(source.source),
    method: normalizeSelection(source.method),
    dao: normalizeSelection(source.dao),
    fateValue: Number.isFinite(Number(source.fateValue)) ? Math.trunc(Number(source.fateValue)) : 0,
  };
}

function normalizeGuideDraft(draft) {
  const source = isPlainObject(draft) ? draft : {};
  const values = normalizeGuideValues(source.values);
  return {
    version: 1,
    step: clampGuideStep(source.step),
    values,
  };
}

function getSlotId(activeSlotId) {
  return activeSlotId ? String(activeSlotId) : 'default';
}

export function createEmptyGuideDraft() {
  return {
    version: 1,
    step: 0,
    values: {
      name: '',
      race: '',
      belong: '',
      daoHeart: '',
      identity: '',
      origin: null,
      attributes: Object.fromEntries(attributeTitles.map((title) => [title, ''])),
      coreAttribute: null,
      source: null,
      method: null,
      dao: null,
      fateValue: 0,
    },
  };
}

export function clampGuideStep(step) {
  const numeric = Number.isFinite(Number(step)) ? Math.trunc(Number(step)) : 0;
  return Math.min(Math.max(numeric, 0), GUIDE_STEPS.length - 1);
}

export function getGuideDraftSlotKey(activeSlotId) {
  return `slot:${getSlotId(activeSlotId)}`;
}

export function getGuideDraft(drafts, activeSlotId) {
  if (!isPlainObject(drafts)) {
    return createEmptyGuideDraft();
  }
  return normalizeGuideDraft(drafts[getGuideDraftSlotKey(activeSlotId)]);
}

export function setGuideDraft(drafts, activeSlotId, draft) {
  const next = isPlainObject(drafts) ? { ...drafts } : {};
  next[getGuideDraftSlotKey(activeSlotId)] = normalizeGuideDraft(draft);
  return next;
}

export function clearGuideDraft(drafts, activeSlotId) {
  if (!isPlainObject(drafts)) {
    return {};
  }
  const key = getGuideDraftSlotKey(activeSlotId);
  const next = { ...drafts };
  delete next[key];
  return next;
}

export function validateGuideValues(values) {
  const normalized = normalizeGuideValues(values);
  const errors = [];

  if (normalized.origin === null) {
    errors.push({
      field: 'origin',
      step: selectionSteps.origin,
      message: '请选择该项',
    });
  }

  for (const title of attributeTitles.slice(1)) {
    const raw = normalized.attributes[title];
    if (raw === '' || !/^-?\d+$/.test(raw)) {
      errors.push({
        field: `attributes.${title}`,
        step: 2,
        message: '请输入整数',
      });
    }
  }

  for (const field of selectionFields.slice(1)) {
    if (normalized[field] === null) {
      errors.push({
        field,
        step: selectionSteps[field],
        message: '请选择该项',
      });
    }
  }

  if (!Number.isInteger(normalized.fateValue) || normalized.fateValue < -3 || normalized.fateValue > 3) {
    errors.push({
      field: 'fateValue',
      step: 6,
      message: '因果值必须在 -3 到 3 之间',
    });
  }

  return errors;
}

export function createGuidedCardResult({ draft, options, fateDraws, drawPlan, defaultRealmIndex, getFateState, now }) {
  const normalizedDraft = normalizeGuideDraft(draft);
  const values = normalizedDraft.values;
  const texts = Object.fromEntries(textFields.map((field) => [field, values[field]]));
  const attributes = normalizeAttributes(values.attributes);
  const selectedFateTitle = fateValueToTitle(values.fateValue);
  const plans = fateDraws?.[selectedFateTitle] || [];
  const selectedPlan = plans[0] || null;
  const drawnTalents = selectedPlan && drawPlan ? drawPlan(selectedPlan) : [];
  const fateState = getFateState ? getFateState(selectedFateTitle) || {} : {};
  const realmIndex = Number.isFinite(Number(defaultRealmIndex)) ? Math.trunc(Number(defaultRealmIndex)) : 0;
  const maxRealmIndexReached = realmIndex;

  return {
    version: 1,
    createdAt: now().toISOString(),
    snapshot: {
      selections: {
        realm: realmIndex,
        origin: values.origin,
        source: values.source,
        method: values.method,
        dao: values.dao,
      },
      texts,
      attributes,
      coreAttribute: values.coreAttribute,
      selectedFateTitle,
      diceEffects: fateState.diceEffects,
      drawnTalents,
      thresholdBonuses: { all: 0, bodyMedium: 0, soulMedium: 0, bodyHeavy: 0, soulHeavy: 0 },
      upgradeChoices: [],
      maxRealmIndexReached,
    },
  };
}

export function mergeRandomCardIntoGuideDraft(draft, randomState) {
  const normalizedDraft = normalizeGuideDraft(draft);
  const values = normalizedDraft.values;
  const nextValues = {
    ...values,
  };

  if (isPlainObject(randomState?.selections)) {
    if (Object.prototype.hasOwnProperty.call(randomState.selections, 'origin')) {
      nextValues.origin = normalizeSelection(randomState.selections.origin);
    }
    if (Object.prototype.hasOwnProperty.call(randomState.selections, 'source')) {
      nextValues.source = normalizeSelection(randomState.selections.source);
    }
    if (Object.prototype.hasOwnProperty.call(randomState.selections, 'method')) {
      nextValues.method = normalizeSelection(randomState.selections.method);
    }
    if (Object.prototype.hasOwnProperty.call(randomState.selections, 'dao')) {
      nextValues.dao = normalizeSelection(randomState.selections.dao);
    }
  }

  if (isPlainObject(randomState?.attributes)) {
    nextValues.attributes = normalizeAttributes(randomState.attributes);
  }

  if (Number.isFinite(Number(randomState?.fateValue))) {
    nextValues.fateValue = Math.trunc(Number(randomState.fateValue));
  }

  return {
    ...normalizedDraft,
    values: nextValues,
  };
}
