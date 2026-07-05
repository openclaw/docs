---
read_when:
    - 安裝或設定 Claude Code / Codex / Gemini CLI 的 acpx 測試框架
    - 啟用 plugin-tools 或 OpenClaw-tools MCP 橋接器
    - 設定 ACP 權限模式
summary: 設定 ACP 代理程式：acpx 測試框架設定、外掛設定、權限
title: ACP 代理 — 設定
x-i18n:
    generated_at: "2026-07-05T11:44:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

如需概覽、操作員執行手冊與概念，請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

本頁涵蓋 acpx harness 設定、MCP 橋接的外掛設定，以及權限設定。

只有在設定 ACP/acpx 路徑時才使用本頁。若要設定原生 Codex
app-server 執行階段，請使用 [Codex harness](/zh-TW/plugins/codex-harness)。若要設定
OpenAI API 金鑰或 Codex OAuth 模型提供者，請使用
[OpenAI](/zh-TW/providers/openai)。

Codex 有兩條 OpenClaw 路徑：

| 路徑                       | 設定/命令                                              | 設定頁面                                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server      | `/codex ...`, `openai/gpt-*` agent refs                | [Codex harness](/zh-TW/plugins/codex-harness) |
| 明確的 Codex ACP adapter   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 本頁                                    |

除非你明確需要 ACP/acpx 行為，否則請優先使用原生路徑。

## acpx harness 支援（目前）

內建 acpx harness 別名（來自釘選的 `acpx` 相依套件）：

| 別名         | 包裝                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP 橋接（原生 `openclaw acp`）                                                                        |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` 和 `factorydroid` 也會解析為內建的 `droid` adapter。

當 OpenClaw 使用 acpx 後端時，除非你的 acpx 設定定義了自訂代理別名，否則 `agentId` 請優先使用這些值。
如果你的本機 Cursor 安裝仍以 `agent acp` 暴露 ACP，請在你的 acpx 設定中覆寫 `cursor` 代理命令，而不是變更內建預設值。

直接使用 acpx 命令列介面時，也可以透過 `--agent <command>` 指向任意 adapter，但這個原始逃生口是 acpx 命令列介面功能（不是一般 OpenClaw `agentId` 路徑）。

模型控制取決於 adapter 能力。Codex ACP 模型 ref 會在啟動前由
OpenClaw 正規化。其他 harness 需要 ACP `models` 加上
`session/set_model` 支援；如果某個 harness 既未暴露該 ACP 能力，
也沒有自己的啟動模型旗標，OpenClaw/acpx 就無法強制選取模型。

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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Defaults are coalesceIdleMs: 350, maxChunkChars: 1800; shown explicitly here.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

執行緒綁定設定依通道 adapter 而定。Discord 範例：

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
        // Default is already true; shown explicitly here.
        spawnSessions: true,
      },
    },
  },
}
```

如果綁定執行緒的 ACP spawn 無法運作，請先確認 adapter 功能旗標：

- Discord: `channels.discord.threadBindings.spawnSessions=true`

目前對話綁定不需要建立子執行緒。它們需要有效的對話情境，以及暴露 ACP 對話綁定的通道 adapter。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## acpx 後端的外掛設定

封裝安裝使用官方 `@openclaw/acpx` 執行階段外掛來處理 ACP。
使用 ACP harness 工作階段前，請先安裝並啟用它：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 也可以在 `pnpm install` 後使用本機工作區外掛。

從這裡開始：

```text
/acp doctor
```

如果你停用了 `acpx`、透過 `plugins.allow` / `plugins.deny` 拒絕它，或想
切回封裝外掛，請使用明確的套件路徑：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

開發期間的本機工作區安裝：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

接著驗證後端健康狀態：

```text
/acp doctor
```

### acpx 執行階段啟動探測

`acpx` 外掛會直接嵌入 ACP 執行階段（沒有要設定的獨立 `acpx` binary 或
版本）。預設情況下，它會在閘道啟動期間註冊嵌入式後端，並在閘道 `ready`
訊號前等待啟動探測。只有在腳本或環境刻意停用啟動探測時，才設定
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` 或
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1`。執行 `/acp doctor` 可進行明確的
隨選探測。

當路徑或旗標值應保持為一個 argv token 時，請使用結構化引數覆寫個別 ACP 代理命令：

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

- `agents.<id>.command` 是該 ACP 代理的可執行檔或既有命令字串。
- `agents.<id>.args` 是選用的。OpenClaw 將每個陣列項目傳入目前 acpx 命令字串 registry 前，都會先做 shell quoting。

請參閱[外掛](/zh-TW/tools/plugin)。

### 自動下載 adapter

`acpx` 會在第一次使用時透過 `npx` 自動下載 ACP adapter（例如 Claude 和 Codex ACP
橋接）。你不需要手動安裝 adapter 套件，而且 OpenClaw 本身沒有獨立的 postinstall 步驟。如果
adapter 下載或 spawn 失敗，`/acp doctor` 會回報該失敗。

