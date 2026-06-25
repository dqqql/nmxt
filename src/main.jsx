import React, { useState, useContext, createContext, useEffect, useLayoutEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronLeft, ChevronRight, CircleAlert, Download, Info, ListChecks, Minus, Plus, Settings, Star, X } from 'lucide-react';
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
  buildGuideSteps,
} from './data';
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

function ClickableMark({ initialState = 'solid', ariaLabel = '方格', allowGhost = true }) {
  const [state, setState] = useState({
    filled: initialState === 'filled',
    ghost: initialState === 'ghost',
  });

  const toggleFilled = () => {
    setState((value) => ({ ...value, filled: !value.filled }));
  };

  const toggleGhost = (event) => {
    event.preventDefault();
    if (!allowGhost) return;
    setState((value) => ({ ...value, ghost: !value.ghost }));
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

function ResourceMark({ shape, ariaLabel }) {
  const [filled, setFilled] = useState(false);

  return (
    <button
      type="button"
      className={`resourceMark ${shape}${filled ? ' resourceFilled' : ''}`}
      onClick={() => setFilled((value) => !value)}
      aria-label={ariaLabel}
    />
  );
}

const marks = (count, className = '', options = {}) => {
  const { initialFilled = 0, allowGhost = true } = options;
  return (
  Array.from({ length: count }, (_, index) => (
    <ClickableMark
      key={`${className || 'solid'}-${initialFilled}-${allowGhost}-${index}`}
      initialState={index < initialFilled ? 'filled' : className.includes('ghost') ? 'ghost' : 'solid'}
      ariaLabel={`方格 ${index + 1}`}
      allowGhost={allowGhost}
    />
  ))
  );
};

const resourceMarks = (count, shape) =>
  Array.from({ length: count }, (_, index) => (
    <ResourceMark key={index} shape={shape} ariaLabel={`灵石 ${index + 1}`} />
  ));

function getRealmInsightPrefix(realm) {
  if (!realm?.name) return '练气';
  if (realm.name.startsWith('筑基') || realm.name.startsWith('金丹')) return '筑基';
  return '练气';
}

function getFirstRealmInsight(method, realm) {
  if (!method?.insights?.length) return null;
  const prefix = getRealmInsightPrefix(realm);
  return method.insights.find((card) => card.name.startsWith(prefix)) || method.insights[0];
}

function formatInsightCard(card) {
  return card ? `${card.name}：${card.text}` : '';
}

function getRealmMultiplier(realm) {
  if (!realm?.name) return 0;
  if (realm.name.startsWith('金丹')) return 3;
  if (realm.name.startsWith('筑基')) return 2;
  if (realm.name.startsWith('练气')) return 1;
  return 0;
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

// 可填写的横线输入框（名称 / 种族 / 归属）。状态提升到 SheetContext，切页不丢失。
function FillInput({ field, label }) {
  const { texts, setText } = useSheet();
  return (
    <input
      className="fillInput"
      type="text"
      value={texts[field]}
      onChange={(event) => setText(field, event.target.value)}
      aria-label={label}
    />
  );
}

function FillTextarea({ field, label }) {
  const { texts, setText } = useSheet();
  return (
    <textarea
      className="fillTextarea"
      value={texts[field]}
      onChange={(event) => setText(field, event.target.value)}
      aria-label={label}
    />
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
    <button
      type="button"
      className={`selectorBox${option ? ' filled' : ''}`}
      onClick={() => openLibrary(category)}
    >
      {option ? option.name : <span className="selectorPlaceholder">{placeholder}</span>}
    </button>
  );
}

function FieldRow({ label, aside, filled = 0, ghost = 0, wide = false }) {
  return (
    <div className={`fieldRow${wide ? ' wide' : ''}`}>
      <div className="fieldLabel">{label}</div>
      <div className="fieldLine" />
      {aside ? <div className="fieldAside">{aside}</div> : null}
      {filled || ghost ? (
        <div className="fieldMarks">
          {marks(filled)}
          {marks(ghost, 'ghost')}
        </div>
      ) : null}
    </div>
  );
}

function InfoPanel() {
  const { current } = useSheet();
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
          <div className="splitFieldMain selectorField">
            <span className="fieldLabel">境界</span>
            <SelectorBox category="realm" />
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
              {marks(1)}
              {marks(4, 'ghost')}
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
            type="text"
            value={attributes[title] || ''}
            onChange={(event) => setAttributeValue(title, event.target.value)}
            placeholder="+0"
            aria-label={`${title}加值`}
          />
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
  return (
    <section className={`panel textPanel selectorPanel${vertical ? ' vertical' : ''}`}>
      <div className="panelTitle">{title}</div>
      <div className="textPanelBody">
        <SelectorBox category={category} />
      </div>
    </section>
  );
}

function FateRibbon() {
  const { openFateDraw, selectedFateTitle, setSelectedFateTitle, setDiceEffects } = useSheet();

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
              className={`fateStep ${tone}${selectedFateTitle === title ? ' selected' : ''}${fateDraws[title] ? ' drawable' : ''}`}
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
                <span className={`tierBadge tier-${meta.tone}`}>{meta.label}{kindLabel}</span>
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
  return (
    <div className="statRow">
      <span className="statLabel">
        <span>{label}</span>
      </span>
      <div className="statMarks">
        {marks(filled)}
        {marks(ghost, 'ghost')}
      </div>
      <InlineNote text={note} className="statNote" stacked />
    </div>
  );
}

function DamageThreshold({ title, value }) {
  const [light = '', medium = '', heavy = ''] = value ? value.match(/\d+/g) || [] : [];
  const [thresholdValues, setThresholdValues] = useState([light, medium, heavy]);
  useEffect(() => {
    setThresholdValues([light, medium, heavy]);
  }, [light, medium, heavy]);

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
            {resourceMarks(count, shape)}
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
        {marks(1)}
      </p>
    </div>
  );
}

function BuildGuidePopover({ onClose }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [currentGuideStep, setCurrentGuideStep] = useState(0);
  const dragRef = useRef(null);
  const currentStep = buildGuideSteps[currentGuideStep];
  const canShowPrevious = currentGuideStep > 0;
  const canShowNext = currentGuideStep < buildGuideSteps.length - 1;

  useEffect(() => {
    const drag = (event) => {
      const activeDrag = dragRef.current;
      if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

      setOffset({
        x: activeDrag.offset.x + event.clientX - activeDrag.startX,
        y: activeDrag.offset.y + event.clientY - activeDrag.startY,
      });
    };

    const stopDrag = (event) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
      }
    };

    window.addEventListener('pointermove', drag);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    return () => {
      window.removeEventListener('pointermove', drag);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, []);

  const startDrag = (event) => {
    if (event.button !== 0) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offset,
    };
    event.preventDefault();
  };

  return (
    <aside
      id="build-guide-popover"
      className="buildGuidePopover"
      style={{ '--guide-x': `${offset.x}px`, '--guide-y': `${offset.y}px` }}
      aria-label="建卡指引"
    >
      <header
        className="buildGuideHeader"
        onPointerDown={startDrag}
      >
        <div>
          <h2>建卡指引</h2>
          <span>拖动标题栏移动</span>
        </div>
        <button
          type="button"
          className="buildGuideClose"
          onClick={onClose}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="关闭建卡指引"
        >
          <X size={16} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </header>

      <div className="buildGuideBody">
        <section key={currentStep.title} className="guideStep">
            <div className="guideStepIndex">{String(currentGuideStep + 1).padStart(2, '0')}</div>
            <div className="guideStepContent">
              <h3>{currentStep.title}</h3>
              <p>
                <strong>{currentStep.target}</strong>
                <span>{currentStep.summary}</span>
              </p>
              {currentStep.tiers ? (
                <div className="guideTierList">
                  {currentStep.tiers.map((tier) => (
                    <div key={tier.name} className="guideTier">
                      <b>{tier.name}</b>
                      <span>
                        <mark>{tier.movement}</mark>
                        <em>{tier.perception}</em>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {currentStep.entries ? (
                <div className="guideEntryList">
                  {currentStep.entries.map((entry) => (
                    <div key={entry.name} className="guideEntry">
                      <b>{entry.name}</b>
                      <span>{entry.detail}</span>
                      <em>
                        <strong>{entry.effectName}</strong>
                        {entry.effect}
                      </em>
                    </div>
                  ))}
                </div>
              ) : null}
              {currentStep.coreValues ? (
                <div className="guideCoreList">
                  {currentStep.coreValues.map((item) => (
                    <div key={`${item.label}-${item.value}`} className={`guideCoreItem${item.primary ? ' primary' : ''}`}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <em>{item.note}</em>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
      </div>
      <footer className="buildGuideFooter">
        <button
          type="button"
          className="guidePageButton"
          onClick={() => setCurrentGuideStep((step) => Math.max(step - 1, 0))}
          disabled={!canShowPrevious}
          aria-label="上一步"
          title="上一步"
        >
          <ChevronLeft size={16} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <span>{currentGuideStep + 1} / {buildGuideSteps.length}</span>
        <button
          type="button"
          className="guideNextButton"
          onClick={() => setCurrentGuideStep((step) => Math.min(step + 1, buildGuideSteps.length - 1))}
          disabled={!canShowNext}
        >
          {canShowNext ? (
            <>
              <span>下一步</span>
              <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </>
          ) : '最后一步'}
        </button>
      </footer>
    </aside>
  );
}

function CombatPanel() {
  const { current } = useSheet();
  const method = current.method;
  const realmInsight = getFirstRealmInsight(method, current.realm);
  const buffs = method ? [formatInsightCard(realmInsight)] : [];

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
          <AutoFitText>{buffs[0] || ''}</AutoFitText>
        </div>
        <div className="combatSkill">
          <b>法门增益二</b>
          <AutoFitText>{buffs[1] || ''}</AutoFitText>
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
  const { current, fateState, fortuneOverflow, setFortuneOverflow } = useSheet();
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
              <StatRow label="灵气" filled={8} ghost={4} />
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
              <DamageThreshold title="肉体伤害阈值" value={source ? source.bodyThreshold : null} />
              <DamageThreshold title="神魂伤害阈值" value={source ? source.soulThreshold : null} />
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

function PageTwo() {
  const { current } = useSheet();
  const source = current.source;
  const method = current.method;
  const realm = current.realm;
  const selectedInsights = method ? [getFirstRealmInsight(method, realm)].filter(Boolean) : [];

  const prefillFor = (title) => {
    if (title === '神通') return source ? source.skills.slice(0, 1) : [];
    if (title === '秘法') return source ? source.arts.slice(0, 1) : [];
    return [];
  };

  return (
    <div className="sheet sheetPageTwo">
      <SheetHeader title="角色卡 - 术法信息" />
      <main className="pageTwoLayout">
        <section className="spellColumn">
          {spellGroups.map(({ title, rows }) => (
            <SpellTable key={title} title={title} rows={rows} prefill={prefillFor(title)} />
          ))}
        </section>
        <section className="spellColumn right">
          <SpellTable title="本源感悟" rows={2} variant="originInsight" />
          <SpellTable title="感悟" rows={4} variant="insightTable" prefill={selectedInsights} />
        </section>
      </main>
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

// 因果抽卡弹窗：洗牌 → 翻牌揭示 → 填入卡面。
function getPlanSlots(plan) {
  if (!plan) return [];
  return plan.items.flatMap((item) => (
    Array.from({ length: item.count }, (_, index) => ({
      kind: item.kind,
      tier: item.tier,
      key: `${item.kind}-${item.tier}-${index}`,
      label: `${tierMeta[item.tier].label}${item.kind === 'talent' ? '天赋' : '天谴'}`,
    }))
  ));
}

function getPoolForSlot(slot) {
  return slot.kind === 'talent' ? talentPool[slot.tier] : punishmentPool[slot.tier];
}

function getFateChoices(fateDraw) {
  if (!fateDraw) return [];
  if (fateDraw.plans.length === 1) {
    const [onlyPlan] = fateDraw.plans;
    return [
      { type: 'draw', label: '抽取', detail: onlyPlan.label, plan: onlyPlan },
      { type: 'manual', label: '自选', detail: onlyPlan.label, plans: [onlyPlan] },
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
    const pool = getPoolForSlot(slot);
    const entry = pool[poolIndex];
    setManualSelections((prev) => {
      const next = [...prev];
      next[slotIndex] = entry ? { kind: slot.kind, tier: slot.tier, ...entry } : null;
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
  const manualSlots = getPlanSlots(plan);
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
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="manualSlotList">
              {manualSlots.map((slot, slotIndex) => {
                const pool = getPoolForSlot(slot);
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

function App() {
  const [tab, setTab] = useState('p1');
  const [hintOpen, setHintOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [library, setLibrary] = useState(null);
  const [selections, setSelections] = useState({ realm: null, origin: null, source: null, method: null, dao: null });
  const [texts, setTexts] = useState({ name: '', race: '', belong: '', daoHeart: '', identity: '' });
  const [attributes, setAttributes] = useState({ '仙躯': '', '身法': '', '神魂': '', '灵蕴': '' });
  const [coreAttribute, setCoreAttribute] = useState(null);
  // 抽卡弹窗目标：{ title, plans } 或 null。drawnTalents 为已填入卡面的天赋 / 天谴。
  const [fateDraw, setFateDraw] = useState(null);
  const [drawnTalents, setDrawnTalents] = useState([]);
  // 立绘图片（data URL），切页不丢失。
  const [portrait, setPortrait] = useState(null);
  const [selectedFateTitle, setSelectedFateTitle] = useState(null);
  const [diceEffects, setDiceEffects] = useState(baseDiceEffects);
  const [fortuneOverflow, setFortuneOverflow] = useState(0);

  const openFateDraw = (title) => {
    const plans = fateDraws[title];
    if (plans) setFateDraw({ title, plans });
  };
  const closeFateDraw = () => setFateDraw(null);

  const openLibrary = (category) => {
    setLibrary(category);
  };
  const select = (category, index) => {
    setSelections((prev) => ({ ...prev, [category]: index }));
  };
  const setText = (field, value) => setTexts((prev) => ({ ...prev, [field]: value }));
  const setAttributeValue = (field, value) => setAttributes((prev) => ({ ...prev, [field]: value }));
  const toggleCoreAttribute = (field) => setCoreAttribute((current) => (current === field ? null : field));
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
  const fateState = getFateState(selectedFateTitle);

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
  };

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setHintOpen(false);
    setGuideOpen(false);
  };

  return (
    <SheetContext.Provider value={contextValue}>
      <div className="appShell">
        <nav className="pageTabs" aria-label="页面">
          <button
            type="button"
            onClick={() => switchTab('p1')}
            className={tab === 'p1' ? 'on' : ''}
            aria-current={tab === 'p1' ? 'page' : undefined}
          >
            第一页
          </button>
          <button
            type="button"
            onClick={() => switchTab('p2')}
            className={tab === 'p2' ? 'on' : ''}
            aria-current={tab === 'p2' ? 'page' : undefined}
          >
            第二页
          </button>
        </nav>

        <div className="stage">
          <div className="sheetScaler">
            {tab === 'p1' ? <PageOne /> : <PageTwo />}
          </div>
        </div>

        <aside className="toolRail" aria-label="工具">
          <button type="button" className="toolButton" aria-label="设置" title="设置">
            <Settings size={20} strokeWidth={2.2} aria-hidden="true" />
            <span>设置</span>
          </button>
          <button type="button" className="toolButton" onClick={() => window.print()} aria-label="导出" title="导出">
            <Download size={20} strokeWidth={2.2} aria-hidden="true" />
            <span>导出</span>
          </button>
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
          <div className="guideAction">
            <button
              type="button"
              className={`toolButton${guideOpen ? ' on' : ''}`}
              onClick={() => setGuideOpen((open) => !open)}
              aria-label="建卡指引"
              aria-expanded={guideOpen}
              aria-controls="build-guide-popover"
              title="建卡指引"
            >
              <ListChecks size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>建卡指引</span>
            </button>
            {guideOpen ? <BuildGuidePopover onClose={() => setGuideOpen(false)} /> : null}
          </div>
        </aside>
      </div>

      <ResourceLibrary />
      <FateDrawModal />
    </SheetContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
