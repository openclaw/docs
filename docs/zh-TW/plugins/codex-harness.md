---
read_when:
    - 你想使用隨附的 Codex app-server 工具框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅限 Codex 的部署失敗，而不是回退到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-02T23:39:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 讓 OpenClaw 透過 Codex app-server 執行內嵌代理回合，而不是使用內建的 PI harness。

當你希望 Codex 擁有低階代理工作階段時，請使用此設定：模型探索、原生執行緒恢復、原生 Compaction，以及 app-server 執行。OpenClaw 仍然擁有聊天通道、工作階段檔案、模型選擇、工具、核准、媒體傳遞，以及可見的逐字記錄鏡像。

當來源聊天回合透過 Codex harness 執行時，如果部署尚未明確設定 `messages.visibleReplies`，可見回覆預設會使用 OpenClaw `message` 工具。代理仍可私下完成其 Codex 回合；只有在呼叫 `message(action="send")` 時才會張貼到通道。設定 `messages.visibleReplies: "automatic"` 可讓直接聊天的最終回覆維持在舊版自動傳遞路徑上。

Codex Heartbeat 回合也預設會取得 `heartbeat_respond` 工具，因此代理可以記錄這次喚醒應該保持安靜或發出通知，而不需要把該控制流程編碼在最終文字中。

如果你正在嘗試建立方向感，請從
[代理執行階段](/zh-TW/concepts/agent-runtimes)開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、
Discord、Slack 或其他通道仍是通訊介面。

## 快速設定

多數想要「在 OpenClaw 中使用 Codex」的使用者想要的是這條路徑：使用 ChatGPT/Codex 訂閱登入，然後透過原生 Codex app-server 執行階段執行內嵌代理回合。模型參照仍維持標準的 `openai/gpt-*`；訂閱驗證來自 Codex 帳號/設定檔，而不是來自 `openai-codex/*` 模型前綴。

如果你尚未登入，請先使用 Codex OAuth 登入：

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

當你指的是原生 Codex 執行階段時，不要使用 `openai-codex/gpt-*`。該前綴是明確的「透過 PI 使用 Codex OAuth」路徑。設定變更會套用到新的或重設後的工作階段；現有工作階段會保留其已記錄的執行階段。

## 此 Plugin 會變更什麼

隨附的 `codex` Plugin 提供多個獨立能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生內嵌執行階段                  | `agentRuntime.id: "codex"`                          | 透過 Codex app-server 執行 OpenClaw 內嵌代理回合。                            |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話綁定並控制 Codex app-server 執行緒。                                |
| Codex app-server provider/catalog | `codex` 內部機制，透過 harness 呈現                 | 讓執行階段探索並驗證 app-server 模型。                                        |
| Codex 媒體理解路徑                | `codex/*` 影像模型相容性路徑                        | 針對支援的影像理解模型執行有界的 Codex app-server 回合。                     |
| 原生 hook 轉送                    | Codex 原生事件周圍的 Plugin hook                    | 讓 OpenClaw 觀察/封鎖支援的 Codex 原生工具/完成事件。                        |

啟用 Plugin 會讓這些能力可用。它**不會**：

- 對每個 OpenAI 模型開始使用 Codex
- 將 `openai-codex/*` 模型參照轉換為原生執行階段
- 讓 ACP/acpx 成為預設 Codex 路徑
- 熱切換已經記錄 PI 執行階段的現有工作階段
- 取代 OpenClaw 通道傳遞、工作階段檔案、驗證設定檔儲存，或訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制命令介面。如果 Plugin 已啟用，且使用者要求從聊天中綁定、恢復、導向、停止或檢查 Codex 執行緒，代理應優先使用 `/codex ...` 而不是 ACP。當使用者要求 ACP/acpx 或正在測試 ACP Codex adapter 時，ACP 仍是明確的備援。

原生 Codex 回合保留 OpenClaw Plugin hook 作為公開相容層。這些是處理程序內的 OpenClaw hook，不是 Codex `hooks.json` 命令 hook：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用於鏡像逐字記錄
- 透過 Codex `Stop` relay 的 `before_agent_finalize`
- `agent_end`

Plugins 也可以註冊執行階段中立的工具結果中介軟體，在 OpenClaw 執行工具之後、結果回傳給 Codex 之前，重寫 OpenClaw 動態工具結果。這與公開的 `tool_result_persist` Plugin hook 分開；後者會轉換 OpenClaw 擁有的逐字記錄工具結果寫入。

如需了解 Plugin hook 語意本身，請參閱 [Plugin hook](/zh-TW/plugins/hooks)
和 [Plugin guard 行為](/zh-TW/tools/plugin)。

harness 預設為關閉。新設定應將 OpenAI 模型參照保持為標準的 `openai/gpt-*`，並在需要原生 app-server 執行時明確強制
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版 `codex/*` 模型參照仍會為了相容性自動選取 harness，但由執行階段支援的舊版 provider 前綴不會顯示為一般模型/provider 選項。

