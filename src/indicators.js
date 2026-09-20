export function pctChange(current, previous) {
  return previous === 0 ? 0 : ((current / previous) - 1) * 100;
}

export function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

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

export function ema(values, period) {
  const series = emaSeries(values, period);
  return series.at(-1) ?? null;
}

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

export function zScoreLatest(values, lookback = 20) {
  if (values.length < lookback + 1) return null;
  const latest = values.at(-1);
  const sample = values.slice(-(lookback + 1), -1);
  const mean = sample.reduce((a, b) => a + b, 0) / sample.length;
  const variance = sample.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / sample.length;
  const sd = Math.sqrt(variance);
  return sd === 0 ? 0 : (latest - mean) / sd;
}

export function round(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}
