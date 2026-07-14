import React, { useState, useContext, createContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronRight, CircleAlert, Info, ListChecks, Map, Minus, Plus, Printer, Save, Settings, Shuffle, Star, Trash2, X } from 'lucide-react';
import {
  realmOptions,
  originOptions,
  sourceOptions,
  methodOptions,
  daoOptions,
  talentPool,
  punishmentPool,
  tierMeta,
  fateCards,
  diceLabels,
  diceEffectCycle,
  baseDiceEffects,
  fateProgression,
  fateDraws,
  drawByPlan,
  attributeDefs,
  spellGroups,
  resourceGroups,
  questionnaireConfig,
} from './data';
import gameLogo from './assets/game-logo.png';
import PageSix from './PageSix';
import { attachPrintLifecycle, printSheetsWithBrowser } from './exportPdf';
import {
  createMarkState,
  toggleMarkFilled,
  toggleMarkGhost,
  updateKeyedMarkState,
} from './interactiveState';
import { createRandomCardState, fateValueToTitle } from './randomCardState';
import {
  createManualFateEntry,
  formatManualFatePlanLabel,
  getFatePlanSlots,
  getPoolForFateSlot,
} from './fateSelectionState';
import {
  formatCardDisplayName,
  getMethodResourceSections,
  getMethodTechniqueProgression,
  getUnlockedMethodAttackBuffs,
} from './methodProgression';
import {
  aggregateUpgradeChoices,
  applyAttributeIncrease,
  createUpgradeStep,
  getDefaultRealmIndex,
  getInitialSourceArts,
  getInitialSourceSkills,
  getMaxReachedRealmAfterSelection,
  getNextRealmIndex,
  getNonCoreAttributeChoices,
  getReachableRealmOptions,
  getTreasureOptions,
  pruneUpgradeChoicesForRealm,
} from './realmUpgrade';
import { buildInitialMethodInsightPrompt, getDisplayedInsightCards, getDisplayedOriginInsightCards } from './methodSelectionFlow';
import { appendUpgradeChoices, removeMethodInsightChoices } from './upgradeChoiceState';
import {
  QUESTIONNAIRE_DRAFT_KEY,
  QUESTIONNAIRE_RESULT_KEY,
  createEmptyAnswers,
  createQuestionnaireCardState,
  resolveQuestionnaireResult,
  validateQuestionnaireAnswers,
} from './questionnaireState';
import {
  GUIDE_STEPS,
  GUIDED_DRAFTS_KEY,
  GUIDED_RESULT_KEY,
  applyGuideAttributeValue,
  clearGuideDraft,
  clampGuideStep,
  createGuidedCardResult,
  getGuideDraft,
  mergeRandomCardIntoGuideDraft,
  setGuideDraft,
  validateGuideValues,
} from './guidedCardState';
import {
  applyFoundationBreakthroughMarkEffects,
  applyGoldenCoreBreakthroughMarkEffects,
  applyQiCapacityDelta,
  lockPreviousUnlockedGhostMark,
  revertFoundationBreakthroughMarkEffects,
  revertGoldenCoreBreakthroughMarkEffects,
  unlockNextGhostMark,
} from './realmBreakthroughEffects';
import {
  createBreakthroughChoiceState,
  getBreakthroughChoiceOptions,
  toggleBreakthroughChoice,
} from './breakthroughChoiceState';
import {
  deleteSaveSlot,
  ensureInitialSaveSlot,
  normalizeSaveSlots,
  renameSaveSlot,
  saveSlot,
  startNewSaveSlot,
  updateSaveSlotSnapshot,
} from './saveArchive';
import './style.css';

function getFateState(title) {
  const next = [...baseDiceEffects];
  const state = {
    diceEffects: next,
    fortuneLimit: 2,
    trainingSupply: 0,
    inheritedEffects: [],
  };
  const progression = title?.startsWith('逆命') ? fateProgression.reverse : title?.startsWith('天命') ? fateProgression.forward : null;
  const selectedIndex = progression?.findIndex((step) => step.title === title) ?? -1;

  if (!progression || selectedIndex < 0) return state;

  progression.slice(0, selectedIndex + 1).forEach((step) => {
    if (step.trainingSupply) {
      state.trainingSupply += step.trainingSupply;
      state.inheritedEffects.push(`历练点补充 +${step.trainingSupply}`);
    }
    if (step.fortuneLimit) {
      state.fortuneLimit += step.fortuneLimit;
      state.inheritedEffects.push(`福缘点上限 +${step.fortuneLimit}`);
    }
    Object.entries(step.dice || {}).forEach(([index, effect]) => {
      state.diceEffects[Number(index)] = effect;
      state.inheritedEffects.push(`${diceLabels[Number(index)]}：${effect}`);
    });
  });

  return state;
}

function getFateDisplayDetails(title) {
  const [, main = '', talentRule = '', tone = 'neutral'] =
    fateCards.find(([cardTitle]) => cardTitle === title) || [];
  const inheritedEffects = getFateState(title).inheritedEffects;
  return {
    title,
    tone,
    numericEffects: inheritedEffects.length ? inheritedEffects : main ? [main] : [],
    talentRule: talentRule || '无',
  };
}

const pdfSpellGroups = [
  { title: '神通', rows: 3, className: 'pdfTall' },
  { title: '本源感悟', rows: 2, className: 'pdfTall' },
  { title: '秘法', rows: 2, className: 'pdfMid' },
  { title: '感悟', rows: 4, className: 'pdfMid' },
  { title: '功法', rows: 2, className: 'pdfShort' },
  { title: '灵宝', rows: 2, className: 'pdfShort' },
];

const pageTabs = [
  { id: 'p1', label: '第一页' },
  { id: 'p2', label: '第二页' },
  { id: 'p3', label: '第三页' },
  { id: 'p4', label: '第四页' },
  { id: 'p5', label: '第五页' },
  { id: 'p6', label: '第六页' },
];

const selectorPanelHints = {
  source: '修仙者的“力量源泉”',
  method: '修仙者使用力量的方式',
  dao: '修仙者们性格与倾向产生的特殊风格',
};

const CARD_AUTOSAVE_KEY = 'nmxt.card.autosave.v1';
const CARD_SAVE_SLOTS_KEY = 'nmxt.card.saveSlots.v1';
const CARD_ACTIVE_SAVE_SLOT_KEY = 'nmxt.card.activeSaveSlot.v1';

const defaultTexts = {
  name: '',
  race: '',
  belong: '',
  daoHeart: '',
  identity: '',
  formationName: '',
  formationBonus: '',
  formationGuardDifficulty: '',
  formationBreakDifficulty: '',
  formationFeatureName0: '阵攻',
  formationFeatureEffect0: '【初始特征】轻巧动作，对场景内 2 个敌人进行攻击，造成少量伤害',
  followerName: '',
  followerBonus: '',
  followerMoveEffect0: '轻巧动作，【核心属性】点伤害，本回合中主人对这个目标的下一次检定具有优势',
  followerMoveEffect1: '轻巧动作，【核心属性 +2】点伤害，命中未拆招成功目标，施加【脆弱】（二选一）',
};

const defaultAttributes = { '仙躯': '', '身法': '', '神魂': '', '灵蕴': '' };
const defaultThresholdBonuses = {
  all: 0,
  bodyMedium: 0,
  soulMedium: 0,
  bodyHeavy: 0,
  soulHeavy: 0,
};

function createEmptyBreakthroughChoices() {
  return {
    'foundation-early': createBreakthroughChoiceState('foundation-early'),
    'golden-core': createBreakthroughChoiceState('golden-core'),
  };
}

function createEmptyCardSnapshot(defaultRealmIndex) {
  return {
    version: 1,
    selections: { realm: defaultRealmIndex, origin: null, source: null, method: null, dao: null },
    texts: { ...defaultTexts },
    attributes: { ...defaultAttributes },
    coreAttribute: null,
    drawnTalents: [],
    portrait: null,
    selectedFateTitle: null,
    diceEffects: [...baseDiceEffects],
    fortuneOverflow: 0,
    markStates: {},
    thresholdBonuses: { ...defaultThresholdBonuses },
    upgradeChoices: [],
    breakthroughChoices: createEmptyBreakthroughChoices(),
    breakthroughChoiceDetails: {},
    maxRealmIndexReached: defaultRealmIndex,
  };
}

function normalizeCardSnapshot(snapshot, defaultRealmIndex) {
  const empty = createEmptyCardSnapshot(defaultRealmIndex);
  if (!snapshot) return empty;

  return {
    ...empty,
    ...snapshot,
    selections: { ...empty.selections, ...(snapshot.selections || {}) },
    texts: { ...empty.texts, ...(snapshot.texts || {}) },
    attributes: { ...empty.attributes, ...(snapshot.attributes || {}) },
    diceEffects: snapshot.diceEffects || empty.diceEffects,
    thresholdBonuses: { ...empty.thresholdBonuses, ...(snapshot.thresholdBonuses || {}) },
    markStates: snapshot.markStates || empty.markStates,
    upgradeChoices: snapshot.upgradeChoices || empty.upgradeChoices,
    breakthroughChoices: {
      ...empty.breakthroughChoices,
      ...(snapshot.breakthroughChoices || {}),
    },
    breakthroughChoiceDetails: snapshot.breakthroughChoiceDetails || empty.breakthroughChoiceDetails,
    drawnTalents: snapshot.drawnTalents || empty.drawnTalents,
    maxRealmIndexReached: snapshot.maxRealmIndexReached ?? defaultRealmIndex,
  };
}

const LIBRARY = {
  realm: { label: '境界', placeholder: '点击选择境界', options: realmOptions },
  origin: { label: '出身', placeholder: '点击选择出身', options: originOptions },
  source: { label: '道源', placeholder: '点击选择道源', options: sourceOptions },
  method: { label: '法门', placeholder: '点击选择法门', options: methodOptions },
  dao: { label: '大道', placeholder: '点击选择大道', options: daoOptions },
};

const SheetContext = createContext(null);

function useSheet() {
  return useContext(SheetContext);
}

function ClickableMark({ id, initialState = 'solid', ariaLabel = '方格', allowGhost = true }) {
  const { markStates, setMarkStates } = useSheet();
  const [localState, setLocalState] = useState(createMarkState(initialState));
  const state = id ? (markStates[id] || createMarkState(initialState)) : localState;

  const toggleFilled = () => {
    if (id) {
      setMarkStates((store) => updateKeyedMarkState(store, id, initialState, toggleMarkFilled));
      return;
    }
    setLocalState(toggleMarkFilled);
  };

  const toggleGhost = (event) => {
    event.preventDefault();
    if (!allowGhost) return;
    if (id) {
      setMarkStates((store) => updateKeyedMarkState(
        store,
        id,
        initialState,
        (value) => toggleMarkGhost(value, allowGhost),
      ));
      return;
    }
    setLocalState((value) => toggleMarkGhost(value, allowGhost));
  };

  return (
    <button
      type="button"
      className={`mark ${state.filled ? 'filled' : ''} ${state.ghost ? 'ghost' : ''}`.trim()}
      onClick={toggleFilled}
      onContextMenu={toggleGhost}
      aria-label={ariaLabel}
    />
  );
}

function ResourceMark({ id, shape, ariaLabel }) {
  const { markStates, setMarkStates } = useSheet();
  const [localFilled, setLocalFilled] = useState(false);
  const filled = id ? Boolean(markStates[id]?.filled) : localFilled;

  const toggleFilled = () => {
    if (id) {
      setMarkStates((store) => updateKeyedMarkState(store, id, 'solid', toggleMarkFilled));
      return;
    }
    setLocalFilled((value) => !value);
  };

  return (
    <button
      type="button"
      className={`resourceMark ${shape}${filled ? ' resourceFilled' : ''}`}
      onClick={toggleFilled}
      aria-label={ariaLabel}
      aria-pressed={filled}
    >
      <ResourceIcon shape={shape} filled={filled} />
    </button>
  );
}

