/* ==========================================================================
   data/achievements — 成就激励体系
   check(stats) 接收由 services/progress 汇总的学习档案，返回是否解锁。
   tier: 1 铜 / 2 银 / 3 金，仅用于视觉层级。
   ========================================================================== */

export const ACHIEVEMENTS = [
  {
    id: 'first-step', name: '第一步', tier: 1, emoji: '🌱',
    desc: '完成第一节课',
    check: (s) => s.lessonsDone >= 1,
  },
  {
    id: 'streak-3', name: '三日不辍', tier: 1, emoji: '🔥',
    desc: '连续学习 3 天',
    check: (s) => s.streak >= 3,
  },
  {
    id: 'streak-7', name: '一周之约', tier: 2, emoji: '🗓️',
    desc: '连续学习 7 天',
    check: (s) => s.streak >= 7,
  },
  {
    id: 'words-30', name: '词汇入门', tier: 1, emoji: '📖',
    desc: '累计掌握 30 个单词',
    check: (s) => s.wordsLearned >= 30,
  },
  {
    id: 'words-100', name: '万词之始', tier: 3, emoji: '📚',
    desc: '累计掌握 100 个单词',
    check: (s) => s.wordsLearned >= 100,
  },
  {
    id: 'perfect-5', name: '满分控', tier: 2, emoji: '🎯',
    desc: '5 节课获得满分',
    check: (s) => s.perfectLessons >= 5,
  },
  {
    id: 'speak-10', name: '开口十次', tier: 2, emoji: '🎤',
    desc: '完成 10 次口语跟读',
    check: (s) => s.speakingSessions >= 10,
  },
  {
    id: 'listen-10', name: '耳力见长', tier: 2, emoji: '🎧',
    desc: '完成 10 组听力训练',
    check: (s) => s.listeningSessions >= 10,
  },
  {
    id: 'polyglot', name: '多语者', tier: 3, emoji: '🌍',
    desc: '在 2 种以上语言中留下学习记录',
    check: (s) => s.languagesStudied >= 2,
  },
  {
    id: 'xp-500', name: '五百里程', tier: 2, emoji: '⚡',
    desc: '累计获得 500 经验值',
    check: (s) => s.xp >= 500,
  },
  {
    id: 'xp-2000', name: '两千里程', tier: 3, emoji: '🏔️',
    desc: '累计获得 2000 经验值',
    check: (s) => s.xp >= 2000,
  },
  {
    id: 'social', name: '同伴互助', tier: 1, emoji: '💬',
    desc: '在社区发布 3 条学习动态',
    check: (s) => s.postsCount >= 3,
  },
  {
    id: 'srs-master', name: '记忆大师', tier: 3, emoji: '🧠',
    desc: '20 张卡片进入长期记忆阶段',
    check: (s) => s.masteredWords >= 20,
  },
  {
    id: 'level-b1', name: '进阶之路', tier: 3, emoji: '🚀',
    desc: '在某门语言中完成 B1 等级的全部课节',
    check: (s) => s.b1Complete >= 1,
  },
];

export const achievementById = (id) => ACHIEVEMENTS.find((a) => a.id === id) || null;
