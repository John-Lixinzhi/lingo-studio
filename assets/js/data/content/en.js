/* ==========================================================================
   data/content/en — 英语语料库
   结构说明（三语内容文件共用同一 schema）：
   lexicon  : { term, reading, pos, meaning, example, exampleZh, level }
   grammar  : { point, rule, tip, items:[{ q(含 ___ 的句子), answer, options[], zh }] }
   phrases  : { text, zh, level }           —— 用于听力训练与口语跟读
   ========================================================================== */

export default {
  lexicon: [
    /* ---- A1 入门 ---- */
    { term: 'water', reading: '/ˈwɔːtər/', pos: 'n.', meaning: '水', level: 'A1',
      example: 'Could I have a glass of water?', exampleZh: '能给我一杯水吗？' },
    { term: 'family', reading: '/ˈfæməli/', pos: 'n.', meaning: '家庭；家人', level: 'A1',
      example: 'I live with my family.', exampleZh: '我和家人住在一起。' },
    { term: 'breakfast', reading: '/ˈbrekfəst/', pos: 'n.', meaning: '早餐', level: 'A1',
      example: 'I have breakfast at seven.', exampleZh: '我七点吃早餐。' },
    { term: 'station', reading: '/ˈsteɪʃən/', pos: 'n.', meaning: '车站', level: 'A1',
      example: 'The train station is nearby.', exampleZh: '火车站在附近。' },
    { term: 'weather', reading: '/ˈweðər/', pos: 'n.', meaning: '天气', level: 'A1',
      example: 'The weather is nice today.', exampleZh: '今天天气很好。' },
    { term: 'borrow', reading: '/ˈbɒrəʊ/', pos: 'v.', meaning: '借入', level: 'A1',
      example: 'Can I borrow your pen?', exampleZh: '我能借你的笔吗？' },
    { term: 'weekend', reading: '/ˈwiːkend/', pos: 'n.', meaning: '周末', level: 'A1',
      example: 'We hike every weekend.', exampleZh: '我们每个周末都去徒步。' },
    { term: 'neighbor', reading: '/ˈneɪbər/', pos: 'n.', meaning: '邻居', level: 'A1',
      example: 'My neighbor is a teacher.', exampleZh: '我的邻居是老师。' },
    { term: 'cheap', reading: '/tʃiːp/', pos: 'adj.', meaning: '便宜的', level: 'A1',
      example: 'This cafe is cheap and good.', exampleZh: '这家咖啡馆便宜又好。' },
    { term: 'arrive', reading: '/əˈraɪv/', pos: 'v.', meaning: '到达', level: 'A1',
      example: 'We arrive at noon.', exampleZh: '我们中午到。' },

    /* ---- A2 日常 ---- */
    { term: 'schedule', reading: '/ˈskedʒuːl/', pos: 'n.', meaning: '日程表', level: 'A2',
      example: 'My schedule is full this week.', exampleZh: '我这周日程排满了。' },
    { term: 'complain', reading: '/kəmˈpleɪn/', pos: 'v.', meaning: '抱怨', level: 'A2',
      example: 'He always complains about traffic.', exampleZh: '他总抱怨交通。' },
    { term: 'improve', reading: '/ɪmˈpruːv/', pos: 'v.', meaning: '改善；提高', level: 'A2',
      example: 'I want to improve my writing.', exampleZh: '我想提高写作水平。' },
    { term: 'convenient', reading: '/kənˈviːniənt/', pos: 'adj.', meaning: '方便的', level: 'A2',
      example: 'Online banking is very convenient.', exampleZh: '网上银行非常方便。' },
    { term: 'apologize', reading: '/əˈpɒlədʒaɪz/', pos: 'v.', meaning: '道歉', level: 'A2',
      example: 'She apologized for being late.', exampleZh: '她为迟到道了歉。' },
    { term: 'recommend', reading: '/ˌrekəˈmend/', pos: 'v.', meaning: '推荐', level: 'A2',
      example: 'Can you recommend a good book?', exampleZh: '你能推荐一本好书吗？' },
    { term: 'deadline', reading: '/ˈdedlaɪn/', pos: 'n.', meaning: '截止日期', level: 'A2',
      example: 'The deadline is next Friday.', exampleZh: '截止日期是下周五。' },
    { term: 'expense', reading: '/ɪkˈspens/', pos: 'n.', meaning: '花费；开支', level: 'A2',
      example: 'Travel expenses are rising.', exampleZh: '旅行开支在上涨。' },
    { term: 'patience', reading: '/ˈpeɪʃəns/', pos: 'n.', meaning: '耐心', level: 'A2',
      example: 'Learning a language takes patience.', exampleZh: '学语言需要耐心。' },
    { term: 'opportunity', reading: '/ˌɒpəˈtjuːnəti/', pos: 'n.', meaning: '机会', level: 'A2',
      example: 'This is a great opportunity.', exampleZh: '这是个大好机会。' },

    /* ---- B1 进阶 ---- */
    { term: 'negotiate', reading: '/nɪˈɡəʊʃieɪt/', pos: 'v.', meaning: '谈判；协商', level: 'B1',
      example: 'They negotiated a better price.', exampleZh: '他们谈到了更好的价格。' },
    { term: 'sustainable', reading: '/səˈsteɪnəbl/', pos: 'adj.', meaning: '可持续的', level: 'B1',
      example: 'We need sustainable solutions.', exampleZh: '我们需要可持续的方案。' },
    { term: 'perspective', reading: '/pəˈspektɪv/', pos: 'n.', meaning: '视角；观点', level: 'B1',
      example: 'Travel changes your perspective.', exampleZh: '旅行会改变你的视角。' },
    { term: 'inevitable', reading: '/ɪnˈevɪtəbl/', pos: 'adj.', meaning: '不可避免的', level: 'B1',
      example: 'Change is inevitable.', exampleZh: '变化是不可避免的。' },
    { term: 'advocate', reading: '/ˈædvəkeɪt/', pos: 'v.', meaning: '倡导；拥护', level: 'B1',
      example: 'She advocates for clean energy.', exampleZh: '她倡导清洁能源。' },
    { term: 'undermine', reading: '/ˌʌndəˈmaɪn/', pos: 'v.', meaning: '削弱；损害', level: 'B1',
      example: 'Constant stress undermines health.', exampleZh: '长期压力会损害健康。' },
    { term: 'nuance', reading: '/ˈnjuːɑːns/', pos: 'n.', meaning: '细微差别', level: 'B1',
      example: 'He missed the nuance of the joke.', exampleZh: '他没听出这个笑话的微妙之处。' },
    { term: 'resilience', reading: '/rɪˈzɪliəns/', pos: 'n.', meaning: '韧性；恢复力', level: 'B1',
      example: 'Resilience grows with practice.', exampleZh: '韧性会随练习增长。' },
    { term: 'comprehensive', reading: '/ˌkɒmprɪˈhensɪv/', pos: 'adj.', meaning: '全面的', level: 'B1',
      example: 'A comprehensive review is needed.', exampleZh: '需要一次全面的审查。' },
    { term: 'articulate', reading: '/ˈɑːtɪkjuleɪt/', pos: 'v.', meaning: '清晰地表达', level: 'B1',
      example: 'She articulated her plan clearly.', exampleZh: '她把计划讲得很清楚。' },
  ],

  grammar: [
    {
      level: 'A1', point: 'be 动词的现在时',
      rule: 'be 动词随主语变化：I → am，he/she/it 与单数名词 → is，you/we/they 与复数 → are。',
      tip: '中文说"我是学生"没有动词变化，英语必须与主语保持一致。',
      items: [
        { q: 'I ___ a student at this school.', answer: 'am', options: ['am', 'is', 'are'], zh: '我是这所学校的学生。' },
        { q: 'They ___ from Canada.', answer: 'are', options: ['is', 'are', 'am'], zh: '他们来自加拿大。' },
      ],
    },
    {
      level: 'A1', point: '一般现在时 · 第三人称单数',
      rule: '主语为第三人称单数时，动词词尾加 -s/-es；其余人称使用动词原形。',
      tip: '常见错误：She drink coffee → She drinks coffee。',
      items: [
        { q: 'She ___ coffee every morning.', answer: 'drinks', options: ['drink', 'drinks', 'drinking'], zh: '她每天早上喝咖啡。' },
        { q: 'The bus ___ at six o\'clock.', answer: 'leaves', options: ['leave', 'leaves', 'left'], zh: '公交车六点发车。' },
      ],
    },
    {
      level: 'A2', point: '现在完成时 have/has + 过去分词',
      rule: '表示过去发生、但对现在有影响的动作或经历，常与 ever/never/already/yet/just 连用。',
      tip: '与一般过去时的区别：现在完成时不强调具体时间点。',
      items: [
        { q: 'I have ___ been to Kyoto.', answer: 'never', options: ['never', 'ever', 'yet'], zh: '我从没去过京都。' },
        { q: 'She has ___ finished her homework.', answer: 'already', options: ['already', 'still', 'ago'], zh: '她已经写完作业了。' },
      ],
    },
    {
      level: 'A2', point: '比较级与最高级',
      rule: '短形容词加 -er/-est，长形容词用 more/most；不规则变化如 good→better→best。',
      tip: '比较级常与 than 搭配，最高级前加 the。',
      items: [
        { q: 'This road is ___ than that one.', answer: 'wider', options: ['wide', 'wider', 'widest'], zh: '这条路比那条宽。' },
        { q: 'It is the ___ film I have ever seen.', answer: 'best', options: ['better', 'best', 'good'], zh: '这是我看过最好的电影。' },
      ],
    },
    {
      level: 'B1', point: '虚拟语气 · 与现在事实相反',
      rule: 'If + 主语 + 过去式（be 用 were），主句用 would/could + 动词原形。',
      tip: '口语中 "If I were you..." 是高频表达，用于给建议。',
      items: [
        { q: 'If I ___ you, I would wait a little longer.', answer: 'were', options: ['am', 'was', 'were'], zh: '如果我是你，我会再等一会儿。' },
        { q: 'If we had more time, we ___ visit the museum.', answer: 'would', options: ['will', 'would', 'are'], zh: '如果我们有更多时间，就会去参观博物馆。' },
      ],
    },
    {
      level: 'B1', point: '被动语态',
      rule: 'be + 过去分词；强调动作的承受者，或不知道、无需说明施动者时使用。',
      tip: '被动句常出现在新闻、学术与说明书里。',
      items: [
        { q: 'The bridge ___ built in 1998.', answer: 'was', options: ['is', 'was', 'did'], zh: '这座桥建于 1998 年。' },
        { q: 'These books ___ published next month.', answer: 'will be', options: ['will be', 'will', 'are been'], zh: '这些书将在下个月出版。' },
      ],
    },
  ],

  phrases: [
    /* ---- listening：听力训练 ---- */
    { text: 'Where is the nearest subway station?', zh: '最近的地铁站在哪里？', level: 'A1', skill: 'listening' },
    { text: 'I would like a cup of hot tea, please.', zh: '我想要一杯热茶，谢谢。', level: 'A1', skill: 'listening' },
    { text: 'How much does this ticket cost?', zh: '这张票多少钱？', level: 'A1', skill: 'listening' },
    { text: 'Could you speak a little more slowly?', zh: '你能说得慢一点吗？', level: 'A1', skill: 'listening' },
    { text: 'I am running a bit late because of the traffic.', zh: '因为堵车，我会迟到一会儿。', level: 'A2', skill: 'listening' },
    { text: 'Let me check my calendar before we decide.', zh: '在我们决定之前，让我查一下日历。', level: 'A2', skill: 'listening' },
    { text: 'That sounds like a reasonable plan to me.', zh: '对我来说这听起来是个合理的计划。', level: 'A2', skill: 'listening' },
    { text: 'The report suggests that the trend may continue.', zh: '报告显示这一趋势可能会持续。', level: 'B1', skill: 'listening' },
    /* ---- speaking：口语跟读 ---- */
    { text: 'Good morning, it is a beautiful day.', zh: '早上好，今天天气真好。', level: 'A1', skill: 'speaking' },
    { text: 'Thank you very much for your help.', zh: '非常感谢你的帮助。', level: 'A1', skill: 'speaking' },
    { text: 'I am learning English every single day.', zh: '我每天都在学英语。', level: 'A1', skill: 'speaking' },
    { text: 'Practice makes progress, not perfection.', zh: '练习带来进步，而不是完美。', level: 'A2', skill: 'speaking' },
    { text: 'Would you mind repeating that question?', zh: '你介意再重复一遍那个问题吗？', level: 'A2', skill: 'speaking' },
    { text: 'I try to read one article before breakfast.', zh: '我尽量在早餐前读一篇文章。', level: 'A2', skill: 'speaking' },
    { text: 'Learning a language is a long and rewarding journey.', zh: '学一门语言是漫长而有收获的旅程。', level: 'B1', skill: 'speaking' },
    { text: 'The more you speak, the more confident you become.', zh: '你说得越多，就越自信。', level: 'B1', skill: 'speaking' },
  ],
};
