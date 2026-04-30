---
read_when:
    - 安裝或設定用於 Claude Code / Codex / Gemini CLI 的 acpx 測試框架
    - 啟用 plugin-tools 或 OpenClaw-tools MCP 橋接器
    - 設定 ACP 權限模式
summary: 設定 ACP 代理：acpx harness 設定、Plugin 設定、權限
title: ACP 代理 — 設定
x-i18n:
    generated_at: "2026-04-30T03:41:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

如需概觀、操作員執行手冊與概念，請參閱 [ACP agents](/zh-TW/tools/acp-agents)。

以下章節涵蓋 acpx harness 設定、MCP 橋接的 Plugin 設定，以及權限設定。

只有在設定 ACP/acpx 路由時才使用此頁面。若要設定原生 Codex
app-server 執行階段，請使用 [Codex harness](/zh-TW/plugins/codex-harness)。若要設定
OpenAI API 金鑰或 Codex OAuth 模型提供者設定，請使用
[OpenAI](/zh-TW/providers/openai)。

Codex 有兩個 OpenClaw 路由：

| 路由                       | 設定/命令                                              | 設定頁面                                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server      | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/zh-TW/plugins/codex-harness) |
| 明確的 Codex ACP 介面卡    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 此頁面                                  |

除非你明確需要 ACP/acpx 行為，否則請優先使用原生路由。

## acpx harness 支援（目前）

目前 acpx 內建的 harness 別名：

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI：`cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

當 OpenClaw 使用 acpx 後端時，除非你的 acpx 設定定義了自訂代理別名，否則請優先將這些值用於 `agentId`。
如果你的本機 Cursor 安裝仍以 `agent acp` 暴露 ACP，請在 acpx 設定中覆寫 `cursor` 代理命令，而不是變更內建預設值。

直接使用 acpx CLI 時，也可以透過 `--agent <command>` 指向任意介面卡，但這個原始逃生口是 acpx CLI 功能（不是一般 OpenClaw `agentId` 路徑）。

模型控制取決於介面卡能力。Codex ACP 模型參照會在啟動前由
OpenClaw 正規化。其他 harness 需要 ACP `models` 加上
`session/set_model` 支援；如果某個 harness 既沒有暴露該 ACP 能力，
也沒有自己的啟動模型旗標，OpenClaw/acpx 就無法強制選擇模型。

## 必要設定

核心 ACP 基準：

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

執行緒繫結設定取決於頻道介面卡。Discord 範例：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

如果執行緒繫結的 ACP 產生作業無法運作，請先確認介面卡功能旗標：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

目前對話繫結不需要建立子執行緒。它們需要作用中的對話情境，以及會暴露 ACP 對話繫結的頻道介面卡。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## acpx 後端的 Plugin 設定

全新安裝預設會啟用隨附的 `acpx` 執行階段 Plugin，因此 ACP
通常不需要手動安裝 Plugin 步驟即可運作。

從這裡開始：

```text
/acp doctor
```

如果你停用了 `acpx`、透過 `plugins.allow` / `plugins.deny` 拒絕它，或想要
切換到本機開發 checkout，請使用明確的 Plugin 路徑：

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

開發期間安裝本機工作區：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

接著確認後端健康狀態：

```text
/acp doctor
```

### acpx 命令與版本設定

預設情況下，隨附的 `acpx` Plugin 會註冊嵌入式 ACP 後端，而不會
在 Gateway 啟動期間產生 ACP 代理。執行 `/acp doctor` 可進行明確的
即時探測。只有在需要 Gateway 於啟動時探測已設定的代理時，才設定 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1`。

