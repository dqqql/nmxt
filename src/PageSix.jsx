import React from 'react';
import gameLogo from './assets/game-logo.png';
import CardActionMenu from './CardActionMenu';
import './pageSix.css';

export const PAGE_SIX_SECTIONS = [
  { title: '神通库', rowCount: 4, showHeader: true, area: 'spells' },
  { title: '感悟库', rowCount: 4, showHeader: true, area: 'insights' },
  { title: '秘法库', rowCount: 2, showHeader: true, area: 'arts' },
  { title: '本源感悟库', rowCount: 2, showHeader: true, area: 'originInsights' },
  { title: '储物袋', rowCount: 4, showHeader: false, area: 'storage' },
  { title: '魂海额外记录库', rowCount: 4, showHeader: false, area: 'soulSea' },
];

function LibraryActions({ card, view, onMove, onExchange, onDelete }) {
  return (
    <CardActionMenu
      cardName={card.name}
      actions={[
        ...(!view.slotFull ? [{ label: '移出', onSelect: () => onMove(card.key, 'slot') }] : []),
        ...(view.slots.length ? [{ label: '交换', onSelect: () => onExchange(card, 'library') }] : []),
        { label: '删除', destructive: true, onSelect: () => onDelete(card.key) },
      ]}
    />
  );
}

function PageSixLibrary({ title, rowCount, showHeader, area, view, onMove, onExchange, onDelete, records, onRecordChange }) {
  const isCardLibrary = Boolean(view);
  return (
    <section
      className={`pageSixLibrary pageSixLibrary-${area}${showHeader ? ' pageSixLibrary-withHeader' : ''}`}
      aria-label={title}
    >
      <h2 className="pageSixLibraryTitle">
        {title}
        {isCardLibrary ? <span>{view.library.length}/{rowCount}</span> : null}
      </h2>
      {showHeader ? (
        <div className="pageSixLibraryHead" aria-hidden="true">
          <span>名称</span>
          <span>效果</span>
        </div>
      ) : null}
      <div className="pageSixLibraryRows" style={{ '--page-six-row-count': rowCount }}>
        {Array.from({ length: rowCount }, (_, index) => {
          const card = view?.library[index];
          if (showHeader) {
            return (
              <article className={`pageSixLibraryRow${card ? ' filled interactiveCardSurface' : ' empty'}`} key={card?.key || index}>
                <span>{card?.name || ''}</span>
                <span>
                  <span className="pageSixCardText">{card?.text || ''}</span>
                  {card ? (
                    <LibraryActions
                      card={card}
                      view={view}
                      onMove={onMove}
                      onExchange={onExchange}
                      onDelete={onDelete}
                    />
                  ) : null}
                </span>
              </article>
            );
          }
          return (
            <div className="pageSixLibraryRow pageSixRecordRow" key={index}>
              <textarea
                className="printControl"
                value={records?.[index] || ''}
                onChange={(event) => onRecordChange(index, event.target.value)}
                aria-label={`${title}第 ${index + 1} 行`}
              />
              <span className="pageSixPrintRecord">{records?.[index] || ''}</span>
            </div>
          );
        })}
      </div>
      <div className="pageSixLibraryRail" aria-hidden="true" />
    </section>
  );
}

export default function PageSix({ libraryViews = {}, onMove, onExchange, onDelete, records = {}, onRecordChange = () => {} }) {
  return (
    <div className="sheet pdfSheet pageSixSheet">
      <header className="pageSixHeader">
        <img src={gameLogo} alt="逆命仙途" className="pageSixLogo" />
        <h1>角色卡 - 基础信息</h1>
      </header>
      <main className="pageSixBody">
        {PAGE_SIX_SECTIONS.map((section) => (
          <PageSixLibrary
            key={section.title}
            {...section}
            view={libraryViews[section.area]}
            onMove={(key, location) => onMove(section.area, key, location)}
            onExchange={(card, location) => onExchange(section.area, card, location)}
            onDelete={(key) => onDelete(section.area, key)}
            records={records[section.area]}
            onRecordChange={(index, value) => onRecordChange(section.area, index, value)}
          />
        ))}
      </main>
    </div>
  );
}
