---
read_when:
    - 你想使用隨附的 Codex app-server 測試框架
    - 您需要 Codex harness 設定範例
    - 你希望僅限 Codex 的部署失敗，而不是退回到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理程式回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-11T20:33:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 可讓 OpenClaw 透過 Codex app-server 執行嵌入式 OpenAI 代理回合，而不是使用內建的 PI harness。

當你希望 Codex 負責底層代理工作階段時，請使用 Codex harness：原生對話串恢復、原生工具延續、原生 Compaction，以及 app-server 執行。OpenClaw 仍負責聊天頻道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、媒體傳遞，以及可見的逐字稿鏡像。

一般設定使用標準 OpenAI 模型參照，例如 `openai/gpt-5.5`。請勿設定 `openai-codex/gpt-*` 模型參照。請將 OpenAI 代理驗證順序放在 `auth.order.openai` 底下；較舊的 `openai-codex:*` 設定檔和 `auth.order.openai-codex` 項目，仍會支援現有安裝。

OpenClaw 會以 Codex 原生程式碼模式和僅限程式碼模式啟用來啟動 Codex app-server 對話串。這會讓延遲/可搜尋的 OpenClaw 動態工具保留在 Codex 自己的程式碼執行和工具搜尋介面內，而不是在 Codex 之上再加一層 PI 樣式的工具搜尋包裝器。

若要了解更完整的模型/提供者/runtime 分工，請從[代理執行環境](/zh-TW/concepts/agent-runtimes)開始。簡短來說：`openai/gpt-5.5` 是模型參照，`codex` 是 runtime，而 Telegram、Discord、Slack 或其他頻道仍是通訊介面。

## 需求

- OpenClaw，並且有隨附的 `codex` Plugin 可用。
- 如果你的設定使用 `plugins.allow`，請包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。隨附的 Plugin 預設會管理相容的 Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 命令不會影響一般 harness 啟動。
- Codex 驗證可透過 `openclaw models auth login --provider openai-codex`、代理 Codex home 中的 app-server 帳號，或明確的 Codex API 金鑰驗證設定檔取得。

如需驗證優先順序、環境隔離、自訂 app-server 命令、模型探索，以及所有設定欄位，請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

多數想在 OpenClaw 中使用 Codex 的使用者會需要這條路徑：使用 ChatGPT/Codex 訂閱登入、啟用隨附的 `codex` Plugin，並使用標準 `openai/gpt-*` 模型參照。

