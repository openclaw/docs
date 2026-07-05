---
read_when:
    - 你想要使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 測試框架設定範例
    - 你希望僅 Codex 的部署失敗，而不是退回到 OpenClaw
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 測試框架
x-i18n:
    generated_at: "2026-07-05T11:30:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbb6c08e7f44a0f149158f10640d3be0241892d633b8877641579b8693e1fc8d
    source_path: plugins/codex-harness.md
    workflow: 16
---

bundled `codex` 外掛會透過 Codex app-server 執行內嵌的 OpenAI agent 回合，而不是使用內建的 OpenClaw harness。Codex 擁有低階 agent 工作階段：原生執行緒續接、原生工具延續、原生壓縮，以及 app-server 執行。OpenClaw 仍擁有聊天通道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、媒體傳遞，以及可見的逐字稿鏡像。

使用標準 OpenAI 模型參照，例如 `openai/gpt-5.5`。不要設定舊版 Codex GPT 參照；請將 OpenAI agent 驗證順序放在 `auth.order.openai` 下。舊版 Codex 驗證設定檔 ID 與舊版 Codex 驗證順序項目會由 `openclaw doctor --fix` 修復。

當沒有啟用 OpenClaw 沙箱時，OpenClaw 會啟動已啟用 Codex 原生程式碼模式的 Codex app-server 執行緒（code-mode-only 預設保持關閉），因此原生工作區/程式碼能力仍可與透過 app-server `item/tool/call` 橋接路由的 OpenClaw 動態工具一起使用。啟用中的 OpenClaw 沙箱或受限工具政策會完全停用原生程式碼模式，除非你選擇加入實驗性的 sandbox exec-server 路徑。

這項 Codex 原生功能不同於
[OpenClaw 程式碼模式](/zh-TW/reference/code-mode)，後者是針對一般 OpenClaw 執行的可選 QuickJS-WASI runtime，且具有不同的 `exec` 輸入形狀。若要了解更廣泛的模型/provider/runtime 拆分，請從
[Agent runtimes](/zh-TW/concepts/agent-runtimes) 開始：`openai/gpt-5.5` 是模型參照，`codex` 是 runtime，而 Telegram、Discord、Slack 或其他通道則是通訊介面。

## 需求

- OpenClaw，且可使用 bundled `codex` 外掛。如果你的設定使用 allowlist，請在 `plugins.allow` 中包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。外掛預設會管理相容的二進位檔，因此 `PATH` 上的 `codex` 命令不會影響正常啟動。
- 透過 `openclaw models auth login --provider openai` 進行 Codex 驗證、agent 的 Codex home 中已存在的 app-server 帳戶，或明確的 Codex API-key 驗證設定檔。

