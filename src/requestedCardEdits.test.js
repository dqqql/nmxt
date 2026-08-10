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

describe('requested card edits', () => {
  it('uses the revised two-line damage note and hides the capacity hint while printing', () => {
    expect(mainSource).toContain("note={'受到1次重伤\\n或每次进入险境血量时扣除1格'}");
    expect(mainSource).toContain('noteClassName="damageNote"');
    expect(mainSource).toContain('className="capacityEditHint printControl"');
    expect(mainSource).toContain('可右键切换虚实格以调整上限');

    const damageNote = ruleBody('.pageOneStatusRow .damageNote');
    expect(damageNote).toContain('grid-template-rows: repeat(2, 1.12em)');
    expect(damageNote).toContain('row-gap: 2px');
    expect(damageNote).toContain('align-self: center');
  });

  it('adds one independent black-or-empty corner toggle to each second-page card cell', () => {
    const cardGroupSource = mainSource.slice(
      mainSource.indexOf('function PageTwoCardGroup'),
      mainSource.indexOf('function PdfCheck'),
    );
    expect(cardGroupSource).toContain('<CornerMark');
    expect(cardGroupSource).toContain('id={`p2-${category || title}-${index}-corner`}');
    expect(mainSource).toContain('allowGhost={false}');
    expect(mainSource).toContain('aria-pressed={state.filled}');
    expect(ruleBody('.gridCornerMark.mark')).toContain('width: 24px');
    expect(ruleBody('.gridCornerMark.mark::after')).toContain('border-radius: 50%');
    expect(ruleBody('.gridCornerMark.mark.filled::after')).toContain('background: #202020');
    expect(cssSource).not.toContain('.mark::before');
  });

  it('fills the initial beast spell from the healing or binding bloodline and leaves the fields editable', () => {
    expect(mainSource).toContain('getBloodlineSelectionText(currentSpell, bloodlineId, selected)');
    expect(mainSource).toContain('hydrateBloodlineSpellSnapshot(');
    expect(mainSource).toContain('(snapshot.version ?? 0) < 3');
    expect(mainSource.match(/version: 3/g)).toHaveLength(2);
    expect(mainSource).toContain('onChange={(event) => setText(nameField, event.target.value)}');
    expect(mainSource).toContain('onChange={(event) => setText(effectField, event.target.value)}');
  });

  it('uses one complete inset focus ring for beast-spell inputs', () => {
    const focusRule = ruleBody('.editableFeatureTable.followerMoves > .featureRow > textarea:focus-visible');
    expect(focusRule).toContain('outline: 0');
    expect(focusRule).toContain('box-shadow: inset 0 0 0 2px #16864d');
  });
});
