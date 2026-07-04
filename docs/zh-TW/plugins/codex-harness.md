---
read_when:
    - 您想使用隨附的 Codex app-server 測試框架
    - 你需要 Codex harness 設定範例
    - 你希望僅限 Codex 的部署失敗，而不是退回到 OpenClaw
summary: 透過內建的 Codex app-server 測試框架執行 OpenClaw 嵌入式 agent 回合
title: Codex 測試框架
x-i18n:
    generated_at: "2026-07-04T10:27:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

捆綁的 `codex` 外掛可讓 OpenClaw 透過 Codex app-server 執行嵌入式 OpenAI agent 回合，而不是使用內建的 OpenClaw harness。

當你希望由 Codex 擁有底層 agent 工作階段時，請使用 Codex harness：原生 thread resume、原生工具延續、原生壓縮，以及 app-server 執行。OpenClaw 仍然擁有聊天通道、工作階段檔案、模型選擇、OpenClaw 動態工具、核准、媒體傳遞，以及可見的 transcript mirror。

一般設定使用標準 OpenAI 模型參照，例如 `openai/gpt-5.5`。請勿設定舊版 Codex GPT 參照。將 OpenAI agent 驗證順序放在 `auth.order.openai` 下；較舊的舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序項目，是由 `openclaw doctor --fix` 修復的舊版狀態。

當沒有啟用 OpenClaw sandbox 時，OpenClaw 會以 Codex 原生 code mode 啟用的狀態啟動 Codex app-server thread，同時預設關閉 code-mode-only。這會讓 Codex 原生 workspace 與 code 能力保持可用，而 OpenClaw 動態工具則繼續透過 app-server `item/tool/call` bridge。啟用中的 OpenClaw sandboxing 和受限工具政策會完全停用原生 code mode，除非你選擇加入實驗性的 sandbox exec-server 路徑。

這項 Codex 原生功能不同於 [OpenClaw code mode](/zh-TW/reference/code-mode)，後者是用於一般 OpenClaw 執行的選擇加入式 QuickJS-WASI runtime，並使用不同的 `exec` 輸入形狀。

若要了解更廣泛的模型/provider/runtime 分工，請從 [Agent runtimes](/zh-TW/concepts/agent-runtimes) 開始。簡短來說：`openai/gpt-5.5` 是模型參照，`codex` 是 runtime，而 Telegram、Discord、Slack 或其他通道仍然是通訊介面。

## 需求

- OpenClaw 可使用捆綁的 `codex` 外掛。
- 如果你的設定使用 `plugins.allow`，請包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。捆綁外掛預設會管理相容的 Codex app-server binary，因此 `PATH` 上的本機 `codex` 命令不會影響一般 harness 啟動。
- 可透過 `openclaw models auth login --provider openai` 使用 Codex 驗證、agent 的 Codex home 中的 app-server 帳戶，或明確的 Codex API-key 驗證設定檔。

