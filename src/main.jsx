import React, { useState, useContext, createContext, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronLeft, ChevronRight, CircleAlert, Download, Info, ListChecks, Minus, Plus, Settings, Star, X } from 'lucide-react';
import { daoOptions } from './daoOptions';
import { methodOptions } from './methodOptions';
import { sourceOptions } from './sourceOptions';
import { fateDraws, drawByPlan, punishmentPool, talentPool, tierMeta } from './talentOptions';
import './style.css';

const fateCards = [
  ['逆命伍', '解锁\n逆命禁咒', '', 'dark'],
  ['逆命肆', '双三\n大失败', '', 'dark2'],
  ['逆命叁', '历练点\n补充 +1', '一仙阶天赋', 'dark3'],
  ['逆命贰', '双二\n大失败', '一天阶天赋', 'dark3'],
  ['逆命壹', '历练点\n补充 +1', '一地阶天赋', 'dark4'],
  ['平平无奇', '平凡的\n开始', '一凡级天赋\n或一人级天赋+一凡级天谴', 'neutral'],
  ['天命壹', '福缘点\n上限 +1', '一地阶天赋\n+ 一地阶天谴', 'light1'],
  ['天命贰', '双五\n大成功', '一天阶天赋\n+ 一天阶天谴', 'light2'],
  ['天命叁', '福缘点\n上限 +1', '一仙阶天赋\n+ 一仙阶天谴', 'light3'],
  ['天命肆', '双四\n大成功', '', 'light4'],
  ['天命伍', '解锁\n天命神通', '', 'light5'],
];

const diceLabels = ['双一', '双二', '双三', '双四', '双五', '双六'];
const diceEffectCycle = ['无效果', '大失败', '大成功'];
const baseDiceEffects = ['大失败', '无效果', '无效果', '无效果', '无效果', '大成功'];
const fateProgression = {
  reverse: [
    { title: '逆命壹', trainingSupply: 1 },
    { title: '逆命贰', dice: { 1: '大失败' } },
    { title: '逆命叁', trainingSupply: 1 },
    { title: '逆命肆', dice: { 2: '大失败' } },
    { title: '逆命伍' },
  ],
  forward: [
    { title: '天命壹', fortuneLimit: 1 },
    { title: '天命贰', dice: { 4: '大成功' } },
    { title: '天命叁', fortuneLimit: 1 },
    { title: '天命肆', dice: { 3: '大成功' } },
    { title: '天命伍' },
  ],
};

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

const talents = [
  { title: '仙躯', hint: '搬运、阻挡、抵抗' },
  { title: '身法', hint: '移动、灵巧、隐匿' },
  { title: '神魂', hint: '感知、干扰、分析' },
  { title: '灵蕴', hint: '交涉、法术、魅力' },
];

const spellGroups = [
  { title: '神通', rows: 4 },
  { title: '秘法', rows: 2 },
  { title: '功法', rows: 2 },
  { title: '灵宝', rows: 2 },
];

const resourceGroups = [
  { label: '颗', count: 10, shape: 'circle', columns: 5 },
  { label: '袋', count: 10, shape: 'bag', columns: 5 },
  { label: '包', count: 10, shape: 'square', columns: 5 },
  { label: '中品', count: 10, shape: 'triangle', columns: 5 },
  { label: '上品', count: 10, shape: 'star', columns: 5 },
];

/*
 * 资源库数据：以下均为「占位符」内容，仅用于验证选择→自动填充的联动是否正确。
 * 待确认无误后再替换为正式文案。
 * 每个分类的选项除 name / desc（资源库卡片展示）外，还携带会自动填充到卡面其他位置的字段。
 */
const realmOptions = [
  { name: '练气前期', desc: '练气期境界分段。境界能力：远距离跳跃与滑翔。小范围感知。', ability: '远距离跳跃与滑翔。小范围感知。' },
  { name: '练气中期', desc: '练气期境界分段。境界能力：远距离跳跃与滑翔。小范围感知。', ability: '远距离跳跃与滑翔。小范围感知。' },
  { name: '练气后期', desc: '练气期境界分段。境界能力：远距离跳跃与滑翔。小范围感知。', ability: '远距离跳跃与滑翔。小范围感知。' },
  { name: '筑基前期', desc: '筑基期境界分段。境界能力：御器飞行，中范围感知。', ability: '御器飞行，中范围感知。' },
  { name: '筑基中期', desc: '筑基期境界分段。境界能力：御器飞行，中范围感知。', ability: '御器飞行，中范围感知。' },
  { name: '筑基后期', desc: '筑基期境界分段。境界能力：御器飞行，中范围感知。', ability: '御器飞行，中范围感知。' },
  { name: '金丹期', desc: '金丹期境界。境界能力：自身飞行，大范围感知。', ability: '自身飞行，大范围感知。' },
];

