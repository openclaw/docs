---
read_when:
    - 你想使用隨附的 Codex app-server 測試框架
    - 你需要 Codex harness 設定範例
    - 你希望僅使用 Codex 的部署失敗，而不是回退到 OpenClaw
summary: 透過內建的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 測試框架
x-i18n:
    generated_at: "2026-06-30T13:48:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

內建的 `codex` 外掛讓 OpenClaw 透過 Codex app-server 執行嵌入式 OpenAI 代理回合，而不是使用內建的 OpenClaw 執行框架。

當你希望由 Codex 擁有底層代理工作階段時，請使用 Codex 執行框架：原生對話串續接、原生工具延續、原生壓縮，以及 app-server 執行。OpenClaw 仍然擁有聊天頻道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、媒體傳遞，以及可見的逐字稿鏡像。

一般設定使用標準 OpenAI 模型參照，例如 `openai/gpt-5.5`。不要設定舊版 Codex GPT 參照。請將 OpenAI 代理驗證順序放在 `auth.order.openai` 底下；較舊的舊版 Codex 驗證設定檔 ID 與舊版 Codex 驗證順序項目，是由 `openclaw doctor --fix` 修復的舊狀態。

當沒有啟用 OpenClaw 沙箱時，OpenClaw 會啟動已啟用 Codex 原生程式碼模式的 Codex app-server 對話串，同時預設保持僅限程式碼模式為關閉。這會讓 Codex 原生工作區與程式碼能力可用，同時 OpenClaw 動態工具繼續透過 app-server `item/tool/call` 橋接。啟用中的 OpenClaw 沙箱與受限工具政策會完全停用原生程式碼模式，除非你選擇使用實驗性的沙箱 exec-server 路徑。

這項 Codex 原生功能與 [OpenClaw 程式碼模式](/zh-TW/reference/code-mode) 分開；後者是為一般 OpenClaw 執行提供的選擇性 QuickJS-WASI 執行階段，並使用不同的 `exec` 輸入形狀。

若要了解更廣泛的模型／供應商／執行階段劃分，請從 [代理執行階段](/zh-TW/concepts/agent-runtimes) 開始。簡短版本是：`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他頻道仍然是通訊介面。

## 需求

- OpenClaw 可使用內建的 `codex` 外掛。
- 如果你的設定使用 `plugins.allow`，請包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。內建外掛預設會管理相容的 Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 命令不會影響一般執行框架啟動。
- 可透過 `openclaw models auth login --provider openai` 使用 Codex 驗證、代理 Codex home 中的 app-server 帳戶，或明確的 Codex API 金鑰驗證設定檔。

如需驗證優先順序、環境隔離、自訂 app-server 命令、模型探索，以及所有設定欄位，請參閱 [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

大多數想在 OpenClaw 中使用 Codex 的使用者都會想走這條路徑：使用 ChatGPT/Codex 訂閱登入、啟用內建的 `codex` 外掛，並使用標準 `openai/gpt-*` 模型參照。

使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai
```

啟用內建的 `codex` 外掛並選取 OpenAI 代理模型：

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

變更外掛設定後，請重新啟動閘道。如果現有聊天已經有工作階段，請在測試執行階段變更前使用 `/new` 或 `/reset`，讓下一個回合從目前設定解析執行框架。

## 設定

快速開始設定是最低可用的 Codex 執行框架設定。請在 OpenClaw 設定中設定 Codex 執行框架選項，並只將命令列介面用於 Codex 驗證：

| 需求 | 設定 | 位置 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 啟用執行框架 | `plugins.entries.codex.enabled: true` | OpenClaw 設定 |
| 保留允許清單中的外掛安裝 | 在 `plugins.allow` 中包含 `codex` | OpenClaw 設定 |
| 透過 Codex 路由 OpenAI 代理回合 | 將 `agents.defaults.model` 或 `agents.list[].model` 設為 `openai/gpt-*` | OpenClaw 代理設定 |
| 使用 ChatGPT/Codex OAuth 登入 | `openclaw models auth login --provider openai` | 命令列介面驗證設定檔 |
| 為 Codex 執行加入 API 金鑰備援 | 在 `auth.order.openai` 中列於訂閱驗證之後的 `openai:*` API 金鑰設定檔 | 命令列介面驗證設定檔 + OpenClaw 設定 |
| Codex 不可用時封閉失敗 | 供應商或模型 `agentRuntime.id: "codex"` | OpenClaw 模型／供應商設定 |
| 使用直接 OpenAI API 流量 | 供應商或模型 `agentRuntime.id: "openclaw"` 並使用一般 OpenAI 驗證 | OpenClaw 模型／供應商設定 |
| 調整 app-server 行為 | `plugins.entries.codex.config.appServer.*` | Codex 外掛設定 |
| 啟用原生 Codex 外掛應用程式 | `plugins.entries.codex.config.codexPlugins.*` | Codex 外掛設定 |
| 啟用 Codex Computer Use | `plugins.entries.codex.config.computerUse.*` | Codex 外掛設定 |

