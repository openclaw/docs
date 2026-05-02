---
read_when:
    - 設定新機器
    - 你想要「最新 + 最完善」，又不破壞你的個人設定
summary: OpenClaw 的進階設定與開發工作流程
title: 設定
x-i18n:
    generated_at: "2026-05-02T03:00:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是第一次設定，請從[快速入門](/zh-TW/start/getting-started)開始。
如需 onboarding 詳細資訊，請參閱 [Onboarding (CLI)](/zh-TW/start/wizard)。
</Note>

## TL;DR

請依照你想要更新的頻率，以及是否想自行執行 Gateway，選擇設定工作流程：

- **客製化內容位於 repo 外部：** 將你的 config 和 workspace 保留在 `~/.openclaw/openclaw.json` 與 `~/.openclaw/workspace/`，讓 repo 更新不會影響它們。
- **穩定工作流程（多數人建議）：** 安裝 macOS app，並讓它執行內建的 Gateway。
- **前沿工作流程（dev）：** 透過 `pnpm gateway:watch` 自行執行 Gateway，然後讓 macOS app 以 Local mode 連接。

## 先決條件（從原始碼）

- 建議使用 Node 24（Node 22 LTS，目前為 `22.14+`，仍受支援）
- 原始碼 checkout 需要 `pnpm`。在 dev mode 中，OpenClaw 會從
  `extensions/*` pnpm workspace packages 載入內建 plugins，因此在根目錄執行 `npm install`
  不會準備完整的原始碼樹。
- Docker（選用；僅用於容器化設定/e2e — 請參閱 [Docker](/zh-TW/install/docker)）

## 客製化策略（讓更新不造成問題）

如果你想要「100% 為我量身打造」_而且_更新方便，請將你的自訂內容保留在：

- **Config：** `~/.openclaw/openclaw.json`（JSON/類 JSON5）
- **Workspace：** `~/.openclaw/workspace`（skills、prompts、memories；將它做成私人 git repo）

初始化一次：

```bash
openclaw setup
```

在這個 repo 內，使用本機 CLI 入口：

```bash
openclaw setup
```

如果你還沒有全域安裝，請透過 `pnpm openclaw setup` 執行。

## 從這個 repo 執行 Gateway

在 `pnpm build` 之後，你可以直接執行封裝好的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 穩定工作流程（macOS app 優先）

1. 安裝並啟動 **OpenClaw.app**（選單列）。
2. 完成 onboarding/permissions 檢查清單（TCC prompts）。
3. 確認 Gateway 為 **Local** 且正在執行（由 app 管理）。
4. 連結 surfaces（例如：WhatsApp）：

```bash
openclaw channels login
```

5. 健全性檢查：

```bash
openclaw health
```

如果你的 build 無法使用 onboarding：

- 執行 `openclaw setup`，接著執行 `openclaw channels login`，然後手動啟動 Gateway（`openclaw gateway`）。

## 前沿工作流程（在終端機中執行 Gateway）

目標：開發 TypeScript Gateway、取得熱重載，並保持 macOS app UI 已連接。

### 0)（選用）也從原始碼執行 macOS app

如果你也想讓 macOS app 使用前沿版本：

```bash
./scripts/restart-mac.sh
```

### 1) 啟動 dev Gateway

```bash
pnpm install
# 僅第一次執行（或重設本機 OpenClaw config/workspace 之後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 會在具名 tmux
session 中啟動或重新啟動 Gateway 監看程序，並從互動式終端機自動連接。非互動式 shell 會保持
detached 並列印 `tmux attach -t openclaw-gateway-watch-main`；使用
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可讓互動式執行保持
detached，或使用 `pnpm gateway:watch:raw` 進入前景監看模式。監看器會在相關原始碼、config 和內建-plugin metadata 變更時重新載入。
`pnpm openclaw setup` 是新 checkout 的一次性本機 config/workspace 初始化步驟。
`pnpm gateway:watch` 不會重新建置 `dist/control-ui`，因此在 `ui/` 變更後請重新執行 `pnpm ui:build`，或在開發 Control UI 時使用 `pnpm ui:dev`。

### 2) 將 macOS app 指向你正在執行的 Gateway

在 **OpenClaw.app** 中：

- Connection Mode：**Local**
  app 會連接到設定連接埠上正在執行的 gateway。

### 3) 驗證

- App 內的 Gateway 狀態應顯示 **「Using existing gateway …」**
- 或透過 CLI：

```bash
openclaw health
```

### 常見踩坑

- **連接埠錯誤：** Gateway WS 預設為 `ws://127.0.0.1:18789`；請讓 app + CLI 使用相同連接埠。
- **狀態儲存位置：**
  - Channel/provider 狀態：`~/.openclaw/credentials/`
  - Model auth profiles：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions：`~/.openclaw/agents/<agentId>/sessions/`
  - Logs：`/tmp/openclaw/`

## Credential storage map

除錯 auth 或決定要備份什麼時，請使用這份對照表：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：config/env 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕 symlinks）
- **Discord bot token**：config/env 或 SecretRef（env/file/exec providers）
- **Slack tokens**：config/env（`channels.slack.*`）
- **Pairing allowlists**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（default account）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（non-default accounts）
- **Model auth profiles**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **File-backed secrets payload（選用）**：`~/.openclaw/secrets.json`
- **Legacy OAuth import**：`~/.openclaw/credentials/oauth.json`
  更多細節：[Security](/zh-TW/gateway/security#credential-storage-map)。

## 更新（不破壞你的設定）

- 將 `~/.openclaw/workspace` 和 `~/.openclaw/` 視為「你的東西」；不要把個人 prompts/config 放進 `openclaw` repo。
- 更新原始碼：`git pull` + `pnpm install` + 繼續使用 `pnpm gateway:watch`。

## Linux（systemd user service）

Linux 安裝會使用 systemd **user** service。預設情況下，systemd 會在 logout/idle 時停止 user
services，這會終止 Gateway。Onboarding 會嘗試替你啟用
lingering（可能會提示使用 sudo）。如果它仍然關閉，請執行：

```bash
sudo loginctl enable-linger $USER
```

對於 always-on 或 multi-user servers，請考慮使用 **system** service，而不是
user service（不需要 lingering）。請參閱 [Gateway runbook](/zh-TW/gateway) 的 systemd notes。

## 相關文件

- [Gateway runbook](/zh-TW/gateway)（flags、supervision、ports）
- [Gateway configuration](/zh-TW/gateway/configuration)（config schema + examples）
- [Discord](/zh-TW/channels/discord) 和 [Telegram](/zh-TW/channels/telegram)（reply tags + replyToMode settings）
- [OpenClaw assistant setup](/zh-TW/start/openclaw)
- [macOS app](/zh-TW/platforms/macos)（gateway lifecycle）
