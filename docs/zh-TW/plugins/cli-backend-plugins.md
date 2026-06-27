---
read_when:
    - 你正在建置本機 AI 命令列介面後端外掛
    - 你想為 acme-cli/model 這類模型參照註冊後端
    - 你需要將第三方命令列介面對應到 OpenClaw 的文字備援執行器
sidebarTitle: CLI backend plugins
summary: 建置一個註冊本機 AI 命令列介面後端的外掛
title: 建置命令列介面後端外掛
x-i18n:
    generated_at: "2026-06-27T19:33:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI 後端外掛讓 OpenClaw 可呼叫本機 AI 命令列介面作為文字推論
後端。後端會在模型參照中顯示為供應商前綴：

```text
acme-cli/acme-large
```

當上游整合已經以本機命令公開、命令列介面擁有本機登入狀態，或在 API 供應商無法使用時命令列介面可作為實用備援時，請使用 CLI 後端。

<Info>
  如果上游服務公開一般 HTTP 模型 API，請改寫
  [供應商外掛](/zh-TW/plugins/sdk-provider-plugins)。如果上游
  執行階段擁有完整的代理工作階段、工具事件、壓縮或背景
  工作狀態，請使用[代理工具架構](/zh-TW/plugins/sdk-agent-harness)。
</Info>

## 外掛擁有的內容

CLI 後端外掛有三個合約：

| 合約                 | 檔案                   | 用途                                      |
| -------------------- | ---------------------- | ----------------------------------------- |
| 套件入口             | `package.json`         | 將 OpenClaw 指向外掛執行階段模組          |
| 清單所有權           | `openclaw.plugin.json` | 在執行階段載入前宣告後端 ID               |
| 執行階段註冊         | `index.ts`             | 使用命令預設值呼叫 `api.registerCliBackend(...)` |

清單是探索中繼資料。它不會執行 CLI，也不會
註冊執行階段行為。執行階段行為會在外掛入口呼叫
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

    已發布的套件必須隨附建置完成的 JavaScript 執行階段檔案。如果你的來源
    入口是 `./src/index.ts`，請加入指向
    建置後 JavaScript 對等檔案的 `openclaw.runtimeExtensions`。請參閱[入口點](/zh-TW/plugins/sdk-entrypoints)。

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

    `cliBackends` 是執行階段所有權清單。當設定或模型選擇提到 `acme-cli/...` 時，它會讓 OpenClaw 自動載入
    外掛。

    `setup.cliBackends` 是描述元優先的設定介面。當
    模型探索、入門流程或狀態應在不載入外掛執行階段的情況下辨識後端時加入它。只有當這些靜態
    描述元足以完成設定時，才使用 `requiresRuntime: false`。

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

    後端 ID 必須符合清單中的 `cliBackends` 項目。已註冊的
    `config` 只是預設值；執行階段會將
    `agents.defaults.cliBackends.acme-cli` 下的使用者設定合併到其上。

  </Step>
</Steps>

## 設定形狀

`CliBackendConfig` 描述 OpenClaw 應如何啟動並解析 CLI：

| 欄位                                      | 用途                                                        |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | 二進位名稱或絕對命令路徑                                    |
| `args`                                    | 新執行的基礎 argv                                           |
| `resumeArgs`                              | 恢復工作階段的替代 argv；支援 `{sessionId}`                 |
| `output` / `resumeOutput`                 | 解析器：`json`、`jsonl` 或 `text`                            |
| `input`                                   | 提示詞傳輸：`arg` 或 `stdin`                                |
| `modelArg`                                | 模型 ID 前使用的旗標                                        |
| `modelAliases`                            | 將 OpenClaw 模型 ID 對應到 CLI 原生 ID                       |
| `sessionArg` / `sessionArgs`              | 如何傳遞工作階段 ID                                         |
| `sessionMode`                             | `always`、`existing` 或 `none`                               |
| `sessionIdFields`                         | OpenClaw 從 CLI 輸出讀取的 JSON 欄位                         |
| `systemPromptArg` / `systemPromptFileArg` | 系統提示詞傳輸                                              |
| `systemPromptWhen`                        | `first`、`always` 或 `never`                                 |
| `imageArg` / `imageMode`                  | 圖片路徑支援                                                |
| `serialize`                               | 保持同一後端的執行有序                                      |
| `reliability.watchdog`                    | 無輸出逾時調校                                              |

偏好符合 CLI 的最小靜態設定。只有在行為確實屬於後端時，才加入外掛回呼。

## 進階後端掛鉤

`CliBackendPlugin` 也可以定義：

