---
read_when:
    - 你正在建構本機 AI 命令列介面後端外掛
    - 你想為 `acme-cli/model` 之類的模型參照註冊後端
    - 你需要將第三方命令列介面對應至 OpenClaw 的文字備援執行器
sidebarTitle: CLI backend plugins
summary: 建置一個註冊本機 AI 命令列介面後端的外掛
title: 建置命令列介面後端外掛
x-i18n:
    generated_at: "2026-07-22T10:39:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9bcbfb6c91e6c979715b497082cf3e360bc560a1e5dffe52edab125abe70e76d
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI 後端外掛讓 OpenClaw 能呼叫本機 AI 命令列介面作為文字推論後端。此後端會以提供者前綴的形式出現在模型參照中：

```text
acme-cli/acme-large
```

當上游整合已公開為本機命令、命令列介面管理本機登入狀態，或 API 提供者無法使用而需要備援時，請使用 CLI 後端。

<Info>
  如果上游服務提供一般的 HTTP 模型 API，請改為編寫
  [提供者外掛](/zh-TW/plugins/sdk-provider-plugins)。如果上游執行環境管理完整的代理程式工作階段、工具事件、壓縮或背景
  工作狀態，請使用[代理程式執行框架](/zh-TW/plugins/sdk-agent-harness)。
</Info>

## 外掛負責的內容

CLI 後端外掛有三項契約：

| 契約                 | 檔案                   | 用途                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 套件進入點           | `package.json`         | 將 OpenClaw 指向外掛執行環境模組                          |
| 資訊清單擁有權       | `openclaw.plugin.json` | 在載入執行環境前宣告後端 ID                               |
| 執行環境註冊         | `index.ts`             | 使用命令預設值呼叫 `api.registerCliBackend(...)` |

資訊清單是探索中繼資料：它不會執行命令列介面或註冊執行環境行為。當外掛進入點呼叫
`api.registerCliBackend(...)` 時，執行環境行為才會開始。

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

    發布的套件必須包含已建置的 JavaScript 執行環境檔案。如果原始碼
    進入點是 `./src/index.ts`，請新增指向已建置 JavaScript 對應檔案的 `openclaw.runtimeExtensions`。
    請參閱[進入點](/zh-TW/plugins/sdk-entrypoints)。

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

    `cliBackends` 是執行環境擁有權清單；當模型選擇或 `agentRuntime.id` 提及 `acme-cli` 時，它能讓 OpenClaw 自動載入
    外掛。

    `setup.cliBackends` 是以描述元為優先的設定介面。當模型探索、初始設定或狀態應在不載入外掛執行環境的情況下辨識後端時，請新增此介面。
    只有在這些靜態描述元已足以完成設定時，才使用 `requiresRuntime: false`。

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
          args: ["chat", "--output-format", "stream-json", "--prompt", "{prompt}"],
          resumeArgs: [
            "chat",
            "--resume",
            "{sessionId}",
            "--output-format",
            "stream-json",
            "--prompt",
            "{prompt}",
          ],
          output: "jsonl",
          resumeOutput: "jsonl",
          jsonlDialect: "gemini-stream-json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            large: "acme-large-2026",
            fast: "acme-fast-2026",
          },
          sessionArgs: ["--session", "{sessionId}"],
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          imagePathScope: "workspace",
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

    後端 ID 必須符合資訊清單中的 `cliBackends` 項目。已註冊的
    轉接器是具權威性的外掛程式碼；OpenClaw 設定會選取後端，
    但不會重寫其命令契約。

  </Step>
</Steps>

## 設定結構

`CliBackendConfig` 描述 OpenClaw 應如何啟動及剖析命令列介面。上方的
完整範例刻意涵蓋與內建
`google-gemini-cli` 轉接器相同的命令、繼續、JSONL、模型別名、工作階段、影像和監控計時器欄位：

| 欄位                                                      | 用途                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | 二進位檔名稱或命令的絕對路徑                                                     |
| `args`                                                    | 新執行的基礎 argv                                                                |
| `resumeArgs`                                              | 繼續工作階段所用的替代 argv；支援 `{sessionId}`                                  |
| `output` / `resumeOutput`                                 | 剖析器：`json`、`jsonl` 或 `text`                                  |
| `jsonlDialect`                                            | JSONL 事件方言：`claude-stream-json` 或 `gemini-stream-json`                      |
| `liveSession`                                             | 長時間執行的 CLI 程序模式（`claude-stdio`）                                       |
| `input`                                                   | 提示詞傳輸方式：`arg` 或 `stdin`                                         |
| `maxPromptArgChars`                                       | `arg` 模式在改用標準輸入前允許的提示詞長度上限                                  |
| `env` / `clearEnv`                                        | 要注入的額外環境變數，或啟動前要移除的名稱                                         |
| `modelArg`                                                | 模型 ID 前使用的旗標                                                             |
| `modelAliases`                                            | 將 OpenClaw 模型 ID 對應至 CLI 原生 ID                                            |
| `sessionArgs`                                             | 如何使用 `{sessionId}` 傳遞工作階段 ID                                           |
| `sessionMode`                                             | `always`、`existing` 或 `none`                                         |
| `sessionIdFields`                                         | OpenClaw 從 CLI 輸出讀取的 JSON 欄位                                              |
| `systemPromptArg` / `systemPromptFileArg`                 | 系統提示詞傳輸方式                                                               |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | 系統提示詞檔案的設定覆寫傳輸方式（例如 `-c`）                              |
| `systemPromptMode`                                        | `append` 或 `replace`                                                    |
| `systemPromptWhen`                                        | `first`、`always` 或 `never`                                    |
| `imageArg` / `imageMode`                                  | 影像路徑旗標，以及如何傳遞多張影像（`repeat` 或 `list`）                 |
| `imagePathScope`                                          | 交接前暫存影像檔案的位置：`temp` 或 `workspace`                    |
| `serialize`                                               | 讓使用相同後端的執行維持順序                                                     |
| `reseedFromRawTranscriptWhenUncompacted`                  | 選擇啟用壓縮前有界限的原始文字記錄重新植入，以便安全重設工作階段                  |
| `reliability.watchdog`                                    | 無輸出逾時調校，分別套用於新執行與繼續執行                                       |

