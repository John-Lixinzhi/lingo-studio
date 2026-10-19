/* ==========================================================================
   services/progress — 学习进度追踪 / 间隔重复 / 成就结算
   数据全部落在 progress[userId] 下，视图通过 getProgress() 读取。
   ========================================================================== */

import { get, update } from '../core/store.js';
import { clamp } from '../core/dom.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { getLessons, LANGUAGES } from '../data/courses.js';
import { currentUser } from './auth.js';

export const XP_PER_LEVEL = 250;
const SKILLS = ['vocab', 'grammar', 'listening', 'speaking'];
const DAY = 86400000;

export const today = (d = new Date()) => {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

export function createProgress(user) {
  return {
    userId: user.id,
    xp: 0,
    streak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    dailyGoal: 50,
    activeLang: user.target || 'en',
    lessons: {},                                   // lessonId -> 记录
    srs: {},                                       // cardKey -> 记忆状态
    dailyXp: {},                                   // 'YYYY-MM-DD' -> XP
    activity: {},                                  // 'YYYY-MM-DD' -> 动作次数
    skillXp: { vocab: 0, grammar: 0, listening: 0, speaking: 0 },
    counters: { speaking: 0, listening: 0 },
    achievements: [],
    createdAt: Date.now(),
  };
}

/** 当前登录用户的学习档案 */
export function getProgress() {
  const user = currentUser();
  if (!user) return null;
  const p = get().progress[user.id];
  if (p) return p;
  // 兜底：档案缺失时补建（例如数据被外部清空）
  update((d) => { d.progress[user.id] = createProgress(user); });
  return get().progress[user.id];
}

function mutateProgress(fn) {
  const user = currentUser();
  if (!user) return;
  update((d) => {
    const p = d.progress[user.id] || (d.progress[user.id] = createProgress(user));
    fn(p);
  });
}

/** 记录一次学习动作：累计 XP、刷新连续天数与活跃度 */
function addStudy(draft, { xp = 0, skill = null, count = 1 }) {
  const key = today();
  draft.xp += xp;
  draft.dailyXp[key] = (draft.dailyXp[key] || 0) + xp;
  draft.activity[key] = (draft.activity[key] || 0) + count;
  if (skill && skill in draft.skillXp) draft.skillXp[skill] += xp;

  if (draft.lastStudyDate !== key) {
    const y = today(new Date(Date.now() - DAY));
    draft.streak = draft.lastStudyDate === y ? draft.streak + 1 : 1;
    draft.lastStudyDate = key;
    draft.longestStreak = Math.max(draft.longestStreak, draft.streak);
  }
}

/* ------------------------------------------------------------------
   课节完成
   ------------------------------------------------------------------ */
export function recordLessonResult({ lesson, correct, total, durationMs = 0 }) {
  let result = { xpGained: 0, perfect: false, newAchievements: [], totalXp: 0 };
  mutateProgress((p) => {
    const ratio = total ? correct / total : 0;
    const firstTime = !p.lessons[lesson.id];
    const masteryBonus = Math.round(ratio * 20);
    const xpGained = Math.max(5, Math.round(lesson.xp * (0.6 + ratio * 0.4)) + masteryBonus + (firstTime ? 10 : 0));

    const prev = p.lessons[lesson.id] || { attempts: 0, bestScore: 0 };
    p.lessons[lesson.id] = {
      lessonId: lesson.id,
      lang: lesson.lang,
      level: lesson.level,
      type: lesson.type,
      attempts: prev.attempts + 1,
      bestScore: Math.max(prev.bestScore, Math.round(ratio * 100)),
      lastScore: Math.round(ratio * 100),
      completed: true,
      durationMs: durationMs || prev.durationMs || 0,
      updatedAt: Date.now(),
    };

    if (lesson.type === 'speaking') p.counters.speaking += 1;
    if (lesson.type === 'listening') p.counters.listening += 1;

    addStudy(p, { xp: xpGained, skill: lesson.type, count: 1 });

    result.xpGained = xpGained;
    result.perfect = ratio >= 0.99 && total > 0;
    result.totalXp = p.xp;
    result.newAchievements = unlock(p);
  });
  return result;
}

/** 自由练习（模块总览里的独立练习）结算 */
export function recordPracticeSession({ skill, correct, total }) {
  let out = { xpGained: 0, newAchievements: [] };
  mutateProgress((p) => {
    const ratio = total ? correct / total : 0;
    const xp = Math.max(4, Math.round((10 + correct * 6) * (0.6 + ratio * 0.4)));
    if (skill === 'listening') p.counters.listening += 1;
    if (skill === 'speaking') p.counters.speaking += 1;
    addStudy(p, { xp, skill });
    out.xpGained = xp;
    out.newAchievements = unlock(p);
  });
  return out;
}

/* ------------------------------------------------------------------
   间隔重复（SM-2 简化版）
   grade: 0 完全忘记 / 1 有点难 / 2 记得 / 3 太简单
   ------------------------------------------------------------------ */
const GRADE_LABELS = [
  { key: 0, label: '忘记了', hint: '< 10 分钟', cls: 'g0' },
  { key: 1, label: '有点难', hint: '1 天', cls: 'g1' },
  { key: 2, label: '记得', hint: '按熟练度', cls: 'g2' },
  { key: 3, label: '太简单', hint: '更久之后', cls: 'g3' },
];
export { GRADE_LABELS };

export function scheduleCard(p, key, grade, meta = {}) {
  const now = Date.now();
  const c = p.srs[key] || { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now, seen: 0 };
  c.seen += 1;
  c.lastGrade = grade;
  c.lang = meta.lang || c.lang;
  c.kind = meta.kind || c.kind;

  if (grade === 0) {
    c.lapses += 1;
    c.reps = 0;
    c.interval = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.due = now + 10 * 60 * 1000;
  } else if (grade === 1) {
    c.interval = c.reps === 0 ? 1 : Math.max(1, c.interval * 1.2);
    c.ease = Math.max(1.3, c.ease - 0.05);
    c.reps += 1;
    c.due = now + c.interval * DAY;
  } else if (grade === 2) {
    c.interval = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.interval * c.ease);
    c.reps += 1;
    c.due = now + c.interval * DAY;
  } else {
    c.interval = c.reps === 0 ? 3 : Math.round(c.interval * c.ease * 1.3);
    c.ease = Math.min(3.2, c.ease + 0.15);
    c.reps += 1;
    c.due = now + c.interval * DAY;
  }
  p.srs[key] = c;
  return c;
}

