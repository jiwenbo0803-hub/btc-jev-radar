export const config = {
  symbol: process.env.BTC_SYMBOL ?? 'BTCUSDT',
  binanceBaseUrl: process.env.BINANCE_BASE_URL ?? 'https://data-api.binance.vision',
  jevModel: process.env.JEV_MODEL ?? 'typesafe-ai/jev',
  gptModel: process.env.GPT_MODEL ?? 'openai/gpt-5.6-sol',
  thresholds: {
    l1Anomaly: 0.60,
    l2Anomaly: 0.82,
    l3Deep: 0.85,
    l3Structure: 0.75,
    l3Anomaly: 0.90
  }
};
