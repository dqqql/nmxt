import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CirclePlus,
  LibraryBig,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  COMMUNITY_CARD_TYPES,
  addCommunityResourcePack,
  parseCommunityResourceJson,
  removeCommunityResourcePack,
} from './communityResourceState';
import './cardPackManager.css';

function getFocusable(root) {
  return [...(root?.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ) || [])].filter((node) => !node.hidden);
}

export default function CommunityResourceManager({
  open,
  packs,
  onChange,
  onLoad,
  onClose,
}) {
  const [selectedPackName, setSelectedPackName] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [errors, setErrors] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const modalRef = useRef(null);
  const importRef = useRef(null);
  const closeRef = useRef(null);

  const selectedPack = packs.find((pack) => pack.name === selectedPackName) || packs[0] || null;
  const filteredCards = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (selectedPack?.cards || [])
      .map((card, index) => ({ ...card, originalIndex: index }))
      .filter((card) => (
        (!query || `${card.name} ${card.text}`.toLocaleLowerCase().includes(query))
        && (!typeFilter || card.type === typeFilter)
      ));
  }, [search, selectedPack, typeFilter]);
  const selectedCard = filteredCards.find((card) => card.originalIndex === selectedCardIndex)
    || filteredCards[0]
    || null;

  useEffect(() => {
    if (!open) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setSelectedPackName((current) => (
      current && packs.some((pack) => pack.name === current) ? current : packs[0]?.name || null
    ));
    setErrors([]);
    setFeedback('');
    requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (pendingDelete) setPendingDelete(null);
        else onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusRoot = modalRef.current?.querySelector('.cardPackConfirm') || modalRef.current;
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
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open, onClose, packs, pendingDelete]);

  useEffect(() => {
    setSelectedCardIndex(0);
    setSearch('');
    setTypeFilter('');
    setFeedback('');
  }, [selectedPack?.name]);

  if (!open) return null;

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const pack = parseCommunityResourceJson(await file.text(), packs);
      onChange(addCommunityResourcePack(packs, pack));
      setSelectedPackName(pack.name);
      setErrors([]);
      setFeedback(`已导入「${pack.name}」。`);
    } catch (error) {
      setFeedback('');
      setErrors(error?.errors || [{ path: '$', message: error?.message || '无法导入社区资源包。' }]);
    }
  };

  const handleLoad = () => {
    if (!selectedCard) return;
    setFeedback('');
    onLoad(selectedCard);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const next = removeCommunityResourcePack(packs, pendingDelete.name);
    onChange(next);
    setSelectedPackName(next[0]?.name || null);
    setPendingDelete(null);
    setFeedback(`已删除资源包「${pendingDelete.name}」。`);
  };

  return (
    <div className="cardPackOverlay communityResourceOverlay" role="presentation">
      <section ref={modalRef} className="cardPackModal communityResourceModal" role="dialog" aria-modal="true" aria-labelledby="community-resource-title">
        <header className="cardPackHeader">
          <div>
            <span className="cardPackEyebrow">玩家共享内容</span>
            <h2 id="community-resource-title"><LibraryBig size={22} aria-hidden="true" />社区资源</h2>
          </div>
          <div className="cardPackHeaderActions">
            <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={handleImport} />
            <button type="button" className="cardPackImport" onClick={() => importRef.current?.click()}>
              <Upload size={17} aria-hidden="true" />导入资源包
            </button>
            <button ref={closeRef} type="button" className="cardPackClose" onClick={onClose} aria-label="关闭社区资源">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        {errors.length ? (
          <section className="cardPackErrors" role="alert" aria-label="社区资源导入错误">
            <div><AlertTriangle size={19} aria-hidden="true" /><strong>导入失败，共发现 {errors.length} 个问题</strong></div>
            <ol>
              {errors.map((error, index) => (
                <li key={`${error.path}-${index}`}><code>{error.path}</code><span>{error.message}</span></li>
              ))}
            </ol>
            <button type="button" onClick={() => setErrors([])}>收起错误</button>
          </section>
        ) : null}

        <div className="cardPackLayout">
          <aside className={`cardPackSidebar${packs.length ? '' : ' isEmpty'}`} aria-label="已导入社区资源包">
            <div className="cardPackSidebarTitle">
              <strong>资源包</strong>
              <span>{packs.length} 个</span>
            </div>
            {packs.length ? packs.map((pack) => (
              <button
                key={pack.name}
                type="button"
                className={`cardPackListItem${selectedPack?.name === pack.name ? ' selected' : ''}`}
                onClick={() => setSelectedPackName(pack.name)}
                aria-pressed={selectedPack?.name === pack.name}
              >
                <strong>{pack.name}</strong>
                <span>{pack.cards.length} 项内容</span>
                <small>{pack.author}</small>
              </button>
            )) : (
              <div className="cardPackEmpty">
                <LibraryBig size={28} aria-hidden="true" />
                <strong>还没有社区资源</strong>
              </div>
            )}
          </aside>

          <main className="cardPackContent">
            {selectedPack ? (
              <>
                <section className="cardPackSummary">
                  <div>
                    <h3>{selectedPack.name}</h3>
                  </div>
                  <button type="button" className="cardPackDelete" onClick={() => setPendingDelete(selectedPack)}>
                    <Trash2 size={16} aria-hidden="true" />删除资源包
                  </button>
                </section>

                <section className="cardPackFilters communityResourceFilters" aria-label="社区资源筛选">
                  <label className="cardPackSearch">
                    <span className="srOnly">搜索社区资源</span>
                    <Search size={16} aria-hidden="true" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索名称或内容" />
                  </label>
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="按卡片类型筛选">
                    <option value="">全部类型</option>
                    {Object.entries(COMMUNITY_CARD_TYPES).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
                  </select>
                </section>

                {feedback ? <p className="communityResourceFeedback" role="status">{feedback}</p> : null}

                <div className="cardPackResourceLayout">
                  <div className="cardPackResourceList" aria-label="社区资源列表">
                    {filteredCards.map((card) => (
                      <button
                        key={`${card.originalIndex}-${card.name}`}
                        type="button"
                        className={selectedCard?.originalIndex === card.originalIndex ? 'selected' : ''}
                        onClick={() => setSelectedCardIndex(card.originalIndex)}
                      >
                        <strong>{card.name}</strong>
                        <small>{COMMUNITY_CARD_TYPES[card.type]}</small>
                      </button>
                    ))}
                    {!filteredCards.length ? <div className="cardPackNoResults">没有符合筛选条件的资源。</div> : null}
                  </div>
                  <article className="cardPackResourceDetail communityResourceDetail">
                    {selectedCard ? (
                      <>
                        <div className="cardPackBadges">
                          <span>{COMMUNITY_CARD_TYPES[selectedCard.type]}</span>
                          {selectedCard.tier ? <span>{selectedCard.tier}阶</span> : null}
                        </div>
                        <h4>{selectedCard.name}</h4>
                        <p>{selectedCard.text}</p>
                        <button type="button" className="communityResourceLoad" onClick={handleLoad}>
                          <CirclePlus size={18} aria-hidden="true" />载入
                        </button>
                      </>
                    ) : <div className="cardPackEmpty">选择一项资源查看并载入。</div>}
                  </article>
                </div>
              </>
            ) : (
              <div className="cardPackWelcome">
                <section className="cardPackWelcomeImport" aria-labelledby="community-resource-welcome-title">
                  <div className="cardPackWelcomeIcon"><LibraryBig size={56} strokeWidth={1.8} aria-hidden="true" /></div>
                  <h3 id="community-resource-welcome-title">导入社区资源包</h3>
                  <button type="button" onClick={() => importRef.current?.click()}><Upload size={18} aria-hidden="true" />选择 JSON 文件</button>
                </section>
              </div>
            )}
          </main>
        </div>

        {pendingDelete ? (
          <div className="cardPackConfirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-community-pack-title">
            <div>
              <Trash2 size={24} aria-hidden="true" />
              <h3 id="delete-community-pack-title">删除「{pendingDelete.name}」？</h3>
              <p>将从社区资源列表移除 {pendingDelete.cards.length} 项内容。</p>
              <small>已经载入角色卡的内容不会被删除。</small>
              <div>
                <button type="button" onClick={() => setPendingDelete(null)}>取消</button>
                <button type="button" className="danger" onClick={confirmDelete}>确认删除</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
