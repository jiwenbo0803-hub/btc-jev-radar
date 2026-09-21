// 项目统一配置。变量名和环境变量保留英文，避免破坏 Node.js、GitHub Actions 和 API 兼容性。
export const config = {
  // 默认监控 BTCUSDT；也可通过环境变量修改。
  symbol: process.env.BTC_SYMBOL ?? 'BTCUSDT',
  binanceBaseUrl: process.env.BINANCE_BASE_URL ?? 'https://data-api.binance.vision',
  jevModel: process.env.JEV_MODEL ?? 'typesafe-ai/jev',

  // 4H 正式复盘优先使用 Sol；Gateway/Provider 临时异常时依次降级，
  // 避免因为单一模型瞬时 5xx 导致整次复盘直接失败。
  gptModel: process.env.GPT_MODEL ?? 'openai/gpt-5.6-sol',
  gptFallbackModels: [
    process.env.GPT_FALLBACK_MODEL_1 ?? 'openai/gpt-5.6-terra',
    process.env.GPT_FALLBACK_MODEL_2 ?? 'openai/gpt-5.6-luna'
  ],

  // V0.1 初始阈值，后续需要根据真实运行结果校准。
  thresholds: {
    l1Anomaly: 0.60,
    l2Anomaly: 0.82,
    l3Deep: 0.85,
    l3Structure: 0.75,
    l3Anomaly: 0.90
  }
};
