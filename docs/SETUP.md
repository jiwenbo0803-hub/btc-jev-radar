# BTC Jev 雷达：第一次配置教程

这份教程只需要在第一次使用时按照顺序操作。

---

## 第 1 步：创建 Vercel AI Gateway Key

进入 Vercel 后找到：

**AI Gateway → API Keys → Create Key**

建议名称：

`btc-jev-radar`

如果账户支持单独设置预算，建议第一阶段给这个实验项目设置一个很小的月度预算。

创建成功以后，复制生成的 Key。

**不要把 Key 发到聊天、截图、README、代码或 Issue 中。**

---

## 第 2 步：把 Key 放进 GitHub Secret

进入当前 GitHub 仓库：

**Settings → Secrets and variables → Actions → New repository secret**

填写：

**Name**

`AI_GATEWAY_API_KEY`

**Secret**

粘贴刚才从 Vercel 复制的 Key。

保存。

---

## 第 3 步：第一次手动测试 Jev 雷达

进入仓库顶部：

**Actions**

找到：

**BTC 行情雷达（Jev）**

点击：

**Run workflow**

第一次正常运行以后，你应该能看到：

- BTC 当前行情状态
- Jev 异常概率
- Jev 4H 结构变化概率
- Jev 是否需要深度分析的概率
- L0 / L1 / L2 / L3 事件等级

普通巡检不会每次都调用 GPT。

达到 L3 时会触发 GPT 深度分析；L2 只发送异动提醒，不额外调用 GPT。

---

## 第 4 步：第一次手动测试 4H 正式复盘

仍然进入：

**Actions**

找到：

**BTC 4小时正式复盘（GPT）**

点击：

**Run workflow**

这个任务与普通雷达不同：

> **4H 正式复盘每次都会调用 GPT-5.6 Sol。**

正常完成以后会生成：

`out/report.md`

同时把正式报告保存到：

`reports/YYYY-MM-DD/`

最新一份报告还会同步保存为：

`reports/latest.md`

---

## 第 5 步：以后系统自动怎么跑

### 普通雷达

每 **30 分钟**自动运行一次。

行情本身仍然读取 5 分钟 K 线。

### 4H 正式复盘

Binance 的 4H K 线按 UTC 时间在：

00:00 / 04:00 / 08:00 / 12:00 / 16:00 / 20:00

收盘。

系统会在收盘约 **7 分钟后**运行正式复盘，避免刚好卡在 K 线切换时间。

---

## 第 6 步：打开 GitHub 手机提醒

系统已经配置为：

- L2 自动创建中文 Issue
- L3 自动创建中文 Issue，并附上 GPT 深度分析
- Issue 优先自动指派给你的 GitHub 账号
- L2 同类事件 4 小时冷却
- L3 同类事件 2 小时冷却

为了在手机上真正看到通知，请确保：

1. 已安装 GitHub 手机 App
2. 手机系统允许 GitHub 发送通知
3. GitHub App 内没有关闭 Issue / Assigned 类通知

如果以后觉得 GitHub 推送不够醒目，再接 Telegram、Bark 或其他推送通道。

---

## 安全注意事项

`AI_GATEWAY_API_KEY` 只能放在：

**GitHub → Settings → Secrets and variables → Actions**

不要写入：

- README
- `.env.example`
- `src/` 代码
- GitHub Issue
- Actions 工作流正文
- 聊天截图

如果你在自己电脑本地运行，可以放在一个不会提交到 GitHub 的 `.env` 文件中。
