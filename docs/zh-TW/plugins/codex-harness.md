---
read_when:
    - 你想要使用官方 Codex app-server 測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅部署 Codex 時直接失敗，而不是回退至 OpenClaw
summary: 透過官方 Codex app-server 測試框架執行 OpenClaw 內嵌代理程式回合
title: Codex 控制框架
x-i18n:
    generated_at: "2026-07-14T13:51:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 3e18f58b3013523b38a6491f7e36e88b270c87102def1451d26c1bee33802f81
    source_path: plugins/codex-harness.md
    workflow: 16
---

官方 `codex` 外掛透過 Codex app-server 執行內嵌的 OpenAI 代理程式回合，而非使用內建的 OpenClaw 執行框架。Codex 負責底層代理程式工作階段：原生執行緒續接、原生工具接續、原生壓縮，以及 app-server 執行。OpenClaw 仍負責聊天頻道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、媒體傳遞，以及可見的對話記錄鏡像。

請使用標準 OpenAI 模型參照，例如 `openai/gpt-5.6-sol`。請勿設定舊版 Codex GPT 參照；請將 OpenAI 代理程式的驗證順序放在 `auth.order.openai` 下。舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序項目會由 `openclaw doctor --fix` 修復。

當提供者／模型執行階段原則未設定或為 `auto` 時，僅有 `openai/*` 前綴絕不會選取此執行框架。只有在使用完全相符的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且沒有自行指定的要求覆寫時，OpenAI 才可能隱含選取 Codex。請參閱
[OpenAI 隱含代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。
如果在得知要使用 Platform 還是 ChatGPT 路由前，Codex 已取得驗證的所有權，OpenClaw 仍要求每個候選路由宣告與 Codex 相容。僅有原生驗證所有權絕不會略過該路由檢查。

當沒有啟用 OpenClaw 沙箱時，OpenClaw 會以啟用 Codex 原生程式碼模式的方式啟動 Codex app-server 執行緒（預設仍不啟用僅限程式碼模式），因此原生工作區／程式碼功能可與透過 app-server `item/tool/call` 橋接器路由的 OpenClaw 動態工具一併使用。除非你選擇啟用實驗性的沙箱 exec-server 路徑，否則啟用中的 OpenClaw 沙箱或受限工具原則會完全停用原生程式碼模式。

使用預設的 `tools.exec.host: "auto"` 且沒有啟用 OpenClaw 沙箱時，Codex 也會收到 `node_exec` 和 `node_process` 工具，以便在已配對的節點上執行命令。原生 shell 仍位於 Codex app-server 主機和工作區上（預設 stdio 部署中位於閘道本機）；`node_exec` 會依名稱或 ID 選取節點，並繼續強制執行 OpenClaw 的節點核准原則。

這項 Codex 原生功能不同於
[OpenClaw 程式碼模式](/zh-TW/reference/code-mode)；後者是選擇性啟用的 QuickJS-WASI 執行階段，用於一般 OpenClaw 執行，且具有不同的 `exec` 輸入格式。若要瞭解更廣泛的模型／提供者／執行階段劃分，請先參閱
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)：`openai/gpt-5.6-sol` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他頻道則是通訊介面。

## 需求

- 已安裝官方 `@openclaw/codex` 外掛。如果你的設定使用允許清單，請在
  `plugins.allow` 中加入 `codex`。
- Codex app-server `0.143.0` 或更新版本。外掛預設會管理相容的二進位檔，因此 `PATH` 上的 `codex` 命令不會影響正常啟動。
- 透過 `openclaw models auth login --provider openai` 進行 Codex 驗證、代理程式 Codex 主目錄中已有的 app-server 帳號，或明確的 Codex API 金鑰驗證設定檔。

如需驗證優先順序、環境隔離、自訂 app-server 命令、模型探索，以及完整設定欄位清單，請參閱
[Codex 執行框架參考資料](/zh-TW/plugins/codex-harness-reference)。

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

使用者主目錄模式支援本機受管理的 stdio 程序或共用 Unix socket 傳輸。設定 `$CODEX_HOME` 時會使用該位置，否則使用 `~/.codex`，包括該主目錄的原生 Codex 驗證、設定、外掛和執行緒儲存區。OpenClaw 不會將 OpenClaw 驗證設定檔注入此 app-server。

擁有者回合會取得 `codex_threads` 工具：列出、搜尋、讀取、分叉、重新命名、封存及還原原生執行緒。分叉執行緒即可在 OpenClaw 中繼續使用；分叉會附加至目前的 OpenClaw 工作階段，且其他原生 Codex 用戶端仍可看見。封存時必須明確確認該執行緒已在其他位置關閉。若也啟用了監督功能，對話記錄欄位和變更操作需要相符的 `supervision.allowRawTranscripts` 或 `supervision.allowWriteControls` 選擇性啟用設定。

請勿透過彼此獨立、受管理的 stdio App Server，同時續接或寫入同一個執行緒。Codex 只會協調同一個 App Server 內的即時寫入者，不會跨獨立程序協調。對於一般使用者主目錄 stdio 工作階段，分叉是安全並存的方式。

