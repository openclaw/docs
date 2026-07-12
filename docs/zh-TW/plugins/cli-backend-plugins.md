---
read_when:
    - 你正在建置本機 AI 命令列介面後端外掛
    - 你想為 `acme-cli/model` 之類的模型參照註冊後端。
    - 你需要將第三方命令列介面對應至 OpenClaw 的文字備援執行器
sidebarTitle: CLI backend plugins
summary: 建立一個註冊本機 AI 命令列介面後端的外掛
title: 建置命令列介面後端外掛
x-i18n:
    generated_at: "2026-07-12T14:39:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI 後端外掛可讓 OpenClaw 呼叫本機 AI 命令列介面，作為文字推論後端。此後端會以供應商前綴的形式出現在模型參照中：

```text
acme-cli/acme-large
```

當上游整合已透過本機命令提供、命令列介面自行管理本機登入狀態，或 API 供應商無法使用而需要備援時，請使用 CLI 後端。

<Info>
  如果上游服務提供一般的 HTTP 模型 API，請改為撰寫
  [供應商外掛](/zh-TW/plugins/sdk-provider-plugins)。如果上游執行階段自行管理完整的代理程式工作階段、工具事件、壓縮或背景
  任務狀態，請使用[代理程式框架](/zh-TW/plugins/sdk-agent-harness)。
</Info>

## 外掛負責的內容

CLI 後端外掛包含三項契約：

| 契約                 | 檔案                   | 用途                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 套件進入點           | `package.json`         | 將 OpenClaw 指向外掛執行階段模組                          |
| 資訊清單擁有權       | `openclaw.plugin.json` | 在載入執行階段前宣告後端 ID                               |
| 執行階段註冊         | `index.ts`             | 使用命令預設值呼叫 `api.registerCliBackend(...)`          |

資訊清單是探索中繼資料：它不會執行命令列介面或註冊執行階段行為。外掛進入點呼叫
`api.registerCliBackend(...)` 時，執行階段行為才會開始。

## 最小後端外掛

