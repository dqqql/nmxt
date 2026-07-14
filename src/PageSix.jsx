import React from 'react';
import gameLogo from './assets/game-logo.png';
import './pageSix.css';

export const PAGE_SIX_SECTIONS = [
  { title: '神通库', rowCount: 4, showHeader: true, area: 'spells' },
  { title: '感悟库', rowCount: 4, showHeader: true, area: 'insights' },
  { title: '秘法库', rowCount: 2, showHeader: true, area: 'arts' },
  { title: '本源感悟库', rowCount: 2, showHeader: true, area: 'originInsights' },
  { title: '储物袋', rowCount: 4, showHeader: false, area: 'storage' },
  { title: '魂海额外记录库', rowCount: 4, showHeader: false, area: 'soulSea' },
];

function PageSixLibrary({ title, rowCount, showHeader, area }) {
  return (
    <section
      className={`pageSixLibrary pageSixLibrary-${area}${showHeader ? ' pageSixLibrary-withHeader' : ''}`}
      aria-label={title}
    >
      <h2 className="pageSixLibraryTitle">{title}</h2>
      {showHeader ? (
        <div className="pageSixLibraryHead" aria-hidden="true">
          <span>名称</span>
          <span>效果</span>
        </div>
      ) : null}
      <div
        className="pageSixLibraryRows"
        style={{ '--page-six-row-count': rowCount }}
        aria-hidden="true"
      >
        {Array.from({ length: rowCount }, (_, index) => (
          <div className="pageSixLibraryRow" key={index}>
            {showHeader ? <><span /><span /></> : null}
          </div>
        ))}
      </div>
      <div className="pageSixLibraryRail" aria-hidden="true" />
    </section>
  );
}

export default function PageSix() {
  return (
    <div className="sheet pdfSheet pageSixSheet">
      <header className="pageSixHeader">
        <img src={gameLogo} alt="逆命仙途" className="pageSixLogo" />
        <h1>角色卡 - 基础信息</h1>
      </header>
      <main className="pageSixBody">
        {PAGE_SIX_SECTIONS.map((section) => (
          <PageSixLibrary key={section.title} {...section} />
        ))}
      </main>
    </div>
  );
}
