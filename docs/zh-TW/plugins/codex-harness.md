---
read_when:
    - 你想使用隨附的 Codex app-server harness
    - 你需要 Codex harness 設定範例
    - 你希望僅使用 Codex 的部署失敗，而不是回退到 OpenClaw
summary: 透過內建的 Codex app-server harness 執行 OpenClaw 嵌入式代理回合
title: Codex 執行框架
x-i18n:
    generated_at: "2026-07-03T13:16:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

內建的 `codex` 外掛讓 OpenClaw 透過 Codex app-server 執行嵌入式 OpenAI agent 回合，而不是使用內建的 OpenClaw harness。

當你希望由 Codex 擁有低階 agent 工作階段時，請使用 Codex harness：原生執行緒續接、原生工具延續、原生壓縮，以及 app-server 執行。OpenClaw 仍然擁有聊天通道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、媒體傳遞，以及可見的 transcript 鏡像。

一般設定會使用標準 OpenAI 模型參照，例如 `openai/gpt-5.5`。不要設定舊版 Codex GPT 參照。將 OpenAI agent 驗證順序放在 `auth.order.openai` 之下；較舊的舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序項目，都是由 `openclaw doctor --fix` 修復的舊版狀態。

沒有啟用 OpenClaw sandbox 時，OpenClaw 會在啟用 Codex 原生程式碼模式的情況下啟動 Codex app-server 執行緒，同時預設保持 code-mode-only 關閉。這會讓 Codex 原生工作區與程式碼能力保持可用，同時 OpenClaw 動態工具會繼續透過 app-server `item/tool/call` bridge。啟用中的 OpenClaw sandboxing 和受限工具政策會完全停用原生程式碼模式，除非你選擇加入實驗性的 sandbox exec-server 路徑。

這項 Codex 原生功能不同於 [OpenClaw 程式碼模式](/zh-TW/reference/code-mode)，後者是針對一般 OpenClaw 執行的選用 QuickJS-WASI runtime，並使用不同的 `exec` 輸入形狀。

如需了解更廣泛的模型/提供者/runtime 分工，請先閱讀 [Agent runtime](/zh-TW/concepts/agent-runtimes)。簡短來說：`openai/gpt-5.5` 是模型參照，`codex` 是 runtime，而 Telegram、Discord、Slack 或其他通道仍是通訊介面。

## 需求

- OpenClaw，且內建的 `codex` 外掛可用。
- 如果你的設定使用 `plugins.allow`，請包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。內建外掛預設會管理相容的 Codex app-server binary，因此 `PATH` 上的本機 `codex` 命令不會影響一般 harness 啟動。
- 可透過 `openclaw models auth login --provider openai` 使用 Codex 驗證、agent 的 Codex home 中的 app-server 帳戶，或明確的 Codex API 金鑰驗證設定檔。

如需驗證優先順序、環境隔離、自訂 app-server 命令、模型探索，以及所有設定欄位，請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

多數想在 OpenClaw 中使用 Codex 的使用者會想走這條路徑：使用 ChatGPT/Codex 訂閱登入、啟用內建的 `codex` 外掛，並使用標準 `openai/gpt-*` 模型參照。

使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai
```

啟用內建的 `codex` 外掛並選取 OpenAI agent 模型：

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
    },
  },
}
```

如果你的設定使用 `plugins.allow`，也請在那裡加入 `codex`：

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

變更外掛設定後，請重新啟動閘道。如果現有聊天已經有工作階段，請在測試 runtime 變更前使用 `/new` 或 `/reset`，讓下一個回合從目前設定解析 harness。

## 設定

快速開始設定是最低可行的 Codex harness 設定。請在 OpenClaw 設定中設定 Codex harness 選項，且命令列介面只用於 Codex 驗證：

| 需求                                   | 設定                                                                              | 位置                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 啟用 harness                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                    |
| 保留允許清單中的外掛安裝     | 在 `plugins.allow` 中包含 `codex`                                               | OpenClaw 設定                    |
| 透過 Codex 路由 OpenAI agent 回合 | `agents.defaults.model` 或 `agents.list[].model` 設為 `openai/gpt-*`               | OpenClaw agent 設定              |
| 使用 ChatGPT/Codex OAuth 登入       | `openclaw models auth login --provider openai`                                   | 命令列介面驗證設定檔                   |
| 為 Codex 執行加入 API 金鑰備援      | 在 `auth.order.openai` 中，訂閱驗證後列出的 `openai:*` API 金鑰設定檔 | 命令列介面驗證設定檔 + OpenClaw 設定 |
| Codex 不可用時封閉失敗  | 提供者或模型 `agentRuntime.id: "codex"`                                     | OpenClaw 模型/提供者設定     |
| 使用直接 OpenAI API 流量          | 提供者或模型 `agentRuntime.id: "openclaw"`，搭配一般 OpenAI 驗證          | OpenClaw 模型/提供者設定     |
| 調整 app-server 行為               | `plugins.entries.codex.config.appServer.*`                                       | Codex 外掛設定                |
| 啟用原生 Codex 外掛 app        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex 外掛設定                |
| 啟用 Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | Codex 外掛設定                |

