---
read_when:
    - 你想使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅使用 Codex 的部署失敗，而不是回退到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理程式回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-06T02:53:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353812c804c896eccc3415a108e8b9c4628adb8c98bba8978bfc6c3dc57587b5
    source_path: plugins/codex-harness.md
    workflow: 16
---

內建的 `codex` Plugin 可讓 OpenClaw 透過 Codex app-server 執行嵌入式代理回合，而不是使用內建的 PI harness。

當你希望 Codex 擁有低階代理工作階段時，請使用這個方式：模型探索、原生執行緒續接、原生 Compaction，以及 app-server 執行。OpenClaw 仍然擁有聊天頻道、工作階段檔案、模型選擇、工具、核准、媒體傳遞，以及可見的逐字稿鏡像。

當來源聊天回合透過 Codex harness 執行時，如果部署尚未明確設定 `messages.visibleReplies`，可見回覆預設會使用 OpenClaw `message` 工具。代理仍可私下完成其 Codex 回合；只有在它呼叫 `message(action="send")` 時，才會張貼到頻道。將 `messages.visibleReplies: "automatic"` 設為保留直接聊天最終回覆的舊版自動傳遞路徑。

Codex heartbeat 回合也會預設取得 `heartbeat_respond` 工具，因此代理可以記錄這次喚醒應保持安靜或發出通知，而不必在最終文字中編碼該控制流程。

Heartbeat 專用的主動性指引會作為 Codex 協作模式開發者指令，傳送到 heartbeat 回合本身。一般聊天回合會還原 Codex Default 模式，而不是在其一般執行階段提示中帶著 heartbeat 理念。

如果你正在嘗試建立方向感，請從
[代理執行階段](/zh-TW/concepts/agent-runtimes)開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他頻道仍是通訊介面。

## 快速設定

大多數想要「OpenClaw 中的 Codex」的使用者會想要這條路徑：使用 ChatGPT/Codex 訂閱登入，然後透過原生 Codex app-server 執行階段執行嵌入式代理回合。模型參照仍維持標準形式 `openai/gpt-*`；訂閱驗證來自 Codex 帳號/設定檔，而不是來自 `openai-codex/*` 模型前綴。

