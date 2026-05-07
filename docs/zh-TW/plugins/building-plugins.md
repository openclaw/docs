---
read_when:
    - 您想建立新的 OpenClaw Plugin
    - 你需要一份 Plugin 開發快速入門
    - 你正在為 OpenClaw 新增通道、提供者、工具或其他功能
sidebarTitle: Getting Started
summary: 在幾分鐘內建立你的第一個 OpenClaw Plugin
title: 建置 Plugin
x-i18n:
    generated_at: "2026-05-07T13:22:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins 透過新功能擴充 OpenClaw：通道、模型提供者、
語音、即時轉錄、即時語音、媒體理解、影像
生成、影片生成、網頁擷取、網頁搜尋、代理工具，或任何
組合。

你不需要將你的 Plugin 加入 OpenClaw 儲存庫。發布到
[ClawHub](/zh-TW/tools/clawhub)，使用者可透過
`openclaw plugins install clawhub:<package-name>` 安裝。在啟動轉換期間，裸套件規格仍會
從 npm 安裝。

## 先決條件

- Node >= 22 和套件管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 對於儲存庫內 Plugin：已複製儲存庫並完成 `pnpm install`。原始碼
  checkout 的 Plugin 開發僅支援 pnpm，因為 OpenClaw 會從 `extensions/*` 工作區套件載入 bundled
  plugins。

## 哪一種 Plugin？

<CardGroup cols={3}>
  <Card title="通道 Plugin" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    將 OpenClaw 連接到訊息平台（Discord、IRC 等）
  </Card>
  <Card title="提供者 Plugin" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    新增模型提供者（LLM、代理，或自訂端點）
  </Card>
  <Card title="CLI 後端 Plugin" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    將本機 AI CLI 對應到 OpenClaw 的文字備援執行器
  </Card>
  <Card title="工具 / hook Plugin" icon="wrench" href="/zh-TW/plugins/hooks">
    註冊代理工具、事件 hook，或服務 - 請繼續閱讀下文
  </Card>
</CardGroup>

