---
read_when:
    - 你需要每個 Codex 執行框架設定欄位
    - 你正在變更 app-server 的傳輸、身分驗證、探索或逾時行為
    - 你正在偵錯 Codex harness 的啟動、模型探索或環境隔離
summary: Codex 控制框架的設定、驗證、探索與應用程式伺服器參考
title: Codex 執行框架參考
x-i18n:
    generated_at: "2026-05-10T19:41:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

本參考說明隨附 `codex`
Plugin 的詳細設定。若要設定與做路由決策，請從
[Codex harness](/zh-TW/plugins/codex-harness) 開始。

## Plugin 設定介面

所有 Codex harness 設定都位於 `plugins.entries.codex.config` 之下。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

支援的頂層欄位：

| 欄位                       | 預設值                   | 含義                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已啟用                   | Codex app-server `model/list` 的模型探索設定。                                                                                            |
| `appServer`                | 受管理的 stdio app-server | 傳輸、指令、驗證、核准、沙箱與逾時設定。                                                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具脈絡中。                                                                       |
| `codexDynamicToolsExclude` | `[]`                     | 要從 Codex app-server 回合中略過的其他 OpenClaw 動態工具名稱。                                                                            |
| `codexPlugins`             | 已停用                   | 對已遷移、以原始碼安裝的精選 Plugin 提供原生 Codex Plugin/應用程式支援。請參閱[原生 Codex Plugin](/zh-TW/plugins/codex-native-plugins)。 |
| `computerUse`              | 已停用                   | Codex Computer Use 設定。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)。                                                        |

## App-server 傳輸

預設情況下，OpenClaw 會啟動隨附 Plugin 所提供的受管理 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

這會讓 app-server 版本繫結到隨附的 `codex` Plugin，而不是本機剛好另外安裝的任何 Codex CLI。只有在你明確想執行不同可執行檔時，才設定 `appServer.command`。

對於已在執行的 app-server，請使用 WebSocket 傳輸：

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

支援的 `appServer` 欄位：

| 欄位                          | 預設值                                                 | 含義                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                        |
| `command`                     | 受管理的 Codex 二進位檔                                | stdio 傳輸使用的可執行檔。保留未設定即可使用受管理的二進位檔。                                                                                                                               |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸使用的引數。                                                                                                                                                                       |
| `url`                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                    |
| `authToken`                   | 未設定                                                 | WebSocket 傳輸使用的 Bearer 權杖。                                                                                                                                                            |
| `headers`                     | `{}`                                                   | 額外的 WebSocket 標頭。                                                                                                                                                                       |
| `clearEnv`                    | `[]`                                                   | OpenClaw 建立其繼承環境後，從產生的 stdio app-server 程序移除的額外環境變數名稱。                                                                                                           |
| `requestTimeoutMs`            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | 在回合範圍的 app-server 請求之後，OpenClaw 等待 `turn/completed` 時使用的安靜視窗。                                                                                                          |
| `mode`                        | 除非本機 Codex 要求不允許 YOLO，否則為 `"yolo"`        | YOLO 或經 guardian 審查執行的預設集。                                                                                                                                                         |
| `approvalPolicy`              | `"never"` 或允許的 guardian 核准政策                   | 傳送到執行緒開始、繼續和回合的原生 Codex 核准政策。                                                                                                                                           |
| `sandbox`                     | `"danger-full-access"` 或允許的 guardian 沙箱          | 傳送到執行緒開始和繼續的原生 Codex 沙箱模式。                                                                                                                                                 |
| `approvalsReviewer`           | `"user"` 或允許的 guardian 審查者                      | 使用 `"auto_review"` 可在允許時讓 Codex 審查原生核准提示。                                                                                                                                   |
| `defaultWorkspaceDir`         | 目前程序目錄                                           | 省略 `--cwd` 時，`/codex bind` 使用的工作區。                                                                                                                                                  |
| `serviceTier`                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求 flex 處理，而 `null` 會清除覆寫。舊版 `"fast"` 會被接受為 `"priority"`。 |

