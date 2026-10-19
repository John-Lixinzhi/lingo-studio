/* ==========================================================================
   views/dashboard — 学习台：今日计划 / 模块入口 / 进度概览
   ========================================================================== */

import { esc, icon, qs, initials, sparkline, progressRing, clamp } from '../core/dom.js';
import { getProgress, getStats, xpSeries, skillMastery } from '../services/progress.js';
import { buildPlan, paceAdvice, SKILL_LABELS, weakAreas } from '../services/recommend.js';
import { LANGUAGES, getLanguage, getLessons } from '../data/courses.js';
import { setTargetLang, currentUser } from '../services/auth.js';
import { toast } from '../core/ui.js';
import { go } from '../core/router.js';

const MODULES = [
  { type: 'vocab', label: '单词记忆', desc: '闪卡 + 间隔重复', icon: 'layers' },
  { type: 'grammar', label: '语法练习', desc: '填空 + 即时讲解', icon: 'pen' },
  { type: 'listening', label: '听力训练', desc: '听音辨义 + 复听', icon: 'headphones' },
  { type: 'speaking', label: '口语跟读', desc: '朗读 + 发音评分', icon: 'mic' },
];

export function render() {
  const user = currentUser();
  const stats = getStats();
  const p = getProgress();
  if (!user || !stats || !p) return `<div class="page"><div class="empty">请先登录</div></div>`;

  const lang = getLanguage(p.activeLang) || LANGUAGES[0];
  const plan = buildPlan(4);
  const series = xpSeries(14);
  const mastery = skillMastery();
  const weak = weakAreas()[0];
  const hour = new Date().getHours();
  const greetWord = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  return `
  <div class="page">
    <div class="page-head">
      <div class="greet">
        <div class="avatar avatar-lg avatar-${user.accent}">${esc(initials(user.name))}</div>
        <div>
          <div class="mono">${esc(new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }))}</div>
          <h1 class="display-l">${greetWord}，${esc(user.name)}</h1>
          <p class="dim mt-4">${esc(paceAdvice())}</p>
        </div>
      </div>
      <div class="row gap-20">
        <div class="streak-flame">
          ${icon('flame', 24)}
          <div><b>${stats.streak}</b><div class="mono">连续天数</div></div>
        </div>
        <div class="streak-flame">
          ${icon('bolt', 24)}
          <div><b>${stats.xp}</b><div class="mono">累计 XP</div></div>
        </div>
      </div>
    </div>

    <div class="grid grid-hero mb-24">
      <div class="col gap-16">
        <div class="card card-pad-lg">
          <div class="row between mb-16">
            <div>
              <span class="kicker">今日计划 · 按优先级生成</span>
              <h3 class="display-m mt-8">下一步该做什么，已经替你排好</h3>
            </div>
            <span class="chip chip-${lang.accent}">${esc(lang.label)} 主线</span>
          </div>
          <div class="track">
            ${plan.map((item, i) => `
              <div class="track-step ${i === 0 ? 'now' : ''}">
                <div class="track-node">${i + 1}</div>
                <div class="grow">
                  <div class="row between gap-12 wrap">
                    <div>
                      <b style="font-size:.98rem">${esc(item.title)}</b>
                      <p class="tiny dim mt-4" style="max-width:52ch">${esc(item.reason)}</p>
                    </div>
                    <a class="btn ${i === 0 ? 'btn-accent' : 'btn-ghost'} btn-sm" href="${esc(item.route)}">${esc(item.cta)}</a>
                  </div>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <div class="grid grid-4">
          ${MODULES.map((m) => `
            <a class="module-tile" href="#/practice/${m.type}?lang=${esc(p.activeLang)}">
              <div class="module-icon ${lang.accent}">${icon(m.icon, 20)}</div>
              <div>
                <b style="font-size:.94rem;display:block">${esc(m.label)}</b>
                <span class="tiny dim">${esc(m.desc)}</span>
              </div>
              <div class="row between mt-4">
                <span class="tiny mono-plain">掌握度 ${mastery[m.type] ?? 0}%</span>
                <span class="tiny dim">${icon('next', 13)}</span>
              </div>
            </a>`).join('')}
        </div>
      </div>

      <div class="col gap-16">
        <div class="today-goal">
          <div class="row between mb-12">
            <span class="mono" style="color:rgba(237,229,216,.7)">今日目标</span>
            <span class="mono" style="color:rgba(237,229,216,.7)">+${stats.todayXp} XP</span>
          </div>
          <div class="row gap-16">
            ${progressRing(clamp((stats.todayXp / stats.dailyGoal) * 100, 0, 100), 88, 9, 'var(--accent)')}
            <div>
              <div class="number">${stats.todayXp}<span style="font-size:1rem;opacity:.6"> / ${stats.dailyGoal}</span></div>
              <div class="tiny" style="color:rgba(237,229,216,.7)">
                ${stats.goalMet ? '目标已达成，可以预习新课' : `还差 ${stats.dailyGoal - stats.todayXp} XP`}
              </div>
            </div>
          </div>
          <a class="btn btn-primary btn-block mt-16" href="#/practice/vocab?lang=${esc(p.activeLang)}">开始今日练习</a>
        </div>

        <div class="card">
          <div class="row between mb-12">
            <span class="mono">近 14 天 XP</span>
            <span class="mono-plain dim">峰值 ${Math.max(...series.map((s) => s.xp))}</span>
          </div>
          ${sparkline(series.map((s) => s.xp), { w: 258, h: 60 })}
          <div class="row between tiny dim mt-8">
            <span>${esc(series[0].date.slice(5))}</span><span>${esc(series[series.length - 1].date.slice(5))}</span>
          </div>
        </div>

        <div class="card">
          <div class="mono mb-16">四维技能掌握度</div>
          <div class="col gap-14">
            ${Object.entries(SKILL_LABELS).map(([sk, info]) => `
              <div class="skill-row">
                <span class="sk-name">${esc(info.label)}</span>
                <div class="meter meter-xs ${lang.accent === 'en' ? 'meter-en' : lang.accent === 'ja' ? 'meter-ja' : 'meter-ko'}">
                  <i style="width:${mastery[sk] ?? 0}%"></i>
                </div>
                <span class="sk-val">${mastery[sk] ?? 0}%</span>
              </div>`).join('')}
          </div>
          ${weak && weak.score < 70 ? `
            <div class="note-block mt-16">
              <b>建议补强</b>${esc(weak.label)}是目前最薄弱的一环（${weak.score}%），今天优先练一组会明显提升整体节奏。
            </div>` : ''}
        </div>
      </div>
    </div>

    <div class="row between mb-16">
      <h3 class="display-m">我的语言</h3>
      <a class="btn btn-quiet btn-sm" href="#/courses">全部课程 ${icon('next', 14)}</a>
    </div>
    <div class="grid grid-3">
      ${LANGUAGES.map((l) => langCard(l, p.activeLang)).join('')}
    </div>
  </div>`;
}

function langCard(l, active) {
  const lessons = getLessons(l.code);
  const p = getProgress();
  const done = lessons.filter((x) => p.lessons[x.id]?.completed).length;
  const pct = Math.round((done / lessons.length) * 100);
  const next = lessons.find((x) => !p.lessons[x.id]?.completed);

  return `
    <div class="card lang-card">
      <div class="glyph-bg">${esc(l.glyph)}</div>
      <div class="row between" style="position:relative">
        <div>
          <div class="row gap-8 center">
            <h4 class="card-title">${esc(l.label)}</h4>
            ${active === l.code ? `<span class="chip chip-${l.accent}">主攻</span>` : ''}
          </div>
          <div class="tiny dim mt-4">${esc(l.tagline)}</div>
        </div>
      </div>
      <div style="position:relative">
        <div class="row between tiny dim mb-4">
          <span>${done} / ${lessons.length} 课节完成</span>
          <span class="mono-plain">${pct}%</span>
        </div>
        <div class="meter meter-xs ${l.accent === 'en' ? 'meter-en' : l.accent === 'ja' ? 'meter-ja' : 'meter-ko'}">
          <i style="width:${pct}%"></i>
        </div>
        <div class="row gap-8 mt-16 wrap" style="position:relative">
          ${next ? `<a class="btn btn-primary btn-sm" href="#/lesson/${esc(next.id)}">继续学习</a>` : ''}
          <a class="btn btn-ghost btn-sm" href="#/courses/${esc(l.code)}">课程地图</a>
          ${active !== l.code ? `<button class="btn btn-quiet btn-sm" data-target="${esc(l.code)}">设为主攻</button>` : ''}
        </div>
      </div>
    </div>`;
}

export function mount(root) {
  root.querySelectorAll('[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setTargetLang(btn.dataset.target);
      const l = getLanguage(btn.dataset.target);
      toast(`已切换主攻语言为${l.label}`, 'ok');
      go('/learn');
    });
  });
}
