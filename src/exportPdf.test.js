import { describe, expect, it, vi } from 'vitest';
import { canvasToPngPage, createCharacterPdf, getExportFileName, savePdfBytes } from './exportPdf';

function makeCanvas(width, height) {
  return {
    width,
    height,
    toBlob: vi.fn((callback, type) => callback({
      type,
      arrayBuffer: () => Promise.resolve(new Uint8Array([width % 256, height % 256]).buffer),
    })),
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

describe('createCharacterPdf', () => {
  it('converts a canvas to a lossless PNG page with its pixel dimensions', async () => {
    const canvas = makeCanvas(1760, 1245);

    const page = await canvasToPngPage(canvas);

    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(page).toEqual({
      width: 1760,
      height: 1245,
      bytes: new Uint8Array([224, 221]),
    });
  });

  it('embeds each PNG as one exact-size PDF page in order', async () => {
    const pngPages = [
      { width: 1760, height: 1245, bytes: new Uint8Array([1]) },
      { width: 1200, height: 1600, bytes: new Uint8Array([2]) },
    ];
    const drawImage = vi.fn();
    const addPage = vi.fn((size) => ({ size, drawImage }));
    const embedPng = vi.fn(async (bytes) => ({ bytes }));
    const save = vi.fn(async () => new Uint8Array([37, 80, 68, 70]));
    const create = vi.fn(async () => ({ addPage, embedPng, save }));
    const saveFile = vi.fn();

    const pdfBytes = await createCharacterPdf(pngPages, '云舒', { create }, saveFile);

    expect(create).toHaveBeenCalledTimes(1);
    expect(embedPng).toHaveBeenNthCalledWith(1, pngPages[0].bytes);
    expect(embedPng).toHaveBeenNthCalledWith(2, pngPages[1].bytes);
    expect(addPage).toHaveBeenNthCalledWith(1, [1760, 1245]);
    expect(addPage).toHaveBeenNthCalledWith(2, [1200, 1600]);
    expect(drawImage).toHaveBeenNthCalledWith(1, { bytes: pngPages[0].bytes }, {
      x: 0,
      y: 0,
      width: 1760,
      height: 1245,
    });
    expect(drawImage).toHaveBeenNthCalledWith(2, { bytes: pngPages[1].bytes }, {
      x: 0,
      y: 0,
      width: 1200,
      height: 1600,
    });
    expect(save).toHaveBeenCalledWith({ useObjectStreams: true });
    expect(saveFile).toHaveBeenCalledWith(new Uint8Array([37, 80, 68, 70]), '云舒.pdf');
    expect(pdfBytes).toEqual(new Uint8Array([37, 80, 68, 70]));
  });

  it('rejects an empty PNG page list', async () => {
    await expect(createCharacterPdf([], '云舒', { create: vi.fn() })).rejects.toThrow('No pages were captured for export.');
  });
});

describe('savePdfBytes', () => {
  it('starts a download and revokes the object URL after the browser has a chance to consume it', () => {
    const click = vi.fn();
    const remove = vi.fn();
    const link = {};
    const appendChild = vi.fn();
    const revokeObjectURL = vi.fn();
    const setTimeout = vi.fn(function setTimeoutMock(callback) {
      expect(this).toBe(globalThis);
      callback();
    });

    savePdfBytes(new Uint8Array([37, 80, 68, 70]), '云舒.pdf', {
      document: {
        body: { appendChild },
        createElement: vi.fn(() => Object.assign(link, { click, remove })),
      },
      URL: {
        createObjectURL: vi.fn(() => 'blob:pdf'),
        revokeObjectURL,
      },
      setTimeout,
    });

    expect(link.href).toBe('blob:pdf');
    expect(link.download).toBe('云舒.pdf');
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(click).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:pdf');
  });
});
