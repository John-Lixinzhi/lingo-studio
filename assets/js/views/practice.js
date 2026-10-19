/* ==========================================================================
   views/practice — 互动式学习模块
   #/practice                     模块总览（四大模块 + 到期复习）
   #/practice/:mode?lang=&mode=review   直接进入某模块练习
   ========================================================================== */

import { esc, icon, qs, qsa } from '../core/dom.js';
import { LANGUAGES, getLanguage, poolByType, CORPORA } from '../data/courses.js';
import { getProgress, getStats, dueCards, skillMastery, cardStage, recordPracticeSession } from '../services/progress.js';
import { renderSession, VOCAB_INDEX, cardKeyOf } from './practice/engines.js';
import { announce } from './lesson.js';
import { setTargetLang } from '../services/auth.js';
import { toast } from '../core/ui.js';
import { resolve } from '../core/router.js';

const MODULES = [
  { type: 'vocab', label: '单词记忆', icon: 'layers', desc: '闪卡 + 间隔重复调度', detail: '看词 → 回忆 → 翻面核对 → 按遗忘程度评级，算法自动安排下次复习时间。' },
  { type: 'grammar', label: '语法练习', icon: 'pen', desc: '填空选择 + 规则讲解', detail: '在真实句子中选出正确形式，答完立即给出规则说明与易错提示。' },
  { type: 'listening', label: '听力训练', icon: 'headphones', desc: '听音辨义 + 原文复听', detail: '先盲听抓主干，从三个释义中选出正确项，再显示原文并支持变速复听。' },
  { type: 'speaking', label: '口语跟读', icon: 'mic', desc: '朗读 + 发音匹配评分', detail: '先听标准朗读，再跟读录音；识别结果与原句逐词比对并给出得分。' },
];

const SESSION_SIZE = 8;

/* ------------------------------------------------------------------ */
export function render(ctx = {}) {
  // #/practice/:type 直接进入对应模块；#/practice 显示模块总览
  if (ctx.type) return runner(ctx);
  return hub();
}

