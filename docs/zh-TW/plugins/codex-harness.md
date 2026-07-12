---
read_when:
    - 你想使用官方 Codex app-server 測試框架
    - 你需要 Codex 控制框架設定範例
    - 你希望僅使用 Codex 的部署在失敗時直接報錯，而不是回退至 OpenClaw
summary: 透過官方 Codex app-server 測試框架執行 OpenClaw 內嵌代理程式回合
title: Codex 控制框架
x-i18n:
    generated_at: "2026-07-12T14:41:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5f6705dad9fa3bbe45c2f4eaf079ecb861b7911142bda1301c4d64a1f21a8ec5
    source_path: plugins/codex-harness.md
    workflow: 16
---

官方 `codex` 外掛透過 Codex app-server 執行內嵌的 OpenAI 代理程式回合，而不是使用 OpenClaw 內建的執行框架。Codex 負責低階代理程式工作階段：原生執行緒續接、原生工具接續、原生壓縮，以及 app-server 執行。OpenClaw 仍負責聊天頻道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、媒體傳送，以及可見的逐字稿鏡像。

請使用標準 OpenAI 模型參照，例如 `openai/gpt-5.6-sol`。請勿設定舊版 Codex GPT 參照；請將 OpenAI 代理程式認證順序放在 `auth.order.openai` 下。舊版 Codex 認證設定檔 ID 和舊版 Codex 認證順序項目會由 `openclaw doctor --fix` 修復。

當供應商／模型執行階段原則未設定或設為 `auto` 時，僅有 `openai/*` 前綴絕不會選取此執行框架。只有在路由是完全相符的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且沒有自行指定的請求覆寫時，OpenAI 才可能隱式選取 Codex。請參閱
[OpenAI 隱式代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。
如果在確定 Platform 與 ChatGPT 路由之前，Codex 已取得認證的控制權，OpenClaw 仍要求每個候選路由宣告與 Codex 相容。僅有原生認證控制權絕不會略過該路由檢查。

當沒有啟用 OpenClaw 沙箱時，OpenClaw 會以啟用 Codex 原生程式碼模式的方式啟動 Codex app-server 執行緒（預設仍不啟用僅限程式碼模式），因此原生工作區／程式碼能力可與透過 app-server `item/tool/call` 橋接路由的 OpenClaw 動態工具一併使用。啟用中的 OpenClaw 沙箱或受限工具原則會完全停用原生程式碼模式，除非你選擇啟用實驗性的沙箱 exec-server 路徑。

使用預設的 `tools.exec.host: "auto"` 且沒有啟用 OpenClaw 沙箱時，Codex 也會取得 `node_exec` 和 `node_process` 工具，以便在已配對的節點上執行命令。原生 shell 仍位於 Codex app-server 主機和工作區（預設 stdio 部署時位於閘道本機）；`node_exec` 會依名稱或 ID 選取節點，並繼續強制執行 OpenClaw 的節點核准原則。

這項 Codex 原生功能不同於
[OpenClaw 程式碼模式](/zh-TW/reference/code-mode)；後者是供一般 OpenClaw 執行選擇性啟用的 QuickJS-WASI 執行階段，且使用不同的 `exec` 輸入格式。如需了解更廣泛的模型／供應商／執行階段區分，請先參閱
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)：`openai/gpt-5.6-sol` 是模型參照、`codex` 是執行階段，而 Telegram、Discord、Slack 或其他頻道則是通訊介面。

## 需求

- 已安裝官方 `@openclaw/codex` 外掛。如果你的設定使用允許清單，請在
  `plugins.allow` 中加入 `codex`。
- Codex app-server `0.143.0` 或更新版本。外掛預設會管理相容的
  二進位檔，因此 `PATH` 中是否有 `codex` 命令不會影響正常
  啟動。
- 透過 `openclaw models auth login --provider openai` 進行 Codex 認證、代理程式的 Codex 主目錄中已存在 app-server 帳號，或明確指定的 Codex API 金鑰認證設定檔。