對 Codex 後端的 OpenAI agent 回合使用 `openai/gpt-*` 模型參照。建議使用 `auth.order.openai` 來設定訂閱優先/API 金鑰備援的順序。現有舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序是只供 doctor 處理的舊版狀態；不要寫入新的舊版 Codex GPT 參照。

不要在 Codex 後端的 agent 上設定 `compaction.model` 或 `compaction.provider`。Codex 會透過其原生 app-server 執行緒狀態進行壓縮，因此 OpenClaw 會在 runtime 忽略這些本機 summarizer 覆寫，而當 agent 使用 Codex 時，`openclaw doctor --fix` 會移除它們。

Lossless 仍支援作為 Codex 回合周邊的組裝、擷取與維護 context engine。請透過 `plugins.slots.contextEngine: "lossless-claw"` 和 `plugins.entries.lossless-claw.config.summaryModel` 設定它，不要透過 `agents.defaults.compaction.provider`。當 Codex 是啟用中的 runtime 時，`openclaw doctor --fix` 會把舊的 `compaction.provider: "lossless-claw"` 形狀遷移到 Lossless context-engine slot，但原生 Codex 仍擁有壓縮。

原生 Codex app-server harness 支援需要 pre-prompt 組裝的 context engine。一般命令列介面後端，包括 `codex-cli`，不提供該 host 能力。

對 Codex 後端的 agent，`/compact` 會在綁定的執行緒上啟動原生 Codex app-server 壓縮。OpenClaw 不會等待完成、不會施加 OpenClaw timeout、不會重新啟動共用 app-server，也不會 fallback 到 context-engine 或公開 OpenAI summarizer。如果原生 Codex 執行緒綁定遺失或過期，命令會封閉失敗，讓操作者看到真正的 runtime 邊界，而不是靜默切換壓縮後端。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在該形狀中，這兩個設定檔對 `openai/gpt-*` agent 回合仍會透過 Codex 執行。API 金鑰只是驗證 fallback，不是要求切換到 OpenClaw 或普通 OpenAI Responses。

本頁其餘部分涵蓋使用者必須選擇的常見變體：部署形狀、封閉失敗路由、guardian 核准政策、原生 Codex 外掛，以及 Computer Use。如需完整選項清單、預設值、列舉、探索、環境隔離、timeout 和 app-server transport 欄位，請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex runtime

在你預期使用 Codex 的聊天中使用 `/status`。Codex 後端的 OpenAI agent 回合會顯示：