如果 `codex` Plugin 已啟用，但主要模型仍是
`openai-codex/*`，`openclaw doctor` 會提出警告，而不是變更路徑。這是刻意的：`openai-codex/*` 仍然是 PI Codex OAuth/訂閱路徑，而原生 app-server 執行仍是明確的執行階段選擇。

## 路徑對照

變更設定前請使用此表：

| 期望行為                                             | 模型參照                   | 執行階段設定                           | 驗證/設定檔路徑             | 預期狀態標籤                 |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱         | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth 或 Codex 帳號    | `Runtime: OpenAI Codex`        |
| 透過一般 OpenClaw runner 使用 OpenAI API             | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| 透過 PI 使用 ChatGPT/Codex 訂閱                      | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth provider  | `Runtime: OpenClaw Pi Default` |
| 使用保守自動模式的混合 providers                     | provider 特定參照          | `agentRuntime.id: "auto"`              | 依所選 provider              | 取決於所選執行階段            |
| 明確的 Codex ACP adapter 工作階段                    | 取決於 ACP prompt/model    | `sessions_spawn` 搭配 `runtime: "acp"` | ACP 後端驗證                 | ACP task/session 狀態          |

重要的區分是 provider 與執行階段：

- `openai-codex/*` 回答「PI 應該使用哪個 provider/驗證路徑？」
- `agentRuntime.id: "codex"` 回答「哪個迴圈應該執行這個內嵌回合？」
- `/codex ...` 回答「這個聊天應該綁定或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應該啟動哪個外部 harness 程序？」

## 選擇正確的模型前綴

OpenAI 系列路徑會依前綴區分。對常見的訂閱加上原生 Codex 執行階段設定，請使用 `openai/*` 搭配 `agentRuntime.id: "codex"`。
只有在你刻意想透過 PI 使用 Codex OAuth 時，才使用 `openai-codex/*`：

| 模型參照                                      | 執行階段路徑                              | 使用時機                                                                  |
| --------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 透過 OpenClaw/PI 管線使用 OpenAI provider | 你想使用目前的直接 OpenAI Platform API 存取，並搭配 `OPENAI_API_KEY`。   |
| `openai-codex/gpt-5.5`                        | 透過 OpenClaw/PI 使用 OpenAI Codex OAuth  | 你想使用 ChatGPT/Codex 訂閱驗證，並搭配預設 PI runner。                  |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                  | 你想使用 ChatGPT/Codex 訂閱驗證，並搭配原生 Codex 執行。                 |

當你的帳號公開這些路徑時，GPT-5.5 可同時出現在直接 OpenAI API key 與 Codex 訂閱路徑上。原生 Codex 執行階段請使用 `openai/gpt-5.5` 搭配 Codex app-server harness；PI OAuth 請使用 `openai-codex/gpt-5.5`；直接 API key 流量請使用未覆寫 Codex 執行階段的 `openai/gpt-5.5`。

舊版 `codex/gpt-*` 參照仍會作為相容別名接受。Doctor 相容性 migration 會將舊版主要執行階段參照重寫為標準模型參照，並另外記錄執行階段政策；而僅作為備援的舊版參照會保持不變，因為執行階段是針對整個代理容器設定。新的 PI Codex OAuth 設定應使用 `openai-codex/gpt-*`；新的原生 app-server harness 設定應使用 `openai/gpt-*` 加上
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循同樣的前綴區分。當影像理解應透過 OpenAI Codex OAuth provider 路徑執行時，請使用
`openai-codex/gpt-*`。當影像理解應透過有界的 Codex app-server 回合執行時，請使用 `codex/gpt-*`。Codex app-server 模型必須宣告支援影像輸入；純文字 Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效 harness。如果選擇結果出乎意料，請為 `agents/harness` 子系統啟用偵錯記錄，並檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含所選 harness id、選擇原因、執行階段/備援政策，以及在 `auto` 模式下每個 Plugin 候選者的支援結果。

### Doctor 警告的含義

當以下條件全部為真時，`openclaw doctor` 會提出警告：

- 隨附的 `codex` Plugin 已啟用或允許
- 某個代理的主要模型是 `openai-codex/*`
- 該代理的有效執行階段不是 `codex`

這個警告存在，是因為使用者常預期「Codex Plugin 已啟用」就表示「原生 Codex app-server 執行階段」。OpenClaw 不會做這個跳躍。該警告表示：

- 如果你原本就打算透過 PI 使用 ChatGPT/Codex OAuth，則**不需要變更**。
- 如果你原本想要原生 app-server 執行，請將模型改為 `openai/<model>`，並設定
  `agentRuntime.id: "codex"`。
- 執行階段變更後，現有工作階段仍需要 `/new` 或 `/reset`，因為工作階段執行階段 pin 是黏著的。

