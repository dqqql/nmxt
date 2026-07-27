import React, { useEffect, useRef, useState } from 'react';

export default function CardActionMenu({ cardName, actions = [] }) {
  const [open, setOpen] = useState(false);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeFromOutside = (event) => {
      if (!layerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeFromOutside);
    return () => document.removeEventListener('pointerdown', closeFromOutside);
  }, [open]);

  return (
    <div ref={layerRef} className={`cardActionLayer printControl${open ? ' open' : ''}`}>
      <button
        type="button"
        className="cardActionTrigger"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
        aria-label={`打开${cardName}操作菜单`}
        aria-haspopup="menu"
        aria-expanded={open}
      />
      {open ? (
        <div className="cardActionMenu" role="menu" aria-label={`${cardName}操作`}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className={action.destructive ? 'destructive' : ''}
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
