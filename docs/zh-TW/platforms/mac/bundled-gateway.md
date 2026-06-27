---
read_when:
    - 封裝 OpenClaw.app
    - 偵錯 macOS 閘道 launchd 服務
    - 安裝 macOS 版閘道命令列介面
summary: macOS 上的閘道執行階段（外部 launchd 服務）
title: macOS 上的閘道
x-i18n:
    generated_at: "2026-06-27T19:31:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不再內建節點/Bun 或閘道執行階段。macOS 應用程式
預期使用**外部** `openclaw` 命令列介面安裝，不會將閘道作為
子程序啟動，並會管理每位使用者的 launchd 服務，以保持閘道
執行中（若已有本機閘道在執行，則會附加至該閘道）。

## 安裝命令列介面（本機模式必需）

節點 24 是 Mac 上的預設執行階段。節點 22 LTS，目前為 `22.19+`，仍可相容運作。接著全域安裝 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 應用程式的 **Install CLI** 按鈕會執行與應用程式內部使用相同的全域安裝流程：它會優先使用 npm，其次是 pnpm，若 bun 是唯一偵測到的套件管理器，才會使用 bun。節點仍是建議的閘道執行階段。

## Launchd（作為 LaunchAgent 的閘道）

標籤：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；舊版 `com.openclaw.*` 可能仍會保留）

Plist 位置（每位使用者）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理器：

- macOS 應用程式在本機模式中負責 LaunchAgent 的安裝/更新。
- 命令列介面也可以安裝它：`openclaw gateway install`。

行為：

- 「OpenClaw Active」會啟用/停用 LaunchAgent。
- 退出應用程式**不會**停止閘道（launchd 會讓它保持執行）。
- 如果閘道已在設定的連接埠上執行，應用程式會附加至
  該閘道，而不是啟動新的閘道。

記錄：

- launchd stdout：`~/Library/Logs/openclaw/gateway.log`（profile 使用 `gateway-<profile>.log`）
- launchd stderr：已抑制

## 版本相容性

macOS 應用程式會檢查閘道版本是否與自身版本相符。如果兩者
不相容，請更新全域命令列介面以符合應用程式版本。

## 基本冒煙檢查

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
- [閘道執行手冊](/zh-TW/gateway)
