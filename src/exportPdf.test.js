import { describe, expect, it, vi } from 'vitest';
import {
  attachPrintLifecycle,
  getExportFileName,
  printSheetsWithBrowser,
} from './exportPdf';

function makeClassList() {
  const values = new Set();
  return {
    add: vi.fn((name) => values.add(name)),
    remove: vi.fn((name) => values.delete(name)),
    contains: (name) => values.has(name),
  };
}

function makePrintRoot({ images = [], controls = [], printValues = [] } = {}) {
  return {
    ownerDocument: {
      fonts: { ready: Promise.resolve('fonts-ready') },
    },
    querySelectorAll: vi.fn((selector) => {
      if (selector === 'img') return images;
      if (selector === 'input, textarea, select') return controls;
      if (selector === '.print-hide-empty') return [];
      if (selector === '.print-empty-control, .print-hidden') return controls;
      if (selector === '.printTextValue') return printValues;
      if (selector === '.printTextValue.print-empty-text') return printValues;
      return [];
    }),
  };
}

describe('getExportFileName', () => {
  it('uses a sanitized character name when one is available', () => {
    expect(getExportFileName(' 云舒/问道:*? ')).toBe('云舒_问道.pdf');
  });

  it('falls back to the default character sheet name', () => {
    expect(getExportFileName('')).toBe('逆命仙途角色卡.pdf');
  });
});

describe('printSheetsWithBrowser', () => {
  it('waits for fonts, images, and layout frames before opening the browser print dialog', async () => {
    const image = {
      complete: false,
      addEventListener: vi.fn((event, callback) => {
        if (event === 'load') queueMicrotask(callback);
      }),
    };
    const root = makePrintRoot({ images: [image] });
    const print = vi.fn();
    const rafCallbacks = [];
    const requestAnimationFrame = vi.fn((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });

    const pending = printSheetsWithBrowser({
      root,
      window: { print },
      requestAnimationFrame,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(print).not.toHaveBeenCalled();
    rafCallbacks.shift()();
    expect(print).not.toHaveBeenCalled();
    rafCallbacks.shift()();
    await pending;

    expect(root.querySelectorAll).toHaveBeenCalledWith('img');
    expect(image.addEventListener).toHaveBeenCalledWith('load', expect.any(Function), { once: true });
    expect(image.addEventListener).toHaveBeenCalledWith('error', expect.any(Function), { once: true });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    expect(print).toHaveBeenCalledTimes(1);
  });
});

describe('attachPrintLifecycle', () => {
  it('marks empty controls before printing and restores them after printing', () => {
    const emptyControl = {
      value: '',
      classList: makeClassList(),
      style: {
        borderColor: '',
      },
    };
    const filledControl = {
      value: '云舒',
      classList: makeClassList(),
      style: {
        borderColor: '',
      },
    };
    const emptyText = {
      textContent: '',
      classList: makeClassList(),
    };
    const filledText = {
      textContent: '云舒',
      classList: makeClassList(),
    };
    const root = makePrintRoot({
      controls: [emptyControl, filledControl],
      printValues: [emptyText, filledText],
    });
    const targetWindow = new EventTarget();

    const detach = attachPrintLifecycle(root, targetWindow);

    targetWindow.dispatchEvent(new Event('beforeprint'));
    expect(emptyControl.classList.contains('print-empty-control')).toBe(true);
    expect(emptyControl.style.borderColor).toBe('transparent');
    expect(filledControl.classList.contains('print-empty-control')).toBe(false);
    expect(emptyText.classList.contains('print-empty-text')).toBe(true);
    expect(filledText.classList.contains('print-empty-text')).toBe(false);

    targetWindow.dispatchEvent(new Event('afterprint'));
    expect(emptyControl.classList.contains('print-empty-control')).toBe(false);
    expect(emptyControl.style.borderColor).toBe('');
    expect(emptyText.classList.contains('print-empty-text')).toBe(false);

    detach();
    targetWindow.dispatchEvent(new Event('beforeprint'));
    expect(emptyControl.classList.contains('print-empty-control')).toBe(false);
  });
});
