---
read_when:
    - 你正在建置本機 AI 命令列介面後端外掛
    - 你想要為 `acme-cli/model` 這類模型參照註冊後端
    - 你需要將第三方命令列介面對應至 OpenClaw 的文字備援執行器
sidebarTitle: CLI backend plugins
summary: 建立一個註冊本機 AI 命令列介面後端的外掛
title: 建置命令列介面後端外掛
x-i18n:
    generated_at: "2026-07-20T00:54:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 08edceae9afd133684094b6febc6ca9b0ab89ce1168474f0a4fabd15b5ac4200
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

命令列介面後端外掛可讓 OpenClaw 呼叫本機 AI 命令列介面，作為文字推論後端。此後端會以提供者前綴形式出現在模型參照中：

```text
acme-cli/acme-large
```

當上游整合已透過本機命令公開、命令列介面管理本機登入狀態，或 API 提供者無法使用而需要備援時，請使用命令列介面後端。

<Info>
  如果上游服務公開一般的 HTTP 模型 API，請改為撰寫
  [提供者外掛](/zh-TW/plugins/sdk-provider-plugins)。如果上游執行階段管理完整的代理程式工作階段、工具事件、壓縮或背景
  任務狀態，請使用[代理程式操作框架](/zh-TW/plugins/sdk-agent-harness)。
</Info>

## 外掛負責的項目

命令列介面後端外掛有三項契約：

| 契約                 | 檔案                   | 用途                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 套件進入點           | `package.json`         | 將 OpenClaw 指向外掛執行階段模組                          |
| 資訊清單擁有權       | `openclaw.plugin.json` | 在執行階段載入前宣告後端 ID                               |
| 執行階段註冊         | `index.ts`             | 使用命令預設值呼叫 `api.registerCliBackend(...)`                     |

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

    發布的套件必須隨附建置完成的 JavaScript 執行階段檔案。如果你的原始碼
    進入點是 `./src/index.ts`，請新增指向建置完成之 JavaScript 對應檔案的 `openclaw.runtimeExtensions`。請參閱[進入點](/zh-TW/plugins/sdk-entrypoints)。

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

    `cliBackends` 是執行階段擁有權清單；當設定或模型選擇提及 `acme-cli/...` 時，它可讓 OpenClaw 自動載入
    外掛。

    `setup.cliBackends` 是描述元優先的設定介面。當模型探索、初始設定或狀態應在不載入外掛執行階段的情況下辨識後端時，請新增此介面。只有在
    這些靜態描述元足以完成設定時，才使用 `requiresRuntime: false`。

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

    後端 ID 必須與資訊清單的 `cliBackends` 項目相符。已註冊的 `config` 只是預設值；執行階段會將
    `agents.defaults.cliBackends.acme-cli` 下的使用者設定合併於其上。

  </Step>
</Steps>

## 設定結構

`CliBackendConfig` 描述 OpenClaw 應如何啟動及剖析命令列介面：

| 欄位                                                      | 用途                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | 二進位檔名稱或絕對命令路徑                                                       |
| `args`                                                    | 全新執行的基礎 argv                                                              |
| `resumeArgs`                                              | 恢復工作階段使用的替代 argv；支援 `{sessionId}`                             |
| `output` / `resumeOutput`                                 | 剖析器：`json`、`jsonl` 或 `text`            |
| `jsonlDialect`                                            | JSONL 事件方言：`claude-stream-json` 或 `gemini-stream-json`                         |
| `liveSession`                                             | 長時間執行的命令列介面程序模式（`claude-stdio`）                             |
| `input`                                                   | 提示詞傳輸方式：`arg` 或 `stdin`                         |
| `maxPromptArgChars`                                       | `arg` 模式在改用 stdin 前的提示詞長度上限                           |
| `env` / `clearEnv`                                        | 要注入的額外環境變數，或啟動前要移除的環境變數名稱                              |
| `modelArg`                                                | 模型 ID 前使用的旗標                                                            |
| `modelAliases`                                            | 將 OpenClaw 模型 ID 對應至命令列介面的原生 ID                                   |
| `sessionArg` / `sessionArgs`                              | 工作階段 ID 的傳遞方式                                                          |
| `sessionMode`                                             | `always`、`existing` 或 `none`                    |
| `sessionIdFields`                                         | OpenClaw 從命令列介面輸出讀取的 JSON 欄位                                       |
| `systemPromptArg` / `systemPromptFileArg`                 | 系統提示詞傳輸方式                                                               |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | 系統提示詞檔案的設定覆寫傳輸方式（例如 `-c`）                      |
| `systemPromptMode`                                        | `append` 或 `replace`                                        |
| `systemPromptWhen`                                        | `first`、`always` 或 `never`                    |
| `imageArg` / `imageMode`                                  | 圖片路徑旗標及多張圖片的傳遞方式（`repeat` 或 `list`）     |
| `imagePathScope`                                          | 移交前暫存圖片檔案的位置：`temp` 或 `workspace`              |
| `serialize`                                               | 讓相同後端的執行保持順序                                                        |
| `reseedFromRawTranscriptWhenUncompacted`                  | 選擇啟用在壓縮前進行有界限的原始逐字稿重新植入，以安全重設工作階段               |
| `reliability.watchdog`                                    | 無輸出逾時調校，針對全新與恢復執行分別設定                                      |

