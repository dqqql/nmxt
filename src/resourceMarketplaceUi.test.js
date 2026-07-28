import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const railSource = readFileSync(new URL('./ToolRail.jsx', import.meta.url), 'utf8');
const marketplaceSource = readFileSync(new URL('./ResourceMarketplace.jsx', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

describe('resource marketplace UI', () => {
  it('moves resource management into a dedicated tool menu with marketplace first', () => {
    const resourceMenu = railSource.slice(
      railSource.indexOf("openMenu === 'resources'"),
      railSource.indexOf("openMenu === 'export'"),
    );
    expect(resourceMenu.indexOf('<b>资源商城</b>')).toBeLessThan(resourceMenu.indexOf('<b>卡包管理</b>'));
    expect(resourceMenu.indexOf('<b>卡包管理</b>')).toBeLessThan(resourceMenu.indexOf('<b>社区资源</b>'));
    expect(resourceMenu).toContain('runAndClose(onOpenMarketplace)');
  });

  it('shows official and third-party package cards with required metadata', () => {
    expect(marketplaceSource).toContain("official: '官方'");
    expect(marketplaceSource).toContain("'third-party': '第三方'");
    expect(marketplaceSource).toContain('作者：{listing.author}');
    expect(marketplaceSource).toContain('TYPE_LABELS[listing.resourceType]');
    expect(marketplaceSource).toContain('{listing.name}');
  });

  it('installs both package types directly into their existing managers', () => {
    expect(mainSource).toContain("listing.resourceType === 'card-pack'");
    expect(mainSource).toContain('upsertCardPack(cardPacks, pack)');
    expect(mainSource).toContain('upsertCommunityResourcePack(communityResourcePacks, pack)');
    expect(mainSource).toContain('registerMarketplaceInstall(marketplaceInstalls, listing)');
  });
});
