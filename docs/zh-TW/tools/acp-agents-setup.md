---
read_when:
    - 安裝或設定 Claude Code / Codex / Gemini 命令列介面的 acpx 測試框架
    - 啟用 plugin-tools 或 OpenClaw-tools MCP 橋接器
    - 設定 ACP 權限模式
summary: 設定 ACP 代理：acpx 控制框架設定、外掛設定、權限
title: ACP 代理程式 — 設定
x-i18n:
    generated_at: "2026-07-16T11:59:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

如需概覽、操作手冊和概念說明，請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

本頁涵蓋 acpx 執行框架設定、MCP 橋接器的外掛設定，以及權限設定。

僅在設定 ACP/acpx 路徑時使用本頁。若要設定原生 Codex
app-server 執行階段，請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。若要設定
OpenAI API 金鑰或 Codex OAuth 模型提供者，請參閱
[OpenAI](/zh-TW/providers/openai)。

Codex 有兩條 OpenClaw 路徑：

| 路徑                       | 設定／命令                                              | 設定頁面                                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server     | `/codex ...`、`openai/gpt-*` 代理程式參照                | [Codex 執行框架](/zh-TW/plugins/codex-harness) |
| 明確指定的 Codex ACP 轉接器 | `/acp spawn codex`、`runtime: "acp", agentId: "codex"` | 本頁                                    |

除非明確需要 ACP/acpx 行為，否則請優先使用原生路徑。

## acpx 執行框架支援（目前）

內建 acpx 執行框架別名（來自鎖定的 `acpx` 相依套件）：

