---
read_when:
    - 你想使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅限 Codex 的部署失敗，而不是回退到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-04-30T03:23:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 讓 OpenClaw 透過 Codex app-server 執行嵌入式代理回合，而不是使用內建 PI harness。

當你希望 Codex 擁有低階代理工作階段時使用此方式：模型探索、原生執行緒續接、原生 Compaction，以及 app-server 執行。OpenClaw 仍然擁有聊天頻道、工作階段檔案、模型選擇、工具、核准、媒體傳遞，以及可見的逐字稿鏡像。

如果你正在嘗試建立方向感，請從
[代理執行環境](/zh-TW/concepts/agent-runtimes)開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行環境，而 Telegram、Discord、Slack 或其他頻道仍然是通訊介面。

## 此 Plugin 會改變什麼

隨附的 `codex` Plugin 提供數個獨立能力：

| 能力                              | 使用方式                                            | 它的作用                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式執行環境                | `agentRuntime.id: "codex"`                          | 透過 Codex app-server 執行 OpenClaw 嵌入式代理回合。                          |
| 原生聊天控制指令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話綁定並控制 Codex app-server 執行緒。                                |
| Codex app-server 提供者/目錄      | `codex` internals, surfaced through the harness     | 讓執行環境探索並驗證 app-server 模型。                                        |
| Codex 媒體理解路徑                | `codex/*` image-model compatibility paths           | 針對支援的影像理解模型執行有界的 Codex app-server 回合。                      |
| 原生 hook relay                   | Plugin hooks around Codex-native events             | 讓 OpenClaw 觀察/阻擋支援的 Codex 原生工具/完成事件。                         |

啟用 Plugin 會讓這些能力可用。它**不會**：

- 開始對每個 OpenAI 模型使用 Codex
- 將 `openai-codex/*` 模型參照轉換為原生執行環境
- 讓 ACP/acpx 成為預設 Codex 路徑
- 熱切換已經記錄 PI 執行環境的既有工作階段
- 取代 OpenClaw 頻道傳遞、工作階段檔案、auth-profile 儲存或訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制指令介面。如果 Plugin 已啟用，且使用者要求從聊天中綁定、續接、導向、停止或檢查 Codex 執行緒，代理應優先使用 `/codex ...` 而不是 ACP。當使用者要求 ACP/acpx 或正在測試 ACP Codex 配接器時，ACP 仍是明確的備援。

原生 Codex 回合會保留 OpenClaw Plugin hooks 作為公開相容層。這些是程序內 OpenClaw hooks，不是 Codex `hooks.json` 指令 hooks：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用於鏡像逐字稿記錄
- `before_agent_finalize` 透過 Codex `Stop` relay
- `agent_end`

Plugins 也可以註冊執行環境中立的工具結果中介軟體，以便在 OpenClaw 執行工具之後、結果回傳給 Codex 之前，改寫 OpenClaw 動態工具結果。這與公開的 `tool_result_persist` Plugin hook 分開，後者會轉換 OpenClaw 擁有的逐字稿工具結果寫入。

如需 Plugin hook 語意本身，請參閱 [Plugin hooks](/zh-TW/plugins/hooks)
與 [Plugin guard 行為](/zh-TW/tools/plugin)。

harness 預設關閉。新設定應將 OpenAI 模型參照維持為標準的 `openai/gpt-*`，並在需要原生 app-server 執行時，明確強制
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版 `codex/*` 模型參照仍會為了相容性自動選擇 harness，但由執行環境支援的舊版提供者前綴不會顯示為一般模型/提供者選項。

如果 `codex` Plugin 已啟用，但主要模型仍是
`openai-codex/*`，`openclaw doctor` 會發出警告，而不是變更路由。這是刻意的：`openai-codex/*` 仍然是 PI Codex OAuth/訂閱路徑，而原生 app-server 執行仍是明確的執行環境選擇。

## 路由對照表

變更設定前請使用此表：

