---
read_when:
    - 您想要使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅限 Codex 的部署失敗，而不是退回使用 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-03T21:37:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

內建的 `codex` Plugin 讓 OpenClaw 透過 Codex app-server 執行嵌入式代理回合，而不是使用內建的 PI harness。

當你希望由 Codex 擁有底層代理工作階段時，請使用此功能：模型探索、原生執行緒恢復、原生 Compaction，以及 app-server 執行。OpenClaw 仍然擁有聊天頻道、工作階段檔案、模型選擇、工具、核准、媒體傳遞，以及可見轉錄鏡像。

當來源聊天回合透過 Codex harness 執行時，若部署尚未明確設定 `messages.visibleReplies`，可見回覆預設會使用 OpenClaw `message` 工具。代理仍可私下完成其 Codex 回合；只有在呼叫 `message(action="send")` 時才會發佈到頻道。將 `messages.visibleReplies: "automatic"` 設為保留直接聊天最終回覆的舊版自動傳遞路徑。

Codex Heartbeat 回合預設也會取得 `heartbeat_respond` 工具，因此代理可以記錄這次喚醒應保持安靜或發出通知，而不必在最終文字中編碼該控制流程。

Heartbeat 專用的主動性指引會作為 Codex 協作模式開發者指令，傳送到 Heartbeat 回合本身。一般聊天回合會還原 Codex Default 模式，而不是在其正常執行階段提示中攜帶 Heartbeat 哲學。

如果你正在嘗試建立方向感，請從[代理執行階段](/zh-TW/concepts/agent-runtimes)開始。簡短來說：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他頻道仍是通訊介面。

## 快速設定

多數想要「Codex in OpenClaw」的使用者需要這條路徑：使用 ChatGPT/Codex 訂閱登入，然後透過原生 Codex app-server 執行階段執行嵌入式代理回合。模型參照仍維持 `openai/gpt-*` 作為標準；訂閱驗證來自 Codex 帳戶/設定檔，而不是來自 `openai-codex/*` 模型前綴。

