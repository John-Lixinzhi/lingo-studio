/* ==========================================================================
   app — 应用装配：外壳渲染、路由表、会话守卫
   ========================================================================== */

import './config.js';                                    // 确保 supabaseEnabled 已初始化
import { esc, icon, qs, qsa, initials } from './core/dom.js';
import { subscribe, hydrate } from './core/store.js';
import { register, setNotFound, start, go, parse, resolve } from './core/router.js';
import { ensureSeedUsers, currentUser, setTargetLang, isLoggedIn } from './services/auth.js';
import { getStats, getProgress } from './services/progress.js';
import { LANGUAGES, getLanguage } from './data/courses.js';
import { toast } from './core/ui.js';
import { openPanel } from './core/appearance.js';

import * as landing from './views/landing.js';
import * as auth from './views/auth.js';
import * as dashboard from './views/dashboard.js';
import * as courses from './views/courses.js';
import * as lesson from './views/lesson.js';
import * as practice from './views/practice.js';
import * as community from './views/community.js';
import * as achievements from './views/achievements.js';
import * as profile from './views/profile.js';

const root = document.getElementById('root');

const NAV = [
  { path: '/learn', label: '学习台', icon: 'home', title: '学习台', crumb: 'Dashboard' },
  { path: '/courses', label: '课程', icon: 'book', title: '课程地图', crumb: 'Curriculum' },
  { path: '/practice', label: '练习', icon: 'practice', title: '互动模块', crumb: 'Practice' },
  { path: '/community', label: '社区', icon: 'community', title: '社区', crumb: 'Community' },
  { path: '/achievements', label: '成就', icon: 'trophy', title: '成就', crumb: 'Achievements' },
  { path: '/profile', label: '我的', icon: 'user', title: '个人中心', crumb: 'Profile' },
];

/* ------------------------------ 路由表 ------------------------------ */
register('/', () => renderPublic(landing));
register('/auth', () => renderPublic(auth));
register('/learn', () => renderApp(dashboard, { nav: '/learn' }));
register('/courses', () => renderApp(courses, { nav: '/courses' }));
register('/courses/:lang', (ctx) => renderApp(courses, { nav: '/courses', ctx }));
register('/lesson/:id', (ctx) => renderApp(lesson, { nav: '/courses', ctx, title: '课节' }));
register('/practice', (ctx) => renderApp(practice, { nav: '/practice', ctx }));
register('/practice/:type', (ctx) => renderApp(practice, { nav: '/practice', ctx, title: '练习' }));
register('/community', (ctx) => renderApp(community, { nav: '/community', ctx }));
register('/achievements', () => renderApp(achievements, { nav: '/achievements' }));
register('/profile', () => renderApp(profile, { nav: '/profile' }));

setNotFound(() => {
  root.innerHTML = '<div class="page"><div class="empty"><div class="glyph">404</div><h3 class="display-m">页面不存在</h3><a class="btn btn-primary mt-24" href="#/learn">回到学习台</a></div></div>';
});

/* ------------------------------ 公开页（未登录） ------------------------------ */
function renderPublic(view, ctx = {}) {
  root.innerHTML = view.render(ctx);
  view.mount?.(root, ctx);
}

/* ------------------------------ 应用内页（含外壳） ------------------------------ */
function renderApp(view, { nav, ctx = {}, title }) {
  if (!isLoggedIn()) { go('/auth'); return; }
  const user = currentUser();
  const stats = getStats();
  const active = NAV.find((n) => n.path === nav) || NAV[0];
  const crumb = title || active.title;

  root.innerHTML = shell({ user, stats, active, crumb });
  const viewHost = qs('#view', root);
  viewHost.innerHTML = view.render(ctx);
  view.mount?.(viewHost, ctx);
  bindShell(root);
}

