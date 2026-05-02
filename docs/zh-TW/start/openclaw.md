---
read_when:
    - 導入新的助理執行個體
    - 審查安全性／權限影響
summary: 執行 OpenClaw 作為個人助理的端對端指南，並附安全注意事項
title: 個人助理設定
x-i18n:
    generated_at: "2026-05-02T22:22:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f6087d0756c98741166135df8b915eb5a0803b23e68e486d2d25ec98d4dca79
    source_path: start/openclaw.md
    workflow: 16
---

# 使用 OpenClaw 建置個人助理

OpenClaw 是一個自託管的 Gateway，可將 Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等連接到 AI agent。本指南說明「個人助理」設定：一個專用 WhatsApp 號碼，行為就像你永遠在線的 AI 助理。

## ⚠️ 安全第一

你會讓一個 agent 處於能夠：

- 在你的機器上執行命令（取決於你的工具政策）
- 讀寫你工作區中的檔案
- 透過 WhatsApp/Telegram/Discord/Mattermost 和其他內建頻道傳送訊息

一開始請採保守設定：

- 一律設定 `channels.whatsapp.allowFrom`（絕不要在你的個人 Mac 上開放給全世界）。
- 為助理使用專用 WhatsApp 號碼。
- Heartbeat 現在預設每 30 分鐘執行一次。先停用，直到你信任此設定：設定 `agents.defaults.heartbeat.every: "0m"`。

## 先決條件

- 已安裝並完成 OpenClaw 初始設定 — 如果你還沒做，請參閱[入門](/zh-TW/start/getting-started)
- 給助理使用的第二個電話號碼（SIM/eSIM/預付卡）

## 雙手機設定（建議）

你要的是這樣：

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

如果你把個人 WhatsApp 連結到 OpenClaw，每一則傳給你的訊息都會變成「agent 輸入」。這通常不是你想要的。

## 5 分鐘快速開始

1. 配對 WhatsApp Web（顯示 QR；用助理手機掃描）：

```bash
openclaw channels login
```

2. 啟動 Gateway（保持執行）：

```bash
openclaw gateway --port 18789
```

3. 在 `~/.openclaw/openclaw.json` 放入最小設定：

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

現在從 allowlist 中的手機傳訊息給助理號碼。

初始設定完成後，OpenClaw 會自動開啟儀表板，並印出乾淨的（不含 token）連結。如果儀表板提示需要驗證，請將已設定的共享密鑰貼到 Control UI 設定中。初始設定預設使用 token（`gateway.auth.token`），但如果你已將 `gateway.auth.mode` 切換為 `password`，也可以使用密碼驗證。之後要重新開啟：`openclaw dashboard`。

## 給 agent 一個工作區（AGENTS）

OpenClaw 會從其工作區目錄讀取操作指示和「記憶」。

預設情況下，OpenClaw 使用 `~/.openclaw/workspace` 作為 agent 工作區，並會在設定或首次 agent 執行時自動建立它（以及起始的 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`）。`BOOTSTRAP.md` 只會在工作區全新時建立（你刪除後不應該再出現）。`MEMORY.md` 是選用的（不會自動建立）；存在時，會在一般工作階段中載入。Subagent 工作階段只會注入 `AGENTS.md` 和 `TOOLS.md`。

<Tip>
把這個資料夾視為 OpenClaw 的記憶，並把它做成 git repo（理想情況下設為私有），如此你的 `AGENTS.md` 和記憶檔案就會有備份。如果已安裝 git，全新的工作區會自動初始化。
</Tip>

```bash
openclaw setup
```

完整工作區配置與備份指南：[Agent 工作區](/zh-TW/concepts/agent-workspace)
記憶工作流程：[記憶](/zh-TW/concepts/memory)

選用：使用 `agents.defaults.workspace` 選擇不同工作區（支援 `~`）。

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

如果你已經從 repo 提供自己的工作區檔案，可以完全停用 bootstrap 檔案建立：

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## 將它變成「助理」的設定

OpenClaw 預設就是不錯的助理設定，但你通常會想調整：

- [`SOUL.md`](/zh-TW/concepts/soul) 中的人格和指示
- 思考預設值（如有需要）
- Heartbeat（等你信任它之後）

範例：

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## 工作階段與記憶

- 工作階段檔案：`~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- 工作階段中繼資料（token 使用量、上次路由等）：`~/.openclaw/agents/<agentId>/sessions/sessions.json`（舊版：`~/.openclaw/sessions/sessions.json`）
- `/new` 或 `/reset` 會為該聊天啟動新的工作階段（可透過 `resetTriggers` 設定）。如果單獨送出，OpenClaw 會確認重設，而不呼叫模型。
- `/compact [instructions]` 會壓縮工作階段上下文，並回報剩餘的上下文預算。

