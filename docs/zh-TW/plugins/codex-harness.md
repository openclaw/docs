---
read_when:
    - 你想要使用隨附的 Codex app-server harness
    - 你需要 Codex harness 設定範例
    - 你希望僅限 Codex 的部署失敗，而不是回退到 OpenClaw
summary: 執行通過內建 Codex app-server 測試框架的 OpenClaw 內嵌代理回合
title: Codex harness
x-i18n:
    generated_at: "2026-06-27T19:35:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

bundled `codex` 外掛讓 OpenClaw 透過 Codex app-server 執行嵌入式 OpenAI 代理回合，而不是使用內建的 OpenClaw 執行框架。

當你希望由 Codex 擁有低階代理工作階段時，請使用 Codex 執行框架：
原生執行緒續接、原生工具接續、原生壓縮，以及
app-server 執行。OpenClaw 仍然擁有聊天頻道、工作階段檔案、模型
選擇、OpenClaw 動態工具、核准、媒體傳遞，以及可見的
逐字稿鏡像。

一般設定會使用標準 OpenAI 模型參照，例如 `openai/gpt-5.5`。
請勿設定舊版 Codex GPT 參照。將 OpenAI 代理驗證順序
放在 `auth.order.openai` 底下；較舊的舊版 Codex 驗證設定檔 ID 和
舊版 Codex 驗證順序項目是由
`openclaw doctor --fix` 修復的舊版狀態。

當沒有啟用 OpenClaw 沙箱時，OpenClaw 會啟動 Codex app-server 執行緒，
並啟用 Codex 原生程式碼模式，同時預設關閉僅限程式碼模式。
這會讓 Codex 原生工作區和程式碼能力保持可用，同時
OpenClaw 動態工具會繼續透過 app-server `item/tool/call` 橋接器運作。
啟用中的 OpenClaw 沙箱和受限制的工具政策會完全停用原生程式碼模式，
除非你選擇加入實驗性的沙箱 exec-server 路徑。

這項 Codex 原生功能與
[OpenClaw 程式碼模式](/zh-TW/reference/code-mode) 分開，後者是選擇加入的 QuickJS-WASI
執行階段，用於一般 OpenClaw 執行，且使用不同的 `exec` 輸入形狀。

如需了解更廣泛的模型/提供者/執行階段分工，請從
[代理執行階段](/zh-TW/concepts/agent-runtimes)開始。簡短版本是：
`openai/gpt-5.5` 是模型參照，`codex` 是執行階段，而 Telegram、
Discord、Slack 或其他頻道仍是通訊介面。

## 需求

- OpenClaw，且可使用 bundled `codex` 外掛。
- 如果你的設定使用 `plugins.allow`，請包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。bundled 外掛預設會管理相容的
  Codex app-server 二進位檔，因此 `PATH` 上的本機 `codex` 命令不會
  影響一般執行框架啟動。
- 透過 `openclaw models auth login --provider openai` 可用的 Codex 驗證、
  代理 Codex 首頁中的 app-server 帳戶，或明確的 Codex API 金鑰
  驗證設定檔。

