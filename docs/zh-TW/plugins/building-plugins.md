---
read_when:
    - 您想要建立新的 OpenClaw Plugin
    - 你需要一份 Plugin 開發快速入門
    - 你正在為 OpenClaw 新增通道、提供者、工具或其他功能
sidebarTitle: Getting Started
summary: 數分鐘內建立你的第一個 OpenClaw Plugin
title: 開發 Plugin
x-i18n:
    generated_at: "2026-05-06T09:15:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin 會以新功能擴充 OpenClaw：通道、模型供應商、
語音、即時轉錄、即時語音、媒體理解、影像
生成、影片生成、網頁擷取、網頁搜尋、代理工具，或任何
組合。

你不需要將 Plugin 加入 OpenClaw 儲存庫。發布到
[ClawHub](/zh-TW/tools/clawhub)，使用者即可透過
`openclaw plugins install clawhub:<package-name>` 安裝。在啟動切換期間，裸套件規格仍會
從 npm 安裝。

## 先決條件

- Node >= 22 和套件管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 對於儲存庫內 Plugin：已複製儲存庫並完成 `pnpm install`。原始碼
  checkout Plugin 開發僅支援 pnpm，因為 OpenClaw 會從 `extensions/*` 工作區套件載入隨附
  Plugin。

## 哪一種 Plugin？

<CardGroup cols={3}>
  <Card title="通道 Plugin" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    將 OpenClaw 連接到訊息平台（Discord、IRC 等）
  </Card>
  <Card title="供應商 Plugin" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    新增模型供應商（LLM、代理或自訂端點）
  </Card>
  <Card title="工具 / 鉤子 Plugin" icon="wrench" href="/zh-TW/plugins/hooks">
    註冊代理工具、事件鉤子或服務 - 繼續閱讀下方內容
  </Card>
</CardGroup>

若通道 Plugin 無法保證在 onboarding/setup 執行時已安裝，請使用
`openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface(...)`。它會產生一組 setup adapter + wizard，
用來公告安裝需求，並在 Plugin 安裝前，對真實設定寫入採取失敗關閉。

## 快速開始：工具 Plugin

本逐步說明會建立一個最小 Plugin，用來註冊代理工具。通道
與供應商 Plugin 有上方連結的專屬指南。