| 別名         | 包裝                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex 命令列介面](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot 命令列介面](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor 命令列介面](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini 命令列介面](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow 命令列介面](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi 命令列介面](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro 命令列介面](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP 橋接器（原生 `openclaw acp`）                                                                     |
| `pi`         | [Pi 程式設計代理程式](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder 命令列介面](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae 命令列介面](https://docs.trae.cn/cli)                                                                            |

`factory-droid` 和 `factorydroid` 也會解析為內建的 `droid` 轉接器。

OpenClaw 使用 acpx 後端時，除非 acpx 設定定義了自訂代理程式別名，否則 `agentId` 請優先使用這些值。
如果你的本機 Cursor 安裝仍將 ACP 公開為 `agent acp`，請在 acpx 設定中覆寫 `cursor` 代理程式命令，而不要變更內建預設值。

直接使用 acpx 命令列介面時，也可以透過 `--agent <command>` 指定任意轉接器，但這個原始逃生出口是 acpx 命令列介面的功能（並非一般的 OpenClaw `agentId` 路徑）。

模型控制取決於轉接器的能力。OpenClaw 會在啟動前將 Codex ACP 模型參照
正規化。其他執行框架需要 ACP `models` 加上
`session/set_model` 支援；如果執行框架既未公開該 ACP 能力，
也沒有自己的啟動模型旗標，OpenClaw/acpx 就無法強制選擇模型。

## 必要設定

核心 ACP 基準設定：

```json5
{
  acp: {
    enabled: true,
    // 選用。預設為 true；設為 false 可暫停 ACP 分派，同時保留 /acp 控制功能。
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
      // 預設值為 coalesceIdleMs: 350、maxChunkChars: 1800；此處明確列出。
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

討論串繫結設定因頻道轉接器而異。以下是 Discord 的範例：

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
        // 預設值已是 true；此處明確列出。
        spawnSessions: true,
      },
    },
  },
}
```

如果繫結討論串的 ACP 產生功能無法運作，請先確認轉接器功能旗標：

- Discord：`channels.discord.threadBindings.spawnSessions=true`

目前對話繫結不需要建立子討論串。它們需要有效的對話內容脈絡，以及可公開 ACP 對話繫結的頻道轉接器。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## acpx 後端的外掛設定

套件安裝版本使用官方 `@openclaw/acpx` 執行階段外掛來支援 ACP。
使用 ACP 執行框架工作階段前，請先安裝並啟用它：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼簽出版本也可以在 `pnpm install` 之後使用本機工作區外掛。

請先執行：

```text
/acp doctor
```

如果你已停用 `acpx`、透過 `plugins.allow` / `plugins.deny` 拒絕它，或想要
切換回套件外掛，請使用明確的套件路徑：

```bash
openclaw plugins install @openclaw/acpx
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

### acpx 執行階段啟動探測

`acpx` 外掛直接內嵌 ACP 執行階段（不需要另外設定 `acpx` 二進位檔或
版本）。預設情況下，它會在閘道啟動期間註冊內嵌後端，並等待啟動探測完成後，
閘道才會發出 `ready` 訊號。只有在指令碼或環境
刻意維持停用啟動探測時，才設定 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` 或
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1`。執行 `/acp doctor` 可進行明確的
隨選探測。

當路徑或旗標值應維持為單一 argv 權杖時，請使用結構化引數覆寫個別 ACP 代理程式命令：

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

- `agents.<id>.command` 是該 ACP 代理程式的可執行檔或現有命令字串。
- `agents.<id>.args` 為選用。OpenClaw 透過目前的 acpx 命令字串登錄傳遞每個陣列項目之前，都會先以 shell 引號括住該項目。

請參閱[外掛](/zh-TW/tools/plugin)。

### 自動下載轉接器

`acpx` 會在首次使用時，透過 `npx` 自動下載 ACP 轉接器
（例如 Claude 和 Codex ACP 橋接器）。你不需要手動安裝轉接器套件，
OpenClaw 本身也沒有另外的安裝後步驟。如果轉接器下載或產生失敗，
`/acp doctor` 會回報失敗。

### 外掛工具 MCP 橋接器

預設情況下，ACPX 工作階段**不會**向 ACP 執行框架公開由 OpenClaw 外掛註冊的工具。

如果希望 Codex 或 Claude Code 等 ACP 代理程式呼叫已安裝的
OpenClaw 外掛工具（例如記憶回想／儲存），請啟用專用橋接器：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

此功能會：

- 將名為 `openclaw-plugin-tools` 的內建 MCP 伺服器注入 ACPX 工作階段
  啟動程序。
- 公開已由安裝且啟用的 OpenClaw
  外掛註冊的工具。
- 將有效 ACP 工作階段身分傳遞給外掛工具工廠，讓
  代理程式範圍工具維持在該代理程式的命名空間中。
- 讓此功能維持明確啟用且預設關閉。

安全性與信任注意事項：

- 這會擴大 ACP 執行框架的工具介面。
- ACP 代理程式只能存取閘道中已啟用的外掛工具。
- 請將此視為與允許這些外掛在
  OpenClaw 本身執行相同的信任邊界。
- 啟用前請檢閱已安裝的外掛。

自訂 `mcpServers` 仍會照常運作。內建外掛工具橋接器是額外的選用便利功能，
並非一般 MCP 伺服器設定的替代品。

### OpenClaw 工具 MCP 橋接器

預設情況下，ACPX 工作階段也**不會**透過
MCP 公開內建 OpenClaw 工具。當 ACP 代理程式需要選定的
內建工具（例如 `cron`）時，請啟用獨立的核心工具橋接器：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

此功能會：

- 將名為 `openclaw-tools` 的內建 MCP 伺服器注入 ACPX 工作階段
  啟動程序。
- 公開選定的內建 OpenClaw 工具。初始伺服器會公開 `cron`。
- 讓核心工具公開功能維持明確啟用且預設關閉。

### 執行階段操作逾時設定

`acpx` 外掛預設為內嵌執行階段的啟動和控制操作提供 120
秒。這讓 Gemini 命令列介面等速度較慢的執行框架，有足夠時間
完成 ACP 啟動和初始化。如果主機需要不同的操作時間限制，請覆寫此值：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

執行階段輪次使用 OpenClaw 代理程式／執行逾時，包括 `/acp timeout`。
`sessions_spawn` 不接受每次呼叫的逾時覆寫；操作員路徑
是 `agents.defaults.subagents.runTimeoutSeconds`。變更
`timeoutSeconds` 後，請重新啟動閘道。

### 健康探測代理程式設定

當 `/acp doctor` 或啟動探測檢查後端時，隨附的 `acpx`
外掛會探測一個執行框架代理程式。如果已設定 `acp.allowedAgents`，則預設為
第一個允許的代理程式；否則預設為 `codex`。如果部署環境
需要使用不同的 ACP 代理程式進行健康檢查，請明確設定探測代理程式：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

變更此值後，請重新啟動閘道。

## 權限設定

ACP 工作階段以非互動方式執行，因此沒有 TTY 可核准或拒絕檔案寫入與 shell 執行權限提示。acpx 外掛提供兩個設定鍵，用於控制權限的處理方式：

這些 ACPX 執行框架權限與 OpenClaw 執行核准分開，也與 Claude CLI `--permission-mode bypassPermissions` 等命令列介面後端供應商略過旗標分開。ACPX `approve-all` 是 ACP 工作階段在執行框架層級的緊急解鎖開關。

若要瞭解 OpenClaw `tools.exec.mode`、Codex Guardian
核准與 ACPX 執行框架權限之間更廣泛的比較，請參閱
[權限模式](/zh-TW/tools/permission-modes)。

### `permissionMode`

控制執行框架代理程式可以在不提示的情況下執行哪些作業。

| 值              | 行為                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 自動核准所有檔案寫入與 shell 命令。          |
| `approve-reads` | 僅自動核准讀取；寫入與執行需要提示。 |
| `deny-all`      | 拒絕所有權限提示。                              |

### `nonInteractivePermissions`

控制在應顯示權限提示但沒有互動式 TTY 可用時的處理方式（ACP 工作階段一律如此）。

| 值  | 行為                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | 以 `PermissionPromptUnavailableError` 中止工作階段。**（預設）** |
| `deny` | 靜默拒絕權限並繼續執行（優雅降級）。        |

### 設定

透過外掛設定：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

變更這些值後，請重新啟動閘道。

<Warning>
OpenClaw 預設為 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非互動式 ACP 工作階段中，任何觸發權限提示的寫入或執行作業都可能因 `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` 而失敗。

如果需要限制權限，請將 `nonInteractivePermissions` 設為 `deny`，讓工作階段優雅降級，而不是當機。
</Warning>

## 相關內容

- [ACP 代理程式](/zh-TW/tools/acp-agents) — 概觀、操作人員執行手冊、概念
- [子代理程式](/zh-TW/tools/subagents)
- [多代理程式路由](/zh-TW/concepts/multi-agent)
