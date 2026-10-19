/* ==========================================================================
   data/content/ja — 日语语料库
   结构说明（三语内容文件共用同一 schema）：
   lexicon  : { term, reading, pos, meaning, example, exampleZh, level }
   grammar  : { point, rule, tip, items:[{ q(含 ___ 的句子), answer, options[], zh }] }
   phrases  : { text, zh, level, skill }    —— 用于听力训练与口语跟读
   ========================================================================== */

export default {
  lexicon: [
    /* ---- A1 入门 ---- */
    { term: '水', reading: 'みず', pos: '名.', meaning: '水', level: 'A1',
      example: '冷たい水をください。', exampleZh: '请给我一杯冷水。' },
    { term: '朝ごはん', reading: 'あさごはん', pos: '名.', meaning: '早饭', level: 'A1',
      example: '毎朝、朝ごはんを食べます。', exampleZh: '我每天早上吃早饭。' },
    { term: '学校', reading: 'がっこう', pos: '名.', meaning: '学校', level: 'A1',
      example: '学校は駅の近くです。', exampleZh: '学校在车站附近。' },
    { term: '天気', reading: 'てんき', pos: '名.', meaning: '天气', level: 'A1',
      example: '今日は天気がいいですね。', exampleZh: '今天天气真好啊。' },
    { term: '友達', reading: 'ともだち', pos: '名.', meaning: '朋友', level: 'A1',
      example: '友達と一緒に映画を見ます。', exampleZh: '和朋友一起看电影。' },
    { term: '食べる', reading: 'たべる', pos: '動.', meaning: '吃', level: 'A1',
      example: '朝はパンを食べます。', exampleZh: '早上吃面包。' },
    { term: '行く', reading: 'いく', pos: '動.', meaning: '去', level: 'A1',
      example: '明日、京都へ行きます。', exampleZh: '明天去京都。' },
    { term: '大きい', reading: 'おおきい', pos: '形.', meaning: '大的', level: 'A1',
      example: 'この犬はとても大きいです。', exampleZh: '这只狗非常大。' },
    { term: '安い', reading: 'やすい', pos: '形.', meaning: '便宜的', level: 'A1',
      example: 'この店は安いです。', exampleZh: '这家店很便宜。' },
    { term: '駅', reading: 'えき', pos: '名.', meaning: '车站', level: 'A1',
      example: '駅で友達を待ちます。', exampleZh: '在车站等朋友。' },

    /* ---- A2 日常 ---- */
    { term: '予定', reading: 'よてい', pos: '名.', meaning: '预定；计划', level: 'A2',
      example: '週末の予定はありますか。', exampleZh: '周末有计划吗？' },
    { term: '約束', reading: 'やくそく', pos: '名.', meaning: '约定', level: 'A2',
      example: '友達と約束をしました。', exampleZh: '和朋友约好了。' },
    { term: '準備', reading: 'じゅんび', pos: '名.', meaning: '准备', level: 'A2',
      example: '旅行の準備をしています。', exampleZh: '正在做旅行的准备。' },
    { term: '慣れる', reading: 'なれる', pos: '動.', meaning: '习惯；适应', level: 'A2',
      example: '新しい生活に慣れました。', exampleZh: '已经习惯了新的生活。' },
    { term: '調べる', reading: 'しらべる', pos: '動.', meaning: '查；调查', level: 'A2',
      example: '電車の時間を調べます。', exampleZh: '查一下电车的时间。' },
    { term: '続ける', reading: 'つづける', pos: '動.', meaning: '继续', level: 'A2',
      example: '毎日、勉強を続けています。', exampleZh: '每天都坚持学习。' },
    { term: '便利', reading: 'べんり', pos: '形動.', meaning: '方便', level: 'A2',
      example: 'このアプリはとても便利です。', exampleZh: '这个应用非常方便。' },
    { term: '残念', reading: 'ざんねん', pos: '形動.', meaning: '遗憾；可惜', level: 'A2',
      example: '行けなくて残念です。', exampleZh: '不能去，真遗憾。' },
    { term: 'たぶん', reading: 'たぶん', pos: '副.', meaning: '大概；也许', level: 'A2',
      example: '明日はたぶん雨が降ります。', exampleZh: '明天大概会下雨。' },
    { term: '嬉しい', reading: 'うれしい', pos: '形.', meaning: '高兴的', level: 'A2',
      example: 'その知らせを聞いて嬉しいです。', exampleZh: '听到那个消息很高兴。' },

    /* ---- B1 进阶 ---- */
    { term: '経験', reading: 'けいけん', pos: '名.', meaning: '经验；经历', level: 'B1',
      example: '海外で働いた経験があります。', exampleZh: '我有在国外工作的经历。' },
    { term: '意見', reading: 'いけん', pos: '名.', meaning: '意见', level: 'B1',
      example: '自分の意見をはっきり言う。', exampleZh: '清楚地表达自己的意见。' },
    { term: '影響', reading: 'えいきょう', pos: '名.', meaning: '影响', level: 'B1',
      example: '天気は農業に影響を与える。', exampleZh: '天气会给农业带来影响。' },
    { term: '解決', reading: 'かいけつ', pos: '名.', meaning: '解决', level: 'B1',
      example: '早く問題を解決したい。', exampleZh: '想尽快解决问题。' },
    { term: '確認', reading: 'かくにん', pos: '名.', meaning: '确认', level: 'B1',
      example: '出発前に予約を確認する。', exampleZh: '出发前确认预约。' },
    { term: '増える', reading: 'ふえる', pos: '動.', meaning: '增加', level: 'B1',
      example: '都市の人口が急に増えた。', exampleZh: '城市人口急剧增加了。' },
    { term: '減る', reading: 'へる', pos: '動.', meaning: '减少', level: 'B1',
      example: '運動する人が減っている。', exampleZh: '运动的人在减少。' },
    { term: '防ぐ', reading: 'ふせぐ', pos: '動.', meaning: '防止', level: 'B1',
      example: '事故を防ぐために気をつける。', exampleZh: '为了防事故要多加小心。' },
    { term: '適切', reading: 'てきせつ', pos: '形動.', meaning: '恰当的', level: 'B1',
      example: '適切な方法を選びましょう。', exampleZh: '选择恰当的方法吧。' },
    { term: '詳しい', reading: 'くわしい', pos: '形.', meaning: '详细的；熟悉的', level: 'B1',
      example: '彼は歴史にとても詳しい。', exampleZh: '他对历史非常熟悉。' },
  ],

  grammar: [
    {
      level: 'A1', point: 'です／ます 体的现在时',
      rule: '名词、形容词后接 です，动词用 ます 形，表示现在的状态或习惯性动作，语气礼貌。',
      tip: '动词过去式是 ～ました，形容词过去式是 ～かったです，初学者容易混用。',
      items: [
        { q: '私は学生___。', answer: 'です', options: ['です', 'ます', 'だ'], zh: '我是学生。' },
        { q: '毎朝、コーヒーを飲み___。', answer: 'ます', options: ['です', 'ます', 'ました'], zh: '我每天早上喝咖啡。' },
      ],
    },
    {
      level: 'A1', point: 'は／が 的用法',
      rule: '「は」提示已知的话题，「が」提示新信息或焦点，常与疑问词、存在句搭配。',
      tip: '回答「誰が来ましたか」时要用「が」，不能用「は」。',
      items: [
        { q: '私___学生です。', answer: 'は', options: ['は', 'が', 'を'], zh: '我是学生。' },
        { q: 'あそこに犬___います。', answer: 'が', options: ['は', 'が', 'に'], zh: '那里有一只狗。' },
      ],
    },
    {
      level: 'A2', point: 'て 形',
      rule: '动词「て 形」可以连接动作、表示进行（～ています）或表示请求（～てください）。',
      tip: '五段动词「て 形」有音便变化，如「書く→書いて」「飲む→飲んで」。',
      items: [
        { q: '今、ご飯を食べ___います。', answer: 'て', options: ['て', 'で', 'た'], zh: '我正在吃饭。' },
        { q: 'ここに名前を書い___ください。', answer: 'て', options: ['で', 'て', 'に'], zh: '请在这里写上名字。' },
      ],
    },
    {
      level: 'A2', point: '～たら／～なら',
      rule: '「～たら」表示条件或"……之后"，「～なら」以对方提到的事物为前提提出建议。',
      tip: '「～たら」后项可以是意志、请求；「～と」后项不能是意志性表达。',
      items: [
        { q: '時間が___、電話してください。', answer: 'あったら', options: ['あったら', 'あります', 'あって'], zh: '如果有时间，请给我打电话。' },
        { q: '日本へ行く___、京都がおすすめです。', answer: 'なら', options: ['たら', 'なら', 'ので'], zh: '要去日本的话，推荐京都。' },
      ],
    },
    {
      level: 'B1', point: '受身（被动）',
      rule: '被动形由「れる／られる」构成，用于表达被做某事，或以客观视角陈述事实。',
      tip: '主语是被影响的一方，施动者多用「に」或「によって」标记。',
      items: [
        { q: '私は友達に写真を___。', answer: '撮られました', options: ['撮りました', '撮られました', '撮らせました'], zh: '我被朋友拍了照片。' },
        { q: 'この建物は百年前に___。', answer: '建てられました', options: ['建てられました', '建てました', '建てさせました'], zh: '这座建筑是一百年前建造的。' },
      ],
    },
    {
      level: 'B1', point: '～ば／～ほど',
      rule: '「～ば」表示假定条件；「～ば～ほど」表示随着某一程度加深，另一情况也随之变化。',
      tip: '「～ば」后项不能接命令、请求等意志表达，此时应改用「～たら」。',
      items: [
        { q: '練習すれ___、上手になります。', answer: 'ば', options: ['ば', 'たら', 'なら'], zh: '只要练习，就会变得熟练。' },
        { q: 'この本は読め___読むほど、面白い。', answer: 'ば', options: ['たら', 'ば', 'なら'], zh: '这本书越读越有趣。' },
      ],
    },
  ],

  phrases: [
    /* ---- listening：听力训练 ---- */
    { text: '駅はどこにありますか。', zh: '车站在哪里？', level: 'A1', skill: 'listening' },
    { text: 'この切符はいくらですか。', zh: '这张票多少钱？', level: 'A1', skill: 'listening' },
    { text: 'コーヒーを一杯ください。', zh: '请给我一杯咖啡。', level: 'A1', skill: 'listening' },
    { text: 'もう一度言ってください。', zh: '请再说一遍。', level: 'A1', skill: 'listening' },
    { text: '電車が遅れているので、少し遅れます。', zh: '因为电车晚点，我会稍微迟到。', level: 'A2', skill: 'listening' },
    { text: '予定を確認してから、決めましょう。', zh: '先确认一下日程，再做决定吧。', level: 'A2', skill: 'listening' },
    { text: 'その話、とてもいいと思います。', zh: '我觉得那个提议很不错。', level: 'A2', skill: 'listening' },
    { text: '天気によって、人の気分も変わるそうです。', zh: '据说天气也会影响人的心情。', level: 'B1', skill: 'listening' },
    /* ---- speaking：口语跟读 ---- */
    { text: 'おはようございます。今日はいい天気ですね。', zh: '早上好。今天天气真好啊。', level: 'A1', skill: 'speaking' },
    { text: '手伝ってくれて、ありがとうございます。', zh: '谢谢你帮我。', level: 'A1', skill: 'speaking' },
    { text: '私は毎日日本語を勉強しています。', zh: '我每天都在学日语。', level: 'A1', skill: 'speaking' },
    { text: '準備はもうほとんど終わりました。', zh: '准备工作基本上已经完成了。', level: 'A2', skill: 'speaking' },
    { text: '時間があれば、一緒に行きませんか。', zh: '如果有时间，要不要一起去？', level: 'A2', skill: 'speaking' },
    { text: '昨日、友達と約束をしました。', zh: '昨天和朋友约好了。', level: 'A2', skill: 'speaking' },
    { text: '日本語を学ぶことは、長くて楽しい旅です。', zh: '学习日语是一段漫长而快乐的旅程。', level: 'B1', skill: 'speaking' },
    { text: '話せば話すほど、自信がついてきます。', zh: '越说越有自信。', level: 'B1', skill: 'speaking' },
  ],
};
