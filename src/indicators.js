// 技术指标计算工具。函数名保留 EMA / RSI / MACD / ATR 等英文缩写，因为它们是交易领域通用名称。
// 计算涨跌幅（百分比）。
export function pctChange(current, previous) {
  return previous === 0 ? 0 : ((current / previous) - 1) * 100;
}

// 简单移动平均线 SMA。
export function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// 计算一整段 EMA 序列。
export function emaSeries(values, period) {
  if (values.length < period) return [];
  const multiplier = 2 / (period + 1);
  const out = [];
  let current = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(current);
  for (let i = period; i < values.length; i += 1) {
    current = (values[i] - current) * multiplier + current;
    out.push(current);
  }
  return out;
}

// 返回最新一根 EMA。
export function ema(values, period) {
  const series = emaSeries(values, period);
  return series.at(-1) ?? null;
}

// RSI 相对强弱指标。
export function rsi(values, period = 14) {
  if (values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// MACD：返回主线、信号线和柱体。
export function macd(values, fast = 12, slow = 26, signal = 9) {
  if (values.length < slow + signal) return null;
  const fastSeries = emaSeries(values, fast);
  const slowSeries = emaSeries(values, slow);
  const offset = fastSeries.length - slowSeries.length;
  const macdLine = slowSeries.map((slowValue, i) => fastSeries[i + offset] - slowValue);
  const signalSeries = emaSeries(macdLine, signal);
  const line = macdLine.at(-1);
  const signalLine = signalSeries.at(-1);
  return { line, signal: signalLine, histogram: line - signalLine };
}

// ATR 平均真实波幅，用来衡量波动率。
export function atr(candles, period = 14) {
  if (candles.length <= period) return null;
  const trs = [];
  for (let i = 1; i < candles.length; i += 1) {
    const c = candles[i];
    const prevClose = candles[i - 1].close;
    trs.push(Math.max(
      c.high - c.low,
      Math.abs(c.high - prevClose),
      Math.abs(c.low - prevClose)
    ));
  }
  let current = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i += 1) {
    current = ((current * (period - 1)) + trs[i]) / period;
  }
  return current;
}

// 最新值 Z-Score；当前主要用来识别突然放量。
export function zScoreLatest(values, lookback = 20) {
  if (values.length < lookback + 1) return null;
  const latest = values.at(-1);
  const sample = values.slice(-(lookback + 1), -1);
  const mean = sample.reduce((a, b) => a + b, 0) / sample.length;
  const variance = sample.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / sample.length;
  const sd = Math.sqrt(variance);
  return sd === 0 ? 0 : (latest - mean) / sd;
}

// 统一处理小数位。
export function round(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}
