---
read_when:
    - 您想使用隨附的 Codex app-server 執行框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅限 Codex 的部署失敗，而不是回退到 PI
summary: 透過隨附的 Codex app-server 執行框架執行 OpenClaw 內嵌代理回合
title: Codex 測試框架
x-i18n:
    generated_at: "2026-04-30T20:05:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 可讓 OpenClaw 透過
Codex app-server 執行內嵌代理回合，而不是使用內建 PI harness。

當你希望 Codex 擁有低階代理工作階段時，請使用這個 Plugin：模型
探索、原生執行緒續接、原生 Compaction，以及 app-server 執行。
OpenClaw 仍然負責聊天頻道、工作階段檔案、模型選擇、工具、
核准、媒體傳送，以及可見的逐字稿鏡像。

如果你正在嘗試定位概念，請從
[代理執行環境](/zh-TW/concepts/agent-runtimes)開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行環境，而 Telegram、
Discord、Slack 或其他頻道仍然是通訊介面。

## 這個 Plugin 會改變什麼

隨附的 `codex` Plugin 提供多個獨立能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生內嵌執行環境                  | `agentRuntime.id: "codex"`                          | 透過 Codex app-server 執行 OpenClaw 內嵌代理回合。                            |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話綁定並控制 Codex app-server 執行緒。                                |
| Codex app-server 提供者/目錄      | `codex` 內部機制，透過 harness 公開                | 讓執行環境探索並驗證 app-server 模型。                                        |
| Codex 媒體理解路徑                | `codex/*` 影像模型相容性路徑                       | 針對支援的影像理解模型執行有界限的 Codex app-server 回合。                    |
| 原生 hook 中繼                    | Codex 原生事件周圍的 Plugin hooks                  | 讓 OpenClaw 觀察/阻擋支援的 Codex 原生工具/完成事件。                         |

啟用此 Plugin 會讓這些能力可用。它**不會**：

- 開始對每個 OpenAI 模型使用 Codex
- 將 `openai-codex/*` 模型參照轉換成原生執行環境
- 讓 ACP/acpx 成為預設 Codex 路徑
- 熱切換已經記錄 PI 執行環境的現有工作階段
- 取代 OpenClaw 頻道傳送、工作階段檔案、驗證設定檔儲存或
  訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制命令介面。如果
Plugin 已啟用，且使用者要求從聊天綁定、續接、引導、停止或檢查
Codex 執行緒，代理應優先使用 `/codex ...` 而不是 ACP。當使用者要求
ACP/acpx，或正在測試 ACP Codex 轉接器時，ACP 仍是明確的後援。

原生 Codex 回合會保留 OpenClaw Plugin hooks 作為公開相容層。
這些是處理程序內的 OpenClaw hooks，不是 Codex `hooks.json` 命令 hooks：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用於鏡像逐字稿記錄
- 透過 Codex `Stop` 中繼的 `before_agent_finalize`
- `agent_end`

Plugins 也可以註冊執行環境中立的工具結果中介軟體，在 OpenClaw
執行工具之後、結果回傳給 Codex 之前，改寫 OpenClaw 動態工具結果。
這不同於公開的 `tool_result_persist` Plugin hook，後者會轉換
OpenClaw 擁有的逐字稿工具結果寫入。

如需 Plugin hook 語意本身，請參閱 [Plugin hooks](/zh-TW/plugins/hooks)
與 [Plugin guard behavior](/zh-TW/tools/plugin)。

harness 預設為關閉。新設定應將 OpenAI 模型參照維持為標準的
`openai/gpt-*`，並在需要原生 app-server 執行時，明確強制使用
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版
`codex/*` 模型參照仍會為了相容性自動選取 harness，但由執行環境支援的
舊版提供者前綴不會顯示為一般模型/提供者選項。

如果 `codex` Plugin 已啟用，但主要模型仍是 `openai-codex/*`，
`openclaw doctor` 會發出警告，而不是變更路由。這是刻意設計：
`openai-codex/*` 仍是 PI Codex OAuth/訂閱路徑，而原生 app-server
執行仍是明確的執行環境選擇。

## 路由對照表

變更設定前請使用此表：

