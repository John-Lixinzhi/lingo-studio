/* ==========================================================================
   views/courses — 分级课程体系
   #/courses          三语总览
   #/courses/:lang    某语种的等级 → 单元 → 课节地图
   ========================================================================== */

import { esc, icon, qs, qsa, progressRing } from '../core/dom.js';
import { LANGUAGES, getLanguage, getLevels, getLessons, totalLessonCount } from '../data/courses.js';
import { getProgress, getStats } from '../services/progress.js';
import { setTargetLang } from '../services/auth.js';
import { go } from '../core/router.js';
import { toast } from '../core/ui.js';

const TYPE_META = {
  vocab: { label: '词汇', icon: 'layers' },
  grammar: { label: '语法', icon: 'pen' },
  listening: { label: '听力', icon: 'headphones' },
  speaking: { label: '口语', icon: 'mic' },
};

let pickedLevel = 'A1';

export function render(ctx = {}) {
  const code = ctx.lang;
  if (!code || !getLanguage(code)) return overview();
  return detail(code);
}

/* ------------------------------ 总览 ------------------------------ */
function overview() {
  const p = getProgress();
  return `
  <div class="page">
    <div class="page-head">
      <div class="titles">
        <span class="kicker">Curriculum</span>
        <h1 class="display-l mt-8">分级课程体系</h1>
        <p class="lede mt-8">
          每个语种按 A1 → B1 分三级，每级含 2 个主题单元、6 节课节。
          课节控制在 8–11 分钟，保证可以一次完成。
        </p>
      </div>
    </div>

    <div class="grid grid-3 mb-32">
      ${LANGUAGES.map((l) => {
        const levels = getLevels(l.code);
        const lessons = getLessons(l.code);
        const done = lessons.filter((x) => p.lessons[x.id]?.completed).length;
        const pct = Math.round((done / lessons.length) * 100);
        return `
        <div class="card card-hover lang-card">
          <div class="glyph-bg">${esc(l.glyph)}</div>
          <div style="position:relative">
            <div class="row between">
              <span class="chip chip-${l.accent}">${esc(l.native)}</span>
              <span class="mono-plain tiny dim">${esc(l.learners)} 学习者</span>
            </div>
            <h3 class="display-m mt-12">${esc(l.label)}</h3>
            <p class="tiny dim mt-4">${esc(l.blurb)}</p>
          </div>
          <div style="position:relative" class="mt-16">
            <div class="row gap-16 mt-4">
              ${progressRing(pct, 74, 7, `var(--${l.accent})`)}
              <div class="grow">
                <div class="tiny dim mb-8">${esc(l.tagline)}</div>
                <div class="row gap-6 wrap">
                  ${levels.map((lv) => {
                    const lvLessons = getLessons(l.code, lv.id);
                    const lvDone = lvLessons.filter((x) => p.lessons[x.id]?.completed).length;
                    return `<span class="chip chip-plain" style="border-color:var(--line)">
                      ${esc(lv.id)} ${lvDone}/${lvLessons.length}</span>`;
                  }).join('')}
                </div>
              </div>
            </div>
            <a class="btn btn-primary btn-block mt-16" href="#/courses/${esc(l.code)}">进入课程地图</a>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="card card-pad-lg">
      <span class="kicker">How a level is built</span>
      <h3 class="display-m mt-8 mb-16">一个等级的构成</h3>
      <div class="grid grid-3">
        ${[
          ['① 主题单元', '每个等级两个场景主题，例如「初见与自我」「衣食住行」，让词汇在语境中成组出现。'],
          ['② 三段课节', '词汇记忆 → 语法精练 → 听力/口语场景，先输入再输出，符合语言习得顺序。'],
          ['③ 及时反馈', '每题立即判分并给出讲解；结算页展示逐题回顾与 XP 结算，进度自动写入档案。'],
        ].map(([t, d]) => `
          <div class="card card-flat">
            <h4 style="font-size:.96rem">${esc(t)}</h4>
            <p class="tiny dim mt-8">${esc(d)}</p>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ------------------------------ 语种详情 ------------------------------ */
function detail(code) {
  const l = getLanguage(code);
  const levels = getLevels(code);
  const p = getProgress();
  const stats = getStats();
  const active = levels.some((lv) => lv.id === pickedLevel) ? pickedLevel : levels[0].id;
  pickedLevel = active;
  const level = levels.find((x) => x.id === active);
  const levelLessons = getLessons(code, active);
  const done = levelLessons.filter((x) => p.lessons[x.id]?.completed).length;

  return `
  <div class="page">
    <div class="page-head">
      <div class="titles">
        <a class="mono dim" href="#/courses">← 全部课程</a>
        <h1 class="display-l mt-8">
          <span style="color:var(--${l.accent})">${esc(l.glyph)}</span> ${esc(l.label)}
          <span class="dim" style="font-size:1rem;font-weight:400">${esc(l.native)}</span>
        </h1>
        <p class="lede mt-8">${esc(l.blurb)}</p>
      </div>
      <div class="col gap-8" style="align-items:flex-end">
        ${p.activeLang === code
          ? '<span class="chip chip-gold">当前主攻语言</span>'
          : `<button class="btn btn-ghost btn-sm" id="set-target">设为主攻语言</button>`}
        <span class="mono-plain tiny dim">${totalLessonCount(code)} 节课节 · 共 ${stats ? stats.lessonsDone : 0} 节已完成</span>
      </div>
    </div>

    <div class="level-rail mb-24">
      ${levels.map((lv) => {
        const ls = getLessons(code, lv.id);
        const d = ls.filter((x) => p.lessons[x.id]?.completed).length;
        return `
          <button class="level-pill ${lv.id === active ? 'on' : ''}" data-level="${esc(lv.id)}">
            <b>${esc(lv.id)} · ${esc(lv.name)}</b>
            <span class="dim">${d}/${ls.length} 已完成</span>
          </button>`;
      }).join('')}
    </div>

    <div class="row between mb-16 wrap gap-12">
      <p class="dim">${esc(level.desc)}</p>
      <div class="row gap-8">
        <span class="chip chip-${l.accent}">${esc(level.id)} ${esc(level.name)}</span>
        <span class="chip chip-plain">${done}/${levelLessons.length} 完成</span>
      </div>
    </div>

    <div class="col gap-20">
      ${level.units.map((unit) => `
        <div class="unit-block">
          <div class="unit-head">
            <div class="unit-num">${String(unit.index).padStart(2, '0')}</div>
            <div class="grow">
              <h3 class="card-title">${esc(unit.title)}</h3>
              <div class="tiny dim mt-4">
                ${unit.lessons.length} 节课节 ·
                ${unit.lessons.filter((x) => p.lessons[x.id]?.completed).length} 已完成
              </div>
            </div>
            <div class="meter" style="width:120px">
              <i class="${l.accent === 'en' ? 'meter-en' : l.accent === 'ja' ? 'meter-ja' : 'meter-ko'}"
                 style="width:${Math.round((unit.lessons.filter((x) => p.lessons[x.id]?.completed).length / unit.lessons.length) * 100)}%"></i>
            </div>
          </div>
          <div class="unit-body">
            ${unit.lessons.map((les) => lessonRow(les, p, l)).join('')}
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

function lessonRow(les, p, l) {
  const rec = p.lessons[les.id];
  const done = !!rec?.completed;
  const meta = TYPE_META[les.type];
  return `
    <a class="lesson-row ${done ? 'done' : ''}" href="#/lesson/${esc(les.id)}">
      <div class="idx">${done ? icon('check', 16) : icon(meta.icon, 16)}</div>
      <div class="grow">
        <div class="row gap-8 center wrap">
          <b style="font-size:.94rem">${esc(les.title)}</b>
          <span class="chip chip-plain">${esc(meta.label)}</span>
          ${done ? `<span class="chip chip-plain" style="color:var(--ok)">最高 ${rec.bestScore}%</span>` : ''}
        </div>
        <div class="tiny dim mt-4">${esc(les.subtitle || '')} · ${les.items.length} 题 · ${les.minutes} 分钟 · +${les.xp} XP</div>
      </div>
      <span class="mono-plain tiny dim">${done ? '重做' : '开始'} ${icon('next', 13)}</span>
    </a>`;
}

export function mount(root, ctx = {}) {
  qsa('[data-level]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      pickedLevel = btn.dataset.level;
      go(`/courses/${ctx.lang}`);
    });
  });

  const setBtn = qs('#set-target', root);
  if (setBtn) {
    setBtn.addEventListener('click', () => {
      setTargetLang(ctx.lang);
      toast(`已把${getLanguage(ctx.lang).label}设为主攻语言`, 'ok');
      go(`/courses/${ctx.lang}`);
    });
  }
}
