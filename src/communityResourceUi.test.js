import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const managerSource = readFileSync(new URL('./CommunityResourceManager.jsx', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const railSource = readFileSync(new URL('./ToolRail.jsx', import.meta.url), 'utf8');

describe('community resource UI', () => {
  it('adds community resources directly below card-pack management in the resource menu', () => {
    const cardPackIndex = railSource.indexOf('<b>卡包管理</b>');
    const communityIndex = railSource.indexOf('<b>社区资源</b>');
    expect(cardPackIndex).toBeGreaterThan(-1);
    expect(communityIndex).toBeGreaterThan(cardPackIndex);
    expect(railSource).toContain('runAndClose(onOpenCommunityResources)');
    expect(railSource).toContain("menu=\"resources\"");
  });

  it('supports JSON import, per-resource loading, and deletion', () => {
    expect(managerSource).toContain('accept=".json,application/json"');
    expect(managerSource).toContain('parseCommunityResourceJson');
    expect(managerSource).toContain('communityResourceLoad');
    expect(managerSource).toContain('>载入');
    expect(managerSource).toContain('确认删除');
    expect(managerSource).toContain('<small>{COMMUNITY_CARD_TYPES[card.type]}</small>');
    expect(managerSource).toContain('<span>{COMMUNITY_CARD_TYPES[selectedCard.type]}</span>');
    expect(managerSource).toContain('<span>{pack.cards.length} 项内容</span>');
    expect(managerSource).toContain('<small>{pack.author}</small>');
  });

  it('keeps the selected community pack heading free of helper copy', () => {
    expect(managerSource).not.toContain('无需绑定道源或资源 ID');
    expect(managerSource).not.toContain('载入后优先填入第二页空位');
    expect(managerSource).not.toContain('资源包只需包名、作者与卡片内容');
    expect(managerSource).not.toContain('cardPackWelcomeGuide');
  });

  it('places loaded cards in page two, then their library, without overwriting full areas', () => {
    expect(mainSource).toContain('const loadCommunityResource = (resource)');
    expect(mainSource).toContain('view.slotFull && view.libraryFull');
    expect(mainSource).toContain('createManualCard({ name: resource.name, text: resource.text })');
    expect(mainSource).toContain("moveCard(state, createCardKey(resource.type, card), 'library')");
  });

  it('loads talents and punishments through the existing manual talent flow', () => {
    expect(mainSource).toContain("resource.type === 'talent' || resource.type === 'punishment'");
    expect(mainSource).toContain('addCustomTalent(emptySlot');
    expect(mainSource).toContain("const message = '已满，无法载入'");
    expect(mainSource).toContain('const message = `已载入：${resource.name}`');
  });

  it('allows a loaded manual card to be deleted from page two as well as its library', () => {
    expect(mainSource).toContain('...(card.manual ? [{');
    expect(mainSource).toContain('onSelect: () => onDelete(category, card.key)');
    expect(mainSource).toContain('onDelete={deleteCardFromLibrary}');
  });
});
