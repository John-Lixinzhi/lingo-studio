/* ==========================================================================
   core/router — 基于 hash 的前端路由
   支持：#/courses/ja、#/practice/vocab?lang=ja 形式的路径与查询参数
   ========================================================================== */

const routes = [];
let current = null;
let notFound = null;

/** 注册路由：register('/courses/:lang', handler) */
export function register(pattern, handler) {
  const keys = [];
  const regex = new RegExp(
    '^' + pattern
      .replace(/\/+$/, '')
      .replace(/:([A-Za-z0-9_]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })
      .replace(/\*/g, '.*') + '/?$'
  );
  routes.push({ regex, keys, handler, pattern });
}

export function setNotFound(handler) { notFound = handler; }

/** 解析当前 hash */
export function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.replace(/\/+$/, '') || '/';
  const params = {};
  new URLSearchParams(queryPart || '').forEach((v, k) => { params[k] = v; });
  return { path, params, raw };
}

/** 跳转 */
export function go(to, { replace = false } = {}) {
  const target = to.startsWith('#') ? to : `#${to}`;
  if (location.hash === target) { resolve(); return; }
  if (replace) history.replaceState(null, '', target);
  else location.hash = target;
  if (replace) resolve();
}

/** 匹配并执行 */
export function resolve() {
  const { path, params, raw } = parse();
  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      const args = {};
      r.keys.forEach((k, i) => { args[k] = decodeURIComponent(m[i + 1]); });
      current = { pattern: r.pattern, path, args, params, raw };
      r.handler({ ...args, ...params, _path: path });
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      return;
    }
  }
  if (notFound) notFound({ _path: path });
}

export function start() {
  window.addEventListener('hashchange', resolve);
  resolve();
}

export function getCurrent() { return current; }
