---
read_when:
    - 安裝或設定 Claude Code / Codex / Gemini 命令列介面的 acpx harness
    - 啟用 plugin-tools 或 OpenClaw-tools MCP 橋接器
    - 設定 ACP 權限模式
summary: 設定 ACP 代理：acpx harness 設定、外掛設定、權限
title: ACP 代理 — 設定
x-i18n:
    generated_at: "2026-06-27T20:04:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

如需概覽、操作員執行手冊與概念，請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

以下章節涵蓋 acpx harness 設定、MCP 橋接的外掛設定，以及權限設定。

只有在設定 ACP/acpx 路由時才使用本頁。原生 Codex
app-server 執行階段設定請使用 [Codex harness](/zh-TW/plugins/codex-harness)。OpenAI
API 金鑰或 Codex OAuth 模型提供者設定請使用
[OpenAI](/zh-TW/providers/openai)。

Codex 有兩條 OpenClaw 路由：

| 路由                       | 設定/命令                                               | 設定頁面                                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server      | `/codex ...`, `openai/gpt-*` 代理參照                  | [Codex harness](/zh-TW/plugins/codex-harness) |
| 明確 Codex ACP 配接器      | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | 本頁                                    |

除非你明確需要 ACP/acpx 行為，否則請優先使用原生路由。

## acpx harness 支援（目前）