<Steps>
  <Step title="建立套件中繼資料">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    發布的套件必須包含已建置的 JavaScript 執行階段檔案。如果你的原始碼
    進入點是 `./src/index.ts`，請新增指向對應已建置 JavaScript 檔案的 `openclaw.runtimeExtensions`。請參閱[進入點](/zh-TW/plugins/sdk-entrypoints)。

  </Step>

  <Step title="宣告後端擁有權">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "透過 OpenClaw 執行 Acme 的本機 AI 命令列介面",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` 是執行階段擁有權清單；當設定或模型選擇提及 `acme-cli/...` 時，它可讓 OpenClaw 自動載入此外掛。

    `setup.cliBackends` 是描述元優先的設定介面。當你希望模型探索、初始設定或狀態在不載入外掛執行階段的情況下辨識後端時，請新增此項。只有在這些靜態描述元已足以完成設定時，才使用 `requiresRuntime: false`。

  </Step>

  <Step title="註冊後端">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "透過 OpenClaw 執行 Acme 的本機 AI 命令列介面",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    後端 ID 必須符合資訊清單中的 `cliBackends` 項目。註冊的 `config` 只是預設值；執行階段會將 `agents.defaults.cliBackends.acme-cli` 下的使用者設定合併並覆寫其內容。

  </Step>
</Steps>

## 設定結構

`CliBackendConfig` 說明 OpenClaw 應如何啟動及剖析命令列介面：

| 欄位                                                      | 用途                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | 二進位檔名稱或命令的絕對路徑                                                      |
| `args`                                                    | 全新執行的基礎 argv                                                               |
| `resumeArgs`                                              | 恢復工作階段時使用的替代 argv；支援 `{sessionId}`                                 |
| `output` / `resumeOutput`                                 | 剖析器：`json`、`jsonl` 或 `text`                                                 |
| `jsonlDialect`                                            | JSONL 事件方言：`claude-stream-json` 或 `gemini-stream-json`                      |
| `liveSession`                                             | 長時間存活的 CLI 處理程序模式（`claude-stdio`）                                   |
| `input`                                                   | 提示詞傳輸方式：`arg` 或 `stdin`                                                  |
| `maxPromptArgChars`                                       | `arg` 模式切換回 stdin 前允許的提示詞最大長度                                     |
| `env` / `clearEnv`                                        | 要注入的額外環境變數，或啟動前要移除的環境變數名稱                               |
| `modelArg`                                                | 模型 ID 前使用的旗標                                                              |
| `modelAliases`                                            | 將 OpenClaw 模型 ID 對應至 CLI 原生 ID                                            |
| `sessionArg` / `sessionArgs`                              | 傳遞工作階段 ID 的方式                                                            |
| `sessionMode`                                             | `always`、`existing` 或 `none`                                                    |
| `sessionIdFields`                                         | OpenClaw 從 CLI 輸出讀取的 JSON 欄位                                              |
| `systemPromptArg` / `systemPromptFileArg`                 | 系統提示詞傳輸方式                                                                |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | 系統提示詞檔案的設定覆寫傳輸方式（例如 `-c`）                                     |
| `systemPromptMode`                                        | `append` 或 `replace`                                                             |
| `systemPromptWhen`                                        | `first`、`always` 或 `never`                                                      |
| `imageArg` / `imageMode`                                  | 圖片路徑旗標，以及傳遞多張圖片的方式（`repeat` 或 `list`）                        |
| `imagePathScope`                                          | 交接前暫存圖片檔案所在的位置：`temp` 或 `workspace`                               |
| `serialize`                                               | 維持相同後端執行的順序                                                            |
| `reseedFromRawTranscriptWhenUncompacted`                  | 選擇啟用在壓縮前從有界原始逐字稿重新植入內容，以便安全地重設工作階段              |
| `reliability.outputLimits`                                | 單次即時 CLI 回合保留的原始 JSONL 字元／行數上限（即時工作階段後端）              |
| `reliability.watchdog`                                    | 無輸出逾時調整，分別套用於全新執行和恢復執行                                     |

請優先使用符合該 CLI 的最小靜態設定。只有在行為確實屬於後端時，才新增外掛回呼。

## 進階後端掛鉤

`CliBackendPlugin` 也可以定義：

| 掛鉤                               | 用途                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | 在合併後重寫舊版使用者設定                                                  |
| `resolveExecutionArgs(ctx)`        | 新增要求範圍的旗標，例如思考強度或旁支問題隔離                              |
| `prepareExecution(ctx)`            | 在啟動前建立暫時的驗證或設定橋接                                            |
| `transformSystemPrompt(ctx)`       | 套用最後的 CLI 專用系統提示詞轉換                                           |
| `textTransforms`                   | 雙向提示詞／輸出替換                                                        |
| `defaultAuthProfileId`             | 優先使用特定的 OpenClaw 驗證設定檔                                          |
| `authEpochMode`                    | 決定驗證變更如何使已儲存的 CLI 工作階段失效                                |
| `nativeToolMode`                   | 宣告原生工具是不存在、永遠啟用，或可由主機選擇                              |
| `sideQuestionToolMode`             | 宣告 `/btw` 旁支問題要停用的原生工具                                        |
| `bundleMcp` / `bundleMcpMode`      | 選擇啟用 OpenClaw 的回送 MCP 工具橋接                                       |
| `ownsNativeCompaction`             | 後端自行負責壓縮——OpenClaw 會延後處理                                       |
| `runtimeArtifact`                  | 將指令碼啟動器限制於其完整的隨附套件樹狀結構                                |

請讓這些掛鉤由供應商負責。當後端掛鉤可以表達該行為時，不要在核心中新增 CLI 專用分支。

`runtimeArtifact` 由外掛擁有，使用者無法覆寫。只有在即時推論回合建立或重新驗證已驗證的設定權限時，才會查詢它；一般 CLI 執行不需要它。未包含此宣告的後端無法建立已驗證的 CLI 設定權限。`bundled-package-tree` 宣告會指定確切的 `package.json` 擁有者，並要求套件進入點本身就是命令。OpenClaw 會雜湊受限範圍內完整的已安裝套件樹狀結構，包括巢狀相依套件；若遇到重新導向的符號連結、位於已宣告套件外的啟動器、必要的外部相依套件宣告、過大的樹狀結構或未知指令碼，便會以封閉方式失敗。只有當該樹狀結構包含完整的推論實作時，才宣告此項；選用的工具整合並不會讓外部實作相依圖變得安全。

如果同一後端也提供獨立完整的原生可執行檔，請在 `nativeExecutableNames` 中列出其標準基礎名稱。即使使用者覆寫後端命令，其他原生命令仍維持未驗證狀態。

`ctx.executionMode` 在一般回合中為 `"agent"`，在暫時性的 `/btw` 呼叫中則為
`"side-question"`。當命令列介面需要不同的一次性旗標時，請使用它，
例如為 BTW 停用原生工具、工作階段持久化或恢復行為。如果後端通常設有
`nativeToolMode: "always-on"`，但其側邊問題 argv 能可靠地停用這些工具，也請設定
`sideQuestionToolMode: "disabled"`；否則，當 BTW
要求執行無工具的命令列介面時，OpenClaw 會採取失敗關閉策略。

只有當 `resolveExecutionArgs` 能針對單次執行停用
所有後端原生工具時，才設定 `nativeToolMode: "selectable"`。對於這類受限執行，
`ctx.toolAvailability.native` 是空元組，而
`ctx.toolAvailability.mcp` 是主機隔離後的確切 MCP 允許清單。該掛鉤
必須取代衝突的工具旗標，並傳回能強制執行這兩個值的 argv；
OpenClaw 會使用最終的新建或恢復 argv 呼叫它一次，若
後端無法強制執行限制，便採取失敗關閉策略。在此情境中，MCP 名稱可安全地
自動核准，唯一原因是主機已將產生的 MCP
設定限制為這些伺服器與工具。

### `ownsNativeCompaction`：選擇不使用 OpenClaw 壓縮

如果你的後端執行的代理程式會壓縮其**自身**對話記錄，請設定
`ownsNativeCompaction: true`，如此 OpenClaw 的防護摘要器就永遠不會
針對其工作階段執行——命令列介面的壓縮生命週期會傳回無操作，而
回合會繼續進行。`claude-cli` 會宣告此設定，因為 Claude Code 會在內部執行壓縮，
且沒有控管框架端點。Codex 等原生控管框架工作階段則會繼續
路由至其控管框架壓縮端點。

**只有在下列所有條件都成立時才宣告此設定**，否則延後處理且
超出預算的工作階段可能持續超出預算或變得過時（OpenClaw 將不再
進行補救）：

- 當接近其視窗限制時，後端能可靠地壓縮或限制自身的對話記錄；
- 後端會持久化可恢復的工作階段，讓壓縮後的狀態能跨回合保留
  （例如 `--resume` / `--session-id`）；
- 它不是原生控管框架壓縮工作階段——符合 `agentHarnessId`
  的工作階段會改為路由至控管框架端點。

## MCP 工具橋接器

命令列介面後端預設不會接收 OpenClaw 工具。如果命令列介面能使用
MCP 設定，請明確選擇啟用：

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

支援的橋接模式：

| 模式                     | 用途                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | 接受 MCP 設定檔的命令列介面                              |
| `codex-config-overrides` | 接受 argv 設定覆寫的命令列介面                        |
| `gemini-system-settings` | 從其系統設定目錄讀取 MCP 設定的命令列介面 |

只有在命令列介面確實能使用橋接器時才啟用。如果命令列介面有
無法停用的內建工具層，請設定 `nativeToolMode:
"always-on"`，如此當呼叫端要求不使用原生工具時，OpenClaw
便能採取失敗關閉策略。如果它能針對每次執行停用所有原生工具，請使用 `"selectable"`，
並遵循上述 `resolveExecutionArgs` 合約。

## 使用者設定

使用者可以覆寫任何後端預設值：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

請記錄使用者可能需要的最小覆寫內容——通常只有當
二進位檔位於 `PATH` 之外時才需要設定 `command`。

## 驗證

對於隨附的外掛，請新增針對建構器與設定
註冊的聚焦測試，然後執行該外掛的目標測試管線：

```bash
pnpm test extensions/acme-cli
```

對於本機或已安裝的外掛，請驗證探索功能並實際執行一次模型：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "請精確回覆：後端正常" --model acme-cli/acme-large
```

