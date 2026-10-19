/* ==========================================================================
   services/auth — 注册 / 登录 / 会话
   ⚠️ 演示实现：账号与口令保存在浏览器本地，口令仅做摘要处理后存储。
      生产环境必须把校验放到服务端，并使用 bcrypt/argon2 加盐哈希。
   ========================================================================== */

import { get, update } from '../core/store.js';
import { uid } from '../core/dom.js';
import { DEMO_ACCOUNTS } from '../data/community.js';
import { createProgress } from './progress.js';

/** 演示用口令摘要（djb2 变体）。仅用于避免明文落盘，不作安全承诺。 */
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

/** 注册：创建账号、初始化学习档案、自动登录 */
export function register({ name, email, pass, target = 'en' }) {
  const clean = { name: name.trim(), email: email.trim().toLowerCase(), target, accent: target };
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

export function login({ email, pass }) {
  const user = get().users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user) return { ok: false, error: '账号不存在，请先注册' };
  if (user.pass !== digest(pass)) return { ok: false, error: '密码不正确' };
  update((d) => { d.session = { userId: user.id }; });
  return { ok: true, user };
}

export function logout() {
  update((d) => { d.session = null; });
}

export function currentUser() {
  const { session, users } = get();
  if (!session) return null;
  return users.find((u) => u.id === session.userId) || null;
}

export function isLoggedIn() { return !!currentUser(); }

/** 更新个人资料 */
export function updateProfile(patch) {
  const user = currentUser();
  if (!user) return { ok: false, error: '未登录' };
  update((d) => {
    const u = d.users.find((x) => x.id === user.id);
    Object.assign(u, patch);
  });
  return { ok: true };
}

/** 切换学习目标语言 */
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
      // 给演示账号一些历史，便于展示趋势图与成就
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
