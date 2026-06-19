import React, {useEffect, useState} from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const box = (n, cls='') => Array.from({length:n},(_,i)=><span key={i} className={`tick ${cls}`}/>);
const EditLine = ({label, wide=false}) => <label className={`lineField ${wide?'wide':''}`}><b>{label}</b><input /></label>;
const TextBox = ({title, hint, className=''}) => <section className={`panel textbox ${className}`}><h3>{title}</h3><textarea placeholder={hint||''}/></section>;
const ThinCard = ({title, main, sub, tone='mid'}) => <div className={`causeCard ${tone}`}><div className="causeTitle">{title}</div><div className="causeBlank"/><div className="causeMain">{main}</div>{sub && <div className="causeSub">{sub}</div>}</div>;
const causeCards = [
  ['逆命伍','解锁\n逆命禁咒','', 'dark'], ['逆命肆','双 3 大失败','', 'dark2'], ['逆命叁','历练点补充\n+1','一仙阶天赋','dark3'], ['逆命贰','双 2 大失败','一天阶天赋','dark3'], ['逆命壹','历练点补充\n+1','一地阶天赋','dark4'], ['平平无奇','平凡的开始','一凡阶天赋\n或\n一人阶天赋 + 一凡阶天道','neutral'], ['天命壹','福缘点上限\n+1','一地阶天赋\n+\n一地阶天道','light1'], ['天命贰','双 5 大成功','一天阶天赋\n+\n一天阶天道','light2'], ['天命叁','福缘点上限\n+1','一仙阶天赋\n+\n一仙阶天道','light3'], ['天命肆','双 4 大成功','', 'light4'], ['天命伍','解锁\n天命神通','', 'light5']
];
const CauseTrack = () => <div className="causeWrap"><div className="causeBar"><span>逆命因果</span><strong>因果值</strong><span>天命因果</span></div><div className="causeCards">{causeCards.map(([t,m,s,tone])=><ThinCard key={t} title={t} main={m} sub={s} tone={tone}/>)}</div></div>;
const AttributeBlock = ({title, caption}) => <section className="smallAttr panel"><h3>{title}</h3><textarea/><small>{caption}</small></section>;
const DamageTrack = ({title}) => <div className="damage"><b>{title}</b><span>无伤害</span><i>轻伤</i><span>1 血量格</span><i>中伤</i><span>2 血量格</span><i>重伤</i><span>3 血量格</span></div>;
const Dots = ({title, count=10, shape='circle'}) => <div className="resource"><b>{title}</b><div className={shape}>{box(count)}</div></div>;

