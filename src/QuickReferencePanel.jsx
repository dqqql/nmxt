import React, { useEffect, useId, useRef, useState } from 'react';
import { ImageDown, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import './quickReferencePanel.css';

function ReferenceCard({ title, children, className = '' }) {
  return (
    <section className={`quickReferenceCard${className ? ` ${className}` : ''}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ReferenceEntry({ title, source, description, children }) {
  return (
    <article className="quickReferenceEntry">
      <h3>{title}</h3>
      {source ? <p className="quickReferenceSource">来源：{source}</p> : null}
      {description ? <p>{description}</p> : null}
      {children}
    </article>
  );
}

function EffectLine({ label, children }) {
  return (
    <p>
      <strong>{label}：</strong>
      {children}
    </p>
  );
}

export default function QuickReferencePanel({ open, onClose }) {
  const titleId = useId();
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const [exportStatus, setExportStatus] = useState('idle');
  const exporting = exportStatus === 'exporting';

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        if (!exporting) onClose?.();
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const buttons = [...(dialogRef.current?.querySelectorAll('button:not(:disabled)') || [])];
        if (!buttons.length) return;
        const currentIndex = buttons.indexOf(document.activeElement);
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex = currentIndex < 0
          ? 0
          : (currentIndex + direction + buttons.length) % buttons.length;
        buttons[nextIndex].focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [exporting, open, onClose]);

  const exportAsPng = async () => {
    if (!dialogRef.current || exporting) return;

    setExportStatus('exporting');
    let exportClone;
    try {
      await document.fonts?.ready;
      exportClone = dialogRef.current.cloneNode(true);
      exportClone.removeAttribute('role');
      exportClone.removeAttribute('aria-modal');
      exportClone.removeAttribute('aria-labelledby');
      exportClone.querySelector('.quickReferenceHeaderActions')?.remove();
      const waterfall = exportClone.querySelector('.quickReferenceWaterfall');
      if (waterfall) {
        const cards = [...waterfall.children];
        const columns = [0, 1, 2].map(() => {
          const column = document.createElement('div');
          column.className = 'quickReferenceExportColumn';
          return column;
        });
        [cards[0], cards[4]].filter(Boolean).forEach((card) => columns[0].appendChild(card));
        [cards[1]].filter(Boolean).forEach((card) => columns[1].appendChild(card));
        [cards[2], cards[3]].filter(Boolean).forEach((card) => columns[2].appendChild(card));
        waterfall.replaceChildren(...columns);
      }
      exportClone.classList.add('quickReferenceExportClone');
      exportClone.setAttribute('aria-hidden', 'true');
      document.body.appendChild(exportClone);

      const dataUrl = await toPng(exportClone, {
        width: 1360,
        height: exportClone.scrollHeight,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#f6f2ec',
      });
      const link = document.createElement('a');
      link.download = '逆命仙途-规则速查.png';
      link.href = dataUrl;
      link.click();
      setExportStatus('success');
    } catch (error) {
      console.error('规则速查 PNG 导出失败', error);
      setExportStatus('error');
    } finally {
      exportClone?.remove();
    }
  };

  if (!open) return null;

  return (
    <div
      className="quickReferenceBackdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (!exporting && event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        ref={dialogRef}
        className="quickReferenceDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="quickReferenceHeader">
          <div className="quickReferenceTitle">
            <span className="quickReferenceEyebrow">逆命仙途</span>
            <h1 id={titleId}>规则速查</h1>
          </div>
          <div className="quickReferenceHeaderActions">
            <button
              type="button"
              className="quickReferenceExportButton"
              onClick={exportAsPng}
              disabled={exporting}
              aria-busy={exporting}
            >
              <ImageDown size={19} strokeWidth={2.2} aria-hidden="true" />
              <span>{exporting ? '生成中' : '导出 PNG'}</span>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              className="quickReferenceClose"
              onClick={onClose}
              disabled={exporting}
              aria-label="关闭规则速查"
              title="关闭"
            >
              <X size={22} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="quickReferenceWaterfall">
          <ReferenceCard title="雷霆">
            <ol className="quickReferenceRolls">
              <li><b>1</b><span>雷霆惩戒，你再扣除1血量格</span></li>
              <li><b>2-3</b><span>雷霆助我：你下次的神通可选定一个额外目标</span></li>
              <li><b>4-5</b><span>一同受罚：你与中距离内的全部敌人一起受到伤害，你再扣除1血量格，敌人扣除半格血量</span></li>
              <li><b>6</b><span>雷霆万钧！雷霆贯穿你的全身，使得你获得无比强大的力量。你下次攻击检定具有优势，且可以额外选定一个目标，并且境界乘值+1。</span></li>
            </ol>
          </ReferenceCard>

          <ReferenceCard title="古兽">
            <ReferenceEntry
              title="1、利爪形"
              source="狰、当康"
              description="你化出利齿或利爪等锋利之形，使得你的攻击更为强横。"
            >
              <EffectLine label="尖牙利爪">你的锐利尖爪让敌人破绽百出，当你攻击1名未拆招敌人时，你可以对其施加【脆弱】</EffectLine>
              <EffectLine label="趁虚而攻">在敌人无防备时向其攻去，当你的攻击敌人拆招失败后，你可以消除其身上的异常状态从而追加一次普通攻击。</EffectLine>
            </ReferenceEntry>
            <ReferenceEntry
              title="2、硬壳形"
              source="霸下、玄武"
              description="你化出坚硬的甲壳，让别人更难以破开你的防御。"
            >
              <EffectLine label="坚硬甲壳">你拥有十分坚硬的甲壳，你的肉体重伤阈值+1</EffectLine>
              <EffectLine label="反震罡气">甲壳让你可以在格挡后震慑敌人，你格挡成功后可以使敌人受到少量伤害。</EffectLine>
            </ReferenceEntry>
            <ReferenceEntry
              title="3、锐目形"
              source="重明鸟、白泽"
              description="你的眼睛化为金色竖瞳，看破迷雾与虚妄。"
            >
              <EffectLine label="真形看破">你可看透人与物的本源，你可以询问主持人这个场景中的一个敌人或物体的一个特质。</EffectLine>
              <EffectLine label="怒目金光">你的目光如炬，【气尽】轻巧动作，扣除1灵气格，对一个目标施加【破法】并扣除其1灵气格。</EffectLine>
            </ReferenceEntry>
            <ReferenceEntry
              title="4、翔翼形"
              source="朱雀、鲲鹏"
              description="你身上化出让你身法更快的翅膀。"
            >
              <EffectLine label="迅捷如风">你的身法快速，你在移动相关的检定中获得优势</EffectLine>
              <EffectLine label="身形闪烁">速度太快使得别人无法捕捉你的身形，你的闪避获得+1检定值。</EffectLine>
            </ReferenceEntry>
          </ReferenceCard>

          <ReferenceCard title="圣灵">
            <ReferenceEntry title="1、武圣附身" description="将信仰之中之武圣之力附于身上">
              <EffectLine label="被动 · 武圣威严">当你攻击时敌人如果拆招成功，则招式伤害会+1</EffectLine>
              <EffectLine label="释放 · 武之绝技">你可以对近距离范围内的全部敌人全部进行一次普通攻击</EffectLine>
            </ReferenceEntry>
            <ReferenceEntry title="2、文圣附身" description="将信仰之中之文学相关之人的力量附于身上">
              <EffectLine label="被动 · 博学强识">在一个场景中，你可以询问一个事物的一个特质</EffectLine>
              <EffectLine label="释放 · 文之妙笔">你可以询问主持人当前场景中一个事物的弱点或线索。</EffectLine>
            </ReferenceEntry>
            <ReferenceEntry title="3、权圣附体" description="将信仰之中之关于权势之人的力量附于身上">
              <EffectLine label="被动 · 官大一级">你在与某人交涉相关的检定中成功时，仅此一次，你可以要求其完成一件无害的小事。</EffectLine>
              <EffectLine label="释放 · 权之统御">你可以要求任意一个无法反抗的单位进行一次你所要求事物的检定，并将检定后的具体后果交予你处理。</EffectLine>
            </ReferenceEntry>
          </ReferenceCard>

          <ReferenceCard title="星宿">
            <ol className="quickReferenceRolls">
              <li><b>1</b><span>安重宿-斗壁毕翼之宿，沉稳内敛之象，使得你所有重伤阈值+1持续到你的下个回合结束</span></li>
              <li><b>2</b><span>猛恶宿-箕室星张之宿，坚定行动之象，使得你可以马上无需消耗动作的使用一个神通。</span></li>
              <li><b>3</b><span>和善宿-角房奎觜之宿，善良慈祥之象，使自身或1名友方恢复2血量格。</span></li>
              <li><b>4</b><span>毒害宿-心尾参柳之宿，独立果断之象，你的攻击获得优势，但无法进行拆招直到你的下个回合结束。</span></li>
              <li><b>5</b><span>急速宿-娄胃鬼轸之宿，思维敏捷之象，使自身恢复2灵气格。</span></li>
              <li><b>6</b><span>刚柔宿-昴氏之宿，刚柔并济之象，你下次攻击与拆招检定获得优势。</span></li>
            </ol>
          </ReferenceCard>

          <ReferenceCard title="通用储物格" className="quickReferenceCard--storage">
            <p className="quickReferenceNotice">冲突场景中使用<strong>储物格</strong>：1轻巧动作。</p>
            <ul className="quickReferenceStorageList">
              <li><strong>回血丹 · 2储物格</strong><span>恢复<strong>2血量格</strong></span></li>
              <li><strong>驱邪丸 · 2储物格</strong><span>清除一个场景状态</span></li>
              <li><strong>回灵丹 · 2储物格</strong><span>恢复<strong>2灵气格</strong></span></li>
            </ul>
          </ReferenceCard>
        </div>
      </section>
    </div>
  );
}
