---
read_when:
    - 您想使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅限 Codex 的部署失敗，而不是回退到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-01T02:45:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

內建的 `codex` Plugin 讓 OpenClaw 透過 Codex app-server 執行嵌入式代理回合，而不是使用內建的 PI harness。

當你希望由 Codex 擁有底層代理工作階段時，請使用此功能：模型探索、原生執行緒恢復、原生壓縮，以及 app-server 執行。OpenClaw 仍然擁有聊天頻道、工作階段檔案、模型選擇、工具、核准、媒體傳遞，以及可見的逐字稿鏡像。

如果你正在嘗試掌握方向，請從
[代理執行階段](/zh-TW/concepts/agent-runtimes)開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他頻道仍然是通訊介面。

## 快速設定

若要將 Codex harness 用於 GPT 代理回合，請將模型參照保持為標準的
`openai/gpt-*`，啟用內建的 `codex` Plugin，並設定
`agentRuntime.id: "codex"`：

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

不要在這條路徑中使用 `openai-codex/gpt-*`。除非你另外強制指定執行階段，否則這會透過一般 PI runner 選擇 Codex OAuth。設定變更會套用到新的或重設後的工作階段；既有工作階段會保留其已記錄的執行階段。

## 這個 Plugin 會改變什麼

內建的 `codex` Plugin 提供多種獨立能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式執行階段                | `agentRuntime.id: "codex"`                          | 透過 Codex app-server 執行 OpenClaw 嵌入式代理回合。                          |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話繫結並控制 Codex app-server 執行緒。                                |
| Codex app-server 供應器/目錄      | `codex` 內部功能，透過 harness 顯示                 | 讓執行階段探索並驗證 app-server 模型。                                        |
| Codex 媒體理解路徑                | `codex/*` 影像模型相容性路徑                        | 對支援的影像理解模型執行有界的 Codex app-server 回合。                        |
| 原生掛鉤轉送                      | Codex 原生事件周圍的 Plugin 掛鉤                    | 讓 OpenClaw 觀察/封鎖支援的 Codex 原生工具/完成事件。                         |

啟用 Plugin 會讓這些能力可用。它**不會**：

- 開始對每個 OpenAI 模型使用 Codex
- 將 `openai-codex/*` 模型參照轉換為原生執行階段
- 讓 ACP/acpx 成為預設 Codex 路徑
- 熱切換已經記錄 PI 執行階段的既有工作階段
- 取代 OpenClaw 頻道傳遞、工作階段檔案、auth-profile 儲存，或訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制命令介面。如果 Plugin 已啟用，且使用者要求從聊天中繫結、恢復、導向、停止或檢查 Codex 執行緒，代理應優先使用 `/codex ...`，而不是 ACP。當使用者要求 ACP/acpx 或正在測試 ACP Codex 轉接器時，ACP 仍然是明確的後備方案。

原生 Codex 回合會保留 OpenClaw Plugin 掛鉤作為公開相容層。這些是處理程序內的 OpenClaw 掛鉤，不是 Codex `hooks.json` 命令掛鉤：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用於鏡像逐字稿記錄
- `before_agent_finalize` 透過 Codex `Stop` 轉送
- `agent_end`

Plugins 也可以註冊執行階段中立的工具結果中介軟體，在 OpenClaw 執行工具之後、結果傳回 Codex 之前，重寫 OpenClaw 動態工具結果。這不同於公開的 `tool_result_persist` Plugin 掛鉤，後者會轉換 OpenClaw 擁有的逐字稿工具結果寫入。

如需 Plugin 掛鉤語意本身，請參閱 [Plugin 掛鉤](/zh-TW/plugins/hooks)和 [Plugin guard 行為](/zh-TW/tools/plugin)。

harness 預設為關閉。新設定應將 OpenAI 模型參照保持為標準的 `openai/gpt-*`，並在需要原生 app-server 執行時明確強制使用 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版 `codex/*` 模型參照仍會為了相容性自動選擇 harness，但以執行階段為後盾的舊版供應器前綴不會顯示為一般模型/供應器選項。

如果 `codex` Plugin 已啟用，但主要模型仍是 `openai-codex/*`，`openclaw doctor` 會發出警告，而不是變更路由。這是刻意設計：`openai-codex/*` 仍然是 PI Codex OAuth/訂閱路徑，而原生 app-server 執行仍是明確的執行階段選擇。

## 路由對照表

變更設定前請使用此表：