關於驗證優先順序、環境隔離、自訂 app-server 命令、模型探索，以及所有設定欄位，請參閱 [Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

多數想在 OpenClaw 中使用 Codex 的使用者會需要這條路徑：使用 ChatGPT/Codex 訂閱登入、啟用捆綁的 `codex` 外掛，並使用標準 `openai/gpt-*` 模型參照。

使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai
```

啟用捆綁的 `codex` 外掛並選取 OpenAI agent 模型：

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

如果你的設定使用 `plugins.allow`，也請在其中加入 `codex`：

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

## 與 Codex Desktop 和命令列介面共用 thread

預設的 `appServer.homeScope: "agent"` 會讓每個 OpenClaw agent 與操作者的原生 Codex 狀態隔離。若要讓擁有者要求 OpenClaw 檢查並管理 Codex Desktop 與 Codex 命令列介面中顯示的相同原生 thread，請選擇使用使用者 Codex home：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

User-home 模式僅適用於本機 stdio 傳輸。它會在設定時使用 `$CODEX_HOME`，否則使用 `~/.codex`，包含該 home 的原生 Codex 驗證、設定、外掛與 thread store。OpenClaw 不會將 OpenClaw 驗證設定檔注入此 app-server。

擁有者回合會取得 `codex_threads` 工具。它可以列出、搜尋、讀取、fork、重新命名、封存與還原原生 thread。當你想在 OpenClaw 中繼續某個 thread 時，請要求 agent fork 該 thread；該 fork 會附加到目前的 OpenClaw 工作階段，並且仍會對其他原生 Codex 用戶端可見。封存需要明確確認該 thread 已在其他地方關閉。

請勿同時從 OpenClaw 和另一個 Codex 用戶端 resume 或寫入同一個 thread。Codex 會在單一 app-server 程序內協調即時寫入者，而不是跨獨立的 Desktop、命令列介面與 OpenClaw 程序協調。Fork 會建立一個獨立的延續，是安全共存的路徑。

## 設定

快速開始設定是最低可行的 Codex harness 設定。請在 OpenClaw 設定中設定 Codex harness 選項，並且只將命令列介面用於 Codex 驗證：

| 需求                                   | 設定                                                                              | 位置                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 啟用 harness                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                    |
| 保留列入允許清單的外掛安裝     | 在 `plugins.allow` 中包含 `codex`                                               | OpenClaw 設定                    |
| 透過 Codex 路由 OpenAI agent 回合 | `agents.defaults.model` 或 `agents.list[].model` 使用 `openai/gpt-*`               | OpenClaw agent 設定              |
| 使用 ChatGPT/Codex OAuth 登入       | `openclaw models auth login --provider openai`                                   | 命令列介面驗證設定檔                   |
| 為 Codex 執行新增 API-key 備援      | 在 `auth.order.openai` 中列於訂閱驗證之後的 `openai:*` API-key 設定檔 | 命令列介面驗證設定檔 + OpenClaw 設定 |
| Codex 不可用時 fail closed  | Provider 或模型 `agentRuntime.id: "codex"`                                     | OpenClaw 模型/provider 設定     |
| 使用直接 OpenAI API 流量          | Provider 或模型 `agentRuntime.id: "openclaw"` 搭配一般 OpenAI 驗證          | OpenClaw 模型/provider 設定     |
| 調整 app-server 行為               | `plugins.entries.codex.config.appServer.*`                                       | Codex 外掛設定                |
| 啟用原生 Codex 外掛 app        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex 外掛設定                |
| 啟用 Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | Codex 外掛設定                |

對於 Codex 支援的 OpenAI agent 回合，請使用 `openai/gpt-*` 模型參照。建議使用 `auth.order.openai` 來安排訂閱優先/API-key 備援的順序。現有舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序是僅由 doctor 處理的舊版狀態；請勿寫入新的舊版 Codex GPT 參照。

請勿在 Codex 支援的 agent 上設定 `compaction.model` 或 `compaction.provider`。Codex 會透過其原生 app-server thread 狀態進行壓縮，因此 OpenClaw 會在 runtime 忽略這些本機 summarizer override，且 `openclaw doctor --fix` 會在 agent 使用 Codex 時移除它們。

Lossless 仍支援作為 Codex 回合周邊組裝、擷取和維護的 context engine。請透過 `plugins.slots.contextEngine: "lossless-claw"` 和 `plugins.entries.lossless-claw.config.summaryModel` 設定它，而不是透過 `agents.defaults.compaction.provider`。當 Codex 是作用中的 runtime 時，`openclaw doctor --fix` 會將舊的 `compaction.provider: "lossless-claw"` 形狀遷移到 Lossless context-engine slot，但原生 Codex 仍然擁有壓縮。

原生 Codex app-server harness 支援需要 pre-prompt assembly 的 context engine。包含 `codex-cli` 在內的一般命令列介面 backend 不提供該 host 能力。

對於 Codex 支援的 agent，`/compact` 會在綁定的 thread 上啟動原生 Codex app-server 壓縮。OpenClaw 不會等待完成、施加 OpenClaw timeout、重新啟動共用 app-server，或 fallback 到 context-engine 或公開 OpenAI summarizer。如果缺少原生 Codex thread binding 或其已過期，命令會 fail closed，讓操作者看到真正的 runtime 邊界，而不是悄悄切換壓縮 backend。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在該形狀中，兩個設定檔仍會針對 `openai/gpt-*` agent 回合透過 Codex 執行。API key 只是驗證 fallback，而不是切換到 OpenClaw 或普通 OpenAI Responses 的要求。

本頁其餘部分涵蓋使用者必須選擇的常見變體：部署形狀、fail-closed 路由、guardian 核准政策、原生 Codex 外掛，以及 Computer Use。完整選項清單、預設值、enum、探索、環境隔離、timeout 和 app-server 傳輸欄位，請參閱 [Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex runtime

在你預期使用 Codex 的聊天中使用 `/status`。Codex 支援的 OpenAI agent 回合會顯示：

```text
Runtime: OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線、帳戶、rate limit、MCP server 和 Skills。`/codex models` 會列出 harness 與帳戶的即時 Codex app-server catalog。如果 `/status` 的結果出乎意料，請參閱 [疑難排解](#troubleshooting)。

## 路由與模型選擇

請將 provider 參照與 runtime 政策分開：

- 使用 `openai/gpt-*` 透過 Codex 執行 OpenAI agent 回合。
- 請勿在設定中使用舊版 Codex GPT 參照。執行 `openclaw doctor --fix` 以修復舊版參照和過期的工作階段路由 pin。
- `agentRuntime.id: "codex"` 對一般 OpenAI auto mode 是選用的，但當部署需要在 Codex 不可用時 fail closed，則很有用。
- `agentRuntime.id: "openclaw"` 會在有意如此時，讓 provider 或模型使用 OpenClaw embedded runtime。
- `/codex ...` 會從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部 harness 路徑。只有在使用者要求 ACP/acpx 或外部 harness adapter 時才使用它。

常見命令路由：

| 使用者意圖                                           | 使用                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前聊天                               | `/codex bind [--cwd <path>]`                                                                          |
| 恢復既有 Codex 執行緒                       | `/codex resume <thread-id>`                                                                           |
| 列出或篩選 Codex 執行緒                          | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 外掛                             | `/codex plugins list`                                                                                 |
| 啟用或停用已設定的原生 Codex 外掛    | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 在已配對節點上附加既有 Codex 命令列介面工作階段 | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| 只傳送 Codex 意見回饋                              | `/codex diagnostics [note]`                                                                           |
| 啟動 ACP/acpx 工作                                | ACP/acpx 工作階段命令，不是 `/codex`                                                               |

| 使用案例                                             | 設定                                                              | 驗證                                  | 備註                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| 使用原生 Codex 執行環境的 ChatGPT/Codex 訂閱 | `openai/gpt-*` 加上已啟用的 `codex` 外掛                             | `/status` 顯示 `Runtime: OpenAI Codex` | 建議路徑                      |
| 如果 Codex 無法使用則關閉失敗                  | 提供者或模型 `agentRuntime.id: "codex"`                           | 回合會失敗，而不是使用內嵌備援 | 用於僅限 Codex 的部署        |
| 透過 OpenClaw 直接傳送 OpenAI API 金鑰流量       | 提供者或模型 `agentRuntime.id: "openclaw"` 和一般 OpenAI 驗證 | `/status` 顯示 OpenClaw 執行環境        | 只在刻意使用 OpenClaw 時使用 |
| 舊版設定                                        | 舊版 Codex GPT 參照                                                  | `openclaw doctor --fix` 會重寫它     | 不要以這種方式撰寫新設定      |
| ACP/acpx Codex 轉接器                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP 工作/工作階段狀態                 | 與原生 Codex harness 分開    |

`agents.defaults.imageModel` 遵循相同的前綴分流。一般 OpenAI 路徑請使用 `openai/gpt-*`，
只有在影像理解應透過受限的 Codex 應用程式伺服器回合執行時，才使用 `codex/gpt-*`。
不要使用舊版 Codex GPT 參照；doctor 會將該舊版前綴重寫為 `openai/gpt-*`。

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

### 混合提供者部署

此形態保留 Claude 作為預設 agent，並新增一個具名 Codex agent：

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

使用此設定時，`main` agent 會使用其一般提供者路徑，而 `codex` agent 會使用 Codex 應用程式伺服器。

### 關閉失敗的 Codex 部署

對於 OpenAI agent 回合，當 bundled 外掛可用時，`openai/gpt-*` 已經會解析到 Codex。
當你想要寫明的關閉失敗規則時，請新增明確的執行環境政策：

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

強制使用 Codex 時，如果 Codex 外掛已停用、應用程式伺服器太舊，或應用程式伺服器無法啟動，OpenClaw 會提早失敗。

## 應用程式伺服器政策

預設情況下，外掛會在本機以 stdio 傳輸啟動 OpenClaw 管理的 Codex binary。
只有在你刻意要執行不同的可執行檔時，才設定 `appServer.command`。
只有在應用程式伺服器已在其他地方執行時，才使用 WebSocket 傳輸：

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

本機 stdio 應用程式伺服器工作階段預設採用受信任的本機操作者姿態：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本機 Codex 要求不允許該隱含的 YOLO 姿態，
OpenClaw 會改為選擇允許的 guardian 權限。當某個工作階段有啟用 OpenClaw sandbox 時，
OpenClaw 會停用 Codex 原生 Code Mode、使用者 MCP 伺服器，以及由應用程式支援的外掛執行，
而不是依賴 Codex 主機端 sandboxing。當一般 exec/process tools 可用時，shell 存取會透過
OpenClaw sandbox 支援的動態工具公開，例如 `sandbox_exec` 和 `sandbox_process`。

當你希望 Codex 原生自動審查先於 sandbox escape 或額外權限時，請使用正規化的 OpenClaw exec 模式：

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
Guardian 審查的核准，通常是
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和
`sandbox: "workspace-write"`，前提是本機要求允許這些值。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不會保留舊版不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若要刻意採用免核准的 Codex 姿態，
請使用 `tools.exec.mode: "full"`。舊版 `plugins.entries.codex.config.appServer.mode: "guardian"`
預設組態仍可運作，但 `tools.exec.mode: "auto"` 是正規化的 OpenClaw 介面。

若要查看與主機 exec 核准和 ACPX 權限的模式層級比較，
請參閱 [權限模式](/zh-TW/tools/permission-modes)。

如需每個應用程式伺服器欄位、驗證順序、環境隔離、探索和逾時行為，請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

bundled 外掛會在任何支援 OpenClaw 文字命令的 channel 上註冊 `/codex` 作為 slash command。

原生執行與控制需要擁有者或 `operator.admin` 閘道用戶端。
這包括綁定或恢復執行緒、傳送或停止回合、變更模型、快速模式或權限狀態、壓縮或審查，
以及解除附加綁定。其他授權傳送者會保留唯讀的狀態、說明、帳戶、模型、執行緒、
MCP 伺服器、skill 和綁定檢查命令。

常見形式：

- `/codex status` 會檢查應用程式伺服器連線、模型、帳戶、速率限制、MCP 伺服器和 Skills。
- `/codex models` 會列出即時 Codex 應用程式伺服器模型。
- `/codex threads [filter]` 會列出最近的 Codex 應用程式伺服器執行緒。
- `/codex resume <thread-id>` 會將目前 OpenClaw 工作階段附加到既有 Codex 執行緒。
- `/codex compact` 會要求 Codex 應用程式伺服器壓縮已附加的執行緒。
- `/codex review` 會對已附加的執行緒啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送已附加執行緒的 Codex 意見回饋前詢問。
- `/codex account` 會顯示帳戶與速率限制狀態。
- `/codex mcp` 會列出 Codex 應用程式伺服器 MCP 伺服器狀態。
- `/codex skills` 會列出 Codex 應用程式伺服器 skills。

對於大多數支援回報，請從發生 bug 的對話中的 `/diagnostics [note]` 開始。
它會建立一份閘道診斷報告，並且對 Codex harness 工作階段，要求核准傳送相關的 Codex 意見回饋 bundle。
請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)，了解隱私模型與群組聊天行為。

只有在你明確想要為目前附加的執行緒上傳 Codex 意見回饋，而不需要完整閘道診斷 bundle 時，
才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 執行緒

檢查不良 Codex 執行的最快方式，通常是直接開啟原生 Codex 執行緒：

```bash
codex resume <thread-id>
```

從已完成的 `/diagnostics` 回覆、`/codex binding` 或
`/codex threads [filter]` 取得執行緒 id。

如需上傳機制與執行環境層級診斷邊界，請參閱
[Codex harness 執行環境](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

在預設的個別 agent home 中，驗證會依此順序選擇：

1. 該 agent 的已排序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 之下。執行 `openclaw doctor --fix` 以遷移較舊的
   舊版 Codex 驗證設定檔 id 和舊版 Codex 驗證順序。
2. 該 agent 的 Codex home 中，應用程式伺服器的既有帳戶。
3. 僅限本機 stdio 應用程式伺服器啟動，在沒有應用程式伺服器帳戶且仍需要 OpenAI 驗證時，
   使用 `CODEX_API_KEY`，接著使用 `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，會從生成的 Codex 子程序中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓閘道層級 API 金鑰仍可用於 embeddings 或直接 OpenAI 模型，
而不會讓原生 Codex 應用程式伺服器回合意外透過 API 計費。
明確的 Codex API 金鑰設定檔和本機 stdio env-key 備援會使用應用程式伺服器登入，
而不是繼承的子程序 env。WebSocket 應用程式伺服器連線不會接收閘道 env API 金鑰備援；
請使用明確的驗證設定檔或遠端應用程式伺服器自己的帳戶。
設定原生 Codex 外掛時，OpenClaw 會在將外掛擁有的應用程式公開給 Codex 執行緒之前，
透過已連線的應用程式伺服器安裝或重新整理這些外掛。`app/list` 仍是應用程式 id、可存取性和中繼資料的事實來源，
但 OpenClaw 擁有每個執行緒的啟用決策：如果政策允許列出的可存取應用程式，
即使 `app/list` 目前報告該應用程式已停用，OpenClaw 仍會傳送
`thread/start.config.apps[appId].enabled = true`。此路徑不會為未知 id 發明應用程式安裝；
OpenClaw 只會使用 `plugin/install` 啟用 marketplace 外掛，然後重新整理 inventory。

如果訂閱設定檔遇到 Codex 使用量限制，當 Codex 回報重設時間時，OpenClaw 會記錄該時間，
並對同一個 Codex 執行嘗試下一個已排序的驗證設定檔。重設時間過後，訂閱設定檔會再次符合資格，
而不需要變更所選的 `openai/gpt-*` 模型或 Codex 執行環境。

對於本機 stdio app-server 啟動，OpenClaw 會將 `CODEX_HOME` 設為每個代理專用的
目錄，使 Codex 設定、驗證/帳戶檔案、外掛快取/資料，以及原生
執行緒狀態預設不會讀取或寫入操作員個人的 `~/.codex`。OpenClaw 會保留一般程序的
`HOME`；由 Codex 執行的子程序仍可找到使用者家目錄中的設定與權杖，而 Codex 也可能會發現共用的
`$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 項目。
使用 `appServer.homeScope: "user"` 時，OpenClaw 會改用原生使用者的 Codex
home 及其現有帳戶，而不注入 OpenClaw 驗證設定檔。

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
OpenClaw 會在本機啟動正規化期間，從此清單移除 `CODEX_HOME` 和 `HOME`：
`CODEX_HOME` 會持續指向所選的代理或使用者範圍，
而 `HOME` 會維持繼承，讓子程序可以使用一般使用者家目錄狀態。

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 不會公開
與 Codex 原生工作區操作重複的動態工具：`read`、`write`、
`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。大多數其餘的
OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、
閘道，以及 `heartbeat_respond`，都可透過 Codex 工具搜尋在
`openclaw` 命名空間下使用，讓初始模型脈絡更小。啟用搜尋且未選取
受管提供者時，網頁搜尋預設使用 Codex 託管的 `web_search` 工具。原生託管搜尋與 OpenClaw 的受管
`web_search` 動態工具互斥，因此受管搜尋無法繞過
原生網域限制。當託管搜尋不可用、明確停用，或由選取的受管提供者取代時，
OpenClaw 會使用受管工具。OpenClaw 會保持停用 Codex 的獨立
`web.run` 擴充功能，因為正式環境 app-server 流量會拒絕其使用者定義的 `web` 命名空間。
`tools.web.search.enabled: false` 會停用兩條路徑，工具停用的
僅 LLM 執行也是如此。Codex 會將 `"cached"` 視為偏好設定，並在不受限制的 app-server 回合中將其解析為即時
外部存取。設定原生 `allowedDomains` 時，自動受管備援會封閉失敗，因此允許清單無法被
繞過。持久的有效搜尋原則變更會在下一回合之前輪替已繫結的 Codex
執行緒。暫時的每回合限制會使用臨時受限執行緒，並保留現有繫結供之後繼續。
`sessions_yield` 和僅訊息工具的來源回覆會保持直接，因為
那些是回合控制契約。`sessions_spawn` 會保持可搜尋，因此 Codex 的
原生 `spawn_agent` 仍是主要的 Codex 子代理介面，而明確的
OpenClaw 或 ACP 委派仍可透過 `openclaw` 動態
工具命名空間使用。心跳偵測協作指示會告訴 Codex，在工具尚未
載入時，結束心跳偵測回合前先搜尋 `heartbeat_respond`。

只有在連線到無法搜尋延遲動態工具的自訂 Codex
app-server，或偵錯完整工具酬載時，才設定 `codexDynamicToolsLoading: "direct"`。

支援的頂層 Codex 外掛欄位：

| 欄位                       | 預設值         | 意義                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具脈絡。                       |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex app-server 回合省略的其他 OpenClaw 動態工具名稱。                            |
| `codexPlugins`             | 已停用         | 原生 Codex 外掛/app 支援，適用於已遷移、從來源安裝的精選外掛。                          |

支援的 `appServer` 欄位：

| 欄位                                         | 預設值                                                | 含義                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會啟動 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 會依每個 OpenClaw agent 隔離 Codex 狀態。`"user"` 會共用原生 `$CODEX_HOME` 或 `~/.codex`、使用原生驗證，並啟用僅限擁有者的執行緒管理。使用者範圍需要 stdio。                                                                                                                                                                                               |
| `command`                                     | 受管理的 Codex 二進位檔                                   | stdio 傳輸的可執行檔。保留未設定即可使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸的引數。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | 未設定                                                  | WebSocket 傳輸的不記名權杖。接受字面字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受字面字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立繼承環境後，會從產生的 stdio app-server 程序移除的額外環境變數名稱。OpenClaw 會保留選取的 `CODEX_HOME` 和繼承的 `HOME` 供本機啟動使用。                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | 選擇使用 Codex 的僅程式碼模式工具介面。OpenClaw 動態工具仍會註冊到 Codex，因此巢狀 `tools.*` 呼叫會透過 app-server `item/tool/call` 橋接返回。                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | 未設定                                                  | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從解析出的 OpenClaw 工作區推斷本機工作區根目錄，在此遠端根目錄下保留目前 cwd 後綴，並只將最終的 app-server cwd 傳送給 Codex。如果 cwd 位於解析出的 OpenClaw 工作區根目錄之外，OpenClaw 會採取失敗關閉，而不是將閘道本機路徑傳送到遠端 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一個 turn 後，或在 OpenClaw 等待 `turn/completed` 期間完成一個 turn 範圍的 app-server 請求後的靜默視窗。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後原始 assistant 進度、原始 reasoning 完成，或 reasoning 進度之後使用的完成閒置與進度防護。對於可信或高負載工作，其工具後合成可能合理地比最終 assistant 發布預算保持更久靜默，可使用此值。                                |
| `mode`                                        | 除非本機 Codex 需求不允許 YOLO，否則為 `"yolo"` | YOLO 或 guardian 審查執行的預設值。若本機 stdio 需求省略 `danger-full-access`、`never` 核准，或 `user` 審查者，隱含預設值會是 guardian。                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准原則       | 傳送到執行緒開始/恢復/turn 的原生 Codex 核准原則。guardian 預設值會在允許時偏好 `"on-request"`。                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙箱  | 傳送到執行緒開始/恢復的原生 Codex 沙箱模式。guardian 預設值會在允許時偏好 `"workspace-write"`，否則使用 `"read-only"`。當 OpenClaw 沙箱啟用時，`danger-full-access` turn 會使用 Codex `workspace-write`，其網路存取由 OpenClaw 沙箱輸出設定推導。                                                                                     |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審查者               | 在允許時使用 `"auto_review"` 讓 Codex 審查原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未設定                                                  | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會請求 flex 處理，`null` 會清除覆寫，且舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已停用                                               | 選擇為 app-server 命令啟用 Codex 權限設定檔網路功能。OpenClaw 會定義選取的 `permissions.<profile>.network` 設定，並以 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽選項，會向 Codex app-server 0.132.0 或更新版本註冊一個由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行能在啟用中的 OpenClaw 沙箱內執行。                                                                                                                                                                                                         |

`appServer.networkProxy` 是明確設定，因為它會變更 Codex 沙箱
契約。啟用後，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動 Codex 受管理網路。預設情況下，OpenClaw 會從
設定檔內容產生抗衝突的 `openclaw-network-<fingerprint>` 設定檔名稱；只有在需要穩定的本機名稱時才使用 `profileName`。

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
`networkProxy` 會讓產生的權限設定檔使用工作區風格的檔案系統存取。Codex 管理的網路強制執行是沙盒化網路，
所以完整存取權限設定檔不會保護對外流量。
網域項目使用 `allow` 或 `deny`；Unix socket 項目使用 Codex 的
`allow` 或 `none` 值。

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 設定界限：Codex `item/tool/call` 請求預設使用 90 秒的
OpenClaw 看門狗。正值的每次呼叫 `timeoutMs` 引數會延長
或縮短該特定工具預算。當工具呼叫沒有提供自己的逾時時，`image_generate` 工具會使用
`agents.defaults.imageGenerationModel.timeoutMs`，否則使用 120 秒的影像產生預設值。
媒體理解 `image` 工具會使用
`tools.media.image.timeoutSeconds` 或其 60 秒媒體預設值。對於影像
理解，該逾時會套用到請求本身，且不會
因先前的準備工作而縮短。動態工具預算
上限為 600000 ms。逾時時，OpenClaw 會在支援的地方中止工具訊號，
並向 Codex 傳回失敗的動態工具回應，讓該回合
可以繼續，而不是讓工作階段停留在 `processing`。
這個看門狗是外層動態 `item/tool/call` 預算；供應商特定的
請求逾時會在該呼叫內執行，並保留其自身的逾時語意。

Codex 接受一個回合後，以及 OpenClaw 回應一個限定於回合的
app-server 請求後，harness 會預期 Codex 取得目前回合進展，並
最終以 `turn/completed` 完成原生回合。如果 app-server 在
`appServer.turnCompletionIdleTimeoutMs` 期間保持安靜，OpenClaw 會盡力
中斷 Codex 回合、記錄診斷逾時，並釋放
OpenClaw 工作階段通道，讓後續聊天訊息不會排在陳舊的
原生回合後面。同一回合的大多數非終端通知會解除該短
看門狗，因為 Codex 已證明該回合仍然存活。工具交接會使用
較長的工具後閒置預算：在 OpenClaw 傳回 `item/tool/call`
回應後、在 `commandExecution` 這類原生工具項目完成後、在原始
`custom_tool_call_output` 完成後，以及在工具後原始助理
進展、原始推理完成或推理進展之後。該防護會在設定時使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否則
預設為五分鐘。同一個工具後預算也會延長
Codex 發出下一個目前回合事件前靜默合成視窗的進展看門狗。
全域 app-server 通知，例如速率限制更新，
不會重設回合閒置進展。推理完成、commentary
`agentMessage` 完成，以及工具前原始推理或助理進展可能
後接自動最終回覆，因此它們使用進展後回覆
防護，而不是立即釋放工作階段通道。只有
最終／非 commentary 已完成的 `agentMessage` 項目與工具前原始
助理完成會啟動助理輸出釋放：如果 Codex 接著在沒有
`turn/completed` 的情況下保持安靜，OpenClaw 會盡力中斷原生回合並
釋放工作階段通道。如果另一個回合監看贏得該釋放競賽，
只要沒有原生請求、項目或動態工具完成仍在作用中，且
助理輸出釋放仍屬於最新完成的項目，且沒有
較晚的項目完成，OpenClaw 仍會接受已完成的最終助理項目。
這可以在完成工具工作後保留最終答案，而不重播該回合。
部分助理 delta、陳舊的較早回覆，以及空的較晚完成
不符合資格。可安全重播的 stdio
app-server 失敗，
包括沒有助理、工具、作用中項目
或副作用證據的回合完成閒置逾時，會在新的 app-server 嘗試中重試一次。不安全的
逾時仍會淘汰卡住的 app-server 用戶端並釋放 OpenClaw
工作階段通道。它們也會清除陳舊的原生執行緒綁定，而不是
自動重播。完成監看逾時會顯示 Codex 特定的逾時
文字：可安全重播的情況會說回應可能不完整，而不安全的情況
會告訴使用者在重試前先驗證目前狀態。公開逾時診斷
包含結構欄位，例如最後一個 app-server 通知方法、
原始助理回應項目 id/type/role、作用中請求／項目計數，以及已啟動的
監看狀態。當最後一個通知是原始助理回應項目時，它們
也會包含有界限的助理文字預覽。它們不包含原始提示或
工具內容。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，
`OPENCLAW_CODEX_APP_SERVER_BIN` 會略過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於
可重複部署，較建議使用設定，因為它會將外掛行為保留在與其餘
Codex harness 設定相同的已審閱檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw harness 回合相同的 Codex 執行緒中，使用 Codex app-server 自身的應用程式與外掛
能力。OpenClaw
不會將 Codex 外掛轉譯為合成的 `codex_plugin_*` OpenClaw
動態工具。

`codexPlugins` 只影響選取原生 Codex harness 的工作階段。它
不會影響內建 harness 執行、一般 OpenAI 供應商執行、ACP 對話
綁定或其他 harness。

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

當 OpenClaw 建立 Codex harness 工作階段
或取代陳舊的 Codex 執行緒綁定時，會計算執行緒應用程式設定。
它不會在每個回合重新計算。
變更 `codexPlugins` 後，使用 `/new`、`/reset`，或重新啟動閘道，讓
未來的 Codex harness 工作階段以更新後的應用程式集合啟動。

關於遷移資格、應用程式清單、破壞性動作政策、
elicitations，以及原生外掛診斷，請參閱
[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的應用程式與外掛存取由已登入的 Codex 帳戶控制，
對於 Business 和 Enterprise/Edu 工作區，則也由工作區應用程式控制項控制。請參閱
[搭配你的 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
以了解 OpenAI 的帳戶與工作區控制概覽。

## 電腦使用

電腦使用涵蓋在自己的設定指南中：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會內建桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex app-server，驗證
`computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間擁有原生 MCP
工具呼叫。

## 執行階段邊界

Codex harness 只會變更低階嵌入式代理執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行這些
  工具，因此 OpenClaw 仍在執行路徑中。
- Codex 原生 shell、patch、MCP 和原生應用程式工具由 Codex 擁有。
  OpenClaw 可以透過支援的
  relay 觀察或封鎖選取的原生事件，但它不會重寫原生工具引數。
- Codex 擁有原生壓縮。OpenClaw 會保留轉錄鏡像以供頻道
  歷史、搜尋、`/new`、`/reset`，以及未來模型或 harness 切換使用，但
  它不會用 OpenClaw 或 context-engine
  摘要器取代 Codex 壓縮。
- 媒體產生、媒體理解、TTS、核准與訊息工具
  輸出會繼續透過相符的 OpenClaw 供應商／模型設定。
- `tool_result_persist` 套用於 OpenClaw 擁有的轉錄工具結果，而不是
  Codex 原生工具結果記錄。

關於 hook 層、支援的 V1 介面、原生權限處理、佇列
導引、Codex 意見回饋上傳機制，以及壓縮詳細資訊，請參閱
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 沒有顯示為一般 `/model` 供應商：**對於
新設定，這是預期情況。選取 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用內建 harness 而不是 Codex：**請確認模型 ref 是
官方 OpenAI 供應商上的 `openai/gpt-*`，且 Codex 外掛已
安裝並啟用。如果你在測試時需要嚴格證明，請設定供應商或
模型 `agentRuntime.id: "codex"`。強制的 Codex 執行階段會失敗，而不是
退回到 OpenClaw。

**OpenAI Codex 執行階段退回到 API-key 路徑：**收集已遮蔽的
閘道摘錄，顯示模型、執行階段、選取的供應商與失敗。
請受影響的協作者在其 OpenClaw 主機上執行此唯讀命令：

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
路徑，而不是單純的 OpenAI API-key 失敗。

**仍保留舊版 Codex 模型 ref 設定：**執行 `openclaw doctor --fix`。
Doctor 會將舊版模型 ref 重寫為 `openai/*`、移除陳舊的工作階段與
整個代理執行階段固定設定，並保留既有的 auth-profile 覆寫。

**app-server 遭拒：**使用 Codex app-server `0.125.0` 或更新版本。
同版本的預先發行或帶有組建後綴的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom`，會遭拒，因為 OpenClaw 測試的是
穩定的 `0.125.0` 協定下限。

**`/codex status` 無法連線：**檢查 bundled `codex` 外掛是否
已啟用、在設定 allowlist 時 `plugins.allow` 是否包含它，以及
任何自訂 `appServer.command`、`url`、`authToken` 或 headers 是否有效。

**模型探索很慢：**降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：**檢查 `appServer.url`、`authToken`、
headers，以及遠端 app-server 是否使用相同的 Codex app-server
協定版本。

**原生 shell 或 patch 工具因 `Native hook relay unavailable` 而遭到封鎖：**
Codex 對話串仍在嘗試使用 OpenClaw 已不再註冊的原生 hook relay id。這是原生 Codex hook 傳輸問題，不是 ACP 後端、提供者、GitHub 或 shell 命令失敗。請在受影響的聊天中使用 `/new` 或 `/reset` 開始全新工作階段，然後重試一個無害的命令。如果那次可用，但下一次原生工具呼叫又失敗，請只把 `/new` 視為暫時因應方式：在重新啟動 Codex app-server 或 OpenClaw 閘道後，將提示複製到全新的工作階段，讓舊對話串被捨棄並重新建立原生 hook 註冊。

**非 Codex 模型使用內建執行框架：**這是預期行為，除非提供者或模型執行階段政策將其路由到其他執行框架。一般的非 OpenAI 提供者參照在 `auto` 模式下會保留在其正常的提供者路徑上。

**Computer Use 已安裝但工具未執行：**請從全新工作階段檢查 `/codex computer-use status`。如果工具回報 `Native hook relay unavailable`，請使用上述的原生 hook relay 復原方式。請參閱 [Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關內容

- [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [代理執行階段](/zh-TW/concepts/agent-runtimes)
- [模型提供者](/zh-TW/concepts/model-providers)
- [OpenAI 提供者](/zh-TW/providers/openai)
- [OpenAI Codex 說明](https://help.openai.com/en/collections/14937394-codex)
- [代理執行框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [外掛 hooks](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