如需驗證優先順序、環境隔離、自訂 app-server 命令、模型探索，以及完整設定欄位清單，請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai
```

啟用 bundled `codex` 外掛並選取 OpenAI agent 模型：

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

如果你的設定使用 `plugins.allow`，也請在其中加入 `codex`：

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

變更外掛設定後，請重新啟動閘道。如果聊天已經有工作階段，請先執行 `/new` 或 `/reset`，讓下一個回合從目前設定解析 harness。

## 與 Codex Desktop 和命令列介面共用執行緒

預設的 `appServer.homeScope: "agent"` 會將每個 OpenClaw agent 與操作者的原生 Codex 狀態隔離。若要讓擁有者檢查並管理 Codex Desktop 與 Codex 命令列介面顯示的相同原生執行緒，請選擇使用使用者 Codex home：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

使用者 home 模式需要本機 stdio transport。它會在設定時使用 `$CODEX_HOME`，否則使用 `~/.codex`，包含該 home 的原生 Codex 驗證、設定、外掛與執行緒儲存區。OpenClaw 不會將 OpenClaw 驗證設定檔注入此 app-server。

擁有者回合會取得 `codex_threads` 工具：列出、搜尋、讀取、fork、重新命名、封存與還原原生執行緒。fork 執行緒以在 OpenClaw 中繼續；該 fork 會附加至目前的 OpenClaw 工作階段，並持續對其他原生 Codex client 可見。封存需要明確確認該執行緒已在其他地方關閉。

不要從 OpenClaw 與另一個 Codex client 同時續接或寫入相同執行緒。Codex 會在單一 app-server 程序內協調即時寫入者，而不是跨獨立的 Desktop、命令列介面與 OpenClaw 程序。fork 是安全共存路徑。

## 設定

| 需求                                   | 設定                                                                             | 位置                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 啟用 harness                           | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                      |
| 保留 allowlisted 外掛安裝              | 在 `plugins.allow` 中包含 `codex`                                                | OpenClaw 設定                      |
| 透過 Codex 路由 OpenAI agent 回合      | `agents.defaults.model` 或 `agents.list[].model` 設為 `openai/gpt-*`             | OpenClaw agent 設定                |
| 使用 ChatGPT/Codex OAuth 登入          | `openclaw models auth login --provider openai`                                   | 命令列介面驗證設定檔              |
| 為 Codex 執行新增 API-key 備援         | `auth.order.openai` 中在訂閱驗證後列出的 `openai:*` API-key 設定檔              | 命令列介面驗證設定檔 + OpenClaw 設定 |
| Codex 無法使用時 fail closed           | Provider 或模型 `agentRuntime.id: "codex"`                                      | OpenClaw 模型/provider 設定        |
| 使用直接 OpenAI API 流量               | Provider 或模型 `agentRuntime.id: "openclaw"` 搭配一般 OpenAI 驗證              | OpenClaw 模型/provider 設定        |
| 調整 app-server 行為                   | `plugins.entries.codex.config.appServer.*`                                       | Codex 外掛設定                     |
| 啟用原生 Codex 外掛應用程式            | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex 外掛設定                     |
| 啟用 Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                                     | Codex 外掛設定                     |

偏好使用 `auth.order.openai` 來排序 subscription-first/API-key-backup。現有舊版 Codex 驗證設定檔 ID 與舊版 Codex 驗證順序是僅供 doctor 使用的舊版狀態；不要寫入新的舊版 Codex GPT 參照。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

上述兩個設定檔在 `openai/gpt-*` agent 回合中仍會透過 Codex 執行。API key 只是一個驗證 fallback，不是切換到 OpenClaw 或純 OpenAI Responses 的請求。

### 壓縮

不要在 Codex-backed agent 上設定 `compaction.model` 或 `compaction.provider`。Codex 會透過其原生 app-server 執行緒狀態進行壓縮，因此 OpenClaw 會在 runtime 忽略這些本機 summarizer override，而當 agent 使用 Codex 時，`openclaw doctor --fix` 會移除它們。

Lossless 仍支援作為圍繞 Codex 回合進行組裝、擷取與維護的 context engine，透過
`plugins.slots.contextEngine: "lossless-claw"` 和
`plugins.entries.lossless-claw.config.summaryModel` 設定，而不是透過
`agents.defaults.compaction.provider`。當 Codex 是啟用中的 runtime 時，`openclaw doctor --fix` 會將舊的 `compaction.provider: "lossless-claw"` 形狀遷移到 Lossless context-engine slot，但原生 Codex 仍擁有壓縮。原生 app-server harness 支援需要 pre-prompt assembly 的 context engine；一般命令列介面 backend（包含 `codex-cli`）不提供該 host 能力。

對於 Codex-backed agent，`/compact` 會在綁定的執行緒上啟動原生 Codex app-server 壓縮。OpenClaw 不會等待完成、施加 OpenClaw timeout、重新啟動共用 app-server，或 fallback 到 context-engine 或公開 OpenAI summarizer。如果原生 Codex 執行緒綁定遺失或過期，該命令會 fail closed，而不是靜默切換壓縮 backend。

本頁其餘部分涵蓋部署形狀、fail-closed 路由、guardian 核准政策、原生 Codex 外掛與 Computer Use。如需完整選項清單、預設值、列舉、探索、環境隔離、timeout 與 app-server transport 欄位，請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex runtime

在你預期使用 Codex 的聊天中使用 `/status`。Codex-backed OpenAI agent 回合會顯示：

```text
Runtime: OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線能力、帳戶、rate limit、MCP server 與 Skills。`/codex models` 會列出 harness 與帳戶的即時 Codex app-server catalog。如果 `/status` 結果令人意外，請參閱
[疑難排解](#troubleshooting)。

## 路由與模型選擇

保持 provider 參照與 runtime 政策分離：

- 對於透過 Codex 的 OpenAI agent 回合，使用 `openai/gpt-*`。
- 不要在設定中使用舊版 Codex GPT 參照；執行 `openclaw doctor --fix` 修復舊版參照與過期的工作階段路由 pin。
- `agentRuntime.id: "codex"` 對一般 OpenAI 自動模式是可選的，但當部署應在 Codex 無法使用時 fail closed，這會很有用。
- `agentRuntime.id: "openclaw"` 會在有意為之時讓 provider 或模型使用內嵌的 OpenClaw runtime。
- `/codex ...` 會從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是另一個獨立的外部 harness 路徑。只有在使用者要求 ACP/acpx 或外部 harness adapter 時才使用它。

| 使用者意圖                                               | 使用方式                                                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前聊天                                             | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 續接現有 Codex 執行緒                                    | `/codex resume <thread-id>`                                                                           |
| 列出或篩選 Codex 執行緒                                  | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 外掛                                      | `/codex plugins list`                                                                                 |
| 啟用或停用已設定的原生 Codex 外掛                        | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 在配對節點上附加現有 Codex 命令列介面工作階段            | `/codex sessions --host <node> [filter]`，然後 `/codex resume <session-id> --host <node> --bind here` |
| 變更綁定執行緒的模型、fast-mode 或權限                   | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| 停止或引導啟用中的回合                                   | `/codex stop`, `/codex steer <text>`                                                                  |
| 分離目前綁定                                             | `/codex detach`（別名 `/codex unbind`）                                                              |
| 僅傳送 Codex feedback                                    | `/codex diagnostics [note]`                                                                           |
| 啟動 ACP/acpx 任務                                       | ACP/acpx 工作階段命令，而不是 `/codex`                                                               |

| 使用情境                                             | 設定                                                                   | 驗證                                    | 備註                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| 具備原生 Codex 執行環境的 ChatGPT/Codex 訂閱         | `openai/gpt-*` 加上已啟用的 `codex` 外掛                               | `/status` 顯示 `Runtime: OpenAI Codex`  | 建議路徑                              |
| 若 Codex 無法使用則關閉失敗                          | 提供者或模型 `agentRuntime.id: "codex"`                                | 回合失敗，而不是使用嵌入式後援         | 用於僅限 Codex 的部署                 |
| 透過 OpenClaw 直接傳送 OpenAI API 金鑰流量           | 提供者或模型 `agentRuntime.id: "openclaw"` 和一般 OpenAI 驗證           | `/status` 顯示 OpenClaw 執行環境        | 僅在有意使用 OpenClaw 時使用          |
| 舊版設定                                             | 舊版 Codex GPT 參照                                                    | `openclaw doctor --fix` 會重寫它        | 不要以這種方式撰寫新設定              |
| ACP/acpx Codex 轉接器                                | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP 工作/工作階段狀態                  | 與原生 Codex 測試架構分開             |

`agents.defaults.imageModel` 遵循相同的前綴切分。一般 OpenAI 路徑使用 `openai/gpt-*`，
只有在影像理解應透過有界限的 Codex app-server 回合執行時，才使用 `codex/gpt-*`。
Doctor 會將舊版 Codex GPT 參照重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

當所有 OpenAI 代理回合都應預設使用 Codex 時，使用快速入門設定：

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

保留 Claude 作為預設代理，並加入具名 Codex 代理：

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

`main` 代理使用其一般提供者路徑；`codex` 代理使用 Codex app-server。

### 關閉失敗 Codex 部署

當內建外掛可用時，`openai/gpt-*` 已會解析為 Codex。為書面關閉失敗規則加入明確的執行環境政策：

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

強制使用 Codex 時，如果 Codex 外掛已停用、app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## App-server 政策

預設情況下，外掛會在本機以 stdio 傳輸啟動 OpenClaw 管理的 Codex 二進位檔。
只有在有意執行不同可執行檔時，才設定 `appServer.command`。
只有在 app-server 已於其他位置執行時，才使用 WebSocket 傳輸：

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

本機 stdio app-server 工作階段預設為受信任本機操作員態勢：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本機 Codex 需求不允許該隱含 YOLO 態勢，OpenClaw 會改為選擇允許的 guardian 權限。當 OpenClaw 沙盒對該工作階段啟用時，OpenClaw 會在該回合停用 Codex 原生 Code Mode、使用者 MCP 伺服器，以及由應用程式支援的外掛執行，而不是依賴 Codex 主機端沙盒。Shell 存取則會在一般 exec/process 工具可用時，透過 OpenClaw 沙盒支援的動態工具進行，例如 `sandbox_exec` 和 `sandbox_process`。

在沙盒逸出或額外權限之前，對 Codex 原生自動審查使用標準化 OpenClaw exec 模式：

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

對於 Codex app-server 工作階段，`tools.exec.mode: "auto"` 會對應至 Codex Guardian 審查的核准：當本機需求允許這些值時，通常是 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。在 `tools.exec.mode: "auto"` 中，OpenClaw 不會保留舊版不安全 Codex `approvalPolicy: "never"` 或
`sandbox: "danger-full-access"` 覆寫；若要有意使用無核准的 Codex 態勢，請使用 `tools.exec.mode: "full"`。舊版
`plugins.entries.codex.config.appServer.mode: "guardian"` 預設集仍可運作，但 `tools.exec.mode: "auto"` 是標準化的 OpenClaw 介面。

如需與主機 exec 核准和 ACPX 權限進行模式層級比較，請參閱[權限模式](/zh-TW/tools/permission-modes)。如需每個 app-server 欄位、驗證順序、環境隔離和逾時行為，請參閱 [Codex 測試架構參考](/zh-TW/plugins/codex-harness-reference)。

## 命令和診斷

內建外掛會在任何支援 OpenClaw 文字命令的頻道上註冊 `/codex` 作為斜線命令。

原生執行和控制需要擁有者或 `operator.admin` 閘道用戶端：綁定或恢復執行緒、傳送或停止回合、變更模型、快速模式或權限狀態、壓縮或審查，以及卸離綁定。其他已授權傳送者保留唯讀狀態、說明、帳戶、模型、執行緒、MCP 伺服器、技能和綁定檢查命令。

常見形式：

- `/codex status` 檢查 app-server 連線能力、模型、帳戶、速率限制、MCP 伺服器和 Skills。
- `/codex models` 列出即時 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex app-server 執行緒。
- `/codex resume <thread-id>` 將目前 OpenClaw 工作階段附加到現有 Codex 執行緒。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  附加目前聊天。
- `/codex detach`（或 `/codex unbind`）卸離目前綁定。
- `/codex binding` 描述目前綁定。
- `/codex stop` 停止作用中回合；`/codex steer <text>` 引導它。
- `/codex model <model>`、`/codex fast [on|off|status]` 和
  `/codex permissions [default|yolo|status]` 會變更每個對話的狀態。
- `/codex compact` 要求 Codex app-server 壓縮已附加的執行緒。
- `/codex review` 為已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加執行緒的 Codex 意見回饋前詢問。
- `/codex account` 顯示帳戶和速率限制狀態。
- `/codex mcp` 列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 列出 Codex app-server skills。
- `/codex plugins list`、`/codex plugins enable <name>` 和
  `/codex plugins disable <name>` 管理已設定的原生 Codex 外掛。
- `/codex computer-use [status|install]` 管理 Codex Computer Use。
- `/codex help` 列出完整命令樹。

對大多數支援回報，請從發生錯誤的對話中使用 `/diagnostics [note]` 開始。它會建立一份閘道診斷報告，並針對 Codex 測試架構工作階段，請求核准傳送相關 Codex 意見回饋套件。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)，了解隱私模型和群組聊天行為。只有在你特別想為目前附加的執行緒上傳 Codex 意見回饋，而不包含完整閘道診斷套件時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 執行緒

