import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Check,
  Download,
  LibraryBig,
  RefreshCw,
  Search,
  Store,
  X,
} from 'lucide-react';
import { getMarketplaceInstallStatus } from './marketplaceState';
import './resourceMarketplace.css';

const SOURCE_LABELS = { official: '官方', 'third-party': '第三方' };
const TYPE_LABELS = { 'card-pack': '卡包', community: '社区资源' };

async function readApiResult(response, fallbackMessage) {
  const result = await response.json().catch(() => null);
  if (!result || !Object.prototype.hasOwnProperty.call(result, 'data')) {
    throw new Error(result?.error?.message || fallbackMessage);
  }
  if (!response.ok) throw new Error(result?.error?.message || fallbackMessage);
  return result;
}

function getFocusable(root) {
  return [...(root?.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ) || [])].filter((node) => !node.hidden);
}

export default function ResourceMarketplace({
  open,
  cardPacks,
  communityPacks,
  installs,
  onInstall,
  onClose,
}) {
  const [source, setSource] = useState('official');
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [installingId, setInstallingId] = useState(null);
  const [pendingListing, setPendingListing] = useState(null);
  const [feedback, setFeedback] = useState('');
  const modalRef = useRef(null);
  const closeRef = useRef(null);

  const loadListings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/resources', { cache: 'no-store' });
      const result = await readApiResult(response, '商城暂时无法访问。');
      setListings(Array.isArray(result.data) ? result.data : []);
    } catch (loadError) {
      setError(loadError?.message || '商城暂时无法访问。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setFeedback('');
    loadListings();
    requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (pendingListing) setPendingListing(null);
        else onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusRoot = modalRef.current?.querySelector('.marketplaceConfirm') || modalRef.current;
      const focusable = getFocusable(focusRoot);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, pendingListing]);

  const visibleListings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return listings.filter((listing) => (
      listing.source === source
      && (!normalizedQuery || `${listing.name} ${listing.author} ${listing.description || ''}`
        .toLocaleLowerCase().includes(normalizedQuery))
    ));
  }, [listings, query, source]);

  if (!open) return null;

  const installListing = async (listing) => {
    setPendingListing(null);
    setInstallingId(listing.id);
    setFeedback('');
    try {
      const response = await fetch(`/api/resources/${encodeURIComponent(listing.id)}`, { cache: 'no-store' });
      const result = await readApiResult(response, '资源安装失败。');
      await onInstall(result.data);
      setFeedback(`已安装「${listing.name}」。`);
    } catch (installError) {
      setFeedback(installError?.message || '资源安装失败。');
    } finally {
      setInstallingId(null);
    }
  };

  const requestInstall = (listing) => {
    const status = getMarketplaceInstallStatus(listing, {
      installs,
      cardPacks,
      communityPacks,
    });
    if (status === 'update' || status === 'local') setPendingListing({ ...listing, status });
    else installListing(listing);
  };

  return (
    <div className="marketplaceOverlay" role="presentation">
      <section
        ref={modalRef}
        className="marketplaceModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="marketplace-title"
      >
        <header className="marketplaceHeader">
          <div>
            <span>扩展内容</span>
            <h2 id="marketplace-title"><Store size={23} aria-hidden="true" />资源商城</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="关闭资源商城">
            <X size={21} aria-hidden="true" />
          </button>
        </header>

        <div className="marketplaceToolbar">
          <div className="marketplaceTabs" role="tablist" aria-label="资源来源">
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={source === key}
                className={source === key ? 'selected' : ''}
                onClick={() => setSource(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="marketplaceSearch">
            <Search size={17} aria-hidden="true" />
            <span className="srOnly">搜索资源商城</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索包名、作者或简介" />
          </label>
        </div>

        {feedback ? <p className="marketplaceFeedback" role="status">{feedback}</p> : null}

        <main className="marketplaceBody">
          {loading ? (
            <div className="marketplaceState" aria-live="polite"><RefreshCw className="spinning" />正在载入商城…</div>
          ) : error ? (
            <div className="marketplaceState marketplaceError" role="alert">
              <AlertTriangle />
              <strong>无法载入资源商城</strong>
              <p>{error}</p>
              <button type="button" onClick={loadListings}>重试</button>
            </div>
          ) : visibleListings.length ? (
            <div className="marketplaceGrid">
              {visibleListings.map((listing) => {
                const status = getMarketplaceInstallStatus(listing, {
                  installs,
                  cardPacks,
                  communityPacks,
                });
                const installing = installingId === listing.id;
                return (
                  <article key={listing.id} className="marketplaceCard">
                    <div className="marketplaceCardBadges">
                      <span>{listing.source === 'official' ? '官方' : '第三方'}</span>
                      <span>{TYPE_LABELS[listing.resourceType]}</span>
                    </div>
                    <div className="marketplaceCardIcon">
                      {listing.resourceType === 'card-pack' ? <Boxes /> : <LibraryBig />}
                    </div>
                    <h3>{listing.name}</h3>
                    <p className="marketplaceAuthor">作者：{listing.author}</p>
                    <p>{listing.description || '暂无简介。'}</p>
                    <dl>
                      <div><dt>版本</dt><dd>{listing.version}</dd></div>
                      <div><dt>内容</dt><dd>{listing.itemCount} 项</dd></div>
                    </dl>
                    <button
                      type="button"
                      disabled={status === 'installed' || installing}
                      onClick={() => requestInstall(listing)}
                    >
                      {status === 'installed' ? <><Check size={17} />已安装</>
                        : installing ? <><RefreshCw className="spinning" size={17} />安装中</>
                          : status === 'update' ? <><RefreshCw size={17} />更新</>
                            : status === 'local' ? <><Download size={17} />替换本地版本</>
                              : <><Download size={17} />安装</>}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="marketplaceState">
              <Store />
              <strong>这里还没有资源</strong>
              <p>{query ? '换个关键词试试。' : `暂无${SOURCE_LABELS[source]}资源。`}</p>
            </div>
          )}
        </main>

        {pendingListing ? (
          <div className="marketplaceConfirm" role="alertdialog" aria-modal="true" aria-labelledby="marketplace-confirm-title">
            <div>
              <AlertTriangle size={25} aria-hidden="true" />
              <h3 id="marketplace-confirm-title">
                {pendingListing.status === 'local' ? '替换本地版本？' : '更新资源包？'}
              </h3>
              <p>
                「{pendingListing.name}」将替换管理器中的同一资源包，并载入商城版本 {pendingListing.version}。
              </p>
              <small>已经写入角色存档或角色卡的内容不会被移除。</small>
              <footer>
                <button type="button" onClick={() => setPendingListing(null)}>取消</button>
                <button type="button" className="primary" onClick={() => installListing(pendingListing)}>确认替换</button>
              </footer>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