harness 選擇不是即時工作階段控制。當內嵌回合執行時，OpenClaw 會在該工作階段記錄所選 harness id，並在同一個工作階段 id 的後續回合持續使用它。當你希望未來工作階段使用另一個 harness 時，請變更 `agentRuntime` 設定或
`OPENCLAW_AGENT_RUNTIME`；在現有對話於 PI 與 Codex 之間切換前，請使用 `/new` 或 `/reset` 開始新的工作階段。這可避免將同一份逐字記錄透過兩個不相容的原生工作階段系統重播。

在 harness pin 出現前建立的舊版工作階段，一旦有逐字記錄歷史，就會被視為 PI-pinned。變更設定後，請使用 `/new` 或 `/reset` 讓該對話改用 Codex。

`/status` 會顯示有效的模型 runtime。預設 PI harness 會顯示為
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 會顯示為
`Runtime: OpenAI Codex`。

## 需求

- OpenClaw，且可使用內建的 `codex` Plugin。
- Codex app-server `0.125.0` 或更新版本。內建 Plugin 預設會管理相容的
  Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 指令不會
  影響一般 harness 啟動。
- app-server 程序或 OpenClaw 的 Codex 驗證橋接可使用 Codex 驗證。
  本機 app-server 啟動會為每個代理使用由 OpenClaw 管理的 Codex home，
  以及隔離的子 `HOME`，因此預設不會讀取你的個人
  `~/.codex` 帳戶、Skills、Plugin、設定、thread 狀態，或原生
  `$HOME/.agents/skills`。

Plugin 會封鎖較舊或未版本化的 app-server handshake。這能讓 OpenClaw
維持在已測試過的 protocol surface 上。

對於 live 和 Docker smoke test，驗證通常來自 Codex CLI 帳戶
或 OpenClaw `openai-codex` 驗證設定檔。本機 stdio app-server 啟動在沒有
帳戶時，也可以退回使用 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作區 bootstrap 檔案

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。OpenClaw
不會寫入合成的 Codex 專案文件，也不依賴 Codex fallback 檔名作為 persona
檔案，因為 Codex fallback 只會在缺少 `AGENTS.md` 時套用。

為了 OpenClaw 工作區一致性，Codex harness 會解析其他 bootstrap
檔案（`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md`，以及存在時的 `MEMORY.md`），並在 `thread/start`
和 `thread/resume` 透過 Codex 設定 instructions 轉送。這能讓
`SOUL.md` 及相關工作區 persona/profile context 可見，而不需要複製
`AGENTS.md`。

## 將 Codex 與其他模型並用

如果同一個代理應該能在 Codex 與非 Codex provider 模型之間自由切換，
請不要全域設定 `agentRuntime.id: "codex"`。強制 runtime 會套用到該代理
或 session 的每個 embedded turn。如果你在強制該 runtime 時選擇
Anthropic 模型，OpenClaw 仍會嘗試 Codex harness，並以失敗關閉，
而不是靜默地透過 PI 路由該 turn。

請改用下列任一形式：

- 將 Codex 放在使用 `agentRuntime.id: "codex"` 的專用代理上。
- 讓預設代理維持 `agentRuntime.id: "auto"`，並使用 PI fallback 處理一般混合
  provider 使用情境。
- 舊版 `codex/*` refs 僅用於相容性。新設定應偏好使用
  `openai/*` 加上明確的 Codex runtime policy。

例如，這會讓預設代理維持一般自動選擇，並新增一個獨立的 Codex 代理：

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

使用這種形式時：

- 預設 `main` 代理會使用一般 provider path 和 PI 相容性 fallback。
- `codex` 代理會使用 Codex app-server harness。
- 如果 `codex` 代理缺少 Codex 或不支援 Codex，該 turn 會失敗，
  而不是悄悄使用 PI。

## 代理指令路由

代理應依意圖路由使用者請求，而不是只依「Codex」這個詞：

| 使用者要求...                                         | 代理應使用...                                     |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「將此聊天綁定到 Codex」                              | `/codex bind`                                    |
| 「在這裡恢復 Codex thread `<id>`」                     | `/codex resume <id>`                             |
| 「顯示 Codex threads」                                | `/codex threads`                                 |
| 「為一次不良的 Codex 執行提交支援報告」               | `/diagnostics [note]`                            |
| 「只為這個附加的 thread 傳送 Codex feedback」          | `/codex diagnostics [note]`                      |
| 「使用我的 ChatGPT/Codex 訂閱搭配 Codex runtime」      | `openai/*` 加上 `agentRuntime.id: "codex"`       |
| 「透過 PI 使用我的 ChatGPT/Codex 訂閱」                | `openai-codex/*` model refs                      |
| 「透過 ACP/acpx 執行 Codex」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」 | ACP/acpx，而不是 `/codex`，也不是原生子代理 |

OpenClaw 只有在 ACP 已啟用、可 dispatch，且由已載入的 runtime backend 支援時，
才會向代理宣告 ACP spawn guidance。如果 ACP 不可用，system prompt 和 Plugin
Skills 不應教導代理 ACP 路由。

## 僅 Codex 的部署

當你需要證明每個 embedded agent turn 都使用 Codex 時，請強制使用 Codex
harness。明確的 Plugin runtime 預設沒有 PI fallback，因此
`fallback: "none"` 是選用項，但通常很適合作為文件說明：

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

