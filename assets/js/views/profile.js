/* ==========================================================================
   views/profile — 个人中心：档案、进度、设置
   ========================================================================== */

import { esc, icon, qs, qsa, initials, progressRing, sparkline } from '../core/dom.js';
import { getProgress, getStats, skillMastery, heatmap, xpSeries, setDailyGoal, cardStage } from '../services/progress.js';
import { currentUser, updateProfile, setTargetLang, logout } from '../services/auth.js';
import { LANGUAGES, getLanguage, getLesson } from '../data/courses.js';
import { toast, confirmDialog, modal } from '../core/ui.js';
import { go } from '../core/router.js';
import { resetAll } from '../core/store.js';

const GOALS = [20, 50, 100, 150];

export function render() {
  const user = currentUser();
  const p = getProgress();
  const stats = getStats();
  if (!user || !p || !stats) return `<div class="page"><div class="empty">请先登录</div></div>`;

  const mastery = skillMastery();
  const cells = heatmap(18);
  const series = xpSeries(30);
  const cards = Object.entries(p.srs);
  const byStage = { due: 0, young: 0, mature: 0 };
  cards.forEach(([, c]) => { byStage[cardStage(c).cls] += 1; });
  const recent = Object.values(p.lessons).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);

  return `
  <div class="page">
    <div class="profile-head mb-24">
      <div class="avatar avatar-lg avatar-${user.accent}">${esc(initials(user.name))}</div>
      <div class="grow">
        <h1 class="display-l">${esc(user.name)}</h1>
        <div class="row gap-12 mt-8 wrap">
          <span class="mono dim">${esc(user.email)}</span>
          <span class="chip chip-plain">加入于 ${esc(new Date(user.createdAt).toLocaleDateString('zh-CN'))}</span>
          <span class="chip chip-${getLanguage(p.activeLang).accent}">主攻 ${esc(getLanguage(p.activeLang).label)}</span>
        </div>
      </div>
      <div class="row gap-8">
        <button class="btn btn-ghost btn-sm" id="edit-name">${icon('pen', 14)} 修改昵称</button>
        <button class="btn btn-ghost btn-sm" id="logout">${icon('logout', 14)} 退出登录</button>
      </div>
    </div>

    <div class="grid grid-4 mb-24">
      <div class="card">
        ${progressRing(stats.levelProgress, 92, 9)}
        <div class="mt-12">
          <div class="mono">等级 Lv.${stats.level}</div>
          <div class="tiny dim mt-4">距离下一级还差 ${stats.xpToNext} XP</div>
        </div>
      </div>
      <div class="card">
        <div class="stat"><b>${stats.xp.toLocaleString()}</b><span>累计 XP</span></div>
        <div class="rule-dotted mt-16 mb-12"></div>
        <div class="tiny dim">近 30 天共获得 ${series.reduce((n, s) => n + s.xp, 0)} XP</div>
      </div>
      <div class="card">
        <div class="stat"><b>${stats.streak}</b><span>当前连续天数</span></div>
        <div class="rule-dotted mt-16 mb-12"></div>
        <div class="tiny dim">历史最长连续 ${stats.longestStreak} 天</div>
      </div>
      <div class="card">
        <div class="stat"><b>${stats.minutes}</b><span>累计学习分钟</span></div>
        <div class="rule-dotted mt-16 mb-12"></div>
        <div class="tiny dim">完成 ${stats.lessonsDone} 节课节 · ${stats.perfectLessons} 节满分</div>
      </div>
    </div>

    <div class="grid grid-side mb-24">
      <div class="card card-pad-lg">
        <div class="row between mb-16">
          <div>
            <span class="mono">学习活跃度</span>
            <div class="tiny dim mt-4">最近 18 周 · 每个方块代表一天，颜色越深学习次数越多</div>
          </div>
          <div class="heat-legend">
            <span>少</span>
            <span class="heat-cell"></span><span class="heat-cell l1"></span>
            <span class="heat-cell l2"></span><span class="heat-cell l3"></span>
            <span class="heat-cell l4"></span>
            <span>多</span>
          </div>
        </div>
        <div class="heatmap">
          ${cells.map((c) => `<div class="heat-cell l${c.level}" title="${c.date} · ${c.count} 次学习"></div>`).join('')}
        </div>

        <div class="rule mt-20 mb-16"></div>
        <div class="row between mb-8">
          <span class="mono">近 30 天 XP 曲线</span>
          <span class="mono-plain dim">日均 ${Math.round(series.reduce((n, s) => n + s.xp, 0) / 30)} XP</span>
        </div>
        ${sparkline(series.map((s) => s.xp), { w: 520, h: 70 })}
      </div>

      <div class="col gap-16">
        <div class="card">
          <div class="mono mb-12">技能掌握度</div>
          <div class="col gap-14">
            ${[['vocab', '单词记忆'], ['grammar', '语法练习'], ['listening', '听力训练'], ['speaking', '口语跟读']].map(([k, label]) => `
              <div class="skill-row">
                <span class="sk-name">${label}</span>
                <div class="meter meter-xs"><i style="width:${mastery[k] ?? 0}%"></i></div>
                <span class="sk-val">${mastery[k] ?? 0}%</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="mono mb-12">记忆卡片状态</div>
          <div class="stat-row">
            <div class="stat"><b>${cards.length}</b><span>卡片总数</span></div>
            <div class="stat"><b>${byStage.mature}</b><span>长期记忆</span></div>
          </div>
          <div class="row gap-6 mt-12 wrap">
            <span class="srs-chip due">到期 ${stats.dueCount}</span>
            <span class="srs-chip young">巩固中 ${byStage.young}</span>
            <span class="srs-chip mature">长期记忆 ${byStage.mature}</span>
          </div>
          <a class="btn btn-primary btn-block mt-16" href="#/practice/vocab?lang=${esc(p.activeLang)}&mode=review">去复习</a>
        </div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="mono mb-16">设置</div>

        <div class="field mb-20">
          <label>每日 XP 目标</label>
          <div class="seg" id="goal-seg">
            ${GOALS.map((g) => `<button data-goal="${g}" class="${p.dailyGoal === g ? 'on' : ''}">${g} XP</button>`).join('')}
          </div>
        </div>

        <div class="field mb-20">
          <label>主攻语言</label>
          <div class="seg" id="lang-seg">
            ${LANGUAGES.map((l) => `<button data-lang="${esc(l.code)}" class="${p.activeLang === l.code ? 'on' : ''}">${esc(l.label)}</button>`).join('')}
          </div>
        </div>

        <div class="rule mb-20"></div>

        <div class="row gap-8 wrap">
          <button class="btn btn-ghost btn-sm" id="export">${icon('download', 14)} 导出学习档案</button>
          <button class="btn btn-danger btn-sm" id="reset">清空全部本地数据</button>
        </div>
        <p class="tiny dim mt-12">数据保存在当前浏览器（localStorage）。导出为 JSON 后可在其他设备手动导入。</p>
      </div>

      <div class="card">
        <div class="row between mb-16">
          <span class="mono">最近完成的课节</span>
          <a class="btn btn-quiet btn-sm" href="#/courses">课程地图 ${icon('next', 13)}</a>
        </div>
        ${recent.length ? recent.map((r) => {
          const les = getLesson(r.lessonId);
          if (!les) return '';
          const l = getLanguage(r.lang);
          return `
            <div class="list-row clickable">
              <span class="tag-dot" style="background:var(--${l.accent})"></span>
              <span class="grow" style="font-size:.88rem">${esc(les.title)}</span>
              <span class="chip chip-plain">${esc(l.label)} ${esc(les.level)}</span>
              <span class="mono-plain tiny" style="color:${r.bestScore >= 80 ? 'var(--ok)' : 'var(--warn)'}">${r.bestScore}%</span>
              <a class="btn btn-quiet btn-sm" href="#/lesson/${esc(les.id)}">重做</a>
            </div>`;
        }).join('') : '<p class="dim tiny">还没有完成任何课节，从学习台开始第一节吧。</p>'}
      </div>
    </div>
  </div>`;
}

export function mount(root) {
  const user = currentUser();
  const p = getProgress();

  qs('#edit-name', root)?.addEventListener('click', () => {
    modal({
      title: '修改昵称',
      body: `<div class="field"><label>新昵称</label>
        <input class="input" id="name-input" value="${esc(user.name)}" maxlength="16" /></div>`,
      actions: [
        { label: '取消', variant: 'btn-quiet' },
        {
          label: '保存', variant: 'btn-primary', onClick: (box) => {
            const val = qs('#name-input', box).value.trim();
            if (val.length < 2) { toast('昵称至少 2 个字符', 'warn'); return true; }
            updateProfile({ name: val });
            toast('昵称已更新', 'ok');
            go('/profile');
          },
        },
      ],
    });
  });

  qs('#logout', root)?.addEventListener('click', () => {
    confirmDialog({
      title: '退出登录',
      text: '你的学习档案会保留在本机，下次登录同一账号可继续。',
      confirmLabel: '退出登录',
      variant: 'btn-danger',
      onConfirm: () => { logout(); toast('已退出登录', 'info'); go('/'); },
    });
  });

  qsa('[data-goal]', root).forEach((b) => b.addEventListener('click', () => {
    setDailyGoal(Number(b.dataset.goal));
    toast(`每日目标已设为 ${b.dataset.goal} XP`, 'ok');
    go('/profile');
  }));

  qsa('[data-lang]', root).forEach((b) => b.addEventListener('click', () => {
    setTargetLang(b.dataset.lang);
    toast(`主攻语言已切换为${getLanguage(b.dataset.lang).label}`, 'ok');
    go('/profile');
  }));

  qs('#export', root)?.addEventListener('click', () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: { ...user, pass: undefined },
      progress: p,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lingo-studio-${user.name}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('学习档案已导出', 'ok');
  });

  qs('#reset', root)?.addEventListener('click', () => {
    confirmDialog({
      title: '清空全部本地数据',
      text: '这会删除本机上的所有账号、进度、成就与社区动态，且无法恢复。',
      confirmLabel: '我确定，清空',
      variant: 'btn-danger',
      onConfirm: () => { resetAll(); toast('本地数据已清空', 'info'); go('/'); },
    });
  });
}