使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai-codex
```

啟用隨附的 `codex` Plugin 並選取 OpenAI 代理模型：

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

變更 Plugin 設定後，請重新啟動 Gateway。如果現有聊天已經有工作階段，請在測試 runtime 變更前使用 `/new` 或 `/reset`，讓下一個回合從目前設定解析 harness。

## 設定

快速開始設定是最低可用的 Codex harness 設定。請在 OpenClaw 設定中設定 Codex harness 選項，CLI 只用於 Codex 驗證：

| 需求                                   | 設定                                                                              | 位置                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 啟用 harness                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                    |
| 保留允許清單內的 Plugin 安裝     | 在 `plugins.allow` 中包含 `codex`                                               | OpenClaw 設定                    |
| 透過 Codex 路由 OpenAI 代理回合 | 將 `agents.defaults.model` 或 `agents.list[].model` 設為 `openai/gpt-*`               | OpenClaw 代理設定              |
| 使用 Codex OAuth 登入               | `openclaw models auth login --provider openai-codex`                             | CLI 驗證設定檔                   |
| 為 Codex 執行加入 API 金鑰備援      | 在 `auth.order.openai` 中，將 `openai:*` API 金鑰設定檔列在訂閱驗證之後 | CLI 驗證設定檔 + OpenClaw 設定 |
| Codex 無法使用時封閉失敗  | 提供者或模型 `agentRuntime.id: "codex"`                                     | OpenClaw 模型/提供者設定     |
| 使用直接 OpenAI API 流量          | 提供者或模型 `agentRuntime.id: "pi"` 搭配一般 OpenAI 驗證                | OpenClaw 模型/提供者設定     |
| 調整 app-server 行為               | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin 設定                |
| 啟用原生 Codex Plugin 應用        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin 設定                |
| 啟用 Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin 設定                |

請使用 `openai/gpt-*` 模型參照來處理 Codex 後端的 OpenAI 代理回合。建議使用 `auth.order.openai` 來設定訂閱優先/API 金鑰備援的順序。現有的 `openai-codex:*` 驗證設定檔和 `auth.order.openai-codex` 仍然有效，但不要撰寫新的 `openai-codex/gpt-*` 模型參照。

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在這種形式中，對於 `openai/gpt-*` 代理回合，兩個設定檔仍然都會透過 Codex 執行。API 金鑰只是驗證備援，不是要求切換到 PI 或一般 OpenAI Responses。

本頁其餘部分涵蓋使用者常見需要選擇的變體：部署形式、封閉失敗路由、監護核准政策、原生 Codex Plugin，以及 Computer Use。如需完整選項清單、預設值、列舉、探索、環境隔離、逾時，以及 app-server 傳輸欄位，請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex runtime

在你預期使用 Codex 的聊天中使用 `/status`。Codex 後端的 OpenAI 代理回合會顯示：

```text
Runtime: OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線能力、帳號、速率限制、MCP 伺服器和 Skills。`/codex models` 會列出該 harness 和帳號的即時 Codex app-server 目錄。如果 `/status` 的結果令人意外，請參閱[疑難排解](#troubleshooting)。

## 路由和模型選擇

請將提供者參照和 runtime 政策分開：

- 對於透過 Codex 的 OpenAI 代理回合，請使用 `openai/gpt-*`。
- 請勿在設定中使用 `openai-codex/gpt-*`。執行 `openclaw doctor --fix` 來修復舊版參照和過時的工作階段路由釘選。
- `agentRuntime.id: "codex"` 對一般 OpenAI 自動模式是選用的，但在部署需要 Codex 無法使用時封閉失敗時很有用。
- 當你有意使用直接 PI 行為時，`agentRuntime.id: "pi"` 會讓提供者或模型採用該行為。
- `/codex ...` 會從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部 harness 路徑。只有在使用者要求 ACP/acpx 或外部 harness 轉接器時才使用它。

常見命令路由：

| 使用者意圖                     | 使用                                     |
| ------------------------------- | --------------------------------------- |
| 附加目前聊天         | `/codex bind [--cwd <path>]`            |
| 恢復現有 Codex 對話串 | `/codex resume <thread-id>`             |
| 列出或篩選 Codex 對話串    | `/codex threads [filter]`               |
| 只傳送 Codex 意見回饋        | `/codex diagnostics [note]`             |
| 啟動 ACP/acpx 任務          | ACP/acpx 工作階段命令，而不是 `/codex` |

| 使用情境                                             | 設定                                                        | 驗證                                  | 備註                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ChatGPT/Codex 訂閱搭配原生 Codex runtime | `openai/gpt-*` 加上啟用的 `codex` Plugin                       | `/status` 顯示 `Runtime: OpenAI Codex` | 建議路徑                   |
| Codex 無法使用時封閉失敗                  | 提供者或模型 `agentRuntime.id: "codex"`                     | 回合失敗，而不是 PI 備援       | 用於僅限 Codex 的部署     |
| 透過 PI 的直接 OpenAI API 金鑰流量             | 提供者或模型 `agentRuntime.id: "pi"` 和一般 OpenAI 驗證 | `/status` 顯示 PI runtime              | 只有在有意使用 PI 時才使用    |
| 舊版設定                                        | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` 會重寫它     | 不要以這種方式撰寫新設定   |
| ACP/acpx Codex 轉接器                               | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP 任務/工作階段狀態                 | 與原生 Codex harness 分開 |

`agents.defaults.imageModel` 遵循相同的前綴分工。一般 OpenAI 路由請使用 `openai/gpt-*`，只有在影像理解應該透過受限的 Codex app-server 回合執行時，才使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 會將該舊版前綴重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

當所有 OpenAI 代理回合預設都應使用 Codex 時，請使用快速開始設定。

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

此形式會保留 Claude 作為預設代理，並加入一個具名 Codex 代理：

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

使用此設定時，`main` 代理會使用其一般提供者路徑，而 `codex` 代理會使用 Codex app-server。

### 封閉失敗 Codex 部署

對於 OpenAI 代理回合，當隨附的 Plugin 可用時，`openai/gpt-*` 已會解析到 Codex。當你想要明文化的封閉失敗規則時，請加入明確的 runtime 政策：

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

## App-server 政策

預設情況下，Plugin 會以 stdio 傳輸在本機啟動 OpenClaw 管理的 Codex 二進位檔。只有在你有意執行不同的可執行檔時，才設定 `appServer.command`。只有在 app-server 已經在其他地方執行時，才使用 WebSocket 傳輸：

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

本機 stdio app-server 工作階段預設採用受信任的本機操作員姿態：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。如果本機 Codex 需求不允許這種
隱含的 YOLO 姿態，OpenClaw 會改為選取允許的 guardian 權限。
當該工作階段啟用 OpenClaw 沙箱時，OpenClaw 會將 Codex
`danger-full-access` 縮限為 Codex `workspace-write`，讓原生 Codex 程式碼模式回合
留在沙箱化工作區內。

當你希望 Codex 在沙箱逸出或額外權限之前執行原生自動審查時，請使用 guardian 模式：

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

如需每個 app-server 欄位、驗證順序、環境隔離、探索，以及
逾時行為，請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

內建 Plugin 會在任何支援 OpenClaw 文字命令的通道上
註冊 `/codex` 作為斜線命令。

常見形式：

- `/codex status` 會檢查 app-server 連線能力、模型、帳號、速率限制、
  MCP 伺服器，以及 Skills。
- `/codex models` 會列出即時 Codex app-server 模型。
- `/codex threads [filter]` 會列出最近的 Codex app-server 執行緒。
- `/codex resume <thread-id>` 會將目前的 OpenClaw 工作階段附加到
  現有的 Codex 執行緒。
- `/codex compact` 會要求 Codex app-server 壓縮已附加的執行緒。
- `/codex review` 會為已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加執行緒的 Codex 回饋之前先詢問。
- `/codex account` 會顯示帳號與速率限制狀態。
- `/codex mcp` 會列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 會列出 Codex app-server skills。

對於多數支援回報，請在發生錯誤的對話中從 `/diagnostics [note]` 開始。
它會建立一份 Gateway 診斷報告，並且對於 Codex harness 工作階段，
要求核准傳送相關的 Codex 回饋組合包。
請參閱 [診斷匯出](/zh-TW/gateway/diagnostics) 以了解隱私模型與群組
聊天行為。

只有在你明確想要上傳目前已附加執行緒的 Codex
回饋，而不需要完整 Gateway 診斷組合包時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 執行緒

檢查有問題的 Codex 執行時，最快的方式通常是直接開啟原生 Codex
執行緒：

```bash
codex resume <thread-id>
```

從完成的 `/diagnostics` 回覆、`/codex binding`，或
`/codex threads [filter]` 取得執行緒 ID。

如需上傳機制與執行階段層級的診斷邊界，請參閱
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

驗證會依此順序選取：

1. 代理程式的已排序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 下。既有的 `openai-codex:*` 設定檔 ID 仍然有效。
2. 該代理程式 Codex home 中 app-server 的既有帳號。
3. 僅限本機 stdio app-server 啟動時，若沒有 app-server 帳號且仍需要
   OpenAI 驗證，會使用 `CODEX_API_KEY`，接著是
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，它會從產生的
Codex 子程序中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓
Gateway 層級的 API 金鑰仍可用於嵌入或直接 OpenAI 模型，
同時避免原生 Codex app-server 回合意外透過 API 計費。
明確的 Codex API 金鑰設定檔與本機 stdio 環境金鑰後援會使用 app-server
登入，而不是繼承子程序環境。WebSocket app-server 連線不會接收
Gateway 環境 API 金鑰後援；請使用明確的驗證設定檔或遠端 app-server 自己的帳號。

如果訂閱設定檔遇到 Codex 使用量限制，OpenClaw 會在 Codex 回報重設時間時記錄它，
並針對同一次 Codex 執行嘗試下一個已排序的驗證設定檔。當重設時間過後，
該訂閱設定檔會再次符合資格，而不需要變更所選的 `openai/gpt-*` 模型或
Codex 執行階段。

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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 不會公開
重複 Codex 原生工作區操作的動態工具：`read`、`write`、
`edit`、`apply_patch`、`exec`、`process`，以及 `update_plan`。其餘 OpenClaw
整合工具，例如訊息、工作階段、媒體、Cron、瀏覽器、節點、
Gateway、`heartbeat_respond` 和 `web_search`，都可透過 `openclaw`
命名空間下的 Codex 工具搜尋使用，讓初始模型內容
更小。
`sessions_yield` 與僅限訊息工具來源的回覆會保持直接，因為這些
屬於回合控制合約。Heartbeat 協作指示會告訴 Codex，當工具尚未載入時，
在結束 Heartbeat 回合之前搜尋 `heartbeat_respond`。

只有在連線到無法搜尋延遲動態工具的自訂 Codex
app-server，或偵錯完整工具酬載時，才設定 `codexDynamicToolsLoading: "direct"`。

支援的頂層 Codex Plugin 欄位：

| 欄位                      | 預設值        | 意義                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具內容。 |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server 回合省略的其他 OpenClaw 動態工具名稱。              |
| `codexPlugins`             | 已停用       | 原生 Codex Plugin/應用程式支援，供已遷移、以來源安裝的精選 plugins 使用。           |

支援的 `appServer` 欄位：

| 欄位                         | 預設值                                                | 意義                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                |
| `command`                     | 受管理的 Codex 二進位檔                                   | stdio 傳輸的可執行檔。未設定時會使用受管理的二進位檔；只有在明確覆寫時才設定它。                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸的引數。                                                                                                                                                                                                          |
| `url`                         | 未設定                                                  | WebSocket app-server URL。                                                                                                                                                                                                               |
| `authToken`                   | 未設定                                                  | WebSocket 傳輸的 Bearer token。                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | 額外的 WebSocket 標頭。                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | OpenClaw 建構其繼承環境之後，從產生的 stdio app-server 程序移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給 OpenClaw 在本機啟動時的每代理程式 Codex 隔離使用。    |
| `requestTimeoutMs`            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | 在回合範圍的 Codex app-server 要求之後，OpenClaw 等待 `turn/completed` 時的靜默時間窗。對於緩慢的工具後或僅狀態合成階段，請提高此值。                                                                     |
| `mode`                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO | YOLO 或經 guardian 審查執行的預設集。若本機 stdio 需求省略 `danger-full-access`、`never` 核准，或 `user` 審查者，隱含預設值會變成 guardian。                                                   |
| `approvalPolicy`              | `"never"` 或允許的 guardian 核准政策       | 傳送到執行緒啟動/恢復/回合的原生 Codex 核准政策。guardian 預設值會在允許時偏好 `"on-request"`。                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` 或允許的 guardian 沙箱  | 傳送到執行緒啟動/恢復的原生 Codex 沙箱模式。guardian 預設值會在允許時偏好 `"workspace-write"`，否則是 `"read-only"`。當 OpenClaw 沙箱啟用時，`danger-full-access` 會縮限為 `"workspace-write"`。 |
| `approvalsReviewer`           | `"user"` 或允許的 guardian 審查者               | 使用 `"auto_review"` 可在允許時讓 Codex 審查原生核准提示，否則為 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                      |
| `serviceTier`                 | 未設定                                                  | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求 flex 處理，`null` 會清除覆寫，而舊版 `"fast"` 會被接受為 `"priority"`。                                         |

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制：Codex `item/tool/call` 請求預設使用 30 秒的
OpenClaw watchdog。正數的每次呼叫 `timeoutMs` 引數會延長
或縮短該特定工具預算。當工具呼叫未提供自己的逾時設定時，`image_generate` 工具也會使用
`agents.defaults.imageGenerationModel.timeoutMs`，而媒體理解 `image` 工具會使用
`tools.media.image.timeoutSeconds` 或其 60 秒媒體預設值。動態工具
預算上限為 600000 ms。逾時時，OpenClaw 會在支援的位置中止工具訊號，
並向 Codex 傳回失敗的動態工具回應，讓該輪次可繼續，而不是讓工作階段停留在 `processing`。

在 OpenClaw 回應 Codex 輪次範圍的 app-server 請求後，harness
也會預期 Codex 以 `turn/completed` 完成原生輪次。如果
app-server 在該回應後靜默達 `appServer.turnCompletionIdleTimeoutMs`，
OpenClaw 會盡力中斷 Codex 輪次、記錄診斷
逾時，並釋放 OpenClaw 工作階段通道，讓後續聊天訊息
不會排在過期的原生輪次後方。同一輪次的任何非終止通知，
包括 `rawResponseItem/completed`，都會解除該短 watchdog，
因為 Codex 已證明該輪次仍然存活；較長的終止 watchdog
會繼續保護真正卡住的輪次。逾時診斷包含
最後一個 app-server 通知方法，以及對於原始助理回應項目，
包含項目類型、角色、id，以及有界的助理文字預覽。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或針對一次性本機測試使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於可重複的部署，偏好使用設定，
因為它會將 Plugin 行為與其餘 Codex harness 設定保留在同一個已審查檔案中。

## 原生 Codex Plugin

原生 Codex Plugin 支援會在與 OpenClaw harness 輪次相同的 Codex 執行緒中，
使用 Codex app-server 自己的應用程式與 Plugin 能力。OpenClaw
不會將 Codex Plugin 轉譯為合成的 `codex_plugin_*` OpenClaw
動態工具。

`codexPlugins` 只影響選取原生 Codex harness 的工作階段。它
不會影響 PI 執行、一般 OpenAI provider 執行、ACP 對話
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

Thread 應用程式設定會在 OpenClaw 建立 Codex harness 工作階段
或取代過期的 Codex thread 繫結時計算。它不會在每一輪次重新計算。
變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動 gateway，讓
未來的 Codex harness 工作階段以更新後的應用程式集合啟動。

如需遷移資格、應用程式清單、破壞性動作政策、
elicitations，以及原生 Plugin 診斷，請參閱
[原生 Codex Plugin](/zh-TW/plugins/codex-native-plugins)。

## Computer Use

Computer Use 有自己的設定指南：
[Codex Computer Use](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會 vendor 桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex app-server、驗證
`computer-use` MCP server 可用，然後讓 Codex 在 Codex 模式輪次期間擁有原生 MCP
工具呼叫。

## 執行階段邊界

Codex harness 只會變更低階嵌入式 agent executor。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行這些
  工具，因此 OpenClaw 仍在執行路徑中。
- Codex 原生 shell、patch、MCP，以及原生應用程式工具由 Codex 擁有。
  OpenClaw 可透過支援的 relay 觀察或封鎖選定的原生事件，
  但不會重寫原生工具引數。
- Codex 擁有原生 Compaction。OpenClaw 會保留 transcript mirror，用於 channel
  歷史、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。
- 媒體生成、媒體理解、TTS、核准，以及 messaging-tool
  輸出會繼續經由相符的 OpenClaw provider/model 設定。
- `tool_result_persist` 適用於 OpenClaw 擁有的 transcript 工具結果，而不是
  Codex 原生工具結果記錄。

如需 hook layers、支援的 V1 surfaces、原生權限處理、queue
steering、Codex feedback upload mechanics，以及 Compaction 詳細資訊，請參閱
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般 `/model` provider：** 對於
新設定，這是預期行為。請選取 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用 PI 而非 Codex：** 請確認模型 ref 是
官方 OpenAI provider 上的 `openai/gpt-*`，且 Codex Plugin 已安裝並啟用。
如果測試時需要嚴格證明，請設定 provider 或
model `agentRuntime.id: "codex"`。強制的 Codex runtime 會失敗，而不是
fallback 至 PI。

**舊版 `openai-codex/*` 設定仍存在：** 執行 `openclaw doctor --fix`。
Doctor 會將舊版 model refs 重寫為 `openai/*`、移除過期的工作階段和
整個 agent runtime pins，並保留既有的 auth-profile 覆寫。

**app-server 被拒絕：** 使用 Codex app-server `0.125.0` 或更新版本。
相同版本的 prerelease 或帶有 build suffix 的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom`，會被拒絕，因為 OpenClaw 會測試
穩定版 `0.125.0` protocol floor。

**`/codex status` 無法連線：** 檢查內建的 `codex` Plugin
是否已啟用、設定 allowlist 時 `plugins.allow` 是否包含它，以及
任何自訂 `appServer.command`、`url`、`authToken` 或 headers 是否有效。

**模型探索很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用 discovery。請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket transport 立即失敗：** 檢查 `appServer.url`、`authToken`、
headers，以及遠端 app-server 是否使用相同的 Codex app-server
protocol version。

**非 Codex 模型使用 PI：** 除非 provider 或 model runtime
政策將它路由至另一個 harness，否則這是預期行為。一般非 OpenAI provider refs 會在
`auto` mode 中維持其正常 provider path。

**Computer Use 已安裝但工具未執行：** 從新的工作階段檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果持續發生，請重新啟動
gateway 以清除過期的原生 hook registrations。請參閱
[Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關

- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex Plugin](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [Agent runtimes](/zh-TW/concepts/agent-runtimes)
- [Model providers](/zh-TW/concepts/model-providers)
- [OpenAI provider](/zh-TW/providers/openai)
- [Agent harness Plugin](/zh-TW/plugins/sdk-agent-harness)
- [Plugin hooks](/zh-TW/plugins/hooks)
- [Diagnostics export](/zh-TW/gateway/diagnostics)
- [Status](/zh-TW/cli/status)
- [Testing](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
