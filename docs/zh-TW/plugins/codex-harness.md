---
read_when:
    - 你想要使用官方 Codex app-server 測試框架
    - 你需要 Codex 測試框架設定範例
    - 你希望僅使用 Codex 的部署在失敗時直接終止，而不是回退至 OpenClaw
summary: 透過官方 Codex app-server 測試框架執行 OpenClaw 內嵌代理程式回合
title: Codex 測試框架
x-i18n:
    generated_at: "2026-07-19T13:55:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 791c637e772760a9ff580575f93c84ce4f477e08a08ee8bd29e251b3e0c18091
    source_path: plugins/codex-harness.md
    workflow: 16
---

官方 `codex` 外掛透過 Codex
app-server 執行內嵌的 OpenAI 代理程式回合，而非使用內建的 OpenClaw 執行框架。Codex 擁有
底層代理程式工作階段：原生執行緒續接、原生工具續行、
原生壓縮，以及 app-server 執行。OpenClaw 仍擁有聊天
頻道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、
媒體傳送，以及可見的逐字記錄鏡像。

請使用標準 OpenAI 模型參照，例如 `openai/gpt-5.6-sol`。請勿設定
舊版 Codex GPT 參照；請將 OpenAI 代理程式的驗證順序放在 `auth.order.openai` 下。
舊版 Codex 驗證設定檔 ID 與舊版 Codex 驗證順序項目會由
`openclaw doctor --fix` 修復。

當提供者／模型執行階段原則未設定或為 `auto` 時，僅有 `openai/*` 前綴
絕不會選取此執行框架。只有在路由完全符合官方 HTTPS Platform Responses
或 ChatGPT Responses，且沒有自行撰寫的要求覆寫時，OpenAI 才可能隱含選取 Codex。
請參閱
[OpenAI 隱含代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。
如果在 Platform 與 ChatGPT 路由確定之前，Codex 已擁有驗證，
OpenClaw 仍要求每個候選路由宣告與 Codex 相容。僅有原生
驗證所有權絕不會略過該路由檢查。

當沒有啟用 OpenClaw 沙箱時，OpenClaw 會以啟用 Codex 原生程式碼模式的方式
啟動 Codex app-server 執行緒（預設仍不啟用僅限程式碼模式），因此
原生工作區／程式碼功能可與透過 app-server `item/tool/call` 橋接器路由的
OpenClaw 動態工具同時使用。啟用中的 OpenClaw 沙箱或受限工具原則會完全停用
原生程式碼模式，除非你選擇啟用實驗性的沙箱 exec-server 路徑。

使用預設的 `tools.exec.host: "auto"` 且未啟用 OpenClaw 沙箱時，
Codex 也會收到 `node_exec` 與 `node_process` 工具，以便在已配對的
節點上執行命令。原生 shell 仍位於 Codex app-server 主機與工作區
（預設 stdio 部署為閘道本機）；`node_exec` 會依
名稱或 ID 選取節點，並持續強制執行 OpenClaw 的節點核准原則。如果有限的
執行階段允許清單停用原生程式碼模式，導致該回合沒有執行環境，
OpenClaw 會改為保留經原則篩選的 `exec` 與 `process`
工具，以供直接、不使用沙箱的執行。

此 Codex 原生功能不同於
[OpenClaw 程式碼模式](/tools/code-mode)；後者是供一般 OpenClaw 執行使用的選用 QuickJS-WASI
執行階段，並採用不同的 `exec` 輸入形狀。如需瞭解更廣泛的
模型／提供者／執行階段劃分，請先參閱
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)：`openai/gpt-5.6-sol` 是模型
參照、`codex` 是執行階段，而 Telegram、Discord、Slack 或其他
頻道則是通訊介面。

## 需求

- 已安裝官方 `@openclaw/codex` 外掛。如果你的設定使用允許清單，請將 `codex` 納入
  `plugins.allow`。
- 來自 `0.143.0` 至 `0.144.6` 的穩定 Codex app-server。外掛預設會管理相容的
  二進位檔，因此 `PATH` 上的 `codex` 命令不會影響正常
  啟動。
- 透過 `openclaw models auth login --provider openai` 進行 Codex 驗證、代理程式 Codex 主目錄中
  已存在的 app-server 帳號，或明確的 Codex API 金鑰驗證設定檔。

