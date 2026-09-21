// 项目统一配置。可通过本地 .env 或 GitHub Actions Variables 覆盖默认值。
export const config = {
  symbol: process.env.BTC_SYMBOL || 'BTCUSDT',
  binanceBaseUrl: process.env.BINANCE_BASE_URL || 'https://data-api.binance.vision',
  jevModel: process.env.JEV_MODEL || 'typesafe-ai/jev',

  // 深度分析优先模型。不同 Vercel AI Gateway 账户可访问的模型可能不同，
  // 因此允许通过 GPT_MODEL / GPT_FALLBACK_MODEL_1 自定义。
  gptModel: process.env.GPT_MODEL || 'openai/gpt-5.6-sol',
  gptFallbackModels: [
    process.env.GPT_FALLBACK_MODEL_1 || 'inclusionai/ling-3.0-flash-vl-free'
  ],

  // V0.1 初始阈值。建议先跑一段时间，再根据自己的观察周期校准。
  thresholds: {
    l1Anomaly: 0.60,
    l2Anomaly: 0.82,
    l3Deep: 0.85,
    l3Structure: 0.75,
    l3Anomaly: 0.90
  }
};
