---
read_when:
    - 你想要建立一個新的 OpenClaw Plugin
    - 你需要一份 Plugin 開發快速入門
    - 你正在為 OpenClaw 新增新的通道、提供者、工具或其他能力
sidebarTitle: Getting Started
summary: 只需幾分鐘即可建立你的第一個 OpenClaw Plugin
title: 建立 Plugin
x-i18n:
    generated_at: "2026-05-02T02:54:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e05c82cd810ed400a293cf0c336efeb6e5a6e081b144eb89150407754a98bc19
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin 會用新功能擴充 OpenClaw：通道、模型提供者、語音、即時轉錄、即時語音、媒體理解、圖片生成、影片生成、網頁擷取、網頁搜尋、代理工具，或任意組合。

你不需要把你的 Plugin 加到 OpenClaw 儲存庫。發布到
[ClawHub](/zh-TW/tools/clawhub)，使用者即可用
`openclaw plugins install <package-name>` 安裝。OpenClaw 會先嘗試 ClawHub，並自動退回 npm，以支援仍使用 npm 發布的套件。

## 先決條件

- Node >= 22 和套件管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 對於儲存庫內 Plugin：已複製儲存庫並完成 `pnpm install`。原始碼
  checkout Plugin 開發僅支援 pnpm，因為 OpenClaw 會從 `extensions/*` 工作區套件載入內建
  Plugin。

## 哪一種 Plugin？

<CardGroup cols={3}>
  <Card title="通道 Plugin" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    將 OpenClaw 連接到訊息平台（Discord、IRC 等）
  </Card>
  <Card title="提供者 Plugin" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    新增模型提供者（LLM、代理或自訂端點）
  </Card>
  <Card title="工具 / hook Plugin" icon="wrench" href="/zh-TW/plugins/hooks">
    註冊代理工具、事件 hook 或服務 — 請繼續往下閱讀
  </Card>
</CardGroup>

若通道 Plugin 無法保證在 onboarding/setup 執行時已安裝，請使用
`openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface(...)`。
它會產生 setup adapter + wizard 配對，用來提示安裝需求，並在 Plugin 安裝前對實際設定寫入採取封閉失敗。

## 快速開始：工具 Plugin

