---
read_when:
    - 你想要使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅使用 Codex 的部署失敗，而不是回退到 PI
summary: 透過隨附的 Codex 應用程式伺服器測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-05T01:48:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 可讓 OpenClaw 透過 Codex app-server 執行嵌入式 agent turn，而不是使用內建的 PI harness。

當你希望 Codex 擁有低階 agent session 時，請使用此方式：模型探索、原生 thread resume、原生 compaction，以及 app-server execution。OpenClaw 仍然擁有 chat channels、session files、model selection、tools、approvals、media delivery，以及可見 transcript mirror。

當來源 chat turn 透過 Codex harness 執行時，如果部署尚未明確設定 `messages.visibleReplies`，可見回覆預設會使用 OpenClaw `message` tool。agent 仍可私下完成其 Codex turn；只有在呼叫 `message(action="send")` 時才會發佈到 channel。將 `messages.visibleReplies: "automatic"` 設為保留 direct-chat final replies 使用舊版自動傳遞路徑。

Codex heartbeat turns 預設也會取得 `heartbeat_respond` tool，因此 agent 可以記錄這次喚醒應保持安靜還是發出通知，而不必把該控制流程編碼在 final text 中。

Heartbeat 專用的 initiative guidance 會在 heartbeat turn 本身作為 Codex collaboration-mode developer instruction 傳送。一般 chat turns 會還原 Codex Default mode，而不是在其一般 runtime prompt 中攜帶 heartbeat philosophy。

如果你正在嘗試建立方向感，請從
[Agent runtimes](/zh-TW/concepts/agent-runtimes) 開始。簡短版本是：
`openai/gpt-5.5` 是 model ref，`codex` 是 runtime，而 Telegram、
Discord、Slack 或其他 channel 仍然是 communication surface。

## 快速設定

大多數想要「Codex in OpenClaw」的使用者會想要這條路徑：使用
ChatGPT/Codex 訂閱登入，然後透過原生 Codex app-server runtime 執行嵌入式 agent turns。model ref 仍維持正規形式
`openai/gpt-*`；subscription auth 來自 Codex account/profile，而不是來自
`openai-codex/*` model prefix。

