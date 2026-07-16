---
read_when:
    - 你想要使用官方 Codex app-server 測試框架
    - 你需要 Codex 執行框架的設定範例
    - 你希望僅使用 Codex 的部署在失敗時直接終止，而不是回退至 OpenClaw
summary: 透過官方 Codex app-server 測試框架執行 OpenClaw 內嵌代理程式回合
title: Codex 控制框架
x-i18n:
    generated_at: "2026-07-16T11:50:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

官方的 `codex` 外掛透過 Codex
app-server 執行內嵌的 OpenAI 代理程式回合，而非使用內建的 OpenClaw 執行框架。Codex 負責
底層代理程式工作階段：原生執行緒續接、原生工具續行、
原生壓縮，以及 app-server 執行。OpenClaw 仍負責聊天
頻道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、
媒體傳遞，以及可見的逐字稿鏡像。

請使用標準 OpenAI 模型參照，例如 `openai/gpt-5.6-sol`。請勿設定
舊版 Codex GPT 參照；請將 OpenAI 代理程式驗證順序放在 `auth.order.openai` 下。
舊版 Codex 驗證設定檔 ID 與舊版 Codex 驗證順序項目會由
`openclaw doctor --fix` 修復。

當提供者／模型執行階段原則未設定或為 `auto` 時，僅有 `openai/*` 前綴
絕不會選擇此執行框架。僅當路由是確切的官方 HTTPS Platform Responses 或 ChatGPT Responses，
且沒有自行設定的要求覆寫時，OpenAI 才可能隱式選擇 Codex。請參閱
[OpenAI 隱式代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。
若在確定要使用 Platform 或 ChatGPT 路由之前，Codex 已取得驗證所有權，OpenClaw
仍會要求每個候選路由宣告與 Codex 相容。僅有原生
驗證所有權絕不會略過該路由檢查。

未啟用 OpenClaw 沙箱時，OpenClaw 會以啟用 Codex 原生程式碼模式的方式啟動
Codex app-server 執行緒（預設仍不啟用僅限程式碼模式），因此
原生工作區／程式碼功能可與透過 app-server `item/tool/call` 橋接器路由的 OpenClaw
動態工具並用。啟用中的 OpenClaw 沙箱或受限制的工具原則會完全停用原生程式碼模式，
除非你選擇加入實驗性的沙箱 exec-server 路徑。

使用預設的 `tools.exec.host: "auto"` 且未啟用 OpenClaw 沙箱時，
Codex 也會收到 `node_exec` 與 `node_process` 工具，以便在已配對的
節點上執行命令。原生 shell 仍位於 Codex app-server 主機與工作區
（預設 stdio 部署為閘道本機）；`node_exec` 可依
名稱或 ID 選取節點，且會繼續套用 OpenClaw 的節點核准原則。若有限的
執行階段允許清單停用原生程式碼模式，導致該回合沒有
執行環境，OpenClaw 會改為保留經原則篩選的 `exec` 與 `process`
工具，以供直接、不受沙箱限制地執行。

此 Codex 原生功能與
[OpenClaw 程式碼模式](/zh-TW/reference/code-mode)不同；後者是選用的 QuickJS-WASI 執行階段，
供一般 OpenClaw 執行使用，且具有不同的 `exec` 輸入形式。如需瞭解
更完整的模型／提供者／執行階段區分，請先閱讀
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)：`openai/gpt-5.6-sol` 是模型
參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他
頻道則是通訊介面。

## 需求

- 已安裝官方 `@openclaw/codex` 外掛。若你的設定使用允許清單，請在
  `plugins.allow` 中包含 `codex`。
- Codex app-server `0.143.0` 或更新版本。該外掛預設會管理相容的
  二進位檔，因此 `PATH` 上的 `codex` 命令不會影響一般
  啟動。
- 透過 `openclaw models auth login --provider openai` 使用 Codex 驗證、代理程式的 Codex 主目錄中
  已有的 app-server 帳號，或明確的 Codex API 金鑰驗證設定檔。