/** 记录一次闪卡评级并结算 XP */
export function reviewCard(key, grade, meta = {}) {
  let out = { card: null, newAchievements: [] };
  mutateProgress((p) => {
    out.card = scheduleCard(p, key, grade, meta);
    const gain = { 0: 2, 1: 4, 2: 6, 3: 8 }[grade] || 4;
    addStudy(p, { xp: gain, skill: 'vocab', count: 1 });
    out.newAchievements = unlock(p);
  });
  return out;
}

/** 到期待复习的卡片 */
export function dueCards(lang = null, limit = null) {
  const p = getProgress();
  if (!p) return [];
  const now = Date.now();
  const list = Object.entries(p.srs)
    .filter(([, c]) => c.due <= now && (!lang || c.lang === lang))
    .sort((a, b) => a[1].due - b[1].due)
    .map(([key, c]) => ({ key, ...c }));
  return limit ? list.slice(0, limit) : list;
}

/** 卡片成熟度分档 */
export function cardStage(c) {
  if (c.interval >= 21) return { label: '长期记忆', cls: 'mature' };
  if (c.interval >= 1) return { label: '巩固中', cls: 'young' };
  return { label: '新学', cls: 'due' };
}

/* ------------------------------------------------------------------
   统计汇总
   ------------------------------------------------------------------ */
