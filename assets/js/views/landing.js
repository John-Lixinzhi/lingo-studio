/* ==========================================================================
   views/landing — 产品落地页（未登录时的入口）
   ========================================================================== */

import { esc, icon, qs } from '../core/dom.js';
import { LANGUAGES, totalLessonCount } from '../data/courses.js';

const FEATURES = [
  ['分级课程体系', '按 CEFR / JLPT / TOPIK 对齐的等级与单元，每个等级都拆成可一次完成的 8–11 分钟课节。'],
  ['互动式学习模块', '单词记忆（闪卡+间隔重复）、语法练习（填空+即时讲解）、口语跟读（发音评分）、听力训练（听音辨义）。'],
  ['学习进度追踪', 'XP、连续天数、活跃热力图、四维技能掌握度，把"感觉在学"变成看得见的曲线。'],
  ['账号与档案', '注册 / 登录 / 多语种学习目标切换，学习档案本地留存、随时继续。'],
  ['个性化路径推荐', '每天根据到期复习、薄弱技能与主线进度，动态生成"今天先做什么"的行动清单。'],
  ['社区与成就激励', '学习小组、动态互助、排行榜与 14 枚成就徽章，让坚持这件事有回音。'],
];

export function render() {
  const glyphs = ['あ', 'A', '한', '语', 'a', '한', '語', 'Ω', '가', 'B'];
  return `
  <div class="stage">
    <div class="stage-left">
      <div class="glyph-field">
        ${glyphs.map((g, i) => {
          const top = [4, 18, 62, 78, 34, 88, 8, 52, 70, 26][i];
          const left = [6, 72, 14, 62, 40, 22, 84, 88, 46, 34][i];
          const size = [120, 88, 160, 72, 96, 132, 66, 108, 84, 74][i];
          return `<span style="top:${top}%;left:${left}%;font-size:${size}px">${g}</span>`;
        }).join('')}
      </div>

      <div class="row between">
        <div class="brand" style="padding:0">
          <div class="brand-mark">L</div>
          <div class="brand-text" style="color:var(--rail-ink)">
            <b>Lingo Studio</b><span>多语种沉浸式学习</span>
          </div>
        </div>
        <div class="row gap-12">
          <span class="hero-badge" style="margin:0"><b>BETA</b> 支持英 · 日 · 韩</span>
          <button class="icon-btn" data-appearance aria-label="外观与亮度" title="亮度与主题"
            style="border-color:rgba(255,255,255,.24);color:var(--rail-ink)">${icon('sun', 18)}</button>
        </div>
      </div>

      <div style="margin:auto 0">
        <h1 class="display-xl hero-title">
          把语言<br>练成<em>肌肉记忆</em>
        </h1>
        <p class="hero-sub">
          从五十音到商务会话，从词汇闪卡到开口跟读。
          我们不做"看完就忘"的视频课，而是把每一个知识点拆成
          可以每天完成的动作。
        </p>

        <div class="hero-langs">
          ${LANGUAGES.map((l) => `
            <a class="hero-lang" href="#/auth?intent=register">
              <span class="gl" style="color:var(--${l.accent})">${esc(l.glyph)}</span>
              <span class="nm"><b>${esc(l.label)}</b><span>${esc(l.native)}</span></span>
            </a>`).join('')}
        </div>
      </div>

      <div class="hero-foot">
        <div class="hero-stat"><b>${LANGUAGES.reduce((n, l) => n + totalLessonCount(l.code), 0)}</b><span>分级课节</span></div>
        <div class="hero-stat"><b>90</b><span>核心词汇</span></div>
        <div class="hero-stat"><b>4</b><span>互动模块</span></div>
        <div class="hero-stat"><b>14</b><span>成就徽章</span></div>
      </div>
    </div>

    <div class="stage-right">
      <div class="kicker mb-20">Six capabilities</div>
      <h2 class="display-l mb-8">一套完整的学习闭环</h2>
      <p class="lede mb-24">课程负责"教什么"，互动模块负责"怎么练"，进度与推荐负责"下一步做什么"，社区与成就负责"为什么坚持"。</p>

      <div class="mb-24">
        ${FEATURES.map(([t, d], i) => `
          <div class="feature-item">
            <span class="feature-no">0${i + 1}</span>
            <div><h4>${esc(t)}</h4><p>${esc(d)}</p></div>
          </div>`).join('')}
      </div>

      <div class="row gap-12 wrap">
        <a class="btn btn-primary btn-lg" href="#/auth?intent=register">免费开始学习 ${icon('next', 16)}</a>
        <a class="btn btn-ghost btn-lg" href="#/auth">已有账号，登录</a>
      </div>
      <p class="tiny dim mt-16">无需下载，数据保存在你的浏览器；也可以用页面底部的演示账号一键体验完整流程。</p>
    </div>
  </div>`;
}

export function mount(root) {
  // 落地页无需额外绑定：演示账号入口在登录页提供
  qs('.stage-left', root);
}
