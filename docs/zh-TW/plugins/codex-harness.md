---
read_when:
    - 您想要使用隨附的 Codex app-server harness
    - 你需要 Codex harness 設定範例
    - 你希望僅限 Codex 的部署失敗，而不是回退到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-12T08:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 讓 OpenClaw 透過 Codex app-server 執行嵌入式 OpenAI agent 回合，而不是使用內建的 PI harness。

當你希望 Codex 擁有低階 agent 工作階段時，請使用 Codex harness：原生 thread resume、原生 tool continuation、原生 compaction，以及 app-server 執行。OpenClaw 仍然擁有聊天通道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、媒體傳遞，以及可見逐字稿鏡像。

一般設定會使用標準 OpenAI 模型參照，例如 `openai/gpt-5.5`。不要設定 `openai-codex/gpt-*` 模型參照。請將 OpenAI agent 驗證順序放在 `auth.order.openai` 底下；較舊的 `openai-codex:*` 設定檔與 `auth.order.openai-codex` 項目仍支援現有安裝。

OpenClaw 會以 Codex 原生 code mode 與僅啟用 code mode 的方式啟動 Codex app-server threads。這會讓延遲/可搜尋的 OpenClaw 動態工具保留在 Codex 自己的程式碼執行與工具搜尋介面內，而不是在 Codex 之上再加上一層 PI 風格的工具搜尋包裝器。

若要了解更廣泛的模型/提供者/執行階段拆分，請從
[Agent runtimes](/zh-TW/concepts/agent-runtimes) 開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他通道仍是通訊介面。

## 需求

- OpenClaw，且隨附的 `codex` Plugin 可用。
- 如果你的設定使用 `plugins.allow`，請包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。隨附的 Plugin 預設會管理相容的 Codex app-server binary，因此 `PATH` 上的本機 `codex` 指令不會影響一般 harness 啟動。
- 可透過 `openclaw models auth login --provider openai-codex`、agent 的 Codex home 中的 app-server 帳戶，或明確的 Codex API-key 驗證設定檔使用 Codex 驗證。

