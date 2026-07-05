---
read_when:
    - 你正在建置本機 AI 命令列介面後端外掛
    - 你想要為例如 acme-cli/model 的模型參照註冊後端
    - 你需要將第三方命令列介面對應到 OpenClaw 的文字後備執行器
sidebarTitle: CLI backend plugins
summary: 建置一個註冊本機 AI 命令列介面後端的外掛
title: 建置命令列介面後端外掛
x-i18n:
    generated_at: "2026-07-05T11:30:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97540f49e64df176c5bbfa596ba40acbf6418ad97ee55a5a79e257db68e49c7b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

命令列介面後端外掛可讓 OpenClaw 呼叫本機 AI 命令列介面作為文字推論
後端。後端會在模型參照中顯示為供應商前綴：

```text
acme-cli/acme-large
```

當上游整合已經以本機命令形式公開、命令列介面擁有本機登入狀態，或在 API
供應商無法使用時作為備援，請使用命令列介面後端。

<Info>
  如果上游服務公開一般 HTTP 模型 API，請改寫
  [供應商外掛](/zh-TW/plugins/sdk-provider-plugins)。如果上游
  執行階段擁有完整的代理工作階段、工具事件、壓縮或背景
  任務狀態，請使用[代理線束](/zh-TW/plugins/sdk-agent-harness)。
</Info>

## 外掛擁有的內容

命令列介面後端外掛有三項契約：

| 契約                 | 檔案                   | 用途                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 套件進入點           | `package.json`         | 將 OpenClaw 指向外掛執行階段模組                         |
| 清單所有權           | `openclaw.plugin.json` | 在執行階段載入前宣告後端 ID                              |
| 執行階段註冊         | `index.ts`             | 以命令預設值呼叫 `api.registerCliBackend(...)`            |

清單是探索中繼資料：它不會執行命令列介面，也不會註冊
執行階段行為。執行階段行為會在外掛進入點呼叫
`api.registerCliBackend(...)` 時開始。

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

    已發布的套件必須隨附建置後的 JavaScript 執行階段檔案。如果你的來源
    進入點是 `./src/index.ts`，請加入 `openclaw.runtimeExtensions`，指向
    建置後的 JavaScript 同層檔案。請參閱[進入點](/zh-TW/plugins/sdk-entrypoints)。

  </Step>

  <Step title="宣告後端所有權">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
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

    `cliBackends` 是執行階段所有權清單；當設定或模型選擇提到
    `acme-cli/...` 時，它可讓 OpenClaw 自動載入外掛。

    `setup.cliBackends` 是描述器優先的設定介面。當模型探索、上手流程或狀態
    應在不載入外掛執行階段的情況下辨識後端時，請加入它。只有當
    這些靜態描述器足以供設定使用時，才使用 `requiresRuntime: false`。

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
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    後端 ID 必須與清單中的 `cliBackends` 項目相符。
    已註冊的 `config` 只是預設值；位於
    `agents.defaults.cliBackends.acme-cli` 下的使用者設定會在執行階段合併覆蓋它。

  </Step>
</Steps>

## 設定形狀

`CliBackendConfig` 描述 OpenClaw 應如何啟動並剖析命令列介面：

| 欄位                                                      | 用途                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | 二進位檔名稱或絕對命令路徑                                                       |
| `args`                                                    | 全新執行的基礎 argv                                                               |
| `resumeArgs`                                              | 已恢復工作階段的替代 argv；支援 `{sessionId}`                                     |
| `output` / `resumeOutput`                                 | 剖析器：`json`、`jsonl` 或 `text`                                                 |
| `jsonlDialect`                                            | JSONL 事件方言：`claude-stream-json` 或 `gemini-stream-json`                      |
| `liveSession`                                             | 長時間執行的命令列介面程序模式 (`claude-stdio`)                                   |
| `input`                                                   | 提示傳輸：`arg` 或 `stdin`                                                        |
| `maxPromptArgChars`                                       | 在退回 stdin 前，`arg` 模式的最大提示長度                                         |
| `env` / `clearEnv`                                        | 要注入的額外環境變數，或啟動前要移除的名稱                                       |
| `modelArg`                                                | 模型 ID 前使用的旗標                                                              |
| `modelAliases`                                            | 將 OpenClaw 模型 ID 對應到命令列介面原生 ID                                       |
| `sessionArg` / `sessionArgs`                              | 如何傳遞工作階段 ID                                                              |
| `sessionMode`                                             | `always`、`existing` 或 `none`                                                    |
| `sessionIdFields`                                         | OpenClaw 從命令列介面輸出讀取的 JSON 欄位                                         |
| `systemPromptArg` / `systemPromptFileArg`                 | 系統提示傳輸                                                                      |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | 系統提示檔案的設定覆寫傳輸（例如 `-c`）                                           |
| `systemPromptMode`                                        | `append` 或 `replace`                                                             |
| `systemPromptWhen`                                        | `first`、`always` 或 `never`                                                      |
| `imageArg` / `imageMode`                                  | 圖片路徑旗標，以及如何傳遞多張圖片（`repeat` 或 `list`）                          |
| `imagePathScope`                                          | 交接前暫存圖片檔案的位置：`temp` 或 `workspace`                                   |
| `serialize`                                               | 保持同一後端的執行順序                                                           |
| `reseedFromRawTranscriptWhenUncompacted`                  | 選擇在壓縮前進行有界原始逐字稿重新播種，以安全重設工作階段                       |
| `reliability.outputLimits`                                | 單次即時命令列介面回合保留的最大原始 JSONL 字元/行數（即時工作階段後端）         |
| `reliability.watchdog`                                    | 無輸出逾時調整，分別用於全新與已恢復的執行                                       |