檢查不良 Codex 執行的最快方式，通常是直接開啟原生 Codex 執行緒：

```bash
codex resume <thread-id>
```

從已完成的 `/diagnostics` 回覆、`/codex binding` 或 `/codex threads [filter]` 取得執行緒 ID。

如需上傳機制和執行環境層級診斷邊界，請參閱
[Codex 測試架構執行環境](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

### 驗證順序

在預設的每代理主目錄中，驗證會依此順序選取：

1. 代理的排序 OpenAI 驗證設定檔，最好位於 `auth.order.openai` 下。執行 `openclaw doctor --fix` 以遷移較舊的舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序。
2. 該代理 Codex 主目錄中 app-server 的現有帳戶。
3. 僅限本機 stdio app-server 啟動，當不存在 app-server 帳戶且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，會從產生的 Codex 子程序移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓閘道層級 API 金鑰可供 embeddings 或直接 OpenAI 模型使用，同時避免原生 Codex app-server 回合意外透過 API 計費。明確的 Codex API 金鑰設定檔和本機 stdio 環境金鑰後援會使用 app-server 登入，而不是繼承的子程序環境。WebSocket app-server 連線不會收到閘道環境 API 金鑰後援；請使用明確的驗證設定檔或遠端 app-server 自己的帳戶。

如果訂閱設定檔遇到 Codex 使用限制，OpenClaw 會在 Codex 回報重設時間時記錄該時間，並為同一個 Codex 執行嘗試下一個排序的驗證設定檔。當重設時間過後，訂閱設定檔會再次符合資格，而不需要變更已選取的 `openai/gpt-*` 模型或 Codex 執行環境。

設定原生 Codex 外掛時，OpenClaw 會在向 Codex 執行緒公開外掛擁有的應用程式之前，透過已連線的 app-server 安裝或重新整理這些外掛。`app/list` 仍是應用程式 ID、可存取性和中繼資料的真實來源，但 OpenClaw 擁有每個執行緒的啟用決策：如果政策允許列出的可存取應用程式，OpenClaw 會傳送 `thread/start.config.apps[appId].enabled = true`，即使 `app/list` 目前回報該應用程式已停用。此路徑不會為未知 ID 虛構應用程式安裝；OpenClaw 只會使用 `plugin/install` 啟用市集外掛，然後重新整理清單。

### 環境隔離

對於本機 stdio app-server 啟動，OpenClaw 會將 `CODEX_HOME` 設為每代理目錄，因此 Codex 設定、驗證/帳戶檔案、外掛快取/資料，以及原生執行緒狀態預設不會讀取或寫入操作員的個人
`~/.codex`。OpenClaw 會保留一般程序 `HOME`；Codex 執行的子程序仍可找到使用者主目錄設定和權杖，而 Codex 可能會探索共用的 `$HOME/.agents/skills` 和
`$HOME/.agents/plugins/marketplace.json` 項目。使用
`appServer.homeScope: "user"` 時，OpenClaw 會改用原生使用者 Codex 主目錄及其現有帳戶，而不注入 OpenClaw 驗證設定檔。

如果部署需要額外的環境隔離，請將那些變數加入 `appServer.clearEnv`：

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

`appServer.clearEnv` 只影響產生的 Codex app-server 子程序。OpenClaw 會在本機啟動標準化期間，從此清單移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 仍指向選取的代理或使用者範圍，而 `HOME` 仍會繼承，讓子程序可以使用一般使用者主目錄狀態。

### 動態工具和網頁搜尋

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 不會
公開會重複 Codex 原生工作區操作的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、
`tool_call`、`tool_describe`、`tool_search` 和 `tool_search_code`。大多數
其餘的 OpenClaw 整合工具，例如訊息、媒體、排程、
瀏覽器、節點、閘道和 `heartbeat_respond`，都可透過
Codex 工具搜尋在 `openclaw` 命名空間下使用，讓初始模型
脈絡更小。

啟用搜尋且未選取受管理提供者時，網頁搜尋預設使用 Codex 託管的
`web_search` 工具。原生託管搜尋與 OpenClaw 受管理的 `web_search`
動態工具互斥，因此受管理搜尋無法繞過原生網域限制。當託管搜尋
不可用、明確停用，或由選取的受管理提供者取代時，OpenClaw 會使用
受管理工具。OpenClaw 會維持停用 Codex 的獨立 `web.run` 擴充功能，
因為生產環境的應用程式伺服器流量會拒絕其使用者定義的 `web`
命名空間。`tools.web.search.enabled: false` 會停用兩條路徑，
工具停用的僅 LLM 執行也一樣。Codex 會將 `"cached"` 視為偏好設定，
並在不受限制的應用程式伺服器回合中將其解析為即時外部存取。當
原生 `allowedDomains` 已設定時，自動受管理備援會失敗關閉，因此
允許清單無法被繞過。持久有效的搜尋政策變更會在下一個回合前
輪換已繫結的 Codex 執行緒；暫時的逐回合限制會使用暫時受限的
執行緒，並保留現有繫結以供稍後繼續。

`sessions_yield` 和僅訊息工具來源的回覆會保持直接，因為那些是
回合控制合約。`sessions_spawn` 會保持可搜尋，因此 Codex 原生的
`spawn_agent` 仍是主要的 Codex 子代理介面，而明確的 OpenClaw 或
ACP 委派仍可透過 `openclaw` 動態工具命名空間使用。心跳偵測協作
指示會告訴 Codex，在心跳偵測回合結束前，如果工具尚未載入，
要先搜尋 `heartbeat_respond`。

只有在連線到無法搜尋延後動態工具的自訂 Codex 應用程式伺服器，
或偵錯完整工具承載內容時，才設定 `codexDynamicToolsLoading: "direct"`。

### 設定欄位

支援的頂層 Codex 外掛欄位：

| 欄位                       | 預設值         | 意義                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具脈絡。                       |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex 應用程式伺服器回合中省略的其他 OpenClaw 動態工具名稱。                      |
| `codexPlugins`             | 已停用         | 對已遷移、由來源安裝的精選外掛提供原生 Codex 外掛/應用程式支援。                       |

支援的 `appServer` 欄位：

| 欄位                                          | 預設值                                                 | 含義                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依每個 OpenClaw agent 隔離 Codex 狀態。`"user"` 會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍需要 stdio。                                                                                                                                                              |
| `command`                                     | 受管理的 Codex 二進位檔                               | stdio 傳輸使用的可執行檔。保持未設定即可使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                                                                                                                                                                                                         |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸使用的引數。                                                                                                                                                                                                                                                                                                                                                                          |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸使用的 Bearer token。接受字面字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                               |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受字面字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | 在 OpenClaw 建立其繼承環境後，從產生的 stdio app-server 程序移除的額外環境變數名稱。OpenClaw 會保留選取的 `CODEX_HOME` 以及繼承的 `HOME` 供本機啟動使用。                                                                                                                                                                          |
| `codeModeOnly`                                | `false`                                                | 選擇使用 Codex 的僅限程式碼模式工具介面。OpenClaw 動態工具仍會向 Codex 註冊，因此巢狀 `tools.*` 呼叫會透過 app-server `item/tool/call` 橋接返回。                                                                                                                                                                                   |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從解析出的 OpenClaw 工作區推斷本機工作區根目錄，保留目前 cwd 在此遠端根目錄下的尾端路徑，並只將最終 app-server cwd 傳送給 Codex。如果 cwd 位於解析出的 OpenClaw 工作區根目錄之外，OpenClaw 會以失敗關閉，而不是將閘道本機路徑傳送給遠端 app-server。                         |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個 turn 後，或在 turn 範圍的 app-server 要求之後，OpenClaw 等待 `turn/completed` 時使用的靜默視窗。                                                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | 在工具交接、原生工具完成、工具後原始 assistant 進度、原始推理完成，或推理進度之後，OpenClaw 等待 `turn/completed` 時使用的完成閒置與進度防護。這適用於受信任或繁重的工作負載，其中工具後綜合可能合理地比最終 assistant 發布預算保持更久的靜默。                                                                                  |
| `mode`                                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO              | YOLO 或 guardian 審核執行的預設集。若本機 stdio 需求省略 `danger-full-access`、`never` 核准，或 `user` 審核者，隱含預設值會變成 guardian。                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准政策                  | 傳送到執行緒開始、恢復或 turn 的原生 Codex 核准政策。guardian 預設值會在允許時偏好 `"on-request"`。                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙盒         | 傳送到執行緒開始或恢復的原生 Codex 沙盒模式。guardian 預設值會在允許時偏好 `"workspace-write"`，否則使用 `"read-only"`。當 OpenClaw 沙盒作用中時，`danger-full-access` turn 會使用 Codex `workspace-write`，其網路存取由 OpenClaw 沙盒出口設定衍生。                                                                            |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審核者                     | 在允許時使用 `"auto_review"` 讓 Codex 審核原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 啟用快速模式路由，`"flex"` 要求彈性處理，`null` 清除覆寫，而舊版 `"fast"` 會以 `"priority"` 接受。                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                                 | 選擇對 app-server 命令使用 Codex 權限設定檔網路。OpenClaw 會定義選取的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選用設定，會向 Codex app-server 0.132.0 或更新版本註冊由 OpenClaw 沙盒支援的 Codex 環境，讓原生 Codex 執行可以在作用中的 OpenClaw 沙盒內執行。                                                                                                                                                                             |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙盒
合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定
`features.network_proxy.enabled` 和 `default_permissions`，讓產生的
權限設定檔可以啟動 Codex 受管理網路。預設情況下，OpenClaw
會從設定檔內容產生防碰撞的 `openclaw-network-<fingerprint>` 設定檔
名稱；只有在需要穩定的本機名稱時才使用 `profileName`。

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

如果一般 app-server 執行階段會是 `danger-full-access`，啟用
`networkProxy` 會對產生的權限設定檔使用工作區樣式的檔案系統存取：Codex
管理的網路強制執行是沙箱化網路，因此 full-access 設定檔無法保護對外流量。
網域項目使用 `allow` 或 `deny`；Unix socket 項目使用 Codex 的
`allow` 或 `none` 值。

### 動態工具呼叫逾時

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制：Codex `item/tool/call` 請求預設使用 90
秒的 OpenClaw 看門狗。每次呼叫若提供正值 `timeoutMs`
引數，會延長或縮短該特定工具預算，上限為 600000 ms。
當工具呼叫未提供自己的逾時設定時，`image_generate` 工具會使用 `agents.defaults.imageGenerationModel.timeoutMs`，
否則使用 120 秒的圖片生成預設值。媒體理解 `image` 工具會使用
`tools.media.image.timeoutSeconds` 或其 60 秒媒體預設值；對於圖片理解，該逾時會套用到請求本身，
且不會因先前的準備工作而縮短。逾時時，OpenClaw 會在支援處中止工具訊號，
並向 Codex 傳回失敗的動態工具回應，讓回合可以繼續，而不是讓工作階段停留在 `processing`。
這個看門狗是外層動態 `item/tool/call` 預算；供應商特定的
請求逾時會在該呼叫內執行，並保留自己的逾時語意。

在 Codex 接受一個回合後，以及 OpenClaw 回應回合範圍的
app-server 請求後，測試框架會預期 Codex 推進目前回合，
並最終以 `turn/completed` 完成原生回合。如果
app-server 在 `appServer.turnCompletionIdleTimeoutMs` 期間保持靜默，OpenClaw
會盡力中斷 Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，
讓後續聊天訊息不會排在過期的原生回合後方。同一回合的大多數非終端通知會解除這個短看門狗，
因為 Codex 已證明該回合仍然存活。

工具交接會使用較長的工具後閒置預算：在 OpenClaw 傳回
`item/tool/call` 回應後、在 `commandExecution` 等原生工具項目完成後、
在原始 `custom_tool_call_output` 完成後，以及在工具後原始助理進度、原始推理完成，
或推理進度之後。防護在有設定時會使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則預設為五分鐘；同一預算也會延長
Codex 發出下一個目前回合事件前的靜默合成視窗進度看門狗。
全域 app-server 通知，例如速率限制更新，不會重設回合閒置進度。推理完成、
commentary `agentMessage` 完成，以及工具前原始推理或
助理進度之後可能接著自動最終回覆，因此它們會使用
進度後回覆防護，而不是立即釋放工作階段通道。

只有最終/非 commentary 的已完成 `agentMessage` 項目，以及工具前原始
助理完成會啟用助理輸出釋放：如果 Codex 隨後在沒有
`turn/completed` 的情況下保持靜默，OpenClaw 會盡力中斷原生
回合並釋放工作階段通道。如果另一個回合監看贏得該釋放競賽，OpenClaw
仍會在沒有原生請求、項目或動態工具完成仍處於作用中，
且助理輸出釋放仍屬於最新已完成項目、沒有後續項目完成時，
接受已完成的最終助理項目。這可以在已完成的工具工作後保留最終答案，
而不重播該回合。部分助理 delta、過期的較早回覆，以及空的後續完成不符合資格。

可安全重播的 stdio app-server 失敗，包括沒有助理、工具、作用中項目或副作用證據的回合完成閒置逾時，
會在新的 app-server 嘗試上重試一次。不安全的逾時仍會淘汰卡住的
app-server 用戶端並釋放 OpenClaw 工作階段通道；它們也會清除過期的原生執行緒繫結，
而不是自動重播。完成監看逾時會顯示 Codex 特定的逾時文字：可安全重播的情況會表示回應可能不完整，
而不安全的情況會要求使用者在重試前確認目前狀態。公開逾時診斷會包含結構化欄位，
例如最後一個 app-server 通知方法、原始助理回應項目 id/type/role、作用中請求/項目計數，
以及已啟用的監看狀態；當最後一個通知是原始助理回應項目時，
也會包含有界的助理文字預覽。它們不包含原始提示或工具內容。

### 本機測試環境覆寫

- `OPENCLAW_CODEX_APP_SERVER_BIN` 會在
  `appServer.command` 未設定時略過受管理的二進位檔。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本機測試中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對可重複的部署而言，設定檔較佳，因為它會將外掛
行為與其餘 Codex 測試框架設定保留在同一個已審查檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw 測試框架回合相同的 Codex 執行緒中，
使用 Codex app-server 自己的應用程式與外掛能力。OpenClaw
不會將 Codex 外掛轉換成合成的 `codex_plugin_*` OpenClaw
動態工具。

`codexPlugins` 只影響選取原生 Codex 測試框架的工作階段。
它對內建測試框架執行、一般 OpenAI 供應商執行、ACP
對話繫結或其他測試框架沒有影響。

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

執行緒應用程式設定會在 OpenClaw 建立 Codex 測試框架
工作階段，或替換過期的 Codex 執行緒繫結時運算；它不會在每個
回合重新運算。變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動
閘道，讓未來的 Codex 測試框架工作階段以更新後的應用程式
集合啟動。

如需遷移資格、應用程式清單、破壞性動作政策、
引出、以及原生外掛診斷，請參閱
[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的應用程式與外掛存取由已登入的 Codex
帳戶控制；對於 Business 和 Enterprise/Edu 工作區，則也由工作區應用程式
控制項控制。請參閱
[搭配你的 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
以了解 OpenAI 的帳戶與工作區控制概觀。

## 電腦使用

電腦使用有自己的設定指南：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會隨附桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex app-server、確認
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間擁有原生
MCP 工具呼叫。

## 執行階段邊界

Codex 測試框架只會變更低階嵌入式代理執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行
  這些工具，因此 OpenClaw 仍在執行路徑中。
- Codex 原生 shell、patch、MCP，以及原生應用程式工具由 Codex 擁有。
  OpenClaw 可以透過支援的轉送觀察或封鎖選定的原生事件，
  但不會改寫原生工具引數。
- Codex 擁有原生壓縮。OpenClaw 會保留逐字稿鏡像，用於
  頻道歷史、搜尋、`/new`、`/reset`，以及未來的模型或測試框架
  切換，但不會以 OpenClaw 或
  context-engine 摘要器取代 Codex 壓縮。
- 媒體生成、媒體理解、TTS、核准，以及訊息工具
  輸出會繼續透過相對應的 OpenClaw 供應商/模型設定。
- `tool_result_persist` 套用於 OpenClaw 擁有的逐字稿工具結果，
  而不是 Codex 原生工具結果記錄。

如需 hook 層、支援的 V1 表面、原生權限處理、佇列
導向、Codex 意見回饋上傳機制，以及壓縮詳細資訊，請參閱
[Codex 測試框架執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般 `/model` 供應商：** 對新設定而言這是預期情況。
請選取 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用內建測試框架而不是 Codex：** 請確認模型
ref 是官方 OpenAI 供應商上的 `openai/gpt-*`，且 Codex
外掛已安裝並啟用。測試時若需要嚴格證明，請設定
供應商或模型 `agentRuntime.id: "codex"` — 強制 Codex 執行階段會失敗，
而不是退回 OpenClaw。

**OpenAI Codex 執行階段退回 API 金鑰路徑：** 收集一段已遮蔽的
閘道摘錄，顯示模型、執行階段、選取的供應商，以及
失敗。請受影響的協作者在其 OpenClaw 主機上執行這個唯讀命令：

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

有用的摘錄通常會包含 `openai/gpt-5.5` 或 `openai/gpt-5.4`、
`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、
`candidateProvider: "openai"`，以及 `401`、`Incorrect API key` 或
`No API key` 結果。修正後的執行應顯示 OpenAI OAuth 路徑，
而不是單純的 OpenAI API 金鑰失敗。

**仍保留舊版 Codex 模型 refs 設定：** 執行 `openclaw doctor --fix`。
Doctor 會將舊版模型 refs 改寫為 `openai/*`、移除過期的工作階段與
整個代理執行階段 pin，並保留既有的 auth-profile 覆寫。

**app-server 被拒絕：** 使用 Codex app-server `0.125.0` 或更新版本。
相同版本的預發行版或帶有建置尾碼的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom` 會被拒絕，因為 OpenClaw 會測試
穩定版 `0.125.0` 協定下限。

**`/codex status` 無法連線：** 檢查隨附的 `codex` 外掛
是否已啟用、在設定 allowlist 時 `plugins.allow` 是否包含它，
以及任何自訂 `appServer.command`、`url`、`authToken` 或
headers 是否有效。

**模型探索很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。
請參閱 [Codex 測試框架參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：** 檢查 `appServer.url`、
`authToken`、headers，以及遠端 app-server 是否使用相同的 Codex
app-server 協定版本。

**原生 shell 或 patch 工具被 `Native hook relay
unavailable` 阻擋：** Codex 執行緒仍在嘗試使用 OpenClaw 已不再註冊的原生 hook 中繼 id。這是原生 Codex hook 傳輸問題，不是 ACP 後端、提供者、GitHub 或 shell 命令失敗。在受影響的聊天中使用 `/new` 或 `/reset` 開始新的工作階段，然後重試一個無害的命令。如果那次可行，但下一次原生工具呼叫又失敗，請只將 `/new` 視為暫時的因應措施：重新啟動 Codex app-server 或 OpenClaw 閘道後，將提示複製到新的工作階段，讓舊執行緒被丟棄並重新建立原生 hook 註冊。

**非 Codex 模型使用內建執行框架：** 除非提供者或模型執行階段政策將其路由到另一個執行框架，否則這是預期行為。一般的非 OpenAI 提供者參照在 `auto` 模式中會保留在其正常提供者路徑上。

**已安裝電腦使用功能，但工具未執行：** 從新的工作階段檢查 `/codex computer-use status`。如果某個工具回報 `Native hook relay unavailable`，請使用上方的原生 hook 中繼復原方式。請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關

- [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)
- [代理執行階段](/zh-TW/concepts/agent-runtimes)
- [模型提供者](/zh-TW/concepts/model-providers)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [OpenAI Codex 說明](https://help.openai.com/en/collections/14937394-codex)
- [代理執行框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [外掛 hooks](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
