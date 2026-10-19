/* ==========================================================================
   data/content/ko — 韩语语料库
   结构说明（三语内容文件共用同一 schema）：
   lexicon  : { term, reading, pos, meaning, example, exampleZh, level }
   grammar  : { point, rule, tip, items:[{ q(含 ___ 的句子), answer, options[], zh }] }
   phrases  : { text, zh, level, skill }     —— 用于听力训练与口语跟读
   ========================================================================== */

export default {
  lexicon: [
    /* ---- A1 入门 ---- */
    { term: '물', reading: 'mul', pos: '명.', meaning: '水', level: 'A1',
      example: '물 한 잔 주세요.', exampleZh: '请给我一杯水。' },
    { term: '아침', reading: 'achim', pos: '명.', meaning: '早晨；早饭', level: 'A1',
      example: '아침을 먹었습니다.', exampleZh: '我吃了早饭。' },
    { term: '약속', reading: 'yaksok', pos: '명.', meaning: '约会；约定', level: 'A1',
      example: '친구와 약속이 있어요.', exampleZh: '我和朋友有约。' },
    { term: '학교', reading: 'hakgyo', pos: '명.', meaning: '学校', level: 'A1',
      example: '저는 학교에 갑니다.', exampleZh: '我去学校。' },
    { term: '가족', reading: 'gajok', pos: '명.', meaning: '家人；家庭', level: 'A1',
      example: '우리 가족은 모두 네 명입니다.', exampleZh: '我家人一共四口。' },
    { term: '친구', reading: 'chingu', pos: '명.', meaning: '朋友', level: 'A1',
      example: '친구를 만나서 영화를 봤어요.', exampleZh: '见了朋友，看了电影。' },
    { term: '만나다', reading: 'mannada', pos: '동.', meaning: '见面', level: 'A1',
      example: '내일 친구를 만납니다.', exampleZh: '明天要见朋友。' },
    { term: '배우다', reading: 'baeuda', pos: '동.', meaning: '学习', level: 'A1',
      example: '저는 한국어를 배웁니다.', exampleZh: '我在学韩语。' },
    { term: '맛있다', reading: 'masitda', pos: '형.', meaning: '好吃的', level: 'A1',
      example: '이 김치는 정말 맛있어요.', exampleZh: '这个泡菜真好吃。' },
    { term: '아주', reading: 'aju', pos: '부.', meaning: '非常', level: 'A1',
      example: '오늘은 아주 추워요.', exampleZh: '今天非常冷。' },

    /* ---- A2 日常 ---- */
    { term: '예약', reading: 'yeyak', pos: '명.', meaning: '预约', level: 'A2',
      example: '병원 진료 예약을 했어요.', exampleZh: '我预约了医院就诊。' },
    { term: '교통', reading: 'gyotong', pos: '명.', meaning: '交通', level: 'A2',
      example: '이 시간에는 교통이 복잡합니다.', exampleZh: '这个时间段交通很拥堵。' },
    { term: '관심', reading: 'gwansim', pos: '명.', meaning: '关心；兴趣', level: 'A2',
      example: '저는 요리에 관심이 많습니다.', exampleZh: '我对料理很感兴趣。' },
    { term: '경험', reading: 'gyeongheom', pos: '명.', meaning: '经验；经历', level: 'A2',
      example: '좋은 경험이 되었습니다.', exampleZh: '这成了一段很好的经历。' },
    { term: '준비하다', reading: 'junbihada', pos: '동.', meaning: '准备', level: 'A2',
      example: '지금 여행 준비를 하고 있어요.', exampleZh: '我正在准备旅行。' },
    { term: '실수하다', reading: 'silsuhada', pos: '동.', meaning: '失误；出错', level: 'A2',
      example: '제가 실수해서 죄송합니다.', exampleZh: '我出错了，很抱歉。' },
    { term: '복잡하다', reading: 'bokjaphada', pos: '형.', meaning: '复杂；拥挤', level: 'A2',
      example: '출근 시간에는 지하철이 복잡합니다.', exampleZh: '上班时间地铁很拥挤。' },
    { term: '조용하다', reading: 'joyonghada', pos: '형.', meaning: '安静的', level: 'A2',
      example: '이 카페는 조용해서 좋아요.', exampleZh: '这家咖啡店很安静，我很喜欢。' },
    { term: '아직', reading: 'ajik', pos: '부.', meaning: '还；尚未', level: 'A2',
      example: '아직 숙제를 못 했습니다.', exampleZh: '我还没做完作业。' },
    { term: '자주', reading: 'jaju', pos: '부.', meaning: '经常', level: 'A2',
      example: '주말에 자주 등산을 합니다.', exampleZh: '周末经常去爬山。' },

    /* ---- B1 进阶 ---- */
    { term: '환경', reading: 'hwangyeong', pos: '명.', meaning: '环境', level: 'B1',
      example: '환경을 보호하는 일은 매우 중요합니다.', exampleZh: '保护环境非常重要。' },
    { term: '정책', reading: 'jeongchaek', pos: '명.', meaning: '政策', level: 'B1',
      example: '정부는 새 정책을 발표했습니다.', exampleZh: '政府发布了新政策。' },
    { term: '영향', reading: 'yeonghyang', pos: '명.', meaning: '影响', level: 'B1',
      example: '이 결정은 우리에게 큰 영향을 줍니다.', exampleZh: '这个决定对我们有很大影响。' },
    { term: '해결하다', reading: 'haegyeolhada', pos: '동.', meaning: '解决', level: 'B1',
      example: '스스로 문제를 해결했습니다.', exampleZh: '我靠自己的能力解决了问题。' },
    { term: '고민하다', reading: 'gominhada', pos: '동.', meaning: '烦恼；苦恼', level: 'B1',
      example: '진로에 대해 고민하고 있습니다.', exampleZh: '我正在为前途烦恼。' },
    { term: '극복하다', reading: 'geukbokhada', pos: '동.', meaning: '克服', level: 'B1',
      example: '어려움을 잘 극복했습니다.', exampleZh: '很好地克服了困难。' },
    { term: '심각하다', reading: 'simgakhada', pos: '형.', meaning: '严重的', level: 'B1',
      example: '지금 상황이 매우 심각합니다.', exampleZh: '现在情况非常严重。' },
    { term: '뚜렷하다', reading: 'tturyeothada', pos: '형.', meaning: '明确的；清晰的', level: 'B1',
      example: '목표가 뚜렷해서 좋습니다.', exampleZh: '目标很明确，很好。' },
    { term: '점점', reading: 'jeomjeom', pos: '부.', meaning: '渐渐；越来越', level: 'B1',
      example: '날씨가 점점 추워집니다.', exampleZh: '天气渐渐变冷。' },
    { term: '반드시', reading: 'bandeusi', pos: '부.', meaning: '一定；务必', level: 'B1',
      example: '약속은 반드시 지켜야 합니다.', exampleZh: '约定一定要遵守。' },
  ],

  grammar: [
    {
      level: 'A1', point: '입니다／입니까? 的敬语体',
      rule: '名词后接 입니다 表示「是……」，疑问句把语尾换成 입니까?；国家、职业、姓名等名词判断句多用这一句式。',
      tip: '입니다 直接附在名词后，不用再加助词；问句只能用 입니까?，不要写成 입니다?。',
      items: [
        { q: '저는 회사원___.', answer: '입니다', options: ['입니까', '입니다', '합니다'], zh: '我是公司职员。' },
        { q: '여기가 서울역___.', answer: '입니까', options: ['입니다', '합니까', '입니까'], zh: '这里是首尔站吗？' },
      ],
    },
    {
      level: 'A1', point: '은/는 与 이/가 主题助词',
      rule: '은/는 提示句子的主题，多用于说明已知信息或进行对比；이/가 提示主语，多用于初次提及或强调主语本身。',
      tip: '助词的选择取决于前一名词有无收音：有收音用 은/이，无收音用 는/가。',
      items: [
        { q: '물___ 차갑습니다.', answer: '이', options: ['이', '가', '을'], zh: '水是凉的。' },
        { q: '친구___ 왔습니다.', answer: '가', options: ['이', '를', '가'], zh: '朋友来了。' },
      ],
    },
    {
      level: 'A2', point: '-고 싶다 表愿望',
      rule: '动词词干后接 -고 싶다，表示第一人称「想做……」；主语为第三人称时改用语尾 -고 싶어하다。',
      tip: '저는…… 고 싶습니다 最自然；说别人「想」时要用 싶어하다，不能说 싶습니다。',
      items: [
        { q: '저는 제주도에 가___.', answer: '고 싶습니다', options: ['고 싶어합니다', '고 싶습니다', '고 있습니까'], zh: '我想去济州岛。' },
        { q: '동생은 새 자전거를 사___.', answer: '고 싶어합니다', options: ['고 싶습니다', '고 싶었습니다', '고 싶어합니다'], zh: '弟弟想买新自行车。' },
      ],
    },
    {
      level: 'A2', point: '-(으)ㄹ 수 있다 表能力',
      rule: '动词词干后接 -(으)ㄹ 수 있다，表示「能／会……」；否定形式为 -(으)ㄹ 수 없다。',
      tip: '词干有收音用 -을 수 있다，无收音用 -ㄹ 수 있다，注意不要混用。',
      items: [
        { q: '저는 수영을 잘 할___.', answer: '수 있습니다', options: ['것 같습니다', '수 있습니다', '수 없습니다'], zh: '我会游泳。' },
        { q: '내일은 바빠서 영화를 볼___.', answer: '수 없습니다', options: ['수 있습니다', '려고 합니다', '수 없습니다'], zh: '明天很忙，不能看电影。' },
      ],
    },
    {
      level: 'B1', point: '-(으)ㄴ/는 것 같다 表推测',
      rule: '根据所见所闻做出推测，相当于「好像／似乎……」；动词现在时用 -는 것 같다，过去时用 -(으)ㄴ 것 같다，形容词用 -(으)ㄴ 것 같다。',
      tip: '것 같다 语气比 -습니다 更委婉，用于不太确定的主观判断。',
      items: [
        { q: '비가 온 것___.', answer: '같습니다', options: ['같습니다', '입니다', '싶습니다'], zh: '好像下雨了。' },
        { q: '그분은 요즘 아주 바쁜 것___.', answer: '같습니다', options: ['입니다', '같습니다', '수 있습니다'], zh: '他最近好像很忙。' },
      ],
    },
    {
      level: 'B1', point: '-아/어야 하다 表义务',
      rule: '动词、形容词词干后接 -아/어야 하다，表示「必须／应该……」；其否定常用 -지 않아도 되다（不必……）。',
      tip: '词干末元音为 ㅏ/ㅗ 时用 -아야，其余用 -어야；하다 类动词则说 해야 합니다。',
      items: [
        { q: '약속은 꼭 지켜___.', answer: '야 합니다', options: ['야 합니다', '도 됩니다', '도 괜찮습니다'], zh: '约定一定要遵守。' },
        { q: '내일 아침 일찍 일어나___.', answer: '야 합니다', options: ['면 됩니다', '야 합니다', '지 않아도 됩니다'], zh: '明天早上必须早起。' },
      ],
    },
  ],

  phrases: [
    /* ---- listening：听力训练 ---- */
    { text: '안녕하세요, 만나서 반갑습니다.', zh: '你好，很高兴见到你。', level: 'A1', skill: 'listening' },
    { text: '화장실이 어디에 있습니까?', zh: '洗手间在哪里？', level: 'A1', skill: 'listening' },
    { text: '이거 얼마예요?', zh: '这个多少钱？', level: 'A1', skill: 'listening' },
    { text: '물 한 잔 주세요.', zh: '请给我一杯水。', level: 'A1', skill: 'listening' },
    { text: '죄송하지만 조금 늦을 것 같습니다.', zh: '抱歉，我可能会稍微晚一点。', level: 'A2', skill: 'listening' },
    { text: '지금 회의 중이라서 전화를 받을 수 없습니다.', zh: '现在在开会，没法接电话。', level: 'A2', skill: 'listening' },
    { text: '주말에 시간이 있으면 같이 갈까요?', zh: '周末有空的话一起走好吗？', level: 'A2', skill: 'listening' },
    { text: '환경 문제는 우리 모두가 함께 해결해야 할 과제입니다.', zh: '环境问题需要我们共同解决的课题。', level: 'B1', skill: 'listening' },
    /* ---- speaking：口语跟读 ---- */
    { text: '오늘 날씨가 정말 좋네요.', zh: '今天天气真好。', level: 'A1', skill: 'speaking' },
    { text: '한국어를 배우는 것이 재미있어요.', zh: '学韩语很有趣。', level: 'A1', skill: 'speaking' },
    { text: '도와주셔서 감사합니다.', zh: '谢谢您的帮助。', level: 'A1', skill: 'speaking' },
    { text: '확인한 후에 다시 연락드리겠습니다.', zh: '我确认之后再联系您。', level: 'A2', skill: 'speaking' },
    { text: '시간이 되면 꼭 한번 놀러 오세요.', zh: '有空一定要来玩。', level: 'A2', skill: 'speaking' },
    { text: '다음부터는 실수하지 않도록 조심하겠습니다.', zh: '以后我会小心不再出错。', level: 'A2', skill: 'speaking' },
    { text: '목표를 뚜렷하게 세우면 더 빠르게 성장할 수 있습니다.', zh: '明确设定目标就能更快成长。', level: 'B1', skill: 'speaking' },
    { text: '작은 노력이 쌓이면 큰 변화를 만들어 낼 수 있습니다.', zh: '小小的努力积累起来就能带来大的变化。', level: 'B1', skill: 'speaking' },
  ],
};
