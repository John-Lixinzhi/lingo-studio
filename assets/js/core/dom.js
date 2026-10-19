/* ==========================================================================
   core/dom — 轻量视图工具：模板、转义、图标、查询辅助
   说明：本项目使用「模板字符串 + 事件委托」的方式构建视图，
        以保持零依赖与可读性；所有用户产生的内容必须经过 esc() 转义。
   ========================================================================== */

/** 转义用户输入，避免 XSS */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 由 HTML 字符串创建元素 */
export function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** 在 root 上做事件委托 */
export function on(root, event, selector, handler) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  });
}

/** 带容错的本地存储（隐私模式下回退到内存） */
export const safeStore = (() => {
  const mem = new Map();
  let usable = true;
  try {
    localStorage.setItem('__t', '1');
    localStorage.removeItem('__t');
  } catch {
    usable = false;
  }
  return {
    get(key) {
      try { return usable ? localStorage.getItem(key) : (mem.get(key) ?? null); }
      catch { return mem.get(key) ?? null; }
    },
    set(key, value) {
      try { usable ? localStorage.setItem(key, value) : mem.set(key, value); }
      catch { mem.set(key, value); }
    },
    del(key) {
      try { usable ? localStorage.removeItem(key) : mem.delete(key); }
      catch { mem.delete(key); }
    },
  };
})();

