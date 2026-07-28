import { MarketplaceValidationError, validateMarketplaceDraft } from '../src/marketplaceValidation';

const MAX_BODY_BYTES = 2 * 1024 * 1024 + 4096;
const SESSION_SECONDS = 8 * 60 * 60;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_FAILURES = 5;

export function jsonResponse(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

function errorResponse(code, message, status, fields) {
  return jsonResponse({ error: { code, message, ...(fields?.length ? { fields } : {}) } }, status);
}

function bytesToBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function base64UrlToBytes(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > MAX_BODY_BYTES) throw Object.assign(new Error('请求内容不能超过 2 MiB。'), { status: 413 });
  if (!request.body) return {};
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      throw Object.assign(new Error('请求内容不能超过 2 MiB。'), { status: 413 });
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  });
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw Object.assign(new Error('请求 JSON 语法无效。'), { status: 400 });
  }
}

function cookieValue(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  return cookies.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1) || '';
}

export async function createSessionCookie(secret) {
  const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })));
  const signature = bytesToBase64Url(await hmac(payload, secret));
  return `nmxt_admin=${payload}.${signature}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export async function hasValidSession(request, secret) {
  if (!secret) return false;
  try {
    const [payload, signature] = cookieValue(request, 'nmxt_admin').split('.');
    if (!payload || !signature) return false;
    const expected = await hmac(payload, secret);
    if (!constantTimeEqual(expected, base64UrlToBytes(signature))) return false;
    const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));
    return Number(session.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function assertSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    throw Object.assign(new Error('拒绝跨站写入请求。'), { status: 403 });
  }
}

async function requireAdmin(context) {
  if (!await hasValidSession(context.request, context.env.SESSION_SECRET)) {
    throw Object.assign(new Error('管理员会话无效，请重新登录。'), { status: 401 });
  }
  if (!['GET', 'HEAD'].includes(context.request.method)) assertSameOrigin(context.request);
}

function rowToListing(row, includePayload = false) {
  return {
    id: row.id,
    source: row.source,
    resourceType: row.resource_type,
    status: row.status,
    version: row.version,
    name: row.name,
    author: row.author,
    packageKey: row.package_key,
    description: row.description,
    itemCount: row.item_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(includePayload ? { payload: JSON.parse(row.content_json) } : {}),
  };
}

function ensureEnvironment(env) {
  if (!env?.DB) throw Object.assign(new Error('D1 数据库尚未绑定。'), { status: 503 });
}

async function routeError(handler) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof MarketplaceValidationError) {
      return errorResponse('VALIDATION_ERROR', error.message, 422, error.fields);
    }
    return errorResponse(
      error.status === 401 ? 'UNAUTHORIZED'
        : error.status === 403 ? 'FORBIDDEN'
          : error.status === 404 ? 'NOT_FOUND'
            : error.status === 405 ? 'METHOD_NOT_ALLOWED'
              : error.status === 409 ? 'CONFLICT'
                : error.status === 413 ? 'PAYLOAD_TOO_LARGE'
                  : error.status === 429 ? 'RATE_LIMITED'
                    : error.status === 503 ? 'SERVICE_UNAVAILABLE'
                      : 'SERVER_ERROR',
      error?.message || '服务器暂时无法处理请求。',
      error?.status || 500,
    );
  }
}

export async function publicResources(context) {
  return routeError(async () => {
    ensureEnvironment(context.env);
    const { results } = await context.env.DB.prepare(
      `SELECT id, source, resource_type, status, version, name, author, package_key,
        description, item_count, created_at, updated_at
       FROM resource_listings WHERE status = 'published'
       ORDER BY CASE source WHEN 'official' THEN 0 ELSE 1 END, updated_at DESC`,
    ).all();
    return jsonResponse({ data: results.map((row) => rowToListing(row)) }, 200, { 'Cache-Control': 'public, max-age=60' });
  });
}

export async function publicResource(context) {
  return routeError(async () => {
    ensureEnvironment(context.env);
    const row = await context.env.DB.prepare(
      'SELECT * FROM resource_listings WHERE id = ? AND status = ?',
    ).bind(context.params.id, 'published').first();
    if (!row) throw Object.assign(new Error('资源不存在或已经下架。'), { status: 404 });
    return jsonResponse({ data: rowToListing(row, true) }, 200, { 'Cache-Control': 'public, max-age=60' });
  });
}

export async function adminLogin(context) {
  return routeError(async () => {
    ensureEnvironment(context.env);
    assertSameOrigin(context.request);
    if (!context.env.ADMIN_PASSWORD_HASH || !context.env.SESSION_SECRET) {
      throw Object.assign(new Error('管理员 Secret 尚未配置。'), { status: 503 });
    }
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = bytesToBase64Url(await hmac(ip, context.env.SESSION_SECRET));
    const now = Math.floor(Date.now() / 1000);
    const attempt = await context.env.DB.prepare('SELECT failures, window_started_at FROM login_attempts WHERE ip_hash = ?').bind(ipHash).first();
    if (attempt && attempt.window_started_at > now - LOGIN_WINDOW_SECONDS && attempt.failures >= LOGIN_MAX_FAILURES) {
      throw Object.assign(new Error('登录尝试过多，请稍后再试。'), { status: 429 });
    }
    const { password } = await readJsonBody(context.request);
    const valid = await verifyPassword(String(password || ''), context.env.ADMIN_PASSWORD_HASH);
    if (!valid) {
      await context.env.DB.prepare(
        `INSERT INTO login_attempts (ip_hash, failures, window_started_at, updated_at) VALUES (?, 1, ?, ?)
         ON CONFLICT(ip_hash) DO UPDATE SET
          failures = CASE WHEN window_started_at <= ? THEN 1 ELSE failures + 1 END,
          window_started_at = CASE WHEN window_started_at <= ? THEN ? ELSE window_started_at END,
          updated_at = ?`,
      ).bind(ipHash, now, now, now - LOGIN_WINDOW_SECONDS, now - LOGIN_WINDOW_SECONDS, now, now).run();
      throw Object.assign(new Error('密码不正确。'), { status: 401 });
    }
    await context.env.DB.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').bind(ipHash).run();
    return jsonResponse({ data: { authenticated: true } }, 200, { 'Set-Cookie': await createSessionCookie(context.env.SESSION_SECRET) });
  });
}

export async function verifyPassword(password, storedHash) {
  try {
    const [kind, iterationsText, saltText, expectedText] = storedHash.split('$');
    if (kind !== 'pbkdf2') return false;
    const iterations = Number(iterationsText);
    if (!Number.isInteger(iterations) || iterations < 100000) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const actual = new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: base64UrlToBytes(saltText), iterations },
      key,
      base64UrlToBytes(expectedText).length * 8,
    ));
    return constantTimeEqual(actual, base64UrlToBytes(expectedText));
  } catch {
    return false;
  }
}

export async function adminLogout(context) {
  return routeError(async () => {
    assertSameOrigin(context.request);
    return jsonResponse({ data: { authenticated: false } }, 200, {
      'Set-Cookie': 'nmxt_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
    });
  });
}

export async function adminSession(context) {
  return routeError(async () => {
    await requireAdmin(context);
    return jsonResponse({ data: { authenticated: true } });
  });
}

export async function adminResources(context) {
  return routeError(async () => {
    ensureEnvironment(context.env);
    await requireAdmin(context);
    if (context.request.method === 'GET') {
      const { results } = await context.env.DB.prepare(
        `SELECT id, source, resource_type, status, version, name, author, package_key,
          description, item_count, created_at, updated_at
         FROM resource_listings ORDER BY updated_at DESC`,
      ).all();
      return jsonResponse({ data: results.map((row) => rowToListing(row)) });
    }
    if (context.request.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', '不支持此请求方法。', 405);
    const draft = validateMarketplaceDraft(await readJsonBody(context.request));
    const conflict = await context.env.DB.prepare(
      'SELECT id FROM resource_listings WHERE resource_type = ? AND package_key = ?',
    ).bind(draft.resourceType, draft.packageKey).first();
    if (conflict) throw Object.assign(new Error('商城中已经存在同一资源包。'), { status: 409 });
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await context.env.DB.prepare(
      `INSERT INTO resource_listings
       (id, source, resource_type, status, version, name, author, package_key, description, item_count, content_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, draft.source, draft.resourceType, draft.status, draft.version, draft.name, draft.author, draft.packageKey, draft.description, draft.itemCount, JSON.stringify(draft.payload), now, now).run();
    return jsonResponse({ data: { id, ...draft, payload: undefined, createdAt: now, updatedAt: now } }, 201);
  });
}

