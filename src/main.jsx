import React, { useState, useContext, createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { CircleAlert, Download, Info, Settings, X } from 'lucide-react';
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
  { name: '练气', desc: '【占位】引气入体，修行的起点。', ability: '【占位·境界能力】可引动天地灵气入体，基础检定不受加成。' },
  { name: '筑基', desc: '【占位】筑就道基，神识初成。', ability: '【占位·境界能力】神识外放，险境检定每场可重骰一次。' },
  { name: '金丹', desc: '【占位】凝结金丹，法力雄浑。', ability: '【占位·境界能力】每轮额外获得 1 点真元。' },
  { name: '元婴', desc: '【占位】元婴出窍，神魂不灭。', ability: '【占位·境界能力】受到致命伤害时，可保留 1 血量格不死。' },
  { name: '化神', desc: '【占位】法则加身，言出法随。', ability: '【占位·境界能力】全力动作可同时影响范围内所有目标。' },
];

const originOptions = [
  { name: '散修', desc: '【占位】无门无派，自由却艰辛。', effect: '【占位·出身效果】历练点补充 +1，但初始灵石减半。' },
  { name: '宗门弟子', desc: '【占位】名门正派出身，资源丰厚。', effect: '【占位·出身效果】每场冲突首次施展秘法消耗 -1。' },
  { name: '世家子弟', desc: '【占位】钟鸣鼎食之家的修士。', effect: '【占位·出身效果】初始灵宝 +1，社交类检定 +1。' },
  { name: '皇朝供奉', desc: '【占位】受朝廷供养的修行者。', effect: '【占位·出身效果】可调用一次官方援助，福缘点上限 +1。' },
  { name: '妖族遗孤', desc: '【占位】天生妖体，根骨异于常人。', effect: '【占位·出身效果】近战伤害 +1，但渡劫难度提升。' },
];

const sourceOptions = [
  {
    name: '剑修',
    desc: '【占位】以剑入道，攻伐凌厉。',
    bodyThreshold: 3,
    soulThreshold: 2,
    buff: '【占位·道源增益】普攻附加 1 点穿透伤害。',
    ability: '【占位·道源能力】凝聚剑意，可以远程发动近战攻击。',
    effect: '【占位·道源效果】连续命中同一目标时，伤害逐次递增。',
    skills: [
      { name: '御剑斩', text: '【占位】轻巧动作，对单体造成核心属性 +2 伤害。' },
      { name: '万剑归宗', text: '【占位】全力动作，对近距离全体造成核心属性伤害。' },
    ],
    arts: [{ name: '剑心通明', text: '【占位】一轮内免疫神魂干扰。' }],
  },
  {
    name: '体修',
    desc: '【占位】淬炼肉身，刚猛无俦。',
    bodyThreshold: 4,
    soulThreshold: 1,
    buff: '【占位·道源增益】受到的肉体伤害 -1。',
    ability: '【占位·道源能力】肉身成圣，可徒手格挡法术攻击。',
    effect: '【占位·道源效果】血量越低，造成的伤害越高。',
    skills: [
      { name: '霸体诀', text: '【占位】获得 2 点临时血量格。' },
      { name: '崩山拳', text: '【占位】造成核心属性 +2 伤害并击退目标。' },
    ],
    arts: [{ name: '金钟罩', text: '【占位】抵消下一次重伤。' }],
  },
  {
    name: '符修',
    desc: '【占位】绘符御法，变化万千。',
    bodyThreshold: 2,
    soulThreshold: 3,
    buff: '【占位·道源增益】每场冲突可预备 1 张符箓。',
    ability: '【占位·道源能力】可将一次检定结果延后发动。',
    effect: '【占位·道源效果】消耗符箓时，效果范围扩大。',
    skills: [
      { name: '烈焰符', text: '【占位】对范围目标造成核心属性伤害。' },
      { name: '困灵符', text: '【占位】使单体目标无法移动一轮。' },
    ],
    arts: [{ name: '聚灵阵', text: '【占位】本轮恢复 1 点真元。' }],
  },
  {
    name: '丹修',
    desc: '【占位】炼丹辅修，攻守兼备。',
    bodyThreshold: 3,
    soulThreshold: 3,
    buff: '【占位·道源增益】调息时额外恢复 1 血量格。',
    ability: '【占位·道源能力】可在冲突中服丹，立即恢复资源。',
    effect: '【占位·道源效果】丹药效果对友方同样生效。',
    skills: [
      { name: '回春丹', text: '【占位】为目标恢复 2 血量格。' },
      { name: '爆元丹', text: '【占位】下一次普攻伤害翻倍。' },
    ],
    arts: [{ name: '辟谷诀', text: '【占位】一轮内不受环境减益。' }],
  },
  {
    name: '御兽',
    desc: '【占位】契约灵兽，并肩而战。',
    bodyThreshold: 3,
    soulThreshold: 2,
    buff: '【占位·道源增益】灵兽可代替你承受一次伤害。',
    ability: '【占位·道源能力】灵兽可独立行动一次。',
    effect: '【占位·道源效果】与灵兽相邻时，双方检定 +1。',
    skills: [
      { name: '兽魂冲撞', text: '【占位】令灵兽冲撞，造成核心属性伤害。' },
      { name: '共鸣', text: '【占位】与灵兽共享一次防御。' },
    ],
    arts: [{ name: '驯养术', text: '【占位】立即唤回或召出灵兽。' }],
  },
];

