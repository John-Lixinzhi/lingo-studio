/* ==========================================================================
   data/courses — 分级课程体系
   把 content/<lang>.js 的语料库，编排为「语言 → 等级 → 单元 → 课节」四级结构。
   课节类型（对应四大互动模块）：
     vocab     单词记忆      grammar  语法练习
     listening 听力训练      speaking 口语跟读
   ========================================================================== */

import en from './content/en.js';
import ja from './content/ja.js';
import ko from './content/ko.js';

export const CORPORA = { en, ja, ko };

export const LANGUAGES = [
  {
    code: 'en', label: '英语', native: 'English', glyph: 'A', accent: 'en',
    speech: 'en-US', tagline: '全球通用 · 职场与学术的通行证',
    blurb: '从日常会话到学术写作，英语课程的语料覆盖生活的每个场景。',
    learners: '12.4 万',
  },
  {
    code: 'ja', label: '日语', native: '日本語', glyph: 'あ', accent: 'ja',
    speech: 'ja-JP', tagline: '敬语体系 · 从五十音到商务会话',
    blurb: '以 JLPT 难度为骨架，把假名、助词与敬语拆成可练习的小步。',
    learners: '8.7 万',
  },
  {
    code: 'ko', label: '韩语', native: '한국어', glyph: '한', accent: 'ko',
    speech: 'ko-KR', tagline: '谚文逻辑 · TOPIK 分级直达中级',
    blurb: '按 TOPIK 梯度安排助词与词尾训练，快速建立开口的语感。',
    learners: '6.1 万',
  },
];

/** 等级定义 */
const LEVELS = [
  { id: 'A1', name: '入门', desc: '建立发音与基础句型的信心', units: ['初见与自我', '衣食住行'] },
  { id: 'A2', name: '日常', desc: '应对生活与出行的真实场景', units: ['日程与计划', '沟通与协作'] },
  { id: 'B1', name: '进阶', desc: '表达观点，读懂观点类文本', units: ['观点与论证', '叙述与描述'] },
];

const LESSON_META = {
  vocab: { title: '词汇记忆', xp: 30, minutes: 8, icon: 'layers', desc: '闪卡 + 间隔重复' },
  grammar: { title: '语法精练', xp: 40, minutes: 10, icon: 'pen', desc: '规则讲解 + 填空' },
  listening: { title: '听力训练', xp: 35, minutes: 9, icon: 'headphones', desc: '听音辨义 + 复述' },
  speaking: { title: '口语跟读', xp: 45, minutes: 11, icon: 'mic', desc: '跟读 + 发音评分' },
};

const half = (arr) => [arr.slice(0, Math.ceil(arr.length / 2)), arr.slice(Math.ceil(arr.length / 2))];

/** 为单一语种构建课程树 */
function build(code) {
  const corpus = CORPORA[code];
  const levels = {};

  LEVELS.forEach((lv) => {
    const vocabByLevel = corpus.lexicon.filter((w) => w.level === lv.id);
    const vocabHalves = half(vocabByLevel);
    const grammarByLevel = corpus.grammar.filter((g) => g.level === lv.id);
    const listen = corpus.phrases.filter((p) => p.level === lv.id && p.skill === 'listening');
    const speak = corpus.phrases.filter((p) => p.level === lv.id && p.skill === 'speaking');

    const units = lv.units.map((unitTitle, ui) => {
      const lessons = [];
      // 第 1 课：词汇记忆
      lessons.push(makeLesson(code, lv, ui, 0, 'vocab', {
        title: `${lv.name}词汇 · ${unitTitle}`,
        subtitle: `掌握 ${vocabHalves[ui].length} 个核心词`,
        items: vocabHalves[ui].map((w) => ({ ...w })),
        title2: lv,
      }));
      // 第 2 课：语法精练
      const g = grammarByLevel[ui];
      lessons.push(makeLesson(code, lv, ui, 1, 'grammar', {
        title: g ? g.point : `${lv.name}语法复习`,
        subtitle: g ? g.rule.slice(0, 26) + '…' : '巩固前两个单元',
        items: g ? g.items.map((it) => ({ ...it })) : [],
        grammar: g || null,
      }));
      // 第 3 课：听力 / 口语交替
      const isListening = ui === 0;
      const pool = isListening ? listen : speak;
      lessons.push(makeLesson(code, lv, ui, 2, isListening ? 'listening' : 'speaking', {
        title: `${isListening ? '听力' : '跟读'}场景 · ${unitTitle}`,
        subtitle: `${pool.length} 段真实语料`,
        items: pool.map((p) => ({ ...p })),
      }));
      return { id: `${code}-${lv.id.toLowerCase()}-u${ui + 1}`, title: unitTitle, index: ui + 1, lessons };
    });

    levels[lv.id] = { id: lv.id, name: lv.name, desc: lv.desc, units };
  });

  return levels;
}

function makeLesson(code, lv, unitIdx, order, type, { title, subtitle, items, grammar }) {
  const meta = LESSON_META[type];
  return {
    id: `${code}-${lv.id.toLowerCase()}-u${unitIdx + 1}-l${order + 1}`,
    lang: code,
    level: lv.id,
    unitIndex: unitIdx + 1,
    order,
    type,
    title,
    subtitle,
    xp: meta.xp,
    minutes: meta.minutes,
    desc: meta.desc,
    items,
    grammar: grammar || null,
  };
}

export const CURRICULUM = { en: build('en'), ja: build('ja'), ko: build('ko') };

/* ------------------------------ 查询辅助 ------------------------------ */

export const getLanguage = (code) => LANGUAGES.find((l) => l.code === code) || null;

export const getLevels = (code) => Object.values(CURRICULUM[code] || {});

export function getLessons(code, levelId = null) {
  const levels = CURRICULUM[code] || {};
  const list = levelId ? [levels[levelId]].filter(Boolean) : Object.values(levels);
  return list.flatMap((lv) => lv.units.flatMap((u) => u.lessons));
}

/** 全部语种的课节索引 */
export const LESSON_INDEX = (() => {
  const map = new Map();
  LANGUAGES.forEach((l) => getLessons(l.code).forEach((les) => map.set(les.id, les)));
  return map;
})();

export const getLesson = (id) => LESSON_INDEX.get(id) || null;

/** 找到某一课节的下一个课节 */
export function nextLesson(id) {
  const cur = getLesson(id);
  if (!cur) return null;
  const list = getLessons(cur.lang, cur.level);
  const i = list.findIndex((l) => l.id === id);
  return i >= 0 ? list[i + 1] || null : null;
}

export function previousLesson(id) {
  const cur = getLesson(id);
  if (!cur) return null;
  const list = getLessons(cur.lang, cur.level);
  const i = list.findIndex((l) => l.id === id);
  return i > 0 ? list[i - 1] : null;
}

/** 某个等级、某类型的全部练习条目（用于独立练习模式） */
export function poolByType(code, type, levelId = null) {
  return getLessons(code, levelId).filter((l) => l.type === type).flatMap((l) => l.items)
    .filter((it) => it && (it.term || it.q || it.text));
}

export const totalLessonCount = (code) => getLessons(code).length;