針對由 Codex 支援的 OpenAI 代理回合，請使用 `openai/gpt-*` 模型參照。建議使用 `auth.order.openai` 來設定訂閱優先／API 金鑰備援的順序。既有舊版 Codex 驗證設定檔 ID 與舊版 Codex 驗證順序是僅供 doctor 使用的舊狀態；不要寫入新的舊版 Codex GPT 參照。

不要在由 Codex 支援的代理上設定 `compaction.model` 或 `compaction.provider`。Codex 會透過其原生 app-server 對話串狀態進行壓縮，因此 OpenClaw 會在執行階段忽略這些本機摘要器覆寫，且當代理使用 Codex 時，`openclaw doctor --fix` 會移除它們。

Lossless 仍支援作為 Codex 回合周邊組裝、擷取與維護的內容引擎。請透過 `plugins.slots.contextEngine: "lossless-claw"` 和 `plugins.entries.lossless-claw.config.summaryModel` 設定它，而不是透過 `agents.defaults.compaction.provider`。當 Codex 是啟用中的執行階段時，`openclaw doctor --fix` 會將舊的 `compaction.provider: "lossless-claw"` 形狀遷移到 Lossless 內容引擎插槽，但原生 Codex 仍然擁有壓縮。

原生 Codex app-server 執行框架支援需要前置提示組裝的內容引擎。包含 `codex-cli` 在內的一般命令列介面後端不提供該主機能力。

對於由 Codex 支援的代理，`/compact` 會在已繫結的對話串上啟動原生 Codex app-server 壓縮。OpenClaw 不會等待完成、不會施加 OpenClaw 逾時、不會重新啟動共用 app-server，也不會退回到內容引擎或公開 OpenAI 摘要器。如果原生 Codex 對話串繫結遺失或過期，命令會封閉失敗，讓操作員看到真實的執行階段邊界，而不是默默切換壓縮後端。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在該形狀中，兩個設定檔對 `openai/gpt-*` 代理回合仍然都會透過 Codex 執行。API 金鑰只是驗證備援，不是切換到 OpenClaw 或純 OpenAI Responses 的請求。

