import React, { useState, useRef, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CircleAlert, Download, Info, Settings } from 'lucide-react';
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
  return (
    <section className="panel infoPanel">
      <div className="profileGrid">
        <div className="nameRow">
          <div className="pairField">
            <span className="fieldLabel">名称</span>
            <div className="fieldLine" />
          </div>
          <div className="pairField">
            <span className="fieldLabel">种族</span>
            <div className="fieldLine" />
          </div>
        </div>

        <div className="singleField">
          <span className="fieldLabel">出身</span>
          <div className="fieldLine" />
        </div>

        <div className="singleField">
          <span className="fieldLabel">归属</span>
          <div className="fieldLine" />
        </div>

        <div className="splitFieldRow">
          <div className="splitFieldMain">
            <span className="fieldLabel">境界</span>
            <div className="fieldLine" />
          </div>
          <div className="splitFieldSide">
            <span className="fieldAside">境界乘值</span>
            <div className="fieldMarks">{marks(5)}</div>
          </div>
        </div>

        <div className="splitFieldRow">
          <div className="splitFieldMain">
            <span className="fieldLabel">境界能力</span>
            <div className="fieldLine" />
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

function TextPanel({ title, hint, vertical = false }) {
  return (
    <section className={`panel textPanel${vertical ? ' vertical' : ''}`}>
      <div className="panelTitle">{title}</div>
      <div className="textPanelBody">{hint ? <span>{hint}</span> : null}</div>
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

function DamageThreshold({ title }) {
  return (
    <div className="damageThreshold">
      <h4>{title}</h4>
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
          <div>法门对普攻的增益</div>
        </div>
        <div className="combatSkill">
          <b>法门增益二</b>
          <div />
        </div>
      </div>
    </section>
  );
}

function PageOne() {
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
            <TextPanel title="道源" hint="修仙者的力量源泉" vertical />
            <TextPanel title="法门" hint="修仙者使用力量的方式" vertical />
            <TextPanel title="大道" hint="修仙者们性格与倾向产生的特殊风格" vertical />
          </section>

          <section className="doublePanels">
            <TextPanel title="道源能力" />
            <TextPanel title="出身效果" />
          </section>

          <section className="doublePanels compact">
            <TextPanel title="道源效果" />
            <TextPanel title="大道效果" />
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
              <DamageThreshold title="肉体伤害阈值" />
              <DamageThreshold title="神魂伤害阈值" />
            </section>
            <CombatPanel />
          </section>
        </section>
      </main>
    </div>
  );
}

function SpellTable({ title, rows, tall = false, variant = '' }) {
  return (
    <section className={`panel spellTable${tall ? ' tall' : ''}${variant ? ` ${variant}` : ''}`} style={{ '--rows': rows }}>
      <div className="panelTitle panelTitleCentered">{title}</div>
      <div className="spellHead">
        <span>名称</span>
        <span>效果</span>
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="spellRow">
          <div className="spellName" />
          <div className="spellText" />
        </div>
      ))}
    </section>
  );
}

function PageTwo() {
  return (
    <div className="sheet sheetPageTwo">
      <SheetHeader title="角色卡 - 术法信息" />
      <main className="pageTwoLayout">
        <div className="spellRail">术法</div>
        <section className="spellColumn">
          {spellGroups.map(({ title, rows }) => (
            <SpellTable key={title} title={title} rows={rows} />
          ))}
        </section>
        <section className="spellColumn right">
          <SpellTable title="本源感悟" rows={2} tall variant="originInsight" />
          <SpellTable title="感悟" rows={3} variant="insightTable" />
        </section>
      </main>
    </div>
  );
}

// 固定卡面设计尺寸（16:9）。卡片内部全部按此尺寸固定排版，
// 再整体用 transform 缩放以适配窗口，这样浏览器缩放只会让整张卡按比例放缩，
// 不会改变内部布局，避免排版被破坏。
const SHEET_WIDTH = 1760;
const SHEET_HEIGHT = 990;

function useFitScale(ref) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const compute = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (w && h) {
        setScale(Math.min(w / SHEET_WIDTH, h / SHEET_HEIGHT));
      }
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    window.addEventListener('resize', compute);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [ref]);

  return scale;
}

function App() {
  const [tab, setTab] = useState('p1');
  const [hintOpen, setHintOpen] = useState(false);
  const stageRef = useRef(null);
  const scale = useFitScale(stageRef);
  const switchTab = (nextTab) => {
    setTab(nextTab);
    setHintOpen(false);
  };

  return (
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

      <div className="stage" ref={stageRef}>
        <div className="sheetScaler" style={{ '--sheet-scale': scale }}>
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
  );
}

createRoot(document.getElementById('root')).render(<App />);
