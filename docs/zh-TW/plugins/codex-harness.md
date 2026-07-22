---
read_when:
    - 你想要使用官方 Codex app-server 測試框架
    - 你需要 Codex 框架設定範例
    - 你希望僅使用 Codex 的部署在失敗時直接終止，而不是回退至 OpenClaw
summary: 透過官方 Codex app-server 測試框架執行 OpenClaw 內嵌代理程式回合
title: Codex 測試框架
x-i18n:
    generated_at: "2026-07-22T10:40:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ca6458a3c9d31d164ff065b4eb81799d556492c5eabb9c8c99bdb7666c9e6b6
    source_path: plugins/codex-harness.md
    workflow: 16
---

官方 `codex` 外掛透過 Codex app-server 執行內嵌的 OpenAI 代理程式回合，而非使用 OpenClaw 內建執行框架。Codex 負責低階代理程式工作階段：原生執行緒續接、原生工具續行、原生壓縮，以及 app-server 執行。OpenClaw 仍負責聊天頻道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、媒體傳送，以及可見的對話記錄鏡像。

請使用標準 OpenAI 模型參照，例如 `openai/gpt-5.6-sol`。請勿設定舊版 Codex GPT 參照；請將 OpenAI 代理程式認證順序放在 `auth.order.openai` 下。`openclaw doctor --fix` 會修復舊版 Codex 認證設定檔 ID 與舊版 Codex 認證順序項目。

當供應商／模型執行階段政策未設定或為 `auto` 時，僅有 `openai/*` 前綴絕不會選取此執行框架。只有當路由完全符合官方 HTTPS Platform Responses 或 ChatGPT Responses，且沒有自行設定的要求覆寫時，OpenAI 才可能隱含選取 Codex。請參閱
[OpenAI 隱含代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。
如果在 Platform 與 ChatGPT 路由確定之前，Codex 已負責認證，OpenClaw 仍要求每個候選路由宣告與 Codex 相容。僅由原生端負責認證，絕不會略過該路由檢查。

當沒有啟用 OpenClaw 沙箱時，OpenClaw 會在啟用 Codex 原生程式碼模式的情況下啟動 Codex app-server 執行緒（預設仍會停用僅限程式碼模式），因此原生工作區／程式碼能力可與透過 app-server `item/tool/call` 橋接器路由的 OpenClaw 動態工具並存。除非你選擇加入實驗性沙箱 exec-server 路徑，否則啟用中的 OpenClaw 沙箱或受限工具政策會完全停用原生程式碼模式。

使用預設的 `tools.exec.host: "auto"` 且沒有啟用 OpenClaw 沙箱時，Codex 也會收到 `node_exec` 與 `node_process` 工具，用於在已配對的節點上執行命令。原生 shell 仍位於 Codex app-server 主機與工作區（預設 stdio 部署時位於閘道本機）；`node_exec` 會依名稱或 ID 選取節點，並繼續套用 OpenClaw 的節點核准政策。如果有限的執行階段允許清單停用原生程式碼模式，導致該回合沒有執行環境，OpenClaw 會改為保留經政策篩選的 `exec` 與 `process` 工具，以便直接在未沙箱化的環境中執行。

這項 Codex 原生功能與
[OpenClaw 程式碼模式](/zh-TW/tools/code-mode)不同；後者是選擇啟用的 QuickJS-WASI 執行階段，用於一般 OpenClaw 執行，且具有不同的 `exec` 輸入格式。如需瞭解更廣泛的模型／供應商／執行階段分工，請先參閱
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)：`openai/gpt-5.6-sol` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他頻道則是通訊介面。

## 需求

- 已安裝官方 `@openclaw/codex` 外掛。如果你的設定使用允許清單，請在
  `plugins.allow` 中包含 `codex`。
- 使用 `0.143.0` 至 `0.144.6` 的穩定版 Codex app-server。外掛預設會管理相容的二進位檔，因此 `PATH` 上的 `codex` 命令不會影響正常啟動。
- 透過 `openclaw models auth login --provider openai`、代理程式 Codex 主目錄中已有的 app-server 帳戶，或明確的 Codex API 金鑰認證設定檔進行 Codex 認證。

如需認證優先順序、環境隔離、自訂 app-server 命令、模型探索，以及完整的設定欄位清單，請參閱
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

變更外掛設定後，請重新啟動閘道。如果聊天已有工作階段，請先執行 `/new` 或 `/reset`，讓下一回合從目前設定解析執行框架。

## 與 Codex Desktop 和命令列介面共用執行緒

預設的 `appServer.homeScope: "agent"` 會將每個 OpenClaw 代理程式與操作者的原生 Codex 狀態隔離。若要讓擁有者檢查及管理 Codex Desktop 與 Codex 命令列介面所顯示的相同原生執行緒，請選擇使用使用者 Codex 主目錄：

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

使用者主目錄模式支援本機受管理的 stdio 處理程序或共用 Unix socket 傳輸。設定 `$CODEX_HOME` 時會使用該項目，否則使用 `~/.codex`，包括該主目錄的原生 Codex 認證、設定、外掛與執行緒儲存區。OpenClaw 不會將 OpenClaw 認證設定檔注入此 app-server。

擁有者回合會取得 `codex_threads` 工具：列出、搜尋、讀取、分支、重新命名、封存及還原原生執行緒。請分支執行緒以在 OpenClaw 中繼續；分支會附加至目前的 OpenClaw 工作階段，並持續對其他原生 Codex 用戶端顯示。封存時必須明確確認該執行緒已在其他位置關閉。若同時啟用監督功能，對話記錄欄位與變更操作需要相符的 `supervision.allowRawTranscripts` 或 `supervision.allowWriteControls` 選擇啟用設定。

請勿透過彼此獨立的受管理 stdio App Server，同時續接或寫入相同執行緒。Codex 會協調單一 App Server 內的即時寫入者，但不會跨不同處理程序協調。對一般使用者主目錄 stdio 工作階段而言，分支是安全共存的方式。

