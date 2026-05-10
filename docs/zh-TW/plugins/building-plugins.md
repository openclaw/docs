---
read_when:
    - 你想要建立新的 OpenClaw Plugin
    - 你需要一份 Plugin 開發快速入門
    - 你正在為 OpenClaw 新增新的通道、提供者、工具或其他功能
sidebarTitle: Getting Started
summary: 幾分鐘內建立你的第一個 OpenClaw Plugin
title: 建構 Plugin
x-i18n:
    generated_at: "2026-05-10T19:40:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 320ea03395cd702e62831e3b6bb3e44443b4a00701f3e6d35d7c9e556e3bb258
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin 以新功能擴充 OpenClaw：通道、模型提供者、
語音、即時轉錄、即時語音、媒體理解、圖片
生成、影片生成、網頁擷取、網頁搜尋、代理工具，或任何
組合。

你不需要把你的 Plugin 加到 OpenClaw 儲存庫。發布到
[ClawHub](/zh-TW/clawhub)，使用者即可透過
`openclaw plugins install clawhub:<package-name>` 安裝。裸套件規格在
啟動切換期間仍會從 npm 安裝。

## 先決條件

- Node >= 22 與套件管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 針對儲存庫內 Plugin：已複製儲存庫並完成 `pnpm install`。原始碼
  checkout Plugin 開發僅支援 pnpm，因為 OpenClaw 會從
  `extensions/*` 工作區套件載入內建
  Plugin。

## 哪一種 Plugin？

<CardGroup cols={3}>
  <Card title="通道 Plugin" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    將 OpenClaw 連接到訊息平台（Discord、IRC 等）
  </Card>
  <Card title="提供者 Plugin" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    加入模型提供者（LLM、Proxy 或自訂端點）
  </Card>
  <Card title="CLI 後端 Plugin" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    將本機 AI CLI 對應到 OpenClaw 的文字後援執行器
  </Card>
  <Card title="工具 / hook Plugin" icon="wrench" href="/zh-TW/plugins/hooks">
    註冊代理工具、事件 hook 或服務 - 請繼續閱讀
  </Card>
</CardGroup>

若通道 Plugin 無法保證在 onboarding/setup
執行時已安裝，請使用
`openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface(...)`。它會產生一組 setup 配接器 + 精靈，
宣告安裝需求，並在 Plugin 安裝前對實際設定寫入
採取封閉失敗。

## 快速開始：工具 Plugin

本教學會建立一個註冊代理工具的最小 Plugin。通道
與提供者 Plugin 有上方連結的專屬指南。

<Steps>
  <Step title="建立套件與資訊清單">
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

    每個 Plugin 都需要資訊清單，即使沒有設定也是如此。執行階段註冊的工具
    必須列在 `contracts.tools` 中，讓 OpenClaw 不必載入每個 Plugin
    執行階段也能找出擁有它的
    Plugin。Plugin 也應明確宣告
    `activation.onStartup`。此範例將它設為 `true`。完整結構請參閱
    [資訊清單](/zh-TW/plugins/manifest)。標準 ClawHub
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

    `definePluginEntry` 用於非通道 Plugin。通道請使用
    `defineChannelPluginEntry` - 請參閱[通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)。
    完整進入點選項請參閱[進入點](/zh-TW/plugins/sdk-entrypoints)。

  </Step>

  <Step title="測試與發布">

    **外部 Plugin：** 使用 ClawHub 驗證並發布，然後安裝：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    像 `@myorg/openclaw-my-plugin` 這樣的裸套件規格會在
    啟動切換期間從 npm 安裝。需要 ClawHub 解析時，請使用 `clawhub:`。

    **儲存庫內 Plugin：** 放在內建 Plugin 工作區樹下 - 會自動探索。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 功能

單一 Plugin 可透過 `api` 物件註冊任意數量的功能：

