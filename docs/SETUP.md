# Setup

## 1. Create the AI Gateway key

In the Vercel Dashboard, open **AI Gateway → API Keys → Create Key**.

Recommended for this prototype:

- Name: `btc-jev-radar`
- Add a small monthly spend quota if your account supports key budgets.
- Copy the key immediately and do not commit it to this repository.

## 2. Add the GitHub Actions secret

Open this repository in GitHub and go to:

**Settings → Secrets and variables → Actions → New repository secret**

Create:

- Name: `AI_GATEWAY_API_KEY`
- Secret: paste the Vercel AI Gateway key

## 3. First manual test

Open **Actions** and run **BTC Radar Monitor** with `Run workflow`.

Expected output:

- `out/summary.md` appears in the job summary/artifact.
- Jev returns three probabilities: anomaly, 4H structure change, and need for deep analysis.
- GPT is only called during an L3 event that also passes the deterministic prefilter.

Then manually run **BTC 4H Review**. This path always invokes GPT-5.6 Sol and should produce `out/report.md` and a committed report under `reports/YYYY-MM-DD/`.

## 4. Automatic schedule

- Radar monitor: every 30 minutes.
- Formal 4H review: 7 minutes after Binance's 00/04/08/12/16/20 UTC 4H closes.

## Security

Never put the gateway key in `.env.example`, source files, issue comments, workflow YAML, or chat screenshots. Store it only as a GitHub Actions secret (and optionally in a local untracked `.env`).
