/* ==========================================================================
   views/community — 社区交流 + 排行榜
   #/community?tab=feed|groups|rank
   ========================================================================== */

import { esc, icon, qs, qsa, initials, uid } from '../core/dom.js';
import { get, set, update } from '../core/store.js';
import { GROUPS, LEADERBOARD, seedPosts } from '../data/community.js';
import { currentUser } from '../services/auth.js';
import { getProgress, refreshAchievements, getStats } from '../services/progress.js';
import { LANGUAGES, getLanguage } from '../data/courses.js';
import { toast } from '../core/ui.js';
import { announce } from './lesson.js';

let tab = 'feed';
let filterLang = 'all';

export function render(ctx = {}) {
  tab = ['feed', 'groups', 'rank'].includes(ctx.tab) ? ctx.tab : tab;
  const user = currentUser();
  const posts = get().posts;

  return `
  <div class="page">
    <div class="page-head">
      <div class="titles">
        <span class="kicker">Community</span>
        <h1 class="display-l mt-8">社区交流与排行榜</h1>
        <p class="lede mt-8">把每天的坚持说出来。学习小组、同伴答疑与榜单，让"独自学习"变成"有人同行"。</p>
      </div>
      <div class="stat-row">
        <div class="stat"><b>${posts.length}</b><span>社区动态</span></div>
        <div class="stat"><b>${GROUPS.reduce((n, g) => n + g.members, 0).toLocaleString()}</b><span>小组成员</span></div>
      </div>
    </div>

    <div class="tabs community-tabs">
      <button data-tab="feed" class="${tab === 'feed' ? 'on' : ''}">学习动态</button>
      <button data-tab="groups" class="${tab === 'groups' ? 'on' : ''}">学习小组</button>
      <button data-tab="rank" class="${tab === 'rank' ? 'on' : ''}">排行榜</button>
    </div>

    <div id="tab-body"></div>
  </div>`;
}

function feedBody() {
  const user = currentUser();
  const posts = get().posts;
  const list = filterLang === 'all' ? posts : posts.filter((p) => p.lang === filterLang);

  return `
  <div class="grid grid-side">
    <div class="col gap-16">
      <div class="card composer">
        <div class="row gap-12 mb-12">
          <div class="avatar avatar-${user.accent}">${esc(initials(user.name))}</div>
          <div class="grow">
            <b style="font-size:.92rem">${esc(user.name)}</b>
            <div class="tiny dim">分享一句心得的收获，往往比多背十个单词更值</div>
          </div>
        </div>
        <textarea class="textarea" id="post-text" placeholder="今天学到了什么？踩过什么坑？有什么想请教同伴的？"></textarea>
        <div class="row between mt-12 wrap gap-8">
          <div class="row gap-6 wrap" id="post-lang">
            ${LANGUAGES.map((l) => `
              <button class="chip ${filterLang === l.code ? `chip-${l.accent}` : ''}" data-postlang="${esc(l.code)}">${esc(l.label)}</button>`).join('')}
          </div>
          <button class="btn btn-primary btn-sm" id="publish">${icon('next', 15)} 发布动态</button>
        </div>
      </div>

      <div class="row between wrap gap-8">
        <span class="mono">动态流</span>
        <div class="seg">
          <button class="${filterLang === 'all' ? 'on' : ''}" data-filter="all">全部</button>
          ${LANGUAGES.map((l) => `<button class="${filterLang === l.code ? 'on' : ''}" data-filter="${esc(l.code)}">${esc(l.label)}</button>`).join('')}
        </div>
      </div>

      <div class="col gap-16 stagger">
        ${list.length ? list.map(postCard).join('') : `
          <div class="empty card"><div class="glyph">◌</div><h3 class="display-m">这个语种还没有动态</h3>
          <p class="dim mt-8">发布第一条，或者切换筛选看看其他语言的讨论。</p></div>`}
      </div>
    </div>

    <div class="col gap-16">
      <div class="card">
        <div class="mono mb-12">今日活跃</div>
        ${GROUPS.slice(0, 3).map((g) => `
          <div class="list-row">
            <span class="tag-dot" style="background:var(--${g.lang === 'mix' ? 'gold' : g.lang})"></span>
            <span class="grow" style="font-size:.88rem">${esc(g.name)}</span>
            <span class="tiny dim">${esc(g.active)}</span>
          </div>`).join('')}
        <button class="btn btn-ghost btn-block btn-sm mt-12" data-tab-go="groups">浏览全部小组</button>
      </div>

      <div class="card">
        <div class="mono mb-12">社区公约</div>
        <ul class="col gap-8 tiny dim">
          <li>· 提问前先说出你已尝试过什么，更容易得到有效回答。</li>
          <li>· 分享方法时给出来源或用例，避免绝对化结论。</li>
          <li>· 打卡与成就欢迎晒出来，这是坚持的燃料。</li>
        </ul>
      </div>
    </div>
  </div>`;
}