如果尚未登入，請先使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai-codex
```

接著啟用內建的 `codex` Plugin，並強制使用 Codex 執行階段：

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

當你指的是原生 Codex 執行階段時，不要使用 `openai-codex/gpt-*`。該前綴是明確的「透過 PI 使用 Codex OAuth」路徑。設定變更會套用到新的或重設的工作階段；現有工作階段會保留其已記錄的執行階段。

## 這個 Plugin 會改變什麼

內建的 `codex` Plugin 提供幾項彼此獨立的能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式執行階段                | `agentRuntime.id: "codex"`                          | 透過 Codex app-server 執行 OpenClaw 嵌入式代理回合。                          |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話綁定並控制 Codex app-server 執行緒。                                |
| Codex app-server 提供者/目錄       | `codex` internals, surfaced through the harness     | 讓執行階段探索並驗證 app-server 模型。                                        |
| Codex 媒體理解路徑                | `codex/*` image-model compatibility paths           | 針對支援的影像理解模型執行有界的 Codex app-server 回合。                      |
| 原生 hook 轉送                    | Plugin hooks around Codex-native events             | 讓 OpenClaw 觀察/阻擋支援的 Codex 原生工具/最終化事件。                       |

啟用 Plugin 會讓這些能力可用。它**不會**：

- 開始對每個 OpenAI 模型使用 Codex
- 將 `openai-codex/*` 模型參照轉換為原生執行階段
- 讓 ACP/acpx 成為預設的 Codex 路徑
- 熱切換已記錄 PI 執行階段的現有工作階段
- 取代 OpenClaw 頻道傳遞、工作階段檔案、驗證設定檔儲存，或訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制命令介面。如果 Plugin 已啟用，且使用者要求從聊天中綁定、恢復、導向、停止或檢查 Codex 執行緒，代理應優先使用 `/codex ...` 而不是 ACP。當使用者要求 ACP/acpx 或正在測試 ACP Codex 配接器時，ACP 仍是明確的備援。

原生 Codex 回合會保留 OpenClaw Plugin hooks 作為公開相容層。這些是處理序內的 OpenClaw hooks，不是 Codex `hooks.json` 命令 hooks：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用於鏡像轉錄記錄
- `before_agent_finalize` 透過 Codex `Stop` 轉送
- `agent_end`

Plugin 也可以註冊執行階段中立的工具結果中介軟體，在 OpenClaw 執行工具後、結果傳回 Codex 前，重寫 OpenClaw 動態工具結果。這與公開的 `tool_result_persist` Plugin hook 分開，後者會轉換 OpenClaw 擁有的轉錄工具結果寫入。

如需 Plugin hook 語義本身，請參閱 [Plugin hooks](/zh-TW/plugins/hooks) 和 [Plugin 防護行為](/zh-TW/tools/plugin)。

此 harness 預設為關閉。新設定應維持 OpenAI 模型參照以 `openai/gpt-*` 作為標準，並在需要原生 app-server 執行時，明確強制使用 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版 `codex/*` 模型參照仍會為了相容性自動選取 harness，但以執行階段支援的舊版提供者前綴不會顯示為一般模型/提供者選項。

如果 `codex` Plugin 已啟用，但主要模型仍是 `openai-codex/*`，`openclaw doctor` 會提出警告，而不是變更路徑。這是刻意設計：`openai-codex/*` 仍是 PI Codex OAuth/訂閱路徑，而原生 app-server 執行仍是明確的執行階段選擇。

## 路徑對照

變更設定前請使用此表：

| 期望行為                                             | 模型參照                   | 執行階段設定                         | 驗證/設定檔路徑              | 預期狀態標籤                 |
| ---------------------------------------------------- | -------------------------- | ------------------------------------ | ---------------------------- | ---------------------------- |
| 搭配原生 Codex 執行階段的 ChatGPT/Codex 訂閱         | `openai/gpt-*`             | `agentRuntime.id: "codex"`           | Codex OAuth 或 Codex 帳戶    | `Runtime: OpenAI Codex`      |
| 透過一般 OpenClaw runner 使用 OpenAI API             | `openai/gpt-*`             | omitted or `runtime: "pi"`           | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| 透過 PI 使用 ChatGPT/Codex 訂閱                       | `openai-codex/gpt-*`       | omitted or `runtime: "pi"`           | OpenAI Codex OAuth provider  | `Runtime: OpenClaw Pi Default` |
| 搭配保守自動模式的混合提供者                         | provider-specific refs     | `agentRuntime.id: "auto"`            | Per selected provider        | Depends on selected runtime  |
| 明確的 Codex ACP 配接器工作階段                      | ACP prompt/model dependent | `sessions_spawn` with `runtime: "acp"` | ACP backend auth           | ACP task/session status      |

重點差異是提供者與執行階段：

- `openai-codex/*` 回答「PI 應使用哪個提供者/驗證路徑？」
- `agentRuntime.id: "codex"` 回答「哪個迴圈應執行這個嵌入式回合？」
- `/codex ...` 回答「這個聊天應綁定或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應啟動哪個外部 harness 處理序？」

## 選擇正確的模型前綴

OpenAI 系列路徑依前綴區分。對於常見的訂閱加原生 Codex 執行階段設定，請使用 `openai/*` 搭配 `agentRuntime.id: "codex"`。只有在你刻意要透過 PI 使用 Codex OAuth 時，才使用 `openai-codex/*`：

| 模型參照                                      | 執行階段路徑                                | 使用時機                                                                 |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`                              | 透過 OpenClaw/PI 管線使用 OpenAI 提供者      | 你要以 `OPENAI_API_KEY` 使用目前的直接 OpenAI Platform API 存取。        |
| `openai-codex/gpt-5.5`                        | 透過 OpenClaw/PI 使用 OpenAI Codex OAuth     | 你要以預設 PI runner 使用 ChatGPT/Codex 訂閱驗證。                      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                    | 你要以原生 Codex 執行使用 ChatGPT/Codex 訂閱驗證。                      |

當你的帳戶公開這些路徑時，GPT-5.5 可以同時出現在直接 OpenAI API-key 與 Codex 訂閱路徑上。原生 Codex 執行階段請使用 `openai/gpt-5.5` 搭配 Codex app-server harness；PI OAuth 請使用 `openai-codex/gpt-5.5`；直接 API-key 流量請使用沒有 Codex 執行階段覆寫的 `openai/gpt-5.5`。

舊版 `codex/gpt-*` 參照仍作為相容別名接受。Doctor 相容性遷移會將舊版主要執行階段參照重寫為標準模型參照，並分開記錄執行階段政策，而僅作為備援的舊版參照會保持不變，因為執行階段是為整個代理容器設定。新的 PI Codex OAuth 設定應使用 `openai-codex/gpt-*`；新的原生 app-server harness 設定應使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前綴區分。當影像理解應透過 OpenAI Codex OAuth 提供者路徑執行時，請使用 `openai-codex/gpt-*`。當影像理解應透過有界的 Codex app-server 回合執行時，請使用 `codex/gpt-*`。Codex app-server 模型必須宣告支援影像輸入；純文字 Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效 harness。如果選擇結果出乎意料，請啟用 `agents/harness` 子系統的除錯記錄，並檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含選取的 harness id、選取原因、執行階段/備援政策，以及在 `auto` 模式中每個 Plugin 候選項目的支援結果。

### Doctor 警告代表什麼

當以下全部為真時，`openclaw doctor` 會提出警告：

- 內建的 `codex` Plugin 已啟用或允許
- 代理的主要模型是 `openai-codex/*`
- 該代理的有效執行階段不是 `codex`

此警告存在，是因為使用者常預期「Codex Plugin 已啟用」代表「原生 Codex app-server 執行階段」。OpenClaw 不會做出這個跳躍。此警告表示：

- 如果你原本就打算透過 PI 使用 ChatGPT/Codex OAuth，則**不需要變更**。
- 如果你打算使用原生 app-server 執行，請將模型變更為 `openai/<model>`，並設定 `agentRuntime.id: "codex"`。
- 執行階段變更後，現有工作階段仍需要 `/new` 或 `/reset`，因為工作階段執行階段釘選是黏著的。

Harness 選擇不是即時工作階段控制。當嵌入式回合執行時，OpenClaw 會在該工作階段記錄所選的 harness id，並在同一工作階段 id 的後續回合中繼續使用。當你希望未來工作階段使用另一個 harness 時，請變更 `agentRuntime` 設定或 `OPENCLAW_AGENT_RUNTIME`；在既有對話於 PI 與 Codex 之間切換前，請使用 `/new` 或 `/reset` 啟動新的工作階段。這可避免透過兩個不相容的原生工作階段系統重放同一份轉錄。

在 harness 固定機制推出前建立的舊版工作階段，只要已有 transcript 歷史，就會被視為已固定到 PI。變更設定後，請使用 `/new` 或 `/reset` 讓該對話改用 Codex。

`/status` 會顯示實際生效的模型 runtime。預設 PI harness 會顯示為 `Runtime: OpenClaw Pi Default`，Codex app-server harness 則會顯示為 `Runtime: OpenAI Codex`。

## 需求

- OpenClaw，且隨附的 `codex` Plugin 可用。
- Codex app-server `0.125.0` 或更新版本。隨附的 Plugin 預設會管理相容的 Codex app-server binary，因此 `PATH` 上的本機 `codex` 指令不會影響一般 harness 啟動。
- app-server 程序或 OpenClaw 的 Codex auth bridge 可使用 Codex 驗證。本機 app-server 啟動會為每個 agent 使用由 OpenClaw 管理的 Codex home，以及隔離的子程序 `HOME`，因此預設不會讀取你的個人 `~/.codex` 帳戶、skills、plugins、config、thread state，或原生 `$HOME/.agents/skills`。

Plugin 會封鎖較舊或未標版本的 app-server handshake。這能讓 OpenClaw 維持在已測試過的 protocol surface 上。

對於 live 和 Docker smoke tests，auth 通常來自 Codex CLI 帳戶或 OpenClaw `openai-codex` auth profile。本機 stdio app-server 啟動在沒有帳戶時，也可以 fallback 到 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作區 bootstrap 檔案

Codex 會透過原生 project-doc discovery 自行處理 `AGENTS.md`。OpenClaw 不會寫入合成的 Codex project-doc 檔案，也不依賴 Codex fallback 檔名作為 persona files，因為 Codex fallbacks 只會在缺少 `AGENTS.md` 時套用。

為了保持 OpenClaw 工作區一致性，Codex harness 會解析其他 bootstrap 檔案（存在時包含 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`），並在 `thread/start` 和 `thread/resume` 時透過 Codex config instructions 轉送。這會讓 `SOUL.md` 和相關工作區 persona/profile context 保持可見，而不需要複製 `AGENTS.md`。

## 將 Codex 加到其他模型旁邊

如果同一個 agent 應該能在 Codex 和非 Codex provider models 之間自由切換，請不要全域設定 `agentRuntime.id: "codex"`。強制 runtime 會套用到該 agent 或 session 的每個 embedded turn。如果在該 runtime 被強制時選取 Anthropic model，OpenClaw 仍會嘗試使用 Codex harness，並以 fail closed 結束，而不是默默將該 turn 路由 through PI。

請改用以下其中一種形態：

- 將 Codex 放在具有 `agentRuntime.id: "codex"` 的專用 agent 上。
- 將預設 agent 保持在 `agentRuntime.id: "auto"`，並使用 PI fallback 進行一般混合 provider 使用。
- 只為相容性使用舊版 `codex/*` refs。新設定應偏好 `openai/*` 加上明確的 Codex runtime policy。

例如，以下會讓預設 agent 維持一般自動選取，並新增一個獨立的 Codex agent：

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

使用此形態時：

- 預設 `main` agent 會使用一般 provider path 和 PI compatibility fallback。
- `codex` agent 會使用 Codex app-server harness。
- 如果 `codex` agent 缺少 Codex 或不支援 Codex，該 turn 會失敗，而不是悄悄使用 PI。

## Agent 指令路由

Agents 應該依意圖路由使用者請求，而不是只看「Codex」這個字：

| 使用者要求...                                         | Agent 應使用...                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「將此 chat 綁定到 Codex」                            | `/codex bind`                                    |
| 「在這裡恢復 Codex thread `<id>`」                    | `/codex resume <id>`                             |
| 「顯示 Codex threads」                                | `/codex threads`                                 |
| 「為一次不良 Codex run 提交 support report」          | `/diagnostics [note]`                            |
| 「只針對這個附加 thread 傳送 Codex feedback」         | `/codex diagnostics [note]`                      |
| 「以 Codex runtime 使用我的 ChatGPT/Codex 訂閱」       | `openai/*` 加上 `agentRuntime.id: "codex"`       |
| 「透過 PI 使用我的 ChatGPT/Codex 訂閱」                | `openai-codex/*` model refs                      |
| 「透過 ACP/acpx 執行 Codex」                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」 | ACP/acpx，而不是 `/codex`，也不是原生 sub-agents |

OpenClaw 只會在 ACP 已啟用、可 dispatch，且由已載入的 runtime backend 支援時，才向 agents 公告 ACP spawn guidance。如果 ACP 不可用，system prompt 和 plugin skills 不應教 agent ACP routing。

## Codex-only 部署

當你需要證明每個 embedded agent turn 都使用 Codex 時，請強制使用 Codex harness。明確的 Plugin runtimes 會 fail closed，絕不會默默 through PI 重試：

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

強制使用 Codex 時，如果 Codex Plugin 已停用、app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## 個別 agent 的 Codex

你可以讓一個 agent 只使用 Codex，而預設 agent 保持一般 auto-selection：

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

使用一般 session commands 切換 agents 和 models。`/new` 會建立新的 OpenClaw session，Codex harness 會視需要建立或恢復它的 sidecar app-server thread。`/reset` 會清除該 thread 的 OpenClaw session binding，並讓下一個 turn 再次從目前設定解析 harness。

## 模型 discovery

預設情況下，Codex Plugin 會向 app-server 詢問可用模型。如果 discovery 失敗或逾時，它會使用隨附的 fallback catalog：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以在 `plugins.entries.codex.config.discovery` 下調整 discovery：

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

當你希望啟動時避免 probing Codex 並固定使用 fallback catalog，請停用 discovery：

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

預設情況下，Plugin 會以以下方式在本機啟動 OpenClaw 管理的 Codex binary：

```bash
codex app-server --listen stdio://
```

受管理的 binary 會隨 `codex` Plugin package 一起發布。這會讓 app-server 版本綁定到隨附的 Plugin，而不是本機剛好安裝的其他 Codex CLI。只有在你有意執行不同 executable 時，才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO mode 啟動本機 Codex harness sessions：`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及 `sandbox: "danger-full-access"`。這是 autonomous heartbeats 使用的受信任本機 operator posture：Codex 可以使用 shell 和 network tools，而不會停在沒有人能回答的原生 approval prompts。

若要 opt in 到 Codex guardian-reviewed approvals，請設定 `appServer.mode:
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

Guardian mode 會使用 Codex 的原生 auto-review approval path。當 Codex 要求離開 sandbox、寫入 workspace 之外，或新增 network access 等權限時，Codex 會將該 approval request 路由給原生 reviewer，而不是 human prompt。reviewer 會套用 Codex 的 risk framework，並核准或拒絕該特定請求。當你想要比 YOLO mode 更多 guardrails，但仍需要 unattended agents 持續推進時，請使用 Guardian。

`guardian` preset 會展開為 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。個別 policy fields 仍會覆寫 `mode`，因此進階部署可以將 preset 與明確選項混用。較舊的 `guardian_subagent` reviewer value 仍會作為 compatibility alias 接受，但新設定應使用 `auto_review`。

對於已在執行的 app-server，請使用 WebSocket transport：

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

Stdio app-server 啟動預設會繼承 OpenClaw 的 process environment，但 OpenClaw 擁有 Codex app-server account bridge，並將 `CODEX_HOME` 和 `HOME` 都設為該 agent 的 OpenClaw state 下的個別 agent 目錄。Codex 自己的 skill loader 會讀取 `$CODEX_HOME/skills` 和 `$HOME/.agents/skills`，因此兩個值都會針對本機 app-server 啟動隔離。這會讓 Codex 原生 skills、plugins、config、accounts 和 thread state 限定在 OpenClaw agent 範圍內，而不是從 operator 的個人 Codex CLI home 外洩進來。

OpenClaw plugins 和 OpenClaw skill snapshots 仍會透過 OpenClaw 自己的 plugin registry 和 skill loader 流動。個人 Codex CLI assets 不會。如果你有實用的 Codex CLI skills 或 plugins 應該成為 OpenClaw agent 的一部分，請明確 inventory 它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider 會將 skills 複製到目前 OpenClaw agent workspace。Codex 原生 plugins、hooks 和 config files 會被回報或封存以供手動 review，而不是自動啟用，因為它們可能執行 commands、暴露 MCP servers，或攜帶 credentials。

Auth 會依以下順序選取：

1. 該 agent 的明確 OpenClaw Codex auth profile。
2. 該 agent 的 Codex home 中 app-server 的現有帳戶。
3. 僅限本機 stdio app-server 啟動，當沒有 app-server 帳戶且仍需要 OpenAI auth 時，使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT subscription-style Codex auth profile 時，會從產生的 Codex 子程序移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓 Gateway 層級 API keys 仍可用於 embeddings 或 direct OpenAI models，而不會意外讓原生 Codex app-server turns 透過 API 計費。明確的 Codex API-key profiles 和本機 stdio env-key fallback 會使用 app-server login，而不是繼承的 child-process env。WebSocket app-server connections 不會收到 Gateway env API-key fallback；請使用明確的 auth profile 或遠端 app-server 自己的帳戶。

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

`appServer.clearEnv` 只會影響衍生出的 Codex app-server 子程序。

Codex 動態工具預設使用 `native-first` 設定檔。在該模式中，
OpenClaw 不會公開與 Codex 原生工作區作業重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和
`update_plan`。OpenClaw 整合工具，例如訊息傳遞、工作階段、媒體、
Cron、瀏覽器、節點、Gateway、`heartbeat_respond` 和 `web_search` 仍會
可用。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設值           | 含義                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 可向 Codex app-server 公開完整的 OpenClaw 動態工具集。           |
| `codexDynamicToolsExclude` | `[]`             | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                            |

支援的 `appServer` 欄位：

| 欄位                | 預設值                                   | 含義                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 會衍生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                             |
| `command`           | 受管理的 Codex 二進位檔                  | stdio 傳輸使用的可執行檔。保留未設定會使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸使用的引數。                                                                                                                                                                                                             |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                         |
| `authToken`         | 未設定                                   | WebSocket 傳輸使用的 Bearer 權杖。                                                                                                                                                                                                 |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | 在 OpenClaw 建立繼承環境之後，從衍生出的 stdio app-server 程序移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給 OpenClaw 在本機啟動時為每個代理程式提供的 Codex 隔離。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                    |
| `mode`              | `"yolo"`                                 | YOLO 或由守護者審查執行的預設組態。                                                                                                                                                                                               |
| `approvalPolicy`    | `"never"`                                | 傳送到執行緒開始/恢復/回合的原生 Codex 核准政策。                                                                                                                                                                                 |
| `sandbox`           | `"danger-full-access"`                   | 傳送到執行緒開始/恢復的原生 Codex 沙盒模式。                                                                                                                                                                                      |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審查原生核准提示。`guardian_subagent` 仍是舊版別名。                                                                                                                                                 |
| `serviceTier`       | 未設定                                   | 可選的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                                             |

OpenClaw 所擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 設定界限：每個 Codex `item/tool/call` 請求都必須在
30 秒內收到 OpenClaw 回應。逾時時，OpenClaw 會在支援的情況下中止工具
訊號，並向 Codex 傳回失敗的動態工具回應，讓該回合可以繼續，而不是讓工作階段停留在
`processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 請求之後，測試工具也會期待
Codex 以 `turn/completed` 完成原生回合。如果 app-server 在該回應後
60 秒內沒有動靜，OpenClaw 會盡力中斷 Codex 回合、記錄診斷逾時，並釋放
OpenClaw 工作階段通道，避免後續聊天訊息排在過期的原生回合之後。

本機測試仍可使用環境覆寫：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本機測試中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於可重複部署，建議使用設定檔，因為這會讓 Plugin 行為與其餘 Codex 測試工具設定保存在同一個已審查檔案中。

## 電腦使用

電腦使用有自己的設定指南：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會內建桌面控制應用程式，也不會自行執行桌面動作。它會準備 Codex app-server、驗證
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間處理原生
MCP 工具呼叫。

若要在 Codex marketplace 流程之外直接存取 TryCua 驅動程式，請使用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊
`cua-driver mcp`。
請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 Codex 所擁有的電腦使用與直接 MCP 註冊之間的差異。

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

電腦使用是 macOS 專用功能，可能需要本機作業系統權限，Codex MCP 伺服器才能控制應用程式。如果 `computerUse.enabled` 為 true 且 MCP
伺服器不可用，Codex 模式回合會在線程開始前失敗，而不是在沒有原生電腦使用工具的情況下靜默執行。請參閱
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 marketplace 選項、
遠端目錄限制、狀態原因和疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex 尚未發現本機 marketplace，
OpenClaw 可以從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
註冊標準內建 Codex Desktop marketplace。變更執行階段或電腦使用設定後，請使用
`/new` 或 `/reset`，避免既有工作階段保留舊的 PI 或 Codex 執行緒繫結。

## 常見範例

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

僅 Codex 測試工具驗證：

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

由守護者審查的 Codex 核准：

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

模型切換仍由 OpenClaw 控制。當 OpenClaw 工作階段附加到既有 Codex 執行緒時，下一個回合會再次將目前選取的
OpenAI 模型、供應商、核准政策、沙盒和服務層級傳送到
app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex 繼續使用新選取的模型。

## Codex 命令

內建 Plugin 會將 `/codex` 註冊為已授權的斜線命令。它是通用的，適用於任何支援 OpenClaw 文字命令的頻道。

常見形式：

- `/codex status` 顯示即時應用伺服器連線、模型、帳戶、速率限制、MCP 伺服器，以及 Skills。
- `/codex models` 列出即時 Codex 應用伺服器模型。
- `/codex threads [filter]` 列出最近的 Codex 執行緒。
- `/codex resume <thread-id>` 將目前的 OpenClaw 工作階段附加到既有 Codex 執行緒。
- `/codex compact` 要求 Codex 應用伺服器壓縮已附加的執行緒。
- `/codex review` 對已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 在傳送已附加執行緒的 Codex 診斷回饋前先詢問。
- `/codex computer-use status` 檢查已設定的 Computer Use Plugin 和 MCP 伺服器。
- `/codex computer-use install` 安裝已設定的 Computer Use Plugin 並重新載入 MCP 伺服器。
- `/codex account` 顯示帳戶與速率限制狀態。
- `/codex mcp` 列出 Codex 應用伺服器 MCP 伺服器狀態。
- `/codex skills` 列出 Codex 應用伺服器 Skills。

### 常見除錯工作流程

當 Codex 支援的代理程式在 Telegram、Discord、Slack，
或其他通道中做出意外行為時，請從發生問題的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload` 或另一則描述你所見情況的簡短備註。
2. 核准診斷要求一次。核准會建立本機 Gateway
   診斷 zip，且因為該工作階段正在使用 Codex harness，也會
   將相關 Codex 回饋套件傳送到 OpenAI 伺服器。
3. 將完成的診斷回覆複製到錯誤報告或支援討論串中。
   它包含本機套件路徑、隱私摘要、OpenClaw 工作階段 ID、
   Codex 執行緒 ID，以及每個 Codex 執行緒的一行 `Inspect locally`。
4. 如果你想自行除錯該次執行，請在終端機中執行列印出的 `Inspect locally`
   命令。它看起來像 `codex resume <thread-id>`，並會開啟
   原生 Codex 執行緒，讓你檢查對話、在本機繼續，
   或詢問 Codex 為何選擇特定工具或計畫。

只有在你特別想為目前已附加的執行緒上傳 Codex
回饋，而不需要完整 OpenClaw
Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。對多數支援報告而言，`/diagnostics [note]`
是更好的起點，因為它會在單一回覆中把本機 Gateway 狀態和 Codex
執行緒 ID 串在一起。完整隱私模型與群組聊天行為請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。

核心 OpenClaw 也公開僅限擁有者使用的 `/diagnostics [note]`，作為一般
Gateway 診斷命令。它的核准提示會顯示敏感資料
前言、連結到 [診斷匯出](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec 核准
要求執行 `openclaw gateway diagnostics export --json`。不要使用允許所有項目的規則核准診斷。核准後，
OpenClaw 會傳送一份可貼上的報告，其中包含本機套件路徑與資訊清單
摘要。當作用中的 OpenClaw 工作階段使用 Codex harness 時，該
同一核准也會授權將相關 Codex 回饋套件傳送到
OpenAI 伺服器。核准提示會說明將會傳送 Codex 回饋，但
在核准前不會列出 Codex 工作階段或執行緒 ID。

如果 `/diagnostics` 由擁有者在群組聊天中叫用，OpenClaw 會保持
共用通道乾淨：群組只會收到一則簡短通知，而
診斷前言、核准提示，以及 Codex 工作階段/執行緒 ID 會透過
私人核准路由傳送給擁有者。如果沒有私人擁有者路由，
OpenClaw 會拒絕群組要求，並要求擁有者從 DM 執行。

已核准的 Codex 上傳會呼叫 Codex 應用伺服器 `feedback/upload`，並要求
應用伺服器在可用時包含每個列出執行緒和衍生 Codex 子執行緒的日誌。
上傳會透過 Codex 的一般回饋路徑送到 OpenAI
伺服器；如果該應用伺服器停用了 Codex 回饋，命令會回傳
應用伺服器錯誤。完成的診斷回覆會列出通道、
OpenClaw 工作階段 ID、Codex 執行緒 ID，以及已傳送執行緒的本機 `codex resume <thread-id>`
命令。如果你拒絕或忽略核准，
OpenClaw 不會列印那些 Codex ID。這次上傳不會取代本機
Gateway 診斷匯出。

`/codex resume` 會寫入與 harness 正常輪次所使用相同的 sidecar 繫結檔案。
在下一則訊息時，OpenClaw 會恢復該 Codex 執行緒，將
目前選取的 OpenClaw 模型傳入應用伺服器，並保持延伸歷史記錄
啟用。

### 從 CLI 檢查 Codex 執行緒

理解不佳 Codex 執行狀況最快的方式，通常是直接開啟原生 Codex
執行緒：

```sh
codex resume <thread-id>
```

當你在通道對話中注意到錯誤，並想檢查
有問題的 Codex 工作階段、在本機繼續它，或詢問 Codex 為何做出
特定工具或推理選擇時，請使用此方式。最簡單的路徑通常是先執行
`/diagnostics [note]`：核准後，完成的報告會列出
每個 Codex 執行緒並列印 `Inspect locally` 命令，例如
`codex resume <thread-id>`。你可以直接將該命令複製到終端機。

你也可以從目前聊天的 `/codex binding`，或最近 Codex 應用伺服器執行緒的
`/codex threads [filter]` 取得執行緒 ID，然後在 shell 中執行相同的
`codex resume` 命令。

此命令介面需要 Codex 應用伺服器 `0.125.0` 或更新版本。如果未來或自訂
應用伺服器未公開該 JSON-RPC 方法，個別
控制方法會回報為 `unsupported by this Codex app-server`。

## 掛鉤邊界

Codex harness 有三個掛鉤層：

| 層                                    | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin 掛鉤                  | OpenClaw                 | 跨 PI 與 Codex harness 的產品/Plugin 相容性。                       |
| Codex 應用伺服器擴充中介軟體         | OpenClaw 內建 Plugin     | 圍繞 OpenClaw 動態工具的每輪次配接器行為。                          |
| Codex 原生掛鉤                        | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。                |

OpenClaw 不使用專案或全域 Codex `hooks.json` 檔案來路由
OpenClaw Plugin 行為。對於支援的原生工具與權限橋接，
OpenClaw 會為 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop` 注入每個執行緒的 Codex 設定。其他 Codex 掛鉤，例如 `SessionStart` 和
`UserPromptSubmit`，仍然是 Codex 層級的控制；它們不會在 v1 合約中公開為
OpenClaw Plugin 掛鉤。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求
呼叫後執行該工具，因此 OpenClaw 會在
harness 配接器中觸發它擁有的 Plugin 與中介軟體行為。對於 Codex 原生工具，Codex 擁有標準工具記錄。
OpenClaw 可以鏡射選定事件，但除非 Codex 透過應用伺服器或原生掛鉤
回呼公開該操作，否則無法重寫原生 Codex
執行緒。

Compaction 與 LLM 生命週期投射來自 Codex 應用伺服器
通知和 OpenClaw 配接器狀態，而不是原生 Codex 掛鉤命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是配接器層級的觀察，不是 Codex 內部要求或 Compaction payload 的逐位元組擷取。

Codex 原生 `hook/started` 和 `hook/completed` 應用伺服器通知會被
投射為 `codex_app_server.hook` 代理程式事件，用於軌跡與除錯。
它們不會叫用 OpenClaw Plugin 掛鉤。

## V1 支援合約

Codex 模式不是在底層使用不同模型呼叫的 PI。Codex 擁有更多
原生模型迴圈，而 OpenClaw 會圍繞該邊界配接其 Plugin 與工作階段介面。

Codex runtime v1 支援：

| 介面                                          | 支援                                    | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈                 | 支援                                    | Codex 應用伺服器擁有 OpenAI 輪次、原生執行緒恢復，以及原生工具延續。                                                                                                                                 |
| OpenClaw 通道路由與傳遞                       | 支援                                    | Telegram、Discord、Slack、WhatsApp、iMessage，以及其他通道都留在模型 runtime 之外。                                                                                                                   |
| OpenClaw 動態工具                             | 支援                                    | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 保留在執行路徑中。                                                                                                                                    |
| 提示詞與上下文 Plugin                         | 支援                                    | OpenClaw 會在啟動或恢復執行緒前建立提示詞覆蓋層，並將上下文投射到 Codex 輪次中。                                                                                                                     |
| 上下文引擎生命週期                            | 支援                                    | 組裝、擷取或輪次後維護，以及上下文引擎 Compaction 協調會為 Codex 輪次執行。                                                                                                                          |
| 動態工具掛鉤                                  | 支援                                    | `before_tool_call`、`after_tool_call` 和工具結果中介軟體會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                          |
| 生命週期掛鉤                                  | 作為配接器觀察支援                      | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以誠實的 Codex 模式 payload 觸發。                                                                                 |
| 最終答案修訂閘門                              | 透過原生掛鉤轉送支援                    | Codex `Stop` 會被轉送到 `before_agent_finalize`；`revise` 會要求 Codex 在最終化前再進行一次模型傳遞。                                                                                                |
| 原生 shell、patch 和 MCP 封鎖或觀察           | 透過原生掛鉤轉送支援                    | Codex `PreToolUse` 和 `PostToolUse` 會針對已提交的原生工具介面轉送，包括 Codex 應用伺服器 `0.125.0` 或更新版本上的 MCP payload。支援封鎖；不支援引數重寫。                                          |
| 原生權限政策                                  | 透過原生掛鉤轉送支援                    | 在 runtime 公開時，Codex `PermissionRequest` 可透過 OpenClaw 政策路由。如果 OpenClaw 未回傳決策，Codex 會透過其一般 guardian 或使用者核准路徑繼續。                                                  |
| 應用伺服器軌跡擷取                            | 支援                                    | OpenClaw 會記錄它傳送給應用伺服器的要求，以及它收到的應用伺服器通知。                                                                                                                                |

Codex runtime v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                     | 未來路徑                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具參數變更                       | Codex 原生前置工具 hooks 可以封鎖，但 OpenClaw 不會改寫 Codex 原生工具參數。                                               | 需要 Codex hook/schema 支援替換工具輸入。                            |
| 可編輯的 Codex 原生對話紀錄歷史            | Codex 擁有標準原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來脈絡，但不應變更未支援的內部結構。 | 如果需要原生執行緒手術，新增明確的 Codex app-server API。                    |
| Codex 原生工具記錄的 `tool_result_persist` | 該 hook 轉換 OpenClaw 擁有的對話紀錄寫入，而不是 Codex 原生工具記錄。                                                           | 可以鏡像轉換後的記錄，但標準改寫需要 Codex 支援。              |
| 豐富的原生 Compaction 中繼資料                     | OpenClaw 觀察 Compaction 開始與完成，但不會收到穩定的保留/捨棄清單、token 差異或摘要 payload。            | 需要更豐富的 Codex Compaction 事件。                                                     |
| Compaction 介入                             | 目前在 Codex 模式中，OpenClaw Compaction hooks 屬於通知層級。                                                                         | 如果 plugins 需要否決或改寫原生 Compaction，新增 Codex 前置/後置 Compaction hooks。 |
| 逐位元組模型 API 請求擷取             | OpenClaw 可以擷取 app-server 請求與通知，但 Codex 核心會在內部建立最終的 OpenAI API 請求。                      | 需要 Codex 模型請求追蹤事件或除錯 API。                                   |

## 工具、媒體與 Compaction

Codex harness 只會變更低階嵌入式 agent 執行器。

OpenClaw 仍會建立工具清單，並從 harness 接收動態工具結果。文字、圖片、影片、音樂、TTS、核准，以及訊息工具輸出會繼續走一般 OpenClaw 傳遞路徑。

原生 hook relay 有意保持通用，但 v1 支援合約僅限於 OpenClaw 測試過的 Codex 原生工具與權限路徑。在 Codex runtime 中，這包含 shell、patch，以及 MCP `PreToolUse`、`PostToolUse` 和 `PermissionRequest` payloads。在 runtime 合約明確命名之前，不要假設每個未來 Codex hook 事件都是 OpenClaw plugin 介面。

對於 `PermissionRequest`，OpenClaw 只有在 policy 做出決定時才會回傳明確允許或拒絕。沒有決定的結果並不是允許。Codex 會將其視為沒有 hook 決定，並落入自己的 guardian 或使用者核准路徑。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准請求會透過 OpenClaw 的 plugin 核准流程路由。Codex `request_user_input` 提示會被送回原始聊天，而下一個排入佇列的後續訊息會回答該原生伺服器請求，而不是被導向為額外脈絡。其他 MCP elicitation 請求仍會失敗關閉。

作用中執行佇列導向會對應到 Codex app-server `turn/steer`。使用預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的安靜視窗內批次處理排入佇列的聊天訊息，並依抵達順序將它們作為一個 `turn/steer` 請求送出。舊版 `queue` 模式會送出個別的 `turn/steer` 請求。Codex review 與手動 Compaction turn 可以拒絕同一 turn 的導向；在這種情況下，當選取的模式允許 fallback 時，OpenClaw 會使用後續佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當選取的模型使用 Codex harness 時，原生執行緒 Compaction 會委派給 Codex app-server。OpenClaw 會保留對話紀錄鏡像，用於頻道歷史、搜尋、`/new`、`/reset`，以及未來模型或 harness 切換。當 app-server 發出時，鏡像會包含使用者提示、最終 assistant 文字，以及輕量的 Codex 推理或計畫記錄。目前，OpenClaw 只會記錄原生 Compaction 開始與完成訊號。它尚未公開人類可讀的 Compaction 摘要，或可稽核的清單來列出 Codex 在 Compaction 後保留了哪些項目。

由於 Codex 擁有標準原生執行緒，`tool_result_persist` 目前不會改寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入 OpenClaw 擁有的 session 對話紀錄工具結果時套用。

媒體產生不需要 PI。圖片、影片、音樂、PDF、TTS 與媒體理解會繼續使用相符的 provider/model 設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 疑難排解

**Codex 不會以一般 `/model` provider 顯示：** 對新設定來說這是預期行為。選取帶有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` 參照）、啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 當沒有 Codex harness 宣告該次執行時，`agentRuntime.id: "auto"` 仍可使用 PI 作為相容性後端。測試時請設定 `agentRuntime.id: "codex"` 以強制選取 Codex。強制 Codex runtime 會失敗，而不是 fallback 到 PI。一旦選取 Codex app-server，其失敗會直接浮現。

**app-server 被拒絕：** 升級 Codex，讓 app-server handshake 回報版本 `0.125.0` 或更新版本。相同版本的 prerelease 或帶有 build suffix 的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，會被拒絕，因為 OpenClaw 測試的是穩定版 `0.125.0` protocol floor。

**模型探索速度緩慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket 傳輸立即失敗：** 檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server protocol 版本。

**非 Codex 模型使用 PI：** 這是預期行為，除非你為該 agent 強制設定了 `agentRuntime.id: "codex"`，或選取了舊版 `codex/*` 參照。在 `auto` 模式中，純 `openai/gpt-*` 和其他 provider 參照會留在其一般 provider 路徑。如果強制設定 `agentRuntime.id: "codex"`，該 agent 的每個嵌入式 turn 都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具未執行：** 從新的 session 檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果仍持續發生，請重新啟動 gateway 以清除過時的原生 hook 註冊。如果 `computer-use.list_apps` 逾時，請重新啟動 Codex Computer Use 或 Codex Desktop 後重試。

## 相關內容

- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [Agent runtimes](/zh-TW/concepts/agent-runtimes)
- [Model providers](/zh-TW/concepts/model-providers)
- [OpenAI provider](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin hooks](/zh-TW/plugins/hooks)
- [設定參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