如果後端支援圖片或 MCP，請新增即時冒煙測試，以使用真實的命令列介面
驗證這些路徑。請勿僅依賴靜態檢查來驗證提示、圖片、
MCP 或工作階段恢復行為。

## 檢查清單

<Check>對於已發布的套件，`package.json` 具有 `openclaw.extensions` 和已建置的執行階段進入點</Check>
<Check>`openclaw.plugin.json` 宣告 `cliBackends` 與刻意設定的 `activation.onStartup`</Check>
<Check>當設定／模型探索應在後端尚未啟動時識別後端，`setup.cliBackends` 必須存在</Check>
<Check>`api.registerCliBackend(...)` 使用與資訊清單相同的後端 ID</Check>
<Check>`agents.defaults.cliBackends.<id>` 下的使用者覆寫仍具有優先權</Check>
<Check>工作階段、系統提示、圖片與輸出剖析器設定符合真實的命令列介面合約</Check>
<Check>目標測試與至少一次即時命令列介面冒煙測試能驗證後端路徑</Check>

## 相關內容

- [命令列介面後端](/zh-TW/gateway/cli-backends)——使用者設定與執行階段行為
- [建置外掛](/zh-TW/plugins/building-plugins)——套件與資訊清單基礎
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)——註冊 API 參考
- [外掛資訊清單](/zh-TW/plugins/manifest)——`cliBackends` 與設定描述元
- [代理程式控管框架](/zh-TW/plugins/sdk-agent-harness)——完整的外部代理程式執行階段
