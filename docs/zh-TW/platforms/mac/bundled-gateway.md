---
read_when:
    - 打包 OpenClaw.app
    - 偵錯 macOS Gateway launchd 服務
    - 安裝適用於 macOS 的 Gateway CLI
summary: Gateway 在 macOS 上的執行階段（外部 launchd 服務）
title: macOS 上的 Gateway
x-i18n:
    generated_at: "2026-04-30T03:20:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不再隨附 Node/Bun 或 Gateway 執行階段。macOS 應用程式預期使用**外部** `openclaw` CLI 安裝，不會將 Gateway 作為子程序啟動，並會管理每位使用者的 launchd 服務，以保持 Gateway 持續執行（或在已有本機 Gateway 執行時附加至該 Gateway）。

## 安裝 CLI（本機模式必要）

Node 24 是 Mac 上的預設執行階段。Node 22 LTS（目前為 `22.14+`）仍可用於相容性。接著全域安裝 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 應用程式的**安裝 CLI**按鈕會執行與應用程式內部相同的全域安裝流程：它會先偏好 npm，接著是 pnpm，若 bun 是唯一偵測到的套件管理器，才會使用 bun。Node 仍是建議的 Gateway 執行階段。

## Launchd（將 Gateway 作為 LaunchAgent）

標籤：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；舊版 `com.openclaw.*` 可能仍會保留）

Plist 位置（每位使用者）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理器：

- macOS 應用程式在本機模式中負責 LaunchAgent 的安裝/更新。
- CLI 也可以安裝它：`openclaw gateway install`。

行為：

- 「OpenClaw 作用中」會啟用/停用 LaunchAgent。
- 離開應用程式**不會**停止 gateway（launchd 會讓它保持執行）。
- 如果已有 Gateway 在設定的連接埠上執行，應用程式會附加至該 Gateway，而不是啟動新的 Gateway。

記錄：

- launchd stdout/err：`/tmp/openclaw/openclaw-gateway.log`

## 版本相容性

macOS 應用程式會檢查 gateway 版本是否符合自身版本。如果兩者不相容，請更新全域 CLI，使其符合應用程式版本。

## 冒煙檢查

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

接著：

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [Gateway 執行手冊](/zh-TW/gateway)