function postCard(p) {
  const me = currentUser();
  const liked = p.likedBy.includes(me.id);
  return `
    <article class="post" data-post="${esc(p.id)}">
      <div class="post-head">
        <div class="avatar avatar-${esc(p.accent)}">${esc(initials(p.author))}</div>
        <div class="grow">
          <div class="row gap-8 center">
            <b style="font-size:.92rem">${esc(p.author)}</b>
            <span class="chip ${p.lang ? `chip-${esc(p.lang)}` : 'chip-plain'}">${esc(getLanguage(p.lang)?.label || '综合')}</span>
            ${p.tag ? `<span class="chip chip-plain">${esc(p.tag)}</span>` : ''}
          </div>
          <div class="tiny dim">${esc(relTime(p.createdAt))}</div>
        </div>
      </div>
      <div class="post-body">${esc(p.text)}</div>
      ${p.replies?.length ? `
        <div class="post-reply">
          ${p.replies.map((r) => `
            <div>
              <div class="row gap-8 center">
                <span class="avatar avatar-sm avatar-${esc(r.accent)}">${esc(initials(r.author))}</span>
                <b style="font-size:.82rem">${esc(r.author)}</b>
                <span class="tiny dim">${esc(relTime(r.createdAt))}</span>
              </div>
              <div class="tiny" style="margin:4px 0 0 38px">${esc(r.text)}</div>
            </div>`).join('')}
        </div>` : ''}
      <div class="post-actions">
        <button class="react ${liked ? 'on' : ''}" data-like="${esc(p.id)}">${icon('heart', 15)} <span>${p.likes}</span></button>
        <button class="react" data-reply="${esc(p.id)}">${icon('message', 15)} 回复 ${p.replies?.length ? `(${p.replies.length})` : ''}</button>
        <div class="grow"></div>
        <button class="react" data-quote="${esc(p.id)}">${icon('chat', 15)} 引用到我的动态</button>
      </div>
      <div class="mt-12 hidden" data-reply-box="${esc(p.id)}">
        <div class="row gap-8">
          <input class="input" data-reply-input="${esc(p.id)}" placeholder="写下你的回复…" />
          <button class="btn btn-primary btn-sm" data-reply-send="${esc(p.id)}">发送</button>
        </div>
      </div>
    </article>`;
}

function groupsBody() {
  return `
  <div class="grid grid-2">
    ${GROUPS.map((g) => `
      <div class="card card-hover">
        <div class="group-card" style="border:none;padding:0;background:transparent">
          <span class="module-icon ${g.lang === 'mix' ? 'gold' : g.lang}" style="width:48px;height:48px;font-size:1.1rem">
            ${esc(g.lang === 'mix' ? '∞' : getLanguage(g.lang).glyph)}
          </span>
          <div class="grow">
            <b style="font-size:.96rem">${esc(g.name)}</b>
            <div class="tiny dim mt-4">${esc(g.desc)}</div>
          </div>
        </div>
        <div class="row between mt-16">
          <span class="mono-plain tiny dim">${g.members.toLocaleString()} 位成员 · ${esc(g.active)}</span>
          <button class="btn btn-ghost btn-sm" data-join="${esc(g.id)}">加入小组</button>
        </div>
      </div>`).join('')}
  </div>`;
}