| 期望行為                                    | 模型參照                   | 執行階段設定                           | Plugin 需求                 | 預期狀態標籤                 |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 透過一般 OpenClaw runner 使用 OpenAI API    | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI 供應器               | `Runtime: OpenClaw Pi Default` |
| 透過 PI 使用 Codex OAuth/訂閱               | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth 供應器   | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式回合            | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` Plugin              | `Runtime: OpenAI Codex`        |
| 以保守自動模式混用供應器                    | 供應器專屬參照             | `agentRuntime.id: "auto"`              | 選用 Plugin 執行階段        | 取決於選定的執行階段           |
| 明確的 Codex ACP 轉接器工作階段             | 取決於 ACP 提示/模型       | `sessions_spawn` 搭配 `runtime: "acp"` | 健康的 `acpx` 後端          | ACP 任務/工作階段狀態          |

重要的區分是供應器與執行階段：

- `openai-codex/*` 回答「PI 應使用哪個供應器/auth 路由？」
- `agentRuntime.id: "codex"` 回答「哪個迴圈應執行這個嵌入式回合？」
- `/codex ...` 回答「此聊天應繫結或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應啟動哪個外部 harness 程序？」

## 選擇正確的模型前綴

OpenAI 系列路由依前綴區分。當你想透過 PI 使用 Codex OAuth 時，使用 `openai-codex/*`；當你想直接存取 OpenAI API，或正在強制使用原生 Codex app-server harness 時，使用 `openai/*`：

| 模型參照                                      | 執行階段路徑                                 | 使用時機                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 透過 OpenClaw/PI 管線的 OpenAI 供應器        | 你想用 `OPENAI_API_KEY` 取得目前直接的 OpenAI Platform API 存取權。        |
| `openai-codex/gpt-5.5`                        | 透過 OpenClaw/PI 的 OpenAI Codex OAuth       | 你想使用 ChatGPT/Codex 訂閱驗證搭配預設 PI runner。                       |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | 你想對嵌入式代理回合使用原生 Codex app-server 執行。                      |

GPT-5.5 目前在 OpenClaw 中僅支援訂閱/OAuth。PI OAuth 請使用 `openai-codex/gpt-5.5`，或搭配 Codex app-server harness 使用 `openai/gpt-5.5`。一旦 OpenAI 在公開 API 上啟用 GPT-5.5，即支援 `openai/gpt-5.5` 的直接 API 金鑰存取。

舊版 `codex/gpt-*` 參照仍會作為相容性別名被接受。Doctor 相容性遷移會將舊版主要執行階段參照重寫為標準模型參照，並分開記錄執行階段政策，而僅作為後備的舊版參照會保持不變，因為執行階段是為整個代理容器設定。新的 PI Codex OAuth 設定應使用 `openai-codex/gpt-*`；新的原生 app-server harness 設定應使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前綴區分。當影像理解應透過 OpenAI Codex OAuth 供應器路徑執行時，使用 `openai-codex/gpt-*`。當影像理解應透過有界的 Codex app-server 回合執行時，使用 `codex/gpt-*`。Codex app-server 模型必須宣告支援影像輸入；純文字 Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效 harness。如果選擇結果令人意外，請啟用 `agents/harness` 子系統的偵錯記錄，並檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含選定的 harness id、選擇原因、執行階段/後備政策，以及在 `auto` 模式中每個 Plugin 候選項的支援結果。

### Doctor 警告的意思

當以下全部為真時，`openclaw doctor` 會發出警告：

- 內建的 `codex` Plugin 已啟用或允許
- 代理的主要模型是 `openai-codex/*`
- 該代理的有效執行階段不是 `codex`

這個警告存在，是因為使用者經常預期「已啟用 Codex Plugin」就代表「原生 Codex app-server 執行階段」。OpenClaw 不會做出這個跳躍。此警告表示：

- 如果你本來就打算透過 PI 使用 ChatGPT/Codex OAuth，則**不需要變更**。
- 如果你打算使用原生 app-server 執行，請將模型改為 `openai/<model>`，並設定
  `agentRuntime.id: "codex"`。
- 執行階段變更後，既有工作階段仍需要 `/new` 或 `/reset`，因為工作階段執行階段釘選是黏著的。

Harness 選擇不是即時工作階段控制。當嵌入式回合執行時，OpenClaw 會在該工作階段上記錄選定的 harness id，並在相同工作階段 id 的後續回合中持續使用它。當你希望未來工作階段使用另一個 harness 時，請變更 `agentRuntime` 設定或 `OPENCLAW_AGENT_RUNTIME`；在既有對話於 PI 與 Codex 之間切換前，使用 `/new` 或 `/reset` 啟動全新的工作階段。這可避免透過兩個不相容的原生工作階段系統重播同一份逐字稿。

在 harness 釘選出現前建立的舊版工作階段，一旦有逐字稿歷史，就會被視為已釘選到 PI。變更設定後，使用 `/new` 或 `/reset` 將該對話選入 Codex。

`/status` 會顯示有效模型執行階段。預設 PI harness 會顯示為 `Runtime: OpenClaw Pi Default`，而 Codex app-server harness 會顯示為 `Runtime: OpenAI Codex`。

## 需求

- 可用內建 `codex` Plugin 的 OpenClaw。
- Codex app-server `0.125.0` 或更新版本。內建 Plugin 預設會管理相容的 Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 命令不會影響一般 harness 啟動。
- app-server 程序或 OpenClaw 的 Codex auth bridge 可使用 Codex auth。本機 app-server 啟動會為每個代理使用 OpenClaw 管理的 Codex home，以及隔離的子程序 `HOME`，因此預設不會讀取你的個人 `~/.codex` 帳號、Skills、Plugins、設定、執行緒狀態，或原生 `$HOME/.agents/skills`。

Plugin 會封鎖較舊或未帶版本的 app-server 交握。這能讓 OpenClaw 保持在已測試過的協定介面上。

對於即時和 Docker 煙霧測試，auth 通常來自 Codex CLI 帳號或 OpenClaw `openai-codex` auth profile。本機 stdio app-server 啟動在沒有帳號時，也可以後備使用 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 將 Codex 與其他模型一起加入

如果同一個 agent 應該能在 Codex 與非 Codex 供應商模型之間自由切換，請勿全域設定 `agentRuntime.id: "codex"`。強制 runtime 會套用到該 agent 或 session 的每一個嵌入式回合。如果你在強制使用該 runtime 時選取 Anthropic 模型，OpenClaw 仍會嘗試 Codex harness，並以封閉失敗結束，而不是默默將該回合透過 PI 路由。

請改用下列其中一種形式：

- 將 Codex 放在使用 `agentRuntime.id: "codex"` 的專用 agent 上。
- 將預設 agent 保持在 `agentRuntime.id: "auto"`，並使用 PI fallback 來處理一般混合供應商用法。
- 舊版 `codex/*` refs 僅供相容性使用。新設定應優先使用 `openai/*`，並搭配明確的 Codex runtime policy。

例如，以下會讓預設 agent 使用一般自動選取，並加入獨立的 Codex agent：

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

- 預設的 `main` agent 會使用一般供應商路徑與 PI 相容性 fallback。
- `codex` agent 會使用 Codex app-server harness。
- 如果 `codex` agent 缺少 Codex 或不支援 Codex，該回合會失敗，而不是悄悄使用 PI。

## Agent 命令路由

Agents 應依意圖路由使用者請求，而不是只看「Codex」這個字：

| 使用者要求...                                          | Agent 應使用...                                  |
| -------------------------------------------------------- | ------------------------------------------------ |
| 「將此對話綁定到 Codex」                                | `/codex bind`                                    |
| 「在這裡繼續 Codex thread `<id>`」                       | `/codex resume <id>`                             |
| 「顯示 Codex threads」                                   | `/codex threads`                                 |
| 「為一次異常的 Codex run 提交支援報告」                  | `/diagnostics [note]`                            |
| 「只針對這個附加的 thread 傳送 Codex feedback」          | `/codex diagnostics [note]`                      |
| 「將 Codex 用作此 agent 的 runtime」                     | 將設定變更為 `agentRuntime.id`                   |
| 「在一般 OpenClaw 中使用我的 ChatGPT/Codex 訂閱」        | `openai-codex/*` model refs                      |
| 「透過 ACP/acpx 執行 Codex」                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」  | ACP/acpx，而非 `/codex`，也不是原生 sub-agents   |

OpenClaw 只會在 ACP 已啟用、可派送，且有已載入的 runtime 後端支援時，才向 agents 宣告 ACP spawn 指引。如果 ACP 無法使用，系統提示與 plugin skills 不應教導 agent 關於 ACP 路由。

## 僅限 Codex 的部署

當你需要證明每個嵌入式 agent 回合都使用 Codex 時，請強制使用 Codex harness。明確的 Plugin runtimes 預設沒有 PI fallback，因此 `fallback: "none"` 是選用的，但通常很適合作為文件化說明：

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

強制使用 Codex 時，如果 Codex Plugin 已停用、app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。只有在你刻意想讓 PI 處理缺少 harness 選取的情況時，才設定 `OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 每個 agent 的 Codex

你可以讓某個 agent 僅使用 Codex，同時讓預設 agent 保持一般自動選取：

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

使用一般 session 命令切換 agents 與模型。`/new` 會建立新的 OpenClaw session，而 Codex harness 會依需要建立或繼續它的 sidecar app-server thread。`/reset` 會清除此 thread 的 OpenClaw session 綁定，並讓下一個回合再次從目前設定解析 harness。

## 模型探索

預設情況下，Codex Plugin 會向 app-server 詢問可用模型。如果探索失敗或逾時，它會對下列項目使用內建 fallback catalog：

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

當你希望啟動時避免探查 Codex，並固定使用 fallback catalog 時，請停用探索：

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

預設情況下，Plugin 會以本機方式啟動 OpenClaw 管理的 Codex binary：

```bash
codex app-server --listen stdio://
```

受管理的 binary 會宣告為內建 Plugin runtime 相依項，並與其餘 `codex` Plugin 相依項一起暫存。這會讓 app-server 版本與內建 Plugin 綁定，而不是使用本機剛好安裝的其他 Codex CLI。只有在你刻意想執行不同可執行檔時，才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO 模式啟動本機 Codex harness sessions：`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及 `sandbox: "danger-full-access"`。這是自主 Heartbeats 使用的受信任本機操作者姿態：Codex 可以使用 shell 與網路工具，而不會因為沒有人能回覆的原生核准提示而停止。

若要選擇使用 Codex guardian 審查核准，請設定 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自動審查核准路徑。當 Codex 要求離開 sandbox、寫入 workspace 外部，或新增網路存取等權限時，Codex 會將該核准請求路由到原生 reviewer，而不是 human prompt。reviewer 會套用 Codex 的風險框架，並核准或拒絕該特定請求。當你想要比 YOLO 模式更多 guardrails，但仍需要無人值守的 agents 能持續推進時，請使用 Guardian。

`guardian` preset 會展開為 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。個別政策欄位仍會覆寫 `mode`，因此進階部署可以將 preset 與明確選項混用。較舊的 `guardian_subagent` reviewer 值仍可作為相容性別名接受，但新設定應使用 `auto_review`。

若 app-server 已在執行，請使用 WebSocket 傳輸：

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

Stdio app-server 啟動預設會繼承 OpenClaw 的處理程序環境，但 OpenClaw 擁有 Codex app-server 帳戶 bridge，並將 `CODEX_HOME` 與 `HOME` 都設定為該 agent 的 OpenClaw state 底下的每 agent 目錄。Codex 自身的 skill loader 會讀取 `$CODEX_HOME/skills` 與 `$HOME/.agents/skills`，因此這兩個值都會對本機 app-server 啟動進行隔離。這會讓 Codex 原生 skills、plugins、設定、帳戶與 thread state 限定在 OpenClaw agent 範圍內，而不是從操作者的個人 Codex CLI home 外洩進來。

OpenClaw plugins 與 OpenClaw skill snapshots 仍會透過 OpenClaw 自己的 Plugin registry 與 skill loader 流動。個人 Codex CLI assets 不會。如果你有實用的 Codex CLI skills 或 plugins 應成為 OpenClaw agent 的一部分，請明確盤點它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider 會將 skills 複製到目前的 OpenClaw agent workspace。Codex 原生 plugins、hooks 與設定檔會被回報或封存以供人工審查，而不是自動啟用，因為它們可以執行命令、公開 MCP servers，或攜帶憑證。

Auth 會依此順序選取：

1. 該 agent 的明確 OpenClaw Codex auth profile。
2. 該 agent 的 Codex home 中 app-server 既有的帳戶。
3. 僅限本機 stdio app-server 啟動，在沒有 app-server 帳戶且仍需要 OpenAI auth 時，使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex auth profile 時，會從產生的 Codex child process 移除 `CODEX_API_KEY` 與 `OPENAI_API_KEY`。這會讓 Gateway 層級 API keys 可用於 embeddings 或直接 OpenAI models，而不會意外讓原生 Codex app-server 回合透過 API 計費。明確的 Codex API-key profiles 與本機 stdio env-key fallback 會使用 app-server login，而不是繼承 child-process env。WebSocket app-server 連線不會收到 Gateway env API-key fallback；請使用明確的 auth profile 或遠端 app-server 自己的帳戶。

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

`appServer.clearEnv` 只會影響產生的 Codex app-server child process。

支援的 `appServer` 欄位：

| 欄位                | 預設值                                   | 意義                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 會啟動 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                              |
| `command`           | 受管理的 Codex binary                    | stdio 傳輸的可執行檔。保留未設定即可使用受管理的 binary；只有在明確覆寫時才設定。                                                                                                                                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸的引數。                                                                                                                                                                                                                   |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                           |
| `authToken`         | 未設定                                   | WebSocket 傳輸的 Bearer token。                                                                                                                                                                                                      |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                              |
| `clearEnv`          | `[]`                                     | 在 OpenClaw 建立其繼承環境後，會從產生的 stdio app-server 程序移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留供 OpenClaw 在本機啟動時進行每代理 Codex 隔離使用。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian-reviewed 執行的預設集。                                                                                                                                                                                            |
| `approvalPolicy`    | `"never"`                                | 傳送到執行緒開始/恢復/回合的原生 Codex 核准政策。                                                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | 傳送到執行緒開始/恢復的原生 Codex 沙盒模式。                                                                                                                                                                                         |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審查原生核准提示。`guardian_subagent` 仍是舊版別名。                                                                                                                                                  |
| `serviceTier`       | 未設定                                   | 選用的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                                              |

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到界定：每個 Codex `item/tool/call` 請求都必須在
30 秒內收到 OpenClaw 回應。逾時時，OpenClaw 會在支援的情況下中止工具
訊號，並向 Codex 傳回失敗的動態工具回應，讓該回合可以繼續，而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 請求後，harness
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

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的 binary。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或針對一次性本機測試使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。可重複部署時
建議使用設定，因為它會將 Plugin 行為保留在與其餘 Codex harness 設定相同的
已審查檔案中。

## 電腦使用

電腦使用有自己的設定指南：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版：OpenClaw 不會 vend 桌面控制 app，也不會自行執行
桌面動作。它會準備 Codex app-server，確認
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間處理原生
MCP 工具呼叫。

若要在 Codex marketplace 流程之外直接存取 TryCua driver，請用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊
`cua-driver mcp`。請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解
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

電腦使用僅適用於 macOS，且在 Codex MCP 伺服器能控制 app 前，可能需要本機 OS 權限。如果 `computerUse.enabled` 為 true 且 MCP
伺服器無法使用，Codex 模式回合會在執行緒開始前失敗，而不是在沒有原生電腦使用工具的情況下
靜默執行。請參閱
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 marketplace 選項、
遠端目錄限制、狀態原因與疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex
尚未發現本機 marketplace，OpenClaw 可以從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊標準
內建 Codex Desktop marketplace。變更 runtime 或電腦使用設定後，請使用 `/new` 或 `/reset`，
以免既有工作階段保留舊的
PI 或 Codex 執行緒繫結。

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

僅限 Codex 的 harness 驗證：

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

Guardian-reviewed Codex 核准：

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

模型切換仍由 OpenClaw 控制。當 OpenClaw 工作階段附加到
既有 Codex 執行緒時，下一回合會再次將目前選取的
OpenAI 模型、provider、核准政策、沙盒與服務層級傳送到
app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留
執行緒繫結，但要求 Codex 使用新選取的模型繼續。

## Codex 命令

內建 Plugin 會將 `/codex` 註冊為已授權的斜線命令。它是
通用的，適用於任何支援 OpenClaw 文字命令的 channel。

常見形式：

- `/codex status` 顯示即時 app-server 連線能力、模型、帳戶、速率限制、MCP 伺服器與 Skills。
- `/codex models` 列出即時 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 執行緒。
- `/codex resume <thread-id>` 將目前的 OpenClaw 工作階段附加到既有 Codex 執行緒。
- `/codex compact` 要求 Codex app-server 壓縮附加的執行緒。
- `/codex review` 為附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送附加執行緒的 Codex 診斷回饋前先詢問。
- `/codex computer-use status` 檢查已設定的電腦使用 Plugin 和 MCP 伺服器。
- `/codex computer-use install` 安裝已設定的電腦使用 Plugin 並重新載入 MCP 伺服器。
- `/codex account` 顯示帳戶和速率限制狀態。
- `/codex mcp` 列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 列出 Codex app-server skills。

### 常見偵錯工作流程

當 Codex 支援的代理在 Telegram、Discord、Slack
或其他 channel 中做出意外行為時，請從問題發生的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload`，或另一則描述你所見情況的簡短註記。
2. 核准一次診斷請求。該核准會建立本機 Gateway
   診斷 zip，並且因為工作階段使用 Codex harness，也會
   將相關的 Codex 回饋 bundle 傳送到 OpenAI 伺服器。
3. 將完成的診斷回覆複製到錯誤報告或支援討論串。
   它包含本機 bundle 路徑、隱私摘要、OpenClaw 工作階段 ID、
   Codex 執行緒 ID，以及每個 Codex 執行緒的 `Inspect locally` 行。
4. 如果你想自行偵錯該次執行，請在終端機中執行列印出的 `Inspect locally`
   命令。它看起來像 `codex resume <thread-id>`，並會開啟
   原生 Codex 執行緒，讓你檢查對話、在本機繼續，
   或詢問 Codex 為何選擇特定工具或計畫。

只有當你特別想要針對目前附加的執行緒上傳 Codex 回饋，而不需要完整的 OpenClaw Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。對於大多數支援回報，`/diagnostics [note]` 是更好的起點，因為它會在同一則回覆中把本機 Gateway 狀態與 Codex 執行緒 ID 串在一起。完整的隱私模型與群組聊天行為，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

核心 OpenClaw 也公開僅限擁有者使用的 `/diagnostics [note]`，作為一般 Gateway 診斷命令。其核准提示會顯示敏感資料前言、連結到[診斷匯出](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec 核准請求執行 `openclaw gateway diagnostics export --json`。不要以允許所有項目的規則核准診斷。核准後，OpenClaw 會傳送一份可貼上的報告，其中包含本機套件路徑與資訊清單摘要。當作用中的 OpenClaw 工作階段正在使用 Codex harness 時，同一個核准也會授權將相關的 Codex 回饋套件傳送到 OpenAI 伺服器。核准提示會說明 Codex 回饋將會被傳送，但不會在核准前列出 Codex 工作階段或執行緒 ID。

如果 `/diagnostics` 是由擁有者在群組聊天中叫用，OpenClaw 會保持共享頻道乾淨：群組只會收到一則簡短通知，而診斷前言、核准提示，以及 Codex 工作階段/執行緒 ID 會透過私人核准路徑傳送給擁有者。如果沒有私人擁有者路徑，OpenClaw 會拒絕群組請求，並要求擁有者從 DM 執行。

已核准的 Codex 上傳會呼叫 Codex app-server `feedback/upload`，並要求 app-server 在可用時為每個列出的執行緒與衍生的 Codex 子執行緒納入記錄。上傳會透過 Codex 一般回饋路徑傳送到 OpenAI 伺服器；如果該 app-server 中停用了 Codex 回饋，此命令會回傳 app-server 錯誤。完成的診斷回覆會列出已傳送執行緒的頻道、OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機 `codex resume <thread-id>` 命令。如果你拒絕或忽略核准，OpenClaw 不會列印那些 Codex ID。此上傳不會取代本機 Gateway 診斷匯出。

`/codex resume` 會寫入與 harness 在一般回合中使用的相同 sidecar 繫結檔。下一則訊息時，OpenClaw 會恢復該 Codex 執行緒，將目前選取的 OpenClaw 模型傳入 app-server，並保持延伸歷史記錄啟用。

### 從 CLI 檢查 Codex 執行緒

理解不良 Codex 執行的最快方式，通常是直接開啟原生 Codex 執行緒：

```sh
codex resume <thread-id>
```

當你在頻道對話中注意到錯誤，並想要檢查有問題的 Codex 工作階段、在本機繼續它，或詢問 Codex 為何做出特定工具或推理選擇時，請使用此命令。最簡單的路徑通常是先執行 `/diagnostics [note]`：在你核准後，完成的報告會列出每個 Codex 執行緒，並列印一個 `Inspect locally` 命令，例如 `codex resume <thread-id>`。你可以直接將該命令複製到終端機。

你也可以從目前聊天的 `/codex binding`，或最近 Codex app-server 執行緒的 `/codex threads [filter]` 取得執行緒 ID，然後在 shell 中執行相同的 `codex resume` 命令。

此命令介面需要 Codex app-server `0.125.0` 或更新版本。如果未來或自訂 app-server 未公開該 JSON-RPC 方法，個別控制方法會回報為 `unsupported by this Codex app-server`。

## 鉤子邊界

Codex harness 有三層鉤子：

| 層級                                  | 擁有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin 鉤子                  | OpenClaw                 | 跨 PI 與 Codex harness 的產品/Plugin 相容性。                       |
| Codex app-server 擴充 middleware      | OpenClaw 隨附 Plugin     | 圍繞 OpenClaw 動態工具的每回合配接器行為。                          |
| Codex 原生鉤子                        | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。                |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由 OpenClaw Plugin 行為。對於受支援的原生工具與權限橋接，OpenClaw 會為 `PreToolUse`、`PostToolUse`、`PermissionRequest` 與 `Stop` 注入每個執行緒的 Codex 設定。其他 Codex 鉤子，例如 `SessionStart` 與 `UserPromptSubmit`，仍然是 Codex 層級控制；它們不會在 v1 合約中公開為 OpenClaw Plugin 鉤子。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求呼叫後執行該工具，因此 OpenClaw 會在 harness 配接器中觸發其所擁有的 Plugin 與 middleware 行為。對於 Codex 原生工具，Codex 擁有標準工具記錄。OpenClaw 可以鏡像選定事件，但除非 Codex 透過 app-server 或原生鉤子回呼公開該操作，否則它無法改寫原生 Codex 執行緒。

Compaction 與 LLM 生命週期投影來自 Codex app-server 通知與 OpenClaw 配接器狀態，而不是原生 Codex 鉤子命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 與 `llm_output` 事件是配接器層級觀察，不是逐位元組擷取 Codex 內部請求或 Compaction 承載。

Codex 原生 `hook/started` 與 `hook/completed` app-server 通知會投影為 `codex_app_server.hook` 代理事件，用於軌跡與除錯。它們不會叫用 OpenClaw Plugin 鉤子。

## V1 支援合約

Codex 模式不是在底層換成不同模型呼叫的 PI。Codex 擁有更多原生模型迴圈，而 OpenClaw 會圍繞該邊界配接其 Plugin 與工作階段介面。

Codex runtime v1 支援：

| 介面                                          | 支援                                    | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 執行 OpenAI 模型迴圈               | 支援                                    | Codex app-server 擁有 OpenAI 回合、原生執行緒恢復，以及原生工具延續。                                                                                                                               |
| OpenClaw 頻道路由與傳遞                       | 支援                                    | Telegram、Discord、Slack、WhatsApp、iMessage 與其他頻道會維持在模型 runtime 之外。                                                                                                                   |
| OpenClaw 動態工具                             | 支援                                    | Codex 會要求 OpenClaw 執行這些工具，因此 OpenClaw 仍位於執行路徑中。                                                                                                                                |
| 提示與情境 Plugin                             | 支援                                    | OpenClaw 會在啟動或恢復執行緒前建立提示覆蓋層，並將情境投影到 Codex 回合中。                                                                                                                       |
| 情境引擎生命週期                              | 支援                                    | 組裝、擷取或回合後維護，以及情境引擎 Compaction 協調會針對 Codex 回合執行。                                                                                                                        |
| 動態工具鉤子                                  | 支援                                    | `before_tool_call`、`after_tool_call` 與工具結果 middleware 會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                    |
| 生命週期鉤子                                  | 作為配接器觀察支援                      | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 與 `after_compaction` 會以誠實的 Codex 模式承載觸發。                                                                                   |
| 最終答案修訂閘門                              | 透過原生鉤子轉送支援                    | Codex `Stop` 會轉送至 `before_agent_finalize`；`revise` 會要求 Codex 在最終化前再執行一次模型傳遞。                                                                                                  |
| 原生 shell、patch 與 MCP 封鎖或觀察           | 透過原生鉤子轉送支援                    | Codex `PreToolUse` 與 `PostToolUse` 會針對已承諾的原生工具介面轉送，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 承載。支援封鎖；不支援引數改寫。                                             |
| 原生權限政策                                  | 透過原生鉤子轉送支援                    | 在 runtime 公開時，Codex `PermissionRequest` 可透過 OpenClaw 政策路由。如果 OpenClaw 未回傳決策，Codex 會繼續走其一般 guardian 或使用者核准路徑。                                                   |
| App-server 軌跡擷取                           | 支援                                    | OpenClaw 會記錄它傳送給 app-server 的請求，以及它收到的 app-server 通知。                                                                                                                           |

Codex runtime v1 不支援：

| 介面 | V1 邊界 | 未來路徑 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更 | Codex 原生工具前置 hook 可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。 | 需要 Codex hook/schema 支援替換工具輸入。 |
| 可編輯的 Codex 原生轉錄歷史 | Codex 擁有標準原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來脈絡，但不應變更未受支援的內部機制。 | 如果需要原生執行緒手術式修改，請加入明確的 Codex app-server API。 |
| Codex 原生工具記錄的 `tool_result_persist` | 該 hook 會轉換 OpenClaw 擁有的轉錄寫入，而不是 Codex 原生工具記錄。 | 可鏡像已轉換記錄，但標準重寫需要 Codex 支援。 |
| 豐富的原生壓縮中繼資料 | OpenClaw 會觀察壓縮開始與完成，但不會收到穩定的保留/丟棄清單、權杖差異或摘要承載。 | 需要更豐富的 Codex 壓縮事件。 |
| 壓縮介入 | 目前 OpenClaw 壓縮 hook 在 Codex 模式中屬於通知層級。 | 如果 plugins 需要否決或重寫原生壓縮，請加入 Codex 壓縮前/後 hook。 |
| 逐位元組相同的模型 API 請求擷取 | OpenClaw 可以擷取 app-server 請求與通知，但 Codex 核心會在內部建構最終 OpenAI API 請求。 | 需要 Codex 模型請求追蹤事件或偵錯 API。 |

## 工具、媒體和壓縮

Codex harness 只會變更低階嵌入式 agent 執行器。

OpenClaw 仍會建構工具清單，並從 harness 接收動態工具結果。文字、圖片、影片、音樂、TTS、核准與訊息工具輸出，會繼續透過一般 OpenClaw 傳遞路徑。

原生 hook relay 刻意保持通用，但 v1 支援合約僅限於 OpenClaw 測試過的 Codex 原生工具與權限路徑。在 Codex runtime 中，這包含 shell、patch 和 MCP `PreToolUse`、`PostToolUse` 與 `PermissionRequest` 承載。不要假設每個未來的 Codex hook 事件都是 OpenClaw Plugin 介面，除非 runtime 合約明確命名它。

對於 `PermissionRequest`，OpenClaw 只有在政策做出決定時才會回傳明確允許或拒絕決定。無決定結果不是允許。Codex 會將其視為沒有 hook 決定，並落回自己的 guardian 或使用者核准路徑。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准徵詢會透過 OpenClaw 的 Plugin 核准流程路由。Codex `request_user_input` 提示會傳回來源聊天，而下一則排入佇列的後續訊息會回答該原生伺服器請求，而不是被導向為額外脈絡。其他 MCP 徵詢請求仍會封閉失敗。

作用中執行佇列導向會對應到 Codex app-server `turn/steer`。使用預設 `messages.queue.mode: "steer"` 時，OpenClaw 會在已設定的安靜視窗內批次處理排入佇列的聊天訊息，並依抵達順序以單一 `turn/steer` 請求傳送。舊版 `queue` 模式會傳送個別的 `turn/steer` 請求。Codex review 和手動壓縮回合可能會拒絕同回合導向，在這種情況下，當所選模式允許 fallback 時，OpenClaw 會使用後續佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當所選模型使用 Codex harness 時，原生執行緒壓縮會委派給 Codex app-server。OpenClaw 會保留轉錄鏡像，用於頻道歷史、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。當 app-server 發出使用者提示、最終助理文字，以及輕量 Codex reasoning 或 plan 記錄時，鏡像會包含這些內容。目前，OpenClaw 只記錄原生壓縮開始與完成訊號。它尚未公開人類可讀的壓縮摘要，或可稽核的 Codex 在壓縮後保留項目清單。

因為 Codex 擁有標準原生執行緒，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入 OpenClaw 擁有的工作階段轉錄工具結果時套用。

媒體產生不需要 PI。圖片、影片、音樂、PDF、TTS 與媒體理解會繼續使用相符的 provider/model 設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 疑難排解

**Codex 不會顯示為一般 `/model` provider：** 這對新設定而言是預期行為。選取含有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` 參照），啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 當沒有 Codex harness 宣告該執行時，`agentRuntime.id: "auto"` 仍可使用 PI 作為相容性後端。測試時請設定 `agentRuntime.id: "codex"` 以強制選擇 Codex。除非你明確設定 `agentRuntime.fallback: "pi"`，否則強制 Codex runtime 現在會失敗，而不是 fallback 到 PI。一旦選取 Codex app-server，其失敗會直接浮現，不需要額外 fallback 設定。

**app-server 被拒絕：** 升級 Codex，讓 app-server handshake 回報版本 `0.125.0` 或更新版本。同版本 prerelease 或帶有 build suffix 的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，會被拒絕，因為 OpenClaw 測試的是穩定版 `0.125.0` 協定下限。

**模型探索很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket transport 立即失敗：** 檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server 協定版本。

**非 Codex 模型使用 PI：** 除非你已為該 agent 強制設定 `agentRuntime.id: "codex"`，或選取舊版 `codex/*` 參照，否則這是預期行為。一般 `openai/gpt-*` 和其他 provider 參照在 `auto` 模式中會留在其一般 provider 路徑。如果你強制設定 `agentRuntime.id: "codex"`，該 agent 的每個嵌入式回合都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具未執行：** 從全新工作階段檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果仍持續發生，請重新啟動 gateway 以清除過期的原生 hook 註冊。如果 `computer-use.list_apps` 逾時，請重新啟動 Codex Computer Use 或 Codex Desktop，然後重試。

## 相關

- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [Agent runtimes](/zh-TW/concepts/agent-runtimes)
- [Model providers](/zh-TW/concepts/model-providers)
- [OpenAI provider](/zh-TW/providers/openai)
- [Status](/zh-TW/cli/status)
- [Plugin hooks](/zh-TW/plugins/hooks)
- [設定參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