Plugin 會封鎖較舊或未版本化的 app-server 交握。Codex app-server 必須回報穩定版本 `0.125.0` 或更新版本。

## 核准與沙箱模式

本機 stdio app-server 工作階段預設為 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這個受信任的本機操作者姿態，讓無人看管的 OpenClaw 回合與 Heartbeat 能夠持續推進，而不會出現沒有人能回答的原生核准提示。

如果 Codex 的本機系統要求檔不允許隱含的 YOLO 核准、審查者或沙箱值，OpenClaw 會改將隱含預設值視為 guardian，並選擇允許的 guardian 權限。同一個要求檔中符合主機名稱的 `[[remote_sandbox_config]]` 項目，會用於沙箱預設值決策。

設定 `appServer.mode: "guardian"` 以使用 Codex guardian 審查的核准：

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

當這些值被允許時，`guardian` 預設集會展開為 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。個別政策欄位會覆寫 `mode`。較舊的 `guardian_subagent` 審查者值仍會作為相容別名接受，但新設定應使用 `auto_review`。

## 驗證與環境隔離

驗證會依下列順序選擇：

1. 代理程式的明確 OpenClaw Codex 驗證設定檔。
2. app-server 在該代理程式 Codex home 中的既有帳戶。
3. 僅限本機 stdio app-server 啟動：沒有 app-server 帳戶且仍需要 OpenAI 驗證時，先使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，會從產生的 Codex 子程序移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓 Gateway 層級的 API 金鑰仍可用於嵌入或直接 OpenAI 模型，而不會讓原生 Codex app-server 回合意外透過 API 計費。

明確的 Codex API 金鑰設定檔和本機 stdio 環境金鑰後援會使用 app-server 登入，而不是繼承的子程序環境。WebSocket app-server 連線不會接收 Gateway 環境 API 金鑰後援；請使用明確的驗證設定檔，或遠端 app-server 自己的帳戶。

stdio app-server 啟動預設會繼承 OpenClaw 的程序環境，但 OpenClaw 擁有 Codex app-server 帳戶橋接，並將 `CODEX_HOME` 和 `HOME` 都設為該代理程式 OpenClaw 狀態底下的每代理程式目錄。Codex 自身的 Skill 載入器會讀取 `$CODEX_HOME/skills` 和 `$HOME/.agents/skills`，因此本機 app-server 啟動時這兩個值都會被隔離。這會讓 Codex 原生 Skills、Plugin、設定、帳戶與執行緒狀態限縮到 OpenClaw 代理程式，而不會從操作者的個人 Codex CLI home 外洩進來。

OpenClaw Plugin 和 OpenClaw Skill 快照仍會透過 OpenClaw 自己的 Plugin 登錄檔與 Skill 載入器流動。個人 Codex CLI 資產不會。如果你有實用的 Codex CLI Skills 或 Plugin 應成為 OpenClaw 代理程式的一部分，請明確清點它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。
在本機啟動時，`CODEX_HOME` 和 `HOME` 仍保留給 OpenClaw 的每代理程式 Codex 隔離使用。

## 動態工具

Codex 動態工具預設為 `searchable` 載入。OpenClaw 不會公開與 Codex 原生工作區操作重複的動態工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

其餘 OpenClaw 整合工具，例如訊息傳遞、工作階段、媒體、cron、
瀏覽器、節點、gateway、`heartbeat_respond` 和 `web_search`，可透過
Codex 工具搜尋在 `openclaw` 命名空間下使用。這能讓初始模型上下文更小。
`sessions_yield` 和僅限訊息工具來源的回覆會維持直接提供，因為這些是回合控制合約。

只有在連接至無法搜尋延遲動態工具的自訂 Codex
app-server，或除錯完整工具酬載時，才設定 `codexDynamicToolsLoading: "direct"`。

