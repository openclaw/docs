---
read_when:
    - 封裝 OpenClaw.app
    - 偵錯 macOS Gateway launchd 服務
    - 在 macOS 上安裝 Gateway CLI
summary: macOS 上的 Gateway 執行階段（外部 launchd 服務）
title: macOS 上的 Gateway
x-i18n:
    generated_at: "2026-05-06T09:13:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不再內建 Node/Bun 或 Gateway 執行階段。macOS app
預期使用**外部** `openclaw` CLI 安裝，不會將 Gateway 作為
子程序啟動，並會管理每位使用者的 launchd 服務，讓 Gateway
持續執行（或在已有本機 Gateway 執行時附加至該 Gateway）。

## 安裝 CLI（本機模式必要）

Node 24 是 Mac 上的預設執行階段。Node 22 LTS（目前為 `22.14+`）仍可相容使用。接著全域安裝 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS app 的**安裝 CLI**按鈕會執行與 app
內部使用相同的全域安裝流程：它會先偏好 npm，接著是 pnpm，若偵測到的套件管理器只有 bun，才會使用 bun。Node 仍是建議的 Gateway 執行階段。

## Launchd（Gateway 作為 LaunchAgent）

標籤：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；舊版 `com.openclaw.*` 可能仍會保留）

Plist 位置（每位使用者）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理方式：

- macOS app 在本機模式中負責安裝/更新 LaunchAgent。
- CLI 也可以安裝它：`openclaw gateway install`。

行為：

- 「OpenClaw 啟用中」會啟用/停用 LaunchAgent。
- 結束 app **不會**停止 Gateway（launchd 會讓它維持執行）。
- 如果 Gateway 已在設定的連接埠上執行，app 會附加至
  它，而不是啟動新的 Gateway。

記錄：

- launchd stdout/err：`/tmp/openclaw/openclaw-gateway.log`

## 版本相容性

macOS app 會檢查 Gateway 版本是否與自身版本相符。如果兩者不相容，請更新全域 CLI，使其符合 app 版本。

## 冒煙檢查

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

然後：

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [Gateway runbook](/zh-TW/gateway)
