// 主程序入口：串联行情获取 → 市场状态 → Jev 判断 → 必要时 GPT 深度分析 → 输出报告。
import 'dotenv/config';
import { fetchAllTimeframes } from './binance.js';
import { buildMarketState } from './market-state.js';
import { classifyLevel, evaluateWithJev } from './jev.js';
import { deepAnalyze } from './gpt.js';
import { persistReportIfPresent, writeOutputs } from './report.js';

const mode = process.argv[2] ?? 'monitor';
if (!['monitor', 'four-hour'].includes(mode)) {
  throw new Error(`未知运行模式：${mode}`);
}

const candles = await fetchAllTimeframes();
const state = buildMarketState(candles);

let jev;
let level;

try {
  jev = await evaluateWithJev(state);
  level = classifyLevel(jev);
} catch (error) {
  // 常规雷达本身依赖 Jev，Jev 挂了就应该失败；
  // 计划内 4H 正式复盘则不能因为 Jev 临时故障而整次作废。
  if (mode === 'monitor') throw error;

  jev = {
    anomaly: null,
    structureChange: null,
    needsDeepAnalysis: null,
    providerMetadata: null,
    unavailable: true,
    error: error?.message ?? String(error)
  };
  level = 'N/A';
  console.warn(`Jev 本次不可用，4H 正式复盘继续执行：${jev.error}`);
}

let analysis = null;
let triggerReason = null;

if (mode === 'four-hour') {
  triggerReason = '计划内 4H 收盘复盘';
} else if (level === 'L3') {
  triggerReason = state.heuristicPrefilter
    ? 'L3 异常（固定规则同时确认异常）'
    : 'L3 异常（Jev 高置信度触发）';
}

if (triggerReason) {
  analysis = await deepAnalyze(state, { ...jev, level }, triggerReason);
}

await writeOutputs({ state, jev, level, mode, analysis });
const persisted = await persistReportIfPresent();

// 控制台保留结构化 JSON，方便 GitHub Actions 和后续程序继续读取。
console.log(JSON.stringify({
  timestampUtc: state.timestampUtc,
  price: state.price,
  level,
  jev,
  heuristicPrefilter: state.heuristicPrefilter,
  deepAnalysisTriggered: Boolean(analysis),
  reportPath: persisted
}, null, 2));
