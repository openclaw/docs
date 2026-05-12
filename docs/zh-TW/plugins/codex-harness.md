---
read_when:
    - 您想使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行環境設定範例
    - 你希望僅限 Codex 的部署失敗，而不是回退到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理程式回合
title: Codex 測試框架
x-i18n:
    generated_at: "2026-05-12T00:58:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 可讓 OpenClaw 透過 Codex app-server 執行嵌入式 OpenAI agent 回合，而不是使用內建 PI harness。

當你想讓 Codex 負責低階 agent session 時，請使用 Codex harness：原生 thread resume、原生 tool continuation、原生 compaction，以及 app-server execution。OpenClaw 仍然負責 chat channels、session files、model selection、OpenClaw dynamic tools、approvals、media delivery，以及可見的 transcript mirror。

一般設定會使用標準 OpenAI model refs，例如 `openai/gpt-5.5`。請勿設定 `openai-codex/gpt-*` model refs。將 OpenAI agent auth order 放在 `auth.order.openai` 下；較舊的 `openai-codex:*` profiles 和 `auth.order.openai-codex` entries 仍會支援既有安裝。

OpenClaw 會以 Codex native code mode 和 code-mode-only enabled 啟動 Codex app-server threads。這會將 deferred/searchable OpenClaw dynamic tools 保留在 Codex 自己的 code execution 和 tool-search surface 內，而不是在 Codex 之上再加入 PI-style tool-search wrapper。

若要了解更廣泛的 model/provider/runtime 分工，請從
[Agent runtimes](/zh-TW/concepts/agent-runtimes) 開始。簡短版本是：
`openai/gpt-5.5` 是 model ref，`codex` 是 runtime，而 Telegram、Discord、Slack 或其他 channel 仍是 communication surface。

## 需求

- 可使用隨附 `codex` Plugin 的 OpenClaw。
- 如果你的 config 使用 `plugins.allow`，請包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。隨附 Plugin 預設會管理相容的 Codex app-server binary，因此 `PATH` 上的本機 `codex` commands 不會影響一般 harness startup。
- 可透過 `openclaw models auth login --provider openai-codex`、agent 的 Codex home 中的 app-server account，或明確的 Codex API-key auth profile 使用 Codex auth。

