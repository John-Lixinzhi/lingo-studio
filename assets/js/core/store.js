/* ==========================================================================
   core/store — 应用状态容器
   单一数据源 + 订阅发布 + localStorage 持久化。
   真实的线上版本可以把这个模块整体替换为对后端 REST/GraphQL 的封装，
   上层视图只依赖 get()/set()/subscribe() 这三个接口。
   ========================================================================== */

import { safeStore } from './dom.js';

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
}

/** 读取整个状态（只读语义，请勿直接改写返回值） */
export function get() { return state; }

/** 订阅状态变更，返回取消订阅函数 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 以「不可变更新」的方式修改状态某一部分 */
export function set(key, value) {
  state = { ...state, [key]: value };
  emit();
}

/** 用回调的方式做局部更新，便于改动嵌套对象 */
export function update(fn) {
  const draft = structuredClone(state);
  fn(draft);
  state = draft;
  emit();
}

/** 订阅并立即回调一次（视图常用） */
export function watch(fn) {
  fn(state);
  return subscribe(fn);
}

export function resetAll() {
  state = structuredClone(initialState);
  emit();
}
