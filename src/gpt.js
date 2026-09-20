import { generateText } from 'ai';
import { config } from './config.js';

export async function deepAnalyze(state, decision, reason) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error('AI_GATEWAY_API_KEY is missing.');
  }

  const prompt = `你是一名只基于给定数据工作的 BTC 市场结构分析员。不要猜测不存在的新闻或宏观催化，不给出买入/卖出指令。\n\n分析触发原因：${reason}\nJev 判断：${JSON.stringify(decision, null, 2)}\n市场状态：${JSON.stringify(state, null, 2)}\n\n请用中文输出 Markdown，严格包含：\n1. 4H 结构判断（趋势/震荡/突破尝试/跌破尝试）\n2. 当前动能与量价是否一致\n3. 关键观察位（只能使用输入中的 prior20High、prior20Low、EMA20、EMA60 和最近4H K线高低点）\n4. 风险提示（假突破、动能衰减、过热/超卖等，只在数据支持时写）\n5. 下一根 4H K线需要验证的 3-5 个条件\n6. 一句话结论\n\n如果数据不足，明确写“数据不足”，不要补造原因。`;

  const result = await generateText({
    model: config.gptModel,
    prompt,
    reasoning: 'medium',
    maxOutputTokens: 1800,
    providerOptions: {
      gateway: { zeroDataRetention: true }
    }
  });
  return result.text;
}
