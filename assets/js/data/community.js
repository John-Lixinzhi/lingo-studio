/* ==========================================================================
   data/community — 社区种子数据
   1) seedPosts()  首次进入社区时写入的动态
   2) GROUPS       学习小组
   3) LEADERBOARD  榜单里的 AI 同学（真实用户实时插入其中）
   ========================================================================== */

const min = (m) => Date.now() - m * 60 * 1000;

export function seedPosts() {
  return [
    {
      id: 'p_seed_1', author: '林小满', accent: 'ja', lang: 'ja', tag: '打卡',
      text: '第 30 天连续打卡。今天把「は／が」的助词语感终于理顺了，原来主语和主题真的不是一回事。\n分享一个笨办法：把每句话用荧光笔标出「谁在做什么」，标两周就有感觉了。',
      createdAt: min(42), likes: 38, likedBy: [], replies: [
        { id: 'r1', author: 'Kaito', accent: 'en', text: '这个方法对韩语的 은/는 也同样管用，谢谢！', createdAt: min(31) },
        { id: 'r2', author: '阿翾', accent: 'ko', text: '同感，标两周语感真的会变。', createdAt: min(20) },
      ],
    },
    {
      id: 'p_seed_2', author: 'Marco', accent: 'en', lang: 'en', tag: '方法',
      text: '听力训练的复述环节太有用了。以前我听 BBC 像听天书，现在先跟读再听原文，正确率从 40% 涨到 82%。\n关键动作：不要逐词翻译，先抓主干动词和否定词。',
      createdAt: min(96), likes: 52, likedBy: [], replies: [
        { id: 'r3', author: '林小满', accent: 'ja', text: '「先抓主干」这条我要抄下来。', createdAt: min(88) },
      ],
    },
    {
      id: 'p_seed_3', author: '徐一鸣', accent: 'ko', lang: 'ko', tag: '提问',
      text: '请问大家，-(으)ㄴ/는 것 같다 和 -나 봐요 在表达推测时语气差别大吗？做练习题时总选错。',
      createdAt: min(150), likes: 17, likedBy: [], replies: [
        { id: 'r4', author: '阿翾', accent: 'ko', text: '-나 봐요 更偏「我看到/听到线索后的推测」，-것 같다 更中性、也更常用于主观判断。', createdAt: min(140) },
        { id: 'r5', author: 'Marco', accent: 'en', text: '记住「有证据才用 -나 봐요」就够了。', createdAt: min(120) },
      ],
    },
    {
      id: 'p_seed_4', author: '苏晚', accent: 'ja', lang: 'ja', tag: '成就',
      text: '解锁了「记忆大师」徽章！间隔重复是真的有用，一开始每天刷 60 张卡片想放弃，改成每天 20 张之后反而记牢了。',
      createdAt: min(210), likes: 64, likedBy: [], replies: [],
    },
    {
      id: 'p_seed_5', author: 'Kaito', accent: 'en', lang: 'en', tag: '资源',
      text: '推荐一个练习节奏：早上 10 分钟闪卡（清醒时记词最快），午休 8 分钟听力，睡前 5 分钟跟读。三个月下来每天不到 25 分钟。',
      createdAt: min(320), likes: 91, likedBy: [], replies: [
        { id: 'r6', author: '苏晚', accent: 'ja', text: '睡前跟读这个安排很妙，记忆留存期长。', createdAt: min(300) },
      ],
    },
    {
      id: 'p_seed_6', author: '阿翾', accent: 'ko', lang: 'ko', tag: '打卡',
      text: 'TOPIK 中级词汇第 7 天。把词汇按「场景」而不是「字母序」整理后，回忆速度明显快了。今天整理了「交通与出行」一组，一共 24 个词。',
      createdAt: min(430), likes: 29, likedBy: [], replies: [],
    },
  ];
}

export const GROUPS = [
  { id: 'g_en', name: '英语晨读会', lang: 'en', desc: '每天早上 7:00 一起读一篇短文，打卡 21 天', members: 1284, active: '刚刚有人打卡' },
  { id: 'g_ja', name: '五十音起步班', lang: 'ja', desc: '零基础互助小组，专治假名记不住', members: 862, active: '3 分钟前有新帖' },
  { id: 'g_ko', name: 'TOPIK 冲刺营', lang: 'ko', desc: '中级词汇 + 真题听力，每周两次线上模考', members: 596, active: '今天新增 12 人' },
  { id: 'g_mix', name: '多语角 · Polyglot', lang: 'mix', desc: '英日韩三语混学答疑与语伴匹配', members: 431, active: '昨天有新回复' },
];

export const LEADERBOARD = [
  { name: '林小满', lang: 'ja', xp: 4280, accent: 'ja' },
  { name: 'Marco', lang: 'en', xp: 3915, accent: 'en' },
  { name: '阿翾', lang: 'ko', xp: 3502, accent: 'ko' },
  { name: '徐一鸣', lang: 'ko', xp: 2980, accent: 'ko' },
  { name: '苏晚', lang: 'ja', xp: 2640, accent: 'ja' },
  { name: 'Nadia', lang: 'en', xp: 2310, accent: 'en' },
  { name: '陈默', lang: 'en', xp: 1876, accent: 'en' },
  { name: 'Yuki', lang: 'ja', xp: 1420, accent: 'ja' },
];

/** 演示账号：便于快速体验完整流程 */
export const DEMO_ACCOUNTS = [
  { name: '体验同学', email: 'demo@lingo.studio', pass: 'demo1234', accent: 'ja', target: 'ja' },
  { name: '英语学习者', email: 'en@lingo.studio', pass: 'demo1234', accent: 'en', target: 'en' },
  { name: '韩语学习者', email: 'ko@lingo.studio', pass: 'demo1234', accent: 'ko', target: 'ko' },
];
