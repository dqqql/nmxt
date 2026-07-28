import { describe, expect, it } from 'vitest';
import {
  getMarketplaceInstallStatus,
  readMarketplaceInstalls,
  registerMarketplaceInstall,
  removeMarketplaceInstall,
  writeMarketplaceInstalls,
} from './marketplaceState';

const listing = {
  id: 'listing-1',
  version: '1.0.0',
  resourceType: 'card-pack',
  packageKey: 'pack.example',
};

describe('marketplace install state', () => {
  it('tracks install, update, and deletion status', () => {
    const installed = registerMarketplaceInstall([], listing);
    expect(getMarketplaceInstallStatus(listing, { installs: installed })).toBe('installed');
    expect(getMarketplaceInstallStatus({ ...listing, version: '2.0.0' }, { installs: installed })).toBe('update');
    expect(removeMarketplaceInstall(installed, 'card-pack', 'pack.example')).toEqual([]);
  });

  it('recognizes locally imported resources without marketplace metadata', () => {
    expect(getMarketplaceInstallStatus(listing, {
      cardPacks: [{ id: 'pack.example' }],
    })).toBe('local');
    expect(getMarketplaceInstallStatus({
      ...listing,
      resourceType: 'community',
      packageKey: '散修手札',
    }, {
      communityPacks: [{ name: '散修手札' }],
    })).toBe('local');
  });

  it('round trips valid records and ignores malformed storage', () => {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    };
    const installed = registerMarketplaceInstall([], listing);
    writeMarketplaceInstalls(installed, storage);
    expect(readMarketplaceInstalls(storage)).toEqual(installed);
  });
});
