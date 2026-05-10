---
read_when:
    - 您想使用隨附的 Codex 應用程式伺服器測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅限 Codex 的部署失敗，而不是回退至 Pi
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理程式回合
title: Codex 測試框架
x-i18n:
    generated_at: "2026-05-10T19:42:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

內建的 `codex` Plugin 讓 OpenClaw 透過 Codex app-server 執行嵌入式 OpenAI agent 回合，而不是使用內建的 PI harness。

當你想讓 Codex 擁有低階 agent session 時，請使用 Codex harness：原生 thread resume、原生 tool continuation、原生 compaction，以及 app-server 執行。OpenClaw 仍然擁有 chat channels、session files、model selection、OpenClaw dynamic tools、approvals、media delivery，以及可見的 transcript mirror。

一般設定使用標準 OpenAI model refs，例如 `openai/gpt-5.5`。不要設定 `openai-codex/gpt-*` model refs。`openai-codex` 是 Codex OAuth 或 Codex API-key profiles 的 auth profile provider，不是新 agent config 的 model provider prefix。

若要了解更完整的 model/provider/runtime 分工，請先閱讀 [Agent runtimes](/zh-TW/concepts/agent-runtimes)。簡短版本是：`openai/gpt-5.5` 是 model ref，`codex` 是 runtime，而 Telegram、Discord、Slack 或其他 channel 仍然是溝通介面。

## 需求

- 可用內建 `codex` Plugin 的 OpenClaw。
- 如果你的 config 使用 `plugins.allow`，請包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。內建 Plugin 預設會管理相容的 Codex app-server binary，因此 `PATH` 上的本機 `codex` commands 不會影響一般 harness 啟動。
- 可透過 `openclaw models auth login --provider openai-codex`、agent Codex home 中的 app-server account，或明確的 Codex API-key auth profile 使用 Codex auth。