僅設定 `appServer.homeScope: "user"` 不會控制機群目錄。外掛啟用時會啟用原生工作階段探索；若要從 OpenClaw 側邊欄移除它而不停用 Codex，請設定 `sessionCatalog.enabled: false`。目錄會使用獨立的監督連線；如果沒有明確的 `appServer` 連線設定，該連線預設使用受管理的使用者主目錄 stdio，而一般執行框架仍維持代理程式範圍。兩條路徑都會採用明確的 `appServer` 設定。如上所示，當一般執行框架也應共用原生狀態時，請明確設定 `homeScope: "user"`。

## 監督 Codex 工作階段

相同的 `codex` 外掛可以列出閘道電腦和已選擇啟用之配對節點上的未封存 Codex 工作階段。已儲存或閒置的閘道本機工作階段可以建立鎖定模型的聊天，鏡像其有界且已保存的使用者和助理歷程。其私有繫結會使用監督連線取得原生快照、標準分支及後續回合，而一般 Codex 工作階段仍維持代理程式範圍。第一次從標準分支啟動時，會完全使用 Codex 為快照分叉傳回的模型和提供者。之後續接時，選擇權交由 Codex 的原生設定；外層 OpenClaw 模型和備援鏈絕不會取代它。明確確認沒有其他執行者後，即可封存已儲存和閒置的列。使用中的來源無法建立分支或封存；既有的受監督聊天仍可開啟。配對節點工作階段仍僅提供中繼資料。

如需設定、分支規則、配對節點限制、中繼資料揭露及疑難排解，請參閱[監督 Codex 工作階段](/zh-TW/plugins/codex-supervision)。

## 設定

| 需求                                                | 設定                                                                                              | 位置                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 啟用執行框架                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 設定                    |
| 隱藏原生 Codex 工作階段探索                 | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Codex 外掛設定                |
| 保留允許清單中的外掛安裝                  | 在 `plugins.allow` 中加入 `codex`                                                               | OpenClaw 設定                    |
| 允許符合資格的 OpenAI 回合隱含使用 Codex | 完全相符的官方 HTTPS Responses／ChatGPT 路由、沒有自行指定的要求覆寫，且執行階段未設定／`auto` | OpenAI 提供者／模型設定       |
| 使用 ChatGPT／Codex OAuth 登入                    | `openclaw models auth login --provider openai`                                                   | 命令列介面驗證設定檔                   |
| 為 Codex 執行新增 API 金鑰備援                   | 在 `auth.order.openai` 中，將 `openai:*` API 金鑰設定檔列於訂閱驗證之後                 | 命令列介面驗證設定檔 + OpenClaw 設定 |
| Codex 無法使用時採取封閉式失敗               | 提供者或模型 `agentRuntime.id: "codex"`                                                     | OpenClaw 模型／提供者設定     |
| 使用直接 OpenAI API 流量                       | 提供者或模型 `agentRuntime.id: "openclaw"`，搭配一般 OpenAI 驗證                          | OpenClaw 模型／提供者設定     |
| 調整 app-server 行為                            | `plugins.entries.codex.config.appServer.*`                                                       | Codex 外掛設定                |
| 啟用原生 Codex 外掛應用程式                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex 外掛設定                |
| 啟用 Codex Computer Use                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex 外掛設定                |

若要採用訂閱優先、API 金鑰備援的順序，建議使用 `auth.order.openai`。既有的舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序僅是由 doctor 處理的舊版狀態；請勿寫入新的舊版 Codex GPT 參照。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

對於實際上與 Codex 相容的路由，上述兩個設定檔都會繼續作為同一次 Codex 執行的候選項目。設定檔順序選擇的是認證資訊，而非執行階段。變更驗證順序不會讓自訂、Completions、HTTP 或具有要求覆寫的路由變得與 Codex 相容。

### 壓縮

請勿在由 Codex 支援的代理程式上設定 `compaction.model` 或 `compaction.provider`。Codex 會透過原生 app-server 執行緒狀態進行壓縮，因此 OpenClaw 會在執行階段忽略這些本機摘要器覆寫，且當代理程式使用 Codex 時，`openclaw doctor --fix` 會移除它們。

Lossless 仍可作為內容引擎使用，以處理 Codex 回合周邊的組裝、擷取和維護；請透過
`plugins.slots.contextEngine: "lossless-claw"` 和
`plugins.entries.lossless-claw.config.summaryModel` 設定，而非透過
`agents.defaults.compaction.provider`。當 Codex 是使用中的執行階段時，`openclaw doctor --fix` 會將舊的 `compaction.provider: "lossless-claw"` 格式遷移至 Lossless 內容引擎欄位，但壓縮仍由原生 Codex 負責。原生 app-server 執行框架支援需要在提示前組裝的內容引擎；包括 `codex-cli` 在內的一般命令列介面後端不提供該主機功能。

對於由 Codex 支援的代理程式，`/compact` 會在已繫結的執行緒上啟動原生 Codex app-server 壓縮。OpenClaw 不會等待其完成、不會施加 OpenClaw 逾時、不會重新啟動共用 app-server，也不會備援至內容引擎或公開 OpenAI 摘要器。如果原生 Codex 執行緒繫結遺失或已過期，該命令會採取封閉式失敗，而不是靜默切換壓縮後端。