如需驗證優先順序、環境隔離、自訂 app-server 命令、模型
探索，以及所有設定欄位，請參閱
[Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 快速開始

大多數想在 OpenClaw 中使用 Codex 的使用者會需要這條路徑：使用
ChatGPT/Codex 訂閱登入、啟用 bundled `codex` 外掛，並使用
標準 `openai/gpt-*` 模型參照。

使用 Codex OAuth 登入：

```bash
openclaw models auth login --provider openai
```

啟用 bundled `codex` 外掛並選取 OpenAI 代理模型：

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

變更外掛設定後請重新啟動閘道。如果現有聊天已經
有工作階段，請在測試執行階段變更之前使用 `/new` 或 `/reset`，讓下一個
回合從目前設定解析執行框架。

## 設定

快速開始設定是最小可用的 Codex 執行框架設定。請在 OpenClaw 設定中設定 Codex
執行框架選項，並且只將命令列介面用於 Codex 驗證：

| 需求                                   | 設定                                                                             | 位置                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 啟用執行框架                           | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                      |
| 保留允許清單中的外掛安裝               | 在 `plugins.allow` 中包含 `codex`                                                | OpenClaw 設定                      |
| 透過 Codex 路由 OpenAI 代理回合         | `agents.defaults.model` 或 `agents.list[].model` 設為 `openai/gpt-*`             | OpenClaw 代理設定                  |
| 使用 ChatGPT/Codex OAuth 登入           | `openclaw models auth login --provider openai`                                   | 命令列介面驗證設定檔              |
| 為 Codex 執行加入 API 金鑰備援          | 在 `auth.order.openai` 中列於訂閱驗證之後的 `openai:*` API 金鑰設定檔            | 命令列介面驗證設定檔 + OpenClaw 設定 |
| Codex 無法使用時封閉失敗               | 提供者或模型 `agentRuntime.id: "codex"`                                          | OpenClaw 模型/提供者設定           |
| 使用直接 OpenAI API 流量               | 提供者或模型 `agentRuntime.id: "openclaw"` 搭配一般 OpenAI 驗證                 | OpenClaw 模型/提供者設定           |
| 調整 app-server 行為                   | `plugins.entries.codex.config.appServer.*`                                       | Codex 外掛設定                     |
| 啟用原生 Codex 外掛應用程式            | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex 外掛設定                     |
| 啟用 Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                                     | Codex 外掛設定                     |

對 Codex 支援的 OpenAI 代理回合使用 `openai/gpt-*` 模型參照。建議
使用 `auth.order.openai` 來設定訂閱優先/API 金鑰備援的順序。現有
舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序是僅供 doctor 使用的
舊版狀態；請勿寫入新的舊版 Codex GPT 參照。

請勿在 Codex 支援的代理上設定 `compaction.model` 或 `compaction.provider`。
Codex 會透過其原生 app-server 執行緒狀態進行壓縮，因此 OpenClaw 會在
執行階段忽略那些本機摘要器覆寫，且 `openclaw doctor --fix` 會在
代理使用 Codex 時移除它們。

Lossless 仍支援作為 Codex 回合周邊的組裝、擷取和
維護用內容引擎。請透過
`plugins.slots.contextEngine: "lossless-claw"` 和
`plugins.entries.lossless-claw.config.summaryModel` 設定它，而不是透過
`agents.defaults.compaction.provider`。當 Codex 是啟用中的執行階段時，
`openclaw doctor --fix` 會將舊的
`compaction.provider: "lossless-claw"` 形狀遷移到 Lossless 內容引擎插槽，
但原生 Codex 仍然擁有壓縮。

原生 Codex app-server 執行框架支援需要
預提示組裝的內容引擎。一般命令列介面後端，包括 `codex-cli`，不提供
該主機能力。

對 Codex 支援的代理，`/compact` 會在繫結的執行緒上啟動原生 Codex app-server 壓縮。
OpenClaw 不會等待完成、套用 OpenClaw
逾時、重新啟動共用 app-server，或退回到內容引擎或
公開 OpenAI 摘要器。如果原生 Codex 執行緒繫結遺失或
過期，該命令會封閉失敗，讓操作員看到真正的執行階段邊界，
而不是無聲切換壓縮後端。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在該形狀中，兩個設定檔對 `openai/gpt-*` 代理
回合仍會透過 Codex 執行。API 金鑰只是驗證備援，不是切換到 OpenClaw 或
一般 OpenAI Responses 的要求。

本頁其餘部分涵蓋使用者必須選擇的常見變體：
部署形狀、封閉失敗路由、guardian 核准政策、原生 Codex
外掛，以及 Computer Use。如需完整選項清單、預設值、列舉、探索、
環境隔離、逾時，以及 app-server 傳輸欄位，請參閱
[Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 驗證 Codex 執行階段

在你預期使用 Codex 的聊天中使用 `/status`。由 Codex 支援的 OpenAI 代理
回合會顯示：

```text
Runtime: OpenAI Codex
```

接著檢查 Codex app-server 狀態：

```text
/codex status
/codex models
```

`/codex status` 會回報 app-server 連線能力、帳戶、速率限制、MCP
伺服器，以及 Skills。`/codex models` 會列出執行框架和帳戶的即時 Codex app-server 目錄。
如果 `/status` 的結果出乎意料，請參閱
[疑難排解](#troubleshooting)。

## 路由與模型選擇

請將提供者參照和執行階段政策分開：

- 使用 `openai/gpt-*` 讓 OpenAI 代理回合透過 Codex 執行。
- 請勿在設定中使用舊版 Codex GPT 參照。執行 `openclaw doctor --fix` 以
  修復舊版參照和過期的工作階段路由釘選。
- `agentRuntime.id: "codex"` 對一般 OpenAI 自動模式是選用的，但當
  部署應在 Codex 無法使用時封閉失敗時很有用。
- `agentRuntime.id: "openclaw"` 會在有意這樣做時，讓提供者或模型選用 OpenClaw
  嵌入式執行階段。
- `/codex ...` 會從聊天控制原生 Codex app-server 對話。
- ACP/acpx 是獨立的外部執行框架路徑。只有在使用者要求
  ACP/acpx 或外部執行框架轉接器時才使用它。

常見命令路由：

| 使用者意圖                                           | 使用                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加目前聊天                                         | `/codex bind [--cwd <path>]`                                                                          |
| 續接現有 Codex 執行緒                                | `/codex resume <thread-id>`                                                                           |
| 列出或篩選 Codex 執行緒                              | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 外掛                                  | `/codex plugins list`                                                                                 |
| 啟用或停用已設定的原生 Codex 外掛                    | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 在配對節點上附加現有 Codex 命令列介面工作階段        | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| 只傳送 Codex 意見回饋                                | `/codex diagnostics [note]`                                                                           |
| 啟動 ACP/acpx 工作                                   | ACP/acpx 工作階段命令，而不是 `/codex`                                                               |

| 使用情境                                             | 設定                                                              | 驗證                                  | 備註                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱 | `openai/gpt-*` 加上已啟用的 `codex` 外掛                             | `/status` 顯示 `Runtime: OpenAI Codex` | 建議路徑                      |
| 如果 Codex 無法使用則關閉失敗                  | 供應商或模型 `agentRuntime.id: "codex"`                           | 回合失敗，而不是使用內嵌後備 | 用於僅限 Codex 的部署        |
| 透過 OpenClaw 直連 OpenAI API 金鑰流量       | 供應商或模型 `agentRuntime.id: "openclaw"` 以及一般 OpenAI 驗證 | `/status` 顯示 OpenClaw 執行階段        | 僅在刻意使用 OpenClaw 時使用 |
| 舊版設定                                        | 舊版 Codex GPT 參照                                                  | `openclaw doctor --fix` 會重寫它     | 不要用這種方式撰寫新設定      |
| ACP/acpx Codex 配接器                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP 工作/工作階段狀態                 | 與原生 Codex 控制工具分開    |

`agents.defaults.imageModel` 遵循相同的前綴分流。一般 OpenAI 路徑請使用 `openai/gpt-*`，
只有當影像理解應該透過有界限的 Codex 應用伺服器回合執行時，
才使用 `codex/gpt-*`。不要使用
舊版 Codex GPT 參照；doctor 會將該舊版前綴重寫為 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

當所有 OpenAI 代理回合預設都應使用 Codex 時，
請使用快速入門設定。

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

### 混合供應商部署

此形狀會保留 Claude 作為預設代理，並新增一個具名 Codex 代理：

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

使用此設定時，`main` 代理會使用其一般供應商路徑，而
`codex` 代理會使用 Codex 應用伺服器。

### 關閉失敗 Codex 部署

對於 OpenAI 代理回合，當內建外掛可用時，`openai/gpt-*` 已會解析為 Codex。
當你想要書面化的關閉失敗規則時，請新增明確的執行階段政策：

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

強制使用 Codex 時，如果 Codex 外掛已停用、
應用伺服器太舊，或應用伺服器無法啟動，OpenClaw 會提早失敗。

## 應用伺服器政策

預設情況下，外掛會在本機以 stdio
傳輸啟動 OpenClaw 管理的 Codex 二進位檔。只有在你刻意想要執行
不同可執行檔時，才設定 `appServer.command`。只有當應用伺服器已在其他地方
執行時，才使用 WebSocket 傳輸：

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

本機 stdio 應用伺服器工作階段預設採用受信任本機操作者姿態：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。如果本機 Codex 需求不允許這種
隱含的全權姿態，OpenClaw 會改選允許的守護權限。
當 OpenClaw 沙盒在該工作階段啟用時，OpenClaw 會針對該
回合停用 Codex 原生 Code Mode、使用者 MCP 伺服器，以及應用程式支援的外掛執行，
而不是依賴 Codex 主機端沙盒。當一般 exec/process 工具可用時，
Shell 存取會透過 OpenClaw 沙盒支援的動態工具公開，例如 `sandbox_exec` 和
`sandbox_process`。

當你想要 Codex 原生自動審查先於沙盒脫逸或額外權限時，
請使用標準化的 OpenClaw exec 模式：

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

對於 Codex 應用伺服器工作階段，OpenClaw 會將 `tools.exec.mode: "auto"` 對應到 Codex
Guardian 審查的核准，通常是
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`，以及
`sandbox: "workspace-write"`，前提是本機需求允許這些值。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不會保留舊版不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆寫；若要刻意採用無需核准的 Codex 姿態，
請使用 `tools.exec.mode: "full"`。舊版 `plugins.entries.codex.config.appServer.mode: "guardian"` 預設集仍然
可用，但 `tools.exec.mode: "auto"` 是標準化的 OpenClaw 介面。

如需與主機 exec 核准和 ACPX 權限進行模式層級比較，
請參閱[權限模式](/zh-TW/tools/permission-modes)。

如需每個應用伺服器欄位、驗證順序、環境隔離、探索，以及
逾時行為，請參閱 [Codex 控制工具參考](/zh-TW/plugins/codex-harness-reference)。

## 命令與診斷

內建外掛會在任何支援 OpenClaw 文字命令的頻道上，
將 `/codex` 註冊為斜線命令。

常見形式：

- `/codex status` 會檢查應用伺服器連線能力、模型、帳戶、速率限制、
  MCP 伺服器，以及 Skills。
- `/codex models` 會列出即時 Codex 應用伺服器模型。
- `/codex threads [filter]` 會列出最近的 Codex 應用伺服器對話串。
- `/codex resume <thread-id>` 會將目前 OpenClaw 工作階段附加到
  現有 Codex 對話串。
- `/codex compact` 會要求 Codex 應用伺服器壓縮附加的對話串。
- `/codex review` 會為附加的對話串啟動 Codex 原生審查。
- `/codex diagnostics [note]` 會在傳送附加對話串的 Codex 回饋前詢問。
- `/codex account` 會顯示帳戶與速率限制狀態。
- `/codex mcp` 會列出 Codex 應用伺服器 MCP 伺服器狀態。
- `/codex skills` 會列出 Codex 應用伺服器 Skills。

對大多數支援回報，請在發生錯誤的對話中先使用 `/diagnostics [note]`。
它會建立一份閘道診斷報告；對於 Codex 控制工具工作階段，
還會要求核准傳送相關的 Codex 回饋套件。
如需隱私模型與群組聊天行為，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

只有當你特別想要針對目前附加對話串上傳 Codex 回饋，
而不需要完整閘道診斷套件時，才使用 `/codex diagnostics [note]`。

### 在本機檢查 Codex 對話串

檢查失敗 Codex 執行最快的方法，通常是直接開啟原生 Codex
對話串：

```bash
codex resume <thread-id>
```

從完成的 `/diagnostics` 回覆、`/codex binding`，或
`/codex threads [filter]` 取得對話串 ID。

如需上傳機制和執行階段層級診斷邊界，請參閱
[Codex 控制工具執行階段](/zh-TW/plugins/codex-harness-runtime#codex-feedback-upload)。

驗證會依此順序選取：

1. 代理的已排序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 之下。執行 `openclaw doctor --fix` 以遷移較舊的
   舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序。
2. 該代理 Codex home 中應用伺服器的現有帳戶。
3. 僅限本機 stdio 應用伺服器啟動時，若沒有應用伺服器帳戶且仍需要 OpenAI 驗證，
   則使用 `CODEX_API_KEY`，接著是
   `OPENAI_API_KEY`。

當 OpenClaw 看到 ChatGPT 訂閱樣式的 Codex 驗證設定檔時，它會從產生的 Codex 子行程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。這會讓閘道層級 API 金鑰
仍可用於嵌入或直連 OpenAI 模型，
而不會讓原生 Codex 應用伺服器回合意外透過 API 計費。
明確的 Codex API 金鑰設定檔和本機 stdio 環境金鑰後備會使用應用伺服器
登入，而不是繼承子行程環境。WebSocket 應用伺服器連線
不會收到閘道環境 API 金鑰後備；請使用明確的驗證設定檔，或遠端
應用伺服器自己的帳戶。
當設定原生 Codex 外掛時，OpenClaw 會先透過連線的應用伺服器安裝或重新整理這些
外掛，然後才將外掛擁有的應用程式公開給
Codex 對話串。`app/list` 仍然是應用程式 ID、
可存取性與中繼資料的事實來源，但 OpenClaw 擁有每個對話串的啟用
決策：如果政策允許已列出且可存取的應用程式，OpenClaw 會傳送
`thread/start.config.apps[appId].enabled = true`，即使 `app/list` 目前
回報該應用程式已停用。此路徑不會為
未知 ID 憑空建立應用程式安裝；OpenClaw 只會使用 `plugin/install`
啟用 marketplace 外掛，然後重新整理清單。

如果訂閱設定檔達到 Codex 使用量限制，當 Codex 回報重設
時間時，OpenClaw 會記錄該時間，並針對相同
Codex 執行嘗試下一個已排序驗證設定檔。當重設時間過後，訂閱設定檔會再次符合資格，
而不需要變更所選的 `openai/gpt-*` 模型或 Codex 執行階段。

對於本機 stdio 應用伺服器啟動，OpenClaw 會將 `CODEX_HOME` 設為每個代理
專用的目錄，因此 Codex 設定、驗證/帳戶檔案、外掛快取/資料，以及原生
對話串狀態預設不會讀寫操作者個人的 `~/.codex`。
OpenClaw 會保留一般行程的 `HOME`；Codex 執行的子行程
仍可找到使用者 home 設定和權杖，而 Codex 也可能探索共用的
`$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 項目。

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

`appServer.clearEnv` 只會影響產生的 Codex 應用伺服器子行程。
OpenClaw 會在本機啟動
標準化期間，從此清單移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 會保持每個代理專用，而 `HOME` 會保持繼承，
讓子行程能使用一般使用者 home 狀態。

Codex 動態工具預設使用 `searchable` 載入。OpenClaw 不會公開
會重複 Codex 原生工作區操作的動態工具：`read`、`write`、
`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。其餘大多數
OpenClaw 整合工具，例如訊息、媒體、排程、瀏覽器、節點、
閘道和 `heartbeat_respond`，都可透過 Codex 工具搜尋在
`openclaw` 命名空間下使用，以縮小初始模型脈絡。啟用搜尋且未選取
受管理提供者時，網頁搜尋預設會使用 Codex 託管的 `web_search` 工具。
原生託管搜尋與 OpenClaw 受管理的 `web_search` 動態工具互斥，
因此受管理搜尋無法繞過原生網域限制。當託管搜尋無法使用、
明確停用，或被選取的受管理提供者取代時，OpenClaw 會使用受管理工具。
OpenClaw 會保持停用 Codex 的獨立 `web.run` 擴充功能，因為
正式環境應用程式伺服器流量會拒絕其使用者定義的 `web` 命名空間。
`tools.web.search.enabled: false` 會停用兩條路徑，工具停用的
純 LLM 執行也一樣。Codex 會將 `"cached"` 視為偏好設定，並在不受限制的
應用程式伺服器回合中解析為即時外部存取。設定原生 `allowedDomains`
時，自動受管理後援會以關閉失敗方式處理，確保允許清單無法被繞過。
持久性的有效搜尋政策變更會在下一回合前輪替已繫結的 Codex 執行緒。
暫時性的逐回合限制會使用臨時受限執行緒，並保留現有繫結以供稍後恢復。
`sessions_yield` 和僅限訊息工具的來源回覆會保持直接模式，因為
這些是回合控制合約。`sessions_spawn` 會保持可搜尋，讓 Codex 的
原生 `spawn_agent` 仍是主要的 Codex 子代理介面；同時仍可透過
`openclaw` 動態工具命名空間使用明確的 OpenClaw 或 ACP 委派。
心跳偵測協作指示會告訴 Codex：當工具尚未載入時，在結束心跳偵測回合前
搜尋 `heartbeat_respond`。

只有在連線到無法搜尋延遲動態工具的自訂 Codex 應用程式伺服器，
或偵錯完整工具酬載時，才將 `codexDynamicToolsLoading: "direct"` 設定為。

支援的頂層 Codex 外掛欄位：

| 欄位                       | 預設值         | 意義                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 將 OpenClaw 動態工具直接放入初始 Codex 工具脈絡。                       |
| `codexDynamicToolsExclude` | `[]`           | 要從 Codex 應用程式伺服器回合中省略的額外 OpenClaw 動態工具名稱。                      |
| `codexPlugins`             | 已停用         | 針對已遷移、以來源安裝的精選外掛提供原生 Codex 外掛/應用程式支援。                     |

支援的 `appServer` 欄位：

| 欄位                                          | 預設值                                                 | 意義                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 會產生 Codex；`"websocket"` 會連線到 `url`。                                                                                                                                                                                                                                                                                                                                          |
| `command`                                     | 受管理的 Codex 二進位檔                               | stdio 傳輸使用的可執行檔。保留未設定即可使用受管理的二進位檔；只有在明確覆寫時才設定。                                                                                                                                                                                                                                                                                                         |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 傳輸使用的引數。                                                                                                                                                                                                                                                                                                                                                                         |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未設定                                                 | WebSocket 傳輸使用的 Bearer 權杖。接受字面字串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                   | 額外的 WebSocket 標頭。標頭值接受字面字串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 建立繼承環境後，從產生的 stdio app-server 程序中移除的額外環境變數名稱。OpenClaw 會保留每個代理的 `CODEX_HOME` 和繼承的 `HOME`，用於本機啟動。                                                                                                                                                                                                                                         |
| `codeModeOnly`                                | `false`                                                | 選擇使用 Codex 的僅程式碼模式工具介面。OpenClaw 動態工具仍會註冊到 Codex，因此巢狀 `tools.*` 呼叫會透過 app-server `item/tool/call` 橋接返回。                                                                                                                                                                                                                                                   |
| `remoteWorkspaceRoot`                         | 未設定                                                 | 遠端 Codex app-server 工作區根目錄。設定後，OpenClaw 會從已解析的 OpenClaw 工作區推斷本機工作區根目錄，保留目前 cwd 在此遠端根目錄下的尾端路徑，並只將最終 app-server cwd 傳送給 Codex。如果 cwd 位於已解析的 OpenClaw 工作區根目錄之外，OpenClaw 會以失敗關閉，而不是將閘道本機路徑傳送到遠端 app-server。                         |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面呼叫的逾時。                                                                                                                                                                                                                                                                                                                                                                |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受回合後，或 OpenClaw 等待 `turn/completed` 時發生回合範圍 app-server 要求後的靜默視窗。                                                                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 時，在工具交接、原生工具完成、工具後原始助理進度、原始推理完成或推理進度之後使用的完成閒置與進度防護。請將此用於受信任或繁重的工作負載，這類工作負載中的工具後合成可以合理地比最終助理發布預算保持更久的靜默。                                                                                      |
| `mode`                                        | `"yolo"`，除非本機 Codex 需求不允許 YOLO              | YOLO 或 guardian 審核執行的預設集。若本機 stdio 需求省略 `danger-full-access`、`never` 核准或 `user` 審核者，隱含預設值會是 guardian。                                                                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` 或允許的 guardian 核准原則                  | 傳送到執行緒啟動/恢復/回合的原生 Codex 核准原則。guardian 預設值會在允許時偏好 `"on-request"`。                                                                                                                                                                                                                                                                                                 |
| `sandbox`                                     | `"danger-full-access"` 或允許的 guardian 沙箱         | 傳送到執行緒啟動/恢復的原生 Codex 沙箱模式。guardian 預設值會在允許時偏好 `"workspace-write"`，否則使用 `"read-only"`。當 OpenClaw 沙箱啟用時，`danger-full-access` 回合會使用 Codex `workspace-write`，並從 OpenClaw 沙箱輸出設定衍生網路存取權。                                                                                 |
| `approvalsReviewer`                           | `"user"` 或允許的 guardian 審核者                     | 使用 `"auto_review"` 可在允許時讓 Codex 審核原生核准提示，否則使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是舊版別名。                                                                                                                                                                                                                                                            |
| `serviceTier`                                 | 未設定                                                 | 選用的 Codex app-server 服務層級。`"priority"` 會啟用快速模式路由，`"flex"` 會要求 flex 處理，`null` 會清除覆寫，而舊版 `"fast"` 會被接受為 `"priority"`。                                                                                                                                                                                                                                        |
| `networkProxy`                                | 停用                                                   | 選擇使用 Codex 權限設定檔網路功能來執行 app-server 命令。OpenClaw 會定義所選的 `permissions.<profile>.network` 設定，並使用 `default_permissions` 選取它，而不是傳送 `sandbox`。                                                                                                                                                                                                                 |
| `experimental.sandboxExecServer`              | `false`                                                | 預覽版選擇加入，會向 Codex app-server 0.132.0 或更新版本註冊由 OpenClaw 沙箱支援的 Codex 環境，讓原生 Codex 執行可以在啟用中的 OpenClaw 沙箱內執行。                                                                                                                                                                                                                                           |

`appServer.networkProxy` 是明確的，因為它會變更 Codex 沙箱
合約。啟用時，OpenClaw 也會在 Codex 執行緒設定中設定 `features.network_proxy.enabled` 和
`default_permissions`，讓產生的權限
設定檔可以啟動 Codex 受管理的網路功能。預設情況下，OpenClaw 會從
設定檔內容產生防碰撞的 `openclaw-network-<fingerprint>` 設定檔名稱；
只有在需要穩定本機名稱時才使用 `profileName`。

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
`networkProxy` 會對產生的權限設定檔使用工作區式檔案系統存取。
Codex 受管理的網路強制執行是沙箱化網路，
因此完整存取設定檔無法保護輸出流量。
網域項目使用 `allow` 或 `deny`；Unix socket 項目使用 Codex 的
`allow` 或 `none` 值。

OpenClaw 擁有的動態工具呼叫會獨立於
`appServer.requestTimeoutMs` 受到界定：Codex `item/tool/call` 要求預設使用 90 秒的
OpenClaw 看門狗。正數的逐次呼叫 `timeoutMs` 引數會延長
或縮短該特定工具的預算。當工具呼叫未提供自己的逾時值時，`image_generate` 工具會使用
`agents.defaults.imageGenerationModel.timeoutMs`，否則使用 120 秒的影像生成預設值。
媒體理解 `image` 工具會使用
`tools.media.image.timeoutSeconds` 或其 60 秒媒體預設值。對於影像
理解，該逾時會套用到要求本身，且不會因先前的準備工作而
縮短。動態工具預算上限為 600000 ms。逾時時，OpenClaw 會在支援處中止工具訊號，
並向 Codex 傳回失敗的動態工具回應，讓該回合
可以繼續，而不是讓會話停留在 `processing`。
此看門狗是外層動態 `item/tool/call` 預算；提供者特定的
要求逾時會在該呼叫內執行，並保留自己的逾時語意。

Codex 接受一個回合後，以及 OpenClaw 回應一個以回合為範圍的
app-server 要求後，執行架構會期待 Codex 推進目前回合，並
最終以 `turn/completed` 完成原生回合。如果 app-server 在
`appServer.turnCompletionIdleTimeoutMs` 期間保持沉默，OpenClaw 會盡力
中斷 Codex 回合、記錄診斷逾時，並釋放
OpenClaw 會話通道，讓後續聊天訊息不會排在過期的
原生回合後方。同一回合的大多數非終端通知會解除這個短
看門狗，因為 Codex 已證明該回合仍然存活。工具交接使用
較長的工具後閒置預算：在 OpenClaw 傳回 `item/tool/call`
回應後、在 `commandExecution` 等原生工具項目完成後、在原始
`custom_tool_call_output` 完成後，以及在工具後原始助理
進度、原始 reasoning 完成，或 reasoning 進度後。此防護會在設定時使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否則預設為五分鐘。同一個工具後預算也會延長
進度看門狗，用於 Codex 發出下一個目前回合事件前的靜默合成窗口。
全域 app-server 通知，例如速率限制更新，
不會重設回合閒置進度。Reasoning 完成、commentary
`agentMessage` 完成，以及工具前原始 reasoning 或助理進度後方
可能接著自動最終回覆，因此它們會使用進度後回覆
防護，而不是立即釋放會話通道。只有
最終/非 commentary 已完成的 `agentMessage` 項目，以及工具前原始
助理完成，會啟用助理輸出釋放：如果 Codex 隨後保持沉默
且沒有 `turn/completed`，OpenClaw 會盡力中斷原生回合並
釋放會話通道。可安全重播的 stdio app-server 失敗，包括
沒有助理、工具、作用中項目或副作用證據的回合完成閒置逾時，
會在新的 app-server 嘗試中重試一次。不安全的
逾時仍會退役卡住的 app-server 用戶端並釋放 OpenClaw
會話通道。它們也會清除過期的原生執行緒繫結，而不是
自動重播。完成監看逾時會顯示 Codex 特定的逾時
文字：可安全重播的情況會說回應可能不完整，而不安全的情況
會要求使用者在重試前確認目前狀態。公開逾時診斷
包含結構化欄位，例如最後一個 app-server 通知方法、
原始助理回應項目 id/type/role、作用中要求/項目數量，以及已啟用的
監看狀態。當最後一個通知是原始助理回應項目時，它們
也會包含有界的助理文字預覽。它們不會包含原始提示或
工具內容。

環境覆寫仍可用於本機測試：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

當 `appServer.command` 未設定時，`OPENCLAW_CODEX_APP_SERVER_BIN` 會繞過受管理的二進位檔。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。請改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 進行一次性本機測試。對於
可重複部署，偏好使用設定，因為它會讓外掛行為與
其餘 Codex 執行架構設定保持在同一個已審查檔案中。

## 原生 Codex 外掛

原生 Codex 外掛支援會在與 OpenClaw 執行架構回合同一個 Codex 執行緒中，使用 Codex app-server 自己的應用程式與外掛
能力。OpenClaw
不會將 Codex 外掛轉譯成合成的 `codex_plugin_*` OpenClaw
動態工具。

`codexPlugins` 只影響選取原生 Codex 執行架構的會話。它
不會影響內建執行架構執行、一般 OpenAI 提供者執行、ACP 對話
繫結，或其他執行架構。

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

執行緒應用程式設定會在 OpenClaw 建立 Codex 執行架構會話
或取代過期的 Codex 執行緒繫結時運算。它不會在每個回合重新運算。
變更 `codexPlugins` 後，請使用 `/new`、`/reset`，或重新啟動閘道，讓
未來的 Codex 執行架構會話以更新後的應用程式集合啟動。

關於遷移資格、應用程式清查、破壞性動作政策、
引出、以及原生外掛診斷，請參閱
[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

OpenAI 端的應用程式與外掛存取權由已登入的 Codex 帳號控制；
對於 Business 和 Enterprise/Edu 工作區，則也由工作區應用程式控制項控制。請參閱
[搭配你的 ChatGPT 方案使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
以了解 OpenAI 的帳號與工作區控制項概覽。

## 電腦使用

電腦使用在自己的設定指南中說明：
[Codex 電腦使用](/zh-TW/plugins/codex-computer-use)。

簡短版本：OpenClaw 不會內建桌面控制應用程式，也不會自行執行
桌面動作。它會準備 Codex app-server、驗證
`computer-use` MCP 伺服器可用，然後在 Codex 模式回合中讓 Codex 擁有原生 MCP
工具呼叫。

## 執行階段邊界

Codex 執行架構只會變更低階嵌入式代理執行器。

- 支援 OpenClaw 動態工具。Codex 會要求 OpenClaw 執行這些
  工具，因此 OpenClaw 仍位於執行路徑中。
- Codex 原生 shell、patch、MCP 與原生應用程式工具由 Codex 擁有。
  OpenClaw 可以透過受支援的
  中繼觀察或封鎖選取的原生事件，但它不會改寫原生工具引數。
- Codex 擁有原生壓縮。OpenClaw 會保留一份轉錄鏡像，用於頻道
  歷史、搜尋、`/new`、`/reset`，以及未來的模型或執行架構切換，但
  它不會以 OpenClaw 或內容引擎
  摘要器取代 Codex 壓縮。
- 媒體生成、媒體理解、TTS、核准，以及訊息工具
  輸出會繼續透過相符的 OpenClaw 提供者/模型設定。
- `tool_result_persist` 套用於 OpenClaw 擁有的轉錄工具結果，而不是
  Codex 原生工具結果記錄。

關於 hook 層、受支援的 V1 介面、原生權限處理、佇列
導向、Codex 回饋上傳機制，以及壓縮詳細資訊，請參閱
[Codex 執行架構執行階段](/zh-TW/plugins/codex-harness-runtime)。

## 疑難排解

**Codex 未顯示為一般 `/model` 提供者：** 對於
新設定，這是預期行為。選取一個 `openai/gpt-*` 模型、啟用
`plugins.entries.codex.enabled`，並檢查 `plugins.allow` 是否排除
`codex`。

**OpenClaw 使用內建執行架構而非 Codex：** 請確定模型參照是
官方 OpenAI 提供者上的 `openai/gpt-*`，且 Codex 外掛已
安裝並啟用。如果你在測試時需要嚴格證明，請設定提供者或
模型 `agentRuntime.id: "codex"`。強制的 Codex 執行階段會失敗，而不是
退回到 OpenClaw。

**OpenAI Codex 執行階段退回到 API 金鑰路徑：** 收集一段已遮罩的
閘道摘錄，顯示模型、執行階段、選取的提供者和失敗。
請受影響的協作者在他們的 OpenClaw 主機上執行這個唯讀命令：

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
路徑，而不是普通的 OpenAI API 金鑰失敗。

**舊版 Codex 模型參照設定仍存在：** 執行 `openclaw doctor --fix`。
Doctor 會將舊版模型參照改寫為 `openai/*`、移除過期的會話與
整個代理執行階段釘選，並保留既有的 auth-profile 覆寫。

**app-server 被拒絕：** 請使用 Codex app-server `0.125.0` 或更新版本。
同版本預發行或附加建置後綴的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom`，會遭拒絕，因為 OpenClaw 會測試
穩定的 `0.125.0` 通訊協定下限。

**`/codex status` 無法連線：** 請檢查內建的 `codex` 外掛已
啟用、在設定允許清單時 `plugins.allow` 包含它，且
任何自訂 `appServer.command`、`url`、`authToken` 或標頭都有效。

**模型探索很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs` 或停用探索。請參閱
[Codex 執行架構參考](/zh-TW/plugins/codex-harness-reference#model-discovery)。

**WebSocket 傳輸立即失敗：** 請檢查 `appServer.url`、`authToken`、
標頭，以及遠端 app-server 是否使用相同的 Codex app-server
通訊協定版本。

**原生 shell 或 patch 工具因 `Native hook relay unavailable` 被封鎖：**
Codex 執行緒仍嘗試使用 OpenClaw 不再註冊的原生 hook 中繼 id。
這是原生 Codex hook 傳輸問題，不是 ACP
後端、提供者、GitHub 或 shell 命令失敗。請在
受影響的聊天中使用 `/new` 或 `/reset` 開始新會話，然後重試無害命令。如果該命令
成功一次，但下一次原生工具呼叫又失敗，請只將 `/new` 視為暫時
因應方式：重新啟動 Codex
app-server 或 OpenClaw 閘道後，將提示複製到新會話，讓舊執行緒被捨棄且原生 hook
註冊重新建立。

**非 Codex 模型使用內建執行架構：** 除非
提供者或模型執行階段政策將它路由到另一個執行架構，否則這是預期行為。普通非 OpenAI
提供者參照會在 `auto` 模式中維持其正常提供者路徑。

**Computer Use 已安裝但工具無法執行：**請從全新工作階段檢查
`/codex computer-use status`。如果工具回報
`Native hook relay unavailable`，請使用上方的原生掛鉤轉送復原方式。請參閱
[Codex Computer Use](/zh-TW/plugins/codex-computer-use#troubleshooting)。

## 相關

- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-TW/plugins/codex-computer-use)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [模型供應商](/zh-TW/concepts/model-providers)
- [OpenAI 供應商](/zh-TW/providers/openai)
- [OpenAI Codex 說明](https://help.openai.com/en/collections/14937394-codex)
- [代理程式 harness 外掛](/zh-TW/plugins/sdk-agent-harness)
- [外掛掛鉤](/zh-TW/plugins/hooks)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [狀態](/zh-TW/cli/status)
- [測試](/zh-TW/help/testing-live#live-codex-app-server-harness-smoke)