如需了解認證優先順序、環境隔離、自訂 app-server 命令、模型探索，以及完整的設定欄位清單，請參閱
[Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

安裝官方外掛，然後使用 Codex OAuth 登入：

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

啟用 `codex` 外掛並選取 OpenAI 代理程式模型：

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
      model: "openai/gpt-5.6-sol",
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

變更外掛設定後，請重新啟動閘道。如果聊天已有工作階段，請先執行 `/new` 或 `/reset`，讓下一個回合依目前設定解析執行框架。

## 與 Codex Desktop 和命令列介面共用執行緒

預設的 `appServer.homeScope: "agent"` 會將每個 OpenClaw 代理程式與操作者的原生 Codex 狀態隔離。若要讓擁有者檢查及管理 Codex Desktop 和 Codex 命令列介面所顯示的相同原生執行緒，請選擇使用使用者 Codex 主目錄：

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

使用者主目錄模式支援本機受管理的 stdio 程序或共用 Unix socket 傳輸。設定 `$CODEX_HOME` 時會使用該位置，否則使用 `~/.codex`，包括該主目錄中的原生 Codex 認證、設定、外掛和執行緒儲存區。OpenClaw 不會將 OpenClaw 認證設定檔注入此 app-server。

擁有者回合會取得 `codex_threads` 工具，可列出、搜尋、讀取、分支、重新命名、封存及還原原生執行緒。請分支執行緒以便在 OpenClaw 中接續；該分支會附加至目前的 OpenClaw 工作階段，並持續顯示於其他原生 Codex 用戶端。封存時必須明確確認該執行緒已在其他位置關閉。同時啟用監管時，逐字稿欄位和變更操作需要選擇啟用相應的 `supervision.allowRawTranscripts` 或 `supervision.allowWriteControls`。

請勿透過各自獨立管理的 stdio App Server 同時續接或寫入同一執行緒。Codex 只會協調同一個 App Server 內的即時寫入者，不會跨不同程序協調。對於一般的使用者主目錄 stdio 工作階段，建立分支是安全共存的方式。

僅設定 `appServer.homeScope: "user"` 不會啟用工作階段目錄。若要讓原生工作階段顯示於 OpenClaw 側邊欄，請使用 `supervision.enabled: true`。監管功能使用獨立的監管連線；若未明確指定 `appServer` 連線設定，該連線預設使用受管理的使用者主目錄 stdio，而一般執行框架仍維持代理程式範圍。兩條路徑都會採用明確指定的 `appServer` 設定。如上所示，當一般執行框架也應共用原生狀態時，請明確設定 `homeScope: "user"`。

## 監管 Codex 工作階段

同一個 `codex` 外掛可列出閘道電腦及已選擇啟用之配對節點上的未封存 Codex 工作階段。已儲存或閒置的閘道本機工作階段可以建立模型鎖定的聊天，鏡像其有界且已持久化的使用者與助理歷史記錄。其私有繫結會使用監管連線取得原生快照、標準分支和後續回合，而一般 Codex 工作階段則維持代理程式範圍。第一次啟動標準分支時，會完全採用 Codex 對快照分支傳回的模型和供應商。後續續接則由 Codex 的原生設定決定選擇；外層 OpenClaw 模型和備援鏈絕不會取代它。明確確認沒有其他執行者後，即可封存已儲存和閒置的資料列。作用中的來源無法建立分支或封存；現有的受監管聊天仍可開啟。配對節點工作階段仍僅提供中繼資料。

如需了解設定、分支規則、配對節點限制、中繼資料揭露和疑難排解，請參閱[監管 Codex 工作階段](/plugins/codex-supervision)。

## 設定

| 需求                                                | 設定                                                                                              | 位置                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 啟用執行框架                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 設定                    |
| 顯示未封存的 Codex 工作階段                    | `plugins.entries.codex.config.supervision.enabled: true`                                         | Codex 外掛設定                |
| 保留允許清單中的外掛安裝項目                  | 在 `plugins.allow` 中加入 `codex`                                                               | OpenClaw 設定                    |
| 允許符合資格的 OpenAI 回合隱式使用 Codex | 完全相符的官方 HTTPS Responses/ChatGPT 路由、沒有自行指定的請求覆寫、執行階段未設定／`auto` | OpenAI 供應商／模型設定       |
| 使用 ChatGPT/Codex OAuth 登入                    | `openclaw models auth login --provider openai`                                                   | 命令列介面認證設定檔                   |
| 為 Codex 執行新增 API 金鑰備援                   | 在 `auth.order.openai` 中，將 `openai:*` API 金鑰設定檔列於訂閱認證之後                 | 命令列介面認證設定檔 + OpenClaw 設定 |
| Codex 無法使用時採取封閉式失敗               | 供應商或模型 `agentRuntime.id: "codex"`                                                     | OpenClaw 模型／供應商設定     |
| 使用直接的 OpenAI API 流量                       | 供應商或模型 `agentRuntime.id: "openclaw"` 搭配一般 OpenAI 認證                          | OpenClaw 模型／供應商設定     |
| 調整 app-server 行為                            | `plugins.entries.codex.config.appServer.*`                                                       | Codex 外掛設定                |
| 啟用原生 Codex 外掛應用程式                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex 外掛設定                |
| 啟用 Codex Computer Use                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex 外掛設定                |

若要採用訂閱優先、API 金鑰備援的順序，建議使用 `auth.order.openai`。現有的舊版 Codex 認證設定檔 ID 和舊版 Codex 認證順序僅是由 doctor 處理的舊狀態；請勿寫入新的舊版 Codex GPT 參照。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

對於有效且與 Codex 相容的路由，上述兩個設定檔都會繼續作為同一次 Codex 執行的候選項目。設定檔順序選擇的是認證資訊，而非執行階段。變更認證順序不會讓自訂、Completions、HTTP 或經請求覆寫的路由變成與 Codex 相容。

### 壓縮

請勿在由 Codex 支援的代理程式上設定 `compaction.model` 或 `compaction.provider`。Codex 透過其原生 app-server 執行緒狀態進行壓縮，因此 OpenClaw 在執行階段會忽略這些本機摘要器覆寫，而代理程式使用 Codex 時，`openclaw doctor --fix` 會將其移除。

Lossless 仍可作為 Codex 回合周邊組裝、擷取和維護作業的上下文引擎，並透過 `plugins.slots.contextEngine: "lossless-claw"` 和 `plugins.entries.lossless-claw.config.summaryModel` 設定，而非透過 `agents.defaults.compaction.provider`。當 Codex 是作用中的執行階段時，`openclaw doctor --fix` 會將舊的 `compaction.provider: "lossless-claw"` 格式遷移至 Lossless 上下文引擎插槽，但壓縮仍由原生 Codex 負責。原生 app-server 執行框架支援需要提示前組裝的上下文引擎；包括 `codex-cli` 在內的一般命令列介面後端不提供該主機能力。

對於由 Codex 支援的代理程式，`/compact` 會在已繫結的執行緒上啟動原生 Codex app-server 壓縮。OpenClaw 不會等待完成、不會施加 OpenClaw 逾時、不會重新啟動共用 app-server，也不會退回使用上下文引擎或公開 OpenAI 摘要器。如果原生 Codex 執行緒繫結遺失或過期，該命令會採取封閉式失敗，而不會悄悄切換壓縮後端。

本頁其餘內容涵蓋部署形式、封閉式失敗路由、監護者核准原則、原生 Codex 外掛，以及 Computer Use。如需完整的選項清單、預設值、列舉、探索、環境隔離、逾時和 app-server 傳輸欄位，請參閱
[Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex 執行階段

在你預期使用 Codex 的聊天中使用 `/status`。由 Codex 支援的 OpenAI 代理程式回合會顯示：

```text
執行階段：OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線狀態、帳號、速率限制、MCP
伺服器與 Skills。`/codex models` 會列出適用於該執行框架與帳號的即時 Codex app-server
目錄。如果 `/status` 的結果出乎預期，請參閱
[疑難排解](#troubleshooting)。

## 路由與模型選擇

將供應商參照與執行階段原則分開：

- 使用 `openai/gpt-*` 選擇標準 OpenAI 模型。僅憑此前綴
  絕不會選取 Codex。
- 執行階段未設定或為 `auto` 時，只有未包含自行設定之請求覆寫的精確官方 HTTPS Platform Responses
  或 ChatGPT Responses 路由，才可能隱含選取 Codex。
- 請勿在設定中使用舊版 Codex GPT 參照；執行 `openclaw doctor --fix`
  以修復舊版參照與過時的工作階段路由固定設定。
- `agentRuntime.id: "codex"` 會讓 Codex 成為相容路由的
  封閉式失敗要求。它不會讓不相容的實際路由變得相容。
- `agentRuntime.id: "openclaw"` 會在確實有此需求時，讓供應商或模型選用內嵌的
  OpenClaw 執行階段。
- `/codex ...` 可從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部執行框架路徑。只有當使用者
  要求 ACP/acpx 或外部執行框架轉接器時才使用。

| 使用者意圖                                               | 使用方式                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前的聊天                                           | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 繼續現有的 Codex 對話串                                  | `/codex resume <thread-id>`                                                                           |
| 列出或篩選 Codex 對話串                                  | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 外掛                                      | `/codex plugins list`                                                                                 |
| 啟用或停用已設定的原生 Codex 外掛                        | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 以配對節點回合繼續已儲存的 Codex 命令列介面工作階段     | `/codex sessions --host <node> [filter]`，接著執行 `/codex resume <session-id> --host <node> --bind here` |
| 檢視跨電腦且未封存的 Codex 工作階段                      | 啟用 Codex 監督功能並開啟 **Codex 工作階段**                                                          |
| 變更已繫結對話串的模型、快速模式或權限                   | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| 停止或引導進行中的回合                                   | `/codex stop`, `/codex steer <text>`                                                                  |
| 解除目前的繫結                                           | `/codex detach`（別名為 `/codex unbind`）                                                             |
| 僅傳送 Codex 意見回饋                                    | `/codex diagnostics [note]`                                                                           |
| 啟動 ACP/acpx 工作                                       | ACP/acpx 工作階段命令，而非 `/codex`                                                                  |

| 使用案例                                      | 設定                                                                                                        | 驗證                                    | 備註                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| 使用原生 Codex 執行階段的合格 OpenAI 路由     | 未包含自行設定之請求覆寫的精確官方 HTTPS Responses/ChatGPT 路由，加上已啟用的 `codex` 外掛                  | `/status` 顯示 `Runtime: OpenAI Codex` | 執行階段未設定或為 `auto` 時的隱含路徑       |
| Codex 無法使用時採取封閉式失敗                | 供應商或模型的 `agentRuntime.id: "codex"`                                                                   | 回合失敗，而非回退至內嵌執行階段        | 用於僅限 Codex 的部署                         |
| 透過 OpenClaw 傳送直接使用 OpenAI API 金鑰的流量 | 供應商或模型的 `agentRuntime.id: "openclaw"`，以及一般 OpenAI 驗證                                          | `/status` 顯示 OpenClaw 執行階段       | 僅在確實要使用 OpenClaw 時採用                |
| 舊版設定                                      | 舊版 Codex GPT 參照                                                                                        | `openclaw doctor --fix` 會重寫該設定   | 請勿以此方式撰寫新設定                        |
| ACP/acpx Codex 轉接器                         | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP 工作／工作階段狀態                   | 與原生 Codex 執行框架分開                     |

`agents.defaults.imageModel` 遵循相同的前綴區分。一般 OpenAI 路由請使用 `openai/gpt-*`，
只有在影像理解應透過受限的 Codex app-server 回合執行時，才使用 `codex/gpt-*`。
Doctor 會將舊版 Codex GPT 參照重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

對於實際官方 HTTPS 路由符合隱含選取 Codex 資格的 OpenAI 模型，
請使用快速入門設定：

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### 混合供應商部署

保留 Claude 作為預設代理程式，並新增一個具名 Codex 代理程式：

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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

`main` 代理程式使用其一般供應商路徑。只要 `codex` 代理程式的實際 OpenAI 路由維持相容，
它就會使用 Codex app-server；如果這應是封閉式失敗要求，
請新增模型範圍的明確 `agentRuntime.id: "codex"`。

### 封閉式失敗 Codex 部署

當隨附外掛可用時，符合資格的精確官方 HTTPS OpenAI 路由可以解析為 Codex。
若要制定明確的封閉式失敗規則，請新增執行階段原則：

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
      model: "openai/gpt-5.6-sol",
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

強制使用 Codex 時，若實際路由未宣告與 Codex 相容、外掛已停用、app-server
版本過舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## App-server 原則

預設情況下，此外掛會透過 stdio 傳輸，在本機啟動由 OpenClaw 管理的 Codex
二進位檔。只有在刻意執行不同的可執行檔時，才設定 `appServer.command`。
只有當 app-server 已在其他位置執行時，才使用 WebSocket 傳輸：

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

本機 stdio app-server 工作階段預設採用受信任的本機操作員
模式：`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。如果本機 Codex 要求不允許這種
隱含 YOLO 模式，OpenClaw 會改為選取允許的守護者權限。
當工作階段啟用 OpenClaw 沙箱時，OpenClaw 會針對該回合
停用 Codex 原生 Code Mode、使用者 MCP 伺服器，以及由應用程式支援的外掛執行，
而不是依賴 Codex 主機端沙箱。若一般 exec/process 工具可用，
Shell 存取會改由 OpenClaw 沙箱支援的動態工具處理，例如
`sandbox_exec` 與 `sandbox_process`。

在跳脫沙箱或授予額外權限之前，使用正規化的 OpenClaw exec 模式，
讓 Codex 原生自動審查先行處理：

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

對 Codex app-server 工作階段而言，當本機要求允許這些值時，
`tools.exec.mode: "auto"` 會對應至經 Codex Guardian 審查的核准設定：
通常為 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，
以及 `sandbox: "workspace-write"`。在 `tools.exec.mode: "auto"` 中，
OpenClaw 不會保留舊版不安全的 Codex `approvalPolicy: "never"` 或
`sandbox: "danger-full-access"` 覆寫；若刻意採用不需核准的 Codex 模式，
請使用 `tools.exec.mode: "full"`。舊版
`plugins.entries.codex.config.appServer.mode: "guardian"` 預設集仍可使用，
但 `tools.exec.mode: "auto"` 是正規化的 OpenClaw 介面。

如需模式層級與主機 exec 核准及 ACPX 權限的比較，請參閱
[權限模式](/zh-TW/tools/permission-modes)。如需每個 app-server 欄位、驗證順序、
環境隔離及逾時行為的資訊，請參閱
[Codex 執行框架參考資料](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

`codex` 外掛會在任何支援 OpenClaw 文字命令的頻道上，
將 `/codex` 註冊為斜線命令。

原生執行與控制需要擁有者或 `operator.admin`
閘道用戶端：包括繫結或繼續對話串、傳送或停止回合、
變更模型、快速模式或權限狀態、壓縮或審查，以及
解除繫結。其他已授權的傳送者僅能使用唯讀的狀態、說明、
帳號、模型、對話串、MCP 伺服器、Skills 與繫結檢查命令。

常見形式：

- `/codex status` 會檢查 app-server 連線狀態、模型、帳號、速率
  限制、MCP 伺服器與 Skills。
- `/codex models` 會列出即時 Codex app-server 模型。
- `/codex threads [filter]` 會列出最近的 Codex app-server 對話串。
- `/codex resume <thread-id>` 會將目前的 OpenClaw 工作階段附加至
  現有 Codex 對話串。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  會附加目前的聊天。
- `/codex detach`（或 `/codex unbind`）會解除目前的繫結。
- `/codex binding` 會說明目前的繫結。
- `/codex stop` 會停止進行中的回合；`/codex steer <text>` 會引導該回合。
- `/codex model <model>`、`/codex fast [on|off|status]`，以及
  `/codex permissions [default|yolo|status]` 會變更每個對話的狀態。
- `/codex compact` 會要求 Codex app-server 壓縮已附加的對話串。
- `/codex review` 會對已附加的對話串啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會先詢問，再傳送已附加對話串的 Codex
  意見回饋。
- `/codex account` 會顯示帳號與速率限制狀態。
- `/codex mcp` 會列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 會列出 Codex app-server Skills。
- `/codex plugins list`、`/codex plugins enable <name>`，以及
  `/codex plugins disable <name>` 可管理已設定的原生 Codex 外掛。
- `/codex computer-use [status|install]` 可管理 Codex Computer Use。
- `/codex help` 會列出完整的命令樹。

對於大多數支援回報，請先在發生錯誤的對話中使用 `/diagnostics [note]`。它會建立一份閘道診斷報告；若是 Codex 控制框架工作階段，還會請求核准傳送相關的 Codex 意見回饋套件。關於隱私權模型與群組聊天行為，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。只有當你明確想針對目前附加的討論串上傳 Codex 意見回饋，而不包含完整的閘道診斷套件時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 討論串

檢查異常 Codex 執行的最快方式，通常是直接開啟原生 Codex 討論串：

```bash
codex resume <thread-id>
```

請從已完成的 `/diagnostics` 回覆、`/codex binding` 或 `/codex threads [filter]` 取得討論串 ID。

關於上傳機制與執行階段層級的診斷邊界，請參閱 [Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

### 驗證順序

在預設的個別代理程式家目錄中，驗證會依下列順序選取：

1. 代理程式的 OpenAI 驗證設定檔，按順序排列，最好設定於
   `auth.order.openai`。執行 `openclaw doctor --fix`，以遷移舊版的
   Codex 驗證設定檔 ID 與舊版 Codex 驗證順序。
2. 該代理程式 Codex 家目錄中應用程式伺服器的現有帳戶。
3. 僅限在本機透過 stdio 啟動應用程式伺服器：當沒有應用程式伺服器帳戶，且仍需要 OpenAI 驗證時，依序使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱形式的 Codex 驗證設定檔時，會從產生的 Codex 子程序中移除 `CODEX_API_KEY` 與 `OPENAI_API_KEY`。這可讓閘道層級的 API 金鑰繼續供嵌入或直接使用 OpenAI 模型，同時避免原生 Codex 應用程式伺服器的回合意外透過 API 計費。明確的 Codex API 金鑰設定檔與本機 stdio 環境金鑰備援，會使用應用程式伺服器登入，而非繼承的子程序環境。WebSocket 應用程式伺服器連線不會收到閘道環境的 API 金鑰備援；請使用明確的驗證設定檔，或遠端應用程式伺服器自己的帳戶。

如果訂閱設定檔達到 Codex 使用量限制，OpenClaw 會在 Codex 回報重設時間時記錄該時間，並針對同一次 Codex 執行嘗試下一個依序排列的驗證設定檔。重設時間過後，無須變更所選的 `openai/gpt-*` 模型或 Codex 執行階段，該訂閱設定檔便會再次符合使用資格。

設定原生 Codex 外掛後，OpenClaw 會先透過已連線的應用程式伺服器安裝或重新整理這些外掛，之後才將外掛擁有的應用程式公開給 Codex 討論串。`app/list` 仍是應用程式 ID、可存取性與中繼資料的真實資料來源，但 OpenClaw 負責決定每個討論串是否啟用：如果原則允許使用列出且可存取的應用程式，即使 `app/list` 目前回報該應用程式已停用，OpenClaw 仍會傳送 `thread/start.config.apps[appId].enabled = true`。此路徑不會為未知 ID 虛構應用程式安裝；OpenClaw 只會透過 `plugin/install` 啟用市集外掛，然後重新整理清單。

### 環境隔離

對於本機 stdio app-server 啟動，OpenClaw 會將 `CODEX_HOME` 設為
每個代理程式專屬的目錄，使 Codex 設定、驗證／帳號檔案、外掛快取／資料，
以及原生對話串狀態預設不會讀取或寫入操作者個人的
`~/.codex`。OpenClaw 會保留一般程序的 `HOME`；
由 Codex 執行的子程序仍可找到使用者家目錄中的設定與權杖，而
Codex 也可能探索共用的 `$HOME/.agents/skills` 和
`$HOME/.agents/plugins/marketplace.json` 項目。使用
`appServer.homeScope: "user"` 時，OpenClaw 會改用使用者的原生 Codex
家目錄及其現有帳號，而不注入 OpenClaw 驗證設定檔。

如果部署需要額外的環境隔離，請將這些
變數加入 `appServer.clearEnv`：

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

`appServer.clearEnv` 只會影響所產生的 Codex app-server 子
程序。OpenClaw 在本機啟動正規化期間，會從此清單移除 `CODEX_HOME`
和 `HOME`：`CODEX_HOME` 會持續指向所選的
代理程式或使用者範圍，而 `HOME` 會持續繼承，讓子程序可以使用
一般的使用者家目錄狀態。

### 動態工具與網頁搜尋

Codex 動態工具預設使用 `searchable` 載入方式。OpenClaw 不會
公開與 Codex 原生工作區操作重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、
`tool_call`、`tool_describe`、`tool_search` 和 `tool_search_code`。其餘大多數
OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、閘道和
`heartbeat_respond`，都可透過 `openclaw` 命名空間下的
Codex 工具搜尋使用，藉此縮小初始模型內容。

標記為 `catalogMode: "direct-only"` 的工具（包括 OpenClaw `computer`
工具）會改用 `openclaw_direct` 命名空間。Codex 會將該命名空間視為
`DirectModelOnly`，因此這些工具在一般及僅限程式碼模式的對話串中，會持續直接
顯示給模型，而不會跨越巢狀的程式碼模式 `tools.*` 呼叫。

啟用搜尋且未選取代管供應商時，網頁搜尋預設使用 Codex 的託管
`web_search` 工具。原生託管搜尋與 OpenClaw 的代管 `web_search`
動態工具互斥，因此代管搜尋無法規避原生網域限制。當託管搜尋
不可用、明確停用，或已由選取的代管供應商取代時，OpenClaw 會使用
代管工具。OpenClaw 會保持停用 Codex 的獨立
`web.run` 擴充功能，因為正式環境的 app-server 流量會拒絕
其使用者定義的 `web` 命名空間。`tools.web.search.enabled: false`
會停用這兩條路徑，停用工具的純 LLM 執行亦同。Codex 會將
`"cached"` 視為偏好設定，並在不受限制的 app-server 回合中將其解析為即時外部存取。
設定原生 `allowedDomains` 時，自動代管備援會採取封閉式失敗，
以免規避允許清單。持續生效的搜尋政策變更會在下一回合前輪替
已繫結的 Codex 對話串；每回合的暫時限制則會使用暫時的
受限對話串，並保留現有繫結供稍後恢復。

`sessions_yield` 和僅使用訊息工具的來源回覆會維持直接載入，因為
這些是回合控制合約。`sessions_spawn` 會維持可搜尋，讓
Codex 的原生 `spawn_agent` 繼續作為主要的 Codex 子代理程式介面，
同時仍可透過 `openclaw` 動態工具命名空間使用明確的 OpenClaw
或 ACP 委派。心跳偵測協作指示會要求 Codex 在結束心跳偵測回合前，
若尚未載入 `heartbeat_respond` 工具，先搜尋該工具。

只有在連線至無法搜尋延後載入動態工具的自訂 Codex app-server，
或偵錯完整工具承載內容時，才將 `codexDynamicToolsLoading: "direct"`
設為直接載入。

### 設定欄位

支援的頂層 Codex 外掛欄位：

| 欄位                       | 預設值         | 含義                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"`，將 OpenClaw 動態工具直接放入初始 Codex 工具內容。 |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。              |
| `codexPlugins`             | 已停用         | 對已遷移、從原始碼安裝的精選外掛提供原生 Codex 外掛／應用程式支援。           |
| `supervision`              | 已停用         | 未封存的原生工作階段目錄、本機分支接續，以及代理程式工具政策。   |

支援的 `appServer` 欄位：

| 欄位                                          | 預設值                                                 | 含義                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；明確指定 `"unix"` 會連線至本機控制通訊端；`"websocket"` 會連線至 `url`。                                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依各 OpenClaw 代理程式隔離一般的操作框架狀態。`"user"` 是明確選擇加入的設定，會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍支援本機 stdio 或 Unix 傳輸。對於獨立的監督連線，未設定的值在 stdio 或 Unix 下會解析為 `"user"`，在 WebSocket 下則解析為 `"agent"`。     |
| `command`                                     | 受管理的 Codex 二進位檔                                | stdio 傳輸使用的可執行檔。保持未設定即可使用受管理的二進位檔；僅在需要明確覆寫時設定。                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | 未設定                                                 | WebSocket App Server URL 或 `unix://` URL。明確指定空白的 Unix 路徑會選取標準的使用者家目錄控制通訊端。                                                                                                                                                                                                                                                                                         |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                  |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立繼承環境後，從已啟動的 stdio app-server 程序中移除的額外環境變數名稱。進行本機啟動時，OpenClaw 會保留所選的 `CODEX_HOME` 與繼承的 `HOME`。                                                                                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | 選擇加入 Codex 僅限程式碼模式的工具介面。一般 OpenClaw 動態工具仍可透過巢狀 `tools.*` 呼叫使用；`openclaw_direct` 工具則維持直接對模型可見。                                                                                                                                                                                                                                                     |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從解析出的 OpenClaw 工作區推斷本機工作區根目錄、在此遠端根目錄下保留目前的 cwd 後綴，且只將最終的 app-server cwd 傳送給 Codex。若 cwd 位於解析出的 OpenClaw 工作區根目錄之外，OpenClaw 會採取封閉式失敗，而不會將閘道本機路徑傳送至遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                           |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個回合後，或發出限定於該回合的 app-server 請求後，OpenClaw 等待 `turn/completed` 時的靜默時間窗。                                                                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度防護。對於可信任或繁重的工作負載，若工具後彙整可合理地比最終助理輸出時限保持更久的靜默，請使用此設定。                                |
| `mode`                                        | 除非本機 Codex 要求不允許 YOLO，否則為 `"yolo"`        | YOLO 或經守護者審查執行的預設集。若本機 stdio 要求未包含 `danger-full-access`、`never` 核准或 `user` 審查者，隱含預設值會改為守護者模式。                                                                                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` 或允許的守護者核准政策                       | 傳送至執行緒啟動、繼續或回合的原生 Codex 核准政策。允許時，守護者預設值優先採用 `"on-request"`。                                                                                                                                                                                                                                                                                               |
| `sandbox`                                     | `"danger-full-access"` 或允許的守護者沙箱              | 傳送至執行緒啟動或繼續的原生 Codex 沙箱模式。允許時，守護者預設值優先採用 `"workspace-write"`，否則採用 `"read-only"`。啟用 OpenClaw 沙箱時，`danger-full-access` 回合會使用 Codex `workspace-write`，其網路存取權則衍生自 OpenClaw 沙箱的輸出設定。                                                                                     |
| `approvalsReviewer`                           | `"user"` 或允許的守護者審查者                          | 允許時使用 `"auto_review"` 讓 Codex 審查原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                                                                               |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求彈性處理，`null` 會清除覆寫，而舊版 `"fast"` 會被接受並視為 `"priority"`。                                                                                                                                                                                                                                      |
| `networkProxy`                                | 已停用                                                 | 選擇加入 Codex 權限設定檔網路功能，以供 app-server 命令使用。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取該設定，而不傳送 `sandbox`。                                                                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選擇加入功能，會向支援的 Codex app-server 註冊由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行作業可在作用中的 OpenClaw 沙箱內執行。                                                                                                                                                                                                                                                   |

`appServer.networkProxy` 採明確設定，因為它會變更 Codex 沙箱
合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled`
和 `default_permissions`，讓產生的
權限設定檔能啟動 Codex 管理的網路功能。預設情況下，OpenClaw
會根據設定檔內容產生不易衝突的 `openclaw-network-<fingerprint>` 設定檔
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

如果一般的 app-server 執行階段會是 `danger-full-access`，啟用
`networkProxy` 後，產生的權限設定檔會使用工作區樣式的檔案系統存取：
Codex 管理的網路強制措施採用沙箱網路，因此完整存取設定檔無法保護對外流量。
網域項目使用 `allow` 或 `deny`；Unix 通訊端項目使用 Codex 的
`allow` 或 `none` 值。

### 動態工具呼叫逾時

OpenClaw 擁有的動態工具呼叫具有獨立於
`appServer.requestTimeoutMs` 的時間限制：Codex `item/tool/call` 要求預設使用
90 秒的 OpenClaw 看門狗。每次呼叫若提供正值的 `timeoutMs`
引數，會延長或縮短該工具呼叫的特定時間額度，上限為 600000 ms。
當工具呼叫未提供自己的逾時值時，`image_generate` 工具會使用
`agents.defaults.imageGenerationModel.timeoutMs`，否則使用 120 秒的
影像產生預設值。媒體理解 `image` 工具會使用
`tools.media.image.timeoutSeconds` 或其 60 秒的媒體預設值；對於
影像理解，該逾時適用於要求本身，不會因先前的準備工作而縮短。
逾時時，OpenClaw 會在支援的情況下中止工具訊號，並將失敗的動態工具回應傳回 Codex，
讓該輪可以繼續，而不會讓工作階段停留在 `processing`。
此看門狗是外層動態 `item/tool/call` 的時間額度；供應商特定的
要求逾時會在該呼叫內執行，並保留各自的逾時語意。

Codex 接受某一輪後，以及 OpenClaw 回應該輪範圍內的
app-server 要求後，測試框架會預期 Codex 推進目前這一輪，
並最終以 `turn/completed` 完成原生輪次。如果
app-server 在 `appServer.turnCompletionIdleTimeoutMs` 期間保持靜默，OpenClaw
會盡力中斷 Codex 輪次、記錄診斷逾時，並
釋放 OpenClaw 工作階段通道，使後續聊天訊息不會
排在過時的原生輪次後方。同一輪的大多數非終止通知會解除該短期看門狗，
因為 Codex 已證明該輪仍處於活動狀態。

工具交接會使用較長的工具後閒置時間額度：在 OpenClaw 傳回
`item/tool/call` 回應後、`commandExecution` 等原生工具項目
完成後、原始 `custom_tool_call_output` 完成後，以及工具後的原始助理進度、
原始推理完成或推理進度之後。若已設定，
防護機制會使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否則預設為五分鐘；在 Codex 發出下一個目前輪次事件前的
靜默統整期間，相同額度也會延長進度看門狗。
全域 app-server 通知（例如速率限制更新）不會重設輪次閒置進度。
推理完成、commentary `agentMessage` 完成，以及工具前的原始推理或
助理進度之後，可能會接續自動最終回覆，因此它們會使用
進度後回覆防護，而不是立即釋放工作階段通道。

只有最終／非 commentary 的已完成 `agentMessage` 項目，以及工具前的原始
助理完成，才會啟用助理輸出釋放：如果 Codex 隨後保持靜默且沒有
`turn/completed`，OpenClaw 會盡力中斷原生輪次並釋放工作階段通道。
如果另一個輪次監看機制在這場釋放競爭中勝出，只要沒有任何原生要求、
項目或動態工具完成仍處於活動狀態，且助理輸出釋放仍屬於最新完成的項目，
並且之後沒有其他項目完成，OpenClaw 仍會接受已完成的最終助理項目。
這能在已完成工具工作後保留最終答案，而不必重播該輪。
部分助理增量、過時的較早回覆，以及後續的空白完成均不符合資格。

可安全重播的 stdio app-server 失敗，包括沒有助理、工具、活動項目或
副作用證據的輪次完成閒置逾時，會在新的 app-server 嘗試中重試一次。
不安全的逾時仍會停用卡住的 app-server 用戶端並釋放 OpenClaw
工作階段通道；它們也會清除過時的原生執行緒繫結，而不會自動重播。
完成監看逾時會顯示 Codex 特定的逾時文字：可安全重播的情況會指出
回應可能不完整，而不安全的情況會要求使用者在重試前確認目前狀態。
公開的逾時診斷包含結構化欄位，例如最後一個 app-server
通知方法、原始助理回應項目 id/type/role、活動要求／項目數量，
以及已啟用的監看狀態；當最後一個通知是原始助理回應項目時，
還會包含有長度限制的助理文字預覽。這些診斷不會包含原始提示詞或工具內容。

### 本機測試環境覆寫

- 當未設定 `appServer.command` 時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在
一次性的本機測試中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於可重複的部署，
建議使用設定，因為這能將外掛行為與 Codex 測試框架的其他設定
保留在同一個經過審查的檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw 測試框架輪次相同的 Codex 執行緒中，
使用 Codex app-server 自己的應用程式與外掛功能。
OpenClaw 不會將 Codex 外掛轉換為合成的 `codex_plugin_*` OpenClaw 動態工具。

`codexPlugins` 僅影響選用原生 Codex 測試框架的工作階段。
它不會影響內建測試框架執行、一般 OpenAI 供應商執行、ACP
對話繫結或其他測試框架。

最小化的遷移設定：

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

OpenClaw 建立 Codex 測試框架工作階段或取代過時的 Codex 執行緒繫結時，
會計算執行緒應用程式設定；此設定不會在每一輪重新計算。
變更 `codexPlugins` 後，請使用 `/new`、`/reset` 或重新啟動
閘道，讓後續的 Codex 測試框架工作階段以更新後的應用程式集合啟動。

如需了解遷移資格、應用程式清單、破壞性動作政策、
資訊要求及原生外掛診斷，請參閱
[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的應用程式與外掛存取權限由已登入的 Codex
帳戶控制；對於 Business 與 Enterprise/Edu 工作區，則也受工作區應用程式
控制項管理。請參閱
[搭配你的 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)，
以了解 OpenAI 的帳戶與工作區控制項概覽。

## 電腦操作

電腦操作有專屬的設定指南：
[Codex 電腦操作](/zh-TW/plugins/codex-computer-use)。

簡而言之：OpenClaw 不會內建桌面控制應用程式，也不會自行執行
桌面操作。它會準備 Codex app-server、確認 `computer-use` MCP 伺服器
可用，然後在 Codex 模式的回合中，讓 Codex 負責原生 MCP 工具呼叫。

## 執行階段邊界

Codex 執行框架只會變更底層的嵌入式代理程式執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行
  這些工具，因此 OpenClaw 仍位於執行路徑中。
- Codex 原生的 shell、修補、MCP 與原生應用程式工具由 Codex 負責。
  OpenClaw 可以透過支援的轉送機制觀察或封鎖特定原生事件，
  但不會改寫原生工具的引數。
- Codex 負責原生壓縮。OpenClaw 會保留逐字記錄的鏡像，以供
  頻道歷史記錄、搜尋、`/new`、`/reset`，以及日後切換模型或執行框架
  使用，但不會以 OpenClaw 或上下文引擎的摘要器取代 Codex 壓縮。
- 媒體生成、媒體理解、TTS、核准與訊息工具輸出，
  仍會透過對應的 OpenClaw 供應商／模型設定處理。
- `tool_result_persist` 適用於 OpenClaw 所負責的逐字記錄工具結果，
  不適用於 Codex 原生工具結果記錄。

如需瞭解掛鉤層、支援的 V1 介面、原生權限處理、佇列導向、
Codex 意見回饋上傳機制與壓縮詳細資訊，請參閱
[Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般的 `/model` 供應商：**新設定中這是預期行為。
選取 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用內建執行框架而非 Codex：**確認實際生效的
路由是完全符合的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由、
沒有自行撰寫的請求覆寫，而且 Codex 外掛已安裝並啟用。
僅有 `openai/gpt-*` 前綴並不足夠。若測試時需要嚴格驗證，
請設定供應商或模型的 `agentRuntime.id: "codex"`；強制使用 Codex 時，
若路由或執行框架不相容，將直接失敗而不會回退。

**OpenAI Codex 執行階段回退至 API 金鑰路徑：**收集經遮蔽處理的
閘道摘錄，其中須顯示模型、執行階段、所選供應商與
失敗資訊。請受影響的協作者在其 OpenClaw 主機上執行以下唯讀命令：

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

有用的摘錄通常會包含 `openai/gpt-5.6-sol` 或 `openai/gpt-5.6-luna`、
`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、
`candidateProvider: "openai"`，以及 `401`、`Incorrect API key` 或
`No API key` 結果。修正後的執行應顯示 OpenAI OAuth 路徑，
而非單純的 OpenAI API 金鑰失敗。

**仍保留舊版 Codex 模型參照設定：**執行 `openclaw doctor --fix`。
Doctor 會將舊版模型參照改寫為 `openai/*`、移除過時的工作階段與
整個代理程式執行階段固定設定，並保留現有的驗證設定檔覆寫。

**app-server 遭到拒絕：**請使用 Codex app-server `0.143.0` 或更新版本。
相同版本的預發行版或帶有建置後綴的版本，例如
`0.143.0-alpha.2` 或 `0.143.0+custom`，都會遭到拒絕，因為 OpenClaw 會
檢查穩定版 `0.143.0` 通訊協定下限。

**`/codex status` 無法連線：**請檢查 `codex` 外掛
是否已啟用、設定允許清單時 `plugins.allow` 是否包含該外掛，
以及任何自訂的 `appServer.command`、`url`、`authToken` 或
標頭是否有效。

**模型探索速度緩慢：**請降低
`plugins.entries.codex.config.discovery.timeoutMs`，或停用探索。
請參閱 [Codex 執行框架參考資料](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：**請檢查 `appServer.url`、
`authToken`、標頭，以及遠端 app-server 是否使用相同版本的 Codex
app-server 通訊協定。

**原生 shell 或 patch 工具遭到封鎖，並顯示 `Native hook relay
unavailable`：**Codex 執行緒仍嘗試使用 OpenClaw 已不再註冊的原生 hook relay
id。這是原生 Codex hook 傳輸問題，並非 ACP 後端、提供者、GitHub 或 shell 命令
故障。請在受影響的聊天中使用 `/new` 或 `/reset` 啟動全新工作階段，
然後重試一個無害的命令。如果成功一次，但下一次原生工具
呼叫又失敗，請只將 `/new` 視為暫時的因應措施：重新啟動 Codex app-server 或
OpenClaw 閘道後，將提示複製到全新的工作階段，讓舊執行緒遭到捨棄並重新建立
原生 hook 註冊。

**非 Codex 模型使用內建 harness：**除非提供者
或模型執行階段政策將其路由至其他 harness，否則這是預期行為。一般的非 OpenAI
提供者參照在 `auto` 模式下會維持其正常的提供者路徑。

**Computer Use 已安裝，但工具無法執行：**請在全新的工作階段中檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請採用上述原生 hook relay 復原方式。
請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關內容

- [Codex harness 參考資料](/zh-TW/plugins/codex-harness-reference)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督機制](/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [模型提供者](/zh-TW/concepts/model-providers)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [OpenAI Codex 說明](https://help.openai.com/en/collections/14937394-codex)
- [代理程式 harness 外掛](/zh-TW/plugins/sdk-agent-harness)
- [外掛 hooks](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
