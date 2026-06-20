import React, { useState, useContext, createContext, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronLeft, ChevronRight, CircleAlert, Download, Info, ListChecks, Settings, Star, X } from 'lucide-react';
import { daoOptions } from './daoOptions';
import { methodOptions } from './methodOptions';
import { sourceOptions } from './sourceOptions';
import './style.css';

const fateCards = [
  ['逆命伍', '解锁\n逆命禁咒', '', 'dark'],
  ['逆命肆', '双 3\n大失败', '', 'dark2'],
  ['逆命叁', '历练点\n补充 +1', '一仙阶天赋', 'dark3'],
  ['逆命贰', '双 2\n大失败', '一天阶天赋', 'dark3'],
  ['逆命壹', '历练点\n补充 +1', '一地阶天赋', 'dark4'],
  ['平平无奇', '平凡的\n开始', '一凡级天赋\n或一人级天赋+一凡级天谴', 'neutral'],
  ['天命壹', '福缘点\n上限 +1', '一地阶天赋\n+ 一地阶天谴', 'light1'],
  ['天命贰', '双 5\n大成功', '一天阶天赋\n+ 一天阶天谴', 'light2'],
  ['天命叁', '福缘点\n上限 +1', '一仙阶天赋\n+ 一仙阶天谴', 'light3'],
  ['天命肆', '双 4\n大成功', '', 'light4'],
  ['天命伍', '解锁\n天命神通', '', 'light5'],
];