function rankBody() {
  const me = currentUser();
  const myXp = getStats()?.xp || 0;
  const rows = [...LEADERBOARD.map((r) => ({ ...r, synthetic: true })), {
    name: me.name, xp: myXp, accent: me.accent, lang: getProgress()?.activeLang || 'en', me: true,
  }].sort((a, b) => b.xp - a.xp);

  return `
  <div class="grid grid-side">
    <div class="card card-pad-lg">
      <div class="row between mb-16">
        <div>
          <span class="kicker">Weekly XP ranking</span>
          <h3 class="display-m mt-8">本周经验值排行</h3>
        </div>
        <span class="chip chip-gold">第 ${rows.findIndex((r) => r.me) + 1} 名 · 共 ${rows.length}</span>
      </div>
      ${rows.map((r, i) => `
        <div class="rank-row ${r.me ? 'me' : ''}">
          <span class="rank-no ${i < 3 ? 'top' : ''}">${i + 1}</span>
          <span class="avatar avatar-sm avatar-${esc(r.accent)}">${esc(initials(r.name))}</span>
          <span class="grow" style="font-size:.9rem">
            ${esc(r.name)} ${r.me ? '<span class="chip chip-gold" style="margin-left:6px">我</span>' : ''}
          </span>
          <span class="mono-plain tiny dim" style="margin-right:12px">${esc(getLanguage(r.lang)?.label || '')}</span>
          <b class="mono-plain">${r.xp.toLocaleString()} XP</b>
        </div>`).join('')}
      <p class="tiny dim mt-16">榜单按累计 XP 排序；坚持每天完成学习目标，是提升排名最稳的方式。</p>
    </div>

    <div class="col gap-16">
      <div class="card">
        <div class="mono mb-12">我的社区数据</div>
        <div class="stat-row">
          <div class="stat"><b>${get().posts.filter((p) => p.authorId === me.id).length}</b><span>发布动态</span></div>
          <div class="stat"><b>${get().posts.reduce((n, p) => n + (p.likedBy.includes(me.id) ? 1 : 0), 0)}</b><span>点赞过</span></div>
        </div>
        <button class="btn btn-ghost btn-block mt-16" data-tab-go="feed">回到动态流</button>
      </div>
      <div class="card card-ink">
        <div class="mono mb-8" style="color:rgba(237,229,216,.7)">激励提示</div>
        <p class="tiny" style="color:rgba(237,229,216,.85)">在社区发布 3 条动态即可解锁「同伴互助」徽章；晒出打卡常常能顺带解锁连续天数类成就。</p>
        <a class="btn btn-accent btn-block mt-16" href="#/achievements">查看我的徽章</a>
      </div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
export function mount(root, ctx = {}) {
  const user = currentUser();
  const mem = { postLang: LANGUAGES[0].code };

  const paint = () => {
    const body = qs('#tab-body', root);
    body.innerHTML = tab === 'feed' ? feedBody() : tab === 'groups' ? groupsBody() : rankBody();
    bind(body);
  };
  paint();

  qsa('[data-tab]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      tab = btn.dataset.tab;
      qsa('[data-tab]', root).forEach((b) => b.classList.toggle('on', b === btn));
      paint();
      history.replaceState(null, '', `#/community?tab=${tab}`);
    });
  });

  function bind(body) {
    qsa('[data-tab-go]', body).forEach((b) => b.addEventListener('click', () => {
      tab = b.dataset.tabGo;
      qsa('[data-tab]', root).forEach((x) => x.classList.toggle('on', x.dataset.tab === tab));
      paint();
    }));

    qsa('[data-filter]', body).forEach((b) => b.addEventListener('click', () => {
      filterLang = b.dataset.filter;
      paint();
    }));

    qsa('[data-postlang]', body).forEach((b) => b.addEventListener('click', () => {
      mem.postLang = b.dataset.postlang;
      qsa('[data-postlang]', body).forEach((x) => {
        const on = x === b;
        const l = getLanguage(x.dataset.postlang);
        x.className = `chip ${on ? `chip-${l.accent}` : ''}`;
      });
    }));

    qs('#publish', body)?.addEventListener('click', () => {
      const text = qs('#post-text', body).value.trim();
      if (text.length < 4) { toast('写点什么再发布吧（至少 4 个字）', 'warn'); return; }
      const post = {
        id: uid('post'),
        authorId: user.id,
        author: user.name,
        accent: user.accent,
        lang: mem.postLang,
        tag: '打卡',
        text,
        createdAt: Date.now(),
        likes: 0,
        likedBy: [],
        replies: [],
      };
      update((d) => { d.posts.unshift(post); });
      toast('发布成功，+5 XP', 'ok');
      announce(refreshAchievements());
      paint();
    });

    qsa('[data-like]', body).forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.like;
      update((d) => {
        const p = d.posts.find((x) => x.id === id);
        if (!p) return;
        const idx = p.likedBy.indexOf(user.id);
        if (idx >= 0) { p.likedBy.splice(idx, 1); p.likes = Math.max(0, p.likes - 1); }
        else { p.likedBy.push(user.id); p.likes += 1; }
      });
      paint();
    }));

    qsa('[data-reply]', body).forEach((b) => b.addEventListener('click', () => {
      const box = qs(`[data-reply-box="${b.dataset.reply}"]`, body);
      box?.classList.toggle('hidden');
    }));

    qsa('[data-reply-send]', body).forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.replySend;
      const input = qs(`[data-reply-input="${id}"]`, body);
      const text = input.value.trim();
      if (text.length < 2) { toast('回复内容太短了', 'warn'); return; }
      update((d) => {
        const p = d.posts.find((x) => x.id === id);
        p?.replies.push({ id: uid('r'), author: user.name, accent: user.accent, text, createdAt: Date.now() });
      });
      toast('回复已发布', 'ok');
      paint();
    }));

    qsa('[data-quote]', body).forEach((b) => b.addEventListener('click', () => {
      const p = get().posts.find((x) => x.id === b.dataset.quote);
      const ta = qs('#post-text', body);
      if (!p || !ta) return;
      ta.value = `引用 @${p.author}：${p.text.slice(0, 60)}${p.text.length > 60 ? '…' : ''}\n我的想法：`;
      mem.postLang = p.lang || mem.postLang;
      ta.focus();
      toast('已引用到输入框', 'info');
    }));

    qsa('[data-join]', body).forEach((b) => b.addEventListener('click', () => {
      const g = GROUPS.find((x) => x.id === b.dataset.join);
      toast(`已加入「${g.name}」，记得在小组里打卡`, 'ok');
      b.textContent = '已加入';
      b.classList.add('btn-quiet');
      b.disabled = true;
    }));
  }
}

function relTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

/** 首次进入社区时写入种子动态 */
export function ensureSeeded() {
  if (get().seeded) return;
  set('posts', seedPosts());
  set('groups', GROUPS);
  set('seeded', true);
}
