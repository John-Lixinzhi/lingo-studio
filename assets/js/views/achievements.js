/* ==========================================================================
   views/achievements — 成就激励系统
   ========================================================================== */

import { esc, icon, qs, progressRing, clamp } from '../core/dom.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { getProgress, getStats } from '../services/progress.js';
import { confetti } from '../core/ui.js';

export function render() {
  const stats = getStats();
  const p = getProgress();
  if (!stats) return `<div class="page"><div class="empty">请先登录</div></div>`;

  const unlocked = new Set(p.achievements);
  const got = ACHIEVEMENTS.filter((a) => unlocked.has(a.id));
  const locked = ACHIEVEMENTS.filter((a) => !unlocked.has(a.id));
  const pct = Math.round((got.length / ACHIEVEMENTS.length) * 100);

  return `
  <div class="page">
    <div class="page-head">
      <div class="titles">
        <span class="kicker">Achievements</span>
        <h1 class="display-l mt-8">成就与激励</h1>
        <p class="lede mt-8">14 枚徽章覆盖坚持、词汇、输出、社交与跨语言五个维度。它们不决定你的水平，但能记录你确实走过的路。</p>
      </div>
      <button class="btn btn-ghost btn-sm" id="celebrate">${icon('sparkle', 15)} 庆祝一下</button>
    </div>

    <div class="grid grid-hero mb-24">
      <div class="card card-pad-lg">
        <div class="row gap-24 wrap">
          ${progressRing(pct, 116, 10, 'var(--gold)')}
          <div class="grow">
            <h3 class="display-m">已解锁 ${got.length} / ${ACHIEVEMENTS.length}</h3>
            <p class="tiny dim mt-8">${nextHint(stats, locked)}</p>
            <div class="row gap-8 mt-16 wrap">
              <span class="chip chip-gold">铜章 ${got.filter((a) => a.tier === 1).length}</span>
              <span class="chip">银章 ${got.filter((a) => a.tier === 2).length}</span>
              <span class="chip chip-ja">金章 ${got.filter((a) => a.tier === 3).length}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card card-pad-lg">
        <div class="mono mb-12">距离最近的徽章</div>
        ${closest(stats, locked).map(({ a, progress, label }) => `
          <div class="mb-12">
            <div class="row between tiny">
              <span>${a.emoji} ${esc(a.name)}</span>
              <span class="mono-plain dim">${esc(label)}</span>
            </div>
            <div class="meter meter-xs mt-4"><i class="meter-gold" style="width:${progress}%"></i></div>
          </div>`).join('') || '<p class="tiny dim">所有徽章均已解锁，去学习新语言吧。</p>'}
      </div>
    </div>

    <h3 class="display-m mb-16">已解锁 · ${got.length}</h3>
    <div class="grid grid-4 mb-32">
      ${got.map(badgeTile).join('') || '<p class="dim">还没有解锁任何徽章，完成一节课就能拿到第一枚。</p>'}
    </div>

    <h3 class="display-m mb-16">待解锁 · ${locked.length}</h3>
    <div class="grid grid-4">
      ${locked.map(badgeTile).join('')}
    </div>
  </div>`;
}

function badgeTile(a) {
  const unlocked = getProgress().achievements.includes(a.id);
  return `
    <div class="badge-tile ${unlocked ? 'unlocked' : 'locked'}">
      <div class="badge-medal tier-${a.tier}">${a.emoji}</div>
      <div>
        <div class="badge-name">${esc(a.name)}</div>
        <div class="badge-desc mt-4">${esc(a.desc)}</div>
      </div>
      ${unlocked ? `<span class="chip chip-gold">已解锁</span>` : `<span class="chip chip-plain">${icon('lock', 12)}</span>`}
    </div>`;
}

function nextHint(stats, locked) {
  if (!locked.length) return '全部徽章已解锁，你已经把这个学习系统走完了一整轮。';
  const { a, label } = closest(stats, locked)[0] || {};
  return a ? `再努力一点：${a.emoji} ${a.name} —— ${label}。` : '';
}

function closest(stats, locked) {
  const metric = (a) => {
    switch (a.id) {
      case 'first-step': return [stats.lessonsDone, 1, '完成课节'];
      case 'streak-3': return [stats.streak, 3, '连续天数'];
      case 'streak-7': return [stats.streak, 7, '连续天数'];
      case 'words-30': return [stats.wordsLearned, 30, '累计词卡'];
      case 'words-100': return [stats.wordsLearned, 100, '累计词卡'];
      case 'perfect-5': return [stats.perfectLessons, 5, '满分课节'];
      case 'speak-10': return [stats.speakingSessions, 10, '跟读次数'];
      case 'listen-10': return [stats.listeningSessions, 10, '听力组数'];
      case 'polyglot': return [stats.languagesStudied, 2, '学习语种'];
      case 'xp-500': return [stats.xp, 500, '累计 XP'];
      case 'xp-2000': return [stats.xp, 2000, '累计 XP'];
      case 'social': return [stats.postsCount, 3, '社区动态'];
      case 'srs-master': return [stats.masteredWords, 20, '长期记忆卡'];
      case 'level-b1': return [stats.b1Complete, 1, '完成等级'];
      default: return [0, 1, ''];
    }
  };
  return locked
    .map((a) => {
      const [cur, target, label] = metric(a);
      const progress = clamp(Math.round((cur / target) * 100), 0, 99);
      return { a, progress, label: `${Math.min(cur, target)} / ${target} ${label}` };
    })
    .sort((x, y) => y.progress - x.progress)
    .slice(0, 3);
}

export function mount(root) {
  qs('#celebrate', root)?.addEventListener('click', () => confetti(70));
}
