/* ==========================================================================
   core/store — 应用状态容器
   单一数据源 + 订阅发布 + localStorage 持久化 + Supabase 双写。
   对外暴露 get() / set() / update() / subscribe() —— 上层视图只依赖这四个接口。

   双写策略：
     1. 任何变更 → 立即写 localStorage（保持原行为，无网络也可用）
     2. 如果 Supabase 已启用且有登录态 → queueWrite() 节流合并后异步云端同步
     3. 页面首次加载如果发现本地有 Supabase token → 先拉云端 profile/progress 合并
   ========================================================================== */

import { safeStore } from './dom.js';
import { supabaseEnabled } from '../config.js';
import {
  sessionToken, sessionUser, loadProgress, saveProgress, loadProfile,
} from '../services/supabase.js';

const KEY = 'lingo_studio_v1';

const initialState = {
  users: [],          // { id, name, email, pass, accent, createdAt, joinedAt }
  session: null,      // { userId }
  progress: {},       // userId -> progress
  posts: [],          // 社区动态
  groups: [],         // 学习小组
  seeded: false,
};

let state = load();
const listeners = new Set();

/* ---------------- 基础读写 ---------------- */

function load() {
  const raw = safeStore.get(KEY);
  if (!raw) return structuredClone(initialState);
  try {
    const parsed = JSON.parse(raw);
    return { ...structuredClone(initialState), ...parsed };
  } catch {
    return structuredClone(initialState);
  }
}

function persist() {
  try { safeStore.set(KEY, JSON.stringify(state)); } catch { /* 忽略配额错误 */ }
}

function emit() {
  persist();
  listeners.forEach((fn) => fn(state));
  queueWrite();
}

export function get() { return state; }
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function set(key, value) {
  state = { ...state, [key]: value };
  emit();
}
export function update(fn) {
  const draft = structuredClone(state);
  fn(draft);
  state = draft;
  emit();
}
export function watch(fn) {
  fn(state);
  return subscribe(fn);
}
export function resetAll() {
  state = structuredClone(initialState);
  emit();
}

/* ---------------- 云端同步（节流） ---------------- */

let writeTimer = null;
function queueWrite() {
  if (!supabaseEnabled || !sessionToken()) return;
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    const uid = state.session?.userId;
    if (!uid || !state.progress[uid]) return;
    saveProgress(uid, state.progress[uid]).catch((e) => {
      // 静默失败：网络差或 RLS 拒绝都不应影响本地体验
      console.debug('[store] 云端进度同步失败，继续保留本地副本', e);
    });
  }, 1200);   // 1.2 秒合并窗口，避免每按一下按钮就发一次请求
}

/* ---------------- 启动时恢复云端状态 ---------------- */

let hydrating = false;
export async function hydrate() {
  if (!supabaseEnabled) return;
  const tok = sessionToken();
  if (!tok) return;
  hydrating = true;
  try {
    const sbUser = await sessionUser();
    if (!sbUser) {
      // token 过期
      state.session = null;
      persist();
      emit();
      return;
    }
    const profile = await loadProfile(sbUser.id);
    const progress = await loadProgress(sbUser.id);

    const mergedUser = {
      id: sbUser.id,
      name: profile?.name || sbUser.user_metadata?.name || sbUser.email.split('@')[0],
      email: sbUser.email,
      target: profile?.target || sbUser.user_metadata?.target || 'en',
      accent: profile?.accent || sbUser.user_metadata?.accent || 'en',
      createdAt: sbUser.created_at ? Date.parse(sbUser.created_at) : Date.now(),
      remote: true,
    };

    // 合并用户列表
    const existing = state.users.find((u) => u.id === sbUser.id);
    if (!existing) state.users.push(mergedUser);
    else Object.assign(existing, mergedUser);

    // 合并进度（云端优先，覆盖本地同 id 副本）
    if (progress) {
      state.progress[sbUser.id] = progress;
    } else if (!state.progress[sbUser.id]) {
      // 云端也没有，保留本地（可能是注册后首次进入）
    }

    state.session = { userId: sbUser.id, remote: true };
    persist();
    emit();
  } catch (e) {
    console.debug('[store] 云端状态恢复失败，继续使用本地数据', e);
  } finally {
    hydrating = false;
  }
}

export function isHydrating() { return hydrating; }
