/* ==========================================================================
   views/lesson — 单节课节的执行页
   #/lesson/:id  →  课节说明（目标 / 题量 / 结构） → 进入互动模块 → 结算并写入进度
   ========================================================================== */

import { esc, icon, qs } from '../core/dom.js';
import { getLesson, getLanguage, nextLesson, previousLesson } from '../data/courses.js';
import { renderSession } from './practice/engines.js';
import { recordLessonResult, getProgress } from '../services/progress.js';
import { achievementById } from '../data/achievements.js';
import { toast, confetti } from '../core/ui.js';

const TYPE_LABEL = {
  vocab: '单词记忆', grammar: '语法精练', listening: '听力训练', speaking: '口语跟读',
};
const TYPE_ICON = { vocab: 'layers', grammar: 'pen', listening: 'headphones', speaking: 'mic' };

export function render(ctx = {}) {
  const lesson = getLesson(ctx.id);
  if (!lesson) {
    return `
      <div class="page"><div class="empty">
        <div class="glyph">404</div>
        <h3 class="display-m">找不到这节课节</h3>
        <a class="btn btn-primary mt-24" href="#/courses">返回课程地图</a>
      </div></div>`;
  }

  const l = getLanguage(lesson.lang);
  const p = getProgress();
  const rec = p.lessons[lesson.id];
  const prev = previousLesson(lesson.id);
  const next = nextLesson(lesson.id);

  return `
  <div class="page">
    <a class="mono dim" href="#/courses/${esc(lesson.lang)}">← ${esc(l.label)} · ${esc(lesson.level)} 课程地图</a>

    <div class="grid grid-hero mt-16">
      <div class="card card-pad-lg">
        <div class="row gap-8 mb-16 wrap">
          <span class="chip chip-${l.accent}">${esc(l.label)}</span>
          <span class="chip chip-plain">${esc(lesson.level)} · 单元 ${lesson.unitIndex}</span>
          <span class="chip chip-plain">${esc(TYPE_LABEL[lesson.type])}</span>
          ${rec?.completed ? `<span class="chip chip-plain" style="color:var(--ok)">已完成 · 最高 ${rec.bestScore}%</span>` : ''}
        </div>

        <h1 class="display-l mb-12">${esc(lesson.title)}</h1>
        <p class="lede mb-24">${esc(lesson.subtitle || '')}</p>

        <div class="stat-row mb-24">
          <div class="stat"><b>${lesson.items.length}</b><span>题量</span></div>
          <div class="stat"><b>${lesson.minutes}</b><span>预计分钟</span></div>
          <div class="stat"><b>+${lesson.xp}</b><span>基础 XP</span></div>
          <div class="stat"><b>${lesson.type === 'vocab' ? 'SRS' : lesson.type === 'speaking' ? '语音评分' : '即时判分'}</b><span>评分方式</span></div>
        </div>

        <div class="row gap-12 wrap">
          <button class="btn btn-primary btn-lg" id="start">${icon('play', 16)} ${rec?.completed ? '再练一次' : '开始课节'}</button>
          ${next ? `<a class="btn btn-ghost" href="#/lesson/${esc(next.id)}">跳到下一节</a>` : ''}
        </div>
      </div>

      <div class="col gap-16">
        <div class="card">
          <div class="mono mb-12">本节内容</div>
          ${lesson.type === 'grammar' && lesson.grammar ? `
            <div class="note-block mb-12"><b>语法点</b>${esc(lesson.grammar.point)}</div>
            <p class="tiny dim mb-12">规则讲解会在你作答后逐题给出，先凭语感作答效果更好。</p>
          ` : ''}
          <div class="col gap-4">
            ${lesson.items.slice(0, 6).map((it, i) => `
              <div class="list-row">
                <span class="mono-plain dim" style="width:18px">${i + 1}</span>
                <span class="grow" style="font-size:.9rem">
                  ${esc(lesson.type === 'vocab' ? it.term
                    : lesson.type === 'grammar' ? (it.zh || it.q)
                    : it.text)}
                </span>
                <span class="chip chip-plain">${esc(it.level || lesson.level)}</span>
              </div>`).join('')}
            ${lesson.items.length > 6 ? `<div class="tiny dim mt-8">…… 以及另外 ${lesson.items.length - 6} 题</div>` : ''}
          </div>
        </div>

        <div class="card">
          <div class="mono mb-8">学习建议</div>
          <p class="tiny dim">${adviceFor(lesson)}</p>
          <div class="row gap-8 mt-16">
            ${prev ? `<a class="btn btn-quiet btn-sm" href="#/lesson/${esc(prev.id)}">${icon('back', 14)} 上一节</a>` : ''}
            ${next ? `<a class="btn btn-quiet btn-sm" href="#/lesson/${esc(next.id)}">下一节 ${icon('next', 14)}</a>` : ''}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function adviceFor(lesson) {
  switch (lesson.type) {
    case 'vocab':
      return '先看词、出声读一遍，再翻面核对释义。不必强求一次记住，间隔重复会在未来几天反复帮你巩固。评「忘记了」也不会扣分，反而会更快回到你面前。';
    case 'grammar':
      return '先凭语感选择，再看讲解。语法规则一旦和你的错误一起被纠正，记忆会比单纯背诵规则牢固得多。';
    case 'listening':
      return '第一遍别急着看原文，先抓住句子主干（动词、否定）。可以先用慢速听两遍，再切常速确认。';
    case 'speaking':
      return '听一遍原句再开口，注意重音与停顿。跟读评分看的是词是否读全，不必刻意模仿口音，先把句子读顺。';
    default:
      return '保持每天一次的节奏，比一次学很久更有效。';
  }
}

export function mount(root, ctx = {}) {
  const lesson = getLesson(ctx.id);
  if (!lesson) return;
  const startBtn = qs('#start', root);

  startBtn?.addEventListener('click', () => {
    const l = getLanguage(lesson.lang);
    const host = document.createElement('div');
    root.innerHTML = '';
    const page = document.createElement('div');
    page.className = 'page';
    page.appendChild(host);
    root.appendChild(page);

    renderSession(host, {
      type: lesson.type,
      items: lesson.type === 'grammar'
        ? lesson.items
        : lesson.type === 'vocab'
          ? lesson.items.map((w) => ({ ...w, __key: `${lesson.lang}:w:${w.term}` }))
          : lesson.items,
      lang: lesson.lang,
      grammar: lesson.grammar,
      title: lesson.title,
      subtitle: `${l.label} · ${lesson.level} · ${lesson.subtitle || ''}`,
      exitRoute: `/lesson/${lesson.id}`,
      onFinish: (result) => {
        const res = recordLessonResult({
          lesson,
          correct: result.correct,
          total: result.total,
          durationMs: result.durationMs,
        });
        result.xpGained = res.xpGained;
        toast(`本节完成，+${res.xpGained} XP`, 'ok');
        announce(res.newAchievements);
      },
    });
  });
}

/** 弹出新解锁的成就 */
export function announce(ids = []) {
  if (!ids.length) return;
  confetti(60);
  ids.forEach((id, i) => {
    const a = achievementById(id);
    if (!a) return;
    setTimeout(() => toast(`成就解锁 · ${a.emoji} ${a.name}`, 'ok', 4200), 500 + i * 900);
  });
}
