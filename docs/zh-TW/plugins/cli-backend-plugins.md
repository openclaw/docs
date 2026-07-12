---
read_when:
    - 你正在建置本機 AI 命令列介面後端外掛
    - 你想為 `acme-cli/model` 之類的模型參照註冊後端
    - 你需要將第三方命令列介面對應至 OpenClaw 的文字備援執行器
sidebarTitle: CLI backend plugins
summary: 建置一個註冊本機 AI 命令列介面後端的外掛
title: 建置命令列介面後端外掛
x-i18n:
    generated_at: "2026-07-11T21:31:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

命令列介面後端外掛讓 OpenClaw 能夠呼叫本機 AI 命令列介面作為文字推論後端。此後端會在模型參照中顯示為提供者前綴：

```text
acme-cli/acme-large
```

當上游整合已透過本機命令提供、命令列介面負責管理本機登入狀態，或 API 提供者無法使用而需要備援時，請使用命令列介面後端。

<Info>
  如果上游服務提供一般的 HTTP 模型 API，請改為撰寫
  [提供者外掛](/zh-TW/plugins/sdk-provider-plugins)。如果上游執行階段負責完整的代理程式工作階段、工具事件、壓縮或背景
  任務狀態，請使用[代理程式框架](/zh-TW/plugins/sdk-agent-harness)。
</Info>

## 外掛負責的範圍

命令列介面後端外掛包含三項契約：

| 契約                 | 檔案                   | 用途                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 套件進入點           | `package.json`         | 將 OpenClaw 指向外掛執行階段模組                        |
| 資訊清單擁有權       | `openclaw.plugin.json` | 在載入執行階段前宣告後端 ID                            |
| 執行階段註冊         | `index.ts`             | 使用命令預設值呼叫 `api.registerCliBackend(...)`       |

資訊清單是探索用中繼資料：它不會執行命令列介面或註冊執行階段行為。當外掛進入點呼叫 `api.registerCliBackend(...)` 時，執行階段行為才會開始。

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

    發布的套件必須包含已建置的 JavaScript 執行階段檔案。如果來源
    進入點是 `./src/index.ts`，請新增指向對應已建置 JavaScript 檔案的 `openclaw.runtimeExtensions`。請參閱[進入點](/zh-TW/plugins/sdk-entrypoints)。

  </Step>

  <Step title="宣告後端擁有權">
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

    `cliBackends` 是執行階段擁有權清單；當設定或模型選擇提及 `acme-cli/...` 時，它能讓 OpenClaw 自動載入此外掛。

    `setup.cliBackends` 是描述元優先的設定介面。若要讓模型探索、初始設定或狀態在不載入外掛執行階段的情況下辨識後端，請新增此欄位。只有在這些靜態描述元足以完成設定時，才使用 `requiresRuntime: false`。

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

    後端 ID 必須與資訊清單中的 `cliBackends` 項目相符。註冊的 `config` 只是預設值；執行階段會將 `agents.defaults.cliBackends.acme-cli` 下的使用者設定合併並覆寫在其上。

  </Step>
</Steps>

## 設定結構

`CliBackendConfig` 說明 OpenClaw 應如何啟動及剖析命令列介面：

| 欄位                                                     | 用途                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | 二進位檔名稱或命令的絕對路徑                                                      |
| `args`                                                    | 全新執行時的基礎引數向量                                                          |
| `resumeArgs`                                              | 恢復工作階段時使用的替代引數向量；支援 `{sessionId}`                              |
| `output` / `resumeOutput`                                 | 剖析器：`json`、`jsonl` 或 `text`                                                 |
| `jsonlDialect`                                            | JSONL 事件方言：`claude-stream-json` 或 `gemini-stream-json`                      |
| `liveSession`                                             | 長時間執行的命令列介面程序模式（`claude-stdio`）                                  |
| `input`                                                   | 提示詞傳輸方式：`arg` 或 `stdin`                                                  |
| `maxPromptArgChars`                                       | `arg` 模式在改用標準輸入前允許的提示詞最大長度                                   |
| `env` / `clearEnv`                                        | 要注入的額外環境變數，或啟動前要移除的環境變數名稱                               |
| `modelArg`                                                | 模型 ID 前使用的旗標                                                              |
| `modelAliases`                                            | 將 OpenClaw 模型 ID 對應至命令列介面原生 ID                                      |
| `sessionArg` / `sessionArgs`                              | 工作階段 ID 的傳遞方式                                                            |
| `sessionMode`                                             | `always`、`existing` 或 `none`                                                    |
| `sessionIdFields`                                         | OpenClaw 從命令列介面輸出讀取的 JSON 欄位                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | 系統提示詞的傳輸方式                                                              |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | 系統提示詞檔案的設定覆寫傳輸方式（例如 `-c`）                                    |
| `systemPromptMode`                                        | `append` 或 `replace`                                                             |
| `systemPromptWhen`                                        | `first`、`always` 或 `never`                                                      |
| `imageArg` / `imageMode`                                  | 圖片路徑旗標及多張圖片的傳遞方式（`repeat` 或 `list`）                            |
| `imagePathScope`                                          | 交接前暫存圖片檔案的存放位置：`temp` 或 `workspace`                              |
| `serialize`                                               | 讓相同後端的執行保持順序                                                          |
| `reseedFromRawTranscriptWhenUncompacted`                  | 選擇在壓縮前從有限範圍的原始逐字稿重新植入內容，以安全重設工作階段                |
| `reliability.outputLimits`                                | 單次即時命令列介面輪次保留的原始 JSONL 字元數／行數上限（即時工作階段後端）       |
| `reliability.watchdog`                                    | 無輸出逾時調整，分別適用於全新執行與恢復執行                                     |

