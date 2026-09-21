# BTC Jev Radar：第一次配置

这份文档按“完全没接触过这个项目”的顺序写。建议第一次使用时从上到下做完，不要一开始就打开定时任务。

## 一、先准备 Vercel AI Gateway

进入 Vercel，创建一个 AI Gateway API Key。

建议给 Key 起一个容易辨认的名字，例如：

```text
btc-jev-radar
```

项目默认通过 AI Gateway 调用：

```text
JEV_MODEL=typesafe-ai/jev
GPT_MODEL=openai/gpt-5.6-sol
GPT_FALLBACK_MODEL_1=inclusionai/ling-3.0-flash-vl-free
```

不同账户可以访问的模型可能不同。如果默认深度分析模型不可用，不需要改程序，只要在 GitHub Variables 里设置你自己的 `GPT_MODEL` 即可。

> 不要把 API Key 写进 README、Issue、代码、截图或聊天记录。

## 二、添加 GitHub Secret

进入你的仓库：

```text
Settings
→ Secrets and variables
→ Actions
→ Secrets
→ New repository secret
```

添加：

```text
Name: AI_GATEWAY_API_KEY
Secret: 你的 Vercel AI Gateway Key
```

Binance 行情使用公开 K 线接口，不需要 Binance API Key。

## 三、第一次手动测试 Jev 雷达

进入：

```text
Actions
→ BTC 行情雷达（Jev）
→ Run workflow
```

先不要打开 Telegram 测试。

正常情况下，任务会生成：

- BTC 当前价格
- 多周期收益率
- EMA / RSI / MACD / ATR / 量能 Z-Score
- Jev 三项概率
- L0 / L1 / L2 / L3 等级
- 中文市场阶段摘要

手动运行不需要 `ENABLE_SCHEDULED_RUNS`。

## 四、第一次手动测试 4H 正式复盘

进入：

```text
Actions
→ BTC 4小时正式复盘（GPT）
→ Run workflow
```

这个任务每次都会尝试生成 AI 正式复盘。

如果首选模型无权限或不可用，程序会尝试备用模型。最终输出会被清洗成简短中文结论，避免把模型的分析草稿直接写进报告。

正常运行以后，可在 Actions Summary 或 Artifact 中看到：

```text
out/decision.json
out/summary.md
out/report.md
```

## 五、配置 Telegram

如果不需要 Telegram，可以直接跳过这一节。

### 1. 创建机器人

在 Telegram 中找到官方 `@BotFather`，创建 Bot，取得 Bot Token。

把 Token 添加到 GitHub Secret：

```text
TELEGRAM_BOT_TOKEN
```

### 2. 获取 Chat ID

先给你的机器人发送一条消息，例如：

```text
/start
```

然后通过 Telegram Bot API 的 `getUpdates` 获取聊天 ID。

拿到 Chat ID 后，再添加一个 GitHub Secret：

```text
TELEGRAM_CHAT_ID
```

不要把 Bot Token 或 Chat ID 提交到仓库。

### 3. 打开 Telegram 功能

进入：

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
```

添加：

```text
ENABLE_TELEGRAM=true
```

### 4. 单独测试 Telegram

重新手动运行：

```text
Actions
→ BTC 行情雷达（Jev）
→ Run workflow
```

这一次把：

```text
telegram_test
```

勾选为 `true`。

正常情况下会收到一条：

```text
✅ BTC Jev Radar Telegram 测试成功
```

注意：正式雷达并不是每次都推送。默认只有 L2 / L3 才发消息。

4H 正式复盘在 `ENABLE_TELEGRAM=true` 时，每次运行都会推送。

## 六、可选：开启 GitHub Issue 异动提醒

如果希望 L2 / L3 同时创建 GitHub Issue，添加 Repository Variable：

```text
ENABLE_GITHUB_ISSUES=true
```

默认逻辑：

- L2 同类事件冷却 4 小时
- L3 同类事件冷却 2 小时

这样可以避免每 30 分钟重复创建同类提醒。

## 七、可选：把报告长期写回仓库

如果只看 Actions Artifact，不需要开启这一项。

如果希望长期保留：

```text
reports/YYYY-MM-DD/
reports/latest.md
```

添加 Repository Variable：

```text
SAVE_REPORTS_TO_REPO=true
```

## 八、最后再打开自动运行

两条 workflow 都手动测试成功以后，再添加：

```text
ENABLE_SCHEDULED_RUNS=true
```

这样定时任务才真正执行。

默认节奏：

| Workflow | 时间 |
|---|---|
| BTC 行情雷达（Jev） | 每 30 分钟 |
| BTC 4小时正式复盘（GPT） | UTC 00:07 / 04:07 / 08:07 / 12:07 / 16:07 / 20:07 |

如果没有设置 `ENABLE_SCHEDULED_RUNS=true`，GitHub 仍会看到 schedule 事件，但 Job 会安全跳过，不会因为缺少 Secret 反复报错。

## 九、常用 Repository Variables

| Variable | 示例 | 作用 |
|---|---|---|
| `ENABLE_SCHEDULED_RUNS` | `true` | 开启定时运行 |
| `ENABLE_TELEGRAM` | `true` | 开启 Telegram |
| `ENABLE_GITHUB_ISSUES` | `true` | 开启 L2/L3 Issue |
| `SAVE_REPORTS_TO_REPO` | `true` | 报告写回仓库 |
| `BTC_SYMBOL` | `BTCUSDT` | 修改交易对 |
| `JEV_MODEL` | `typesafe-ai/jev` | 修改 Jev 模型 |
| `GPT_MODEL` | 你的模型 ID | 修改深度分析首选模型 |
| `GPT_FALLBACK_MODEL_1` | 备用模型 ID | 修改备用模型 |
| `BINANCE_BASE_URL` | Binance 公共接口 | 修改行情源地址 |

## 十、本地运行

需要 Node.js 22+。

```bash
npm install
cp .env.example .env
```

编辑 `.env` 后：

```bash
npm run check
npm run monitor
npm run four-hour
```

Telegram 测试：

```bash
npm run telegram:test
```

## 十一、常见问题

### 为什么手动运行雷达却没有 Telegram？

如果没有勾选 `telegram_test`，正常雷达只有 L2 / L3 才推送。L0 / L1 保持静默是设计行为。

### 为什么 4H 能跑，但首选 GPT 模型报无权限？

模型访问权限由你自己的 AI Gateway 账户决定。设置 `GPT_MODEL` 为可访问模型即可。

### 为什么 schedule 显示了，但 Job 被 skipped？

这是模板的安全设计。只有 `ENABLE_SCHEDULED_RUNS=true` 后才会实际运行。

### 为什么报告没有出现在 reports/？

默认只保存 Artifact。只有 `SAVE_REPORTS_TO_REPO=true` 才会把报告提交回仓库。

## 十二、安全检查

公开仓库前确认：

- 没有提交 `.env`
- 没有把 API Key 写进源码
- GitHub Secrets 已清理或重新生成
- Telegram Bot Token 没出现在日志或截图
- 不需要的历史敏感文件已经删除

更多见 [../SECURITY.md](../SECURITY.md)。
