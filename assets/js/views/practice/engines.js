/* ==========================================================================
   views/practice/engines — 四大互动学习模块的统一运行器
   renderSession(root, config) 会接管一个容器，完成「逐题交互 → 即时反馈 →
   结算页」的完整闭环。课程页与自由练习页都复用它。

   config = {
     type:   'vocab' | 'grammar' | 'listening' | 'speaking',
     items:  [...],            // 题目数据
     lang:   'en' | 'ja' | 'ko',
     title, subtitle,
     exitRoute: '#/learn',     // 退出时回到哪里
     mode:   'review' | null,  // vocab 复习模式
     onFinish(result)          // { correct, total, answers, durationMs }
   }
   ========================================================================== */

import { esc, icon, el, qs, qsa, clamp, textSimilarity, tokenDiff, uid } from '../../core/dom.js';
import { GRADE_LABELS, reviewCard, getProgress } from '../../services/progress.js';
import { speak, stopSpeaking, createRecognizer, asrSupported, ttsSupported, voicesAvailable } from '../../services/speech.js';
import { getLanguage, CORPORA } from '../../data/courses.js';
import { toast, confetti, confirmDialog } from '../../core/ui.js';

/* ------------------------------------------------------------------
   语料索引：把「卡片 key」映射回词条，供间隔重复复习模式使用
   ------------------------------------------------------------------ */
export const cardKeyOf = (lang, term) => `${lang}:w:${term}`;

export const VOCAB_INDEX = (() => {
  const map = new Map();
  Object.entries(CORPORA).forEach(([lang, corpus]) => {
    corpus.lexicon.forEach((w) => map.set(cardKeyOf(lang, w.term), { ...w, lang }));
  });
  return map;
})();

const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

const gradeOfRatio = (r) => (r >= 0.9 ? 'good' : r >= 0.7 ? 'mid' : 'poor');

/* ------------------------------------------------------------------
   主入口
   ------------------------------------------------------------------ */
