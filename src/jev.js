// Jev 判断层：只负责快速判断，不负责长篇分析。
import { experimental_evaluate as evaluate } from 'ai';
import { config } from './config.js';

export async function evaluateWithJev(state) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error('缺少 AI_GATEWAY_API_KEY。请把 Vercel AI Gateway Key 添加到 GitHub Actions Secret。');
  }

  const result = await evaluate({
    model: config.jevModel,
    state,
    questions: {
      anomaly: {
        type: 'boolean',
        instructions: '对于主要观察 4 小时级别结构的 BTC 交易者来说，当前市场状态是否属于值得关注的异常，而不是普通的短周期噪声？'
      },
      structureChange: {
        type: 'boolean',
        instructions: '现有数据是否表明 BTC 的 4 小时级别市场结构正在发生、或正在尝试发生具有实际意义的变化？'
      },
      needsDeepAnalysis: {
        type: 'boolean',
        instructions: '相比等待下一次计划内 4 小时收盘复盘，当前市场状态是否值得立即启动一次更深入的 GPT 分析？'
      }
    },
    // Hobby 免费计划不支持 Zero Data Retention (ZDR)，因此不启用该企业功能。
    // 当前请求仅使用 BTC 行情和技术指标数据。
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(30_000)
  });

  return {
    anomaly: result.answers.anomaly.probability,
    structureChange: result.answers.structureChange.probability,
    needsDeepAnalysis: result.answers.needsDeepAnalysis.probability,
    providerMetadata: result.providerMetadata ?? null
  };
}

// 根据 Jev 概率划分 L0～L3；阈值目前只是 V0.1 初始值。
export function classifyLevel(jev) {
  const t = config.thresholds;
  if (
    jev.needsDeepAnalysis >= t.l3Deep &&
    (jev.structureChange >= t.l3Structure || jev.anomaly >= t.l3Anomaly)
  ) return 'L3';
  if (jev.anomaly >= t.l2Anomaly) return 'L2';
  if (jev.anomaly >= t.l1Anomaly) return 'L1';
  return 'L0';
}