如果你尚未登入，請先使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai-codex
```

然後啟用內建的 `codex` Plugin，並強制使用 Codex 執行階段：

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

如果你的設定使用 `plugins.allow`，也請在其中包含 `codex`：

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

不要在設定中使用 `openai-codex/gpt-*`。該前綴是舊版路徑，`openclaw doctor --fix` 會把主要模型、備援、heartbeat/子代理/Compaction 覆寫、hook、頻道覆寫，以及過時的持久化工作階段路徑釘選，全部改寫為 `openai/gpt-*`。

## 這個 Plugin 會變更什麼

內建的 `codex` Plugin 提供幾個獨立能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式執行階段                | `agentRuntime.id: "codex"`                          | 透過 Codex app-server 執行 OpenClaw 嵌入式代理回合。                         |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話中繫結並控制 Codex app-server 執行緒。                             |
| Codex app-server 提供者/目錄      | `codex` 內部，透過 harness 呈現                     | 讓執行階段探索並驗證 app-server 模型。                                       |
| Codex 媒體理解路徑                | `codex/*` 影像模型相容路徑                          | 針對支援的影像理解模型執行受限的 Codex app-server 回合。                     |
| 原生 hook 轉送                    | 圍繞 Codex 原生事件的 Plugin hook                   | 讓 OpenClaw 觀察/阻擋受支援的 Codex 原生工具/完成事件。                      |

啟用這個 Plugin 會讓這些能力可用。它**不會**：

- 開始對每個 OpenAI 模型使用 Codex
- 在未經 doctor 驗證 Codex 已安裝、已啟用、提供 `codex` harness，且 OAuth 可用的情況下，把 `openai-codex/*` 模型參照轉換成原生執行階段
- 讓 ACP/acpx 成為預設 Codex 路徑
- 熱切換已記錄 PI 執行階段的既有工作階段
- 取代 OpenClaw 頻道傳遞、工作階段檔案、驗證設定檔儲存，或訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制命令介面。如果 Plugin 已啟用，且使用者要求從聊天中繫結、續接、引導、停止或檢查 Codex 執行緒，代理應優先使用 `/codex ...` 而非 ACP。當使用者要求 ACP/acpx，或正在測試 ACP Codex 轉接器時，ACP 仍是明確的備援。

原生 Codex 回合會保留 OpenClaw Plugin hook 作為公開相容層。這些是處理序內的 OpenClaw hook，不是 Codex `hooks.json` 命令 hook：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用於鏡像逐字稿記錄
- 透過 Codex `Stop` 轉送的 `before_agent_finalize`
- `agent_end`

Plugin 也可以註冊與執行階段無關的工具結果中介軟體，在 OpenClaw 執行工具之後、結果回傳給 Codex 之前，改寫 OpenClaw 動態工具結果。這與公開的 `tool_result_persist` Plugin hook 分開，後者會轉換 OpenClaw 擁有的逐字稿工具結果寫入。

如需 Plugin hook 語意本身，請參閱 [Plugin hook](/zh-TW/plugins/hooks) 和 [Plugin guard 行為](/zh-TW/tools/plugin)。

harness 預設為關閉。新的設定應將 OpenAI 模型參照保持為標準形式 `openai/gpt-*`，並在需要原生 app-server 執行時，明確強制使用 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版 `codex/*` 模型參照仍會為了相容性自動選取 harness，但以執行階段支援的舊版提供者前綴不會顯示為一般模型/提供者選項。

如果任何已設定的模型路徑仍是 `openai-codex/*`，`openclaw doctor --fix` 會將其改寫為 `openai/*`。對於相符的代理路徑，只有在 Codex Plugin 已安裝、已啟用、提供 `codex` harness，且有可用 OAuth 時，才會將代理執行階段設為 `codex`；否則會將執行階段設為 `pi`。

## 路徑對照表

變更設定前，請使用這張表：

| 想要的行為                                           | 模型參照                   | 執行階段設定                           | 驗證/設定檔路徑             | 預期狀態標籤                   |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱         | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth 或 Codex 帳號    | `Runtime: OpenAI Codex`        |
| 透過一般 OpenClaw runner 使用 OpenAI API             | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| 需要 doctor 修復的舊版設定                           | `openai-codex/gpt-*`       | 修復為 `codex` 或 `pi`                 | 既有設定的驗證               | 在 `doctor --fix` 後重新檢查   |
| 使用保守 auto 模式的混合提供者                       | 提供者專用參照             | `agentRuntime.id: "auto"`              | 依所選提供者                 | 取決於所選執行階段             |
| 明確的 Codex ACP 轉接器工作階段                      | 取決於 ACP 提示/模型       | `sessions_spawn` 搭配 `runtime: "acp"` | ACP 後端驗證                 | ACP 任務/工作階段狀態          |

重要的區分是提供者與執行階段：

- `openai-codex/*` 是 doctor 會改寫的舊版路徑。
- `agentRuntime.id: "codex"` 需要 Codex harness，若不可用會封閉式失敗。
- `agentRuntime.id: "auto"` 讓已註冊的 harness 宣告相符的提供者路徑，但標準 OpenAI 參照仍由 PI 擁有，除非某個 harness 支援該提供者/模型組合。
- `/codex ...` 回答「這個聊天應繫結或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應啟動哪個外部 harness 處理序？」

## 選擇正確的模型前綴

OpenAI 系列路徑與前綴相關。對於常見的訂閱加原生 Codex 執行階段設定，請使用 `openai/*` 搭配 `agentRuntime.id: "codex"`。將 `openai-codex/*` 視為 doctor 應改寫的舊版設定：

| 模型參照                                      | 執行階段路徑                                 | 使用時機                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 透過 OpenClaw/PI 管線使用 OpenAI 提供者      | 你想使用目前以 `OPENAI_API_KEY` 直接存取 OpenAI Platform API 的方式。     |
| `openai-codex/gpt-5.5`                        | 由 doctor 修復的舊版路徑                     | 你正在使用舊設定；執行 `openclaw doctor --fix` 來改寫它。                 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | 你想使用 ChatGPT/Codex 訂閱驗證與原生 Codex 執行。                        |

當你的帳號公開這些路徑時，GPT-5.5 可能同時出現在直接 OpenAI API-key 和 Codex 訂閱路徑上。若要使用原生 Codex 執行階段，請使用 `openai/gpt-5.5` 搭配 Codex app-server harness；若要使用直接 API-key 流量，請使用不含 Codex 執行階段覆寫的 `openai/gpt-5.5`。

舊版 `codex/gpt-*` 參照仍會作為相容別名接受。Doctor 相容性遷移會將舊版執行階段參照改寫為標準模型參照，並分開記錄執行階段政策。新的原生 app-server harness 設定應使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前綴區分。一般 OpenAI 路徑請使用 `openai/gpt-*`；如果影像理解應透過受限的 Codex app-server 回合執行，請使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 會將該舊版前綴改寫為 `openai/gpt-*`。Codex app-server 模型必須宣告支援影像輸入；純文字 Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效 harness。如果選擇結果出乎意料，請為 `agents/harness` 子系統啟用偵錯記錄，並檢查 gateway 的結構化 `agent harness selected` 記錄。它包含所選 harness id、選擇原因、執行階段/備援政策，以及在 `auto` 模式下每個 Plugin 候選項的支援結果。

### doctor 警告代表什麼

當已設定的模型參照或持久化工作階段路徑狀態仍使用 `openai-codex/*` 時，`openclaw doctor` 會發出警告。`openclaw doctor --fix` 會將這些路徑改寫為：

- `openai/<model>`
- 當 Codex 已安裝、已啟用、提供 `codex` harness，且有可用 OAuth 時，設為 `agentRuntime.id: "codex"`
- 否則設為 `agentRuntime.id: "pi"`

`codex` 路徑會強制使用原生 Codex harness。`pi` 路徑會讓代理保留在預設 OpenClaw runner 上，而不是在清理舊版路徑時順帶啟用或安裝 Codex。
Doctor 也會修復已探索代理工作階段儲存中的過時持久化工作階段釘選，避免舊對話持續卡在已移除的路徑上。

Harness 選擇不是即時工作階段控制。當內嵌輪次執行時，
OpenClaw 會在該工作階段記錄所選的 harness id，並在相同工作階段 id 的後續輪次中繼續使用它。當你想讓未來的工作階段使用其他 harness 時，請變更 `agentRuntime` 設定或
`OPENCLAW_AGENT_RUNTIME`；在既有對話於 PI 和 Codex 之間切換前，請使用 `/new` 或 `/reset` 開始全新的工作階段。這可避免將同一份逐字稿重放到
兩個不相容的原生工作階段系統中。

在 harness pin 出現前建立的舊版工作階段，一旦已有逐字稿歷史，
就會被視為已 pin 到 PI。變更設定後，請使用 `/new` 或 `/reset` 將該對話切換到
Codex。

`/status` 會顯示實際生效的模型 runtime。預設 PI harness 會顯示為
`Runtime: OpenClaw Pi Default`，Codex app-server harness 會顯示為
`Runtime: OpenAI Codex`。

## 需求

- OpenClaw，並且已提供隨附的 `codex` plugin。
- Codex app-server `0.125.0` 或更新版本。隨附的 plugin 預設會管理相容的
  Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 指令
  不會影響一般 harness 啟動。
- app-server 程序或 OpenClaw 的 Codex 驗證
  橋接器可使用 Codex 驗證。本機 app-server 啟動會為每個
  agent 使用 OpenClaw 管理的 Codex home，以及隔離的子程序 `HOME`，因此預設不會讀取你的個人
  `~/.codex` 帳號、skills、plugins、設定、thread 狀態，或原生
  `$HOME/.agents/skills`。

plugin 會封鎖較舊或未版本化的 app-server handshake。這可讓
OpenClaw 維持在已測試過的協定表面上。

對於即時和 Docker smoke test，驗證通常來自 Codex CLI 帳號
或 OpenClaw `openai-codex` auth profile。本機 stdio app-server 啟動在沒有帳號時，也可以退回使用 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作區 bootstrap 檔案

Codex 會透過原生 project-doc 探索自行處理 `AGENTS.md`。OpenClaw
不會寫入合成的 Codex project-doc 檔案，也不依賴 Codex 的 persona 檔案 fallback
檔名，因為 Codex fallback 只有在
`AGENTS.md` 缺失時才會套用。

為了 OpenClaw 工作區一致性，Codex harness 會解析其他 bootstrap
檔案（存在時包括 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md` 和 `MEMORY.md`），並在 `thread/start` 和 `thread/resume` 上透過 Codex
config instructions 轉送它們。這會讓
`SOUL.md` 和相關工作區 persona/profile 脈絡保持可見，而不需要
複製 `AGENTS.md`。

## 將 Codex 與其他模型並用

如果同一個 agent 應能在 Codex 和非 Codex provider 模型之間自由切換，
不要全域設定 `agentRuntime.id: "codex"`。強制 runtime 會套用至該 agent 或工作階段的每個
內嵌輪次。如果你在強制該 runtime 時選取 Anthropic 模型，
OpenClaw 仍會嘗試 Codex harness，並以封閉失敗處理，
而不是悄悄將該輪次路由 through PI。

請改用以下其中一種形式：

- 將 Codex 放在具有 `agentRuntime.id: "codex"` 的專用 agent 上。
- 將預設 agent 保持在 `agentRuntime.id: "auto"`，並對一般混合
  provider 使用 PI fallback。
- 只為了相容性才使用舊版 `codex/*` 參照。新設定應優先使用
  `openai/*` 加上明確的 Codex runtime policy。

例如，這會讓預設 agent 使用一般自動選擇，並
新增一個獨立的 Codex agent：

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

- 預設 `main` agent 會使用一般 provider 路徑和 PI 相容性 fallback。
- `codex` agent 會使用 Codex app-server harness。
- 如果 `codex` agent 缺少或不支援 Codex，該輪次會失敗，
  而不是悄悄使用 PI。

## Agent 指令路由

Agents 應依意圖路由使用者請求，而不是只看「Codex」這個字：

| 使用者要求...                                          | Agent 應使用...                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「將這個聊天綁定到 Codex」                            | `/codex bind`                                    |
| 「在這裡恢復 Codex thread `<id>`」                     | `/codex resume <id>`                             |
| 「顯示 Codex threads」                                 | `/codex threads`                                 |
| 「為一次不良的 Codex 執行提交支援報告」                | `/diagnostics [note]`                            |
| 「只針對這個附加的 thread 傳送 Codex 回饋」            | `/codex diagnostics [note]`                      |
| 「使用我的 ChatGPT/Codex 訂閱搭配 Codex runtime」      | `openai/*` 加上 `agentRuntime.id: "codex"`       |
| 「修復舊的 `openai-codex/*` 設定/工作階段 pin」        | `openclaw doctor --fix`                          |
| 「透過 ACP/acpx 執行 Codex」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」 | ACP/acpx，而不是 `/codex`，也不是原生 sub-agents |

OpenClaw 只會在 ACP 已啟用、可 dispatch，且由已載入的 runtime backend 支援時，
向 agents 宣告 ACP spawn 指引。如果 ACP 無法使用，
system prompt 和 plugin skills 不應教導 agent 有關 ACP
路由。

## Codex-only 部署

當你需要證明每個內嵌 agent 輪次都使用 Codex 時，請強制使用 Codex harness。明確的 plugin runtimes 會封閉失敗，且絕不會悄悄透過 PI
重試：

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

強制使用 Codex 時，如果 Codex plugin 已停用、
app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## 每個 agent 的 Codex

你可以讓一個 agent 僅使用 Codex，同時讓預設 agent 保持一般
自動選擇：

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

使用一般工作階段指令切換 agents 和模型。`/new` 會建立全新的
OpenClaw 工作階段，而 Codex harness 會視需要建立或恢復其 sidecar app-server
thread。`/reset` 會清除該 thread 的 OpenClaw 工作階段綁定，
並讓下一個輪次再次從目前設定解析 harness。

## 模型探索

預設情況下，Codex plugin 會向 app-server 要求可用模型。如果
探索失敗或逾時，會使用下列項目的隨附 fallback catalog：

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

當你希望啟動時避免探測 Codex，並固定使用
fallback catalog 時，請停用探索：

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

預設情況下，plugin 會以本機方式啟動 OpenClaw 管理的 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

管理的二進位檔會隨 `codex` plugin 套件提供。這會讓
app-server 版本與隨附 plugin 綁定，而不是與本機剛好安裝的任何獨立
Codex CLI 綁定。只有當你刻意想執行不同的可執行檔時，
才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO 模式啟動本機 Codex harness 工作階段：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這是 autonomous heartbeats 使用的受信任本機操作員姿態：
Codex 可以使用 shell 和網路工具，而不會停在沒有人能回應的原生 approval prompts。

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

Guardian 模式使用 Codex 的原生 auto-review approval 路徑。當 Codex 要求
離開 sandbox、寫入工作區外部，或新增像網路
存取這類權限時，Codex 會將該 approval request 路由到原生 reviewer，而不是
human prompt。reviewer 會套用 Codex 的 risk framework，並核准或拒絕
該特定請求。當你想要比 YOLO 模式更多 guardrails，
但仍需要 unattended agents 繼續推進時，請使用 Guardian。

`guardian` preset 會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
個別 policy 欄位仍會覆寫 `mode`，因此進階部署可以將
preset 與明確選項混用。較舊的 `guardian_subagent` reviewer 值
仍作為相容性別名接受，但新設定應使用
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
但 OpenClaw 擁有 Codex app-server account bridge，並將
`CODEX_HOME` 和 `HOME` 都設定為該 agent 的 OpenClaw
狀態下的每個 agent 目錄。Codex 自己的 skill loader 會讀取 `$CODEX_HOME/skills` 和
`$HOME/.agents/skills`，因此本機 app-server
啟動時這兩個值都會被隔離。這會讓 Codex-native skills、plugins、設定、帳號和 thread
狀態侷限於 OpenClaw agent，而不會從操作員的
個人 Codex CLI home 洩漏進來。

OpenClaw plugins 和 OpenClaw skill snapshots 仍會透過 OpenClaw 自己的
plugin registry 和 skill loader 流動。個人 Codex CLI assets 不會。如果你有
實用的 Codex CLI skills 或 plugins，應該成為 OpenClaw agent 的一部分，
請明確盤點它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider 會將 skills 複製到目前的 OpenClaw agent
工作區。Codex 原生 plugins、hooks 和 config files 會被回報或封存
以供手動審查，而不是自動啟用，因為它們可能
執行指令、公開 MCP servers，或攜帶 credentials。

驗證會依以下順序選擇：

1. 該 agent 的明確 OpenClaw Codex auth profile。
2. 該 agent 的 Codex home 中 app-server 既有的帳號。
3. 僅限本機 stdio app-server 啟動，在沒有 app-server 帳號且仍需要 OpenAI 驗證時，先使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，會從產生的 Codex 子程序移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓 Gateway 層級的 API 金鑰仍可用於嵌入或直接的 OpenAI 模型，
但不會讓原生 Codex app-server 回合意外透過 API 計費。
明確的 Codex API 金鑰設定檔和本機 stdio 環境金鑰後援會使用 app-server
登入，而不是繼承的子程序環境。WebSocket app-server 連線
不會接收 Gateway 環境 API 金鑰後援；請使用明確的驗證設定檔，或使用
遠端 app-server 自己的帳戶。

如果部署需要額外的環境隔離，請將那些變數新增到
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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。

Codex 動態工具預設使用 `native-first` 設定檔。在該模式中，
OpenClaw 不會公開與 Codex 原生工作區操作重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和
`update_plan`。OpenClaw 整合工具，例如訊息、工作階段、媒體、
cron、瀏覽器、節點、gateway、`heartbeat_respond` 和 `web_search` 仍然
可用。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設值           | 含義                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 將完整的 OpenClaw 動態工具集公開給 Codex app-server。 |
| `codexDynamicToolsExclude` | `[]`             | 要從 Codex app-server 回合省略的額外 OpenClaw 動態工具名稱。               |

支援的 `appServer` 欄位：

| 欄位                | 預設值                                   | 含義                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                             |
| `command`           | 受管理的 Codex 二進位檔                 | stdio 傳輸使用的可執行檔。保持未設定即可使用受管理的二進位檔；只有在明確覆寫時才設定它。                                                                                                                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸使用的引數。                                                                                                                                                                                                       |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                            |
| `authToken`         | 未設定                                   | WebSocket 傳輸使用的 Bearer 權杖。                                                                                                                                                                                                |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | OpenClaw 建立其繼承環境後，從產生的 stdio app-server 程序移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 會保留給 OpenClaw 在本機啟動時使用的每代理 Codex 隔離。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面呼叫的逾時。                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | YOLO 或經 guardian 審閱執行的預設值。                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | 傳送到 thread start/resume/turn 的原生 Codex 核准政策。                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | 傳送到 thread start/resume 的原生 Codex 沙盒模式。                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審閱原生核准提示。`guardian_subagent` 仍是舊版別名。                                                                                                                         |
| `serviceTier`       | 未設定                                   | 選用的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                            |

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 進行限制：每個 Codex `item/tool/call` 請求都必須在
30 秒內收到 OpenClaw 回應。逾時時，OpenClaw 會在支援的情況下中止工具
訊號，並將失敗的動態工具回應傳回 Codex，讓
該回合可以繼續，而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 請求後，測試框架
也會預期 Codex 以 `turn/completed` 完成原生回合。如果
app-server 在該回應後靜默 60 秒，OpenClaw 會盡力
中斷 Codex 回合、記錄診斷逾時，並釋放
OpenClaw 工作階段通道，讓後續聊天訊息不會排在過期的
原生回合後面。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於可重複的部署，
偏好使用設定，因為它會將 Plugin 行為與其餘 Codex 測試框架設定保留在
同一個已審閱的檔案中。

## 電腦使用

電腦使用在自己的設定指南中說明：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短說明：OpenClaw 不會內建桌面控制應用程式，也不會自行執行
桌面操作。它會準備 Codex app-server、確認
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間處理原生
MCP 工具呼叫。

若要在 Codex marketplace 流程之外直接存取 TryCua 驅動程式，請使用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊
`cua-driver mcp`。
請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 Codex 擁有的電腦使用與直接 MCP 註冊之間的差異。

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

可以從命令介面檢查或安裝此設定：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

電腦使用僅適用於 macOS，且 Codex MCP 伺服器可以控制應用程式前，
可能需要本機作業系統權限。如果 `computerUse.enabled` 為 true 且 MCP
伺服器不可用，Codex 模式回合會在線程開始前失敗，而不是
在沒有原生電腦使用工具的情況下靜默執行。請參閱
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 marketplace 選項、
遠端目錄限制、狀態原因和疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex
尚未探索到本機 marketplace，OpenClaw 可以從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊標準
內建 Codex Desktop marketplace。變更執行階段或電腦使用設定後，請使用
`/new` 或 `/reset`，讓現有工作階段不會保留舊的
PI 或 Codex 線程繫結。

## 常用配方

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

僅 Codex 的測試框架驗證：

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

經 guardian 審閱的 Codex 核准：

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

模型切換仍由 OpenClaw 控制。當 OpenClaw 工作階段附加到
現有 Codex 線程時，下一個回合會再次將目前選取的
OpenAI 模型、供應商、核准政策、沙盒和服務層級傳送到
app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留
線程繫結，但要求 Codex 使用新選取的模型繼續。

## Codex 命令

內建 Plugin 會將 `/codex` 註冊為已授權的斜線命令。它是
通用命令，適用於任何支援 OpenClaw 文字命令的頻道。

常見形式：

- `/codex status` 顯示即時應用程式伺服器連線狀態、模型、帳戶、速率限制、MCP 伺服器和 skills。
- `/codex models` 列出即時 Codex 應用程式伺服器模型。
- `/codex threads [filter]` 列出最近的 Codex thread。
- `/codex resume <thread-id>` 將目前的 OpenClaw session 附加到現有的 Codex thread。
- `/codex compact` 要求 Codex 應用程式伺服器 compact 已附加的 thread。
- `/codex review` 為已附加的 thread 啟動 Codex 原生 review。
- `/codex diagnostics [note]` 在傳送已附加 thread 的 Codex 診斷回饋前先詢問。
- `/codex computer-use status` 檢查已設定的 Computer Use Plugin 和 MCP 伺服器。
- `/codex computer-use install` 安裝已設定的 Computer Use Plugin 並重新載入 MCP 伺服器。
- `/codex account` 顯示帳戶和速率限制狀態。
- `/codex mcp` 列出 Codex 應用程式伺服器 MCP 伺服器狀態。
- `/codex skills` 列出 Codex 應用程式伺服器 skills。

當 Codex 回報用量限制失敗時，如果 Codex 有提供下一次應用程式伺服器重設時間，OpenClaw 會一併包含該時間。在同一個對話中使用 `/codex account` 來檢查目前的帳戶和速率限制時段。

### 常見除錯工作流程

當 Codex 支援的 agent 在 Telegram、Discord、Slack 或其他 channel 中做出令人意外的事時，請從問題發生的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload` 或另一段描述你所見情況的簡短 note。
2. 核准診斷請求一次。該核准會建立本機 Gateway 診斷 zip，並且因為 session 使用 Codex harness，也會將相關的 Codex 回饋 bundle 傳送到 OpenAI 伺服器。
3. 將完成的診斷回覆複製到 bug 報告或支援 thread 中。它包含本機 bundle 路徑、隱私摘要、OpenClaw session ID、Codex thread ID，以及每個 Codex thread 的 `Inspect locally` 行。
4. 如果你想自行除錯該次執行，請在終端機執行印出的 `Inspect locally` 指令。它看起來像 `codex resume <thread-id>`，並會開啟原生 Codex thread，讓你可以檢查對話、在本機繼續，或詢問 Codex 為什麼選擇特定 tool 或 plan。

只有在你特別想要為目前已附加的 thread 上傳 Codex 回饋，而不需要完整的 OpenClaw Gateway 診斷 bundle 時，才使用 `/codex diagnostics [note]`。對大多數支援報告而言，`/diagnostics [note]` 是較好的起點，因為它會在同一則回覆中把本機 Gateway 狀態和 Codex thread ID 關聯起來。完整隱私模型和群組聊天行為請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

核心 OpenClaw 也公開僅限擁有者使用的 `/diagnostics [note]`，作為一般 Gateway 診斷指令。它的核准提示會顯示敏感資料前言、連結到[診斷匯出](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec 核准來請求 `openclaw gateway diagnostics export --json`。請勿使用 allow-all 規則核准診斷。核准後，OpenClaw 會傳送一份可貼上的報告，其中包含本機 bundle 路徑和 manifest 摘要。當作用中的 OpenClaw session 使用 Codex harness 時，同一個核准也會授權將相關的 Codex 回饋 bundle 傳送到 OpenAI 伺服器。核准提示會說明將會傳送 Codex 回饋，但在核准前不會列出 Codex session 或 thread ID。

如果 `/diagnostics` 是由群組聊天中的擁有者呼叫，OpenClaw 會保持共享 channel 乾淨：群組只會收到簡短通知，而診斷前言、核准提示，以及 Codex session/thread ID 會透過私人核准路由傳送給擁有者。如果沒有私人擁有者路由，OpenClaw 會拒絕該群組請求，並要求擁有者從 DM 執行。

已核准的 Codex 上傳會呼叫 Codex 應用程式伺服器 `feedback/upload`，並要求應用程式伺服器在可用時包含每個列出的 thread 以及衍生 Codex subthread 的 log。上傳會透過 Codex 一般回饋路徑送到 OpenAI 伺服器；如果該應用程式伺服器停用了 Codex 回饋，此指令會回傳應用程式伺服器錯誤。完成的診斷回覆會列出已傳送 thread 的 channel、OpenClaw session ID、Codex thread ID，以及本機 `codex resume <thread-id>` 指令。如果你拒絕或忽略核准，OpenClaw 不會印出那些 Codex ID。此上傳不會取代本機 Gateway 診斷匯出。

`/codex resume` 會寫入與 harness 在一般回合中使用的相同 sidecar 綁定檔。在下一則訊息時，OpenClaw 會恢復該 Codex thread，將目前選取的 OpenClaw 模型傳入應用程式伺服器，並保持延伸歷史記錄啟用。

### 從 CLI 檢查 Codex thread

了解錯誤 Codex 執行最快的方法，通常是直接開啟原生 Codex thread：

```sh
codex resume <thread-id>
```

當你在 channel 對話中發現 bug，並想檢查有問題的 Codex session、在本機繼續，或詢問 Codex 為什麼做出特定 tool 或 reasoning 選擇時，請使用此方法。最簡單的路徑通常是先執行 `/diagnostics [note]`：在你核准後，完成的報告會列出每個 Codex thread，並印出 `Inspect locally` 指令，例如 `codex resume <thread-id>`。你可以將該指令直接複製到終端機。

你也可以從目前聊天的 `/codex binding` 或最近 Codex 應用程式伺服器 thread 的 `/codex threads [filter]` 取得 thread ID，然後在 shell 中執行相同的 `codex resume` 指令。

此指令介面需要 Codex 應用程式伺服器 `0.125.0` 或更新版本。如果未來或自訂應用程式伺服器未公開該 JSON-RPC 方法，個別控制方法會回報為 `unsupported by this Codex app-server`。

## Hook 邊界

Codex harness 有三層 hook：

| 層級                                  | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook                  | OpenClaw                 | 跨 PI 和 Codex harness 的產品/Plugin 相容性。                       |
| Codex 應用程式伺服器 extension middleware | OpenClaw 內建 Plugin | 圍繞 OpenClaw dynamic tool 的每回合 adapter 行為。                  |
| Codex 原生 hook                       | Codex                    | 來自 Codex 設定的低層 Codex 生命週期和原生 tool policy。           |

OpenClaw 不使用專案或全域 Codex `hooks.json` 檔案來路由 OpenClaw Plugin 行為。對於支援的原生 tool 和 permission bridge，OpenClaw 會為 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入每個 thread 的 Codex 設定。其他 Codex hook，例如 `SessionStart` 和 `UserPromptSubmit`，仍是 Codex 層級的控制；它們不會在 v1 contract 中作為 OpenClaw Plugin hook 公開。

對於 OpenClaw dynamic tool，OpenClaw 會在 Codex 要求呼叫後執行 tool，因此 OpenClaw 會在 harness adapter 中觸發它所擁有的 Plugin 和 middleware 行為。對於 Codex 原生 tool，Codex 擁有標準 tool 記錄。OpenClaw 可以鏡像所選事件，但除非 Codex 透過應用程式伺服器或原生 hook callback 公開該操作，否則它不能重寫原生 Codex thread。

Compaction 和 LLM 生命週期投影來自 Codex 應用程式伺服器通知和 OpenClaw adapter 狀態，而不是原生 Codex hook 指令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是 adapter 層級的觀察，而不是 Codex 內部 request 或 compaction payload 的逐位元組捕捉。

Codex 原生 `hook/started` 和 `hook/completed` 應用程式伺服器通知會投影為 `codex_app_server.hook` agent 事件，以供 trajectory 和除錯使用。它們不會呼叫 OpenClaw Plugin hook。

## V1 支援 contract

Codex 模式不是在底層換成不同模型呼叫的 PI。Codex 擁有更多原生模型 loop，而 OpenClaw 會圍繞該邊界調整它的 Plugin 和 session 介面。

Codex runtime v1 支援：

| 介面                                          | 支援狀態                                | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 執行 OpenAI 模型 loop              | 支援                                    | Codex 應用程式伺服器擁有 OpenAI 回合、原生 thread resume 和原生 tool continuation。                                                                                                                  |
| OpenClaw channel routing 和 delivery          | 支援                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他 channel 保持在模型 runtime 之外。                                                                                                                |
| OpenClaw dynamic tool                         | 支援                                    | Codex 要求 OpenClaw 執行這些 tool，因此 OpenClaw 留在執行路徑中。                                                                                                                                     |
| Prompt 和 context Plugin                      | 支援                                    | OpenClaw 會建構 prompt overlay，並在啟動或恢復 thread 前將 context 投影到 Codex 回合中。                                                                                                             |
| Context engine 生命週期                       | 支援                                    | Assemble、ingest 或 after-turn maintenance，以及 context-engine compaction coordination 會針對 Codex 回合執行。                                                                                       |
| Dynamic tool hook                             | 支援                                    | `before_tool_call`、`after_tool_call` 和 tool-result middleware 會圍繞 OpenClaw 擁有的 dynamic tool 執行。                                                                                            |
| 生命週期 hook                                 | 作為 adapter 觀察支援                   | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以誠實的 Codex 模式 payload 觸發。                                                                                |
| Final-answer revision gate                    | 透過原生 hook relay 支援                | Codex `Stop` 會 relay 到 `before_agent_finalize`；`revise` 會要求 Codex 在 finalization 前再執行一次模型 pass。                                                                                       |
| 原生 shell、patch 和 MCP block 或 observe     | 透過原生 hook relay 支援                | Codex `PreToolUse` 和 `PostToolUse` 會針對已提交的原生 tool 介面進行 relay，包含 Codex 應用程式伺服器 `0.125.0` 或更新版本上的 MCP payload。支援 blocking；不支援 argument rewriting。 |
| 原生 permission policy                        | 透過原生 hook relay 支援                | Codex `PermissionRequest` 可在 runtime 公開時透過 OpenClaw policy 路由。如果 OpenClaw 沒有回傳 decision，Codex 會繼續走它的一般 guardian 或 user approval 路徑。                                      |
| 應用程式伺服器 trajectory capture             | 支援                                    | OpenClaw 會記錄它傳送到應用程式伺服器的 request，以及它收到的應用程式伺服器通知。                                                                                                                   |

Codex runtime v1 不支援：

| 表面                                                | V1 邊界                                                                                                                                        | 未來路徑                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生前置工具掛鉤可以阻擋，但 OpenClaw 不會改寫 Codex 原生工具引數。                                               | 需要 Codex 掛鉤/結構描述支援替換工具輸入。                            |
| 可編輯的 Codex 原生轉錄歷史                         | Codex 擁有標準原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來脈絡，但不應變更不受支援的內部項目。 | 如果需要原生執行緒手術，請新增明確的 Codex app-server API。                    |
| Codex 原生工具記錄的 `tool_result_persist`          | 該掛鉤會轉換 OpenClaw 擁有的轉錄寫入，而不是 Codex 原生工具記錄。                                                           | 可以鏡像轉換後的記錄，但標準改寫需要 Codex 支援。              |
| 豐富的原生 Compaction 中繼資料                      | OpenClaw 會觀察 Compaction 開始與完成，但不會收到穩定的保留/捨棄清單、token 差異或摘要酬載。            | 需要更豐富的 Codex Compaction 事件。                                                     |
| Compaction 介入                                     | 目前 OpenClaw Compaction 掛鉤在 Codex 模式中屬於通知層級。                                                                         | 如果 Plugin 需要否決或改寫原生 Compaction，請新增 Codex 前置/後置 Compaction 掛鉤。 |
| 逐位元組一致的模型 API 請求擷取                     | OpenClaw 可以擷取 app-server 請求與通知，但 Codex 核心會在內部建構最終 OpenAI API 請求。                      | 需要 Codex 模型請求追蹤事件或偵錯 API。                                   |

## 工具、媒體與 Compaction

Codex harness 只會變更低階嵌入式代理程式執行器。

OpenClaw 仍會建構工具清單，並從 harness 接收動態工具結果。文字、圖片、影片、音樂、TTS、核准與訊息工具輸出，會繼續透過一般 OpenClaw 傳遞路徑。

原生掛鉤轉送刻意保持通用，但 v1 支援合約僅限於 OpenClaw 測試過的 Codex 原生工具與權限路徑。在 Codex 執行階段中，這包括 shell、patch 與 MCP `PreToolUse`、`PostToolUse` 以及 `PermissionRequest` 酬載。不要假設每個未來的 Codex 掛鉤事件都是 OpenClaw Plugin 表面，除非執行階段合約已明確命名它。

對於 `PermissionRequest`，OpenClaw 只會在政策做出決定時傳回明確的允許或拒絕決定。沒有決定的結果並不是允許。Codex 會將其視為沒有掛鉤決定，並落回自己的守護程式或使用者核准路徑。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准請求會透過 OpenClaw 的 Plugin 核准流程路由。Codex `request_user_input` 提示會送回原始聊天，而下一則已排隊的後續訊息會回答該原生伺服器請求，而不是被導向為額外脈絡。其他 MCP 請求仍會以關閉方式失敗。

作用中執行佇列導向會對應到 Codex app-server `turn/steer`。使用預設 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的安靜時窗內批次處理已排隊的聊天訊息，並依抵達順序將它們作為一個 `turn/steer` 請求傳送。舊版 `queue` 模式會傳送個別的 `turn/steer` 請求。Codex 審查與手動 Compaction 回合可能拒絕同回合導向，在此情況下，OpenClaw 會在選定模式允許後援時使用後續佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當選定模型使用 Codex harness 時，原生執行緒 Compaction 會委派給 Codex app-server。OpenClaw 會保留轉錄鏡像，用於頻道歷史、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。當 app-server 發出使用者提示、最終助理文字，以及輕量 Codex 推理或計畫記錄時，鏡像會包含這些內容。目前，OpenClaw 只會記錄原生 Compaction 開始與完成訊號。它尚未公開可供人類閱讀的 Compaction 摘要，或可稽核的 Codex 在 Compaction 後保留項目清單。

因為 Codex 擁有標準原生執行緒，`tool_result_persist` 目前不會改寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入 OpenClaw 擁有的工作階段轉錄工具結果時套用。

媒體生成不需要 PI。圖片、影片、音樂、PDF、TTS 與媒體理解會繼續使用相符的供應商/模型設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 與 `messages.tts`。

## 疑難排解

**Codex 不會顯示為一般 `/model` 供應商：** 對於新設定，這是預期行為。選取具有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` 參照），啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 當沒有 Codex harness 宣告該執行時，`agentRuntime.id: "auto"` 仍可能使用 PI 作為相容性後端。測試時設定 `agentRuntime.id: "codex"` 以強制選取 Codex。強制 Codex 執行階段會失敗，而不是退回 PI。一旦選取 Codex app-server，其失敗會直接浮現。

**app-server 被拒絕：** 升級 Codex，讓 app-server 交握回報版本 `0.125.0` 或更新版本。相同版本的預先發行版或帶有建置後綴的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，會被拒絕，因為穩定版 `0.125.0` 協定下限是 OpenClaw 測試的標準。

**模型探索很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket 傳輸立即失敗：** 檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server 協定版本。

**非 Codex 模型使用 PI：** 這是預期行為，除非你為該代理程式強制設定 `agentRuntime.id: "codex"` 或選取舊版 `codex/*` 參照。在 `auto` 模式中，純 `openai/gpt-*` 與其他供應商參照會留在其一般供應商路徑。如果你強制設定 `agentRuntime.id: "codex"`，該代理程式的每個嵌入式回合都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具未執行：** 從新的工作階段檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果問題持續，請重新啟動 Gateway 以清除過期的原生掛鉤註冊。如果 `computer-use.list_apps` 逾時，請重新啟動 Codex Computer Use 或 Codex Desktop，然後重試。

## 相關

- [代理程式 harness Plugin](/zh-TW/plugins/sdk-agent-harness)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [模型供應商](/zh-TW/concepts/model-providers)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin 掛鉤](/zh-TW/plugins/hooks)
- [設定參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
