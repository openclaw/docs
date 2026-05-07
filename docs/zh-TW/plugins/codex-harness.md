---
read_when:
    - 您想使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行框架設定範例
    - 你希望僅限 Codex 的部署失敗，而不是退回到 PI
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 嵌入式代理回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-07T13:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

隨附的 `codex` Plugin 讓 OpenClaw 透過 Codex 應用程式伺服器執行內嵌代理程式回合，而不是使用內建的 PI 執行框架。

當你希望由 Codex 掌管低階代理程式工作階段時，請使用此方式：模型探索、原生執行緒續接、原生 Compaction，以及應用程式伺服器執行。OpenClaw 仍負責聊天通道、工作階段檔案、模型選擇、工具、核准、媒體傳遞，以及可見逐字稿鏡像。

當來源聊天回合透過 Codex 執行框架執行時，如果部署未明確設定 `messages.visibleReplies`，可見回覆預設會使用 OpenClaw `message` 工具。代理程式仍可私下完成其 Codex 回合；只有在呼叫 `message(action="send")` 時才會張貼到通道。將 `messages.visibleReplies: "automatic"` 設為保留直接聊天最終回覆的舊版自動傳遞路徑。

Codex Heartbeat 回合預設也會取得 `heartbeat_respond` 工具，因此代理程式可以記錄這次喚醒應保持安靜或發出通知，而不必在最終文字中編碼該控制流程。

Heartbeat 專用的主動性指引會作為 Codex 協作模式開發者指令，在 Heartbeat 回合本身送出。一般聊天回合會還原 Codex Default 模式，而不是在其一般執行階段提示中攜帶 Heartbeat 理念。

如果你正在嘗試建立脈絡，請從
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或另一個通道仍是通訊介面。

## 快速設定