| 期望行為                                    | 模型參照                   | 執行環境設定                           | Plugin 需求                | 預期狀態標籤                   |
| ------------------------------------------- | -------------------------- | -------------------------------------- | -------------------------- | ------------------------------ |
| 透過一般 OpenClaw runner 使用 OpenAI API    | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI 提供者              | `Runtime: OpenClaw Pi Default` |
| 透過 PI 使用 Codex OAuth/訂閱               | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth 提供者  | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 內嵌回合              | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` Plugin             | `Runtime: OpenAI Codex`        |
| 使用保守自動模式的混合提供者                | 提供者特定參照             | `agentRuntime.id: "auto"`              | 選用 Plugin 執行環境       | 取決於選定的執行環境           |
| 明確的 Codex ACP 轉接器工作階段             | 依 ACP 提示/模型而定       | `sessions_spawn` 搭配 `runtime: "acp"` | 健康的 `acpx` 後端         | ACP 任務/工作階段狀態          |

重要的區分是提供者與執行環境：

- `openai-codex/*` 回答「PI 應使用哪個提供者/驗證路由？」
- `agentRuntime.id: "codex"` 回答「哪個迴圈應執行這個
  內嵌回合？」
- `/codex ...` 回答「這個聊天應綁定或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應啟動哪個外部 harness 程序？」

## 選擇正確的模型前綴

OpenAI 系列路由依前綴區分。當你想透過 PI 使用 Codex OAuth 時，請使用
`openai-codex/*`；當你想直接存取 OpenAI API，或正在強制使用原生
Codex app-server harness 時，請使用 `openai/*`：

| 模型參照                                      | 執行環境路徑                               | 使用時機                                                                  |
| --------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 透過 OpenClaw/PI 管線使用 OpenAI 提供者    | 你想使用目前以 `OPENAI_API_KEY` 直接存取的 OpenAI Platform API。          |
| `openai-codex/gpt-5.5`                        | 透過 OpenClaw/PI 使用 OpenAI Codex OAuth   | 你想以預設 PI runner 使用 ChatGPT/Codex 訂閱驗證。                        |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                   | 你想為內嵌代理回合使用原生 Codex app-server 執行。                        |

GPT-5.5 目前在 OpenClaw 中僅支援訂閱/OAuth。PI OAuth 請使用
`openai-codex/gpt-5.5`，或將 `openai/gpt-5.5` 搭配 Codex
app-server harness 使用。一旦 OpenAI 在公開 API 上啟用 GPT-5.5，
`openai/gpt-5.5` 的直接 API 金鑰存取即受支援。

舊版 `codex/gpt-*` 參照仍作為相容別名被接受。Doctor 相容性遷移會將
舊版主要執行環境參照改寫為標準模型參照，並分開記錄執行環境政策；
而僅作為後援的舊版參照會保持不變，因為執行環境是針對整個代理容器設定。
新的 PI Codex OAuth 設定應使用 `openai-codex/gpt-*`；新的原生
app-server harness 設定應使用 `openai/gpt-*` 加上
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前綴區分。當影像理解應透過
OpenAI Codex OAuth 提供者路徑執行時，請使用 `openai-codex/gpt-*`。
當影像理解應透過有界限的 Codex app-server 回合執行時，請使用
`codex/gpt-*`。Codex app-server 模型必須宣告支援影像輸入；純文字
Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效 harness。如果選擇結果令人意外，
請為 `agents/harness` 子系統啟用偵錯記錄，並檢查 Gateway 的結構化
`agent harness selected` 記錄。它包含選定的 harness id、選擇原因、
執行環境/後援政策，以及在 `auto` 模式中每個 Plugin 候選項目的支援結果。

### Doctor 警告代表什麼

當以下條件全都成立時，`openclaw doctor` 會發出警告：

- 隨附的 `codex` Plugin 已啟用或允許
- 某個代理的主要模型是 `openai-codex/*`
- 該代理的有效執行環境不是 `codex`

此警告存在，是因為使用者常預期「Codex Plugin 已啟用」代表
「原生 Codex app-server 執行環境」。OpenClaw 不會做這個跳躍。
此警告表示：

- 如果你原本就打算透過 PI 使用 ChatGPT/Codex OAuth，則**不需要變更**。
- 如果你原本打算使用原生 app-server 執行，請將模型變更為
  `openai/<model>`，並設定 `agentRuntime.id: "codex"`。
- 執行環境變更後，現有工作階段仍需要 `/new` 或 `/reset`，
  因為工作階段執行環境釘選是黏著的。

harness 選擇不是即時工作階段控制。當內嵌回合執行時，OpenClaw
會在該工作階段上記錄選定的 harness id，並在同一個工作階段 id 的後續回合繼續使用它。
若希望未來工作階段使用其他 harness，請變更 `agentRuntime` 設定或
`OPENCLAW_AGENT_RUNTIME`；在現有對話於 PI 與 Codex 之間切換前，請使用
`/new` 或 `/reset` 啟動新的工作階段。這可避免透過兩套不相容的原生工作階段系統
重播同一份逐字稿。

在 harness 釘選出現前建立的舊版工作階段，一旦已有逐字稿歷史，就會被視為
PI 釘選。變更設定後，請使用 `/new` 或 `/reset` 將該對話改用 Codex。

`/status` 會顯示有效的模型執行環境。預設 PI harness 會顯示為
`Runtime: OpenClaw Pi Default`，Codex app-server harness 會顯示為
`Runtime: OpenAI Codex`。

## 需求

- OpenClaw 可使用隨附的 `codex` Plugin。
- Codex app-server `0.125.0` 或更新版本。隨附的 Plugin 預設會管理相容的
  Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 命令不會影響
  一般 harness 啟動。
- app-server 程序或 OpenClaw 的 Codex 驗證橋接器可使用 Codex 驗證。
  本機 stdio app-server 啟動會為每個代理使用 OpenClaw 管理的 Codex home，
  以及隔離的子程序 `HOME`，因此預設不會讀取你的個人
  `~/.codex` 帳號、Skills、Plugins、設定、執行緒狀態或原生
  `$HOME/.agents/skills`。

此 Plugin 會阻擋較舊或無版本的 app-server 交握。這可讓 OpenClaw 維持在
已測試過的協定介面上。

對於即時與 Docker smoke tests，驗證通常來自 Codex CLI 帳號或 OpenClaw
`openai-codex` 驗證設定檔。當沒有帳號存在時，本機 stdio app-server 啟動也可以後援使用
`CODEX_API_KEY` / `OPENAI_API_KEY`。

## 最小設定

使用 `openai/gpt-5.5`，啟用隨附的 Plugin，並強制使用 `codex` harness：

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

將 `agents.defaults.model` 或某個代理模型設定為 `codex/<model>` 的舊版設定，
仍會自動啟用隨附的 `codex` Plugin。新設定應優先使用 `openai/<model>`，
並加上上方明確的 `agentRuntime` 項目。

## 與其他模型並列加入 Codex

如果同一個 agent 應該能在 Codex 與非 Codex 提供者模型之間自由切換，請不要全域設定 `agentRuntime.id: "codex"`。強制指定的 runtime 會套用到該 agent 或 session 的每一個嵌入式回合。如果你在強制使用該 runtime 時選擇 Anthropic 模型，OpenClaw 仍會嘗試 Codex harness，並以封閉方式失敗，而不是悄悄將該回合透過 Pi 路由。

請改用下列其中一種形式：

- 將 Codex 放在專用 agent 上，並設定 `agentRuntime.id: "codex"`。
- 讓預設 agent 維持 `agentRuntime.id: "auto"`，並使用 Pi fallback 供一般混合提供者使用情境。
- 只為相容性使用舊版 `codex/*` 參照。新設定應優先使用 `openai/*`，並搭配明確的 Codex runtime policy。

例如，這會讓預設 agent 使用一般自動選擇，並新增一個獨立的 Codex agent：

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

- 預設的 `main` agent 會使用一般提供者路徑與 Pi 相容性 fallback。
- `codex` agent 會使用 Codex app-server harness。
- 如果 `codex` agent 缺少 Codex 或不受支援，該回合會失敗，而不是悄悄使用 Pi。

## Agent 命令路由

Agents 應依意圖路由使用者請求，而不是只依「Codex」這個詞：

| 使用者要求...                                           | Agent 應使用...                                  |
| -------------------------------------------------------- | ------------------------------------------------ |
|「將此 chat 綁定到 Codex」                                | `/codex bind`                                    |
|「在這裡繼續 Codex thread `<id>`」                        | `/codex resume <id>`                             |
|「顯示 Codex threads」                                    | `/codex threads`                                 |
|「為失敗的 Codex 執行提交支援報告」                       | `/diagnostics [note]`                            |
|「只針對這個附加的 thread 傳送 Codex feedback」           | `/codex diagnostics [note]`                      |
|「使用 Codex 作為此 agent 的 runtime」                    | 將設定變更為 `agentRuntime.id`                   |
|「用我的 ChatGPT/Codex 訂閱搭配一般 OpenClaw」            | `openai-codex/*` 模型參照                        |
|「透過 ACP/acpx 執行 Codex」                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
|「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」   | ACP/acpx，而不是 `/codex`，也不是原生 sub-agents |

只有在 ACP 已啟用、可分派，並由已載入的 runtime backend 支援時，OpenClaw 才會向 agents 宣告 ACP spawn 指引。如果 ACP 不可用，system prompt 與 Plugin skills 不應教 agent ACP 路由。

## 僅 Codex 的部署

當你需要證明每個嵌入式 agent 回合都使用 Codex 時，請強制使用 Codex harness。明確的 Plugin runtime 預設沒有 Pi fallback，因此 `fallback: "none"` 是選用的，但通常可作為有用的文件說明：

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

強制使用 Codex 時，如果 Codex Plugin 已停用、app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。只有在你有意讓 Pi 處理缺少 harness 選擇時，才設定 `OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 每個 agent 的 Codex

你可以讓某個 agent 僅使用 Codex，同時讓預設 agent 保持一般自動選擇：

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

使用一般 session 命令切換 agents 與模型。`/new` 會建立新的 OpenClaw session，而 Codex harness 會視需要建立或繼續其 sidecar app-server thread。`/reset` 會清除該 thread 的 OpenClaw session 綁定，並讓下一個回合再次從目前設定解析 harness。

## 模型探索

預設情況下，Codex Plugin 會向 app-server 詢問可用模型。如果探索失敗或逾時，它會使用內建 fallback catalog：

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

當你希望啟動時避免探測 Codex，並固定使用 fallback catalog，請停用探索：

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

預設情況下，Plugin 會在本機啟動 OpenClaw 管理的 Codex binary：

```bash
codex app-server --listen stdio://
```

受管理的 binary 會宣告為內建 Plugin runtime dependency，並與其餘 `codex` Plugin dependencies 一起 staged。這會讓 app-server 版本與內建 Plugin 綁定，而不是使用本機剛好安裝的另一個 Codex CLI。只有在你有意執行不同 executable 時，才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO 模式啟動本機 Codex harness sessions：`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及 `sandbox: "danger-full-access"`。這是自主 heartbeats 使用的受信任本機 operator 姿態：Codex 可以使用 shell 與網路工具，而不會因無人在場回答的原生核准提示而停下。

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

Guardian 模式會使用 Codex 的原生 auto-review approval path。當 Codex 要求離開 sandbox、寫入 workspace 外部，或新增網路存取等權限時，Codex 會將該核准請求路由到原生 reviewer，而不是人類提示。reviewer 會套用 Codex 的風險框架，並核准或拒絕該特定請求。當你想要比 YOLO 模式更多 guardrails，但仍需要無人值守的 agents 持續推進時，請使用 Guardian。

`guardian` preset 會展開為 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。個別 policy 欄位仍會覆寫 `mode`，因此進階部署可以混合使用 preset 與明確選項。舊版 `guardian_subagent` reviewer 值仍會作為相容性 alias 被接受，但新設定應使用 `auto_review`。

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

Stdio app-server launches 預設會繼承 OpenClaw 的 process environment，但 OpenClaw 會擁有 Codex app-server account bridge，並將 `CODEX_HOME` 與 `HOME` 都設為該 agent 的 OpenClaw state 下的每個 agent 目錄。Codex 自己的 skill loader 會讀取 `$CODEX_HOME/skills` 與 `$HOME/.agents/skills`，因此這兩個值都會針對本機 app-server launches 隔離。這會讓 Codex-native skills、plugins、config、accounts 與 thread state 限定在 OpenClaw agent 範圍內，而不是從 operator 個人的 Codex CLI home 洩漏進來。

OpenClaw plugins 與 OpenClaw skill snapshots 仍會透過 OpenClaw 自己的 Plugin registry 與 skill loader 流動。個人 Codex CLI assets 不會。如果你有實用的 Codex CLI skills 或 plugins 應成為 OpenClaw agent 的一部分，請明確 inventory 它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider 會將 skills 複製到目前的 OpenClaw agent workspace。Codex native plugins、hooks 與 config files 會被報告或封存以供手動審查，而不是自動啟用，因為它們可以執行命令、公開 MCP servers，或攜帶 credentials。

Auth 會依下列順序選擇：

1. 該 agent 的明確 OpenClaw Codex auth profile。
2. app-server 在該 agent 的 Codex home 中既有的 account。
3. 僅限本機 stdio app-server launches，當沒有 app-server account 且仍需要 OpenAI auth 時，使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱式 Codex auth profile 時，會從產生的 Codex child process 移除 `CODEX_API_KEY` 與 `OPENAI_API_KEY`。這會讓 Gateway 層級的 API keys 仍可用於 embeddings 或直接 OpenAI models，而不會讓原生 Codex app-server 回合意外透過 API 計費。明確的 Codex API-key profiles 與本機 stdio env-key fallback 會使用 app-server login，而不是繼承的 child-process env。WebSocket app-server connections 不會收到 Gateway env API-key fallback；請使用明確 auth profile 或 remote app-server 自己的 account。

如果部署需要額外的環境隔離，請將那些 variables 加到 `appServer.clearEnv`：

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
| `transport`         | `"stdio"`                                | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                               |
| `command`           | 受管理的 Codex 二進位檔                  | stdio 傳輸使用的可執行檔。保留未設定即可使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸使用的引數。                                                                                                                                                                                                               |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                           |
| `authToken`         | 未設定                                   | WebSocket 傳輸使用的 Bearer token。                                                                                                                                                                                                  |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                              |
| `clearEnv`          | `[]`                                     | OpenClaw 建立繼承環境後，從產生的 stdio app-server 程序中移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給 OpenClaw 在本機啟動時用於每個代理程式的 Codex 隔離。                                                                |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面呼叫的逾時時間。                                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 審查執行的預設組態。                                                                                                                                                                                               |
| `approvalPolicy`    | `"never"`                                | 傳送到執行緒開始/恢復/回合的原生 Codex 核准政策。                                                                                                                                                                                   |
| `sandbox`           | `"danger-full-access"`                   | 傳送到執行緒開始/恢復的原生 Codex 沙箱模式。                                                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審查原生核准提示。`guardian_subagent` 仍是舊版別名。                                                                                                                                                  |
| `serviceTier`       | 未設定                                   | 選用的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                                              |

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受限制：每個 Codex `item/tool/call` 要求都必須在
30 秒內收到 OpenClaw 回應。逾時時，OpenClaw 會在支援的情況下中止工具
訊號，並向 Codex 回傳失敗的動態工具回應，讓該回合可以繼續，而不是讓工作階段停留在
`processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 要求後，測試框架
也預期 Codex 以 `turn/completed` 完成原生回合。如果
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
`plugins.entries.codex.config.appServer.mode: "guardian"`，或針對一次性本機測試使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。可重複部署時偏好使用設定，
因為它會讓 Plugin 行為與其餘 Codex 測試框架設定保留在同一個
已審查的檔案中。

## 電腦使用

電腦使用在自己的設定指南中說明：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會內建桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex app-server、驗證
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間處理原生
MCP 工具呼叫。

若要在 Codex marketplace 流程之外直接存取 TryCua 驅動程式，請使用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊
`cua-driver mcp`。
請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 Codex 擁有的電腦使用
與直接 MCP 註冊之間的差異。

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

可以從命令介面檢查或安裝設定：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

電腦使用為 macOS 專用，且在
Codex MCP 伺服器可以控制應用程式前，可能需要本機作業系統權限。如果 `computerUse.enabled` 為 true 且 MCP
伺服器不可用，Codex 模式回合會在執行緒開始前失敗，而不是在沒有原生電腦使用工具的情況下
靜默執行。請參閱
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 marketplace 選項、
遠端目錄限制、狀態原因和疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex
尚未探索到本機 marketplace，OpenClaw 可以從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊標準
內建 Codex Desktop marketplace。變更執行階段或電腦使用設定後，請使用 `/new` 或 `/reset`，
讓既有工作階段不會保留舊的 PI 或 Codex 執行緒繫結。

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

guardian 審查的 Codex 核准：

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
既有 Codex 執行緒時，下一個回合會再次將目前選取的
OpenAI 模型、供應商、核准政策、沙箱和服務層級傳送到
app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留
執行緒繫結，但要求 Codex 使用新選取的模型繼續。

## Codex 命令

內建 Plugin 會將 `/codex` 註冊為授權的斜線命令。它是
通用命令，適用於任何支援 OpenClaw 文字命令的頻道。

常用形式：

- `/codex status` 顯示即時 app-server 連線能力、模型、帳戶、速率限制、MCP 伺服器和 skills。
- `/codex models` 列出即時 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 執行緒。
- `/codex resume <thread-id>` 將目前的 OpenClaw 工作階段附加到既有 Codex 執行緒。
- `/codex compact` 要求 Codex app-server 壓縮附加的執行緒。
- `/codex review` 為附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 在傳送附加執行緒的 Codex 診斷回饋前先詢問。
- `/codex computer-use status` 檢查已設定的電腦使用 Plugin 和 MCP 伺服器。
- `/codex computer-use install` 安裝已設定的電腦使用 Plugin 並重新載入 MCP 伺服器。
- `/codex account` 顯示帳戶和速率限制狀態。
- `/codex mcp` 列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 列出 Codex app-server skills。

### 常用偵錯工作流程

當 Codex 支援的代理程式在 Telegram、Discord、Slack
或其他頻道中出現意外行為時，請從發生問題的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload` 或另一個描述你所見情況的簡短註記。
2. 核准診斷要求一次。該核准會建立本機 Gateway
   診斷 zip，並且因為工作階段正在使用 Codex 測試框架，也會
   將相關的 Codex 回饋套件傳送到 OpenAI 伺服器。
3. 將完成的診斷回覆複製到錯誤報告或支援討論串中。
   其中包含本機套件路徑、隱私摘要、OpenClaw 工作階段 ID、
   Codex 執行緒 ID，以及每個 Codex 執行緒的 `Inspect locally` 行。
4. 如果想自行偵錯該次執行，請在終端機中執行列印出的 `Inspect locally`
   命令。它看起來像 `codex resume <thread-id>`，並會開啟
   原生 Codex 執行緒，讓你檢查對話、在本機繼續，
   或詢問 Codex 為何選擇特定工具或計畫。

只有在你特別想要目前附加執行緒的 Codex 意見回饋上傳，而不需要完整 OpenClaw Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。對大多數支援回報來說，`/diagnostics [note]` 是更好的起點，因為它會在同一則回覆中把本機 Gateway 狀態與 Codex 執行緒 ID 串在一起。完整的隱私模型與群組聊天行為請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

核心 OpenClaw 也會將僅限擁有者使用的 `/diagnostics [note]` 暴露為一般 Gateway 診斷命令。它的核准提示會顯示敏感資料前言、連結到[診斷匯出](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec 核准請求 `openclaw gateway diagnostics export --json`。不要用 allow-all 規則核准診斷。核准後，OpenClaw 會傳送一份可貼上的報告，其中包含本機套件路徑與 manifest 摘要。當作用中的 OpenClaw 工作階段正在使用 Codex harness 時，同一個核准也會授權將相關的 Codex 意見回饋套件傳送到 OpenAI 伺服器。核准提示會說明將會傳送 Codex 意見回饋，但在核准前不會列出 Codex 工作階段或執行緒 ID。

如果擁有者在群組聊天中呼叫 `/diagnostics`，OpenClaw 會保持共享頻道簡潔：群組只會收到一則短通知，而診斷前言、核准提示，以及 Codex 工作階段/執行緒 ID 會透過私人核准路由傳送給擁有者。如果沒有私人擁有者路由，OpenClaw 會拒絕群組請求，並要求擁有者從 DM 執行。

已核准的 Codex 上傳會呼叫 Codex app-server `feedback/upload`，並要求 app-server 在可用時包含每個列出執行緒與衍生 Codex 子執行緒的記錄。上傳會透過 Codex 的一般意見回饋路徑傳送到 OpenAI 伺服器；如果該 app-server 停用了 Codex 意見回饋，命令會回傳 app-server 錯誤。完成的診斷回覆會列出已傳送執行緒的頻道、OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機 `codex resume <thread-id>` 命令。如果你拒絕或忽略核准，OpenClaw 不會列印那些 Codex ID。這項上傳不會取代本機 Gateway 診斷匯出。

`/codex resume` 會寫入 harness 在一般回合中使用的同一個 sidecar 綁定檔。下一則訊息時，OpenClaw 會恢復該 Codex 執行緒，將目前選取的 OpenClaw 模型傳入 app-server，並保持延伸歷史記錄啟用。

### 從 CLI 檢查 Codex 執行緒

了解有問題的 Codex 執行時，最快的方式通常是直接開啟原生 Codex 執行緒：

```sh
codex resume <thread-id>
```

當你在頻道對話中注意到錯誤，並且想檢查有問題的 Codex 工作階段、在本機繼續它，或詢問 Codex 為何做出特定工具或推理選擇時，請使用這個方式。最簡單的路徑通常是先執行 `/diagnostics [note]`：核准後，完成的報告會列出每個 Codex 執行緒，並列印一個 `Inspect locally` 命令，例如 `codex resume <thread-id>`。你可以直接把該命令複製到終端機。

你也可以從目前聊天的 `/codex binding`，或最近 Codex app-server 執行緒的 `/codex threads [filter]` 取得執行緒 ID，然後在 shell 中執行同一個 `codex resume` 命令。

命令介面需要 Codex app-server `0.125.0` 或更新版本。如果未來或自訂 app-server 未暴露該 JSON-RPC 方法，個別控制方法會回報為 `unsupported by this Codex app-server`。

## Hook 邊界

Codex harness 有三個 Hook 層：

| 層                                    | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin Hook                  | OpenClaw                 | 跨 PI 與 Codex harness 的產品/Plugin 相容性。                       |
| Codex app-server 擴充中介軟體         | OpenClaw bundled plugins | 圍繞 OpenClaw 動態工具的逐回合 adapter 行為。                       |
| Codex 原生 Hook                       | Codex                    | 來自 Codex 設定的底層 Codex 生命週期與原生工具政策。               |

OpenClaw 不使用專案或全域 Codex `hooks.json` 檔案來路由 OpenClaw Plugin 行為。對於受支援的原生工具與權限橋接，OpenClaw 會為 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入逐執行緒 Codex 設定。其他 Codex Hook，例如 `SessionStart` 和 `UserPromptSubmit`，仍然是 Codex 層級的控制；它們不會在 v1 合約中暴露為 OpenClaw Plugin Hook。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 請求呼叫後執行工具，因此 OpenClaw 會在 harness adapter 中觸發它所擁有的 Plugin 與中介軟體行為。對於 Codex 原生工具，Codex 擁有標準工具記錄。OpenClaw 可以鏡像選定事件，但除非 Codex 透過 app-server 或原生 Hook callback 暴露該操作，否則 OpenClaw 無法重寫原生 Codex 執行緒。

Compaction 與 LLM 生命週期投影來自 Codex app-server 通知與 OpenClaw adapter 狀態，而不是原生 Codex Hook 命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是 adapter 層級觀察結果，不是 Codex 內部請求或 Compaction payload 的逐位元組擷取。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知會被投影為 `codex_app_server.hook` 代理事件，用於軌跡與除錯。它們不會呼叫 OpenClaw Plugin Hook。

## V1 支援合約

Codex 模式不是在底層換成不同模型呼叫的 PI。Codex 擁有更多原生模型迴圈，而 OpenClaw 會圍繞該邊界調整其 Plugin 與工作階段介面。

Codex runtime v1 支援：

| 介面                                          | 支援                                    | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈                 | 支援                                    | Codex app-server 擁有 OpenAI 回合、原生執行緒恢復，以及原生工具延續。                                                                                                                                |
| OpenClaw 頻道路由與傳遞                       | 支援                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他頻道保持在模型 runtime 之外。                                                                                                                     |
| OpenClaw 動態工具                             | 支援                                    | Codex 會要求 OpenClaw 執行這些工具，因此 OpenClaw 仍在執行路徑中。                                                                                                                                   |
| Prompt 與內容 Plugin                          | 支援                                    | OpenClaw 會建立 prompt overlay，並在啟動或恢復執行緒前將內容投影到 Codex 回合中。                                                                                                                    |
| 內容引擎生命週期                              | 支援                                    | 組裝、擷取或回合後維護，以及內容引擎 Compaction 協調會針對 Codex 回合執行。                                                                                                                         |
| 動態工具 Hook                                 | 支援                                    | `before_tool_call`、`after_tool_call` 和工具結果中介軟體會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                         |
| 生命週期 Hook                                 | 作為 adapter 觀察結果支援               | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以誠實的 Codex 模式 payload 觸發。                                                                                |
| 最終答案修訂閘門                              | 透過原生 Hook relay 支援                | Codex `Stop` 會被轉送到 `before_agent_finalize`；`revise` 會在最終化前要求 Codex 再執行一次模型 pass。                                                                                               |
| 原生 shell、patch 和 MCP 封鎖或觀察           | 透過原生 Hook relay 支援                | Codex `PreToolUse` 和 `PostToolUse` 會針對已承諾的原生工具介面被轉送，包括 Codex app-server `0.125.0` 或更新版本上的 MCP payload。支援封鎖；不支援引數重寫。                                       |
| 原生權限政策                                  | 透過原生 Hook relay 支援                | Codex `PermissionRequest` 可以在 runtime 暴露時透過 OpenClaw 政策路由。如果 OpenClaw 沒有回傳決策，Codex 會繼續透過其一般 guardian 或使用者核准路徑。                                               |
| App-server 軌跡擷取                           | 支援                                    | OpenClaw 會記錄它傳送給 app-server 的請求，以及它收到的 app-server 通知。                                                                                                                           |

Codex runtime v1 不支援：

| 表面                                                | V1 邊界                                                                                                                                        | 未來路徑                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生工具前置鉤子可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。                                                                      | 需要 Codex 鉤子／架構支援替換工具輸入。                                                   |
| 可編輯的 Codex 原生逐字稿歷史                       | Codex 擁有標準原生對話串歷史。OpenClaw 擁有鏡像並可投射未來內容脈絡，但不應變更不受支援的內部項目。                                          | 如果需要原生對話串手術，請新增明確的 Codex app-server API。                              |
| Codex 原生工具記錄的 `tool_result_persist`          | 該鉤子會轉換 OpenClaw 擁有的逐字稿寫入，而非 Codex 原生工具記錄。                                                                              | 可以鏡像轉換後的記錄，但標準重寫需要 Codex 支援。                                        |
| 豐富的原生 Compaction 中繼資料                      | OpenClaw 會觀察 Compaction 開始與完成，但不會收到穩定的保留／捨棄清單、權杖差異或摘要承載資料。                                              | 需要更豐富的 Codex Compaction 事件。                                                     |
| Compaction 介入                                     | 目前在 Codex 模式中，OpenClaw Compaction 鉤子屬於通知層級。                                                                                   | 如果 plugins 需要否決或重寫原生 Compaction，請新增 Codex Compaction 前置／後置鉤子。      |
| 逐位元組模型 API 請求擷取                           | OpenClaw 可以擷取 app-server 請求與通知，但 Codex 核心會在內部建構最終 OpenAI API 請求。                                                      | 需要 Codex 模型請求追蹤事件或除錯 API。                                                   |

## 工具、媒體與 Compaction

Codex harness 只會變更低階嵌入式代理執行器。

OpenClaw 仍會建構工具清單，並從 harness 接收動態工具結果。文字、影像、影片、音樂、TTS、核准與訊息工具輸出會繼續透過一般 OpenClaw 傳遞路徑。

原生鉤子轉送刻意保持通用，但 v1 支援合約僅限於 OpenClaw 測試過的 Codex 原生工具與權限路徑。在 Codex runtime 中，這包括 shell、patch，以及 MCP `PreToolUse`、`PostToolUse` 和 `PermissionRequest` 承載資料。在 runtime 合約明確命名前，請勿假設每個未來 Codex 鉤子事件都是 OpenClaw Plugin 表面。

對於 `PermissionRequest`，OpenClaw 只會在政策作出判斷時回傳明確的允許或拒絕決策。沒有決策的結果不是允許。Codex 會將其視為沒有鉤子決策，並落入自己的 guardian 或使用者核准路徑。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准請求會透過 OpenClaw 的 Plugin 核准流程路由。Codex `request_user_input` 提示會傳回原始聊天，而下一則排隊的後續訊息會回答該原生伺服器請求，而不是被導向為額外內容脈絡。其他 MCP 請求仍會失敗關閉。

作用中執行佇列導向會對應到 Codex app-server `turn/steer`。使用預設 `messages.queue.mode: "steer"` 時，OpenClaw 會在已設定的靜默視窗內批次處理排隊的聊天訊息，並依抵達順序將它們作為一個 `turn/steer` 請求傳送。舊版 `queue` 模式會傳送個別 `turn/steer` 請求。Codex 審查與手動 Compaction 回合可能會拒絕同回合導向，在這種情況下，當所選模式允許備援時，OpenClaw 會使用後續佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當所選模型使用 Codex harness 時，原生對話串 Compaction 會委派給 Codex app-server。OpenClaw 會保留逐字稿鏡像，用於頻道歷史、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。鏡像包含使用者提示、最終助理文字，以及 app-server 發出時的輕量 Codex 推理或計畫記錄。目前，OpenClaw 只記錄原生 Compaction 開始與完成訊號。它尚未公開人類可讀的 Compaction 摘要，也尚未提供可稽核的清單來顯示 Codex 在 Compaction 後保留了哪些項目。

因為 Codex 擁有標準原生對話串，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

媒體生成不需要 PI。影像、影片、音樂、PDF、TTS 與媒體理解會繼續使用相符的供應商／模型設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 疑難排解

**Codex 未顯示為一般 `/model` 供應商：** 對新設定而言，這是預期行為。選取具有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` 參照），啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除 `codex`。

**OpenClaw 使用 PI 而非 Codex：** 當沒有 Codex harness 宣告該次執行時，`agentRuntime.id: "auto"` 仍可使用 PI 作為相容性後端。測試時請設定 `agentRuntime.id: "codex"` 以強制選取 Codex。除非你明確設定 `agentRuntime.fallback: "pi"`，否則強制 Codex runtime 現在會失敗，而不是退回 PI。一旦選取 Codex app-server，其失敗會直接浮現，不需要額外的備援設定。

**app-server 被拒絕：** 升級 Codex，讓 app-server 交握回報版本 `0.125.0` 或更新版本。相同版本的預發布版本或帶有建置後綴的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，會被拒絕，因為穩定的 `0.125.0` 協定下限才是 OpenClaw 測試的目標。

**模型探索速度很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket 傳輸立即失敗：** 檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server 協定版本。

**非 Codex 模型使用 PI：** 除非你為該代理強制設定 `agentRuntime.id: "codex"`，或選取舊版 `codex/*` 參照，否則這是預期行為。一般 `openai/gpt-*` 和其他供應商參照在 `auto` 模式中會留在其一般供應商路徑上。如果你強制設定 `agentRuntime.id: "codex"`，該代理的每個嵌入式回合都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具未執行：** 從新的工作階段檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果仍然存在，請重新啟動 gateway 以清除過期的原生鉤子註冊。如果 `computer-use.list_apps` 逾時，請重新啟動 Codex Computer Use 或 Codex Desktop，然後重試。

## 相關

- [代理 harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [代理 runtimes](/zh-TW/concepts/agent-runtimes)
- [模型供應商](/zh-TW/concepts/model-providers)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin 鉤子](/zh-TW/plugins/hooks)
- [組態參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