僅設定 `appServer.homeScope: "user"` 無法控制叢集目錄。外掛啟用時，原生工作階段探索也會啟用；將 `sessionCatalog.enabled: false` 設為相應值，即可將其從 OpenClaw 側邊欄移除，而不會停用 Codex。目錄使用獨立的監督連線；若未明確設定 `appServer` 連線，該連線預設使用受管理的使用者主目錄 stdio，而一般執行框架仍維持代理程式範圍。兩條路徑都會採用明確的 `appServer` 設定。如上所示，若一般執行框架也應共用原生狀態，請明確設定 `homeScope: "user"`。

## 監督 Codex 工作階段

相同的 `codex` 外掛可列出閘道電腦與已選擇加入之配對節點上的未封存 Codex 工作階段。儲存或閒置的閘道本機工作階段可以建立鎖定模型的聊天，鏡像其受限範圍內已保存的使用者與助理記錄。其私有繫結使用監督連線取得原生快照、標準分支及後續回合，而一般 Codex 工作階段仍維持代理程式範圍。第一次啟動標準分支時，會完全採用 Codex 針對快照分支傳回的模型與供應商。後續續接會由 Codex 的原生設定決定選擇；外層 OpenClaw 模型與備援鏈絕不會取代它。明確確認沒有其他執行者後，即可封存已儲存與閒置的資料列。使用中的來源無法建立分支或封存；既有受監督聊天仍可開啟。配對節點工作階段仍僅提供中繼資料。

如需設定、分支規則、配對節點限制、中繼資料揭露與疑難排解，請參閱[監督 Codex 工作階段](/zh-TW/plugins/codex-supervision)。

## 設定

| 需求                                                | 設定                                                                                              | 位置                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 啟用執行框架                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 設定                    |
| 隱藏原生 Codex 工作階段探索                 | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Codex 外掛設定                |
| 保留允許清單中的外掛安裝                  | 在 `plugins.allow` 中包含 `codex`                                                               | OpenClaw 設定                    |
| 允許符合資格的 OpenAI 回合隱含使用 Codex | 完全符合官方 HTTPS Responses／ChatGPT 路由、無自行設定的要求覆寫，且執行階段未設定／為 `auto` | OpenAI 供應商／模型設定       |
| 使用 ChatGPT／Codex OAuth 登入                    | `openclaw models auth login --provider openai`                                                   | 命令列介面認證設定檔                   |
| 為 Codex 執行新增 API 金鑰備援                   | 在 `auth.order.openai` 中，將 `openai:*` API 金鑰設定檔列於訂閱認證之後                 | 命令列介面認證設定檔 + OpenClaw 設定 |
| Codex 無法使用時以封閉方式失敗               | 供應商或模型 `agentRuntime.id: "codex"`                                                     | OpenClaw 模型／供應商設定     |
| 使用直接 OpenAI API 流量                       | 供應商或模型 `agentRuntime.id: "openclaw"` 搭配一般 OpenAI 認證                          | OpenClaw 模型／供應商設定     |
| 調整 app-server 行為                            | `plugins.entries.codex.config.appServer.*`                                                       | Codex 外掛設定                |
| 啟用原生 Codex 外掛應用程式                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex 外掛設定                |
| 啟用 Codex 電腦操作                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex 外掛設定                |

訂閱優先、API 金鑰備援的順序請優先使用 `auth.order.openai`。既有的舊版 Codex 認證設定檔 ID 與舊版 Codex 認證順序僅屬於 doctor 處理的舊版狀態；請勿寫入新的舊版 Codex GPT 參照。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

對於有效且與 Codex 相容的路由，上述兩個設定檔都會繼續作為同一次 Codex 執行的候選項目。設定檔順序選擇的是認證資訊，而非執行階段。變更認證順序不會使自訂、Completions、HTTP 或由要求覆寫的路由變得與 Codex 相容。

### 壓縮

請勿在由 Codex 支援的代理程式上設定 `compaction.model` 或 `compaction.provider`。Codex 透過其原生 app-server 執行緒狀態進行壓縮，因此 OpenClaw 會在執行階段忽略這些本機摘要器覆寫，而當代理程式使用 Codex 時，`openclaw doctor --fix` 會移除它們。

Lossless 仍可作為 Codex 回合周邊組裝、擷取與維護所用的上下文引擎，請透過
`plugins.slots.contextEngine: "lossless-claw"` 與
`plugins.entries.lossless-claw.config.summaryModel` 設定，而不是透過
`agents.defaults.compaction.provider`。當 Codex 為啟用中的執行階段時，`openclaw doctor --fix` 會將舊的 `compaction.provider: "lossless-claw"` 格式遷移至 Lossless 上下文引擎欄位，但壓縮仍由原生 Codex 負責。原生 app-server 執行框架支援需要在提示前組裝內容的上下文引擎；包括 `codex-cli` 在內的一般命令列介面後端不提供該主機能力。

對於由 Codex 支援的代理程式，`/compact` 會在已繫結的執行緒上啟動原生 Codex app-server 壓縮。OpenClaw 不會等待完成、不會施加 OpenClaw 逾時、不會重新啟動共用 app-server，也不會備援至上下文引擎或公開 OpenAI 摘要器。如果原生 Codex 執行緒繫結遺失或過期，該命令會以封閉方式失敗，而不會在未告知的情況下切換壓縮後端。

