import { experimental_evaluate as evaluate } from 'ai';
import { config } from './config.js';

export async function evaluateWithJev(state) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error('AI_GATEWAY_API_KEY is missing. Add it as a GitHub Actions secret.');
  }

  const result = await evaluate({
    model: config.jevModel,
    state,
    questions: {
      anomaly: {
        type: 'boolean',
        instructions: 'Is the supplied BTC market state materially abnormal for a 4-hour-structure trader, rather than ordinary short-term noise?'
      },
      structureChange: {
        type: 'boolean',
        instructions: 'Does the supplied evidence indicate a meaningful change or attempted change in BTC 4-hour market structure?'
      },
      needsDeepAnalysis: {
        type: 'boolean',
        instructions: 'Would this market state benefit from immediate deep analysis now instead of simply waiting for the next scheduled 4-hour close review?'
      }
    },
    providerOptions: {
      gateway: { zeroDataRetention: true }
    },
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