| 期望行為                                    | 模型參照                   | 執行環境設定                           | Plugin 需求                 | 預期狀態標籤                 |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 透過一般 OpenClaw runner 使用 OpenAI API    | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI 提供者               | `Runtime: OpenClaw Pi Default` |
| 透過 PI 使用 Codex OAuth/訂閱               | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth 提供者   | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式回合            | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` Plugin              | `Runtime: OpenAI Codex`        |
| 採保守自動模式的混合提供者                  | 提供者特定參照             | `agentRuntime.id: "auto"`              | 選用的 Plugin 執行環境      | 取決於所選執行環境             |
| 明確的 Codex ACP 配接器工作階段             | 取決於 ACP prompt/model    | `sessions_spawn` with `runtime: "acp"` | 健康的 `acpx` 後端          | ACP 任務/工作階段狀態          |

重要分界是提供者與執行環境：

- `openai-codex/*` 回答「PI 應使用哪個提供者/auth 路由？」
- `agentRuntime.id: "codex"` 回答「哪個迴圈應執行這個嵌入式回合？」
- `/codex ...` 回答「這個聊天應綁定或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應啟動哪個外部 harness 程序？」

## 選擇正確的模型前綴

OpenAI 系列路由依前綴區分。當你想透過 PI 使用 Codex OAuth 時，請使用 `openai-codex/*`；當你想直接存取 OpenAI API，或正在強制使用原生 Codex app-server harness 時，請使用 `openai/*`：

| 模型參照                                      | 執行環境路徑                                | 使用時機                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 透過 OpenClaw/PI plumbing 的 OpenAI 提供者   | 你想搭配 `OPENAI_API_KEY` 使用目前直接的 OpenAI Platform API 存取。       |
| `openai-codex/gpt-5.5`                        | 透過 OpenClaw/PI 的 OpenAI Codex OAuth       | 你想搭配預設 PI runner 使用 ChatGPT/Codex 訂閱 auth。                    |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | 你想為嵌入式代理回合使用原生 Codex app-server 執行。                    |

GPT-5.5 目前在 OpenClaw 中僅支援訂閱/OAuth。PI OAuth 請使用
`openai-codex/gpt-5.5`，或搭配 Codex app-server harness 使用
`openai/gpt-5.5`。一旦 OpenAI 在公開 API 啟用 GPT-5.5，就支援
`openai/gpt-5.5` 的直接 API key 存取。

舊版 `codex/gpt-*` 參照仍會作為相容別名被接受。Doctor 相容性遷移會將舊版主要執行環境參照改寫為標準模型參照，並另外記錄執行環境政策；而僅作為備援的舊版參照會保持不變，因為執行環境是為整個代理容器設定。新的 PI Codex OAuth 設定應使用 `openai-codex/gpt-*`；新的原生 app-server harness 設定應使用 `openai/gpt-*` 加上
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前綴分界。當影像理解應透過 OpenAI Codex OAuth 提供者路徑執行時，請使用
`openai-codex/gpt-*`。當影像理解應透過有界的 Codex app-server 回合執行時，請使用 `codex/gpt-*`。Codex app-server 模型必須宣告支援影像輸入；純文字 Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效 harness。如果選擇出乎意料，請為 `agents/harness` 子系統啟用偵錯記錄，並檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含所選 harness id、選擇原因、執行環境/備援政策，以及在 `auto` 模式下各 Plugin 候選項的支援結果。

### doctor 警告的意義

當下列全部為真時，`openclaw doctor` 會發出警告：

- 隨附的 `codex` Plugin 已啟用或被允許
- 代理的主要模型是 `openai-codex/*`
- 該代理的有效執行環境不是 `codex`

這個警告存在，是因為使用者常預期「Codex Plugin 已啟用」就代表「原生 Codex app-server 執行環境」。OpenClaw 不會做這個跳躍。此警告表示：

- 如果你原本就打算透過 PI 使用 ChatGPT/Codex OAuth，**不需要變更**。
- 如果你原本打算使用原生 app-server 執行，請將模型改為 `openai/<model>` 並設定
  `agentRuntime.id: "codex"`。
- 執行環境變更後，既有工作階段仍需要 `/new` 或 `/reset`，因為工作階段執行環境釘選具有黏性。

harness 選擇不是即時工作階段控制。當嵌入式回合執行時，OpenClaw 會在該工作階段上記錄所選 harness id，並在同一工作階段 id 的後續回合持續使用它。當你希望未來工作階段使用另一個 harness 時，請變更 `agentRuntime` 設定或 `OPENCLAW_AGENT_RUNTIME`；在 PI 與 Codex 之間切換既有對話前，請使用 `/new` 或 `/reset` 開始新的工作階段。這可避免將同一份逐字稿透過兩套不相容的原生工作階段系統重播。

在 harness 釘選之前建立的舊版工作階段，一旦已有逐字稿歷史，就會被視為已釘選到 PI。變更設定後，請使用 `/new` 或 `/reset` 讓該對話改用 Codex。

`/status` 會顯示有效模型執行環境。預設 PI harness 會顯示為
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 會顯示為
`Runtime: OpenAI Codex`。

## 需求

- OpenClaw 可使用隨附的 `codex` Plugin。
- Codex app-server `0.125.0` 或更新版本。隨附的 Plugin 預設會管理相容的 Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 指令不會影響一般 harness 啟動。
- app-server 程序或 OpenClaw 的 Codex auth bridge 可取得 Codex auth。

Plugin 會阻擋較舊或未版本化的 app-server handshake。這會讓 OpenClaw 維持在已測試過的協定介面上。

對於 live 與 Docker smoke tests，auth 通常來自 Codex CLI 帳號或 OpenClaw `openai-codex` auth profile。當沒有帳號時，本機 stdio app-server 啟動也可以退回使用 `CODEX_API_KEY` / `OPENAI_API_KEY`。

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

將 `agents.defaults.model` 或代理模型設為 `codex/<model>` 的舊版設定，仍會自動啟用隨附的 `codex` Plugin。新設定應優先使用 `openai/<model>` 加上上方明確的 `agentRuntime` 項目。

## 與其他模型並用 Codex

如果同一個代理應可在 Codex 與非 Codex 提供者模型之間自由切換，請不要全域設定 `agentRuntime.id: "codex"`。強制執行環境會套用到該代理或工作階段的每個嵌入式回合。如果你在強制使用該執行環境時選擇 Anthropic 模型，OpenClaw 仍會嘗試 Codex harness，並封閉式失敗，而不是默默將該回合透過 PI 路由。

改用以下其中一種形態：

- 將 Codex 放在使用 `agentRuntime.id: "codex"` 的專用代理程式上。
- 將預設代理程式保留在 `agentRuntime.id: "auto"`，並使用 PI fallback 供一般混合
  提供者使用。
- 僅為相容性使用舊版 `codex/*` 參照。新設定應偏好
  `openai/*` 加上明確的 Codex runtime policy。

例如，這會將預設代理程式保留在一般自動選擇，
並加入一個獨立的 Codex 代理程式：

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

使用此形態時：

- 預設 `main` 代理程式會使用一般提供者路徑與 PI 相容性 fallback。
- `codex` 代理程式會使用 Codex app-server harness。
- 如果 Codex 對 `codex` 代理程式缺失或不受支援，該回合會失敗，
  而不是悄悄使用 PI。

## 代理程式命令路由

代理程式應依意圖路由使用者要求，而不是只依據「Codex」這個字：

| 使用者要求...                                            | 代理程式應使用...                                 |
| -------------------------------------------------------- | ------------------------------------------------ |
| 「將這個聊天綁定到 Codex」                              | `/codex bind`                                    |
| 「在這裡繼續 Codex thread `<id>`」                       | `/codex resume <id>`                             |
| 「顯示 Codex threads」                                   | `/codex threads`                                 |
| 「為一次不良 Codex 執行提交支援報告」                    | `/diagnostics [note]`                            |
| 「只為這個附加 thread 傳送 Codex feedback」              | `/codex diagnostics [note]`                      |
| 「使用 Codex 作為此代理程式的 runtime」                  | 將設定變更為 `agentRuntime.id`                   |
| 「搭配一般 OpenClaw 使用我的 ChatGPT/Codex 訂閱」        | `openai-codex/*` model refs                      |
| 「透過 ACP/acpx 執行 Codex」                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」  | ACP/acpx，而非 `/codex`，也不是原生子代理程式    |

OpenClaw 只會在 ACP 已啟用、可分派，且由已載入的 runtime backend 支援時，
才向代理程式宣告 ACP spawn 指引。如果 ACP 不可用，
系統提示與 Plugin skills 不應教導代理程式 ACP
路由。

## 僅 Codex 的部署

當你需要證明每個嵌入式代理程式回合都使用 Codex 時，請強制使用 Codex harness。
明確的 Plugin runtime 預設沒有 PI fallback，因此
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

在強制使用 Codex 時，如果 Codex Plugin 已停用、
app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。只有在你有意讓 PI 處理
缺失的 harness 選擇時，才設定
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 逐代理程式 Codex

你可以讓一個代理程式僅使用 Codex，同時讓預設代理程式保留一般
自動選擇：

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

使用一般 session 命令切換代理程式與模型。`/new` 會建立新的
OpenClaw session，而 Codex harness 會視需要建立或繼續其 sidecar app-server
thread。`/reset` 會清除此 thread 的 OpenClaw session binding，
並讓下一個回合再次從目前設定解析 harness。

## 模型探索

預設情況下，Codex Plugin 會向 app-server 詢問可用模型。如果
探索失敗或逾時，則會對以下項目使用內建 fallback catalog：

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

## App-server 連線與政策

預設情況下，Plugin 會在本機啟動 OpenClaw 管理的 Codex binary：

```bash
codex app-server --listen stdio://
```

受管理的 binary 會宣告為內建 Plugin runtime dependency，並與其餘
`codex` Plugin dependencies 一起 staged。這會讓 app-server
版本繫結到內建 Plugin，而不是本機剛好安裝的任何獨立 Codex CLI。
只有在你有意執行不同 executable 時，才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO 模式啟動本機 Codex harness sessions：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。這是用於自主 Heartbeat 的受信任本機操作者姿態：
Codex 可以使用 shell 與網路工具，而不會因無人在場回應的原生 approval prompts
而停止。

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

Guardian 模式使用 Codex 的原生 auto-review approval path。當 Codex 要求
離開 sandbox、寫入 workspace 外部，或新增像網路
存取這類權限時，Codex 會將該 approval request 路由到原生 reviewer，而不是
人類提示。reviewer 會套用 Codex 的風險框架，並核准或拒絕
該特定要求。當你需要比 YOLO 模式更多防護措施，但仍需要無人值守的代理程式
持續推進時，請使用 Guardian。

`guardian` preset 會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
個別 policy fields 仍會覆寫 `mode`，因此進階部署可以將
preset 與明確選項混用。較舊的 `guardian_subagent` reviewer value
仍會作為相容性別名接受，但新設定應使用
`auto_review`。

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

Stdio app-server launches 預設會繼承 OpenClaw 的 process environment，
但 OpenClaw 擁有 Codex app-server account bridge。Auth 會依照以下
順序選取：

1. 代理程式的明確 OpenClaw Codex auth profile。
2. app-server 現有的 account，例如本機 Codex CLI ChatGPT sign-in。
3. 僅限本機 stdio app-server launches，當沒有 app-server account，且仍需要 OpenAI auth 時，使用 `CODEX_API_KEY`，接著是
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT subscription-style Codex auth profile 時，會從 spawned Codex child process 中移除
`CODEX_API_KEY` 與 `OPENAI_API_KEY`。這會讓 Gateway-level API keys
仍可供 embeddings 或直接 OpenAI models 使用，而不會意外讓原生 Codex app-server turns
透過 API 計費。明確的 Codex API-key profiles 與本機 stdio env-key fallback 會使用 app-server
login，而不是繼承的 child-process env。WebSocket app-server connections
不會收到 Gateway env API-key fallback；請使用明確的 auth profile，或
遠端 app-server 自己的 account。

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

`appServer.clearEnv` 只會影響 spawned Codex app-server child process。

支援的 `appServer` 欄位：

| 欄位                | 預設值                                   | 意義                                                                                                                                |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                               |
| `command`           | 受管理的 Codex 二進位檔                  | stdio 傳輸使用的可執行檔。保留未設定即可使用受管理的二進位檔；只有在明確覆寫時才設定。                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸使用的引數。                                                                                                              |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                          |
| `authToken`         | 未設定                                   | WebSocket 傳輸使用的 Bearer 權杖。                                                                                                  |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                             |
| `clearEnv`          | `[]`                                     | OpenClaw 建立其繼承環境之後，從產生的 stdio app-server 程序中移除的額外環境變數名稱。                                               |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面呼叫的逾時。                                                                                                     |
| `mode`              | `"yolo"`                                 | YOLO 或守護程式審查執行的預設設定。                                                                                                |
| `approvalPolicy`    | `"never"`                                | 傳送到執行緒啟動/恢復/回合的原生 Codex 核准原則。                                                                                  |
| `sandbox`           | `"danger-full-access"`                   | 傳送到執行緒啟動/恢復的原生 Codex sandbox 模式。                                                                                    |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審查原生核准提示。`guardian_subagent` 仍是舊版別名。                                                  |
| `serviceTier`       | 未設定                                   | 選用的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                              |

OpenClaw 擁有的動態工具呼叫會與 `appServer.requestTimeoutMs` 分開限制：每個 Codex `item/tool/call` 請求都必須在 30 秒內收到 OpenClaw 回應。逾時時，OpenClaw 會在支援的情況下中止工具訊號，並將失敗的動態工具回應傳回給 Codex，讓該回合可以繼續，而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 請求後，測試框架也預期 Codex 以 `turn/completed` 完成原生回合。如果 app-server 在該回應後靜默 60 秒，OpenClaw 會盡力中斷 Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，讓後續聊天訊息不會排在過期的原生回合後方。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。可重複部署時偏好使用設定，因為它會將 Plugin 行為與其餘 Codex 測試框架設定保留在同一個已審查檔案中。

## 電腦使用

電腦使用在自己的設定指南中說明：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會內建桌面控制應用程式，也不會自行執行桌面動作。它會準備 Codex app-server、驗證 `computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間處理原生 MCP 工具呼叫。

若要在 Codex 市集流程之外直接存取 TryCua 驅動程式，請使用 `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊 `cua-driver mcp`。請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 Codex 擁有的電腦使用與直接 MCP 註冊之間的差異。

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

電腦使用僅適用於 macOS，且 Codex MCP 伺服器能控制應用程式之前，可能需要本機作業系統權限。如果 `computerUse.enabled` 為 true 且 MCP 伺服器無法使用，Codex 模式回合會在線程啟動前失敗，而不是在沒有原生電腦使用工具的情況下靜默執行。請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解市集選項、遠端目錄限制、狀態原因和疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex 尚未探索到本機市集，OpenClaw 可以從 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊標準內建的 Codex Desktop 市集。變更執行階段或電腦使用設定後，請使用 `/new` 或 `/reset`，讓現有工作階段不要保留舊的 PI 或 Codex 執行緒繫結。

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

僅限 Codex 的測試框架驗證：

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

守護程式審查的 Codex 核准：

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

模型切換仍由 OpenClaw 控制。當 OpenClaw 工作階段附加到現有 Codex 執行緒時，下一個回合會再次將目前選取的 OpenAI 模型、供應商、核准原則、sandbox 和服務層級傳送到 app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex 使用新選取的模型繼續。

## Codex 命令

內建 Plugin 會將 `/codex` 註冊為已授權的斜線命令。它是通用命令，適用於任何支援 OpenClaw 文字命令的通道。

常見形式：

- `/codex status` 顯示即時 app-server 連線能力、模型、帳戶、速率限制、MCP 伺服器和 Skills。
- `/codex models` 列出即時 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 執行緒。
- `/codex resume <thread-id>` 將目前 OpenClaw 工作階段附加到現有 Codex 執行緒。
- `/codex compact` 要求 Codex app-server 壓縮附加的執行緒。
- `/codex review` 針對附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 在傳送附加執行緒的 Codex 診斷意見回饋前先詢問。
- `/codex computer-use status` 檢查已設定的電腦使用 Plugin 和 MCP 伺服器。
- `/codex computer-use install` 安裝已設定的電腦使用 Plugin 並重新載入 MCP 伺服器。
- `/codex account` 顯示帳戶和速率限制狀態。
- `/codex mcp` 列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 列出 Codex app-server Skills。

### 常見除錯工作流程

當 Codex 支援的代理程式在 Telegram、Discord、Slack 或其他通道中做出令人意外的事情時，請從發生問題的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload`，或輸入另一則描述你所見情況的簡短備註。
2. 核准一次診斷請求。核准會建立本機 Gateway 診斷 zip，且因為工作階段正在使用 Codex 測試框架，也會將相關的 Codex 意見回饋套件傳送到 OpenAI 伺服器。
3. 將完成的診斷回覆複製到錯誤報告或支援討論串。它包含本機套件路徑、隱私摘要、OpenClaw 工作階段 ID、Codex 執行緒 ID，以及每個 Codex 執行緒的 `Inspect locally` 行。
4. 如果你想自行偵錯該次執行，請在終端機中執行印出的 `Inspect locally` 命令。它看起來像 `codex resume <thread-id>`，會開啟原生 Codex 執行緒，讓你可以檢查對話、在本機繼續，或詢問 Codex 為何選擇特定工具或計畫。

只有在你特別想為目前附加的執行緒上傳 Codex 意見回饋，而不需要完整 OpenClaw Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。對於大多數支援報告，`/diagnostics [note]` 是較佳的起點，因為它會在同一則回覆中將本機 Gateway 狀態與 Codex 執行緒 ID 關聯起來。請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)，了解完整隱私模型與群組聊天行為。

核心 OpenClaw 也會公開僅限擁有者的 `/diagnostics [note]`，作為一般 Gateway 診斷命令。其核准提示會顯示敏感資料前言、連結到 [診斷匯出](/zh-TW/gateway/diagnostics)，並每次都透過明確的執行核准請求 `openclaw gateway diagnostics export --json`。請勿使用允許全部規則核准診斷。核准後，OpenClaw 會傳送可貼上的報告，其中包含本機套件路徑與清單摘要。當作用中的 OpenClaw 工作階段使用 Codex 測試框架時，同一個核准也會授權將相關的 Codex 意見回饋套件傳送到 OpenAI 伺服器。核准提示會說明將傳送 Codex 意見回饋，但不會在核准前列出 Codex 工作階段或執行緒 ID。

如果 `/diagnostics` 是由群組聊天中的擁有者叫用，OpenClaw 會保持共享通道乾淨：群組只會收到簡短通知，而診斷前言、核准提示和 Codex 工作階段/執行緒 ID 會透過私人核准路由傳送給擁有者。如果沒有私人擁有者路由，OpenClaw 會拒絕群組請求，並要求擁有者從 DM 執行。

已核准的 Codex 上傳會呼叫 Codex app-server `feedback/upload`，並要求
app-server 在可用時，為每個列出的對話串和衍生的 Codex 子對話串包含記錄。
上傳會透過 Codex 一般的意見回饋路徑送往 OpenAI
伺服器；如果該 app-server 中停用了 Codex 意見回饋，命令會回傳
app-server 錯誤。完成的診斷回覆會列出已傳送對話串的頻道、
OpenClaw 工作階段 ID、Codex 對話串 ID，以及本機 `codex resume <thread-id>`
命令。如果你拒絕或忽略核准，OpenClaw 不會印出那些 Codex ID。這次上傳不會取代本機
Gateway 診斷匯出。

`/codex resume` 會寫入與 harness 用於一般回合相同的附屬繫結檔案。
在下一則訊息中，OpenClaw 會恢復該 Codex 對話串，將目前選取的
OpenClaw 模型傳入 app-server，並保持延伸歷史記錄啟用。

### 從 CLI 檢查 Codex 對話串

理解一次不良 Codex 執行的最快方式，通常是直接開啟原生 Codex
對話串：

```sh
codex resume <thread-id>
```

當你在頻道對話中注意到錯誤，並想檢查有問題的
Codex 工作階段、在本機繼續該工作階段，或詢問 Codex 為什麼做出某個
工具或推理選擇時，請使用這個命令。最簡單的路徑通常是先執行
`/diagnostics [note]`：核准後，完成的報告會列出
每個 Codex 對話串，並印出一個 `Inspect locally` 命令，例如
`codex resume <thread-id>`。你可以將該命令直接複製到終端機中。

你也可以從目前聊天的 `/codex binding`，或近期 Codex app-server 對話串的
`/codex threads [filter]` 取得對話串 ID，然後在 shell 中執行相同的
`codex resume` 命令。

這個命令介面需要 Codex app-server `0.125.0` 或更新版本。如果未來或自訂
app-server 未公開該 JSON-RPC 方法，個別控制方法會回報為
`unsupported by this Codex app-server`。

## Hook 邊界

Codex harness 有三層 hook：

| 層級                                  | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hooks                 | OpenClaw                 | 跨 PI 和 Codex harness 的產品/Plugin 相容性。                       |
| Codex app-server extension middleware | OpenClaw bundled plugins | 圍繞 OpenClaw 動態工具的每回合轉接器行為。                          |
| Codex native hooks                    | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。                |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由
OpenClaw Plugin 行為。對於受支援的原生工具與權限橋接，
OpenClaw 會為 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop` 注入每個對話串的 Codex 設定。其他 Codex hooks，例如 `SessionStart` 和
`UserPromptSubmit`，仍然是 Codex 層級的控制；它們不會在 v1 合約中作為
OpenClaw Plugin hooks 公開。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求呼叫後執行該工具，
因此 OpenClaw 會在 harness 轉接器中觸發它所擁有的 Plugin 和 middleware 行為。對於 Codex 原生工具，Codex 擁有標準工具記錄。
OpenClaw 可以鏡像選定事件，但除非 Codex 透過 app-server 或原生 hook
callbacks 公開該操作，否則它無法重寫原生 Codex 對話串。

Compaction 和 LLM 生命週期投影來自 Codex app-server
通知與 OpenClaw 轉接器狀態，而不是原生 Codex hook 命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是轉接器層級的觀察結果，不是逐位元組捕捉
Codex 內部請求或 Compaction 承載。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知
會投影為 `codex_app_server.hook` 代理事件，用於軌跡與偵錯。
它們不會叫用 OpenClaw Plugin hooks。

## V1 支援合約

Codex 模式不是在底層換成不同模型呼叫的 PI。Codex 擁有更多
原生模型迴圈，而 OpenClaw 會圍繞該邊界調整其 Plugin 和工作階段介面。

Codex runtime v1 支援：

| 介面                                          | 支援情況                                | 原因                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 透過 Codex 的 OpenAI 模型迴圈                 | 支援                                    | Codex app-server 擁有 OpenAI 回合、原生對話串恢復，以及原生工具延續。                                                                                                                                 |
| OpenClaw 頻道路由與傳遞                       | 支援                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他頻道保持在模型 runtime 外部。                                                                                                                       |
| OpenClaw 動態工具                             | 支援                                    | Codex 會要求 OpenClaw 執行這些工具，因此 OpenClaw 仍在執行路徑中。                                                                                                                                    |
| 提示與內容 Plugin                             | 支援                                    | OpenClaw 會在啟動或恢復對話串之前建構提示覆蓋層，並將內容投影到 Codex 回合中。                                                                                                                       |
| 內容引擎生命週期                              | 支援                                    | 組裝、擷取或回合後維護，以及內容引擎 Compaction 協調會針對 Codex 回合執行。                                                                                                                          |
| 動態工具 hooks                                | 支援                                    | `before_tool_call`、`after_tool_call` 和工具結果 middleware 會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                      |
| 生命週期 hooks                                | 作為轉接器觀察結果支援                  | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以真實的 Codex 模式承載觸發。                                                                                     |
| 最終答案修訂閘門                              | 透過原生 hook 轉送支援                  | Codex `Stop` 會轉送到 `before_agent_finalize`；`revise` 會要求 Codex 在最終化之前再進行一次模型傳遞。                                                                                                |
| 原生 shell、patch 和 MCP 封鎖或觀察           | 透過原生 hook 轉送支援                  | Codex `PreToolUse` 和 `PostToolUse` 會針對已承諾的原生工具介面轉送，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 承載。支援封鎖；不支援引數重寫。                                             |
| 原生權限政策                                  | 透過原生 hook 轉送支援                  | Codex `PermissionRequest` 可在 runtime 公開時透過 OpenClaw 政策路由。如果 OpenClaw 未回傳決策，Codex 會透過其一般 guardian 或使用者核准路徑繼續。                                                    |
| App-server 軌跡捕捉                           | 支援                                    | OpenClaw 會記錄它傳送給 app-server 的請求，以及它收到的 app-server 通知。                                                                                                                             |

Codex runtime v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                        | 未來路徑                                                                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生 pre-tool hooks 可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。                                                                  | 需要 Codex hook/schema 支援替換工具輸入。                                                 |
| 可編輯的 Codex 原生 transcript 歷史                 | Codex 擁有標準原生對話串歷史。OpenClaw 擁有鏡像並可投影未來內容，但不應變更不受支援的內部資料。                                              | 如果需要原生對話串手術，請新增明確的 Codex app-server API。                               |
| Codex 原生工具記錄的 `tool_result_persist`          | 該 hook 會轉換 OpenClaw 擁有的 transcript 寫入，而不是 Codex 原生工具記錄。                                                                    | 可以鏡像已轉換的記錄，但標準重寫需要 Codex 支援。                                        |
| 豐富的原生 Compaction 中繼資料                      | OpenClaw 會觀察 Compaction 開始與完成，但不會收到穩定的保留/丟棄清單、token delta 或摘要承載。                                                | 需要更豐富的 Codex Compaction 事件。                                                      |
| Compaction 介入                                     | 目前 OpenClaw Compaction hooks 在 Codex 模式中屬於通知層級。                                                                                   | 如果 Plugin 需要否決或重寫原生 Compaction，請新增 Codex pre/post Compaction hooks。       |
| 逐位元組模型 API 請求捕捉                           | OpenClaw 可以捕捉 app-server 請求與通知，但 Codex core 會在內部建構最終 OpenAI API 請求。                                                     | 需要 Codex model-request 追蹤事件或偵錯 API。                                            |

## 工具、媒體與 Compaction

Codex harness 只會變更低階的嵌入式代理執行器。

OpenClaw 仍會建構工具清單，並從 harness 接收動態工具結果。
文字、圖片、影片、音樂、TTS、核准，以及訊息工具輸出
會繼續透過一般 OpenClaw 傳遞路徑。

原生 hook 轉送刻意保持泛用，但 v1 支援合約
僅限於 OpenClaw 測試的 Codex 原生工具與權限路徑。在
Codex runtime 中，這包含 shell、patch 和 MCP `PreToolUse`、
`PostToolUse` 與 `PermissionRequest` 承載。不要假設每個未來的
Codex hook 事件都是 OpenClaw Plugin 介面，除非 runtime 合約明確命名它。

對於 `PermissionRequest`，只有在政策做出決定時，OpenClaw 才會回傳明確允許或拒絕決策。
沒有決策的結果不是允許。Codex 會將它視為沒有
hook 決策，並落入其自身 guardian 或使用者核准路徑。

當 Codex 將 `_meta.codex_approval_kind` 標記為
`"mcp_tool_call"` 時，Codex MCP 工具核准徵求會透過 OpenClaw 的 Plugin
核准流程路由。Codex `request_user_input` 提示會傳回
來源聊天，而下一則已佇列的後續訊息會回答該原生
伺服器請求，而不是被導向為額外內容。其他 MCP 徵求
請求仍會以關閉方式失敗。

作用中執行佇列導向會對應到 Codex app-server `turn/steer`。使用預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的安靜視窗內批次處理排入佇列的聊天訊息，並依抵達順序將它們作為一個 `turn/steer` 請求送出。舊版 `queue` 模式會送出個別的 `turn/steer` 請求。Codex 審查和手動 Compaction 回合可能會拒絕同一回合導向，在這種情況下，若所選模式允許後援，OpenClaw 會使用後續佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當所選模型使用 Codex harness 時，原生執行緒 Compaction 會委派給 Codex app-server。OpenClaw 會保留轉錄鏡像，用於頻道歷史、搜尋、`/new`、`/reset`，以及日後切換模型或 harness。鏡像包含使用者提示、最終助理文字，以及 app-server 發出時的輕量 Codex 推理或計畫記錄。目前，OpenClaw 只會記錄原生 Compaction 的開始與完成訊號。它尚未公開人類可讀的 Compaction 摘要，或可稽核的清單來列出 Codex 在 Compaction 後保留了哪些項目。

因為 Codex 擁有標準原生執行緒，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入由 OpenClaw 擁有的工作階段轉錄工具結果時套用。

媒體生成不需要 PI。圖片、影片、音樂、PDF、TTS 和媒體理解會繼續使用相符的供應商/模型設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 疑難排解

**Codex 未以一般 `/model` 供應商顯示：** 對新組態而言這是預期行為。請選取具有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` 參照），啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 當沒有 Codex harness 宣告執行時，`agentRuntime.id: "auto"` 仍可使用 PI 作為相容性後端。測試時請設定 `agentRuntime.id: "codex"` 以強制選取 Codex。現在，強制 Codex runtime 會失敗，而不是回退到 PI，除非你明確設定 `agentRuntime.fallback: "pi"`。一旦選取 Codex app-server，其失敗會直接呈現，不需要額外的後援組態。

**app-server 被拒絕：** 請升級 Codex，讓 app-server 交握回報 `0.125.0` 或更新版本。同版本預發行版或附加建置尾碼的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，都會被拒絕，因為 OpenClaw 測試的是穩定版 `0.125.0` 協定下限。

**模型探索速度很慢：** 請降低 `plugins.entries.codex.config.discovery.timeoutMs`，或停用探索。

**WebSocket 傳輸立即失敗：** 請檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server 協定版本。

**非 Codex 模型使用 PI：** 這是預期行為，除非你為該代理程式強制設定了 `agentRuntime.id: "codex"`，或選取了舊版 `codex/*` 參照。一般 `openai/gpt-*` 和其他供應商參照在 `auto` 模式下會維持在其正常供應商路徑。如果你強制設定 `agentRuntime.id: "codex"`，該代理程式的每個嵌入式回合都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具未執行：** 請從新的工作階段執行 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果問題持續，請重新啟動 Gateway 以清除過時的原生 hook 註冊。如果 `computer-use.list_apps` 逾時，請重新啟動 Codex Computer Use 或 Codex Desktop，然後重試。

## 相關內容

- [代理程式 harness Plugin](/zh-TW/plugins/sdk-agent-harness)
- [代理程式 runtime](/zh-TW/concepts/agent-runtimes)
- [模型供應商](/zh-TW/concepts/model-providers)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin hook](/zh-TW/plugins/hooks)
- [組態參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
