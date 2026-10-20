/* ==========================================================================
   services/auth — 注册 / 登录 / 会话
   双通道：如果 Supabase 已配置 → 走 Supabase Auth（真注册、真登录、真云端）；
   否则 → 降级本地 localStorage 模式（保持原行为）。

   云端模式下：
     - 注册由 Supabase Auth 校验邮箱+密码，我们拿到 UUID 后写入 profile/progress 表
     - 登录拿到 access_token 存在 localStorage（键 lingo_sb_token）
     - 进度 / profile 随 store 的 queueWrite 自动双写
   ========================================================================== */

import { get, update } from '../core/store.js';
import { uid } from '../core/dom.js';
import { DEMO_ACCOUNTS } from '../data/community.js';
import { createProgress } from './progress.js';
import { supabaseEnabled } from '../config.js';
import { signUp, signIn, signOut, upsertProfile } from './supabase.js';

/** 本地模式口令摘要（djb2 变体）。仅用于避免明文落盘，不作安全承诺。 */
function digest(text) {
  let h = 5381;
  const salted = `lingo::${text}`;
  for (let i = 0; i < salted.length; i++) {
    h = ((h << 5) + h + salted.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validate({ name, email, pass, confirm }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = '昵称至少 2 个字符';
  if (name && name.trim().length > 16) errors.name = '昵称最多 16 个字符';
  if (!email || !EMAIL_RE.test(email)) errors.email = '请输入有效的邮箱地址';
  if (!pass || pass.length < 6) errors.pass = '密码至少 6 位';
  if (confirm !== undefined && confirm !== pass) errors.confirm = '两次输入的密码不一致';
  return errors;
}

/* ---------------- 注册 ---------------- */

export async function register({ name, email, pass, target = 'en' }) {
  const clean = { name: name.trim(), email: email.trim().toLowerCase(), target, accent: target };

  if (supabaseEnabled) {
    // 云端注册：Supabase Auth 管密码 + 邮箱（免费版默认允许跳过邮箱确认）
    const r = await signUp({ email, password: pass, name: clean.name, target });
    if (r.ok === false && r.skipped) { /* 理论上不会走到这里 */ }
    if (r.ok === false) return { ok: false, error: r.error || '注册失败，请稍后再试' };
    const sbUser = r.user;
    const user = {
      id: sbUser.id,                     // Supabase UUID
      name: clean.name,
      email: clean.email,
      target: clean.target,
      accent: clean.accent,
      createdAt: sbUser.created_at ? Date.parse(sbUser.created_at) : Date.now(),
      remote: true,
    };
    update((d) => {
      // 避免与本地 demo 账号冲突
      if (!d.users.some((u) => u.id === user.id)) d.users.push(user);
      d.progress[user.id] = d.progress[user.id] || createProgress(user);
      d.session = { userId: user.id, remote: true };
    });
    return { ok: true, user };
  }

  // 本地注册
  if (get().users.some((u) => u.email === clean.email)) {
    return { ok: false, error: '该邮箱已注册，请直接登录' };
  }
  const user = {
    id: uid('user'),
    name: clean.name,
    email: clean.email,
    pass: digest(pass),
    accent: clean.accent,
    target: clean.target,
    createdAt: Date.now(),
  };
  update((d) => {
    d.users.push(user);
    d.progress[user.id] = createProgress(user);
    d.session = { userId: user.id };
  });
  return { ok: true, user };
}

/* ---------------- 登录 ---------------- */

export async function login({ email, pass }) {
  if (supabaseEnabled) {
    const r = await signIn({ email: email.trim().toLowerCase(), password: pass });
    if (r.ok === false) return { ok: false, error: r.error || '账号或密码不正确' };
    const sbUser = r.user;
    const user = {
      id: sbUser.id,
      name: sbUser.user_metadata?.name || sbUser.email.split('@')[0],
      email: sbUser.email,
      target: sbUser.user_metadata?.target || 'en',
      accent: sbUser.user_metadata?.accent || sbUser.user_metadata?.target || 'en',
      createdAt: sbUser.created_at ? Date.parse(sbUser.created_at) : Date.now(),
      remote: true,
    };
    update((d) => {
      const existing = d.users.find((u) => u.id === user.id);
      if (existing) Object.assign(existing, user);
      else d.users.push(user);
      d.progress[user.id] = d.progress[user.id] || createProgress(user);
      d.session = { userId: user.id, remote: true };
    });
    // 把 profile 写回 Supabase（以防用户中途改过昵称/主攻语言）
    upsertProfile({ id: sbUser.id, name: user.name, target: user.target, accent: user.accent }).catch(() => {});
    return { ok: true, user };
  }

  // 本地登录
  const cleanEmail = String(email).trim().toLowerCase();
  const user = get().users.find((u) => u.email === cleanEmail);
  if (!user) return { ok: false, error: '账号不存在，请先注册' };
  if (user.remote) return { ok: false, error: '该账号是云端账号，请先在 Supabase 启用后再登录' };
  if (user.pass !== digest(pass)) return { ok: false, error: '密码不正确' };
  update((d) => { d.session = { userId: user.id }; });
  return { ok: true, user };
}

/* ---------------- 登出 ---------------- */

export async function logout() {
  if (supabaseEnabled) {
    try { await signOut(); } catch { /* 不影响本地登出 */ }
  }
  update((d) => { d.session = null; });
}

/* ---------------- 当前用户 ---------------- */

export function currentUser() {
  const { session, users } = get();
  if (!session) return null;
  return users.find((u) => u.id === session.userId) || null;
}

export function isLoggedIn() { return !!currentUser(); }

/** 更新个人资料——Supabase 模式下同步写 profiles 表 */
export function updateProfile(patch) {
  const user = currentUser();
  if (!user) return { ok: false, error: '未登录' };
  update((d) => {
    const u = d.users.find((x) => x.id === user.id);
    Object.assign(u, patch);
  });
  if (supabaseEnabled && user.remote) {
    upsertProfile({ id: user.id, name: patch.name || user.name, target: patch.target || user.target, accent: patch.accent || user.accent }).catch(() => {});
  }
  return { ok: true };
}

export function setTargetLang(code) {
  const user = currentUser();
  if (!user) return;
  update((d) => {
    const u = d.users.find((x) => x.id === user.id);
    u.target = code;
    u.accent = code;
    const p = d.progress[user.id];
    if (p) p.activeLang = code;
  });
  if (supabaseEnabled && user.remote) {
    upsertProfile({ id: user.id, name: user.name, target: code, accent: code }).catch(() => {});
  }
}

/** 首次启动时播种演示账号，让榜单与社区不至于空白 */
export function ensureSeedUsers() {
  const state = get();
  if (state.users.some((u) => u.email === DEMO_ACCOUNTS[0].email)) return;
  update((d) => {
    DEMO_ACCOUNTS.forEach((acc, i) => {
      if (d.users.some((u) => u.email === acc.email)) return;
      const user = {
        id: `demo_${acc.target}`,
        name: acc.name,
        email: acc.email,
        pass: digest(acc.pass),
        accent: acc.accent,
        target: acc.target,
        createdAt: Date.now() - (i + 1) * 86400000,
        demo: true,
      };
      d.users.push(user);
      const p = createProgress(user);
      p.xp = [820, 1160, 640][i];
      p.streak = [12, 6, 4][i];
      p.activeLang = acc.target;
      for (let day = 0; day < 14; day++) {
        const date = new Date(Date.now() - day * 86400000).toISOString().slice(0, 10);
        if (day % 3 !== 1) {
          p.activity[date] = (p.activity[date] || 0) + [3, 2, 1][i];
          p.dailyXp[date] = (p.dailyXp[date] || 0) + [70, 50, 35][i] + (day % 4) * 12;
        }
      }
      d.progress[user.id] = p;
    });
  });
}