<Steps>
  <Step title="建立套件和 manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
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
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    每個 Plugin 都需要 manifest，即使沒有設定也一樣。執行階段註冊的工具
    必須列在 `contracts.tools` 中，讓 OpenClaw 能在不載入每個 Plugin 執行階段的情況下探索擁有者
    Plugin。Plugin 也應明確宣告
    `activation.onStartup`。此範例將其設為 `true`。完整結構請參閱
    [Manifest](/zh-TW/plugins/manifest)。標準 ClawHub
    發布片段位於 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="撰寫進入點">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` 用於非通道 Plugin。對於通道，請使用
    `defineChannelPluginEntry` - 請參閱[通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)。
    完整進入點選項請參閱[進入點](/zh-TW/plugins/sdk-entrypoints)。

  </Step>

  <Step title="測試和發布">

    **外部 Plugin：** 使用 ClawHub 驗證並發布，然後安裝：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    在啟動切換期間，像 `@myorg/openclaw-my-plugin` 這樣的裸套件規格會從 npm 安裝。
    想使用 ClawHub 解析時，請使用 `clawhub:`。

    **儲存庫內 Plugin：** 放在隨附 Plugin 工作區樹下 - 會自動探索。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 功能

單一 Plugin 可以透過 `api` 物件註冊任意數量的功能：

| 功能                   | 註冊方法                                         | 詳細指南                                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 文字推論（LLM）        | `api.registerProvider(...)`                      | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins)                                  |
| CLI 推論後端           | `api.registerCliBackend(...)`                    | [CLI 後端](/zh-TW/gateway/cli-backends)                                               |
| 通道 / 訊息傳遞        | `api.registerChannel(...)`                       | [通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)                                     |
| 語音（TTS/STT）        | `api.registerSpeechProvider(...)`                | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 影像生成               | `api.registerImageGenerationProvider(...)`       | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 工具結果 middleware    | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概覽](/zh-TW/plugins/sdk-overview#registration-api)                              |
| 代理工具               | `api.registerTool(...)`                          | 下方                                                                            |
| 自訂命令               | `api.registerCommand(...)`                       | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| Plugin 鉤子            | `api.on(...)`                                    | [Plugin 鉤子](/zh-TW/plugins/hooks)                                                   |
| 內部事件鉤子           | `api.registerHook(...)`                          | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| HTTP 路由              | `api.registerHttpRoute(...)`                     | [內部機制](/zh-TW/plugins/architecture-internals#gateway-http-routes)                 |
| CLI 子命令             | `api.registerCli(...)`                           | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |

完整註冊 API 請參閱 [SDK 概覽](/zh-TW/plugins/sdk-overview#registration-api)。

隨附 Plugin 可以在需要於模型看到輸出前，以非同步方式改寫工具結果時，
使用 `api.registerAgentToolResultMiddleware(...)`。在 `contracts.agentToolResultMiddleware` 中宣告
目標執行階段，例如
`["pi", "codex"]`。這是受信任的隨附 Plugin seam；外部
Plugin 應優先使用一般 OpenClaw Plugin 鉤子，除非 OpenClaw 為此功能擴充了
明確的信任政策。

如果你的 Plugin 註冊自訂 Gateway RPC 方法，請將它們保留在
Plugin 專屬前綴上。核心管理命名空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）保持保留，並且一律解析為
`operator.admin`，即使 Plugin 要求較窄的範圍也一樣。

需要記住的鉤子守衛語意：

- `before_tool_call`：`{ block: true }` 是終止性的，並會停止較低優先順序的處理器。
- `before_tool_call`：`{ block: false }` 會被視為沒有決策。
- `before_tool_call`：`{ requireApproval: true }` 會暫停代理執行，並透過 exec approval overlay、Telegram 按鈕、Discord 互動，或任何通道上的 `/approve` 命令提示使用者核准。
- `before_install`：`{ block: true }` 是終止性的，並會停止較低優先順序的處理器。
- `before_install`：`{ block: false }` 會被視為沒有決策。
- `message_sending`：`{ cancel: true }` 是終止性的，並會停止較低優先順序的處理器。
- `message_sending`：`{ cancel: false }` 會被視為沒有決策。
- `message_received`：需要入站 thread/topic 路由時，請優先使用具型別的 `threadId` 欄位。保留 `metadata` 供通道專屬額外資料使用。
- `message_sending`：優先使用具型別的 `replyToId` / `threadId` 路由欄位，而不是通道專屬 metadata keys。

`/approve` 命令會透過有界 fallback 同時處理 exec 和 Plugin 核准：找不到 exec approval id 時，OpenClaw 會透過 Plugin 核准重試相同 id。Plugin 核准轉送可透過設定中的 `approvals.plugin` 獨立設定。

如果自訂核准管線需要偵測同一個有界 fallback 情況，
請優先使用 `openclaw/plugin-sdk/error-runtime` 中的 `isApprovalNotFoundError`，
而不是手動比對核准到期字串。

範例和鉤子參考請參閱 [Plugin 鉤子](/zh-TW/plugins/hooks)。

## 註冊代理工具

工具是 LLM 可以呼叫的具型別函式。它們可以是必要（永遠
可用）或選用（使用者選擇加入）：

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

每個以 `api.registerTool(...)` 註冊的工具也必須在
Plugin manifest 中宣告：

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw 會擷取並快取來自已註冊工具的已驗證描述元，
因此 Plugin 不會在 manifest 中重複 `description` 或 schema 資料。manifest
合約只宣告擁有權與探索；執行仍會呼叫即時註冊的工具實作。
對於使用 `api.registerTool(..., { optional: true })` 註冊的工具，請設定
`toolMetadata.<tool>.optional: true`，讓 OpenClaw 可以避免載入該
Plugin 執行階段，直到工具被明確加入允許清單。

使用者在設定中啟用選用工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名稱不得與核心工具衝突（衝突會被略過）
- 註冊物件格式錯誤的工具，包括缺少 `parameters`，會被略過並回報在 Plugin 診斷中，而不是中斷 agent 執行
- 對於有副作用或額外二進位需求的工具，請使用 `optional: true`
- 使用者可以將 Plugin ID 加入 `tools.allow`，以啟用某個 Plugin 的所有工具

## 註冊 CLI 命令

Plugin 可以使用 `api.registerCli` 新增根層級的 `openclaw` 命令群組。請為每個頂層命令根提供
`descriptors`，讓 OpenClaw 可以顯示並路由命令，而不必急切載入每個 Plugin 執行階段。

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

安裝後，驗證執行階段註冊並執行命令：

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## 匯入慣例

一律從聚焦的 `openclaw/plugin-sdk/<subpath>` 路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完整子路徑參考請參閱 [SDK 概覽](/zh-TW/plugins/sdk-overview)。

在你的 Plugin 內，請使用本機 barrel 檔案（`api.ts`、`runtime-api.ts`）進行內部匯入 - 絕不要透過其 SDK 路徑匯入你自己的 Plugin。

對於供應商 Plugin，除非介面確實通用，否則請將供應商專用 helper 保留在那些套件根層級 barrel 中。目前隨附的範例：

- Anthropic：Claude 串流 wrapper 與 `service_tier` / beta helper
- OpenAI：供應商 builder、預設模型 helper、即時供應商
- OpenRouter：供應商 builder 加上 onboarding/設定 helper

如果某個 helper 只在單一隨附供應商套件內有用，請將它保留在該套件根層級介面，而不是提升到 `openclaw/plugin-sdk/*`。

某些產生的 `openclaw/plugin-sdk/<bundled-id>` helper 介面仍存在，用於在有追蹤到擁有者使用情況時維護隨附 Plugin。請將這些視為保留介面，而不是新第三方 Plugin 的預設模式。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` metadata</Check>
<Check>**openclaw.plugin.json** manifest 存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入都使用聚焦的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而不是 SDK 自我匯入</Check>
<Check>測試通過（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通過（repo 內 Plugin）</Check>

## Beta 發行測試

1. 監看 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 發行標籤，並透過 `Watch` > `Releases` 訂閱。Beta 標籤看起來像 `v2026.3.N-beta.1`。你也可以開啟官方 OpenClaw X 帳號 [@openclaw](https://x.com/openclaw) 的通知，以接收發行公告。
2. Beta 標籤一出現，就用它測試你的 Plugin。穩定版前的窗口通常只有幾個小時。
3. 測試後，在 `plugin-forum` Discord 頻道中你的 Plugin thread 發文，內容為 `all good` 或說明壞掉的項目。如果你還沒有 thread，請建立一個。
4. 如果有東西壞掉，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的 issue，並套用 `beta-blocker` label。將 issue 連結放入你的 thread。
5. 對 `main` 開啟標題為 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，並在 PR 與你的 Discord thread 中連結該 issue。貢獻者無法替 PR 加 label，因此標題是給維護者與自動化的 PR 端訊號。有 PR 的 blocker 會被合併；沒有 PR 的 blocker 可能仍會照常出貨。維護者會在 Beta 測試期間監看這些 thread。
6. 沒有回報代表通過。如果你錯過窗口，你的修正很可能會落在下一個週期。

## 下一步

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息 Channel Plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型供應商 Plugin
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    匯入對應與註冊 API 參考
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    TTS、搜尋、透過 api.runtime 使用 subagent
  </Card>
  <Card title="Testing" icon="test-tubes" href="/zh-TW/plugins/sdk-testing">
    測試工具與模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-TW/plugins/manifest">
    完整 manifest schema 參考
  </Card>
</CardGroup>

## 相關

- [Plugin Architecture](/zh-TW/plugins/architecture) - 內部架構深入說明
- [SDK Overview](/zh-TW/plugins/sdk-overview) - Plugin SDK 參考
- [Manifest](/zh-TW/plugins/manifest) - Plugin manifest 格式
- [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins) - 建置 Channel Plugin
- [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins) - 建置供應商 Plugin