export function getStats() {
  const p = getProgress();
  if (!p) return null;
  const lessons = Object.values(p.lessons);
  const cards = Object.values(p.srs);

  const langsStudied = new Set(lessons.map((l) => l.lang).concat(cards.map((c) => c.lang).filter(Boolean)));

  const b1Complete = LANGUAGES.filter((l) => {
    const all = getLessons(l.code, 'B1');
    return all.length > 0 && all.every((les) => p.lessons[les.id]?.completed);
  }).length;

  const todayXp = p.dailyXp[today()] || 0;

  return {
    xp: p.xp,
    level: Math.floor(p.xp / XP_PER_LEVEL) + 1,
    levelProgress: ((p.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100,
    xpToNext: XP_PER_LEVEL - (p.xp % XP_PER_LEVEL),
    streak: p.streak,
    longestStreak: p.longestStreak,
    dailyGoal: p.dailyGoal,
    todayXp,
    goalMet: todayXp >= p.dailyGoal,
    lessonsDone: lessons.length,
    perfectLessons: lessons.filter((l) => l.bestScore >= 100).length,
    wordsLearned: cards.length,
    masteredWords: cards.filter((c) => c.interval >= 21).length,
    dueCount: dueCards().length,
    speakingSessions: p.counters.speaking,
    listeningSessions: p.counters.listening,
    languagesStudied: langsStudied.size,
    b1Complete,
    postsCount: get().posts.filter((x) => x.authorId === p.userId).length,
    minutes: Math.round(lessons.reduce((n, l) => n + (l.durationMs || 0), 0) / 60000),
    activeLang: p.activeLang,
  };
}

/** 各技能掌握度（0~100）：完成度 × 正确率 加权 */
export function skillMastery() {
  const p = getProgress();
  if (!p) return {};
  const out = {};
  SKILLS.forEach((sk) => {
    const total = LANGUAGES.reduce((n, l) => n + getLessons(l.code).filter((x) => x.type === sk).length, 0);
    const recs = Object.values(p.lessons).filter((l) => l.type === sk);
    const done = recs.length;
    const accuracy = done ? recs.reduce((n, r) => n + r.bestScore, 0) / done : 0;
    const completion = total ? (done / total) * 100 : 0;
    out[sk] = Math.round(clamp(completion * 0.6 + accuracy * 0.4, 0, 100));
  });
  return out;
}

/** 最近 N 天的 XP 序列（用于趋势线） */
export function xpSeries(days = 14) {
  const p = getProgress();
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = today(new Date(Date.now() - i * DAY));
    out.push({ date: key, xp: (p?.dailyXp[key] || 0) });
  }
  return out;
}

/** 活跃度热力图（最近 N 周，按周列） */
export function heatmap(weeks = 18) {
  const p = getProgress();
  const cells = [];
  const total = weeks * 7;
  for (let i = total - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const key = today(d);
    const n = p?.activity[key] || 0;
    const level = n === 0 ? 0 : n <= 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4;
    cells.push({ date: key, count: n, level });
  }
  return cells;
}

export function levelInfo() {
  const s = getStats();
  if (!s) return { level: 1, progress: 0, toNext: XP_PER_LEVEL };
  return { level: s.level, progress: s.levelProgress, toNext: s.xpToNext };
}

/* ------------------------------------------------------------------
   成就结算
   ------------------------------------------------------------------ */
function unlock(p) {
  const stats = getStatsFromDraft(p);
  const got = [];
  ACHIEVEMENTS.forEach((a) => {
    if (!p.achievements.includes(a.id) && a.check(stats)) {
      p.achievements.push(a.id);
      got.push(a.id);
    }
  });
  return got;
}

/** 与 getStats 同构，但基于传入的草稿对象（避免结算过程中再次读写全局） */
function getStatsFromDraft(p) {
  const lessons = Object.values(p.lessons);
  const cards = Object.values(p.srs);
  const langsStudied = new Set(lessons.map((l) => l.lang).concat(cards.map((c) => c.lang).filter(Boolean)));
  const b1Complete = LANGUAGES.filter((l) => {
    const all = getLessons(l.code, 'B1');
    return all.length > 0 && all.every((les) => p.lessons[les.id]?.completed);
  }).length;
  return {
    xp: p.xp,
    streak: p.streak,
    lessonsDone: lessons.length,
    perfectLessons: lessons.filter((l) => l.bestScore >= 100).length,
    wordsLearned: cards.length,
    masteredWords: cards.filter((c) => c.interval >= 21).length,
    speakingSessions: p.counters.speaking,
    listeningSessions: p.counters.listening,
    languagesStudied: langsStudied.size,
    b1Complete,
    postsCount: get().posts.filter((x) => x.authorId === p.userId).length,
  };
}

/** 进入社区发帖后重新检查成就 */
export function refreshAchievements() {
  let got = [];
  mutateProgress((p) => { got = unlock(p); });
  return got;
}

export function setDailyGoal(xp) {
  mutateProgress((p) => { p.dailyGoal = clamp(Number(xp) || 50, 10, 300); });
}
