---
read_when:
    - 你想要建立新的 OpenClaw Plugin
    - 您需要 Plugin 開發的快速入門指南
    - 你正在為 OpenClaw 新增頻道、提供者、工具或其他功能
sidebarTitle: Getting Started
summary: 在幾分鐘內建立你的第一個 OpenClaw Plugin
title: 建置 Plugin
x-i18n:
    generated_at: "2026-05-04T02:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin 透過新增能力來擴充 OpenClaw：通道、模型提供者、
語音、即時轉錄、即時語音、媒體理解、影像
生成、影片生成、網頁擷取、網頁搜尋、代理工具，或任何
組合。

你不需要將你的 Plugin 加入 OpenClaw 儲存庫。發布到
[ClawHub](/zh-TW/tools/clawhub)，使用者可透過
`openclaw plugins install clawhub:<package-name>` 安裝。純套件規格在
啟動切換期間仍會從 npm 安裝。

## 先決條件

- Node >= 22 與套件管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 對於儲存庫內 Plugin：已複製儲存庫並完成 `pnpm install`。原始碼
  checkout Plugin 開發僅支援 pnpm，因為 OpenClaw 會從 `extensions/*` workspace 套件載入
  內建 Plugin。

## 哪種 Plugin？

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    將 OpenClaw 連接到訊息平台（Discord、IRC 等）
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    新增模型提供者（LLM、代理或自訂端點）
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/zh-TW/plugins/hooks">
    註冊代理工具、事件掛鉤或服務 — 繼續閱讀下方內容
  </Card>
</CardGroup>

對於在 onboarding/setup 執行時不保證已安裝的通道 Plugin，請使用
`openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface(...)`。
它會產生一組 setup adapter + wizard pair，用來宣告安裝需求，並在 Plugin 安裝之前
對實際設定寫入採取封閉式失敗。

## 快速開始：工具 Plugin

本逐步指南會建立一個最小 Plugin，用來註冊代理工具。通道
與提供者 Plugin 有上方連結的專屬指南。

<Steps>
  <Step title="建立套件與 manifest">
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
    必須列在 `contracts.tools` 中，讓 OpenClaw 不必載入每個 Plugin runtime 也能探索擁有它的
    Plugin。Plugin 也應有意識地宣告
    `activation.onStartup`。此範例將其設為 `true`。完整 schema 請參閱
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
    `defineChannelPluginEntry` — 請參閱 [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins)。
    完整的進入點選項請參閱 [Entry Points](/zh-TW/plugins/sdk-entrypoints)。

  </Step>

  <Step title="測試並發布">

    **外部 Plugin：** 使用 ClawHub 驗證並發布，然後安裝：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    像 `@myorg/openclaw-my-plugin` 這樣的純套件規格會在
    啟動切換期間從 npm 安裝。需要 ClawHub 解析時請使用 `clawhub:`。

    **儲存庫內 Plugin：** 放在內建 Plugin workspace 樹下 — 會自動被探索。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 能力

單一 Plugin 可以透過 `api` 物件註冊任意數量的能力：