本頁其餘內容涵蓋部署形式、失敗時關閉的路由、Guardian
核准政策、原生 Codex 外掛，以及電腦操作。如需完整的選項
清單、預設值、列舉、探索、環境隔離、逾時，以及
app-server 傳輸欄位，請參閱
[Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex 執行階段

在預期使用 Codex 的聊天中使用 `/status`。由 Codex 支援的 OpenAI
代理程次會顯示：

```text
執行階段：OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線能力、帳戶、速率限制、MCP
伺服器及 Skills。`/codex models` 會列出控制框架與帳戶的即時 Codex app-server 目錄。
如果 `/status` 的結果出乎預期，請參閱
[疑難排解](#troubleshooting)。

## 路由與模型選擇

請將供應商參照與執行階段政策分開：

- 使用 `openai/gpt-*` 進行標準 OpenAI 模型選擇。僅有前綴
  絕不會選取 Codex。
- 當執行階段未設定或為 `auto` 時，只有完全相符的官方 HTTPS Platform Responses
  或 ChatGPT Responses 路由，且沒有自行撰寫的要求覆寫，才能隱式選取 Codex。
- 請勿在設定中使用舊版 Codex GPT 參照；請執行 `openclaw doctor --fix`
  以修復舊版參照及過時的工作階段路由固定設定。
- `agentRuntime.id: "codex"` 會讓 Codex 成為相容路由的
  失敗時關閉要求。它不會讓不相容的有效路由變得相容。
- `agentRuntime.id: "openclaw"` 會在刻意如此設定時，讓供應商或模型選擇使用內嵌的
  OpenClaw 執行階段。
- `/codex ...` 可從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部控制框架路徑。只有在使用者
  要求 ACP/acpx 或外部控制框架介面卡時才使用。

| 使用者意圖                                               | 使用                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前聊天                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 繼續現有的 Codex 執行緒                            | `/codex resume <thread-id>`                                                                           |
| 列出或篩選 Codex 執行緒                               | `/codex threads [filter]`                                                                             |
| 讀取或更新已繫結執行緒的原生目標              | `/codex goal [status\|set <objective>\|pause\|resume\|block\|complete\|clear]`                        |
| 列出原生 Codex 外掛                                  | `/codex plugins list`                                                                                 |
| 啟用或停用已設定的原生 Codex 外掛         | `/codex plugins enable <name>`、`/codex plugins disable <name>`                                       |
| 將已儲存的 Codex 命令列介面工作階段繼續為配對節點程次    | `/codex sessions --host <node> [filter]`，接著使用 `/codex resume <session-id> --host <node> --bind here` |
| 檢視各電腦上尚未封存的 Codex 工作階段          | 啟用 Codex 監督並開啟 **Codex 工作階段**                                                  |
| 變更已繫結執行緒的模型、快速模式或權限 | `/codex model <model>`、`/codex fast [on\|off\|status]`、`/codex permissions [default\|yolo\|status]` |
| 停止或引導進行中的程次                              | `/codex stop`、`/codex steer <text>`                                                                  |
| 解除目前的繫結                                 | `/codex detach`（別名 `/codex unbind`）                                                               |
| 僅傳送 Codex 意見回饋                                   | `/codex diagnostics [note]`                                                                           |
| 啟動 ACP/acpx 任務                                     | ACP/acpx 工作階段命令，而非 `/codex`                                                               |

| 使用案例                                        | 設定                                                                                                   | 驗證                                  | 備註                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| 具備原生 Codex 執行階段資格的 OpenAI 路由 | 完全相符的官方 HTTPS Responses/ChatGPT 路由，沒有自行撰寫的要求覆寫，並啟用 `codex` 外掛 | `/status` 顯示 `Runtime: OpenAI Codex` | 執行階段未設定或為 `auto` 時的隱式路徑 |
| Codex 無法使用時失敗並關閉             | 供應商或模型 `agentRuntime.id: "codex"`                                                                | 程次失敗，而非回退至內嵌執行階段 | 用於僅限 Codex 的部署             |
| 透過 OpenClaw 直接傳送 OpenAI API 金鑰流量  | 供應商或模型 `agentRuntime.id: "openclaw"` 及一般 OpenAI 驗證                                      | `/status` 顯示 OpenClaw 執行階段        | 僅在刻意使用 OpenClaw 時使用      |
| 舊版設定                                   | 舊版 Codex GPT 參照                                                                                       | `openclaw doctor --fix` 會重寫它     | 請勿以此方式撰寫新設定           |
| ACP/acpx Codex 介面卡                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP 任務／工作階段狀態                 | 與原生 Codex 控制框架分開         |

`agents.defaults.imageModel` 採用相同的前綴分流。一般 OpenAI 路由請使用 `openai/gpt-*`，
只有在影像理解應透過有界限的 Codex app-server 程次執行時，才使用 `codex/gpt-*`。
Doctor 會將舊版 Codex GPT 參照重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

針對有效官方 HTTPS 路由符合隱式選取 Codex 資格的 OpenAI 模型，
使用快速入門設定：

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

將 Claude 保留為預設代理，並新增具名 Codex 代理：

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

`main` 代理使用其一般供應商路徑。當 `codex` 代理的有效 OpenAI
路由維持相容時，會使用 Codex app-server；若這應為失敗時關閉的
要求，請新增明確的模型範圍 `agentRuntime.id: "codex"`。

### 失敗時關閉的 Codex 部署

當隨附外掛可用時，符合資格且完全相符的官方 HTTPS OpenAI 路由可以解析至 Codex。
若要制定明確的失敗時關閉規則，請新增明確的執行階段政策：

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

強制使用 Codex 時，如果有效路由未宣告為與 Codex 相容、外掛已停用、
app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## App-server 政策

依預設，此外掛會在本機使用 stdio 傳輸啟動由 OpenClaw 管理的 Codex 二進位檔。
只有在刻意執行不同的可執行檔時，才設定 `appServer.command`。
Codex 將 WebSocket 傳輸分類為實驗性且不受支援；僅限於針對已在其他位置執行的
app-server 進行非正式環境測試時使用：

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
安全態勢：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 及
`sandbox: "danger-full-access"`。如果本機 Codex 要求不允許此
隱式 YOLO 安全態勢，OpenClaw 會改為選取允許的 Guardian 權限。
當工作階段啟用 OpenClaw 沙箱時，OpenClaw 會針對該程次
停用 Codex 原生 Code Mode、使用者 MCP 伺服器，以及應用程式支援的外掛執行，
而非依賴 Codex 主機端沙箱。Shell 存取則改為透過由 OpenClaw 沙箱支援的動態工具，
例如在一般 exec/process 工具可用時使用 `sandbox_exec` 和 `sandbox_process`。

在沙箱逸出或額外權限之前，使用標準化 OpenClaw exec 模式
進行 Codex 原生自動審查：

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

對於 Codex app-server 工作階段，`tools.exec.mode: "auto"` 會對應至經 Codex
Guardian 審查的核准：當本機要求允許這些值時，通常為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 及 `sandbox: "workspace-write"`。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不會保留舊版且不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；
若刻意採用不需核准的 Codex 安全態勢，請使用 `tools.exec.mode: "full"`。
舊版 `plugins.entries.codex.config.appServer.mode: "guardian"` 預設組合仍可運作，
但 `tools.exec.mode: "auto"` 才是標準化的 OpenClaw 介面。

如需與主機 exec 核准及 ACPX 權限進行模式層級的比較，
請參閱[權限模式](/zh-TW/tools/permission-modes)。如需每個 app-server
欄位、驗證順序、環境隔離及逾時行為的資訊，
請參閱 [Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

`codex` 外掛會在任何支援 OpenClaw 文字命令的頻道上，
將 `/codex` 註冊為斜線命令。

原生執行與控制需要擁有者或 `operator.admin` 閘道用戶端：
繫結或繼續執行緒、傳送或停止程次、變更模型、快速模式或權限狀態、
壓縮或審查，以及解除繫結。其他已授權的傳送者只能使用唯讀的狀態、
說明、帳戶、模型、執行緒、原生目標、MCP 伺服器、Skill 及繫結檢查命令。

常見形式：

- `/codex status` 檢查 app-server 連線能力、模型、帳號、速率
  限制、MCP 伺服器及 Skills。
- `/codex models` 列出即時 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex app-server 執行緒。
- `/codex goal` 讀取或更新所附加執行緒的原生 Codex 目標。Codex 自動接續目標功能仍停用；OpenClaw 尚不負責自主執行後續回合。
- `/codex resume <thread-id>` 將目前的 OpenClaw 工作階段附加至
  現有的 Codex 執行緒。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  附加目前的聊天。
- `/codex detach`（或 `/codex unbind`）解除目前的繫結。
- `/codex binding` 說明目前的繫結。
- `/codex stop` 停止進行中的回合；`/codex steer <text>` 引導該回合。
- `/codex model <model>`、`/codex fast [on|off|status]` 和
  `/codex permissions [default|yolo|status]` 變更各對話的狀態。
- `/codex compact` 要求 Codex app-server 壓縮所附加的執行緒。
- `/codex review` 為所附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 在傳送所附加執行緒的 Codex 意見回饋前
  詢問。
- `/codex account` 顯示帳號與速率限制狀態。
- `/codex mcp` 列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 列出 Codex app-server Skills。
- `/codex plugins list`、`/codex plugins enable <name>` 和
  `/codex plugins disable <name>` 管理已設定的原生 Codex 外掛。
- `/codex computer-use [status|install]` 管理 Codex 電腦操作功能。
- `/codex help` 列出完整的命令樹狀結構。

針對大多數支援報告，請先在發生錯誤的對話中使用 `/diagnostics [note]`。
這會建立一份閘道診斷報告，若是 Codex 控制框架工作階段，
還會請求核准傳送相關的 Codex 意見回饋套件。隱私權模型與群組
聊天行為請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。只有當你明確
想要上傳目前附加執行緒的 Codex 意見回饋，而不需要完整的
閘道診斷套件時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 執行緒

檢查有問題的 Codex 執行時，最快的方法通常是直接開啟原生
Codex 執行緒：

```bash
codex resume <thread-id>
```

可從已完成的 `/diagnostics` 回覆、`/codex binding`
或 `/codex threads [filter]` 取得執行緒 ID。

關於上傳機制與執行階段層級的診斷界線，請參閱
[Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

### 驗證順序

在預設的個別代理程式家目錄中，會依下列順序選取驗證方式：

1. 代理程式的 OpenAI 驗證設定檔順序，最好位於
   `auth.order.openai` 下。執行 `openclaw doctor --fix`，以遷移較舊的舊版
   Codex 驗證設定檔 ID 與舊版 Codex 驗證順序。
2. 該代理程式 Codex 家目錄中 app-server 的現有帳號。
3. 僅限本機 stdio app-server 啟動：當沒有 app-server 帳號且仍
   需要 OpenAI 驗證時，依序使用 `CODEX_API_KEY`，然後
   `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱型 Codex 驗證設定檔時，
會從啟動的 Codex 子處理程序移除 `CODEX_API_KEY` 和
`OPENAI_API_KEY`。如此可讓閘道層級的 API 金鑰繼續供嵌入或
直接 OpenAI 模型使用，同時避免原生 Codex app-server 回合意外
透過 API 計費。明確的 Codex API 金鑰設定檔與本機 stdio
環境金鑰後援會使用 app-server 登入，而不是繼承的子處理程序
環境。WebSocket app-server 連線不會收到閘道環境的 API 金鑰
後援；請使用明確的驗證設定檔或遠端 app-server 本身的帳號。

如果訂閱設定檔達到 Codex 使用量限制，OpenClaw 會在 Codex 回報
重設時間時記錄該時間，並針對同一次 Codex 執行嘗試下一個依序排列的
驗證設定檔。重設時間過後，該訂閱設定檔會再次符合使用資格，而無須
變更所選的 `openai/gpt-*` 模型或 Codex 執行階段。

設定原生 Codex 外掛時，OpenClaw 會先透過連線的 app-server
安裝或重新整理這些外掛，再向 Codex 執行緒公開由外掛擁有的
應用程式。`app/list` 仍是應用程式 ID、可存取性與中繼資料的
唯一真實來源，但每個執行緒的啟用決策由 OpenClaw 負責：若原則允許
列出的可存取應用程式，即使 `app/list`
目前回報該應用程式已停用，OpenClaw 仍會傳送 `thread/start.config.apps[appId].enabled = true`。
此路徑不會為未知 ID 虛構應用程式安裝；OpenClaw 只會啟用含有
`plugin/install` 的市集外掛，然後重新整理清單。

### 環境隔離

針對本機 stdio app-server 啟動，OpenClaw 會將 `CODEX_HOME`
設為個別代理程式專用目錄，因此 Codex 設定、驗證／帳號檔案、外掛快取／資料
及原生執行緒狀態預設不會讀寫操作者個人的 `~/.codex`。
OpenClaw 會保留一般處理程序的 `HOME`；Codex 執行的
子處理程序仍可找到使用者家目錄中的設定與權杖，且 Codex 可能會探索共用的
`$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 項目。使用
`appServer.homeScope: "user"` 時，OpenClaw 會改用原生使用者 Codex
家目錄及其現有帳號，而不注入 OpenClaw 驗證設定檔。

如果部署需要額外的環境隔離，請將這些變數新增至
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

`appServer.clearEnv` 只會影響啟動的 Codex app-server
子處理程序。OpenClaw 會在本機啟動正規化期間，從此清單移除
`CODEX_HOME` 和 `HOME`：`CODEX_HOME` 會繼續指向所選的
代理程式或使用者範圍，而 `HOME` 會繼續繼承，讓子處理程序可使用
一般的使用者家目錄狀態。

### 動態工具與網頁搜尋

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 通常不會
公開與 Codex 原生工作區操作重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、
`get_goal`、`create_goal`、`update_goal`、`tool_call`、`tool_describe`、
`tool_search` 和 `tool_search_code`。目標操作維持由 Codex 原生處理，
因此 OpenClaw 不會將第二個目標儲存區投射至 Codex 回合中。其餘大部分
OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、閘道和
`heartbeat_respond`，都可透過 `openclaw` 命名空間下的
Codex 工具搜尋使用，讓初始模型上下文更小。當有限允許清單停用原生程式碼模式時，
受限回合的 shell 後援是 `exec` 和 `process` 的例外；
執行階段允許清單及 `codexDynamicToolsExclude` 仍然適用。

標記為 `catalogMode: "direct-only"` 的工具，包括 OpenClaw `computer`
工具，會改用 `openclaw_direct` 命名空間。Codex 將該命名空間視為
`DirectModelOnly`，因此這些工具在一般及僅限程式碼模式的執行緒中仍直接
對模型可見，而不會經過巢狀程式碼模式的 `tools.*` 呼叫。

啟用搜尋且未選取代管供應商時，網頁搜尋預設使用 Codex 的託管
`web_search` 工具。原生託管搜尋與 OpenClaw 代管的
`web_search` 動態工具互斥，因此代管搜尋無法略過原生網域限制。
當託管搜尋不可用、遭明確停用，或由所選代管供應商取代時，OpenClaw
會使用代管工具。OpenClaw 會讓 Codex 的獨立
`web.run` 擴充功能保持停用，因為正式環境 app-server 流量會拒絕
其使用者定義的 `web` 命名空間。`tools.web.search.enabled: false`
會停用這兩條路徑，停用工具的純 LLM 執行亦然。Codex 將
`"cached"` 視為偏好設定，並為不受限制的 app-server 回合將其解析為
即時外部存取。設定原生 `allowedDomains` 時，自動代管後援會以關閉方式失敗，
因此無法略過允許清單。持續性的有效搜尋原則變更會在下一回合前輪替已繫結的
Codex 執行緒；暫時的個別回合限制會使用臨時的受限執行緒，並保留現有繫結
以供日後繼續。

`sessions_yield` 與僅訊息工具的來源回覆會維持直接傳送，因為
這些屬於回合控制合約。`sessions_spawn` 會維持可搜尋，讓
Codex 的原生 `spawn_agent` 繼續作為主要 Codex 子代理程式介面，
而明確的 OpenClaw 或 ACP 委派仍可透過
`openclaw` 動態工具命名空間使用。當工具尚未載入時，心跳偵測協作指示
會要求 Codex 在結束心跳偵測回合前搜尋 `heartbeat_respond`。

只有在連線至無法搜尋延後載入之動態工具的自訂
Codex app-server，或偵錯完整工具承載資料時，才設定 `codexDynamicToolsLoading: "direct"`。

### 設定欄位

支援的頂層 Codex 外掛欄位：

| 欄位                      | 預設值        | 意義                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具上下文。 |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。              |
| `codexPlugins`             | 已停用       | 對已遷移、從原始碼安裝之精選外掛的原生 Codex 外掛／應用程式支援。           |
| `sessionCatalog`           | 已啟用        | 探索此閘道及符合資格之已配對節點上的原生 Codex 工作階段，並顯示於側邊欄。   |
| `supervision`              | 已停用       | 面向代理程式的原生工作階段文字記錄與寫入控制原則。                         |

支援的 `appServer` 欄位：

| 欄位                                         | 預設值                                                | 含義                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；明確指定 `"unix"` 會連線至本機控制通訊端；`"websocket"` 會連線至 `url`。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依 OpenClaw 代理隔離一般測試框架狀態。`"user"` 是明確的選擇加入設定，會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍支援本機標準輸入輸出或 Unix 傳輸。對於獨立的監督連線，未設定的值在標準輸入輸出或 Unix 下會解析為 `"user"`，在 WebSocket 下則會解析為 `"agent"`。     |
| `command`                                     | 受管理的 Codex 二進位檔                                   | 標準輸入輸出傳輸使用的可執行檔。保持未設定即可使用受管理的二進位檔；僅在明確覆寫時設定。                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | 標準輸入輸出傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket App Server URL 或 `unix://` URL。明確指定空白的 Unix 路徑會選取標準的使用者家目錄控制通訊端。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                  | WebSocket 傳輸的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立繼承的環境後，從已啟動的標準輸入輸出 App Server 處理程序中移除的額外環境變數名稱。對於本機啟動，OpenClaw 會保留所選的 `CODEX_HOME` 與繼承的 `HOME`。                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | 選擇加入 Codex 僅限程式碼模式的工具介面。一般的 OpenClaw 動態工具仍可透過巢狀 `tools.*` 呼叫使用；`openclaw_direct` 工具仍會直接對模型顯示。                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | 遠端 Codex App Server 工作區根目錄。設定後，OpenClaw 會從已解析的 OpenClaw 工作區推斷本機工作區根目錄、在此遠端根目錄下保留目前的 cwd 後綴，並只將最終的 App Server cwd 傳送給 Codex。如果 cwd 位於已解析的 OpenClaw 工作區根目錄之外，OpenClaw 會採取封閉式失敗，而不會將閘道本機路徑傳送至遠端 App Server。 |
| `requestTimeoutMs`                            | `60000`                                                | App Server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一輪互動後，或發出該輪互動範圍的 App Server 要求後，OpenClaw 等待 `turn/completed` 時使用的靜默時間窗。                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | 最終／非評論的助理項目或工具前的原始助理完成訊號啟動助理輸出釋放後，OpenClaw 仍在等待 `turn/completed` 時使用的靜默時間窗。提高此值可讓 Codex 有更多時間發出 `turn/completed`，之後 OpenClaw 才會中斷並釋放工作階段通道。                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | 工具交接、原生工具完成、工具後原始助理進度、原始推理完成或推理進度之後，OpenClaw 等待 `turn/completed` 時使用的完成閒置與進度防護。適用於受信任或繁重的工作負載；此類負載的工具後統整可能合理地維持靜默，時間超過最終助理釋放預算。                                |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO | YOLO 或經守護者審查之執行的預設組態。若本機標準輸入輸出要求省略 `danger-full-access`、`never` 核准或 `user` 審查者，隱含的預設值便為守護者。                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` 或允許的守護者核准政策       | 傳送至執行緒啟動／繼續／互動輪次的原生 Codex 核准政策。守護者預設值會在允許時優先採用 `"on-request"`。                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的守護者沙箱  | 傳送至執行緒啟動／繼續的原生 Codex 沙箱模式。守護者預設值會在允許時優先採用 `"workspace-write"`，否則採用 `"read-only"`。當 OpenClaw 沙箱啟用時，`danger-full-access` 互動輪次會使用 Codex `workspace-write`，其網路存取權限衍生自 OpenClaw 沙箱的輸出設定。                                                                                     |
| `approvalsReviewer`                           | `"user"` 或允許的守護者審查者               | 使用 `"auto_review"` 可讓 Codex 在允許時審查原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未設定                                                  | 選用的 Codex App Server 服務層級。`"priority"` 會啟用快速模式路由、`"flex"` 會要求彈性處理、`null` 會清除覆寫設定，而舊版 `"fast"` 會被接受並視為 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                               | 選擇加入 Codex 權限設定檔的 App Server 命令網路功能。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並以 `default_permissions` 選取該設定，而不是傳送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選擇加入設定，會在支援的 Codex App Server 中註冊由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行可在目前啟用的 OpenClaw 沙箱內運作。                                                                                                                                                                                                            |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙箱合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設置 `features.network_proxy.enabled`
和 `default_permissions`，讓產生的權限設定檔可以啟動 Codex 受管理的網路功能。依預設，OpenClaw
會根據設定檔內容產生抗碰撞的 `openclaw-network-<fingerprint>` 設定檔
名稱；只有在需要穩定的本機名稱時，才使用 `profileName`。

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

如果一般的應用程式伺服器執行階段原本會是 `danger-full-access`，啟用
`networkProxy` 後，產生的權限設定檔會使用工作區形式的檔案系統存取：
Codex 受管理的網路強制執行屬於沙箱化網路，因此完整存取設定檔無法保護對外流量。
網域項目使用 `allow` 或 `deny`；Unix 通訊端項目使用 Codex 的
`allow` 或 `none` 值。

### 動態工具呼叫逾時

OpenClaw 所擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制：Codex `item/tool/call` 要求依預設使用 90
秒的 OpenClaw 看門狗。每次呼叫若提供正值的 `timeoutMs`
引數，便可延長或縮短該次特定工具的時間預算，上限為 600000 ms。
當工具呼叫未自行提供逾時值時，`image_generate` 工具會使用 `agents.defaults.mediaModels.image.timeoutMs`；
否則會使用 120 秒的影像產生預設值。媒體理解 `image` 工具
會使用所選具影像處理能力的 `tools.media.models[]` 項目之 `timeoutSeconds`，或其 60 秒媒體預設值；對於
影像理解，該逾時值適用於要求本身，不會因先前的準備工作而縮短。逾時時，OpenClaw 會在支援的情況下中止工具
訊號，並向 Codex 傳回失敗的動態工具回應，讓該輪可以繼續，而不會使工作階段停留在 `processing`。
此看門狗是外層動態 `item/tool/call` 預算；各提供者特定的
要求逾時會在該呼叫內執行，並保留各自的逾時語意。

Codex 接受一輪後，以及 OpenClaw 回應該輪範圍內的
應用程式伺服器要求後，控制程式預期 Codex 會在目前這一輪持續推進，
並最終以 `turn/completed` 完成原生輪次。如果
應用程式伺服器沉默達 `appServer.turnCompletionIdleTimeoutMs`，OpenClaw
會盡力中斷 Codex 輪次、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，
使後續聊天訊息不會排在過期的原生輪次之後。同一輪的大多數非終止通知
都會解除這個短期看門狗，因為 Codex 已證明該輪仍然存活。

工具移交會使用較長的工具執行後閒置預算：在 OpenClaw 傳回
`item/tool/call` 回應後、在 `commandExecution` 等原生工具項目
完成後、在原始 `custom_tool_call_output` 完成後，以及在工具執行後的原始助理進度、
原始推理完成或推理進度之後。若已設定，防護機制會使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則預設為五分鐘；同一預算也會延長
Codex 發出下一個目前輪次事件前，靜默合成期間的進度看門狗。
應用程式伺服器的全域通知（例如速率限制更新）不會重設輪次閒置進度。
推理完成、評註 `agentMessage` 完成，以及工具執行前的原始推理或
助理進度之後，可能會接著自動產生最終回覆，因此它們會使用
進度後回覆防護，而不是立即釋放工作階段通道。

只有最終／非評註且已完成的 `agentMessage` 項目，以及工具執行前的原始
助理完成，才會啟用助理輸出釋放：如果 Codex 隨後保持沉默而未出現
`turn/completed`，OpenClaw 會盡力中斷原生輪次並釋放工作階段通道。
如果另一個輪次監看機制贏得該釋放競爭，只要沒有原生要求、項目或動態工具完成仍在執行中，
且助理輸出釋放仍屬於最近完成的項目，並且之後沒有其他項目完成，OpenClaw
仍會接受已完成的最終助理項目。這可在已完成工具工作後保留最終答案，而無須重播該輪。
部分助理增量、過期的較早回覆，以及後續的空白完成均不符合資格。

可安全重播的 stdio 應用程式伺服器失敗，包括在沒有助理、工具、作用中項目或副作用證據時發生的輪次完成閒置
逾時，會在全新的應用程式伺服器嘗試中重試一次。不安全的逾時仍會停用卡住的應用程式伺服器用戶端，
並釋放 OpenClaw 工作階段通道；它們也會清除過期的原生執行緒繫結，而不會自動重播。
完成監看逾時會顯示 Codex 特定的逾時文字：可安全重播的情況會指出回應可能不完整，
不安全的情況則會要求使用者在重試前確認目前狀態。公開的逾時診斷包含結構化欄位，
例如最後一個應用程式伺服器通知方法、原始助理回應項目的 ID／類型／角色、
作用中要求／項目數量，以及已啟用的監看狀態；當最後一個通知是原始助理回應項目時，
還會包含長度受限的助理文字預覽。這些診斷不會包含原始提示或工具內容。

### 本機測試環境覆寫

- `OPENCLAW_CODEX_APP_SERVER_BIN` 會在
  `appServer.command` 未設定時略過受管理的二進位檔。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在單次本機測試時使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。可重複部署時建議使用設定，
因為這會讓外掛行為與 Codex 控制程式的其餘設定保存在同一個經審查的檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw 控制程式輪次相同的 Codex 執行緒中，
使用 Codex 應用程式伺服器本身的應用程式與外掛功能。OpenClaw
不會將 Codex 外掛轉換為合成的 `codex_plugin_*` OpenClaw
動態工具。

`codexPlugins` 只會影響選用原生 Codex 控制程式的工作階段。
它不會影響內建控制程式執行、一般 OpenAI 提供者執行、ACP
對話繫結或其他控制程式。

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

當 OpenClaw 建立 Codex 控制程式工作階段或取代過期的 Codex 執行緒繫結時，
會計算執行緒應用程式設定；不會在每一輪重新計算。變更 `codexPlugins` 後，
請使用 `/new`、`/reset`，或重新啟動
閘道，讓未來的 Codex 控制程式工作階段以更新後的應用程式集合啟動。

如需遷移資格、應用程式清單、破壞性動作政策、
資訊徵詢和原生外掛診斷，請參閱
[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的應用程式與外掛存取權限由已登入的 Codex
帳戶控制；若為 Business 和 Enterprise/Edu 工作區，則也受工作區應用程式
控制項管理。如需 OpenAI 的帳戶與工作區控制概覽，請參閱
[搭配 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 電腦操作

電腦操作有專屬的設定指南：
[Codex 電腦操作](/zh-TW/plugins/codex-computer-use)。

簡要說明：OpenClaw 不會隨附桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex 應用程式伺服器、確認
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式的輪次中負責原生
MCP 工具呼叫。

## 執行階段邊界

Codex 控制程式只會變更底層的內嵌代理程式執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行
  這些工具，因此 OpenClaw 仍位於執行路徑中。
- Codex 原生 shell、修補、MCP 與原生應用程式工具由 Codex 負責。
  OpenClaw 可以透過支援的轉送機制觀察或封鎖特定原生事件，
  但不會重寫原生工具引數。
- Codex 負責原生壓縮。OpenClaw 會保留轉錄內容鏡像，用於
  頻道記錄、搜尋、`/new`、`/reset`，以及未來的模型或控制程式
  切換，但不會以 OpenClaw 或內容引擎摘要器取代 Codex 壓縮。
- 媒體產生、媒體理解、TTS、核准和傳訊工具
  輸出會繼續使用相應的 OpenClaw 提供者／模型設定。
- `tool_result_persist` 適用於 OpenClaw 所擁有的轉錄內容工具結果，
  而非 Codex 原生工具結果記錄。

如需掛鉤層、支援的 V1 表面、原生權限處理、佇列
導向、Codex 意見回饋上傳機制及壓縮詳細資料，請參閱
[Codex 控制程式執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般的 `/model` 提供者：**這是新
設定的預期行為。請選擇 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用內建控制程式而非 Codex：**請確認實際生效的
路由是完全相符的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由、
沒有自行編寫的要求覆寫，並且 Codex 外掛已安裝且啟用。僅有
`openai/gpt-*` 前綴並不足夠。若要在測試時取得嚴格證明，
請設定提供者或模型的 `agentRuntime.id: "codex"`；強制使用 Codex 時，
若路由或控制程式不相容，將直接失敗而不會回復到替代方案。

**OpenAI Codex 執行階段回復到 API 金鑰路徑：**請收集經遮蔽處理的
閘道摘錄，其中應顯示模型、執行階段、所選提供者及失敗資訊。
請受影響的協作者在其 OpenClaw 主機上執行這個唯讀命令：

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

實用的摘錄通常包含 `openai/gpt-5.6-sol` 或 `openai/gpt-5.6-luna`、
`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、
`candidateProvider: "openai"`，以及 `401`、`Incorrect API key` 或
`No API key` 結果。修正後的執行應顯示 OpenAI OAuth 路徑，
而不是一般的 OpenAI API 金鑰失敗。

**仍保留舊版 Codex 模型參照設定：**執行 `openclaw doctor --fix`。
Doctor 會將舊版模型參照重寫為 `openai/*`、移除過時的工作階段和
整個代理程式執行階段固定設定，並保留現有的認證設定檔覆寫。

**應用程式伺服器遭到拒絕：**請使用 `0.143.0` 中的穩定版 Codex 應用程式伺服器，
並透過隨附的 `0.144.6` 執行。預發行版、帶有建置後綴的版本，以及較新但
尚未驗證的版本都會遭到拒絕，因為 OpenClaw 會依據隨附的應用程式伺服器版本
驗證產生的結構描述。

**`/codex status` 無法連線：**請檢查 `codex` 外掛
是否已啟用、設定允許清單時 `plugins.allow` 是否包含該外掛，以及任何自訂的
`appServer.command`、`url`、`authToken` 或標頭是否有效。

**Codex 應用程式伺服器使用過多記憶體：**請先區分這兩個處理程序。
OpenClaw 會將本機 Codex 應用程式伺服器作為獨立的 Rust 子處理程序執行。
`NODE_OPTIONS=--max-old-space-size=...` 只會變更閘道的 Node.js V8
堆積；它不會限制或擴大 Codex。受管理的閘道安裝已會選擇
自適應 V8 堆積，提高此值可能會減少 Codex 可用的主機記憶體。若是
閘道的記憶體壓力，請參閱[閘道記憶體疑難排解](/zh-TW/gateway/troubleshooting#gateway-exits-during-high-memory-use)；
若是 Codex 子處理程序，請檢查主機或容器記憶體。

隨附的 Codex 沒有堆積或 RSS 限制，也沒有可設定的閒置卸載
延遲。最後一個用戶端取消訂閱後，非作用中的執行緒可能仍會載入
長達 30 分鐘。在資源受限的主機上，請先減少原生 Codex 子代理程式的扇出數量，
再增加閘道堆積：

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            args: ["-c", "agents.max_threads=3", "app-server", "--listen", "stdio://"],
          },
        },
      },
    },
  },
}
```

該設定會限制隨附 Codex 預設多代理程式後端的原生子執行緒。
如果明確啟用 Codex 多代理程式 v2，請改用
`features.multi_agent_v2.max_concurrent_threads_per_session=3`；v2 的
限制包含根執行緒，且不能與 `agents.max_threads` 搭配使用。
若要為 Codex 提供更多餘裕，請增加主機、容器或 cgroup 的記憶體
配置。作業系統的硬性限制可能會終止 Codex，而不是對其施加反壓。

**模型探索速度緩慢：**降低
`plugins.entries.codex.config.discovery.timeoutMs`，或停用探索。
請參閱 [Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：**請檢查 `appServer.url`、
`authToken`、標頭，以及遠端應用程式伺服器是否使用相同的 Codex
應用程式伺服器通訊協定版本。Codex WebSocket 傳輸仍屬實驗性功能，
且不受支援；請優先使用受管理的 stdio 或本機 Unix 控制通訊端。

**原生 shell 或修補工具因 `Native hook relay
unavailable` 而遭到封鎖：**Codex 執行緒仍在嘗試使用
OpenClaw 已不再註冊的原生掛鉤轉送
ID。這是原生 Codex 掛鉤
傳輸問題，而不是 ACP 後端、供應商、GitHub 或 shell 命令
失敗。請在受影響的聊天中使用 `/new` 或 `/reset` 開始全新的工作階段，
然後重試無害的命令。如果首次可正常運作，但下一次原生工具
呼叫又失敗，請只將 `/new` 視為暫時的因應措施：重新啟動 Codex 應用程式伺服器或
OpenClaw 閘道後，將提示詞複製到全新的工作階段，以便捨棄舊執行緒並重新建立
原生掛鉤註冊。

**Codex 工具呼叫建立過多短期掛鉤處理程序：**設定
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
並重新啟動閘道。這只會停用用於 OpenClaw 迴圈偵測及其無原則標記的 Codex
`PreToolUse` 子處理程序。
必要的 `before_tool_call` 和受信任工具原則轉送仍會保持啟用。

**非 Codex 模型使用內建控制框架：**除非供應商
或模型執行階段原則將其路由至其他控制框架，否則這是預期行為。在 `auto` 模式中，
一般的非 OpenAI 供應商參照仍會沿用其正常供應商路徑。

**已安裝電腦操作功能，但工具並未執行：**請從全新的工作階段檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請使用上述原生掛鉤轉送復原方式。
請參閱 [Codex 電腦操作](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關內容

- [Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督](/zh-TW/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex 電腦操作](/zh-TW/plugins/codex-computer-use)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [模型供應商](/zh-TW/concepts/model-providers)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [OpenAI Codex 說明](https://help.openai.com/en/collections/14937394-codex)
- [代理程式控制框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [外掛掛鉤](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
