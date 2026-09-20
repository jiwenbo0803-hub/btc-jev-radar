import { config } from './config.js';

const FALLBACK_BASES = [
  config.binanceBaseUrl,
  'https://data-api.binance.vision',
  'https://api.binance.com',
  'https://api.binance.us'
].filter((x, i, a) => a.indexOf(x) === i);

function parseKline(row) {
  return {
    openTime: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
    closeTime: Number(row[6]),
    quoteVolume: Number(row[7]),
    trades: Number(row[8])
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'btc-jev-radar/0.1' },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 180)}`);
  }
  return response.json();
}

export async function fetchKlines(interval, limit = 220) {
  let lastError;
  for (const base of FALLBACK_BASES) {
    try {
      const url = new URL('/api/v3/klines', base);
      url.searchParams.set('symbol', config.symbol);
      url.searchParams.set('interval', interval);
      url.searchParams.set('limit', String(limit));
      const rows = await fetchJson(url);
      const now = Date.now();
      const parsed = rows.map(parseKline);
      const closed = parsed.filter(k => k.closeTime < now);
      if (closed.length < Math.min(30, limit - 1)) {
        throw new Error(`Too few closed ${interval} candles: ${closed.length}`);
      }
      return closed;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`All Binance endpoints failed for ${interval}: ${lastError?.message ?? lastError}`);
}

export async function fetchAllTimeframes() {
  const [m5, m15, h1, h4] = await Promise.all([
    fetchKlines('5m', 180),
    fetchKlines('15m', 180),
    fetchKlines('1h', 220),
    fetchKlines('4h', 220)
  ]);
  return { m5, m15, h1, h4 };
}