| 功能                   | 註冊方法                                         | 詳細指南                                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 文字推論（LLM）        | `api.registerProvider(...)`                      | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins)                                  |
| CLI 推論後端           | `api.registerCliBackend(...)`                    | [CLI 後端 Plugin](/zh-TW/plugins/cli-backend-plugins)                                 |
| 通道 / 訊息            | `api.registerChannel(...)`                       | [通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)                                     |
| 語音（TTS/STT）        | `api.registerSpeechProvider(...)`                | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 圖片生成               | `api.registerImageGenerationProvider(...)`       | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 工具結果 middleware    | `api.registerAgentToolResultMiddleware(...)`     | [SDK 總覽](/zh-TW/plugins/sdk-overview#registration-api)                              |
| 代理工具               | `api.registerTool(...)`                          | 下方                                                                            |
| 自訂命令               | `api.registerCommand(...)`                       | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| Plugin hook            | `api.on(...)`                                    | [Plugin hook](/zh-TW/plugins/hooks)                                                   |
| 內部事件 hook          | `api.registerHook(...)`                          | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| HTTP 路由              | `api.registerHttpRoute(...)`                     | [內部架構](/zh-TW/plugins/architecture-internals#gateway-http-routes)                 |
| CLI 子命令             | `api.registerCli(...)`                           | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |

完整註冊 API 請參閱 [SDK 總覽](/zh-TW/plugins/sdk-overview#registration-api)。

內建 Plugin 在需要在模型看到輸出前非同步改寫工具結果時，
可以使用 `api.registerAgentToolResultMiddleware(...)`。請在
`contracts.agentToolResultMiddleware` 宣告目標執行階段，例如
`["pi", "codex"]`。這是受信任的內建 Plugin 介面；外部
Plugin 應優先使用一般 OpenClaw Plugin hook，除非 OpenClaw 之後為此功能
新增明確的信任政策。

如果你的 Plugin 註冊自訂 Gateway RPC 方法，請把它們放在
Plugin 專屬前綴下。核心管理命名空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）會保持保留，且一律解析為
`operator.admin`，即使 Plugin 要求較窄的範圍也是如此。

請記住以下 hook guard 語意：

- `before_tool_call`：`{ block: true }` 是終止性的，會停止較低優先序的處理器。
- `before_tool_call`：`{ block: false }` 會被視為沒有決策。
- `before_tool_call`：`{ requireApproval: true }` 會暫停代理執行，並透過 exec 核准覆蓋層、Telegram 按鈕、Discord 互動，或任何通道上的 `/approve` 命令提示使用者核准。
- `before_install`：`{ block: true }` 是終止性的，會停止較低優先序的處理器。
- `before_install`：`{ block: false }` 會被視為沒有決策。
- `message_sending`：`{ cancel: true }` 是終止性的，會停止較低優先序的處理器。
- `message_sending`：`{ cancel: false }` 會被視為沒有決策。
- `message_received`：需要傳入 thread/topic 路由時，請優先使用具型別的 `threadId` 欄位。將 `metadata` 保留給通道專屬的額外資訊。
- `message_sending`：請優先使用具型別的 `replyToId` / `threadId` 路由欄位，而不是通道專屬的 metadata key。

`/approve` 命令會以有界後援處理 exec 與 Plugin 核准：找不到 exec 核准 id 時，OpenClaw 會用同一個 id 重試 Plugin 核准。Plugin 核准轉送可透過設定中的 `approvals.plugin` 獨立配置。

如果自訂核准管線需要偵測同一種有界後援情況，
請優先使用 `openclaw/plugin-sdk/error-runtime` 的 `isApprovalNotFoundError`，
而不是手動比對核准過期字串。

範例與 hook 參考請參閱 [Plugin hook](/zh-TW/plugins/hooks)。

## 註冊代理工具

工具是 LLM 可以呼叫的具型別函式。它們可以是必需（永遠
可用）或選用（使用者 opt-in）：

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

工具工廠會收到由 runtime 提供的內容物件。當工具需要記錄、顯示或配合目前回合的作用中模型進行調整時，請使用
`ctx.activeModel`。該物件可以包含 `provider`、`modelId` 和
`modelRef`。請將它視為資訊性的 runtime 中繼資料，而不是防範本機操作者、已安裝 Plugin 程式碼或經修改
OpenClaw runtime 的安全邊界。對於敏感的本機工具，請保留明確的 Plugin 或操作者選擇加入機制，並在作用中模型中繼資料缺失或不合適時採取預設拒絕。

每個透過 `api.registerTool(...)` 註冊的工具，也必須在
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

OpenClaw 會擷取並快取已註冊工具中通過驗證的描述元，因此 Plugin 不需要在 manifest 中重複
`description` 或結構描述資料。manifest 合約只宣告擁有權與探索；執行時仍會呼叫即時註冊的工具實作。
對於使用 `api.registerTool(..., { optional: true })` 註冊的工具，請設定
`toolMetadata.<tool>.optional: true`，如此 OpenClaw 就能避免在工具被明確列入允許清單前載入該
Plugin runtime。

使用者可在設定中啟用選用工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名稱不得與核心工具衝突（衝突項目會被略過）
- 註冊物件格式錯誤的工具，包括缺少 `parameters`，會被略過並在 Plugin 診斷中回報，而不是中斷 agent 執行
- 對於有副作用或需要額外二進位檔的工具，請使用 `optional: true`
- 使用者可以將 Plugin ID 加入 `tools.allow`，以啟用該 Plugin 的所有工具

## 註冊 CLI 指令

Plugin 可以透過 `api.registerCli` 加入根層級 `openclaw` 指令群組。請為每個頂層指令根提供
`descriptors`，讓 OpenClaw 不需要急切載入每個 Plugin runtime，就能顯示並路由該指令。

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

安裝後，驗證 runtime 註冊並執行指令：

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

完整的子路徑參考請參閱 [SDK Overview](/zh-TW/plugins/sdk-overview)。

在你的 Plugin 內部，請使用本機 barrel 檔案（`api.ts`、`runtime-api.ts`）進行內部匯入，不要透過其 SDK 路徑匯入自己的 Plugin。

對於提供者 Plugin，請將提供者專屬 helper 保留在那些套件根層級的
barrel 中，除非該銜接點確實是通用的。目前內建範例包括：

- Anthropic：Claude stream 包裝器，以及 `service_tier` / beta helper
- OpenAI：提供者建構器、預設模型 helper、即時提供者
- OpenRouter：提供者建構器，以及 onboarding/設定 helper

如果某個 helper 只在單一內建提供者套件內有用，請將它保留在該套件根層級銜接點，而不是提升到
`openclaw/plugin-sdk/*`。

部分產生的 `openclaw/plugin-sdk/<bundled-id>` helper 銜接點仍然存在，用於具有已追蹤擁有者使用情況的內建 Plugin 維護。請將這些視為保留介面，而不是新的第三方 Plugin 的預設模式。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` 中繼資料</Check>
<Check>**openclaw.plugin.json** manifest 存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入都使用聚焦的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而不是 SDK 自我匯入</Check>
<Check>測試通過（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通過（repo 內 Plugin）</Check>

## Beta 版本測試

1. 監看 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub release tag，並透過 `Watch` > `Releases` 訂閱。Beta tag 看起來像 `v2026.3.N-beta.1`。你也可以為官方 OpenClaw X 帳號 [@openclaw](https://x.com/openclaw) 開啟通知，以接收 release 公告。
2. Beta tag 一出現，就立即針對該 beta tag 測試你的 Plugin。穩定版發布前的時間窗口通常只有幾個小時。
3. 測試後，在 `plugin-forum` Discord 頻道中你的 Plugin 討論串貼上 `all good` 或說明哪裡壞了。如果你還沒有討論串，請建立一個。
4. 如果有東西壞了，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的 issue，並套用 `beta-blocker` 標籤。將 issue 連結放在你的討論串中。
5. 對 `main` 開啟一個標題為 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，並在 PR 和你的 Discord 討論串中連結該 issue。貢獻者無法為 PR 加標籤，因此標題是提供給維護者與自動化的 PR 端訊號。有 PR 的 blocker 會被合併；沒有 PR 的 blocker 仍可能照常發布。維護者會在 beta 測試期間監看這些討論串。
6. 沒有聲音就代表綠燈。如果你錯過時間窗口，你的修正很可能會進入下一個週期。

## 下一步

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息 channel Plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型提供者 Plugin
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    註冊本機 AI CLI 後端
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    匯入對應與註冊 API 參考
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、搜尋、subagent
  </Card>
  <Card title="Testing" icon="test-tubes" href="/zh-TW/plugins/sdk-testing">
    測試工具與模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-TW/plugins/manifest">
    完整 manifest 結構描述參考
  </Card>
</CardGroup>

## 相關

- [Plugin Architecture](/zh-TW/plugins/architecture) - 內部架構深入解析
- [SDK Overview](/zh-TW/plugins/sdk-overview) - Plugin SDK 參考
- [Manifest](/zh-TW/plugins/manifest) - Plugin manifest 格式
- [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins) - 建置 channel Plugin
- [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins) - 建置提供者 Plugin