如需瞭解驗證優先順序、環境隔離、自訂 app-server 命令、
模型探索及完整設定欄位清單，請參閱
[Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 快速入門

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

若你的設定使用 `plugins.allow`，也請在其中加入 `codex`：

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

變更外掛設定後，請重新啟動閘道。若聊天已有
工作階段，請先執行 `/new` 或 `/reset`，讓下一個回合依目前設定解析
執行框架。

## 與 Codex Desktop 和命令列介面共用執行緒

預設的 `appServer.homeScope: "agent"` 會將每個 OpenClaw 代理程式與
操作者的原生 Codex 狀態隔離。若要讓擁有者檢查及管理
Codex Desktop 和 Codex 命令列介面所顯示的相同原生執行緒，請選擇使用
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

使用者主目錄模式支援本機受管理的 stdio 處理程序或共用 Unix socket
傳輸。若已設定 `$CODEX_HOME`，便使用該值，否則使用 `~/.codex`，包括
該主目錄中的原生 Codex 驗證、設定、外掛及執行緒儲存區。OpenClaw 不會
將 OpenClaw 驗證設定檔注入此 app-server。

擁有者回合會取得 `codex_threads` 工具：列出、搜尋、讀取、分支、重新命名、
封存及還原原生執行緒。分支執行緒即可在
OpenClaw 中繼續；分支會附加至目前的 OpenClaw 工作階段，並持續
對其他原生 Codex 用戶端可見。封存時必須明確
確認該執行緒已在其他位置關閉。若也啟用了監督功能，
逐字稿欄位與異動需選擇加入相應的
`supervision.allowRawTranscripts` 或 `supervision.allowWriteControls`。

請勿透過不同的受管理 stdio App Server，同時續接或寫入同一個執行緒。
Codex 只會在單一 App Server 內協調即時寫入者，不會
跨不同處理程序協調。對一般使用者主目錄 stdio 工作階段而言，分支是安全的
共存方式。

僅設定 `appServer.homeScope: "user"` 無法控制執行個體群目錄。外掛啟用期間，
原生工作階段探索功能也會啟用；請設定
`sessionCatalog.enabled: false`，將其從 OpenClaw 側邊欄移除，而不
停用 Codex。該目錄使用獨立的監督連線；若未明確設定
`appServer` 連線設定，該連線預設使用受管理的
使用者主目錄 stdio，而一般執行框架則維持代理程式範圍。兩條路徑都會遵循明確的
`appServer` 設定。若一般執行框架也應共用原生狀態，
請如上所示明確設定 `homeScope: "user"`。

## 監督 Codex 工作階段

相同的 `codex` 外掛可列出閘道電腦與已選擇加入的配對節點中
未封存的 Codex 工作階段。已儲存或閒置的閘道本機工作階段可
建立鎖定模型的聊天，鏡像其有界限的持久化使用者與助理
歷史記錄。其私有繫結會使用監督連線取得原生
快照、標準分支及後續回合，而一般 Codex 工作階段仍維持
代理程式範圍。第一次從標準分支啟動時，會完全使用 Codex
針對快照分支所傳回的模型與提供者。後續續接會交由 Codex 的
原生設定選擇；外層 OpenClaw 模型與備援鏈絕不會取代
該設定。明確確認沒有其他執行器後，即可封存已儲存與閒置的資料列。
使用中的來源無法建立分支或封存；但仍可開啟現有的
受監督聊天。配對節點工作階段仍僅提供中繼資料。

請參閱[監督 Codex 工作階段](/zh-TW/plugins/codex-supervision)，瞭解設定、分支
規則、配對節點限制、中繼資料揭露及疑難排解。

## 設定

| 需求                                                | 設定                                                                                              | 位置                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 啟用執行框架                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 設定                    |
| 隱藏原生 Codex 工作階段探索                 | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Codex 外掛設定                |
| 保留允許清單中的外掛安裝                  | 在 `plugins.allow` 中包含 `codex`                                                               | OpenClaw 設定                    |
| 允許符合資格的 OpenAI 回合隱式使用 Codex | 確切的官方 HTTPS Responses／ChatGPT 路由、沒有自行設定的要求覆寫、執行階段未設定／`auto` | OpenAI 提供者／模型設定       |
| 使用 ChatGPT／Codex OAuth 登入                    | `openclaw models auth login --provider openai`                                                   | 命令列介面驗證設定檔                   |
| 為 Codex 執行新增 API 金鑰備援                   | 在 `auth.order.openai` 中，將 `openai:*` API 金鑰設定檔列於訂閱驗證之後                 | 命令列介面驗證設定檔 + OpenClaw 設定 |
| Codex 無法使用時以封閉方式失敗               | 提供者或模型 `agentRuntime.id: "codex"`                                                     | OpenClaw 模型／提供者設定     |
| 使用直接 OpenAI API 流量                       | 提供者或模型 `agentRuntime.id: "openclaw"` 搭配一般 OpenAI 驗證                          | OpenClaw 模型／提供者設定     |
| 調整 app-server 行為                            | `plugins.entries.codex.config.appServer.*`                                                       | Codex 外掛設定                |
| 啟用原生 Codex 外掛應用程式                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex 外掛設定                |
| 啟用 Codex Computer Use                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex 外掛設定                |

如需採用訂閱優先、API 金鑰備援的順序，建議使用 `auth.order.openai`。
現有舊版 Codex 驗證設定檔 ID 與舊版 Codex 驗證順序是
僅供 doctor 處理的舊版狀態；請勿寫入新的舊版 Codex GPT 參照。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

對與 Codex 相容的有效路由而言，上述兩個設定檔都是同一次 Codex 執行的
候選項目。設定檔順序選擇的是認證資訊，而非執行階段。
變更驗證順序不會使自訂、Completions、HTTP 或
已覆寫要求的路由變得與 Codex 相容。

### 壓縮

請勿在 Codex 支援的代理程式上設定 `compaction.model` 或 `compaction.provider`。
Codex 透過其原生 app-server 執行緒狀態進行壓縮，因此
OpenClaw 會在執行階段忽略這些本機摘要器覆寫，而且
當代理程式使用 Codex 時，`openclaw doctor --fix` 會將其移除。

Lossless 仍支援做為脈絡引擎，用於 Codex 回合前後的組裝、擷取及
維護；應透過
`plugins.slots.contextEngine: "lossless-claw"` 和
`plugins.entries.lossless-claw.config.summaryModel` 設定，而非透過
`agents.defaults.compaction.provider`。當 Codex 是使用中的執行階段時，`openclaw doctor --fix` 會將
舊版 `compaction.provider: "lossless-claw"` 形式遷移至 Lossless
脈絡引擎欄位，但壓縮仍由原生 Codex 負責。原生 app-server 執行框架支援
需要提示前組裝的脈絡引擎；包括 `codex-cli` 在內的一般命令列介面後端
不提供該主機功能。

對 Codex 支援的代理程式而言，`/compact` 會在繫結的執行緒上啟動原生 Codex app-server
壓縮。OpenClaw 不會等待其完成、
套用 OpenClaw 逾時、重新啟動共用 app-server，也不會退回使用
脈絡引擎或公開 OpenAI 摘要器。若原生 Codex 執行緒
繫結缺失或過期，該命令將以封閉方式失敗，而不會悄悄
切換壓縮後端。

本頁其餘內容涵蓋部署形式、以封閉方式失敗的路由、守護者
核准原則、原生 Codex 外掛及 Computer Use。如需完整選項
清單、預設值、列舉、探索、環境隔離、逾時及
app-server 傳輸欄位，請參閱
[Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex 執行階段

在預期使用 Codex 的聊天中使用 `/status`。由 Codex 支援的 OpenAI
代理程式回合會顯示：

```text
執行階段：OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線能力、帳戶、速率限制、MCP
伺服器和 Skills。`/codex models` 會列出供工具框架和帳戶使用的即時 Codex app-server 目錄。如果 `/status` 的結果不如預期，請參閱
[疑難排解](#troubleshooting)。

## 路由與模型選擇

將供應商參照與執行階段政策分開：

- 使用 `openai/gpt-*` 進行標準 OpenAI 模型選擇。僅有前綴
  絕不會選擇 Codex。
- 當執行階段未設定或為 `auto` 時，只有未包含自行撰寫的要求覆寫，且完全符合官方 HTTPS Platform Responses
  或 ChatGPT Responses 的路由，才可隱含選擇 Codex。
- 請勿在設定中使用舊版 Codex GPT 參照；執行 `openclaw doctor --fix` 以
  修復舊版參照和過時的工作階段路由固定設定。
- `agentRuntime.id: "codex"` 會讓 Codex 成為相容路由的
  失敗即關閉要求。它不會讓不相容的有效路由變得相容。
- `agentRuntime.id: "openclaw"` 會在有意如此設定時，讓供應商或模型選用內嵌的
  OpenClaw 執行階段。
- `/codex ...` 會從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部工具框架路徑。只有當使用者要求 ACP/acpx 或外部工具框架介接器時才使用它。

| 使用者意圖                                                | 使用                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前的聊天                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 恢復現有的 Codex 執行緒                            | `/codex resume <thread-id>`                                                                           |
| 列出或篩選 Codex 執行緒                               | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 外掛                                  | `/codex plugins list`                                                                                 |
| 啟用或停用已設定的原生 Codex 外掛         | `/codex plugins enable <name>`、`/codex plugins disable <name>`                                       |
| 將已儲存的 Codex 命令列介面工作階段恢復為配對節點回合    | `/codex sessions --host <node> [filter]`，接著使用 `/codex resume <session-id> --host <node> --bind here` |
| 檢視跨電腦的未封存 Codex 工作階段          | 啟用 Codex 監督並開啟 **Codex 工作階段**                                                  |
| 變更已繫結執行緒的模型、快速模式或權限 | `/codex model <model>`、`/codex fast [on\|off\|status]`、`/codex permissions [default\|yolo\|status]` |
| 停止或引導進行中的回合                              | `/codex stop`、`/codex steer <text>`                                                                  |
| 中斷目前的繫結                                 | `/codex detach`（別名為 `/codex unbind`）                                                               |
| 僅傳送 Codex 意見回饋                                   | `/codex diagnostics [note]`                                                                           |
| 啟動 ACP/acpx 任務                                     | ACP/acpx 工作階段命令，而非 `/codex`                                                               |

| 使用案例                                        | 設定                                                                                                   | 驗證                                  | 備註                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| 使用原生 Codex 執行階段的合格 OpenAI 路由 | 完全符合官方 HTTPS Responses/ChatGPT 的路由，沒有自行撰寫的要求覆寫，並啟用 `codex` 外掛 | `/status` 顯示 `Runtime: OpenAI Codex` | 執行階段未設定或為 `auto` 時使用的隱含路徑 |
| Codex 無法使用時失敗即關閉             | 供應商或模型 `agentRuntime.id: "codex"`                                                                | 回合失敗，而非退回內嵌執行階段 | 用於僅限 Codex 的部署             |
| 透過 OpenClaw 傳送直接 OpenAI API 金鑰流量  | 供應商或模型 `agentRuntime.id: "openclaw"`，以及一般 OpenAI 驗證                                      | `/status` 顯示 OpenClaw 執行階段        | 僅在有意使用 OpenClaw 時採用      |
| 舊版設定                                   | 舊版 Codex GPT 參照                                                                                       | `openclaw doctor --fix` 會將其重寫     | 請勿再以此方式撰寫新設定           |
| ACP/acpx Codex 介接器                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP 任務／工作階段狀態                 | 與原生 Codex 工具框架分開         |

`agents.defaults.imageModel` 採用相同的前綴區分方式。一般 OpenAI 路由使用 `openai/gpt-*`，
只有在影像理解應透過有界限的 Codex app-server 回合執行時，才使用 `codex/gpt-*`。Doctor 會將舊版
Codex GPT 參照重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

針對有效官方 HTTPS 路由符合隱含選擇 Codex 資格的 OpenAI 模型，使用快速入門設定：

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

保留 Claude 作為預設代理程式，並新增具名 Codex 代理程式：

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

`main` 代理程式使用其一般供應商路徑。當有效 OpenAI 路由維持相容時，`codex` 代理程式會使用 Codex
app-server；如果這應是失敗即關閉要求，請新增明確的模型範圍 `agentRuntime.id: "codex"`。

### 失敗即關閉的 Codex 部署

當隨附外掛可用時，完全符合官方 HTTPS 的合格 OpenAI 路由可解析至 Codex。針對書面定義的
失敗即關閉規則，新增明確的執行階段政策：

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

強制使用 Codex 時，若有效路由未宣告為
與 Codex 相容、外掛已停用、app-server 過舊，或
app-server 無法啟動，OpenClaw 會提前失敗。

## App-server 政策

預設情況下，外掛會使用 stdio 傳輸，在本機啟動由 OpenClaw 管理的 Codex 二進位檔。只有在有意執行不同的
可執行檔時，才設定 `appServer.command`。僅當其他位置已有執行中的 app-server 時，才使用 WebSocket 傳輸：

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

本機 stdio app-server 工作階段預設採用受信任的本機操作者
安全立場：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本機 Codex 要求不允許這種
隱含的 YOLO 安全立場，OpenClaw 會改為選擇允許的守護者權限。
當 OpenClaw 沙箱在工作階段中啟用時，OpenClaw
會針對該回合停用 Codex 原生程式碼模式、使用者 MCP 伺服器，以及應用程式支援的外掛執行，而非依賴 Codex 主機端沙箱。
Shell 存取會改為透過 OpenClaw 沙箱支援的動態工具，例如
`sandbox_exec` 和 `sandbox_process`，前提是一般 exec/process 工具
可用。

在沙箱跳脫或額外權限之前，對 Codex 原生自動審查使用標準化的 OpenClaw exec 模式：

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
守護者審查的核准：當本機要求允許這些值時，通常為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不會保留舊版不安全的 Codex `approvalPolicy: "never"` 或
`sandbox: "danger-full-access"` 覆寫；若要有意採用 Codex 不需核准的安全立場，請使用 `tools.exec.mode: "full"`。舊版
`plugins.entries.codex.config.appServer.mode: "guardian"` 預設集仍然
有效，但 `tools.exec.mode: "auto"` 是標準化的 OpenClaw 介面。

如需與主機 exec 核准和 ACPX
權限進行模式層級比較，請參閱[權限模式](/zh-TW/tools/permission-modes)。如需了解每個
app-server 欄位、驗證順序、環境隔離和逾時行為，請參閱
[Codex 工具框架參考](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

`codex` 外掛會在任何支援 OpenClaw 文字命令的頻道上，將 `/codex` 註冊為斜線命令。

原生執行與控制需要擁有者或 `operator.admin`
閘道用戶端：包括繫結或恢復執行緒、傳送或停止回合、
變更模型、快速模式或權限狀態、壓縮或審查，以及
中斷繫結。其他獲授權的傳送者僅能使用唯讀的狀態、說明、
帳戶、模型、執行緒、MCP 伺服器、Skill 和繫結檢查命令。

常見形式：

- `/codex status` 會檢查 app-server 連線能力、模型、帳戶、速率
  限制、MCP 伺服器和 Skills。
- `/codex models` 會列出即時 Codex app-server 模型。
- `/codex threads [filter]` 會列出最近的 Codex app-server 執行緒。
- `/codex resume <thread-id>` 會將目前 OpenClaw 工作階段附加至
  現有 Codex 執行緒。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  會附加目前的聊天。
- `/codex detach`（或 `/codex unbind`）會中斷目前的繫結。
- `/codex binding` 會說明目前的繫結。
- `/codex stop` 會停止進行中的回合；`/codex steer <text>` 會引導該回合。
- `/codex model <model>`、`/codex fast [on|off|status]` 和
  `/codex permissions [default|yolo|status]` 會變更各對話的狀態。
- `/codex compact` 會要求 Codex app-server 壓縮已附加的執行緒。
- `/codex review` 會針對已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在針對已附加的執行緒傳送 Codex 意見回饋前詢問。
- `/codex account` 會顯示帳戶和速率限制狀態。
- `/codex mcp` 會列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 會列出 Codex app-server Skills。
- `/codex plugins list`、`/codex plugins enable <name>` 和
  `/codex plugins disable <name>` 會管理已設定的原生 Codex 外掛。
- `/codex computer-use [status|install]` 會管理 Codex 電腦操作。
- `/codex help` 會列出完整的命令樹。

對於大多數支援回報，請從發生錯誤的對話中使用 `/diagnostics [note]`。它會建立一份閘道診斷報告，並且對於 Codex 控制框架工作階段，要求核准傳送相關的 Codex 意見回饋套件。關於隱私權模型與群組聊天行為，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。只有在你明確想要上傳目前附加討論串的 Codex 意見回饋，而不需要完整閘道診斷套件時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 討論串

檢查異常 Codex 執行最快的方式，通常是直接開啟原生 Codex 討論串：

```bash
codex resume <thread-id>
```

請從已完成的 `/diagnostics` 回覆、`/codex binding` 或 `/codex threads [filter]` 取得討論串 ID。

關於上傳機制與執行階段層級的診斷界線，請參閱 [Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

### 驗證順序

在預設的每代理程式主目錄中，驗證會依下列順序選取：

1. 代理程式的已排序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 之下。執行 `openclaw doctor --fix`，以遷移較舊的舊版
   Codex 驗證設定檔 ID 與舊版 Codex 驗證順序。
2. 該代理程式 Codex 主目錄中 app-server 的現有帳號。
3. 僅限本機 stdio app-server 啟動：當 app-server 帳號不存在且仍需要 OpenAI 驗證時，依序使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱型 Codex 驗證設定檔時，會從產生的 Codex 子處理程序中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。如此可讓閘道層級的 API 金鑰繼續用於嵌入或直接 OpenAI 模型，同時避免原生 Codex app-server 回合意外透過 API 計費。明確的 Codex API 金鑰設定檔與本機 stdio 環境金鑰備援會使用 app-server 登入，而非繼承的子處理程序環境。WebSocket app-server 連線不會收到閘道環境的 API 金鑰備援；請使用明確的驗證設定檔或遠端 app-server 自有的帳號。

如果訂閱設定檔達到 Codex 使用量限制，OpenClaw 會在 Codex 回報重設時間時記錄該時間，並針對同一次 Codex 執行嘗試下一個已排序的驗證設定檔。重設時間過後，訂閱設定檔會再次符合使用資格，而不會變更所選的 `openai/gpt-*` 模型或 Codex 執行階段。

設定原生 Codex 外掛時，OpenClaw 會先透過已連線的 app-server 安裝或重新整理這些外掛，再將外掛擁有的應用程式公開給 Codex 討論串。`app/list` 仍是應用程式 ID、可存取性與中繼資料的事實來源，但 OpenClaw 負責決定每個討論串的啟用狀態：如果政策允許列出的可存取應用程式，即使 `app/list` 目前回報該應用程式已停用，OpenClaw 仍會傳送 `thread/start.config.apps[appId].enabled = true`。此路徑不會為未知 ID 虛構應用程式安裝；OpenClaw 只會使用 `plugin/install` 啟用市集外掛，然後重新整理清單。

### 環境隔離

對於本機 stdio app-server 啟動，OpenClaw 會將 `CODEX_HOME` 設為每代理程式目錄，使 Codex 設定、驗證／帳號檔案、外掛快取／資料與原生討論串狀態預設不會讀取或寫入操作人員的個人 `~/.codex`。OpenClaw 會保留一般處理程序的 `HOME`；Codex 執行的子處理程序仍可找到使用者主目錄中的設定與權杖，而 Codex 也可能探索共用的 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 項目。使用 `appServer.homeScope: "user"` 時，OpenClaw 會改用原生使用者 Codex 主目錄及其現有帳號，而不注入 OpenClaw 驗證設定檔。

如果部署需要額外的環境隔離，請將這些變數加入 `appServer.clearEnv`：

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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子處理程序。OpenClaw 會在本機啟動正規化期間，從此清單移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 會繼續指向所選的代理程式或使用者範圍，而 `HOME` 會繼續被繼承，讓子處理程序能使用一般的使用者主目錄狀態。

### 動態工具與網頁搜尋

Codex 動態工具預設採用 `searchable` 載入。OpenClaw 通常不會公開與 Codex 原生工作區操作重複的動態工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、`tool_call`、`tool_describe`、`tool_search` 和 `tool_search_code`。其餘大多數 OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、閘道和 `heartbeat_respond`，都可透過 `openclaw` 命名空間下的 Codex 工具搜尋取得，藉此縮小初始模型脈絡。當有限允許清單停用原生程式碼模式時，受限回合的 shell 備援是 `exec` 和 `process` 的例外；執行階段允許清單與 `codexDynamicToolsExclude` 仍然適用。

標示為 `catalogMode: "direct-only"` 的工具（包括 OpenClaw `computer` 工具）會改用 `openclaw_direct` 命名空間。Codex 會將該命名空間視為 `DirectModelOnly`，因此這些工具在一般與僅程式碼模式討論串中會維持對模型直接可見，而不會經過巢狀程式碼模式的 `tools.*` 呼叫。

啟用搜尋且未選取受管理提供者時，網頁搜尋預設使用 Codex 託管的 `web_search` 工具。原生託管搜尋與 OpenClaw 受管理的 `web_search` 動態工具互斥，因此受管理搜尋無法略過原生網域限制。當託管搜尋無法使用、遭明確停用或由所選受管理提供者取代時，OpenClaw 會使用受管理工具。OpenClaw 會保持停用 Codex 的獨立 `web.run` 擴充功能，因為正式環境的 app-server 流量會拒絕其使用者定義的 `web` 命名空間。`tools.web.search.enabled: false` 會停用兩條路徑，停用工具的純 LLM 執行亦同。Codex 將 `"cached"` 視為偏好設定，並將其解析為不受限 app-server 回合的即時外部存取。設定原生 `allowedDomains` 時，自動受管理備援會以封閉方式失敗，以免略過允許清單。持續生效的搜尋政策變更會在下一回合前輪替繫結的 Codex 討論串；暫時性的每回合限制則使用臨時受限討論串，並保留現有繫結供稍後繼續。

`sessions_yield` 與僅訊息工具的來源回覆會維持直接處理，因為這些屬於回合控制合約。`sessions_spawn` 會維持可搜尋，使 Codex 原生的 `spawn_agent` 繼續作為主要 Codex 子代理程式介面；同時，仍可透過 `openclaw` 動態工具命名空間明確委派給 OpenClaw 或 ACP。心跳偵測協作指示會要求 Codex 在工具尚未載入時，於結束心跳偵測回合前搜尋 `heartbeat_respond`。

只有在連線至無法搜尋延後動態工具的自訂 Codex app-server，或偵錯完整工具承載資料時，才設定 `codexDynamicToolsLoading: "direct"`。

### 設定欄位

支援的頂層 Codex 外掛欄位：

| 欄位                       | 預設值         | 含義                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"`，將 OpenClaw 動態工具直接放入初始 Codex 工具脈絡。 |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server 回合省略的其他 OpenClaw 動態工具名稱。              |
| `codexPlugins`             | 已停用       | 對已遷移、由原始碼安裝的精選外掛提供原生 Codex 外掛／應用程式支援。           |
| `sessionCatalog`           | 已啟用        | 探索此閘道與符合資格之配對節點上的原生 Codex 工作階段側邊欄。   |
| `supervision`              | 已停用       | 面向代理程式的原生工作階段文字記錄與寫入控制政策。                         |

支援的 `appServer` 欄位：

| 欄位                                         | 預設值                                                | 意義                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；明確指定 `"unix"` 會連線至本機控制通訊端；`"websocket"` 會連線至 `url`。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依各 OpenClaw 代理程式隔離一般控制框架狀態。`"user"` 是明確的選擇加入設定，會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍支援本機 stdio 或 Unix 傳輸。對於獨立的監督連線，未設定的值在 stdio 或 Unix 下會解析為 `"user"`，在 WebSocket 下則會解析為 `"agent"`。     |
| `command`                                     | 受管理的 Codex 二進位檔                                   | stdio 傳輸使用的可執行檔。保留未設定即可使用受管理的二進位檔；僅在需要明確覆寫時設定。                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket App Server URL 或 `unix://` URL。明確指定空白的 Unix 路徑時，會選用標準的使用者家目錄控制通訊端。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                  | WebSocket 傳輸的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立繼承環境後，從所啟動的 stdio app-server 程序中移除的額外環境變數名稱。OpenClaw 會保留選定的 `CODEX_HOME` 及繼承的 `HOME`，供本機啟動使用。                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | 選擇加入 Codex 僅限程式碼模式的工具介面。一般 OpenClaw 動態工具仍可透過巢狀的 `tools.*` 呼叫使用；`openclaw_direct` 工具仍會直接對模型可見。                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從解析後的 OpenClaw 工作區推斷本機工作區根目錄、在此遠端根目錄下保留目前 cwd 的後綴，並僅將最終的 app-server cwd 傳送給 Codex。如果 cwd 位於解析後的 OpenClaw 工作區根目錄之外，OpenClaw 會採取封閉式失敗，而不會將閘道本機路徑傳送至遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一輪互動後，或在該輪範圍的 app-server 要求之後，OpenClaw 等待 `turn/completed` 時的靜默時間窗。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後的原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度防護。適用於受信任或高負載的工作負載，因為其工具後綜合處理可能合理地比最終助理釋出的時間預算維持更久的靜默。                                |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO | YOLO 或經守護者審查執行的預設集。若本機 stdio 要求省略 `danger-full-access`、`never` 核准或 `user` 審查者，隱含預設值會改為守護者。                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` 或允許的守護者核准政策       | 傳送至執行緒啟動、繼續或該輪互動的原生 Codex 核准政策。若允許，守護者預設值會優先採用 `"on-request"`。                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的守護者沙箱  | 傳送至執行緒啟動或繼續的原生 Codex 沙箱模式。若允許，守護者預設值會優先採用 `"workspace-write"`，否則採用 `"read-only"`。啟用 OpenClaw 沙箱時，`danger-full-access` 輪互動會使用 Codex `workspace-write`，其網路存取權取決於 OpenClaw 沙箱的輸出流量設定。                                                                                     |
| `approvalsReviewer`                           | `"user"` 或允許的守護者審查者               | 若允許，使用 `"auto_review"` 讓 Codex 審查原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未設定                                                  | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求彈性處理，`null` 會清除覆寫，而舊版 `"fast"` 會被接受並視為 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                               | 選擇加入 Codex 權限設定檔網路功能，供 app-server 命令使用。OpenClaw 會定義選定的 `permissions.<profile>.network` 設定，並以 `default_permissions` 選取該設定，而不是傳送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選擇加入功能，會在支援的 Codex app-server 中註冊由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行能在作用中的 OpenClaw 沙箱內運作。                                                                                                                                                                                                            |

`appServer.networkProxy` 必須明確設定，因為它會變更 Codex 沙箱
契約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設置 `features.network_proxy.enabled`
和 `default_permissions`，讓產生的
權限設定檔可以啟動 Codex 受管理網路功能。OpenClaw 預設會
根據設定檔內容產生具抗碰撞性的 `openclaw-network-<fingerprint>` 設定檔
名稱；僅在需要穩定的本機名稱時使用 `profileName`。

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
`networkProxy` 會讓產生的權限設定檔使用工作區式檔案系統存取：
Codex 受管理的網路強制執行採用沙箱化網路，因此完整存取設定檔無法保護
對外流量。網域項目使用 `allow` 或
`deny`；Unix 通訊端項目使用 Codex 的
`allow` 或 `none` 值。

### 動態工具呼叫逾時

OpenClaw 擁有的動態工具呼叫具有獨立於 `appServer.requestTimeoutMs` 的限制：
Codex `item/tool/call` 要求預設使用 90 秒的 OpenClaw 看門狗。
每次呼叫的正值 `timeoutMs` 引數可延長或縮短該次工具的時間預算，
上限為 600000 ms。當工具呼叫未提供自己的逾時值時，
`image_generate` 工具會使用 `agents.defaults.imageGenerationModel.timeoutMs`，否則會使用
120 秒的影像產生預設值。媒體理解 `image` 工具會使用
`tools.media.image.timeoutSeconds` 或其 60 秒媒體預設值；對於影像理解，該逾時值套用於
要求本身，不會因先前的準備工作而縮短。發生逾時時，OpenClaw 會在支援的
情況下中止工具訊號，並將失敗的動態工具回應傳回 Codex，讓該回合能繼續，
而不會使工作階段停留在 `processing`。此看門狗是外層動態
`item/tool/call` 預算；供應商特定的要求逾時會在該呼叫內執行，
並保有各自的逾時語意。

Codex 接受回合後，以及 OpenClaw 回應回合範圍的 app-server 要求後，
測試框架會預期 Codex 在目前回合中持續推進，並最終以
`turn/completed` 完成原生回合。如果 app-server 靜默達
`appServer.turnCompletionIdleTimeoutMs`，OpenClaw 會盡力中斷 Codex 回合、記錄診斷逾時，
並釋放 OpenClaw 工作階段通道，避免後續聊天訊息排在過時的原生回合之後。
同一回合的大多數非終止通知會解除這個短期看門狗，因為 Codex 已證明該回合
仍在運作。

工具交接使用較長的工具後閒置預算：在 OpenClaw 傳回
`item/tool/call` 回應之後、在 `commandExecution` 等原生工具項目
完成之後、在原始 `custom_tool_call_output` 完成之後，以及在工具後的原始助理
進度、原始推理完成或推理進度之後。若已設定，防護機制會使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則預設為五分鐘；相同預算也會延長進度看門狗，
以涵蓋 Codex 發出下一個目前回合事件前的靜默綜整時段。全域 app-server
通知（例如速率限制更新）不會重設回合閒置進度。推理完成、commentary
`agentMessage` 完成，以及工具前的原始推理或助理進度之後，
可能會自動接續最終回覆，因此它們會使用進度後回覆防護，而非立即釋放
工作階段通道。

只有最終／非 commentary 的已完成 `agentMessage` 項目，以及工具前
的原始助理完成，會啟動助理輸出釋放：如果 Codex 隨後在沒有
`turn/completed` 的情況下進入靜默，OpenClaw 會盡力中斷原生回合並
釋放工作階段通道。如果另一個回合監看機制搶先完成該釋放競爭，只要已無
原生要求、項目或動態工具完成仍在進行，且助理輸出釋放仍屬於最新完成的
項目，之後也沒有其他項目完成，OpenClaw 仍會接受已完成的最終助理項目。
這可在工具工作完成後保留最終答案，而無須重播回合。部分助理增量、
過時的先前回覆，以及後續的空白完成均不符合資格。

可安全重播的 stdio app-server 失敗，包括沒有助理、工具、作用中項目或
副作用證據的回合完成閒置逾時，會在全新的 app-server 嘗試中重試一次。
不安全的逾時仍會淘汰卡住的 app-server 用戶端並釋放 OpenClaw 工作階段
通道；它們也會清除過時的原生執行緒繫結，而不會自動重播。完成監看逾時會
顯示 Codex 特定的逾時文字：可安全重播的情況會指出回應可能不完整；
不安全的情況則會要求使用者在重試前確認目前狀態。公開逾時診斷包含結構化
欄位，例如最後一個 app-server 通知方法、原始助理回應項目的
id/type/role、作用中要求／項目數量，以及已啟動的監看狀態；當最後一個通知
是原始助理回應項目時，也會包含長度受限的助理文字預覽。它們不會包含原始
提示或工具內容。

### 本機測試環境覆寫

- `OPENCLAW_CODEX_APP_SERVER_BIN` 會在
  `appServer.command` 未設定時略過受管理的二進位檔。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性的本機測試中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於可重複的部署，建議使用設定，因為這能將外掛行為
與 Codex 測試框架其餘設定放在同一個經過審查的檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw 測試框架回合相同的 Codex 執行緒中，
使用 Codex app-server 自身的應用程式與外掛功能。OpenClaw 不會將 Codex
外掛轉換成合成的 `codex_plugin_*` OpenClaw 動態工具。

`codexPlugins` 僅影響選取原生 Codex 測試框架的工作階段。它不會影響
內建測試框架執行、一般 OpenAI 供應商執行、ACP 對話繫結或其他測試框架。

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
會計算執行緒應用程式設定；它不會在每個回合重新計算。變更
`codexPlugins` 後，請使用 `/new`、
`/reset`，或重新啟動閘道，讓未來的 Codex 測試框架工作階段
以更新後的應用程式集合啟動。

如需遷移資格、應用程式清單、破壞性動作政策、資訊徵詢與原生外掛診斷，
請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的應用程式與外掛存取權限由已登入的 Codex 帳號控制；對於
Business 與 Enterprise/Edu 工作區，還會受工作區應用程式控制項約束。
如需 OpenAI 的帳號與工作區控制概覽，請參閱
[搭配你的 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 電腦操作

電腦操作有其專屬設定指南：
[Codex 電腦操作](/zh-TW/plugins/codex-computer-use)。

簡而言之：OpenClaw 不會內建桌面控制應用程式，也不會自行執行桌面動作。
它會準備 Codex app-server、確認 `computer-use` MCP 伺服器可用，
然後讓 Codex 在 Codex 模式回合期間負責原生 MCP 工具呼叫。

## 執行階段邊界

Codex 測試框架只會變更底層的嵌入式代理程式執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行
  這些工具，因此 OpenClaw 仍位於執行路徑中。
- Codex 原生 shell、修補、MCP 與原生應用程式工具由
  Codex 負責。OpenClaw 可透過支援的轉送機制觀察或封鎖選定的原生事件，
  但不會重寫原生工具引數。
- Codex 負責原生壓縮。OpenClaw 會保留逐字記錄鏡像，
  用於頻道歷程記錄、搜尋、`/new`、`/reset`，
  以及未來的模型或測試框架切換，但不會使用 OpenClaw 或內容引擎摘要器
  取代 Codex 壓縮。
- 媒體產生、媒體理解、TTS、核准與訊息工具輸出，會繼續
  透過相符的 OpenClaw 供應商／模型設定處理。
- `tool_result_persist` 套用於 OpenClaw 擁有的逐字記錄
  工具結果，而非 Codex 原生工具結果記錄。

如需掛鉤層、支援的 V1 介面、原生權限處理、佇列導向、Codex 意見回饋上傳
機制與壓縮詳細資訊，請參閱
[Codex 測試框架執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般 `/model` 供應商：**這是新設定的預期
情況。請選取 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用內建測試框架而非 Codex：**請確認有效路由是完全相符的
官方 HTTPS Platform Responses 或 ChatGPT Responses 路由、沒有自行撰寫的
要求覆寫，且 Codex 外掛已安裝並啟用。僅有 `openai/gpt-*` 前綴並不足夠。
若要在測試期間取得嚴格證明，請設定供應商或模型
`agentRuntime.id: "codex"`；當路由或測試框架不相容時，強制 Codex 會失敗而非
退回備援。

**OpenAI Codex 執行階段退回 API 金鑰路徑：**請收集一段經過遮蔽處理的
閘道摘錄，其中需顯示模型、執行階段、選定的供應商與失敗情況。請受影響的
協作者在其 OpenClaw 主機上執行這個唯讀命令：

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

有用的摘錄通常包含 `openai/gpt-5.6-sol` 或 `openai/gpt-5.6-luna`、
`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、
`candidateProvider: "openai"`，以及 `401`、`Incorrect API key`
或 `No API key` 結果。修正後的執行應顯示 OpenAI OAuth 路徑，
而非一般的 OpenAI API 金鑰失敗。

**仍保留舊版 Codex 模型參照設定：**請執行 `openclaw doctor --fix`。
Doctor 會將舊版模型參照重寫為 `openai/*`、移除過時的工作階段與
整個代理程式執行階段固定設定，並保留現有的認證設定檔覆寫。

**app-server遭拒：**請使用 Codex app-server `0.143.0` 或更新版本。
相同版本的預發行版或含建置後綴的版本（例如 `0.143.0-alpha.2` 或
`0.143.0+custom`）會遭拒，因為 OpenClaw 會測試穩定版
`0.143.0` 通訊協定下限。

**`/codex status` 無法連線：**請檢查 `codex` 外掛是否已啟用、設定允許清單時 `plugins.allow` 是否包含該外掛，以及任何自訂 `appServer.command`、`url`、`authToken` 或標頭是否有效。

**模型探索速度緩慢：**降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。
請參閱 [Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：**請檢查 `appServer.url`、
`authToken`、標頭，以及遠端 app-server 是否使用相同版本的 Codex
app-server 通訊協定。

**原生 shell 或修補工具因 `Native hook relay
unavailable` 而遭封鎖：**Codex 執行緒仍在嘗試使用 OpenClaw 已不再註冊的原生掛鉤轉送
ID。這是原生 Codex 掛鉤
傳輸問題，並非 ACP 後端、供應商、GitHub 或 shell 命令
故障。請在受影響的聊天中使用 `/new` 或 `/reset` 啟動新工作階段，
然後重試無害的命令。如果該命令成功一次，但下一次原生工具
呼叫再次失敗，請僅將 `/new` 視為暫時性的因應措施：重新啟動 Codex app-server 或
OpenClaw 閘道後，將提示詞複製到新的工作階段，以便捨棄舊執行緒並重新建立原生掛鉤註冊。

**Codex 工具呼叫建立過多短期掛鉤處理程序：**請設定
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
並重新啟動閘道。這只會停用用於 OpenClaw 迴圈偵測及其無原則標記的 Codex `PreToolUse` 子處理程序。
必要的 `before_tool_call` 與受信任工具原則轉送仍會保持啟用。

**非 Codex 模型使用內建控制框架：**除非供應商或模型執行階段原則將其路由至其他控制框架，否則這是預期行為。在 `auto` 模式下，普通的非 OpenAI 供應商參照仍會使用其一般供應商路徑。

**Computer Use 已安裝，但工具無法執行：**請從新工作階段檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請使用上述原生掛鉤轉送復原方式。
請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關內容

- [Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督](/zh-TW/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [模型供應商](/zh-TW/concepts/model-providers)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [OpenAI Codex 說明](https://help.openai.com/en/collections/14937394-codex)
- [代理程式控制框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [外掛掛鉤](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