強制使用 Codex 時，如果 Codex Plugin 已停用、app-server 太舊，
或 app-server 無法啟動，OpenClaw 會提早失敗。只有在你刻意想讓 PI
處理缺少 harness selection 的情況時，才設定
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 每代理 Codex

你可以讓一個代理僅使用 Codex，同時讓預設代理維持一般自動選擇：

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

使用一般 session 指令來切換代理和模型。`/new` 會建立新的 OpenClaw
session，而 Codex harness 會視需要建立或恢復其 sidecar app-server
thread。`/reset` 會清除該 thread 的 OpenClaw session 綁定，並讓下一個
turn 再次從目前設定解析 harness。

## 模型探索

預設情況下，Codex Plugin 會向 app-server 詢問可用模型。如果探索失敗
或逾時，它會使用下列內建 fallback catalog：

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

當你希望啟動時避免 probing Codex 並固定使用 fallback catalog 時，
請停用探索：

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

預設情況下，Plugin 會用以下方式在本機啟動 OpenClaw 管理的 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

受管理的二進位檔會隨 `codex` Plugin package 一起提供。這會讓 app-server
版本綁定到內建 Plugin，而不是本機剛好安裝的任何獨立 Codex CLI。
只有在你刻意想執行不同 executable 時，才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO mode 啟動本機 Codex harness sessions：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這是用於自主 Heartbeat 的受信任本機
operator posture：Codex 可以使用 shell 和 network tools，而不會因為
沒有人在場回應的原生 approval prompts 而停下。

若要 opt in Codex guardian-reviewed approvals，請設定 `appServer.mode:
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

Guardian mode 會使用 Codex 的原生 auto-review approval path。當 Codex
要求離開 sandbox、寫入工作區外部，或新增 network access 等權限時，
Codex 會將該 approval request 路由到原生 reviewer，而不是人類 prompt。
reviewer 會套用 Codex 的 risk framework，並核准或拒絕該特定 request。
當你想要比 YOLO mode 更多 guardrails，但仍需要無人值守的代理持續前進時，
請使用 Guardian。

`guardian` preset 會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
個別 policy 欄位仍會覆寫 `mode`，因此進階部署可以將 preset
與明確選擇混用。較舊的 `guardian_subagent` reviewer value
仍會作為相容性 alias 被接受，但新設定應使用 `auto_review`。

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

Stdio app-server 啟動預設會繼承 OpenClaw 的程序環境，
但 OpenClaw 擁有 Codex app-server 帳戶橋接，並會將
`CODEX_HOME` 和 `HOME` 都設定為該代理 OpenClaw 狀態下的每代理目錄。
Codex 自己的 skill loader 會讀取 `$CODEX_HOME/skills` 和
`$HOME/.agents/skills`，因此本機 app-server 啟動時這兩個值都會被隔離。
這能讓 Codex 原生 Skills、Plugin、設定、帳戶和 thread 狀態限定在
OpenClaw 代理範圍內，而不會從 operator 的個人 Codex CLI home 洩入。

OpenClaw Plugin 和 OpenClaw skill snapshots 仍會透過 OpenClaw 自己的
Plugin registry 和 skill loader 流動。個人 Codex CLI assets 不會。
如果你有實用的 Codex CLI Skills 或 Plugin 應成為 OpenClaw 代理的一部分，
請明確 inventory 它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider 會將 Skills 複製到目前的 OpenClaw 代理工作區。
Codex 原生 Plugin、hooks 和設定檔會被回報或封存以供手動 review，
而不是自動啟用，因為它們可以執行指令、公開 MCP servers，或攜帶憑證。

驗證會依下列順序選擇：

1. 該代理的明確 OpenClaw Codex 驗證設定檔。
2. 該代理 Codex home 中 app-server 的既有帳戶。
3. 僅限本機 stdio app-server 啟動，當沒有 app-server 帳戶且仍需要
   OpenAI 驗證時，依序使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT subscription-style Codex 驗證設定檔時，
它會從生成的 Codex 子程序移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。
這會讓 Gateway 層級 API keys 仍可用於 embeddings 或直接 OpenAI 模型，
同時避免原生 Codex app-server turns 意外透過 API 計費。
明確的 Codex API-key 設定檔和本機 stdio env-key fallback 會使用
app-server login，而不是繼承的子程序 env。WebSocket app-server 連線
不會收到 Gateway env API-key fallback；請使用明確的驗證設定檔或遠端
app-server 自己的帳戶。

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

`appServer.clearEnv` 只會影響衍生出的 Codex app-server 子程序。

Codex 動態工具預設使用 `native-first` 設定檔。在該模式下，
OpenClaw 不會公開與 Codex 原生工作區操作重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`，以及
`update_plan`。OpenClaw 整合工具，例如訊息、工作階段、媒體、
Cron、瀏覽器、Node、Gateway、`heartbeat_respond` 和 `web_search` 仍然
可用。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設值           | 含義                                                                                         |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 將完整的 OpenClaw 動態工具集公開給 Codex app-server。              |
| `codexDynamicToolsExclude` | `[]`             | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                              |

