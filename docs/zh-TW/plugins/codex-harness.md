---
read_when:
    - 你想要使用隨附的 Codex app-server 測試框架
    - 你需要 Codex 執行環境設定範例
    - 您希望僅限 Codex 的部署失敗，而不是回退至 Pi
summary: 透過隨附的 Codex app-server 測試框架執行 OpenClaw 內嵌代理程式回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-05-06T09:15:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

捆綁的 `codex` Plugin 讓 OpenClaw 透過 Codex 應用程式伺服器執行嵌入式代理回合，而不是使用內建的 PI harness。

當你希望由 Codex 擁有低階代理工作階段時，請使用這個方式：模型探索、原生執行緒續接、原生 Compaction，以及應用程式伺服器執行。OpenClaw 仍然擁有聊天通道、工作階段檔案、模型選擇、工具、核准、媒體傳遞，以及可見的逐字稿鏡像。

當來源聊天回合透過 Codex harness 執行時，如果部署沒有明確設定 `messages.visibleReplies`，可見回覆預設會使用 OpenClaw `message` 工具。代理仍然可以私下完成其 Codex 回合；只有在呼叫 `message(action="send")` 時才會張貼到通道。將 `messages.visibleReplies: "automatic"` 設為保留直接聊天最終回覆的舊版自動傳遞路徑。

Codex Heartbeat 回合預設也會取得 `heartbeat_respond` 工具，因此代理可以記錄這次喚醒應該保持安靜或發出通知，而不必把該控制流程編碼在最終文字中。

Heartbeat 專屬的主動性指引會在 Heartbeat 回合本身作為 Codex 協作模式開發者指令傳送。一般聊天回合會恢復 Codex Default 模式，而不是在其正常執行階段提示中攜帶 Heartbeat 理念。

如果你正在嘗試理解整體方向，請從
[代理執行階段](/zh-TW/concepts/agent-runtimes)開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、Discord、Slack 或其他通道仍然是通訊介面。

## 快速設定

大多數想要「Codex in OpenClaw」的使用者需要的是這條路徑：使用 ChatGPT/Codex 訂閱登入，然後透過原生 Codex 應用程式伺服器執行階段執行嵌入式代理回合。模型參照仍然以 `openai/gpt-*` 作為標準；訂閱驗證來自 Codex 帳號/設定檔，而不是來自 `openai-codex/*` 模型前綴。