若要了解 auth precedence、environment isolation、custom app-server commands、model discovery，以及所有 config fields，請參閱
[Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

多數想在 OpenClaw 中使用 Codex 的使用者會想走這條路徑：使用 ChatGPT/Codex subscription 登入、啟用隨附的 `codex` Plugin，並使用標準 `openai/gpt-*` model ref。

使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai-codex
```

啟用隨附的 `codex` Plugin 並選取 OpenAI agent model：

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

變更 Plugin config 後，請重新啟動 Gateway。如果既有 chat 已經有 session，請先使用 `/new` 或 `/reset` 再測試 runtime 變更，讓下一個回合從目前 config 解析 harness。

## 設定

快速開始 config 是最低可行的 Codex harness config。在 OpenClaw config 中設定 Codex harness options，CLI 只用於 Codex auth：

| 需求                                   | 設定                                                                             | 位置                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 啟用 harness                           | `plugins.entries.codex.enabled: true`                                            | OpenClaw config                    |
| 保留 allowlisted Plugin 安裝           | 在 `plugins.allow` 中包含 `codex`                                                | OpenClaw config                    |
| 透過 Codex 路由 OpenAI agent 回合      | `agents.defaults.model` 或 `agents.list[].model` 為 `openai/gpt-*`               | OpenClaw agent config              |
| 使用 Codex OAuth 登入                  | `openclaw models auth login --provider openai-codex`                             | CLI auth profile                   |
| 為 Codex runs 加入 API-key 備援        | `auth.order.openai` 中列在 subscription auth 之後的 `openai:*` API-key profile   | CLI auth profile + OpenClaw config |
| Codex 無法使用時 fail closed           | Provider 或 model `agentRuntime.id: "codex"`                                     | OpenClaw model/provider config     |
| 使用直接 OpenAI API 流量               | Provider 或 model `agentRuntime.id: "pi"` 搭配一般 OpenAI auth                   | OpenClaw model/provider config     |
| 調整 app-server behavior               | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin config                |
| 啟用原生 Codex Plugin apps             | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin config                |
| 啟用 Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin config                |

針對 Codex-backed OpenAI agent 回合，請使用 `openai/gpt-*` model refs。建議使用 `auth.order.openai` 來設定 subscription-first/API-key-backup ordering。既有 `openai-codex:*` auth profiles 和 `auth.order.openai-codex` 仍然有效，但不要撰寫新的 `openai-codex/gpt-*` model refs。

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在這種形態中，兩個 profiles 對 `openai/gpt-*` agent 回合仍都會透過 Codex 執行。API key 只是 auth fallback，不是要求切換到 PI 或純 OpenAI Responses。

本頁其餘部分涵蓋使用者必須選擇的常見變體：deployment shape、fail-closed routing、guardian approval policy、native Codex plugins，以及 Computer Use。若要查看完整 option lists、defaults、enums、discovery、environment isolation、timeouts，以及 app-server transport fields，請參閱
[Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex runtime

在你預期使用 Codex 的 chat 中使用 `/status`。Codex-backed OpenAI agent 回合會顯示：

```text
Runtime: OpenAI Codex
```

接著檢查 Codex app-server state：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server connectivity、account、rate limits、MCP servers 和 skills。`/codex models` 會列出 harness 和 account 的即時 Codex app-server catalog。如果 `/status` 的結果出乎意料，請參閱
[疑難排解](#troubleshooting)。

## 路由和 model selection

將 provider refs 與 runtime policy 分開：

- 針對透過 Codex 的 OpenAI agent 回合，使用 `openai/gpt-*`。
- 不要在 config 中使用 `openai-codex/gpt-*`。執行 `openclaw doctor --fix` 以修復 legacy refs 和 stale session route pins。
- 對一般 OpenAI auto mode 來說，`agentRuntime.id: "codex"` 是選用的，但當 deployment 應在 Codex 無法使用時 fail closed，這會很有用。
- `agentRuntime.id: "pi"` 會在有意這樣做時，將 provider 或 model 選入直接 PI behavior。
- `/codex ...` 會從 chat 控制原生 Codex app-server conversations。
- ACP/acpx 是另一條外部 harness path。只有當使用者要求 ACP/acpx 或 external harness adapter 時才使用。

常見 command routing：

| 使用者意圖                      | 使用                                    |
| ------------------------------- | --------------------------------------- |
| 附加目前 chat                   | `/codex bind [--cwd <path>]`            |
| 繼續既有 Codex thread           | `/codex resume <thread-id>`             |
| 列出或篩選 Codex threads        | `/codex threads [filter]`               |
| 只傳送 Codex feedback           | `/codex diagnostics [note]`             |
| 啟動 ACP/acpx task              | ACP/acpx session commands，而非 `/codex` |

| 使用情境                                             | 設定                                                             | 驗證                                    | 備註                               |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| 使用原生 Codex runtime 的 ChatGPT/Codex subscription | `openai/gpt-*` 加上啟用的 `codex` Plugin                        | `/status` 顯示 `Runtime: OpenAI Codex`  | 建議路徑                           |
| Codex 無法使用時 fail closed                         | Provider 或 model `agentRuntime.id: "codex"`                     | 回合失敗，而不是 PI fallback            | 用於 Codex-only deployments        |
| 透過 PI 的直接 OpenAI API-key 流量                   | Provider 或 model `agentRuntime.id: "pi"` 以及一般 OpenAI auth   | `/status` 顯示 PI runtime               | 僅在 PI 是有意使用時才使用         |
| Legacy config                                        | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` 會重寫它        | 不要用這種方式撰寫新 config        |
| ACP/acpx Codex adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP task/session status                 | 與原生 Codex harness 分開          |

`agents.defaults.imageModel` 遵循相同的 prefix split。一般 OpenAI route 使用 `openai/gpt-*`，只有當 image understanding 應透過 bounded Codex app-server turn 執行時，才使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 會將該 legacy prefix 重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

當所有 OpenAI agent 回合都應預設使用 Codex 時，請使用 quickstart config。

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

### Mixed provider deployment

此形態會將 Claude 保持為預設 agent，並加入一個具名 Codex agent：

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

### Fail-closed Codex deployment

對於 OpenAI agent 回合，當隨附 Plugin 可用時，`openai/gpt-*` 已會解析到 Codex。當你想要寫明 fail-closed rule 時，請加入明確的 runtime policy：

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

強制使用 Codex 時，如果 Codex Plugin 被停用、app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

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

本機 stdio app-server 工作階段預設採用受信任本機操作員姿態：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。如果本機 Codex 需求不允許這種
隱含的 YOLO 姿態，OpenClaw 會改選允許的 guardian 權限。
當工作階段啟用 OpenClaw sandbox 時，OpenClaw 會將 Codex
`danger-full-access` 縮限為 Codex `workspace-write`，讓原生 Codex code-mode 回合
留在 sandboxed 工作區內。

當你想要在 sandbox 逃逸或額外權限之前使用 Codex 原生自動審查時，請使用 guardian 模式：

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

當本機需求允許這些值時，guardian 模式會展開為 Codex app-server 核准，通常是
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及
`sandbox: "workspace-write"`。

每個 app-server 欄位、驗證順序、環境隔離、探索與逾時行為，請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

隨附的 Plugin 會在任何支援 OpenClaw 文字命令的頻道上註冊 `/codex` 作為斜線命令。

常見形式：

- `/codex status` 會檢查 app-server 連線能力、模型、帳號、速率限制、
  MCP 伺服器與 skills。
- `/codex models` 會列出即時 Codex app-server 模型。
- `/codex threads [filter]` 會列出近期的 Codex app-server 執行緒。
- `/codex resume <thread-id>` 會將目前的 OpenClaw 工作階段附加到既有的 Codex 執行緒。
- `/codex compact` 會要求 Codex app-server compact 已附加的執行緒。
- `/codex review` 會針對已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加執行緒的 Codex 意見回饋前先詢問。
- `/codex account` 會顯示帳號與速率限制狀態。
- `/codex mcp` 會列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 會列出 Codex app-server skills。

大多數支援回報，請從發生錯誤的對話中使用 `/diagnostics [note]` 開始。
它會建立一份 Gateway 診斷報告，並且對 Codex harness 工作階段，要求核准傳送相關的 Codex 意見回饋套件。
隱私模型與群組聊天行為請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。

只有在你明確想要針對目前已附加執行緒上傳 Codex 意見回饋，而不需要完整 Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 執行緒

檢查不良 Codex 執行的最快方式，通常是直接開啟原生 Codex 執行緒：

```bash
codex resume <thread-id>
```

從完成的 `/diagnostics` 回覆、`/codex binding`，或
`/codex threads [filter]` 取得執行緒 ID。

上傳機制與執行階段層級診斷邊界，請參閱
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

驗證會依此順序選擇：

1. agent 的已排序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 下。既有的 `openai-codex:*` 設定檔 ID 仍然有效。
2. 該 agent 的 Codex home 中 app-server 的既有帳號。
3. 只針對本機 stdio app-server 啟動，在沒有 app-server 帳號且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，接著
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，會從產生的 Codex 子程序中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。這讓 Gateway 層級的 API keys 可用於 embeddings 或直接 OpenAI 模型，
但不會讓原生 Codex app-server 回合意外透過 API 計費。
明確的 Codex API-key 設定檔與本機 stdio env-key fallback 會使用 app-server 登入，而不是繼承子程序環境。
WebSocket app-server 連線不會接收 Gateway env API-key fallback；請使用明確的驗證設定檔或遠端 app-server 自己的帳號。

如果訂閱設定檔達到 Codex 使用限制，OpenClaw 會在 Codex 回報重設時間時記錄該時間，並針對同一次 Codex 執行嘗試下一個排序的驗證設定檔。
當重設時間經過後，該訂閱設定檔會再次符合資格，而不需要變更所選的 `openai/gpt-*` 模型或 Codex 執行階段。

如果部署需要額外的環境隔離，請將這些變數加入
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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。

Codex 動態工具預設採用 `searchable` 載入。OpenClaw 不會暴露與 Codex 原生工作區操作重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`，以及 `update_plan`。
其餘 OpenClaw 整合工具，例如訊息、工作階段、媒體、Cron、瀏覽器、節點、
Gateway、`heartbeat_respond`，以及 `web_search`，可透過 `openclaw` 命名空間下的 Codex 工具搜尋使用，
讓初始模型內容更小。
`sessions_yield` 與僅限訊息工具來源的回覆會維持直接，因為這些是回合控制合約。
Heartbeat 協作指示會告訴 Codex，在工具尚未載入時，於結束 heartbeat 回合前先搜尋 `heartbeat_respond`。

只有在連線到無法搜尋延遲動態工具的自訂 Codex app-server，或正在偵錯完整工具 payload 時，才設定 `codexDynamicToolsLoading: "direct"`。

支援的頂層 Codex Plugin 欄位：

| 欄位                      | 預設值        | 意義                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 可將 OpenClaw 動態工具直接放入初始 Codex 工具內容中。 |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server 回合省略的其他 OpenClaw 動態工具名稱。              |
| `codexPlugins`             | 停用       | 針對已遷移、以原始碼安裝的精選 plugins，提供原生 Codex plugin/app 支援。           |

支援的 `appServer` 欄位：

| 欄位                         | 預設值                                                | 意義                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                |
| `command`                     | 受管理的 Codex binary                                   | stdio transport 的可執行檔。保持未設定以使用受管理的 binary；只在明確覆寫時才設定。                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio transport 的引數。                                                                                                                                                                                                          |
| `url`                         | 未設定                                                  | WebSocket app-server URL。                                                                                                                                                                                                               |
| `authToken`                   | 未設定                                                  | WebSocket transport 的 Bearer token。                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | 額外的 WebSocket headers。                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | 在 OpenClaw 建立繼承環境後，從產生的 stdio app-server 程序移除的額外環境變數名稱。`CODEX_HOME` 與 `HOME` 保留給 OpenClaw 在本機啟動時使用的每 agent Codex 隔離。    |
| `requestTimeoutMs`            | `60000`                                                | app-server control-plane 呼叫的逾時。                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | 回合範圍 Codex app-server 請求之後，OpenClaw 等待 `turn/completed` 時的安靜視窗。若 post-tool 或僅狀態合成階段較慢，請提高此值。                                                                     |
| `mode`                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO | YOLO 或 guardian-reviewed 執行的預設集。若本機 stdio 需求省略 `danger-full-access`、`never` 核准或 `user` 審查者，隱含預設會變成 guardian。                                                   |
| `approvalPolicy`              | `"never"` 或允許的 guardian 核准政策       | 傳送到 thread start/resume/turn 的原生 Codex 核准政策。guardian 預設值會在允許時偏好 `"on-request"`。                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` 或允許的 guardian sandbox  | 傳送到 thread start/resume 的原生 Codex sandbox 模式。guardian 預設值會在允許時偏好 `"workspace-write"`，否則為 `"read-only"`。當 OpenClaw sandbox 啟用時，`danger-full-access` 會縮限為 `"workspace-write"`。 |
| `approvalsReviewer`           | `"user"` 或允許的 guardian 審查者               | 使用 `"auto_review"` 可在允許時讓 Codex 審查原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍為舊版別名。                                                                      |
| `serviceTier`                 | 未設定                                                  | 選用的 Codex app-server 服務層級。`"priority"` 會啟用 fast-mode 路由，`"flex"` 會要求 flex 處理，`null` 會清除覆寫，而舊版 `"fast"` 會被接受為 `"priority"`。                                         |

OpenClaw 擁有的動態工具呼叫會獨立於 `appServer.requestTimeoutMs` 受到限制：Codex `item/tool/call` 請求預設使用 30 秒的 OpenClaw watchdog。正值的逐次呼叫 `timeoutMs` 引數會延長或縮短該特定工具的預算。當工具呼叫未提供自己的逾時時，`image_generate` 工具也會使用 `agents.defaults.imageGenerationModel.timeoutMs`，而媒體理解 `image` 工具則會使用 `tools.media.image.timeoutSeconds` 或其 60 秒媒體預設值。動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援的情況下中止工具訊號，並向 Codex 傳回失敗的動態工具回應，讓該輪可以繼續，而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex 輪次範圍的應用程式伺服器請求後，harness 也會預期 Codex 以 `turn/completed` 完成原生輪次。如果應用程式伺服器在該回應後靜默達 `appServer.turnCompletionIdleTimeoutMs`，OpenClaw 會盡力中斷 Codex 輪次、記錄診斷逾時，並釋放 OpenClaw 工作階段 lane，讓後續聊天訊息不會被排在過時的原生輪次之後。相同輪次的任何非終止通知，包括 `rawResponseItem/completed`，都會解除該短 watchdog，因為 Codex 已證明該輪次仍然存活；較長的終止 watchdog 會繼續保護真正卡住的輪次。逾時診斷會包含最後一個應用程式伺服器通知方法，並且針對原始助理回應項目，包含項目類型、角色、id，以及有界的助理文字預覽。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。可重複部署時偏好使用設定，因為它會將 Plugin 行為與其餘 Codex harness 設定保留在同一個已審查檔案中。

## 原生 Codex Plugin

原生 Codex Plugin 支援會在與 OpenClaw harness 輪次相同的 Codex 執行緒中，使用 Codex 應用程式伺服器自己的應用程式與 Plugin 能力。OpenClaw 不會將 Codex Plugin 轉譯成合成的 `codex_plugin_*` OpenClaw 動態工具。

`codexPlugins` 只影響選取原生 Codex harness 的工作階段。它不會影響 PI 執行、一般 OpenAI 提供者執行、ACP 對話繫結，或其他 harness。

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

OpenClaw 建立 Codex harness 工作階段或取代過時的 Codex 執行緒繫結時，會計算執行緒應用程式設定。它不會在每一輪重新計算。變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動 Gateway，讓未來的 Codex harness 工作階段以更新後的應用程式集合啟動。

如需遷移資格、應用程式清單、破壞性動作政策、引出提示，以及原生 Plugin 診斷，請參閱[原生 Codex Plugin](/zh-TW/plugins/codex-native-plugins)。

## Computer Use

Computer Use 在其專屬設定指南中說明：
[Codex Computer Use](/zh-TW/plugins/codex-computer-use)。

簡短來說：OpenClaw 不會隨附桌面控制應用程式，也不會自行執行桌面動作。它會準備 Codex 應用程式伺服器、驗證 `computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式輪次期間擁有原生 MCP 工具呼叫。

## 執行階段邊界

Codex harness 只會變更低階嵌入式 agent executor。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行這些工具，因此 OpenClaw 仍位於執行路徑中。
- Codex 原生 shell、patch、MCP，以及原生應用程式工具由 Codex 擁有。OpenClaw 可以透過支援的 relay 觀察或封鎖選定的原生事件，但不會改寫原生工具引數。
- Codex 擁有原生 Compaction。OpenClaw 會保留 transcript 鏡像，用於頻道歷史、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。
- 媒體產生、媒體理解、TTS、核准，以及訊息工具輸出，會繼續透過相符的 OpenClaw 提供者/模型設定。
- `tool_result_persist` 適用於 OpenClaw 擁有的 transcript 工具結果，而非 Codex 原生工具結果記錄。

如需 hook 層、支援的 V1 surface、原生權限處理、佇列導向、Codex 意見回饋上傳機制，以及 Compaction 詳細資訊，請參閱 [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般 `/model` 提供者：** 對新設定而言這是預期行為。請選取 `openai/gpt-*` 模型，啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 請確認模型 ref 是官方 OpenAI 提供者上的 `openai/gpt-*`，且 Codex Plugin 已安裝並啟用。如果測試時需要嚴格證明，請設定提供者或模型 `agentRuntime.id: "codex"`。強制 Codex 執行階段會失敗，而不是 fallback 到 PI。

**舊版 `openai-codex/*` 設定仍存在：** 執行 `openclaw doctor --fix`。Doctor 會將舊版模型 ref 重寫為 `openai/*`、移除過時的工作階段與整個 agent 執行階段 pin，並保留現有的 auth-profile 覆寫。

**應用程式伺服器遭拒：** 請使用 Codex 應用程式伺服器 `0.125.0` 或更新版本。相同版本的預發行版本或帶建置後綴的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，會遭拒，因為 OpenClaw 會測試穩定版 `0.125.0` 協定下限。

**`/codex status` 無法連線：** 請檢查內建 `codex` Plugin 已啟用、設定允許清單時 `plugins.allow` 包含它，並且任何自訂 `appServer.command`、`url`、`authToken` 或 headers 都有效。

**模型探索很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：** 請檢查 `appServer.url`、`authToken`、headers，以及遠端應用程式伺服器是否使用相同的 Codex 應用程式伺服器協定版本。

**非 Codex 模型使用 PI：** 這是預期行為，除非提供者或模型執行階段政策將它路由到另一個 harness。一般非 OpenAI 提供者 ref 在 `auto` 模式中會維持在其正常提供者路徑。

**已安裝 Computer Use 但工具未執行：** 從全新工作階段檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果仍持續，請重新啟動 Gateway 以清除過時的原生 hook 註冊。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關

- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex Plugin](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [Agent 執行階段](/zh-TW/concepts/agent-runtimes)
- [模型提供者](/zh-TW/concepts/model-providers)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [Agent harness Plugin](/zh-TW/plugins/sdk-agent-harness)
- [Plugin hook](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