function ResourceIcon({ shape, filled }) {
  const fill = filled ? '#202020' : '#fff';
  const stroke = '#202020';
  const common = {
    fill,
    stroke,
    strokeWidth: 0.75,
    vectorEffect: 'non-scaling-stroke',
  };

  if (shape === 'bag') {
    return (
      <svg viewBox="0 0 16 18" aria-hidden="true" focusable="false">
        <path
          {...common}
          d="M13.24,5.83c0,3.24-3.12,5.86-6.96,5.86S-.68,9.07-.68,5.83C-.68,3.72,.64,.82,2.63-.95c.18-.16,.43-.25,.68-.25h5.94c.25,0,.49,.09,.68,.25,1.99,1.76,3.32,4.66,3.32,6.77Z"
          transform="translate(1.72 5.8)"
        />
        <path
          {...common}
          d="M7.86,1.14c0,.36-.22,.92-.49,1.48-.14,.3-.5,.49-.89,.49H1.67c-.4,0-.76-.2-.9-.51-.22-.47-.39-.98-.39-1.43,0-.41,.38-.77,.88-.79,.4-.02,.74,.16,.9,.43,.04,.06,.14,.06,.18,0,.15-.25,.47-.43,.85-.43s.69,.17,.85,.43c.04,.06,.14,.06,.18,0,.15-.25,.47-.43,.85-.43s.69,.17,.85,.43c.04,.06,.14,.06,.18,0,.15-.25,.47-.43,.85-.43,.52,0,.94,.34,.94,.76Z"
          transform="translate(3.9 1.1)"
        />
      </svg>
    );
  }

  if (shape === 'square') {
    return (
      <svg viewBox="0 0 15.92 15.91" aria-hidden="true" focusable="false">
        <path {...common} d="M3.21,.38h9.5c1.56,0,2.83,1.27,2.83,2.83v9.5c0,1.56-1.27,2.84-2.84,2.84H3.21c-1.56,0-2.84-1.27-2.84-2.84V3.21C.38,1.65,1.65,.38,3.21,.38Z" />
      </svg>
    );
  }

  if (shape === 'triangle') {
    return (
      <svg viewBox="0 0 15.92 15.91" aria-hidden="true" focusable="false">
        <polygon {...common} points="3.21 .38 3.21 3.21 .38 3.21 .38 12.71 3.21 12.71 3.21 15.54 12.71 15.54 12.71 12.71 15.54 12.71 15.54 3.21 12.71 3.21 12.71 .38 3.21 .38" />
      </svg>
    );
  }

  if (shape === 'star') {
    return (
      <svg viewBox="0 0 15.91 15.91" aria-hidden="true" focusable="false">
        <polygon {...common} points="6.04 .38 6.04 4.16 2.26 4.16 2.26 2.27 4.15 2.27 4.15 6.04 .38 6.04 .38 9.87 4.15 9.87 4.15 13.65 2.26 13.65 2.26 11.76 6.04 11.76 6.04 15.54 9.87 15.54 9.87 11.76 13.65 11.76 13.65 13.65 11.76 13.65 11.76 9.87 15.54 9.87 15.54 6.04 11.76 6.04 11.76 2.27 13.65 2.27 13.65 4.16 9.87 4.16 9.87 .38 6.04 .38" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 14.92 14.92" aria-hidden="true" focusable="false">
      <path {...common} d="M7.46,14.55c3.91,0,7.09-3.17,7.09-7.09S11.38,.38,7.46,.38,.38,3.55,.38,7.46s3.17,7.09,7.09,7.09Z" />
    </svg>
  );
}

const marks = (count, className = '', options = {}) => {
  const { initialFilled = 0, allowGhost = true, groupId = '' } = options;
  return (
  Array.from({ length: count }, (_, index) => (
    <ClickableMark
      key={`${groupId || className || 'solid'}-${initialFilled}-${allowGhost}-${index}`}
      id={groupId ? `${groupId}:${index}` : undefined}
      initialState={index < initialFilled ? 'filled' : className.includes('ghost') ? 'ghost' : 'solid'}
      ariaLabel={`方格 ${index + 1}`}
      allowGhost={allowGhost}
    />
  ))
  );
};

const resourceMarks = (count, shape, groupId = '') =>
  Array.from({ length: count }, (_, index) => (
    <ResourceMark key={index} id={groupId ? `${groupId}:${index}` : undefined} shape={shape} ariaLabel={`灵石 ${index + 1}`} />
  ));

function getRealmMultiplier(realm) {
  if (!realm?.name) return 0;
  if (realm.name.startsWith('金丹')) return 3;
  if (realm.name.startsWith('筑基')) return 2;
  if (realm.name.startsWith('练气')) return 1;
  return 0;
}

function uniqueCards(cards) {
  const seen = new Set();
  return (cards || []).filter((card) => {
    if (!card?.name || seen.has(card.name)) return false;
    seen.add(card.name);
    return true;
  });
}

function incrementTextNumber(value, amount = 1) {
  const current = String(value || '').match(/[+-]?\d+/)?.[0];
  return String((current ? Number(current) : 0) + amount);
}

function applyGhostCapacityDelta(store, groupId, count, amount) {
  let next = { ...store };
  const operation = amount >= 0 ? unlockNextGhostMark : lockPreviousUnlockedGhostMark;
  for (let index = 0; index < Math.abs(amount); index += 1) {
    next = operation(next, groupId, count);
  }
  return next;
}

function getFoundationTechniqueStorageBonus(method) {
  return getMethodTechniqueProgression(method)
    .find((technique) => technique.stage === 'foundation')?.storageCapacityBonus || 0;
}

function getBreakthroughRealmIndex(breakthroughId) {
  const realmName = breakthroughId === 'foundation-early' ? '筑基前期' : '金丹前期';
  return realmOptions.findIndex((realm) => realm.name === realmName);
}

function InfoHint({ text, label = '说明' }) {
  if (!text) return null;

  return (
    <span className="infoHint">
      <button type="button" className="infoHintButton" aria-label={label}>
        <CircleAlert size={13} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <span className="infoBubble" role="tooltip">{text}</span>
    </span>
  );
}

function SheetHeader({ title }) {
  return (
    <header className="sheetHeader">
      <div className="brand">逆命仙途</div>
      <h1>{title}</h1>
    </header>
  );
}

function PrintValue({ value, placeholder = '', className = '' }) {
  const text = String(value || '').trim();
  return (
    <span className={`printOnly printTextValue${text ? '' : ' is-placeholder'} ${className}`.trim()}>
      {text || placeholder}
    </span>
  );
}

// 可填写的横线输入框（名称 / 种族 / 归属）。状态提升到 SheetContext，切页不丢失。
function FillInput({ field, label }) {
  const { texts, setText } = useSheet();
  return (
    <>
      <input
        className="fillInput printControl"
        type="text"
        value={texts[field]}
        onChange={(event) => setText(field, event.target.value)}
        aria-label={label}
      />
      <PrintValue value={texts[field]} className="fillInput" />
    </>
  );
}

function FillTextarea({ field, label }) {
  const { texts, setText } = useSheet();
  return (
    <>
      <textarea
        className="fillTextarea printControl"
        value={texts[field]}
        onChange={(event) => setText(field, event.target.value)}
        aria-label={label}
      />
      <PrintValue value={texts[field]} className="fillTextarea" />
    </>
  );
}

function formatNoteLine(line) {
  return line
    .trim()
    .replace(/^（(.+)）$/, '$1')
    .replace(/^\((.+)\)$/, '$1')
    .replace(/[（(]\s*([^（）()]+?)\s*[）)]/g, ' $1')
    .replace(/\s+/g, ' ');
}

function InlineNote({ text, className = '', stacked = false }) {
  if (!text) return null;
  const lines = text.split('\n').map(formatNoteLine).filter(Boolean);

  return (
    <span className={`inlineNote ${className}`.trim()}>
      {stacked ? lines.map((line) => <span key={line}>{line}</span>) : lines.join(' / ')}
    </span>
  );
}

// 文本自适应：当内容超出其固定大小的框（被裁切）时，逐步缩小字号直到完全显示；
// 设有下限（默认基准字号的 70%，且不低于 10px）以保证可读性。
// 未溢出的文本保持原字号不变。
function useAutoFitFont(deps, { minRatio = 0.7, minPx = 10 } = {}) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const overflowing = () => (
      el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
    );

    const fit = () => {
      // 先还原到 CSS 基准字号再判断，确保能放大回去
      el.style.fontSize = '';
      if (!overflowing()) return;
      const base = parseFloat(getComputedStyle(el).fontSize) || 14;
      const floor = Math.max(base * minRatio, minPx);
      let size = base;
      while (size > floor && overflowing()) {
        size = Math.max(floor, size - 0.5);
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

// 自适应字号的纯文本块：内容超框时自动缩小字号。
// 统一加上 autoFit 类（height:100% + overflow:hidden），使其撑满所在固定框，
// 从而能正确检测溢出；框本身不固定高度时则不会触发缩放。
function AutoFitText({ children, className = '', as = 'div', fitOptions }) {
  const ref = useAutoFitFont([children], fitOptions);
  const Tag = as;
  return <Tag ref={ref} className={`autoFit ${className}`.trim()}>{children}</Tag>;
}

// 自动填充的纯文本（由资源库选择联动而来）。空选择时显示淡色占位提示。
function FilledText({ value, placeholder = '——', className = '' }) {
  return (
    <AutoFitText className={`fillText${value ? '' : ' empty'} ${className}`.trim()}>
      {value || placeholder}
    </AutoFitText>
  );
}

// 资源库触发方块：显示已选名称，点击打开对应分类的资源库。
function SelectorBox({ category }) {
  const { selections, openLibrary } = useSheet();
  const { placeholder, options } = LIBRARY[category];
  const index = selections[category];
  const option = index != null ? options[index] : null;

  return (
    <>
      <button
        type="button"
        className={`selectorBox printControl${option ? ' filled' : ''}`}
        onClick={() => openLibrary(category)}
      >
        {option ? option.name : <span className="selectorPlaceholder">{placeholder}</span>}
      </button>
      <PrintValue value={option ? option.name : ''} placeholder={placeholder} className={`selectorBox${option ? ' filled' : ''}`} />
    </>
  );
}

function FieldRow({ label, aside, filled = 0, ghost = 0, wide = false }) {
  const groupId = `field-${label}`;
  return (
    <div className={`fieldRow${wide ? ' wide' : ''}`}>
      <div className="fieldLabel">{label}</div>
      <div className="fieldLine" />
      {aside ? <div className="fieldAside">{aside}</div> : null}
      {filled || ghost ? (
        <div className="fieldMarks">
          {marks(filled, '', { groupId: `${groupId}:solid` })}
          {marks(ghost, 'ghost', { groupId: `${groupId}:ghost` })}
        </div>
      ) : null}
    </div>
  );
}

function InfoPanel() {
  const { current, canSelectReachedRealm, openRealmHistory, upgradeRealm } = useSheet();
  const realm = current.realm;
  const realmMultiplier = getRealmMultiplier(realm);

  return (
    <section className="panel infoPanel">
      <div className="profileGrid">
        <div className="nameRow">
          <div className="pairField lineField">
            <span className="fieldLabel">名称</span>
            <FillInput field="name" label="名称" />
          </div>
          <div className="pairField lineField">
            <span className="fieldLabel">种族</span>
            <FillInput field="race" label="种族" />
          </div>
        </div>

        <div className="singleField lineField">
          <span className="fieldLabel">归属</span>
          <FillInput field="belong" label="归属" />
        </div>

        <div className="singleField selectorField">
          <span className="fieldLabel">出身</span>
          <SelectorBox category="origin" />
        </div>

        <div className="splitFieldRow">
          <div className="splitFieldMain realmUpgradeField">
            <span className="fieldLabel">境界</span>
            <div className="realmUpgradeControl">
              {canSelectReachedRealm ? (
                <button type="button" className="realmDisplayButton printControl" onClick={openRealmHistory}>
                  {realm ? realm.name : '练气前期'}
                </button>
              ) : (
                <FilledText value={realm ? realm.name : '练气前期'} placeholder="练气前期" />
              )}
              <button type="button" className="realmUpgradeButton printControl" onClick={upgradeRealm}>
                <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
                <span>升级</span>
              </button>
              <PrintValue value={realm ? realm.name : '练气前期'} placeholder="练气前期" className="realmPrintValue" />
            </div>
          </div>
          <div className="splitFieldSide">
            <span className="fieldAside">境界乘值</span>
            <div className="fieldMarks">{marks(5, '', { initialFilled: realmMultiplier, allowGhost: false })}</div>
          </div>
        </div>

        <div className="splitFieldRow">
          <div className="splitFieldMain">
            <span className="fieldLabel">境界能力</span>
            <FilledText value={realm ? realm.ability : ''} placeholder="选择境界后自动填充" />
          </div>
          <div className="splitFieldSide">
            <span className="fieldAside">真元</span>
            <div className="fieldMarks">
              {marks(1, '', { groupId: 'p1-zhenyuan-solid' })}
              {marks(4, 'ghost', { groupId: 'p1-zhenyuan-ghost' })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SideTextPanel({ title, field }) {
  return (
    <section className="panel bannerField">
      <div className="bannerTitle">{title}</div>
      <div className="bannerBody">
        <FillTextarea field={field} label={title} />
      </div>
    </section>
  );
}

function AttributePanel({ title, hint }) {
  const { attributes, setAttributeValue, coreAttribute, toggleCoreAttribute } = useSheet();
  const isCore = coreAttribute === title;

  return (
    <section className={`panel attributePanel${isCore ? ' core' : ''}`}>
      <div className="panelTitle">
        <span>{title}</span>
        <button
          type="button"
          className={`coreToggle${isCore ? ' on' : ''}`}
          onClick={() => toggleCoreAttribute(title)}
          aria-pressed={isCore}
          aria-label={`${isCore ? '取消' : '标记'}${title}为核心属性`}
          title={`${isCore ? '取消' : '标记'}核心属性`}
        >
          <Star size={13} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
      <div className="attributeBody">
        <label className="attributeValueField">
          <span>加值</span>
          <input
            className="printControl"
            type="text"
            value={attributes[title] || ''}
            onChange={(event) => setAttributeValue(title, event.target.value)}
            placeholder="+0"
            aria-label={`${title}加值`}
          />
          <PrintValue value={attributes[title] || ''} className="attributePrintValue" />
        </label>
      </div>
      <div className="panelHint">{hint}</div>
    </section>
  );
}

function TextPanel({ title, hint, content, vertical = false }) {
  return (
    <section className={`panel textPanel${vertical ? ' vertical' : ''}`}>
      <div className="panelTitle">{title}</div>
      <div className="textPanelBody">
        {content != null ? content : hint ? <span>{hint}</span> : null}
      </div>
    </section>
  );
}

// 竖排的资源库选择面板（道源 / 法门 / 大道）。
function SelectorPanel({ title, category, vertical = false }) {
  const hint = selectorPanelHints[category];

  return (
    <section className={`panel textPanel selectorPanel${vertical ? ' vertical' : ''}`}>
      <div className="panelTitle">
        <span>{title}</span>
        {hint ? <small>{hint}</small> : null}
      </div>
      <div className="textPanelBody">
        <SelectorBox category={category} />
      </div>
    </section>
  );
}

function FateRibbon() {
  const { openFateDraw, selectedFateTitle, setSelectedFateTitle, setDiceEffects } = useSheet();
  const selectedIndex = fateCards.findIndex(([title]) => title === selectedFateTitle);

  const handleSelect = (index, title) => {
    setSelectedFateTitle(title);
    setDiceEffects(getFateState(title).diceEffects);
    // 选中带「天赋 / 天谴」的因果卡时弹出抽卡弹窗；否则仅高亮当前因果值。
    if (fateDraws[title]) {
      openFateDraw(title);
    }
  };

  return (
    <section className="fateSection">
      <div className="fateHeader">
        <span>逆命因果</span>
        <strong>因果值</strong>
        <span>天命因果</span>
      </div>
      <div className="fateRibbon">
        {fateCards.map(([title, main, sub, tone], index) => {
          const inherited = getFateState(title).inheritedEffects;
          return (
            <button
              key={title}
              type="button"
              className={`fateStep ${tone}${selectedFateTitle === title ? ' selected' : ''}${index === selectedIndex - 1 ? ' before-selected' : ''}${fateDraws[title] ? ' drawable' : ''}`}
              onClick={() => handleSelect(index, title)}
              aria-pressed={selectedFateTitle === title}
              aria-label={`因果值：${title}`}
            >
              <div className="fateHover fateHoverTop">
                <b>效果</b>
                <span>{inherited.length ? inherited.join('\n') : main}</span>
              </div>
              <div className="fateCardTitle">{title}</div>
              <div className="fateHover fateHoverBottom">
                <b>天赋 / 天谴</b>
                <span>{sub || '无'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TalentBoard() {
  const { drawnTalents } = useSheet();

  return (
    <section className="panel talentBoard">
      <div className="panelTitle panelTitleCentered">天赋 / 天谴</div>
      {[0, 1, 2, 3].map((index) => {
        const entry = drawnTalents[index];
        if (!entry) {
          return (
            <div key={index} className="talentBox empty">
              <span className="talentEmptyRune" aria-hidden="true">命</span>
              <div className="talentMeta"><span>名称</span><div className="lineFill" /></div>
              <div className="talentMeta"><span>品阶</span><div className="lineFill" /></div>
              <div className="talentEffect">
                <span>效果</span>
                <div className="effectFill">
                  <span className="talentEmptyHint">✦ 点击上方「因果值」抽取</span>
                </div>
              </div>
            </div>
          );
        }
        const meta = tierMeta[entry.tier];
        const kindLabel = entry.kind === 'talent' ? '天赋' : '天谴';
        return (
          <div
            key={index}
            className={`talentBox filled tier-${meta.tone} kind-${entry.kind}`}
          >
            <div className="talentMeta">
              <span>名称</span>
              <div className="lineFill text">{entry.name}</div>
            </div>
            <div className="talentMeta">
              <span>品阶</span>
              <div className="lineFill text">
                <span className={`tierBadge tier-${meta.tone}`}>
                  <span>{kindLabel}</span>
                  <span>{meta.label}</span>
                </span>
              </div>
            </div>
            <div className="talentEffect">
              <span>效果</span>
              <AutoFitText className="effectFill text">{entry.effect}</AutoFitText>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function OverflowCounter({ value, setValue, label }) {
  const change = (delta) => {
    setValue((current) => Math.max(0, current + delta));
  };

  return (
    <div className="overflowCounter" aria-label={label}>
      <button
        type="button"
        className="overflowCounterBtn"
        onClick={() => change(-1)}
        aria-label={`${label}减少`}
      >
        <Minus size={12} strokeWidth={2.6} aria-hidden="true" />
      </button>
      <output className="overflowCounterValue" aria-live="polite">{value}</output>
      <button
        type="button"
        className="overflowCounterBtn"
        onClick={() => change(1)}
        aria-label={`${label}增加`}
      >
        <Plus size={12} strokeWidth={2.6} aria-hidden="true" />
      </button>
    </div>
  );
}

function CounterBox({ title, filled, ghost, note, locked = false, overflowCounter = null }) {
  return (
    <section className="panel counterBox">
      <div className="panelTitle panelTitleCentered counterTitle">
        <span>{title}</span>
        <InlineNote text={note} className="counterNote" />
      </div>
      <div className={`counterBody${overflowCounter ? ' withOverflow' : ''}`}>
        <div className="counterMarks">
          {locked ? marks(filled, '', { allowGhost: false }) : (
            <>
              {marks(filled)}
              {marks(ghost, 'ghost')}
            </>
          )}
        </div>
        {overflowCounter ? (
          <OverflowCounter
            value={overflowCounter.value}
            setValue={overflowCounter.setValue}
            label={overflowCounter.label}
          />
        ) : null}
      </div>
    </section>
  );
}

function StatRow({ label, filled, ghost, note }) {
  const groupId = `p1-stat-${label}`;
  return (
    <div className="statRow">
      <span className="statLabel">
        <span>{label}</span>
      </span>
      <div className="statMarks">
        {marks(filled, '', { groupId: `${groupId}-solid` })}
        {marks(ghost, 'ghost', { groupId: `${groupId}-ghost` })}
      </div>
      <InlineNote text={note} className="statNote" stacked />
    </div>
  );
}

function DamageThreshold({ title, value, allBonus = 0, mediumBonus = 0, heavyBonus = 0 }) {
  const [light = '', medium = '', heavy = ''] = value ? value.match(/\d+/g) || [] : [];
  const adjusted = [
    light ? String(Number(light) + allBonus) : '',
    medium ? String(Number(medium) + allBonus + mediumBonus) : '',
    heavy ? String(Number(heavy) + allBonus + heavyBonus) : '',
  ];
  const [thresholdValues, setThresholdValues] = useState(adjusted);
  useEffect(() => {
    setThresholdValues(adjusted);
  }, [adjusted[0], adjusted[1], adjusted[2]]);

  const updateThreshold = (index, nextValue) => {
    setThresholdValues((current) => current.map((entry, currentIndex) => (
      currentIndex === index ? nextValue : entry
    )));
  };

  const thresholds = [
    { label: '轻伤', value: thresholdValues[0] },
    { label: '中伤', value: thresholdValues[1] },
    { label: '重伤', value: thresholdValues[2] },
  ];

  return (
    <div className="damageThreshold">
      <h4>{title}</h4>
      <div className="damageScale">
        <span className="fill">无伤害</span>
        <span className="thresholdStep" title={value || ''}>
          <b>{thresholds[0].label}</b>
          <input
            type="text"
            value={thresholds[0].value}
            onChange={(event) => updateThreshold(0, event.target.value)}
            aria-label={`${title}${thresholds[0].label}阈值`}
          />
        </span>
        <span className="fill">1 血量格</span>
        <span className="thresholdStep" title={value || ''}>
          <b>{thresholds[1].label}</b>
          <input
            type="text"
            value={thresholds[1].value}
            onChange={(event) => updateThreshold(1, event.target.value)}
            aria-label={`${title}${thresholds[1].label}阈值`}
          />
        </span>
        <span className="fill">2 血量格</span>
        <span className="thresholdStep" title={value || ''}>
          <b>{thresholds[2].label}</b>
          <input
            type="text"
            value={thresholds[2].value}
            onChange={(event) => updateThreshold(2, event.target.value)}
            aria-label={`${title}${thresholds[2].label}阈值`}
          />
        </span>
        <span className="fill">3 血量格</span>
      </div>
    </div>
  );
}

function ResourceStrip() {
  return (
    <section className="panel resourceStrip">
      <div className="resourceRail">灵石</div>
      {resourceGroups.map(({ label, count, shape, columns }) => (
        <div key={label} className="resourceGroup">
          <strong>{label}</strong>
          <div className="resourceMarks" style={{ '--resource-columns': columns }}>
            {resourceMarks(count, shape, `p1-resource-${label}`)}
          </div>
        </div>
      ))}
    </section>
  );
}

function ConflictContent() {
  return (
    <div className="conflictContent">
      <h2>冲突开始时</h2>
      <p>冲突场景中你的回合　1 轻巧动作</p>
      <p>战斗动作　2 轻巧 / 1 全力动作</p>
      <p>
        轮次开始时恢复　拆招次数
        {marks(1, '', { groupId: 'conflict-recovery' })}
      </p>
    </div>
  );
}

function CombatPanel() {
  const { current, upgradeCards } = useSheet();
  const method = current.method;
  const buffs = getUnlockedMethodAttackBuffs(method, current.realm, upgradeCards);

  return (
    <section className="combatPanel">
      <div className="combatSkills">
        <div className="combatSkill primary">
          <b>普通攻击</b>
          <div>
            轻巧动作，对近距离 1 名目标
            <br />
            造成【核心属性】点伤害
          </div>
        </div>
        <div className="combatSkill">
          <b>法门增益一</b>
          <AutoFitText className="combatBoostText" fitOptions={{ minRatio: 0.42, minPx: 6 }}>
            {buffs[0] || ''}
          </AutoFitText>
        </div>
        <div className="combatSkill">
          <b>法门增益二</b>
          <AutoFitText className="combatBoostText" fitOptions={{ minRatio: 0.42, minPx: 6 }}>
            {buffs[1] || ''}
          </AutoFitText>
        </div>
      </div>
    </section>
  );
}

// 立绘面板：点击画布上传图片，支持更换 / 移除。
function DiceEffectStrip() {
  const { diceEffects, cycleDiceEffect } = useSheet();

  return (
    <div className="diceEffectStrip" aria-label="双骰结果">
      {diceLabels.map((label, index) => {
        const effect = diceEffects[index] || '无效果';
        return (
          <button
            key={label}
            type="button"
            className={`diceEffectItem state-${effect === '大失败' ? 'fail' : effect === '大成功' ? 'success' : 'none'}`}
            onClick={() => cycleDiceEffect(index)}
            aria-label={`${label}：${effect}，点击修改`}
          >
            <span>{label}</span>
            <strong>{effect}</strong>
          </button>
        );
      })}
    </div>
  );
}

function PortraitPanel() {
  const { portrait, setPortrait } = useSheet();
  const inputRef = useRef(null);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPortrait(reader.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <section className="panel portraitPanel">
      <div className="portraitBody">
        <button
          type="button"
          className={`portraitCanvas${portrait ? ' hasImage' : ''}`}
          onClick={() => inputRef.current?.click()}
          aria-label={portrait ? '更换立绘' : '上传立绘'}
        >
          {portrait ? (
            <>
              <img src={portrait} alt="角色立绘" className="portraitImage" />
              <span className="portraitReplace">更换立绘</span>
            </>
          ) : (
            <span className="portraitPlaceholder">
              <b>立绘</b>
              <small>点击上传图片</small>
            </span>
          )}
        </button>
        <DiceEffectStrip />
      </div>
      {portrait ? (
        <button
          type="button"
          className="portraitRemove"
          onClick={() => setPortrait(null)}
          aria-label="移除立绘"
          title="移除立绘"
        >
          <X size={14} strokeWidth={2.6} aria-hidden="true" />
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="portraitInput"
        onChange={handleFile}
      />
    </section>
  );
}

function PageOne() {
  const { current, fateState, fortuneOverflow, setFortuneOverflow, thresholdBonuses } = useSheet();
  const source = current.source;
  const origin = current.origin;
  const dao = current.dao;

  // 道源能力面板顶部用一行小标签显示增益，把主要空间留给能力正文。
  const sourceAbilityContent = source ? (
    <div className="sourceAbilityStack">
      <div className="sourceBuffLine"><b>增益</b><AutoFitText as="span">{source.buff}</AutoFitText></div>
      <AutoFitText className="sourceAbilityText">{source.ability}</AutoFitText>
    </div>
  ) : null;

  return (
    <div className="sheet sheetPageOne">
      <SheetHeader title="角色卡 - 基础信息" />
      <main className="pageOneLayout">
        <section className="leftBlock">
          <section className="leftTop">
            <section className="leftPane">
              <InfoPanel />

              <SideTextPanel title="道心" field="daoHeart" />
              <SideTextPanel title="身份" field="identity" />

              <section className="attributeGrid">
                {attributeDefs.map(({ title, hint }) => (
                  <AttributePanel key={title} title={title} hint={hint} />
                ))}
              </section>
            </section>

            <section className="middlePane">
              <PortraitPanel />
              <CounterBox
                title="福缘点上限"
                filled={fateState.fortuneLimit}
                ghost={0}
                locked
                overflowCounter={{
                  value: fortuneOverflow,
                  setValue: setFortuneOverflow,
                  label: '溢出福缘点',
                }}
                note={'消耗 1 点\n重骰 1-2 个骰子 / 此次检定值 +2 / 为故事增添一笔'}
              />
              <CounterBox
                title="历练点补充"
                filled={fateState.trainingSupply}
                ghost={0}
                locked
                note="GM 会使用历练点为故事带来转折与挑战"
              />
            </section>
          </section>

          <section className="triplePanels">
            <SelectorPanel title="道源" category="source" vertical />
            <SelectorPanel title="法门" category="method" vertical />
            <SelectorPanel title="大道" category="dao" vertical />
          </section>

          <section className="doublePanels">
            <TextPanel title="道源能力" content={sourceAbilityContent} />
            <TextPanel
              title="出身效果"
              content={<FilledText value={origin ? origin.effect : ''} placeholder="选择出身后自动填充" />}
            />
          </section>

          <section className="doublePanels compact">
            <TextPanel
              title="道源效果"
              content={<FilledText value={source ? source.effect : ''} placeholder="选择道源后自动填充" />}
            />
            <TextPanel
              title="大道效果"
              content={<FilledText value={dao ? dao.effect : ''} placeholder="选择大道后自动填充" />}
            />
          </section>

          <ResourceStrip />
        </section>

        <section className="rightPane">
          <FateRibbon />
          <TalentBoard />
          <section className="bottomSection">
            <section className="panel statsPanel">
              <StatRow label="正常血量" filled={6} ghost={4} />
              <StatRow label="险境血量" filled={6} ghost={4} />
              <StatRow label="灵气" filled={8} ghost={7} />
              <StatRow label="储物格" filled={6} ghost={5} />
              <StatRow
                label="损伤"
                filled={3}
                ghost={0}
                note={'（受到 1 次重伤时扣除 1 格）\n扣除完后，血量格上限仅剩险境血量格'}
              />
              <StatRow
                label="调息"
                filled={1}
                ghost={0}
                note={'【全力动作】恢复一半的灵气格（向下取整）\n并【回气】所有资源'}
              />
              <DamageThreshold
                title="肉体伤害阈值"
                value={source ? source.bodyThreshold : null}
                allBonus={thresholdBonuses.all}
                mediumBonus={thresholdBonuses.bodyMedium}
                heavyBonus={thresholdBonuses.bodyHeavy}
              />
              <DamageThreshold
                title="神魂伤害阈值"
                value={source ? source.soulThreshold : null}
                allBonus={thresholdBonuses.all}
                mediumBonus={thresholdBonuses.soulMedium}
                heavyBonus={thresholdBonuses.soulHeavy}
              />
            </section>
            <CombatPanel />
          </section>
        </section>
      </main>
    </div>
  );
}

function SpellTable({ title, rows, tall = false, variant = '', prefill = [] }) {
  return (
    <section className={`panel spellTable${tall ? ' tall' : ''}${variant ? ` ${variant}` : ''}`} style={{ '--rows': rows }}>
      <div className="panelTitle panelTitleCentered">{title}</div>
      <div className="spellHead">
        <span>名称</span>
        <span>效果</span>
      </div>
      {Array.from({ length: rows }, (_, index) => {
        const entry = prefill[index];
        return (
          <div key={index} className="spellRow">
            <AutoFitText className="spellName">{entry ? entry.name : ''}</AutoFitText>
            <AutoFitText className="spellText">{entry ? entry.text : ''}</AutoFitText>
          </div>
        );
      })}
    </section>
  );
}

function PdfSheetHeader({ title = '角色卡 - 基础信息' }) {
  return (
    <header className="pdfSheetHeader">
      <img src={gameLogo} alt="逆命仙途" className="pdfLogo" />
      <h1>{title}</h1>
    </header>
  );
}

function PdfTable({ title, rows, prefill = [], className = '', children }) {
  return (
    <section className={`pdfTable ${className}`.trim()} style={{ '--rows': rows }}>
      <div className="pdfTableTitle">{title}</div>
      {children || (
        <>
          <div className="pdfTableHead">
            <span>名称</span>
            <span>效果</span>
          </div>
          {Array.from({ length: rows }, (_, index) => {
            const entry = prefill[index];
            return (
              <div key={index} className="pdfTableRow">
                <div>{entry?.name || ''}</div>
                <div>{entry?.text || ''}</div>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

function PdfCheck({ label, double = false }) {
  return (
    <span className="pdfCheckLine">
      <span className="pdfCheck" />
      {double ? <span className="pdfCheck" /> : null}
      {label ? <span>{label}</span> : null}
    </span>
  );
}

function PdfClickableCheck({ id, label, double = false }) {
  const groupId = id || `pdf-check-${label || 'blank'}`;
  return (
    <span className="pdfCheckLine interactive">
      <ClickableMark id={`${groupId}:0`} ariaLabel={label ? `${label} 标记 1` : '标记'} />
      {double ? <ClickableMark id={`${groupId}:1`} ariaLabel={label ? `${label} 标记 2` : '标记 2'} /> : null}
      {label ? <span>{label}</span> : null}
    </span>
  );
}

function PdfActionCheck({ label, action, breakthroughId }) {
  const { breakthroughChoices, breakthroughAvailability, triggerBreakthroughOption } = useSheet();
  const selected = breakthroughChoices[breakthroughId]?.selectedOptionIds?.includes(action) || false;
  const available = breakthroughAvailability[breakthroughId] || false;

  return (
    <span className="pdfCheckLine interactive">
      <button
        type="button"
        className={`mark ${selected ? 'filled' : ''}`.trim()}
        onClick={() => triggerBreakthroughOption(breakthroughId, action)}
        disabled={!available}
        aria-label={`${label} 标记`}
        aria-pressed={selected}
      />
      <span>{label}</span>
    </span>
  );
}

function PdfMarks({ solid = 3, ghost = 3 }) {
  return (
    <span className="pdfMarks">
      {Array.from({ length: solid }, (_, index) => <span key={`s-${index}`} />)}
      {Array.from({ length: ghost }, (_, index) => <span key={`g-${index}`} className="ghost" />)}
    </span>
  );
}

function PdfClickableMarks({ solid = 3, ghost = 3, label = '方格', groupId = label }) {
  return (
    <span className="pdfMarks interactive">
      {Array.from({ length: solid }, (_, index) => (
        <ClickableMark key={`s-${index}`} id={`${groupId}:solid:${index}`} ariaLabel={`${label} ${index + 1}`} />
      ))}
      {Array.from({ length: ghost }, (_, index) => (
        <ClickableMark
          key={`g-${index}`}
          id={`${groupId}:ghost:${index}`}
          initialState="ghost"
          ariaLabel={`${label} 虚线 ${index + 1}`}
        />
      ))}
    </span>
  );
}

function FormulaCell({ value }) {
  return <span className="formulaCell">{value}</span>;
}

function EditableFormulaCell({ prefix, field, ariaLabel }) {
  const { texts, setText } = useSheet();
  return (
    <span className="formulaCell editable">
      <span>{prefix}</span>
      <input
        className="printControl"
        type="text"
        value={texts[field] || ''}
        onChange={(event) => setText(field, event.target.value)}
        aria-label={ariaLabel}
      />
      <PrintValue value={texts[field] || ''} className="formulaPrintValue" />
      <span>】</span>
    </span>
  );
}

function PdfTextInput({ field, label }) {
  const { texts, setText } = useSheet();
  return (
    <>
      <input
        className="pdfTextInput printControl"
        type="text"
        value={texts[field] || ''}
        onChange={(event) => setText(field, event.target.value)}
        aria-label={label}
      />
      <PrintValue value={texts[field] || ''} className="pdfTextInput" />
    </>
  );
}

function EditableFeatureTable({ rows, namePrefix, effectPrefix, className = '' }) {
  const { texts, setText } = useSheet();
  return (
    <div className={`featureRows editableFeatureTable ${className}`.trim()}>
      <div className="featureTableHead">
        <span />
        <span>名称</span>
        <span>效果</span>
      </div>
      {rows.map((label, index) => {
        const nameField = `${namePrefix}${index}`;
        const effectField = `${effectPrefix}${index}`;
        return (
          <div key={label} className="featureRow">
            <span>{label}</span>
            <input
              className="printControl"
              type="text"
              value={texts[nameField] || ''}
              onChange={(event) => setText(nameField, event.target.value)}
              aria-label={`${label}名称`}
            />
            <PrintValue value={texts[nameField] || ''} className="featurePrintValue" />
            <textarea
              className="printControl"
              value={texts[effectField] || ''}
              onChange={(event) => setText(effectField, event.target.value)}
              aria-label={`${label}效果`}
            />
            <PrintValue value={texts[effectField] || ''} className="featurePrintValue" />
          </div>
        );
      })}
    </div>
  );
}

function PageTwo() {
  const { current, upgradeCards } = useSheet();
  const source = current.source;

  const prefillFor = (title) => {
    if (title === '神通') return uniqueCards([...getInitialSourceSkills(source), ...upgradeCards.skills]);
    if (title === '秘法') return uniqueCards([...getInitialSourceArts(source), ...upgradeCards.arts]);
    if (title === '感悟') return getDisplayedInsightCards(upgradeCards);
    if (title === '本源感悟') return getDisplayedOriginInsightCards(upgradeCards);
    if (title === '功法') return uniqueCards([...upgradeCards.daoMethods, ...upgradeCards.extraMethods]);
    if (title === '灵宝') return uniqueCards(upgradeCards.treasures);
    return [];
  };

  return (
    <div className="sheet pdfSheet sheetPageTwo">
      <PdfSheetHeader />
      <main className="pdfPageBody pdfTwoGrid">
        {pdfSpellGroups.map(({ title, rows, className }) => (
          <PdfTable
            key={title}
            title={title}
            rows={rows}
            className={className}
            prefill={prefillFor(title)}
          />
        ))}
      </main>
    </div>
  );
}

function PageThree() {
  const formationFeatureRows = ['固定特征壹', '固定特征贰', '临时特征壹', '临时特征贰', '临时特征叁', '临时特征肆'];
  const followerMoveRows = ['普攻', '初始神通', '神通壹', '神通贰', '神通叁', '秘法壹'];

  return (
    <div className="sheet pdfSheet">
      <PdfSheetHeader />
      <main className="pdfPageBody pdfThreeGrid">
        <section className="pdfBlock formationBasics">
          <div className="pdfTableTitle">阵法·基础信息</div>
          <div className="formLine"><span>阵法名称</span><PdfTextInput field="formationName" label="阵法名称" /></div>
          <div className="formLine"><span>检定加值</span><PdfTextInput field="formationBonus" label="阵法检定加值" /></div>
          <div className="formLine split">
            <span>护阵难度</span><EditableFormulaCell prefix="9+【" field="formationGuardDifficulty" ariaLabel="护阵难度加值" />
            <span>破阵难度</span><EditableFormulaCell prefix="10+【" field="formationBreakDifficulty" ariaLabel="破阵难度加值" />
          </div>
          <div className="formationLife">
            <span>破阵命盘</span>
            <div>
              <PdfMarks solid={4} ghost={2} />
              <p>当破阵命盘被对方推进后，所有的临时特征会暂时失效</p>
              <p>你可以通过推进动作将破阵命盘独立刻度擦除，并重新将所有临时特征激活</p>
            </div>
          </div>
          <EditableFeatureTable
            rows={formationFeatureRows}
            namePrefix="formationFeatureName"
            effectPrefix="formationFeatureEffect"
          />
        </section>

        <PdfTable title="特征库" rows={1} className="plainBlock traitLibrary">
          <div className="emptyLarge" />
        </PdfTable>

        <section className="pdfBlock upgradeBlock">
          <div className="pdfTableTitle">阵法升级</div>
          <div className="upgradeIntro">当你拥有阵法后<br />你每次境界提升时<br />都可以标记一项进行升级</div>
          <div className="upgradeChecks">
            <PdfClickableCheck id="p3-formation-upgrade-reinforce" label="加固阵法 - 破阵命盘刻度 +1" double />
            <PdfClickableCheck id="p3-formation-upgrade-trap" label="增加机关 - 破阵难度 +1" />
            <PdfClickableCheck id="p3-formation-upgrade-study" label="修习阵法 - 护阵难度 +1" />
            <PdfClickableCheck id="p3-formation-upgrade-backlash" label="阵法反噬 - 当对方破阵命盘未推进成功时，可对其触发一个临时特征（需标记 2 次进行升级）" double />
            <PdfClickableCheck id="p3-formation-upgrade-repair" label="阵法修复 - 轮次结束时，破阵命盘会自动擦除 1 格（需标记 2 次进行升级）" double />
          </div>
        </section>

        <section className="pdfBlock followerBasics">
          <div className="pdfTableTitle">随从·基础信息</div>
          <div className="formLine"><span>随从名称</span><PdfTextInput field="followerName" label="随从名称" /></div>
          <div className="formLine"><span>检定加值</span><EditableFormulaCell prefix="2+【" field="followerBonus" ariaLabel="随从检定加值" /></div>
          <div className="formLine split wide">
            <span>种类</span>
            <PdfClickableCheck id="p3-follower-kind-beast" label="灵兽（血量格扣除完后会对主人造成一次中度伤害）" />
            <PdfClickableCheck id="p3-follower-kind-puppet" label="傀儡（血量格扣除完时会扣除主人 1 灵气格）" />
          </div>
          <div className="formLine"><span>正常血量</span><PdfClickableMarks label="正常血量" groupId="p3-follower-normal-hp" /></div>
          <div className="formLine"><span>险境血量</span><PdfClickableMarks label="险境血量" groupId="p3-follower-danger-hp" /></div>
          <div className="thresholdBand">
            {['肉体伤害阈值', '神魂伤害阈值'].map((label) => (
              <div key={label}>
                <span>{label}</span>
                <b>无伤害</b><em>轻伤 <FormulaCell value="5+【 】" /></em><b>1 血量格</b>
                <em>中伤 <FormulaCell value="7+【 】" /></em><b>2 血量格</b>
                <em>重伤 <FormulaCell value="11+【 】" /></em><b>3 血量格</b>
              </div>
            ))}
          </div>
          <EditableFeatureTable
            rows={followerMoveRows}
            namePrefix="followerMoveName"
            effectPrefix="followerMoveEffect"
            className="followerMoves"
          />
        </section>

        <section className="pdfBlock followerUpgrade">
          <div className="pdfTableTitle">随从升级</div>
          <div className="upgradeIntro">当你拥有随从后<br />你每次境界提升时<br />都可以标记一项进行升级</div>
          <div className="upgradeChecks twoCol">
            <PdfClickableCheck id="p3-follower-upgrade-hp" label="血量格 +1" double />
            <PdfClickableCheck id="p3-follower-upgrade-counter" label="获得 1 拆招次数（无需消耗灵气）" />
            <PdfClickableCheck id="p3-follower-upgrade-body" label="肉体中伤与重伤阈值 +1" />
            <PdfClickableCheck id="p3-follower-upgrade-guard" label="护主 - 当你首次血量归零时，灵兽会保护你" />
            <PdfClickableCheck id="p3-follower-upgrade-soul" label="神魂中伤与重伤阈值 +1" />
            <PdfClickableCheck id="p3-follower-upgrade-rest" label="长休时，与灵兽玩耍交流，并获得 1 辐缘点" />
            <PdfClickableCheck id="p3-follower-upgrade-bonus" label="检定值 +1" />
          </div>
        </section>

        <section className="pdfBlock bloodlineBlock">
          <div className="pdfTableTitle">灵兽血脉</div>
          <div className="bloodlineNote">你的兽修精进时<br />灵兽的血脉就会进行一次血脉升级<br />创建你的本命灵兽时<br />选择血脉并获取增益</div>
          <div className="bloodlineTable">
            <div><span /><b>名称</b><b>初始能力</b><b>进阶能力</b></div>
            {['凶杀血脉', '灵法血脉', '铁骨血脉', '愈灵血脉', '缚影血脉', '追风血脉'].map((name, index) => (
              <div key={name}>
                <PdfClickableCheck id={`p3-bloodline-${index}`} label="" />
                <span>{name}</span>
                <span>{['所有伤害 +1', '首次使用神通不扣除主人灵气格', '血量格 +1', '习得神通 - 疗愈', '习得神通 - 缚身', '在一个场景中一次，可携带主人进行一次远距离移动'][index]}</span>
                <span>{['具有优势时，破置值 -1', '可以从道源神通中学习一个', '首次受到的中度伤害无效', '退场时主人不会受到伤害', '对具有异常状态的敌人检定具有优势', '不受缓速影响'][index]}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function BreakthroughPanel({ breakthroughId, title, stages }) {
  const options = getBreakthroughChoiceOptions(breakthroughId);
  const isFoundation = breakthroughId === 'foundation-early';
  return (
    <section className="breakthroughPanel">
      <div className="breakthroughStage">
        <strong>{title}</strong>
        {stages.map((stage) => (
          <div key={stage.label} className="stageStep">
            <b>{stage.label.split('').map((char) => <span key={char}>{char}</span>)}</b>
            {stage.checked ? (
              <span className="stageTaskList">
                {stage.text.split('\n').map((line) => (
                  <span key={line} className="stageTask">
                    <span className="pdfCheck" />
                    <span>{line}</span>
                  </span>
                ))}
              </span>
            ) : (
              <span>{stage.text}</span>
            )}
          </div>
        ))}
      </div>
      <div className="breakthroughSeal">突破</div>
      <div className="breakthroughResult">
        <div className="resultPrimary">
          境界提升至{isFoundation ? '筑基前期' : '金丹前期'}，境界乘值 +1<br />
          {isFoundation ? <><span>将真元上限增加 1 格</span><br /></> : null}
          根据已修习的法门选择 1 张本源感悟卡<br />
          {isFoundation ? <><span>核心属性 +1</span><br /></> : null}
          所有阈值 +3<br />
          灵气格 +2{isFoundation ? <><br /><span>升级你的法门至进阶</span></> : null}
        </div>
        <div className="breakthroughOptionHint">
          在以下升级选项中标记至多 2 格<br />
          每标记 1 格获取一次对应提升
        </div>
        <div className="resultChecks">
          {options.map((option) => (
            <PdfActionCheck
              key={`${breakthroughId}-${option.id}`}
              breakthroughId={breakthroughId}
              action={option.id}
              label={option.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PageFour() {
  return (
    <div className="sheet pdfSheet">
      <PdfSheetHeader />
      <main className="pdfPageBody pdfFourGrid">
        <div className="breakthroughStack">
          <BreakthroughPanel
            breakthroughId="foundation-early"
            title="练气期"
            stages={[
              { label: '前期', text: '根据道源选取初始神通与秘法\n根据法门选择 1 张练气期感悟卡', checked: true },
              { label: '中期', text: '根据道源选取自选神通 1 个\n并选择 1 个练气期凡阶灵宝' },
              { label: '后期', text: '根据法门选择 1 张练气期感悟卡\n根据大道选择 1 个功法' },
            ]}
          />
          <BreakthroughPanel
            breakthroughId="golden-core"
            title="筑基期"
            stages={[
              { label: '前期', text: '根据法门选择 1 张筑基期感悟卡\n并选择 1 个灵宝' },
              { label: '中期', text: '根据道源选取自选神通与秘法各 1 个' },
              { label: '后期', text: '根据法门选择 1 张筑基期感悟卡\n根据大道选择 1 个筑基期功法' },
            ]}
          />
        </div>
        <div className="pdfBlankHalf" />
      </main>
    </div>
  );
}

function CraftCard() {
  return (
    <section className="craftCard">
      <div><span>名称</span><b /></div>
      <div><span>效果</span><b /></div>
      <div><span>总进度</span><b /></div>
      <div><span>当前进度</span><b /></div>
    </section>
  );
}

function PageFive() {
  return (
    <div className="sheet pdfSheet">
      <PdfSheetHeader />
      <main className="pdfPageBody pdfFiveGrid">
        <PdfTable title="灵宝库" rows={4} className="treasureTable" />
        <PdfTable title="已学习技艺列表" rows={2} className="learnedSkills">
          <div className="learnedSkillRows">
            {Array.from({ length: 2 }, (_, index) => <div key={index} />)}
          </div>
        </PdfTable>
        <PdfTable title="储物袋" rows={3} className="bagTable">
          <div className="bagRows">
            {Array.from({ length: 3 }, (_, index) => <div key={index} />)}
          </div>
        </PdfTable>
        <section className="craftsPanel">
          <div className="craftsTitle">技艺造物</div>
          <div className="craftList">
            {Array.from({ length: 4 }, (_, index) => <CraftCard key={index} />)}
          </div>
        </section>
      </main>
    </div>
  );
}

function renderSheetPage(pageId) {
  if (pageId === 'p1') return <PageOne />;
  if (pageId === 'p2') return <PageTwo />;
  if (pageId === 'p3') return <PageThree />;
  if (pageId === 'p4') return <PageFour />;
  if (pageId === 'p5') return <PageFive />;
  return <PageSix />;
}

function PrintPageRenderer() {
  const lastPageIndex = pageTabs.length - 1;
  return (
    <div className="printPageStack" aria-hidden="true" inert={true}>
      {pageTabs.map((page, index) => (
        <section
          key={page.id}
          className={`printPage printPage-${page.id}${index === lastPageIndex ? ' lastPrintPage' : ''}`}
        >
          {renderSheetPage(page.id)}
        </section>
      ))}
    </div>
  );
}

// 资源库弹窗：以卡片形式展示某一分类的全部条目及详细说明。
function ResourceLibrary() {
  const {
    library,
    openLibrary,
    selections,
    select,
  } = useSheet();
  if (!library) return null;

  const { label, options } = LIBRARY[library];
  const selectedIndex = selections[library];

  const choose = (index) => {
    select(library, index);
    openLibrary(null);
  };

  return (
    <div className="libraryOverlay" onClick={() => openLibrary(null)} role="presentation">
      <div className="libraryModal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={`资源库 ${label}`}>
        <header className="libraryHeader">
          <h2>资源库<span className="librarySep">·</span>{label}</h2>
          <button type="button" className="libraryClose" onClick={() => openLibrary(null)} aria-label="关闭">
            <X size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </header>
        <div className="libraryGrid">
          <button
            type="button"
            className={`libraryCard blank${selectedIndex == null ? ' selected' : ''}`}
            onClick={() => choose(null)}
          >
            <div className="libraryCardTitle">留空</div>
            <div className="libraryCardBody">不选择任何{label}，相关栏目保持空白。</div>
          </button>
          {options.map((option, index) => (
            <button
              key={option.name}
              type="button"
              className={`libraryCard${selectedIndex === index ? ' selected' : ''}`}
              onClick={() => choose(index)}
            >
              <div className="libraryCardTitle">{option.name}</div>
              <div className="libraryCardBody">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UpgradeSelectionModal() {
  const {
    upgradePrompt,
    setUpgradePrompt,
    appendUpgradeCards,
  } = useSheet();
  const [selected, setSelected] = useState({});

  useEffect(() => {
    setSelected({});
  }, [upgradePrompt]);

  if (!upgradePrompt) return null;

  const sections = upgradePrompt.sections || [];
  const selectCard = (section, card) => {
    setSelected((prev) => ({ ...prev, [section.key]: card }));
  };
  const ready = sections.every((section) => selected[section.key]);
  const confirm = () => {
    const selectedSections = sections.map((section) => ({
      key: section.key,
      target: section.target,
      sourceKind: section.sourceKind,
      cards: selected[section.key] ? [selected[section.key]] : [],
    }));
    appendUpgradeCards(selectedSections);
    setUpgradePrompt(null);
  };

  return (
    <div className="libraryOverlay" onClick={() => setUpgradePrompt(null)} role="presentation">
      <div className="libraryModal methodInsightModal upgradeModal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={upgradePrompt.title}>
        <header className="libraryHeader">
          <h2>升级选择<span className="librarySep">·</span>{upgradePrompt.title}</h2>
          <button type="button" className="libraryClose" onClick={() => setUpgradePrompt(null)} aria-label="关闭">
            <X size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </header>
        <div className="libraryToolbar">
          <button type="button" className="libraryBack" onClick={() => setUpgradePrompt(null)}>稍后再选</button>
          <div className="libraryChoiceSummary">
            {sections.map((section) => (
              <span key={section.key}>{section.title}：{selected[section.key] ? formatCardDisplayName(selected[section.key]) : '未选择'}</span>
            ))}
          </div>
          <button type="button" className="libraryDone" onClick={confirm} disabled={!ready}>填入卡面</button>
        </div>
        <div className="libraryInsightScroll">
          {sections.map((section) => (
            <section key={section.key} className="libraryChoiceSection">
              <div className="librarySectionTitle">
                <h3>{section.title}</h3>
                <span>{section.hint}</span>
              </div>
              <div className="libraryGrid libraryInsightGrid">
                {section.options.length ? section.options.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    className={`libraryCard${selected[section.key]?.name === option.name ? ' selected' : ''}`}
                    onClick={() => selectCard(section, option)}
                  >
                    <div className="libraryCardTitle">{formatCardDisplayName(option)}</div>
                    <div className="libraryCardBody">{option.text || option.desc || option.effect || ''}</div>
                  </button>
                )) : (
                  <div className="libraryEmptyState">{section.hint || '当前没有可选资源，请先补全前置选择。'}</div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function RealmHistoryModal() {
  const {
    current,
    realmHistoryOpen,
    reachableRealms,
    selectReachedRealm,
    setRealmHistoryOpen,
  } = useSheet();

  if (!realmHistoryOpen) return null;

  return (
    <div className="libraryOverlay" onClick={() => setRealmHistoryOpen(false)} role="presentation">
      <div className="libraryModal realmHistoryModal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="选择已到达境界">
        <header className="libraryHeader">
          <h2>境界<span className="librarySep">·</span>已到达</h2>
          <button type="button" className="libraryClose" onClick={() => setRealmHistoryOpen(false)} aria-label="关闭">
            <X size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </header>
        <div className="realmHistoryGrid">
          {reachableRealms.map((realm, index) => (
            <button
              key={realm.name}
              type="button"
              className={`realmHistoryCard${current.realm?.name === realm.name ? ' selected' : ''}`}
              onClick={() => selectReachedRealm(index)}
            >
              <span>{realm.name}</span>
              <small>{realm.ability}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AttributeChoiceModal() {
  const {
    attributeChoicePrompt,
    setAttributeChoicePrompt,
    confirmAttributeChoices,
  } = useSheet();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setSelected([]);
  }, [attributeChoicePrompt]);

  if (!attributeChoicePrompt) return null;

  const toggle = (title) => {
    setSelected((prev) => {
      if (prev.includes(title)) return prev.filter((entry) => entry !== title);
      if (prev.length >= 2) return prev;
      return [...prev, title];
    });
  };

  return (
    <div className="libraryOverlay" onClick={() => setAttributeChoicePrompt(null)} role="presentation">
      <div className="libraryModal attributeChoiceModal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="选择非核心属性">
        <header className="libraryHeader">
          <h2>属性分配<span className="librarySep">·</span>两个非核心属性 +1</h2>
          <button type="button" className="libraryClose" onClick={() => setAttributeChoicePrompt(null)} aria-label="关闭">
            <X size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </header>
        <div className="attributeChoiceGrid">
          {attributeChoicePrompt.choices.map((choice) => (
            <button
              key={choice.title}
              type="button"
              className={`attributeChoiceCard${selected.includes(choice.title) ? ' selected' : ''}`}
              onClick={() => toggle(choice.title)}
            >
              <span>{choice.title}</span>
              <strong>当前 {choice.value || '0'}</strong>
            </button>
          ))}
        </div>
        <footer className="attributeChoiceFooter">
          <span>已选择 {selected.length}/2</span>
          <button type="button" className="libraryDone" onClick={() => confirmAttributeChoices(selected)} disabled={selected.length !== 2}>
            确认分配
          </button>
        </footer>
      </div>
    </div>
  );
}

function SaveArchiveModal() {
  const {
    saveOpen,
    setSaveOpen,
    saveSlots,
    activeSaveSlotId,
    handleSaveCurrent,
    loadSaveSlot,
    renameSlot,
    removeSaveSlot,
  } = useSheet();
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    if (!saveOpen) {
      setEditingSlotId(null);
      setDraftName('');
    }
  }, [saveOpen]);

  if (!saveOpen) return null;

  const full = saveSlots.length >= 10;
  const startEditing = (slot) => {
    setEditingSlotId(slot.id);
    setDraftName(slot.name);
  };
  const cancelEditing = () => {
    setEditingSlotId(null);
    setDraftName('');
  };
  const confirmEditing = () => {
    const nextName = draftName.trim();
    if (!editingSlotId || !nextName) return;
    renameSlot(editingSlotId, nextName);
    cancelEditing();
  };

  return (
    <div className="libraryOverlay" onClick={() => setSaveOpen(false)} role="presentation">
      <div className="libraryModal saveArchiveModal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="存档管理">
        <header className="libraryHeader">
          <h2>存档<span className="librarySep">·</span>{saveSlots.length}/10</h2>
          <button type="button" className="libraryClose" onClick={() => setSaveOpen(false)} aria-label="关闭">
            <X size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </header>
        <div className="saveArchiveToolbar">
          <button type="button" className="libraryDone" onClick={() => handleSaveCurrent()}>
            保存当前
          </button>
          <button type="button" className="libraryBack" onClick={() => handleSaveCurrent({ forceNew: true })} disabled={full}>
            新建存档
          </button>
          <span>当前工作区会自动缓存；手动存档最多 10 个。</span>
        </div>
        <div className="saveSlotList">
          {saveSlots.length ? saveSlots.map((slot) => (
            <section key={slot.id} className={`saveSlotCard${slot.id === activeSaveSlotId ? ' active' : ''}`}>
              <div className="saveSlotMain">
                {editingSlotId === slot.id ? (
                  <input
                    type="text"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') confirmEditing();
                      if (event.key === 'Escape') cancelEditing();
                    }}
                    aria-label={`编辑 ${slot.name} 名称`}
                    autoFocus
                  />
                ) : (
                  <strong className="saveSlotName">{slot.name}</strong>
                )}
                <small>
                  {slot.id === activeSaveSlotId ? '当前存档 · ' : ''}
                  更新于 {new Date(slot.updatedAt).toLocaleString('zh-CN')}
                </small>
              </div>
              <div className="saveSlotActions">
                {editingSlotId === slot.id ? (
                  <>
                    <button type="button" className="libraryDone" onClick={confirmEditing} disabled={!draftName.trim()}>
                      保存名称
                    </button>
                    <button type="button" className="libraryBack" onClick={cancelEditing}>
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="libraryDone" onClick={() => loadSaveSlot(slot.id)}>
                      切换
                    </button>
                    <button type="button" className="libraryBack" onClick={() => startEditing(slot)}>
                      编辑
                    </button>
                    <button type="button" className="saveDeleteButton" onClick={() => removeSaveSlot(slot.id)} aria-label={`删除 ${slot.name}`}>
                      <Trash2 size={15} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            </section>
          )) : (
            <div className="saveEmptyState">还没有手动存档。点击“保存当前”创建第一个存档。</div>
          )}
        </div>
      </div>
    </div>
  );
}

// 因果抽卡弹窗：洗牌 → 翻牌揭示 → 填入卡面。
function getFateChoices(fateDraw) {
  if (!fateDraw) return [];
  if (fateDraw.plans.length === 1) {
    const [onlyPlan] = fateDraw.plans;
    return [
      { type: 'draw', label: '抽取', detail: onlyPlan.label, plan: onlyPlan },
      {
        type: 'manual',
        label: '自选',
        detail: formatManualFatePlanLabel(onlyPlan, fateDraw.title, tierMeta),
        plans: [onlyPlan],
      },
    ];
  }

  return [
    ...fateDraw.plans.map((option) => ({
      type: 'draw',
      label: '抽取',
      detail: option.label,
      plan: option,
    })),
    { type: 'manual', label: '自选', detail: '从平平无奇的两条命途里自行挑选', plans: fateDraw.plans },
  ];
}

function FateDrawModal() {
  const { fateDraw, closeFateDraw, setDrawnTalents } = useSheet();
  const [plan, setPlan] = useState(null);
  const [phase, setPhase] = useState('choose'); // choose | manual | shuffle | reveal
  const [results, setResults] = useState([]);
  const [manualPlans, setManualPlans] = useState([]);
  const [manualSelections, setManualSelections] = useState([]);
  const timerRef = useRef(null);

  const startDraw = (selectedPlan) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlan(selectedPlan);
    setManualPlans([]);
    setManualSelections([]);
    setResults(drawByPlan(selectedPlan));
    setPhase('shuffle');
    timerRef.current = setTimeout(() => setPhase('reveal'), 1250);
  };

  const startManual = (plans) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setManualPlans(plans);
    setPlan(plans[0]);
    setResults([]);
    setManualSelections([]);
    setPhase('manual');
  };

  const chooseManualPlan = (selectedPlan) => {
    setPlan(selectedPlan);
    setManualSelections([]);
  };

  const selectManualEntry = (slotIndex, slot, poolIndex) => {
    const pool = getPoolForFateSlot(slot, { talentPool, punishmentPool });
    const entry = pool[poolIndex];
    setManualSelections((prev) => {
      const next = [...prev];
      next[slotIndex] = createManualFateEntry(slot, entry);
      return next;
    });
  };

  useEffect(() => {
    if (!fateDraw) return undefined;
    setPlan(null);
    setResults([]);
    setManualPlans([]);
    setManualSelections([]);
    setPhase('choose');
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fateDraw]);

  if (!fateDraw) return null;

  const confirm = () => {
    setDrawnTalents(phase === 'manual' ? manualSelections.filter(Boolean) : results);
    closeFateDraw();
  };
  const choices = getFateChoices(fateDraw);
  const manualSlots = getFatePlanSlots(plan, {
    fateTitle: fateDraw.title,
    manual: true,
    tierMeta,
  });
  const manualReady = manualSlots.length > 0 && manualSlots.every((_, index) => manualSelections[index]);

  return (
    <div className="fateDrawOverlay" role="dialog" aria-modal="true" aria-label="因果抽取">
      <div className="fateDrawSky" aria-hidden="true" />
      <div className="fateDrawModal" onClick={(event) => event.stopPropagation()}>
        <header className="fateDrawHeader">
          <div className="fateDrawTitleGroup">
            <span className="fateDrawKicker">因 果 天 定</span>
            <h2>{fateDraw.title}</h2>
          </div>
          <button type="button" className="fateDrawClose" onClick={closeFateDraw} aria-label="关闭">
            <X size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </header>

        {phase === 'choose' ? (
          <div className="fateChoose">
            <p className="fateChooseHint">选择本次因果的处理方式：</p>
            <div className="fateChooseList">
              {choices.map((option) => (
                <button
                  key={`${option.type}-${option.detail}`}
                  type="button"
                  className="fateChooseBtn"
                  onClick={() => (option.type === 'draw' ? startDraw(option.plan) : startManual(option.plans))}
                >
                  <span>
                    {option.label}
                    <em>{option.detail}</em>
                  </span>
                  <ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ) : phase === 'manual' ? (
          <div className="fateManual">
            {manualPlans.length > 1 ? (
              <div className="manualPlanTabs" aria-label="自选命途">
                {manualPlans.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={plan === option ? 'on' : ''}
                    onClick={() => chooseManualPlan(option)}
                  >
                    {formatManualFatePlanLabel(option, fateDraw.title, tierMeta)}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="manualSlotList">
              {manualSlots.map((slot, slotIndex) => {
                const pool = getPoolForFateSlot(slot, { talentPool, punishmentPool });
                const selected = manualSelections[slotIndex];
                return (
                  <section key={slot.key} className="manualSlot">
                    <header>
                      <span>{slot.label}</span>
                      <small>{selected ? `已选择：${selected.name}` : '请选择一张卡'}</small>
                    </header>
                    <div className="manualCardGrid">
                      {pool.map((entry, poolIndex) => (
                        <button
                          key={entry.name}
                          type="button"
                          className={`manualCard${selected?.name === entry.name ? ' selected' : ''}`}
                          onClick={() => selectManualEntry(slotIndex, slot, poolIndex)}
                        >
                          <div className="manualCardTitle">{entry.name}</div>
                          <div className="manualCardBody">{entry.effect}</div>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
            <div className="fateActions manual">
              <button type="button" className="fateRedraw" onClick={() => setPhase('choose')}>
                返回
              </button>
              <button type="button" className="fateConfirm" onClick={confirm} disabled={!manualReady}>
                填入卡面
              </button>
            </div>
          </div>
        ) : (
          <div className={`fateStage phase-${phase}`}>
            {phase === 'shuffle' ? (
              <div className="fateShuffle">
                <div className="shuffleDeck">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="shuffleCard" style={{ '--i': i }} />
                  ))}
                </div>
                <p className="shuffleText">天机演算中……</p>
              </div>
            ) : (
              <>
                <div className={`fateResults count-${results.length}`}>
                  {results.map((entry, i) => {
                    const meta = tierMeta[entry.tier];
                    const kindLabel = entry.kind === 'talent' ? '天赋' : '天谴';
                    return (
                      <div
                        key={`${entry.kind}-${entry.name}`}
                        className={`drawCard tier-${meta.tone} kind-${entry.kind}`}
                        style={{ '--i': i }}
                      >
                        <div className="drawCardInner">
                          <div className="drawCardFace drawCardBack">
                            <span className="drawCardRune">命</span>
                          </div>
                          <div className="drawCardFace drawCardFront">
                            <div className="drawCardTop">
                              <span className="drawCardTier">{meta.label}</span>
                              <span className="drawCardKind">{kindLabel}</span>
                            </div>
                            <div className="drawCardName">{entry.name}</div>
                            <AutoFitText className="drawCardEffect">{entry.effect}</AutoFitText>
                            <span className="drawCardGlow" aria-hidden="true" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="fateActions">
                  <button type="button" className="fateRedraw" onClick={() => startDraw(plan)}>
                    重新抽取
                  </button>
                  <button type="button" className="fateConfirm" onClick={confirm}>
                    填入卡面
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function readJsonStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable in private or restricted contexts.
  }
}

function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // localStorage may be unavailable in private or restricted contexts.
  }
}

function getQuestionnaireLibraries() {
  return {
    realm: realmOptions.map((option) => option.name),
    origin: originOptions.map((option) => option.name),
    source: sourceOptions.map((option) => option.name),
    method: methodOptions.map((option) => option.name),
    dao: daoOptions.map((option) => option.name),
    fate: Object.keys(fateDraws),
  };
}

function QuestionnairePage() {
  const [answers, setAnswers] = useState(() => ({
    ...createEmptyAnswers(questionnaireConfig),
    ...readJsonStorage(QUESTIONNAIRE_DRAFT_KEY, {}),
  }));
  const [errors, setErrors] = useState([]);
  const firstErrorRef = useRef(null);

  useEffect(() => {
    writeJsonStorage(QUESTIONNAIRE_DRAFT_KEY, answers);
  }, [answers]);

  useEffect(() => {
    if (errors.length > 0 && firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errors]);

  const updateSingle = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setErrors((prev) => prev.filter((id) => id !== questionId));
  };

  const updateMultiple = (questionId, optionId) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
    setErrors((prev) => prev.filter((id) => id !== questionId));
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validateQuestionnaireAnswers(questionnaireConfig, answers);
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    const result = resolveQuestionnaireResult({
      questionnaire: questionnaireConfig,
      answers,
      libraries: getQuestionnaireLibraries(),
    });
    writeJsonStorage(QUESTIONNAIRE_RESULT_KEY, result);
    removeStorage(QUESTIONNAIRE_DRAFT_KEY);
    window.location.href = '/';
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <main className="questionnaireShell">
      <form className="questionnairePaper" onSubmit={submit}>
        <header className="questionnaireHeader">
          <div>
            <span className="questionnaireKicker">逆命仙途</span>
            <h1>{questionnaireConfig.title}</h1>
            <p>{questionnaireConfig.description}</p>
          </div>
          <button type="button" className="questionnaireBack" onClick={goHome}>
            返回主界面
          </button>
        </header>

        <div className="questionnaireList">
          {questionnaireConfig.questions.map((question, index) => {
            const value = answers[question.id];
            const isMultiple = question.type === 'multiple';
            const hasError = errors.includes(question.id);
            return (
              <section
                key={question.id}
                ref={hasError && errors[0] === question.id ? firstErrorRef : null}
                className={`questionnaireQuestion${hasError ? ' hasError' : ''}`}
              >
                <header className="questionHeader">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h2>{question.title}</h2>
                    <small>{isMultiple ? '可多选' : '单选'}{question.required === false ? ' / 可跳过' : ' / 必答'}</small>
                  </div>
                </header>
                <div className="questionOptions">
                  {question.options.map((option) => {
                    const checked = isMultiple
                      ? Array.isArray(value) && value.includes(option.id)
                      : value === option.id;
                    return (
                      <label key={option.id} className={`questionnaireOption${checked ? ' selected' : ''}`}>
                        <input
                          type={isMultiple ? 'checkbox' : 'radio'}
                          name={question.id}
                          value={option.id}
                          checked={checked}
                          onChange={() => (isMultiple
                            ? updateMultiple(question.id, option.id)
                            : updateSingle(question.id, option.id))}
                        />
                        <span className="optionMark" aria-hidden="true" />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                {hasError ? <p className="questionError">请选择至少一项。</p> : null}
              </section>
            );
          })}
        </div>

        <footer className="questionnaireFooter">
          <span>填写记录会自动保存在本机，提交后清除。</span>
          <button type="submit" className="questionnaireSubmit">生成角色卡</button>
        </footer>
      </form>
    </main>
  );
}

const guideAttributeTitles = ['仙躯', '身法', '神魂', '灵蕴'];

function GuideStepNav({ step, onStep }) {
  return (
    <nav className="guideStepNav" aria-label="引导车卡步骤">
      {GUIDE_STEPS.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={`${index === step ? 'active' : ''} ${index < step ? 'past' : ''}`.trim()}
          onClick={() => onStep(index)}
          aria-current={index === step ? 'step' : undefined}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <b>{item.label}</b>
        </button>
      ))}
    </nav>
  );
}

function GuideInfoStep({ values, onChange }) {
  const fields = [
    { field: 'name', label: '名称', placeholder: '输入角色名称' },
    { field: 'race', label: '种族', placeholder: '如：人族、妖族' },
    { field: 'belong', label: '归属', placeholder: '宗门、家族、势力或地域' },
    { field: 'daoHeart', label: '道心', placeholder: '一句话描述修行执念' },
    { field: 'identity', label: '身份', placeholder: '一句话描述当前身份' },
  ];

  return (
    <section className="guideStepSection guideInfoStep">
      <header className="guideSectionHeader">
        <span>01</span>
        <div>
          <h2>角色基本信息</h2>
        </div>
      </header>

      <div className="guideInfoGrid">
        {fields.map((item) => (
          <label key={item.field} className="guideField">
            <span>{item.label}</span>
            <input
              type="text"
              value={values[item.field] || ''}
              placeholder={item.placeholder}
              onChange={(event) => onChange(item.field, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function GuideOptionStep({ title, category, options, value, onChange }) {
  const hasSelection = value !== null && value !== undefined && value !== '';
  const detail = hasSelection ? options[Number(value)] || null : null;
  const detailRows = detail ? [
    { label: '描述', value: detail.desc },
    { label: '效果', value: detail.effect },
    { label: '能力', value: detail.ability },
    { label: '增益', value: detail.buff },
    { label: '肉身阈值', value: detail.bodyThreshold },
    { label: '神魂阈值', value: detail.soulThreshold },
  ].filter((item) => item.value) : [];
  const methodResourceSections = category === 'method' ? getMethodResourceSections(detail) : [];

  return (
    <section className={`guideStepSection guideOptionStep guideOptionStep-${category}`}>
      <header className="guideSectionHeader">
        <span>{String(GUIDE_STEPS.findIndex((item) => item.id === category) + 1).padStart(2, '0')}</span>
        <div>
          <h2>选择{title}</h2>
        </div>
      </header>

      <div className="guideOptionLayout">
        <label className="guideOptionDropdown">
          <span>{title}</span>
          <select
            className="guideOptionSelect"
            value={value ?? ''}
            onChange={(event) => onChange(Number(event.target.value))}
          >
            <option value="" disabled>-- 请选择 --</option>
            {options.map((option, index) => (
              <option key={`${category}-${option.name}`} value={index}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <aside className="guideDetailCard">
          {detail ? (
            <>
              <header>
                <span>{title}</span>
                <h3>{detail.name}</h3>
              </header>
              <div className="guideDetailContent">
                {detailRows.map((item) => (
                  <section key={item.label} className="guideDetailSection">
                    <h4>{item.label}</h4>
                    <p>{item.value}</p>
                  </section>
                ))}

                {methodResourceSections.map((section) => (
                  <section key={section.title} className="guideDetailSection">
                    <h4>{section.title}</h4>
                    <ul>
                      {section.items.map((entry) => (
                        typeof entry === 'string' ? (
                          <li key={entry}>{entry}</li>
                        ) : (
                          <li key={entry.name || entry.text}>
                            <strong>{entry.name}</strong>
                            <span>{entry.text}</span>
                          </li>
                        )
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function GuideAttributeStep({ values, coreAttribute, onAttributeChange, onCoreChange }) {
  const attributeValueChips = ['0', '1', '2', '3'];
  const assignedValues = new Set(guideAttributeTitles.map((title) => String(values[title] ?? '').trim()).filter(Boolean));
  const availableValues = attributeValueChips.filter((value) => !assignedValues.has(value));

  const beginDragAttributeValue = (event, value, sourceTitle = '') => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', value);
    event.dataTransfer.setData('application/x-guide-attribute-value', JSON.stringify({ value, sourceTitle }));
  };

  const dropAttributeValue = (event, targetTitle) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData('application/x-guide-attribute-value');
    const fallbackValue = event.dataTransfer.getData('text/plain');
    let parsed = {};
    try {
      parsed = payload ? JSON.parse(payload) : {};
    } catch {
      parsed = {};
    }
    const draggedValue = String(parsed.value ?? fallbackValue ?? '').trim();
    const sourceTitle = parsed.sourceTitle || '';
    if (!attributeValueChips.includes(draggedValue)) return;
    if (sourceTitle === targetTitle) return;

    const targetValue = String(values[targetTitle] ?? '').trim();
    if (sourceTitle) onAttributeChange(sourceTitle, targetValue);
    onAttributeChange(targetTitle, draggedValue);
  };

  return (
    <section className="guideStepSection guideAttributeStep">
      <header className="guideSectionHeader">
        <span>03</span>
        <div>
          <h2>分配四维属性</h2>
        </div>
      </header>

      <div className="guideAttributeChipBank" aria-label="可拖拽属性数值">
        {availableValues.map((value) => (
          <button
            key={value}
            type="button"
            className="guideAttributeChip"
            draggable
            onDragStart={(event) => beginDragAttributeValue(event, value)}
            aria-label={`拖拽数值 ${value}`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="guideAttributeList">
        {guideAttributeTitles.map((title) => {
          const hint = attributeDefs.find((item) => item.title === title)?.hint;
          const selected = coreAttribute === title;
          const assignedValue = String(values[title] ?? '').trim();
          return (
            <div
              key={title}
              className={`guideAttributeRow${selected ? ' isCore' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropAttributeValue(event, title)}
            >
              <div className="guideAttributeMeta">
                <div className="guideAttributePanelTitle">
                  <strong>{title}</strong>
                  <button
                    type="button"
                    className={`guideCoreToggle${selected ? ' selected' : ''}`}
                    onClick={() => onCoreChange(selected ? null : title)}
                    aria-pressed={selected}
                    aria-label={`${title}${selected ? '已设为核心属性' : '设为核心属性'}`}
                  >
                    <Star size={15} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
                {hint ? <span>{hint}</span> : null}
              </div>

              <div className="guideAttributeControls">
                <div className={`guideAttributeDropZone${assignedValue ? ' filled' : ''}`}>
                  {assignedValue ? (
                    <button
                      type="button"
                      className="guideAttributeChip placed"
                      draggable
                      onDragStart={(event) => beginDragAttributeValue(event, assignedValue, title)}
                      aria-label={`拖拽${title}数值 ${assignedValue}`}
                    >
                      {assignedValue}
                    </button>
                  ) : (
                    <span>拖入数值</span>
                  )}
                  <input
                    type="hidden"
                    value={assignedValue}
                    onChange={(event) => onAttributeChange(title, event.target.value)}
                    aria-label={`${title}数值`}
                  />
                </div>
                {assignedValue ? (
                  <button
                    type="button"
                    className="guideAttributeClear"
                    onClick={() => onAttributeChange(title, '')}
                    aria-label={`清除${title}数值`}
                  >
                    清除
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GuideFateStep({ value, onChange }) {
  const selectedTitle = fateValueToTitle(value);
  const details = getFateDisplayDetails(selectedTitle);

  return (
    <section className="guideStepSection guideFateStep">
      <header className="guideSectionHeader">
        <span>07</span>
        <div>
          <h2>选择因果值</h2>
        </div>
      </header>

      <div className="guideFateGrid">
        {[-3, -2, -1, 0, 1, 2, 3].map((entry) => {
          const selected = value === entry;
          return (
            <button
              key={entry}
              type="button"
              className={`guideFateCard${selected ? ' selected' : ''}`}
              onClick={() => onChange(entry)}
              aria-pressed={selected}
            >
              <strong>{entry > 0 ? `+${entry}` : String(entry)}</strong>
              <span>{fateValueToTitle(entry)}</span>
            </button>
          );
        })}
      </div>

      <article className="guideFateSummary" aria-live="polite">
        <header className={`guideFateSummaryHeader ${details.tone}`}>
          <span>{value > 0 ? `+${value}` : String(value)}</span>
          <strong>{details.title}</strong>
        </header>
        <div className="guideFateSummaryBody">
          <section>
            <h3>数值效果</h3>
            <ul>
              {details.numericEffects.map((effect, index) => <li key={`${effect}-${index}`}>{effect}</li>)}
            </ul>
          </section>
          <section>
            <h3>天赋 / 天谴</h3>
            <p>{details.talentRule}</p>
          </section>
        </div>
      </article>
    </section>
  );
}

function GuidePreviewStep({ values, errors, onErrorStep, onRandom, onConfirm }) {
  const selected = {
    origin: values.origin != null ? originOptions[values.origin] : null,
    source: values.source != null ? sourceOptions[values.source] : null,
    method: values.method != null ? methodOptions[values.method] : null,
    dao: values.dao != null ? daoOptions[values.dao] : null,
    fateTitle: fateValueToTitle(values.fateValue),
  };
  const fateDetails = getFateDisplayDetails(selected.fateTitle);
  const previewGroups = [
    { label: '名称', value: values.name || '未填写' },
    { label: '种族', value: values.race || '未填写' },
    { label: '归属', value: values.belong || '未填写' },
    { label: '道心', value: values.daoHeart || '未填写' },
    { label: '身份', value: values.identity || '未填写' },
  ];
  const selectedSummaries = [
    {
      title: '02 出身',
      heading: selected.origin?.name || '未选择',
      items: [
        { label: '描述', value: selected.origin?.desc },
        { label: '效果', value: selected.origin?.effect },
      ],
    },
    {
      title: '04 道源',
      heading: selected.source?.name || '未选择',
      items: [
        { label: '描述', value: selected.source?.desc },
        { label: '能力', value: selected.source?.ability },
      ],
    },
    {
      title: '05 法门',
      heading: selected.method?.name || '未选择',
      items: [
        { label: '描述', value: selected.method?.desc },
        { label: '攻击增益', value: getUnlockedMethodAttackBuffs(selected.method, null).join('；') },
      ],
    },
    {
      title: '06 大道',
      heading: selected.dao?.name || '未选择',
      items: [
        { label: '描述', value: selected.dao?.desc },
        { label: '效果', value: selected.dao?.effect },
      ],
    },
  ];
  const previewCards = [
    {
      title: '01 信息',
      heading: values.name || '未命名角色',
      items: previewGroups,
    },
    selectedSummaries[0],
    {
      title: '03 分配属性',
      heading: values.coreAttribute || '未设置核心属性',
      items: [
        ...guideAttributeTitles.map((title) => ({ label: title, value: values.attributes?.[title] || '未填写' })),
        { label: '核心属性', value: values.coreAttribute || '未设置' },
      ],
    },
    ...selectedSummaries.slice(1),
    {
      title: '07 因果值',
      heading: selected.fateTitle || '未选择命格',
      items: [
        { label: '因果值', value: values.fateValue > 0 ? `+${values.fateValue}` : String(values.fateValue) },
        { label: '命格', value: selected.fateTitle || '未选择' },
        { label: '数值效果', value: fateDetails.numericEffects.join('；') },
        { label: '天赋 / 天谴', value: fateDetails.talentRule },
      ],
    },
  ];

  return (
    <section className="guideStepSection guidePreviewStep">
      <header className="guideSectionHeader">
        <span>08</span>
        <div>
          <h2>预览与确认</h2>
        </div>
      </header>

      <div className="guidePreviewMasonry">
        {previewCards.map((card) => (
          <article key={card.title} className="guidePreviewCard">
            <header>
              <span>{card.title}</span>
              <h3>{card.heading}</h3>
            </header>
            <div className="guidePreviewFields">
              {card.items.filter((item) => item.value).map((item) => (
                <div key={item.label} className="guidePreviewField">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {errors.length > 0 ? (
        <div className="guidePreviewErrors" role="alert">
          <h4>还有这些地方需要补完</h4>
          <ul>
            {errors.map((item, index) => (
              <li key={`${item.field}-${index}`}>
                <button type="button" onClick={() => onErrorStep(item.step)}>
                  {GUIDE_STEPS[item.step]?.label || '对应步骤'}：{item.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="guidePreviewActions">
        <button type="button" className="guidePreviewRandom" onClick={onRandom}>
          <Shuffle size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>随机生成</span>
        </button>
        <button type="button" className="guidePreviewConfirm" onClick={onConfirm}>
          确认
        </button>
      </div>
    </section>
  );
}

function GuidedCardPage() {
  const defaultRealmIndex = getDefaultRealmIndex(realmOptions);
  const activeSlotId = readJsonStorage(CARD_ACTIVE_SAVE_SLOT_KEY, null);
  const [drafts, setDrafts] = useState(() => readJsonStorage(GUIDED_DRAFTS_KEY, {}));
  const [draft, setDraft] = useState(() => getGuideDraft(readJsonStorage(GUIDED_DRAFTS_KEY, {}), activeSlotId));
  const [errors, setErrors] = useState([]);
  const step = clampGuideStep(draft.step);
  const values = draft.values;

  const persistDraft = (updater) => {
    setDraft((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      setDrafts((currentDrafts) => {
        const nextDrafts = setGuideDraft(currentDrafts, activeSlotId, next);
        writeJsonStorage(GUIDED_DRAFTS_KEY, nextDrafts);
        return nextDrafts;
      });
      return next;
    });
  };

  const setStep = (nextStep) => persistDraft((current) => ({ ...current, step: clampGuideStep(nextStep) }));
  const updateValue = (field, value) => persistDraft((current) => ({
    ...current,
    values: { ...current.values, [field]: value },
  }));
  const updateAttribute = (field, value) => persistDraft((current) => ({
    ...current,
    values: applyGuideAttributeValue(current.values, field, value),
  }));

  const handleRandomGuide = () => {
    const result = createRandomCardState({
      options: {
        realm: realmOptions,
        origin: originOptions,
        source: sourceOptions,
        method: methodOptions,
        dao: daoOptions,
      },
      fateDraws,
      drawPlan: drawByPlan,
    });
    persistDraft((current) => mergeRandomCardIntoGuideDraft({ ...current, step: GUIDE_STEPS.length - 1 }, result));
    setErrors([]);
  };

  const handleConfirmGuide = () => {
    const nextErrors = validateGuideValues(values);
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    const result = createGuidedCardResult({
      draft,
      options: {
        realm: realmOptions,
        origin: originOptions,
        source: sourceOptions,
        method: methodOptions,
        dao: daoOptions,
      },
      fateDraws,
      drawPlan: drawByPlan,
      defaultRealmIndex,
      getFateState,
      now: () => new Date(),
    });
    writeJsonStorage(GUIDED_RESULT_KEY, result);
    const nextDrafts = clearGuideDraft(drafts, activeSlotId);
    writeJsonStorage(GUIDED_DRAFTS_KEY, nextDrafts);
    window.location.href = '/';
  };

  const renderGuideStep = () => {
    if (step === 0) return <GuideInfoStep values={values} onChange={updateValue} />;
    if (step === 1) return <GuideOptionStep title="出身" category="origin" options={originOptions} value={values.origin} onChange={(value) => updateValue('origin', value)} />;
    if (step === 2) return <GuideAttributeStep values={values.attributes} coreAttribute={values.coreAttribute} onAttributeChange={updateAttribute} onCoreChange={(value) => updateValue('coreAttribute', value)} />;
    if (step === 3) return <GuideOptionStep title="道源" category="source" options={sourceOptions} value={values.source} onChange={(value) => updateValue('source', value)} />;
    if (step === 4) return <GuideOptionStep title="法门" category="method" options={methodOptions} value={values.method} onChange={(value) => updateValue('method', value)} />;
    if (step === 5) return <GuideOptionStep title="大道" category="dao" options={daoOptions} value={values.dao} onChange={(value) => updateValue('dao', value)} />;
    if (step === 6) return <GuideFateStep value={values.fateValue} onChange={(value) => updateValue('fateValue', value)} />;
    return <GuidePreviewStep values={values} errors={errors} onErrorStep={setStep} onRandom={handleRandomGuide} onConfirm={handleConfirmGuide} />;
  };

  return (
    <main className="guideShell">
      <section className="guidePaper">
        <header className="guideHeader">
          <div>
            <span className="guideKicker">逆命仙途</span>
            <h1>引导车卡</h1>
          </div>
          <button type="button" className="questionnaireBack" onClick={() => { window.location.href = '/'; }}>
            返回主界面
          </button>
        </header>
        <GuideStepNav step={step} onStep={setStep} />
        <div className="guideBody">{renderGuideStep()}</div>
      </section>
      <footer className="guideFooter">
        <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0}>上一步</button>
        <span>{step + 1} / {GUIDE_STEPS.length}</span>
        {step < GUIDE_STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep(step + 1)}>下一步</button>
        ) : null}
      </footer>
    </main>
  );
}

function App() {
  const defaultRealmIndex = getDefaultRealmIndex(realmOptions);
  const autosavedCard = readJsonStorage(CARD_AUTOSAVE_KEY, null);
  const emptyCardSnapshot = createEmptyCardSnapshot(defaultRealmIndex);
  const initialStateRef = useRef(null);
  if (!initialStateRef.current) {
    const storedSaveSlots = normalizeSaveSlots(readJsonStorage(CARD_SAVE_SLOTS_KEY, []));
    const storedActiveSaveSlotId = readJsonStorage(CARD_ACTIVE_SAVE_SLOT_KEY, null);
    const initialArchive = ensureInitialSaveSlot(storedSaveSlots, {
      activeSlotId: storedActiveSaveSlotId,
      snapshot: autosavedCard || emptyCardSnapshot,
    });
    const activeSlotSnapshot = initialArchive.slots.find((slot) => slot.id === initialArchive.activeSlotId)?.snapshot;
    const initialSnapshot = storedActiveSaveSlotId && autosavedCard
      ? autosavedCard
      : activeSlotSnapshot || autosavedCard || emptyCardSnapshot;
    initialStateRef.current = {
      saveSlots: initialArchive.slots,
      activeSaveSlotId: initialArchive.activeSlotId,
      snapshot: normalizeCardSnapshot(initialSnapshot, defaultRealmIndex),
    };
  }
  const initialState = initialStateRef.current;
  const [tab, setTab] = useState('p1');
  const [hintOpen, setHintOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [library, setLibrary] = useState(null);
  const [saveSlots, setSaveSlots] = useState(() => initialState.saveSlots);
  const [activeSaveSlotId, setActiveSaveSlotId] = useState(() => initialState.activeSaveSlotId);
  const [selections, setSelections] = useState(() => initialState.snapshot.selections);
  const [texts, setTexts] = useState(() => initialState.snapshot.texts);
  const [attributes, setAttributes] = useState(() => initialState.snapshot.attributes);
  const [coreAttribute, setCoreAttribute] = useState(() => initialState.snapshot.coreAttribute);
  // 抽卡弹窗目标：{ title, plans } 或 null。drawnTalents 为已填入卡面的天赋 / 天谴。
  const [fateDraw, setFateDraw] = useState(null);
  const [drawnTalents, setDrawnTalents] = useState(() => initialState.snapshot.drawnTalents);
  // 立绘图片（data URL），切页不丢失。
  const [portrait, setPortrait] = useState(() => initialState.snapshot.portrait);
  const [selectedFateTitle, setSelectedFateTitle] = useState(() => initialState.snapshot.selectedFateTitle);
  const [diceEffects, setDiceEffects] = useState(() => initialState.snapshot.diceEffects);
  const [fortuneOverflow, setFortuneOverflow] = useState(() => initialState.snapshot.fortuneOverflow);
  const [markStates, setMarkStates] = useState(() => initialState.snapshot.markStates);
  const [thresholdBonuses, setThresholdBonuses] = useState(() => initialState.snapshot.thresholdBonuses);
  const [upgradeChoices, setUpgradeChoices] = useState(() => initialState.snapshot.upgradeChoices);
  const [breakthroughChoices, setBreakthroughChoices] = useState(() => initialState.snapshot.breakthroughChoices);
  const [breakthroughChoiceDetails, setBreakthroughChoiceDetails] = useState(() => initialState.snapshot.breakthroughChoiceDetails);
  const [maxRealmIndexReached, setMaxRealmIndexReached] = useState(() => initialState.snapshot.maxRealmIndexReached);
  const [realmHistoryOpen, setRealmHistoryOpen] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState(null);
  const [attributeChoicePrompt, setAttributeChoicePrompt] = useState(null);
  const randomNoticeTimer = useRef(null);
  const promptedInitialMethodName = useRef(null);
  const currentRealmIndex = selections.realm ?? defaultRealmIndex;
  const upgradeCards = useMemo(
    () => aggregateUpgradeChoices(upgradeChoices, currentRealmIndex),
    [upgradeChoices, currentRealmIndex],
  );

  const openFateDraw = (title) => {
    const plans = fateDraws[title];
    if (plans) setFateDraw({ title, plans });
  };
  const closeFateDraw = () => setFateDraw(null);
  const showNotice = (message, duration = 2400) => {
    setNoticeMessage(message);
    if (randomNoticeTimer.current) clearTimeout(randomNoticeTimer.current);
    randomNoticeTimer.current = setTimeout(() => setNoticeMessage(''), duration);
  };

  const openLibrary = (category) => {
    setLibrary(category);
  };
  const select = (category, index) => {
    if (category === 'method') {
      if (selections.method === index) return;
      const nextMethod = methodOptions[index] || null;
      const nextPrompt = buildInitialMethodInsightPrompt(nextMethod, defaultRealmIndex);
      if (nextPrompt) promptedInitialMethodName.current = nextMethod?.name || null;
      setSelections((prev) => ({ ...prev, method: index }));
      setUpgradeChoices((prev) => removeMethodInsightChoices(prev));
      setUpgradePrompt(nextPrompt);
      return;
    }
    setSelections((prev) => ({ ...prev, [category]: index }));
  };
  const setText = (field, value) => setTexts((prev) => ({ ...prev, [field]: value }));
  const setAttributeValue = (field, value) => setAttributes((prev) => ({ ...prev, [field]: value }));
  const toggleCoreAttribute = (field) => setCoreAttribute((current) => (current === field ? null : field));
  const getStoredBreakthroughState = (breakthroughId) => createBreakthroughChoiceState(
    breakthroughId,
    breakthroughChoices[breakthroughId]?.selectedOptionIds,
  );
  const getBreakthroughOptionDetails = (breakthroughId, optionId) => (
    breakthroughChoiceDetails[breakthroughId]?.options?.[optionId] || {}
  );
  const setBreakthroughOptionDetails = (breakthroughId, optionId, details) => {
    setBreakthroughChoiceDetails((prev) => {
      const breakthrough = prev[breakthroughId] || {};
      const options = { ...(breakthrough.options || {}) };
      if (details) options[optionId] = details;
      else delete options[optionId];
      return { ...prev, [breakthroughId]: { ...breakthrough, options } };
    });
  };
  const applyBreakthroughChoiceEffect = (breakthroughId, optionId, amount, details = {}) => {
    if (optionId === 'normal-health') {
      setMarkStates((store) => applyGhostCapacityDelta(store, 'p1-stat-正常血量-ghost', 4, amount));
      setThresholdBonuses((prev) => ({
        ...prev,
        bodyMedium: prev.bodyMedium + amount,
        soulMedium: prev.soulMedium + amount,
      }));
    } else if (optionId === 'danger-health') {
      setMarkStates((store) => applyGhostCapacityDelta(store, 'p1-stat-险境血量-ghost', 4, amount));
      setThresholdBonuses((prev) => ({
        ...prev,
        bodyHeavy: prev.bodyHeavy + amount,
        soulHeavy: prev.soulHeavy + amount,
      }));
    } else if (optionId === 'spirit') {
      setMarkStates((store) => applyQiCapacityDelta(store, amount));
    } else if (optionId === 'storage') {
      setMarkStates((store) => applyGhostCapacityDelta(store, 'p1-stat-储物格-ghost', 5, amount));
    } else if (optionId === 'non-core-attributes') {
      const titles = details.attributeTitles || [];
      if (titles.length) {
        setAttributes((prev) => Object.fromEntries(Object.entries(prev).map(([title, value]) => [
          title,
          titles.includes(title) ? incrementTextNumber(value, amount) : value,
        ])));
      }
    } else if (optionId === 'extra-method') {
      const storageBonus = breakthroughChoiceDetails[breakthroughId]?.fixed?.techniqueStorageBonus
        ?? getFoundationTechniqueStorageBonus(current.method);
      if (storageBonus) {
        setMarkStates((store) => applyGhostCapacityDelta(
          store,
          'p1-stat-储物格-ghost',
          5,
          -amount * storageBonus,
        ));
      }
    }
  };
  const commitBreakthroughChoice = (breakthroughId, optionId, details = {}) => {
    const previous = getStoredBreakthroughState(breakthroughId);
    const next = toggleBreakthroughChoice(previous, optionId);
    if (!next.validation.valid) {
      showNotice(next.validation.reason === 'choice-limit' ? '每次突破最多选择 2 项提升。' : '该突破没有这个选项。');
      return false;
    }
    const selecting = !previous.selectedOptionIds.includes(optionId);
    const storedDetails = selecting ? details : getBreakthroughOptionDetails(breakthroughId, optionId);
    setBreakthroughChoices((prev) => ({ ...prev, [breakthroughId]: next }));
    applyBreakthroughChoiceEffect(breakthroughId, optionId, selecting ? 1 : -1, storedDetails);
    setBreakthroughOptionDetails(breakthroughId, optionId, selecting ? storedDetails : null);
    if (!selecting && ['qi-treasure', 'foundation-treasure', 'extra-method'].includes(optionId)) {
      const realmIndex = getBreakthroughRealmIndex(breakthroughId);
      setUpgradeChoices((prev) => prev.filter((choice) => !(
        choice.realmIndex === realmIndex && choice.promptKey === optionId
      )));
    }
    return true;
  };
  const appendUpgradeCards = (cardsBySection) => {
    const realmIndex = upgradePrompt?.realmIndex ?? currentRealmIndex;
    setUpgradeChoices((prev) => appendUpgradeChoices(prev, {
      realmIndex,
      cardsBySection,
    }));
    const pending = upgradePrompt?.breakthroughOption;
    if (pending) commitBreakthroughChoice(pending.breakthroughId, pending.optionId);
  };
  const applyRealmBreakthroughEffects = (step) => {
    const effects = step.automaticEffects || {};
    setThresholdBonuses((prev) => ({ ...prev, all: prev.all + (effects.allThresholds || 0) }));
    if (step.id === 'foundation-early') {
      const techniqueStorageBonus = getFoundationTechniqueStorageBonus(current.method);
      setMarkStates((store) => {
        let next = applyFoundationBreakthroughMarkEffects(store);
        if (techniqueStorageBonus) {
          next = applyGhostCapacityDelta(next, 'p1-stat-储物格-ghost', 5, techniqueStorageBonus);
        }
        return next;
      });
      if (coreAttribute) {
        setAttributes((prev) => ({
          ...prev,
          [coreAttribute]: incrementTextNumber(prev[coreAttribute], effects.coreAttribute || 0),
        }));
      }
      setBreakthroughChoiceDetails((prev) => ({
        ...prev,
        [step.id]: {
          ...(prev[step.id] || {}),
          fixed: { coreAttribute, techniqueStorageBonus },
        },
      }));
    } else if (step.id === 'golden-core') {
      setMarkStates((store) => applyGoldenCoreBreakthroughMarkEffects(store));
    }
  };
  const revertRealmBreakthroughEffects = (breakthroughId) => {
    const state = getStoredBreakthroughState(breakthroughId);
    state.selectedOptionIds.forEach((optionId) => {
      applyBreakthroughChoiceEffect(
        breakthroughId,
        optionId,
        -1,
        getBreakthroughOptionDetails(breakthroughId, optionId),
      );
    });
    const realmIndex = getBreakthroughRealmIndex(breakthroughId);
    const optionIds = new Set(getBreakthroughChoiceOptions(breakthroughId).map((option) => option.id));
    setUpgradeChoices((prev) => prev.filter((choice) => !(
      choice.realmIndex === realmIndex && optionIds.has(choice.promptKey)
    )));
    setBreakthroughChoices((prev) => ({
      ...prev,
      [breakthroughId]: createBreakthroughChoiceState(breakthroughId),
    }));
    setThresholdBonuses((prev) => ({ ...prev, all: Math.max(0, prev.all - 3) }));
    if (breakthroughId === 'foundation-early') {
      const fixed = breakthroughChoiceDetails[breakthroughId]?.fixed || {};
      setMarkStates((store) => {
        let next = revertFoundationBreakthroughMarkEffects(store);
        if (fixed.techniqueStorageBonus) {
          next = applyGhostCapacityDelta(next, 'p1-stat-储物格-ghost', 5, -fixed.techniqueStorageBonus);
        }
        return next;
      });
      if (fixed.coreAttribute) {
        setAttributes((prev) => ({
          ...prev,
          [fixed.coreAttribute]: incrementTextNumber(prev[fixed.coreAttribute], -1),
        }));
      }
    } else {
      setMarkStates((store) => revertGoldenCoreBreakthroughMarkEffects(store));
    }
    setBreakthroughChoiceDetails((prev) => {
      const next = { ...prev };
      delete next[breakthroughId];
      return next;
    });
  };
  const upgradeRealm = () => {
    const currentIndex = selections.realm ?? defaultRealmIndex;
    const nextIndex = getNextRealmIndex(realmOptions, currentIndex);
    if (nextIndex == null || nextIndex === currentIndex) {
      showNotice('已是当前版本最高境界。');
      return;
    }

    const fromRealmName = realmOptions[currentIndex]?.name;
    const nextRealmName = realmOptions[nextIndex]?.name;
    const step = createUpgradeStep({
      fromRealmName,
      nextRealmName,
      source: current.source,
      method: current.method,
      dao: current.dao,
      upgradeCards,
    });

    setSelections((prev) => ({ ...prev, realm: nextIndex }));
    setMaxRealmIndexReached((value) => Math.max(value, nextIndex));
    if (step.autoEffects.includes('realm-breakthrough')) {
      applyRealmBreakthroughEffects(step);
    }
    if (step.selectionPrompt?.sections?.length) {
      setUpgradePrompt({ ...step.selectionPrompt, realmIndex: nextIndex });
    }
    const techniqueStorageBonus = step.id === 'foundation-early'
      ? getFoundationTechniqueStorageBonus(current.method)
      : 0;
    showNotice(techniqueStorageBonus
      ? `${step.toast} ${current.method.name}的技艺升至中阶，储物格上限 +${techniqueStorageBonus}。`
      : step.toast);
  };
  const openRealmHistory = () => setRealmHistoryOpen(true);
  const selectReachedRealm = (realmIndex) => {
    setSelections((prev) => ({ ...prev, realm: realmIndex }));
    setUpgradePrompt(null);
    setRealmHistoryOpen(false);
    if (realmIndex < currentRealmIndex) {
      const foundationIndex = getBreakthroughRealmIndex('foundation-early');
      const goldenCoreIndex = getBreakthroughRealmIndex('golden-core');
      if (currentRealmIndex >= goldenCoreIndex && realmIndex < goldenCoreIndex) {
        revertRealmBreakthroughEffects('golden-core');
      }
      if (currentRealmIndex >= foundationIndex && realmIndex < foundationIndex) {
        revertRealmBreakthroughEffects('foundation-early');
      }
      setUpgradeChoices((prev) => pruneUpgradeChoicesForRealm(prev, realmIndex));
      setMaxRealmIndexReached((value) => getMaxReachedRealmAfterSelection(value, realmIndex));
      showNotice(`已回退至${realmOptions[realmIndex]?.name || '所选境界'}，高境界选择已清除。`);
      return;
    }
    showNotice(`已切换至${realmOptions[realmIndex]?.name || '所选境界'}。`);
  };
  const openTreasurePrompt = (stage, breakthroughOption = null) => {
    setUpgradePrompt({
        title: `${stage === 'foundation' ? '筑基' : '练气'}凡阶灵宝`,
        realmIndex: breakthroughOption
          ? getBreakthroughRealmIndex(breakthroughOption.breakthroughId)
          : currentRealmIndex,
        breakthroughOption,
        sections: [{
          key: `${stage}-treasure`,
          title: `${stage === 'foundation' ? '筑基' : '练气'}凡阶灵宝`,
          hint: '临时占位池，稍后可替换为正式灵宝数据',
          limit: 1,
          target: 'treasures',
          sourceKind: 'treasure',
          options: getTreasureOptions(stage),
        }],
      });
  };
  const triggerBreakthroughOption = (breakthroughId, action) => {
    const currentState = getStoredBreakthroughState(breakthroughId);
    if (currentState.selectedOptionIds.includes(action)) {
      if (commitBreakthroughChoice(breakthroughId, action)) showNotice('已取消该突破提升。');
      return;
    }
    const preview = toggleBreakthroughChoice(currentState, action);
    if (!preview.validation.valid) {
      showNotice(preview.validation.reason === 'choice-limit' ? '每次突破最多选择 2 项提升。' : '该突破没有这个选项。');
      return;
    }
    if (action === 'non-core-attributes') {
      const choices = getNonCoreAttributeChoices(attributes, coreAttribute);
      if (choices.length < 2) {
        showNotice('请先完成属性分配并标记核心属性。');
        return;
      }
      setAttributeChoicePrompt({ choices, breakthroughOption: { breakthroughId, optionId: action } });
      return;
    }
    if (action === 'qi-treasure') {
      openTreasurePrompt('qi', { breakthroughId, optionId: action });
      return;
    }
    if (action === 'foundation-treasure') {
      openTreasurePrompt('foundation', { breakthroughId, optionId: action });
      return;
    }
    if (action === 'extra-method') {
      setUpgradePrompt({
        title: '额外修习法门',
        realmIndex: getBreakthroughRealmIndex(breakthroughId),
        breakthroughOption: { breakthroughId, optionId: action },
        sections: [{
          key: 'extra-method',
          title: '额外法门',
          hint: '选择一个额外修习的法门作为记录',
          limit: 1,
          target: 'extraMethods',
          sourceKind: 'method',
          options: methodOptions,
        }],
      });
      return;
    }
    if (commitBreakthroughChoice(breakthroughId, action)) showNotice('已应用该突破提升。');
  };
  const confirmAttributeChoices = (titles) => {
    const pending = attributeChoicePrompt?.breakthroughOption;
    if (pending) {
      commitBreakthroughChoice(pending.breakthroughId, pending.optionId, { attributeTitles: titles });
    } else {
      setAttributes((prev) => applyAttributeIncrease(prev, titles));
    }
    setAttributeChoicePrompt(null);
    showNotice(`已将 ${titles.join('、')} 各 +1。`);
  };
  const cycleDiceEffect = (index) => {
    setDiceEffects((prev) => prev.map((effect, currentIndex) => {
      if (currentIndex !== index) return effect;
      const currentEffectIndex = diceEffectCycle.indexOf(effect);
      return diceEffectCycle[(currentEffectIndex + 1) % diceEffectCycle.length];
    }));
  };

  const current = {
    realm: selections.realm != null ? realmOptions[selections.realm] : null,
    origin: selections.origin != null ? originOptions[selections.origin] : null,
    source: selections.source != null ? sourceOptions[selections.source] : null,
    method: selections.method != null ? methodOptions[selections.method] : null,
    dao: selections.dao != null ? daoOptions[selections.dao] : null,
  };
  useEffect(() => {
    const methodName = current.method?.name || null;
    if (!methodName) {
      promptedInitialMethodName.current = null;
      return;
    }
    if (upgradeCards.initialInsights.length) {
      promptedInitialMethodName.current = methodName;
      return;
    }
    if (upgradePrompt || promptedInitialMethodName.current === methodName) return;
    const prompt = buildInitialMethodInsightPrompt(current.method, defaultRealmIndex);
    if (!prompt) return;
    promptedInitialMethodName.current = methodName;
    setUpgradePrompt(prompt);
  }, [current.method, defaultRealmIndex, upgradeCards.initialInsights.length, upgradePrompt]);
  const fateState = getFateState(selectedFateTitle);
  const createCardSnapshot = () => ({
    version: 1,
    selections,
    texts,
    attributes,
    coreAttribute,
    drawnTalents,
    portrait,
    selectedFateTitle,
    diceEffects,
    fortuneOverflow,
    markStates,
    thresholdBonuses,
    upgradeChoices,
    breakthroughChoices,
    breakthroughChoiceDetails,
    maxRealmIndexReached,
  });
  const restoreCardSnapshot = (snapshot) => {
    const next = normalizeCardSnapshot(snapshot, defaultRealmIndex);
    promptedInitialMethodName.current = null;
    setSelections(next.selections);
    setTexts(next.texts);
    setAttributes(next.attributes);
    setCoreAttribute(next.coreAttribute);
    setDrawnTalents(next.drawnTalents);
    setPortrait(next.portrait);
    setSelectedFateTitle(next.selectedFateTitle);
    setDiceEffects(next.diceEffects);
    setFortuneOverflow(next.fortuneOverflow);
    setMarkStates(next.markStates);
    setThresholdBonuses(next.thresholdBonuses);
    setUpgradeChoices(next.upgradeChoices);
    setBreakthroughChoices(next.breakthroughChoices);
    setBreakthroughChoiceDetails(next.breakthroughChoiceDetails);
    setMaxRealmIndexReached(next.maxRealmIndexReached);
    setFateDraw(null);
    setLibrary(null);
    setUpgradePrompt(null);
    setAttributeChoicePrompt(null);
    setRealmHistoryOpen(false);
  };
  const persistSaveSlots = (nextSlots) => {
    setSaveSlots(nextSlots);
    writeJsonStorage(CARD_SAVE_SLOTS_KEY, nextSlots);
  };
  const setActiveSlot = (slotId) => {
    setActiveSaveSlotId(slotId);
    writeJsonStorage(CARD_ACTIVE_SAVE_SLOT_KEY, slotId);
  };
  const handleSaveCurrent = ({ forceNew = false } = {}) => {
    try {
      const snapshot = createCardSnapshot();
      if (forceNew) {
        const emptySnapshot = createEmptyCardSnapshot(defaultRealmIndex);
        const nextArchive = startNewSaveSlot(saveSlots, {
          activeSlotId: activeSaveSlotId,
          currentSnapshot: snapshot,
          emptySnapshot,
        });
        persistSaveSlots(nextArchive.slots);
        setActiveSlot(nextArchive.activeSlotId);
        restoreCardSnapshot(emptySnapshot);
        showNotice('已创建新存档。');
        return;
      }

      const nextSlots = saveSlot(saveSlots, {
        activeSlotId: activeSaveSlotId,
        snapshot,
      });
      persistSaveSlots(nextSlots);
      setActiveSlot(!activeSaveSlotId ? nextSlots[0]?.id : activeSaveSlotId);
      showNotice(!activeSaveSlotId ? '已创建新存档。' : '当前存档已更新。');
    } catch (error) {
      showNotice(error?.message || '存档失败。', 2600);
    }
  };
  const loadSaveSlot = (slotId) => {
    const nextSlots = updateSaveSlotSnapshot(saveSlots, {
      slotId: activeSaveSlotId,
      snapshot: createCardSnapshot(),
    });
    const slot = nextSlots.find((entry) => entry.id === slotId);
    if (!slot) return;
    persistSaveSlots(nextSlots);
    restoreCardSnapshot(slot.snapshot);
    setActiveSlot(slot.id);
    setSaveOpen(false);
    showNotice(`已切换至「${slot.name}」。`);
  };
  const renameSlot = (slotId, name) => {
    persistSaveSlots(renameSaveSlot(saveSlots, slotId, name));
  };
  const removeSaveSlot = (slotId) => {
    persistSaveSlots(deleteSaveSlot(saveSlots, slotId));
    if (activeSaveSlotId === slotId) setActiveSlot(null);
    showNotice('存档已删除。');
  };

  const contextValue = {
    selections,
    current,
    select,
    texts,
    setText,
    attributes,
    setAttributeValue,
    coreAttribute,
    toggleCoreAttribute,
    library,
    openLibrary,
    fateDraw,
    openFateDraw,
    closeFateDraw,
    drawnTalents,
    setDrawnTalents,
    portrait,
    setPortrait,
    selectedFateTitle,
    setSelectedFateTitle,
    fateState,
    diceEffects,
    setDiceEffects,
    cycleDiceEffect,
    fortuneOverflow,
    setFortuneOverflow,
    markStates,
    setMarkStates,
    thresholdBonuses,
    breakthroughChoices,
    breakthroughAvailability: {
      'foundation-early': currentRealmIndex >= getBreakthroughRealmIndex('foundation-early'),
      'golden-core': currentRealmIndex >= getBreakthroughRealmIndex('golden-core'),
    },
    saveOpen,
    setSaveOpen,
    saveSlots,
    activeSaveSlotId,
    handleSaveCurrent,
    loadSaveSlot,
    renameSlot,
    removeSaveSlot,
    upgradeCards,
    upgradeRealm,
    canSelectReachedRealm: maxRealmIndexReached > defaultRealmIndex,
    openRealmHistory,
    realmHistoryOpen,
    setRealmHistoryOpen,
    reachableRealms: getReachableRealmOptions(realmOptions, maxRealmIndexReached),
    selectReachedRealm,
    upgradePrompt,
    setUpgradePrompt,
    appendUpgradeCards,
    attributeChoicePrompt,
    setAttributeChoicePrompt,
    confirmAttributeChoices,
    triggerBreakthroughOption,
  };

  useEffect(() => {
    writeJsonStorage(CARD_SAVE_SLOTS_KEY, saveSlots);
    writeJsonStorage(CARD_ACTIVE_SAVE_SLOT_KEY, activeSaveSlotId);
  }, []);

  useEffect(() => {
    const printRoot = document.querySelector('.printPageStack') || document;
    return attachPrintLifecycle(printRoot);
  }, []);

  useEffect(() => {
    writeJsonStorage(CARD_AUTOSAVE_KEY, createCardSnapshot());
  }, [
    selections,
    texts,
    attributes,
    coreAttribute,
    drawnTalents,
    portrait,
    selectedFateTitle,
    diceEffects,
    fortuneOverflow,
    markStates,
    thresholdBonuses,
    upgradeChoices,
    breakthroughChoices,
    breakthroughChoiceDetails,
    maxRealmIndexReached,
  ]);

  useEffect(() => () => {
    if (randomNoticeTimer.current) clearTimeout(randomNoticeTimer.current);
  }, []);

  useEffect(() => {
    const result = readJsonStorage(QUESTIONNAIRE_RESULT_KEY, null);
    if (!result) return;

    const cardState = createQuestionnaireCardState({
      result,
      options: {
        realm: realmOptions,
        origin: originOptions,
        source: sourceOptions,
        method: methodOptions,
        dao: daoOptions,
      },
      fateDraws,
      drawPlan: drawByPlan,
    });

    promptedInitialMethodName.current = null;
    setSelections({ ...cardState.selections, realm: defaultRealmIndex });
    setAttributes(cardState.attributes);
    setThresholdBonuses({ all: 0, bodyMedium: 0, soulMedium: 0, bodyHeavy: 0, soulHeavy: 0 });
    setUpgradeChoices([]);
    setBreakthroughChoices(createEmptyBreakthroughChoices());
    setBreakthroughChoiceDetails({});
    setMarkStates({});
    setMaxRealmIndexReached(defaultRealmIndex);
    setRealmHistoryOpen(false);
    setActiveSlot(null);
    setSelectedFateTitle(cardState.selectedFateTitle);
    setDiceEffects(getFateState(cardState.selectedFateTitle).diceEffects);
    setDrawnTalents(cardState.drawnTalents);
    setFateDraw(null);
    setLibrary(null);
    removeStorage(QUESTIONNAIRE_RESULT_KEY);
    showNotice('问卷车卡完成！', 2200);
  }, []);

  useEffect(() => {
    const result = readJsonStorage(GUIDED_RESULT_KEY, null);
    const snapshot = result?.snapshot;
    if (!snapshot) return;

    promptedInitialMethodName.current = null;
    setSelections({ ...snapshot.selections, realm: defaultRealmIndex });
    setTexts({ ...defaultTexts, ...(snapshot.texts || {}) });
    setAttributes({ ...defaultAttributes, ...(snapshot.attributes || {}) });
    setCoreAttribute(snapshot.coreAttribute || null);
    setThresholdBonuses({ ...defaultThresholdBonuses, ...(snapshot.thresholdBonuses || {}) });
    setUpgradeChoices(snapshot.upgradeChoices || []);
    setBreakthroughChoices(createEmptyBreakthroughChoices());
    setBreakthroughChoiceDetails({});
    setMaxRealmIndexReached(snapshot.maxRealmIndexReached ?? defaultRealmIndex);
    setRealmHistoryOpen(false);
    setUpgradePrompt(null);
    setAttributeChoicePrompt(null);
    setSelectedFateTitle(snapshot.selectedFateTitle || null);
    setDiceEffects(snapshot.diceEffects || baseDiceEffects);
    setDrawnTalents(snapshot.drawnTalents || []);
    setPortrait(null);
    setFortuneOverflow(0);
    setMarkStates({});
    setFateDraw(null);
    setLibrary(null);
    removeStorage(GUIDED_RESULT_KEY);
    showNotice('引导车卡完成！', 2200);
  }, []);

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setHintOpen(false);
  };

  const renderPage = () => {
    return renderSheetPage(tab);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError('');
    setHintOpen(false);

    try {
      const printRoot = document.querySelector('.printPageStack');
      await printSheetsWithBrowser({ root: printRoot || document });
    } catch (error) {
      console.error('打印导出失败', error);
      setExportError(error?.message || '打印导出失败，请查看控制台错误。');
    } finally {
      setExporting(false);
    }
  };

  const handleRandomGenerate = () => {
    const result = createRandomCardState({
      options: {
        realm: realmOptions,
        origin: originOptions,
        source: sourceOptions,
        method: methodOptions,
        dao: daoOptions,
      },
      fateDraws,
      drawPlan: drawByPlan,
    });

    promptedInitialMethodName.current = null;
    setSelections({ ...result.selections, realm: defaultRealmIndex });
    setAttributes(result.attributes);
    setThresholdBonuses({ all: 0, bodyMedium: 0, soulMedium: 0, bodyHeavy: 0, soulHeavy: 0 });
    setUpgradeChoices([]);
    setBreakthroughChoices(createEmptyBreakthroughChoices());
    setBreakthroughChoiceDetails({});
    setMarkStates({});
    setMaxRealmIndexReached(defaultRealmIndex);
    setRealmHistoryOpen(false);
    setActiveSlot(null);
    setUpgradePrompt(null);
    setAttributeChoicePrompt(null);
    setSelectedFateTitle(result.selectedFateTitle);
    setDiceEffects(getFateState(result.selectedFateTitle).diceEffects);
    setDrawnTalents(result.drawnTalents);
    setFateDraw(null);
    setLibrary(null);
    showNotice('随机生成完成！', 1800);
  };

  return (
    <SheetContext.Provider value={contextValue}>
      <div className="appShell">
        <nav className="pageTabs" aria-label="页面">
          {pageTabs.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => switchTab(page.id)}
              className={tab === page.id ? 'on' : ''}
              aria-current={tab === page.id ? 'page' : undefined}
            >
              {page.label}
            </button>
          ))}
        </nav>

        <div className="stage">
          <div className="sheetScaler">
            {renderPage()}
          </div>
        </div>

        <aside className="toolRail" aria-label="工具">
          <button type="button" className="toolButton" aria-label="设置" title="设置">
            <Settings size={20} strokeWidth={2.2} aria-hidden="true" />
            <span>设置</span>
          </button>
          <div className="saveAction">
            <button
              type="button"
              className="toolButton"
              onClick={() => setSaveOpen(true)}
              aria-label="存档"
              title="存档"
            >
              <Save size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>存档</span>
            </button>
          </div>
          <div className="exportAction">
            <button
              type="button"
              className="toolButton"
              onClick={handleExport}
              disabled={exporting}
              aria-label={exporting ? '正在准备打印导出' : '打印导出'}
              aria-busy={exporting}
              aria-describedby={exportError ? 'export-error-popover' : undefined}
              title={exporting ? '正在准备打印导出' : '打印导出'}
            >
              <Printer size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>{exporting ? '准备中' : '打印'}</span>
            </button>
            {exportError ? (
              <aside id="export-error-popover" className="exportErrorPopover" role="alert">
                打印导出失败：{exportError}
              </aside>
            ) : null}
          </div>
          <div className="hintAction">
            <button
              type="button"
              className={`toolButton${hintOpen ? ' on' : ''}`}
              onClick={() => setHintOpen((open) => !open)}
              aria-label="提示"
              aria-expanded={hintOpen}
              aria-controls="conflict-popover"
              title="提示"
            >
              <Info size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>提示</span>
            </button>
            {hintOpen ? (
              <aside id="conflict-popover" className="hintPopover" aria-label="冲突开始时">
                <ConflictContent />
              </aside>
            ) : null}
          </div>
          <div className="questionnaireAction">
            <button
              type="button"
              className="toolButton"
              onClick={() => { window.location.href = '/wj'; }}
              aria-label="问卷车卡"
              title="问卷车卡"
            >
              <ListChecks size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>问卷车卡</span>
            </button>
          </div>
          <div className="guidedAction">
            <button
              type="button"
              className="toolButton"
              onClick={() => { window.location.href = '/guide'; }}
              aria-label="引导车卡"
              title="引导车卡"
            >
              <Map size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>引导车卡</span>
            </button>
          </div>
        </aside>
      </div>

      <PrintPageRenderer />

      <ResourceLibrary />
      <UpgradeSelectionModal />
      <RealmHistoryModal />
      <AttributeChoiceModal />
      <SaveArchiveModal />
      <FateDrawModal />
      {noticeMessage ? (
        <aside className="randomToast" role="status" aria-live="polite">
          {noticeMessage}
        </aside>
      ) : null}
    </SheetContext.Provider>
  );
}

const path = window.location.pathname;

createRoot(document.getElementById('root')).render(
  path === '/wj' ? <QuestionnairePage /> : path === '/guide' ? <GuidedCardPage /> : <App />,
);
