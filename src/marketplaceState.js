export const MARKETPLACE_INSTALL_STORAGE_KEY = 'nmxt.marketplaceInstalls.v1';

function safeClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function readMarketplaceInstalls(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem(MARKETPLACE_INSTALL_STORAGE_KEY) || '[]');
    return Array.isArray(value)
      ? value.filter((entry) => (
        entry
        && typeof entry.listingId === 'string'
        && typeof entry.version === 'string'
        && ['card-pack', 'community'].includes(entry.resourceType)
      ))
      : [];
  } catch {
    return [];
  }
}

export function writeMarketplaceInstalls(installs, storage = globalThis.localStorage) {
  storage?.setItem(
    MARKETPLACE_INSTALL_STORAGE_KEY,
    JSON.stringify(safeClone(Array.isArray(installs) ? installs : [])),
  );
}

export function registerMarketplaceInstall(installs, listing) {
  const record = {
    listingId: listing.id,
    version: listing.version,
    resourceType: listing.resourceType,
    packageKey: listing.packageKey,
  };
  return [
    ...(installs || []).filter((entry) => entry.listingId !== listing.id),
    record,
  ];
}

export function removeMarketplaceInstall(installs, resourceType, packageKey) {
  return (installs || []).filter((entry) => (
    entry.resourceType !== resourceType || entry.packageKey !== packageKey
  ));
}

export function getMarketplaceInstallStatus(listing, {
  installs = [],
  cardPacks = [],
  communityPacks = [],
} = {}) {
  const registered = installs.find((entry) => entry.listingId === listing.id);
  if (registered) return registered.version === listing.version ? 'installed' : 'update';

  const locallyInstalled = listing.resourceType === 'card-pack'
    ? cardPacks.some((pack) => pack.id === listing.packageKey)
    : communityPacks.some((pack) => pack.name === listing.packageKey);

  return locallyInstalled ? 'local' : 'install';
}