function PageOne(){
 return <div className="sheet pageOne">
   <header className="top"><div className="logo">逆命仙途</div><h1>角色卡 - 基础信息</h1></header>
   <main className="grid">
    <aside className="leftCol">
      <div className="bio panel"><EditLine label="名称"/><EditLine label="种族"/><EditLine label="出身" wide/><EditLine label="归属" wide/><div className="row"><EditLine label="境界"/><label className="inlineCheck"><b>境界乘值</b>{box(5)}</label></div><div className="row"><EditLine label="境界能力"/><label className="inlineCheck"><b>真元</b>{box(1)}<span className="ghostTicks">{box(5,'ghost')}</span></label></div></div>
      <TextBox title="道心" className="short"/><TextBox title="身份" className="short"/>
      <div className="attrs"><AttributeBlock title="仙躯" caption="领域、血脉、妖体"/><AttributeBlock title="身法" caption="移动、见识、阻拦"/><AttributeBlock title="神魂" caption="收集、干扰、分析"/><AttributeBlock title="灵蕴" caption="交涉、法术、魅力"/></div>
      <div className="sourceRow"><TextBox title="道源" hint="修仙者的力量源泉"/><TextBox title="法门" hint="修仙者使用力量的方式"/><TextBox title="大道" hint="修仙者们性格与倾向产生的特殊风格"/></div>
      <div className="effectRow"><TextBox title="道源能力"/><TextBox title="出身效果"/></div>
      <div className="effectRow compact"><TextBox title="道源效果" hint="道源附益"/><TextBox title="大道效果"/></div>
      <div className="items panel"><Dots title="灵石" count={12}/><Dots title="颗" count={12}/><Dots title="袋" count={10} shape="bag"/><Dots title="包" count={8} shape="square"/><Dots title="中品" count={10} shape="crystal"/><Dots title="上品" count={10} shape="cross"/></div>
    </aside>
    <section className="portraitCol">
      <div className="portrait panel"><span>立绘</span></div>
      <div className="luck panel"><h3>福缘点上限</h3><div>{box(2)}<span className="ghostTicks">{box(4,'ghost')}</span></div><small>消耗 1 点：重掷 1-2 个骰子 / 优先决定位 +2 / 为故事开拓一笔</small></div>
      <div className="luck panel"><h3>历练点补充</h3><div>{box(2,'ghost')}</div><small>GM 会使用团结点为故事带来转折与挑战</small></div>
    </section>
    <section className="rightCol">
      <CauseTrack />
      <section className="talent panel"><h2>天赋 / 天道</h2>{[0,1,2,3].map(i=><div key={i} className="talentCell"><label>名称<input/></label><label>品阶<input/></label><label>效果<textarea/></label></div>)}</section>
      <section className="bottomRight">
        <div className="meters panel"><label>正常血量{box(6)}<span className="ghostTicks">{box(4,'ghost')}</span></label><label>险境血量{box(6)}<span className="ghostTicks">{box(4,'ghost')}</span></label><label>灵气{box(7)}<span className="ghostTicks">{box(5,'ghost')}</span></label><label>储物格{box(6)}<span className="ghostTicks">{box(5,'ghost')}</span></label><label>损伤{box(3)}<em>受到 1 次重伤时扣除 1 格；扣除完后，血量格上限以剩余地点为准</em></label><label>调息{box(1)}<em>全力动作恢复一半灵气，并回气场资源</em></label><h3>肉体伤害阈值</h3><DamageTrack title=""/><h3>神魂伤害阈值</h3><DamageTrack title=""/></div>
        <div className="combat panel"><h3>冲突开始时</h3><p>冲突场景中你的回合，1 轻巧动作</p><p>战斗动作　2 轻巧 / 1 全力动作</p><p>轮次开始时恢复  妖损次数 {box(1)}</p><div className="skill"><b>普通攻击</b><textarea defaultValue={'轻巧动作，对近距离 1 名目标\n造成【核心属性】点伤害'}/></div><div className="skill"><b>法门增益一</b><textarea defaultValue={'法门对等式的附益'}/></div><div className="skill"><b>法门增益二</b><textarea/></div></div>
      </section>
    </section>
   </main>
  </div>
}

const SpellTable = ({title, rows=4, className=''}) => <section className={`spellPanel panel ${className}`} style={{'--rows':rows}}><h2>{title}</h2><div className="spellHead"><span>名称</span><span>效果</span></div>{Array.from({length:rows},(_,i)=><div className="spellRow" key={i}><textarea/><textarea/></div>)}</section>;

function PageTwo(){return <div className="sheet pageTwo"><header className="top"><div className="logo">逆命仙途</div><h1>角色卡 - 基础信息</h1></header><main className="pageTwoGrid"><div className="spellLabel">术法</div><section className="spellLeft"><SpellTable title="神通" rows={4}/><SpellTable title="秘法" rows={3}/><SpellTable title="功法" rows={3}/><SpellTable title="灵宝" rows={3}/></section><section className="spellRight"><SpellTable title="本源感悟" rows={2} className="origin"/><SpellTable title="感悟" rows={4} className="insight"/></section></main></div>}

function App(){
 const [tab,setTab]=useState('p1');
 const [scale,setScale]=useState(1);
 useEffect(()=>{const fit=()=>{const pageW=1122.52, pageH=793.7, nav=52, margin=44; const sx=(window.innerWidth-margin*2)/pageW; const sy=(window.innerHeight-nav-margin*2)/pageH; setScale(Math.min(sx, sy));}; fit(); window.addEventListener('resize',fit); return()=>window.removeEventListener('resize',fit)},[]);
 return <><nav className="tabs"><button onClick={()=>setTab('p1')} className={tab==='p1'?'on':''}>第一页</button><button onClick={()=>setTab('p2')} className={tab==='p2'?'on':''}>第二页</button><button onClick={()=>window.print()}>导出 PDF / 打印</button></nav><div className="stage" style={{'--scale':scale}}>{tab==='p1'?<PageOne/>:<PageTwo/>}</div></>
}

createRoot(document.getElementById('root')).render(<App/>);
