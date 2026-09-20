// Telegram 通知模块
// 用于把 L2/L3 BTC 异动提醒发送到手机 Telegram。

import fs from 'node:fs/promises';

function escapeMarkdown(text = '') {
  return String(text).replace(/([_\-*\[\]()~`>#+=|{}.!])/g, '\\$1');
}

export async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('Telegram 未配置，跳过推送');
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'MarkdownV2'
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram 推送失败: ${await response.text()}`);
  }

  return true;
}

export async function sendRadarTelegram() {
  try {
    const summary = await fs.readFile('out/summary.md', 'utf8');
    const decision = JSON.parse(await fs.readFile('out/decision.json', 'utf8'));
    const level = decision.level;

    if (!['L2', 'L3'].includes(level)) {
      return false;
    }

    const prefix = level === 'L3'
      ? '🚨 BTC L3 重要异动'
      : '⚠️ BTC L2 异动提醒';

    return sendTelegramMessage(
      `${prefix}\n\n${escapeMarkdown(summary.slice(0, 3500))}`
    );
  } catch (error) {
    console.log('Telegram通知跳过:', error.message);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await sendRadarTelegram();
}