```text
Runtime: OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線能力、帳戶、速率限制、MCP 伺服器和 skills。`/codex models` 會列出該 harness 和帳戶的即時 Codex app-server catalog。如果 `/status` 的結果出乎預期，請參閱[疑難排解](#troubleshooting)。

## 路由與模型選擇

將提供者參照和 runtime 政策分開：

- 使用 `openai/gpt-*` 透過 Codex 執行 OpenAI agent 回合。
- 不要在設定中使用舊版 Codex GPT 參照。執行 `openclaw doctor --fix` 來修復舊版參照和過期的工作階段路由釘選。
- 對一般 OpenAI 自動模式而言，`agentRuntime.id: "codex"` 是選用的，但當部署應在 Codex 不可用時封閉失敗，這會很有用。
- `agentRuntime.id: "openclaw"` 會在有意這樣做時，將提供者或模型選用到 OpenClaw 嵌入式 runtime。
- `/codex ...` 會從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部 harness 路徑。只有在使用者要求 ACP/acpx 或外部 harness adapter 時才使用。

常見命令路由：

| 使用者意圖                                           | 使用                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前聊天                               | `/codex bind [--cwd <path>]`                                                                          |
| 續接現有 Codex 執行緒                       | `/codex resume <thread-id>`                                                                           |
| 列出或篩選 Codex 執行緒                          | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 外掛                             | `/codex plugins list`                                                                                 |
| 啟用或停用已設定的原生 Codex 外掛    | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 附加配對節點上的現有 Codex 命令列介面工作階段 | `/codex sessions --host <node> [filter]`，接著 `/codex resume <session-id> --host <node> --bind here` |
| 只傳送 Codex 意見回饋                              | `/codex diagnostics [note]`                                                                           |
| 啟動 ACP/acpx 任務                                | ACP/acpx 工作階段命令，而不是 `/codex`                                                               |

| 使用案例                                             | 設定                                                              | 驗證                                  | 備註                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱 | 啟用 `codex` 外掛並使用 `openai/gpt-*`                             | `/status` 顯示 `Runtime: OpenAI Codex` | 建議路徑                      |
| 如果 Codex 無法使用則失敗即關閉                  | Provider 或 model `agentRuntime.id: "codex"`                           | 回合失敗，而非嵌入式後援 | 用於僅限 Codex 的部署        |
| 透過 OpenClaw 直接傳送 OpenAI API 金鑰流量       | Provider 或 model `agentRuntime.id: "openclaw"` 加上一般 OpenAI 驗證 | `/status` 顯示 OpenClaw 執行階段        | 僅在刻意使用 OpenClaw 時使用 |
| 舊版設定                                        | 舊版 Codex GPT 參照                                                  | `openclaw doctor --fix` 會重寫它     | 不要以此方式撰寫新設定      |
| ACP/acpx Codex 配接器                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP 任務/工作階段狀態                 | 與原生 Codex harness 分開    |

`agents.defaults.imageModel` 遵循相同的前綴分流。一般 OpenAI 路徑使用 `openai/gpt-*`，
只有在影像理解應透過有界的 Codex 應用程式伺服器回合執行時，才使用 `codex/gpt-*`。不要使用
舊版 Codex GPT 參照；doctor 會將該舊版前綴重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

當所有 OpenAI agent 回合預設都應使用 Codex 時，請使用快速入門設定。

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
    },
  },
}
```

### 混合 provider 部署

此形狀會保留 Claude 作為預設 agent，並新增一個具名 Codex agent：

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

使用此設定時，`main` agent 會使用其一般 provider 路徑，而
`codex` agent 會使用 Codex 應用程式伺服器。

### 失敗即關閉的 Codex 部署

對 OpenAI agent 回合而言，當 bundled 外掛可用時，`openai/gpt-*` 已經會解析為 Codex。
當你想要明文的失敗即關閉規則時，請加入明確的執行階段政策：

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

在強制使用 Codex 時，如果 Codex 外掛已停用、應用程式伺服器版本太舊，
或應用程式伺服器無法啟動，OpenClaw 會提早失敗。

## 應用程式伺服器政策

預設情況下，外掛會以 stdio 傳輸在本機啟動 OpenClaw 管理的 Codex binary。
只有在你刻意要執行不同可執行檔時，才設定 `appServer.command`。
只有當應用程式伺服器已在其他地方執行時，才使用 WebSocket 傳輸：

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

本機 stdio 應用程式伺服器工作階段預設採用受信任的本機 operator 姿態：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。如果本機 Codex 需求不允許該隱含的 YOLO 姿態，
OpenClaw 會改為選取允許的 guardian 權限。當 OpenClaw sandbox 對該工作階段啟用時，
OpenClaw 會在該回合停用 Codex 原生 Code Mode、使用者 MCP 伺服器，以及應用程式支援的外掛執行，
而不是依賴 Codex 主機端 sandboxing。當一般 exec/process 工具可用時，
shell 存取會透過 OpenClaw sandbox 支援的動態工具公開，例如 `sandbox_exec` 和
`sandbox_process`。

當你希望 Codex 原生 auto-review 先於 sandbox 逸出或額外權限時，請使用正規化的 OpenClaw exec 模式：

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

對於 Codex 應用程式伺服器工作階段，OpenClaw 會將 `tools.exec.mode: "auto"` 對應到 Codex
Guardian 審查的核准，通常是在本機需求允許這些值時使用
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及
`sandbox: "workspace-write"`。在 `tools.exec.mode: "auto"` 中，OpenClaw 不會保留舊版不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若要刻意採用不需核准的 Codex 姿態，請使用
`tools.exec.mode: "full"`。舊版 `plugins.entries.codex.config.appServer.mode: "guardian"` preset 仍可運作，
但 `tools.exec.mode: "auto"` 是正規化的 OpenClaw 介面。

