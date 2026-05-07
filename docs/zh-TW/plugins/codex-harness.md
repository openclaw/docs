---
read_when:
    - 你想要使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅限 Codex 的部署失敗，而不是回退到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 執行環境
x-i18n:
    generated_at: "2026-05-07T01:53:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 讓 OpenClaw 透過 Codex app-server 執行嵌入式代理回合，而不是使用內建的 PI harness。

當你希望 Codex 擁有低階代理工作階段時，請使用此設定：模型探索、原生執行緒續接、原生 Compaction，以及 app-server 執行。OpenClaw 仍然擁有聊天頻道、工作階段檔案、模型選擇、工具、核准、媒體傳遞，以及可見逐字稿鏡像。

當來源聊天回合透過 Codex harness 執行時，如果部署未明確設定 `messages.visibleReplies`，可見回覆預設會使用 OpenClaw `message` 工具。代理仍可私下完成其 Codex 回合；只有在呼叫 `message(action="send")` 時，才會發佈到頻道。設定 `messages.visibleReplies: "automatic"` 可讓直接聊天的最終回覆保留在舊版自動傳遞路徑上。

Codex Heartbeat 回合預設也會取得 `heartbeat_respond` 工具，因此代理可記錄這次喚醒應保持安靜還是通知，而不必把該控制流程編碼到最終文字中。

Heartbeat 專用的主動性指引會作為 Codex 協作模式的開發者指示，隨 Heartbeat 回合本身送出。一般聊天回合會還原為 Codex Default 模式，而不是在其一般執行階段提示中帶入 Heartbeat 理念。

如果你想先建立方向感，請從
[代理執行階段](/zh-TW/concepts/agent-runtimes)開始。簡短說法是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他頻道仍是通訊介面。

## 快速設定

多數想要「OpenClaw 中的 Codex」的使用者會想走這條路徑：使用 ChatGPT/Codex 訂閱登入，然後透過原生 Codex app-server 執行階段執行嵌入式代理回合。模型參照仍保持標準的 `openai/gpt-*`；訂閱驗證來自 Codex 帳號/設定檔，而不是來自 `openai-codex/*` 模型前綴。

如果尚未登入，請先使用 Codex OAuth 登入：

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

不要在設定中使用 `openai-codex/gpt-*`。該前綴是舊版路徑，`openclaw doctor --fix` 會把主要模型、後備模型、Heartbeat/子代理/Compaction 覆寫、hooks、頻道覆寫，以及過時的持久化工作階段路徑釘選，全部改寫為 `openai/gpt-*`。

## 這個 Plugin 會變更什麼

隨附的 `codex` Plugin 提供幾項獨立能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式執行階段                | `agentRuntime.id: "codex"`                          | 透過 Codex app-server 執行 OpenClaw 嵌入式代理回合。                         |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話繫結並控制 Codex app-server 執行緒。                               |
| Codex app-server 提供者/目錄      | `codex` 內部項目，透過 harness 呈現                 | 讓執行階段探索並驗證 app-server 模型。                                       |
| Codex 媒體理解路徑                | `codex/*` 影像模型相容性路徑                        | 為支援的影像理解模型執行有界的 Codex app-server 回合。                      |
| 原生 hook 轉送                    | Codex 原生事件周圍的 Plugin hooks                   | 讓 OpenClaw 觀察/封鎖支援的 Codex 原生工具/完成事件。                       |

啟用 Plugin 會讓這些能力可用。它**不會**：

- 對每個 OpenAI 模型都開始使用 Codex
- 在 doctor 驗證 Codex 已安裝、已啟用、提供 `codex` harness，且 OAuth 可用之前，就把 `openai-codex/*` 模型參照轉成原生執行階段
- 讓 ACP/acpx 成為預設 Codex 路徑
- 熱切換已記錄 PI 執行階段的既有工作階段
- 取代 OpenClaw 頻道傳遞、工作階段檔案、驗證設定檔儲存，或訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制命令介面。如果 Plugin 已啟用，且使用者要求從聊天中繫結、續接、導引、停止或檢查 Codex 執行緒，代理應優先使用 `/codex ...` 而不是 ACP。當使用者要求 ACP/acpx 或正在測試 ACP Codex adapter 時，ACP 仍是明確的後備選項。

原生 Codex 回合會保留 OpenClaw Plugin hooks 作為公開相容層。這些是程序內的 OpenClaw hooks，不是 Codex `hooks.json` 命令 hooks：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用於鏡像逐字稿記錄
- `before_agent_finalize`，透過 Codex `Stop` 轉送
- `agent_end`

Plugin 也可以註冊執行階段中立的工具結果中介軟體，在 OpenClaw 執行工具之後、結果回傳給 Codex 之前，改寫 OpenClaw 動態工具結果。這不同於公開的 `tool_result_persist` Plugin hook；後者會轉換 OpenClaw 擁有的逐字稿工具結果寫入。

關於 Plugin hook 語意本身，請參閱 [Plugin hooks](/zh-TW/plugins/hooks) 和 [Plugin guard behavior](/zh-TW/tools/plugin)。