### 外掛工具 MCP 橋接

預設情況下，ACPX 工作階段**不會**將 OpenClaw 外掛註冊的工具暴露給
ACP harness。

如果你希望 Codex 或 Claude Code 等 ACP 代理呼叫已安裝的
OpenClaw 外掛工具，例如記憶回想/儲存，請啟用專用橋接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

這會做什麼：

- 將名為 `openclaw-plugin-tools` 的內建 MCP server 注入 ACPX 工作階段
  bootstrap。
- 暴露已安裝且已啟用的 OpenClaw 外掛所註冊的外掛工具。
- 讓此功能保持明確且預設關閉。

安全性與信任注意事項：

- 這會擴大 ACP harness 的工具面。
- ACP 代理只會取得閘道中已啟用之外掛工具的存取權。
- 請將此視為讓那些外掛在 OpenClaw 本身中執行時相同的信任邊界。
- 啟用前請審查已安裝的外掛。

自訂 `mcpServers` 仍會如以往運作。內建的 plugin-tools 橋接是額外的選擇性便利功能，不是一般 MCP server 設定的替代品。

### OpenClaw 工具 MCP 橋接

預設情況下，ACPX 工作階段也**不會**透過
MCP 暴露內建 OpenClaw 工具。當 ACP 代理需要選定的
內建工具（例如 `cron`）時，請啟用獨立的 core-tools 橋接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

這會做什麼：

- 將名為 `openclaw-tools` 的內建 MCP server 注入 ACPX 工作階段
  bootstrap。
- 暴露選定的內建 OpenClaw 工具。初始 server 會暴露 `cron`。
- 讓核心工具暴露保持明確且預設關閉。

### 執行階段操作逾時設定

`acpx` 外掛預設會給嵌入式執行階段啟動與控制操作 120
秒。這讓 Gemini CLI 等較慢的 harness 有足夠時間
完成 ACP 啟動與初始化。如果你的主機需要不同的
操作限制，請覆寫它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

執行階段 turn 會使用 OpenClaw 代理/執行逾時，包括 `/acp timeout`。
`sessions_spawn` 不接受每次呼叫的逾時覆寫；操作員路徑是
`agents.defaults.subagents.runTimeoutSeconds`。變更 `timeoutSeconds` 後請重新啟動閘道。

### 健康探測代理設定

當 `/acp doctor` 或啟動探測檢查後端時，隨附的 `acpx`
外掛會探測一個 harness 代理。如果已設定 `acp.allowedAgents`，預設會使用
第一個允許的代理；否則預設為 `codex`。如果你的部署需要
不同的 ACP 代理進行健康檢查，請明確設定探測代理：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

變更此值後請重新啟動閘道。

## 權限設定

ACP 工作階段會以非互動方式執行，沒有 TTY 可用來核准或拒絕檔案寫入與 shell 執行權限提示。acpx 外掛提供兩個設定鍵，用來控制權限處理方式：

這些 ACPX harness 權限與 OpenClaw exec 核准分開，也與 CLI 後端供應商的 bypass 旗標分開，例如 Claude CLI `--permission-mode bypassPermissions`。ACPX `approve-all` 是 ACP 工作階段的 harness 層級 break-glass 開關。

如需 OpenClaw `tools.exec.mode`、Codex Guardian
核准與 ACPX harness 權限之間更廣泛的比較，請參閱
[權限模式](/zh-TW/tools/permission-modes)。

### `permissionMode`

控制 harness 代理可在不提示的情況下執行哪些操作。

| 值              | 行為                                                  |
| --------------- | ----------------------------------------------------- |
| `approve-all`   | 自動核准所有檔案寫入和 shell 命令。                  |
| `approve-reads` | 僅自動核准讀取；寫入和執行需要提示。                 |
| `deny-all`      | 拒絕所有權限提示。                                   |

### `nonInteractivePermissions`

控制在原本會顯示權限提示，但沒有可用互動式 TTY 時會發生什麼事（ACP 工作階段一律如此）。

| 值     | 行為                                                                     |
| ------ | ------------------------------------------------------------------------ |
| `fail` | 使用 `PermissionPromptUnavailableError` 中止工作階段。**（預設）**      |
| `deny` | 靜默拒絕權限並繼續（平順降級）。                                       |

### 設定

透過外掛設定來設定：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

變更這些值後，重新啟動閘道。

<Warning>
OpenClaw 預設為 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非互動式 ACP 工作階段中，任何觸發權限提示的寫入或執行都可能因 `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` 而失敗。

如果你需要限制權限，請將 `nonInteractivePermissions` 設為 `deny`，讓工作階段平順降級，而不是當機。
</Warning>

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents) — 概觀、操作員執行手冊、概念
- [子代理](/zh-TW/tools/subagents)
- [多代理路由](/zh-TW/concepts/multi-agent)
