import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(cssSource.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')))
    .map((match) => match[1])
    .join('\n');
}

describe('guided card layout polish', () => {
  it('keeps the step nav compact with labels beside the index', () => {
    const navButton = ruleBody('.guideStepNav button');

    expect(navButton).toContain('display: flex');
    expect(navButton).toContain('align-items: center');
    expect(navButton).toContain('min-height: 50px');
  });

  it('removes guide subtitles and final ready status copy', () => {
    [
      '这些字段会直接写入主卡面，先把角色的轮廓立起来。',
      '先选一个方向，下方细节会帮助你快速比对。',
      '输入整数数值，并标记一个核心属性作为角色的强项。',
      '因果值会决定命格标题，并影响之后的抽卡结果。',
      '最后检查一遍信息。你可以在这里随机补齐一版，也可以直接确认写入主卡。',
      '当前填写状态可提交。',
    ].forEach((copy) => {
      expect(mainSource).not.toContain(copy);
    });
  });

  it('uses a larger guided page base font', () => {
    expect(ruleBody('.guideShell')).toContain('font-size: 18px');
  });

  it('uses main-sheet style attribute panels with draggable value chips', () => {
    expect(ruleBody('.guideAttributeList')).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))');
    expect(cssSource).toContain('.guideAttributeChipBank');
    expect(cssSource).toContain('.guideAttributeDropZone');
    expect(mainSource).toContain('draggable');
    expect(mainSource).toContain('onDragStart={(event) => beginDragAttributeValue(event, value)}');
    expect(mainSource).toContain('onDrop={(event) => dropAttributeValue(event, title)}');
    expect(mainSource).not.toContain('guideAttributeStepper');
    expect(mainSource).not.toContain('aria-label={`${title}减少一点`}');
  });

  it('renders preview as ordered waterfall step cards', () => {
    expect(mainSource).toContain('guidePreviewMasonry');
    expect(mainSource).toContain('previewCards.map');
    ['01 信息', '02 出身', '03 分配属性', '04 道源', '05 法门', '06 大道', '07 因果值'].forEach((title) => {
      expect(mainSource).toContain(title);
    });
    expect(ruleBody('.guidePreviewMasonry')).toContain('column-count: 3');
    expect(ruleBody('.guidePreviewCard')).toContain('break-inside: avoid');
  });
});