請優先採用符合命令列介面的最小靜態設定。只有在行為確實屬於後端職責時，才新增外掛回呼。

## 進階後端掛鉤

`CliBackendPlugin` 也可以定義：

| 掛鉤                               | 用途                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | 在合併後重寫舊版使用者設定                                                  |
| `resolveExecutionArgs(ctx)`        | 新增要求範圍的旗標，例如思考強度或旁支問題隔離                              |
| `prepareExecution(ctx)`            | 在啟動前建立臨時的驗證、設定或環境橋接                                      |
| `transformSystemPrompt(ctx)`       | 套用最終的命令列介面專屬系統提示詞轉換                                      |
| `textTransforms`                   | 雙向提示詞／輸出取代                                                        |
| `defaultAuthProfileId`             | 優先使用特定的 OpenClaw 驗證設定檔                                           |
| `authEpochMode`                    | 決定驗證變更如何使儲存的命令列介面工作階段失效                              |
| `nativeToolMode`                   | 宣告原生工具為不存在、永遠啟用或可由主機選擇                                |
| `sideQuestionToolMode`             | 宣告 `/btw` 旁支問題停用的原生工具                               |
| `bundleMcp` / `bundleMcpMode`      | 選擇啟用 OpenClaw 的回送 MCP 工具橋接                                        |
| `ownsNativeCompaction`             | 後端自行管理壓縮，OpenClaw 會延後處理                                        |
| `subscriptionAuthDispatch`         | 已選擇啟用且使用訂閱認證資訊的嵌入式執行，會透過此後端執行                    |
| `runtimeArtifact`                  | 將指令碼啟動器限定在其完整的隨附套件樹狀結構內                              |

請讓這些掛鉤由提供者負責。如果後端掛鉤可以表達該行為，請勿在核心中新增命令列介面專屬分支。

`prepareExecution(ctx)` 會接收 `ctx.contextTokenBudget`，也就是為該次執行選定的有效權杖
上限。自行管理原生壓縮的後端可將該預算對應至其命令列介面專屬的啟動契約。

`runtimeArtifact` 由外掛擁有，使用者無法覆寫。僅當即時推論回合建立或重新驗證已驗證的設定權限時，才會查閱此項；一般命令列介面執行不需要它。未宣告此項的後端無法建立已驗證的命令列介面設定權限。`bundled-package-tree` 宣告會指定確切的 `package.json` 擁有者，並要求套件進入點必須是該命令。OpenClaw 會雜湊有界且完整的已安裝套件樹狀結構（包括巢狀相依套件），並對重新導向的符號連結、位於所宣告套件之外的啟動器、必要的外部相依套件宣告、過大的樹狀結構及未知指令碼採取失敗時關閉。只有當該樹狀結構包含完整的推論實作時，才宣告此項；選用的工具整合不會讓外部實作圖變得安全。

如果同一後端也提供自足式原生可執行檔，請在 `nativeExecutableNames` 中列出其標準基底名稱。即使使用者覆寫後端命令，其他原生命令仍不會通過驗證。

一般回合的 `ctx.executionMode` 為 `"agent"`，暫時性 `/btw` 呼叫則為 `"side-question"`。當命令列介面需要不同的一次性旗標時（例如針對 BTW 停用原生工具、工作階段持久化或繼續行為），請使用此項。如果後端通常具有 `nativeToolMode: "always-on"`，但其附帶問題 argv 能可靠地停用這些工具，也請設定 `sideQuestionToolMode: "disabled"`；否則，當 BTW 要求不使用工具的命令列介面執行時，OpenClaw 會採取失敗時關閉。

