import 'dotenv/config';
import { fetchAllTimeframes } from './binance.js';
import { buildMarketState } from './market-state.js';
import { classifyLevel, evaluateWithJev } from './jev.js';
import { deepAnalyze } from './gpt.js';
import { persistReportIfPresent, writeOutputs } from './report.js';

const mode = process.argv[2] ?? 'monitor';
if (!['monitor', 'four-hour'].includes(mode)) {
  throw new Error(`Unknown mode: ${mode}`);
}

const candles = await fetchAllTimeframes();
const state = buildMarketState(candles);
const jev = await evaluateWithJev(state);
const level = classifyLevel(jev);

let analysis = null;
let triggerReason = null;

if (mode === 'four-hour') {
  triggerReason = '计划内 4H 收盘复盘';
} else if (level === 'L3' && state.heuristicPrefilter) {
  triggerReason = 'L3 异常 + 规则预筛确认';
}

if (triggerReason) {
  analysis = await deepAnalyze(state, { ...jev, level }, triggerReason);
}

await writeOutputs({ state, jev, level, mode, analysis });
const persisted = await persistReportIfPresent();

console.log(JSON.stringify({
  timestampUtc: state.timestampUtc,
  price: state.price,
  level,
  jev,
  heuristicPrefilter: state.heuristicPrefilter,
  deepAnalysisTriggered: Boolean(analysis),
  reportPath: persisted
}, null, 2));
