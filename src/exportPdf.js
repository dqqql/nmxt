const DEFAULT_FILE_NAME = '逆命仙途角色卡';
const INVALID_FILE_CHARS = /[<>:"/\\|?*\u0000-\u001f]+/g;
const EXPORT_SCALE = 3;

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'));
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

export function savePdfBytes(bytes, fileName, env = {
  document,
  URL,
  setTimeout,
}) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = env.URL.createObjectURL(blob);
  const link = env.document.createElement('a');
  link.href = url;
  link.download = fileName;
  env.document.body.appendChild(link);
  link.click();
  link.remove();
  const schedule = env.setTimeout || globalThis.setTimeout;
  schedule.call(globalThis, () => env.URL.revokeObjectURL(url), 1000);
}

export async function canvasToPngPage(canvas) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Failed to capture PNG page.'));
      }
    }, 'image/png');
  });

  return {
    width: canvas.width,
    height: canvas.height,
    bytes: new Uint8Array(await blob.arrayBuffer()),
  };
}

export async function createCharacterPdf(pngPages, characterName = '', PdfDocumentCtor, saveFile = savePdfBytes) {
  if (!pngPages.length) {
    throw new Error('No pages were captured for export.');
  }
  if (!PdfDocumentCtor?.create) {
    throw new Error('PDF renderer is not available.');
  }

  const pdf = await PdfDocumentCtor.create();

  for (const pngPage of pngPages) {
    const image = await pdf.embedPng(pngPage.bytes);
    const page = pdf.addPage([pngPage.width, pngPage.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: pngPage.width,
      height: pngPage.height,
    });
  }

  const pdfBytes = await pdf.save({ useObjectStreams: true });
  saveFile(pdfBytes, getExportFileName(characterName));
  return pdfBytes;
}

export async function captureElement(element, renderer) {
  const html2canvas = renderer || (await import('html2canvas')).default;
  await waitForImages(element);

  return html2canvas(element, {
    backgroundColor: '#ffffff',
    logging: false,
    scale: EXPORT_SCALE,
    useCORS: true,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });
}

export async function exportSheetsAsPdf(elements, characterName) {
  const [{ default: html2canvas }, { PDFDocument }] = await Promise.all([
    import('html2canvas'),
    import('pdf-lib'),
  ]);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await nextFrame();

  const pngPages = [];
  for (const element of elements) {
    const canvas = await captureElement(element, html2canvas);
    pngPages.push(await canvasToPngPage(canvas));
  }

  return createCharacterPdf(pngPages, characterName, PDFDocument);
}
