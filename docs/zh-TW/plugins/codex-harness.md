---
read_when:
    - 您想使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅限 Codex 的部署失敗，而不是退回到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 內嵌代理輪次
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-02T02:55:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 讓 OpenClaw 透過 Codex app-server 執行嵌入式代理回合，而不是內建的 PI 執行框架。

當你希望由 Codex 擁有低階代理工作階段時，請使用這個方式：模型探索、原生對話串恢復、原生 Compaction，以及 app-server 執行。OpenClaw 仍然擁有聊天頻道、工作階段檔案、模型選擇、工具、核准、媒體傳遞，以及可見逐字稿鏡像。

當來源聊天回合透過 Codex 執行框架執行時，如果部署尚未明確設定 `messages.visibleReplies`，可見回覆預設會使用 OpenClaw `message` 工具。代理仍可私下完成其 Codex 回合；只有在呼叫 `message(action="send")` 時才會發佈到頻道。將 `messages.visibleReplies: "automatic"` 設為保留直接聊天最終回覆在舊版自動傳遞路徑上。

Codex Heartbeat 回合預設也會取得 `heartbeat_respond` 工具，因此代理可以記錄這次喚醒應保持安靜或發出通知，而不需要在最終文字中編碼該控制流程。

如果你正在嘗試建立方向感，請從
[代理執行階段](/zh-TW/concepts/agent-runtimes)開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他頻道仍然是通訊介面。

## 快速設定

大多數想要「OpenClaw 中的 Codex」的使用者會想要這條路徑：使用 ChatGPT/Codex 訂閱登入，然後透過原生 Codex app-server 執行階段執行嵌入式代理回合。模型參照仍然以 `openai/gpt-*` 作為標準；訂閱驗證來自 Codex 帳戶/設定檔，而不是來自 `openai-codex/*` 模型前綴。

