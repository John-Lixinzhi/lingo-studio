/* ==========================================================================
   config — 运行时配置
   用户填好下方两个值后，平台会自动切换到云端模式（注册登录、学习进度、
   社区动态都走 Supabase）。留空则保持纯本地 localStorage 模式，
   GitHub Pages / 本地文件直开都能正常跑。
   ========================================================================== */

// 到 https://supabase.com 注册一个免费项目，Settings → API 里拿这两个值：
//   Project URL        → SUPABASE_URL
//   anon public key    → SUPABASE_ANON_KEY（前端可安全持有，RLS 已限定权限）
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