/* ------------------------------ 模块总览 ------------------------------ */
function hub() {
  const p = getProgress();
  const stats = getStats();
  const lang = getLanguage(p.activeLang) || LANGUAGES[0];
  const mastery = skillMastery();
  const cards = Object.entries(p.srs);
  const due = dueCards();
  const byStage = { due: 0, young: 0, mature: 0 };
  cards.forEach(([, c]) => { byStage[cardStage(c).cls] += 1; });

  return `
  <div class="page">
    <div class="page-head">
      <div class="titles">
        <span class="kicker">Practice modules</span>
        <h1 class="display-l mt-8">互动式学习模块</h1>
        <p class="lede mt-8">四个模块对应语言的四种能力。它们既能独立练习，也会在课程中按顺序组合出现。</p>
      </div>
      <div class="lang-switch">
        ${LANGUAGES.map((l) => `
          <button data-hub-lang="${esc(l.code)}" class="${l.code === p.activeLang ? 'on' : ''}">${esc(l.label)}</button>`).join('')}
      </div>
    </div>

    <div class="grid grid-2 mb-24">
      <div class="card card-pad-lg card-ink">
        <div class="row between mb-16">
          <span class="mono" style="color:rgba(237,229,216,.7)">间隔重复队列</span>
          ${icon('rotate', 20)}
        </div>
        <div class="row gap-24 wrap">
          <div class="stat"><b style="color:var(--accent)">${due.length}</b><span style="color:rgba(237,229,216,.6)">到期卡片</span></div>
          <div class="stat"><b>${cards.length}</b><span style="color:rgba(237,229,216,.6)">卡片总数</span></div>
          <div class="stat"><b>${byStage.mature}</b><span style="color:rgba(237,229,216,.6)">长期记忆</span></div>
        </div>
        <div class="row gap-6 mt-16 wrap">
          <span class="srs-chip due">新学/到期 ${byStage.due}</span>
          <span class="srs-chip young">巩固中 ${byStage.young}</span>
          <span class="srs-chip mature">长期记忆 ${byStage.mature}</span>
        </div>
        <div class="row gap-8 mt-20">
          <a class="btn btn-accent grow" href="#/practice/vocab?lang=${esc(p.activeLang)}&mode=review"
             ${due.length ? '' : 'aria-disabled="true" style="opacity:.5;pointer-events:none"'}>
            ${icon('play', 15)} ${due.length ? `复习 ${due.length} 张到期卡片` : '暂无到期卡片'}
          </a>
          <a class="btn btn-ghost" href="#/practice/vocab?lang=${esc(p.activeLang)}">学习新词</a>
        </div>
      </div>

      <div class="card card-pad-lg">
        <span class="mono">今日累计</span>
        <div class="row gap-24 mt-12 wrap">
          <div class="stat"><b>${stats.todayXp}</b><span>今日 XP</span></div>
          <div class="stat"><b>${stats.streak}</b><span>连续天数</span></div>
          <div class="stat"><b>${stats.speakingSessions}</b><span>跟读次数</span></div>
          <div class="stat"><b>${stats.listeningSessions}</b><span>听力组数</span></div>
        </div>
        <div class="rule mt-20 mb-16"></div>
        <p class="tiny dim">
          建议顺序：先用闪卡唤醒记忆 → 做一组听力或语法 → 用跟读收尾。
          跟读放在最后，是因为开口输出能让当天的输入真正"落地"。
        </p>
      </div>
    </div>

    <div class="grid grid-2">
      ${MODULES.map((m) => `
        <div class="card card-hover card-pad-lg">
          <div class="row between mb-16">
            <div class="module-icon ${lang.accent}" style="width:52px;height:52px">${icon(m.icon, 24)}</div>
            <div class="col" style="align-items:flex-end">
              <span class="mono-plain ${mastery[m.type] >= 70 ? '' : 'dim'}">掌握度 ${mastery[m.type] ?? 0}%</span>
              <div class="meter meter-xs ${lang.accent === 'en' ? 'meter-en' : lang.accent === 'ja' ? 'meter-ja' : 'meter-ko'}" style="width:96px;margin-top:6px">
                <i style="width:${mastery[m.type] ?? 0}%"></i>
              </div>
            </div>
          </div>
          <h3 class="card-title">${esc(m.label)}</h3>
          <p class="tiny dim mt-8">${esc(m.detail)}</p>
          <div class="row gap-8 mt-20">
            <a class="btn btn-primary grow" href="#/practice/${m.type}?lang=${esc(p.activeLang)}">开始练习</a>
            <a class="btn btn-ghost" href="#/courses/${esc(p.activeLang)}">在课程中练</a>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

/* ------------------------------ 模块运行 ------------------------------ */
function runner(ctx) {
  const type = ctx.type;
  const meta = MODULES.find((m) => m.type === type) || MODULES[0];
  const langCode = LANGUAGES.some((l) => l.code === ctx.lang) ? ctx.lang : 'en';
  const l = getLanguage(langCode);
  const isReview = ctx.mode === 'review';

  return `
  <div class="page">
    <div class="page-head">
      <div class="titles">
        <a class="mono dim" href="#/practice">← 互动模块</a>
        <h1 class="display-l mt-8">${esc(meta.label)}${isReview ? ' · 到期复习' : ''}</h1>
        <p class="lede mt-8">${esc(l.label)} · ${esc(meta.desc)}</p>
      </div>
      <div class="lang-switch">
        ${LANGUAGES.map((x) => `
          <button data-run-lang="${esc(x.code)}" class="${x.code === langCode ? 'on' : ''}">${esc(x.label)}</button>`).join('')}
      </div>
    </div>
    <div id="session-host"></div>
  </div>`;
}

export function mount(root, ctx = {}) {
  if (!ctx.type) {
    qsa('[data-hub-lang]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        setTargetLang(btn.dataset.hubLang);
        resolve();
      });
    });
    return;
  }

  const meta = MODULES.find((m) => m.type === ctx.type) || MODULES[0];

  qsa('[data-run-lang]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      location.hash = `#/practice/${ctx.type}?lang=${btn.dataset.runLang}`;
    });
  });

  const host = qs('#session-host', root);
  if (!host) return;

  const langCode = LANGUAGES.some((l) => l.code === ctx.lang) ? ctx.lang : 'en';
  const l = getLanguage(langCode);
  const type = ctx.type;
  const isReview = ctx.mode === 'review';
  let items = [];

  if (type === 'vocab' && isReview) {
    // 复习模式：题目来自间隔重复队列
    items = dueCards(langCode, SESSION_SIZE)
      .map((c) => {
        const entry = VOCAB_INDEX.get(c.key);
        return entry ? { ...entry, __key: c.key } : null;
      })
      .filter(Boolean);
    if (!items.length) {
      host.innerHTML = `
        <div class="empty card">
          <div class="glyph">✓</div>
          <h3 class="display-m">复习队列已经清空</h3>
          <p class="dim mt-8">${esc(l.label)}没有到期的卡片了。可以去做一组语法练习，或者学习新词。</p>
          <div class="row gap-8 mt-24 center">
            <a class="btn btn-primary" href="#/practice/vocab?lang=${esc(langCode)}">学习新词</a>
            <a class="btn btn-ghost" href="#/practice/grammar?lang=${esc(langCode)}">语法练习</a>
          </div>
        </div>`;
      return;
    }
  } else if (type === 'vocab') {
    items = shuffleArr(poolByType(langCode, 'vocab')).slice(0, SESSION_SIZE)
      .map((w) => ({ ...w, __key: cardKeyOf(langCode, w.term) }));
  } else if (type === 'grammar') {
    const points = CORPORA[langCode].grammar;
    items = shuffleArr(poolByType(langCode, 'grammar')).slice(0, SESSION_SIZE)
      .map((it) => ({ ...it, __grammar: points.find((g) => g.items.some((x) => x.q === it.q)) || null }));
  } else {
    const skill = type === 'listening' ? 'listening' : 'speaking';
    items = shuffleArr(CORPORA[langCode].phrases.filter((x) => x.skill === skill));
    items = items.slice(0, Math.min(SESSION_SIZE, items.length));
  }

  renderSession(host, {
    type,
    items,
    lang: langCode,
    title: isReview ? '到期复习' : meta.label,
    subtitle: `${l.label} · ${isReview ? '间隔重复队列' : meta.desc}`,
    exitRoute: '/practice',
    mode: isReview ? 'review' : null,
    onFinish: (result) => {
      if (type === 'vocab' && isReview) {
        // 复习的 XP 在每次评级时已即时结算，这里不再重复发放
        result.xpGained = 0;
        toast(`已复习 ${result.correct}/${result.total} 张卡片`, 'ok');
      } else {
        const res = recordPracticeSession({ skill: type, correct: result.correct, total: result.total });
        result.xpGained = res.xpGained;
        announce(res.newAchievements);
      }
    },
  });
}

function shuffleArr(arr) {
  return arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}
