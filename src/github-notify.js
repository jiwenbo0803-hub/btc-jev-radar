// GitHub 手机推送模块：L2 / L3 异动自动创建 Issue，并指派给仓库拥有者。
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

function pct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

function humanFlags(flags = {}) {
  const map = {
    fastMove: '短周期快速波动',
    volumeShock: '成交量异常放大',
    structureBreak: '突破/跌破 4H 结构区间',
    extremeMomentum: '1H RSI 进入极端区间'
  };

  const active = Object.entries(flags)
    .filter(([, value]) => value)
    .map(([key]) => map[key] ?? key);

  return active.length ? active.join('、') : '无固定规则信号';
}

async function githubApi(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (!token) throw new Error('缺少 GITHUB_TOKEN，无法创建 GitHub Issue。');
  if (!repo) throw new Error('缺少 GITHUB_REPOSITORY，无法确定目标仓库。');

  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    signal: AbortSignal.timeout(20_000)
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GitHub API 请求失败：HTTP ${response.status}，${body.slice(0, 300)}`);
  }

  return response.status === 204 ? null : response.json();
}

function buildFingerprint(decision) {
  const { state, level } = decision;
  const flags = Object.entries(state.heuristicFlags ?? {})
    .filter(([, value]) => value)
    .map(([key]) => key)
    .sort()
    .join(',');

  const direction =
    state.returnsPct.h1 > 0.25 ? 'up' :
    state.returnsPct.h1 < -0.25 ? 'down' :
    'flat';

  const structure =
    state.structure4h.abovePrior20High ? 'break-high' :
    state.structure4h.belowPrior20Low ? 'break-low' :
    'inside-range';

  const raw = [level, direction, structure, flags].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

async function readOptional(path) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function main() {
  const decision = JSON.parse(await fs.readFile('out/decision.json', 'utf8'));

  if (decision.mode !== 'monitor') {
    console.log('当前不是常规雷达巡检，不创建异动 Issue。');
    return;
  }

  if (!['L2', 'L3'].includes(decision.level)) {
    console.log(`当前事件等级为 ${decision.level}，保持静默。`);
    return;
  }

  const fingerprint = buildFingerprint(decision);
  const cooldownHours = decision.level === 'L3' ? 2 : 4;
  const marker = `<!-- btc-alert-fingerprint:${fingerprint} -->`;

  // 检查最近 Issue，避免同一类异常每 30 分钟重复推送。
  const recent = await githubApi('/issues?state=all&sort=created&direction=desc&per_page=30');
  const cutoff = Date.now() - cooldownHours * 60 * 60 * 1000;

  const duplicate = recent.find(issue =>
    !issue.pull_request &&
    new Date(issue.created_at).getTime() >= cutoff &&
    (issue.body ?? '').includes(marker)
  );

  if (duplicate) {
    console.log(`同类 ${decision.level} 异常仍在 ${cooldownHours} 小时冷却期内，本次不重复推送。`);
    return;
  }

  const { state, jev, level } = decision;
  const report = await readOptional('out/report.md');
  const runUrl = process.env.GITHUB_SERVER_URL &&
    process.env.GITHUB_REPOSITORY &&
    process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null;

  const emoji = level === 'L3' ? '🚨' : '⚠️';
  const title = level === 'L3'
    ? `${emoji} BTC L3 重要异动｜$${state.price.toLocaleString('en-US')}｜GPT 深度分析`
    : `${emoji} BTC L2 明显异动｜$${state.price.toLocaleString('en-US')}`;

  const summary = [
    `## ${emoji} BTC ${level} 异动提醒`,
    '',
    `- 时间（UTC）：${state.timestampUtc}`,
    `- BTC：**$${state.price.toLocaleString('en-US')}**`,
    `- 5m / 15m / 1H / 4H：${state.returnsPct.m5}% / ${state.returnsPct.m15}% / ${state.returnsPct.h1}% / ${state.returnsPct.h4}%`,
    `- Jev 异常概率：**${pct(jev.anomaly)}**`,
    `- Jev 4H 结构变化概率：**${pct(jev.structureChange)}**`,
    `- Jev 需要深度分析概率：**${pct(jev.needsDeepAnalysis)}**`,
    `- 4H RSI14：${state.rsi14.h4}`,
    `- 4H EMA20 / EMA60：${state.trend4h.ema20} / ${state.trend4h.ema60}`,
    `- 最近 20 根 4H 前高 / 前低：${state.structure4h.prior20High} / ${state.structure4h.prior20Low}`,
    `- 固定规则信号：${humanFlags(state.heuristicFlags)}`,
    ''
  ].join('\n');

  let body = summary;

  if (level === 'L3') {
    body += report
      ? `## GPT 深度分析\n\n${report}\n`
      : '## GPT 深度分析\n\n本次 L3 未生成报告，请进入 Actions 检查运行日志。\n';
  } else {
    body += '## 系统处理\n\nL2 属于明显异常，本次只推送提醒，不额外调用 GPT。系统会继续巡检，并等待 4H 正式复盘或更高等级 L3 事件。\n';
  }

  if (runUrl) {
    body += `\n## 查看本次运行\n\n${runUrl}\n`;
  }

  body += `\n---\n\n同类事件冷却时间：${cooldownHours} 小时。\n\n${marker}\n`;

  const owner = process.env.GITHUB_REPOSITORY.split('/')[0];

  let created;
  try {
    created = await githubApi('/issues', {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        assignees: [owner]
      })
    });
  } catch (error) {
    // 如果 GitHub 拒绝自动指派，则退化为创建 Issue，不让报警本身失败。
    console.warn(`自动指派失败，改为仅创建 Issue：${error.message}`);
    created = await githubApi('/issues', {
      method: 'POST',
      body: JSON.stringify({ title, body })
    });
  }

  console.log(`已创建手机异动提醒：#${created.number} ${created.html_url}`);
}

await main();
