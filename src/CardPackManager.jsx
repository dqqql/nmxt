import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Database,
  FileJson,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  REALM_LABELS,
  RESOURCE_TYPE_LABELS,
  countPackReferences,
  parseCardPackJson,
  removeCardPack,
  upsertCardPack,
} from './cardPackState';
import './cardPackManager.css';

const fateKindLabels = { talent: '天赋', punishment: '天谴' };

function getPackItemCount(pack) {
  return (pack?.resources?.length || 0) + (pack?.talents?.length || 0);
}

function getPackEntries(pack) {
  return [
    ...(pack?.resources || []).map((resource) => ({ ...resource, entryKind: 'resource' })),
    ...(pack?.talents || []).map((entry) => ({
      ...entry,
      entryKind: 'fate',
      type: 'fate-entry',
      text: entry.effect,
      parent: { name: '天赋 / 天谴' },
      realm: entry.tier,
    })),
  ];
}

function getEntryTypeLabel(entry) {
  return entry.entryKind === 'fate'
    ? fateKindLabels[entry.kind] || '天赋 / 天谴'
    : RESOURCE_TYPE_LABELS[entry.type] || entry.type;
}

function getFocusable(root) {
  return [...(root?.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ) || [])].filter((node) => !node.hidden);
}

export default function CardPackManager({
  open,
  packs,
  baseOptions,
  snapshots = [],
  onChange,
  onClose,
}) {
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [search, setSearch] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [realmFilter, setRealmFilter] = useState('');
  const [errors, setErrors] = useState([]);
  const [pendingReplacement, setPendingReplacement] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const modalRef = useRef(null);
  const importRef = useRef(null);
  const closeRef = useRef(null);

  const selectedPack = packs.find((pack) => pack.id === selectedPackId) || packs[0] || null;
  const selectedPackEntries = useMemo(() => getPackEntries(selectedPack), [selectedPack]);
  const filteredResources = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return selectedPackEntries.filter((resource) => {
      const searchable = `${resource.name} ${resource.text} ${resource.parent?.name}`.toLocaleLowerCase();
      return (!query || searchable.includes(query))
        && (!parentFilter || resource.parent?.name === parentFilter)
        && (!typeFilter || resource.type === typeFilter)
        && (!realmFilter || resource.realm === realmFilter);
    });
  }, [selectedPackEntries, search, parentFilter, typeFilter, realmFilter]);
  const selectedResource = filteredResources.find((resource) => resource.id === selectedResourceId)
    || filteredResources[0]
    || null;
  const parentNames = [...new Set(selectedPackEntries.map((resource) => resource.parent?.name).filter(Boolean))];
  const typeNames = [...new Set(selectedPackEntries.map((resource) => resource.type).filter(Boolean))];
  const realmNames = [...new Set(selectedPackEntries.map((resource) => resource.realm).filter(Boolean))];

  useEffect(() => {
    if (!open) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setSelectedPackId((current) => current && packs.some((pack) => pack.id === current) ? current : packs[0]?.id || null);
    setErrors([]);
    requestAnimationFrame(() => {
      const confirmButton = modalRef.current?.querySelector('.cardPackConfirm button');
      (confirmButton || closeRef.current)?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (pendingReplacement) setPendingReplacement(null);
        else if (pendingDelete) setPendingDelete(null);
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
  }, [open, packs, onClose, pendingDelete, pendingReplacement]);

  useEffect(() => {
    setSelectedResourceId(null);
    setSearch('');
    setParentFilter('');
    setTypeFilter('');
    setRealmFilter('');
  }, [selectedPack?.id]);

  if (!open) return null;

  const commitPack = (pack) => {
    const next = upsertCardPack(packs, pack);
    onChange(next);
    setSelectedPackId(pack.id);
    setErrors([]);
    setPendingReplacement(null);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      let rawId = null;
      try {
        rawId = JSON.parse(text)?.id || null;
      } catch {
        // The canonical parser below supplies the useful syntax error.
      }
      const existing = packs.find((pack) => pack.id === rawId);
      const pack = parseCardPackJson(text, {
        baseOptions,
        installedPacks: packs,
        replacingId: existing?.id || null,
      });
      if (existing) {
        setPendingReplacement({ existing, pack });
      } else {
        commitPack(pack);
      }
    } catch (error) {
      setErrors(error?.errors || [{ path: '$', message: error?.message || '无法导入卡包。' }]);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const next = removeCardPack(packs, pendingDelete.id);
    onChange(next);
    setSelectedPackId(next[0]?.id || null);
    setPendingDelete(null);
  };

  return (
    <div className="cardPackOverlay" role="presentation">
      <section ref={modalRef} className="cardPackModal" role="dialog" aria-modal="true" aria-labelledby="card-pack-title">
        <header className="cardPackHeader">
          <div>
            <span className="cardPackEyebrow">扩展内容</span>
            <h2 id="card-pack-title"><Boxes size={22} aria-hidden="true" />卡包管理</h2>
          </div>
          <div className="cardPackHeaderActions">
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={handleImport}
            />
            <button type="button" className="cardPackImport" onClick={() => importRef.current?.click()}>
              <Upload size={17} aria-hidden="true" />导入卡包
            </button>
            <button ref={closeRef} type="button" className="cardPackClose" onClick={onClose} aria-label="关闭卡包管理">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        {errors.length ? (
          <section className="cardPackErrors" role="alert" aria-label="卡包导入错误">
            <div><AlertTriangle size={19} aria-hidden="true" /><strong>导入失败，共发现 {errors.length} 个问题</strong></div>
            <ol>
              {errors.map((error, index) => (
                <li key={`${error.path}-${index}`}>
                  <code>{error.path}</code>
                  <span>{error.message}</span>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => setErrors([])}>收起错误</button>
          </section>
        ) : null}

        <div className="cardPackLayout">
          <aside className={`cardPackSidebar${packs.length ? '' : ' isEmpty'}`} aria-label="已安装卡包">
            <div className="cardPackSidebarTitle">
              <strong>已安装</strong>
              <span>{packs.length} 个</span>
            </div>
            {packs.length ? packs.map((pack) => (
              <button
                key={pack.id}
                type="button"
                className={`cardPackListItem${selectedPack?.id === pack.id ? ' selected' : ''}`}
                onClick={() => setSelectedPackId(pack.id)}
                aria-pressed={selectedPack?.id === pack.id}
              >
                <strong>{pack.name}</strong>
                <span>v{pack.version} · {getPackItemCount(pack)} 项内容</span>
                <small>{pack.author || pack.id}</small>
              </button>
            )) : (
              <div className="cardPackEmpty">
                <Boxes size={28} aria-hidden="true" />
                <strong>还没有卡包</strong>
              </div>
            )}
          </aside>

          <main className="cardPackContent">
            {selectedPack ? (
              <>
                <section className="cardPackSummary">
                  <div>
                    <span>{selectedPack.id}</span>
                    <h3>{selectedPack.name}</h3>
                    <p>{selectedPack.description || '这个卡包没有填写说明。'}</p>
                  </div>
                  <button type="button" className="cardPackDelete" onClick={() => setPendingDelete(selectedPack)}>
                    <Trash2 size={16} aria-hidden="true" />删除卡包
                  </button>
                </section>

                <section className="cardPackFilters" aria-label="资源筛选">
                  <label className="cardPackSearch">
                    <span className="srOnly">搜索资源</span>
                    <Search size={16} aria-hidden="true" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索名称、父资源或效果" />
                  </label>
                  <select value={parentFilter} onChange={(event) => setParentFilter(event.target.value)} aria-label="按父资源筛选">
                    <option value="">全部父资源</option>
                    {parentNames.map((name) => <option key={name}>{name}</option>)}
                  </select>
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="按资源类型筛选">
                    <option value="">全部类型</option>
                    {typeNames.map((type) => <option key={type} value={type}>{RESOURCE_TYPE_LABELS[type] || type}</option>)}
                  </select>
                  <select value={realmFilter} onChange={(event) => setRealmFilter(event.target.value)} aria-label="按境界筛选">
                    <option value="">全部境界</option>
                    {realmNames.map((realm) => <option key={realm} value={realm}>{REALM_LABELS[realm] || realm}</option>)}
                  </select>
                </section>

                <div className="cardPackResourceLayout">
                  <div className="cardPackResourceList" aria-label="卡包资源列表">
                    {filteredResources.map((resource) => (
                      <button
                        key={resource.id}
                        type="button"
                        className={selectedResource?.id === resource.id ? 'selected' : ''}
                        onClick={() => setSelectedResourceId(resource.id)}
                      >
                        <span>{getEntryTypeLabel(resource)}</span>
                        <strong>{resource.name}</strong>
                        {resource.entryKind === 'resource' ? (
                          <small>{resource.parent.name} · {REALM_LABELS[resource.realm] || resource.realm}</small>
                        ) : null}
                      </button>
                    ))}
                    {!filteredResources.length ? <div className="cardPackNoResults">没有符合筛选条件的资源。</div> : null}
                  </div>
                  <article className="cardPackResourceDetail">
                    {selectedResource ? (
                      <>
                        <div className="cardPackBadges">
                          <span>{getEntryTypeLabel(selectedResource)}</span>
                          <span>{selectedResource.entryKind === 'fate' ? `${selectedResource.tier}阶` : REALM_LABELS[selectedResource.realm] || selectedResource.realm}</span>
                          {selectedResource.acquisition === 'initial' ? <span>初始资源</span> : null}
                        </div>
                        <h4>{selectedResource.name}</h4>
                        <dl>
                          <div><dt>{selectedResource.entryKind === 'fate' ? '卡池' : '父资源'}</dt><dd>{selectedResource.entryKind === 'fate' ? '天赋 / 天谴' : selectedResource.parent.name}</dd></div>
                          <div><dt>资源 ID</dt><dd><code>{selectedResource.id}</code></dd></div>
                          {selectedResource.buff ? <div><dt>增益</dt><dd>{selectedResource.buff}</dd></div> : null}
                          {selectedResource.grants?.length ? <div><dt>附带内容</dt><dd>{selectedResource.grants.join('、')}</dd></div> : null}
                          {selectedResource.storageCapacityBonus ? <div><dt>储物格加成</dt><dd>+{selectedResource.storageCapacityBonus}</dd></div> : null}
                        </dl>
                        <p>{selectedResource.text}</p>
                      </>
                    ) : <div className="cardPackEmpty">选择一项资源查看完整内容。</div>}
                  </article>
                </div>
              </>
            ) : (
              <div className="cardPackWelcome">
                <section className="cardPackWelcomeImport" aria-labelledby="card-pack-welcome-title">
                  <div className="cardPackWelcomeIcon">
                    <Boxes size={56} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3 id="card-pack-welcome-title">导入你的第一个卡包</h3>
                  <button type="button" onClick={() => importRef.current?.click()}><Upload size={18} aria-hidden="true" />选择 JSON 文件</button>
                </section>

                <section className="cardPackWelcomeGuide" aria-label="卡包导入说明">
                  <article>
                    <Database size={25} aria-hidden="true" />
                    <div>
                      <h4>支持的内容</h4>
                      <p>可扩展已有道源、法门、大道的子资源，以及天赋 / 天谴卡池。</p>
                    </div>
                  </article>
                  <article>
                    <FileJson size={25} aria-hidden="true" />
                    <div>
                      <h4>文件格式</h4>
                      <p>请使用 JSON 格式文件，确保内容符合结构要求。</p>
                    </div>
                  </article>
                  <article>
                    <ShieldCheck size={25} aria-hidden="true" />
                    <div>
                      <h4>导入行为</h4>
                      <p>格式错误时会一次列出全部问题，不会导入部分内容。</p>
                    </div>
                  </article>
                </section>
              </div>
            )}
          </main>
        </div>

        {pendingReplacement ? (
          <div className="cardPackConfirm" role="alertdialog" aria-modal="true" aria-labelledby="replace-pack-title">
            <div>
              <AlertTriangle size={24} aria-hidden="true" />
              <h3 id="replace-pack-title">替换同 ID 卡包？</h3>
              <p>
                「{pendingReplacement.existing.name}」将从 v{pendingReplacement.existing.version}
                （{getPackItemCount(pendingReplacement.existing)} 项）更新为 v{pendingReplacement.pack.version}
                （{getPackItemCount(pendingReplacement.pack)} 项）。
              </p>
              <small>已有角色会保留已选资源快照，新选择使用新版本。</small>
              <div>
                <button type="button" onClick={() => setPendingReplacement(null)}>取消</button>
                <button type="button" className="primary" onClick={() => commitPack(pendingReplacement.pack)}>确认替换</button>
              </div>
            </div>
          </div>
        ) : null}

        {pendingDelete ? (
          <div className="cardPackConfirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-pack-title">
            <div>
              <Trash2 size={24} aria-hidden="true" />
              <h3 id="delete-pack-title">删除「{pendingDelete.name}」？</h3>
              <p>将移除 {getPackItemCount(pendingDelete)} 项内容。检测到 {countPackReferences(pendingDelete.id, snapshots)} 个角色存档引用此卡包。</p>
              <small>角色已选内容会保留快照，但以后无法重新选择这些资源。</small>
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