支援的 `appServer` 欄位：

| 欄位                | 預設值                                   | 含義                                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 會衍生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                |
| `command`           | 受管理的 Codex 二進位檔                 | stdio 傳輸使用的可執行檔。未設定時會使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                           |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸的引數。                                                                                                                                                                                                                    |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                            |
| `authToken`         | 未設定                                   | WebSocket 傳輸使用的 Bearer 權杖。                                                                                                                                                                                                    |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                               |
| `clearEnv`          | `[]`                                     | OpenClaw 建立其繼承環境後，從衍生出的 stdio app-server 程序中移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給 OpenClaw 在本機啟動時用於每個代理程式的 Codex 隔離。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 審查執行的預設值。                                                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                                | 傳送到啟動/恢復/回合的原生 Codex 核准政策。                                                                                                                                                                                          |
| `sandbox`           | `"danger-full-access"`                   | 傳送到啟動/恢復執行緒的原生 Codex 沙箱模式。                                                                                                                                                                                         |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審查原生核准提示。`guardian_subagent` 仍是舊版別名。                                                                                                                                                    |
| `serviceTier`       | 未設定                                   | 選用的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                                                |

OpenClaw 擁有的動態工具呼叫會獨立於 `appServer.requestTimeoutMs` 受到限制：
每個 Codex `item/tool/call` 請求都必須在 30 秒內收到 OpenClaw 回應。逾時時，
OpenClaw 會在支援時中止工具訊號，並向 Codex 傳回失敗的動態工具回應，讓該回合能繼續，而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 請求後，測試框架也會預期 Codex 以
`turn/completed` 完成原生回合。如果 app-server 在該回應後靜默 60 秒，OpenClaw 會盡力中斷
Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，讓後續聊天訊息不會排在過時的原生回合之後。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本機測試中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。可重現的部署建議使用設定，因為它會將 Plugin 行為保留在與其餘 Codex 測試框架設定相同且已審查的檔案中。

## 電腦使用

電腦使用在自己的設定指南中說明：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會內建桌面控制應用程式，也不會自行執行桌面動作。它會準備 Codex app-server、確認
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間處理原生 MCP 工具呼叫。

若要在 Codex marketplace 流程之外直接存取 TryCua 驅動程式，請使用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊
`cua-driver mcp`。請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 Codex 擁有的電腦使用與直接 MCP 註冊之間的差異。

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
        fallback: "none",
      },
    },
  },
}
```

可從命令介面檢查或安裝設定：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

電腦使用僅適用於 macOS，且可能需要本機作業系統權限，Codex MCP 伺服器才能控制應用程式。如果
`computerUse.enabled` 為 true 且 MCP 伺服器不可用，Codex 模式回合會在執行緒啟動前失敗，而不是在沒有原生電腦使用工具的情況下靜默執行。請參閱
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 marketplace 選項、遠端目錄限制、狀態原因與疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex 尚未探索到本機 marketplace，OpenClaw 可以從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊標準內建 Codex Desktop marketplace。變更執行階段或電腦使用設定後，請使用 `/new` 或 `/reset`，讓現有工作階段不會保留舊的 PI 或 Codex 執行緒繫結。

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

僅 Codex 測試框架驗證：

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

帶有明確標頭的遠端 app-server：

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

模型切換仍由 OpenClaw 控制。當 OpenClaw 工作階段附加到現有 Codex 執行緒時，下一個回合會再次將目前選取的
OpenAI 模型、提供者、核准政策、沙箱和服務層級傳送到 app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex 使用新選取的模型繼續。

## Codex 命令

內建 Plugin 會將 `/codex` 註冊為已授權的斜線命令。它是通用命令，並可在任何支援 OpenClaw 文字命令的頻道上運作。

常見形式：

- `/codex status` 顯示即時 app-server 連線能力、模型、帳戶、速率限制、MCP 伺服器與 skills。
- `/codex models` 列出即時 Codex app-server 模型。
- `/codex threads [filter]` 列出近期的 Codex threads。
- `/codex resume <thread-id>` 將目前的 OpenClaw 工作階段附加到既有的 Codex thread。
- `/codex compact` 要求 Codex app-server compact 已附加的 thread。
- `/codex review` 針對已附加的 thread 啟動 Codex 原生 review。
- `/codex diagnostics [note]` 在傳送已附加 thread 的 Codex diagnostics feedback 前先詢問。
- `/codex computer-use status` 檢查已設定的 Computer Use plugin 與 MCP 伺服器。
- `/codex computer-use install` 安裝已設定的 Computer Use plugin，並重新載入 MCP 伺服器。
- `/codex account` 顯示帳戶與速率限制狀態。
- `/codex mcp` 列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 列出 Codex app-server skills。

### 常見除錯工作流程

當 Codex 後端 agent 在 Telegram、Discord、Slack、
或其他 channel 中做出令人意外的事時，請從問題發生的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload`，或另一段簡短 note
   來描述你看到的情況。