關於 auth precedence、environment isolation、自訂 app-server commands、model discovery，以及所有 config fields，請參閱 [Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

想在 OpenClaw 中使用 Codex 的多數使用者會需要這條路徑：使用 ChatGPT/Codex 訂閱登入，啟用內建的 `codex` Plugin，並使用標準 `openai/gpt-*` model ref。

使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai-codex
```

啟用內建的 `codex` Plugin 並選取 OpenAI agent model：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

如果你的 config 使用 `plugins.allow`，也請在那裡加入 `codex`：

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

變更 Plugin config 後請重新啟動 Gateway。如果既有 chat 已有 session，請在測試 runtime 變更前使用 `/new` 或 `/reset`，讓下一個回合從目前 config 解析 harness。

## 設定

快速開始 config 是最小可用的 Codex harness config。在 OpenClaw config 中設定 Codex harness options，並且只將 CLI 用於 Codex auth：

| 需求                                   | 設定                                                               | 位置                           |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| 啟用 harness                           | `plugins.entries.codex.enabled: true`                              | OpenClaw config                |
| 保留 allowlist 的 Plugin 安裝          | 在 `plugins.allow` 中包含 `codex`                                  | OpenClaw config                |
| 透過 Codex 路由 OpenAI agent 回合      | `agents.defaults.model` 或 `agents.list[].model` 為 `openai/gpt-*` | OpenClaw agent config          |
| 使用 Codex OAuth 登入                  | `openclaw models auth login --provider openai-codex`               | CLI auth profile               |
| Codex 不可用時失敗關閉                 | Provider 或 model `agentRuntime.id: "codex"`                       | OpenClaw model/provider config |
| 使用直接 OpenAI API traffic            | Provider 或 model `agentRuntime.id: "pi"` 搭配一般 OpenAI auth     | OpenClaw model/provider config |
| 調整 app-server 行為                   | `plugins.entries.codex.config.appServer.*`                         | Codex Plugin config            |
| 啟用原生 Codex Plugin apps             | `plugins.entries.codex.config.codexPlugins.*`                      | Codex Plugin config            |
| 啟用 Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                       | Codex Plugin config            |

對 Codex-backed OpenAI agent 回合使用 `openai/gpt-*` model refs。`openai-codex` 只是 Codex OAuth 和 Codex API-key profiles 的 auth-profile provider 名稱。不要撰寫新的 `openai-codex/gpt-*` model refs。

本頁其餘部分涵蓋使用者必須在常見變體之間做出的選擇：deployment shape、fail-closed routing、guardian approval policy、原生 Codex plugins，以及 Computer Use。完整 option lists、defaults、enums、discovery、environment isolation、timeouts，以及 app-server transport fields，請參閱 [Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex runtime

在你預期使用 Codex 的 chat 中使用 `/status`。Codex-backed OpenAI agent 回合會顯示：

```text
Runtime: OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server connectivity、account、rate limits、MCP servers，以及 skills。`/codex models` 會列出 harness 和 account 的即時 Codex app-server catalog。如果 `/status` 的結果出乎意料，請參閱 [疑難排解](#troubleshooting)。

## 路由與 model selection

請分開管理 provider refs 和 runtime policy：

- 使用 `openai/gpt-*` 讓 OpenAI agent 回合透過 Codex 執行。
- 不要在 config 中使用 `openai-codex/gpt-*`。執行 `openclaw doctor --fix` 來修復 legacy refs 和 stale session route pins。
- 一般 OpenAI auto mode 不一定需要 `agentRuntime.id: "codex"`，但當 deployment 應在 Codex 不可用時失敗關閉時很有用。
- 當有意採用直接 PI 行為時，`agentRuntime.id: "pi"` 會讓 provider 或 model 使用該路徑。
- `/codex ...` 從 chat 控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部 harness path。只有在使用者要求 ACP/acpx 或外部 harness adapter 時才使用。

常見 command routing：

| 使用者意圖                    | 使用                                    |
| ----------------------------- | --------------------------------------- |
| 附加目前的 chat               | `/codex bind [--cwd <path>]`            |
| 恢復既有 Codex thread         | `/codex resume <thread-id>`             |
| 列出或篩選 Codex threads      | `/codex threads [filter]`               |
| 只傳送 Codex feedback         | `/codex diagnostics [note]`             |
| 啟動 ACP/acpx task            | ACP/acpx session commands，而非 `/codex` |

| 使用情境                                             | 設定                                                             | 驗證                                    | 備註                               |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| 使用原生 Codex runtime 的 ChatGPT/Codex 訂閱         | `openai/gpt-*` 加上已啟用的 `codex` Plugin                      | `/status` 顯示 `Runtime: OpenAI Codex` | 建議路徑                           |
| Codex 不可用時失敗關閉                               | Provider 或 model `agentRuntime.id: "codex"`                    | 回合失敗，而不是 PI fallback           | 用於 Codex-only deployments        |
| 透過 PI 的直接 OpenAI API-key traffic                | Provider 或 model `agentRuntime.id: "pi"` 和一般 OpenAI auth    | `/status` 顯示 PI runtime              | 僅在有意使用 PI 時採用             |
| Legacy config                                        | `openai-codex/gpt-*`                                            | `openclaw doctor --fix` 會重寫它       | 不要以這種方式撰寫新 config        |
| ACP/acpx Codex adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                        | ACP task/session status                | 與原生 Codex harness 分離          |

`agents.defaults.imageModel` 遵循相同的 prefix 分工。一般 OpenAI route 使用 `openai/gpt-*`，只有在 image understanding 應透過有界的 Codex app-server 回合執行時，才使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 會將該 legacy prefix 重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

當所有 OpenAI agent 回合都應預設使用 Codex 時，請使用快速開始 config。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### 混合 provider 部署

這種形態會保留 Claude 作為預設 agent，並新增一個具名 Codex agent：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

使用此 config 時，`main` agent 會使用其一般 provider path，而 `codex` agent 會使用 Codex app-server。

### Fail-closed Codex 部署

對於 OpenAI agent 回合，當內建 Plugin 可用時，`openai/gpt-*` 已會解析到 Codex。當你想要書面化的 fail-closed rule 時，請加入明確的 runtime policy：

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

在強制使用 Codex 時，如果 Codex Plugin 已停用、app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## App-server policy

預設情況下，Plugin 會以 stdio transport 在本機啟動 OpenClaw 管理的 Codex binary。只有在你有意執行不同 executable 時，才設定 `appServer.command`。只有在 app-server 已在其他地方執行時，才使用 WebSocket transport：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

本機 stdio app-server sessions 預設採用受信任的本機 operator 姿態：`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及 `sandbox: "danger-full-access"`。如果本機 Codex requirements 不允許該隱含的 YOLO 姿態，OpenClaw 會改為選擇允許的 guardian permissions。

當你想讓 Codex 在 sandbox escapes 或額外 permissions 之前執行原生 auto-review 時，請使用 guardian mode：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

在本機 requirements 允許時，Guardian mode 會展開為 Codex app-server approvals，通常是 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。

關於每個 app-server field、auth order、environment isolation、discovery，以及 timeout behavior，請參閱 [Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## Commands 與 diagnostics

內建 Plugin 會在任何支援 OpenClaw text commands 的 channel 上註冊 `/codex` 作為 slash command。

常見形式：

- `/codex status` 會檢查 app-server 連線能力、模型、帳戶、速率限制、
  MCP 伺服器和 skills。
- `/codex models` 會列出即時 Codex app-server 模型。
- `/codex threads [filter]` 會列出近期的 Codex app-server threads。
- `/codex resume <thread-id>` 會將目前的 OpenClaw 工作階段附加到
  現有的 Codex thread。
- `/codex compact` 會要求 Codex app-server compact 已附加的 thread。
- `/codex review` 會為已附加的 thread 啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加 thread 的 Codex 回饋前
  先詢問。
- `/codex account` 會顯示帳戶和速率限制狀態。
- `/codex mcp` 會列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 會列出 Codex app-server skills。

對於大多數支援回報，請從發生錯誤的對話中的 `/diagnostics [note]`
開始。它會建立一份 Gateway 診斷報告，並且對於 Codex harness 工作階段，
要求核准傳送相關的 Codex 回饋 bundle。請參閱
[診斷匯出](/zh-TW/gateway/diagnostics)，了解隱私模型和群組聊天行為。

只有在你特別想為目前附加的 thread 上傳 Codex 回饋，而不需要完整的
Gateway 診斷 bundle 時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex threads

檢查失敗 Codex 執行最快的方式，通常是直接開啟原生 Codex
thread：

```bash
codex resume <thread-id>
```

從已完成的 `/diagnostics` 回覆、`/codex binding` 或
`/codex threads [filter]` 取得 thread id。

如需上傳機制和執行階段層級的診斷邊界，請參閱
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

Auth 會依照以下順序選取：

1. agent 的明確 OpenClaw Codex auth profile。
2. 該 agent 的 Codex home 中 app-server 既有的帳戶。
3. 僅限本機 stdio app-server 啟動時，若不存在 app-server 帳戶且仍需要
   OpenAI auth，則使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex auth profile 時，會從生成的
Codex 子程序移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓
Gateway 層級 API 金鑰仍可供 embeddings 或直接 OpenAI 模型使用，同時避免
原生 Codex app-server turns 意外透過 API 計費。明確的 Codex API-key profiles
和本機 stdio env-key 備援會使用 app-server 登入，而不是繼承的子程序 env。
WebSocket app-server 連線不會接收 Gateway env API-key 備援；請使用明確的
auth profile 或遠端 app-server 自己的帳戶。

如果部署需要額外的環境隔離，請將那些變數加入
`appServer.clearEnv`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` 只會影響生成的 Codex app-server 子程序。

Codex dynamic tools 預設使用 `searchable` 載入。OpenClaw 不會公開
與 Codex 原生 workspace 操作重複的 dynamic tools：`read`、`write`、
`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。其餘 OpenClaw
整合工具，例如 messaging、sessions、media、cron、browser、nodes、
gateway、`heartbeat_respond` 和 `web_search`，可透過 `openclaw` namespace
下的 Codex tool search 使用，讓初始模型 context 更小。
`sessions_yield` 和僅限 message-tool 的來源回覆會保持直接，因為那些是
turn-control contracts。Heartbeat 協作指令會告訴 Codex，在工具尚未載入時，
於結束 heartbeat turn 前搜尋 `heartbeat_respond`。

只有在連線到無法搜尋延後 dynamic tools 的自訂 Codex app-server，或偵錯完整
tool payload 時，才將 `codexDynamicToolsLoading: "direct"` 設定為 `direct`。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設值         | 含義                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 將 OpenClaw dynamic tools 直接放入初始 Codex tool context。             |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server turns 省略的額外 OpenClaw dynamic tool 名稱。                     |
| `codexPlugins`             | 已停用         | 適用於已遷移來源安裝 curated plugins 的原生 Codex plugin/app 支援。                     |

支援的 `appServer` 欄位：

| 欄位                          | 預設值                                                 | 含義                                                                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` 會生成 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                             |
| `command`                     | 受管理的 Codex binary                                  | stdio transport 的可執行檔。保留未設定即可使用受管理的 binary；只在明確覆寫時設定。                                                                                                                                               |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio transport 的引數。                                                                                                                                                                                                            |
| `url`                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                          |
| `authToken`                   | 未設定                                                 | WebSocket transport 的 bearer token。                                                                                                                                                                                              |
| `headers`                     | `{}`                                                   | 額外的 WebSocket headers。                                                                                                                                                                                                          |
| `clearEnv`                    | `[]`                                                   | OpenClaw 建立繼承環境後，從生成的 stdio app-server 程序中移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給 OpenClaw 在本機啟動時針對每個 agent 的 Codex 隔離使用。 |
| `requestTimeoutMs`            | `60000`                                                | app-server control-plane 呼叫的逾時。                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | OpenClaw 等待 `turn/completed` 時，turn-scoped Codex app-server 請求之後的安靜視窗。對於緩慢的 post-tool 或僅狀態合成階段，請提高此值。                               |
| `mode`                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO               | YOLO 或 guardian-reviewed 執行的 preset。若本機 stdio 需求省略 `danger-full-access`、`never` approval 或 `user` reviewer，隱含預設值會成為 guardian。                 |
| `approvalPolicy`              | `"never"` 或允許的 guardian approval policy            | 傳送到 thread start/resume/turn 的原生 Codex approval policy。Guardian 預設值會在允許時偏好 `"on-request"`。                                                         |
| `sandbox`                     | `"danger-full-access"` 或允許的 guardian sandbox       | 傳送到 thread start/resume 的原生 Codex sandbox mode。Guardian 預設值會在允許時偏好 `"workspace-write"`，否則為 `"read-only"`。                                      |
| `approvalsReviewer`           | `"user"` 或允許的 guardian reviewer                    | 使用 `"auto_review"` 讓 Codex 在允許時審查原生 approval prompts，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是 legacy alias。                       |
| `serviceTier`                 | 未設定                                                 | 選用的 Codex app-server service tier。`"priority"` 會啟用 fast-mode routing，`"flex"` 會要求 flex processing，`null` 會清除覆寫，而 legacy `"fast"` 會以 `"priority"` 接受。 |

OpenClaw 擁有的 dynamic tool calls 會獨立於
`appServer.requestTimeoutMs` 設定邊界：Codex `item/tool/call` 請求預設使用 30 秒
OpenClaw watchdog。正數的逐呼叫 `timeoutMs` 引數會延長或縮短該特定工具預算。
`image_generate` 工具在 tool call 未提供自己的逾時時，也會使用
`agents.defaults.imageGenerationModel.timeoutMs`，而 media-understanding
`image` 工具會使用 `tools.media.image.timeoutSeconds` 或其 60 秒 media 預設值。
Dynamic tool budgets 上限為 600000 ms。逾時時，OpenClaw 會在支援的情況下中止
tool signal，並向 Codex 回傳失敗的 dynamic-tool response，讓 turn 能繼續，
而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex turn-scoped app-server 請求後，harness 也會預期 Codex
以 `turn/completed` 完成原生 turn。如果 app-server 在該回應之後經過
`appServer.turnCompletionIdleTimeoutMs` 仍保持安靜，OpenClaw 會盡力中斷 Codex
turn、記錄診斷逾時，並釋放 OpenClaw session lane，讓後續聊天訊息不會排在
過期的原生 turn 後面。同一個 turn 的任何非終端通知，包括
`rawResponseItem/completed`，都會解除該短 watchdog，因為 Codex 已證明該 turn
仍然存活；較長的 terminal watchdog 會繼續保護真正卡住的 turns。逾時診斷會包含
最後的 app-server 通知 method，以及對 raw assistant response items，包含 item
type、role、id 和有界限的 assistant text 預覽。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` 會在 `appServer.command` 未設定時略過受管理的 binary。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性的本機測試中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於可重複的部署，建議使用設定，因為它會將 Plugin 行為保留在與其餘 Codex harness 設定相同且經審查的檔案中。

## 原生 Codex Plugin

原生 Codex Plugin 支援會在與 OpenClaw harness 回合相同的 Codex thread 中，使用 Codex app-server 自身的 app 和 Plugin 功能。OpenClaw
不會將 Codex Plugin 轉譯成合成的 `codex_plugin_*` OpenClaw
動態工具。

`codexPlugins` 只會影響選取原生 Codex harness 的 session。它
不會影響 PI 執行、一般 OpenAI provider 執行、ACP conversation
繫結，或其他 harness。

最小遷移設定：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

當 OpenClaw 建立 Codex harness session 或取代過期的 Codex thread binding 時，會計算 thread app 設定。它不會在每個回合重新計算。
變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動 gateway，讓未來的 Codex harness session 以更新後的 app 集合啟動。

若要了解遷移資格、app inventory、破壞性操作政策、
elicitations，以及原生 Plugin 診斷，請參閱
[原生 Codex Plugin](/zh-TW/plugins/codex-native-plugins)。

## Computer Use

Computer Use 有自己的設定指南：
[Codex Computer Use](/zh-TW/plugins/codex-computer-use)。

簡短來說：OpenClaw 不會內建 desktop-control app，也不會自行執行
桌面動作。它會準備 Codex app-server，驗證
`computer-use` MCP server 可用，然後讓 Codex 在 Codex-mode 回合期間擁有原生 MCP
工具呼叫。

## Runtime 邊界

Codex harness 只會變更低階的嵌入式 agent executor。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行這些
  工具，因此 OpenClaw 仍在執行路徑中。
- Codex-native shell、patch、MCP 和原生 app 工具由 Codex 擁有。
  OpenClaw 可以透過支援的 relay 觀察或封鎖選定的原生事件，
  但不會重寫原生工具引數。
- Codex 擁有原生 Compaction。OpenClaw 會保留 transcript mirror，用於 channel
  歷史、搜尋、`/new`、`/reset`，以及未來的 model 或 harness 切換。
- 媒體生成、媒體理解、TTS、核准，以及 messaging-tool
  輸出會繼續透過相符的 OpenClaw provider/model 設定。
- `tool_result_persist` 適用於 OpenClaw 擁有的 transcript 工具結果，而不是
  Codex-native 工具結果記錄。

若要了解 hook layer、支援的 V1 surface、原生權限處理、queue
steering、Codex feedback upload 機制，以及 Compaction 詳情，請參閱
[Codex harness runtime](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 不會顯示為一般 `/model` provider：** 這是新設定的預期行為。選取 `openai/gpt-*` model，啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用 PI 而非 Codex：** 請確認 model ref 是
官方 OpenAI provider 上的 `openai/gpt-*`，且 Codex Plugin 已安裝並啟用。如果測試時需要嚴格證明，請設定 provider 或
model `agentRuntime.id: "codex"`。強制的 Codex runtime 會失敗，而不是
fallback 到 PI。

**仍保留舊版 `openai-codex/*` 設定：** 執行 `openclaw doctor --fix`。
Doctor 會將舊版 model ref 重寫為 `openai/*`，移除過期的 session 和
整個 agent runtime pin，並保留現有的 auth-profile override。

**app-server 被拒絕：** 使用 Codex app-server `0.125.0` 或更新版本。
相同版本的 prerelease 或帶有 build suffix 的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom` 會被拒絕，因為 OpenClaw 會測試
穩定的 `0.125.0` protocol floor。

**`/codex status` 無法連線：** 檢查 bundled `codex` Plugin 是否已
啟用、在設定 allowlist 時 `plugins.allow` 是否包含它，以及
任何自訂 `appServer.command`、`url`、`authToken` 或 headers 是否有效。

**Model discovery 很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用 discovery。請參閱
[Codex harness reference](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket transport 立即失敗：** 檢查 `appServer.url`、`authToken`、
headers，以及遠端 app-server 是否使用相同的 Codex app-server
protocol version。

**非 Codex model 使用 PI：** 這是預期行為，除非 provider 或 model runtime
政策將其路由到另一個 harness。純粹的非 OpenAI provider ref 在
`auto` mode 中會留在其一般 provider 路徑。

**Computer Use 已安裝但工具未執行：** 從新的 session 檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果仍然存在，請重新啟動
gateway 以清除過期的原生 hook registrations。請參閱
[Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關

- [Codex harness reference](/zh-TW/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex Plugin](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [Agent runtime](/zh-TW/concepts/agent-runtimes)
- [Model provider](/zh-TW/concepts/model-providers)
- [OpenAI provider](/zh-TW/providers/openai)
- [Agent harness Plugin](/zh-TW/plugins/sdk-agent-harness)
- [Plugin hook](/zh-TW/plugins/hooks)
- [Diagnostics export](/zh-TW/gateway/diagnostics)
- [Status](/zh-TW/cli/status)
- [Testing](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
