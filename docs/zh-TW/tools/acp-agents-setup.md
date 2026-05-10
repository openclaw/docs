---
read_when:
    - 為 Claude Code / Codex / Gemini CLI 安裝或設定 acpx 執行框架
    - 啟用 plugin-tools 或 OpenClaw-tools MCP 橋接器
    - 設定 ACP 權限模式
summary: 設定 ACP 代理：acpx 執行框架設定、Plugin 設定、權限
title: ACP 代理 — 設定
x-i18n:
    generated_at: "2026-05-10T19:52:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

如需概觀、操作員手冊和概念，請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

以下章節涵蓋 acpx harness 設定、MCP 橋接的 Plugin 設定，以及權限設定。

只有在設定 ACP/acpx 路由時才使用此頁。若要設定原生 Codex
app-server 執行階段，請使用 [Codex harness](/zh-TW/plugins/codex-harness)。若要設定
OpenAI API 金鑰或 Codex OAuth 模型提供者設定，請使用
[OpenAI](/zh-TW/providers/openai)。

Codex 有兩種 OpenClaw 路由：

| 路由                       | 設定/指令                                               | 設定頁面                                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server      | `/codex ...`, `openai/gpt-*` agent refs                | [Codex harness](/zh-TW/plugins/codex-harness) |
| 明確的 Codex ACP adapter   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 本頁                                    |

除非你明確需要 ACP/acpx 行為，否則請優先使用原生路由。

## acpx harness 支援（目前）

目前 acpx 內建 harness 別名：

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

當 OpenClaw 使用 acpx 後端時，除非你的 acpx 設定定義了自訂代理程式別名，否則請優先將這些值用於 `agentId`。
如果你的本機 Cursor 安裝仍以 `agent acp` 暴露 ACP，請在你的 acpx 設定中覆寫 `cursor` 代理程式指令，而不是變更內建預設值。

直接使用 acpx CLI 也可以透過 `--agent <command>` 指向任意 adapter，但該原始逃生口是 acpx CLI 功能（不是一般 OpenClaw `agentId` 路徑）。

模型控制取決於 adapter 能力。Codex ACP 模型參照會在啟動前由
OpenClaw 正規化。其他 harness 需要 ACP `models` 加上
`session/set_model` 支援；如果某個 harness 既未暴露該 ACP 能力，
也沒有自己的啟動模型旗標，OpenClaw/acpx 就無法強制選擇模型。

## 必要設定

核心 ACP baseline：

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

執行緒繫結設定依 channel adapter 而定。Discord 範例：

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
        spawnSessions: true,
      },
    },
  },
}
```

如果執行緒繫結的 ACP spawn 無法運作，請先驗證 adapter 功能旗標：

- Discord：`channels.discord.threadBindings.spawnSessions=true`

目前對話繫結不需要建立子執行緒。它們需要作用中的對話情境，以及暴露 ACP 對話繫結的 channel adapter。

請參閱 [設定參考](/zh-TW/gateway/configuration-reference)。

## acpx 後端的 Plugin 設定

封裝安裝會使用官方 `@openclaw/acpx` 執行階段 Plugin 來支援 ACP。
請先安裝並啟用它，再使用 ACP harness 工作階段：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 也可以在 `pnpm install` 後使用本機 workspace Plugin。

從這裡開始：

```text
/acp doctor
```

如果你停用了 `acpx`、透過 `plugins.allow` / `plugins.deny` 拒絕它，或想要
切回封裝 Plugin，請使用明確的套件路徑：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

開發期間的本機 workspace 安裝：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

接著驗證後端健康狀態：

```text
/acp doctor
```

### acpx 指令與版本設定

預設情況下，`acpx` Plugin 會在 Gateway 啟動期間探測嵌入式 ACP 後端，
並在 gateway `ready` 訊號前等待該探測完成。將
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` 設為跳過啟動探測，並改為延遲註冊
後端。執行 `/acp doctor` 可進行明確的隨選探測。

在 Plugin 設定中覆寫指令或版本：

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

- `command` 接受絕對路徑、相對路徑（從 OpenClaw workspace 解析），或指令名稱。
- `expectedVersion: "any"` 會停用嚴格版本比對。
- 自訂 `command` 路徑會停用 Plugin 本機自動安裝。