const buildGuideSteps = [
  {
    title: '境界',
    summary: '先选择角色当前境界，境界能力会自动写入左上基础信息区。',
    target: '基础信息 > 境界',
    tiers: [
      { name: '练气前期 / 中期 / 后期', movement: '远距离跳跃与滑翔', perception: '小范围感知' },
      { name: '筑基前期 / 中期 / 后期', movement: '御器飞行', perception: '中范围感知' },
      { name: '金丹期', movement: '自身飞行', perception: '大范围感知' },
    ],
  },
  {
    title: '出身',
    summary: '选择角色的来历，出身详解用于理解背景，出身效果会自动写入卡面。',
    target: '基础信息 > 出身',
    entries: [
      { name: '宗门弟子', detail: '出身宗门的你对各路术法神通的了解甚于他人。', effectName: '宗门学识', effect: '了解他人术法门路相关检定获得优势。' },
      { name: '修真世族', detail: '你出身于一方传承久远、底蕴深厚的修仙世家，代表你对人情世故的了解非比寻常。', effectName: '家族人脉', effect: '每次游戏一次，在城镇等种族集群地中寻找到一个能给予一次有限帮助的家族人脉。' },
      { name: '寒门学子', detail: '你出身清贫，但凭借你的努力与坚持，叩开了仙途的大门。', effectName: '百折不挠', effect: '每当检定失败时放置 1 个指示物，上限为 2；可使用 2 个指示物使下次检定获得 +1。' },
      { name: '名门望族', detail: '你出身于名声在外的家族之中，自小便有极为奢侈的生活。', effectName: '人情世故', effect: '与达官贵族等人交涉相关的检定获得优势。' },
      { name: '将门世家', detail: '你自小便被熏陶了关于军人的作风，你比起一般人来说更为意志坚定。', effectName: '行伍本能', effect: '进行侦察与识别危险相关的检定中具有优势。' },
      { name: '商贾之后', detail: '你家境殷实，家族是经营一方的成功商贾。你自幼耳濡目染的是算计、交易与人心。', effectName: '经商头脑', effect: '任意与交易相关的检定中具有优势。' },
      { name: '书香门第', detail: '你出身凡俗书香世家，自幼饱读诗书，经史子集烂熟于心。', effectName: '博闻强识', effect: '与历史、地理人文等学识相关的检定中具有优势。' },
      { name: '市井奇人', detail: '你在城镇坊间的烟火气中长大，你肯定有一门自己擅长的手艺。', effectName: '八面玲珑', effect: '与各路三教九流人物交涉时获得优势。' },
      { name: '无名弃儿', detail: '你对亲生父母毫无印象，自有记忆起便是在街头、桥洞或某个混乱的孤儿院中挣扎求生。', effectName: '隐蔽求生', effect: '关于隐藏自己身形相关的任何检定中获得优势。' },
      { name: '流民之后', detail: '你的家族因巨大的变故，被迫背井离乡，流浪是你们生活的常态。', effectName: '有备无患', effect: '背包里总是带着一份生存相关物品；一次聚会一次，可以拿出一份与目前情况有关的生存物资。' },
    ],
  },
  {
    title: '核心加值',
    summary: '在四项属性中先选定一个核心属性，将它设为 +3，并用核心标识特别标注。',
    target: '属性区 > 仙躯 / 身法 / 神魂 / 灵蕴',
    coreValues: [
      { label: '核心属性', value: '+3', note: '优先选择，并添加醒目标识。', primary: true },
      { label: '剩余属性', value: '+2', note: '分配给第二擅长的属性。' },
      { label: '剩余属性', value: '+1', note: '分配给第三擅长的属性。' },
      { label: '剩余属性', value: '0', note: '分配给最后一项属性。' },
    ],
  },
  {
    title: '道源',
    summary: '打开资源库选择你的道源。选择后检查第一页的道源能力、道源效果、伤害阈值，以及第二页自动填入的神通和秘法。',
    target: '第一页 > 道源；第二页 > 神通 / 秘法',
  },
  {
    title: '法门',
    summary: '打开资源库选择你的法门。选择后会直接获得当前境界的第一张感悟卡，并写入第一页右下的法门增益一。',
    target: '第一页 > 法门；第一页右下 > 法门增益一；第二页 > 感悟',
  },
  {
    title: '大道',
    summary: '选择角色追寻的大道。第一页的大道效果会自动填入，第二页功法保持空白，便于手动记录。',
    target: '第一页 > 大道；第一页 > 大道效果',
  },
];

