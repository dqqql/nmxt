import React, { useEffect, useRef, useState } from 'react';
import promoLogo from './assets/promo-logo.jpg';
import './promoWelcomeModal.css';

export const PROMO_DISMISSED_KEY = 'nmxt.promoLogo.dismissed.v1';
export const PROMO_ACKNOWLEDGED_KEY = 'nmxt.promoLogo.acknowledged.v1';

function hasStoredFlag(storage, key) {
  try {
    return storage?.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function storeFlag(storage, key) {
  try {
    storage?.setItem(key, 'true');
  } catch {
    // The modal still closes when storage is unavailable.
  }
}

export default function PromoWelcomeModal() {
  const [open, setOpen] = useState(() => (
    !hasStoredFlag(window.localStorage, PROMO_DISMISSED_KEY)
    && !hasStoredFlag(window.sessionStorage, PROMO_ACKNOWLEDGED_KEY)
  ));
  const dialogRef = useRef(null);
  const acknowledgeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    acknowledgeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        storeFlag(window.sessionStorage, PROMO_ACKNOWLEDGED_KEY);
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const buttons = [...(dialogRef.current?.querySelectorAll('button') || [])];
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const acknowledge = () => {
    storeFlag(window.sessionStorage, PROMO_ACKNOWLEDGED_KEY);
    setOpen(false);
  };
  const dismissPermanently = () => {
    storeFlag(window.localStorage, PROMO_DISMISSED_KEY);
    storeFlag(window.sessionStorage, PROMO_ACKNOWLEDGED_KEY);
    setOpen(false);
  };

  return (
    <div className="promoWelcomeOverlay">
      <section
        ref={dialogRef}
        className="promoWelcomeModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-welcome-title"
      >
        <h2 id="promo-welcome-title" className="promoWelcomeTitle">逆命仙途</h2>
        <img
          className="promoWelcomeImage"
          src={promoLogo}
          alt="逆命仙途修仙题材 TRPG 规则宣传 Logo"
        />
        <div className="promoWelcomeActions">
          <button ref={acknowledgeButtonRef} type="button" onClick={acknowledge}>
            我知道了
          </button>
          <button type="button" className="promoWelcomeSecondary" onClick={dismissPermanently}>
            以后不再提示
          </button>
        </div>
      </section>
    </div>
  );
}
