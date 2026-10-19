/* ==========================================================================
   services/recommend — 个性化学习路径推荐
   策略（按优先级）：
     1. 到期复习卡片   —— 记忆即将遗忘，收益最高
     2. 薄弱技能补强   —— 完成度低或正确率低的模块
     3. 主线的下一课   —— 保持课程推进的连续性
     4. 低分课节重做   —— 正确率不足 70% 的课节
     5. 迁移到新语种   —— 已稳定推进时鼓励多语种
   ========================================================================== */

import { getProgress, getStats, skillMastery, dueCards } from './progress.js';
import { getLessons, getLesson, LANGUAGES, getLanguage } from '../data/courses.js';

export const SKILL_LABELS = {
  vocab: { label: '单词记忆', route: 'vocab', icon: 'layers' },
  grammar: { label: '语法练习', route: 'grammar', icon: 'pen' },
  listening: { label: '听力训练', route: 'listening', icon: 'headphones' },
  speaking: { label: '口语跟读', route: 'speaking', icon: 'mic' },
};

/** 主线中第一门尚未完成的课节 */
export function nextLessonIn(lang) {
  const p = getProgress();
  const all = getLessons(lang);
  return all.find((l) => !p?.lessons[l.id]?.completed) || null;
}

/** 某语种剩余的课节序列（含是否已完成） */
export function pathFor(lang) {
  const p = getProgress();
  return getLessons(lang).map((l) => ({ lesson: l, done: !!p?.lessons[l.id]?.completed, record: p?.lessons[l.id] || null }));
}

/** 薄弱环节排序 */
export function weakAreas() {
  const m = skillMastery();
  return Object.entries(m)
    .map(([skill, score]) => ({ skill, score, ...SKILL_LABELS[skill] }))
    .sort((a, b) => a.score - b.score);
}

/** 生成今日个性化计划 */
export function buildPlan(limit = 4) {
  const p = getProgress();
  if (!p) return [];
  const stats = getStats();
  const lang = p.activeLang;
  const langMeta = getLanguage(lang);
  const items = [];

  // 1. 到期复习
  const due = dueCards(lang).length || dueCards().length;
  if (due > 0) {
    items.push({
      id: 'plan-srs', kind: 'srs', accent: langMeta?.accent || 'gold',
      title: `清理 ${due} 张到期卡片`,
      reason: '间隔重复到期，先复习再学新内容，记忆留存率最高。',
      cta: '开始复习', route: `/practice/vocab?lang=${lang}&mode=review`,
      weight: 100,
    });
  }

  // 2. 薄弱技能
  const weak = weakAreas()[0];
  if (weak && weak.score < 70) {
    items.push({
      id: `plan-skill-${weak.skill}`, kind: 'skill', accent: langMeta?.accent || 'gold',
      title: `补强「${weak.label}」`,
      reason: `你在这个模块的掌握度为 ${weak.score}%，是当前最需要提升的一环。`,
      cta: '专项练习', route: `/practice/${weak.route}?lang=${lang}`,
      weight: 85,
    });
  }

  // 3. 主线下一课
  const next = nextLessonIn(lang);
  if (next) {
    items.push({
      id: `plan-next-${next.id}`, kind: 'lesson', accent: langMeta?.accent || 'gold',
      title: next.title,
      reason: `${langMeta?.label || ''} · ${next.level} ${next.subtitle || ''} —— 沿着主线继续推进。`,
      cta: '继续学习', route: `/lesson/${next.id}`,
      weight: 70,
      lesson: next,
    });
  }

  // 4. 低分课节重做
  const low = Object.values(p.lessons)
    .filter((r) => r.bestScore < 70)
    .sort((a, b) => a.bestScore - b.bestScore)[0];
  if (low) {
    const les = getLesson(low.lessonId);
    if (les) {
      items.push({
        id: `plan-redo-${low.lessonId}`, kind: 'redo', accent: getLanguage(low.lang)?.accent || 'gold',
        title: `重做：${les.title}`,
        reason: `上次正确率只有 ${low.bestScore}%，再练一次通常能一次过关。`,
        cta: '重新挑战', route: `/lesson/${low.lessonId}`,
        weight: 55,
      });
    }
  }

  // 5. 多语种拓展
  if (stats && stats.languagesStudied < LANGUAGES.length && (stats.lessonsDone >= 3 || stats.xp >= 120)) {
    const fresh = LANGUAGES.find((l) => l.code !== lang
      && !Object.values(p.lessons).some((r) => r.lang === l.code));
    if (fresh) {
      items.push({
        id: `plan-new-${fresh.code}`, kind: 'lang', accent: fresh.accent,
        title: `开启${fresh.label}的第一课`,
        reason: '主线已稳定推进，交叉学习第二门语言能强化你的语言比较意识。',
        cta: '去看看', route: `/courses/${fresh.code}`,
        weight: 40,
      });
    }
  }

  return items.sort((a, b) => b.weight - a.weight).slice(0, limit);
}

/** 学习节奏建议：根据最近 7 天的活跃度给出目标调整建议 */
export function paceAdvice() {
  const s = getStats();
  if (!s) return '登录后即可生成你的学习节奏建议。';
  if (s.streak === 0) return '今天还没有开始，先完成一次 5 分钟的闪卡复习就能点亮连续记录。';
  if (s.todayXp >= s.dailyGoal) return `今日目标已达成（${s.todayXp}/${s.dailyGoal} XP），可以挑战一节新课程。`;
  const rest = s.dailyGoal - s.todayXp;
  if (s.streak >= 7) return `已连续 ${s.streak} 天，保持住这个节奏，还差 ${rest} XP 完成今日目标。`;
  return `今日还差 ${rest} XP，一节词汇课大约能拿 30~50 XP。`;
}