若要了解驗證優先順序、環境隔離、自訂 app-server 指令、模型探索，以及所有設定欄位，請參閱
[Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

大多數想在 OpenClaw 中使用 Codex 的使用者會想走這條路徑：使用 ChatGPT/Codex 訂閱登入、啟用隨附的 `codex` Plugin，並使用標準 `openai/gpt-*` 模型參照。

使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai-codex
```

啟用隨附的 `codex` Plugin 並選取 OpenAI agent 模型：

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

如果你的設定使用 `plugins.allow`，也請在那裡加入 `codex`：

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

變更 Plugin 設定後請重新啟動 gateway。如果現有聊天已經有工作階段，請在測試執行階段變更前使用 `/new` 或 `/reset`，讓下一個回合從目前設定解析 harness。

## 設定

快速開始設定是最低可行的 Codex harness 設定。請在 OpenClaw 設定中設定 Codex harness 選項，並只將 CLI 用於 Codex 驗證：

| 需求                                   | 設定                                                                             | 位置                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 啟用 harness                           | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                     |
| 保留允許清單中的 Plugin 安裝           | 在 `plugins.allow` 中包含 `codex`                                                | OpenClaw 設定                     |
| 透過 Codex 路由 OpenAI agent 回合      | `agents.defaults.model` 或 `agents.list[].model` 為 `openai/gpt-*`               | OpenClaw agent 設定               |
| 使用 Codex OAuth 登入                  | `openclaw models auth login --provider openai-codex`                             | CLI 驗證設定檔                   |
| 為 Codex 執行加入 API-key 備援         | 在 `auth.order.openai` 中，將 `openai:*` API-key 設定檔列在訂閱驗證之後         | CLI 驗證設定檔 + OpenClaw 設定   |
| Codex 無法使用時以關閉方式失敗         | 提供者或模型 `agentRuntime.id: "codex"`                                          | OpenClaw 模型/提供者設定         |
| 使用直接 OpenAI API 流量               | 提供者或模型 `agentRuntime.id: "pi"` 搭配一般 OpenAI 驗證                       | OpenClaw 模型/提供者設定         |
| 調整 app-server 行為                   | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin 設定                 |
| 啟用原生 Codex Plugin apps             | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin 設定                 |
| 啟用 Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin 設定                 |

針對 Codex 支援的 OpenAI agent 回合，請使用 `openai/gpt-*` 模型參照。建議使用 `auth.order.openai` 來安排訂閱優先/API-key 備援的順序。現有的 `openai-codex:*` 驗證設定檔與 `auth.order.openai-codex` 仍然有效，但不要撰寫新的 `openai-codex/gpt-*` 模型參照。

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在這種形式下，兩個設定檔仍會針對 `openai/gpt-*` agent 回合透過 Codex 執行。API key 只是驗證備援，不是要求切換到 PI 或純 OpenAI Responses。

本頁其餘部分涵蓋使用者必須選擇的常見變體：部署形態、fail-closed 路由、guardian 核准政策、原生 Codex plugins，以及 Computer Use。若要查看完整選項清單、預設值、列舉、探索、環境隔離、逾時，以及 app-server transport 欄位，請參閱
[Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex 執行階段

在你預期使用 Codex 的聊天中使用 `/status`。Codex 支援的 OpenAI agent 回合會顯示：

```text
Runtime: OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線、帳戶、速率限制、MCP servers，以及 skills。`/codex models` 會列出 harness 與帳戶的即時 Codex app-server catalog。如果 `/status` 的結果出乎意料，請參閱
[疑難排解](#troubleshooting)。

## 路由與模型選擇

請將提供者參照與執行階段政策分開：

- 透過 Codex 執行 OpenAI agent 回合時，請使用 `openai/gpt-*`。
- 不要在設定中使用 `openai-codex/gpt-*`。請執行 `openclaw doctor --fix` 來修復舊版參照與過期的工作階段路由釘選。
- 一般 OpenAI auto mode 可不設定 `agentRuntime.id: "codex"`，但當部署應在 Codex 無法使用時以關閉方式失敗，這會很有用。
- `agentRuntime.id: "pi"` 會在有意為之時，將提供者或模型切換成直接 PI 行為。
- `/codex ...` 會從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部 harness 路徑。只有在使用者要求 ACP/acpx 或外部 harness adapter 時才使用。

常見指令路由：

| 使用者意圖                      | 使用                                    |
| ------------------------------- | --------------------------------------- |
| 附加目前聊天                    | `/codex bind [--cwd <path>]`            |
| 恢復現有 Codex thread           | `/codex resume <thread-id>`             |
| 列出或篩選 Codex threads        | `/codex threads [filter]`               |
| 僅傳送 Codex feedback           | `/codex diagnostics [note]`             |
| 啟動 ACP/acpx 工作              | ACP/acpx session commands，不是 `/codex` |

| 使用案例                                             | 設定                                                             | 驗證                                    | 備註                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱         | `openai/gpt-*` 加上啟用的 `codex` Plugin                        | `/status` 顯示 `Runtime: OpenAI Codex`  | 建議路徑                           |
| Codex 無法使用時以關閉方式失敗                       | 提供者或模型 `agentRuntime.id: "codex"`                         | 回合失敗，而不是 PI fallback            | 用於僅限 Codex 的部署              |
| 透過 PI 的直接 OpenAI API-key 流量                   | 提供者或模型 `agentRuntime.id: "pi"` 與一般 OpenAI 驗證          | `/status` 顯示 PI runtime               | 只在有意使用 PI 時使用             |
| 舊版設定                                             | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` 會重寫它        | 不要以這種方式撰寫新設定           |
| ACP/acpx Codex adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP task/session status                 | 與原生 Codex harness 分開          |

`agents.defaults.imageModel` 遵循相同的前綴拆分。一般 OpenAI 路由請使用 `openai/gpt-*`，只有當影像理解應透過受限的 Codex app-server 回合執行時，才使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 會將該舊版前綴重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

當所有 OpenAI agent 回合預設都應使用 Codex 時，請使用快速開始設定。

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

### 混合提供者部署

這種形式會將 Claude 保持為預設 agent，並加入一個具名 Codex agent：

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

使用此設定時，`main` agent 會使用其一般提供者路徑，而 `codex` agent 會使用 Codex app-server。

### Fail-closed Codex 部署

對於 OpenAI agent 回合，當隨附 Plugin 可用時，`openai/gpt-*` 已經會解析到 Codex。當你想要書面化的 fail-closed 規則時，請加入明確的執行階段政策：

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

強制使用 Codex 後，如果 Codex Plugin 已停用、app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## App-server 政策

預設情況下，Plugin 會以 stdio transport 在本機啟動 OpenClaw 管理的 Codex binary。只有在你有意執行不同 executable 時，才設定 `appServer.command`。只有在其他地方已經有 app-server 執行時，才使用 WebSocket transport：

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

本機 stdio app-server 工作階段預設採用受信任的本機操作者姿態：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。如果本機 Codex 需求不允許該
隱含 YOLO 姿態，OpenClaw 會改為選取允許的 guardian 權限。
當工作階段啟用 OpenClaw sandbox 時，OpenClaw 會將 Codex
`danger-full-access` 縮限為 Codex `workspace-write`，讓原生 Codex code-mode 回合
停留在 sandboxed 工作區內。

當你希望 Codex 在 sandbox 逃逸或額外權限前進行原生自動審查時，請使用 guardian 模式：

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

當本機需求允許這些值時，guardian 模式會展開為 Codex app-server approvals，通常是
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及
`sandbox: "workspace-write"`。

如需每個 app-server 欄位、驗證順序、環境隔離、探索與逾時行為，請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 指令與診斷

隨附的 Plugin 會在任何支援 OpenClaw 文字指令的 channel 上註冊 `/codex` 作為 slash command。

常見形式：

- `/codex status` 會檢查 app-server 連線能力、模型、帳戶、速率限制、
  MCP 伺服器和 Skills。
- `/codex models` 會列出即時 Codex app-server 模型。
- `/codex threads [filter]` 會列出最近的 Codex app-server threads。
- `/codex resume <thread-id>` 會將目前的 OpenClaw 工作階段附加到
  現有 Codex thread。
- `/codex compact` 會要求 Codex app-server compact 已附加的 thread。
- `/codex review` 會為已附加的 thread 啟動 Codex 原生 review。
- `/codex diagnostics [note]` 會在傳送已附加 thread 的 Codex feedback 前詢問。
- `/codex account` 會顯示帳戶與速率限制狀態。
- `/codex mcp` 會列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 會列出 Codex app-server Skills。

大多數支援回報，請從發生 bug 的對話中的 `/diagnostics [note]` 開始。
它會建立一份 Gateway 診斷報告；對於 Codex harness 工作階段，還會請求核准以傳送相關的 Codex feedback bundle。
請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)，了解隱私模型與群組聊天行為。

只有在你明確想為目前附加的 thread 上傳 Codex feedback，而不需要完整 Gateway
診斷 bundle 時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex threads

檢查失敗 Codex 執行最常見的最快方式，是直接開啟原生 Codex thread：

```bash
codex resume <thread-id>
```

從完成的 `/diagnostics` 回覆、`/codex binding`，或
`/codex threads [filter]` 取得 thread id。

如需上傳機制與 runtime 層級診斷邊界，請參閱
[Codex harness runtime](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

Auth 會依此順序選取：

1. 代理的排序 OpenAI auth profiles，最好位於
   `auth.order.openai` 下。既有的 `openai-codex:*` profile ids 仍然有效。
2. 該代理的 Codex home 中 app-server 現有帳戶。
3. 僅限本機 stdio app-server 啟動：當不存在 app-server 帳戶且仍需要 OpenAI auth 時，使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex auth profile 時，會從產生的 Codex child process 移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。這讓 Gateway 層級 API keys
仍可供 embeddings 或直接 OpenAI models 使用，而不會意外讓原生 Codex app-server 回合透過 API 計費。
明確的 Codex API-key profiles 和本機 stdio env-key fallback 會使用 app-server
login，而不是繼承的 child-process env。WebSocket app-server 連線不會接收 Gateway env API-key fallback；請使用明確的 auth profile 或遠端 app-server 自己的帳戶。

如果訂閱 profile 遇到 Codex 使用量限制，OpenClaw 會在 Codex 回報重設時間時記錄該時間，並在同一次
Codex 執行中嘗試下一個排序的 auth profile。重設時間過後，該訂閱 profile
會再次符合資格，而不需變更已選取的 `openai/gpt-*` 模型或 Codex runtime。

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

`appServer.clearEnv` 只會影響產生的 Codex app-server child process。

Codex dynamic tools 預設採用 `searchable` 載入。OpenClaw 不會公開
重複 Codex 原生工作區操作的 dynamic tools：`read`、`write`、
`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。其餘 OpenClaw
整合工具，例如 messaging、sessions、media、cron、browser、nodes、
gateway、`heartbeat_respond` 和 `web_search`，可透過 Codex tool
search 在 `openclaw` namespace 下使用，讓初始模型上下文更小。
`sessions_yield` 和僅限 message-tool 的 source replies 會保持 direct，因為那些是 turn-control contracts。Heartbeat 協作指示會告訴 Codex 在結束 Heartbeat 回合前搜尋
`heartbeat_respond`，前提是該工具尚未載入。

只有在連線到無法搜尋延遲 dynamic tools 的自訂 Codex
app-server，或偵錯完整 tool payload 時，才設定 `codexDynamicToolsLoading: "direct"`。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設           | 意義                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 將 OpenClaw dynamic tools 直接放入初始 Codex tool context。 |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server 回合省略的其他 OpenClaw dynamic tool names。              |
| `codexPlugins`             | disabled       | 針對已遷移、從 source 安裝的 curated plugins 的原生 Codex Plugin/app 支援。           |

支援的 `appServer` 欄位：

| 欄位                          | 預設                                                   | 意義                                                                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                |
| `command`                     | managed Codex binary                                   | stdio transport 的可執行檔。保持未設定以使用 managed binary；僅在明確 override 時設定。                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio transport 的引數。                                                                                                                                                                                                                |
| `url`                         | unset                                                  | WebSocket app-server URL。                                                                                                                                                                                                              |
| `authToken`                   | unset                                                  | WebSocket transport 的 Bearer token。                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | 額外的 WebSocket headers。                                                                                                                                                                                                              |
| `clearEnv`                    | `[]`                                                   | OpenClaw 建立繼承環境後，從產生的 stdio app-server process 移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給 OpenClaw 在本機啟動時的每代理 Codex 隔離。    |
| `requestTimeoutMs`            | `60000`                                                | app-server control-plane calls 的逾時。                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | 當 OpenClaw 等待 `turn/completed` 時，在 turn-scoped Codex app-server request 後的安靜視窗。對於較慢的 post-tool 或 status-only synthesis 階段，請提高此值。                                                                     |
| `mode`                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO              | YOLO 或 guardian-reviewed execution 的 preset。若本機 stdio 需求省略 `danger-full-access`、`never` approval，或 `user` reviewer，則隱含預設會變成 guardian。                                                   |
| `approvalPolicy`              | `"never"` 或允許的 guardian approval policy            | 傳送到 thread start/resume/turn 的原生 Codex approval policy。Guardian 預設值在允許時偏好 `"on-request"`。                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` 或允許的 guardian sandbox       | 傳送到 thread start/resume 的原生 Codex sandbox mode。Guardian 預設值在允許時偏好 `"workspace-write"`，否則為 `"read-only"`。當 OpenClaw sandbox 啟用時，`danger-full-access` 會縮限為 `"workspace-write"`。 |
| `approvalsReviewer`           | `"user"` 或允許的 guardian reviewer                    | 使用 `"auto_review"` 可在允許時讓 Codex 審查原生 approval prompts，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是 legacy alias。                                                                      |
| `serviceTier`                 | unset                                                  | 選用的 Codex app-server service tier。`"priority"` 會啟用 fast-mode routing，`"flex"` 會請求 flex processing，`null` 會清除 override，legacy `"fast"` 會被接受為 `"priority"`。                                         |

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制：Codex `item/tool/call` 請求預設使用 30 秒的
OpenClaw watchdog。正值的逐次呼叫 `timeoutMs` 引數會延長或縮短該特定工具的預算。當工具呼叫未提供自己的逾時值時，`image_generate` 工具也會使用
`agents.defaults.imageGenerationModel.timeoutMs`，而媒體理解 `image` 工具會使用
`tools.media.image.timeoutSeconds` 或其 60 秒媒體預設值。動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援的情況下中止工具訊號，並向 Codex 傳回失敗的動態工具回應，讓該輪次能夠繼續，而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex 輪次範圍的 app-server 請求後，harness 也預期 Codex 以 `turn/completed` 完成原生輪次。如果 app-server 在該回應後經過 `appServer.turnCompletionIdleTimeoutMs` 仍無動靜，OpenClaw 會盡力中斷 Codex 輪次、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，讓後續聊天訊息不會排在過時的原生輪次後面。同一輪次的任何非終止通知，包括 `rawResponseItem/completed`，都會解除這個短 watchdog，因為 Codex 已證明該輪次仍然存活；較長的終止 watchdog 會繼續保護真正卡住的輪次。全域 app-server 通知，例如速率限制更新，不會重設輪次閒置進度。當 Codex 發出已完成的 `agentMessage` 項目，接著在沒有 `turn/completed` 的情況下安靜下來，OpenClaw 會將助理輸出視為實質完成，盡力中斷原生 Codex 輪次，並釋放工作階段通道。逾時診斷包含最後一個 app-server 通知方法，且對於原始助理回應項目，包含項目類型、角色、ID，以及有界限的助理文字預覽。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當
`appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會繞過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或將
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 用於一次性的本機測試。對於可重複的部署，建議使用設定，因為它會讓 Plugin 行為與其餘 Codex harness 設定保留在同一個已審查檔案中。

## 原生 Codex Plugin

原生 Codex Plugin 支援會在與 OpenClaw harness 輪次相同的 Codex 執行緒中，使用 Codex app-server 自身的應用程式與 Plugin 能力。OpenClaw
不會將 Codex Plugin 轉譯為合成的 `codex_plugin_*` OpenClaw
動態工具。

`codexPlugins` 只會影響選取原生 Codex harness 的工作階段。它
不會影響 PI 執行、一般 OpenAI provider 執行、ACP 對話
繫結，或其他 harness。

最小遷移後設定：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

當 OpenClaw 建立 Codex harness 工作階段
或取代過時的 Codex 執行緒繫結時，會計算執行緒應用程式設定。它不會在每個輪次重新計算。
變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動 gateway，讓
未來的 Codex harness 工作階段以更新後的應用程式集合啟動。

如需遷移資格、應用程式清單、破壞性動作政策、
徵詢，以及原生 Plugin 診斷，請參閱
[原生 Codex Plugin](/zh-TW/plugins/codex-native-plugins)。

## Computer Use

Computer Use 在自己的設定指南中說明：
[Codex Computer Use](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會 vendor 桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex app-server，驗證
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式輪次期間擁有原生 MCP
工具呼叫。

## 執行階段邊界

Codex harness 只會變更低階嵌入式 agent executor。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行這些
  工具，因此 OpenClaw 仍位於執行路徑中。
- Codex 原生 shell、patch、MCP 與原生應用程式工具由 Codex 擁有。
  OpenClaw 可以透過支援的 relay 觀察或封鎖選定的原生事件，
  但不會改寫原生工具引數。
- Codex 擁有原生 Compaction。OpenClaw 會保留 transcript 鏡像，用於 channel
  歷史、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。
- 媒體生成、媒體理解、TTS、核准，以及訊息工具
  輸出會繼續透過相符的 OpenClaw provider/model 設定。
- `tool_result_persist` 適用於 OpenClaw 擁有的 transcript 工具結果，而非
  Codex 原生工具結果記錄。

如需 hook 層、支援的 V1 surface、原生權限處理、佇列
導向、Codex 回饋上傳機制，以及 Compaction 詳細資料，請參閱
[Codex harness runtime](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般 `/model` provider：** 對於
新設定，這是預期行為。選取 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用 PI 而非 Codex：** 請確認 model ref 是
官方 OpenAI provider 上的 `openai/gpt-*`，且 Codex Plugin 已
安裝並啟用。如果你在測試時需要嚴格證明，請設定 provider 或
model `agentRuntime.id: "codex"`。強制 Codex runtime 會失敗，而不是
fallback 到 PI。

**仍有舊版 `openai-codex/*` 設定：** 執行 `openclaw doctor --fix`。
Doctor 會將舊版 model ref 改寫為 `openai/*`、移除過時的工作階段與
整個 agent 的 runtime pin，並保留現有 auth-profile 覆寫。

**app-server 遭拒：** 請使用 Codex app-server `0.125.0` 或更新版本。
相同版本的 prerelease 或帶有 build suffix 的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom`，會遭到拒絕，因為 OpenClaw 會測試
穩定版 `0.125.0` protocol floor。

**`/codex status` 無法連線：** 請檢查 bundled `codex` Plugin 是否
已啟用、設定 allowlist 時 `plugins.allow` 是否包含它，以及
任何自訂 `appServer.command`、`url`、`authToken` 或 headers 是否有效。

**模型探索很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。請參閱
[Codex harness reference](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket transport 立即失敗：** 請檢查 `appServer.url`、`authToken`、
headers，以及遠端 app-server 是否使用相同的 Codex app-server
protocol 版本。

**非 Codex 模型使用 PI：** 除非 provider 或 model runtime
政策將其路由至另一個 harness，否則這是預期行為。一般非 OpenAI provider refs 在
`auto` 模式下會維持其正常 provider path。

**Computer Use 已安裝但工具未執行：** 從新的工作階段檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果仍持續發生，請重新啟動
gateway 以清除過時的原生 hook 註冊。請參閱
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
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