本頁其餘內容涵蓋部署形式、封閉式失敗路由、監護核准原則、原生 Codex 外掛及 Computer Use。如需完整的選項清單、預設值、列舉值、探索、環境隔離、逾時和 app-server 傳輸欄位，請參閱
[Codex 執行框架參考資料](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex 執行階段

請在你預期使用 Codex 的聊天中使用 `/status`。由 Codex 支援的 OpenAI 代理程式回合會顯示：

```text
執行階段：OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線狀態、帳戶、速率限制、MCP
伺服器和 Skills。`/codex models` 會列出供執行框架和帳戶使用的即時 Codex app-server 目錄。
如果 `/status` 的結果出乎意料，請參閱
[疑難排解](#troubleshooting)。

## 路由與模型選擇

將供應商參照與執行階段原則分開：

- 使用 `openai/gpt-*` 進行標準 OpenAI 模型選擇。僅有前綴
  絕不會選取 Codex。
- 當執行階段未設定或為 `auto` 時，只有未包含自行撰寫之要求覆寫的精確官方 HTTPS Platform Responses
  或 ChatGPT Responses 路由，才能隱含選取 Codex。
- 請勿在設定中使用舊版 Codex GPT 參照；執行 `openclaw doctor --fix`
  以修復舊版參照和過時的工作階段路由固定設定。
- `agentRuntime.id: "codex"` 會使 Codex 成為相容路由的失敗即關閉要求。
  它不會讓不相容的有效路由變得相容。
- `agentRuntime.id: "openclaw"` 會在有意如此設定時，讓供應商或模型選用內嵌的
  OpenClaw 執行階段。
- `/codex ...` 可從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部執行框架路徑。僅當使用者要求 ACP/acpx
  或外部執行框架介面卡時使用。

| 使用者意圖                                                | 使用                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前的聊天                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 繼續現有的 Codex 執行緒                            | `/codex resume <thread-id>`                                                                           |
| 列出或篩選 Codex 執行緒                               | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 外掛                                  | `/codex plugins list`                                                                                 |
| 啟用或停用已設定的原生 Codex 外掛         | `/codex plugins enable <name>`、`/codex plugins disable <name>`                                       |
| 將已儲存的 Codex 命令列介面工作階段繼續為配對節點回合    | `/codex sessions --host <node> [filter]`，接著使用 `/codex resume <session-id> --host <node> --bind here` |
| 檢視跨電腦且未封存的 Codex 工作階段          | 啟用 Codex 監督並開啟 **Codex 工作階段**                                                  |
| 變更已繫結執行緒的模型、快速模式或權限 | `/codex model <model>`、`/codex fast [on\|off\|status]`、`/codex permissions [default\|yolo\|status]` |
| 停止或引導作用中的回合                              | `/codex stop`、`/codex steer <text>`                                                                  |
| 中斷目前的繫結                                 | `/codex detach`（別名 `/codex unbind`）                                                               |
| 僅傳送 Codex 意見回饋                                   | `/codex diagnostics [note]`                                                                           |
| 啟動 ACP/acpx 任務                                     | ACP/acpx 工作階段命令，而非 `/codex`                                                               |

| 使用案例                                        | 設定                                                                                                   | 驗證                                  | 備註                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| 使用原生 Codex 執行階段的合格 OpenAI 路由 | 未包含自行撰寫之要求覆寫的精確官方 HTTPS Responses/ChatGPT 路由，加上已啟用的 `codex` 外掛 | `/status` 顯示 `Runtime: OpenAI Codex` | 執行階段未設定或為 `auto` 時使用的隱含路徑 |
| Codex 無法使用時失敗即關閉             | 供應商或模型 `agentRuntime.id: "codex"`                                                                | 回合失敗，而非回退至內嵌執行階段 | 用於僅限 Codex 的部署             |
| 透過 OpenClaw 傳送直接 OpenAI API 金鑰流量  | 供應商或模型 `agentRuntime.id: "openclaw"`，以及一般 OpenAI 驗證                                      | `/status` 顯示 OpenClaw 執行階段        | 僅在有意使用 OpenClaw 時採用      |
| 舊版設定                                   | 舊版 Codex GPT 參照                                                                                       | `openclaw doctor --fix` 會將其改寫     | 請勿以此方式撰寫新設定           |
| ACP/acpx Codex 介面卡                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP 任務／工作階段狀態                 | 與原生 Codex 執行框架分開         |

`agents.defaults.imageModel` 採用相同的前綴劃分。一般 OpenAI 路由請使用 `openai/gpt-*`，
只有當影像理解應透過受限的 Codex app-server 回合執行時，才使用 `codex/gpt-*`。
Doctor 會將舊版 Codex GPT 參照改寫為 `openai/gpt-*`。

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

保留 Claude 作為預設代理，並新增具名的 Codex 代理：

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

`main` 代理使用其一般供應商路徑。當有效 OpenAI 路由仍相容時，
`codex` 代理會使用 Codex app-server；如果這應為失敗即關閉要求，
請新增明確的模型範圍 `agentRuntime.id: "codex"`。

### 失敗即關閉的 Codex 部署

當內建外掛可用時，符合資格的精確官方 HTTPS OpenAI 路由可以解析至 Codex。
若要明確制定失敗即關閉規則，請新增執行階段原則：

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
app-server 過舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## App-server 原則

依預設，外掛會在本機透過 stdio 傳輸啟動由 OpenClaw 管理的 Codex 二進位檔。
只有在有意執行其他可執行檔時才設定 `appServer.command`。
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

本機 stdio app-server 工作階段預設採用受信任的本機操作員姿態：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本機 Codex 要求不允許該隱含的 YOLO 姿態，
OpenClaw 會改為選取允許的 Guardian 權限。當工作階段啟用 OpenClaw 沙箱時，
OpenClaw 會在該回合停用 Codex 原生 Code Mode、使用者 MCP 伺服器及應用程式支援的外掛執行，
而不是依賴 Codex 主機端沙箱。當一般 exec/process 工具可用時，
Shell 存取會改為透過 OpenClaw 沙箱支援的動態工具，例如
`sandbox_exec` 和 `sandbox_process`。

在沙箱逸出或額外權限之前，對 Codex 原生自動審查使用標準化的 OpenClaw exec 模式：

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

對 Codex app-server 工作階段而言，`tools.exec.mode: "auto"` 會對應至
Codex Guardian 審查的核准：當本機要求允許這些值時，通常為
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不會保留舊版不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若要有意採用
Codex 不需核准的姿態，請使用 `tools.exec.mode: "full"`。
舊版 `plugins.entries.codex.config.appServer.mode: "guardian"` 預設仍可運作，
但 `tools.exec.mode: "auto"` 才是標準化的 OpenClaw 介面。

如需與主機 exec 核准及 ACPX 權限進行模式層級的比較，請參閱
[權限模式](/zh-TW/tools/permission-modes)。如需每個 app-server 欄位、驗證順序、
環境隔離和逾時行為的資訊，請參閱
[Codex 執行框架參考資料](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

`codex` 外掛會在任何支援 OpenClaw 文字命令的頻道上，
將 `/codex` 註冊為斜線命令。

原生執行與控制需要擁有者或 `operator.admin` 閘道用戶端：
包括繫結或繼續執行緒、傳送或停止回合、變更模型、快速模式或權限狀態、
執行壓縮或審查，以及中斷繫結。其他已授權的傳送者只能使用唯讀的狀態、
說明、帳戶、模型、執行緒、MCP 伺服器、Skill 和繫結檢查命令。

常見形式：

- `/codex status` 會檢查 app-server 連線狀態、模型、帳戶、
  速率限制、MCP 伺服器和 Skills。
- `/codex models` 會列出即時 Codex app-server 模型。
- `/codex threads [filter]` 會列出最近的 Codex app-server 執行緒。
- `/codex resume <thread-id>` 會將目前的 OpenClaw 工作階段附加至
  現有的 Codex 執行緒。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  會附加目前的聊天。
- `/codex detach`（或 `/codex unbind`）會中斷目前的繫結。
- `/codex binding` 會描述目前的繫結。
- `/codex stop` 會停止作用中的回合；`/codex steer <text>` 會引導該回合。
- `/codex model <model>`、`/codex fast [on|off|status]` 和
  `/codex permissions [default|yolo|status]` 會變更每個對話的狀態。
- `/codex compact` 會要求 Codex app-server 壓縮已附加的執行緒。
- `/codex review` 會為已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加執行緒的 Codex 意見回饋前詢問。
- `/codex account` 會顯示帳戶和速率限制狀態。
- `/codex mcp` 會列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 會列出 Codex app-server Skills。
- `/codex plugins list`、`/codex plugins enable <name>` 和
  `/codex plugins disable <name>` 會管理已設定的原生 Codex 外掛。
- `/codex computer-use [status|install]` 會管理 Codex Computer Use。
- `/codex help` 會列出完整的命令樹。

對於大多數支援回報，請先在發生錯誤的對話中使用 `/diagnostics [note]`。它會建立一份閘道診斷報告；若是 Codex 執行框架工作階段，還會請求核准傳送相關的 Codex 意見回饋套件。關於隱私權模型與群組聊天行為，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。只有在你明確想要上傳目前附加討論串的 Codex 意見回饋，而不需要完整的閘道診斷套件時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 討論串

檢查異常 Codex 執行最快的方式，通常是直接開啟原生 Codex 討論串：

```bash
codex resume <thread-id>
```

從已完成的 `/diagnostics` 回覆、`/codex binding` 或 `/codex threads [filter]` 取得討論串 ID。

關於上傳機制與執行階段層級的診斷界線，請參閱 [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

### 驗證順序

在預設的個別代理程式家目錄中，驗證會依下列順序選取：

1. 代理程式已排序的 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 下。執行 `openclaw doctor --fix`，以遷移較舊的傳統
   Codex 驗證設定檔 ID 與傳統 Codex 驗證順序。
2. 該代理程式 Codex 家目錄中應用程式伺服器的現有帳號。
3. 僅限本機 stdio 應用程式伺服器啟動：當沒有應用程式伺服器帳號且仍需要 OpenAI 驗證時，依序使用 `CODEX_API_KEY`，然後使用
   `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱形式的 Codex 驗證設定檔時，會從產生的 Codex 子程序中移除 `CODEX_API_KEY` 與 `OPENAI_API_KEY`。如此可讓閘道層級的 API 金鑰繼續用於嵌入或直接使用 OpenAI 模型，同時避免原生 Codex 應用程式伺服器回合意外透過 API 計費。明確的 Codex API 金鑰設定檔與本機 stdio 環境金鑰備援會使用應用程式伺服器登入，而不是繼承子程序環境。WebSocket 應用程式伺服器連線不會接收閘道環境的 API 金鑰備援；請使用明確的驗證設定檔或遠端應用程式伺服器自己的帳號。

若訂閱設定檔達到 Codex 使用量限制，當 Codex 回報重設時間時，OpenClaw 會記錄該時間，並在同一次 Codex 執行中嘗試下一個已排序的驗證設定檔。重設時間過後，該訂閱設定檔會再次符合使用資格，且不會變更所選的 `openai/gpt-*` 模型或 Codex 執行階段。

設定原生 Codex 外掛時，OpenClaw 會先透過已連線的應用程式伺服器安裝或重新整理這些外掛，之後才將外掛所擁有的應用程式提供給 Codex 討論串。`app/list` 仍是應用程式 ID、可存取性與中繼資料的唯一真實來源，但 OpenClaw 負責每個討論串的啟用決策：若原則允許某個列出且可存取的應用程式，即使 `app/list` 目前回報該應用程式已停用，OpenClaw 仍會傳送 `thread/start.config.apps[appId].enabled = true`。此路徑不會為未知 ID 憑空建立應用程式安裝；OpenClaw 只會使用 `plugin/install` 啟用市集外掛，然後重新整理清單。

### 環境隔離

對於本機 stdio 應用程式伺服器啟動，OpenClaw 會將 `CODEX_HOME` 設為個別代理程式目錄，因此 Codex 設定、驗證／帳號檔案、外掛快取／資料及原生討論串狀態，預設不會讀取或寫入操作者的個人 `~/.codex`。OpenClaw 會保留一般程序的 `HOME`；Codex 執行的子程序仍可找到使用者家目錄中的設定與權杖，而 Codex 也可能探索共用的 `$HOME/.agents/skills` 與
`$HOME/.agents/plugins/marketplace.json` 項目。使用
`appServer.homeScope: "user"` 時，OpenClaw 會改用原生使用者 Codex 家目錄及其現有帳號，而不注入 OpenClaw 驗證設定檔。

若部署需要額外的環境隔離，請將這些變數加入 `appServer.clearEnv`：

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

`appServer.clearEnv` 只會影響產生的 Codex 應用程式伺服器子程序。OpenClaw 會在本機啟動正規化期間，從此清單移除 `CODEX_HOME` 與 `HOME`：`CODEX_HOME` 會繼續指向所選的代理程式或使用者範圍，而 `HOME` 會繼續繼承，讓子程序可使用一般的使用者家目錄狀態。

### 動態工具與網頁搜尋

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 不會提供與 Codex 原生工作區操作重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、
`tool_call`、`tool_describe`、`tool_search` 及 `tool_search_code`。其餘大多數 OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、閘道與 `heartbeat_respond`，都可透過 `openclaw` 命名空間中的 Codex 工具搜尋使用，以縮小初始模型情境。

標記為 `catalogMode: "direct-only"` 的工具，包括 OpenClaw `computer` 工具，會改用 `openclaw_direct` 命名空間。Codex 會將該命名空間視為 `DirectModelOnly`，因此這些工具在一般討論串與僅程式碼模式討論串中都會持續直接對模型可見，而不會跨越巢狀的程式碼模式 `tools.*` 呼叫。

啟用搜尋且未選取受管理的提供者時，網頁搜尋預設使用 Codex 託管的 `web_search` 工具。原生託管搜尋與 OpenClaw 受管理的 `web_search` 動態工具互斥，避免受管理搜尋略過原生網域限制。當託管搜尋無法使用、被明確停用，或已由所選的受管理提供者取代時，OpenClaw 會使用受管理工具。OpenClaw 會停用 Codex 的獨立 `web.run` 擴充功能，因為正式環境的應用程式伺服器流量會拒絕其使用者定義的 `web` 命名空間。`tools.web.search.enabled: false` 會停用這兩條路徑，停用工具的純 LLM 執行也同樣如此。Codex 將 `"cached"` 視為偏好設定，並在不受限制的應用程式伺服器回合中將其解析為即時外部存取。設定原生 `allowedDomains` 時，自動受管理備援會採取封閉式失敗，避免繞過允許清單。持續性的有效搜尋原則變更會在下一個回合前輪替綁定的 Codex 討論串；暫時的單回合限制則會使用臨時受限討論串，並保留現有綁定供之後繼續使用。

`sessions_yield` 與僅使用訊息工具的來源回覆會保持直接處理，因為這些屬於回合控制合約。`sessions_spawn` 會保持可搜尋，讓 Codex 原生的 `spawn_agent` 繼續作為主要的 Codex 子代理程式介面；同時，仍可透過 `openclaw` 動態工具命名空間明確使用 OpenClaw 或 ACP 委派。心跳偵測協作指示會要求 Codex：若工具尚未載入，請在結束心跳偵測回合前搜尋 `heartbeat_respond`。

只有在連線至無法搜尋延後載入之動態工具的自訂 Codex 應用程式伺服器，或偵錯完整工具承載內容時，才設定 `codexDynamicToolsLoading: "direct"`。

### 設定欄位

支援的頂層 Codex 外掛欄位：

| 欄位                      | 預設值        | 意義                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"`，將 OpenClaw 動態工具直接放入初始 Codex 工具情境中。 |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex 應用程式伺服器回合中省略的其他 OpenClaw 動態工具名稱。              |
| `codexPlugins`             | 已停用       | 針對已遷移且從原始碼安裝的精選外掛，提供原生 Codex 外掛／應用程式支援。           |
| `sessionCatalog`           | 已啟用        | 在此閘道與符合資格的已配對節點上，探索原生 Codex 工作階段的側邊欄。   |
| `supervision`              | 已停用       | 面向代理程式的原生工作階段文字記錄與寫入控制原則。                         |

支援的 `appServer` 欄位：

| 欄位                                         | 預設值                                                | 說明                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會產生 Codex 程序；明確指定 `"unix"` 會連線至本機控制通訊端；`"websocket"` 會連線至 `url`。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依 OpenClaw 代理程式隔離一般的控管工具狀態。`"user"` 是明確的選擇加入設定，會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍支援本機 stdio 或 Unix 傳輸。對於獨立的監督連線，未設定的值會解析為 stdio 或 Unix 的 `"user"`，以及 WebSocket 的 `"agent"`。     |
| `command`                                     | 受管理的 Codex 二進位檔                                   | stdio 傳輸使用的可執行檔。保持未設定即可使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸使用的引數。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket App Server URL 或 `unix://` URL。明確指定空白 Unix 路徑會選取使用者家目錄中的標準控制通訊端。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                  | WebSocket 傳輸使用的 Bearer 權杖。接受常值字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受常值字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立繼承環境後，從產生的 stdio App Server 程序中移除的額外環境變數名稱。OpenClaw 會保留所選的 `CODEX_HOME`，並在本機啟動時保留繼承的 `HOME`。                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | 選擇加入 Codex 僅限程式碼模式的工具介面。一般 OpenClaw 動態工具仍可透過巢狀 `tools.*` 呼叫使用；`openclaw_direct` 工具則維持直接對模型可見。                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | 遠端 Codex App Server 工作區根目錄。設定後，OpenClaw 會從解析後的 OpenClaw 工作區推斷本機工作區根目錄、在此遠端根目錄下保留目前 cwd 的後綴，並只將最終的 App Server cwd 傳送給 Codex。若 cwd 位於解析後的 OpenClaw 工作區根目錄之外，OpenClaw 會採取封閉式失敗，而不會將閘道本機路徑傳送至遠端 App Server。 |
| `requestTimeoutMs`                            | `60000`                                                | App Server 控制平面呼叫的逾時時間。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一次輪次後，或執行輪次範圍的 App Server 要求後，OpenClaw 等待 `turn/completed` 時的靜默期間。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具執行後的原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度防護機制。適用於受信任或繁重的工作負載，這類負載在工具執行後的統整過程中，合理的靜默時間可能長於助理最終發布的時間預算。                                |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO | YOLO 或經 guardian 審查之執行的預設組態。本機 stdio 要求若省略 `danger-full-access`、`never` 核准或 `user` 審查者，隱含預設值即為 guardian。                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准政策       | 傳送至執行緒啟動、恢復及輪次的原生 Codex 核准政策。允許時，guardian 預設值偏好 `"on-request"`。                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙箱  | 傳送至執行緒啟動及恢復的原生 Codex 沙箱模式。允許時，guardian 預設值偏好 `"workspace-write"`，否則使用 `"read-only"`。當 OpenClaw 沙箱啟用時，`danger-full-access` 輪次會使用 Codex `workspace-write`，其網路存取權限衍生自 OpenClaw 沙箱的輸出設定。                                                                                     |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審查者               | 允許時使用 `"auto_review"`，讓 Codex 審查原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未設定                                                  | 選用的 Codex App Server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求彈性處理，`null` 會清除覆寫，而舊版 `"fast"` 會被接受並視為 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                               | 選擇加入 App Server 命令的 Codex 權限設定檔網路功能。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取，而不傳送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選擇加入設定，會向支援的 Codex App Server 註冊由 OpenClaw 沙箱支援的 Codex 環境，使原生 Codex 執行可在使用中的 OpenClaw 沙箱內運作。                                                                                                                                                                                                            |

`appServer.networkProxy` 採用明確設定，因為它會變更 Codex 沙箱
合約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled`
與 `default_permissions`，讓產生的
權限設定檔可以啟動 Codex 受管理的網路功能。OpenClaw 預設會
根據設定檔內容產生具抗碰撞性的 `openclaw-network-<fingerprint>` 設定檔
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

如果一般的 app-server 執行階段會是 `danger-full-access`，啟用
`networkProxy` 後，產生的權限設定檔會使用工作區式檔案系統存取：
Codex 受管理的網路強制控管採用沙箱化網路，因此完整存取權設定檔無法保護
對外流量。網域項目使用 `allow` 或 `deny`；
Unix socket 項目則使用 Codex 的 `allow` 或
`none` 值。

### 動態工具呼叫逾時

OpenClaw 所擁有的動態工具呼叫，其限制獨立於
`appServer.requestTimeoutMs`：Codex `item/tool/call` 請求預設使用 90
秒的 OpenClaw 看門狗。每次呼叫的正值 `timeoutMs`
引數可延長或縮短該特定工具的時間預算，上限為 600000 ms。
當工具呼叫未提供自己的逾時值時，`image_generate` 工具使用
`agents.defaults.imageGenerationModel.timeoutMs`；否則使用 120 秒的圖片產生預設值。媒體理解
`image` 工具使用 `tools.media.image.timeoutSeconds` 或其 60 秒的媒體預設值；
對於圖片理解，此逾時套用於請求本身，不會因先前的準備工作而縮短。
發生逾時時，OpenClaw 會在支援的情況下中止工具訊號，並向 Codex
傳回失敗的動態工具回應，讓該回合可以繼續，而不是讓工作階段停留在
`processing`。此看門狗是外層動態 `item/tool/call` 預算；
供應商特定的請求逾時在該呼叫內執行，並保留各自的逾時語意。

在 Codex 接受一個回合後，以及 OpenClaw 回應回合範圍的 app-server
請求後，測試框架會預期 Codex 在目前回合中持續取得進展，並最終以
`turn/completed` 完成原生回合。如果 app-server 靜默達
`appServer.turnCompletionIdleTimeoutMs`，OpenClaw 會盡力中斷 Codex 回合、記錄診斷逾時，
並釋放 OpenClaw 工作階段通道，使後續聊天訊息不會排在過時的原生回合
之後。相同回合的大多數非終止通知都會解除這個短期看門狗，因為 Codex
已證明該回合仍然存活。

工具交接會使用較長的工具後閒置預算：在 OpenClaw 傳回
`item/tool/call` 回應後、`commandExecution` 等原生工具項目完成後、
原始 `custom_tool_call_output` 完成後，以及工具後的原始助理進度、原始推理
完成或推理進度之後。若已設定，守衛會使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則預設為五分鐘；在 Codex 發出下一個目前回合事件
之前的靜默合成期間，相同預算也會延長進度看門狗。全域 app-server 通知
（例如速率限制更新）不會重設回合閒置進度。推理完成、commentary
`agentMessage` 完成，以及工具前的原始推理或助理進度之後，可能會
接續自動最終回覆，因此它們會使用進度後回覆守衛，而不是立即釋放工作階段
通道。

只有最終／非 commentary 的已完成 `agentMessage` 項目，以及工具前
的原始助理完成，才會啟動助理輸出釋放：如果 Codex 隨後靜默而未發出
`turn/completed`，OpenClaw 會盡力中斷原生回合並釋放工作階段通道。
如果另一個回合監看在釋放競爭中勝出，只要不再有原生請求、項目或動態工具
完成處於作用中狀態，且助理輸出釋放仍屬於最新完成的項目，並且沒有後續
項目完成，OpenClaw 仍會接受已完成的最終助理項目。這可以在工具工作完成後
保留最終答案，而不必重播該回合。部分助理差異、較早的過時回覆，以及後續
的空白完成均不符合資格。

可安全重播的 stdio app-server 失敗，包括在沒有助理、工具、作用中項目或
副作用證據時發生的回合完成閒置逾時，會在新的 app-server 嘗試中重試一次。
不安全的逾時仍會汰除卡住的 app-server 用戶端並釋放 OpenClaw 工作階段通道；
它們也會清除過時的原生執行緒繫結，而不會自動重播。完成監看逾時會顯示
Codex 特定的逾時文字：可安全重播的情況會指出回應可能不完整，不安全的情況
則會要求你在重試前確認目前狀態。公開逾時診斷包含結構化欄位，例如最後一個
app-server 通知方法、原始助理回應項目的 id／類型／角色、作用中請求／項目
數量，以及已啟動的監看狀態；當最後一個通知是原始助理回應項目時，也會包含
有長度限制的助理文字預覽。診斷不會包含原始提示或工具內容。

### 本機測試環境覆寫

- `OPENCLAW_CODEX_APP_SERVER_BIN` 會在
  `appServer.command` 未設定時略過受管理的二進位檔。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性的本機測試中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。若要進行可重複部署，建議使用設定，因為它能將外掛
行為與 Codex 測試框架的其餘設定保留在同一個經過審查的檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw 測試框架回合相同的 Codex 執行緒中，
使用 Codex app-server 自己的應用程式與外掛功能。OpenClaw 不會將 Codex
外掛轉換成合成的 `codex_plugin_*` OpenClaw 動態工具。

`codexPlugins` 只會影響選取原生 Codex 測試框架的工作階段。
它不會影響內建測試框架執行、一般 OpenAI 供應商執行、ACP 對話繫結或其他
測試框架。

最低限度的遷移設定：

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

當 OpenClaw 建立 Codex 測試框架工作階段，或取代過時的 Codex 執行緒繫結時，
會計算執行緒應用程式設定；不會在每個回合重新計算。變更
`codexPlugins` 後，請使用 `/new`、`/reset`，
或重新啟動閘道，讓未來的 Codex 測試框架工作階段使用更新後的應用程式集合
啟動。

如需遷移資格、應用程式清單、破壞性動作政策、資訊請求及原生外掛診斷，
請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的應用程式與外掛存取權由已登入的 Codex 帳號控制；對於 Business
和 Enterprise/Edu 工作區，則也由工作區應用程式控制項管理。請參閱
[搭配你的 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)，
了解 OpenAI 的帳號與工作區控制概觀。

## 電腦使用

電腦使用有專屬的設定指南：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會內含桌面控制應用程式，也不會自行執行桌面動作。
它會準備 Codex app-server、確認 `computer-use` MCP 伺服器可用，
然後讓 Codex 在 Codex 模式回合期間擁有原生 MCP 工具呼叫。

## 執行階段邊界

Codex 測試框架只會變更底層內嵌代理程式執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行
  這些工具，因此 OpenClaw 仍在執行路徑中。
- Codex 原生 shell、修補、MCP 與原生應用程式工具由 Codex
  擁有。OpenClaw 可以透過支援的轉送機制觀察或封鎖特定原生事件，但不會
  重寫原生工具引數。
- Codex 擁有原生壓縮。OpenClaw 會為頻道歷史記錄、搜尋、
  `/new`、`/reset`，以及未來的模型或測試框架切換
  保留逐字記錄鏡像，但不會以 OpenClaw 或上下文引擎摘要器取代 Codex 壓縮。
- 媒體產生、媒體理解、TTS、核准及訊息工具輸出，會繼續
  使用相符的 OpenClaw 供應商／模型設定。
- `tool_result_persist` 適用於 OpenClaw 所擁有的逐字記錄
  工具結果，而非 Codex 原生工具結果記錄。

如需鉤子層、支援的 V1 介面、原生權限處理、佇列導向、Codex 意見回饋上傳
機制及壓縮詳細資訊，請參閱
[Codex 測試框架執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般 `/model` 供應商：**這是新設定的預期行為。
請選取 `openai/gpt-*` 模型、啟用 `plugins.entries.codex.enabled`，並檢查
`plugins.allow` 是否排除 `codex`。

**OpenClaw 使用內建測試框架而非 Codex：**請確認有效路由是完全相符的官方
HTTPS Platform Responses 或 ChatGPT Responses 路由、沒有自行設定的請求
覆寫，且 Codex 外掛已安裝並啟用。僅有 `openai/gpt-*` 前綴並不足夠。
若測試時需要嚴格驗證，請設定供應商或模型 `agentRuntime.id: "codex"`；當路由或
測試框架不相容時，強制使用 Codex 會直接失敗，而不會改用備援。

**OpenAI Codex 執行階段改用 API 金鑰路徑：**請收集經過遮蔽處理的閘道摘錄，
其中需顯示模型、執行階段、選取的供應商及失敗情況。請受影響的協作者在其
OpenClaw 主機上執行下列唯讀命令：

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
`No API key` 結果。修正後的執行應顯示 OpenAI OAuth 路徑，而不是
一般的 OpenAI API 金鑰失敗。

**仍保留舊版 Codex 模型參照設定：**請執行 `openclaw doctor --fix`。
Doctor 會將舊版模型參照改寫為 `openai/*`、移除過時的工作階段與
整個代理程式執行階段固定設定，並保留現有的驗證設定檔覆寫。

**app-server 遭到拒絕：**請使用 Codex app-server
`0.143.0` 或更新版本。同版本的預發行版或帶有建置後綴的版本，例如
`0.143.0-alpha.2` 或 `0.143.0+custom`，會遭到拒絕，因為 OpenClaw
會測試穩定版 `0.143.0` 通訊協定的最低版本要求。

**`/codex status` 無法連線：**請確認 `codex` 外掛已啟用、設定允許清單時 `plugins.allow` 包含該外掛，並確認任何自訂 `appServer.command`、`url`、`authToken` 或標頭皆有效。

**模型探索速度緩慢：**降低 `plugins.entries.codex.config.discovery.timeoutMs`，或停用探索。
請參閱 [Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：**請檢查 `appServer.url`、`authToken`、標頭，並確認遠端應用程式伺服器使用相同版本的 Codex 應用程式伺服器通訊協定。

**原生殼層或修補工具遭 `Native hook relay
unavailable` 阻擋：**Codex 執行緒仍在嘗試使用 OpenClaw 已不再註冊的原生掛鉤轉送識別碼。這是原生 Codex 掛鉤的傳輸問題，並非 ACP 後端、供應商、GitHub 或殼層命令失敗。請在受影響的聊天中使用 `/new` 或 `/reset` 啟動全新工作階段，然後重試無害的命令。如果首次可正常運作，但下一次原生工具呼叫再次失敗，請僅將 `/new` 視為暫時的因應措施：重新啟動 Codex 應用程式伺服器或 OpenClaw 閘道後，將提示複製到全新工作階段，讓舊執行緒遭到捨棄並重新建立原生掛鉤註冊。

**非 Codex 模型使用內建控制框架：**除非供應商或模型執行階段政策將其路由至其他控制框架，否則這是預期行為。在 `auto` 模式中，一般的非 OpenAI 供應商參照會維持使用其正常供應商路徑。

**Computer Use 已安裝，但工具無法執行：**請從全新工作階段檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用上述原生掛鉤轉送復原方式。
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
- [匯出診斷資料](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