/** 生成唯一 id */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** 数值区间裁剪 */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** 两份文本的相似度（0~1），用于口语跟读评测 */
export function textSimilarity(a, b) {
  const norm = (s) => String(s).toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const A = norm(a); const B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const wa = A.split(' '); const wb = B.split(' ');
  // LCS 词级匹配
  const dp = Array.from({ length: wa.length + 1 }, () => new Array(wb.length + 1).fill(0));
  for (let i = 1; i <= wa.length; i++) {
    for (let j = 1; j <= wb.length; j++) {
      dp[i][j] = wa[i - 1] === wb[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[wa.length][wb.length] / Math.max(wa.length, wb.length);
}

/** 逐词标注比对结果，用于跟读反馈 */
export function tokenDiff(target, spoken) {
  const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}']/gu, ' ').replace(/\s+/g, ' ').trim();
  const spokenSet = new Set(norm(spoken).split(' ').filter(Boolean));
  return target.split(/\s+/).filter(Boolean).map((w) => {
    const key = norm(w);
    const state = !key ? 'plain' : (spokenSet.has(key) ? 'match' : 'off');
    const cls = state === 'match' ? 'token-match' : state === 'off' ? 'token-off' : 'token-plain';
    return `<span class="${cls}">${esc(w)}</span>`;
  }).join(' ');
}

/* ------------------------------------------------------------------
   图标库（内联 SVG，stroke 跟随 currentColor）
   ------------------------------------------------------------------ */
const S = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const icons = {
  home: S('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.6V21h14V9.6"/><path d="M9.5 21v-6h5v6"/>'),
  book: S('<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v18H5.5A1.5 1.5 0 0 1 4 19.5z"/><path d="M4 17h15"/><path d="M9 3v14"/>'),
  practice: S('<path d="M6.5 6.5 17.5 17.5"/><rect x="3" y="3" width="6" height="6" rx="2"/><rect x="15" y="15" width="6" height="6" rx="2"/>'),
  community: S('<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7" r="3.2"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.87"/><path d="M16.5 4.2a3.2 3.2 0 0 1 0 6.1"/>'),
  trophy: S('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/><path d="M12 14v3M8.5 20h7"/><path d="M10 20a2 2 0 0 1 4 0"/>'),
  user: S('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
  flame: S('<path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-1.6.7-3 1.5-4"/>'),
  play: S('<path d="M7 4.8 19 12 7 19.2z" fill="currentColor" stroke="none"/>'),
  volume: S('<path d="M11 5 6.5 8.6H3v6.8h3.5L11 19z"/><path d="M15 9.2a4 4 0 0 1 0 5.6"/><path d="M18 6.6a8 8 0 0 1 0 10.8"/>'),
  mic: S('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3M9 21h6"/>'),
  stop: S('<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none"/>'),
  headphones: S('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="2"/><rect x="16.5" y="14" width="4.5" height="7" rx="2"/>'),
  pen: S('<path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M14.5 5.5 18.5 9.5"/>'),
  back: S('<path d="M15 5l-7 7 7 7"/>'),
  next: S('<path d="M9 5l7 7-7 7"/>'),
  check: S('<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>'),
  times: S('<path d="M6 6l12 12M18 6 6 18"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>'),
  minus: S('<path d="M5 12h14"/>'),
  heart: S('<path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>'),
  message: S('<path d="M20 15.5A2.5 2.5 0 0 1 17.5 18H8l-4 3V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5z"/>'),
  star: S('<path d="m12 3.6 2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.8 1-5.85L3.5 9.75l5.9-.85z"/>'),
  target: S('<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  clock: S('<circle cx="12" cy="12" r="8.4"/><path d="M12 7.5V12l3 2"/>'),
  settings: S('<circle cx="12" cy="12" r="3"/><path d="M12 3v2.4M12 18.6V21M4.9 7.5 7 8.7M17 15.3l2.1 1.2M4.9 16.5 7 15.3M17 8.7l2.1-1.2"/>'),
  logout: S('<path d="M15 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H15"/><path d="M14 12h7M18 8.5 21.5 12 18 15.5"/>'),
  search: S('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>'),
  menu: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  sparkle: S('<path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9z"/><path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>'),
  layers: S('<path d="m12 3 8.5 4.5L12 12 3.5 7.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/>'),
  eye: S('<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: S('<path d="M4 4l16 16"/><path d="M9.5 5.9A9.7 9.7 0 0 1 12 5.6c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-3 3.8M6.5 8.2A17 17 0 0 0 2.5 12s3.5 6.2 9.5 6.2a9.4 9.4 0 0 0 3.4-.6"/><path d="M9.9 10.2a3 3 0 0 0 4 4"/>'),
  lock: S('<rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  globe: S('<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8"/><path d="M12 3.6c2.4 2.3 3.6 5.2 3.6 8.4s-1.2 6.1-3.6 8.4c-2.4-2.3-3.6-5.2-3.6-8.4S9.6 5.9 12 3.6z"/>'),
  chat: S('<path d="M12 4.5c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-1 0-1.9-.13-2.8-.38L5 20l1.1-3.3A6.6 6.6 0 0 1 3.5 11.5c0-3.9 3.8-7 8.5-7z"/>'),
  chart: S('<path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/>'),
  rotate: S('<path d="M3.5 12a8.5 8.5 0 1 1 2.6 6.1"/><path d="M3 12.5 5.5 15l2.4-2.5"/>'),
  bolt: S('<path d="M13 3 5 13.5h5.5L10.5 21l8-10.5H13z"/>'),
  cap: S('<path d="M2.5 8.5 12 4.5l9.5 4L12 12.5z"/><path d="M6 10.5V16c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-5.5"/>'),
  users: S('<circle cx="9" cy="8" r="3.2"/><path d="M2.8 19.5a6.5 6.5 0 0 1 12.4 0"/><path d="M16.5 5.6a3.2 3.2 0 0 1 0 5.4M18 19.5a6.4 6.4 0 0 0-1.4-4"/>'),
  download: S('<path d="M12 4v10M8 11l4 4 4-4"/><path d="M5 19h14"/>'),
  filter: S('<path d="M4 6h16M7 12h10M10 18h4"/>'),
};

export function icon(name, size = 20, cls = '') {
  const svg = icons[name] || icons.sparkle;
  const styled = svg.replace('<svg ', `<svg width="${size}" height="${size}" class="${cls}" `);
  return styled;
}

/* ------------------------------------------------------------------
   进度环
   ------------------------------------------------------------------ */
export function progressRing(value, size = 96, stroke = 8, color = 'var(--ink)') {
  const pct = clamp(Math.round(value), 0, 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return `
    <div class="ring" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}">
        <circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
        <circle class="fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"
          stroke="${color}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
      </svg>
      <div class="ring-label"><b>${pct}%</b></div>
    </div>`;
}

/** 迷你趋势线（SVG sparkline） */
export function sparkline(values, { w = 180, h = 44, color = 'var(--ink)' } = {}) {
  if (!values.length) return `<div class="skel" style="height:${h}px;width:${w}px"></div>`;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => [i * step, h - (v / max) * (h - 6) - 3]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  return `
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" style="overflow:visible">
      <path d="${area}" fill="${color}" opacity=".12"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.4" fill="${color}"/>`).join('')}
    </svg>`;
}

/** 生成头像首字母 */
export function initials(name) {
  const s = String(name || '?').trim();
  if (!s) return '?';
  const cjk = s.match(/[\u4e00-\u9fa5]/);
  if (cjk) return s.slice(-2);
  const parts = s.split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : s.slice(0, 2)).toUpperCase();
}

/** 根据字符串稳定派生一个强调色类名 */
export function accentOf(seed = '') {
  const s = String(seed);
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 997;
  return ['en', 'ja', 'ko', 'gold'][n % 4];
}