請優先採用符合命令列介面的最小靜態設定。只有在行為確實應由後端負責時，才新增外掛回呼。

## 進階後端掛鉤

`CliBackendPlugin` 也可定義：

| 掛鉤                               | 用途                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | 合併後改寫舊版使用者設定                                                    |
| `resolveExecutionArgs(ctx)`        | 新增要求範圍的旗標，例如思考強度或旁支問題隔離                              |
| `prepareExecution(ctx)`            | 啟動前建立暫時性的驗證或設定橋接                                            |
| `transformSystemPrompt(ctx)`       | 套用最終的命令列介面專用系統提示詞轉換                                      |
| `textTransforms`                   | 雙向提示詞／輸出替換                                                        |
| `defaultAuthProfileId`             | 優先使用特定的 OpenClaw 驗證設定檔                                           |
| `authEpochMode`                    | 決定驗證變更如何使已儲存的命令列介面工作階段失效                            |
| `nativeToolMode`                   | 宣告原生工具是不存在、永遠啟用或可由主機選擇                                |
| `sideQuestionToolMode`             | 宣告 `/btw` 旁支問題停用的原生工具                                           |
| `bundleMcp` / `bundleMcpMode`      | 選擇加入 OpenClaw 的 local loopback MCP 工具橋接                             |
| `ownsNativeCompaction`             | 後端自行負責壓縮，OpenClaw 會延後處理                                        |
| `runtimeArtifact`                  | 將指令碼啟動器限定於其完整的內含套件樹                                      |

請讓這些掛鉤由提供者負責。當後端掛鉤能表達該行為時，請勿在核心新增命令列介面專用分支。

`runtimeArtifact` 由外掛擁有，使用者無法覆寫。只有當即時推論輪次產生或重新驗證已驗證的設定授權時，才會查詢此項；一般命令列介面執行不需要它。未提供此宣告的後端無法產生已驗證的命令列介面設定授權。`bundled-package-tree` 宣告會指定確切的 `package.json` 擁有者，並要求套件進入點必須是該命令。OpenClaw 會雜湊有界的完整已安裝套件樹，包括巢狀相依套件；若遇到重新導向的符號連結、宣告套件之外的啟動器、必要的外部相依性宣告、過大的套件樹或未知指令碼，則會採取失敗即關閉。只有當該套件樹包含完整的推論實作時，才進行此宣告；選用的工具整合並不會讓外部實作圖變得安全。

如果同一後端也提供自包含的原生可執行檔，請在 `nativeExecutableNames` 中列出其標準基底名稱。即使使用者覆寫後端命令，其他原生命令仍不會獲得驗證。

`ctx.executionMode` 在一般回合中為 `"agent"`，在暫時性的 `/btw` 呼叫中則為 `"side-question"`。當命令列介面需要不同的一次性旗標時，請使用此屬性，例如為 BTW 停用原生工具、工作階段持久化或繼續執行行為。若後端通常設有 `nativeToolMode: "always-on"`，但其側邊問題 argv 能可靠地停用這些工具，也請設定 `sideQuestionToolMode: "disabled"`；否則，當 BTW 要求在無工具模式下執行命令列介面時，OpenClaw 會以安全關閉方式失敗。