多數想要「OpenClaw 中的 Codex」的使用者需要這條路徑：使用 ChatGPT/Codex 訂閱登入，然後透過原生 Codex 應用程式伺服器執行階段來執行內嵌代理程式回合。模型參照仍以 `openai/gpt-*` 作為標準；訂閱驗證來自 Codex 帳號/設定檔，而不是來自 `openai-codex/*` 模型前綴。

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
      },
    },
  },
}
```

如果你的設定使用 `plugins.allow`，也請將 `codex` 納入其中：

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

不要在設定中使用 `openai-codex/gpt-*`。該前綴是舊版路徑，`openclaw doctor --fix` 會將主要模型、備援、Heartbeat/子代理程式/Compaction 覆寫、hook、通道覆寫，以及過時的持久化工作階段路徑釘選，全數重寫為 `openai/gpt-*`。

## 此 Plugin 變更了什麼

隨附的 `codex` Plugin 提供數個獨立能力：

| 能力                              | 使用方式                                            | 功能                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生內嵌執行階段                  | `agentRuntime.id: "codex"`                          | 透過 Codex 應用程式伺服器執行 OpenClaw 內嵌代理程式回合。                   |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話中綁定並控制 Codex 應用程式伺服器執行緒。                         |
| Codex 應用程式伺服器提供者/目錄   | `codex` 內部機制，透過執行框架公開                 | 讓執行階段探索並驗證應用程式伺服器模型。                                    |
| Codex 媒體理解路徑                | `codex/*` 影像模型相容性路徑                       | 針對支援的影像理解模型執行有界限的 Codex 應用程式伺服器回合。               |
| 原生 hook 轉送                    | Codex 原生事件周圍的 Plugin hook                    | 讓 OpenClaw 觀察/封鎖支援的 Codex 原生工具/完成事件。                       |

啟用 Plugin 會讓這些能力可用。它**不會**：

- 取代直接 OpenAI API 金鑰介面，例如影像、嵌入、語音或即時功能
- 在沒有 `openclaw doctor --fix` 的情況下轉換 `openai-codex/*` 模型參照
- 讓 ACP/acpx 成為預設 Codex 路徑
- 熱切換已記錄 PI 執行階段的既有工作階段
- 取代 OpenClaw 通道傳遞、工作階段檔案、驗證設定檔儲存，或訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制命令介面。如果 Plugin 已啟用，且使用者要求從聊天中綁定、續接、導引、停止或檢查 Codex 執行緒，代理程式應優先使用 `/codex ...` 而不是 ACP。當使用者要求 ACP/acpx 或正在測試 ACP Codex 轉接器時，ACP 仍是明確的備援選項。

原生 Codex 回合會保留 OpenClaw Plugin hook 作為公開相容層。這些是行程內 OpenClaw hook，而不是 Codex `hooks.json` 命令 hook：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用於鏡像逐字稿記錄
- `before_agent_finalize` 透過 Codex `Stop` 轉送
- `agent_end`

Plugins 也可以註冊與執行階段無關的工具結果中介軟體，在 OpenClaw 執行工具後、結果傳回 Codex 前，重寫 OpenClaw 動態工具結果。這與公開的 `tool_result_persist` Plugin hook 分開，後者會轉換 OpenClaw 擁有的逐字稿工具結果寫入。

關於 Plugin hook 語意本身，請參閱 [Plugin hook](/zh-TW/plugins/hooks) 和 [Plugin 防護行為](/zh-TW/tools/plugin)。

OpenAI 代理程式模型參照預設使用執行框架。新設定應將 OpenAI 模型參照保持為標準 `openai/gpt-*`；`agentRuntime.id: "codex"` 仍有效，但 OpenAI 代理程式回合不再需要。舊版 `codex/*` 模型參照仍會為了相容性自動選取執行框架，但由執行階段支援的舊版提供者前綴不會顯示為一般模型/提供者選項。

如果任何已設定的模型路徑仍是 `openai-codex/*`，`openclaw doctor --fix` 會將其重寫為 `openai/*`。對於相符的代理程式路徑，它會將代理程式執行階段設為 `codex`，並保留既有的 `openai-codex` 驗證設定檔覆寫。

## 路徑對照表

變更設定前，請使用此表：

| 期望行為                                             | 模型參照                   | 執行階段設定                           | 驗證/設定檔路徑                | 預期狀態標籤               |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ------------------------------ | -------------------------- |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱         | `openai/gpt-*`             | 省略或 `agentRuntime.id: "codex"`      | Codex OAuth 或 Codex 帳號      | `Runtime: OpenAI Codex`    |
| 代理程式模型使用 OpenAI API 金鑰驗證                 | `openai/gpt-*`             | 省略或 `agentRuntime.id: "codex"`      | `openai-codex` API 金鑰設定檔 | `Runtime: OpenAI Codex`    |
| 需要 doctor 修復的舊版設定                           | `openai-codex/gpt-*`       | 修復為 `codex`                         | 既有已設定驗證                 | `doctor --fix` 後重新檢查 |
| 保守自動模式的混合提供者                             | 提供者專用參照             | `agentRuntime.id: "auto"`              | 依所選提供者                   | 取決於所選執行階段         |
| 明確的 Codex ACP 轉接器工作階段                      | 取決於 ACP 提示/模型       | `sessions_spawn` 搭配 `runtime: "acp"` | ACP 後端驗證                   | ACP 任務/工作階段狀態      |

重要的區分是提供者與執行階段：

- `openai-codex/*` 是 doctor 會重寫的舊版路徑。
- `agentRuntime.id: "codex"` 需要 Codex 執行框架，且在不可用時會封閉失敗。
- `agentRuntime.id: "auto"` 讓已註冊的執行框架宣告相符提供者路徑；OpenAI 代理程式參照會解析到 Codex，而不是 PI。
- `/codex ...` 回答「這個聊天應綁定或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應啟動哪個外部執行框架行程？」

## 選擇正確的模型前綴

OpenAI 系列路徑依前綴而定。對於常見的訂閱加原生 Codex 執行階段設定，請使用 `openai/*`。
將 `openai-codex/*` 視為 doctor 應重寫的舊版設定：

| 模型參照                                          | 執行階段路徑                           | 使用時機                                                          |
| ------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                  | 代理程式回合使用 Codex 應用程式伺服器執行框架 | 你想透過 Codex 使用 OpenAI 代理程式模型。                         |
| `openai-codex/gpt-5.5`                            | 由 doctor 修復的舊版路徑               | 你正在使用舊設定；執行 `openclaw doctor --fix` 來重寫。           |
| `openai/gpt-5.5` + `openai-codex` API 金鑰設定檔 | Codex 應用程式伺服器執行框架          | 你想為 OpenAI 代理程式模型使用 API 金鑰驗證。                    |

當你的帳號公開這些路徑時，GPT-5.5 可出現在直接 OpenAI API 金鑰與 Codex 訂閱路徑上。使用搭配 Codex 應用程式伺服器執行框架的 `openai/gpt-5.5` 來取得原生 Codex 執行階段，或在沒有 Codex 執行階段覆寫時使用 `openai/gpt-5.5` 進行直接 API 金鑰流量。

舊版 `codex/gpt-*` 參照仍會作為相容性別名接受。Doctor 相容性遷移會將舊版執行階段參照重寫為標準模型參照，並另外記錄執行階段政策。新的原生應用程式伺服器執行框架設定應使用 `openai/gpt-*` 搭配 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前綴區分。一般 OpenAI 路徑請使用 `openai/gpt-*`，而影像理解應透過有界限的 Codex 應用程式伺服器回合執行時，請使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 會將該舊版前綴重寫為 `openai/gpt-*`。Codex 應用程式伺服器模型必須宣告支援影像輸入；純文字 Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效執行框架。如果選取結果令人意外，請為 `agents/harness` 子系統啟用偵錯記錄，並檢查 gateway 的結構化 `agent harness selected` 記錄。它包含所選執行框架 ID、選取原因、執行階段/備援政策，以及在 `auto` 模式下每個 Plugin 候選者的支援結果。

### doctor 警告代表什麼

當已設定的模型參照或持久化工作階段路徑狀態仍使用 `openai-codex/*` 時，`openclaw doctor` 會發出警告。`openclaw doctor --fix` 會將這些路徑重寫為：

- `openai/<model>`
- `agentRuntime.id: "codex"`

`codex` 路徑會強制使用原生 Codex 執行框架。OpenAI 代理程式模型回合不允許使用 PI 執行階段設定。
Doctor 也會修復在已探索代理程式工作階段儲存區中的過時持久化工作階段釘選，避免舊對話卡在已移除的路徑上。

執行框架選取不是即時工作階段控制。當內嵌回合執行時，OpenClaw 會在該工作階段記錄所選執行框架 ID，並在相同工作階段 ID 的後續回合中繼續使用。當你希望未來工作階段使用另一個執行框架時，請變更 `agentRuntime` 設定或 `OPENCLAW_AGENT_RUNTIME`；在 PI 與 Codex 之間切換既有對話前，請使用 `/new` 或 `/reset` 開始新的工作階段。這可避免透過兩個不相容的原生工作階段系統重播同一份逐字稿。

在執行框架釘選出現前建立的舊版工作階段，一旦已有逐字稿歷史，就會被視為已釘選至 PI。變更設定後，請使用 `/new` 或 `/reset` 讓該對話改用 Codex。

`/status` 會顯示有效的模型執行階段。預設 PI 執行框架顯示為 `Runtime: OpenClaw Pi Default`，Codex 應用程式伺服器執行框架顯示為 `Runtime: OpenAI Codex`。

## 需求

- OpenClaw，並提供隨附的 `codex` Plugin。
- Codex app-server `0.125.0` 或更新版本。隨附的 Plugin 預設會管理相容的 Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 命令不會影響一般 harness 啟動。
- app-server 程序或 OpenClaw 的 Codex 驗證橋接可使用 Codex 驗證。本機 app-server 啟動會為每個 agent 使用由 OpenClaw 管理的 Codex home，以及隔離的子程序 `HOME`，因此預設不會讀取你的個人 `~/.codex` 帳號、skills、plugins、設定、thread 狀態或原生 `$HOME/.agents/skills`。

Plugin 會阻擋較舊或沒有版本的 app-server handshakes。這讓 OpenClaw 保持在已測試過的 protocol surface 上。

對於 live 和 Docker smoke tests，驗證通常來自 Codex CLI 帳號或 OpenClaw `openai-codex` auth profile。本機 stdio app-server 啟動在沒有帳號時，也可以 fallback 到 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作區 bootstrap 檔案

Codex 會透過原生 project-doc 探索自行處理 `AGENTS.md`。OpenClaw 不會寫入合成的 Codex project-doc 檔案，也不依賴 Codex fallback 檔名作為 persona 檔案，因為 Codex fallbacks 只會在缺少 `AGENTS.md` 時套用。

為了 OpenClaw 工作區 parity，Codex harness 會解析其他 bootstrap 檔案（存在時包括 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`），並透過 `thread/start` 和 `thread/resume` 上的 Codex developer instructions 轉送。這會讓 `SOUL.md` 和相關的工作區 persona/profile context 在原生 Codex behavior-shaping lane 上可見，而不會複製 `AGENTS.md`。

## 將 Codex 與其他模型並列加入

如果同一個 agent 應該能在 Codex 和非 Codex provider models 之間自由切換，請不要全域設定 `agentRuntime.id: "codex"`。強制 runtime 會套用到該 agent 或 session 的每個 embedded turn。如果你在強制該 runtime 時選擇 Anthropic 模型，OpenClaw 仍會嘗試 Codex harness 並 fail closed，而不是靜默地透過 PI route 該 turn。

請改用下列其中一種形態：

- 將 Codex 放在專用 agent 上，並設定 `agentRuntime.id: "codex"`。
- 將預設 agent 保持在 `agentRuntime.id: "auto"`，並為一般混合 provider 使用 PI fallback。
- 僅為相容性使用 legacy `codex/*` refs。新設定應優先使用 `openai/*`，並加上明確的 Codex runtime policy。

例如，這會讓預設 agent 維持一般自動選擇，並加入另一個 Codex agent：

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

- 預設 `main` agent 使用一般 provider path 和 PI compatibility fallback。
- `codex` agent 使用 Codex app-server harness。
- 如果 `codex` agent 缺少或不支援 Codex，該 turn 會失敗，而不是悄悄使用 PI。

## Agent 命令 route

Agents 應依意圖 route 使用者請求，而不是只依據「Codex」這個字：

| 使用者要求... | Agent 應使用... |
| ------------------------------------------------------ | ------------------------------------------------ |
|「將此 chat 綁定到 Codex」| `/codex bind` |
|「在這裡 resume Codex thread `<id>`」| `/codex resume <id>` |
|「顯示 Codex threads」| `/codex threads` |
|「為一次不良的 Codex run 提交 support report」| `/diagnostics [note]` |
|「只為這個附加的 thread 傳送 Codex feedback」| `/codex diagnostics [note]` |
|「搭配 Codex runtime 使用我的 ChatGPT/Codex subscription」| `openai/*` |
|「修復舊的 `openai-codex/*` config/session pins」| `openclaw doctor --fix` |
|「透過 ACP/acpx 執行 Codex」| ACP `sessions_spawn({ runtime: "acp", ... })` |
|「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」| ACP/acpx，而不是 `/codex`，也不是原生 sub-agents |

OpenClaw 只有在 ACP 已啟用、可 dispatch，且由已載入的 runtime backend 支援時，才會向 agents 公告 ACP spawn guidance。如果 ACP 不可用，system prompt 和 plugin skills 不應教導 agent 關於 ACP routing。

## 僅 Codex 的部署

當你需要證明每個 embedded agent turn 都使用 Codex 時，請強制使用 Codex harness。明確的 plugin runtimes 會 fail closed，絕不會靜默地透過 PI retry：

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

環境 override：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

強制使用 Codex 時，如果 Codex Plugin 已停用、app-server 太舊，或 app-server 無法啟動，OpenClaw 會提早失敗。

## Per-agent Codex

你可以讓一個 agent 僅使用 Codex，而預設 agent 維持一般 auto-selection：

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

使用一般 session commands 切換 agents 和 models。`/new` 會建立新的 OpenClaw session，而 Codex harness 會視需要建立或 resume 其 sidecar app-server thread。`/reset` 會清除該 thread 的 OpenClaw session binding，並讓下一個 turn 再次從目前 config 解析 harness。

## 模型探索

預設情況下，Codex Plugin 會向 app-server 詢問可用 models。如果 discovery 失敗或 timeout，它會使用隨附的 fallback catalog：

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

當你希望啟動時避免 probe Codex，並固定使用 fallback catalog 時，請停用 discovery：

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

預設情況下，Plugin 會使用下列命令在本機啟動 OpenClaw 管理的 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

受管理的二進位檔會隨 `codex` Plugin package 提供。這會讓 app-server 版本與隨附的 Plugin 綁定，而不是與本機剛好安裝的任何獨立 Codex CLI 綁定。只有在你有意執行不同 executable 時，才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO 模式啟動本機 Codex harness sessions：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。這是 autonomous heartbeats 使用的受信任本機 operator posture：Codex 可以使用 shell 和 network tools，而不會停在沒人在場可回應的原生 approval prompts。

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

Guardian 模式會使用 Codex 的原生 auto-review approval path。當 Codex 要求離開 sandbox、寫入 workspace 外部，或新增 network access 等 permissions 時，Codex 會將該 approval request route 到原生 reviewer，而不是 human prompt。Reviewer 會套用 Codex 的 risk framework，並 approve 或 deny 該特定 request。當你想要比 YOLO 模式更多 guardrails，但仍需要 unattended agents 持續推進時，請使用 Guardian。

`guardian` preset 會展開為 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。個別 policy fields 仍會 override `mode`，因此進階部署可以將 preset 與明確選項混用。較舊的 `guardian_subagent` reviewer value 仍接受為 compatibility alias，但新 configs 應使用 `auto_review`。

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

Stdio app-server 啟動預設會繼承 OpenClaw 的 process environment，但 OpenClaw 擁有 Codex app-server account bridge，並將 `CODEX_HOME` 和 `HOME` 都設定為該 agent 的 OpenClaw state 下的 per-agent directories。Codex 自己的 skill loader 會讀取 `$CODEX_HOME/skills` 和 `$HOME/.agents/skills`，因此本機 app-server 啟動會隔離這兩個值。這會讓 Codex-native skills、plugins、config、accounts 和 thread state 的範圍限定在 OpenClaw agent，而不會從 operator 的個人 Codex CLI home 洩漏進來。

OpenClaw plugins 和 OpenClaw skill snapshots 仍會透過 OpenClaw 自己的 plugin registry 和 skill loader 流動。個人 Codex CLI assets 不會。如果你有實用的 Codex CLI skills 或 plugins 應成為 OpenClaw agent 的一部分，請明確 inventory 它們：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider 會將 skills 複製到目前的 OpenClaw agent workspace。Codex native plugins、hooks 和 config files 會被回報或封存以供 manual review，而不是自動啟用，因為它們可以執行 commands、暴露 MCP servers，或攜帶 credentials。

Auth 依下列順序選擇：

1. 該 agent 的明確 OpenClaw Codex auth profile。
2. 該 agent 的 Codex home 中 app-server 既有的 account。
3. 僅限本機 stdio app-server 啟動，在沒有 app-server account 且仍需要 OpenAI auth 時，使用 `CODEX_API_KEY`，接著使用 `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT subscription-style Codex auth profile 時，會從產生的 Codex child process 移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓 Gateway-level API keys 可供 embeddings 或 direct OpenAI models 使用，而不會讓原生 Codex app-server turns 意外透過 API 計費。明確的 Codex API-key profiles 和本機 stdio env-key fallback 會使用 app-server login，而不是 inherited child-process env。WebSocket app-server connections 不會接收 Gateway env API-key fallback；請使用明確的 auth profile 或 remote app-server 自己的 account。

如果部署需要額外的 environment isolation，請將那些 variables 加到 `appServer.clearEnv`：

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

Codex 動態工具預設使用 `native-first` 設定檔。在該模式下，OpenClaw 不會公開會與 Codex 原生工作區操作重複的動態工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。OpenClaw 整合工具，例如訊息、工作階段、媒體、Cron、瀏覽器、節點、Gateway、`heartbeat_respond` 和 `web_search`，仍然可用。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設值           | 意義                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 將完整的 OpenClaw 動態工具集公開給 Codex app-server。 |
| `codexDynamicToolsExclude` | `[]`             | 在 Codex app-server 回合中額外省略的 OpenClaw 動態工具名稱。               |

支援的 `appServer` 欄位：

| 欄位                          | 預設值                                   | 意義                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                             |
| `command`                     | 受管理的 Codex 二進位檔                 | stdio 傳輸的可執行檔。保留未設定以使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]` | stdio 傳輸的引數。                                                                                                                                                                                                       |
| `url`                         | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                            |
| `authToken`                   | 未設定                                   | WebSocket 傳輸的 Bearer token。                                                                                                                                                                                                |
| `headers`                     | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                     | 在 OpenClaw 建立其繼承環境後，從產生的 stdio app-server 程序移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給 OpenClaw 在本機啟動時使用的每代理 Codex 隔離。 |
| `requestTimeoutMs`            | `60000`                                  | app-server 控制平面呼叫的逾時。                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | OpenClaw 等待 `turn/completed` 時，在回合範圍的 Codex app-server 請求之後的靜默時間窗。對於較慢的工具後處理或僅狀態合成階段，請提高此值。                                                                  |
| `mode`                        | `"yolo"`                                 | YOLO 或 guardian 審閱執行的預設集。                                                                                                                                                                                      |
| `approvalPolicy`              | `"never"`                                | 傳送到執行緒開始/恢復/回合的原生 Codex 核准原則。                                                                                                                                                                       |
| `sandbox`                     | `"danger-full-access"`                   | 傳送到執行緒開始/恢復的原生 Codex 沙箱模式。                                                                                                                                                                               |
| `approvalsReviewer`           | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審閱原生核准提示。`guardian_subagent` 仍是舊版別名。                                                                                                                         |
| `serviceTier`                 | 未設定                                   | 選用的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                            |

OpenClaw 擁有的動態工具呼叫會獨立於 `appServer.requestTimeoutMs` 進行界定：每個 Codex `item/tool/call` 請求都必須在 30 秒內收到 OpenClaw 回應。逾時時，OpenClaw 會在支援的情況下中止工具訊號，並向 Codex 傳回失敗的動態工具回應，讓回合能繼續，而不是讓工作階段停留在 `processing`。

在 OpenClaw 回應 Codex 回合範圍的 app-server 請求後，harness 也會預期 Codex 以 `turn/completed` 完成原生回合。如果 app-server 在該回應之後靜默達 `appServer.turnCompletionIdleTimeoutMs`，OpenClaw 會盡力中斷 Codex 回合、記錄診斷逾時，並釋放 OpenClaw 工作階段通道，讓後續聊天訊息不會排在過期的原生回合後面。同一回合的任何非終止通知，包括 `rawResponseItem/completed`，都會解除該短看門狗，因為 Codex 已證明該回合仍在運作；較長的終止看門狗會繼續保護真正卡住的回合。逾時診斷會包含最後一個 app-server 通知方法；對於原始助理回應項目，還會包含項目類型、角色、ID，以及有界的助理文字預覽。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於可重複部署，建議使用設定，因為它會讓 Plugin 行為與其餘 Codex harness 設定保持在同一個已審閱檔案中。

## 電腦使用

電腦使用在自己的設定指南中說明：[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版：OpenClaw 不會內建桌面控制應用程式，也不會自行執行桌面動作。它會準備 Codex app-server、驗證 `computer-use` MCP 伺服器可用，然後在 Codex 模式回合期間讓 Codex 處理原生 MCP 工具呼叫。

若要在 Codex marketplace 流程之外直接存取 TryCua driver，請使用 `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 註冊 `cua-driver mcp`。請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 Codex 擁有的電腦使用與直接 MCP 註冊之間的差異。

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

可從命令介面檢查或安裝設定：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

電腦使用僅適用於 macOS，且在 Codex MCP 伺服器能控制應用程式之前，可能需要本機作業系統權限。如果 `computerUse.enabled` 為 true 且 MCP 伺服器不可用，Codex 模式回合會在執行緒開始前失敗，而不是在沒有原生電腦使用工具的情況下靜默執行。請參閱 [Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 marketplace 選項、遠端目錄限制、狀態原因與疑難排解。

當 `computerUse.autoInstall` 為 true 時，如果 Codex 尚未發現本機 marketplace，OpenClaw 可以從 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊標準內建 Codex Desktop marketplace。變更執行階段或電腦使用設定後，請使用 `/new` 或 `/reset`，讓現有工作階段不會保留舊的 Pi 或 Codex 執行緒繫結。

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

僅 Codex harness 驗證：

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

guardian 審閱的 Codex 核准：

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

模型切換仍由 OpenClaw 控制。當 OpenClaw 工作階段附加到現有 Codex 執行緒時，下一個回合會再次將目前選取的 OpenAI 模型、提供者、核准原則、沙箱和服務層級傳送給 app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex 使用新選取的模型繼續。

## Codex 命令

內建 Plugin 會將 `/codex` 註冊為授權的斜線命令。它是通用命令，適用於任何支援 OpenClaw 文字命令的通道。

常見形式：

- `/codex status` 顯示即時 app-server 連線能力、模型、帳戶、速率限制、MCP 伺服器和 skills。
- `/codex models` 列出即時 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 執行緒。
- `/codex resume <thread-id>` 將目前的 OpenClaw 工作階段附加到既有的 Codex 執行緒。
- `/codex compact` 要求 Codex app-server 壓縮已附加的執行緒。
- `/codex review` 為已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 在傳送已附加執行緒的 Codex 診斷意見回饋前先詢問。
- `/codex computer-use status` 檢查已設定的 Computer Use Plugin 和 MCP 伺服器。
- `/codex computer-use install` 安裝已設定的 Computer Use Plugin 並重新載入 MCP 伺服器。
- `/codex account` 顯示帳戶和速率限制狀態。
- `/codex mcp` 列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 列出 Codex app-server skills。

當 Codex 回報使用量限制失敗時，如果 Codex 有提供下一次
app-server 重設時間，OpenClaw 會將其納入。在同一段
對話中使用 `/codex account` 來檢查目前的帳戶和速率限制時間窗。

### 常見偵錯工作流程

當 Codex 後援的代理在 Telegram、Discord、Slack
或其他通道中做出令人意外的事時，請從問題發生的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload` 或另一則簡短註記，
   描述你看到的情況。
2. 核准診斷要求一次。核准會建立本機 Gateway
   診斷 zip，並且因為工作階段正在使用 Codex harness，也會
   將相關的 Codex 意見回饋套件傳送到 OpenAI 伺服器。
3. 將完成後的診斷回覆複製到錯誤回報或支援討論串。
   其中包含本機套件路徑、隱私摘要、OpenClaw 工作階段 ID、
   Codex 執行緒 ID，以及每個 Codex 執行緒的一行 `Inspect locally`。
4. 如果你想自行偵錯這次執行，請在終端機中執行印出的 `Inspect locally`
   命令。它看起來像 `codex resume <thread-id>`，並會開啟
   原生 Codex 執行緒，讓你可以檢查對話、在本機繼續它，
   或詢問 Codex 為什麼選擇特定工具或計畫。

只有在你特別想針對目前附加的執行緒上傳 Codex
意見回饋、但不需要完整 OpenClaw
Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。對大多數支援回報而言，`/diagnostics [note]`
是較好的起點，因為它會在同一則回覆中把本機 Gateway 狀態和 Codex
執行緒 ID 串在一起。完整的隱私模型和群組聊天行為請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

核心 OpenClaw 也提供僅限擁有者使用的 `/diagnostics [note]`，作為一般
Gateway 診斷命令。它的核准提示會顯示敏感資料
前言、連結到[診斷匯出](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec 核准
要求執行 `openclaw gateway diagnostics export --json`。請勿使用 allow-all 規則核准診斷。核准後，
OpenClaw 會傳送可貼上的報告，其中包含本機套件路徑和 manifest
摘要。當作用中的 OpenClaw 工作階段正在使用 Codex harness 時，同一個核准
也會授權將相關的 Codex 意見回饋套件傳送到
OpenAI 伺服器。核准提示會說明將傳送 Codex 意見回饋，但
它不會在核准前列出 Codex 工作階段或執行緒 ID。

如果擁有者在群組聊天中呼叫 `/diagnostics`，OpenClaw 會保持
共享通道乾淨：群組只會收到一則簡短通知，而
診斷前言、核准提示和 Codex 工作階段/執行緒 ID 會透過
私有核准路由傳送給擁有者。如果沒有私有擁有者路由，
OpenClaw 會拒絕群組要求，並要求擁有者從 DM 執行。

已核准的 Codex 上傳會呼叫 Codex app-server `feedback/upload`，並要求
app-server 在可用時包含每個列出執行緒和衍生 Codex 子執行緒的日誌。上傳會透過 Codex 的正常意見回饋路徑送到 OpenAI
伺服器；如果該 app-server 已停用 Codex 意見回饋，命令會回傳
app-server 錯誤。完成後的診斷回覆會列出已傳送執行緒的通道、
OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機 `codex resume <thread-id>`
命令。如果你拒絕或忽略核准，
OpenClaw 不會印出那些 Codex ID。這項上傳不會取代本機
Gateway 診斷匯出。

`/codex resume` 會寫入與 harness 在一般回合中使用的相同 sidecar 綁定檔。
在下一則訊息時，OpenClaw 會恢復該 Codex 執行緒，將
目前選取的 OpenClaw 模型傳入 app-server，並保持延伸歷史記錄
啟用。

### 從 CLI 檢查 Codex 執行緒

了解不佳 Codex 執行的最快方式，通常是直接開啟原生 Codex
執行緒：

```sh
codex resume <thread-id>
```

當你在通道對話中注意到錯誤，並想檢查
有問題的 Codex 工作階段、在本機繼續它，或詢問 Codex 為什麼做出
特定工具或推理選擇時，請使用這個命令。最簡單的路徑通常是先執行
`/diagnostics [note]`：你核准後，完成的報告會列出
每個 Codex 執行緒，並印出 `Inspect locally` 命令，例如
`codex resume <thread-id>`。你可以直接將該命令複製到終端機。

你也可以從目前聊天的 `/codex binding` 取得執行緒 ID，或從最近 Codex app-server 執行緒的
`/codex threads [filter]` 取得，然後在 shell 中執行相同的
`codex resume` 命令。

命令介面需要 Codex app-server `0.125.0` 或更新版本。如果未來或自訂 app-server 沒有公開該 JSON-RPC 方法，個別
控制方法會回報為 `unsupported by this Codex app-server`。

## Hook 邊界

Codex harness 有三個 hook 層：

| 層                                    | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                 | 跨 PI 和 Codex harness 的產品/Plugin 相容性。                       |
| Codex app-server extension middleware | OpenClaw bundled plugins | 圍繞 OpenClaw 動態工具的逐回合配接器行為。                          |
| Codex native hooks                    | Codex                    | 來自 Codex 設定的低階 Codex 生命週期和原生工具政策。                |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由
OpenClaw Plugin 行為。對於支援的原生工具和權限橋接，
OpenClaw 會為 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop` 注入逐執行緒 Codex 設定。當 Codex app-server 核准已啟用
（`approvalPolicy` 不是 `"never"`）時，預設注入的原生 hook 設定
會省略 `PermissionRequest`，讓 Codex 的 app-server reviewer 和 OpenClaw 的核准
橋接在審查後處理實際升級。當操作員需要相容性
relay 時，仍可明確將 `permission_request` 加到 `nativeHookRelay.events`。
其他 Codex hooks，例如 `SessionStart` 和 `UserPromptSubmit`，仍然是
Codex 層級控制；它們在 v1
合約中不會作為 OpenClaw Plugin hooks 暴露。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求
呼叫後執行工具，因此 OpenClaw 會在
harness 配接器中觸發它所擁有的 Plugin 和 middleware 行為。對於 Codex 原生工具，Codex 擁有標準工具記錄。
OpenClaw 可以鏡射選定事件，但除非 Codex 透過 app-server 或原生 hook
回呼公開該操作，否則無法重寫原生 Codex
執行緒。

Compaction 和 LLM 生命週期投影來自 Codex app-server
通知和 OpenClaw 配接器狀態，而不是原生 Codex hook 命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是配接器層級觀察，而不是 Codex 內部要求或 Compaction 承載的逐位元組擷取。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知會
投影為 `codex_app_server.hook` 代理事件，用於軌跡和偵錯。
它們不會呼叫 OpenClaw Plugin hooks。

## V1 支援合約

Codex 模式並不是底層換成不同模型呼叫的 PI。Codex 擁有更多
原生模型迴圈，而 OpenClaw 會圍繞該邊界調整它的 Plugin 和工作階段介面。

Codex runtime v1 支援：

| 介面 | 支援 | 原因 |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈 | 支援 | Codex app-server 擁有 OpenAI 回合、原生對話串恢復，以及原生工具延續。 |
| OpenClaw 通道路由與遞送 | 支援 | Telegram、Discord、Slack、WhatsApp、iMessage 和其他通道會留在模型執行階段之外。 |
| OpenClaw 動態工具 | 支援 | Codex 會要求 OpenClaw 執行這些工具，因此 OpenClaw 會留在執行路徑中。 |
| 提示與情境 Plugin | 支援 | OpenClaw 會建立提示覆蓋層，並在啟動或恢復對話串前，將情境投射到 Codex 回合中。 |
| 情境引擎生命週期 | 支援 | 組裝、擷取或回合後維護，以及情境引擎 Compaction 協調會針對 Codex 回合執行。 |
| 動態工具鉤子 | 支援 | `before_tool_call`、`after_tool_call` 和工具結果中介軟體會圍繞 OpenClaw 擁有的動態工具執行。 |
| 生命週期鉤子 | 作為配接器觀察支援 | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以真實的 Codex 模式酬載觸發。 |
| 最終答案修訂閘門 | 透過原生鉤子轉送支援 | Codex `Stop` 會轉送到 `before_agent_finalize`；`revise` 會要求 Codex 在最終化前再進行一次模型傳遞。 |
| 原生 Shell、修補與 MCP 封鎖或觀察 | 透過原生鉤子轉送支援 | Codex `PreToolUse` 和 `PostToolUse` 會針對已提交的原生工具介面轉送，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 酬載。支援封鎖；不支援引數重寫。 |
| 原生權限政策 | 透過 Codex app-server 核准與相容性原生鉤子轉送支援 | Codex app-server 核准要求會在 Codex 審查後透過 OpenClaw 路由。`PermissionRequest` 原生鉤子轉送對原生核准模式採選用制，因為 Codex 會在守護程式審查前發出它。 |
| App-server 軌跡擷取 | 支援 | OpenClaw 會記錄它傳送給 app-server 的要求，以及收到的 app-server 通知。 |

Codex 執行階段 v1 不支援：

| 介面 | V1 邊界 | 未來路徑 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更 | Codex 原生工具前鉤子可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。 | 需要 Codex 鉤子／結構描述支援替換工具輸入。 |
| 可編輯的 Codex 原生逐字稿歷程 | Codex 擁有標準原生對話串歷程。OpenClaw 擁有鏡像並可投射未來情境，但不應變更未支援的內部項目。 | 如果需要原生對話串手術，請新增明確的 Codex app-server API。 |
| Codex 原生工具記錄的 `tool_result_persist` | 該鉤子會轉換 OpenClaw 擁有的逐字稿寫入，而非 Codex 原生工具記錄。 | 可以鏡像轉換後的記錄，但標準重寫需要 Codex 支援。 |
| 豐富的原生 Compaction 中繼資料 | OpenClaw 會觀察 Compaction 開始與完成，但不會收到穩定的保留／丟棄清單、權杖差異或摘要酬載。 | 需要更豐富的 Codex Compaction 事件。 |
| Compaction 介入 | 目前 OpenClaw Compaction 鉤子在 Codex 模式中屬於通知層級。 | 如果 Plugin 需要否決或重寫原生 Compaction，請新增 Codex Compaction 前／後鉤子。 |
| 逐位元組模型 API 要求擷取 | OpenClaw 可以擷取 app-server 要求與通知，但 Codex 核心會在內部建立最終 OpenAI API 要求。 | 需要 Codex 模型要求追蹤事件或偵錯 API。 |

## 工具、媒體與 Compaction

Codex 控制程式只會變更低階嵌入式代理執行器。

OpenClaw 仍會建立工具清單，並從控制程式接收動態工具結果。文字、圖片、影片、音樂、TTS、核准和訊息工具輸出會繼續透過一般 OpenClaw 遞送路徑。

原生鉤子轉送刻意保持通用，但 v1 支援合約限於 OpenClaw 測試的 Codex 原生工具與權限路徑。在 Codex 執行階段中，這包括 shell、patch 和 MCP `PreToolUse`、`PostToolUse` 與 `PermissionRequest` 酬載。不要假設每個未來的 Codex 鉤子事件都是 OpenClaw Plugin 介面，除非執行階段合約明確命名它。

對於 `PermissionRequest`，OpenClaw 只會在政策做出決定時回傳明確允許或拒絕決策。沒有決策的結果不是允許。Codex 會將其視為沒有鉤子決策，並落入自己的守護程式或使用者核准路徑。Codex app-server 核准模式預設會省略此原生鉤子；本段適用於 `permission_request` 明確包含在 `nativeHookRelay.events` 中，或相容性執行階段安裝它時。當操作員針對 Codex 原生權限要求選擇 `allow-always` 時，OpenClaw 會在有界工作階段視窗內記住該確切的供應商／工作階段／工具輸入／cwd 指紋。記住的決策刻意只做完全相符：變更的命令、引數、工具酬載或 cwd 都會建立新的核准。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准徵詢會透過 OpenClaw 的 Plugin 核准流程路由。Codex `request_user_input` 提示會送回原始聊天，而下一則已排入佇列的後續訊息會回答該原生伺服器要求，而不是被導向為額外情境。其他 MCP 徵詢要求仍會封閉失敗。

作用中執行佇列導向會對應到 Codex app-server `turn/steer`。使用預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的安靜視窗內批次處理已排入佇列的聊天訊息，並依抵達順序將其作為一個 `turn/steer` 要求傳送。舊版 `queue` 模式會傳送個別的 `turn/steer` 要求。Codex 審查與手動 Compaction 回合可能會拒絕同一回合導向，在這種情況下，只要選取的模式允許備援，OpenClaw 就會使用後續佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當選取的模型使用 Codex 控制程式時，原生對話串 Compaction 會委派給 Codex app-server。OpenClaw 會保留逐字稿鏡像，用於通道歷程、搜尋、`/new`、`/reset`，以及未來模型或控制程式切換。鏡像包含使用者提示、最終助理文字，以及 app-server 發出時的輕量 Codex 推理或計畫記錄。目前，OpenClaw 只會記錄原生 Compaction 開始與完成訊號。它尚未公開人類可讀的 Compaction 摘要，或 Codex 在 Compaction 後保留哪些項目的可稽核清單。

因為 Codex 擁有標準原生對話串，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

媒體生成不需要 PI。圖片、影片、音樂、PDF、TTS 和媒體理解會繼續使用相符的供應商／模型設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 疑難排解

**Codex 不會顯示為一般 `/model` 供應商：** 這對新設定而言是預期行為。選取具有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` 參照）、啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 當沒有 Codex 控制程式宣告執行時，`agentRuntime.id: "auto"` 仍可使用 PI 作為相容性後端。設定 `agentRuntime.id: "codex"` 可在測試時強制選取 Codex。強制 Codex 執行階段會失敗，而不是退回 PI。一旦選取 Codex app-server，其失敗會直接浮現。

**App-server 被拒絕：** 升級 Codex，讓 app-server 交握回報版本 `0.125.0` 或更新版本。同版本預先發行版或帶有建置後綴的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom` 會被拒絕，因為穩定版 `0.125.0` 協定下限才是 OpenClaw 測試的對象。

**模型探索很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket 傳輸立即失敗：** 檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server 協定版本。

**非 Codex 模型使用 PI：** 這是預期行為，除非你已為該代理強制設定 `agentRuntime.id: "codex"`，或選取舊版 `codex/*` 參照。純 `openai/gpt-*` 和其他供應商參照在 `auto` 模式中會保留在其一般供應商路徑上。如果你強制設定 `agentRuntime.id: "codex"`，該代理的每個嵌入式回合都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具無法執行：** 請從全新的工作階段檢查
`/codex computer-use status`。如果某個工具回報
`Native hook relay unavailable`，請使用 `/new` 或 `/reset`；如果問題仍然存在，請重新啟動
Gateway 以清除過時的原生 hook 註冊。如果 `computer-use.list_apps`
逾時，請重新啟動 Codex Computer Use 或 Codex Desktop，然後重試。

## 相關內容

- [代理程式框架 Plugin](/zh-TW/plugins/sdk-agent-harness)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [模型提供者](/zh-TW/concepts/model-providers)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin hook](/zh-TW/plugins/hooks)
- [設定參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