請優先採用符合 CLI 的最小靜態設定。只有當行為確實屬於後端職責時，才新增外掛回呼。

## 進階後端掛鉤

`CliBackendPlugin` 也可以定義：

| 掛鉤                               | 用途                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | 使用執行環境上下文正規化已註冊的靜態轉接器                                  |
| `resolveExecutionArgs(ctx)`        | 新增請求範圍旗標，例如思考強度或旁支問題隔離                                |
| `prepareExecution(ctx)`            | 啟動前建立暫時的驗證、設定或環境橋接                                        |
| `transformSystemPrompt(ctx)`       | 套用最終的 CLI 專用系統提示詞轉換                                           |
| `textTransforms`                   | 雙向提示詞／輸出替換                                                        |
| `defaultAuthProfileId`             | 優先使用特定的 OpenClaw 驗證設定檔                                           |
| `authEpochMode`                    | 決定驗證變更如何使已儲存的 CLI 工作階段失效                                 |
| `nativeToolMode`                   | 宣告原生工具是不存在、永遠啟用，或可由主機選擇                              |
| `sideQuestionToolMode`             | 宣告 `/btw` 旁支問題停用的原生工具                                          |
| `bundleMcp` / `bundleMcpMode`      | 選擇啟用 OpenClaw 的迴送 MCP 工具橋接                                        |
| `ownsNativeCompaction`             | 後端自行負責壓縮，OpenClaw 會延後處理                                        |
| `subscriptionAuthDispatch`         | 選擇啟用的訂閱認證資訊嵌入式執行會透過此後端執行                            |
| `runtimeArtifact`                  | 將指令碼啟動器限定於其完整的內建套件樹                                      |

這些掛鉤應由提供者負責。當後端掛鉤能表達該行為時，請勿在核心中新增 CLI 專用分支。

`prepareExecution(ctx)` 會接收 `ctx.contextTokenBudget`，也就是為該次執行選定的有效權杖
上限。擁有原生壓縮功能的後端可將該預算對應至其
命令列介面專用的啟動契約。

`runtimeArtifact` 由外掛擁有。只有當即時推論輪次建立或重新驗證
已驗證的設定權限時，才會查閱此項；
一般命令列介面執行不需要它。未宣告此項的後端無法
建立已驗證的命令列介面設定權限。`bundled-package-tree` 宣告會指定
確切的 `package.json` 擁有者，並要求套件進入點必須是該
命令。OpenClaw 會雜湊有界且完整的已安裝套件樹，包括
巢狀相依套件，並針對重新導向的符號連結、
位於所宣告套件外的啟動器、必要的外部相依套件
宣告、過大的樹，以及未知指令碼採取失敗關閉。
只有在該樹包含完整的推論實作時才宣告此項；選用工具整合
不會讓外部實作圖變得安全。

如果同一後端也隨附獨立完備的原生可執行檔，請在
`nativeExecutableNames` 中列出其標準基底名稱。其他原生命令仍為
未驗證狀態。

一般輪次的 `ctx.executionMode` 為 `"agent"`，而暫時性
`/btw` 呼叫則為 `"side-question"`。當命令列介面需要不同的一次性旗標時，
請使用此項，例如為 BTW 停用原生工具、工作階段持久化或恢復
行為。如果後端通常具有 `nativeToolMode: "always-on"`，但其
附帶問題 argv 能可靠地停用這些工具，也請設定
`sideQuestionToolMode: "disabled"`；否則，當 BTW
要求執行無工具的命令列介面時，OpenClaw 會採取失敗關閉。