在 Plugin 設定中覆寫命令或版本：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` 接受絕對路徑、相對路徑（從 OpenClaw 工作區解析），或命令名稱。
- `expectedVersion: "any"` 會停用嚴格版本比對。
- 自訂 `command` 路徑會停用 Plugin 本機自動安裝。

請參閱 [Plugins](/zh-TW/tools/plugin)。

### 自動相依項安裝

當你使用 `npm install -g openclaw` 全域安裝 OpenClaw 時，acpx
執行階段相依項（平台特定二進位檔）會透過 postinstall hook 自動安裝。
如果自動安裝失敗，Gateway 仍會正常啟動，並透過 `openclaw acp doctor`
回報缺少的相依項。

### Plugin 工具 MCP 橋接

預設情況下，ACPX 工作階段**不會**將 OpenClaw Plugin 註冊的工具暴露給
ACP harness。

如果你希望 Codex 或 Claude Code 等 ACP 代理呼叫已安裝的
OpenClaw Plugin 工具，例如記憶回想/儲存，請啟用專用橋接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

這會執行：

- 將名為 `openclaw-plugin-tools` 的內建 MCP 伺服器注入 ACPX 工作階段
  bootstrap。
- 暴露已由已安裝且已啟用的 OpenClaw
  plugins 註冊的 Plugin 工具。
- 讓此功能保持明確且預設關閉。

安全性與信任注意事項：

- 這會擴大 ACP harness 工具介面。
- ACP 代理只會取得 Gateway 中已啟用的 Plugin 工具存取權。
- 請將這視為與允許這些 plugins 在
  OpenClaw 本身執行相同的信任邊界。
- 啟用前請檢查已安裝的 plugins。

自訂 `mcpServers` 仍會像以前一樣運作。內建 Plugin 工具橋接是額外的選用便利功能，不是通用 MCP 伺服器設定的替代品。

### OpenClaw 工具 MCP 橋接

預設情況下，ACPX 工作階段也**不會**透過
MCP 暴露內建 OpenClaw 工具。當 ACP 代理需要選定的
內建工具（例如 `cron`）時，請啟用獨立的核心工具橋接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

這會執行：

- 將名為 `openclaw-tools` 的內建 MCP 伺服器注入 ACPX 工作階段
  bootstrap。
- 暴露選定的內建 OpenClaw 工具。初始伺服器會暴露 `cron`。
- 讓核心工具暴露保持明確且預設關閉。

### 執行階段逾時設定

隨附的 `acpx` Plugin 預設會將嵌入式執行階段回合設為 120 秒
逾時。這讓 Gemini CLI 等較慢的 harness 有足夠時間完成
ACP 啟動與初始化。如果你的主機需要不同的
執行階段限制，請覆寫它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

變更此值後請重新啟動 Gateway。

### 健康探測代理設定

當 `/acp doctor` 或選用的啟動探測檢查後端時，隨附的
`acpx` Plugin 會探測一個 harness 代理。如果設定了 `acp.allowedAgents`，它
預設為第一個允許的代理；否則預設為 `codex`。如果你的
部署需要使用不同的 ACP 代理進行健康檢查，請明確設定探測代理：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

變更此值後請重新啟動 Gateway。

## 權限設定

ACP 工作階段以非互動方式執行，沒有 TTY 可用來核准或拒絕檔案寫入與 shell 執行權限提示。acpx Plugin 提供兩個設定鍵，用來控制權限的處理方式：

這些 ACPX harness 權限與 OpenClaw 執行核准分開，也與 CLI 後端廠商繞過旗標（例如 Claude CLI `--permission-mode bypassPermissions`）分開。ACPX `approve-all` 是 ACP 工作階段的 harness 層級緊急開關。

### `permissionMode`

控制 harness 代理可在不提示的情況下執行哪些操作。

| 值              | 行為                                      |
| --------------- | ----------------------------------------- |
| `approve-all`   | 自動核准所有檔案寫入與 shell 命令。       |
| `approve-reads` | 只自動核准讀取；寫入與執行需要提示。      |
| `deny-all`      | 拒絕所有權限提示。                        |

### `nonInteractivePermissions`

控制在原本會顯示權限提示，但沒有可用互動式 TTY 時會發生什麼事（ACP 工作階段永遠如此）。

| 值     | 行為                                                          |
| ------ | ------------------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止工作階段。**（預設）**               |
| `deny` | 靜默拒絕權限並繼續（優雅降級）。                              |

### 設定

透過 Plugin 設定：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

變更這些值後請重新啟動 Gateway。

<Warning>
OpenClaw 預設為 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非互動式 ACP 工作階段中，任何觸發權限提示的寫入或執行，都可能因 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 而失敗。

如果你需要限制權限，請將 `nonInteractivePermissions` 設為 `deny`，讓工作階段優雅降級，而不是當機。
</Warning>

## 相關

- [ACP agents](/zh-TW/tools/acp-agents) — 概觀、操作員執行手冊、概念
- [Sub-agents](/zh-TW/tools/subagents)
- [Multi-agent routing](/zh-TW/concepts/multi-agent)