若是通道 Plugin，且 onboarding/setup 執行時不保證已安裝，
請使用 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface(...)`。
它會產生 setup 轉接器 + 精靈組合，用來提示安裝需求，並在 Plugin 安裝前
對實際設定寫入採取失敗關閉。

## 快速開始：工具 Plugin

本教學會建立一個註冊代理工具的最小 Plugin。通道
和提供者 Plugin 有上方連結的專用指南。

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
    必須列在 `contracts.tools` 中，讓 OpenClaw 不必載入每個 Plugin runtime 就能探索擁有它的
    Plugin。Plugins 也應該有意識地宣告
    `activation.onStartup`。此範例將它設為 `true`。完整 schema 請參閱
    [Manifest](/zh-TW/plugins/manifest)。標準的 ClawHub
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
    `defineChannelPluginEntry` - 請參閱 [通道 Plugins](/zh-TW/plugins/sdk-channel-plugins)。
    完整進入點選項請參閱 [進入點](/zh-TW/plugins/sdk-entrypoints)。

  </Step>

  <Step title="測試並發布">

    **外部 Plugins：**使用 ClawHub 驗證並發布，然後安裝：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    在啟動轉換期間，像 `@myorg/openclaw-my-plugin` 這類裸套件規格會從 npm 安裝。
    當你想使用 ClawHub 解析時，請使用 `clawhub:`。

    **儲存庫內 Plugins：**放在 bundled Plugin 工作區樹下 - 會自動探索。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 功能

單一 Plugin 可以透過 `api` 物件註冊任意數量的功能：

| 功能                   | 註冊方法                                         | 詳細指南                                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 文字推論（LLM）        | `api.registerProvider(...)`                      | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins)                                 |
| CLI 推論後端           | `api.registerCliBackend(...)`                    | [CLI 後端 Plugins](/zh-TW/plugins/cli-backend-plugins)                                |
| 通道 / 訊息            | `api.registerChannel(...)`                       | [通道 Plugins](/zh-TW/plugins/sdk-channel-plugins)                                    |
| 語音（TTS/STT）        | `api.registerSpeechProvider(...)`                | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| 影像生成               | `api.registerImageGenerationProvider(...)`       | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| 工具結果 middleware    | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概覽](/zh-TW/plugins/sdk-overview#registration-api)                              |
| 代理工具               | `api.registerTool(...)`                          | 下方                                                                            |
| 自訂命令               | `api.registerCommand(...)`                       | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/zh-TW/plugins/hooks)                                                  |
| 內部事件 hooks         | `api.registerHook(...)`                          | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| HTTP 路由              | `api.registerHttpRoute(...)`                     | [內部機制](/zh-TW/plugins/architecture-internals#gateway-http-routes)                 |
| CLI 子命令             | `api.registerCli(...)`                           | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |

完整註冊 API 請參閱 [SDK 概覽](/zh-TW/plugins/sdk-overview#registration-api)。

Bundled plugins 可以在需要於模型看到輸出前
非同步改寫工具結果時使用 `api.registerAgentToolResultMiddleware(...)`。請在
`contracts.agentToolResultMiddleware` 宣告目標 runtimes，例如
`["pi", "codex"]`。這是受信任的 bundled-plugin seam；外部
plugins 應優先使用一般 OpenClaw Plugin hooks，除非 OpenClaw 為此功能新增
明確的信任政策。

如果你的 Plugin 註冊自訂 gateway RPC 方法，請將它們放在
Plugin 專用前綴下。核心管理命名空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）保持保留，且一律解析為
`operator.admin`，即使 Plugin 要求較窄的 scope 也是如此。

需記住的 hook guard 語義：

- `before_tool_call`：`{ block: true }` 是終止決策，並會停止較低優先順序的 handlers。
- `before_tool_call`：`{ block: false }` 會被視為沒有決策。
- `before_tool_call`：`{ requireApproval: true }` 會暫停代理執行，並透過 exec approval overlay、Telegram 按鈕、Discord 互動，或任何通道上的 `/approve` 命令提示使用者核准。
- `before_install`：`{ block: true }` 是終止決策，並會停止較低優先順序的 handlers。
- `before_install`：`{ block: false }` 會被視為沒有決策。
- `message_sending`：`{ cancel: true }` 是終止決策，並會停止較低優先順序的 handlers。
- `message_sending`：`{ cancel: false }` 會被視為沒有決策。
- `message_received`：需要入站 thread/topic 路由時，優先使用具型別的 `threadId` 欄位。將 `metadata` 保留給通道專用額外資料。
- `message_sending`：優先使用具型別的 `replyToId` / `threadId` 路由欄位，而不是通道專用 metadata keys。

`/approve` 命令會以有界備援處理 exec 和 Plugin 核准：當找不到 exec approval id 時，OpenClaw 會透過 Plugin approvals 以相同 id 重試。Plugin approval forwarding 可透過 config 中的 `approvals.plugin` 獨立設定。

如果自訂 approval plumbing 需要偵測相同的有界備援情況，
請優先使用 `openclaw/plugin-sdk/error-runtime` 的 `isApprovalNotFoundError`，
而不是手動比對 approval-expiry 字串。

範例與 hook 參考請參閱 [Plugin hooks](/zh-TW/plugins/hooks)。

## 註冊代理工具

工具是 LLM 可以呼叫的具型別函式。它們可以是必要（永遠
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

每個使用 `api.registerTool(...)` 註冊的工具，也必須在
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
因此 Plugin 不需要在資訊清單中重複 `description` 或結構描述資料。資訊清單合約
只宣告擁有權與探索；執行時仍會呼叫即時註冊的工具實作。
針對使用 `api.registerTool(..., { optional: true })` 註冊的工具，
設定 `toolMetadata.<tool>.optional: true`，讓 OpenClaw 可以避免載入該
Plugin 執行階段，直到工具被明確加入允許清單。

使用者可在設定中啟用選用工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名稱不得與核心工具衝突（衝突會被略過）
- 註冊物件格式錯誤的工具，包括缺少 `parameters`，會被略過並在 Plugin 診斷中回報，而不是中斷代理程式執行
- 對於具有副作用或額外二進位需求的工具，請使用 `optional: true`
- 使用者可以將 Plugin ID 加入 `tools.allow`，以啟用某個 Plugin 的所有工具

## 註冊 CLI 命令

Plugin 可以使用 `api.registerCli` 新增根層級 `openclaw` 命令群組。請為
每個頂層命令根提供 `descriptors`，讓 OpenClaw 可以顯示並路由
該命令，而不需要急切載入每個 Plugin 執行階段。

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

完整子路徑參考請見 [SDK 概覽](/zh-TW/plugins/sdk-overview)。

在你的 Plugin 內，請使用本機 barrel 檔案（`api.ts`、`runtime-api.ts`）進行
內部匯入，絕對不要透過其 SDK 路徑匯入你自己的 Plugin。

對於供應商 Plugin，請將供應商專屬輔助工具保留在這些套件根層級
barrel 中，除非該接縫確實是通用的。目前的內建範例：

- Anthropic：Claude 串流包裝器與 `service_tier` / beta 輔助工具
- OpenAI：供應商建構器、預設模型輔助工具、即時供應商
- OpenRouter：供應商建構器，以及上手/設定輔助工具

如果某個輔助工具只在一個內建供應商套件中有用，請將它保留在該
套件根層級接縫，而不是提升到 `openclaw/plugin-sdk/*`。

部分產生的 `openclaw/plugin-sdk/<bundled-id>` 輔助接縫仍然存在，
用於已有追蹤擁有者使用情境的內建 Plugin 維護。請將它們視為
保留介面，而不是新第三方 Plugin 的預設模式。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` 中繼資料</Check>
<Check>**openclaw.plugin.json** 資訊清單存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入都使用聚焦的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而不是 SDK 自我匯入</Check>
<Check>測試通過（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通過（儲存庫內 Plugin）</Check>

## Beta 版本測試

1. 留意 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 發行標籤，並透過 `Watch` > `Releases` 訂閱。Beta 標籤看起來像 `v2026.3.N-beta.1`。你也可以開啟官方 OpenClaw X 帳號 [@openclaw](https://x.com/openclaw) 的通知，以接收發行公告。
2. Beta 標籤一出現，就立即針對該標籤測試你的 Plugin。穩定版之前的時間窗口通常只有幾小時。
3. 測試後，在 `plugin-forum` Discord 頻道中你的 Plugin 討論串發文，內容可以是 `all good` 或說明哪裡壞了。如果你還沒有討論串，請建立一個。
4. 如果發生問題，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的議題，並套用 `beta-blocker` 標籤。將議題連結放到你的討論串中。
5. 開啟一個指向 `main` 的 PR，標題為 `fix(<plugin-id>): beta blocker - <summary>`，並在 PR 和你的 Discord 討論串中連結該議題。貢獻者無法標記 PR，因此標題是維護者與自動化在 PR 端的訊號。有 PR 的阻斷問題會被合併；沒有 PR 的阻斷問題仍可能照常發布。維護者會在 Beta 測試期間關注這些討論串。
6. 沉默表示綠燈。如果你錯過時間窗口，你的修正很可能會進入下一個週期。

## 後續步驟

<CardGroup cols={2}>
  <Card title="頻道 Plugin" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息頻道 Plugin
  </Card>
  <Card title="供應商 Plugin" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型供應商 Plugin
  </Card>
  <Card title="CLI 後端 Plugin" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    註冊本機 AI CLI 後端
  </Card>
  <Card title="SDK 概覽" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    匯入映射與註冊 API 參考
  </Card>
  <Card title="執行階段輔助工具" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、搜尋、子代理程式
  </Card>
  <Card title="測試" icon="test-tubes" href="/zh-TW/plugins/sdk-testing">
    測試工具與模式
  </Card>
  <Card title="Plugin 資訊清單" icon="file-json" href="/zh-TW/plugins/manifest">
    完整資訊清單結構描述參考
  </Card>
</CardGroup>

## 相關內容

- [Plugin 架構](/zh-TW/plugins/architecture) - 內部架構深入探討
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - Plugin SDK 參考
- [資訊清單](/zh-TW/plugins/manifest) - Plugin 資訊清單格式
- [頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins) - 建置頻道 Plugin
- [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins) - 建置供應商 Plugin
