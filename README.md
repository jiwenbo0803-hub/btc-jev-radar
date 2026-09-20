# BTC Jev Radar

BTC 4H market-structure radar using **Binance public market data + Jev + GPT-5.6 Sol + GitHub Actions**.

## V0.1 design

- Source granularity: 5m / 15m / 1H / 4H closed BTCUSDT candles.
- Routine monitor: every 30 minutes by default.
- Jev: every monitor run, returns probabilities for anomaly, 4H structure change, and need for immediate deep analysis.
- L0: normal, log only.
- L1: noteworthy, log only.
- L2: clear anomaly, log + Actions summary; no GPT call.
- L3: high-confidence anomaly plus deterministic market prefilter -> GPT-5.6 Sol deep analysis.
- Scheduled 4H review: six times per day, always produces a GPT report.
- Reports: committed under `reports/YYYY-MM-DD/` only when a GPT report is generated.

The 30-minute GitHub Actions schedule is intentional for a **private repository**. GitHub bills private-repository hosted-runner jobs by the minute, so 5-minute scheduling can burn through included monthly minutes quickly. The source still reads 5-minute candles, so the radar retains intraperiod detail. If the repository is public or later moves to a cheap always-on runner, polling can be tightened to 5–15 minutes.

## One required secret

Create a Vercel AI Gateway key and add this repository secret:

`AI_GATEWAY_API_KEY`

The same key routes:

- `typesafe-ai/jev`
- `openai/gpt-5.6-sol`

No Binance key is required. The default source is Binance's official market-data-only endpoint `https://data-api.binance.vision`.

## Run locally

```bash
npm install
cp .env.example .env
# put AI_GATEWAY_API_KEY in .env
npm run monitor
npm run four-hour
```

## Decision policy

Initial thresholds are deliberately conservative and are **not assumed to be calibrated**. They should be tuned after collecting labeled examples:

- L1: Jev anomaly >= 0.60
- L2: Jev anomaly >= 0.82
- L3: needsDeepAnalysis >= 0.85 AND (structureChange >= 0.75 OR anomaly >= 0.90)
- GPT L3 escalation additionally requires a deterministic prefilter: fast move, volume shock, 20x4H structure break, or extreme 1H RSI.

Jev probability is a model estimate, not a guarantee. V0.1 is an observation and research system, not an automated trading system.

## Next upgrades after V0.1 proves useful

1. Add derivatives: open interest, funding, liquidation data.
2. Add persistent event deduplication and cool-down state.
3. Add phone push notifications only for L2/L3.
4. Backtest the thresholds against labeled historical BTC events.
5. Move to 5-minute polling on a public/self-hosted/cheap cloud runner if latency becomes important.