## 逾時

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 設定界限。每個 Codex `item/tool/call` 請求會依下列順序使用第一個可用逾時：

- 正值的每次呼叫 `timeoutMs` 引數。
- 對於 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 對於媒體理解 `image` 工具，使用 `tools.media.image.timeoutSeconds`
  轉換為毫秒，或 60 秒的媒體預設值。
- 30 秒的動態工具預設值。

動態工具預算上限為 600000 毫秒。逾時時，OpenClaw 會在支援處中止工具訊號，並向 Codex
回傳失敗的動態工具回應，讓該回合能繼續，而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 請求後，harness
也預期 Codex 以 `turn/completed` 完成原生回合。如果 app-server
在該回應後超過 `appServer.turnCompletionIdleTimeoutMs` 仍無動靜，OpenClaw 會盡力中斷 Codex 回合，記錄診斷逾時，並釋放 OpenClaw 工作階段通道，讓後續聊天訊息不會排在過期的原生回合後方。

同一回合的任何非終止通知，包括
`rawResponseItem/completed`，都會解除這個短監看器，因為 Codex 已證明該回合仍然存活。較長的終止監看器會繼續保護真正卡住的回合。逾時診斷包含最後一個 app-server
通知方法；對於原始助理回應項目，則包含項目類型、角色、ID，以及有界限的助理文字預覽。

## 模型探索

預設情況下，Codex Plugin 會向 app-server 要求可用模型。模型可用性由 Codex app-server
擁有，因此當 OpenClaw 升級內建的 `@openai/codex` 版本，或部署將
`appServer.command` 指向不同的 Codex 二進位檔時，清單可能會變更。可用性也可能依帳戶範圍而異。請在執行中的 gateway 上使用 `/codex models`，查看該 harness 和帳戶的即時目錄。

如果探索失敗或逾時，OpenClaw 會使用下列項目的內建備援目錄：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

目前內建 harness 為 `@openai/codex` `0.130.0`。對該內建 app-server 執行的 `model/list` 探測回傳：

| 模型 ID               | 預設 | 隱藏 | 輸入模態   | 推理強度                 |
| --------------------- | ---- | ---- | ---------- | ------------------------ |
| `gpt-5.5`             | 是   | 否   | 文字、圖片 | low, medium, high, xhigh |
| `gpt-5.4`             | 否   | 否   | 文字、圖片 | low, medium, high, xhigh |
| `gpt-5.4-mini`        | 否   | 否   | 文字、圖片 | low, medium, high, xhigh |
| `gpt-5.3-codex`       | 否   | 否   | 文字、圖片 | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | 否   | 否   | 文字       | low, medium, high, xhigh |
| `gpt-5.2`             | 否   | 否   | 文字、圖片 | low, medium, high, xhigh |

隱藏模型可由 app-server 目錄針對內部或特殊流程回傳，但它們不是一般模型選擇器選項。

在 `plugins.entries.codex.config.discovery` 下調整探索：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

若想讓啟動時避免探測 Codex，並且只使用備援目錄，請停用探索：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## 工作區啟動檔案

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。OpenClaw
不會寫入合成的 Codex 專案文件檔案，也不依賴 Codex 的 persona 檔案備援檔名，因為 Codex 備援只會在
`AGENTS.md` 缺少時套用。

為了維持 OpenClaw 工作區一致性，Codex harness 會解析其他啟動檔案，包括存在時的 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、
`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`，並透過 `thread/start` 和 `thread/resume` 上的 Codex 開發者指示轉送它們。
這能讓工作區 persona 和設定檔上下文在原生 Codex 行為塑形通道上可見，而不需重複 `AGENTS.md`。

## 環境覆寫

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會繞過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於可重複的部署，建議使用設定，因為它會將 Plugin 行為保留在與其餘 Codex harness 設定相同的已審閱檔案中。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex plugins](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [OpenAI provider](/zh-TW/providers/openai)
- [設定參考](/zh-TW/gateway/configuration-reference)