如需與主機 exec 核准和 ACPX 權限的模式層級比較，請參閱
[權限模式](/zh-TW/tools/permission-modes)。

如需每個應用程式伺服器欄位、驗證順序、環境隔離、探索，以及逾時行為，請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

bundled 外掛會在任何支援 OpenClaw 文字命令的 channel 上註冊 `/codex` 作為 slash command。

原生執行與控制需要 owner 或 `operator.admin` 閘道
client。這包括綁定或恢復執行緒、傳送或停止回合、
變更 model、fast-mode 或權限狀態、壓縮或審查，以及
分離綁定。其他授權寄件者保留唯讀狀態、help、
account、model、thread、MCP server、skill，以及 binding 檢查命令。

常見形式：

- `/codex status` 會檢查應用程式伺服器連線能力、models、account、rate limits、
  MCP servers，以及 Skills。
- `/codex models` 會列出即時 Codex 應用程式伺服器 models。
- `/codex threads [filter]` 會列出最近的 Codex 應用程式伺服器執行緒。
- `/codex resume <thread-id>` 會將目前 OpenClaw 工作階段附加到
  現有 Codex 執行緒。
- `/codex compact` 會要求 Codex 應用程式伺服器壓縮附加的執行緒。
- `/codex review` 會為附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送附加執行緒的 Codex feedback 前先詢問。
- `/codex account` 會顯示 account 與 rate-limit 狀態。
- `/codex mcp` 會列出 Codex 應用程式伺服器 MCP server 狀態。
- `/codex skills` 會列出 Codex 應用程式伺服器 Skills。

對於大多數支援回報，請在發生 bug 的對話中從 `/diagnostics [note]` 開始。
它會建立一份閘道診斷報告，並針對 Codex harness 工作階段，要求核准傳送相關的 Codex feedback bundle。
如需隱私模型與群組聊天行為，請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。

只有在你特別想要針對目前附加執行緒上傳 Codex feedback，而不需要完整閘道
診斷 bundle 時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 執行緒

檢查失敗 Codex 執行的最快方式，通常是直接開啟原生 Codex
執行緒：

```bash
codex resume <thread-id>
```

從完成的 `/diagnostics` 回覆、`/codex binding`，或
`/codex threads [filter]` 取得 thread id。

如需上傳機制與執行階段層級診斷邊界，請參閱
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

驗證會依此順序選取：

1. agent 的有序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 底下。執行 `openclaw doctor --fix` 以遷移較舊的
   舊版 Codex 驗證設定檔 id 與舊版 Codex 驗證順序。
2. 該 agent 的 Codex home 中，應用程式伺服器既有的 account。
3. 僅限本機 stdio 應用程式伺服器啟動，在沒有應用程式伺服器 account 且仍需要 OpenAI 驗證時，
   使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

當 OpenClaw 看見 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，會從 spawned Codex child process 中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓閘道層級 API keys 仍可用於 embeddings 或直接 OpenAI models，
但避免原生 Codex 應用程式伺服器回合意外透過 API 計費。
明確的 Codex API-key 設定檔與本機 stdio env-key 後援會使用 app-server
login，而不是繼承的 child-process env。WebSocket 應用程式伺服器連線不會收到閘道 env API-key 後援；
請使用明確的驗證設定檔或遠端應用程式伺服器自己的 account。
設定原生 Codex 外掛時，OpenClaw 會先透過連線的應用程式伺服器安裝或重新整理這些
外掛，然後才將外掛擁有的 apps 暴露給
Codex 執行緒。`app/list` 仍是 app ids、
可存取性與 metadata 的事實來源，但 OpenClaw 擁有每個執行緒的啟用
決策：如果政策允許列出的可存取 app，OpenClaw 會傳送
`thread/start.config.apps[appId].enabled = true`，即使 `app/list` 目前
回報該 app 已停用。此路徑不會為未知 ids 發明 app 安裝；
OpenClaw 只會透過 `plugin/install` 啟用 marketplace 外掛，
然後重新整理 inventory。

如果訂閱設定檔遇到 Codex 使用量限制，OpenClaw 會在 Codex 回報 reset
time 時記錄它，並針對同一個 Codex 執行嘗試下一個有序驗證設定檔。
當 reset time 過後，該訂閱設定檔會再次符合資格，
不需要變更選取的 `openai/gpt-*` model 或 Codex 執行階段。

