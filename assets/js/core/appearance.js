/* ==========================================================================
   core/appearance — 亮度与主题调节
   两个维度：
     theme : paper（暖纸，默认）| night（暗夜）
     lum   : soft（柔和）| normal（标准）| bright（明亮）
   偏好写入 localStorage（设备级设置，不跟随账号），并由 index.html 里的
   内联脚本在首屏绘制前应用，避免切换时闪一下白。
   ========================================================================== */

import { esc } from './dom.js';
import { modal } from './ui.js';

const KEY = 'lingo_appearance';

const THEMES = [
  { id: 'paper', label: '暖纸', hint: '印刷工坊的默认纸感' },
  { id: 'night', label: '暗夜', hint: '深色底，夜里不刺眼' },
];

const LUMS = [
  { id: 'soft', label: '柔和', hint: '比标准再暗一档' },
  { id: 'normal', label: '标准', hint: '设计师默认亮度' },
  { id: 'bright', label: '明亮', hint: '纸底更白，白天更清楚' },
];

const idsOf = (list) => list.map((o) => o.id);

/** 读取偏好（做过合法性校验，脏数据自动回落到默认值） */
export function read() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { raw = {}; }
  return {
    theme: idsOf(THEMES).includes(raw.theme) ? raw.theme : 'paper',
    lum: idsOf(LUMS).includes(raw.lum) ? raw.lum : 'normal',
  };
}

/** 把偏好写进 <html> 的 data 属性，CSS 变量据此切换 */
export function apply(pref = read()) {
  const html = document.documentElement;
  html.dataset.theme = pref.theme;
  html.dataset.lum = pref.lum;
  return pref;
}

/** 合并写入并立即生效 */
export function write(patch) {
  const next = { ...read(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* 忽略配额错误 */ }
  apply(next);
  return next;
}

/** 一键暖纸 ↔ 暗夜 */
export function toggleTheme() {
  const theme = read().theme === 'night' ? 'paper' : 'night';
  write({ theme });
  return theme;
}

function panelHTML(cur) {
  const seg = (list, key) => `
    <div class="seg" data-seg="${key}">
      ${list.map((o) => `<button data-val="${o.id}" class="${o.id === cur[key] ? 'on' : ''}">${esc(o.label)}</button>`).join('')}
    </div>`;
  const hintOf = (list, key) => esc((list.find((o) => o.id === cur[key]) || list[0]).hint);

  return `
    <div class="col gap-20">
      <div>
        <div class="row between mb-8">
          <span class="mono">亮度</span>
          <span class="tiny dim">${hintOf(LUMS, 'lum')}</span>
        </div>
        ${seg(LUMS, 'lum')}
      </div>
      <div>
        <div class="row between mb-8">
          <span class="mono">主题</span>
          <span class="tiny dim">${hintOf(THEMES, 'theme')}</span>
        </div>
        ${seg(THEMES, 'theme')}
      </div>
      <p class="tiny dim">亮度与主题只在这台设备上生效，不会影响学习进度与成就。</p>
    </div>`;
}

/** 打开「外观与亮度」面板 */
export function openPanel() {
  const close = modal({ title: '外观与亮度', body: panelHTML(read()) });
  const box = document.querySelector('#modal-layer .modal-box');
  if (!box) return close;

  const bind = () => {
    box.querySelectorAll('[data-seg] button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.closest('[data-seg]').dataset.seg;   // lum | theme
        write({ [key]: btn.dataset.val });
        const host = box.querySelector('.modal-body');
        if (host) { host.innerHTML = panelHTML(read()); bind(); }
      });
    });
  };
  bind();
  return close;
}