const originOptions = [
  {
    name: '宗门弟子',
    desc: '出身宗门的你对各路术法神通的了解甚于他人。',
    effect: '宗门学识：你在关于了解他人术法门路相关的检定中获得优势。',
  },
  {
    name: '修真世族',
    desc: '你出身于一方传承久远、底蕴深厚的修仙世家，代表你对人情世故的了解非比寻常。',
    effect: '家族人脉：每次游戏一次，你在城镇等种族集群地中，可以寻找到一个能给予你一次有限帮助的家族人脉。',
  },
  {
    name: '寒门学子',
    desc: '你出身清贫，但凭借你的努力与坚持，叩开了仙途的大门。',
    effect: '百折不挠：每当你检定失败时，你在此卡上放置 1 个指示物，上限为 2，你可以使用 2 个指示物为你下次检定获得 +1。',
  },
  {
    name: '名门望族',
    desc: '你出身于名声在外的家族之中，自小便有极为奢侈的生活。',
    effect: '人情世故：你与达官贵族等人交涉相关的检定获得优势。',
  },
  {
    name: '将门世家',
    desc: '你自小便被熏陶了关于军人的作风，你比起一般人来说更为意志坚定。',
    effect: '行伍本能：你在进行侦察与识别危险相关的检定中具有优势。',
  },
  {
    name: '商贾之后',
    desc: '你家境殷实，家族是经营一方的成功商贾。你自幼耳濡目染的是算计、交易与人心。',
    effect: '经商头脑：你在任意与交易相关的检定中具有优势。',
  },
  {
    name: '书香门第',
    desc: '你出身凡俗书香世家，自幼饱读诗书，经史子集烂熟于心。',
    effect: '博闻强识：你在与历史、地理人文等学识相关的检定中具有优势。',
  },
  {
    name: '市井奇人',
    desc: '你在城镇坊间的烟火气中长大，你肯定有一门自己擅长的手艺。',
    effect: '八面玲珑：你在与各路三教九流人物交涉时，获得优势。',
  },
  {
    name: '无名弃儿',
    desc: '你对亲生父母毫无印象，自有记忆起便是在街头、桥洞或某个混乱的孤儿院中挣扎求生。',
    effect: '隐蔽求生：你在关于隐藏自己身形相关的任何检定中获得优势。',
  },
  {
    name: '流民之后',
    desc: '你的家族因巨大的变故，被迫背井离乡，流浪是你们生活的常态。',
    effect: '有备无患：你背包里面总是带着一份生存相关的物品，一次聚会一次，你可以拿出一份与目前情况有关的生存物资。',
  },
];

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

// 自动填充的纯文本（由资源库选择联动而来）。空选择时显示淡色占位提示。
function FilledText({ value, placeholder = '——', className = '' }) {
  return (
    <div className={`fillText${value ? '' : ' empty'} ${className}`.trim()}>
      {value || placeholder}
    </div>
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
              <div className="effectFill text">{entry.effect}</div>
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
  const thresholds = [
    { label: '轻伤', value: light },
    { label: '中伤', value: medium },
    { label: '重伤', value: heavy },
  ];

  return (
    <div className="damageThreshold">
      <h4>{title}</h4>
      <div className="damageScale">
        <span className="fill">无伤害</span>
        <span className="thresholdStep" title={value || ''}>
          <b>{thresholds[0].label}</b>
          <em>{thresholds[0].value}</em>
        </span>
        <span className="fill">1 血量格</span>
        <span className="thresholdStep" title={value || ''}>
          <b>{thresholds[1].label}</b>
          <em>{thresholds[1].value}</em>
        </span>
        <span className="fill">2 血量格</span>
        <span className="thresholdStep" title={value || ''}>
          <b>{thresholds[2].label}</b>
          <em>{thresholds[2].value}</em>
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
          <div>{buffs[0] || ''}</div>
        </div>
        <div className="combatSkill">
          <b>法门增益二</b>
          <div>{buffs[1] || ''}</div>
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
      <div className="sourceBuffLine"><b>增益</b><span>{source.buff}</span></div>
      <div className="sourceAbilityText">{source.ability}</div>
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
                {talents.map(({ title, hint }) => (
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
            <div className="spellName">{entry ? entry.name : ''}</div>
            <div className="spellText">{entry ? entry.text : ''}</div>
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
                            <div className="drawCardEffect">{entry.effect}</div>
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
