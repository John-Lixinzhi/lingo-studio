/* ==========================================================================
   services/supabase — Supabase REST API 封装
   仅在 config.js 里的 SUPABASE_URL + SUPABASE_ANON_KEY 都填了时启用。
   所有调用都走 fetch + PostgREST，与现有零依赖架构兼容。
   未配置时所有函数返回 { ok: false, skipped: true }，调用方据此降级本地模式。
   ========================================================================== */

import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseEnabled } from '../config.js';

const TOKEN_KEY = 'lingo_sb_token';
const HEADER_KV = { 'apikey': SUPABASE_ANON_KEY };

function hasCreds() { return supabaseEnabled; }

function authHeader() {
  const tok = localStorage.getItem(TOKEN_KEY);
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

async function api(path, opts = {}) {
  if (!hasCreds()) return { ok: false, skipped: true };
  const url = `${SUPABASE_URL}${path}`;
  const headers = {
    ...HEADER_KV,
    ...authHeader(),
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message || msg; } catch { /* noop */ }
    console.warn('[supabase]', path, res.status, msg);
    return { ok: false, status: res.status, error: msg };
  }
  const text = await res.text();
  try { return { ok: true, data: text ? JSON.parse(text) : null }; }
  catch { return { ok: true, data: text }; }
}

/* ------------------------------------------------------------------
   Auth（邮箱 + 密码）
   ------------------------------------------------------------------ */
export async function signUp({ email, password, name, target = 'en' }) {
  if (!hasCreds()) return { ok: false, skipped: true };
  const r = await api('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({
      email, password,
      data: { name, target, accent: target },
    }),
  });
  if (!r.ok) return r;
  // 注册时 Supabase 会立即签一个 token（邮箱确认可跳过）
  const sess = r.data.session;
  if (sess?.access_token) localStorage.setItem(TOKEN_KEY, sess.access_token);
  const user = r.data.user;
  // 同步 profile
  if (user) upsertProfile({ id: user.id, name, target, accent: target }).catch(() => {});
  return { ok: true, user };
}

export async function signIn({ email, password }) {
  if (!hasCreds()) return { ok: false, skipped: true };
  const r = await api('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) return r;
  const { access_token, user } = r.data;
  if (access_token) localStorage.setItem(TOKEN_KEY, access_token);
  return { ok: true, user };
}

export async function signOut() {
  if (!hasCreds()) { localStorage.removeItem(TOKEN_KEY); return { ok: true }; }
  const r = await api('/auth/v1/logout', { method: 'POST' });
  localStorage.removeItem(TOKEN_KEY);
  return r;
}

/** 读取当前会话用户，顺带同步 profile 合并 */
export async function sessionUser() {
  const tok = localStorage.getItem(TOKEN_KEY);
  if (!tok) return null;
  const r = await api('/auth/v1/user');
  if (!r.ok) { localStorage.removeItem(TOKEN_KEY); return null; }
  return r.data;
}

export function sessionToken() { return localStorage.getItem(TOKEN_KEY); }

/* ------------------------------------------------------------------
   Profile / Progress
   ------------------------------------------------------------------ */
const TABLES = {
  profiles: '/rest/v1/profiles',
  progress: '/rest/v1/progress',
  posts:    '/rest/v1/posts',
};

function restPath(table, params = {}) {
  const qs = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return `${TABLES[table]}${qs ? '?' + qs : ''}`;
}

export async function upsertProfile({ id, name, target, accent }) {
  if (!hasCreds()) return { ok: false, skipped: true };
  return api(restPath('profiles'), {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify({ id, name, target, accent }),
  });
}

export async function loadProfile(userId) {
  if (!hasCreds()) return null;
  const r = await api(restPath('profiles', { id: `eq.${userId}` }));
  return r.ok && r.data?.length ? r.data[0] : null;
}

export async function listProfiles(ids = []) {
  if (!hasCreds()) return [];
  const r = await api(restPath('profiles', ids.length ? { id: `in.(${ids.join(',')})` } : {}));
  return r.ok ? r.data : [];
}

/* 进度整块 JSON 存取 */
export async function loadProgress(userId) {
  if (!hasCreds()) return null;
  const r = await api(restPath('progress', { user_id: `eq.${userId}` }));
  if (!r.ok || !r.data?.length) return null;
  const row = r.data[0];
  return row.data ? JSON.parse(row.data) : null;
}

/** 整块覆盖写，配合前端 queueWrite 做节流 */
export async function saveProgress(userId, data) {
  if (!hasCreds()) return { ok: false, skipped: true };
  const payload = { user_id: userId, data: JSON.stringify(data), updated_at: new Date().toISOString() };
  // upsert：有则 PATCH，无则 POST
  const r = await api(restPath('progress', { user_id: `eq.${userId}` }));
  if (r.ok && r.data?.length) {
    return api(restPath('progress', { user_id: `eq.${userId}` }), {
      method: 'PATCH',
      body: JSON.stringify({ data: payload.data, updated_at: payload.updated_at }),
    });
  }
  return api(TABLES.progress, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
}

/* ------------------------------------------------------------------
   Community
   ------------------------------------------------------------------ */
export async function listPosts(limit = 50) {
  if (!hasCreds()) return [];
  const r = await api(restPath('posts', { order: 'created_at.desc', limit }));
  return r.ok ? r.data : [];
}

export async function createPost(post) {
  if (!hasCreds()) return { ok: false, skipped: true };
  return api(TABLES.posts, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      author_id: post.authorId,
      author_name: post.authorName,
      lang: post.lang,
      type: post.type,
      content: post.content,
      tags: post.tags || [],
      likes: 0,
    }),
  });
}

export async function likePost(id, delta = 1) {
  if (!hasCreds()) return { ok: false, skipped: true };
  const r = await api(restPath('posts', { id: `eq.${id}`, select: 'likes' }));
  if (!r.ok || !r.data?.length) return r;
  return api(restPath('posts', { id: `eq.${id}` }), {
    method: 'PATCH',
    body: JSON.stringify({ likes: (r.data[0].likes || 0) + delta }),
  });
}

/* ------------------------------------------------------------------
   批量导入（首次迁移 / 示例数据）
   ------------------------------------------------------------------ */
export async function importBulk(table, rows) {
  if (!hasCreds() || !rows.length) return { ok: false, skipped: true };
  return api(TABLES[table], {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  });
}