請優先使用符合命令列介面的最小靜態設定。只有在行為確實屬於後端時，
才加入外掛回呼。

## 進階後端掛鉤

`CliBackendPlugin` 也可以定義：

| 掛鉤                               | 用途                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | 合併後重寫舊版使用者設定                                                    |
| `resolveExecutionArgs(ctx)`        | 加入請求範圍旗標，例如思考強度或旁路問題隔離                                |
| `prepareExecution(ctx)`            | 啟動前建立臨時驗證或設定橋接                                                |
| `transformSystemPrompt(ctx)`       | 套用最後的命令列介面專用系統提示轉換                                        |
| `textTransforms`                   | 雙向提示/輸出替換                                                           |
| `defaultAuthProfileId`             | 優先使用特定 OpenClaw 驗證設定檔                                            |
| `authEpochMode`                    | 決定驗證變更如何使已儲存的命令列介面工作階段失效                            |
| `nativeToolMode`                   | 宣告命令列介面是否具有始終啟用的原生工具                                    |
| `sideQuestionToolMode`             | 宣告 `/btw` 旁路問題的已停用原生工具                                         |
| `bundleMcp` / `bundleMcpMode`      | 選擇加入 OpenClaw 的回送 MCP 工具橋接                                       |
| `ownsNativeCompaction`             | 後端擁有自己的壓縮 - OpenClaw 會延後處理                                    |

請讓這些掛鉤由供應商擁有。當後端掛鉤能表達該行為時，
不要在核心中加入命令列介面專用分支。

`ctx.executionMode` 在一般回合中是 `"agent"`，在暫時性 `/btw` 呼叫中是
`"side-question"`。當命令列介面需要不同的一次性旗標時使用它，
例如為 BTW 停用原生工具、工作階段持久化或恢復行為。如果後端通常有
`nativeToolMode: "always-on"`，但其旁路問題 argv 能可靠停用這些工具，也請設定
`sideQuestionToolMode: "disabled"`；否則當 BTW 需要無工具命令列介面執行時，
OpenClaw 會以失敗關閉。

### `ownsNativeCompaction`：選擇退出 OpenClaw 壓縮

如果你的後端執行的代理會壓縮它**自己的**逐字稿，請設定
`ownsNativeCompaction: true`，讓 OpenClaw 的保護性摘要器永遠不會針對
其工作階段執行 - 命令列介面的壓縮生命週期會傳回 no-op，且該回合會繼續。
`claude-cli` 會宣告它，因為 Claude Code 會在內部壓縮，
且沒有線束端點。像 Codex 這類原生線束工作階段，則會繼續路由到其線束壓縮端點。

**只有在以下所有條件都成立時才宣告它**，否則延後處理的
超預算工作階段可能會持續超出預算或變得過期（OpenClaw 不再
救援它）：

- 後端在接近自身視窗上限時，能可靠地壓縮或限制自己的轉錄內容；
- 它會持久化可續接的工作階段，讓壓縮後的狀態能跨回合保留
  （例如 `--resume` / `--session-id`）；
- 它不是原生 harness 壓縮工作階段 - 符合 `agentHarnessId`
  的工作階段會改由 harness 端點處理。

## MCP 工具橋接

命令列介面後端預設不會收到 OpenClaw 工具。如果命令列介面可以使用
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
| `codex-config-overrides` | 接受 argv 上設定覆寫的命令列介面                        |
| `gemini-system-settings` | 從其系統設定目錄讀取 MCP 設定的命令列介面 |

只有在命令列介面確實可以使用橋接時才啟用它。如果命令列介面有
無法停用的內建工具層，請設定 `nativeToolMode:
"always-on"`，讓 OpenClaw 在呼叫端要求沒有原生
工具時能封閉失敗。

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
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

記錄使用者可能需要的最小覆寫項目 - 通常只有當二進位檔不在
`PATH` 中時才需要 `command`。

## 驗證

對於 bundled 外掛，請為建構器與設定註冊新增一個聚焦測試，
然後執行該外掛的目標測試通道：

```bash
pnpm test extensions/acme-cli
```

對於本機或已安裝的外掛，請驗證探索以及一次真實模型執行：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

如果後端支援圖片或 MCP，請新增一個即時 smoke，以使用真實命令列介面證明那些
路徑。不要依賴靜態檢查來驗證提示、圖片、
MCP 或工作階段續接行為。

## 檢查清單

<Check>`package.json` 具有 `openclaw.extensions`，且已為發布套件建立 runtime entries</Check>
<Check>`openclaw.plugin.json` 宣告 `cliBackends` 與有意圖的 `activation.onStartup`</Check>
<Check>當設定/模型探索應能冷啟動看到後端時，存在 `setup.cliBackends`</Check>
<Check>`api.registerCliBackend(...)` 使用與 manifest 相同的後端 ID</Check>
<Check>`agents.defaults.cliBackends.<id>` 下的使用者覆寫仍然優先</Check>
<Check>工作階段、系統提示、圖片與輸出 parser 設定符合真實命令列介面契約</Check>
<Check>目標測試與至少一次即時命令列介面 smoke 證明後端路徑</Check>

## 相關

- [命令列介面後端](/zh-TW/gateway/cli-backends) - 使用者設定與 runtime 行為
- [建構外掛](/zh-TW/plugins/building-plugins) - 套件與 manifest 基礎
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview) - 註冊 API 參考
- [外掛 manifest](/zh-TW/plugins/manifest) - `cliBackends` 與設定描述元
- [Agent harness](/zh-TW/plugins/sdk-agent-harness) - 完整外部 agent runtime
