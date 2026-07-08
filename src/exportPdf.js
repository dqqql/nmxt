const DEFAULT_FILE_NAME = '逆命仙途角色卡';
const INVALID_FILE_CHARS = /[<>:"/\\|?*\u0000-\u001f]+/g;

function getOwnerDocument(root) {
  if (root?.nodeType === 9) return root;
  if (root?.ownerDocument) return root.ownerDocument;
  return typeof document !== 'undefined' ? document : null;
}

function queryAll(root, selector) {
  if (!root?.querySelectorAll) return [];
  return Array.from(root.querySelectorAll(selector));
}

function nextFrame(requestAnimationFrameImpl) {
  if (typeof requestAnimationFrameImpl !== 'function') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    requestAnimationFrameImpl(() => {
      requestAnimationFrameImpl(resolve);
    });
  });
}

async function waitForImages(root) {
  const images = queryAll(root, 'img');
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }));
}

export function getExportFileName(characterName) {
  const sanitized = String(characterName || '')
    .trim()
    .replace(INVALID_FILE_CHARS, '_')
    .replace(/\s+/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return `${sanitized || DEFAULT_FILE_NAME}.pdf`;
}

export async function waitForPrintAssets(root, env = {}) {
  const ownerDocument = getOwnerDocument(root);
  const requestAnimationFrameImpl = env.requestAnimationFrame
    || globalThis.requestAnimationFrame?.bind(globalThis);

  if (ownerDocument?.fonts?.ready) {
    await ownerDocument.fonts.ready;
  }

  await waitForImages(root);
  await nextFrame(requestAnimationFrameImpl);
}

export function preparePrint(root) {
  queryAll(root, 'input, textarea, select').forEach((control) => {
    const value = String(control.value || '').trim();
    if (!value) {
      control.classList?.add('print-empty-control');
      if (control.style) control.style.borderColor = 'transparent';
    }
  });

  queryAll(root, '.printTextValue').forEach((element) => {
    if (!String(element.textContent || '').trim()) {
      element.classList?.add('print-empty-text');
    }
  });

  queryAll(root, '.print-hide-empty').forEach((element) => {
    if (!String(element.textContent || '').trim()) {
      element.classList?.add('print-hidden');
    }
  });
}

export function restorePrint(root) {
  queryAll(root, '.print-empty-control, .print-hidden').forEach((element) => {
    element.classList?.remove('print-empty-control');
    element.classList?.remove('print-hidden');
    if (element.style) element.style.borderColor = '';
  });

  queryAll(root, '.printTextValue.print-empty-text').forEach((element) => {
    element.classList?.remove('print-empty-text');
  });
}

export function attachPrintLifecycle(root, targetWindow = globalThis.window) {
  if (!root || !targetWindow?.addEventListener) {
    return () => {};
  }

  const handleBeforePrint = () => preparePrint(root);
  const handleAfterPrint = () => restorePrint(root);

  targetWindow.addEventListener('beforeprint', handleBeforePrint);
  targetWindow.addEventListener('afterprint', handleAfterPrint);

  return () => {
    targetWindow.removeEventListener('beforeprint', handleBeforePrint);
    targetWindow.removeEventListener('afterprint', handleAfterPrint);
  };
}

export async function printSheetsWithBrowser(options = {}) {
  const printWindow = options.window || globalThis.window;
  const root = options.root
    || getOwnerDocument(null)?.querySelector?.('.printPageStack')
    || getOwnerDocument(null);

  if (!root) {
    throw new Error('Print root is not available.');
  }
  if (typeof printWindow?.print !== 'function') {
    throw new Error('Browser print is not available.');
  }

  await waitForPrintAssets(root, {
    requestAnimationFrame: options.requestAnimationFrame,
  });
  printWindow.print();
}
