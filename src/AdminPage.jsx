import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  FileJson,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
} from 'lucide-react';
import './adminPage.css';

const EMPTY_DRAFT = {
  id: null,
  source: 'official',
  resourceType: 'card-pack',
  version: '',
  author: '',
  description: '',
  status: 'draft',
  payloadText: '',
};

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result?.error?.message || '请求失败。');
    error.fields = result?.error?.fields || [];
    throw error;
  }
  if (!Object.prototype.hasOwnProperty.call(result, 'data')) {
    throw new Error('后台 API 暂时不可用。');
  }
  return result.data;
}

function LoginPanel({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      onLogin();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="adminLoginShell">
      <form className="adminLoginCard" onSubmit={submit}>
        <ShieldCheck size={38} aria-hidden="true" />
        <span>逆命仙途</span>
        <h1>资源商城后台</h1>
        <p>请输入管理员密码继续。</p>
        <label>
          <b>管理员密码</b>
          <div className="adminPasswordField">
            <input
              autoFocus
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? '隐藏密码' : '显示密码'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error ? <p className="adminError" role="alert">{error}</p> : null}
        <button type="submit" className="adminPrimary" disabled={submitting || !password}>
          {submitting ? <RefreshCw className="spinning" size={18} /> : <ShieldCheck size={18} />}
          {submitting ? '正在验证' : '登录'}
        </button>
      </form>
    </main>
  );
}