如果你還沒有登入，請先使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai-codex
```

接著啟用隨附的 `codex` Plugin，並強制使用 Codex 執行階段：

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
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

如果你的設定使用 `plugins.allow`，也要在其中包含 `codex`：

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

當你指的是原生 Codex 執行階段時，不要使用 `openai-codex/gpt-*`。該前綴是明確的「透過 PI 使用 Codex OAuth」路徑。設定變更會套用到新的或重設的工作階段；現有工作階段會保留其已記錄的執行階段。

## 這個 Plugin 變更的內容

隨附的 `codex` Plugin 提供幾種獨立功能：

| 功能                              | 你的使用方式                                        | 它會做什麼                                                                    |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式執行階段                | `agentRuntime.id: "codex"`                          | 透過 Codex app-server 執行 OpenClaw 嵌入式代理回合。                          |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話綁定並控制 Codex app-server 對話串。                                |
| Codex app-server 供應商/目錄      | `codex` 內部，透過執行框架呈現                      | 讓執行階段探索並驗證 app-server 模型。                                        |
| Codex 媒體理解路徑                | `codex/*` 影像模型相容性路徑                        | 針對支援的影像理解模型執行有界的 Codex app-server 回合。                      |
| 原生鉤子轉送                      | Codex 原生事件周圍的 Plugin 鉤子                    | 讓 OpenClaw 觀察/封鎖支援的 Codex 原生工具/完成事件。                         |

啟用 Plugin 會讓這些功能可用。它**不會**：

- 開始對每個 OpenAI 模型使用 Codex
- 將 `openai-codex/*` 模型參照轉換成原生執行階段
- 讓 ACP/acpx 成為預設 Codex 路徑
- 熱切換已經記錄 PI 執行階段的現有工作階段
- 取代 OpenClaw 頻道傳遞、工作階段檔案、驗證設定檔儲存，或
  訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制命令介面。如果 Plugin 已啟用，且使用者要求從聊天綁定、恢復、導引、停止或檢查 Codex 對話串，代理應優先使用 `/codex ...` 而不是 ACP。當使用者要求 ACP/acpx 或正在測試 ACP Codex 轉接器時，ACP 仍是明確的備援。

原生 Codex 回合會保留 OpenClaw Plugin 鉤子作為公開相容層。這些是程序內 OpenClaw 鉤子，不是 Codex `hooks.json` 命令鉤子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用於鏡像逐字稿記錄
- `before_agent_finalize` 透過 Codex `Stop` 轉送
- `agent_end`

Plugin 也可以註冊與執行階段無關的工具結果中介軟體，在 OpenClaw 執行工具之後、結果回傳給 Codex 之前，重寫 OpenClaw 動態工具結果。這不同於公開的 `tool_result_persist` Plugin 鉤子，後者會轉換 OpenClaw 擁有的逐字稿工具結果寫入。

若要了解 Plugin 鉤子語意本身，請參閱 [Plugin 鉤子](/zh-TW/plugins/hooks)
和 [Plugin 防護行為](/zh-TW/tools/plugin)。

執行框架預設為關閉。新設定應保留 OpenAI 模型參照以 `openai/gpt-*` 作為標準，並在需要原生 app-server 執行時明確強制使用 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版 `codex/*` 模型參照仍會為了相容性自動選取該執行框架，但以執行階段為後盾的舊版供應商前綴不會顯示為一般模型/供應商選項。

如果 `codex` Plugin 已啟用，但主要模型仍是 `openai-codex/*`，`openclaw doctor` 會警告，而不是變更路徑。這是刻意設計：`openai-codex/*` 仍然是 PI Codex OAuth/訂閱路徑，而原生 app-server 執行仍是明確的執行階段選擇。

## 路徑對照表

變更設定前請使用此表：

| 期望行為                                             | 模型參照                   | 執行階段設定                           | 驗證/設定檔路徑              | 預期狀態標籤                   |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱         | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth 或 Codex 帳戶    | `Runtime: OpenAI Codex`        |
| 透過一般 OpenClaw 執行器使用 OpenAI API              | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| 透過 PI 使用 ChatGPT/Codex 訂閱                      | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth 供應商    | `Runtime: OpenClaw Pi Default` |
| 以保守自動模式混用供應商                             | 供應商特定參照             | `agentRuntime.id: "auto"`              | 依所選供應商                 | 取決於所選執行階段             |
| 明確的 Codex ACP 轉接器工作階段                      | 取決於 ACP 提示/模型       | `sessions_spawn` 搭配 `runtime: "acp"` | ACP 後端驗證                 | ACP 任務/工作階段狀態          |

重要的區分是供應商與執行階段：

- `openai-codex/*` 回答「PI 應該使用哪個供應商/驗證路徑？」
- `agentRuntime.id: "codex"` 回答「哪個迴圈應該執行這個
  嵌入式回合？」
- `/codex ...` 回答「這個聊天應該綁定或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應該啟動哪個外部執行框架程序？」

## 選擇正確的模型前綴

OpenAI 系列路徑具有前綴特定性。對於常見的訂閱加原生 Codex 執行階段設定，請使用 `openai/*` 搭配 `agentRuntime.id: "codex"`。只有在你刻意想要透過 PI 使用 Codex OAuth 時，才使用 `openai-codex/*`：

| 模型參照                                      | 執行階段路徑                                 | 使用時機                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 透過 OpenClaw/PI 管線使用 OpenAI 供應商      | 你想使用目前以 `OPENAI_API_KEY` 直接存取的 OpenAI Platform API。           |
| `openai-codex/gpt-5.5`                        | 透過 OpenClaw/PI 使用 OpenAI Codex OAuth     | 你想使用 ChatGPT/Codex 訂閱驗證搭配預設 PI 執行器。                       |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server 執行框架                    | 你想使用 ChatGPT/Codex 訂閱驗證搭配原生 Codex 執行。                      |

當你的帳戶公開這些路徑時，GPT-5.5 可以同時出現在直接 OpenAI API key 與 Codex 訂閱路徑上。使用 `openai/gpt-5.5` 搭配 Codex app-server 執行框架取得原生 Codex 執行階段；使用 `openai-codex/gpt-5.5` 取得 PI OAuth；或在沒有 Codex 執行階段覆寫時使用 `openai/gpt-5.5` 取得直接 API key 流量。

舊版 `codex/gpt-*` 參照仍會作為相容性別名接受。Doctor 相容性遷移會將舊版主要執行階段參照重寫為標準模型參照，並分開記錄執行階段政策；而僅作為備援的舊版參照會保持不變，因為執行階段是針對整個代理容器設定。新的 PI Codex OAuth 設定應使用 `openai-codex/gpt-*`；新的原生 app-server 執行框架設定應使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前綴區分。當影像理解應透過 OpenAI Codex OAuth 供應商路徑執行時，請使用 `openai-codex/gpt-*`。當影像理解應透過有界的 Codex app-server 回合執行時，請使用 `codex/gpt-*`。Codex app-server 模型必須宣告支援影像輸入；純文字 Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效執行框架。如果選擇出乎意料，請啟用 `agents/harness` 子系統的偵錯記錄，並檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含所選執行框架 id、選擇原因、執行階段/備援政策，以及在 `auto` 模式下每個 Plugin 候選項的支援結果。

### Doctor 警告的含義

當以下全部為真時，`openclaw doctor` 會警告：

- 隨附的 `codex` Plugin 已啟用或允許
- 代理的主要模型是 `openai-codex/*`
- 該代理的有效執行階段不是 `codex`

該警告存在，是因為使用者常常預期「Codex Plugin 已啟用」表示「原生 Codex app-server 執行階段」。OpenClaw 不會做出這個跳躍。該警告表示：

- 如果你原本就打算透過 PI 使用 ChatGPT/Codex OAuth，則**不需要任何變更**。
- 如果你打算使用原生 app-server 執行，請將模型變更為 `openai/<model>`，並設定
  `agentRuntime.id: "codex"`。
- 執行階段變更後，現有工作階段仍需要 `/new` 或 `/reset`，
  因為工作階段執行階段釘選是黏著的。

執行框架選擇不是即時工作階段控制。當嵌入式回合執行時，OpenClaw 會在該工作階段上記錄所選執行框架 id，並在同一工作階段 id 的後續回合中持續使用它。當你希望未來工作階段使用另一個執行框架時，請變更 `agentRuntime` 設定或 `OPENCLAW_AGENT_RUNTIME`；在 PI 與 Codex 之間切換現有對話前，請使用 `/new` 或 `/reset` 開始全新工作階段。這可避免透過兩個不相容的原生工作階段系統重播同一份逐字稿。

在執行框架釘選出現之前建立的舊版工作階段，一旦已有逐字稿歷史，就會被視為已釘選到 PI。變更設定後，使用 `/new` 或 `/reset` 讓該對話選用 Codex。

`/status` 會顯示實際生效的模型執行階段。預設的 PI 執行框架會顯示為
`Runtime: OpenClaw Pi Default`，Codex 應用程式伺服器執行框架則會顯示為
`Runtime: OpenAI Codex`。

## 需求

- OpenClaw，且已提供內建的 `codex` Plugin。
- Codex 應用程式伺服器 `0.125.0` 或更新版本。內建 Plugin 預設會管理相容的
  Codex 應用程式伺服器二進位檔，因此 `PATH` 上的本機 `codex` 命令不會影響一般的執行框架啟動。
- 應用程式伺服器程序或 OpenClaw 的 Codex 驗證橋接需要可使用 Codex 驗證。
  本機應用程式伺服器啟動會為每個代理使用 OpenClaw 管理的 Codex 主目錄，以及隔離的子程序 `HOME`，
  因此預設不會讀取你的個人
  `~/.codex` 帳號、Skills、Plugin、設定、執行緒狀態，或原生
  `$HOME/.agents/skills`。

Plugin 會封鎖較舊或未標示版本的應用程式伺服器握手。這可讓
OpenClaw 維持在已測試過的協定介面上。

對於即時和 Docker 冒煙測試，驗證通常來自 Codex CLI 帳號
或 OpenClaw `openai-codex` 驗證設定檔。當沒有帳號存在時，本機 stdio 應用程式伺服器啟動
也可以退回使用 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 將 Codex 加到其他模型旁邊

如果同一個代理應該能在 Codex 與非 Codex 供應商模型之間自由切換，
不要全域設定 `agentRuntime.id: "codex"`。強制執行階段會套用到該代理或工作階段的每個內嵌回合。
如果你在強制該執行階段時選取 Anthropic 模型，OpenClaw 仍會嘗試使用 Codex 執行框架，
並以封閉失敗結束，而不是悄悄將該回合透過 PI 路由。

請改用以下其中一種形式：

- 將 Codex 放在使用 `agentRuntime.id: "codex"` 的專用代理上。
- 保持預設代理使用 `agentRuntime.id: "auto"`，並將 PI 後援用於一般混合供應商使用情境。
- 僅為了相容性使用舊版 `codex/*` 參照。新設定應優先使用
  `openai/*`，並搭配明確的 Codex 執行階段政策。

例如，以下會讓預設代理維持一般自動選擇，並新增一個獨立的 Codex 代理：

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
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

使用此形式時：

- 預設的 `main` 代理會使用一般供應商路徑與 PI 相容性後援。
- `codex` 代理會使用 Codex 應用程式伺服器執行框架。
- 如果 `codex` 代理缺少 Codex 或不支援 Codex，該回合會失敗，
  而不是悄悄使用 PI。

## 代理命令路由

代理應依意圖路由使用者要求，而不是只根據「Codex」這個詞：

| 使用者要求...                                       | 代理應使用...                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「將此聊天綁定到 Codex」                              | `/codex bind`                                    |
| 「在這裡繼續 Codex 執行緒 `<id>`」                      | `/codex resume <id>`                             |
| 「顯示 Codex 執行緒」                                   | `/codex threads`                                 |
| 「為一次有問題的 Codex 執行提交支援回報」            | `/diagnostics [note]`                            |
| 「只針對這個附加的執行緒傳送 Codex 意見回饋」    | `/codex diagnostics [note]`                      |
| 「將我的 ChatGPT/Codex 訂閱與 Codex 執行階段一起使用」 | `openai/*` 加上 `agentRuntime.id: "codex"`       |
| 「透過 PI 使用我的 ChatGPT/Codex 訂閱」         | `openai-codex/*` 模型參照                      |
| 「透過 ACP/acpx 執行 Codex」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「在執行緒中啟動 Claude Code/Gemini/OpenCode/Cursor」 | ACP/acpx，而不是 `/codex`，也不是原生子代理 |

只有在 ACP 已啟用、可派送，且由已載入的執行階段後端支援時，
OpenClaw 才會向代理公告 ACP 產生指引。如果 ACP 不可用，
系統提示和 Plugin Skills 不應教導代理 ACP 路由。

## 僅 Codex 部署

當你需要證明每個內嵌代理回合都使用 Codex 時，請強制使用 Codex 執行框架。
明確的 Plugin 執行階段預設沒有 PI 後援，因此
`fallback: "none"` 是選用的，但通常很適合作為文件說明：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

環境覆寫：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

強制使用 Codex 時，如果 Codex Plugin 已停用、應用程式伺服器太舊，
或應用程式伺服器無法啟動，OpenClaw 會提早失敗。只有在你有意讓 PI 處理缺失的執行框架選擇時，
才設定 `OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 每代理 Codex

你可以讓一個代理僅使用 Codex，同時讓預設代理保持一般自動選擇：

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
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
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

使用一般工作階段命令切換代理和模型。`/new` 會建立新的
OpenClaw 工作階段，而 Codex 執行框架會視需要建立或繼續它的側車應用程式伺服器
執行緒。`/reset` 會清除此執行緒的 OpenClaw 工作階段綁定，
並讓下一個回合再次從目前設定解析執行框架。

## 模型探索

預設情況下，Codex Plugin 會向應用程式伺服器詢問可用模型。如果
探索失敗或逾時，它會使用內建的後援目錄：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以在 `plugins.entries.codex.config.discovery` 下調整探索：

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

如果你希望啟動時避免探測 Codex，並固定使用後援目錄，請停用探索：

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

## 應用程式伺服器連線與政策

預設情況下，Plugin 會使用以下命令在本機啟動 OpenClaw 管理的 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

受管理的二進位檔會隨 `codex` Plugin 套件一起提供。這會讓
應用程式伺服器版本與內建 Plugin 綁定，而不是與本機剛好安裝的任何獨立
Codex CLI 綁定。只有在你有意執行不同的可執行檔時，
才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO 模式啟動本機 Codex 執行框架工作階段：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這是自主 Heartbeat 使用的受信任本機操作員姿態：
Codex 可以使用 shell 和網路工具，而不會停在沒有人能回應的原生核准提示。

若要選用 Codex 監護者審核的核准，請設定 `appServer.mode:
"guardian"`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian 模式使用 Codex 的原生自動審核核准路徑。當 Codex 要求
離開沙箱、寫入工作區外部，或新增網路存取等權限時，
Codex 會將該核准要求路由給原生審核者，而不是人類提示。審核者會套用 Codex 的風險框架，
並核准或拒絕該特定要求。當你想要比 YOLO 模式更多防護措施，
但仍需要無人看管的代理持續推進時，請使用 Guardian。

`guardian` 預設集會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
個別政策欄位仍會覆寫 `mode`，因此進階部署可以將
預設集與明確選項混用。較舊的 `guardian_subagent` 審核者值
仍可作為相容別名接受，但新設定應使用
`auto_review`。

對於已在執行的應用程式伺服器，請使用 WebSocket 傳輸：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

stdio 應用程式伺服器啟動預設會繼承 OpenClaw 的程序環境，
但 OpenClaw 擁有 Codex 應用程式伺服器帳號橋接，並會將
`CODEX_HOME` 和 `HOME` 都設定為該代理 OpenClaw 狀態下的每代理目錄。
Codex 自身的 Skill 載入器會讀取 `$CODEX_HOME/skills` 和
`$HOME/.agents/skills`，因此兩個值都會針對本機應用程式伺服器
啟動進行隔離。這會讓 Codex 原生 Skills、Plugin、設定、帳號和執行緒
狀態限定於 OpenClaw 代理範圍，而不會從操作員的個人 Codex CLI 主目錄洩入。

OpenClaw Plugin 和 OpenClaw Skill 快照仍會透過 OpenClaw 自己的
Plugin 登錄和 Skill 載入器流動。個人 Codex CLI 資產則不會。如果你有
有用的 Codex CLI Skills 或 Plugin，且它們應成為 OpenClaw 代理的一部分，
請明確列出它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 遷移供應器會將 Skills 複製到目前的 OpenClaw 代理
工作區。Codex 原生 Plugin、掛鉤和設定檔會被回報或封存
以供人工審查，而不是自動啟用，因為它們可以
執行命令、公開 MCP 伺服器，或攜帶憑證。

驗證會依此順序選取：

1. 該代理的明確 OpenClaw Codex 驗證設定檔。
2. 該代理 Codex 主目錄中應用程式伺服器的既有帳號。
3. 僅適用於本機 stdio 應用程式伺服器啟動：當沒有應用程式伺服器帳號存在，
   且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，它會從產生的
Codex 子程序移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓
Gateway 層級的 API 金鑰仍可用於嵌入或直接 OpenAI 模型，
而不會讓原生 Codex 應用程式伺服器回合意外透過 API 計費。
明確的 Codex API 金鑰設定檔和本機 stdio 環境金鑰後援會使用應用程式伺服器
登入，而不是繼承子程序環境。WebSocket 應用程式伺服器連線
不會收到 Gateway 環境 API 金鑰後援；請使用明確的驗證設定檔，或使用
遠端應用程式伺服器自己的帳號。

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

`appServer.clearEnv` 只會影響產生的 Codex 應用程式伺服器子程序。

Codex 動態工具預設使用 `native-first` 設定檔。在該模式下，
OpenClaw 不會公開重複 Codex 原生工作區操作的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`，以及
`update_plan`。OpenClaw 整合工具，例如訊息、工作階段、媒體、
cron、瀏覽器、節點、Gateway、`heartbeat_respond`，以及 `web_search` 仍然
可用。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設值             | 意義                                                                                   |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"`   | 使用 `"openclaw-compat"` 可將完整的 OpenClaw 動態工具集公開給 Codex app-server。       |
| `codexDynamicToolsExclude` | `[]`               | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                         |

支援的 `appServer` 欄位：

| 欄位                | 預設值                                   | 意義                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                           |
| `command`           | 受管理的 Codex binary                    | stdio 傳輸的可執行檔。保持未設定以使用受管理的 binary；只有在明確覆寫時才設定。                                                                                                                                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸的引數。                                                                                                                                                                                                                |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                        |
| `authToken`         | 未設定                                   | WebSocket 傳輸的 Bearer token。                                                                                                                                                                                                   |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                           |
| `clearEnv`          | `[]`                                     | 在 OpenClaw 建立其繼承環境後，從產生的 stdio app-server 行程中移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給本機啟動時 OpenClaw 的每代理 Codex 隔離使用。 |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 呼叫的逾時。                                                                                                                                                                                            |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian-reviewed 執行的預設值。                                                                                                                                                                                          |
| `approvalPolicy`    | `"never"`                                | 傳送到 thread start/resume/turn 的原生 Codex approval policy。                                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | 傳送到 thread start/resume 的原生 Codex sandbox 模式。                                                                                                                                                                            |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審核原生 approval prompt。`guardian_subagent` 仍是舊版別名。                                                                                                                                        |
| `serviceTier`       | 未設定                                   | 選用的 Codex app-server service tier：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                                         |

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到界限限制：每個 Codex `item/tool/call` 請求都必須在 30 秒內收到
OpenClaw 回應。逾時時，OpenClaw 會在支援的情況下中止工具
signal，並將失敗的動態工具回應傳回 Codex，讓該回合可以繼續，而不是讓 session 停留在 `processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 請求後，harness
也預期 Codex 會以 `turn/completed` 完成原生回合。如果
app-server 在該回應後靜默 60 秒，OpenClaw 會盡力
interrupt Codex 回合、記錄診斷逾時，並釋放
OpenClaw session lane，讓後續聊天訊息不會排在過時的
原生回合後方。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的 binary。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於可重複部署，建議使用 config，因為它會將 Plugin 行為保留在與其餘 Codex harness 設定相同的已審核檔案中。

## 電腦使用

電腦使用有自己的設定指南：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會 vendor 桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex app-server，驗證
`computer-use` MCP server 可用，然後讓 Codex 在 Codex 模式回合期間處理原生
MCP 工具呼叫。

若要在 Codex marketplace 流程之外直接存取 TryCua driver，請用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊
`cua-driver mcp`。
請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解
Codex 擁有的電腦使用與直接 MCP 註冊之間的差異。

最小 config：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

可以從 command surface 檢查或安裝設定：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

電腦使用僅適用於 macOS，且在 Codex MCP server 能控制應用程式之前，
可能需要本機 OS 權限。如果 `computerUse.enabled` 為 true 且 MCP
server 無法使用，Codex 模式回合會在線程開始前失敗，而不是
在沒有原生電腦使用工具的情況下靜默執行。請參閱
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use) 了解 marketplace 選項、
遠端 catalog 限制、狀態原因與疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex
尚未發現本機 marketplace，OpenClaw 可以從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
註冊標準 bundled Codex Desktop marketplace。變更 runtime 或電腦使用 config 後，請使用 `/new` 或 `/reset`，讓現有 session 不會保留舊的
PI 或 Codex thread 綁定。

## 常見 recipes

使用預設 stdio 傳輸的本機 Codex：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

僅 Codex 的 harness 驗證：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
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

Guardian-reviewed Codex approvals：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

含明確標頭的遠端 app-server：

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
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

模型切換仍由 OpenClaw 控制。當 OpenClaw session 附加到現有 Codex thread 時，下一個回合會再次將目前選取的
OpenAI model、provider、approval policy、sandbox 和 service tier 傳送到
app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留
thread 綁定，但要求 Codex 以新選取的模型繼續。

## Codex command

bundled Plugin 會將 `/codex` 註冊為授權的 slash command。它是
通用的，適用於任何支援 OpenClaw 文字命令的 channel。

常見形式：

- `/codex status` 顯示即時 app-server 連線能力、模型、帳戶、rate limits、MCP servers 和 skills。
- `/codex models` 列出即時 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex threads。
- `/codex resume <thread-id>` 將目前的 OpenClaw session 附加到現有 Codex thread。
- `/codex compact` 要求 Codex app-server compact 附加的 thread。
- `/codex review` 為附加的 thread 啟動 Codex 原生 review。
- `/codex diagnostics [note]` 在傳送附加 thread 的 Codex 診斷 feedback 前先詢問。
- `/codex computer-use status` 檢查設定的電腦使用 Plugin 和 MCP server。
- `/codex computer-use install` 安裝設定的電腦使用 Plugin 並重新載入 MCP servers。
- `/codex account` 顯示帳戶和 rate-limit 狀態。
- `/codex mcp` 列出 Codex app-server MCP server 狀態。
- `/codex skills` 列出 Codex app-server skills。

### 常見除錯 workflow

當 Codex 支援的代理在 Telegram、Discord、Slack
或其他 channel 中做出令人意外的事時，請從問題發生的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload`，或另一段描述你看到內容的簡短備註
   。
2. 核准診斷要求一次。核准會建立本機 Gateway 診斷 zip，且因為工作階段使用 Codex harness，也會
   將相關的 Codex 回饋套件傳送到 OpenAI 伺服器。
3. 將完成的診斷回覆複製到錯誤回報或支援討論串。
   其中包含本機套件路徑、隱私摘要、OpenClaw 工作階段 id、
   Codex 討論串 id，以及每個 Codex 討論串的一行 `Inspect locally`。
4. 如果你想自行偵錯該次執行，請在終端機中執行印出的 `Inspect locally`
   命令。它看起來像 `codex resume <thread-id>`，會開啟原生 Codex 討論串，
   讓你檢查對話、在本機繼續，或詢問 Codex 為什麼選擇特定工具或計畫。

只有在你明確想為目前附加的討論串上傳 Codex
回饋，而不需要完整 OpenClaw
Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。對大多數支援回報而言，`/diagnostics [note]`
是更好的起點，因為它會在同一則回覆中把本機 Gateway 狀態與 Codex
討論串 id 串在一起。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)，了解完整的隱私模型與群組聊天行為。

核心 OpenClaw 也提供僅限擁有者的 `/diagnostics [note]`，作為一般
Gateway 診斷命令。它的核准提示會顯示敏感資料前言、連結到[診斷匯出](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec 核准要求
`openclaw gateway diagnostics export --json`。請勿使用允許全部的規則核准診斷。核准後，
OpenClaw 會傳送可貼上的報告，其中包含本機套件路徑與清單摘要。當作用中的 OpenClaw 工作階段正在使用 Codex harness 時，
同一個核准也會授權將相關的 Codex 回饋套件傳送到
OpenAI 伺服器。核准提示會說明將傳送 Codex 回饋，但
在核准前不會列出 Codex 工作階段或討論串 id。

如果 `/diagnostics` 是由群組聊天中的擁有者叫用，OpenClaw 會保持
共享頻道乾淨：群組只會收到一則簡短通知，而
診斷前言、核准提示，以及 Codex 工作階段/討論串 id 會透過
私人核准路由傳送給擁有者。如果沒有私人擁有者路由，
OpenClaw 會拒絕群組要求，並要求擁有者從私訊執行。

已核准的 Codex 上傳會呼叫 Codex app-server `feedback/upload`，並要求
app-server 在可用時包含每個列出討論串與衍生 Codex 子討論串的記錄。
上傳會透過 Codex 一般的回饋路徑傳送到 OpenAI
伺服器；如果該 app-server 停用 Codex 回饋，此命令會回傳
app-server 錯誤。完成的診斷回覆會列出已傳送討論串的頻道、
OpenClaw 工作階段 id、Codex 討論串 id，以及本機 `codex resume <thread-id>`
命令。如果你拒絕或忽略核准，
OpenClaw 不會印出那些 Codex id。這次上傳不會取代本機
Gateway 診斷匯出。

`/codex resume` 會寫入 harness 在一般回合中使用的同一個 sidecar 繫結檔。
在下一則訊息時，OpenClaw 會恢復該 Codex 討論串，將
目前選取的 OpenClaw 模型傳入 app-server，並保持延伸歷史記錄啟用。

### 從 CLI 檢查 Codex 討論串

了解一次不良 Codex 執行的最快方式，通常是直接開啟原生 Codex
討論串：

```sh
codex resume <thread-id>
```

當你在頻道對話中注意到錯誤，並想檢查
有問題的 Codex 工作階段、在本機繼續，或詢問 Codex 為什麼做出
特定工具或推理選擇時，請使用此方式。最簡單的路徑通常是先執行
`/diagnostics [note]`：核准後，完成的報告會列出
每個 Codex 討論串，並印出一個 `Inspect locally` 命令，例如
`codex resume <thread-id>`。你可以直接將該命令複製到終端機。

你也可以從目前聊天的 `/codex binding`，或近期 Codex app-server 討論串的
`/codex threads [filter]` 取得討論串 id，然後在 shell 中執行相同的
`codex resume` 命令。

此命令介面需要 Codex app-server `0.125.0` 或更新版本。如果未來或自訂的 app-server 未公開該 JSON-RPC 方法，
個別控制方法會回報為 `unsupported by this Codex app-server`。

## Hook 邊界

Codex harness 有三個 hook 層：

| 層                                    | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook                  | OpenClaw                 | 跨 PI 與 Codex harness 的產品/Plugin 相容性。                       |
| Codex app-server 擴充 middleware      | OpenClaw bundled plugins | 圍繞 OpenClaw 動態工具的每回合配接器行為。                         |
| Codex 原生 hook                       | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。               |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由
OpenClaw Plugin 行為。對於支援的原生工具與權限橋接，
OpenClaw 會為 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 與 `Stop` 注入每個討論串的 Codex 設定。其他 Codex hook，例如 `SessionStart` 與
`UserPromptSubmit`，仍然是 Codex 層級的控制；它們不會在 v1 合約中公開為
OpenClaw Plugin hook。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求呼叫後執行工具，
因此 OpenClaw 會在 harness 配接器中觸發它所擁有的 Plugin 與 middleware 行為。對於 Codex 原生工具，Codex 擁有標準工具記錄。
OpenClaw 可以鏡像選定事件，但除非 Codex 透過 app-server 或原生 hook
回呼公開該操作，否則 OpenClaw 無法改寫原生 Codex 討論串。

Compaction 與 LLM 生命週期投影來自 Codex app-server
通知與 OpenClaw 配接器狀態，而不是原生 Codex hook 命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 與
`llm_output` 事件是配接器層級的觀察，不是 Codex
內部要求或 Compaction 負載的逐位元組擷取。

Codex 原生 `hook/started` 與 `hook/completed` app-server 通知會
投影為 `codex_app_server.hook` 代理事件，用於軌跡與偵錯。
它們不會叫用 OpenClaw Plugin hook。

## V1 支援合約

Codex 模式不是底層換成不同模型呼叫的 PI。Codex 擁有更多
原生模型迴圈，而 OpenClaw 會圍繞該邊界調整其 Plugin 與工作階段介面。

Codex runtime v1 支援：

| 介面                                          | 支援                                    | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈                 | 支援                                    | Codex app-server 擁有 OpenAI 回合、原生討論串恢復，以及原生工具接續。                                                                                                                               |
| OpenClaw 頻道路由與傳遞                       | 支援                                    | Telegram、Discord、Slack、WhatsApp、iMessage 與其他頻道保持在模型 runtime 之外。                                                                                                                    |
| OpenClaw 動態工具                             | 支援                                    | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 仍在執行路徑中。                                                                                                                                    |
| 提示與脈絡 Plugin                             | 支援                                    | OpenClaw 在啟動或恢復討論串前，建立提示覆蓋並將脈絡投影到 Codex 回合中。                                                                                                                           |
| 脈絡引擎生命週期                              | 支援                                    | 組裝、擷取或回合後維護，以及脈絡引擎 Compaction 協調會為 Codex 回合執行。                                                                                                                           |
| 動態工具 hook                                 | 支援                                    | `before_tool_call`、`after_tool_call` 與工具結果 middleware 會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                     |
| 生命週期 hook                                 | 作為配接器觀察支援                      | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 與 `after_compaction` 會以如實的 Codex 模式負載觸發。                                                                                     |
| 最終答案修訂閘門                              | 透過原生 hook relay 支援                | Codex `Stop` 會 relay 到 `before_agent_finalize`；`revise` 會要求 Codex 在最終化前再執行一次模型傳遞。                                                                                               |
| 原生 shell、patch 與 MCP 封鎖或觀察           | 透過原生 hook relay 支援                | Codex `PreToolUse` 與 `PostToolUse` 會針對已承諾的原生工具介面進行 relay，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 負載。支援封鎖；不支援改寫引數。 |
| 原生權限政策                                  | 透過原生 hook relay 支援                | 在 runtime 公開時，Codex `PermissionRequest` 可以透過 OpenClaw 政策路由。如果 OpenClaw 未回傳決策，Codex 會繼續走一般 guardian 或使用者核准路徑。      |
| App-server 軌跡擷取                           | 支援                                    | OpenClaw 會記錄它傳送給 app-server 的要求，以及收到的 app-server 通知。                                                                                                                             |

Codex runtime v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                        | 未來路徑                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生工具前置 hooks 可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。                                                                  | 需要 Codex hook/schema 支援替換工具輸入。                                                 |
| 可編輯的 Codex 原生轉錄歷史                         | Codex 擁有標準原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來情境，但不應變更未支援的內部結構。                                                | 如果需要原生執行緒手術式修改，請新增明確的 Codex app-server API。                        |
| Codex 原生工具記錄的 `tool_result_persist`          | 該 hook 會轉換 OpenClaw 擁有的轉錄寫入，而不是 Codex 原生工具記錄。                                                                            | 可以鏡像轉換後的記錄，但標準重寫需要 Codex 支援。                                        |
| 豐富的原生 Compaction 中繼資料                      | OpenClaw 會觀察 Compaction 的開始與完成，但不會收到穩定的保留/丟棄清單、token 差異或摘要 payload。                                           | 需要更豐富的 Codex Compaction 事件。                                                     |
| Compaction 介入                                     | 目前 OpenClaw Compaction hooks 在 Codex 模式中屬於通知層級。                                                                                  | 如果 plugins 需要否決或重寫原生 Compaction，請新增 Codex 前置/後置 Compaction hooks。    |
| 逐位元組一致的模型 API 請求擷取                     | OpenClaw 可以擷取 app-server 請求與通知，但 Codex core 會在內部建構最終 OpenAI API 請求。                                                     | 需要 Codex 模型請求追蹤事件或偵錯 API。                                                  |

## 工具、媒體和 Compaction

Codex harness 只會變更低層級的嵌入式 agent executor。

OpenClaw 仍會建構工具清單，並從 harness 接收動態工具結果。文字、圖片、影片、音樂、TTS、核准，以及訊息工具輸出，會繼續透過一般 OpenClaw 傳遞路徑。

原生 hook relay 刻意保持通用，但 v1 支援合約僅限於 OpenClaw 測試過的 Codex 原生工具與權限路徑。在 Codex 執行階段中，這包括 shell、patch，以及 MCP `PreToolUse`、`PostToolUse` 和 `PermissionRequest` payload。在執行階段合約明確命名前，不要假設每個未來的 Codex hook 事件都是 OpenClaw plugin 介面。

對於 `PermissionRequest`，OpenClaw 只會在政策做出決定時回傳明確的允許或拒絕決策。沒有決策的結果不是允許。Codex 會將其視為沒有 hook 決策，並落回自己的 guardian 或使用者核准路徑。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准 elicitation 會透過 OpenClaw 的 plugin 核准流程路由。Codex `request_user_input` 提示會送回來源聊天，而下一則排入佇列的後續訊息會回答該原生伺服器請求，而不是被導向為額外情境。其他 MCP elicitation 請求仍會封閉失敗。

作用中執行佇列導向會對應到 Codex app-server `turn/steer`。使用預設 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的安靜視窗內批次處理排入佇列的聊天訊息，並依抵達順序以一個 `turn/steer` 請求送出。舊版 `queue` 模式會傳送個別的 `turn/steer` 請求。Codex review 和手動 Compaction turn 可能會拒絕同一 turn 的導向，此時若所選模式允許 fallback，OpenClaw 會使用 followup 佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當所選模型使用 Codex harness 時，原生執行緒 Compaction 會委派給 Codex app-server。OpenClaw 會保留轉錄鏡像，用於頻道歷史、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。該鏡像包含使用者提示、最終 assistant 文字，以及 app-server 發出時的輕量 Codex 推理或計畫記錄。目前，OpenClaw 只會記錄原生 Compaction 開始與完成訊號。它尚未公開人類可讀的 Compaction 摘要，也沒有可稽核的清單說明 Codex 在 Compaction 後保留了哪些項目。

因為 Codex 擁有標準原生執行緒，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入 OpenClaw 擁有的 session 轉錄工具結果時套用。

媒體生成不需要 PI。圖片、影片、音樂、PDF、TTS 和媒體理解會繼續使用相符的供應商/模型設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 疑難排解

**Codex 不會顯示為一般 `/model` 供應商：** 對於新設定，這是預期行為。選取含有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` 參照）、啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 當沒有 Codex harness 宣告該執行時，`agentRuntime.id: "auto"` 仍可能使用 PI 作為相容性後端。測試時請設定 `agentRuntime.id: "codex"` 以強制選取 Codex。除非你明確設定 `agentRuntime.fallback: "pi"`，否則強制 Codex 執行階段現在會失敗，而不是 fallback 到 PI。一旦選取 Codex app-server，其失敗會直接浮現，不需要額外的 fallback 設定。

**app-server 被拒絕：** 升級 Codex，讓 app-server 交握回報版本 `0.125.0` 或更新版本。相同版本的 prerelease 或帶有 build 後綴的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，會被拒絕，因為穩定版 `0.125.0` protocol floor 才是 OpenClaw 測試的基準。

**模型探索很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket 傳輸立即失敗：** 檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server protocol 版本。

**非 Codex 模型使用 PI：** 除非你已為該 agent 強制設定 `agentRuntime.id: "codex"`，或選取舊版 `codex/*` 參照，否則這是預期行為。純 `openai/gpt-*` 和其他供應商參照在 `auto` 模式下會維持在其一般供應商路徑。如果你強制設定 `agentRuntime.id: "codex"`，該 agent 的每個嵌入式 turn 都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具無法執行：** 從全新 session 檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果問題持續，請重新啟動 Gateway 以清除過時的原生 hook 註冊。如果 `computer-use.list_apps` 逾時，請重新啟動 Codex Computer Use 或 Codex Desktop 後再試一次。

## 相關

- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [Agent 執行階段](/zh-TW/concepts/agent-runtimes)
- [模型供應商](/zh-TW/concepts/model-providers)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin hooks](/zh-TW/plugins/hooks)
- [設定參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