const talents = [
  { title: '仙躯', hint: '领域、血脉、妖体' },
  { title: '身法', hint: '移动、见识、阻拦' },
  { title: '神魂', hint: '收集、干扰、分析' },
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
    summary: '打开资源库选择你的法门。选择后，第一页右下的两条普攻增益会自动填入，并进入二级窗口选择要放入第二页的感悟卡。',
    target: '第一页 > 法门；第一页右下 > 普攻增益；第二页 > 感悟 / 本源感悟',
  },
  {
    title: '大道',
    summary: '选择角色追寻的大道。第一页的大道效果会自动填入，第二页功法会根据当前境界显示练气或筑基功法。',
    target: '第一页 > 大道；第一页 > 大道效果；第二页 > 功法',
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

const METHOD_INSIGHT_LIMIT = 3;
const METHOD_ORIGIN_INSIGHT_LIMIT = 2;

const SheetContext = createContext(null);

function useSheet() {
  return useContext(SheetContext);
}

function ClickableMark({ initialState = 'solid', ariaLabel = '方格' }) {
  const [state, setState] = useState(initialState);
  const nextState = state === 'solid' ? 'filled' : state === 'filled' ? 'ghost' : 'solid';

  return (
    <button
      type="button"
      className={`mark ${state === 'filled' ? 'filled' : ''} ${state === 'ghost' ? 'ghost' : ''}`.trim()}
      onClick={() => setState(nextState)}
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

const marks = (count, className = '') =>
  Array.from({ length: count }, (_, index) => (
    <ClickableMark
      key={index}
      initialState={className.includes('ghost') ? 'ghost' : 'solid'}
      ariaLabel={`方格 ${index + 1}`}
    />
  ));

const resourceMarks = (count, shape) =>
  Array.from({ length: count }, (_, index) => (
    <ResourceMark key={index} shape={shape} ariaLabel={`灵石 ${index + 1}`} />
  ));

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
            <div className="fieldMarks">{marks(5)}</div>
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

function SideTextPanel({ title }) {
  return (
    <section className="panel bannerField">
      <div className="bannerTitle">{title}</div>
      <div className="bannerBody" />
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
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <section className="fateSection">
      <div className="fateHeader">
        <span>逆命因果</span>
        <strong>因果值</strong>
        <span>天命因果</span>
      </div>
      <div className="fateRibbon">
        {fateCards.map(([title, main, sub, tone], index) => (
          <button
            key={title}
            type="button"
            className={`fateStep ${tone}${selectedIndex === index ? ' selected' : ''}`}
            onClick={() => setSelectedIndex((current) => (current === index ? null : index))}
            aria-pressed={selectedIndex === index}
            aria-label={`因果值：${title}`}
          >
            <div className="fateHover fateHoverTop">
              <b>效果</b>
              <span>{main}</span>
            </div>
            <div className="fateCardTitle">{title}</div>
            <div className="fateHover fateHoverBottom">
              <b>天赋 / 天谴</b>
              <span>{sub || '无'}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function TalentBoard() {
  return (
    <section className="panel talentBoard">
      <div className="panelTitle panelTitleCentered">天赋 / 天谴</div>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="talentBox">
          <div className="talentMeta"><span>名称</span><div className="lineFill" /></div>
          <div className="talentMeta"><span>品阶</span><div className="lineFill" /></div>
          <div className="talentEffect">
            <span>效果</span>
            <div className="effectFill" />
          </div>
        </div>
      ))}
    </section>
  );
}

function CounterBox({ title, filled, ghost, note }) {
  return (
    <section className="panel counterBox">
      <div className="panelTitle panelTitleCentered">
        <span className="titleWithHint">
          <span>{title}</span>
          <InfoHint text={note} label={`${title}说明`} />
        </span>
      </div>
      <div className="counterMarks">
        {marks(filled)}
        {marks(ghost, 'ghost')}
      </div>
    </section>
  );
}

function StatRow({ label, filled, ghost, note }) {
  return (
    <div className="statRow">
      <span className="statLabel">
        <span>{label}</span>
        <InfoHint text={note} label={`${label}说明`} />
      </span>
      <div className="statMarks">
        {marks(filled)}
        {marks(ghost, 'ghost')}
      </div>
    </div>
  );
}

function DamageThreshold({ title, value }) {
  return (
    <div className="damageThreshold">
      <h4>
        {title}
        {value != null ? <span className="thresholdValue">阈值 {value}</span> : null}
      </h4>
      <div className="damageScale">
        <span className="fill">无伤害</span>
        <span>轻伤</span>
        <span className="fill">1 血量格</span>
        <span>中伤</span>
        <span className="fill">2 血量格</span>
        <span>重伤</span>
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
  const buffs = method ? method.attackBuffs : [];

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

function PageOne() {
  const { current } = useSheet();
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

              <SideTextPanel title="道心" />
              <SideTextPanel title="身份" />

              <section className="attributeGrid">
                {talents.map(({ title, hint }) => (
                  <AttributePanel key={title} title={title} hint={hint} />
                ))}
              </section>
            </section>

            <section className="middlePane">
              <section className="panel portraitPanel">
                <div className="portraitCanvas">立绘</div>
              </section>
              <CounterBox
                title="福缘点上限"
                filled={2}
                ghost={4}
                note={'消耗 1 点\n重骰 1-2 个骰子 / 此次检定值 +2 / 为故事增添一笔'}
              />
              <CounterBox
                title="历练点补充"
                filled={0}
                ghost={2}
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
              <StatRow label="灵气" filled={7} ghost={5} />
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
  const { current, methodCardSelections } = useSheet();
  const source = current.source;
  const method = current.method;
  const dao = current.dao;
  const realm = current.realm;
  const selectedInsights = method ? methodCardSelections.insights.map((index) => method.insights[index]).filter(Boolean) : [];
  const selectedOriginInsights = method
    ? methodCardSelections.originInsights.map((index) => method.originInsights[index]).filter(Boolean)
    : [];
  const daoMethods = dao
    ? realm?.name?.startsWith('筑基') || realm?.name?.startsWith('金丹')
      ? dao.foundationMethods
      : dao.qiMethods
    : [];

  const prefillFor = (title) => {
    if (title === '神通') return source ? source.skills : [];
    if (title === '秘法') return source ? source.arts : [];
    if (title === '功法') return daoMethods;
    return [];
  };

  return (
    <div className="sheet sheetPageTwo">
      <SheetHeader title="角色卡 - 术法信息" />
      <main className="pageTwoLayout">
        <div className="spellRail">术法</div>
        <section className="spellColumn">
          {spellGroups.map(({ title, rows }) => (
            <SpellTable key={title} title={title} rows={rows} prefill={prefillFor(title)} />
          ))}
        </section>
        <section className="spellColumn right">
          <SpellTable title="本源感悟" rows={2} tall variant="originInsight" prefill={selectedOriginInsights} />
          <SpellTable title="感悟" rows={3} variant="insightTable" prefill={selectedInsights} />
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
    methodInsightStep,
    setMethodInsightStep,
    methodCardSelections,
    toggleMethodCard,
  } = useSheet();
  if (!library) return null;

  const { label, options } = LIBRARY[library];
  const selectedIndex = selections[library];
  const selectedMethod = library === 'method' && selectedIndex != null ? options[selectedIndex] : null;

  const choose = (index) => {
    select(library, index);
    if (library === 'method' && index != null) {
      setMethodInsightStep(true);
      return;
    }
    openLibrary(null);
  };

  if (library === 'method' && methodInsightStep && selectedMethod) {
    const insightCount = methodCardSelections.insights.length;
    const originInsightCount = methodCardSelections.originInsights.length;
    const renderInsightSection = (title, cards, selectionKey, selectedCards, limit) => (
      <section className="libraryChoiceSection" aria-label={title}>
        <div className="librarySectionTitle">
          <h3>{title}</h3>
          <span>{selectedCards.length} / {limit}</span>
        </div>
        <div className="libraryGrid libraryInsightGrid">
          {cards.map((card, index) => {
            const selected = selectedCards.includes(index);
            return (
              <button
                key={`${selectionKey}-${card.name}`}
                type="button"
                className={`libraryCard insightCard${selected ? ' selected' : ''}`}
                onClick={() => toggleMethodCard(selectionKey, index)}
                aria-pressed={selected}
              >
                <div className="libraryCardTitle">{card.name}</div>
                <div className="libraryCardBody">{card.text}</div>
              </button>
            );
          })}
        </div>
      </section>
    );

    return (
      <div className="libraryOverlay" onClick={() => openLibrary(null)} role="presentation">
        <div className="libraryModal methodInsightModal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={`资源库 ${selectedMethod.name}感悟卡`}>
          <header className="libraryHeader">
            <h2>资源库<span className="librarySep">·</span>{selectedMethod.name}<span className="librarySep">·</span>感悟卡</h2>
            <button type="button" className="libraryClose" onClick={() => openLibrary(null)} aria-label="关闭">
              <X size={18} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </header>
          <div className="libraryToolbar">
            <button type="button" className="libraryBack" onClick={() => setMethodInsightStep(false)}>
              返回法门
            </button>
            <div className="libraryChoiceSummary">
              <span>感悟 {insightCount} / {METHOD_INSIGHT_LIMIT}</span>
              <span>本源 {originInsightCount} / {METHOD_ORIGIN_INSIGHT_LIMIT}</span>
            </div>
            <button type="button" className="libraryDone" onClick={() => openLibrary(null)}>
              完成
            </button>
          </div>
          <div className="libraryInsightScroll">
            {renderInsightSection('感悟', selectedMethod.insights, 'insights', methodCardSelections.insights, METHOD_INSIGHT_LIMIT)}
            {renderInsightSection('本源感悟', selectedMethod.originInsights, 'originInsights', methodCardSelections.originInsights, METHOD_ORIGIN_INSIGHT_LIMIT)}
          </div>
        </div>
      </div>
    );
  }

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

function App() {
  const [tab, setTab] = useState('p1');
  const [hintOpen, setHintOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [library, setLibrary] = useState(null);
  const [selections, setSelections] = useState({ realm: null, origin: null, source: null, method: null, dao: null });
  const [methodInsightStep, setMethodInsightStep] = useState(false);
  const [methodCardSelections, setMethodCardSelections] = useState({ insights: [], originInsights: [] });
  const [texts, setTexts] = useState({ name: '', race: '', belong: '' });
  const [attributes, setAttributes] = useState({ '仙躯': '', '身法': '', '神魂': '', '灵蕴': '' });
  const [coreAttribute, setCoreAttribute] = useState(null);

  const openLibrary = (category) => {
    setLibrary(category);
    setMethodInsightStep(false);
  };
  const select = (category, index) => {
    setSelections((prev) => ({ ...prev, [category]: index }));
    if (category === 'method') {
      setMethodCardSelections({ insights: [], originInsights: [] });
    }
  };
  const setText = (field, value) => setTexts((prev) => ({ ...prev, [field]: value }));
  const setAttributeValue = (field, value) => setAttributes((prev) => ({ ...prev, [field]: value }));
  const toggleCoreAttribute = (field) => setCoreAttribute((current) => (current === field ? null : field));
  const toggleMethodCard = (selectionKey, index) => {
    const limit = selectionKey === 'originInsights' ? METHOD_ORIGIN_INSIGHT_LIMIT : METHOD_INSIGHT_LIMIT;
    setMethodCardSelections((prev) => {
      const selected = prev[selectionKey];
      const exists = selected.includes(index);
      if (exists) {
        return { ...prev, [selectionKey]: selected.filter((item) => item !== index) };
      }
      if (selected.length >= limit) return prev;
      return { ...prev, [selectionKey]: [...selected, index] };
    });
  };

  const current = {
    realm: selections.realm != null ? realmOptions[selections.realm] : null,
    origin: selections.origin != null ? originOptions[selections.origin] : null,
    source: selections.source != null ? sourceOptions[selections.source] : null,
    method: selections.method != null ? methodOptions[selections.method] : null,
    dao: selections.dao != null ? daoOptions[selections.dao] : null,
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
    methodInsightStep,
    setMethodInsightStep,
    methodCardSelections,
    toggleMethodCard,
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
    </SheetContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