當路徑或旗標值應維持為單一 argv token 時，請使用結構化引數覆寫個別 ACP 代理程式指令：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` 是該 ACP 代理程式的可執行檔或既有指令字串。
- `agents.<id>.args` 為選用。每個陣列項目都會先進行 shell quote，OpenClaw 再透過目前的 acpx 指令字串 registry 傳遞它。

請參閱 [Plugin](/zh-TW/tools/plugin)。

### 自動相依性安裝

當你使用 `npm install -g openclaw` 全域安裝 OpenClaw 時，acpx
執行階段相依性（平台特定二進位檔）會透過 postinstall hook 自動安裝。
如果自動安裝失敗，gateway 仍會正常啟動，並透過 `openclaw acp doctor`
回報缺少的相依性。

### Plugin 工具 MCP 橋接

預設情況下，ACPX 工作階段**不會**將 OpenClaw Plugin 註冊的工具暴露給
ACP harness。

如果你想讓 Codex 或 Claude Code 等 ACP 代理程式呼叫已安裝的
OpenClaw Plugin 工具，例如記憶回想/儲存，請啟用專用橋接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

這會執行以下事項：

- 將名為 `openclaw-plugin-tools` 的內建 MCP server 注入 ACPX 工作階段
  bootstrap。
- 暴露已安裝且已啟用的 OpenClaw Plugin 已註冊的 Plugin 工具。
- 讓此功能保持明確啟用且預設關閉。

安全性與信任注意事項：

- 這會擴大 ACP harness 工具介面。
- ACP 代理程式只能存取 gateway 中已作用的 Plugin 工具。
- 請將此視為與允許那些 Plugin 在 OpenClaw 本身執行相同的信任邊界。
- 啟用前請審查已安裝的 Plugin。

自訂 `mcpServers` 仍會如同先前運作。內建 Plugin 工具橋接是額外的選擇性便利功能，不是一般 MCP server 設定的替代品。

### OpenClaw 工具 MCP 橋接

預設情況下，ACPX 工作階段也**不會**透過 MCP 暴露內建 OpenClaw 工具。
當 ACP 代理程式需要選定的內建工具（例如 `cron`）時，請啟用獨立的核心工具橋接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

這會執行以下事項：

- 將名為 `openclaw-tools` 的內建 MCP server 注入 ACPX 工作階段
  bootstrap。
- 暴露選定的內建 OpenClaw 工具。初始 server 暴露 `cron`。
- 讓核心工具暴露保持明確啟用且預設關閉。

### 執行階段逾時設定

`acpx` Plugin 預設將嵌入式執行階段 turn 設為 120 秒
逾時。這讓 Gemini CLI 等較慢的 harness 有足夠時間完成
ACP 啟動和初始化。如果你的主機需要不同的執行階段限制，請覆寫它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

變更此值後請重新啟動 gateway。

### 健康探測代理程式設定

當 `/acp doctor` 或啟動探測檢查後端時，隨附的 `acpx`
Plugin 會探測一個 harness 代理程式。如果已設定 `acp.allowedAgents`，它預設使用
第一個允許的代理程式；否則預設使用 `codex`。如果你的部署需要不同的 ACP 代理程式來執行健康檢查，請明確設定探測代理程式：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

變更此值後請重新啟動 gateway。

## 權限設定

ACP 工作階段以非互動方式執行，沒有 TTY 可核准或拒絕檔案寫入與 shell 執行權限提示。acpx Plugin 提供兩個設定鍵來控制權限處理方式：

這些 ACPX harness 權限與 OpenClaw exec 核准分開，也與 CLI 後端供應商旁路旗標（例如 Claude CLI `--permission-mode bypassPermissions`）分開。ACPX `approve-all` 是 ACP 工作階段在 harness 層級的 break-glass 開關。

### `permissionMode`

控制 harness 代理程式可在不提示的情況下執行哪些操作。

| 值              | 行為                                                      |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 自動核准所有檔案寫入和 shell 指令。                      |
| `approve-reads` | 只自動核准讀取；寫入和 exec 需要提示。                   |
| `deny-all`      | 拒絕所有權限提示。                                        |

### `nonInteractivePermissions`

控制當權限提示原本會顯示，但沒有可用互動式 TTY 時會發生什麼事（ACP 工作階段一律如此）。

| 值     | 行為                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止工作階段。**（預設）**              |
| `deny` | 靜默拒絕權限並繼續（優雅降級）。                            |

### 設定

透過 Plugin 設定：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

變更這些值後請重新啟動 gateway。

<Warning>
OpenClaw 預設為 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非互動式 ACP 工作階段中，任何觸發權限提示的寫入或 exec 都可能因 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 而失敗。

如果你需要限制權限，請將 `nonInteractivePermissions` 設為 `deny`，讓工作階段優雅降級，而不是當機。
</Warning>

## 相關

- [ACP 代理程式](/zh-TW/tools/acp-agents) — 概觀、操作員手冊、概念
- [子代理程式](/zh-TW/tools/subagents)
- [多代理程式路由](/zh-TW/concepts/multi-agent)