const methodOptions = [
  {
    name: '御剑术',
    desc: '【占位】操控飞剑，远近皆宜。',
    attackBuffs: ['【占位】普攻可额外作用于近距离 1 名目标。', '【占位】消耗 1 真元，本次普攻伤害 +2。'],
    insight: { name: '剑意感悟', text: '【占位·感悟】领悟剑道，普攻暴击范围扩大。' },
  },
  {
    name: '炼体诀',
    desc: '【占位】以身为炉，近身缠斗。',
    attackBuffs: ['【占位】普攻命中后，下一次受击伤害 -1。', '【占位】目标处于近距离时普攻 +1 伤害。'],
    insight: { name: '铁骨感悟', text: '【占位·感悟】血量低于半数时，防御检定 +1。' },
  },
  {
    name: '神识术',
    desc: '【占位】神识为刃，攻心夺魄。',
    attackBuffs: ['【占位】普攻改为造成神魂伤害。', '【占位】命中后令目标下一次检定 -1。'],
    insight: { name: '灵觉感悟', text: '【占位·感悟】可提前察觉一次隐藏威胁。' },
  },
  {
    name: '驭兽契',
    desc: '【占位】借兽之力，群战为王。',
    attackBuffs: ['【占位】灵兽协同时普攻 +1 伤害。', '【占位】普攻可由灵兽代为发动。'],
    insight: { name: '同心感悟', text: '【占位·感悟】与灵兽相邻时，每轮多一次轻巧动作。' },
  },
];

const daoOptions = [
  { name: '杀伐', desc: '【占位】一往无前，以战止战。', effect: '【占位·大道效果】击败目标后，立即恢复 1 点真元。' },
  { name: '守护', desc: '【占位】护持同道，坚如磐石。', effect: '【占位·大道效果】可为相邻同伴承受一次伤害。' },
  { name: '自在', desc: '【占位】逍遥随心，不滞于物。', effect: '【占位·大道效果】每场冲突可无消耗重骰一次。' },
  { name: '求知', desc: '【占位】格物致知，洞悉本源。', effect: '【占位·大道效果】分析类检定 +2。' },
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
  return (
    <section className="panel attributePanel">
      <div className="panelTitle">{title}</div>
      <div className="attributeBody" />
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

  // 道源能力面板同时承载「道源增益」与「道源能力」两条信息。
  const sourceAbilityContent = source ? (
    <div className="fillStack">
      <div className="fillLine"><b>增益</b><span>{source.buff}</span></div>
      <div className="fillLine"><b>能力</b><span>{source.ability}</span></div>
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
  const { current } = useSheet();
  const source = current.source;
  const method = current.method;

  const prefillFor = (title) => {
    if (title === '神通') return source ? source.skills : [];
    if (title === '秘法') return source ? source.arts : [];
    return [];
  };

  const insightPrefill = method ? [method.insight] : [];

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
          <SpellTable title="本源感悟" rows={2} tall variant="originInsight" />
          <SpellTable title="感悟" rows={3} variant="insightTable" prefill={insightPrefill} />
        </section>
      </main>
    </div>
  );
}

// 资源库弹窗：以卡片形式展示某一分类的全部条目及详细说明。
function ResourceLibrary() {
  const { library, openLibrary, selections, select } = useSheet();
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

function App() {
  const [tab, setTab] = useState('p1');
  const [hintOpen, setHintOpen] = useState(false);
  const [library, setLibrary] = useState(null);
  const [selections, setSelections] = useState({ realm: null, origin: null, source: null, method: null, dao: null });
  const [texts, setTexts] = useState({ name: '', race: '', belong: '' });

  const select = (category, index) => setSelections((prev) => ({ ...prev, [category]: index }));
  const setText = (field, value) => setTexts((prev) => ({ ...prev, [field]: value }));

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
    library,
    openLibrary: setLibrary,
  };

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setHintOpen(false);
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
        </aside>
      </div>

      <ResourceLibrary />
    </SheetContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