harness 預設關閉。新設定應將 OpenAI 模型參照維持為標準的 `openai/gpt-*`，並在需要原生 app-server 執行時，明確強制使用 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版 `codex/*` 模型參照仍會為了相容性而自動選取 harness，但由執行階段支援的舊版提供者前綴不會顯示為一般模型/提供者選項。

如果任何已設定的模型路徑仍是 `openai-codex/*`，`openclaw doctor --fix` 會將其改寫為 `openai/*`。對於相符的代理路徑，只有在 Codex Plugin 已安裝、已啟用、提供 `codex` harness，且 OAuth 可用時，才會將代理執行階段設定為 `codex`；否則會設定為 `pi`。

## 路徑對照表

變更設定前請先使用此表：

| 想要的行為                                           | 模型參照                   | 執行階段設定                           | 驗證/設定檔路徑             | 預期狀態標籤                 |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱        | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth 或 Codex 帳號    | `Runtime: OpenAI Codex`        |
| 透過一般 OpenClaw runner 使用 OpenAI API             | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| 需要 doctor 修復的舊版設定                           | `openai-codex/gpt-*`       | 修復為 `codex` 或 `pi`                 | 既有設定的驗證              | `doctor --fix` 後重新檢查      |
| 使用保守自動模式的混合提供者                         | 提供者專用參照             | `agentRuntime.id: "auto"`              | 依所選提供者而定            | 取決於所選執行階段            |
| 明確的 Codex ACP adapter 工作階段                    | 取決於 ACP 提示/模型       | `sessions_spawn` 搭配 `runtime: "acp"` | ACP 後端驗證                | ACP 任務/工作階段狀態         |

重要的區分是提供者與執行階段：

- `openai-codex/*` 是 doctor 會改寫的舊版路徑。
- `agentRuntime.id: "codex"` 需要 Codex harness，且如果不可用會封閉失敗。
- `agentRuntime.id: "auto"` 讓已註冊的 harness 宣告相符提供者路徑，但標準 OpenAI 參照仍由 PI 擁有，除非某個 harness 支援該提供者/模型組合。
- `/codex ...` 回答「這個聊天應繫結或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應啟動哪個外部 harness 程序？」

## 選擇正確的模型前綴

OpenAI 系列路徑具有前綴特定性。對於常見的訂閱加原生 Codex 執行階段設定，請使用 `openai/*` 搭配 `agentRuntime.id: "codex"`。請將 `openai-codex/*` 視為 doctor 應改寫的舊版設定：

| 模型參照                                      | 執行階段路徑                                 | 使用時機                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 透過 OpenClaw/PI 管線使用 OpenAI 提供者      | 你想使用目前以 `OPENAI_API_KEY` 直接存取 OpenAI Platform API 的方式。     |
| `openai-codex/gpt-5.5`                        | 由 doctor 修復的舊版路徑                     | 你正在使用舊設定；執行 `openclaw doctor --fix` 來改寫它。                 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | 你想使用 ChatGPT/Codex 訂閱驗證搭配原生 Codex 執行。                     |

當你的帳號公開這些路徑時，GPT-5.5 可同時出現在直接 OpenAI API key 和 Codex 訂閱路徑上。若要使用原生 Codex 執行階段，請使用 `openai/gpt-5.5` 搭配 Codex app-server harness；若要使用直接 API key 流量，請使用沒有 Codex 執行階段覆寫的 `openai/gpt-5.5`。

舊版 `codex/gpt-*` 參照仍會作為相容別名接受。Doctor 相容性遷移會把舊版執行階段參照改寫為標準模型參照，並另外記錄執行階段政策。新的原生 app-server harness 設定應使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前綴區分。一般 OpenAI 路徑請使用 `openai/gpt-*`；當影像理解應透過有界的 Codex app-server 回合執行時，請使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 會將該舊版前綴改寫為 `openai/gpt-*`。Codex app-server 模型必須宣告支援影像輸入；純文字 Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效 harness。如果選擇結果令人意外，請為 `agents/harness` 子系統啟用除錯記錄，並檢查 Gateway 的結構化 `agent harness selected` 記錄。其中包含所選 harness id、選擇原因、執行階段/後備政策，以及在 `auto` 模式下每個 Plugin 候選項目的支援結果。

### doctor 警告代表什麼

當設定的模型參照或持久化工作階段路徑狀態仍使用 `openai-codex/*` 時，`openclaw doctor` 會發出警告。`openclaw doctor --fix` 會將這些路徑改寫為：

- `openai/<model>`
- 當 Codex 已安裝、已啟用、提供 `codex` harness，且 OAuth 可用時，改為 `agentRuntime.id: "codex"`
- 否則改為 `agentRuntime.id: "pi"`

`codex` 路徑會強制使用原生 Codex harness。`pi` 路徑會讓代理保留在預設 OpenClaw runner 上，而不是因舊版路徑清理的副作用而啟用或安裝 Codex。
Doctor 也會修復已探索代理工作階段存放區中的過時持久化工作階段釘選，避免舊對話卡在已移除的路徑上。

Harness 選擇不是即時工作階段控制。當嵌入式回合執行時，
OpenClaw 會在該工作階段記錄所選的 harness id，並在相同工作階段 id
的後續回合持續使用它。當你希望未來的工作階段使用另一個 harness 時，
請變更 `agentRuntime` 設定或 `OPENCLAW_AGENT_RUNTIME`；若要在現有對話中
於 PI 與 Codex 之間切換，請先使用 `/new` 或 `/reset` 開始新的工作階段。
這可避免將同一份轉錄透過兩個不相容的原生工作階段系統重播。

