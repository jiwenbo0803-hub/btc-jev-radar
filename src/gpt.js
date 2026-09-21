// GPT 深度分析层：计划内 4H 复盘，或 L3 高等级异常时才调用。
import { generateText } from 'ai';
import { config } from './config.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function localFallbackSummary(state) {
  const status = state.marketStatus || {};
  const t = state.trend4h || {};
  const s = state.structure4h || {};
  const r = state.rsi14 || {};
  const v = state.volumeZ || {};

  const momentum = Number(t.macdHistogram) >= 0 ? 'MACD动能偏强' : 'MACD动能有所回落';
  const volume = Number(v.h4) >= 0.5 ? '4H量能偏强' : Number(v.h4) <= -0.5 ? '4H量能偏弱' : '4H量能一般';

  return [
    '## 1. 4H结构判断\n' + (status.phase || status.trend || '数据不足') + '。',
    '## 2. 动能与量价\nRSI14 为 ' + (r.h4 ?? '数据不足') + '，' + momentum + '，' + volume + '。',
    '## 3. 关键位置\n前高 ' + (s.prior20High ?? '数据不足') + '；EMA20 ' + (t.ema20 ?? '数据不足') + '；EMA60 ' + (t.ema60 ?? '数据不足') + '；前低 ' + (s.prior20Low ?? '数据不足') + '。',
    '## 4. 风险提示\n重点观察前高附近是否受阻，以及价格是否跌回 EMA20 下方。',
    '## 5. 下一根4H验证\n① 是否突破前高；② 是否守住 EMA20；③ RSI 是否继续走强；④ 4H量能是否同步放大。',
    '## 6. 一句话结论\n' + (status.trend || '结构待确认') + '，当前等待关键位确认方向。'
  ].join('\n\n');
}

function cleanFinalText(text, state) {
  let cleaned = String(text || '').trim();

  // 免费兜底模型偶尔会输出任务解析/思考草稿；发现后直接弃用，绝不写入报告。
  if (/Analyze the Request|Analyze the Data|Drafting the Content|chain of thought|reasoning process/i.test(cleaned)) {
    return localFallbackSummary(state);
  }

  const markers = [
    /##\s*1[.、]?\s*4H结构判断/i,
    /\*\*1[.、]?\s*4H结构判断\*\*/i,
    /1[.、]\s*4H结构判断/i
  ];
  let start = -1;
  for (const pattern of markers) {
    const match = cleaned.match(pattern);
    if (match && match.index != null && (start < 0 || match.index < start)) start = match.index;
  }
  if (start > 0) cleaned = cleaned.slice(start);

  cleaned = cleaned
    .replace(/^\x60\x60\x60(?:markdown)?\s*/i, '')
    .replace(/\x60\x60\x60\s*$/i, '')
    .trim();

  const chineseChars = (cleaned.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseChars < 40 || cleaned.length > 1800) {
    return localFallbackSummary(state);
  }

  return cleaned;
}

async function runModel(model, prompt, state) {
  const result = await generateText({
    model,
    system: '只输出最终结论。禁止输出思考过程、任务解析、分析草稿、英文说明或自我解释。全文使用中文 Markdown，不超过 500 字。',
    prompt,
    maxOutputTokens: 700
  });
  return cleanFinalText(result.text, state);
}

function isAccessDenied(message = '') {
  return /free tier users do not have access|upgrade to paid credits|does not have access/i.test(message);
}

export async function deepAnalyze(state, decision, reason) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error('缺少 AI_GATEWAY_API_KEY，无法调用 GPT 深度分析。');
  }

  const prompt = [
    '请根据以下数据直接给出最终复盘，不展示任何推理过程。',
    '',
    '触发原因：' + reason,
    'Jev判断：' + JSON.stringify(decision),
    '市场状态：' + JSON.stringify(state),
    '',
    '严格按以下 6 项输出，每项 1-2 句，全文控制在 500 字以内：',
    '## 1. 4H结构判断',
    '## 2. 动能与量价',
    '## 3. 关键位置',
    '## 4. 风险提示',
    '## 5. 下一根4H验证',
    '## 6. 一句话结论',
    '',
    '要求：只写中文最终结论；不写 Analyze、Drafting、Reasoning 等过程内容；不猜新闻或宏观催化；不给买入卖出指令；关键位置只使用输入已有数据；数据不足就写“数据不足”。'
  ].join('\n');

  const models = [config.gptModel, ...config.gptFallbackModels];
  const errors = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const attempts = i === 0 ? 2 : 1;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const text = await runModel(model, prompt, state);
        console.log('4H 深度分析实际使用模型：' + model);
        if (model !== config.gptModel) {
          console.warn('GPT-5.6 Sol 当前不可用，本次复盘已自动降级：' + model);
        }
        return text;
      } catch (error) {
        const message = error?.message || String(error);
        errors.push(model + ' 第' + attempt + '次：' + message);
        console.warn('GPT 调用失败 [' + model + '] 第 ' + attempt + '/' + attempts + ' 次：' + message);

        if (isAccessDenied(message)) break;
        if (attempt < attempts) await sleep(1500);
      }
    }
  }

  throw new Error('GPT 深度分析全部失败：' + errors.join(' | '));
}
