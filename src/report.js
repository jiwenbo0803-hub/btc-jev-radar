// 报告模块：生成中文摘要，并把重要 GPT 报告保存到 reports/。
import fs from 'node:fs/promises';
import path from 'node:path';

function pct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

export function decisionSummary(state, jev, level, mode) {
  return `# BTC Jev 行情雷达\n\n- 时间（UTC）：${state.timestampUtc}\n- 运行模式：${mode === 'four-hour' ? '4小时正式复盘' : '常规雷达巡检'}\n- BTC：$${state.price.toLocaleString('en-US')}\n- 5m / 15m / 1H / 4H：${state.returnsPct.m5}% / ${state.returnsPct.m15}% / ${state.returnsPct.h1}% / ${state.returnsPct.h4}%\n- Jev 异常概率：${pct(jev.anomaly)}\n- Jev 4H结构变化概率：${pct(jev.structureChange)}\n- Jev 需要深度分析概率：${pct(jev.needsDeepAnalysis)}\n- 事件等级：**${level}**\n- 4H RSI14：${state.rsi14.h4}\n- 4H EMA20 / EMA60：${state.trend4h.ema20} / ${state.trend4h.ema60}\n- 20根4H前高 / 前低：${state.structure4h.prior20High} / ${state.structure4h.prior20Low}\n`;
}

// 写入本次运行的临时结果。
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

// 如果本次调用了 GPT，则把正式报告长期保存到 reports/。
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
