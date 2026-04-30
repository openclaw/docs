---
read_when:
    - 您想要建立一個新的 OpenClaw Plugin
    - 你需要一份 Plugin 開發快速入門指南
    - 你正在為 OpenClaw 新增新的通道、提供者、工具或其他功能
sidebarTitle: Getting Started
summary: 在幾分鐘內建立你的第一個 OpenClaw Plugin
title: 建置 Plugin
x-i18n:
    generated_at: "2026-04-30T03:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins 會為 OpenClaw 擴充新能力：頻道、模型供應商、
語音、即時轉錄、即時語音、媒體理解、圖片
生成、影片生成、網頁擷取、網頁搜尋、代理工具，或任意
組合。

你不需要將你的 Plugin 加到 OpenClaw 儲存庫。發布到
[ClawHub](/zh-TW/tools/clawhub)，使用者即可透過
`openclaw plugins install <package-name>` 安裝。OpenClaw 會先嘗試 ClawHub，
並針對仍使用 npm 發布的套件自動退回使用 npm。

## 先決條件

- Node >= 22 和套件管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 針對儲存庫內 Plugin：已複製儲存庫並完成 `pnpm install`

## 哪一種 Plugin？

<CardGroup cols={3}>
  <Card title="頻道 Plugin" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    將 OpenClaw 連接到訊息平台（Discord、IRC 等）
  </Card>
  <Card title="供應商 Plugin" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    新增模型供應商（LLM、代理或自訂端點）
  </Card>
  <Card title="工具 / hook Plugin" icon="wrench" href="/zh-TW/plugins/hooks">
    註冊代理工具、事件 hook 或服務 — 請繼續往下閱讀
  </Card>
</CardGroup>

對於無法保證在 onboarding/setup 執行時已安裝的頻道 Plugin，
請使用來自 `openclaw/plugin-sdk/channel-setup` 的
`createOptionalChannelSetupSurface(...)`。它會產生一組設定配接器 + 精靈，
用來告知安裝需求，並在 Plugin 安裝前對實際設定寫入採取封閉式失敗。

## 快速開始：工具 Plugin

本逐步指南會建立一個最小 Plugin，用來註冊代理工具。頻道
和供應商 Plugin 有上方連結的專用指南。

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

    每個 Plugin 都需要 manifest，即使沒有設定也一樣，且每個 Plugin 都應該
    有意識地宣告 `activation.onStartup`。執行階段註冊的工具需要
    啟動時匯入，因此此範例將它設為 `true`。完整 schema 請見
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

    `definePluginEntry` 用於非頻道 Plugin。對於頻道，請使用
    `defineChannelPluginEntry` — 請參閱[頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins)。
    完整進入點選項請見[進入點](/zh-TW/plugins/sdk-entrypoints)。

  </Step>

  <Step title="測試並發布">

    **外部 Plugin：** 使用 ClawHub 驗證並發布，然後安裝：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw 也會針對像 `@myorg/openclaw-my-plugin` 這樣的裸套件規格
    先檢查 ClawHub 再檢查 npm；npm 仍是尚未遷移到 ClawHub 的套件
    的退回選項。

    **儲存庫內 Plugin：** 放在 bundled plugin 工作區樹下 — 會自動探索。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 能力

單一 Plugin 可以透過 `api` 物件註冊任意數量的能力：