對於本機 stdio 應用程式伺服器啟動，OpenClaw 會將 `CODEX_HOME` 設為每個 agent
專屬目錄，因此 Codex config、auth/account 檔案、外掛 cache/data，以及原生
thread 狀態，預設不會讀寫 operator 的個人 `~/.codex`。
OpenClaw 會保留一般 process `HOME`；Codex-run subprocesses
仍可找到 user-home config 與 tokens，而 Codex 也可能發現共用的
`$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` entries。

如果部署需要額外環境隔離，請將那些變數加入
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

`appServer.clearEnv` 只會影響 spawned Codex 應用程式伺服器 child process。
OpenClaw 會在本機啟動正規化期間，從此清單移除 `CODEX_HOME` 和 `HOME`：
`CODEX_HOME` 保持每個 agent 專屬，而 `HOME` 保持繼承，讓
subprocesses 可以使用一般 user-home 狀態。

Codex 動態工具預設為 `searchable` 載入。OpenClaw 不會公開
會重複 Codex 原生工作區操作的動態工具：`read`、`write`、
`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。大多數其餘的
OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、
閘道和 `heartbeat_respond`，都可透過 Codex 工具搜尋在
`openclaw` 命名空間下使用，讓初始模型上下文更小。啟用搜尋且未選取
受管理提供者時，網頁搜尋預設使用 Codex 託管的 `web_search` 工具。
原生託管搜尋與 OpenClaw 受管理的 `web_search` 動態工具互斥，因此受管理搜尋無法繞過
原生網域限制。當託管搜尋不可用、明確停用，或由選取的受管理提供者取代時，
OpenClaw 會使用受管理工具。
OpenClaw 會保持停用 Codex 獨立的 `web.run` 擴充功能，因為
正式環境 app-server 流量會拒絕其使用者定義的 `web` 命名空間。
`tools.web.search.enabled: false` 會停用兩條路徑，停用工具的
僅 LLM 執行也一樣。Codex 會將 `"cached"` 視為偏好設定，並在不受限制的
app-server 回合中將其解析為即時外部存取。當設定原生 `allowedDomains` 時，
自動受管理後援會失敗關閉，因此允許清單無法被繞過。持久的有效搜尋政策變更會在下一個回合前輪替已繫結的 Codex
執行緒。暫時的逐回合限制會使用臨時的受限
執行緒，並保留現有繫結以便稍後恢復。
`sessions_yield` 和僅訊息工具來源的回覆會保持直接，因為
那些是回合控制合約。`sessions_spawn` 會保持可搜尋，因此 Codex 的
原生 `spawn_agent` 仍是主要的 Codex 子代理介面，而明確的
OpenClaw 或 ACP 委派仍可透過 `openclaw` 動態
工具命名空間使用。心跳偵測協作指示會告訴 Codex 在結束心跳偵測回合前搜尋
`heartbeat_respond`，前提是該工具尚未
載入。

只有在連線到無法搜尋延後動態工具的自訂 Codex
app-server，或偵錯完整
工具承載資料時，才設定 `codexDynamicToolsLoading: "direct"`。

支援的頂層 Codex 外掛欄位：

| 欄位                       | 預設值         | 意義                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具上下文。                    |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server 回合中省略的其他 OpenClaw 動態工具名稱。                         |
| `codexPlugins`             | 已停用         | 對已遷移、由原始碼安裝的精選外掛提供原生 Codex 外掛/應用程式支援。                    |

支援的 `appServer` 欄位：

| 欄位                                          | 預設值                                                 | 意義                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                               |
| `command`                                     | 受管理的 Codex 二進位檔                               | stdio 傳輸的可執行檔。保留未設定以使用受管理的二進位檔；只有在需要明確覆寫時才設定。                                                                                                                                                                                                                                                                                                               |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸的 Bearer token。接受字面字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                      |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受字面字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                                 |
| `clearEnv`                                    | `[]`                                                   | 在 OpenClaw 建立其繼承環境後，從產生的 stdio app-server 程序中移除的額外環境變數名稱。OpenClaw 會保留每個代理程式的 `CODEX_HOME` 和繼承的 `HOME`，供本機啟動使用。                                                                                                                                                                   |
| `codeModeOnly`                                | `false`                                                | 選擇使用 Codex 的僅限程式碼模式工具介面。OpenClaw 動態工具仍會向 Codex 註冊，因此巢狀 `tools.*` 呼叫會透過 app-server `item/tool/call` 橋接返回。                                                                                                                                                                                     |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從已解析的 OpenClaw 工作區推斷本機工作區根目錄，在此遠端根目錄下保留目前 cwd 後綴，並只將最終的 app-server cwd 傳送給 Codex。如果 cwd 位於已解析的 OpenClaw 工作區根目錄之外，OpenClaw 會封閉失敗，而不是將閘道本機路徑傳送到遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | 在 Codex 接受一個回合後，或在回合範圍的 app-server 請求後，OpenClaw 等待 `turn/completed` 時的靜默視窗。                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | 在工具交接、原生工具完成、工具後原始助理進度、原始推理完成，或 OpenClaw 等待 `turn/completed` 時的推理進度之後使用的完成閒置與進度防護。對於可信或繁重的工作負載，若工具後合成可以合理地比最終助理發布預算保持更久靜默，請使用此設定。                                  |
| `mode`                                        | `"yolo"`，除非本機 Codex 要求不允許 YOLO              | YOLO 或由守護者審查執行的預設集。若本機 stdio 要求省略 `danger-full-access`、`never` 核准，或 `user` 審查者，隱含預設會是守護者模式。                                                                                                                                                                                               |
| `approvalPolicy`                              | `"never"` 或允許的守護者核准政策                      | 傳送到執行緒啟動/恢復/回合的原生 Codex 核准政策。守護者預設值會在允許時偏好 `"on-request"`。                                                                                                                                                                                                                                       |
| `sandbox`                                     | `"danger-full-access"` 或允許的守護者沙盒             | 傳送到執行緒啟動/恢復的原生 Codex 沙盒模式。守護者預設值會在允許時偏好 `"workspace-write"`，否則為 `"read-only"`。當 OpenClaw 沙盒處於作用中時，`danger-full-access` 回合會使用 Codex `workspace-write`，並根據 OpenClaw 沙盒出口設定衍生網路存取權。                  |
| `approvalsReviewer`                           | `"user"` 或允許的守護者審查者                         | 使用 `"auto_review"` 讓 Codex 在允許時審查原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                  |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會請求彈性處理，`null` 會清除覆寫，而舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                             |
| `networkProxy`                                | 已停用                                                 | 選擇對 app-server 命令使用 Codex 權限設定檔網路功能。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選用功能，會向 Codex app-server 0.132.0 或更新版本註冊由 OpenClaw 沙盒支援的 Codex 環境，讓原生 Codex 執行可以在作用中的 OpenClaw 沙盒內執行。                                                                                                                                                                                |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙盒
合約。啟用時，OpenClaw 也會在 Codex 執行緒設定中設定
`features.network_proxy.enabled` 和 `default_permissions`，讓產生的權限
設定檔可以啟動 Codex 受管理網路功能。預設情況下，OpenClaw 會從
設定檔本文產生抗碰撞的 `openclaw-network-<fingerprint>` 設定檔名稱；
只有在需要穩定的本機名稱時才使用 `profileName`。

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

如果一般 app-server 執行階段會是 `danger-full-access`，啟用
`networkProxy` 會對產生的權限設定檔使用工作區樣式的檔案系統存取權。
Codex 受管理網路強制執行是沙盒化網路，因此完整存取權設定檔無法保護
輸出流量。
網域項目使用 `allow` 或 `deny`；Unix socket 項目使用 Codex 的
`allow` 或 `none` 值。

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到限制：Codex `item/tool/call` 請求預設使用 90 秒的
OpenClaw watchdog。正數的每次呼叫 `timeoutMs` 引數會延長
或縮短該特定工具預算。當工具呼叫未提供自己的逾時值時，`image_generate` 工具會使用
`agents.defaults.imageGenerationModel.timeoutMs`，否則會使用 120 秒的影像生成預設值。
媒體理解 `image` 工具會使用
`tools.media.image.timeoutSeconds` 或其 60 秒媒體預設值。對於影像
理解，該逾時會套用於請求本身，且不會
因先前的準備工作而縮短。動態工具預算
上限為 600000 ms。逾時時，OpenClaw 會在支援時中止工具訊號，
並向 Codex 傳回失敗的動態工具回應，讓該回合
可以繼續，而不是讓工作階段停留在 `processing`。
這個 watchdog 是外層動態 `item/tool/call` 預算；提供者特定的
請求逾時會在該呼叫內執行，並保留自己的逾時語意。

在 Codex 接受一個回合之後，以及 OpenClaw 回應回合範圍的
app-server 請求之後，harness 會期待 Codex 在目前回合中取得進展，並
最終以 `turn/completed` 完成原生回合。如果 app-server 在
`appServer.turnCompletionIdleTimeoutMs` 期間保持靜默，OpenClaw 會盡力
中斷 Codex 回合、記錄診斷逾時，並釋放
OpenClaw 工作階段通道，讓後續聊天訊息不會排在過期的
原生回合之後。同一回合的大多數非終止通知會解除這個短
watchdog，因為 Codex 已證明該回合仍在運作。工具交接會使用
較長的工具後閒置預算：在 OpenClaw 傳回 `item/tool/call`
回應之後、在 `commandExecution` 等原生工具項目完成之後、在原始
`custom_tool_call_output` 完成之後，以及在工具後原始助理
進展、原始推理完成或推理進展之後。若已設定，防護會使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則
預設為五分鐘。相同的工具後預算也會延長
Codex 發出下一個目前回合事件前，靜默合成視窗的進展 watchdog。
全域 app-server 通知，例如速率限制更新，
不會重設回合閒置進展。推理完成、commentary
`agentMessage` 完成，以及工具前原始推理或助理進展，可能
接著自動產生最終回覆，因此它們會使用進展後回覆
防護，而不是立即釋放工作階段通道。只有
最終/非 commentary 已完成的 `agentMessage` 項目與工具前原始
助理完成，才會啟動助理輸出釋放：如果 Codex 接著保持靜默
且沒有 `turn/completed`，OpenClaw 會盡力中斷原生回合並
釋放工作階段通道。如果另一個回合監看贏得該釋放競爭，
只要沒有原生請求、項目或動態工具完成仍處於作用中，且
助理輸出釋放仍屬於最新完成項目，並且沒有
後續項目完成，OpenClaw 仍會接受已完成的最終助理項目。
這可以在已完成工具工作之後保留最終答案，而不重播該回合。
部分助理 delta、過期的較早回覆，以及空的較晚完成
都不符合資格。可安全重播的 stdio
app-server 失敗，
包括沒有助理、工具、作用中項目或副作用證據的回合完成閒置逾時，
會在新的 app-server 嘗試中重試一次。不安全的
逾時仍會淘汰卡住的 app-server 用戶端並釋放 OpenClaw
工作階段通道。它們也會清除過期的原生執行緒綁定，而不是
自動重播。完成監看逾時會顯示 Codex 特定的逾時
文字：可安全重播的案例會表示回應可能不完整，而不安全案例
會告知使用者在重試前先驗證目前狀態。公開逾時診斷
包含結構化欄位，例如最後一個 app-server 通知方法、
原始助理回應項目 id/type/role、作用中請求/項目計數，以及已啟動的
監看狀態。當最後一個通知是原始助理回應項目時，它們
也會包含受限的助理文字預覽。它們不會包含原始提示或
工具內容。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN`
會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於
可重複部署，建議使用設定，因為它會將外掛行為保留在
與其餘 Codex harness 設定相同的已審閱檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw harness 回合相同的 Codex 執行緒中，使用 Codex app-server 自己的 app 與外掛
能力。OpenClaw 不會將 Codex 外掛轉換為合成的 `codex_plugin_*` OpenClaw
動態工具。