export function renderSession(root, config) {
  const { type, items, lang, title, subtitle, exitRoute, mode } = config;
  const meta = getLanguage(lang) || { label: '语言', accent: 'gold', speech: 'en-US' };

  if (!items || !items.length) {
    root.innerHTML = `
      <div class="study-stage">
        <div class="empty card">
          <div class="glyph">${icon('sparkle', 44)}</div>
          <h3 class="display-m mt-8">暂无可练习的内容</h3>
          <p class="dim mt-8">这个模块还没有准备好题目，换一个试试，或先去课程里解锁新课节。</p>
          <a class="btn btn-primary mt-24" href="#/courses">去课程地图</a>
        </div>
      </div>`;
    return;
  }

  const session = {
    type, lang, meta, items, mode: mode || null,
    i: 0, correct: 0, answers: [], startedAt: Date.now(),
    title: title || '', subtitle: subtitle || '', exitRoute: exitRoute || '#/learn',
    onFinish: config.onFinish || (() => {}),
    finished: false,
  };

  root.innerHTML = '';                       // 清空容器
  const wrap = el(`<div class="study-stage"></div>`);
  root.appendChild(wrap);
  paint();
  return session;

  /* ---------------- 顶部进度条 ---------------- */
  function paint() {
    wrap.innerHTML = `
      <div class="study-topbar">
        <div class="row gap-12">
          <button class="icon-btn" id="exit-btn" title="退出练习">${icon('back', 17)}</button>
          <div>
            <div class="mono">${esc(meta.label)} · ${esc(session.title || '自由练习')}</div>
            <div class="tiny dim">${esc(session.subtitle || `${items.length} 道题`)}</div>
          </div>
        </div>
        <div class="study-progress">
          <div class="row between tiny dim mb-4">
            <span class="mono-plain">${session.i + 1} / ${items.length}</span>
            <span class="mono-plain" id="live-score">正确 ${session.correct}</span>
          </div>
          <div class="meter meter-xs ${meta.accent === 'en' ? 'meter-en' : meta.accent === 'ja' ? 'meter-ja' : 'meter-ko'}">
            <i style="width:${((session.i) / items.length) * 100}%"></i>
          </div>
        </div>
      </div>
      <div id="stage"></div>`;

    qs('#exit-btn', wrap).addEventListener('click', () => {
      if (session.finished) { location.hash = session.exitRoute; return; }
      confirmDialog({
        title: '要中途退出吗？',
        text: '本节的进度不会计入学习记录，已完成的题目 XP 也会丢失。',
        confirmLabel: '退出练习',
        variant: 'btn-danger',
        onConfirm: () => { stopSpeaking(); location.hash = session.exitRoute; },
      });
    });

    const stage = qs('#stage', wrap);
    if (type === 'vocab') renderVocab(stage);
    else if (type === 'grammar') renderGrammar(stage);
    else if (type === 'listening') renderListening(stage);
    else renderSpeaking(stage);
  }

  function updateHud() {
    const hud = qs('#live-score', wrap);
    if (hud) hud.textContent = `正确 ${session.correct}`;
    const bar = qs('.study-progress .meter > i', wrap);
    if (bar) bar.style.width = `${(session.i / items.length) * 100}%`;
  }

  function advance(answer) {
    session.answers.push(answer);
    session.i += 1;
    updateHud();
    if (session.i >= items.length) finish();
    else { stopSpeaking(); paint(); }
  }

  /* ==================================================================
     1) 单词记忆 —— 闪卡 + 间隔重复
     ================================================================== */
  function renderVocab(stage) {
    const item = items[session.i];
    const key = item.__key || cardKeyOf(lang, item.term);
    const isReview = session.mode === 'review';

    stage.innerHTML = `
      <div class="flashcard-wrap">
        <div class="flashcard" id="card">
          <div class="face front">
            <div class="flash-card-pos">${esc(item.pos || 'word')} · ${esc(item.level || '')}</div>
            <div class="flash-card-term">${esc(item.term)}</div>
            ${item.reading ? `<div class="flash-card-reading">${esc(item.reading)}</div>` : ''}
            <button class="audio-btn mt-16" id="play-word" title="朗读">${icon('volume', 20)}</button>
            <div class="tiny dim mt-16">先试着回忆词义，再点击卡片翻面</div>
          </div>
          <div class="face back">
            <div class="flash-card-pos">释义</div>
            <div class="display-m">${esc(item.meaning)}</div>
            ${item.example ? `<div class="flash-card-example">
                <div class="serif-italic">${esc(item.example)}</div>
                <div class="tiny dim mt-4">${esc(item.exampleZh || '')}</div>
              </div>` : ''}
            <button class="btn btn-ghost btn-sm mt-16" id="play-example">${icon('volume', 15)} 朗读例句</button>
          </div>
        </div>
      </div>

      <div id="grade-area" class="mt-24"></div>`;

    const card = qs('#card', stage);
    let flipped = false;

    const flip = () => {
      flipped = !flipped;
      card.classList.toggle('flipped', flipped);
      if (flipped) paintGrades();
    };
    card.addEventListener('click', (e) => {
      if (e.target.closest('#play-word') || e.target.closest('#play-example')) return;
      flip();
    });
    qs('#play-word', stage).addEventListener('click', (e) => {
      e.stopPropagation();
      speak(item.term, meta.speech, { rate: 0.85 });
    });
    qs('#play-example', stage).addEventListener('click', (e) => {
      e.stopPropagation();
      speak(item.example || item.term, meta.speech, { rate: 0.9 });
    });

    // 首次进入自动朗读，营造沉浸感
    if (ttsSupported) setTimeout(() => speak(item.term, meta.speech, { rate: 0.85 }), 260);

    function paintGrades() {
      const area = qs('#grade-area', stage);
      const p = getProgress();
      const prev = p?.srs?.[key];
      area.innerHTML = `
        <div class="row between mb-8">
          <span class="mono">这次回忆得怎么样？</span>
          ${prev ? `<span class="srs-chip ${prev.interval >= 21 ? 'mature' : prev.interval >= 1 ? 'young' : 'due'}">
              ${prev.interval >= 21 ? '长期记忆' : prev.interval >= 1 ? `间隔 ${prev.interval} 天` : '新学卡片'}
            </span>` : '<span class="srs-chip due">首次学习</span>'}
        </div>
        <div class="grade-bar">
          ${GRADE_LABELS.map((g) => `
            <button class="grade-btn ${g.cls}" data-grade="${g.key}">
              <b>${g.label}</b><span>${g.hint}</span>
            </button>`).join('')}
        </div>
        <p class="tiny dim mt-12">${isReview ? '复习模式：评级会重新安排这张卡片的复习时间。' : '间隔重复算法会根据评级自动安排下次复习。'}</p>`;

      qsa('[data-grade]', area).forEach((btn) => {
        btn.addEventListener('click', () => {
          const grade = Number(btn.dataset.grade);
          const res = reviewCard(key, grade, { lang, kind: 'vocab' });
          if (grade >= 2) session.correct += 1;
          advance({
            key, label: item.term, grade,
            correct: grade >= 2,
            due: res.card ? Math.round((res.card.due - Date.now()) / 86400000) : 0,
          });
        });
      });
    }
  }

  /* ==================================================================
     2) 语法练习 —— 填空选择 + 即时讲解
     ================================================================== */
  function renderGrammar(stage) {
    const item = items[session.i];
    const g = item.__grammar || config.grammar || null;
    const options = shuffle([...item.options]);

    stage.innerHTML = `
      <div class="study-card">
        <div class="row between mb-16">
          <span class="prompt-title">选择正确的形式填空</span>
          ${g ? `<span class="chip chip-gold">${esc(g.point)}</span>` : ''}
        </div>

        <div class="cloze-sentence mb-24">${formatCloze(item.q)}</div>

        <div class="col gap-8" id="opts">
          ${options.map((opt, idx) => `
            <button class="opt" data-opt="${esc(opt)}">
              <span class="key">${String.fromCharCode(65 + idx)}</span>
              <span>${esc(opt)}</span>
            </button>`).join('')}
        </div>

        <div id="feedback" class="mt-20"></div>
      </div>`;

    qsa('[data-opt]', stage).forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = btn.dataset.opt;
        const right = picked === item.answer;
        qsa('[data-opt]', stage).forEach((b) => {
          b.setAttribute('disabled', '');
          if (b.dataset.opt === item.answer) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        if (right) session.correct += 1;
        updateHud();
        paintGrammarFeedback(stage, item, g, right);
      });
    });
  }

  function formatCloze(sentence) {
    const parts = String(sentence).split('___');
    return parts.map((seg) => esc(seg)).join('<span class="blank">?</span>');
  }

  function paintGrammarFeedback(stage, item, g, right) {
    const box = qs('#feedback', stage);
    box.innerHTML = `
      <div class="row gap-12 mb-12" style="align-items:flex-start">
        <span class="tag-dot mt-8" style="background:${right ? 'var(--ok)' : 'var(--err)'}"></span>
        <div>
          <b>${right ? '回答正确' : `正确答案是「${esc(item.answer)}」`}</b>
          <div class="tiny dim mt-4">${esc(item.zh || '')}</div>
        </div>
      </div>
      ${g ? `<div class="note-block mb-12"><b>规则</b>${esc(g.rule)}</div>` : ''}
      ${g?.tip ? `<div class="note-block mb-12" style="border-left-color:var(--ja)"><b>易错提示</b>${esc(g.tip)}</div>` : ''}
      <button class="btn btn-primary btn-block" id="next-q">
        ${session.i + 1 >= session.items.length ? '查看结果' : '下一题'} ${icon('next', 16)}
      </button>`;

    qs('#next-q', box).addEventListener('click', () => {
      advance({ label: item.q, picked: right ? item.answer : '—', answer: item.answer, correct: right });
    });
  }

  /* ==================================================================
     3) 听力训练 —— 听音辨义 + 原文复现
     ================================================================== */
  function renderListening(stage) {
    const item = items[session.i];
    const pool = CORPORA[lang]?.phrases || [];
    const others = shuffle(pool.filter((p) => p.text !== item.text)).slice(0, 2).map((p) => p.zh);
    const choices = shuffle([item.zh, ...others]);

    stage.innerHTML = `
      <div class="study-card center col gap-16">
        <span class="prompt-title">听音频，选出正确的中文含义</span>

        <button class="audio-btn" id="play-audio" style="width:76px;height:76px">${icon('volume', 30)}</button>
        <div class="tiny dim" id="audio-state">点击播放，可重复收听</div>

        <div class="row gap-8 mt-8">
          <button class="btn btn-ghost btn-sm" id="slow">${icon('headphones', 14)} 慢速</button>
          <button class="btn btn-ghost btn-sm" id="normal">${icon('play', 14)} 常速</button>
          <button class="btn btn-quiet btn-sm hidden" id="reveal-text">查看原文</button>
        </div>

        <div class="col gap-8 w-full mt-16" id="opts" style="width:100%">
          ${choices.map((c, idx) => `
            <button class="opt" data-opt="${esc(c)}">
              <span class="key">${String.fromCharCode(65 + idx)}</span>
              <span>${esc(c)}</span>
            </button>`).join('')}
        </div>
        <div id="feedback" style="width:100%"></div>
      </div>`;

    const play = (rate) => {
      const btn = qs('#play-audio', stage);
      const state = qs('#audio-state', stage);
      btn.classList.add('playing');
      speak(item.text, meta.speech, {
        rate,
        onStart: () => { state.textContent = '播放中…'; },
        onEnd: () => { btn.classList.remove('playing'); state.textContent = '可再次点击重听'; },
      });
      if (!ttsSupported || !voicesAvailable()) {
        state.textContent = '当前环境没有可用的语音播放能力，可直接查看原文。';
        reveal();
      }
    };
    qs('#play-audio', stage).addEventListener('click', () => play(0.92));
    qs('#slow', stage).addEventListener('click', () => play(0.68));
    qs('#normal', stage).addEventListener('click', () => play(1));

    // 无可用音色时自动亮出「查看原文」，保证练习不因 TTS 不可用而卡住
    const revealBtn = qs('#reveal-text', stage);
    revealBtn.addEventListener('click', reveal);
    if (!voicesAvailable()) {
      revealBtn.classList.remove('hidden');
      play(0.92);
    } else {
      setTimeout(() => play(0.92), 300);
    }

    qsa('[data-opt]', stage).forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = btn.dataset.opt;
        const right = picked === item.zh;
        qsa('[data-opt]', stage).forEach((b) => {
          b.setAttribute('disabled', '');
          if (b.dataset.opt === item.zh) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        if (right) session.correct += 1;
        updateHud();

        const box = qs('#feedback', stage);
        box.innerHTML = `
          <div class="card card-flat mt-8">
            <div class="mono mb-8">原文 · 可再次朗读</div>
            <div class="serif-italic" style="font-size:1.15rem">${esc(item.text)}</div>
            <div class="tiny dim mt-8">${esc(item.zh)}</div>
            <button class="btn btn-ghost btn-sm mt-12" id="replay">${icon('volume', 14)} 复听原文</button>
          </div>
          <button class="btn btn-primary btn-block mt-16" id="next-q">
            ${session.i + 1 >= session.items.length ? '查看结果' : '下一题'} ${icon('next', 16)}
          </button>`;
        qs('#replay', box).addEventListener('click', () => speak(item.text, meta.speech, { rate: 0.8 }));
        qs('#next-q', box).addEventListener('click', () => {
          advance({ label: item.text, picked, answer: item.zh, correct: right });
        });
      });
    });

    function reveal() {
      const box = qs('#feedback', stage);
      if (!box || box.innerHTML) return;
      box.innerHTML = `<div class="note-block">${esc(item.text)} · ${esc(item.zh)}</div>`;
    }
  }

  /* ==================================================================
     4) 口语跟读 —— 朗读 + 语音识别评分
     ================================================================== */
  function renderSpeaking(stage) {
    const item = items[session.i];
    let transcript = '';
    let recorder = null;
    let recording = false;

    stage.innerHTML = `
      <div class="study-card">
        <div class="row between mb-16">
          <span class="prompt-title">跟读下面这句话</span>
          <span class="chip">${ttsSupported ? '先听后读' : '不支持语音合成'}</span>
        </div>

        <div class="serif-italic mb-8" style="font-size:clamp(1.3rem,3vw,1.9rem)">${esc(item.text)}</div>
        <div class="dim mb-20">${esc(item.zh)}</div>

        <div class="row gap-8 wrap mb-20">
          <button class="btn btn-ghost btn-sm" id="play-normal">${icon('volume', 14)} 常速朗读</button>
          <button class="btn btn-ghost btn-sm" id="play-slow">${icon('headphones', 14)} 慢速朗读</button>
        </div>

        <div class="col center gap-16" id="mic-area">
          <button class="mic-btn" id="mic">${icon('mic', 30)}</button>
          <div class="tiny dim" id="mic-hint">
            ${asrSupported ? '点击麦克风开始录音，读完再点一次结束' : '当前浏览器不支持语音识别，可改用键盘输入你读出的内容'}
          </div>
          <div class="wave" id="wave">${Array.from({ length: 26 }, (_, i) =>
            `<i style="height:${8 + (i % 5) * 5}px;animation-delay:${i * 0.05}s"></i>`).join('')}</div>
        </div>

        <div class="mt-20">
          <div class="mono mb-8">识别结果</div>
          <div class="transcript" id="transcript"><span class="dim">还没有录音…</span></div>
        </div>

        <div id="fallback" class="mt-16 hidden">
          <div class="field">
            <label>键盘输入 · 把你读出的句子打在这里</label>
            <input class="input" id="manual" placeholder="用目标语言输入你实际读出的内容" />
          </div>
          <button class="btn btn-ghost mt-8" id="manual-go">提交并评分</button>
        </div>

        <div id="speak-result" class="mt-20"></div>
      </div>`;

    qs('#play-normal', stage).addEventListener('click', () => speak(item.text, meta.speech, { rate: 0.95 }));
    qs('#play-slow', stage).addEventListener('click', () => speak(item.text, meta.speech, { rate: 0.65 }));
    setTimeout(() => speak(item.text, meta.speech, { rate: 0.85 }), 300);

    const micBtn = qs('#mic', stage);
    const wave = qs('#wave', stage);
    const transEl = qs('#transcript', stage);
    const hintEl = qs('#mic-hint', stage);

    if (!asrSupported) {
      showFallback('当前浏览器不支持语音识别，请改用键盘输入你读出的内容。');
      micBtn.classList.add('hidden');
    } else {
      recorder = createRecognizer({
        lang: meta.speech,
        onPartial: (text) => {
          transEl.innerHTML = `<span class="dim">${esc(text || '…')}</span>`;
        },
        onFinal: (text) => { transcript = text; },
        onError: (msg) => {
          toast(msg, 'warn');
          stopRecording();
          showFallback('麦克风不可用，请改用键盘输入你读出的内容。');
        },
        onEnd: () => {
          stopRecording();
          if (transcript) score(transcript);
          else hintEl.textContent = '没有识别到内容，再点一次麦克风重试。';
        },
      });

      micBtn.addEventListener('click', () => {
        if (recording) { recorder.stop(); return; }
        stopSpeaking();
        transcript = '';
        const started = recorder.start();
        if (started === false) { toast('无法启动录音，请检查麦克风权限。', 'err'); return; }
        recording = true;
        micBtn.classList.add('recording');
        micBtn.classList.remove('stop');
        wave.classList.add('live');
        hintEl.textContent = '正在聆听… 读完后点击结束';
        transEl.innerHTML = '<span class="dim">聆听中…</span>';
      });
    }

    function showFallback(text) {
      qs('#fallback', stage)?.classList.remove('hidden');
      if (text) hintEl.textContent = text;
    }

    function stopRecording() {
      recording = false;
      micBtn.classList.remove('recording');
      wave.classList.remove('live');
    }

    qs('#manual-go', stage)?.addEventListener('click', () => {
      const val = qs('#manual', stage).value.trim();
      if (!val) { toast('请先输入内容', 'warn'); return; }
      score(val);
    });

    function score(spoken) {
      stopRecording();
      const sim = textSimilarity(item.text, spoken);
      const pct = Math.round(clamp(sim, 0, 1) * 100);
      if (sim >= 0.6) session.correct += 1;
      updateHud();

      const tone = pct >= 85 ? 'ok' : pct >= 60 ? 'warn' : 'err';
      const verdict = pct >= 85 ? '非常接近原句，语感很棒！' : pct >= 60 ? '基本读对了，注意个别词的清晰度。' : '再听一遍原句，放慢速度逐词跟读。';

      qs('#speak-result', stage).innerHTML = `
        <div class="result-banner ${tone === 'ok' ? 'good' : tone === 'warn' ? 'mid' : 'poor'}">
          <div class="mono mb-4">发音匹配度</div>
          <div class="result-score">${pct}%</div>
          <div class="mt-8">${esc(verdict)}</div>
        </div>
        <div class="mt-16">
          <div class="mono mb-8">逐词比对（绿色=读对，红色=缺失或偏差）</div>
          <div class="transcript">${tokenDiff(item.text, spoken)}</div>
        </div>
        <div class="row gap-8 mt-16">
          <button class="btn btn-ghost" id="retry">${icon('rotate', 15)} 再读一次</button>
          <button class="btn btn-primary grow" id="next-q">
            ${session.i + 1 >= session.items.length ? '查看结果' : '下一句'} ${icon('next', 16)}
          </button>
        </div>`;

      qs('#retry', stage).addEventListener('click', () => {
        qs('#speak-result', stage).innerHTML = '';
        transEl.innerHTML = '<span class="dim">还没有录音…</span>';
        hintEl.textContent = '点击麦克风重新开始';
        if (!asrSupported) qs('#manual', stage).value = '';
      });
      qs('#next-q', stage).addEventListener('click', () => {
        advance({ label: item.text, score: pct, spoken, correct: sim >= 0.6 });
      });
    }
  }

  /* ==================================================================
     结算页
     ================================================================== */
  function finish() {
    session.finished = true;
    stopSpeaking();
    const total = items.length;
    const ratio = total ? session.correct / total : 0;
    const durationMs = Date.now() - session.startedAt;
    const result = { correct: session.correct, total, answers: session.answers, durationMs, type, lang };

    session.onFinish(result);
    paintResult(result, ratio);
  }

  function paintResult(result, ratio) {
    const tone = gradeOfRatio(ratio);
    const pct = Math.round(ratio * 100);

    wrap.innerHTML = `
      <div class="stagger col gap-16">
        <div class="result-banner ${tone}">
          <div class="mono mb-8">${esc(meta.label)} · ${esc(session.title || '练习结算')}</div>
          <div class="result-score">${pct}<span style="font-size:1.4rem">%</span></div>
          <div class="mt-8" style="font-size:1.05rem">
            ${tone === 'good' ? '表现出色，这一节掌握得很扎实。' : tone === 'mid' ? '基本过关，仍有几处可以更稳。' : '别着急，重复是语言学习最有效的武器。'}
          </div>
          <div class="stat-row mt-24 center" style="justify-content:center">
            <div class="stat"><b>${result.correct}/${result.total}</b><span>答对</span></div>
            <div class="stat"><b>${Math.max(1, Math.round(result.durationMs / 60000))}</b><span>用时(分)</span></div>
            <div class="stat"><b>+${result.xpGained ?? '—'}</b><span>获得 XP</span></div>
          </div>
        </div>

        <div class="card">
          <div class="mono mb-12">本节回顾</div>
          <div class="col gap-4">
            ${session.answers.map((a, i) => `
              <div class="list-row">
                <span class="idx" style="background:${a.correct ? 'var(--ko)' : 'var(--err)'};color:#fff;width:28px;height:28px;border-radius:8px;font-size:.72rem">${i + 1}</span>
                <span class="grow" style="font-size:.9rem">${esc(a.label || '')}</span>
                <span class="mono-plain" style="color:${a.correct ? 'var(--ok)' : 'var(--err)'}">
                  ${a.correct ? '正确' : '需加强'}
                </span>
              </div>`).join('')}
          </div>
        </div>

        <div class="row gap-12 wrap">
          <button class="btn btn-primary" id="again">${icon('rotate', 16)} 再练一次</button>
          <a class="btn btn-ghost" href="#/courses">浏览课程</a>
          <a class="btn btn-ghost grow" href="${esc(session.exitRoute)}">返回学习台</a>
        </div>
      </div>`;

    qs('#again', wrap).addEventListener('click', () => {
      session.i = 0; session.correct = 0; session.answers = []; session.startedAt = Date.now();
      session.finished = false;
      session.items = shuffle(session.items);
      paint();
    });

    if (pct >= 90) confetti(56);
  }
}
