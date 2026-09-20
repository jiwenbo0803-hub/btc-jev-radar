// Binance 行情数据读取模块：负责获取 5m / 15m / 1H / 4H 已收盘 K 线。
import { config } from './config.js';

// 按顺序尝试多个官方行情接口；前一个不可用时自动切换备用地址。
const FALLBACK_BASES = [
  config.binanceBaseUrl,
  'https://data-api.binance.vision',
  'https://api.binance.com',
  'https://api.binance.us'
].filter((x, i, a) => a.indexOf(x) === i);

// 把 Binance 原始数组转换成更容易读取的 K 线对象。
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

// 通用 JSON 请求，15 秒超时。
async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'btc-jev-radar/0.1' },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`行情接口请求失败：HTTP ${response.status}，${body.slice(0, 180)}`);
  }
  return response.json();
}

// 获取指定周期的已收盘 K 线，避免把正在形成的 K 线当作最终数据。
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
        throw new Error(`${interval} 周期已收盘 K 线数量不足：${closed.length} 根`);
      }
      return closed;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`所有 Binance 行情接口均请求失败（周期：${interval}）：${lastError?.message ?? lastError}`);
}

// 一次性获取四个周期，供后续构建完整市场状态。
export async function fetchAllTimeframes() {
  const [m5, m15, h1, h4] = await Promise.all([
    fetchKlines('5m', 180),
    fetchKlines('15m', 180),
    fetchKlines('1h', 220),
    fetchKlines('4h', 220)
  ]);
  return { m5, m15, h1, h4 };
}