只有當 `resolveExecutionArgs` 能針對個別執行停用所有後端原生工具時，才設定 `nativeToolMode: "selectable"`。對於這些受限執行，`ctx.toolAvailability.native` 是空元組，而 `ctx.toolAvailability.mcp` 則是確切的主機隔離 MCP 允許清單。該掛鉤必須取代衝突的工具旗標，並傳回同時強制執行這兩個值的 argv；OpenClaw 會使用最終的全新或繼續 argv 呼叫它一次，若後端無法強制執行限制，便會採取失敗時關閉。在此情境中，MCP 名稱只有在主機已將產生的 MCP 設定限制於這些伺服器與工具後，才可安全地自動核准。

### `ownsNativeCompaction`：選擇退出 OpenClaw 壓縮

如果你的後端執行的代理程式會壓縮其**自身**逐字稿，請設定 `ownsNativeCompaction: true`，如此 OpenClaw 的防護摘要器便永遠不會針對其工作階段執行——命令列介面壓縮生命週期會傳回無操作，而回合會繼續進行。`claude-cli` 會宣告此項，因為 Claude Code 會在內部壓縮，且沒有框架端點。Codex 等原生框架工作階段則會繼續路由至其框架壓縮端點。

**只有在以下所有條件均成立時才宣告此項**，否則延後處理且超出預算的工作階段可能持續超出預算或變得過時（OpenClaw 不再挽救它）：

- 後端會在逐字稿接近其視窗限制時，可靠地壓縮逐字稿或限制其大小；
- 後端會保存可繼續的工作階段，使壓縮後的狀態能跨回合保留
  （例如 `--resume` / `--session-id`）；
- 它不是原生框架壓縮工作階段——符合 `agentHarnessId` 的
  工作階段會改為路由至框架端點。

## MCP 工具橋接

命令列介面後端預設不會接收 OpenClaw 工具。如果命令列介面能使用 MCP 設定，請明確選擇啟用：

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

只有在命令列介面確實能使用橋接時才啟用。如果命令列介面有無法停用的內建工具層，請設定 `nativeToolMode:
"always-on"`，讓 OpenClaw 能在呼叫者要求不得使用原生工具時採取失敗時關閉。如果命令列介面能針對每次執行停用所有原生工具，請依照上述 `resolveExecutionArgs` 合約使用 `"selectable"`。

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

請記錄使用者可能需要的最小覆寫項目——當二進位檔位於 `PATH` 之外時，通常只需要 `command`。

## 驗證

對於隨附的外掛，請為建構器與設定註冊新增聚焦測試，接著執行該外掛的目標測試通道：

```bash
pnpm test extensions/acme-cli
```

對於本機或已安裝的外掛，請驗證探索功能並執行一次實際模型：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "精確回覆：backend ok" --model acme-cli/acme-large
```

如果後端支援圖片或 MCP，請新增即時冒煙測試，使用實際命令列介面證明這些路徑。對於提示、圖片、MCP 或工作階段繼續行為，請勿依賴靜態檢查。

## 檢查清單

<Check>`package.json` 具有 `openclaw.extensions`，且已發布套件具有建置後的執行階段項目</Check>
<Check>`openclaw.plugin.json` 宣告 `cliBackends` 與有意設定的 `activation.onStartup`</Check>
<Check>當設定／模型探索應在冷啟動狀態下看見後端時，`setup.cliBackends` 必須存在</Check>
<Check>`api.registerCliBackend(...)` 使用與資訊清單相同的後端 ID</Check>
<Check>`agents.defaults.cliBackends.<id>` 下的使用者覆寫仍會優先套用</Check>
<Check>工作階段、系統提示、圖片及輸出剖析器設定符合實際命令列介面合約</Check>
<Check>目標測試及至少一次即時命令列介面冒煙測試證明後端路徑可用</Check>

## 相關內容

- [命令列介面後端](/zh-TW/gateway/cli-backends)——使用者設定與執行階段行為
- [建構外掛](/zh-TW/plugins/building-plugins)——套件與資訊清單基礎
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)——註冊 API 參考
- [外掛資訊清單](/zh-TW/plugins/manifest)——`cliBackends` 與設定描述元
- [代理程式框架](/zh-TW/plugins/sdk-agent-harness)——完整的外部代理程式執行階段
