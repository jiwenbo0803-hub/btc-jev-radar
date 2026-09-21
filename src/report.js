// 报告模块：生成中文摘要，并把重要 GPT 报告保存到 reports/。
import fs from 'node:fs/promises';
import path from 'node:path';

function pct(v) {
  return typeof v === 'number' && Number.isFinite(v)
    ? `${(v * 100).toFixed(1)}%`
    : '暂缺';
}

export function decisionSummary(state, jev, level, mode) {
  const status = state.marketStatus ?? {};

  return `# BTC Jev 行情雷达

- 时间（UTC）：${state.timestampUtc}
- 运行模式：${mode === 'four-hour' ? '4小时正式复盘' : '常规雷达巡检'}
- BTC：$${state.price.toLocaleString('en-US')}

## AI异常判断

- Jev 异常概率：${pct(jev.anomaly)}
- Jev 4H结构变化概率：${pct(jev.structureChange)}
- Jev 需要深度分析概率：${pct(jev.needsDeepAnalysis)}
- 事件等级：**${level}**
- Jev 状态：${jev.unavailable ? `本次不可用（${jev.error ?? '未知错误'}）` : '正常'}

## BTC 4H交易状态

- 趋势：${status.trend ?? '未计算'}
- 动能：${status.momentum ?? '未计算'}
- 当前阶段：**${status.phase ?? '未计算'}**

## 关键位置

- EMA20：${state.trend4h.ema20}
- EMA60：${state.trend4h.ema60}
- 当前价格距离EMA20：${state.trend4h.priceVsEma20Pct}%
- 当前价格距离EMA60：${state.trend4h.priceVsEma60Pct}%
- 20根4H前高：${state.structure4h.prior20High}
- 距离前高：${state.structure4h.distanceToHighPct}%
- 20根4H前低：${state.structure4h.prior20Low}
- 距离前低：${state.structure4h.distanceToLowPct}%

## 动能指标

- 5m / 15m / 1H / 4H：${state.returnsPct.m5}% / ${state.returnsPct.m15}% / ${state.returnsPct.h1}% / ${state.returnsPct.h4}%
- 4H RSI14：${state.rsi14.h4}

## 未来观察

- 上方：关注20根4H前高突破
- 下方：关注EMA20趋势支撑
`;
}

export async function writeOutputs({ state, jev, level, mode, analysis }) {
  await fs.mkdir('out', { recursive: true });
  await fs.writeFile('out/decision.json', JSON.stringify({ state, jev, level, mode }, null, 2));
  const summary = decisionSummary(state, jev, level, mode);
  await fs.writeFile('out/summary.md', summary);
  if (analysis) {
    await fs.writeFile('out/report.md', `${summary}\n---\n\n${analysis.trim()}\n`);
  } else {
    await fs.rm('out/report.md', { force: true });
  }
}

export async function persistReportIfPresent() {
  try {
    const report = await fs.readFile('out/report.md', 'utf8');
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const stamp = now.toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
    const dir = path.join('reports', day);
    await fs.mkdir(dir, { recursive: true });
    const target = path.join(dir, `${stamp}.md`);
    await fs.writeFile(target, report);
    await fs.writeFile(path.join('reports', 'latest.md'), report);
    return target;
  } catch {
    return null;
  }
}