| 能力                   | 註冊方法                                         | 詳細指南                                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 文字推論（LLM）        | `api.registerProvider(...)`                      | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins)                               |
| CLI 推論後端           | `api.registerCliBackend(...)`                    | [CLI Backends](/zh-TW/gateway/cli-backends)                                           |
| 通道 / 訊息            | `api.registerChannel(...)`                       | [Channel Plugins](/zh-TW/plugins/sdk-channel-plugins)                                 |
| 語音（TTS/STT）        | `api.registerSpeechProvider(...)`                | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 影像生成               | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 工具結果 middleware    | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/zh-TW/plugins/sdk-overview#registration-api)                          |
| 代理工具               | `api.registerTool(...)`                          | 下方                                                                            |
| 自訂命令               | `api.registerCommand(...)`                       | [Entry Points](/zh-TW/plugins/sdk-entrypoints)                                        |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/zh-TW/plugins/hooks)                                                  |
| 內部事件掛鉤           | `api.registerHook(...)`                          | [Entry Points](/zh-TW/plugins/sdk-entrypoints)                                        |
| HTTP 路由              | `api.registerHttpRoute(...)`                     | [Internals](/zh-TW/plugins/architecture-internals#gateway-http-routes)                |
| CLI 子命令             | `api.registerCli(...)`                           | [Entry Points](/zh-TW/plugins/sdk-entrypoints)                                        |

完整註冊 API 請參閱 [SDK Overview](/zh-TW/plugins/sdk-overview#registration-api)。

內建 Plugin 在需要於模型看到輸出之前進行非同步工具結果重寫時，
可以使用 `api.registerAgentToolResultMiddleware(...)`。請在
`contracts.agentToolResultMiddleware` 中宣告目標 runtime，例如
`["pi", "codex"]`。這是一個受信任的內建 Plugin seam；外部
Plugin 應優先使用一般 OpenClaw Plugin hooks，除非 OpenClaw 為此能力新增
明確的信任政策。

如果你的 Plugin 註冊自訂 Gateway RPC 方法，請將它們放在
Plugin 專屬前綴下。核心管理命名空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）會保留，且永遠解析為
`operator.admin`，即使 Plugin 要求較窄的 scope 也一樣。

請記住以下 hook guard 語意：

- `before_tool_call`：`{ block: true }` 是終止結果，會停止較低優先序的 handler。
- `before_tool_call`：`{ block: false }` 會被視為沒有決策。
- `before_tool_call`：`{ requireApproval: true }` 會暫停代理執行，並透過 exec approval overlay、Telegram 按鈕、Discord 互動，或任何通道上的 `/approve` 命令提示使用者核准。
- `before_install`：`{ block: true }` 是終止結果，會停止較低優先序的 handler。
- `before_install`：`{ block: false }` 會被視為沒有決策。
- `message_sending`：`{ cancel: true }` 是終止結果，會停止較低優先序的 handler。
- `message_sending`：`{ cancel: false }` 會被視為沒有決策。
- `message_received`：需要傳入 thread/topic routing 時，請優先使用型別化的 `threadId` 欄位。將 `metadata` 保留給通道特定的額外資訊。
- `message_sending`：請優先使用型別化的 `replyToId` / `threadId` routing 欄位，而不是通道特定的 metadata key。

`/approve` 命令會以有界 fallback 處理 exec 與 Plugin approval：找不到 exec approval id 時，OpenClaw 會用相同 id 透過 Plugin approval 重試。Plugin approval forwarding 可以透過設定中的 `approvals.plugin` 獨立設定。

如果自訂 approval plumbing 需要偵測同一個有界 fallback 情況，
請優先使用 `openclaw/plugin-sdk/error-runtime` 的 `isApprovalNotFoundError`，
而不是手動比對 approval 到期字串。

範例與 hook reference 請參閱 [Plugin hooks](/zh-TW/plugins/hooks)。

## 註冊代理工具

工具是 LLM 可以呼叫的型別化函式。它們可以是必要（永遠
可用）或選用（使用者 opt-in）：

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

所有透過 `api.registerTool(...)` 註冊的工具，也必須在
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

OpenClaw 會擷取並快取已註冊工具中通過驗證的描述元，
因此 plugins 不需要在 manifest 中重複 `description` 或 schema 資料。這個
manifest 合約只宣告擁有權與探索；執行時仍會呼叫
即時註冊工具的實作。
對於使用 `api.registerTool(..., { optional: true })` 註冊的工具，請設定
`toolMetadata.<tool>.optional: true`，讓 OpenClaw 可以避免載入該
plugin runtime，直到此工具被明確加入允許清單。

使用者可在設定中啟用 optional tools：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名稱不得與 core tools 衝突（衝突項目會被略過）
- 含有格式錯誤註冊物件的工具，包括缺少 `parameters`，會被略過並在 plugin diagnostics 中回報，而不是中斷 agent 執行
- 對具有副作用或額外 binary 需求的工具使用 `optional: true`
- 使用者可以將 plugin id 加入 `tools.allow`，以啟用某個 plugin 的所有工具

## 註冊 CLI 指令

Plugins 可以使用 `api.registerCli` 新增 root `openclaw` command groups。請為
每個頂層命令 root 提供 `descriptors`，讓 OpenClaw 可以顯示並路由
該命令，而不必急切載入每個 plugin runtime。

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

安裝後，請驗證 runtime 註冊並執行指令：

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

完整的 subpath 參考請見 [SDK 概覽](/zh-TW/plugins/sdk-overview)。

在你的 plugin 中，請使用本機 barrel files（`api.ts`、`runtime-api.ts`）進行
內部匯入，不要透過 SDK 路徑匯入自己的 plugin。

對於 provider plugins，請將 provider-specific helpers 保留在那些 package-root
barrels 中，除非該 seam 確實是通用的。目前 bundled examples：

- Anthropic：Claude stream wrappers 與 `service_tier` / beta helpers
- OpenAI：provider builders、default-model helpers、realtime providers
- OpenRouter：provider builder 加上 onboarding/config helpers

如果某個 helper 只在單一 bundled provider package 內有用，請將它保留在該
package-root seam，而不是提升到 `openclaw/plugin-sdk/*`。

部分產生的 `openclaw/plugin-sdk/<bundled-id>` helper seams 仍存在，
用於有追蹤擁有者使用情境的 bundled-plugin 維護。請將這些視為
保留介面，而不是新 third-party plugins 的預設模式。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` metadata</Check>
<Check>**openclaw.plugin.json** manifest 存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入都使用聚焦的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而不是 SDK self-imports</Check>
<Check>測試通過（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通過（repo 內 plugins）</Check>

## Beta 版本測試

1. 追蹤 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub release tags，並透過 `Watch` > `Releases` 訂閱。Beta tags 形式像 `v2026.3.N-beta.1`。你也可以開啟官方 OpenClaw X 帳號 [@openclaw](https://x.com/openclaw) 的通知，以接收 release 公告。
2. Beta tag 一出現，請盡快用它測試你的 plugin。進入 stable 前的時間窗口通常只有幾個小時。
3. 測試後，在 `plugin-forum` Discord channel 中你的 plugin thread 發文，內容可為 `all good` 或說明哪裡壞了。如果你還沒有 thread，請建立一個。
4. 如果發生問題，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的 issue，並套用 `beta-blocker` label。將 issue link 放到你的 thread 中。
5. 開啟一個指向 `main` 的 PR，標題為 `fix(<plugin-id>): beta blocker - <summary>`，並在 PR 和你的 Discord thread 中連結該 issue。Contributors 無法為 PR 加 label，因此標題是給 maintainers 與 automation 的 PR 端訊號。有 PR 的 blockers 會被合併；沒有 PR 的 blockers 可能仍會照常發布。Maintainers 會在 beta testing 期間關注這些 threads。
6. 沉默表示綠燈。如果你錯過窗口，你的修正很可能會進入下一個 cycle。

## 下一步

<CardGroup cols={2}>
  <Card title="通道 Plugins" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建置 messaging channel plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建置 model provider plugin
  </Card>
  <Card title="SDK 概覽" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    Import map 與 registration API 參考
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、search、subagent
  </Card>
  <Card title="測試" icon="test-tubes" href="/zh-TW/plugins/sdk-testing">
    測試工具與模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-TW/plugins/manifest">
    完整 manifest schema 參考
  </Card>
</CardGroup>

## 相關

- [Plugin 架構](/zh-TW/plugins/architecture) — 內部架構深入解析
- [SDK 概覽](/zh-TW/plugins/sdk-overview) — Plugin SDK 參考
- [Manifest](/zh-TW/plugins/manifest) — plugin manifest 格式
- [通道 Plugins](/zh-TW/plugins/sdk-channel-plugins) — 建置 channel plugins
- [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins) — 建置 provider plugins