目前 acpx 內建 harness 別名：

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor 命令列介面：`cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `qwen`

當 OpenClaw 使用 acpx 後端時，除非你的 acpx 設定定義了自訂代理別名，否則請優先將這些值用於 `agentId`。
如果你的本機 Cursor 安裝仍將 ACP 暴露為 `agent acp`，請在 acpx 設定中覆寫 `cursor` 代理命令，而不是變更內建預設值。

直接使用 acpx 命令列介面時，也可以透過 `--agent <command>` 指向任意配接器，但該原始逃生口是 acpx 命令列介面功能（不是一般 OpenClaw `agentId` 路徑）。

模型控制取決於配接器能力。Codex ACP 模型參照會在啟動前由
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
      "openclaw",
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

執行緒繫結設定取決於頻道配接器。Discord 範例：

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

如果執行緒繫結的 ACP spawn 無法運作，請先確認配接器功能旗標：

- Discord：`channels.discord.threadBindings.spawnSessions=true`

目前對話繫結不需要建立子執行緒。它們需要作用中的對話情境，以及暴露 ACP 對話繫結的頻道配接器。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## acpx 後端的外掛設定

套件化安裝會使用官方 `@openclaw/acpx` 執行階段外掛來支援 ACP。
使用 ACP harness 工作階段前，請先安裝並啟用它：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 也可以在 `pnpm install` 後使用本機工作區外掛。

從以下命令開始：

```text
/acp doctor
```

如果你停用了 `acpx`、透過 `plugins.allow` / `plugins.deny` 拒絕它，或想要
切回套件化外掛，請使用明確的套件路徑：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

開發期間安裝本機工作區：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然後確認後端健康狀態：

```text
/acp doctor
```

### acpx 命令與版本設定

預設情況下，`acpx` 外掛會在閘道啟動期間註冊嵌入式 ACP 後端，
並在閘道 `ready` 訊號前等待嵌入式執行階段啟動探測。只有在腳本或環境
刻意保持啟動探測停用時，才設定 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` 或
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1`。執行 `/acp doctor` 可進行明確的
隨選探測。

在外掛設定中覆寫命令或版本：

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

- `command` 接受絕對路徑、相對路徑（從 OpenClaw 工作區解析）或命令名稱。
- `expectedVersion: "any"` 會停用嚴格版本比對。
- 自訂 `command` 路徑會停用外掛本機自動安裝。

當路徑或旗標值應保留為單一 argv token 時，請用結構化引數覆寫個別 ACP 代理命令：

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

- `agents.<id>.command` 是該 ACP 代理的可執行檔或現有命令字串。
- `agents.<id>.args` 是選用項目。OpenClaw 將其傳遞到目前 acpx 命令字串登錄前，會先對每個陣列項目進行 shell quote。

請參閱[外掛](/zh-TW/tools/plugin)。

### 自動相依性安裝

當你使用 `npm install -g openclaw` 全域安裝 OpenClaw 時，acpx
執行階段相依性（平台特定二進位檔）會透過 postinstall hook 自動安裝。
如果自動安裝失敗，閘道仍會正常啟動，並透過 `openclaw acp doctor`
回報缺少的相依性。

### 外掛工具 MCP 橋接

預設情況下，ACPX 工作階段**不會**將 OpenClaw 外掛註冊的工具暴露給
ACP harness。

如果你希望 Codex 或 Claude Code 等 ACP 代理呼叫已安裝的
OpenClaw 外掛工具，例如記憶回想/儲存，請啟用專用橋接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

這會執行以下事項：

- 將名為 `openclaw-plugin-tools` 的內建 MCP 伺服器注入 ACPX 工作階段
  bootstrap。
- 暴露已由已安裝且已啟用 OpenClaw
  外掛註冊的外掛工具。
- 保持此功能為明確啟用，且預設關閉。

安全性與信任注意事項：

- 這會擴大 ACP harness 工具表面。
- ACP 代理只能存取閘道中已作用的外掛工具。
- 請將此視為允許那些外掛在
  OpenClaw 本身執行時相同的信任邊界。
- 啟用前請檢閱已安裝的外掛。

自訂 `mcpServers` 仍會照常運作。內建外掛工具橋接是額外的選擇性便利功能，不是通用 MCP 伺服器設定的替代品。

### OpenClaw 工具 MCP 橋接

預設情況下，ACPX 工作階段也**不會**透過
MCP 暴露內建 OpenClaw 工具。當 ACP 代理需要 `cron` 等選定
內建工具時，請啟用獨立的核心工具橋接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

這會執行以下事項：

- 將名為 `openclaw-tools` 的內建 MCP 伺服器注入 ACPX 工作階段
  bootstrap。
- 暴露選定的內建 OpenClaw 工具。初始伺服器會暴露 `cron`。
- 保持核心工具暴露為明確啟用，且預設關閉。

### 執行階段操作逾時設定

`acpx` 外掛預設會給嵌入式執行階段啟動與控制操作 120
秒。這會讓 Gemini CLI 等較慢的 harness 有足夠時間
完成 ACP 啟動與初始化。如果你的主機需要不同的
操作限制，請覆寫它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

執行階段回合會使用 OpenClaw 代理/執行逾時，包括 `/acp timeout`。
`sessions_spawn` 不接受每次呼叫的逾時覆寫。變更此值後請重新啟動
閘道。

### 健康探測代理設定

當 `/acp doctor` 或啟動探測檢查後端時，隨附的 `acpx`
外掛會探測一個 harness 代理。如果設定了 `acp.allowedAgents`，預設為
第一個允許的代理；否則預設為 `codex`。如果你的部署
需要使用不同 ACP 代理進行健康檢查，請明確設定探測代理：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

變更此值後請重新啟動閘道。

## 權限設定

ACP 工作階段以非互動方式執行，沒有 TTY 可用來核准或拒絕檔案寫入與 shell-exec 權限提示。acpx 外掛提供兩個設定鍵，用來控制權限處理方式：

這些 ACPX harness 權限與 OpenClaw exec 核准分開，也與 Claude CLI `--permission-mode bypassPermissions` 等命令列介面後端廠商繞過旗標分開。ACPX `approve-all` 是 ACP 工作階段的 harness 層級破窗開關。

如需 OpenClaw `tools.exec.mode`、Codex Guardian
核准與 ACPX harness 權限之間更廣泛的比較，請參閱
[權限模式](/zh-TW/tools/permission-modes)。

### `permissionMode`

控制 harness 代理可以在不提示的情況下執行哪些操作。

| 值              | 行為                                                 |
| --------------- | ---------------------------------------------------- |
| `approve-all`   | 自動核准所有檔案寫入與 shell 命令。                 |
| `approve-reads` | 僅自動核准讀取；寫入與 exec 需要提示。              |
| `deny-all`      | 拒絕所有權限提示。                                  |

### `nonInteractivePermissions`

控制在應顯示權限提示但沒有可用互動式 TTY 時會發生什麼情況（ACP 工作階段一律如此）。

| 值     | 行為                                                          |
| ------ | ------------------------------------------------------------- |
| `fail` | 使用 `AcpRuntimeError` 中止工作階段。**（預設）**             |
| `deny` | 靜默拒絕權限並繼續（優雅降級）。                             |

### 設定

透過外掛設定來設定：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

變更這些值後請重新啟動閘道。

<Warning>
OpenClaw 預設為 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非互動式 ACP 工作階段中，任何觸發權限提示的寫入或 exec 都可能因 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 而失敗。

如果你需要限制權限，請將 `nonInteractivePermissions` 設為 `deny`，讓工作階段優雅降級，而不是當機。
</Warning>

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents) — 概覽、操作員執行手冊、概念
- [子代理](/zh-TW/tools/subagents)
- [多代理路由](/zh-TW/concepts/multi-agent)