本頁其餘部分涵蓋使用者必須在其中選擇的常見變體：部署形狀、封閉失敗路由、監護人核准政策、原生 Codex 外掛，以及 Computer Use。如需完整選項清單、預設值、列舉、探索、環境隔離、逾時，以及 app-server 傳輸欄位，請參閱 [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex 執行階段

在你預期使用 Codex 的聊天中使用 `/status`。由 Codex 支援的 OpenAI 代理回合會顯示：

```text
Runtime: OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線能力、帳戶、速率限制、MCP 伺服器和 Skills。`/codex models` 會列出該執行框架與帳戶的即時 Codex app-server 目錄。如果 `/status` 的結果令人意外，請參閱 [疑難排解](#troubleshooting)。

## 路由與模型選擇

請將供應商參照與執行階段政策分開：

- 使用 `openai/gpt-*` 透過 Codex 執行 OpenAI 代理回合。
- 不要在設定中使用舊版 Codex GPT 參照。執行 `openclaw doctor --fix` 以修復舊版參照與過期的工作階段路由釘選。
- `agentRuntime.id: "codex"` 對一般 OpenAI 自動模式是選用的，但當部署應在 Codex 不可用時封閉失敗，就很有用。
- `agentRuntime.id: "openclaw"` 會在有意為之時，讓供應商或模型使用 OpenClaw 嵌入式執行階段。
- `/codex ...` 會從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是另一條外部執行框架路徑。只有在使用者要求 ACP/acpx 或外部執行框架轉接器時才使用它。

常見命令路由：

| 使用者意圖 | 使用 |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前聊天 | `/codex bind [--cwd <path>]` |
| 續接既有 Codex 對話串 | `/codex resume <thread-id>` |
| 列出或篩選 Codex 對話串 | `/codex threads [filter]` |
| 列出原生 Codex 外掛 | `/codex plugins list` |
| 啟用或停用已設定的原生 Codex 外掛 | `/codex plugins enable <name>`, `/codex plugins disable <name>` |
| 在配對節點上附加既有 Codex 命令列介面工作階段 | `/codex sessions --host <node> [filter]`，然後 `/codex resume <session-id> --host <node> --bind here` |
| 只傳送 Codex 意見回饋 | `/codex diagnostics [note]` |
| 啟動 ACP/acpx 任務 | ACP/acpx 工作階段命令，而不是 `/codex` |

| 使用案例                                             | 設定                                                                  | 驗證                                    | 備註                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱 | `openai/gpt-*` 加上已啟用的 `codex` 外掛                             | `/status` 顯示 `Runtime: OpenAI Codex` | 建議路徑                              |
| Codex 不可用時失敗即關閉                  | 供應商或模型 `agentRuntime.id: "codex"`                           | 回合失敗，而不是使用內嵌備援 | 用於僅限 Codex 的部署        |
| 透過 OpenClaw 直接傳送 OpenAI API 金鑰流量       | 供應商或模型 `agentRuntime.id: "openclaw"` 和一般 OpenAI 驗證 | `/status` 顯示 OpenClaw 執行階段        | 僅在刻意使用 OpenClaw 時使用 |
| 舊版設定                                        | 舊版 Codex GPT 參照                                                  | `openclaw doctor --fix` 會重寫它     | 不要用這種方式撰寫新設定      |
| ACP/acpx Codex 配接器                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP 工作/工作階段狀態                 | 與原生 Codex 執行框架分開    |

`agents.defaults.imageModel` 遵循相同的前綴分流。一般 OpenAI 路由使用 `openai/gpt-*`，
只有在影像理解應該透過有界限的 Codex 應用程式伺服器回合執行時，
才使用 `codex/gpt-*`。不要使用舊版 Codex GPT 參照；doctor 會將該舊版前綴重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

當所有 OpenAI 代理回合預設都應使用 Codex 時，使用快速入門設定。

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

### 混合供應商部署

此形態會保留 Claude 作為預設代理，並加入一個具名 Codex 代理：

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

使用此設定時，`main` 代理會使用其一般供應商路徑，而 `codex` 代理會使用 Codex 應用程式伺服器。

### 失敗即關閉的 Codex 部署

對於 OpenAI 代理回合，只要 bundled 外掛可用，`openai/gpt-*` 已會解析為 Codex。
當你想要一條明文的失敗即關閉規則時，加入明確的執行階段政策：

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

強制使用 Codex 時，如果 Codex 外掛已停用、應用程式伺服器太舊，或應用程式伺服器無法啟動，
OpenClaw 會提早失敗。

## 應用程式伺服器政策

預設情況下，外掛會在本機以 stdio 傳輸啟動 OpenClaw 管理的 Codex 二進位檔。
只有在你刻意想執行不同可執行檔時，才設定 `appServer.command`。
只有在應用程式伺服器已於其他地方執行時，才使用 WebSocket 傳輸：

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

本機 stdio 應用程式伺服器工作階段預設採用受信任的本機操作員姿態：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。如果本機 Codex 要求不允許該隱含的無核准姿態，
OpenClaw 會改選允許的 guardian 權限。
當工作階段中啟用 OpenClaw 沙盒時，OpenClaw 會在該回合停用 Codex
原生 Code Mode、使用者 MCP 伺服器，以及應用程式支援的外掛執行，
而不是依賴 Codex 主機端沙盒。當一般 exec/process 工具可用時，
Shell 存取會透過 OpenClaw 沙盒支援的動態工具公開，例如 `sandbox_exec` 和
`sandbox_process`。

當你希望 Codex 在沙盒逃逸或額外權限之前執行原生自動審查時，使用正規化的 OpenClaw exec 模式：

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

對於 Codex 應用程式伺服器工作階段，OpenClaw 會將 `tools.exec.mode: "auto"` 對應到
Codex Guardian 審查的核准；在本機要求允許這些值時，通常是
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及
`sandbox: "workspace-write"`。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不會保留舊版不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若要刻意採用
無核准的 Codex 姿態，請使用 `tools.exec.mode: "full"`。舊版
`plugins.entries.codex.config.appServer.mode: "guardian"` 預設集仍可運作，
但 `tools.exec.mode: "auto"` 是正規化的 OpenClaw 介面。

如需與主機 exec 核准和 ACPX 權限進行模式層級比較，
請參閱[權限模式](/zh-TW/tools/permission-modes)。

如需每個應用程式伺服器欄位、驗證順序、環境隔離、探索和逾時行為，
請參閱 [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

bundled 外掛會在任何支援 OpenClaw 文字命令的通道上，將 `/codex` 註冊為斜線命令。

原生執行和控制需要擁有者或 `operator.admin` 閘道用戶端。
這包括綁定或恢復執行緒、傳送或停止回合、變更模型、快速模式或權限狀態、
壓縮或審查，以及分離綁定。其他已授權傳送者保留唯讀的狀態、說明、
帳號、模型、執行緒、MCP 伺服器、技能和綁定檢查命令。

常見形式：

- `/codex status` 會檢查應用程式伺服器連線、模型、帳號、速率限制、
  MCP 伺服器和技能。
- `/codex models` 會列出即時 Codex 應用程式伺服器模型。
- `/codex threads [filter]` 會列出最近的 Codex 應用程式伺服器執行緒。
- `/codex resume <thread-id>` 會將目前 OpenClaw 工作階段附加到
  現有 Codex 執行緒。
- `/codex compact` 會要求 Codex 應用程式伺服器壓縮已附加的執行緒。
- `/codex review` 會為已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加執行緒的 Codex 意見回饋前先詢問。
- `/codex account` 會顯示帳號和速率限制狀態。
- `/codex mcp` 會列出 Codex 應用程式伺服器 MCP 伺服器狀態。
- `/codex skills` 會列出 Codex 應用程式伺服器技能。

對於大多數支援回報，請從發生錯誤的對話中使用 `/diagnostics [note]` 開始。
它會建立一份閘道診斷報告；對於 Codex 執行框架工作階段，會要求核准傳送相關的 Codex 意見回饋套件。
請參閱[診斷匯出](/zh-TW/gateway/diagnostics)以了解隱私模型和群組聊天行為。

只有在你特別想針對目前已附加的執行緒上傳 Codex 意見回饋，而不需要完整的閘道診斷套件時，
才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 執行緒

檢查不良 Codex 執行最迅速的方式，通常是直接開啟原生 Codex 執行緒：

```bash
codex resume <thread-id>
```

從完成的 `/diagnostics` 回覆、`/codex binding`，或
`/codex threads [filter]` 取得執行緒 ID。

如需上傳機制和執行階段層級診斷邊界，請參閱
[Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

驗證會依此順序選取：

1. 代理的已排序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 之下。執行 `openclaw doctor --fix` 以遷移較舊的
   舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序。
2. 該代理的 Codex home 中，應用程式伺服器既有的帳號。
3. 僅限本機 stdio 應用程式伺服器啟動，當不存在應用程式伺服器帳號且仍需要 OpenAI 驗證時，
   使用 `CODEX_API_KEY`，接著使用 `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱式 Codex 驗證設定檔時，它會從產生的 Codex 子行程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。
這會讓閘道層級的 API 金鑰仍可用於 embeddings 或直接 OpenAI 模型，
而不會意外讓原生 Codex 應用程式伺服器回合透過 API 計費。
明確的 Codex API 金鑰設定檔和本機 stdio 環境金鑰備援會使用應用程式伺服器登入，
而不是繼承子行程環境。WebSocket 應用程式伺服器連線不會接收閘道環境 API 金鑰備援；
請使用明確的驗證設定檔或遠端應用程式伺服器自己的帳號。
設定原生 Codex 外掛時，OpenClaw 會在將外掛擁有的應用程式公開給 Codex 執行緒之前，
透過連線的應用程式伺服器安裝或重新整理這些外掛。`app/list` 仍是應用程式 ID、
可存取性和中繼資料的事實來源，但 OpenClaw 擁有每個執行緒的啟用決策：
如果政策允許列出的可存取應用程式，即使 `app/list` 目前回報該應用程式已停用，
OpenClaw 也會傳送 `thread/start.config.apps[appId].enabled = true`。
此路徑不會為未知 ID 憑空建立應用程式安裝；OpenClaw 只會使用 `plugin/install`
啟用 marketplace 外掛，然後重新整理清單。

如果訂閱設定檔遇到 Codex 使用量限制，當 Codex 回報重設時間時，OpenClaw 會記錄該時間，
並為同一個 Codex 執行嘗試下一個已排序的驗證設定檔。當重設時間經過後，
訂閱設定檔會再次符合資格，而不需要變更所選的 `openai/gpt-*` 模型或 Codex 執行階段。

對於本機 stdio 應用程式伺服器啟動，OpenClaw 會將 `CODEX_HOME` 設為每個代理專用的目錄，
因此 Codex 設定、驗證/帳號檔案、外掛快取/資料，以及原生執行緒狀態，預設不會讀寫操作員個人的
`~/.codex`。OpenClaw 會保留一般行程的 `HOME`；Codex 執行的子行程仍可找到使用者 home 設定和權杖，
且 Codex 可能探索共用的 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 項目。

如果部署需要額外環境隔離，請將那些變數加入
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

`appServer.clearEnv` 只會影響產生的 Codex 應用程式伺服器子行程。
OpenClaw 會在本機啟動正規化期間，從此清單移除 `CODEX_HOME` 和 `HOME`：
`CODEX_HOME` 會維持每個代理專用，而 `HOME` 會保持繼承，讓子行程可以使用一般使用者 home 狀態。

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 不會公開
會重複 Codex 原生工作區操作的動態工具：`read`、`write`、
`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。大多數其餘的
OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、
閘道，以及 `heartbeat_respond`，都可透過 `openclaw`
命名空間下的 Codex 工具搜尋取得，讓初始模型脈絡更小。啟用搜尋且未選取
受管理提供者時，網頁搜尋預設使用 Codex 託管的 `web_search` 工具。
原生託管搜尋與 OpenClaw 受管理的 `web_search` 動態工具互斥，因此受管理搜尋無法繞過
原生網域限制。當託管搜尋不可用、明確停用，或由選取的受管理提供者取代時，
OpenClaw 會使用受管理工具。OpenClaw 會維持停用 Codex 的獨立
`web.run` 擴充功能，因為正式環境的應用程式伺服器流量會拒絕其使用者定義的 `web`
命名空間。`tools.web.search.enabled: false` 會停用兩條路徑，工具停用的
僅 LLM 執行也同樣如此。Codex 會將 `"cached"` 視為偏好設定，並在不受限制的
應用程式伺服器回合中將其解析為即時外部存取。當設定原生 `allowedDomains` 時，
自動受管理後援會以關閉方式失敗，因此允許清單無法被繞過。持久的有效搜尋政策變更會在下一回合前
輪替已繫結的 Codex 執行緒。暫時的逐回合限制會使用臨時的
受限制執行緒，並保留現有繫結以供稍後恢復。
`sessions_yield` 和僅訊息工具來源回覆會維持直接模式，因為
那些是回合控制合約。`sessions_spawn` 會維持可搜尋，因此 Codex 的
原生 `spawn_agent` 仍是主要的 Codex 子代理介面，同時明確的
OpenClaw 或 ACP 委派仍可透過 `openclaw` 動態
工具命名空間取得。心跳偵測協作指示會告訴 Codex，在心跳偵測回合結束前，若工具尚未
載入，先搜尋 `heartbeat_respond`。

只有在連接到無法搜尋延遲動態工具的自訂 Codex
應用程式伺服器，或是在偵錯完整工具承載時，才設定 `codexDynamicToolsLoading: "direct"`。

支援的頂層 Codex 外掛欄位：

| 欄位                       | 預設值         | 意義                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具脈絡。 |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex 應用程式伺服器回合中省略的其他 OpenClaw 動態工具名稱。              |
| `codexPlugins`             | 已停用         | 對已遷移、以原始碼安裝的精選外掛提供原生 Codex 外掛/應用程式支援。           |

支援的 `appServer` 欄位：

| 欄位                                          | 預設值                                                 | 意義                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                           |
| `command`                                     | 受管理的 Codex 二進位檔                                | stdio 傳輸使用的可執行檔。保持未設定即可使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸使用的引數。                                                                                                                                                                                                                                                                                                                                                                           |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸使用的 Bearer 權杖。接受字面字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受字面字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立其繼承環境之後，從產生的 stdio app-server 程序中移除的額外環境變數名稱。OpenClaw 會保留每個代理程式的 `CODEX_HOME`，並為本機啟動保留繼承的 `HOME`。                                                                                                                                                                  |
| `codeModeOnly`                                | `false`                                                | 選擇使用 Codex 僅限程式碼模式的工具介面。OpenClaw 動態工具仍會註冊到 Codex，因此巢狀 `tools.*` 呼叫會透過 app-server `item/tool/call` 橋接傳回。                                                                                                                                                                                   |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從已解析的 OpenClaw 工作區推斷本機工作區根目錄，保留目前 cwd 在此遠端根目錄下的後綴，並只將最終的 app-server cwd 傳送給 Codex。如果 cwd 位於已解析的 OpenClaw 工作區根目錄之外，OpenClaw 會失敗時關閉，而不是將閘道本機路徑傳送給遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個回合後，或在回合範圍的 app-server 請求後，OpenClaw 等待 `turn/completed` 時的安靜視窗。                                                                                                                                                                                                                              |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後原始 assistant 進度、原始推理完成，或推理進度之後使用的完成閒置與進度防護。對於可信或繁重的工作負載，如果工具後合成可以合理地比最終 assistant 釋出預算更久保持安靜，請使用此設定。                                                                          |
| `mode`                                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO               | YOLO 或由 guardian 審核執行的預設集。若本機 stdio 需求省略 `danger-full-access`、`never` 核准，或 `user` 審核者，則隱含預設值會成為 guardian。                                                                                                                                                                                     |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准政策                   | 傳送到執行緒開始/繼續/回合的原生 Codex 核准政策。guardian 預設值會在允許時偏好 `"on-request"`。                                                                                                                                                                                                                                     |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙箱          | 傳送到執行緒開始/繼續的原生 Codex 沙箱模式。guardian 預設值會在允許時偏好 `"workspace-write"`，否則為 `"read-only"`。當 OpenClaw 沙箱處於作用中時，`danger-full-access` 回合會使用 Codex `workspace-write`，其網路存取權衍生自 OpenClaw 沙箱輸出設定。                                                                            |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審核者                      | 在允許時使用 `"auto_review"` 讓 Codex 審核原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                 |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會請求 flex 處理，`null` 會清除覆寫，而舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                           |
| `networkProxy`                                | 已停用                                                 | 選擇對 app-server 命令使用 Codex 權限設定檔網路。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽選擇加入設定，會向 Codex app-server 0.132.0 或更新版本註冊由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行可以在作用中的 OpenClaw 沙箱內執行。                                                                                                                                                                             |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙箱
合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動 Codex 受管理網路。預設情況下，OpenClaw 會從
設定檔本文產生防碰撞的 `openclaw-network-<fingerprint>` 設定檔名稱；
只有在需要穩定的本機名稱時才使用 `profileName`。

```js
export default {
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
};
```

如果一般 app-server 執行階段會是 `danger-full-access`，啟用
`networkProxy` 會對產生的權限
設定檔使用工作區樣式的檔案系統存取。Codex 受管理網路強制執行是沙箱化網路，
因此完整存取設定檔不會保護對外流量。
網域項目使用 `allow` 或 `deny`；Unix socket 項目使用 Codex 的
`allow` 或 `none` 值。

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制：Codex `item/tool/call` 請求預設使用 90 秒的
OpenClaw 監看器。正值的單次呼叫 `timeoutMs` 引數會延長或縮短該特定工具的預算。當工具呼叫未提供自己的逾時設定時，`image_generate` 工具會使用
`agents.defaults.imageGenerationModel.timeoutMs`，否則會使用 120 秒的影像生成預設值。
媒體理解 `image` 工具會使用
`tools.media.image.timeoutSeconds`，或其 60 秒的媒體預設值。對於影像理解，該逾時會套用於請求本身，不會因較早的準備工作而縮短。動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援時中止工具訊號，並向 Codex 傳回失敗的動態工具回應，讓該回合可以繼續，而不是讓工作階段停留在 `processing`。
這個監看器是外層的動態 `item/tool/call` 預算；供應者特定的請求逾時會在該呼叫內執行，並保留自己的逾時語意。

在 Codex 接受一個回合之後，以及 OpenClaw 回應回合範圍的應用程式伺服器請求之後，執行框架會預期 Codex 推進目前回合，並最終以 `turn/completed` 結束原生回合。如果應用程式伺服器在 `appServer.turnCompletionIdleTimeoutMs` 期間保持沉默，OpenClaw 會盡力中斷 Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，讓後續聊天訊息不會排在過期的原生回合後面。同一回合的大多數非終止通知都會解除這個短監看器，因為 Codex 已證明該回合仍然存活。工具交接會使用較長的工具後閒置預算：在 OpenClaw 傳回 `item/tool/call` 回應之後、在 `commandExecution` 等原生工具項目完成之後、在原始 `custom_tool_call_output` 完成之後，以及在工具後原始助理進度、原始推理完成或推理進度之後。若已設定，保護機制會使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則預設為五分鐘。相同的工具後預算也會延長進度監看器，用於 Codex 發出下一個目前回合事件之前的靜默綜合視窗。全域應用程式伺服器通知，例如速率限制更新，不會重設回合閒置進度。推理完成、commentary `agentMessage` 完成，以及工具前原始推理或助理進度，後面可能接著自動最終回覆，因此它們會使用進度後回覆保護，而不是立即釋放工作階段通道。只有最終／非 commentary 的已完成 `agentMessage` 項目和工具前原始助理完成會啟動助理輸出釋放：如果 Codex 接著保持沉默且沒有 `turn/completed`，OpenClaw 會盡力中斷原生回合並釋放工作階段通道。可安全重播的 stdio 應用程式伺服器失敗，包括沒有助理、工具、作用中項目或副作用證據的回合完成閒置逾時，會在新的應用程式伺服器嘗試上重試一次。不安全的逾時仍會淘汰卡住的應用程式伺服器用戶端並釋放 OpenClaw 工作階段通道。它們也會清除過期的原生執行緒繫結，而不是自動重播。完成監看逾時會顯示 Codex 特定的逾時文字：可安全重播的情況會說回應可能不完整，而不安全的情況會告知使用者在重試前先驗證目前狀態。公開逾時診斷包含結構化欄位，例如最後一個應用程式伺服器通知方法、原始助理回應項目的 id/type/role、作用中請求／項目數量，以及已啟動的監看狀態。當最後一個通知是原始助理回應項目時，它們也會包含有界限的助理文字預覽。它們不會包含原始提示或工具內容。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當
`appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於可重複部署，建議使用設定，因為它會讓外掛行為與其餘 Codex 執行框架設定保留在同一個已審閱的檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw 執行框架回合同一個 Codex 執行緒中，使用 Codex 應用程式伺服器自己的應用程式與外掛能力。OpenClaw 不會將 Codex 外掛轉譯為合成的 `codex_plugin_*` OpenClaw 動態工具。

`codexPlugins` 只影響選取原生 Codex 執行框架的工作階段。它不會影響內建執行框架執行、一般 OpenAI 供應者執行、ACP 對話繫結或其他執行框架。

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

執行緒應用程式設定會在 OpenClaw 建立 Codex 執行框架工作階段，或取代過期的 Codex 執行緒繫結時運算。它不會在每個回合重新運算。變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動閘道，讓未來的 Codex 執行框架工作階段以更新後的應用程式集啟動。

如需遷移資格、應用程式清單、破壞性動作政策、引導要求，以及原生外掛診斷，請參閱
[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的應用程式與外掛存取由已登入的 Codex 帳戶控制；對於 Business 和 Enterprise/Edu 工作區，則由工作區應用程式控制項控制。請參閱
[使用你的 ChatGPT 方案搭配 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
以了解 OpenAI 的帳戶與工作區控制概觀。

## 電腦使用

電腦使用在自己的設定指南中說明：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會隨附桌面控制應用程式，也不會自行執行桌面動作。它會準備 Codex 應用程式伺服器，驗證 `computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合中擁有原生 MCP 工具呼叫。

## 執行階段邊界

Codex 執行框架只會變更低階嵌入式代理程式執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行這些工具，因此 OpenClaw 仍位於執行路徑中。
- Codex 原生 shell、patch、MCP 和原生應用程式工具由 Codex 擁有。OpenClaw 可以透過支援的轉送觀察或封鎖選定的原生事件，但不會重寫原生工具引數。
- Codex 擁有原生壓縮。OpenClaw 會保留轉錄鏡像，用於頻道歷史、搜尋、`/new`、`/reset`，以及未來的模型或執行框架切換，但不會用 OpenClaw 或情境引擎摘要器取代 Codex 壓縮。
- 媒體生成、媒體理解、TTS、核准和訊息工具輸出，會繼續透過相符的 OpenClaw 供應者／模型設定處理。
- `tool_result_persist` 會套用於 OpenClaw 擁有的轉錄工具結果，而不是 Codex 原生工具結果記錄。

如需鉤子層、支援的 V1 介面、原生權限處理、佇列導向、Codex 意見回饋上傳機制，以及壓縮細節，請參閱
[Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未以一般 `/model` 供應者出現：** 對於新設定，這是預期行為。選取 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用內建執行框架而不是 Codex：** 請確認模型參照是官方 OpenAI 供應者上的
`openai/gpt-*`，且 Codex 外掛已安裝並啟用。如果你在測試時需要嚴格證明，請設定供應者或模型 `agentRuntime.id: "codex"`。強制 Codex 執行階段會失敗，而不是退回 OpenClaw。

**OpenAI Codex 執行階段退回 API 金鑰路徑：** 收集一段已遮蔽的閘道摘錄，顯示模型、執行階段、選取的供應者和失敗。請受影響的協作者在他們的 OpenClaw 主機上執行這個唯讀命令：

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

有用的摘錄通常包含 `openai/gpt-5.5` 或 `openai/gpt-5.4`、
`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、
`candidateProvider: "openai"`，以及 `401`、`Incorrect API key` 或
`No API key` 結果。修正後的執行應顯示 OpenAI OAuth
路徑，而不是一般 OpenAI API 金鑰失敗。

**仍保留舊版 Codex 模型參照設定：** 執行 `openclaw doctor --fix`。
Doctor 會將舊版模型參照重寫為 `openai/*`、移除過期的工作階段和整個代理程式執行階段固定設定，並保留現有的驗證設定檔覆寫。

**應用程式伺服器遭拒：** 使用 Codex 應用程式伺服器 `0.125.0` 或更新版本。
相同版本的預先發布版本或帶有建置尾碼的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom`，會遭到拒絕，因為 OpenClaw 會測試穩定的 `0.125.0` 通訊協定下限。

**`/codex status` 無法連線：** 請檢查內建 `codex` 外掛已啟用；在設定允許清單時，確認 `plugins.allow` 包含它；並確認任何自訂的 `appServer.command`、`url`、`authToken` 或標頭有效。

**模型探索很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。請參閱
[Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：** 檢查 `appServer.url`、`authToken`、標頭，以及遠端應用程式伺服器是否使用相同的 Codex 應用程式伺服器通訊協定版本。

**原生 shell 或 patch 工具被 `Native hook relay unavailable` 封鎖：**
Codex 執行緒仍在嘗試使用 OpenClaw 不再註冊的原生鉤子轉送 id。這是原生 Codex 鉤子傳輸問題，不是 ACP 後端、供應者、GitHub 或 shell 命令失敗。請在受影響的聊天中使用 `/new` 或 `/reset` 啟動新的工作階段，然後重試無害命令。如果這樣能成功一次，但下一次原生工具呼叫又失敗，請只將 `/new` 視為臨時解決方法：在重新啟動 Codex 應用程式伺服器或 OpenClaw 閘道後，將提示複製到新的工作階段，讓舊執行緒被捨棄並重新建立原生鉤子註冊。

**非 Codex 模型使用內建執行框架：** 除非供應者或模型執行階段政策將其路由到另一個執行框架，否則這是預期行為。一般非 OpenAI 供應者參照在 `auto` 模式下會留在其正常供應者路徑上。

**Computer Use 已安裝但工具未執行：**請從全新工作階段檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請使用上方的原生 hook 中繼復原。請參閱
[Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關

- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [Agent runtimes](/zh-TW/concepts/agent-runtimes)
- [模型提供者](/zh-TW/concepts/model-providers)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [OpenAI Codex 說明](https://help.openai.com/en/collections/14937394-codex)
- [Agent harness 外掛](/zh-TW/plugins/sdk-agent-harness)
- [外掛 hooks](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
