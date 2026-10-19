/* ==========================================================================
   views/auth — 登录 / 注册
   ========================================================================== */

import { esc, icon, qs, qsa } from '../core/dom.js';
import { register, login, validate } from '../services/auth.js';
import { DEMO_ACCOUNTS } from '../data/community.js';
import { LANGUAGES } from '../data/courses.js';
import { toast } from '../core/ui.js';
import { go } from '../core/router.js';

let tab = 'login';
let pickedLang = 'en';

export function render(ctx = {}) {
  tab = ctx.intent === 'register' ? 'register' : 'login';

  return `
  <div class="stage">
    <div class="stage-left">
      <div class="glyph-field">
        ${['A', 'あ', '한', '語'].map((g, i) => `
          <span style="top:${[12, 66, 30, 80][i]}%;left:${[68, 10, 84, 34][i]}%;font-size:${[150, 120, 96, 130][i]}px">${g}</span>`).join('')}
      </div>

      <div class="brand" style="padding:0">
        <div class="brand-mark">L</div>
        <div class="brand-text" style="color:var(--rail-ink)"><b>Lingo Studio</b><span>多语种沉浸式学习</span></div>
      </div>

      <div style="margin:auto 0">
        <div class="kicker mb-16" style="color:rgba(237,229,216,.6)">Your daily practice</div>
        <h1 class="display-l hero-title mb-16">每天 <em>20 分钟</em>，<br>把一门语言练起来</h1>
        <p class="hero-sub">注册后你的学习档案会保存在本机浏览器：课程进度、记忆卡片、连续天数、成就徽章都与账号绑定。</p>
      </div>

      <div class="hero-foot">
        ${LANGUAGES.map((l) => `
          <div class="hero-stat">
            <b style="color:var(--${l.accent})">${esc(l.glyph)}</b>
            <span>${esc(l.label)} · ${esc(l.learners)} 学习者</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="stage-right">
      <div class="auth-tabs">
        <button data-tab="login" class="${tab === 'login' ? 'on' : ''}">登录</button>
        <button data-tab="register" class="${tab === 'register' ? 'on' : ''}">注册</button>
      </div>

      <div id="auth-body"></div>

      <div class="rule mt-32 mb-16"></div>
      <div class="mono mb-8">演示账号 · 一键填充</div>
      <div class="demo-accounts">
        ${DEMO_ACCOUNTS.map((a) => `
          <button class="demo-account" data-demo="${esc(a.email)}">
            <span class="avatar avatar-sm avatar-${a.accent}">${esc(a.name.slice(0, 1))}</span>
            <span>${esc(a.name)}</span>
          </button>`).join('')}
      </div>
      <p class="tiny dim mt-12">演示账号的密码统一为 <span class="mono-plain">demo1234</span>，账号内已包含历史学习记录，可直接查看进度与成就。</p>
    </div>
  </div>`;
}

function bodyHtml() {
  if (tab === 'login') {
    return `
      <h2 class="display-m mb-4">欢迎回来</h2>
      <p class="dim mb-24">继续上次的进度，今天的目标还差一点点。</p>
      <form id="auth-form" class="col gap-16" novalidate>
        <div class="field">
          <label>邮箱</label>
          <input class="input" name="email" type="email" placeholder="you@example.com" autocomplete="username" />
          <div class="field-error" data-err="email"></div>
        </div>
        <div class="field">
          <label>密码</label>
          <div style="position:relative">
            <input class="input" name="pass" type="password" placeholder="至少 6 位" autocomplete="current-password" />
            <button type="button" class="icon-btn" data-toggle-pass
              style="position:absolute;right:6px;top:50%;transform:translateY(-50%);border:none">${icon('eye', 17)}</button>
          </div>
          <div class="field-error" data-err="pass"></div>
        </div>
        <button class="btn btn-primary btn-block btn-lg" type="submit">登录并继续</button>
      </form>`;
  }

  return `
    <h2 class="display-m mb-4">创建你的学习档案</h2>
    <p class="dim mb-24">选一门主攻语言，之后可以在个人中心随时切换。</p>
    <form id="auth-form" class="col gap-16" novalidate>
      <div class="field">
        <label>昵称</label>
        <input class="input" name="name" placeholder="2~16 个字符" autocomplete="nickname" />
        <div class="field-error" data-err="name"></div>
      </div>
      <div class="field">
        <label>邮箱</label>
        <input class="input" name="email" type="email" placeholder="you@example.com" autocomplete="email" />
        <div class="field-error" data-err="email"></div>
      </div>
      <div class="field">
        <label>密码</label>
        <input class="input" name="pass" type="password" placeholder="至少 6 位" autocomplete="new-password" />
        <div class="field-error" data-err="pass"></div>
      </div>
      <div class="field">
        <label>确认密码</label>
        <input class="input" name="confirm" type="password" placeholder="再输入一次" autocomplete="new-password" />
        <div class="field-error" data-err="confirm"></div>
      </div>
      <div class="field">
        <label>主攻语言</label>
        <div class="row gap-8 wrap" id="lang-pick">
          ${LANGUAGES.map((l) => `
            <button type="button" class="btn btn-ghost btn-sm" data-lang="${l.code}"
              style="${l.code === pickedLang ? `background:var(--${l.accent});color:#fff;border-color:transparent` : ''}">
              ${esc(l.glyph)} ${esc(l.label)}
            </button>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-block btn-lg" type="submit">注册并进入学习台</button>
    </form>`;
}

export function mount(root) {
  const bodyHost = qs('#auth-body', root);
  const paint = () => {
    bodyHost.innerHTML = bodyHtml();
    bindForm(root, bodyHost);
  };
  paint();

  qsa('[data-tab]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      tab = btn.dataset.tab;
      qsa('[data-tab]', root).forEach((b) => b.classList.toggle('on', b === btn));
      paint();
    });
  });

  qsa('[data-demo]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      tab = 'login';
      qsa('[data-tab]', root).forEach((b) => b.classList.toggle('on', b.dataset.tab === 'login'));
      paint();
      const acc = DEMO_ACCOUNTS.find((a) => a.email === btn.dataset.demo);
      qs('input[name=email]', bodyHost).value = acc.email;
      qs('input[name=pass]', bodyHost).value = acc.pass;
      toast(`已填充「${acc.name}」的演示账号`, 'ok');
    });
  });
}

function bindForm(root, host) {
  // 密码显隐
  const toggle = qs('[data-toggle-pass]', host);
  if (toggle) {
    toggle.addEventListener('click', () => {
      const input = qs('input[name=pass]', host);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      toggle.innerHTML = icon(show ? 'eyeOff' : 'eye', 17);
    });
  }

  // 语言选择
  qsa('[data-lang]', host).forEach((btn) => {
    btn.addEventListener('click', () => {
      pickedLang = btn.dataset.lang;
      qsa('[data-lang]', host).forEach((b) => {
        const on = b === btn;
        b.style.background = on ? `var(--${b.dataset.lang})` : '';
        b.style.color = on ? '#fff' : '';
        b.style.borderColor = on ? 'transparent' : '';
      });
    });
  });

  const form = qs('#auth-form', host);
  const setErr = (key, msg) => {
    const node = qs(`[data-err="${key}"]`, host);
    if (node) node.textContent = msg || '';
    const input = qs(`[name="${key}"]`, host);
    if (input) input.classList.toggle('invalid', !!msg);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const errors = validate(tab === 'register'
      ? data
      : { name: '占位', email: data.email, pass: data.pass });
    if (tab === 'login') { delete errors.name; delete errors.confirm; }

    Object.entries(errors).forEach(([k, v]) => setErr(k, v));
    if (Object.keys(errors).length) {
      const first = qs('.invalid', host);
      if (first) first.focus();
      return;
    }

    if (tab === 'login') {
      const res = login(data);
      if (!res.ok) { setErr('pass', res.error); toast(res.error, 'err'); return; }
      toast(`欢迎回来，${res.user.name}`, 'ok');
    } else {
      const res = register({ ...data, target: pickedLang });
      if (!res.ok) { setErr('email', res.error); toast(res.error, 'err'); return; }
      toast('注册成功，学习档案已创建', 'ok');
    }
    go('/learn');
  });
}