export async function adminResource(context) {
  return routeError(async () => {
    ensureEnvironment(context.env);
    await requireAdmin(context);
    const existing = await context.env.DB.prepare('SELECT * FROM resource_listings WHERE id = ?').bind(context.params.id).first();
    if (!existing) throw Object.assign(new Error('资源不存在。'), { status: 404 });
    if (context.request.method === 'GET') return jsonResponse({ data: rowToListing(existing, true) });
    if (context.request.method === 'DELETE') {
      await context.env.DB.prepare('DELETE FROM resource_listings WHERE id = ?').bind(context.params.id).run();
      return jsonResponse({ data: { deleted: true } });
    }
    if (context.request.method !== 'PUT') return errorResponse('METHOD_NOT_ALLOWED', '不支持此请求方法。', 405);
    const draft = validateMarketplaceDraft(await readJsonBody(context.request));
    if (draft.resourceType !== existing.resource_type) {
      throw new MarketplaceValidationError([{ path: 'resourceType', message: '已创建条目的资源类型不能修改。' }]);
    }
    const conflict = await context.env.DB.prepare(
      'SELECT id FROM resource_listings WHERE resource_type = ? AND package_key = ? AND id <> ?',
    ).bind(draft.resourceType, draft.packageKey, context.params.id).first();
    if (conflict) throw Object.assign(new Error('商城中已经存在同一资源包。'), { status: 409 });
    const updatedAt = new Date().toISOString();
    await context.env.DB.prepare(
      `UPDATE resource_listings SET source = ?, status = ?, version = ?, name = ?, author = ?,
       package_key = ?, description = ?, item_count = ?, content_json = ?, updated_at = ? WHERE id = ?`,
    ).bind(draft.source, draft.status, draft.version, draft.name, draft.author, draft.packageKey, draft.description, draft.itemCount, JSON.stringify(draft.payload), updatedAt, context.params.id).run();
    return jsonResponse({ data: { id: context.params.id, ...draft, payload: undefined, createdAt: existing.created_at, updatedAt } });
  });
}