只有當 `resolveExecutionArgs` 能針對單次執行停用
每個後端原生工具時，才設定 `nativeToolMode: "selectable"`。對於這些受限制的執行，
`ctx.toolAvailability.native` 是確切的後端原生工具清單，而
`ctx.toolAvailability.mcp` 是確切的主機隔離 MCP 允許清單。該掛鉤
必須取代衝突的工具旗標、停用可在這些工具之外執行的
後端自訂介面，並傳回能強制執行這兩個
值的 argv。OpenClaw 會使用最終的全新或恢復 argv 呼叫它一次；當
後端無法強制執行限制時，便採取失敗關閉。在此
情境中，只有因為主機已將產生的 MCP 設定限制於
這些伺服器和工具，MCP 名稱才能安全地自動核准。

若要支援 OpenClaw 執行階段上限（例如排程 `toolsAllow`），也請實作
`resolveRuntimeToolAvailability(ctx)`。OpenClaw 會傳入正規化且
已展開群組的允許清單，並一律停用後端原生工具。請僅傳回
從該允許清單選取的主機隔離 MCP 名稱。傳回 `null` 或
`undefined` 會讓通用執行器維持失敗關閉。後端可省略無法表示的
允許工具，但絕不可加入允許清單中不存在的
權限。主機在建立授權前，會拒絕任何不是
其中一個允許工具確切 `mcp__openclaw__<tool>` 名稱的傳回項目。

### `ownsNativeCompaction`：選擇不使用 OpenClaw 壓縮

如果你的後端所執行的代理程式會壓縮其**自身的**對話記錄，請設定
`ownsNativeCompaction: true`，如此 OpenClaw 的防護摘要器便不會對其
工作階段執行；命令列介面壓縮生命週期會成為無操作，且該輪次會繼續。
`claude-cli` 會宣告此項，因為 Claude Code 會在內部壓縮，
且沒有操作框架端點。Codex 等原生操作框架工作階段
則會繼續路由至其操作框架壓縮端點。

**只有在下列條件全部成立時才宣告此項**，否則延後處理且
超出預算的工作階段可能持續超出預算或變得過時（OpenClaw 將不再
挽救它）：

- 後端在接近其
  視窗上限時，會可靠地壓縮或限制自身的對話記錄；
- 後端會保存可恢復的工作階段，使壓縮後的狀態能跨輪次保留
  （例如 `--resume` / `--session-id`）；
- 該工作階段不是原生操作框架壓縮工作階段；符合 `agentHarnessId` 的
  工作階段會改為路由至操作框架端點。

## MCP 工具橋接器

命令列介面後端預設不會接收 OpenClaw 工具。如果命令列介面可使用
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
| `gemini-system-settings` | 從系統設定目錄讀取 MCP 設定的命令列介面 |

只有在命令列介面確實可使用橋接器時才啟用。如果命令列介面具有
無法停用的內建工具層，請設定 `nativeToolMode:
"always-on"`，讓 OpenClaw 能在呼叫端要求不得使用原生
工具時採取失敗關閉。如果它能針對每次執行停用所有原生工具，請搭配上述
`resolveExecutionArgs` 契約使用 `"selectable"`。

## 選取後端

使用者透過模型參照前綴選取獨立後端。宣告標準
`modelProvider` 的後端，則可改為透過該
供應商模型的 `agentRuntime.id` 選取。配接器機制仍保留在外掛中：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

請將認證資訊放在 OpenClaw 驗證設定檔或外掛擁有的設定中。請確保
已註冊的命令位於閘道服務的 `PATH` 中；需要不同
路徑或 argv 的部署應變更或包裝外掛註冊。

## 驗證

對於隨附的外掛，請針對建構器和設定
註冊新增聚焦測試，然後執行該外掛的目標測試通道：

```bash
pnpm test extensions/acme-cli
```

對於本機或已安裝的外掛，請驗證探索功能並執行一次真實模型：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

如果後端支援圖片或 MCP，請新增使用真實命令列介面證明這些
路徑的即時煙霧測試。對於提示詞、圖片、
MCP 或工作階段恢復行為，請勿僅依賴靜態檢查。

## 檢查清單

<Check>`package.json` 具有 `openclaw.extensions`，且已發布套件具有建置完成的執行階段項目</Check>
<Check>`openclaw.plugin.json` 宣告 `cliBackends` 和刻意設定的 `activation.onStartup`</Check>
<Check>當設定／模型探索應在冷啟動時看見後端，`setup.cliBackends` 即存在</Check>
<Check>`api.registerCliBackend(...)` 使用與資訊清單相同的後端 ID</Check>
<Check>後端模型前綴或模型範圍的 `agentRuntime.id` 會選取該註冊</Check>
<Check>工作階段、系統提示詞、圖片和輸出剖析器設定符合真實命令列介面契約</Check>
<Check>目標測試和至少一次即時命令列介面煙霧測試可證明後端路徑</Check>

## 相關內容

- [命令列介面後端](/zh-TW/gateway/cli-backends) - 執行階段選取與行為
- [建置外掛](/zh-TW/plugins/building-plugins) - 套件與資訊清單基礎
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview) - 註冊 API 參考
- [外掛資訊清單](/zh-TW/plugins/manifest) - `cliBackends` 與設定描述元
- [代理程式操作框架](/zh-TW/plugins/sdk-agent-harness) - 完整的外部代理程式執行階段