如果你尚未登入，請先使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai-codex
```

接著啟用捆綁的 `codex` Plugin，並強制使用 Codex 執行階段：

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

請勿在設定中使用 `openai-codex/gpt-*`。該前綴是舊版路徑，`openclaw doctor --fix` 會在主要模型、備援、Heartbeat/子代理/Compaction 覆寫、hook、通道覆寫，以及過期的持久化工作階段路徑釘選中，將其重寫為 `openai/gpt-*`。

## 這個 Plugin 會改變什麼

捆綁的 `codex` Plugin 提供數個彼此分離的能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式執行階段                | `agentRuntime.id: "codex"`                          | 透過 Codex 應用程式伺服器執行 OpenClaw 嵌入式代理回合。                     |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 從訊息對話綁定並控制 Codex 應用程式伺服器執行緒。                            |
| Codex 應用程式伺服器提供者/目錄   | `codex` internals, surfaced through the harness     | 讓執行階段探索並驗證應用程式伺服器模型。                                      |
| Codex 媒體理解路徑                | `codex/*` image-model compatibility paths           | 針對支援的影像理解模型執行有界的 Codex 應用程式伺服器回合。                  |
| 原生 hook relay                   | Plugin hooks around Codex-native events             | 讓 OpenClaw 觀察/封鎖受支援的 Codex 原生工具/完成事件。                       |

啟用 Plugin 會讓這些能力可用。它**不會**：

- 開始對每個 OpenAI 模型使用 Codex
- 在沒有 doctor 驗證 Codex 已安裝、已啟用、提供 `codex` harness，且 OAuth 可用的情況下，將 `openai-codex/*` 模型參照轉換成原生執行階段
- 讓 ACP/acpx 成為預設 Codex 路徑
- 熱切換已經記錄 PI 執行階段的既有工作階段
- 取代 OpenClaw 通道傳遞、工作階段檔案、驗證設定檔儲存，或訊息路由

同一個 Plugin 也擁有原生 `/codex` 聊天控制命令介面。如果 Plugin 已啟用，且使用者要求從聊天中綁定、續接、導向、停止或檢查 Codex 執行緒，代理應優先使用 `/codex ...` 而不是 ACP。當使用者要求 ACP/acpx 或正在測試 ACP Codex adapter 時，ACP 仍然是明確的備援。

原生 Codex 回合會保留 OpenClaw Plugin hooks 作為公開相容層。這些是處理程序內的 OpenClaw hooks，不是 Codex `hooks.json` 命令 hooks：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用於鏡像逐字稿記錄
- `before_agent_finalize` 透過 Codex `Stop` relay
- `agent_end`

Plugin 也可以註冊執行階段中立的工具結果中介軟體，用於在 OpenClaw 執行工具之後、結果傳回 Codex 之前，重寫 OpenClaw 動態工具結果。這與公開的 `tool_result_persist` Plugin hook 是分開的；後者會轉換 OpenClaw 擁有的逐字稿工具結果寫入。

如需 Plugin hook 語意本身，請參閱 [Plugin hooks](/zh-TW/plugins/hooks) 和 [Plugin guard 行為](/zh-TW/tools/plugin)。

Harness 預設為關閉。新設定應將 OpenAI 模型參照保持為標準的 `openai/gpt-*`，並在需要原生應用程式伺服器執行時，明確強制使用 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。舊版 `codex/*` 模型參照仍會為了相容性自動選取 harness，但由執行階段支援的舊版提供者前綴不會顯示為一般模型/提供者選項。

如果任何已設定的模型路徑仍是 `openai-codex/*`，`openclaw doctor --fix` 會將其重寫為 `openai/*`。對於相符的代理路徑，只有在 Codex Plugin 已安裝、已啟用、提供 `codex` harness，且有可用 OAuth 時，才會將代理執行階段設為 `codex`；否則會將執行階段設為 `pi`。

## 路徑對照

變更設定之前請先使用這張表：

| 期望行為                                             | 模型參照                   | 執行階段設定                           | 驗證/設定檔路徑              | 預期狀態標籤                 |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ---------------------------- |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱         | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth 或 Codex 帳號    | `Runtime: OpenAI Codex`      |
| 透過一般 OpenClaw runner 使用 OpenAI API             | `openai/gpt-*`             | omitted or `runtime: "pi"`             | OpenAI API key               | `Runtime: OpenClaw Pi Default` |
| 需要 doctor 修復的舊版設定                           | `openai-codex/gpt-*`       | repaired to `codex` or `pi`            | 既有已設定驗證               | 執行 `doctor --fix` 後重新檢查 |
| 使用保守自動模式的混合提供者                         | provider-specific refs     | `agentRuntime.id: "auto"`              | 依選取的提供者               | 取決於選取的執行階段         |
| 明確的 Codex ACP adapter 工作階段                    | ACP prompt/model dependent | `sessions_spawn` with `runtime: "acp"` | ACP 後端驗證                 | ACP 工作/工作階段狀態        |

重要的分界是提供者與執行階段：

- `openai-codex/*` 是 doctor 會重寫的舊版路徑。
- `agentRuntime.id: "codex"` 需要 Codex harness，若無法使用則會封閉失敗。
- `agentRuntime.id: "auto"` 允許已註冊的 harness 宣告相符的提供者路徑，但標準 OpenAI 參照仍由 PI 擁有，除非某個 harness 支援該提供者/模型配對。
- `/codex ...` 回答「這個聊天應該綁定或控制哪個原生 Codex 對話？」
- ACP 回答「acpx 應該啟動哪個外部 harness 程序？」

## 選擇正確的模型前綴

OpenAI 系列路徑依前綴區分。對於常見的訂閱加原生 Codex 執行階段設定，請使用 `openai/*` 搭配 `agentRuntime.id: "codex"`。將 `openai-codex/*` 視為 doctor 應重寫的舊版設定：

| 模型參照                                      | 執行階段路徑                                  | 使用時機                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI provider through OpenClaw/PI plumbing | 你想要透過 `OPENAI_API_KEY` 使用目前的直接 OpenAI Platform API 存取。     |
| `openai-codex/gpt-5.5`                        | Legacy route repaired by doctor              | 你正在使用舊設定；執行 `openclaw doctor --fix` 來重寫它。                 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | 你想要使用 ChatGPT/Codex 訂閱驗證搭配原生 Codex 執行。                    |

當你的帳號公開這些路徑時，GPT-5.5 可能同時出現在直接 OpenAI API key 和 Codex 訂閱路徑上。對於原生 Codex 執行階段，請使用 `openai/gpt-5.5` 搭配 Codex 應用程式伺服器 harness；對於直接 API key 流量，請使用沒有 Codex 執行階段覆寫的 `openai/gpt-5.5`。

舊版 `codex/gpt-*` 參照仍會作為相容別名被接受。Doctor 相容性遷移會將舊版執行階段參照重寫為標準模型參照，並另外記錄執行階段政策。新的原生應用程式伺服器 harness 設定應使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前綴分界。一般 OpenAI 路徑請使用 `openai/gpt-*`，而當影像理解應透過有界的 Codex 應用程式伺服器回合執行時，請使用 `codex/gpt-*`。請勿使用 `openai-codex/gpt-*`；doctor 會將該舊版前綴重寫為 `openai/gpt-*`。Codex 應用程式伺服器模型必須宣告支援影像輸入；純文字 Codex 模型會在媒體回合開始前失敗。

使用 `/status` 確認目前工作階段的有效 harness。如果選取結果令人意外，請啟用 `agents/harness` 子系統的偵錯記錄，並檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含選取的 harness ID、選取原因、執行階段/備援政策，以及在 `auto` 模式下每個 Plugin 候選項目的支援結果。

### Doctor 警告的意思

當已設定的模型參照或持久化工作階段路徑狀態仍使用 `openai-codex/*` 時，`openclaw doctor` 會發出警告。`openclaw doctor --fix` 會將這些路徑重寫為：

- `openai/<model>`
- 當 Codex 已安裝、已啟用、提供 `codex` harness，且有可用 OAuth 時，使用 `agentRuntime.id: "codex"`
- 否則使用 `agentRuntime.id: "pi"`

`codex` 路徑會強制使用原生 Codex harness。`pi` 路徑則會讓代理保留在預設 OpenClaw runner 上，而不是在清理舊版路徑時順帶啟用或安裝 Codex。
Doctor 也會修復在已發現代理工作階段儲存區中的過期持久化工作階段釘選，讓舊對話不會繼續卡在已移除的路徑上。

工具選擇不是即時工作階段控制。當嵌入式回合執行時，
OpenClaw 會在該工作階段記錄所選的工具 id，並在相同工作階段 id 的
後續回合中持續使用它。若要讓未來的工作階段使用其他工具，請變更
`agentRuntime` 設定或 `OPENCLAW_AGENT_RUNTIME`；若要在既有
對話中於 PI 和 Codex 之間切換，請先使用 `/new` 或 `/reset`
啟動新的工作階段。這可避免將同一份逐字稿重播到兩個不相容的原生工作階段系統中。

在工具釘選功能推出前建立的舊版工作階段，一旦已有逐字稿歷史，
就會被視為已釘選至 PI。變更設定後，請使用 `/new` 或 `/reset`
讓該對話改用 Codex。

`/status` 會顯示實際生效的模型執行環境。預設 PI 工具會顯示為
`Runtime: OpenClaw Pi Default`，Codex app-server 工具會顯示為
`Runtime: OpenAI Codex`。

## 需求

- OpenClaw，並有可用的內建 `codex` plugin。
- Codex app-server `0.125.0` 或更新版本。內建 plugin 預設會管理相容的
  Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 命令
  不會影響一般工具啟動。
- app-server 程序或 OpenClaw 的 Codex 驗證橋接器可使用 Codex 驗證。
  本機 app-server 啟動會為每個 agent 使用 OpenClaw 管理的 Codex home，
  並使用隔離的子 `HOME`，因此預設不會讀取你的個人
  `~/.codex` 帳號、skills、plugins、設定、thread 狀態，或原生
  `$HOME/.agents/skills`。

此 plugin 會封鎖較舊或未標版本的 app-server 交握。這可讓
OpenClaw 維持在已測試過的協定介面上。

對於即時和 Docker smoke 測試，驗證通常來自 Codex CLI 帳號
或 OpenClaw `openai-codex` 驗證 profile。本機 stdio app-server 啟動在
沒有帳號時，也可以退回使用 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作區啟動檔案

Codex 會透過原生專案文件探索自行處理 `AGENTS.md`。OpenClaw
不會寫入合成的 Codex 專案文件檔案，也不依賴 Codex 備用
檔名來處理 persona 檔案，因為 Codex 備用檔名只會在
`AGENTS.md` 缺失時套用。

為了 OpenClaw 工作區一致性，Codex 工具會解析其他啟動檔案
（存在時的 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md` 和 `MEMORY.md`），並透過 `thread/start` 和
`thread/resume` 上的 Codex developer instructions 轉送它們。這會讓
`SOUL.md` 和相關工作區 persona/profile 上下文在原生 Codex 行為塑形通道上可見，
且不會重複 `AGENTS.md`。

## 將 Codex 與其他模型並用

如果同一個 agent 應能在 Codex 和非 Codex provider 模型之間自由切換，
請不要全域設定 `agentRuntime.id: "codex"`。強制執行環境會套用到該
agent 或工作階段的每個嵌入式回合。如果你在強制使用該執行環境時選取
Anthropic 模型，OpenClaw 仍會嘗試 Codex 工具並關閉失敗，
而不是靜默地透過 PI 路由該回合。

請改用下列其中一種形式：

- 將 Codex 放在使用 `agentRuntime.id: "codex"` 的專用 agent 上。
- 讓預設 agent 維持 `agentRuntime.id: "auto"` 和 PI fallback，以供一般混合
  provider 使用。
- 僅為相容性使用舊版 `codex/*` 參照。新設定應偏好
  `openai/*` 加上明確的 Codex 執行環境策略。

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

使用此形式時：

- 預設 `main` agent 會使用一般 provider 路徑和 PI 相容 fallback。
- `codex` agent 會使用 Codex app-server 工具。
- 如果 `codex` agent 缺少 Codex 或不支援 Codex，該回合會失敗，
  而不是悄悄使用 PI。

## Agent 命令路由

Agents 應依意圖路由使用者請求，而不是只根據「Codex」這個詞：

| 使用者要求...                                          | Agent 應使用...                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「將此聊天綁定到 Codex」                               | `/codex bind`                                    |
| 「在這裡恢復 Codex thread `<id>`」                     | `/codex resume <id>`                             |
| 「顯示 Codex threads」                                 | `/codex threads`                                 |
| 「為失敗的 Codex 執行提交支援報告」                    | `/diagnostics [note]`                            |
| 「只針對這個附加的 thread 傳送 Codex feedback」         | `/codex diagnostics [note]`                      |
| 「使用我的 ChatGPT/Codex 訂閱搭配 Codex runtime」      | `openai/*` 加上 `agentRuntime.id: "codex"`       |
| 「修復舊的 `openai-codex/*` 設定/工作階段釘選」        | `openclaw doctor --fix`                          |
| 「透過 ACP/acpx 執行 Codex」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「在 thread 中啟動 Claude Code/Gemini/OpenCode/Cursor」 | ACP/acpx，不是 `/codex`，也不是原生 sub-agents |

OpenClaw 只會在 ACP 已啟用、可分派，且有已載入的執行環境後端支援時，
才向 agents 公告 ACP spawn 指引。如果 ACP 不可用，
system prompt 和 plugin skills 不應教導 agent ACP 路由。

## 僅 Codex 部署

當你需要證明每個嵌入式 agent 回合都使用 Codex 時，請強制使用
Codex 工具。明確的 plugin 執行環境會關閉失敗，且絕不會靜默地
透過 PI 重試：

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

強制使用 Codex 時，如果 Codex plugin 已停用、app-server 太舊，
或 app-server 無法啟動，OpenClaw 會提早失敗。

## 個別 agent 的 Codex

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

使用一般工作階段命令來切換 agents 和模型。`/new` 會建立新的
OpenClaw 工作階段，而 Codex 工具會視需要建立或恢復其 sidecar app-server
thread。`/reset` 會清除該 thread 的 OpenClaw 工作階段綁定，
並讓下一個回合再次從目前設定解析工具。

## 模型探索

預設情況下，Codex plugin 會向 app-server 詢問可用模型。如果
探索失敗或逾時，它會使用下列內建 fallback catalog：

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

當你希望啟動時避免探測 Codex，並固定使用 fallback catalog 時，
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

## App-server 連線與策略

預設情況下，plugin 會用下列方式在本機啟動 OpenClaw 管理的 Codex 二進位檔：

```bash
codex app-server --listen stdio://
```

受管理的二進位檔會隨 `codex` plugin package 出貨。這會讓
app-server 版本與內建 plugin 綁定，而不是取決於本機剛好安裝的其他
Codex CLI。只有在你刻意想執行不同可執行檔時，才設定 `appServer.command`。

預設情況下，OpenClaw 會以 YOLO mode 啟動本機 Codex 工具工作階段：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。這是 autonomous heartbeats 使用的可信任
本機 operator 姿態：Codex 可以使用 shell 和網路工具，而不會停在
無人在場回應的原生 approval prompts。

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

Guardian mode 使用 Codex 的原生 auto-review approval 路徑。當 Codex 要求
離開 sandbox、寫入工作區外部，或新增網路存取等 permissions 時，
Codex 會將該 approval request 路由給原生 reviewer，而不是 human prompt。
reviewer 會套用 Codex 的風險框架，並核准或拒絕該特定請求。
當你想要比 YOLO mode 更多 guardrails，但仍需要 unattended agents 能夠前進時，
請使用 Guardian。

`guardian` preset 會展開為 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
個別策略欄位仍會覆寫 `mode`，因此進階部署可以將 preset 與明確選項混用。
較舊的 `guardian_subagent` reviewer 值仍作為相容 alias 被接受，
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
但 OpenClaw 擁有 Codex app-server 帳號橋接，並將
`CODEX_HOME` 和 `HOME` 都設為該 agent 的 OpenClaw state 底下的個別 agent
目錄。Codex 自身的 skill loader 會讀取 `$CODEX_HOME/skills` 和
`$HOME/.agents/skills`，因此本機 app-server 啟動會隔離這兩個值。
這可讓 Codex 原生 skills、plugins、設定、帳號和 thread
狀態限定在 OpenClaw agent 範圍內，而不會從 operator 的
個人 Codex CLI home 洩漏進來。

OpenClaw plugins 和 OpenClaw skill snapshots 仍會透過 OpenClaw 自身的
plugin registry 和 skill loader 流動。個人 Codex CLI assets 不會。
如果你有實用的 Codex CLI skills 或 plugins 應該成為 OpenClaw agent 的一部分，
請明確列出清單：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider 會將 skills 複製到目前的 OpenClaw agent
工作區。Codex 原生 plugins、hooks 和設定檔會被報告或封存以供
人工審查，而不是自動啟用，因為它們可以執行命令、公開 MCP servers，
或攜帶 credentials。

驗證會依下列順序選取：

1. 該 agent 的明確 OpenClaw Codex 驗證 profile。
2. 該 agent 的 Codex home 中 app-server 既有的帳號。
3. 僅限本機 stdio app-server 啟動時，當沒有 app-server 帳號且仍需要
   OpenAI 驗證時，使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

當 OpenClaw 偵測到 ChatGPT 訂閱式的 Codex 驗證設定檔時，會從產生的 Codex 子程序移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。這可讓 Gateway 層級的 API 金鑰仍可用於嵌入或直接 OpenAI 模型，
同時避免原生 Codex app-server 回合意外透過 API 計費。
明確的 Codex API 金鑰設定檔和本機 stdio 環境金鑰後援會使用 app-server
登入，而不是繼承子程序環境。WebSocket app-server 連線
不會接收 Gateway 環境 API 金鑰後援；請使用明確的驗證設定檔，或使用
遠端 app-server 自己的帳戶。

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

`appServer.clearEnv` 只會影響產生的 Codex app-server 子程序。

Codex 動態工具預設使用 `native-first` 設定檔。在該模式下，
OpenClaw 不會公開與 Codex 原生工作區操作重複的動態工具：
`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和
`update_plan`。OpenClaw 整合工具，例如訊息、工作階段、媒體、
cron、瀏覽器、節點、gateway、`heartbeat_respond` 和 `web_search` 仍然
可用。

支援的頂層 Codex Plugin 欄位：

| 欄位                       | 預設值           | 含義                                                                                    |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 將完整的 OpenClaw 動態工具集公開給 Codex app-server。         |
| `codexDynamicToolsExclude` | `[]`             | 要從 Codex app-server 回合省略的額外 OpenClaw 動態工具名稱。                           |

支援的 `appServer` 欄位：

| 欄位                | 預設值                                   | 含義                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                               |
| `command`           | 受管理的 Codex 二進位檔                  | stdio 傳輸的可執行檔。保留未設定以使用受管理的二進位檔；只有在明確覆寫時才設定它。                                                                                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 傳輸的引數。                                                                                                                                                                                                                  |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                          |
| `authToken`         | 未設定                                   | WebSocket 傳輸的 Bearer 權杖。                                                                                                                                                                                                      |
| `headers`           | `{}`                                     | 額外的 WebSocket 標頭。                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | OpenClaw 建立其繼承環境後，從產生的 stdio app-server 程序移除的額外環境變數名稱。`CODEX_HOME` 和 `HOME` 保留給 OpenClaw 在本機啟動時使用的每代理 Codex 隔離。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                    |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 審查執行的預設組態。                                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | 傳送到執行緒開始／恢復／回合的原生 Codex 核准政策。                                                                                                                                                                                 |
| `sandbox`           | `"danger-full-access"`                   | 傳送到執行緒開始／恢復的原生 Codex sandbox 模式。                                                                                                                                                                                   |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 讓 Codex 審查原生核准提示。`guardian_subagent` 仍是舊版別名。                                                                                                                                                  |
| `serviceTier`       | 未設定                                   | 選用的 Codex app-server 服務層級：`"fast"`、`"flex"` 或 `null`。無效的舊版值會被忽略。                                                                                                                                              |

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 設定邊界：每個 Codex `item/tool/call` 要求都必須在
30 秒內收到 OpenClaw 回應。逾時時，OpenClaw 會在支援的情況下中止工具
signal，並向 Codex 傳回失敗的動態工具回應，讓該回合可繼續，而不是讓工作階段停留在 `processing`。

OpenClaw 回應 Codex 回合範圍的 app-server 要求後，harness
也預期 Codex 會以 `turn/completed` 完成原生回合。如果
app-server 在該回應後 60 秒內沒有動靜，OpenClaw 會盡力
中斷 Codex 回合、記錄診斷逾時，並釋放
OpenClaw 工作階段通道，使後續聊天訊息不會排在過期的
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。對於可重複的部署，建議使用設定檔，
因為它會把 Plugin 行為與其餘 Codex harness 設定保留在同一個已審查檔案中。

## 電腦使用

電腦使用有其自己的設定指南：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會內建桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex app-server，驗證
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

可從命令介面檢查或安裝設定：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

電腦使用僅適用於 macOS，且在 Codex MCP 伺服器可控制應用程式前，
可能需要本機 OS 權限。如果 `computerUse.enabled` 為 true 且 MCP
伺服器不可用，Codex 模式回合會在執行緒開始前失敗，而不是
在沒有原生電腦使用工具的情況下靜默執行。請參閱
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)，了解 marketplace 選項、
遠端目錄限制、狀態原因與疑難排解。

當 `computerUse.autoInstall` 為 true 時，若 Codex
尚未發現本機 marketplace，OpenClaw 可以從
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 註冊標準的
內建 Codex Desktop marketplace。變更 runtime 或電腦使用設定後，請使用 `/new` 或 `/reset`，
讓現有工作階段不要保留舊的 PI 或 Codex 執行緒繫結。

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

Guardian 審查的 Codex 核准：

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
現有 Codex 執行緒時，下一個回合會再次將目前選取的
OpenAI 模型、provider、核准政策、sandbox 和服務層級傳送給
app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留
執行緒繫結，但要求 Codex 使用新選取的模型繼續。

## Codex 命令

內建 Plugin 會將 `/codex` 註冊為授權的斜線命令。它是
通用的，並可在任何支援 OpenClaw 文字命令的頻道上運作。

常見形式：

- `/codex status` 會顯示即時 app-server 連線能力、模型、帳戶、速率限制、MCP 伺服器，以及 skills。
- `/codex models` 會列出即時 Codex app-server 模型。
- `/codex threads [filter]` 會列出最近的 Codex 執行緒。
- `/codex resume <thread-id>` 會將目前的 OpenClaw 工作階段附加到現有的 Codex 執行緒。
- `/codex compact` 會要求 Codex app-server 壓縮已附加的執行緒。
- `/codex review` 會針對已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加執行緒的 Codex 診斷意見回饋前先詢問。
- `/codex computer-use status` 會檢查已設定的 Computer Use plugin 和 MCP 伺服器。
- `/codex computer-use install` 會安裝已設定的 Computer Use plugin，並重新載入 MCP 伺服器。
- `/codex account` 會顯示帳戶和速率限制狀態。
- `/codex mcp` 會列出 Codex app-server MCP 伺服器狀態。
- `/codex skills` 會列出 Codex app-server skills。

當 Codex 回報用量限制失敗時，如果 Codex 提供了下一次
app-server 重設時間，OpenClaw 會一併包含該時間。請在同一個
對話中使用 `/codex account` 檢查目前帳戶和速率限制時段。

### 常見除錯工作流程

當 Codex 支援的 agent 在 Telegram、Discord、Slack
或其他 channel 中做出令人意外的行為時，請從問題發生的對話開始：

1. 執行 `/diagnostics bad tool choice after image upload`，或另一段描述你所見情況的簡短附註。
2. 核准診斷要求一次。核准後會建立本機 Gateway
   診斷 zip，且因為該工作階段正在使用 Codex harness，也會
   將相關的 Codex 意見回饋套件傳送到 OpenAI 伺服器。
3. 將完成後的診斷回覆複製到 bug 回報或支援討論串。
   其中包含本機套件路徑、隱私摘要、OpenClaw 工作階段 ID、
   Codex 執行緒 ID，以及每個 Codex 執行緒的 `Inspect locally` 行。
4. 如果你想自行除錯該次執行，請在終端機中執行列印出的 `Inspect locally`
   指令。它看起來會像 `codex resume <thread-id>`，並會開啟
   原生 Codex 執行緒，讓你檢查對話、在本機繼續它，
   或詢問 Codex 為什麼選擇特定 tool 或 plan。

只有在你特別想為目前已附加的執行緒上傳 Codex
意見回饋，而不需要完整 OpenClaw
Gateway 診斷套件時，才使用 `/codex diagnostics [note]`。對大多數支援回報而言，`/diagnostics [note]` 是
更好的起點，因為它會在同一則回覆中將本機 Gateway 狀態與 Codex
執行緒 ID 關聯起來。完整的隱私模型與群組聊天行為，請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。

核心 OpenClaw 也會公開 owner-only `/diagnostics [note]` 作為一般
Gateway 診斷指令。它的核准提示會顯示敏感資料
前言、連結到 [診斷匯出](/zh-TW/gateway/diagnostics)，並且每次都透過明確的 exec 核准
要求執行 `openclaw gateway diagnostics export --json`。請勿使用 allow-all 規則核准診斷。核准後，
OpenClaw 會傳送一份可貼上的報告，其中包含本機套件路徑和 manifest
摘要。當作用中的 OpenClaw 工作階段正在使用 Codex harness 時，
同一次核准也會授權將相關 Codex 意見回饋套件傳送到
OpenAI 伺服器。核准提示會說明將會傳送 Codex 意見回饋，但
在核准前不會列出 Codex 工作階段或執行緒 ID。

如果 `/diagnostics` 是由 owner 在群組聊天中叫用，OpenClaw 會保持
共享 channel 乾淨：群組只會收到一則簡短通知，而
診斷前言、核准提示，以及 Codex 工作階段/執行緒 ID 會透過
私人核准路由傳送給 owner。如果沒有私人 owner 路由，
OpenClaw 會拒絕該群組要求，並要求 owner 從 DM 執行。

已核准的 Codex 上傳會呼叫 Codex app-server `feedback/upload`，並要求
app-server 在可用時納入每個列出執行緒和衍生 Codex 子執行緒的記錄。
該上傳會透過 Codex 的一般意見回饋路徑送往 OpenAI
伺服器；如果該 app-server 已停用 Codex 意見回饋，指令會回傳
app-server 錯誤。完成後的診斷回覆會列出已傳送執行緒的 channel、
OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機 `codex resume <thread-id>`
指令。如果你拒絕或忽略核准，
OpenClaw 不會列印那些 Codex ID。此上傳不會取代本機
Gateway 診斷匯出。

`/codex resume` 會寫入與 harness 用於一般回合相同的 sidecar 綁定檔。
在下一則訊息時，OpenClaw 會恢復該 Codex 執行緒，將
目前選取的 OpenClaw 模型傳入 app-server，並保持延伸歷史記錄
啟用。

### 從 CLI 檢查 Codex 執行緒

了解錯誤 Codex 執行的最快方式，通常是直接開啟原生 Codex
執行緒：

```sh
codex resume <thread-id>
```

當你在 channel 對話中注意到 bug，並想檢查
有問題的 Codex 工作階段、在本機繼續它，或詢問 Codex 為什麼做出
特定 tool 或推理選擇時，請使用此方式。最簡單的路徑通常是先執行
`/diagnostics [note]`：核准後，完成的報告會列出
每個 Codex 執行緒，並列印一個 `Inspect locally` 指令，例如
`codex resume <thread-id>`。你可以直接將該指令複製到終端機。

你也可以從目前聊天的 `/codex binding` 取得 thread id，或從近期的 Codex app-server threads 使用 `/codex threads [filter]` 取得，然後在 shell 中執行相同的 `codex resume` 命令。

命令介面需要 Codex app-server `0.125.0` 或更新版本。如果未來或自訂 app-server 未公開該 JSON-RPC 方法，個別控制方法會回報為 `unsupported by this Codex app-server`。

## Hook 邊界

Codex harness 有三個 hook 層：

| 層級                                  | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                 | 跨 PI 與 Codex harnesses 的產品/Plugin 相容性。                     |
| Codex app-server extension middleware | OpenClaw bundled plugins | 圍繞 OpenClaw 動態工具的每回合 adapter 行為。                       |
| Codex native hooks                    | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。                |

OpenClaw 不使用專案或全域 Codex `hooks.json` 檔案來路由 OpenClaw plugin 行為。對於受支援的原生工具與權限橋接，OpenClaw 會針對 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入每個 thread 的 Codex 設定。其他 Codex hooks，例如 `SessionStart` 和 `UserPromptSubmit`，仍然是 Codex 層級的控制；它們不會在 v1 contract 中公開為 OpenClaw plugin hooks。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求呼叫後執行工具，因此 OpenClaw 會在 harness adapter 中觸發其擁有的 Plugin 和 middleware 行為。對於 Codex 原生工具，Codex 擁有 canonical 工具記錄。OpenClaw 可以鏡像選定事件，但除非 Codex 透過 app-server 或原生 hook callbacks 公開該操作，否則它無法重寫原生 Codex thread。

Compaction 和 LLM 生命週期投影來自 Codex app-server notifications 與 OpenClaw adapter 狀態，而不是原生 Codex hook 命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是 adapter 層級的觀察結果，不是 Codex 內部請求或 compaction payloads 的逐位元組擷取。

Codex 原生 `hook/started` 和 `hook/completed` app-server notifications 會被投影為 `codex_app_server.hook` agent events，用於 trajectory 與除錯。它們不會叫用 OpenClaw plugin hooks。

## V1 支援 contract

Codex 模式不是底層換成不同模型呼叫的 PI。Codex 擁有更多原生模型 loop，而 OpenClaw 會圍繞該邊界調整其 Plugin 與 session 介面。

Codex runtime v1 支援：

| 介面                                          | 支援狀態                                | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型 loop                | 支援                                    | Codex app-server 擁有 OpenAI turn、原生 thread resume，以及原生工具 continuation。                                                                                                                     |
| OpenClaw channel routing 和 delivery          | 支援                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他 channels 保持在模型 runtime 之外。                                                                                                                 |
| OpenClaw 動態工具                             | 支援                                    | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 會保留在執行路徑中。                                                                                                                                  |
| Prompt 和 context plugins                     | 支援                                    | OpenClaw 會在開始或 resume thread 前建構 prompt overlays，並將 context 投影到 Codex turn 中。                                                                                                          |
| Context engine 生命週期                       | 支援                                    | Assemble、ingest 或 after-turn maintenance，以及 context-engine compaction coordination 會針對 Codex turns 執行。                                                                                      |
| 動態工具 hooks                                | 支援                                    | `before_tool_call`、`after_tool_call` 和 tool-result middleware 會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                   |
| 生命週期 hooks                                | 作為 adapter observations 支援          | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以誠實的 Codex-mode payloads 觸發。                                                                                |
| 最終答案 revision gate                        | 透過原生 hook relay 支援                | Codex `Stop` 會 relay 到 `before_agent_finalize`；`revise` 會要求 Codex 在 finalization 前再執行一次模型 pass。                                                                                        |
| 原生 shell、patch 和 MCP block 或 observe     | 透過原生 hook relay 支援                | Codex `PreToolUse` 和 `PostToolUse` 會針對已承諾的原生工具介面 relay，包括 Codex app-server `0.125.0` 或更新版本上的 MCP payloads。支援 blocking；不支援 argument rewriting。                         |
| 原生 permission policy                        | 透過原生 hook relay 支援                | 在 runtime 公開時，Codex `PermissionRequest` 可透過 OpenClaw policy 路由。如果 OpenClaw 未傳回 decision，Codex 會繼續走其正常 guardian 或 user approval path。                                        |
| App-server trajectory capture                 | 支援                                    | OpenClaw 會記錄傳送給 app-server 的 request，以及收到的 app-server notifications。                                                                                                                     |

Codex runtime v1 不支援：

| 表面                                                | V1 邊界                                                                                                                                         | 未來路徑                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生工具前 hooks 可以阻擋，但 OpenClaw 不會改寫 Codex 原生工具引數。                                                                     | 需要 Codex hook/schema 支援替換工具輸入。                                                 |
| 可編輯的 Codex 原生逐字稿歷史                       | Codex 擁有標準原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來內容，但不應變更未支援的內部項目。                                                | 若需要原生執行緒手術，請新增明確的 Codex app-server API。                                |
| Codex 原生工具記錄的 `tool_result_persist`          | 該 hook 會轉換 OpenClaw 擁有的逐字稿寫入，而不是 Codex 原生工具記錄。                                                                          | 可以鏡像已轉換的記錄，但標準改寫需要 Codex 支援。                                        |
| 豐富的原生 Compaction 中繼資料                      | OpenClaw 會觀察 Compaction 開始與完成，但不會收到穩定的保留/捨棄清單、token 差異或摘要酬載。                                                 | 需要更豐富的 Codex Compaction 事件。                                                      |
| Compaction 介入                                     | 目前 OpenClaw Compaction hooks 在 Codex 模式中屬於通知層級。                                                                                   | 若 plugins 需要否決或改寫原生 Compaction，請新增 Codex Compaction 前/後 hooks。          |
| 位元組對位元組的模型 API 請求擷取                  | OpenClaw 可以擷取 app-server 請求與通知，但 Codex core 會在內部建構最終的 OpenAI API 請求。                                                   | 需要 Codex 模型請求追蹤事件或除錯 API。                                                  |

## 工具、媒體與 Compaction

Codex harness 只會變更低階嵌入式 agent executor。

OpenClaw 仍會建構工具清單，並從 harness 接收動態工具結果。文字、圖片、影片、音樂、TTS、核准以及訊息工具輸出會繼續透過一般 OpenClaw 傳遞路徑。

原生 hook relay 刻意保持通用，但 v1 支援合約僅限於 OpenClaw 測試過的 Codex 原生工具與權限路徑。在 Codex runtime 中，這包含 shell、patch 與 MCP `PreToolUse`、`PostToolUse` 以及 `PermissionRequest` 酬載。在 runtime 合約命名之前，不要假設每個未來的 Codex hook 事件都是 OpenClaw Plugin 表面。

對於 `PermissionRequest`，OpenClaw 只會在 policy 做出決定時回傳明確允許或拒絕決策。沒有決策的結果並不代表允許。Codex 會將其視為沒有 hook 決策，並落到自己的 guardian 或使用者核准路徑。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准 elicitations 會透過 OpenClaw 的 Plugin 核准流程路由。Codex `request_user_input` 提示會傳回原始聊天，而下一個排隊的後續訊息會回答該原生 server 請求，而不是被導向為額外內容。其他 MCP elicitation 請求仍會失敗關閉。

作用中執行佇列導向會映射到 Codex app-server `turn/steer`。使用預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的安靜視窗內批次處理排隊的聊天訊息，並依抵達順序將它們作為一個 `turn/steer` 請求傳送。舊版 `queue` 模式會傳送個別的 `turn/steer` 請求。Codex review 與手動 Compaction turn 可以拒絕同一 turn 的導向，在此情況下，若所選模式允許 fallback，OpenClaw 會使用 followup queue。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

當所選模型使用 Codex harness 時，原生執行緒 Compaction 會委派給 Codex app-server。OpenClaw 會保留逐字稿鏡像，用於 channel 歷史、搜尋、`/new`、`/reset` 以及未來模型或 harness 切換。鏡像包含使用者提示、最終 assistant 文字，以及 app-server 發出時的輕量 Codex 推理或計畫記錄。目前，OpenClaw 只記錄原生 Compaction 開始與完成訊號。它尚未公開可供人閱讀的 Compaction 摘要，或可稽核的清單來說明 Codex 在 Compaction 後保留了哪些項目。

因為 Codex 擁有標準原生執行緒，`tool_result_persist` 目前不會改寫 Codex 原生工具結果記錄。它只會在 OpenClaw 正在寫入 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

媒體生成不需要 PI。圖片、影片、音樂、PDF、TTS 與媒體理解會繼續使用相符的 provider/model 設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 與 `messages.tts`。

## 疑難排解

**Codex 未顯示為一般 `/model` provider：** 對新 config 而言，這是預期行為。選取具有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或舊版 `codex/*` ref），啟用 `plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 當沒有 Codex harness 宣告該執行時，`agentRuntime.id: "auto"` 仍可使用 PI 作為相容性 backend。設定 `agentRuntime.id: "codex"` 可在測試時強制選取 Codex。強制 Codex runtime 會失敗，而不會 fallback 到 PI。一旦選取 Codex app-server，其失敗會直接浮現。

**app-server 被拒絕：** 升級 Codex，讓 app-server handshake 回報版本 `0.125.0` 或更新版本。相同版本的 prerelease 或帶有 build suffix 的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，會被拒絕，因為穩定版 `0.125.0` protocol floor 是 OpenClaw 測試的基準。

**模型探索速度很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。

**WebSocket transport 立即失敗：** 檢查 `appServer.url`、`authToken`，以及遠端 app-server 是否使用相同的 Codex app-server protocol 版本。

**非 Codex 模型使用 PI：** 除非你為該 agent 強制設定 `agentRuntime.id: "codex"` 或選取舊版 `codex/*` ref，否則這是預期行為。一般 `openai/gpt-*` 與其他 provider refs 在 `auto` 模式中會留在其正常 provider 路徑上。如果你強制設定 `agentRuntime.id: "codex"`，該 agent 的每個嵌入式 turn 都必須是 Codex 支援的 OpenAI 模型。

**Computer Use 已安裝但工具未執行：** 從新的工作階段檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用 `/new` 或 `/reset`；若問題持續，請重新啟動 gateway 以清除過期的原生 hook 註冊。如果 `computer-use.list_apps` 逾時，請重新啟動 Codex Computer Use 或 Codex Desktop 並重試。

## 相關

- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [Agent runtimes](/zh-TW/concepts/agent-runtimes)
- [Model providers](/zh-TW/concepts/model-providers)
- [OpenAI provider](/zh-TW/providers/openai)
- [狀態](/zh-TW/cli/status)
- [Plugin hooks](/zh-TW/plugins/hooks)
- [設定參考](/zh-TW/gateway/configuration-reference)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