`codexPlugins` 只會影響選取原生 Codex harness 的工作階段。它
不會影響內建 harness 執行、一般 OpenAI 提供者執行、ACP 對話
綁定，或其他 harness。

最小遷移設定：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

當 OpenClaw 建立 Codex harness 工作階段或取代過期的 Codex 執行緒綁定時，
會計算執行緒 app 設定。它不會在每個回合都重新計算。
變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動閘道，讓
未來的 Codex harness 工作階段以更新後的 app 集合啟動。

如需遷移資格、app 清單、破壞性動作政策、
elicitations，以及原生外掛診斷，請參閱
[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的 app 與外掛存取權由已登入的 Codex 帳戶控制，
而對 Business 與 Enterprise/Edu 工作區，則也由工作區 app 控制項控制。請參閱
[透過你的 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
以了解 OpenAI 的帳戶與工作區控制概覽。

## Computer Use

Computer Use 有自己的設定指南：
[Codex Computer Use](/zh-TW/plugins/codex-computer-use)。

簡短版：OpenClaw 不會內建桌面控制 app，也不會自行執行
桌面動作。它會準備 Codex app-server、驗證
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間擁有原生 MCP
工具呼叫。

## 執行階段邊界

Codex harness 只會變更低層級的嵌入式代理執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行這些
  工具，因此 OpenClaw 仍留在執行路徑中。
- Codex 原生 shell、patch、MCP 與原生 app 工具由 Codex 擁有。
  OpenClaw 可以透過支援的
  relay 觀察或封鎖選定的原生事件，但它不會重寫原生工具引數。
- Codex 擁有原生壓縮。OpenClaw 會保留轉錄鏡像，用於頻道
  歷史、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換，但
  它不會以 OpenClaw 或 context-engine
  摘要器取代 Codex 壓縮。
- 媒體生成、媒體理解、TTS、核准，以及 messaging-tool
  輸出會繼續透過相符的 OpenClaw 提供者/模型設定。
- `tool_result_persist` 會套用於 OpenClaw 擁有的轉錄工具結果，而不是
  Codex 原生工具結果記錄。

如需 hook 層、支援的 V1 表面、原生權限處理、佇列
導向、Codex 意見回饋上傳機制，以及壓縮詳細資訊，請參閱
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般 `/model` 提供者：** 對於
新設定，這是預期行為。請選取 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用內建 harness 而不是 Codex：** 請確認模型參照是
官方 OpenAI 提供者上的 `openai/gpt-*`，且 Codex 外掛已
安裝並啟用。如果測試時需要嚴格證明，請設定提供者或
模型 `agentRuntime.id: "codex"`。強制使用 Codex 執行階段時，若失敗會直接失敗，而不是
退回到 OpenClaw。

**OpenAI Codex 執行階段退回到 API 金鑰路徑：** 收集一段已遮罩的
閘道摘錄，顯示模型、執行階段、選取的提供者，以及失敗。
請受影響的協作者在其 OpenClaw 主機上執行這個唯讀命令：

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

有用的摘錄通常包含 `openai/gpt-5.5` 或 `openai/gpt-5.4`、
`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、
`candidateProvider: "openai"`，以及 `401`、`Incorrect API key` 或
`No API key` 結果。修正後的執行應顯示 OpenAI OAuth
路徑，而不是一般 OpenAI API 金鑰失敗。

**舊版 Codex 模型參照設定仍存在：** 執行 `openclaw doctor --fix`。
Doctor 會將舊版模型參照改寫為 `openai/*`、移除過期的工作階段與
整個代理執行階段 pin，並保留現有的 auth-profile 覆寫。

**app-server 被拒絕：** 請使用 Codex app-server `0.125.0` 或更新版本。
相同版本的 prerelease 或帶有 build 後綴的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom` 會被拒絕，因為 OpenClaw 會測試
穩定版 `0.125.0` 協定下限。

**`/codex status` 無法連線：** 檢查 bundled `codex` 外掛是否
已啟用、在設定 allowlist 時 `plugins.allow` 是否包含它，以及
任何自訂 `appServer.command`、`url`、`authToken` 或 headers 是否有效。

**模型探索很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：** 檢查 `appServer.url`、`authToken`、
headers，並確認遠端 app-server 使用相同的 Codex app-server
協定版本。

**原生 shell 或修補工具遭到封鎖並顯示 `Native hook relay unavailable`：**
Codex 執行緒仍在嘗試使用 OpenClaw 已不再註冊的原生鉤子中繼 ID。這是原生 Codex 鉤子傳輸問題，不是 ACP 後端、提供者、GitHub 或 shell 命令失敗。在受影響的聊天中使用 `/new` 或 `/reset` 啟動新工作階段，然後重試無害的命令。如果該命令成功一次，但下一次原生工具呼叫又失敗，請只將 `/new` 視為暫時性因應方式：重新啟動 Codex app-server 或 OpenClaw Gateway 後，將提示複製到新的工作階段，讓舊執行緒被捨棄並重新建立原生鉤子註冊。

**非 Codex 模型使用內建 harness：**這是預期行為，除非提供者或模型執行階段政策將它路由到另一個 harness。一般非 OpenAI 提供者參照在 `auto` 模式下會維持其正常提供者路徑。

**Computer Use 已安裝但工具未執行：**請從新的工作階段檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用上方的原生鉤子中繼復原方式。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關

- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [代理執行階段](/zh-TW/concepts/agent-runtimes)
- [模型提供者](/zh-TW/concepts/model-providers)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [OpenAI Codex 說明](https://help.openai.com/en/collections/14937394-codex)
- [代理 harness 外掛](/zh-TW/plugins/sdk-agent-harness)
- [外掛鉤子](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