| 能力                   | 註冊方法                                         | 詳細指南                                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 文字推論（LLM）        | `api.registerProvider(...)`                      | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins)                                  |
| CLI 推論後端           | `api.registerCliBackend(...)`                    | [CLI 後端](/zh-TW/gateway/cli-backends)                                               |
| 頻道 / 訊息            | `api.registerChannel(...)`                       | [頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins)                                     |
| 語音（TTS/STT）        | `api.registerSpeechProvider(...)`                | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 圖片生成               | `api.registerImageGenerationProvider(...)`       | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 工具結果 middleware    | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概覽](/zh-TW/plugins/sdk-overview#registration-api)                              |
| 代理工具               | `api.registerTool(...)`                          | 如下                                                                            |
| 自訂命令               | `api.registerCommand(...)`                       | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/zh-TW/plugins/hooks)                                                  |
| 內部事件 hook          | `api.registerHook(...)`                          | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| HTTP 路由              | `api.registerHttpRoute(...)`                     | [內部機制](/zh-TW/plugins/architecture-internals#gateway-http-routes)                 |
| CLI 子命令             | `api.registerCli(...)`                           | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |

完整註冊 API 請見 [SDK 概覽](/zh-TW/plugins/sdk-overview#registration-api)。

當 bundled plugin 需要在模型看到輸出前進行非同步工具結果重寫時，
可以使用 `api.registerAgentToolResultMiddleware(...)`。請在
`contracts.agentToolResultMiddleware` 中宣告目標執行階段，例如
`["pi", "codex"]`。這是一個受信任的 bundled plugin 接縫；外部
Plugin 應優先使用一般 OpenClaw Plugin hooks，除非 OpenClaw
為此能力新增明確的信任政策。

如果你的 Plugin 註冊自訂 gateway RPC 方法，請將它們放在
Plugin 專屬前綴下。核心管理命名空間（`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`）會保留，且一律解析為
`operator.admin`，即使 Plugin 要求較窄的範圍也是如此。

需要記住的 hook guard 語意：

- `before_tool_call`：`{ block: true }` 為終端決策，並停止較低優先順序的 handler。
- `before_tool_call`：`{ block: false }` 會被視為沒有決策。
- `before_tool_call`：`{ requireApproval: true }` 會暫停代理執行，並透過執行核准覆蓋層、Telegram 按鈕、Discord 互動，或任一頻道上的 `/approve` 命令提示使用者核准。
- `before_install`：`{ block: true }` 為終端決策，並停止較低優先順序的 handler。
- `before_install`：`{ block: false }` 會被視為沒有決策。
- `message_sending`：`{ cancel: true }` 為終端決策，並停止較低優先順序的 handler。
- `message_sending`：`{ cancel: false }` 會被視為沒有決策。
- `message_received`：當你需要傳入 thread/topic 路由時，優先使用型別化的 `threadId` 欄位。將 `metadata` 保留給頻道專屬的額外資訊。
- `message_sending`：優先使用型別化的 `replyToId` / `threadId` 路由欄位，而不是頻道專屬 metadata key。

`/approve` 命令會以有界退回方式處理執行核准和 Plugin 核准：當找不到執行核准 id 時，OpenClaw 會使用同一個 id 透過 Plugin 核准重試。Plugin 核准轉送可以透過設定中的 `approvals.plugin` 獨立設定。

如果自訂核准管線需要偵測同一個有界退回情況，
請優先使用來自 `openclaw/plugin-sdk/error-runtime` 的 `isApprovalNotFoundError`，
而不是手動比對核准到期字串。

範例與 hook 參考請見 [Plugin hooks](/zh-TW/plugins/hooks)。

## 註冊代理工具

工具是 LLM 可以呼叫的型別化函式。它們可以是必要（永遠
可用）或選用（使用者選擇啟用）：

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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

使用者可以在設定中啟用選用工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名稱不得與核心工具衝突（衝突會被略過）
- 註冊物件格式錯誤的工具，包括缺少 `parameters`，會被略過並在 Plugin diagnostics 中回報，而不是中斷代理執行
- 對於具有副作用或額外二進位需求的工具，請使用 `optional: true`
- 使用者可以將 Plugin id 加到 `tools.allow`，啟用該 Plugin 的所有工具

## 匯入慣例

一律從聚焦的 `openclaw/plugin-sdk/<subpath>` 路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

如需完整的子路徑參考，請參閱 [SDK 總覽](/zh-TW/plugins/sdk-overview)。

在你的 Plugin 中，請使用本機 barrel 檔案（`api.ts`、`runtime-api.ts`）進行
內部匯入，絕不要透過其 SDK 路徑匯入你自己的 Plugin。

對於提供者 Plugin，請將提供者專屬的輔助工具保留在這些套件根目錄
barrel 中，除非該銜接面確實是通用的。目前的內建範例：

- Anthropic：Claude 串流包裝器，以及 `service_tier` / beta 輔助工具
- OpenAI：提供者建構器、預設模型輔助工具、即時提供者
- OpenRouter：提供者建構器，以及 onboarding/config 輔助工具

如果某個輔助工具只在單一內建提供者套件內有用，請將它保留在該
套件根目錄銜接面，而不是提升到 `openclaw/plugin-sdk/*`。

某些產生的 `openclaw/plugin-sdk/<bundled-id>` 輔助銜接面仍然存在，用於
內建 Plugin 維護，前提是它們有追蹤到擁有者使用情況。請將這些視為
保留介面，而不是新第三方 Plugin 的預設模式。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` metadata</Check>
<Check>**openclaw.plugin.json** manifest 存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入都使用聚焦的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而不是 SDK 自我匯入</Check>
<Check>測試通過（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通過（repo 內 Plugin）</Check>

## Beta 版本測試

1. 監看 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub release tags，並透過 `Watch` > `Releases` 訂閱。Beta tags 看起來像 `v2026.3.N-beta.1`。你也可以開啟官方 OpenClaw X 帳號 [@openclaw](https://x.com/openclaw) 的通知，以接收 release 公告。
2. beta tag 一出現，就立即用它測試你的 Plugin。穩定版發布前的時間窗口通常只有幾個小時。
3. 測試後，在 `plugin-forum` Discord channel 中你的 Plugin thread 發文，內容可以是 `all good` 或說明壞掉的項目。如果你還沒有 thread，請建立一個。
4. 如果有東西壞掉，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的 issue，並套用 `beta-blocker` label。將 issue link 放到你的 thread 中。
5. 開一個指向 `main` 的 PR，標題為 `fix(<plugin-id>): beta blocker - <summary>`，並在 PR 和你的 Discord thread 中連結該 issue。貢獻者無法標記 PR，因此標題是給維護者與自動化的 PR 端訊號。有 PR 的 blocker 會被合併；沒有 PR 的 blocker 仍可能照常發布。維護者會在 beta 測試期間監看這些 thread。
6. 沉默代表綠燈。如果你錯過時間窗口，你的修正很可能會進入下一個週期。

## 後續步驟

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息通道 Plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型提供者 Plugin
  </Card>
  <Card title="SDK 總覽" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    Import map 與註冊 API 參考
  </Card>
  <Card title="執行階段輔助工具" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、搜尋、subagent
  </Card>
  <Card title="測試" icon="test-tubes" href="/zh-TW/plugins/sdk-testing">
    測試工具與模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-TW/plugins/manifest">
    完整 manifest schema 參考
  </Card>
</CardGroup>

## 相關內容

- [Plugin 架構](/zh-TW/plugins/architecture) — 內部架構深入探討
- [SDK 總覽](/zh-TW/plugins/sdk-overview) — Plugin SDK 參考
- [Manifest](/zh-TW/plugins/manifest) — Plugin manifest 格式
- [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins) — 建置通道 Plugin
- [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins) — 建置提供者 Plugin
