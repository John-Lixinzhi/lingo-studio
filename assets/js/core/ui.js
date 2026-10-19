/* ==========================================================================
   core/ui — 全局反馈组件：提示条、弹窗、庆祝动画
   ========================================================================== */

import { el, icon, esc } from './dom.js';

const toastLayer = () => document.getElementById('toast-layer');
const modalLayer = () => document.getElementById('modal-layer');

/** 轻提示 */
export function toast(message, kind = 'info', ms = 2600) {
  const glyph = { ok: 'check', err: 'times', warn: 'bolt', info: 'sparkle' }[kind] || 'sparkle';
  const node = el(`
    <div class="toast ${kind}">
      ${icon(glyph, 18)}
      <span>${esc(message)}</span>
    </div>`);
  toastLayer().appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s, transform .3s';
    node.style.opacity = '0';
    node.style.transform = 'translateX(14px)';
    setTimeout(() => node.remove(), 320);
  }, ms);
}

/** 弹窗，返回关闭函数 */
export function modal({ title, body, actions = [], width }) {
  const layer = modalLayer();
  layer.classList.add('on');
  layer.innerHTML = '';
  const box = el(`
    <div class="modal-scrim"></div>
    <div class="modal-box" role="dialog" aria-modal="true" ${width ? `style="width:${width}"` : ''}>
      <button class="icon-btn modal-close" data-close aria-label="关闭">${icon('times', 17)}</button>
      ${title ? `<h3 class="display-m mb-12">${esc(title)}</h3>` : ''}
      <div class="modal-body">${body}</div>
      ${actions.length ? `<div class="row gap-8 mt-24" style="justify-content:flex-end">${actions.map((a, i) =>
        `<button class="btn ${a.variant || 'btn-ghost'}" data-act="${i}">${a.label}</button>`).join('')}</div>` : ''}
    </div>`);

  const close = () => {
    layer.classList.remove('on');
    layer.innerHTML = '';
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);

  box.querySelector('[data-close]').addEventListener('click', close);
  const scrim = box.querySelector('.modal-scrim');
  scrim.addEventListener('click', close);
  box.querySelectorAll('[data-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const act = actions[Number(btn.dataset.act)];
      const keep = act.onClick && act.onClick(box);
      if (!keep) close();
    });
  });

  layer.appendChild(box);
  const focusable = box.querySelector('input, textarea, button.btn');
  if (focusable) setTimeout(() => focusable.focus(), 60);
  return close;
}

/** 二次确认 */
export function confirmDialog({ title, text, confirmLabel = '确认', variant = 'btn-primary', onConfirm }) {
  modal({
    title,
    body: `<p class="lede">${esc(text)}</p>`,
    actions: [
      { label: '取消', variant: 'btn-quiet' },
      { label: confirmLabel, variant, onClick: () => { onConfirm && onConfirm(); } },
    ],
  });
}

/** 撒花庆祝 */
export function confetti(count = 46) {
  const palette = ['#D2481C', '#2C4FD6', '#0E8060', '#B98A2B', '#191510'];
  const wrap = el('<div class="confetti"></div>');
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = palette[i % palette.length];
    piece.style.animationDuration = `${1.5 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
    wrap.appendChild(piece);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 3400);
}
