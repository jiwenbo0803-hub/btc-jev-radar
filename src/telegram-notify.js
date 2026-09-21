// Telegram 通知模块
// - 常规雷达：仅 L2/L3 异动推送
// - 4H 正式复盘：每次复盘完成后推送精简中文结论
// - test 模式：不依赖行情等级，专门验证 Bot Token / Chat ID / Telegram API 链路

import fs from 'node:fs/promises';

function pct(v) {
  return typeof v === 'number' && Number.isFinite(v)
    ? (v * 100).toFixed(0) + '%'
    : '暂缺';
}

function plain(text = '') {
  return String(text)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\x60/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitTelegram(text, max = 3800) {
  const input = String(text || '').trim();
  if (input.length <= max) return [input];

  const chunks = [];
  let rest = input;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max);
    if (cut < max * 0.6) cut = max;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) throw new Error('缺少 TELEGRAM_BOT_TOKEN');
  if (!chatId) throw new Error('缺少 TELEGRAM_CHAT_ID');

  const url = 'https://api.telegram.org/bot' + token + '/sendMessage';

  for (const chunk of splitTelegram(message)) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        disable_web_page_preview: true
      })
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error('Telegram API 返回错误：HTTP ' + response.status + ' ' + body);
    }

    let data;
    try { data = JSON.parse(body); } catch {}
    if (data && data.ok === false) {
      throw new Error('Telegram API 返回失败：' + body);
    }
  }

  return true;
}

export async function sendTelegramTest() {
  const now = new Date().toISOString();
  await sendTelegramMessage(
    '✅ BTC Jev Radar Telegram 测试成功\n\n' +
    'GitHub Actions → Telegram 链路正常\n' +
    'UTC：' + now
  );
  console.log('Telegram 测试消息发送成功');
  return true;
}

function radarMessage(decision, report) {
  const { state, jev, level } = decision;
  if (!['L2', 'L3'].includes(level)) return null;

  const prefix = level === 'L3'
    ? '🚨 BTC L3 重要异动'
    : '⚠️ BTC L2 异动提醒';

  const lines = [
    prefix,
    '',
    'BTC：$' + Number(state.price).toLocaleString('en-US'),
    '阶段：' + (state.marketStatus?.phase ?? '暂缺'),
    '趋势：' + (state.marketStatus?.trend ?? '暂缺'),
    'Jev：异常 ' + pct(jev.anomaly) + '｜结构 ' + pct(jev.structureChange) + '｜深析 ' + pct(jev.needsDeepAnalysis),
    '4H RSI14：' + (state.rsi14?.h4 ?? '暂缺'),
    '前高：' + (state.structure4h?.prior20High ?? '暂缺') + '｜EMA20：' + (state.trend4h?.ema20 ?? '暂缺')
  ];

  if (level === 'L3' && report) {
    const parts = report.split(/\n---\n/);
    const analysis = plain(parts.length > 1 ? parts.slice(1).join('\n---\n') : '');
    if (analysis) lines.push('', 'AI结论：', analysis);
  }

  return lines.join('\n');
}

function fourHourMessage(decision, report) {
  const { state, jev, level } = decision;
  const parts = String(report || '').split(/\n---\n/);
  const analysis = plain(parts.length > 1 ? parts.slice(1).join('\n---\n') : '');

  const lines = [
    '📊 BTC 4小时正式复盘',
    '',
    'BTC：$' + Number(state.price).toLocaleString('en-US'),
    '趋势：' + (state.marketStatus?.trend ?? '暂缺'),
    '阶段：' + (state.marketStatus?.phase ?? '暂缺'),
    'Jev等级：' + (level ?? 'N/A') + '｜异常 ' + pct(jev.anomaly) + '｜结构 ' + pct(jev.structureChange),
    '4H RSI14：' + (state.rsi14?.h4 ?? '暂缺'),
    '前高：' + (state.structure4h?.prior20High ?? '暂缺') + '｜EMA20：' + (state.trend4h?.ema20 ?? '暂缺'),
    'EMA60：' + (state.trend4h?.ema60 ?? '暂缺') + '｜前低：' + (state.structure4h?.prior20Low ?? '暂缺')
  ];

  if (analysis) lines.push('', 'AI结论：', analysis);
  return lines.join('\n');
}

export async function sendRadarTelegram() {
  const decision = JSON.parse(await fs.readFile('out/decision.json', 'utf8'));

  let report = '';
  try {
    report = await fs.readFile('out/report.md', 'utf8');
  } catch {}

  const message = decision.mode === 'four-hour'
    ? fourHourMessage(decision, report)
    : radarMessage(decision, report);

  if (!message) {
    console.log('本次雷达等级未达到 L2/L3，不发送 Telegram；这属于正常情况');
    return false;
  }

  await sendTelegramMessage(message);
  console.log('Telegram 行情消息发送成功');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] || 'send';

  try {
    if (mode === 'test') {
      await sendTelegramTest();
    } else {
      await sendRadarTelegram();
    }
  } catch (error) {
    console.error('Telegram 推送失败：' + (error?.message || String(error)));
    process.exitCode = 1;
  }
}