在 harness 固定之前建立的舊版工作階段，只要已有轉錄歷史，就會被視為
已固定到 PI。變更設定後，請使用 `/new` 或 `/reset` 將該對話改用
Codex。

`/status` 會顯示有效的模型執行階段。預設 PI harness 會顯示為
`Runtime: OpenClaw Pi Default`，Codex app-server harness 會顯示為
`Runtime: OpenAI Codex`。

## 需求

- OpenClaw，並可使用內建的 `codex` plugin。
- Codex app-server `0.125.0` 或更新版本。內建 plugin 預設會管理相容的
  Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 命令不會影響
  一般 harness 啟動。
- app-server 程序或 OpenClaw 的 Codex 驗證橋接器可使用 Codex 驗證。
  本機 app-server 啟動會為每個 agent 使用 OpenClaw 管理的 Codex home，
  以及隔離的子程序 `HOME`，因此預設不會讀取你的個人 `~/.codex` 帳戶、
  skills、plugins、設定、thread 狀態，或原生 `$HOME/.agents/skills`。

plugin 會阻擋較舊或未版本化的 app-server 交握。這可讓 OpenClaw 維持在
已測試過的協定介面上。

對於 live 與 Docker 煙霧測試，驗證通常來自 Codex CLI 帳戶或 OpenClaw
`openai-codex` 驗證設定檔。本機 stdio app-server 啟動在沒有帳戶時，也能
回退到 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作區啟動檔案

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。OpenClaw
不會寫入合成的 Codex 專案文件檔，也不依賴 Codex fallback
檔名作為 persona 檔案，因為 Codex fallback 只會在
`AGENTS.md` 缺少時套用。