如果你尚未登入，請先使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai-codex
```

然後啟用隨附的 `codex` Plugin，並強制使用 Codex runtime：

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

當你指的是原生 Codex runtime 時，不要使用 `openai-codex/gpt-*`。該 prefix
是明確的「Codex OAuth through PI」路徑。設定變更會套用到新的或 reset sessions；既有 sessions 會保留其已記錄的 runtime。

## 此 Plugin 變更的內容

隨附的 `codex` Plugin 提供數個獨立能力：

| 能力                              | 你如何使用                                          | 它的作用                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式 runtime                | `agentRuntime.id: "codex"`                          | 透過 Codex app-server 執行 OpenClaw 嵌入式 agent turns。                      |
| 原生 chat-control commands        | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從 messaging conversation 綁定並控制 Codex app-server threads。               |
| Codex app-server provider/catalog | `codex` internals, surfaced through the harness     | 讓 runtime 探索並驗證 app-server models。                                     |
| Codex media-understanding path    | `codex/*` image-model compatibility paths           | 為支援的 image understanding models 執行有界的 Codex app-server turns。       |
| 原生 hook relay                   | Plugin hooks around Codex-native events             | 讓 OpenClaw 觀察/封鎖支援的 Codex-native tool/finalization events。           |

啟用 Plugin 會讓這些能力可用。它**不會**：

- 開始對每個 OpenAI model 使用 Codex
- 將 `openai-codex/*` model refs 轉換為原生 runtime
- 讓 ACP/acpx 成為預設 Codex path
- 熱切換已經記錄 PI runtime 的既有 sessions
- 取代 OpenClaw channel delivery、session files、auth-profile storage 或
  message routing

同一個 Plugin 也擁有原生 `/codex` chat-control command surface。如果
Plugin 已啟用，且使用者要求從 chat 綁定、resume、steer、停止或檢查
Codex threads，agents 應優先使用 `/codex ...`，而不是 ACP。當使用者要求
ACP/acpx 或正在測試 ACP Codex adapter 時，ACP 仍是明確的 fallback。

原生 Codex turns 會保留 OpenClaw Plugin hooks 作為公開相容層。這些是
in-process OpenClaw hooks，而不是 Codex `hooks.json` command hooks：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` for mirrored transcript records
- `before_agent_finalize` through Codex `Stop` relay
- `agent_end`

Plugins 也可以註冊 runtime-neutral tool-result middleware，用於在 OpenClaw
執行 tool 之後、result 返回 Codex 之前，重寫 OpenClaw dynamic tool results。這與公開的
`tool_result_persist` Plugin hook 分開；後者會轉換 OpenClaw 擁有的 transcript
tool-result writes。

若要了解 Plugin hook semantics 本身，請參閱 [Plugin hooks](/zh-TW/plugins/hooks)
和 [Plugin guard behavior](/zh-TW/tools/plugin)。

harness 預設為關閉。新設定應將 OpenAI model refs 保持為正規形式
`openai/gpt-*`，並在想要原生 app-server execution 時明確強制使用
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版
`codex/*` model refs 仍會為了相容性而自動選取 harness，但 runtime-backed
legacy provider prefixes 不會顯示為一般 model/provider choices。

如果 `codex` Plugin 已啟用，但 primary model 仍是
`openai-codex/*`，`openclaw doctor` 會發出警告，而不是變更路徑。這是刻意的：
`openai-codex/*` 仍然是 PI Codex OAuth/subscription path，而原生 app-server
execution 仍是明確的 runtime choice。

## 路徑對照表

變更設定前請使用此表：

| 期望行為                                             | Model ref                  | Runtime config                         | Auth/profile route           | Expected status label          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| 使用原生 Codex runtime 的 ChatGPT/Codex 訂閱         | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth 或 Codex account | `Runtime: OpenAI Codex`        |
| 透過一般 OpenClaw runner 使用 OpenAI API             | `openai/gpt-*`             | omitted or `runtime: "pi"`             | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| 透過 PI 使用 ChatGPT/Codex 訂閱                      | `openai-codex/gpt-*`       | omitted or `runtime: "pi"`             | OpenAI Codex OAuth provider  | `Runtime: OpenClaw Pi Default` |
| 使用保守 auto mode 的混合 providers                  | provider-specific refs     | `agentRuntime.id: "auto"`              | Per selected provider        | Depends on selected runtime    |
| 明確的 Codex ACP adapter session                     | ACP prompt/model dependent | `sessions_spawn` with `runtime: "acp"` | ACP backend auth             | ACP task/session status        |

重要的區分是 provider 與 runtime：

- `openai-codex/*` 回答「PI 應該使用哪個 provider/auth route？」
- `agentRuntime.id: "codex"` 回答「哪個 loop 應該執行這個
  embedded turn？」
- `/codex ...` 回答「此 chat 應該綁定或控制哪個原生 Codex conversation？」
- ACP 回答「acpx 應該啟動哪個 external harness process？」

## 選擇正確的 model prefix

OpenAI-family routes 是 prefix-specific。對常見的訂閱加原生 Codex runtime
設定，請使用 `openai/*` 搭配 `agentRuntime.id: "codex"`。只有在你刻意要透過
PI 使用 Codex OAuth 時，才使用 `openai-codex/*`：

| Model ref                                     | Runtime path                                 | 使用時機                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI provider through OpenClaw/PI plumbing | 你想要使用目前透過 `OPENAI_API_KEY` 的直接 OpenAI Platform API 存取。     |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth through OpenClaw/PI       | 你想要使用 ChatGPT/Codex subscription auth 搭配預設 PI runner。           |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | 你想要使用 ChatGPT/Codex subscription auth 搭配原生 Codex execution。     |

當你的 account 公開這些路徑時，GPT-5.5 可以同時出現在直接 OpenAI API-key
與 Codex subscription routes 上。原生 Codex runtime 請使用 `openai/gpt-5.5`
搭配 Codex app-server harness；PI OAuth 請使用 `openai-codex/gpt-5.5`；直接
API-key traffic 請使用未覆寫 Codex runtime 的 `openai/gpt-5.5`。

舊版 `codex/gpt-*` refs 仍會作為 compatibility aliases 被接受。Doctor
compatibility migration 會將舊版 primary runtime refs 重寫為正規 model
refs，並另外記錄 runtime policy；而 fallback-only legacy refs 會保持不變，因為 runtime
是針對整個 agent container 設定。新的 PI Codex OAuth 設定應使用
`openai-codex/gpt-*`；新的原生 app-server harness 設定應使用
`openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的 prefix 區分。當 image understanding
應透過 OpenAI Codex OAuth provider path 執行時，請使用
`openai-codex/gpt-*`。當 image understanding 應透過有界的 Codex
app-server turn 執行時，請使用 `codex/gpt-*`。Codex app-server model 必須宣告支援
image input；text-only Codex models 會在 media turn 開始前失敗。

使用 `/status` 確認目前 session 的有效 harness。如果選擇結果令人意外，請為
`agents/harness` subsystem 啟用 debug logging，並檢查 gateway 的 structured
`agent harness selected` record。它包含 selected harness id、selection reason、
runtime/fallback policy，以及在 `auto` mode 中每個 Plugin candidate 的 support result。

### doctor warnings 的意思

當以下全部為真時，`openclaw doctor` 會發出警告：

- 隨附的 `codex` Plugin 已啟用或允許
- agent 的 primary model 是 `openai-codex/*`
- 該 agent 的 effective runtime 不是 `codex`

此警告存在，是因為使用者常預期「已啟用 Codex Plugin」就代表「原生 Codex app-server runtime」。OpenClaw 不會做出這種推斷。此警告表示：

- 如果你原本就打算透過 PI 使用 ChatGPT/Codex OAuth，則**不需要變更**。
- 如果你原本打算使用原生 app-server execution，請將 model 改為
  `openai/<model>`，並設定 `agentRuntime.id: "codex"`。
- runtime 變更後，既有 sessions 仍需要 `/new` 或 `/reset`，因為 session runtime
  pins 是 sticky。

Harness selection 不是 live session control。當 embedded turn 執行時，OpenClaw
會在該 session 上記錄 selected harness id，並在同一 session id 的後續 turns
持續使用它。當你希望未來 sessions 使用另一個 harness 時，請變更 `agentRuntime`
設定或 `OPENCLAW_AGENT_RUNTIME`；在既有 conversation 於 PI 與 Codex 之間切換前，請使用
`/new` 或 `/reset` 開始新的 session。這可避免透過兩個不相容的原生 session systems
重播同一份 transcript。

舊版工作階段在 harness pin 推出前建立，只要已有逐字稿歷史，
就會視為已釘選到 PI。變更設定後，使用 `/new` 或 `/reset` 讓該對話改用
Codex。

`/status` 會顯示有效的模型執行環境。預設 PI harness 顯示為
`Runtime: OpenClaw Pi Default`，Codex app-server harness 顯示為
`Runtime: OpenAI Codex`。

## 需求

- 可使用隨附 `codex` Plugin 的 OpenClaw。
- Codex app-server `0.125.0` 或更新版本。隨附 Plugin 預設會管理相容的
  Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 指令不會影響一般
  harness 啟動。
- app-server 程序或 OpenClaw 的 Codex 驗證橋接可用的 Codex 驗證。
  本機 app-server 啟動會為每個 agent 使用 OpenClaw 管理的 Codex home
  以及隔離的子程序 `HOME`，因此預設不會讀取你的個人
  `~/.codex` 帳號、skills、plugins、設定、thread 狀態，或原生
  `$HOME/.agents/skills`。

Plugin 會封鎖較舊或未版本化的 app-server 交握。這能讓
OpenClaw 保持在已測試過的通訊協定表面上。

對於即時與 Docker smoke 測試，驗證通常來自 Codex CLI 帳號
或 OpenClaw `openai-codex` 驗證設定檔。當沒有帳號時，本機 stdio app-server
啟動也可以退回使用 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作區啟動檔案

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。OpenClaw
不會寫入合成的 Codex 專案文件檔案，也不依賴 Codex persona 檔案的後援
檔名，因為 Codex 後援只會在缺少 `AGENTS.md` 時套用。

為了 OpenClaw 工作區一致性，Codex harness 會解析其他啟動檔案
（存在時包括 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md` 和 `MEMORY.md`），並在 `thread/start` 和 `thread/resume`
透過 Codex 設定指令轉送。這會讓 `SOUL.md` 和相關工作區 persona/profile
內容可見，而不需複製 `AGENTS.md`。

## 將 Codex 與其他模型並用

如果同一個 agent 應能在 Codex 與非 Codex provider 模型之間自由切換，
不要全域設定 `agentRuntime.id: "codex"`。強制執行環境會套用到該 agent
或工作階段的每個嵌入式回合。如果在強制使用該執行環境時選取 Anthropic
模型，OpenClaw 仍會嘗試 Codex harness 並關閉失敗，而不是靜默地將該回合
透過 PI 路由。

請改用以下其中一種形式：

- 將 Codex 放在具有 `agentRuntime.id: "codex"` 的專用 agent 上。
- 將預設 agent 保持在 `agentRuntime.id: "auto"`，並為一般混合
  provider 使用保留 PI 後援。
- 僅為相容性使用舊版 `codex/*` 參照。新設定應偏好
  `openai/*` 加上明確的 Codex 執行環境政策。

例如，這會讓預設 agent 保持一般自動選取，並新增獨立的 Codex agent：

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

使用此形式時：

- 預設 `main` agent 會使用一般 provider 路徑和 PI 相容性後援。
- `codex` agent 會使用 Codex app-server harness。
- 如果 `codex` agent 缺少 Codex 或不支援 Codex，該回合會失敗，
  而不是悄悄使用 PI。

## Agent 指令路由

Agent 應依意圖路由使用者請求，而不只依據「Codex」一詞：

| 使用者要求...                                           | Agent 應使用...                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「將此聊天綁定到 Codex」                              | `/codex bind`                                    |
| 「在這裡接續 Codex thread `<id>`」                    | `/codex resume <id>`                             |
| 「顯示 Codex threads」                                | `/codex threads`                                 |
| 「為不良的 Codex 執行提交支援報告」                  | `/diagnostics [note]`                            |
| 「只針對這個附加的 thread 傳送 Codex 意見回饋」       | `/codex diagnostics [note]`                      |
| 「透過 Codex runtime 使用我的 ChatGPT/Codex 訂閱」     | `openai/*` 加上 `agentRuntime.id: "codex"`       |
| 「透過 PI 使用我的 ChatGPT/Codex 訂閱」                | `openai-codex/*` model refs                      |
| 「透過 ACP/acpx 執行 Codex」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」 | ACP/acpx，而不是 `/codex`，也不是原生 sub-agents |

OpenClaw 只會在 ACP 已啟用、可分派，且由已載入的執行環境後端支援時，
向 agent 宣告 ACP 產生指引。如果 ACP 不可用，系統提示和 Plugin skills
不應教導 agent 關於 ACP 路由。

## 僅 Codex 部署

當你需要證明每個嵌入式 agent 回合都使用 Codex 時，請強制使用 Codex
harness。明確的 Plugin 執行環境會關閉失敗，絕不會靜默地透過 PI 重試：

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

強制使用 Codex 時，如果 Codex Plugin 已停用、app-server 太舊，
或 app-server 無法啟動，OpenClaw 會提早失敗。

## 個別 agent 的 Codex

你可以讓一個 agent 只使用 Codex，同時讓預設 agent 保持一般
自動選取：

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

使用一般工作階段指令來切換 agent 和模型。`/new` 會建立新的
OpenClaw 工作階段，而 Codex harness 會視需要建立或接續其 sidecar app-server
thread。`/reset` 會清除該 thread 的 OpenClaw 工作階段綁定，
並讓下一個回合再次從目前設定解析 harness。

## 模型探索

預設情況下，Codex Plugin 會向 app-server 詢問可用模型。如果
探索失敗或逾時，它會使用隨附的後援目錄：

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

當你希望啟動時避免探測 Codex 並固定使用後援目錄時，請停用探索：

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

## App-server 連線與政策

預設情況下，Plugin 會使用以下方式在本機啟動 OpenClaw 管理的 Codex
二進位檔：

```bash
codex app-server --listen stdio://
```

受管理的二進位檔會隨 `codex` Plugin 套件一起提供。這會讓
app-server 版本綁定到隨附 Plugin，而不是本機剛好安裝的其他
Codex CLI。只有在你刻意要執行不同可執行檔時，才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO 模式啟動本機 Codex harness 工作階段：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這是用於自主 Heartbeat 的受信任本機
操作者姿態：Codex 可以使用 shell 和網路工具，而不會停在沒有人能回應的
原生核准提示上。

若要選擇使用 Codex guardian-reviewed 核准，請設定 `appServer.mode:
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

Guardian 模式會使用 Codex 的原生自動審查核准路徑。當 Codex 要求
離開 sandbox、寫入工作區外部，或新增網路存取等權限時，Codex 會將該
核准請求路由到原生 reviewer，而不是人類提示。Reviewer 會套用 Codex
的風險框架，並核准或拒絕該特定請求。當你需要比 YOLO 模式更多防護，
但仍需要無人值守的 agent 持續推進時，請使用 Guardian。

`guardian` 預設集會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
個別政策欄位仍會覆寫 `mode`，因此進階部署可以將預設集與明確選項混用。
較舊的 `guardian_subagent` reviewer 值仍會作為相容性別名接受，
但新設定應使用 `auto_review`。

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
但 OpenClaw 擁有 Codex app-server 帳號橋接，並將 `CODEX_HOME` 和
`HOME` 都設定為該 agent 的 OpenClaw 狀態下的個別 agent 目錄。
Codex 自身的 skill loader 會讀取 `$CODEX_HOME/skills` 和
`$HOME/.agents/skills`，因此本機 app-server 啟動的兩個值都會被隔離。
這會讓 Codex 原生 skills、plugins、設定、帳號和 thread 狀態限定在
OpenClaw agent 範圍內，而不會從操作者的個人 Codex CLI home 洩漏進來。

OpenClaw plugins 和 OpenClaw skill snapshots 仍會透過 OpenClaw 自己的
Plugin registry 和 skill loader 流動。個人 Codex CLI 資產不會。如果你有
有用的 Codex CLI skills 或 plugins 應成為 OpenClaw agent 的一部分，
請明確盤點它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider 會將 skills 複製到目前的 OpenClaw agent
工作區。Codex 原生 plugins、hooks 和設定檔會回報或封存以供手動審查，
而不是自動啟用，因為它們可以執行指令、公開 MCP servers，或攜帶憑證。

驗證會依以下順序選取：

1. 該 agent 的明確 OpenClaw Codex 驗證設定檔。
2. 該 agent 的 Codex home 中 app-server 既有帳號。
3. 僅限本機 stdio app-server 啟動，當沒有 app-server 帳號且仍需要
   OpenAI 驗證時，使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，會從產生的
Codex 子程序移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓 Gateway
層級 API 金鑰仍可用於 embeddings 或直接 OpenAI 模型，而不會意外讓原生
Codex app-server 回合透過 API 計費。明確的 Codex API-key 設定檔和
本機 stdio env-key 後援會使用 app-server 登入，而不是繼承的子程序 env。
WebSocket app-server 連線不會接收 Gateway env API-key 後援；請使用明確
驗證設定檔或遠端 app-server 自己的帳號。

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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。

Codex 動態工具預設使用 `native-first` 設定檔。在該模式下，
OpenClaw 不會公開與 Codex 原生工作區操作重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和
`update_plan`。OpenClaw 整合工具，例如訊息、工作階段、媒體、
cron、瀏覽器、節點、gateway、`heartbeat_respond` 和 `web_search` 仍然
可用。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設值           | 意義                                                                                         |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 將完整的 OpenClaw 動態工具集公開給 Codex app-server。               |
| `codexDynamicToolsExclude` | `[]`             | 要在 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                               |

支援的 `appServer` 欄位：

| 欄位                | 預設值                                   | 意義                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                           |
| `command`           | 受管理的 Codex 二進位檔                 | stdio 傳輸使用的可執行檔。保留未設定會使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                                             |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸使用的引數。                                                                                                                                                                                                            |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                        |
| `authToken`         | 未設定                                   | WebSocket 傳輸使用的 Bearer 權杖。                                                                                                                                                                                                |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                           |
| `clearEnv`          | `[]`                                     | 在 OpenClaw 建立其繼承環境後，從產生的 stdio app-server 程序移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給 OpenClaw 在本機啟動時進行每個代理的 Codex 隔離。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                              |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 審查執行的預設值。                                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | 傳送至執行緒啟動／恢復／回合的原生 Codex 核准政策。                                                                                                                                                                             |
| `sandbox`           | `"danger-full-access"`                   | 傳送至執行緒啟動／恢復的原生 Codex 沙箱模式。                                                                                                                                                                                   |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審查原生核准提示。`guardian_subagent` 仍是舊版別名。                                                                                                                                               |
| `serviceTier`       | 未設定                                   | 選用的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                                            |

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制：每個 Codex `item/tool/call` 請求都必須在
30 秒內收到 OpenClaw 回應。逾時時，OpenClaw 會在支援處中止工具
訊號，並向 Codex 傳回失敗的動態工具回應，讓該回合可以繼續，
而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 請求後，測試框架
也預期 Codex 以 `turn/completed` 完成原生回合。如果
app-server 在該回應後安靜 60 秒，OpenClaw 會盡力
中斷 Codex 回合、記錄診斷逾時，並釋放
OpenClaw 工作階段通道，讓後續聊天訊息不會排在過期的
原生回合後面。

本機測試仍可使用環境覆寫：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於
可重複部署，建議使用設定，因為它會將 Plugin 行為保留在與其餘
Codex 測試框架設定相同的已審查檔案中。

## 電腦使用

電腦使用已在其專屬設定指南中說明：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會將桌面控制應用程式納入供應，也不會自行執行
桌面動作。它會準備 Codex app-server、驗證
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合中處理原生
MCP 工具呼叫。

若要在 Codex marketplace 流程之外直接存取 TryCua 驅動程式，請使用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊
`cua-driver mcp`。請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use) 了解
Codex 擁有的電腦使用與直接 MCP 註冊之間的差異。

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

Computer Use 僅適用於 macOS，且在 Codex MCP 伺服器能控制應用程式之前，可能需要本機作業系統權限。如果 `computerUse.enabled` 為 true 且 MCP 伺服器無法使用，Codex 模式的回合會在線程開始前失敗，而不是在沒有原生 Computer Use 工具的情況下靜默執行。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use)，了解 marketplace 選項、遠端目錄限制、狀態原因與疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex 尚未發現本機 marketplace，OpenClaw 可以從 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊標準的隨附 Codex Desktop marketplace。變更 runtime 或 Computer Use 設定後，請使用 `/new` 或 `/reset`，讓現有工作階段不會保留舊的 Pi 或 Codex 線程綁定。

## 常見設定範例

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

僅 Codex 的測試架構驗證：

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

由 guardian 審查的 Codex 核准：

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

模型切換仍由 OpenClaw 控制。當 OpenClaw 工作階段附加到現有的 Codex 線程時，下一個回合會再次將目前選取的 OpenAI 模型、供應商、核准原則、沙箱與服務層級傳送至 app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留線程綁定，但要求 Codex 使用新選取的模型繼續。

## Codex 命令

隨附的 Plugin 會將 `/codex` 註冊為已授權的斜線命令。它是通用命令，可在任何支援 OpenClaw 文字命令的通道上運作。

常見形式：

- `/codex status` 顯示即時應用程式伺服器連線能力、模型、帳戶、速率限制、MCP 伺服器與 Skills。
- `/codex models` 列出即時 Codex 應用程式伺服器模型。
- `/codex threads [filter]` 列出最近的 Codex 對話串。
- `/codex resume <thread-id>` 將目前的 OpenClaw 工作階段附加到現有的 Codex 對話串。
- `/codex compact` 要求 Codex 應用程式伺服器對已附加的對話串進行 compact。
- `/codex review` 為已附加的對話串啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加對話串的 Codex 診斷回饋前先詢問。
- `/codex computer-use status` 檢查已設定的 Computer Use Plugin 與 MCP 伺服器。
- `/codex computer-use install` 安裝已設定的 Computer Use Plugin 並重新載入 MCP 伺服器。
- `/codex account` 顯示帳戶與速率限制狀態。
- `/codex mcp` 列出 Codex 應用程式伺服器 MCP 伺服器狀態。
- `/codex skills` 列出 Codex 應用程式伺服器 Skills。

當 Codex 回報使用量限制失敗時，若 Codex 有提供下一次
應用程式伺服器重設時間，OpenClaw 會一併包含該時間。在同一個
對話中使用 `/codex account` 檢查目前的帳戶與速率限制時段。

### 常見除錯工作流程

當由 Codex 支援的代理程式在 Telegram、Discord、Slack
或其他通道中做出令人意外的行為時，請從發生問題的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload` 或另一則簡短註記
   來描述你看到的情況。
2. 核准診斷要求一次。該核准會建立本機 Gateway
   診斷 zip，並且因為工作階段使用 Codex harness，也會
   將相關的 Codex 回饋套件傳送到 OpenAI 伺服器。
3. 將完成的診斷回覆複製到錯誤報告或支援討論串中。
   其中包含本機套件路徑、隱私摘要、OpenClaw 工作階段 ID、
   Codex 對話串 ID，以及每個 Codex 對話串的 `Inspect locally` 行。
4. 如果你想自行除錯這次執行，請在終端機中執行列印出的 `Inspect locally`
   命令。它看起來像 `codex resume <thread-id>`，並會開啟
   原生 Codex 對話串，讓你檢查對話、在本機繼續它，
   或詢問 Codex 為什麼選擇特定工具或計畫。

只有在你特別想為目前附加的對話串上傳 Codex
回饋，而不需要完整 OpenClaw
Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。對大多數支援報告來說，`/diagnostics [note]` 是
更好的起點，因為它會在同一則回覆中把本機 Gateway 狀態與 Codex
對話串 ID 串在一起。完整隱私模型與群組聊天行為請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。

核心 OpenClaw 也公開僅限擁有者使用的 `/diagnostics [note]`，作為一般
Gateway 診斷命令。它的核准提示會顯示敏感資料
前言、連結到 [診斷匯出](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec 核准
要求 `openclaw gateway diagnostics export --json`。請勿使用允許全部規則核准診斷。核准後，
OpenClaw 會傳送可貼上的報告，其中包含本機套件路徑與資訊清單
摘要。當作用中的 OpenClaw 工作階段使用 Codex harness 時，同一個核准
也會授權將相關的 Codex 回饋套件傳送到
OpenAI 伺服器。核准提示會說明將傳送 Codex 回饋，但
它不會在核准前列出 Codex 工作階段或對話串 ID。

如果擁有者在群組聊天中呼叫 `/diagnostics`，OpenClaw 會保持
共用通道整潔：群組只會收到簡短通知，而
診斷前言、核准提示與 Codex 工作階段/對話串 ID 會透過
私人核准路由傳送給擁有者。如果沒有私人擁有者路由，
OpenClaw 會拒絕群組要求，並請擁有者從私訊執行。

已核准的 Codex 上傳會呼叫 Codex 應用程式伺服器 `feedback/upload`，並要求
應用程式伺服器在可用時包含每個列出的對話串與衍生 Codex 子對話串
的記錄。上傳會透過 Codex 的一般回饋路徑前往 OpenAI
伺服器；如果該應用程式伺服器停用了 Codex 回饋，命令會傳回
應用程式伺服器錯誤。完成的診斷回覆會列出通道、
OpenClaw 工作階段 ID、Codex 對話串 ID，以及已傳送對話串的本機 `codex resume <thread-id>`
命令。如果你拒絕或忽略核准，
OpenClaw 不會列印那些 Codex ID。這次上傳不會取代本機
Gateway 診斷匯出。

`/codex resume` 會寫入與 harness 正常回合使用相同的 sidecar 繫結檔案。
在下一則訊息時，OpenClaw 會恢復該 Codex 對話串，將
目前選取的 OpenClaw 模型傳入應用程式伺服器，並保持延伸歷史
啟用。

### 從 CLI 檢查 Codex 對話串

了解有問題的 Codex 執行，最快的方式通常是直接開啟原生 Codex
對話串：

```sh
codex resume <thread-id>
```

當你在通道對話中注意到錯誤，並想檢查
有問題的 Codex 工作階段、在本機繼續它，或詢問 Codex 為什麼做出
特定工具或推理選擇時，請使用此方式。最簡單的路徑通常是先執行
`/diagnostics [note]`：核准後，完成的報告會列出
每個 Codex 對話串，並列印 `Inspect locally` 命令，例如
`codex resume <thread-id>`。你可以直接將該命令複製到終端機。

你也可以從目前聊天的 `/codex binding` 取得對話串 ID，或從
最近 Codex 應用程式伺服器對話串的 `/codex threads [filter]` 取得，然後在 shell 中執行相同的
`codex resume` 命令。

此命令介面需要 Codex 應用程式伺服器 `0.125.0` 或更新版本。如果未來或自訂的應用程式伺服器未公開該 JSON-RPC 方法，個別控制方法會回報為 `unsupported by this Codex app-server`。

## Hook 邊界

Codex harness 有三個 hook 層：

| 層                                    | 擁有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hooks                 | OpenClaw                 | 跨 PI 與 Codex harness 的產品/Plugin 相容性。                       |
| Codex 應用程式伺服器 extension middleware | OpenClaw bundled plugins | 圍繞 OpenClaw 動態工具的逐回合 adapter 行為。                       |
| Codex 原生 hooks                      | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。               |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由
OpenClaw Plugin 行為。對於受支援的原生工具與權限橋接，
OpenClaw 會為 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 與 `Stop` 注入逐對話串 Codex 設定。其他 Codex hooks，例如 `SessionStart` 與
`UserPromptSubmit`，仍是 Codex 層級的控制；它們不會在 v1 合約中作為
OpenClaw Plugin hooks 公開。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求
呼叫後執行工具，因此 OpenClaw 會在
harness adapter 中觸發它所擁有的 Plugin 與 middleware 行為。對於 Codex 原生工具，Codex 擁有標準工具記錄。
OpenClaw 可以鏡像選定事件，但除非 Codex 透過應用程式伺服器或原生 hook
回呼公開該操作，否則它無法重寫原生 Codex
對話串。

Compaction 與 LLM 生命週期投影來自 Codex 應用程式伺服器
通知與 OpenClaw adapter 狀態，而不是原生 Codex hook 命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 與
`llm_output` 事件是 adapter 層級觀察，而不是逐位元組擷取
Codex 內部請求或 compaction payload。

Codex 原生 `hook/started` 與 `hook/completed` 應用程式伺服器通知會
投影為 `codex_app_server.hook` 代理程式事件，用於軌跡與除錯。
它們不會呼叫 OpenClaw Plugin hooks。

## V1 支援合約

Codex 模式不是在底層換成不同模型呼叫的 PI。Codex 擁有更多
原生模型迴圈，而 OpenClaw 會圍繞該邊界調整其 Plugin 與工作階段介面。

Codex runtime v1 支援：

| 介面                                          | 支援                                    | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈                 | 支援                                    | Codex 應用程式伺服器擁有 OpenAI 回合、原生對話串恢復與原生工具續行。                                                                                                                               |
| OpenClaw 通道路由與交付                       | 支援                                    | Telegram、Discord、Slack、WhatsApp、iMessage 與其他通道會留在模型 runtime 之外。                                                                                                                     |
| OpenClaw 動態工具                             | 支援                                    | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 仍在執行路徑中。                                                                                                                                      |
| Prompt 與內容 Plugin                          | 支援                                    | OpenClaw 會在開始或恢復對話串前建立 prompt 覆蓋層，並將內容投影到 Codex 回合中。                                                                                                                     |
| 內容引擎生命週期                              | 支援                                    | 組裝、擷取或回合後維護，以及內容引擎 compaction 協調，都會為 Codex 回合執行。                                                                                                                        |
| 動態工具 hooks                                | 支援                                    | `before_tool_call`、`after_tool_call` 與工具結果 middleware 會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                     |
| 生命週期 hooks                                | 作為 adapter 觀察支援                   | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 與 `after_compaction` 會以誠實的 Codex 模式 payload 觸發。                                                                                |
| 最終答案修訂 gate                             | 透過原生 hook relay 支援                | Codex `Stop` 會 relay 到 `before_agent_finalize`；`revise` 會要求 Codex 在最終定稿前再進行一次模型 pass。                                                                                            |
| 原生 shell、patch 與 MCP 封鎖或觀察           | 透過原生 hook relay 支援                | Codex `PreToolUse` 與 `PostToolUse` 會針對已承諾的原生工具介面 relay，包括 Codex 應用程式伺服器 `0.125.0` 或更新版本上的 MCP payload。支援封鎖；不支援參數重寫。 |
| 原生權限政策                                  | 透過原生 hook relay 支援                | Codex `PermissionRequest` 可在 runtime 公開時透過 OpenClaw 政策路由。如果 OpenClaw 未回傳決策，Codex 會繼續走其一般 guardian 或使用者核准路徑。                                                     |
| 應用程式伺服器軌跡擷取                        | 支援                                    | OpenClaw 會記錄它傳送給應用程式伺服器的請求，以及它收到的應用程式伺服器通知。                                                                                                                        |

Codex runtime v1 不支援：

| 表面                                                | V1 邊界                                                                                                                                        | 未來路徑                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生工具前置 hook 可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。                                                                   | 需要 Codex hook/schema 支援替換工具輸入。                                                 |
| 可編輯的 Codex 原生對話紀錄歷史                     | Codex 擁有權威原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來脈絡，但不應變更不受支援的內部實作。                                               | 如果需要原生執行緒手術，請新增明確的 Codex 應用程式伺服器 API。                          |
| Codex 原生工具記錄的 `tool_result_persist`          | 該 hook 會轉換 OpenClaw 擁有的對話紀錄寫入，而不是 Codex 原生工具記錄。                                                                        | 可以鏡像已轉換的記錄，但權威重寫需要 Codex 支援。                                        |
| 豐富的原生 Compaction 中繼資料                      | OpenClaw 會觀察 Compaction 開始與完成，但不會收到穩定的保留/捨棄清單、token 差異或摘要酬載。                                                  | 需要更豐富的 Codex Compaction 事件。                                                      |
| Compaction 介入                                     | 目前 OpenClaw Compaction hook 在 Codex 模式中屬於通知層級。                                                                                    | 如果 Plugin 需要否決或重寫原生 Compaction，請新增 Codex 前置/後置 Compaction hook。       |
| 逐位元組一致的模型 API 請求擷取                     | OpenClaw 可以擷取應用程式伺服器請求與通知，但 Codex 核心會在內部建構最終 OpenAI API 請求。                                                     | 需要 Codex 模型請求追蹤事件或除錯 API。                                                   |

## 工具、媒體與 Compaction

Codex harness 只會變更低階嵌入式代理執行器。

OpenClaw 仍會建構工具清單，並從 harness 接收動態工具結果。文字、圖片、影片、音樂、TTS、核准與訊息工具輸出會繼續透過一般 OpenClaw 傳遞路徑處理。

原生 hook relay 是刻意設計成通用的，但 v1 支援合約僅限於 OpenClaw 測試過的 Codex 原生工具與權限路徑。在 Codex 執行階段中，這包含 shell、patch 與 MCP `PreToolUse`、`PostToolUse` 和 `PermissionRequest` 酬載。在執行階段合約命名之前，請勿假設每個未來 Codex hook 事件都是 OpenClaw Plugin 表面。

對於 `PermissionRequest`，OpenClaw 只會在策略決定時回傳明確的允許或拒絕決策。無決策結果不是允許。Codex 會將其視為沒有 hook 決策，並交由自己的守護程式或使用者核准路徑處理。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准徵詢會透過 OpenClaw 的 Plugin 核准流程路由。Codex `request_user_input` 提示會送回原始聊天，下一個排入佇列的後續訊息會回答該原生伺服器請求，而不是被導向為額外脈絡。其他 MCP 徵詢請求仍會封閉失敗。

作用中執行佇列導向會對應到 Codex 應用程式伺服器 `turn/steer`。使用預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的安靜視窗內批次處理排入佇列的聊天訊息，並依抵達順序將它們作為一個 `turn/steer` 請求送出。舊版 `queue` 模式會送出個別的 `turn/steer` 請求。Codex review 與手動 Compaction 回合可能拒絕同一回合導向，在此情況下，若選取的模式允許 fallback，OpenClaw 會使用後續佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當選取的模型使用 Codex harness 時，原生執行緒 Compaction 會委派給 Codex 應用程式伺服器。OpenClaw 會保留對話紀錄鏡像，用於頻道歷史、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。當應用程式伺服器發出時，該鏡像會包含使用者提示、最終助理文字，以及輕量的 Codex reasoning 或 plan 記錄。目前，OpenClaw 只記錄原生 Compaction 開始與完成訊號。它尚未公開人類可讀的 Compaction 摘要，或可稽核的 Codex 在 Compaction 後保留哪些項目的清單。

因為 Codex 擁有權威原生執行緒，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入 OpenClaw 擁有的工作階段對話紀錄工具結果時套用。

媒體生成不需要 PI。圖片、影片、音樂、PDF、TTS 與媒體理解會繼續使用相符的 provider/model 設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 疑難排解

**Codex 不會顯示為一般 `/model` provider：** 這對新設定而言是預期行為。請選取具有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` ref）、啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除 `codex`。

**OpenClaw 使用 PI 而非 Codex：** 當沒有 Codex harness 宣告該次執行時，`agentRuntime.id: "auto"` 仍可使用 PI 作為相容性後端。測試時請設定 `agentRuntime.id: "codex"` 以強制選取 Codex。強制 Codex 執行階段會失敗，而不是 fallback 到 PI。一旦選取 Codex 應用程式伺服器，其失敗會直接浮現。

**應用程式伺服器遭拒：** 請升級 Codex，讓應用程式伺服器交握回報版本 `0.125.0` 或更新版本。同版本的 prerelease 或帶有建置尾碼的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom` 會遭拒，因為 OpenClaw 測試的是穩定版 `0.125.0` 協定下限。

**模型探索很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket 傳輸立即失敗：** 請檢查 `appServer.url`、`authToken`，以及遠端應用程式伺服器是否使用相同的 Codex 應用程式伺服器協定版本。

**非 Codex 模型使用 PI：** 除非你為該代理強制設定 `agentRuntime.id: "codex"`，或選取舊版 `codex/*` ref，否則這是預期行為。一般 `openai/gpt-*` 與其他 provider ref 在 `auto` 模式中會維持其正常 provider 路徑。如果你強制設定 `agentRuntime.id: "codex"`，該代理的每個嵌入式回合都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具未執行：** 從全新工作階段檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果仍持續發生，請重新啟動 Gateway 以清除過時的原生 hook 註冊。如果 `computer-use.list_apps` 逾時，請重新啟動 Codex Computer Use 或 Codex Desktop，然後重試。

## 相關

- [代理 harness Plugin](/zh-TW/plugins/sdk-agent-harness)
- [代理執行階段](/zh-TW/concepts/agent-runtimes)
- [模型 provider](/zh-TW/concepts/model-providers)
- [OpenAI provider](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin hook](/zh-TW/plugins/hooks)
- [設定參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
