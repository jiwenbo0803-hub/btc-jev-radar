// GPT 深度分析层：计划内 4H 复盘，或 L3 高等级异常时才调用。
import { generateText } from 'ai';
import { config } from './config.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runModel(model, prompt) {
  const result = await generateText({
    model,
    prompt,
    maxOutputTokens: 1800
  });
  return result.text;
}

export async function deepAnalyze(state, decision, reason) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error('缺少 AI_GATEWAY_API_KEY，无法调用 GPT 深度分析。');
  }

  const prompt = `你是一名只基于给定数据工作的 BTC 市场结构分析员。不要猜测不存在的新闻或宏观催化，不给出买入/卖出指令。\n\n分析触发原因：${reason}\nJev 判断：${JSON.stringify(decision, null, 2)}\n市场状态：${JSON.stringify(state, null, 2)}\n\n请用中文输出 Markdown，严格包含：\n1. 4H 结构判断（趋势/震荡/突破尝试/跌破尝试）\n2. 当前动能与量价是否一致\n3. 关键观察位（只能使用输入中的 prior20High、prior20Low、EMA20、EMA60 和最近4H K线高低点）\n4. 风险提示（假突破、动能衰减、过热/超卖等，只在数据支持时写）\n5. 下一根 4H K线需要验证的 3-5 个条件\n6. 一句话结论\n\n如果数据不足，明确写“数据不足”，不要补造原因。`;

  const models = [config.gptModel, ...config.gptFallbackModels];
  const errors = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];

    // 主模型先额外重试一次；Gateway 偶发 5xx 不应直接让整次 4H 复盘失败。
    const attempts = i === 0 ? 2 : 1;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const text = await runModel(model, prompt);
        if (model !== config.gptModel) {
          console.warn(`GPT 主模型不可用，本次复盘已降级使用：${model}`);
        }
        return text;
      } catch (error) {
        const message = error?.message ?? String(error);
        errors.push(`${model} 第${attempt}次：${message}`);
        console.warn(`GPT 调用失败 [${model}] 第 ${attempt}/${attempts} 次：${message}`);
        if (attempt < attempts) await sleep(1500);
      }
    }
  }

  throw new Error(`GPT 深度分析全部失败：${errors.join(' | ')}`);
}
