/* ==========================================================================
   services/speech — 语音合成（朗读）与语音识别（跟读）
   浏览器原生能力封装：SpeechSynthesis + SpeechRecognition / webkitSpeechRecognition。
   在不支持的环境下优雅降级，由视图层提供「键盘输入」备选方案。
   ========================================================================== */

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
const Recognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export const ttsSupported = !!synth;
export const asrSupported = !!Recognition;

let voices = [];
let voicesReady = false;

function loadVoices() {
  if (!synth) return;
  voices = synth.getVoices() || [];
  voicesReady = voices.length > 0;
}
if (synth) {
  loadVoices();
  synth.addEventListener?.('voiceschanged', loadVoices);
}

/** 当前环境是否存在可用的语音音色（部分浏览器/系统没有安装音色包） */
export function voicesAvailable() {
  if (!synth) return false;
  if (!voicesReady) loadVoices();
  return voices.length > 0;
}

/** 挑选最合适的目标语言音色 */
export function bestVoiceFor(lang) {
  if (!voicesReady) loadVoices();
  if (!voices.length) return null;
  const prefix = lang.slice(0, 2).toLowerCase();
  const exact = voices.filter((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
  const same = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  const pool = exact.length ? exact : same;
  if (!pool.length) return null;
  // 优先本地音色与女声/男声的常规命名
  return pool.find((v) => v.localService) || pool[0];
}

let currentUtterance = null;

/**
 * 朗读一段文本
 * @returns {Promise<'ended'|'unsupported'>}
 */
export function speak(text, lang = 'en-US', { rate = 0.92, onStart, onEnd } = {}) {
  return new Promise((resolve) => {
    if (!synth) { onEnd?.(); resolve('unsupported'); return; }
    stopSpeaking();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voice = bestVoiceFor(lang);
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1;
    u.onstart = () => onStart?.();
    u.onend = () => { currentUtterance = null; onEnd?.(); resolve('ended'); };
    u.onerror = () => { currentUtterance = null; onEnd?.(); resolve('ended'); };
    currentUtterance = u;
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (!synth) return;
  try { synth.cancel(); } catch { /* noop */ }
  currentUtterance = null;
}

export function isSpeaking() { return !!synth && synth.speaking; }

/**
 * 创建一次语音识别会话
 * 返回 { supported, start(), stop(), abort() }
 */
export function createRecognizer({ lang = 'en-US', onPartial, onFinal, onEnd, onError } = {}) {
  if (!Recognition) {
    return { supported: false, start() {}, stop() {}, abort() {} };
  }
  const rec = new Recognition();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let finalText = '';

  rec.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) finalText += res[0].transcript;
      else interim += res[0].transcript;
    }
    onPartial?.(finalText + interim, !!interim);
  };
  rec.onerror = (e) => {
    const map = {
      'not-allowed': '麦克风权限被拒绝，请在浏览器地址栏允许麦克风权限。',
      'no-speech': '没有捕捉到语音，请靠近麦克风再试一次。',
      'audio-capture': '未检测到可用的麦克风设备。',
      network: '语音识别服务网络异常。',
    };
    onError?.(map[e.error] || `识别出错：${e.error}`);
  };
  rec.onend = () => onEnd?.(finalText);

  return {
    supported: true,
    start() {
      finalText = '';
      try { rec.start(); return true; } catch { return false; }
    },
    stop() { try { rec.stop(); } catch { /* noop */ } },
    abort() { try { rec.abort(); } catch { /* noop */ } },
  };
}

/** 把中文提示时长格式化成 mm:ss */
export const mmss = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