| 掛鉤                               | 用途                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| `normalizeConfig(config, context)` | 合併後重寫舊版使用者設定                                    |
| `resolveExecutionArgs(ctx)`        | 加入請求範圍旗標，例如思考強度或旁支問題隔離                |
| `prepareExecution(ctx)`            | 啟動前建立暫時的驗證或設定橋接                              |
| `transformSystemPrompt(ctx)`       | 套用最終的 CLI 專用系統提示詞轉換                           |
| `textTransforms`                   | 雙向提示詞/輸出替換                                        |
| `defaultAuthProfileId`             | 偏好特定 OpenClaw 驗證設定檔                                |
| `authEpochMode`                    | 決定驗證變更如何讓已儲存的 CLI 工作階段失效                 |
| `nativeToolMode`                   | 宣告 CLI 是否有永遠啟用的原生工具                           |
| `sideQuestionToolMode`             | 宣告 `/btw` 旁支問題停用原生工具                            |
| `bundleMcp` / `bundleMcpMode`      | 選擇加入 OpenClaw 的 loopback MCP 工具橋接                   |
| `ownsNativeCompaction`             | 後端擁有自己的壓縮 - OpenClaw 會延後                         |

讓這些掛鉤由供應商擁有。當後端掛鉤可以表達該行為時，不要在核心加入 CLI 專用分支。

`ctx.executionMode` 在一般回合為 `"agent"`，在暫時性 `/btw` 呼叫時為
`"side-question"`。當 CLI 需要不同的一次性旗標時使用它，
例如為 BTW 停用原生工具、工作階段持久化或恢復行為。如果
後端通常有 `nativeToolMode: "always-on"`，但其旁支問題 argv
可靠地停用這些工具，也請設定 `sideQuestionToolMode: "disabled"`；
否則當 BTW 需要無工具的 CLI 執行時，OpenClaw 會故障關閉。

### `ownsNativeCompaction`：選擇退出 OpenClaw 壓縮

如果你的後端執行的代理會壓縮其**自己的**逐字稿，請設定
`ownsNativeCompaction: true`，使 OpenClaw 的防護摘要器永遠不會對其
工作階段執行 - CLI 壓縮生命週期會回傳無操作，回合會繼續。`claude-cli`
會宣告它，因為 Claude Code 會在內部壓縮，且沒有工具架構端點。像 Codex 這類原生工具架構
工作階段則會繼續路由到其工具架構壓縮端點。

**只有在以下全部成立時才宣告它**，否則已延後且超出預算的工作階段可能會
持續超出預算 / 變得過期（OpenClaw 不再救援它）：

- 後端在接近其視窗時，會可靠地壓縮或限制自己的逐字稿；
- 它會持久化可恢復的工作階段，讓壓縮後的狀態在回合之間保留
  （例如 `--resume` / `--session-id`）；
- 它不是原生工具架構壓縮工作階段 - 相符的 `agentHarnessId` 工作階段
  會改路由到工具架構端點。

## MCP 工具橋接

CLI 後端預設不會收到 OpenClaw 工具。如果 CLI 可以使用
MCP 設定，請明確選擇加入：

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

支援的橋接模式如下：

| 模式                     | 用途                                      |
| ------------------------ | ----------------------------------------- |
| `claude-config-file`     | 接受 MCP 設定檔的 CLI                     |
| `codex-config-overrides` | 接受 argv 設定覆寫的 CLI                  |
| `gemini-system-settings` | 從其系統設定目錄讀取 MCP 設定的 CLI       |

只有在 CLI 確實可以使用橋接時才啟用它。如果 CLI 有自己
無法停用的內建工具層，請設定 `nativeToolMode:
"always-on"`，讓 OpenClaw 可在呼叫端要求沒有原生工具時故障關閉。

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

記錄使用者可能需要的最小覆寫。通常只有當二進位檔不在 `PATH` 中時，才需要
`command`。

## 驗證

對於內建外掛，請針對建構器與設定註冊加入聚焦測試，然後執行該外掛的目標測試通道：

```bash
pnpm test extensions/acme-cli
```

對於本機或已安裝外掛，請驗證探索流程與一次真實模型執行：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

如果後端支援圖片或 MCP，請加入一個使用真實命令列介面證明這些路徑的即時冒煙測試。不要依賴靜態檢查來驗證提示、圖片、MCP 或工作階段恢復行為。

## 檢查清單

<Check>`package.json` 具有 `openclaw.extensions`，且已為發布套件建置執行階段進入點</Check>
<Check>`openclaw.plugin.json` 宣告 `cliBackends` 與有意設定的 `activation.onStartup`</Check>
<Check>當設定/模型探索應在冷啟動時看見後端時，`setup.cliBackends` 必須存在</Check>
<Check>`api.registerCliBackend(...)` 使用與資訊清單相同的後端 ID</Check>
<Check>`agents.defaults.cliBackends.<id>` 下的使用者覆寫仍會優先</Check>
<Check>工作階段、系統提示、圖片與輸出解析器設定符合真實命令列介面合約</Check>
<Check>目標測試與至少一個即時命令列介面冒煙測試證明後端路徑</Check>

## 相關

- [命令列介面後端](/zh-TW/gateway/cli-backends) - 使用者設定與執行階段行為
- [建置外掛](/zh-TW/plugins/building-plugins) - 套件與資訊清單基礎
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview) - 註冊 API 參考
- [外掛資訊清單](/zh-TW/plugins/manifest) - `cliBackends` 與設定描述元
- [代理程式工具框架](/zh-TW/plugins/sdk-agent-harness) - 完整外部代理程式執行階段
