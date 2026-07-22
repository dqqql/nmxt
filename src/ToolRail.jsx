import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Braces,
  Download,
  ListChecks,
  Map,
  Printer,
  Save,
  Settings,
  Shuffle,
  UserRound,
} from 'lucide-react';
import './toolRail.css';

const MENU_LABELS = {
  settings: '设置',
  export: '导出',
  card: '车卡',
};

function MenuButton({ menu, openMenu, setOpenMenu, buttonRef, controls, describedBy, icon: Icon, children }) {
  const open = openMenu === menu;

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`toolButton${open ? ' on' : ''}`}
      onClick={() => setOpenMenu(open ? null : menu)}
      aria-label={MENU_LABELS[menu]}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={controls}
      aria-describedby={describedBy}
      title={MENU_LABELS[menu]}
    >
      <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

function ToolMenu({ id, label, children }) {
  return (
    <aside id={id} className="toolRailPopover" role="dialog" aria-label={label}>
      {children}
    </aside>
  );
}

/**
 * The character sheet's right-hand action rail.
 *
 * `extraPagesEnabled` is controlled. `onExtraPagesChange` receives the next
 * boolean value rather than the native change event.
 */
export default function ToolRail({
  exporting = false,
  exportError = '',
  onPdfExport,
  onJsonExport,
  onQuestionnaire,
  onGuided,
  onRandom,
  onOpenSave,
  extraPagesEnabled = false,
  onExtraPagesChange,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const railRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const exportButtonRef = useRef(null);
  const cardButtonRef = useRef(null);
  const idPrefix = useId();
  const settingsId = `${idPrefix}-settings-menu`;
  const exportId = `${idPrefix}-export-menu`;
  const cardId = `${idPrefix}-card-menu`;
  const exportErrorId = `${idPrefix}-export-error`;

  useEffect(() => {
    if (!openMenu) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!railRef.current?.contains(event.target)) setOpenMenu(null);
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      const activeButton = {
        settings: settingsButtonRef,
        export: exportButtonRef,
        card: cardButtonRef,
      }[openMenu];
      setOpenMenu(null);
      activeButton?.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMenu]);

  const runAndClose = (handler) => {
    setOpenMenu(null);
    handler?.();
  };

  return (
    <aside ref={railRef} className="toolRail toolRail--grouped" aria-label="工具">
      <div className="toolRailCredit">
        <span>作者：不冻港</span>
        <strong>逆命仙途官方车卡器</strong>
        <span>官方Q群796368505</span>
      </div>

      <div className="toolRailAction">
        <MenuButton
          menu="settings"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          buttonRef={settingsButtonRef}
          controls={settingsId}
          icon={Settings}
        >
          设置
        </MenuButton>
        {openMenu === 'settings' ? (
          <ToolMenu id={settingsId} label="设置选项">
            <strong>页面设置</strong>
            <label className="toolRailSwitchRow">
              <span>
                <b>额外页面</b>
                <small>显示并导出第五、六页</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={Boolean(extraPagesEnabled)}
                onChange={(event) => onExtraPagesChange?.(event.target.checked)}
                aria-label="开启额外页面"
              />
              <i aria-hidden="true" />
            </label>
          </ToolMenu>
        ) : null}
      </div>

      <div className="toolRailAction">
        <MenuButton
          menu="export"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          buttonRef={exportButtonRef}
          controls={exportId}
          describedBy={exportError ? exportErrorId : undefined}
          icon={Download}
        >
          导出
        </MenuButton>
        {openMenu === 'export' ? (
          <ToolMenu id={exportId} label="导出选项">
            <strong>导出角色卡</strong>
            <p>选择要导出的文件格式。</p>
            <div className="toolRailMenuGrid" role="group" aria-label="导出格式">
              <button type="button" onClick={() => runAndClose(onJsonExport)}>
                <Braces size={17} strokeWidth={2.2} aria-hidden="true" />
                JSON
              </button>
              <button
                type="button"
                onClick={() => onPdfExport?.()}
                disabled={exporting}
                aria-busy={exporting}
              >
                <Printer size={17} strokeWidth={2.2} aria-hidden="true" />
                {exporting ? '准备中' : 'PDF'}
              </button>
            </div>
            {exportError ? (
              <p id={exportErrorId} className="toolRailError" role="alert">PDF 导出失败：{exportError}</p>
            ) : null}
          </ToolMenu>
        ) : null}
        {exportError && openMenu !== 'export' ? (
          <aside id={exportErrorId} className="toolRailExportErrorPopover" role="alert">
            PDF 导出失败：{exportError}
          </aside>
        ) : null}
      </div>

      <div className="toolRailAction">
        <MenuButton
          menu="card"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          buttonRef={cardButtonRef}
          controls={cardId}
          icon={UserRound}
        >
          车卡
        </MenuButton>
        {openMenu === 'card' ? (
          <ToolMenu id={cardId} label="车卡方式">
            <strong>选择车卡方式</strong>
            <div className="toolRailMenuGrid toolRailMenuGrid--three" role="group" aria-label="车卡方式">
              <button type="button" onClick={() => runAndClose(onQuestionnaire)}>
                <ListChecks size={17} strokeWidth={2.2} aria-hidden="true" />
                问卷
              </button>
              <button type="button" onClick={() => runAndClose(onGuided)}>
                <Map size={17} strokeWidth={2.2} aria-hidden="true" />
                引导
              </button>
              <button type="button" onClick={() => runAndClose(onRandom)}>
                <Shuffle size={17} strokeWidth={2.2} aria-hidden="true" />
                随机
              </button>
            </div>
          </ToolMenu>
        ) : null}
      </div>

      <div className="toolRailAction">
        <button
          type="button"
          className="toolButton"
          onClick={() => {
            setOpenMenu(null);
            onOpenSave?.();
          }}
          aria-label="存档"
          title="存档"
        >
          <Save size={20} strokeWidth={2.2} aria-hidden="true" />
          <span>存档</span>
        </button>
      </div>
    </aside>
  );
}