function shell({ user, stats, active, crumb }) {
  const due = stats?.dueCount || 0;
  const lang = getLanguage(getProgress()?.activeLang || 'en');
  const goalPct = stats ? Math.round((stats.todayXp / stats.dailyGoal) * 100) : 0;

  return `
  <div class="mobile-bar">
    <button class="icon-btn" id="open-rail" aria-label="打开导航">${icon('menu', 18)}</button>
    <b style="font-family:var(--font-display);font-size:1rem">Lingo Studio</b>
    <div class="grow"></div>
    <span class="chip chip-${lang.accent}">${esc(lang.label)}</span>
    <button class="icon-btn" data-appearance aria-label="外观与亮度" title="亮度与主题"
      style="border-color:rgba(255,255,255,.22);color:var(--rail-ink)">${icon('sun', 18)}</button>
  </div>

  <div class="shell">
    <aside class="rail" id="rail">
      <div class="brand">
        <div class="brand-mark">L</div>
        <div class="brand-text"><b>Lingo Studio</b><span>Polyglot Studio</span></div>
      </div>

      <nav class="rail-nav">
        <div class="rail-label">学习</div>
        ${NAV.slice(0, 3).map((n) => navItem(n, active.path, n.path === '/practice' ? due : 0)).join('')}
        <div class="rail-label">社区</div>
        ${NAV.slice(3, 5).map((n) => navItem(n, active.path, 0)).join('')}
        <div class="rail-label">账号</div>
        ${NAV.slice(5).map((n) => navItem(n, active.path, 0)).join('')}
      </nav>

      <div class="rail-foot">
        <div class="row between mb-12" style="padding:0 10px">
          <span class="mono" style="color:var(--rail-mute);font-size:.56rem">今日目标</span>
          <span class="mono" style="color:var(--rail-mute);font-size:.56rem" id="rail-goal">${stats?.todayXp || 0}/${stats?.dailyGoal || 50}</span>
        </div>
        <div class="meter meter-xs mb-16" style="background:rgba(255,255,255,.14)"><i style="width:${goalPct}%;background:var(--accent)"></i></div>
        <a class="rail-user" href="#/profile">
          <span class="avatar avatar-${esc(user.accent)}">${esc(initials(user.name))}</span>
          <span class="who grow">
            <b>${esc(user.name)}</b>
            <span id="rail-xp">Lv.${stats?.level || 1} · ${stats?.xp || 0} XP</span>
          </span>
          ${icon('next', 14)}
        </a>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <span class="crumb">Lingo Studio / <b>${esc(crumb)}</b></span>
        <div class="grow"></div>
        <div class="lang-switch" id="topbar-lang">
          ${LANGUAGES.map((l) => `
            <button data-toplang="${esc(l.code)}" class="${l.code === lang.code ? 'on' : ''}">${esc(l.label)}</button>`).join('')}
        </div>
        <div class="row gap-8">
          <span class="chip chip-plain" title="今日获得的经验值">${icon('bolt', 13)} <span id="topbar-xp">${stats?.todayXp || 0}</span> XP</span>
          <span class="chip chip-plain" title="连续学习天数">${icon('flame', 13)} ${stats?.streak || 0}</span>
          <button class="icon-btn" data-appearance aria-label="外观与亮度" title="亮度与主题">${icon('sun', 17)}</button>
        </div>
      </header>

      <div id="view"></div>
    </main>
  </div>`;
}

function navItem(n, activePath, badge) {
  const on = n.path === activePath;
  return `
    <a class="nav-item ${on ? 'active' : ''}" href="#${n.path}">
      ${icon(n.icon, 18)}
      <span>${esc(n.label)}</span>
      ${badge ? `<span class="nav-badge">${badge}</span>` : ''}
    </a>`;
}

/* ------------------------------ 外壳交互 ------------------------------ */
function bindShell(host) {
  qs('#open-rail', host)?.addEventListener('click', () => {
    qs('#rail', host)?.classList.toggle('open');
  });

  qsa('.nav-item', host).forEach((a) => a.addEventListener('click', () => {
    qs('#rail', host)?.classList.remove('open');
  }));

  qsa('[data-toplang]', host).forEach((b) => b.addEventListener('click', () => {
    const code = b.dataset.toplang;
    const l = getLanguage(code);
    if (getProgress()?.activeLang === code) return;
    setTargetLang(code);
    toast(`已切换学习语言：${l.label}`, 'ok');
    refreshCurrentView();     // 保持当前页面，重新渲染以反映语言变化
  }));
}

/** 语言切换后原地刷新当前页面 */
function refreshCurrentView() {
  const { path, params } = parse();
  const query = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
  const target = `#${path}${query}`;
  if (location.hash === target) resolve();
  else location.hash = target;
}

/* 外观面板入口：顶栏 / 手机栏 / 落地页 / 登录页上的 [data-appearance] 按钮统一走委托绑定 */
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('[data-appearance]');
  if (!btn) return;
  e.preventDefault();
  openPanel();
});

/* 顶部数字实时刷新（不重建 DOM，避免打断正在进行的练习） */
subscribe(() => {
  const stats = getStats();
  if (!stats) return;
  const xpNode = document.getElementById('topbar-xp');
  const railXp = document.getElementById('rail-xp');
  const railGoal = document.getElementById('rail-goal');
  if (xpNode) xpNode.textContent = stats.todayXp;
  if (railXp) railXp.textContent = `Lv.${stats.level} · ${stats.xp} XP`;
  if (railGoal) railGoal.textContent = `${stats.todayXp}/${stats.dailyGoal}`;
  const badge = document.querySelector('.nav-item[href="#/practice"] .nav-badge');
  if (badge && stats.dueCount > 0) badge.textContent = stats.dueCount;
});

/* ------------------------------ 启动 ------------------------------ */
(async function boot() {
  ensureSeedUsers();          // 播种演示账号，让榜单与社区不至于空白
  community.ensureSeeded();
  start();                    // 注册 hashchange 监听并立即渲染一次
  await hydrate();            // 存在云端会话时恢复登录态（无配置/无 token 立即返回）
  resolve();                  // 恢复后重渲染，让已登录用户进入应用内页
})();