僅當 `resolveExecutionArgs` 能針對單次執行停用所有後端原生工具時，才設定 `nativeToolMode: "selectable"`。對於這類受限執行，`ctx.toolAvailability.native` 是空元組，而 `ctx.toolAvailability.mcp` 則是經主機隔離後的確切 MCP 允許清單。此掛鉤必須取代互相衝突的工具旗標，並傳回能強制執行這兩項設定的 argv；OpenClaw 會使用最終的新建或繼續執行 argv 呼叫它一次，若後端無法強制執行限制，便會以安全關閉方式失敗。此情境中的 MCP 名稱之所以能安全地自動核准，僅是因為主機已將產生的 MCP 設定限制於這些伺服器與工具。

### `ownsNativeCompaction`：停用 OpenClaw 壓縮

若後端執行的代理會壓縮其**自身**逐字稿，請設定 `ownsNativeCompaction: true`，如此 OpenClaw 的防護摘要器便永遠不會對其工作階段執行——命令列介面的壓縮生命週期會直接不執行任何操作，並繼續該回合。`claude-cli` 會宣告此設定，因為 Claude Code 會在內部進行壓縮，且沒有代理框架端點。Codex 等原生代理框架工作階段則會繼續路由至其代理框架壓縮端點。

**僅在下列所有條件皆成立時才宣告此設定**，否則延後處理且超出預算的工作階段可能持續超出預算或變得過時（OpenClaw 將不再挽救該工作階段）：

- 後端會在逐字稿接近內容窗口限制時，可靠地自行壓縮逐字稿或限制其大小；
- 後端會持久化可繼續執行的工作階段，使壓縮後的狀態能跨回合保留（例如 `--resume` / `--session-id`）；
- 該工作階段不是原生代理框架壓縮工作階段——符合 `agentHarnessId` 的工作階段會改為路由至代理框架端點。

## MCP 工具橋接

命令列介面後端預設不會接收 OpenClaw 工具。若命令列介面能使用 MCP 設定，請明確選擇啟用：

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
| `gemini-system-settings` | 從系統設定目錄讀取 MCP 設定的命令列介面 |

僅當命令列介面確實能使用橋接時才啟用它。若命令列介面具有無法停用的內建工具層，請設定 `nativeToolMode: "always-on"`，如此當呼叫端要求不使用原生工具時，OpenClaw 便能以安全關閉方式失敗。若它能針對每次執行停用所有原生工具，請搭配上述 `resolveExecutionArgs` 契約使用 `"selectable"`。

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

請記錄使用者最可能需要的最低限度覆寫設定——通常只有當執行檔不在 `PATH` 中時才需要設定 `command`。

## 驗證

對於隨附的外掛，請為建構器與設定註冊新增聚焦測試，接著執行該外掛的目標測試通道：

```bash
pnpm test extensions/acme-cli
```

對於本機或已安裝的外掛，請驗證探索功能與一次真實模型執行：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

若後端支援圖片或 MCP，請新增即時冒煙測試，以真實命令列介面證明這些路徑可正常運作。對於提示詞、圖片、MCP 或工作階段繼續執行行為，請勿僅依賴靜態檢查。

## 檢查清單

<Check>`package.json` 具有 `openclaw.extensions`，且已發佈套件具有建置後的執行階段進入點</Check>
<Check>`openclaw.plugin.json` 宣告 `cliBackends` 與刻意設定的 `activation.onStartup`</Check>
<Check>當設定流程或模型探索應能在尚未載入後端時看見該後端，`setup.cliBackends` 必須存在</Check>
<Check>`api.registerCliBackend(...)` 使用與資訊清單相同的後端 ID</Check>
<Check>`agents.defaults.cliBackends.<id>` 下的使用者覆寫仍具有優先權</Check>
<Check>工作階段、系統提示詞、圖片與輸出剖析器設定符合真實命令列介面契約</Check>
<Check>目標測試與至少一次即時命令列介面冒煙測試證明後端路徑可正常運作</Check>

## 相關內容

- [命令列介面後端](/zh-TW/gateway/cli-backends)——使用者設定與執行階段行為
- [建置外掛](/zh-TW/plugins/building-plugins)——套件與資訊清單基礎
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)——註冊 API 參考
- [外掛資訊清單](/zh-TW/plugins/manifest)——`cliBackends` 與設定描述元
- [代理框架](/zh-TW/plugins/sdk-agent-harness)——完整的外部代理執行階段