如需瞭解驗證優先順序、環境隔離、自訂 app-server 命令、
模型探索及完整設定欄位清單，請參閱
[Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

安裝官方外掛，接著使用 Codex OAuth 登入：

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

變更外掛設定後，請重新啟動閘道。如果聊天已有
工作階段，請先執行 `/new` 或 `/reset`，讓下一個回合依目前設定解析執行框架。

## 與 Codex Desktop 和命令列介面共用執行緒

預設的 `appServer.homeScope: "agent"` 會將每個 OpenClaw 代理程式與
操作者的原生 Codex 狀態隔離。若要讓擁有者檢視及管理
Codex Desktop 與 Codex 命令列介面顯示的相同原生執行緒，請選擇使用
使用者 Codex 主目錄：

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

使用者主目錄模式支援本機受管理的 stdio 程序或共用 Unix 通訊端
傳輸。若已設定 `$CODEX_HOME`，便使用該值，否則使用 `~/.codex`，其中包括
該主目錄的原生 Codex 驗證、設定、外掛與執行緒儲存區。OpenClaw 不會
將 OpenClaw 驗證設定檔注入此 app-server。

擁有者回合會取得 `codex_threads` 工具：列出、搜尋、讀取、分叉、重新命名、
封存及還原原生執行緒。分叉執行緒即可在
OpenClaw 中繼續；分叉會附加至目前的 OpenClaw 工作階段，且其他
原生 Codex 用戶端仍可看到它。封存需要明確
確認該執行緒已在其他地方關閉。若同時啟用監督，
逐字記錄欄位與變更操作需要相符的
`supervision.allowRawTranscripts` 或 `supervision.allowWriteControls` 選用設定。

請勿透過各自獨立管理的 stdio App Server 同時續接或寫入同一執行緒。
Codex 只會協調單一 App Server 內的即時寫入者，不會協調
不同程序之間的寫入者。對於一般使用者主目錄 stdio 工作階段，
分叉是安全共存的方式。

單獨使用 `appServer.homeScope: "user"` 不會控制工作叢集目錄。外掛啟用時，
原生工作階段探索即為啟用；設定
`sessionCatalog.enabled: false` 可將其從 OpenClaw 側邊欄移除，而不會
停用 Codex。該目錄使用獨立的監督連線；若未明確指定
`appServer` 連線設定，該連線預設使用受管理的
使用者主目錄 stdio，而一般執行框架仍維持代理程式範圍。
兩條路徑都會遵循明確的 `appServer` 設定。如上所示，當一般執行框架
也應共用原生狀態時，請明確設定 `homeScope: "user"`。

## 監督 Codex 工作階段

同一個 `codex` 外掛可以列出閘道電腦與已選擇加入的配對節點上，
尚未封存的 Codex 工作階段。儲存中或閒置的閘道本機工作階段可以
建立模型鎖定的聊天，鏡像其有界的持久化使用者與助理
歷程。其私有繫結使用監督連線取得原生
快照、標準分支及後續回合，而一般 Codex 工作階段仍維持
代理程式範圍。首次標準啟動會完全採用 Codex 為快照分叉所回傳的
模型與提供者。後續續接則交由 Codex 的
原生設定進行選擇；外層 OpenClaw 模型與備援鏈絕不會取代
它。明確確認沒有其他執行者後，即可封存儲存中與閒置的項目。
作用中的來源無法建立分支或封存；仍可開啟現有的
受監督聊天。配對節點工作階段仍僅限中繼資料。

如需設定、分支規則、配對節點限制、中繼資料揭露及疑難排解，請參閱
[監督 Codex 工作階段](/zh-TW/plugins/codex-supervision)。

## 設定

| 需求                                                | 設定                                                                                              | 位置                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 啟用執行框架                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 設定                    |
| 隱藏原生 Codex 工作階段探索                 | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Codex 外掛設定                |
| 保留採用允許清單的外掛安裝                  | 將 `codex` 納入 `plugins.allow`                                                               | OpenClaw 設定                    |
| 允許符合資格的 OpenAI 回合隱含使用 Codex | 完全符合官方 HTTPS Responses/ChatGPT 路由、沒有自行撰寫的要求覆寫、執行階段未設定／`auto` | OpenAI 提供者／模型設定       |
| 使用 ChatGPT/Codex OAuth 登入                    | `openclaw models auth login --provider openai`                                                   | 命令列介面驗證設定檔                   |
| 為 Codex 執行新增 API 金鑰備援                   | 在 `auth.order.openai` 中列於訂閱驗證之後的 `openai:*` API 金鑰設定檔                 | 命令列介面驗證設定檔 + OpenClaw 設定 |
| Codex 無法使用時以關閉方式失敗               | 提供者或模型 `agentRuntime.id: "codex"`                                                     | OpenClaw 模型／提供者設定     |
| 使用直接的 OpenAI API 流量                       | 提供者或模型 `agentRuntime.id: "openclaw"`，搭配一般 OpenAI 驗證                          | OpenClaw 模型／提供者設定     |
| 調整 app-server 行為                            | `plugins.entries.codex.config.appServer.*`                                                       | Codex 外掛設定                |
| 啟用原生 Codex 外掛應用程式                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex 外掛設定                |
| 啟用 Codex 電腦使用功能                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex 外掛設定                |

如需訂閱優先、API 金鑰備援的順序，建議使用 `auth.order.openai`。
現有舊版 Codex 驗證設定檔 ID 與舊版 Codex 驗證順序
僅屬於 doctor 處理的舊版狀態；請勿寫入新的舊版 Codex GPT 參照。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

對於與 Codex 相容的有效路由，上述兩個設定檔仍會是
同一次 Codex 執行的候選項目。設定檔順序選擇的是認證資訊，而非執行階段。
變更驗證順序不會使自訂、Completions、HTTP 或
經要求覆寫的路由變得與 Codex 相容。

### 壓縮

請勿在 Codex 支援的代理程式上設定 `compaction.model` 或 `compaction.provider`。
Codex 透過其原生 app-server 執行緒狀態進行壓縮，因此
OpenClaw 會在執行階段忽略這些本機摘要器覆寫，而當代理程式使用 Codex 時，
`openclaw doctor --fix` 會將其移除。

Lossless 仍可作為情境引擎，支援 Codex 回合周圍的組裝、擷取與
維護，並透過
`plugins.slots.contextEngine: "lossless-claw"` 與
`plugins.entries.lossless-claw.config.summaryModel` 設定，而不是透過
`agents.defaults.compaction.provider`。當 Codex 是作用中執行階段時，`openclaw doctor --fix` 會將
舊的 `compaction.provider: "lossless-claw"` 形狀遷移至 Lossless
情境引擎插槽，但原生 Codex 仍擁有壓縮。原生 app-server 執行框架支援
需要提示前組裝的情境引擎；一般命令列介面後端（包括 `codex-cli`）
不提供該主機功能。

對於 Codex 支援的代理程式，`/compact` 會在繫結的執行緒上啟動
原生 Codex app-server 壓縮。OpenClaw 不會等待完成、
施加 OpenClaw 逾時、重新啟動共用 app-server，也不會備援至
情境引擎或公開 OpenAI 摘要器。如果原生 Codex 執行緒
繫結遺失或過時，該命令會以關閉方式失敗，而不會在未提示的情況下
切換壓縮後端。

本頁其餘內容涵蓋部署形式、失敗時關閉的路由、Guardian
核准政策、原生 Codex 外掛，以及電腦操作。如需完整的選項
清單、預設值、列舉、探索、環境隔離、逾時，以及
app-server 傳輸欄位，請參閱
[Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex 執行環境

在預期使用 Codex 的聊天中使用 `/status`。由 Codex 支援的 OpenAI
代理程式回合會顯示：

```text
執行環境：OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線能力、帳戶、速率限制、MCP
伺服器和 Skills。`/codex models` 會列出控制框架與帳戶適用的即時 Codex app-server 目錄。
如果 `/status` 的結果出乎預期，請參閱
[疑難排解](#troubleshooting)。

## 路由與模型選擇

請將供應商參照與執行環境政策分開：

- 使用 `openai/gpt-*` 選擇標準 OpenAI 模型。只有前綴
  絕不會選取 Codex。
- 當執行環境未設定或為 `auto` 時，只有完全符合官方 HTTPS Platform Responses
  或 ChatGPT Responses 的路由，且沒有自行撰寫的要求覆寫，才可隱含選取 Codex。
- 請勿在設定中使用舊版 Codex GPT 參照；執行 `openclaw doctor --fix`
  以修復舊版參照和過時的工作階段路由固定設定。
- `agentRuntime.id: "codex"` 會讓 Codex 成為相容路由的失敗時關閉
  必要條件。它不會讓實際上不相容的路由變得相容。
- `agentRuntime.id: "openclaw"` 會在有意如此設定時，讓供應商或模型選用內嵌的
  OpenClaw 執行環境。
- `/codex ...` 可從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是另一條外部控制框架路徑。僅當使用者要求
  ACP/acpx 或外部控制框架轉接器時才使用。

| 使用者意圖                                                | 使用                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前聊天                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 繼續現有的 Codex 執行緒                            | `/codex resume <thread-id>`                                                                           |
| 列出或篩選 Codex 執行緒                               | `/codex threads [filter]`                                                                             |
| 讀取或更新已繫結執行緒的原生目標              | `/codex goal [status\|set <objective>\|pause\|resume\|block\|complete\|clear]`                        |
| 列出原生 Codex 外掛                                  | `/codex plugins list`                                                                                 |
| 啟用或停用已設定的原生 Codex 外掛         | `/codex plugins enable <name>`、`/codex plugins disable <name>`                                       |
| 將已儲存的 Codex 命令列介面工作階段繼續為配對節點回合    | `/codex sessions --host <node> [filter]`，接著使用 `/codex resume <session-id> --host <node> --bind here` |
| 檢視跨電腦的未封存 Codex 工作階段          | 啟用 Codex 監督並開啟 **Codex 工作階段**                                                  |
| 變更已繫結執行緒的模型、快速模式或權限 | `/codex model <model>`、`/codex fast [on\|off\|status]`、`/codex permissions [default\|yolo\|status]` |
| 停止或引導進行中的回合                              | `/codex stop`、`/codex steer <text>`                                                                  |
| 解除目前繫結                                 | `/codex detach`（別名 `/codex unbind`）                                                               |
| 僅傳送 Codex 意見回饋                                   | `/codex diagnostics [note]`                                                                           |
| 啟動 ACP/acpx 任務                                     | ACP/acpx 工作階段命令，而非 `/codex`                                                               |

| 使用案例                                        | 設定                                                                                                   | 驗證                                  | 備註                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| 使用原生 Codex 執行環境的合格 OpenAI 路由 | 完全符合官方 HTTPS Responses/ChatGPT 的路由，沒有自行撰寫的要求覆寫，並啟用 `codex` 外掛 | `/status` 顯示 `Runtime: OpenAI Codex` | 執行環境未設定或為 `auto` 時的隱含路徑 |
| 若 Codex 無法使用則失敗時關閉             | 供應商或模型 `agentRuntime.id: "codex"`                                                                | 回合失敗，而非回退至內嵌執行環境 | 用於僅限 Codex 的部署             |
| 透過 OpenClaw 傳送直接 OpenAI API 金鑰流量  | 供應商或模型 `agentRuntime.id: "openclaw"`，以及一般 OpenAI 驗證                                      | `/status` 顯示 OpenClaw 執行環境        | 僅在有意使用 OpenClaw 時使用      |
| 舊版設定                                   | 舊版 Codex GPT 參照                                                                                       | `openclaw doctor --fix` 會將其重寫     | 請勿以此方式撰寫新設定           |
| ACP/acpx Codex 轉接器                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP 任務／工作階段狀態                 | 與原生 Codex 控制框架分開         |

`agents.defaults.imageModel` 遵循相同的前綴區分。一般 OpenAI 路由請使用
`openai/gpt-*`，只有在影像理解應透過有限制的 Codex app-server
回合執行時，才使用 `codex/gpt-*`。Doctor 會將舊版
Codex GPT 參照重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

針對有效官方 HTTPS 路由符合隱含選取 Codex 資格的 OpenAI 模型，
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

將 Claude 保持為預設代理程式，並新增具名 Codex 代理程式：

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

`main` 代理程式使用其一般供應商路徑。只要其有效 OpenAI 路由維持相容，
`codex` 代理程式就會使用 Codex app-server；若這應是失敗時關閉的必要條件，
請新增明確的模型範圍 `agentRuntime.id: "codex"`。

### 失敗時關閉的 Codex 部署

當隨附外掛可用時，符合資格且完全符合官方 HTTPS 的 OpenAI 路由可解析為 Codex。
若要制定明確的失敗時關閉規則，請新增執行環境政策：

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

強制使用 Codex 時，若有效路由未宣告為與 Codex 相容、外掛已停用、
app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## App-server 政策

依預設，外掛會使用 stdio 傳輸，在本機啟動由 OpenClaw 管理的 Codex 二進位檔。
僅在有意執行不同的可執行檔時，才設定 `appServer.command`。
Codex 將 WebSocket 傳輸分類為實驗性且不受支援；僅可用於非正式環境，
針對已在其他位置執行的 app-server 進行測試：

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
立場：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本機 Codex 要求不允許這種隱含的 YOLO 立場，
OpenClaw 會改為選取允許的 Guardian 權限。當工作階段啟用 OpenClaw
沙箱時，OpenClaw 會停用該回合的 Codex 原生 Code Mode、使用者 MCP
伺服器和應用程式支援的外掛執行，而不依賴 Codex 主機端沙箱。
若一般 exec/process 工具可用，Shell 存取會改為透過 OpenClaw
沙箱支援的動態工具，例如 `sandbox_exec` 和 `sandbox_process`。

在沙箱逸出或額外權限之前，為 Codex 原生自動審查使用標準化的
OpenClaw exec 模式：

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
Guardian 審查的核准：當本機要求允許這些值時，通常為
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不會保留舊版不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若有意採用
Codex 無需核准的立場，請使用 `tools.exec.mode: "full"`。舊版
`plugins.entries.codex.config.appServer.mode: "guardian"` 預設仍然有效，但 `tools.exec.mode: "auto"`
是標準化的 OpenClaw 介面。

如需模式層級與主機 exec 核准及 ACPX 權限的比較，請參閱
[權限模式](/zh-TW/tools/permission-modes)。如需所有 app-server 欄位、
驗證順序、環境隔離和逾時行為，請參閱
[Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

`codex` 外掛會在任何支援 OpenClaw 文字命令的頻道上，
將 `/codex` 註冊為斜線命令。

原生執行與控制需要擁有者或 `operator.admin` 閘道用戶端：
繫結或繼續執行緒、傳送或停止回合、變更模型、快速模式或權限狀態、
執行壓縮或審查，以及解除繫結。其他獲授權的傳送者僅能使用唯讀的狀態、
說明、帳戶、模型、執行緒、原生目標、MCP 伺服器、Skill 和繫結檢查命令。

常見形式：

- `/codex status` 會檢查 app-server 連線能力、模型、帳戶、速率
  限制、MCP 伺服器與 Skills。
- `/codex models` 會列出即時 Codex app-server 模型。
- `/codex threads [filter]` 會列出最近的 Codex app-server 執行緒。
- `/codex goal` 會讀取或更新已附加執行緒的原生 Codex 目標。Codex 自動目標接續仍維持停用；OpenClaw 尚未負責自主後續回合。
- `/codex resume <thread-id>` 會將目前的 OpenClaw 工作階段附加至
  現有的 Codex 執行緒。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  會附加目前的聊天。
- `/codex detach`（或 `/codex unbind`）會解除目前的繫結。
- `/codex binding` 會說明目前的繫結。
- `/codex stop` 會停止進行中的回合；`/codex steer <text>` 會引導該回合。
- `/codex model <model>`、`/codex fast [on|off|status]` 與
  `/codex permissions [default|yolo|status]` 會變更各對話的狀態。
- `/codex compact` 會要求 Codex app-server 壓縮已附加的執行緒。
- `/codex review` 會為已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加執行緒的 Codex 意見回饋前
  詢問。
- `/codex account` 會顯示帳戶與速率限制狀態。
- `/codex mcp` 會列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 會列出 Codex app-server Skills。
- `/codex plugins list`、`/codex plugins enable <name>` 與
  `/codex plugins disable <name>` 會管理已設定的原生 Codex 外掛。
- `/codex computer-use [status|install]` 會管理 Codex Computer Use。
- `/codex help` 會列出完整的命令樹狀結構。

對於大多數支援回報，請先在發生錯誤的對話中使用 `/diagnostics [note]`。
它會建立一份閘道診斷報告，並針對 Codex 控制框架工作階段，
要求核准傳送相關的 Codex 意見回饋套件。請參閱
[診斷匯出](/zh-TW/gateway/diagnostics)，瞭解隱私權模型與群組
聊天行為。只有當你明確想要上傳目前已附加執行緒的
Codex 意見回饋，而不需要完整的閘道診斷套件時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 執行緒

檢查異常 Codex 執行的最快方式，通常是直接開啟原生
Codex 執行緒：

```bash
codex resume <thread-id>
```

請從已完成的 `/diagnostics` 回覆、`/codex binding`
或 `/codex threads [filter]` 取得執行緒 ID。

如需瞭解上傳機制與執行階段層級的診斷界線，請參閱
[Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

### 驗證順序

在預設的各代理程式主目錄中，會依照下列順序選取驗證方式：

1. 代理程式的已排序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 之下。執行 `openclaw doctor --fix`，以移轉較舊的舊版
   Codex 驗證設定檔 ID 與舊版 Codex 驗證順序。
2. 該代理程式 Codex 主目錄中 app-server 的現有帳戶。
3. 僅適用於本機 stdio app-server 啟動：當 app-server 沒有帳戶且仍需要 OpenAI 驗證時，依序使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱形式的 Codex 驗證設定檔時，會從產生的 Codex 子
程序中移除 `CODEX_API_KEY` 與 `OPENAI_API_KEY`。
這能讓閘道層級的 API 金鑰繼續供嵌入或直接 OpenAI 模型使用，
同時避免原生 Codex app-server 回合意外透過 API 計費。
明確的 Codex API 金鑰設定檔與本機 stdio 環境金鑰備援，會使用 app-server 登入，
而非繼承的子程序環境。WebSocket app-server 連線不會收到閘道
環境 API 金鑰備援；請使用明確的驗證設定檔或遠端
app-server 自有的帳戶。

如果訂閱設定檔達到 Codex 使用量限制，OpenClaw 會在 Codex 回報重設時間時
記錄該時間，並為同一次 Codex 執行嘗試下一個已排序的驗證設定檔。
重設時間過後，無須變更所選的 `openai/gpt-*`
模型或 Codex 執行階段，該訂閱設定檔便會再次符合使用資格。

設定原生 Codex 外掛後，OpenClaw 會先透過連線的 app-server
安裝或重新整理這些外掛，再將外掛所擁有的應用程式公開給 Codex 執行緒。
`app/list` 仍是應用程式
ID、可存取性與中繼資料的單一真實來源，但 OpenClaw 負責決定各執行緒是否啟用：
如果原則允許某個已列出且可存取的應用程式，即使 `app/list`
目前回報該應用程式已停用，OpenClaw 仍會傳送 `thread/start.config.apps[appId].enabled = true`。
此路徑不會為未知 ID 擅自建立應用程式
安裝；OpenClaw 只會啟用具有 `plugin/install` 的市集外掛，
然後重新整理清單。

### 環境隔離

對於本機 stdio app-server 啟動，OpenClaw 會將 `CODEX_HOME` 設為
各代理程式專用目錄，因此 Codex 設定、驗證／帳戶檔案、外掛快取／資料
與原生執行緒狀態，預設不會讀寫操作者個人的
`~/.codex`。OpenClaw 會保留一般程序的 `HOME`；
Codex 執行的子程序仍可找到使用者主目錄中的設定與權杖，
而 Codex 也可能探索共用的 `$HOME/.agents/skills` 與
`$HOME/.agents/plugins/marketplace.json` 項目。使用
`appServer.homeScope: "user"` 時，OpenClaw 改為使用原生使用者 Codex
主目錄及其現有帳戶，而不注入 OpenClaw 驗證設定檔。

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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子
程序。OpenClaw 會在本機啟動正規化期間，從此清單移除 `CODEX_HOME` 與 `HOME`：
`CODEX_HOME` 會繼續指向所選的代理程式或使用者範圍，
而 `HOME` 會繼續繼承，讓子程序可使用一般使用者主目錄狀態。

### 動態工具與網頁搜尋

Codex 動態工具預設採用 `searchable` 載入。OpenClaw 通常不會
公開與 Codex 原生工作區操作重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、
`get_goal`、`create_goal`、`update_goal`、`tool_call`、`tool_describe`、
`tool_search` 與 `tool_search_code`。目標操作維持由 Codex 原生處理，
因此 OpenClaw 不會將第二套目標儲存區投射至 Codex 回合中。其餘大多數
OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、閘道與 `heartbeat_respond`，
都可透過 `openclaw` 命名空間下的
Codex 工具搜尋取得，以縮小初始模型情境。當有限允許清單停用原生 Code Mode 時，
受限回合的 shell 備援是 `exec` 與 `process` 的例外；
執行階段允許清單與 `codexDynamicToolsExclude` 仍然適用。

標記為 `catalogMode: "direct-only"` 的工具，包括 OpenClaw `computer`
工具，會改用 `openclaw_direct` 命名空間。Codex 將該命名空間視為
`DirectModelOnly`，因此這些工具在一般與僅限程式碼模式的執行緒中，
會持續直接對模型可見，而不會跨越巢狀 Code Mode `tools.*` 呼叫。

啟用搜尋且未選取受管理的提供者時，網頁搜尋預設使用 Codex 託管的
`web_search` 工具。原生託管搜尋與
OpenClaw 受管理的 `web_search` 動態工具互斥，以免
受管理的搜尋繞過原生網域限制。當託管搜尋無法使用、遭明確停用或
由所選的受管理提供者取代時，OpenClaw 會使用受管理的工具。OpenClaw 會讓 Codex 的獨立
`web.run` 擴充功能維持停用，因為正式環境 app-server 流量會拒絕
其使用者定義的 `web` 命名空間。`tools.web.search.enabled: false`
會停用兩條路徑，停用工具且僅使用 LLM 的執行也是如此。Codex 將
`"cached"` 視為偏好設定，並在不受限的 app-server 回合中將其解析為即時外部存取。
設定原生 `allowedDomains` 時，自動受管理備援會以關閉方式失敗，
確保無法繞過允許清單。持續生效的搜尋原則變更會在下一回合前
輪替已繫結的 Codex 執行緒；暫時性的各回合限制會使用臨時的
受限執行緒，並保留現有繫結以供之後繼續。

`sessions_yield` 與僅限訊息工具的來源回覆會維持直接傳送，因為
這些是回合控制合約。`sessions_spawn` 維持可搜尋，
讓 Codex 原生的 `spawn_agent` 繼續作為主要 Codex 子代理程式介面，
而明確的 OpenClaw 或 ACP 委派仍可透過
`openclaw` 動態工具命名空間使用。心跳偵測協作指示會要求 Codex 在工具尚未載入時，
於結束心跳偵測回合前搜尋 `heartbeat_respond`。

只有在連線至無法搜尋延後載入之動態工具的自訂
Codex app-server，或偵錯完整工具承載內容時，才設定 `codexDynamicToolsLoading: "direct"`。

### 設定欄位

支援的頂層 Codex 外掛欄位：

| 欄位                      | 預設值        | 含義                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"`，將 OpenClaw 動態工具直接放入初始 Codex 工具情境。 |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。              |
| `codexPlugins`             | 已停用       | 適用於已移轉、由原始碼安裝之精選外掛的原生 Codex 外掛／應用程式支援。           |
| `sessionCatalog`           | 已啟用        | 探索此閘道和符合資格之已配對節點上的原生 Codex 工作階段側邊欄。   |
| `supervision`              | 已停用       | 面向代理程式的原生工作階段逐字稿與寫入控制原則。                         |

支援的 `appServer` 欄位：

| 欄位                                          | 預設值                                                  | 說明                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；明確設定 `"unix"` 會連線至本機控制通訊端；`"websocket"` 會連線至 `url`。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依各 OpenClaw 代理程式隔離一般控制框架狀態。`"user"` 是明確的選擇加入設定，會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍支援本機標準輸入輸出或 Unix 傳輸。對於獨立的監督連線，未設定的值在標準輸入輸出或 Unix 模式下會解析為 `"user"`，在 WebSocket 模式下則解析為 `"agent"`。     |
| `command`                                     | 受管理的 Codex 二進位檔                                | 標準輸入輸出傳輸使用的可執行檔。保留未設定以使用受管理的二進位檔；僅在明確覆寫時設定。                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | 標準輸入輸出傳輸使用的引數。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                 | WebSocket App Server URL 或 `unix://` URL。明確指定空白的 Unix 路徑會選取標準的使用者家目錄控制通訊端。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸使用的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立其繼承環境後，從已啟動的標準輸入輸出 App Server 程序中移除的額外環境變數名稱。OpenClaw 會保留選定的 `CODEX_HOME` 與繼承的 `HOME`，供本機啟動使用。                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | 選擇加入 Codex 僅限程式碼模式的工具介面。一般的 OpenClaw 動態工具仍可透過巢狀 `tools.*` 呼叫使用；`openclaw_direct` 工具仍會直接顯示給模型。                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex App Server 工作區根目錄。設定後，OpenClaw 會從解析後的 OpenClaw 工作區推斷本機工作區根目錄、在此遠端根目錄下保留目前的 cwd 後綴，並僅將最終的 App Server cwd 傳送給 Codex。如果 cwd 位於解析後的 OpenClaw 工作區根目錄之外，OpenClaw 會採取封閉式失敗，而不會將閘道本機路徑傳送至遠端 App Server。 |
| `requestTimeoutMs`                            | `60000`                                                | App Server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個回合後，或在回合範圍的 App Server 請求後，OpenClaw 等待 `turn/completed` 時的靜默時間窗。                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | 最終／非評論性助理項目或工具執行前的原始助理完成內容啟動助理輸出釋放後，OpenClaw 仍在等待 `turn/completed` 時的靜默時間窗。提高此值可讓 Codex 有更多時間發出 `turn/completed`，之後 OpenClaw 才會中斷並釋放工作階段通道。                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具執行後的原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度防護。適用於受信任或高負載的工作，其中工具執行後的綜合處理可合理地比最終助理釋放預算保持更久的靜默。                                |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO | YOLO 或經守護者審查之執行的預設設定。本機標準輸入輸出要求若省略 `danger-full-access`、`never` 核准或 `user` 審查者，隱含預設值會設為守護者。                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` 或允許的守護者核准政策       | 傳送至執行緒啟動／繼續／回合的原生 Codex 核准政策。允許時，守護者預設值偏好 `"on-request"`。                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的守護者沙箱  | 傳送至執行緒啟動／繼續的原生 Codex 沙箱模式。允許時，守護者預設值偏好 `"workspace-write"`，否則使用 `"read-only"`。OpenClaw 沙箱啟用時，`danger-full-access` 回合會使用 Codex `workspace-write`，其網路存取權限衍生自 OpenClaw 沙箱輸出設定。                                                                                     |
| `approvalsReviewer`                           | `"user"` 或允許的守護者審查者               | 允許時，使用 `"auto_review"` 讓 Codex 審查原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex App Server 服務層級。`"priority"` 啟用快速模式路由，`"flex"` 要求彈性處理，`null` 清除覆寫，而舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                                 | 選擇加入 Codex 權限設定檔網路功能，以供 App Server 命令使用。OpenClaw 會定義選定的 `permissions.<profile>.network` 設定，並透過 `default_permissions` 選取，而不是傳送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選擇加入功能，會向支援的 Codex App Server 註冊由 OpenClaw 沙箱支援的 Codex 環境，使原生 Codex 執行作業可在作用中的 OpenClaw 沙箱內執行。                                                                                                                                                                                                            |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙箱合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設置 `features.network_proxy.enabled`
與 `default_permissions`，讓產生的權限設定檔可啟動 Codex 管理的網路功能。OpenClaw 預設會根據設定檔主體產生具抗衝突能力的 `openclaw-network-<fingerprint>` 設定檔
名稱；只有需要穩定的本機名稱時，才使用 `profileName`。

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

如果一般 app-server 執行階段原本會是 `danger-full-access`，啟用
`networkProxy` 後，產生的權限設定檔會使用工作區形式的檔案系統存取：Codex 管理的網路強制控管屬於沙箱化
網路，因此完全存取設定檔無法保護對外流量。
網域項目使用 `allow` 或 `deny`；Unix 通訊端項目使用 Codex 的
`allow` 或 `none` 值。

### 動態工具呼叫逾時

OpenClaw 所擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制：Codex `item/tool/call` 要求預設使用 90
秒的 OpenClaw 監看計時器。每次呼叫的正值 `timeoutMs`
引數可延長或縮短該次特定工具的時間預算，上限為 600000 ms。
當工具呼叫未提供自己的逾時值時，`image_generate` 工具會使用 `agents.defaults.imageGenerationModel.timeoutMs`；
否則影像產生的預設值為 120 秒。媒體理解 `image` 工具
使用 `tools.media.image.timeoutSeconds`，或其 60 秒媒體預設值；進行
影像理解時，該逾時適用於要求本身，不會因先前的準備工作而
縮短。發生逾時時，OpenClaw 會在支援的情況下中止工具
訊號，並向 Codex 傳回失敗的動態工具回應，
讓該輪可以繼續，而不會讓工作階段停留在 `processing`。
此監看計時器是外層動態 `item/tool/call` 預算；各供應商專屬的
要求逾時會在該呼叫內執行，並保留各自的逾時語意。

Codex 接受一輪之後，以及 OpenClaw 回應該輪範圍內的
app-server 要求之後，測試框架預期 Codex 會推進目前這一輪，
並最終以 `turn/completed` 完成原生輪次。如果
app-server 靜默達 `appServer.turnCompletionIdleTimeoutMs`，OpenClaw
會盡力中斷 Codex 輪次、記錄診斷逾時，並
釋放 OpenClaw 工作階段通道，讓後續聊天訊息不會
排在過時的原生輪次之後。同一輪的大多數非終止通知
會解除該短期監看計時器，因為 Codex 已證明該輪仍在
運作。

工具交接使用較長的工具後閒置預算：在 OpenClaw 傳回
`item/tool/call` 回應之後、在
`commandExecution` 等原生工具項目完成之後、在原始 `custom_tool_call_output`
完成之後，以及工具後的原始助理進度、原始推理
完成或推理進度之後。若有設定，防護機制會使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否則預設為五分鐘；同一份預算也會延長
靜默合成期間的進度監看計時器，直到 Codex 發出下一個
目前輪次事件。速率限制更新等全域 app-server 通知
不會重設輪次閒置進度。推理完成、
commentary `agentMessage` 完成，以及工具前的原始推理或
助理進度，後續可能會自動產生最終回覆，因此它們會使用
進度後回覆防護機制，而不是立即釋放工作階段通道。

只有最終／非 commentary 的已完成 `agentMessage` 項目與工具前的原始
助理完成會啟動助理輸出釋放：如果 Codex 隨後
在沒有 `turn/completed` 的情況下轉為靜默，OpenClaw 會盡力中斷原生
輪次並釋放工作階段通道。如果另一個輪次監看機制贏得該釋放
競爭，只要已無原生要求、項目或動態工具完成仍處於作用中，
且助理輸出釋放仍屬於最近完成的項目、沒有
後續項目完成，OpenClaw 仍會接受已完成的最終助理項目。這可在
工具工作完成後保留最終答案，而不必重播該輪。部分助理差異更新、
先前已過時的回覆，以及之後的空白完成都不符合資格。

可安全重播的 stdio app-server 失敗，包括沒有助理、工具、
作用中項目或副作用證據的輪次完成閒置
逾時，會在全新的 app-server 嘗試中重試一次。不安全的逾時仍會淘汰
卡住的 app-server 用戶端並釋放 OpenClaw 工作階段通道；它們也會
清除過時的原生執行緒繫結，而不是自動
重播。完成監看逾時會顯示 Codex 專屬的逾時
文字：可安全重播的情況會指出回應可能不完整，而不安全的
情況會要求使用者在重試前確認目前狀態。公開逾時
診斷包含結構化欄位，例如最後一個 app-server
通知方法、原始助理回應項目的 ID／類型／角色、作用中
要求／項目計數，以及已啟動的監看狀態；當最後一個通知是
原始助理回應項目時，還會包含有界限的助理文字
預覽。這些診斷不包含原始提示詞或工具內容。

### 本機測試環境覆寫

- `OPENCLAW_CODEX_APP_SERVER_BIN` 會在
  `appServer.command` 未設定時略過受管理的二進位檔。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性的本機測試。對於
可重複部署，建議使用設定，因為這能讓外掛
行為與 Codex 測試框架的其餘設定保留在同一個經過審查的檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw 測試框架輪次相同的 Codex 執行緒中，使用 Codex app-server 自己的應用程式與外掛
功能。OpenClaw
不會將 Codex 外掛轉換為合成的 `codex_plugin_*` OpenClaw
動態工具。

`codexPlugins` 只會影響選擇原生 Codex 測試框架的工作階段。
它不會影響內建測試框架執行、一般 OpenAI 供應商執行、ACP
對話繫結或其他測試框架。

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

當 OpenClaw 建立 Codex 測試框架
工作階段或取代過時的 Codex 執行緒繫結時，會計算執行緒應用程式設定；不會在
每一輪都重新計算。變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動
閘道，讓未來的 Codex 測試框架工作階段以更新後的應用程式
集合啟動。

如需遷移資格、應用程式清單、破壞性動作政策、
資訊請求與原生外掛診斷的資訊，請參閱
[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的應用程式與外掛存取權由登入的 Codex
帳戶控制；對 Business 與 Enterprise/Edu 工作區而言，也由工作區應用程式
控制項管理。請參閱
[搭配 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
以瞭解 OpenAI 的帳戶與工作區控制概覽。

## 電腦操作

電腦操作有其專屬設定指南：
[Codex 電腦操作](/zh-TW/plugins/codex-computer-use)。

簡而言之：OpenClaw 不會內建桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex app-server、確認
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式輪次期間負責原生
MCP 工具呼叫。

## 執行階段邊界

Codex 測試框架只會變更低階嵌入式代理程式執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行
  這些工具，因此 OpenClaw 仍在執行路徑中。
- Codex 原生 shell、修補、MCP 與原生應用程式工具由 Codex 負責。
  OpenClaw 可透過
  支援的轉送機制觀察或阻擋選定的原生事件，但不會重寫原生工具引數。
- Codex 負責原生壓縮。OpenClaw 會為
  頻道歷程、搜尋、`/new`、`/reset`，以及未來的模型或測試框架
  切換保留逐字稿鏡像，但不會以 OpenClaw 或
  上下文引擎摘要器取代 Codex 壓縮。
- 媒體產生、媒體理解、TTS、核准與訊息工具
  輸出會繼續使用相符的 OpenClaw 供應商／模型設定。
- `tool_result_persist` 適用於 OpenClaw 所擁有的逐字稿工具結果，
  不適用於 Codex 原生工具結果記錄。

如需鉤點層、支援的 V1 介面、原生權限處理、佇列
導向、Codex 意見回饋上傳機制與壓縮詳細資訊，請參閱
[Codex 測試框架執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般 `/model` 供應商：**新
設定的預期行為。請選擇 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用內建測試框架而非 Codex：**請確認生效的
路由是完全相符的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由、
沒有自行撰寫的要求覆寫，並確認 Codex 外掛已安裝且
啟用。只有 `openai/gpt-*` 前綴並不足夠。若要在
測試時取得嚴格證明，請設定供應商或模型 `agentRuntime.id: "codex"`；當路由或測試框架不相容時，強制使用 Codex 會
失敗，而不會改用備援路徑。

**OpenAI Codex 執行階段改用 API 金鑰路徑：**請收集經過遮蔽的
閘道摘錄，其中須顯示模型、執行階段、選定的供應商與
失敗資訊。請受影響的協作者在其
OpenClaw 主機上執行以下唯讀命令：

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

**舊版 Codex 模型參照設定仍然存在：** 執行 `openclaw doctor --fix`。
Doctor 會將舊版模型參照改寫為 `openai/*`、移除過時的工作階段與
整個代理程式執行階段固定設定，並保留現有的驗證設定檔覆寫。

**應用程式伺服器遭到拒絕：** 使用 `0.143.0` 中的穩定版 Codex 應用程式伺服器，
搭配內建的 `0.144.6`。預發行版本、含建置後綴的版本，以及較新但
尚未驗證的發行版本都會遭到拒絕，因為 OpenClaw 會根據內建的應用程式伺服器版本
驗證產生的結構描述。

**`/codex status` 無法連線：** 檢查 `codex` 外掛
是否已啟用、設定允許清單時 `plugins.allow` 是否包含該外掛，以及任何自訂的
`appServer.command`、`url`、`authToken` 或
標頭是否有效。

**Codex 應用程式伺服器使用過多記憶體：** 請先區分這兩個處理程序。
OpenClaw 會將本機 Codex 應用程式伺服器作為獨立的 Rust 子處理程序執行。
`NODE_OPTIONS=--max-old-space-size=...` 只會變更閘道的 Node.js V8
堆積；它不會限制或擴大 Codex。受管理的閘道安裝已經會選擇
自適應 V8 堆積，而提高該值可能會減少 Codex 可用的主機記憶體。若要處理閘道壓力，請參閱
[閘道記憶體疑難排解](/zh-TW/gateway/troubleshooting#gateway-exits-during-high-memory-use)，
並檢查 Codex 子處理程序的主機或容器記憶體。

內建的 Codex 沒有堆積或 RSS 限制，也沒有可設定的閒置卸載
延遲。最後一個用戶端取消訂閱後，非作用中的執行緒最多仍可載入
30 分鐘。在資源受限的主機上，請先減少原生 Codex 子代理程式的扇出數量，
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

此設定會限制內建 Codex 預設多代理程式後端的原生子執行緒。
如果你明確啟用 Codex 多代理程式 v2，請改用
`features.multi_agent_v2.max_concurrent_threads_per_session=3`；v2
限制包含根執行緒，且不能與 `agents.max_threads` 合併使用。
若要為 Codex 提供更多餘裕，請增加主機、容器或 cgroup 的記憶體
配置。作業系統的硬性限制可能會直接終止 Codex，而不是對其施加反壓。

**模型探索速度很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。
請參閱 [Codex 操控框架參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：** 檢查 `appServer.url`、
`authToken`、標頭，以及遠端應用程式伺服器是否使用相同版本的 Codex
應用程式伺服器通訊協定。Codex WebSocket 傳輸仍處於實驗階段，
且不受支援；請優先使用受管理的 stdio 或本機 Unix 控制通訊端。

**原生 shell 或修補工具遭 `Native hook relay
unavailable` 封鎖：** Codex 執行緒仍嘗試使用
OpenClaw 已不再註冊的原生掛鉤中繼
識別碼。這是原生 Codex 掛鉤
傳輸問題，不是 ACP 後端、供應商、GitHub 或 shell 命令
失敗。請在受影響的聊天中使用 `/new` 或 `/reset` 啟動新的工作階段，
然後重試一個無害的命令。如果這次成功，但下一次原生工具
呼叫又失敗，請只將 `/new` 視為暫時的因應措施：重新啟動 Codex 應用程式伺服器或
OpenClaw 閘道後，將提示複製到新的工作階段，
使舊執行緒被捨棄並重新建立原生掛鉤註冊。

**Codex 工具呼叫建立了過多短期掛鉤處理程序：** 設定
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
並重新啟動閘道。這只會停用用於 OpenClaw 迴圈偵測及其無原則標記的 Codex
`PreToolUse` 子處理程序。
必要的 `before_tool_call` 與受信任工具原則中繼仍會保持啟用。

**非 Codex 模型使用內建操控框架：** 除非供應商或模型執行階段原則
將其路由至其他操控框架，否則這是預期行為。在 `auto` 模式下，
一般的非 OpenAI 供應商參照會維持其正常供應商路徑。

**Computer Use 已安裝，但工具未執行：** 從新的工作階段檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請使用上述原生掛鉤中繼復原方式。
請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關內容

- [Codex 操控框架參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 操控框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督](/zh-TW/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [模型供應商](/zh-TW/concepts/model-providers)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [OpenAI Codex 說明](https://help.openai.com/en/collections/14937394-codex)
- [代理程式操控框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [外掛掛鉤](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