## Heartbeat（主動模式）

預設情況下，OpenClaw 每 30 分鐘執行一次 Heartbeat，使用提示：
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
設定 `agents.defaults.heartbeat.every: "0m"` 可停用。

- 如果 `HEARTBEAT.md` 存在但實際上是空的（只有空白行和像 `# Heading` 這樣的 markdown 標題），OpenClaw 會略過 Heartbeat 執行以節省 API 呼叫。
- 如果檔案不存在，Heartbeat 仍會執行，並由模型決定要做什麼。
- 如果 agent 回覆 `HEARTBEAT_OK`（可選擇加上短 padding；請參閱 `agents.defaults.heartbeat.ackMaxChars`），OpenClaw 會抑制該 Heartbeat 的對外傳送。
- 預設允許 Heartbeat 傳送到 DM 形式的 `user:<id>` 目標。設定 `agents.defaults.heartbeat.directPolicy: "block"` 可在保持 Heartbeat 執行啟用的同時，抑制直接目標傳送。
- Heartbeat 會執行完整的 agent 回合 — 較短間隔會消耗更多 token。

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## 媒體輸入與輸出

傳入附件（圖片/音訊/文件）可以透過範本提供給你的命令：

- `{{MediaPath}}`（本機暫存檔路徑）
- `{{MediaUrl}}`（偽 URL）
- `{{Transcript}}`（如果已啟用音訊轉錄）

agent 的傳出附件：在單獨一行加入 `MEDIA:<path-or-url>`（不要有空格）。範例：

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw 會擷取這些內容，並將它們作為媒體與文字一起傳送。

本機路徑行為遵循與 agent 相同的檔案讀取信任模型：

- 如果 `tools.fs.workspaceOnly` 是 `true`，傳出的 `MEDIA:` 本機路徑會限制在 OpenClaw 暫存根目錄、媒體快取、agent 工作區路徑和 sandbox 產生的檔案中。
- 如果 `tools.fs.workspaceOnly` 是 `false`，傳出的 `MEDIA:` 可以使用 agent 已被允許讀取的主機本機檔案。
- 本機路徑可以是絕對路徑、工作區相對路徑，或使用 `~/` 的家目錄相對路徑。
- 主機本機傳送仍然只允許媒體和安全的文件類型（圖片、音訊、影片、PDF 和 Office 文件）。純文字和看似機密的檔案不會被視為可傳送媒體。

這表示當你的 fs 政策已允許讀取這些檔案時，工作區外產生的圖片/檔案現在也可以傳送，而不會重新開放任意主機文字附件外洩。

## 操作檢查清單

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

記錄位於 `/tmp/openclaw/` 下（預設：`openclaw-YYYY-MM-DD.log`）。

## 下一步

- WebChat：[WebChat](/zh-TW/web/webchat)
- Gateway 維運：[Gateway runbook](/zh-TW/gateway)
- Cron + 喚醒：[Cron 工作](/zh-TW/automation/cron-jobs)
- macOS 選單列 companion：[OpenClaw macOS app](/zh-TW/platforms/macos)
- iOS Node app：[iOS app](/zh-TW/platforms/ios)
- Android Node app：[Android app](/zh-TW/platforms/android)
- Windows 狀態：[Windows (WSL2)](/zh-TW/platforms/windows)
- Linux 狀態：[Linux app](/zh-TW/platforms/linux)
- 安全性：[安全性](/zh-TW/gateway/security)

## 相關

- [入門](/zh-TW/start/getting-started)
- [設定](/zh-TW/start/setup)
- [頻道概觀](/zh-TW/channels)
