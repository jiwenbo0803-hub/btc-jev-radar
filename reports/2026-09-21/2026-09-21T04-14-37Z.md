# BTC Jev 行情雷达

- 时间（UTC）：2026-09-21T04:14:16.569Z
- 运行模式：4小时正式复盘
- BTC：$81,325.76

## AI异常判断

- Jev 异常概率：34.0%
- Jev 4H结构变化概率：28.0%
- Jev 需要深度分析概率：36.0%
- 事件等级：**L0**
- Jev 状态：正常

## BTC 4H交易状态

- 趋势：🟢 4H多头趋势
- 动能：68.7 RSI动能偏强
- 当前阶段：**高位震荡等待突破**

## 关键位置

- EMA20：80204.11
- EMA60：78833.59
- 当前价格距离EMA20：1.398%
- 当前价格距离EMA60：3.161%
- 20根4H前高：81951
- 距离前高：-0.763%
- 20根4H前低：76259.98
- 距离前低：6.643%

## 动能指标

- 5m / 15m / 1H / 4H：-0.071% / -0.055% / 0.141% / 0.305%
- 4H RSI14：68.7

## 未来观察

- 上方：关注20根4H前高突破
- 下方：关注EMA20趋势支撑

---

1.  **Analyze the Request:**
    *   **Role:** BTC Market Structure Analyst (strictly based on provided data, no guessing news/macro, no buy/sell instructions).
    *   **Input Data:** A JSON object containing Jev judgment, market state (price, returns, RSI, volume Z-score, 4H trend, 4H structure, market status, heuristic flags).
    *   **Output Language:** Chinese.
    *   **Output Format:** Markdown, strictly containing 6 specific points:
        1. 4H Structure Judgment (trend/range/breakup attempt/breakdown attempt).
        2. Current momentum vs. volume consistency.
        3. Key observation levels (strictly from prior20High, prior20Low, EMA20, EMA60, recent 4H candle high/low - note: recent 4H candle high/low are not explicitly provided in the JSON, I must state this or use what's available. Wait, the JSON has `structure4h` which gives prior20High/Low and distance, and `trend4h` which gives EMA20/60. Recent 4H K线高低点 is not in the data. I will just use the available ones and mention if something is missing, but let's check if I can infer it. Price is 81325.76. EMA20 is 80204.11, EMA60 is 78833.59. Prior20High is 81951, Prior20Low is 76259.98. Since recent 4H K线高低点 is missing, I will just list the ones requested that exist, or explicitly state data is missing for that specific sub-point).
        4. Risk warnings (false breakout, momentum decay, overheating/oversold) - only if data supports.
        5. 3-5 conditions to verify on the next 4H candle.
        6. One-sentence conclusion.
    *   **Constraint:** No buying/selling signals. No guessing. "数据不足" (insufficient data) if data is lacking.

2.  **Analyze the Data:**
    *   **Price:** 81325.76
    *   **Returns:** m5: -0.071%, m15: -0.055%, h1: 0.141%, h4: 0.305%. (Slightly positive on 4H, pulling back on shorter timeframes).
    *   **RSI14:** m5: 45.82, m15: 52.87, h1: 57.88, h4: 68.7. (4H RSI is 68.7, approaching overbought but not extreme yet. Momentum is "偏强" as per market status).
    *   **Volume Z:** m5: -0.56, m15: -0.68, h1: -0.22, h4: 0.32. (4H volume is slightly above average +0.32, but short-term volumes are dropping/weak).
    *   **Trend 4H:** EMA20: 80204.11, EMA60: 78833.59, priceVsEma20Pct: 1.398%, priceVsEma60Pct: 3.161%, MACD Histogram: -32.17, ATR%: 0.998%. (Price is above both EMAs, indicating 4H uptrend. However, MACD Histogram is negative -32.17, indicating short-term bearish divergence/momentum slowdown within the uptrend).
    *   **Structure 4H:** prior20High: 81951, prior20Low: 76259.98, distanceToHighPct: -0.763%, distanceToLowPct: 6.643%, abovePrior20High: false, belowPrior20Low: false. (Price is below the 20-period 4H high, above the 20-period 4H low. It's in a range/consolidation near the high).
    *   **Market Status:** Trend: "🟢 4H多头趋势", Momentum: "68.7 RSI动能偏强", Phase: "高位震荡等待突破", Observation: resistance at prior20High (81951.05), support at EMA20 (80204.11).
    *   **Heuristic Flags:** All false (fastMove, volumeShock, structureBreak, extremeMomentum). HeuristicPrefilter: false.

3.  **Drafting the Content (Iterative refinement against strict requirements):**

    *   **1. 4H 结构判断**
        *   Data: Price is below prior20High, above prior20Low, above EMA20/60. Phase is "高位震荡等待突破" (High-level consolidation waiting for breakout). Trend is "4H多头趋势".
        *   Judgment: 高位震荡等待突破 / 多头趋势中的震荡 (Consolidation within an uptrend, attempting to breakout upwards). Let's frame it as "高位震荡等待突破" based directly on the `phase` field, and classify it as "震荡" (Range) with an "向上突破尝试" (Upward breakout attempt) bias since it's near prior20High and EMA20 supports it. Let's strictly use the requested categories: 趋势/震荡/突破尝试/跌破尝试. -> "震荡（向上突破尝试）" (Range / Attempting upward breakout).

    *   **2. 当前动能与量价是否一致**
        *   Data: 4H RSI is 68.7 (strong momentum, not extreme). 4H Volume Z is +0.32 (slightly above average). However, MACD histogram is -32.17 (negative), and short-term returns are negative, RSI is lower on m5/m15 (45.82/52.87).
        *   Analysis: 动能偏强（RSI 68.7），但4H MACD柱状图为负（-32.17），且短周期（5分/15分）价格和成交量均呈下降（量Z为负），显示上行动能衰减。4H量能微增（+0.32）与4H价格微涨（+0.305%）基本一致，但整体呈现量价背离（短周期缩量回调，4H动能边际减弱）。
        *   Let's keep it precise: 短期动能与量价存在轻微背离。4H RSI偏强（68.7）且量能微增（Z=0.32），但4H MACD为负（-32.17），且短周期缩量（M5/M15量Z为负），显示上冲动能正在衰减。

    *   **3. 关键观察位**
        *   Requested: prior20High, prior20Low, EMA20, EMA60, recent 4H K线高低点.
        *   Data available: prior20High (81951), prior20Low (76259.98), EMA20 (80204.11), EMA60 (78833.59). Recent 4H K线高低点 is NOT provided in the input data.
        *   Rule: "如果数据不足，明确写“数据不足”，不要补造原因。"
        *   Output: 阻力位：20根4H前高 81951.05；支撑位1：EMA20 80204.11；支撑位2：EMA60 78833.59；极端支撑：20根