2. 核准 diagnostics request 一次。核准會建立本機 Gateway
   diagnostics zip，而且因為工作階段正在使用 Codex harness，也會
   將相關的 Codex feedback bundle 傳送到 OpenAI 伺服器。
3. 將完成的 diagnostics 回覆複製到 bug report 或 support thread。
   其中包含本機 bundle path、privacy summary、OpenClaw session ids、
   Codex thread ids，以及每個 Codex thread 的 `Inspect locally` 行。
4. 如果你想自行除錯該次執行，請在終端機中執行印出的 `Inspect locally`
   command。它看起來像 `codex resume <thread-id>`，並會開啟
   原生 Codex thread，讓你可以檢查對話、在本機繼續它，
   或詢問 Codex 為什麼選擇特定 tool 或 plan。

只有在你特別想為目前附加的 thread 上傳 Codex
feedback，而不需要完整 OpenClaw
Gateway diagnostics bundle 時，才使用 `/codex diagnostics [note]`。對多數 support report 來說，`/diagnostics [note]` 是
更好的起點，因為它會在同一則回覆中把本機 Gateway state 和 Codex
thread ids 串在一起。完整的 privacy model 與 group-chat 行為請見 [Diagnostics export](/zh-TW/gateway/diagnostics)。

Core OpenClaw 也公開 owner-only `/diagnostics [note]` 作為一般
Gateway diagnostics command。它的核准提示會顯示 sensitive-data
preamble、連結到 [Diagnostics Export](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec approval
要求 `openclaw gateway diagnostics export --json`。不要用 allow-all rule 核准 diagnostics。核准後，
OpenClaw 會傳送一份可貼上的 report，其中包含本機 bundle path 與 manifest
summary。當作用中的 OpenClaw 工作階段正在使用 Codex harness 時，同一個
核准也會授權將相關的 Codex feedback bundles 傳送到
OpenAI 伺服器。核准提示會說 Codex feedback 將被傳送，但
在核准前不會列出 Codex session 或 thread ids。

如果 owner 在 group chat 中呼叫 `/diagnostics`，OpenClaw 會保持
shared channel 乾淨：group 只會收到簡短通知，而
diagnostics preamble、approval prompts 與 Codex session/thread ids 會透過
private approval route 傳送給 owner。如果沒有 private owner route，
OpenClaw 會拒絕 group request，並要求 owner 從 DM 執行。

已核准的 Codex upload 會呼叫 Codex app-server `feedback/upload`，並要求
app-server 在可用時納入每個列出的 thread 與 spawned Codex subthreads
的 logs。該 upload 會透過 Codex 的一般 feedback path 傳送到 OpenAI
伺服器；如果該 app-server 停用了 Codex feedback，command 會回傳
app-server error。完成的 diagnostics 回覆會列出已傳送 thread 的 channels、
OpenClaw session ids、Codex thread ids，以及本機 `codex resume <thread-id>`
commands。如果你拒絕或忽略核准，
OpenClaw 不會印出那些 Codex ids。此 upload 不會取代本機
Gateway diagnostics export。

`/codex resume` 會寫入 harness 在一般 turns 中使用的相同 sidecar binding file。
在下一則訊息時，OpenClaw 會恢復該 Codex thread、將
目前選取的 OpenClaw model 傳入 app-server，並保持 extended history
啟用。

### 從 CLI 檢查 Codex thread

理解不良 Codex 執行最快的方式，通常是直接開啟原生 Codex
thread：

```sh
codex resume <thread-id>
```

當你在 channel conversation 中注意到 bug，並想檢查有問題的
Codex session、在本機繼續它，或詢問 Codex 為什麼做出
特定 tool 或 reasoning choice 時，請使用這個方式。最簡單的路徑通常是先執行
`/diagnostics [note]`：核准後，完成的 report 會列出
每個 Codex thread，並印出 `Inspect locally` command，例如
`codex resume <thread-id>`。你可以將該 command 直接複製到終端機。

你也可以從目前 chat 的 `/codex binding`，或近期 Codex app-server threads 的
`/codex threads [filter]` 取得 thread id，然後在 shell 中執行同一個
`codex resume` command。

此 command surface 需要 Codex app-server `0.125.0` 或更新版本。如果
未來或自訂 app-server 未公開該 JSON-RPC method，個別
control methods 會回報為 `unsupported by this Codex app-server`。

## Hook 邊界

Codex harness 有三個 hook layers：

| Layer                                 | Owner                    | Purpose                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                 | 跨 PI 與 Codex harnesses 的 product/plugin 相容性。                 |
| Codex app-server extension middleware | OpenClaw bundled plugins | OpenClaw dynamic tools 周圍的 per-turn adapter behavior。            |
| Codex native hooks                    | Codex                    | 來自 Codex config 的 low-level Codex lifecycle 與 native tool policy。 |

OpenClaw 不使用 project 或 global Codex `hooks.json` files 來路由
OpenClaw plugin behavior。針對支援的 native tool 與 permission bridge，
OpenClaw 會為 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 與 `Stop` 注入 per-thread Codex config。其他 Codex hooks，例如 `SessionStart` 與
`UserPromptSubmit`，仍然是 Codex-level controls；它們不會在 v1 contract 中作為
OpenClaw plugin hooks 公開。

對於 OpenClaw dynamic tools，OpenClaw 會在 Codex 要求
呼叫之後執行 tool，因此 OpenClaw 會在
harness adapter 中觸發它所擁有的 plugin 與 middleware behavior。對於 Codex-native tools，Codex 擁有 canonical tool record。
OpenClaw 可以 mirror 選定 events，但除非 Codex 透過 app-server 或 native hook
callbacks 公開該操作，否則它無法改寫原生 Codex
thread。

Compaction 與 LLM lifecycle projections 來自 Codex app-server
notifications 與 OpenClaw adapter state，而不是 native Codex hook commands。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 與
`llm_output` events 是 adapter-level observations，而不是 Codex internal request 或 compaction payloads 的逐位元組 captures。

Codex native `hook/started` 與 `hook/completed` app-server notifications 會
投射為 `codex_app_server.hook` agent events，用於 trajectory 與 debugging。
它們不會呼叫 OpenClaw plugin hooks。

## V1 支援合約

Codex mode 不是底層使用不同 model call 的 PI。Codex 擁有更多
native model loop，而 OpenClaw 會依照該邊界調整其 plugin 與 session surfaces。

Codex runtime v1 支援：

| Surface                                       | Support                                 | Why                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI model loop               | 支援                                    | Codex app-server 擁有 OpenAI turn、native thread resume 與 native tool continuation。                                                                                                                  |
| OpenClaw channel routing and delivery         | 支援                                    | Telegram、Discord、Slack、WhatsApp、iMessage 與其他 channels 留在 model runtime 外部。                                                                                                                |
| OpenClaw dynamic tools                        | 支援                                    | Codex 要求 OpenClaw 執行這些 tools，因此 OpenClaw 會留在 execution path 中。                                                                                                                          |
| Prompt and context plugins                    | 支援                                    | OpenClaw 會在啟動或恢復 thread 前建構 prompt overlays，並將 context 投射到 Codex turn 中。                                                                                                            |
| Context engine lifecycle                      | 支援                                    | Assemble、ingest 或 after-turn maintenance，以及 context-engine compaction coordination 會為 Codex turns 執行。                                                                                        |
| Dynamic tool hooks                            | 支援                                    | `before_tool_call`、`after_tool_call` 與 tool-result middleware 會在 OpenClaw-owned dynamic tools 周圍執行。                                                                                            |
| Lifecycle hooks                               | 作為 adapter observations 支援          | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 與 `after_compaction` 會以真實的 Codex-mode payloads 觸發。                                                                                 |
| Final-answer revision gate                    | 透過 native hook relay 支援             | Codex `Stop` 會 relay 到 `before_agent_finalize`；`revise` 會要求 Codex 在 finalization 前再進行一次 model pass。                                                                                       |
| Native shell, patch, and MCP block or observe | 透過 native hook relay 支援             | Codex `PreToolUse` 與 `PostToolUse` 會針對已承諾的 native tool surfaces relay，包括 Codex app-server `0.125.0` 或更新版本上的 MCP payloads。支援 blocking；不支援 argument rewriting。 |
| Native permission policy                      | 透過 native hook relay 支援             | Codex `PermissionRequest` 可在 runtime 公開時透過 OpenClaw policy 路由。如果 OpenClaw 未回傳 decision，Codex 會透過其一般 guardian 或 user approval path 繼續。     |
| App-server trajectory capture                 | 支援                                    | OpenClaw 會記錄傳送給 app-server 的 request，以及收到的 app-server notifications。                                                                                                                    |

Codex runtime v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                        | 未來路徑                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生 pre-tool hooks 可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。                                                                  | 需要 Codex hook/schema 支援替換工具輸入。                                                  |
| 可編輯的 Codex 原生 transcript 歷史                 | Codex 擁有標準原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來 context，但不應變更未支援的內部項目。                                             | 若需要原生執行緒手術，請加入明確的 Codex app-server API。                                  |
| Codex 原生工具記錄的 `tool_result_persist`          | 該 hook 轉換 OpenClaw 擁有的 transcript 寫入，而不是 Codex 原生工具記錄。                                                                      | 可以鏡像已轉換的記錄，但標準重寫需要 Codex 支援。                                         |
| 豐富的原生 Compaction metadata                      | OpenClaw 會觀察 Compaction 開始與完成，但不會收到穩定的保留/丟棄清單、token 差異或摘要 payload。                                              | 需要更豐富的 Codex Compaction 事件。                                                       |
| Compaction 介入                                     | 目前 OpenClaw Compaction hooks 在 Codex 模式中屬於通知層級。                                                                                   | 若 plugins 需要否決或重寫原生 Compaction，請加入 Codex 前置/後置 Compaction hooks。        |
| 逐位元組模型 API 請求擷取                           | OpenClaw 可以擷取 app-server 請求與通知，但 Codex 核心會在內部建構最終 OpenAI API 請求。                                                       | 需要 Codex 模型請求追蹤事件或 debug API。                                                  |

## 工具、媒體與 Compaction

Codex harness 只會變更低階嵌入式 agent executor。

OpenClaw 仍會建構工具清單，並從 harness 接收動態工具結果。文字、圖片、影片、音樂、TTS、核准，以及 messaging-tool 輸出會繼續透過一般 OpenClaw 傳遞路徑。

原生 hook relay 刻意保持通用，但 v1 支援合約僅限於 OpenClaw 測試過的 Codex 原生工具與權限路徑。在 Codex runtime 中，這包含 shell、patch，以及 MCP `PreToolUse`、`PostToolUse` 和 `PermissionRequest` payload。在 runtime 合約命名之前，不要假設每個未來的 Codex hook 事件都是 OpenClaw plugin 介面。

對於 `PermissionRequest`，OpenClaw 只有在 policy 做出決策時才會回傳明確的允許或拒絕決定。無決策結果不是允許。Codex 會將其視為沒有 hook 決策，並落到自己的 guardian 或使用者核准路徑。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准 elicitations 會透過 OpenClaw 的 plugin 核准流程路由。Codex `request_user_input` 提示會被送回原始 chat，而下一則排入佇列的 follow-up 訊息會回答該原生伺服器請求，而不是被導向為額外 context。其他 MCP elicitation 請求仍會失敗關閉。

Active-run 佇列導向會對應到 Codex app-server `turn/steer`。使用預設 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的靜默時間窗內批次處理排入佇列的 chat 訊息，並依抵達順序以單一 `turn/steer` 請求送出。舊版 `queue` 模式會送出個別 `turn/steer` 請求。Codex review 和手動 Compaction turn 可能會拒絕同一 turn 的導向，在此情況下，若所選模式允許 fallback，OpenClaw 會使用 followup 佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當所選模型使用 Codex harness 時，原生執行緒 Compaction 會委派給 Codex app-server。OpenClaw 會保留 transcript 鏡像，用於 channel 歷史、搜尋、`/new`、`/reset`，以及未來模型或 harness 切換。鏡像包含使用者 prompt、最終 assistant 文字，以及 app-server 發出時的輕量 Codex reasoning 或 plan 記錄。目前，OpenClaw 只會記錄原生 Compaction 開始與完成訊號。它尚未公開人類可讀的 Compaction 摘要，或可稽核的 Codex 在 Compaction 後保留項目清單。

因為 Codex 擁有標準原生執行緒，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入 OpenClaw 擁有的 session transcript 工具結果時套用。

媒體生成不需要 PI。圖片、影片、音樂、PDF、TTS 與媒體理解會繼續使用相符的 provider/model 設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 疑難排解

**Codex 不會以一般 `/model` provider 出現：**這對新 config 來說是預期行為。選取具有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` ref）、啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：**當沒有 Codex harness 宣告該執行時，`agentRuntime.id: "auto"` 仍可使用 PI 作為相容性後端。測試時請設定 `agentRuntime.id: "codex"` 以強制選取 Codex。除非你明確設定 `agentRuntime.fallback: "pi"`，否則強制 Codex runtime 現在會失敗，而不是 fallback 到 PI。一旦選取 Codex app-server，其失敗會直接顯示，不需要額外 fallback config。

**app-server 被拒絕：**升級 Codex，讓 app-server handshake 回報版本 `0.125.0` 或更新版本。同版本 prerelease 或附加 build 後綴的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom` 會被拒絕，因為穩定版 `0.125.0` protocol floor 才是 OpenClaw 測試的版本。

**模型探索很慢：**降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket transport 立即失敗：**檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server protocol 版本。

**非 Codex 模型使用 PI：**除非你為該 agent 強制設定 `agentRuntime.id: "codex"` 或選取舊版 `codex/*` ref，否則這是預期行為。一般 `openai/gpt-*` 與其他 provider refs 在 `auto` 模式中會保留在其正常 provider 路徑。如果你強制設定 `agentRuntime.id: "codex"`，該 agent 的每個嵌入式 turn 都必須是 Codex 支援的 OpenAI 模型。

**已安裝 Computer Use 但工具未執行：**從新的 session 執行 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果問題持續，請重新啟動 Gateway 以清除過期的原生 hook 註冊。如果 `computer-use.list_apps` timeout，請重新啟動 Codex Computer Use 或 Codex Desktop 後重試。

## 相關

- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [Agent runtimes](/zh-TW/concepts/agent-runtimes)
- [模型 providers](/zh-TW/concepts/model-providers)
- [OpenAI provider](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin hooks](/zh-TW/plugins/hooks)
- [Configuration reference](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