本逐步說明會建立一個註冊代理工具的最小 Plugin。通道和提供者 Plugin 有上方連結的專屬指南。

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

    每個 Plugin 都需要 manifest，即使沒有設定也一樣；而且每個 Plugin 都應該有意識地宣告
    `activation.onStartup`。執行階段註冊的工具需要啟動時匯入，因此此範例將它設為
    `true`。完整 schema 請參閱
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

    `definePluginEntry` 用於非通道 Plugin。通道請使用
    `defineChannelPluginEntry` — 請參閱[通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)。
    完整進入點選項請參閱[進入點](/zh-TW/plugins/sdk-entrypoints)。

  </Step>

  <Step title="測試並發布">

    **外部 Plugin：** 使用 ClawHub 驗證並發布，然後安裝：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw 也會在 npm 之前檢查 ClawHub，以處理像
    `@myorg/openclaw-my-plugin` 這樣的裸套件規格；npm 仍會作為尚未遷移到 ClawHub 的套件備援。

    **儲存庫內 Plugin：** 放在內建 Plugin 工作區樹狀結構下 — 會自動被發現。

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
| CLI 推論後端           | `api.registerCliBackend(...)`                    | [CLI 後端](/zh-TW/gateway/cli-backends)                                               |
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
| 工具結果中介軟體       | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概觀](/zh-TW/plugins/sdk-overview#registration-api)                              |
| 代理工具               | `api.registerTool(...)`                          | 下方                                                                            |
| 自訂命令               | `api.registerCommand(...)`                       | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| Plugin hook            | `api.on(...)`                                    | [Plugin hook](/zh-TW/plugins/hooks)                                                   |
| 內部事件 hook          | `api.registerHook(...)`                          | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |
| HTTP 路由              | `api.registerHttpRoute(...)`                     | [內部機制](/zh-TW/plugins/architecture-internals#gateway-http-routes)                 |
| CLI 子命令             | `api.registerCli(...)`                           | [進入點](/zh-TW/plugins/sdk-entrypoints)                                              |

完整註冊 API 請參閱 [SDK 概觀](/zh-TW/plugins/sdk-overview#registration-api)。

內建 Plugin 在需要於模型看到輸出前進行非同步工具結果重寫時，可以使用
`api.registerAgentToolResultMiddleware(...)`。請在
`contracts.agentToolResultMiddleware` 中宣告目標 runtime，例如
`["pi", "codex"]`。這是受信任的內建 Plugin seam；外部
Plugin 應優先使用一般 OpenClaw Plugin hook，除非 OpenClaw 對此功能新增明確信任政策。

如果你的 Plugin 註冊自訂 Gateway RPC 方法，請將它們放在
Plugin 專屬前綴下。核心管理命名空間（`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`）會保持保留，且一律解析為
`operator.admin`，即使 Plugin 要求較窄的 scope 也一樣。

請留意以下 hook guard 語意：

- `before_tool_call`：`{ block: true }` 是終止性決策，會停止較低優先序的 handler。
- `before_tool_call`：`{ block: false }` 會被視為沒有決策。
- `before_tool_call`：`{ requireApproval: true }` 會暫停代理執行，並透過 exec approval overlay、Telegram 按鈕、Discord 互動，或任何通道上的 `/approve` 命令提示使用者核准。
- `before_install`：`{ block: true }` 是終止性決策，會停止較低優先序的 handler。
- `before_install`：`{ block: false }` 會被視為沒有決策。
- `message_sending`：`{ cancel: true }` 是終止性決策，會停止較低優先序的 handler。
- `message_sending`：`{ cancel: false }` 會被視為沒有決策。
- `message_received`：當你需要傳入 thread/topic 路由時，請優先使用具型別的 `threadId` 欄位。請將 `metadata` 保留給通道專屬額外資訊。
- `message_sending`：請優先使用具型別的 `replyToId` / `threadId` 路由欄位，而不是通道專屬 metadata key。

`/approve` 命令會以有界備援處理 exec 和 Plugin approval：找不到 exec approval id 時，OpenClaw 會用同一個 id 透過 Plugin approval 重試。Plugin approval forwarding 可透過設定中的 `approvals.plugin` 獨立設定。

如果自訂 approval plumbing 需要偵測同一個有界備援案例，
請優先使用 `openclaw/plugin-sdk/error-runtime` 的 `isApprovalNotFoundError`，
而不是手動比對 approval 過期字串。

範例與 hook 參考請參閱 [Plugin hook](/zh-TW/plugins/hooks)。

## 註冊代理工具

工具是 LLM 可以呼叫的具型別函式。它們可以是必需（永遠可用）或選用（使用者選擇啟用）：

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

使用者可在設定中啟用選用工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名稱不得與核心工具衝突（衝突會被略過）
- 註冊物件格式錯誤的工具（包括缺少 `parameters`）會被略過，並回報在 Plugin diagnostics 中，而不是中斷代理執行
- 對於有副作用或額外二進位需求的工具，請使用 `optional: true`
- 使用者可將 Plugin id 加到 `tools.allow`，以啟用該 Plugin 的所有工具

## 註冊 CLI 命令

Plugin 可以用 `api.registerCli` 新增根層級 `openclaw` 命令群組。請為每個頂層命令根提供
`descriptors`，讓 OpenClaw 不必急切載入每個 Plugin runtime，也能顯示並路由該命令。

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

安裝後，驗證 runtime 註冊並執行命令：

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

完整的子路徑參考請見 [SDK 概覽](/zh-TW/plugins/sdk-overview)。

在你的 Plugin 內，內部匯入請使用本機 barrel 檔案（`api.ts`、`runtime-api.ts`）——絕不要透過其 SDK 路徑匯入你自己的 Plugin。

對於提供者 Plugin，除非 seam 確實是通用的，否則請將提供者專屬 helper 保留在那些套件根目錄的 barrel 中。目前的內建範例：

- Anthropic：Claude stream wrapper 與 `service_tier` / beta helper
- OpenAI：提供者 builder、預設模型 helper、realtime provider
- OpenRouter：提供者 builder 加上 onboarding/config helper

如果某個 helper 只在一個內建提供者套件內有用，請將它保留在該套件根目錄 seam 上，而不要提升到 `openclaw/plugin-sdk/*`。

部分產生的 `openclaw/plugin-sdk/<bundled-id>` helper seam 仍然存在，用於有追蹤擁有者用法的內建 Plugin 維護。請將這些視為保留介面，而不是新第三方 Plugin 的預設模式。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` 中繼資料</Check>
<Check>**openclaw.plugin.json** manifest 存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入都使用聚焦的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而不是 SDK 自我匯入</Check>
<Check>測試通過（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通過（repo 內 Plugin）</Check>

## Beta 發行測試

1. 留意 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 發行標籤，並透過 `Watch` > `Releases` 訂閱。Beta 標籤看起來像 `v2026.3.N-beta.1`。你也可以開啟官方 OpenClaw X 帳號 [@openclaw](https://x.com/openclaw) 的通知，以接收發行公告。
2. Beta 標籤一出現，就立即用它測試你的 Plugin。穩定版前的時間窗口通常只有幾個小時。
3. 測試後，在 `plugin-forum` Discord 頻道中你的 Plugin thread 裡發文，內容為 `all good` 或說明壞掉的部分。如果你還沒有 thread，請建立一個。
4. 如果有東西壞掉，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的 issue，並套用 `beta-blocker` label。把 issue 連結放進你的 thread。
5. 開一個目標為 `main`、標題為 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，並在 PR 和你的 Discord thread 中都連結該 issue。貢獻者無法為 PR 加上 label，因此標題是給維護者和自動化使用的 PR 端訊號。有 PR 的 blocker 會被合併；沒有 PR 的 blocker 仍可能照常出貨。維護者會在 beta 測試期間關注這些 thread。
6. 沉默代表綠燈。如果你錯過窗口，你的修復很可能會在下一個週期落地。

## 後續步驟

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息通道 Plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型提供者 Plugin
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    匯入映射與註冊 API 參考
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、搜尋、subagent
  </Card>
  <Card title="Testing" icon="test-tubes" href="/zh-TW/plugins/sdk-testing">
    測試工具與模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-TW/plugins/manifest">
    完整 manifest schema 參考
  </Card>
</CardGroup>

## 相關

- [Plugin 架構](/zh-TW/plugins/architecture) — 內部架構深度解析
- [SDK 概覽](/zh-TW/plugins/sdk-overview) — Plugin SDK 參考
- [Manifest](/zh-TW/plugins/manifest) — Plugin manifest 格式
- [通道 Plugin](/zh-TW/plugins/sdk-channel-plugins) — 建置通道 Plugin
- [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins) — 建置提供者 Plugin