function ResourceEditor({ draft, onChange, onCancel, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileRef = useRef(null);

  const update = (field, value) => onChange({ ...draft, [field]: value });
  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const payloadText = await file.text();
    let metadata = {};
    try {
      const payload = JSON.parse(payloadText);
      metadata = {
        ...(typeof payload?.version === 'string' ? { version: payload.version } : {}),
        ...(typeof payload?.author === 'string' ? { author: payload.author } : {}),
      };
    } catch {
      // Keep the imported text editable so the validation panel can report malformed JSON.
    }
    onChange({ ...draft, ...metadata, payloadText });
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      const data = {
        source: draft.source,
        resourceType: draft.resourceType,
        version: draft.version,
        author: draft.author,
        description: draft.description,
        status: draft.status,
        payload: JSON.parse(draft.payloadText),
      };
      const saved = await apiRequest(
        draft.id ? `/api/admin/resources/${encodeURIComponent(draft.id)}` : '/api/admin/resources',
        { method: draft.id ? 'PUT' : 'POST', body: JSON.stringify(data) },
      );
      onSaved(saved);
    } catch (saveError) {
      if (saveError instanceof SyntaxError) setErrors([{ path: 'payload', message: `JSON 语法错误：${saveError.message}` }]);
      else setErrors(saveError.fields.length ? saveError.fields : [{ path: '$', message: saveError.message }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="adminEditor" onSubmit={save}>
      <header>
        <div>
          <span>{draft.id ? '编辑资源' : '新建资源'}</span>
          <h2>{draft.id ? '更新商城条目' : '添加商城条目'}</h2>
        </div>
        <button type="button" onClick={onCancel}>取消</button>
      </header>
      <div className="adminEditorGrid">
        <label><b>来源</b><select value={draft.source} onChange={(event) => update('source', event.target.value)}><option value="official">官方</option><option value="third-party">第三方</option></select></label>
        <label><b>资源类型</b><select value={draft.resourceType} onChange={(event) => update('resourceType', event.target.value)} disabled={Boolean(draft.id)}><option value="card-pack">卡包</option><option value="community">社区资源</option></select></label>
        <label>
          <b>版本</b>
          <input value={draft.version} onChange={(event) => update('version', event.target.value)} required placeholder="例如 1.0.0" />
        </label>
        <label>
          <b>作者</b>
          <input value={draft.author} onChange={(event) => update('author', event.target.value)} required placeholder="请输入作者名称" />
        </label>
        <label className="adminEditorWide"><b>简介</b><textarea value={draft.description} onChange={(event) => update('description', event.target.value)} maxLength={500} rows={3} /></label>
        <label className="adminEditorWide">
          <span className="adminJsonLabel">
            <b>资源包 JSON</b>
            <button type="button" onClick={() => fileRef.current?.click()}><Upload size={16} />读取 JSON 文件</button>
          </span>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={loadFile} />
          <textarea className="adminJsonEditor" value={draft.payloadText} onChange={(event) => update('payloadText', event.target.value)} required spellCheck="false" rows={18} />
        </label>
      </div>
      {errors.length ? (
        <section className="adminValidationErrors" role="alert">
          <strong><AlertTriangle size={18} />无法保存，共发现 {errors.length} 个问题</strong>
          <ul>{errors.map((error, index) => <li key={`${error.path}-${index}`}><code>{error.path}</code> {error.message}</li>)}</ul>
        </section>
      ) : null}
      <footer>
        <button type="submit" className="adminPrimary" disabled={saving}>
          {saving ? <RefreshCw className="spinning" size={17} /> : <Save size={17} />}
          {saving ? '正在保存' : '保存资源'}
        </button>
      </footer>
    </form>
  );
}

export default function AdminPage() {
  const [sessionState, setSessionState] = useState('loading');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadResources = async () => {
    setLoading(true);
    setError('');
    try {
      setResources(await apiRequest('/api/admin/resources'));
    } catch (loadError) {
      if (/登录|会话|授权/.test(loadError.message)) setSessionState('anonymous');
      else setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest('/api/admin/session')
      .then(() => {
        setSessionState('authenticated');
        loadResources();
      })
      .catch(() => setSessionState('anonymous'));
  }, []);

  const visibleResources = useMemo(() => resources.filter((resource) => (
    (!sourceFilter || resource.source === sourceFilter)
    && (!typeFilter || resource.resourceType === typeFilter)
    && (!statusFilter || resource.status === statusFilter)
  )), [resources, sourceFilter, statusFilter, typeFilter]);

  if (sessionState === 'loading') return <main className="adminLoading"><RefreshCw className="spinning" />正在验证管理员会话…</main>;
  if (sessionState === 'anonymous') return <LoginPanel onLogin={() => { setSessionState('authenticated'); loadResources(); }} />;

  const editResource = async (resource) => {
    setError('');
    try {
      const full = await apiRequest(`/api/admin/resources/${encodeURIComponent(resource.id)}`);
      setDraft({
        id: full.id,
        source: full.source,
        resourceType: full.resourceType,
        version: full.version,
        author: full.author,
        description: full.description || '',
        status: full.status,
        payloadText: JSON.stringify(full.payload, null, 2),
      });
    } catch (editError) {
      setError(editError.message);
    }
  };

  const deleteResource = async () => {
    if (!pendingDelete) return;
    try {
      await apiRequest(`/api/admin/resources/${encodeURIComponent(pendingDelete.id)}`, { method: 'DELETE' });
      setPendingDelete(null);
      await loadResources();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const logout = async () => {
    try { await apiRequest('/api/admin/logout', { method: 'POST' }); } catch { /* Cookie is still cleared when possible. */ }
    setSessionState('anonymous');
  };

  return (
    <main className="adminShell">
      <header className="adminTopbar">
        <div><Store size={27} /><span>逆命仙途</span><h1>资源商城后台</h1></div>
        <button type="button" onClick={logout}><LogOut size={17} />退出登录</button>
      </header>
      {draft ? (
        <ResourceEditor
          draft={draft}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSaved={() => { setDraft(null); loadResources(); }}
        />
      ) : (
        <section className="adminWorkspace">
          <header className="adminWorkspaceHeader">
            <div><span>商城内容</span><h2>资源管理</h2></div>
            <button type="button" className="adminPrimary" onClick={() => setDraft({ ...EMPTY_DRAFT })}><Plus size={17} />新建资源</button>
          </header>
          <div className="adminFilters">
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} aria-label="按来源筛选"><option value="">全部来源</option><option value="official">官方</option><option value="third-party">第三方</option></select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="按资源类型筛选"><option value="">全部类型</option><option value="card-pack">卡包</option><option value="community">社区资源</option></select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="按状态筛选"><option value="">全部状态</option><option value="draft">草稿</option><option value="published">已上架</option></select>
            <button type="button" onClick={loadResources}><RefreshCw size={16} />刷新</button>
          </div>
          {error ? <p className="adminError" role="alert">{error}</p> : null}
          {loading ? <div className="adminEmpty"><RefreshCw className="spinning" />正在载入…</div> : visibleResources.length ? (
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead><tr><th>资源</th><th>作者</th><th>来源</th><th>类型</th><th>版本</th><th>状态</th><th>内容</th><th><span className="srOnly">操作</span></th></tr></thead>
                <tbody>{visibleResources.map((resource) => (
                  <tr key={resource.id}>
                    <td><strong>{resource.name}</strong><small>{resource.description || '暂无简介'}</small></td>
                    <td>{resource.author}</td>
                    <td>{resource.source === 'official' ? '官方' : '第三方'}</td>
                    <td>{resource.resourceType === 'card-pack' ? '卡包' : '社区资源'}</td>
                    <td>{resource.version}</td>
                    <td><span className={`adminStatus ${resource.status}`}>{resource.status === 'published' ? '已上架' : '草稿'}</span></td>
                    <td>{resource.itemCount} 项</td>
                    <td><div className="adminRowActions"><button type="button" onClick={() => editResource(resource)} aria-label={`编辑${resource.name}`}><Pencil size={16} /></button><button type="button" className="danger" onClick={() => setPendingDelete(resource)} aria-label={`删除${resource.name}`}><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="adminEmpty"><FileJson /><strong>没有符合条件的资源</strong></div>}
        </section>
      )}
      {pendingDelete ? (
        <div className="adminDeleteOverlay" role="alertdialog" aria-modal="true" aria-labelledby="admin-delete-title">
          <div><Trash2 size={26} /><h2 id="admin-delete-title">删除「{pendingDelete.name}」？</h2><p>商城条目和保存的 JSON 将永久删除。</p><footer><button type="button" onClick={() => setPendingDelete(null)}>取消</button><button type="button" className="danger" onClick={deleteResource}>确认删除</button></footer></div>
        </div>
      ) : null}
    </main>
  );
}