為了與 OpenClaw 工作區保持一致，Codex harness 會解析其他啟動檔案
（存在時包含 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md` 與 `MEMORY.md`），並在 `thread/start` 與 `thread/resume`
透過 Codex 開發者指令轉送。這會讓 `SOUL.md` 與相關工作區 persona/profile
脈絡在原生 Codex 行為塑形路徑上可見，而不需要複製 `AGENTS.md`。

## 將 Codex 與其他模型並用

如果同一個 agent 應能在 Codex 與非 Codex provider 模型之間自由切換，
請不要全域設定 `agentRuntime.id: "codex"`。強制 runtime 會套用到該
agent 或工作階段的每個嵌入式回合。如果你在該 runtime 被強制時選擇
Anthropic 模型，OpenClaw 仍會嘗試 Codex harness 並封閉失敗，而不是
默默將該回合透過 PI 路由。

請改用以下其中一種形式：

- 將 Codex 放在具備 `agentRuntime.id: "codex"` 的專用 agent 上。
- 將預設 agent 保持在 `agentRuntime.id: "auto"`，並使用 PI fallback 進行一般混合
  provider 使用。
- 只為相容性使用舊版 `codex/*` refs。新設定應優先使用
  `openai/*` 加上明確的 Codex runtime policy。

例如，這會讓預設 agent 使用一般自動選擇，並新增獨立的 Codex agent：

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

使用這種形式時：

- 預設 `main` agent 會使用一般 provider 路徑與 PI 相容性 fallback。
- `codex` agent 會使用 Codex app-server harness。
- 如果 `codex` agent 缺少 Codex 或不受支援，該回合會失敗，
  而不是悄悄使用 PI。

## Agent 命令路由

Agents 應依意圖路由使用者請求，而不是只依「Codex」這個字：

| 使用者要求...                                          | Agent 應使用...                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「將此聊天綁定到 Codex」                              | `/codex bind`                                    |
| 「在這裡恢復 Codex thread `<id>`」                     | `/codex resume <id>`                             |
| 「顯示 Codex threads」                                 | `/codex threads`                                 |
| 「為不良的 Codex 執行提交支援報告」                   | `/diagnostics [note]`                            |
| 「只為這個附加的 thread 傳送 Codex feedback」          | `/codex diagnostics [note]`                      |
| 「使用我的 ChatGPT/Codex 訂閱搭配 Codex runtime」      | `openai/*` 加上 `agentRuntime.id: "codex"`       |
| 「修復舊的 `openai-codex/*` 設定/工作階段固定」        | `openclaw doctor --fix`                          |
| 「透過 ACP/acpx 執行 Codex」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」 | ACP/acpx，而不是 `/codex`，也不是原生 sub-agents |

OpenClaw 只有在 ACP 已啟用、可派發，且由已載入的 runtime backend
支援時，才會向 agents 宣告 ACP spawn 指引。如果 ACP 不可用，
system prompt 與 plugin skills 不應教導 agent ACP 路由。

## 僅 Codex 部署

當你需要證明每個嵌入式 agent 回合都使用 Codex 時，請強制使用 Codex
harness。明確的 plugin runtimes 會封閉失敗，絕不會默默透過 PI 重試：

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
}
```

環境覆寫：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

強制使用 Codex 時，如果 Codex plugin 已停用、app-server 太舊，或
app-server 無法啟動，OpenClaw 會提早失敗。

## 每個 agent 使用 Codex

你可以讓一個 agent 僅使用 Codex，而預設 agent 保持一般自動選擇：

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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

使用一般工作階段命令來切換 agents 與模型。`/new` 會建立新的
OpenClaw 工作階段，而 Codex harness 會視需要建立或恢復其 sidecar app-server
thread。`/reset` 會清除該 thread 的 OpenClaw 工作階段綁定，並讓下一個
回合再次從目前設定解析 harness。

## 模型探索

預設情況下，Codex plugin 會向 app-server 要求可用模型。如果探索失敗或逾時，
它會使用內建 fallback catalog：

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

當你希望啟動時避免探測 Codex，並固定使用 fallback catalog 時，請停用探索：

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

## App-server 連線與 policy

預設情況下，plugin 會使用以下命令在本機啟動 OpenClaw 管理的 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

受管理的二進位檔會隨 `codex` plugin 套件一起出貨。這會讓
app-server 版本綁定到內建 plugin，而不是本機剛好安裝的任何獨立
Codex CLI。只有在你刻意想執行不同可執行檔時，才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO 模式啟動本機 Codex harness 工作階段：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這是用於自主 Heartbeat 的受信任本機操作員姿態：
Codex 可以使用 shell 與網路工具，而不會停在無人可回應的原生核准提示上。

若要選擇使用 Codex guardian-reviewed approvals，請設定 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自動審查核准路徑。當 Codex 要求離開
sandbox、寫入工作區外部，或新增網路存取等權限時，Codex 會將該核准請求
路由給原生 reviewer，而不是人類提示。reviewer 會套用 Codex 的風險框架，
並核准或拒絕該特定請求。當你想要比 YOLO 模式更多防護，但仍需要無人值守
agents 能持續推進時，請使用 Guardian。

`guardian` preset 會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
個別 policy 欄位仍會覆寫 `mode`，因此進階部署可以將 preset 與明確選項混用。
較舊的 `guardian_subagent` reviewer 值仍會作為相容性別名接受，但新設定應使用
`auto_review`。

對於已在執行中的 app-server，請使用 WebSocket transport：

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

Stdio app-server 啟動預設會繼承 OpenClaw 的程序環境，
但 OpenClaw 擁有 Codex app-server 帳戶橋接器，並會將
`CODEX_HOME` 與 `HOME` 都設定到該 agent 的 OpenClaw 狀態下的每個 agent
目錄。Codex 自身的 skill loader 會讀取 `$CODEX_HOME/skills` 與
`$HOME/.agents/skills`，因此本機 app-server 啟動時這兩個值都是隔離的。
這會讓 Codex 原生 skills、plugins、設定、帳戶與 thread 狀態限定在
OpenClaw agent 範圍內，而不會從操作員的個人 Codex CLI home 洩漏進來。

OpenClaw plugins 與 OpenClaw skill 快照仍會透過 OpenClaw 自己的
plugin registry 與 skill loader 流動。個人 Codex CLI 資產不會如此。
如果你有實用的 Codex CLI skills 或 plugins 應該成為 OpenClaw agent 的一部分，
請明確盤點它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider 會將 skills 複製到目前的 OpenClaw agent 工作區。
Codex 原生 plugins、hooks 與設定檔會回報或封存以供手動審查，而不是自動啟用，
因為它們可以執行命令、公開 MCP servers，或攜帶憑證。

驗證會依以下順序選擇：

1. agent 的明確 OpenClaw Codex 驗證設定檔。
2. app-server 在該 agent 的 Codex home 中既有的帳戶。
3. 僅限本機 stdio app-server 啟動，當沒有 app-server 帳戶且仍需要 OpenAI
   驗證時，使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，它會從產生的 Codex 子行程移除
`CODEX_API_KEY` 與 `OPENAI_API_KEY`。這會讓 Gateway 層級的 API 金鑰仍可用於嵌入或直接的 OpenAI 模型，同時避免原生 Codex app-server 回合意外透過 API 計費。
明確的 Codex API 金鑰設定檔與本機 stdio 環境金鑰後援會使用 app-server
登入，而不是繼承的子行程環境。WebSocket app-server 連線不會收到 Gateway 環境 API 金鑰後援；請使用明確的驗證設定檔，或使用遠端 app-server 自己的帳號。

如果部署需要額外的環境隔離，請將那些變數新增至
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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子行程。

Codex 動態工具預設使用 `native-first` 設定檔。在該模式中，
OpenClaw 不會公開會重複 Codex 原生工作區操作的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 與
`update_plan`。OpenClaw 整合工具，例如訊息、工作階段、媒體、
cron、瀏覽器、節點、gateway、`heartbeat_respond` 與 `web_search` 仍可使用。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設值           | 意義                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 將完整的 OpenClaw 動態工具集公開給 Codex app-server。 |
| `codexDynamicToolsExclude` | `[]`             | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。               |

支援的 `appServer` 欄位：

| 欄位                | 預設值                                   | 意義                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 會產生 Codex；`"websocket"` 會連線至 `url`。                                                                                                                                                                             |
| `command`           | 受管理的 Codex 二進位檔                  | stdio 傳輸使用的可執行檔。保持未設定以使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸使用的引數。                                                                                                                                                                                                       |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                            |
| `authToken`         | 未設定                                   | WebSocket 傳輸使用的 Bearer 權杖。                                                                                                                                                                                                |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | 在 OpenClaw 建立其繼承環境後，從產生的 stdio app-server 行程中移除的額外環境變數名稱。`CODEX_HOME` 與 `HOME` 保留供 OpenClaw 在本機啟動時進行每代理 Codex 隔離使用。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面呼叫的逾時。                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | YOLO 或守護者審閱執行的預設組合。                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | 傳送至 thread start/resume/turn 的原生 Codex 核准政策。                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | 傳送至 thread start/resume 的原生 Codex 沙盒模式。                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審閱原生核准提示。`guardian_subagent` 仍是舊版別名。                                                                                                                         |
| `serviceTier`       | 未設定                                   | 選用的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                            |

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制：每個 Codex `item/tool/call` 要求都必須在 30 秒內收到 OpenClaw 回應。逾時時，OpenClaw 會在支援處中止工具訊號，並向 Codex 回傳失敗的動態工具回應，讓回合可以繼續，而不是讓工作階段停留在 `processing`。

在 OpenClaw 回應 Codex 回合範圍的 app-server 要求後，harness
也預期 Codex 以 `turn/completed` 完成原生回合。如果 app-server 在該回應後靜默 60 秒，OpenClaw 會盡力中斷 Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，讓後續聊天訊息不會排在過期的原生回合後方。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或針對一次性本機測試使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於可重複的部署，偏好使用設定，因為它會把 Plugin 行為與其餘 Codex harness 設定保留在同一個經審閱的檔案中。

## 電腦使用

Computer Use 已在其自己的設定指南中說明：
[Codex Computer Use](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會封裝桌面控制應用程式，也不會自行執行桌面動作。它會準備 Codex app-server、驗證
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間處理原生 MCP 工具呼叫。

若要在 Codex marketplace 流程之外直接存取 TryCua 驅動程式，請使用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊
`cua-driver mcp`。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)，了解 Codex 擁有的 Computer Use 與直接 MCP 註冊之間的差異。

最小設定：

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
      },
    },
  },
}
```

可以從命令介面檢查或安裝設定：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use 是 macOS 專用，且在 Codex MCP 伺服器能控制應用程式之前，可能需要本機 OS 權限。如果 `computerUse.enabled` 為 true 且 MCP 伺服器不可用，Codex 模式回合會在執行緒開始前失敗，而不是在沒有原生 Computer Use 工具的情況下靜默執行。請參閱
[Codex Computer Use](/zh-TW/plugins/codex-computer-use)，了解 marketplace 選項、遠端目錄限制、狀態原因與疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex 尚未發現本機 marketplace，OpenClaw 可以從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊標準內建 Codex Desktop marketplace。變更 runtime 或 Computer Use 設定後，請使用 `/new` 或 `/reset`，讓現有工作階段不會保留舊的 PI 或 Codex 執行緒繫結。

## 常見配方

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

由守護者審閱的 Codex 核准：

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

具有明確標頭的遠端 app-server：

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

模型切換仍由 OpenClaw 控制。當 OpenClaw 工作階段附加至現有 Codex 執行緒時，下一個回合會再次將目前選取的
OpenAI 模型、供應商、核准政策、沙盒與服務層級傳送至
app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex 使用新選取的模型繼續。

## Codex 命令

內建 Plugin 會將 `/codex` 註冊為授權的斜線命令。它是通用的，並可在任何支援 OpenClaw 文字命令的頻道上運作。

常見形式：

- `/codex status` 顯示即時應用程式伺服器連線能力、模型、帳戶、速率限制、MCP 伺服器，以及 Skills。
- `/codex models` 列出即時 Codex 應用程式伺服器模型。
- `/codex threads [filter]` 列出最近的 Codex 執行緒。
- `/codex resume <thread-id>` 將目前的 OpenClaw 工作階段附加到既有的 Codex 執行緒。
- `/codex compact` 要求 Codex 應用程式伺服器壓縮已附加的執行緒。
- `/codex review` 針對已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 在傳送已附加執行緒的 Codex 診斷意見回饋前先詢問。
- `/codex computer-use status` 檢查已設定的 Computer Use Plugin 和 MCP 伺服器。
- `/codex computer-use install` 安裝已設定的 Computer Use Plugin 並重新載入 MCP 伺服器。
- `/codex account` 顯示帳戶和速率限制狀態。
- `/codex mcp` 列出 Codex 應用程式伺服器 MCP 伺服器狀態。
- `/codex skills` 列出 Codex 應用程式伺服器 Skills。

當 Codex 回報用量限制失敗時，如果 Codex 有提供下一次
應用程式伺服器重設時間，OpenClaw 會一併包含該時間。在同一段
對話中使用 `/codex account` 來檢查目前帳戶和速率限制時段。

### 常見偵錯工作流程

當 Codex 支援的代理程式在 Telegram、Discord、Slack
或其他通道中出現意外行為時，請從問題發生的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload`，或另一則簡短註記
   來描述你看到的狀況。
2. 核准診斷要求一次。核准會建立本機 Gateway
   診斷 zip，而且因為工作階段使用 Codex harness，也會
   將相關的 Codex 意見回饋套件傳送到 OpenAI 伺服器。
3. 將完成的診斷回覆複製到錯誤回報或支援討論串中。
   其中包含本機套件路徑、隱私摘要、OpenClaw 工作階段 ID、
   Codex 執行緒 ID，以及每個 Codex 執行緒的 `Inspect locally` 行。
4. 如果你想自行偵錯該次執行，請在終端機中執行列印出的 `Inspect locally`
   命令。它看起來像 `codex resume <thread-id>`，並會開啟
   原生 Codex 執行緒，讓你檢查對話、在本機繼續，
   或詢問 Codex 為何選擇特定工具或計畫。

只有在你明確想為目前附加的執行緒上傳 Codex
意見回饋，而不需要完整 OpenClaw
Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。對大多數支援回報而言，`/diagnostics [note]`
是更好的起點，因為它會在同一則回覆中將本機 Gateway 狀態和 Codex
執行緒 ID 關聯起來。完整的隱私模型與群組聊天行為請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。

核心 OpenClaw 也公開僅限擁有者使用的 `/diagnostics [note]`，作為一般
Gateway 診斷命令。其核准提示會顯示敏感資料
前言、連結到 [診斷匯出](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec 核准要求
`openclaw gateway diagnostics export --json`。不要使用允許所有項目的規則核准診斷。核准後，
OpenClaw 會傳送可貼上的報告，其中包含本機套件路徑和資訊清單
摘要。當作用中的 OpenClaw 工作階段使用 Codex harness 時，同一個
核准也會授權將相關的 Codex 意見回饋套件傳送到
OpenAI 伺服器。核准提示會說明將傳送 Codex 意見回饋，但
在核准前不會列出 Codex 工作階段或執行緒 ID。

如果 `/diagnostics` 由群組聊天中的擁有者叫用，OpenClaw 會保持
共用通道清爽：群組只會收到簡短通知，而
診斷前言、核准提示，以及 Codex 工作階段/執行緒 ID 會透過
私人核准路徑傳送給擁有者。如果沒有私人擁有者路徑，
OpenClaw 會拒絕群組要求，並要求擁有者從 DM 執行。

已核准的 Codex 上傳會呼叫 Codex 應用程式伺服器 `feedback/upload`，並要求
應用程式伺服器在可用時納入每個列出執行緒及衍生 Codex 子執行緒的記錄。
上傳會經由 Codex 一般的意見回饋路徑傳送到 OpenAI
伺服器；如果該應用程式伺服器已停用 Codex 意見回饋，命令會回傳
應用程式伺服器錯誤。完成的診斷回覆會列出已傳送執行緒的通道、
OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機 `codex resume <thread-id>`
命令。如果你拒絕或忽略核准，
OpenClaw 不會列印那些 Codex ID。此上傳不會取代本機
Gateway 診斷匯出。

`/codex resume` 會寫入 harness 用於一般回合的同一個 sidecar 繫結檔。
在下一則訊息時，OpenClaw 會繼續該 Codex 執行緒，將
目前選取的 OpenClaw 模型傳入應用程式伺服器，並保持延伸歷史記錄
啟用。

### 從 CLI 檢查 Codex 執行緒

了解不良 Codex 執行的最快方式，通常是直接開啟原生 Codex
執行緒：

```sh
codex resume <thread-id>
```

當你在通道對話中注意到錯誤，並想檢查有問題的
Codex 工作階段、在本機繼續，或詢問 Codex 為何做出
特定工具或推理選擇時，請使用此方式。最簡單的路徑通常是先執行
`/diagnostics [note]`：核准後，完成的報告會列出
每個 Codex 執行緒並列印 `Inspect locally` 命令，例如
`codex resume <thread-id>`。你可以直接將該命令複製到終端機。

你也可以從目前聊天的 `/codex binding` 取得執行緒 ID，
或從最近 Codex 應用程式伺服器執行緒的 `/codex threads [filter]` 取得，然後在 shell 中執行相同的
`codex resume` 命令。

命令介面需要 Codex 應用程式伺服器 `0.125.0` 或更新版本。如果未來或自訂的
應用程式伺服器未公開該 JSON-RPC 方法，個別控制方法會回報為
`unsupported by this Codex app-server`。

## Hook 邊界

Codex harness 有三個 Hook 層：

| 層級                                  | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin Hooks                 | OpenClaw                 | 跨 PI 和 Codex harness 的產品/Plugin 相容性。                       |
| Codex 應用程式伺服器 extension middleware | OpenClaw bundled Plugins | OpenClaw 動態工具周圍的每回合配接器行為。                          |
| Codex 原生 Hooks                      | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。               |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由
OpenClaw Plugin 行為。針對支援的原生工具和權限橋接，
OpenClaw 會為 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop` 注入每執行緒 Codex 設定。當 Codex 應用程式伺服器核准已啟用
（`approvalPolicy` 不是 `"never"`）時，預設注入的原生 Hook 設定
會省略 `PermissionRequest`，讓 Codex 的應用程式伺服器審查器和 OpenClaw 的核准
橋接在審查後處理真正的升級。操作人員仍可在需要相容性
轉送時，明確將 `permission_request` 加入 `nativeHookRelay.events`。
其他 Codex Hooks，例如 `SessionStart` 和 `UserPromptSubmit`，仍是
Codex 層級控制；它們不會在 v1
合約中公開為 OpenClaw Plugin Hooks。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求
呼叫之後執行工具，因此 OpenClaw 會在
harness 配接器中觸發它所擁有的 Plugin 和 middleware 行為。對於 Codex 原生工具，Codex 擁有標準工具記錄。
OpenClaw 可以鏡射選定事件，但除非 Codex 透過應用程式伺服器或原生 Hook
回呼公開該操作，否則 OpenClaw 無法改寫原生 Codex
執行緒。

Compaction 和 LLM 生命週期投影來自 Codex 應用程式伺服器
通知與 OpenClaw 配接器狀態，而不是原生 Codex Hook 命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是配接器層級觀察，不是 Codex 內部要求或 Compaction
酬載的逐位元組擷取。

Codex 原生 `hook/started` 和 `hook/completed` 應用程式伺服器通知會
投影為 `codex_app_server.hook` 代理程式事件，用於軌跡與偵錯。
它們不會叫用 OpenClaw Plugin Hooks。

## V1 支援合約

Codex 模式不是在底層換用不同模型呼叫的 PI。Codex 擁有更多
原生模型迴圈，而 OpenClaw 會圍繞該邊界配接其 Plugin 和工作階段介面。

Codex runtime v1 支援：

| 介面                                       | 支援狀態                                                                              | 原因                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈               | 支援                                                                            | Codex app-server 擁有 OpenAI 輪次、原生執行緒續接，以及原生工具延續。                                                                                                                 |
| OpenClaw 頻道路由與傳遞         | 支援                                                                            | Telegram、Discord、Slack、WhatsApp、iMessage 及其他頻道會留在模型執行階段之外。                                                                                                           |
| OpenClaw 動態工具                        | 支援                                                                            | Codex 會要求 OpenClaw 執行這些工具，因此 OpenClaw 會留在執行路徑中。                                                                                                                       |
| 提示詞與脈絡 Plugin                    | 支援                                                                            | OpenClaw 會建構提示詞覆蓋層，並在啟動或續接執行緒前，將脈絡投射到 Codex 輪次中。                                                                                           |
| 脈絡引擎生命週期                      | 支援                                                                            | 組裝、擷取或輪次後維護，以及脈絡引擎 Compaction 協調都會為 Codex 輪次執行。                                                                                                |
| 動態工具 hook                            | 支援                                                                            | `before_tool_call`、`after_tool_call` 及工具結果中介軟體會在 OpenClaw 擁有的動態工具周圍執行。                                                                                                 |
| 生命週期 hook                               | 支援作為 adapter 觀察                                                    | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 及 `after_compaction` 會以真實的 Codex 模式 payload 觸發。                                                                                  |
| 最終答案修訂閘門                    | 透過原生 hook relay 支援                                              | Codex `Stop` 會 relay 到 `before_agent_finalize`；`revise` 會要求 Codex 在定稿前再執行一次模型傳遞。                                                                                       |
| 原生 shell、patch 及 MCP 封鎖或觀察 | 透過原生 hook relay 支援                                              | Codex `PreToolUse` 與 `PostToolUse` 會針對已提交的原生工具介面進行 relay，包括 Codex app-server `0.125.0` 或更新版本上的 MCP payload。支援封鎖；不支援參數重寫。      |
| 原生權限政策                      | 透過 Codex app-server 核准與相容性原生 hook relay 支援 | Codex app-server 核准要求會在 Codex 審查後透過 OpenClaw 路由。`PermissionRequest` 原生 hook relay 對原生核准模式採選擇加入，因為 Codex 會在 guardian 審查前發出它。 |
| App-server 軌跡擷取                 | 支援                                                                            | OpenClaw 會記錄它傳送給 app-server 的要求，以及它收到的 app-server 通知。                                                                                                           |

Codex runtime v1 不支援：

| 介面                                             | V1 邊界                                                                                                                                     | 未來路徑                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具參數變更                       | Codex 原生工具前置 hook 可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具參數。                                               | 需要 Codex hook/schema 支援替換工具輸入。                            |
| 可編輯的 Codex 原生 transcript 歷史            | Codex 擁有規範的原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來脈絡，但不應變更不受支援的內部項目。 | 若需要原生執行緒手術，請加入明確的 Codex app-server API。                    |
| Codex 原生工具記錄的 `tool_result_persist` | 該 hook 會轉換 OpenClaw 擁有的 transcript 寫入，而不是 Codex 原生工具記錄。                                                           | 可以鏡像已轉換的記錄，但規範重寫需要 Codex 支援。              |
| 豐富的原生 Compaction metadata                     | OpenClaw 會觀察 Compaction 開始與完成，但不會收到穩定的保留/捨棄清單、token 差異或摘要 payload。            | 需要更豐富的 Codex Compaction 事件。                                                     |
| Compaction 介入                             | 目前 OpenClaw 的 Compaction hook 在 Codex 模式中屬於通知層級。                                                                         | 若 Plugin 需要否決或重寫原生 Compaction，請加入 Codex 前置/後置 Compaction hook。 |
| 逐位元組模型 API 要求擷取             | OpenClaw 可以擷取 app-server 要求與通知，但 Codex core 會在內部建構最終的 OpenAI API 要求。                      | 需要 Codex 模型要求追蹤事件或偵錯 API。                                   |

## 工具、媒體與 Compaction

Codex harness 只會變更低階嵌入式 agent 執行器。

OpenClaw 仍會建構工具清單，並從 harness 接收動態工具結果。文字、圖片、影片、音樂、TTS、核准，以及訊息工具輸出會繼續透過一般 OpenClaw 傳遞路徑。

原生 hook relay 刻意保持通用，但 v1 支援合約僅限於 OpenClaw 測試過的 Codex 原生工具與權限路徑。在 Codex runtime 中，這包括 shell、patch 及 MCP `PreToolUse`、`PostToolUse` 與 `PermissionRequest` payload。在 runtime 合約明確命名前，不要假設未來每個 Codex hook 事件都是 OpenClaw Plugin 介面。

對於 `PermissionRequest`，OpenClaw 只有在政策決定時才會回傳明確的允許或拒絕決策。沒有決策的結果不是允許。Codex 會將它視為沒有 hook 決策，並落入自己的 guardian 或使用者核准路徑。Codex app-server 核准模式預設會省略這個原生 hook；此段適用於 `permission_request` 明確包含在 `nativeHookRelay.events` 中，或相容性 runtime 安裝它時。
當 operator 對 Codex 原生權限要求選擇 `allow-always` 時，OpenClaw 會在有限的 session 視窗內記住該精確的 provider/session/tool input/cwd 指紋。記住的決策刻意只做精確相符：變更的命令、參數、工具 payload 或 cwd 都會建立新的核准。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准 elicitations 會透過 OpenClaw 的 Plugin 核准流程路由。Codex `request_user_input` 提示會傳回原始聊天，而下一則排入佇列的 follow-up 訊息會回答該原生 server 要求，而不是被導向為額外脈絡。其他 MCP elicitation 要求仍會失敗關閉。

作用中執行佇列導向會映射到 Codex app-server `turn/steer`。使用預設 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的安靜視窗內批次處理排入佇列的聊天訊息，並依抵達順序將它們作為單一 `turn/steer` 要求送出。舊版 `queue` 模式會傳送個別的 `turn/steer` 要求。Codex 審查與手動 Compaction 輪次可能拒絕同輪次導向；在這種情況下，若選定模式允許後援，OpenClaw 會使用 followup 佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當選定模型使用 Codex harness 時，原生執行緒 Compaction 會委派給 Codex app-server。OpenClaw 會保留 transcript 鏡像，以供頻道歷史、搜尋、`/new`、`/reset` 以及未來模型或 harness 切換使用。鏡像會包含使用者提示詞、最終 assistant 文字，以及 app-server 發出時的輕量 Codex 推理或計畫記錄。目前，OpenClaw 只會記錄原生 Compaction 開始與完成訊號。它尚未公開人類可讀的 Compaction 摘要，或可稽核的 Codex 在 Compaction 後保留哪些項目的清單。

因為 Codex 擁有規範的原生執行緒，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 正在寫入 OpenClaw 擁有的 session transcript 工具結果時套用。

媒體生成不需要 PI。圖片、影片、音樂、PDF、TTS 與媒體理解會繼續使用相符的 provider/model 設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 及 `messages.tts`。

## 疑難排解

**Codex 不會顯示為一般 `/model` provider：** 對新設定而言，這是預期行為。請選擇具有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` ref）、啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除 `codex`。

**OpenClaw 使用 PI 而非 Codex：** 當沒有 Codex harness 宣告該執行時，`agentRuntime.id: "auto"` 仍可使用 PI 作為相容性後端。測試時請設定 `agentRuntime.id: "codex"` 以強制選擇 Codex。強制 Codex runtime 會失敗，而不是後援到 PI。Codex app-server 一旦被選定，其失敗會直接浮現。

**App-server 被拒絕：** 升級 Codex，讓 app-server handshake 回報版本 `0.125.0` 或更新版本。相同版本的預覽版或帶有 build suffix 的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom` 會被拒絕，因為穩定版 `0.125.0` protocol floor 才是 OpenClaw 測試的基準。

**模型探索很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket transport 立即失敗：** 檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server protocol 版本。

**非 Codex 模型使用 PI：** 除非你已為該 agent 強制設定 `agentRuntime.id: "codex"` 或選擇舊版 `codex/*` ref，否則這是預期行為。純 `openai/gpt-*` 與其他 provider ref 在 `auto` 模式中會留在其一般 provider 路徑。如果你強制設定 `agentRuntime.id: "codex"`，該 agent 的每個嵌入式輪次都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具未執行：** 請從新的工作階段檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果問題持續存在，請重新啟動
Gateway 以清除過時的原生 hook 註冊。如果 `computer-use.list_apps`
逾時，請重新啟動 Codex Computer Use 或 Codex Desktop 後再試一次。

## 相關

- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [Agent runtimes](/zh-TW/concepts/agent-runtimes)
- [Model providers](/zh-TW/concepts/model-providers)
- [OpenAI provider](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin hooks](/zh-TW/plugins/hooks)
- [設定參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
