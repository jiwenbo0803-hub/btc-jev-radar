# Security

这个仓库设计为公开模板，但运行时会使用 AI Gateway Key 和 Telegram 凭据。

## 不要提交这些内容

不要把以下信息写进代码、README、Issue、截图或提交记录：

- `AI_GATEWAY_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- 本地 `.env`
- 任何交易所私钥、API Secret 或助记词

## 正确保存位置

GitHub Actions 使用：

```text
Settings
→ Secrets and variables
→ Actions
→ Secrets
```

本地开发使用：

```text
.env
```

项目已经通过 `.gitignore` 忽略 `.env`。

## 如果密钥曾经泄露

不要只删除文件。

正确做法是：

1. 立即在服务商后台撤销旧 Key / Token
2. 创建新的凭据
3. 更新 GitHub Secret
4. 如果密钥曾经进入 Git 历史，进一步清理 Git 历史或重新建立干净仓库

## 公开仓库前

建议确认：

- 当前分支没有真实密钥
- 历史提交中没有误提交 `.env`
- GitHub Secrets 已删除或已轮换
- Actions 日志里没有主动打印 Token
- Telegram Bot Token 没有出现在截图

## Binance

本项目默认只使用 Binance 公共市场数据，不需要 Binance 账户 API Key。

不要为了运行本模板而添加带交易权限的 Binance API Key。
