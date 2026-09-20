import { atr, ema, macd, pctChange, round, rsi, zScoreLatest } from './indicators.js';
import { config } from './config.js';

function latestReturn(candles) {
  return pctChange(candles.at(-1).close, candles.at(-2).close);
}

function highLow(candles, lookback = 20) {
  const sample = candles.slice(-(lookback + 1), -1);
  return {
    high: Math.max(...sample.map(c => c.high)),
    low: Math.min(...sample.map(c => c.low))
  };
}

export function buildMarketState({ m5, m15, h1, h4 }) {
  const price = m5.at(-1).close;
  const closes4h = h4.map(c => c.close);
  const closes1h = h1.map(c => c.close);
  const closes15m = m15.map(c => c.close);
  const closes5m = m5.map(c => c.close);
  const range4h = highLow(h4, 20);
  const atr4h = atr(h4, 14);
  const macd4h = macd(closes4h);
  const ema20 = ema(closes4h, 20);
  const ema60 = ema(closes4h, 60);

  const state = {
    timestampUtc: new Date().toISOString(),
    symbol: config.symbol,
    price: round(price, 2),
    returnsPct: {
      m5: round(latestReturn(m5), 3),
      m15: round(latestReturn(m15), 3),
      h1: round(latestReturn(h1), 3),
      h4: round(latestReturn(h4), 3)
    },
    rsi14: {
      m5: round(rsi(closes5m), 2),
      m15: round(rsi(closes15m), 2),
      h1: round(rsi(closes1h), 2),
      h4: round(rsi(closes4h), 2)
    },
    volumeZ: {
      m5: round(zScoreLatest(m5.map(c => c.quoteVolume), 20), 2),
      m15: round(zScoreLatest(m15.map(c => c.quoteVolume), 20), 2),
      h1: round(zScoreLatest(h1.map(c => c.quoteVolume), 20), 2),
      h4: round(zScoreLatest(h4.map(c => c.quoteVolume), 20), 2)
    },
    trend4h: {
      ema20: round(ema20, 2),
      ema60: round(ema60, 2),
      priceVsEma20Pct: round(pctChange(price, ema20), 3),
      priceVsEma60Pct: round(pctChange(price, ema60), 3),
      macdHistogram: round(macd4h?.histogram, 2),
      atrPct: round((atr4h / price) * 100, 3)
    },
    structure4h: {
      prior20High: round(range4h.high, 2),
      prior20Low: round(range4h.low, 2),
      distanceToHighPct: round(pctChange(price, range4h.high), 3),
      distanceToLowPct: round(pctChange(price, range4h.low), 3),
      abovePrior20High: price > range4h.high,
      belowPrior20Low: price < range4h.low,
      lastClosedCandle: {
        openTimeUtc: new Date(h4.at(-1).openTime).toISOString(),
        closeTimeUtc: new Date(h4.at(-1).closeTime).toISOString(),
        open: round(h4.at(-1).open, 2),
        high: round(h4.at(-1).high, 2),
        low: round(h4.at(-1).low, 2),
        close: round(h4.at(-1).close, 2)
      }
    }
  };

  state.heuristicFlags = {
    fastMove: Math.abs(state.returnsPct.m15) >= 1.2 || Math.abs(state.returnsPct.h1) >= 2.2,
    volumeShock: state.volumeZ.m5 >= 2.5 || state.volumeZ.m15 >= 2.5,
    structureBreak: state.structure4h.abovePrior20High || state.structure4h.belowPrior20Low,
    extremeMomentum: state.rsi14.h1 >= 75 || state.rsi14.h1 <= 25
  };
  state.heuristicPrefilter = Object.values(state.heuristicFlags).some(Boolean);

  return state;
}
