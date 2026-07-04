---
doc-schema-version: 1
read_when:
    - 你想建立新的 OpenClaw 外掛
    - 你需要一份外掛開發快速入門
    - 你正在選擇頻道、提供者、命令列介面後端、工具或鉤子文件
sidebarTitle: Getting Started
summary: 在幾分鐘內建立你的第一個 OpenClaw 外掛
title: 建置外掛
x-i18n:
    generated_at: "2026-07-04T08:43:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

外掛可在不變更核心的情況下擴充 OpenClaw。外掛可以新增訊息
通道、模型提供者、本機命令列介面後端、代理工具、掛鉤、媒體提供者，
或另一項由外掛擁有的能力。

你不需要把外部外掛加入 OpenClaw 儲存庫。請將套件發布到 [ClawHub](/zh-TW/clawhub)，使用者可用以下指令安裝：

```bash
openclaw plugins install clawhub:<package-name>
```

裸套件規格在啟動切換期間仍會從 npm 安裝。當你想使用 ClawHub 解析時，請使用
`clawhub:` 前綴。

## 需求

- 使用 Node 22.19+、Node 23.11+ 或 Node 24+，以及 `npm` 或 `pnpm` 等套件管理器。
- 熟悉 TypeScript ESM 模組。
- 若要進行儲存庫內建外掛工作，請 clone 儲存庫並執行 `pnpm install`。
  原始碼 checkout 的外掛開發僅支援 pnpm，因為 OpenClaw 會從
  `extensions/*` workspace 套件載入內建外掛。

## 選擇外掛形態

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    將 OpenClaw 連接到訊息平台。
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    新增模型、媒體、搜尋、擷取、語音或即時提供者。
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    透過 OpenClaw 模型備援執行本機 AI 命令列介面。
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/zh-TW/plugins/tool-plugins">
    註冊代理工具。
  </Card>
</CardGroup>

## 快速開始

透過註冊一個必要代理工具來建置最小工具外掛。這是
最短且實用的外掛形態，並展示套件、manifest、進入點與
本機驗證。

<Steps>
  <Step title="Create package metadata">
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

    已發布的外部外掛應將 runtime 進入點指向已建置的 JavaScript
    檔案。完整進入點合約請參閱 [SDK 進入點](/zh-TW/plugins/sdk-entrypoints)。

    每個外掛都需要 manifest，即使它沒有設定也一樣。Runtime 工具
    必須出現在 `contracts.tools` 中，讓 OpenClaw 可以在不急切載入
    每個外掛 runtime 的情況下探索擁有權。請有意識地設定
    `activation.onStartup`。此範例會在閘道啟動時啟動。

    主機信任的外掛介面也受 manifest 控制，且已安裝外掛需要明確
    啟用。如果已安裝外掛註冊
    `api.registerAgentToolResultMiddleware(...)`，請在
    `contracts.agentToolResultMiddleware` 中宣告每個目標 runtime。如果它註冊
    `api.registerTrustedToolPolicy(...)`，請在
    `contracts.trustedToolPolicies` 中宣告每個 policy id。這些宣告能讓安裝時
    檢查與 runtime 註冊保持一致。

    如需每個 manifest 欄位，請參閱 [外掛 manifest](/zh-TW/plugins/manifest)。

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    非通道外掛請使用 `definePluginEntry`。通道外掛使用
    `defineChannelPluginEntry`。

  </Step>

  <Step title="Test the runtime">
    對於已安裝或外部外掛，請檢查已載入的 runtime：

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    如果外掛註冊了命令列介面指令，也請執行該指令。例如，
    demo 指令應具備執行驗證，例如
    `openclaw demo-plugin ping`。

    對於此儲存庫中的內建外掛，OpenClaw 會從 `extensions/*` workspace 探索
    原始碼 checkout 的外掛套件。執行最接近的目標測試：

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    發布前請驗證套件：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    標準 ClawHub 片段位於 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="Install">
    透過 ClawHub 安裝已發布的套件：

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 註冊工具

工具可以是必要或選用。當外掛啟用時，必要工具一律可用。
選用工具需要使用者選擇啟用。

```typescript
register(api) {
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
外掛 manifest 中宣告：

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

使用者可透過 `tools.allow` 選擇啟用：

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

選用工具控制工具是否暴露給模型。當工具或掛鉤應在模型選取後、動作執行前
要求核准時，請使用
[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)。

請將選用工具用於副作用、少見的二進位檔，或不應預設暴露的能力。
工具名稱不得與核心工具衝突；衝突會被略過並在外掛診斷中回報。
格式錯誤的註冊，包括沒有 `parameters` 的工具描述子，也會以相同方式
略過並回報。已註冊的工具是型別化函式，模型可在 policy 與 allowlist
檢查通過後呼叫。

工具 factory 會收到 runtime 提供的 context 物件。當工具需要記錄、顯示，
或針對目前回合的使用中模型調整時，請使用 `ctx.activeModel`。
該物件可以包含 `provider`、`modelId` 與 `modelRef`。請將它視為
資訊性的 runtime metadata，而不是防範本機操作者、已安裝外掛程式碼，
或修改過的 OpenClaw runtime 的安全邊界。敏感的本機工具仍應要求明確的
外掛或操作者選擇啟用，並在 active-model metadata 缺失或不適合時
失敗關閉。

Manifest 會宣告擁有權與探索；執行仍會呼叫即時
註冊的工具實作。請讓 `toolMetadata.<tool>.optional: true`
與 `api.registerTool(..., { optional: true })` 保持一致，讓 OpenClaw 可以避免
在工具被明確 allowlist 之前載入該外掛 runtime。

## 匯入慣例

從聚焦的 SDK 子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

不要從已棄用的根 barrel 匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

在你的外掛套件內，請使用本機 barrel 檔案，例如 `api.ts` 與
`runtime-api.ts` 進行內部匯入。不要透過 SDK 路徑匯入你自己的外掛。
提供者專用 helper 應留在提供者套件中，除非該銜接點確實是通用的。

自訂閘道 RPC 方法是進階進入點。請將它們保留在
外掛專用前綴；核心管理 namespace，例如 `config.*`、
`exec.approvals.*`、`operator.admin.*`、`wizard.*` 與 `update.*` 會保留，
並解析到 `operator.admin`。
`openclaw/plugin-sdk/gateway-method-runtime` 橋接器保留給宣告
`contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP
路由使用。

完整匯入對照請參閱 [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` metadata</Check>
<Check>**openclaw.plugin.json** manifest 存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入都使用聚焦的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而不是 SDK 自我匯入</Check>
<Check>測試通過 (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` 通過（儲存庫內外掛）</Check>

## 針對 beta 版本測試

1. 留意 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub release tag，並透過 `Watch` > `Releases` 訂閱。Beta tag 看起來像 `v2026.3.N-beta.1`。你也可以開啟官方 OpenClaw X 帳號 [@openclaw](https://x.com/openclaw) 的通知，以接收 release 公告。
2. Beta tag 一出現，就立即針對該 tag 測試你的外掛。穩定版前的窗口通常只有幾個小時。
3. 測試後，在 `plugin-forum` Discord 頻道中你的外掛 thread 發文，內容可為 `all good` 或說明壞掉的部分。如果你還沒有 thread，請建立一個。
4. 如果有東西壞掉，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的 issue，並套用 `beta-blocker` 標籤。將 issue 連結放進你的 thread。
5. 開啟一個指向 `main` 的 PR，標題為 `fix(<plugin-id>): beta blocker - <summary>`，並在 PR 和你的 Discord thread 中連結該 issue。貢獻者無法標記 PR，因此標題是給維護者與自動化使用的 PR 端信號。有 PR 的 blocker 會被合併；沒有 PR 的 blocker 仍可能照常發布。維護者會在 beta 測試期間關注這些 thread。
6. 沒有聲音就代表綠燈。如果你錯過窗口，你的修正很可能會進入下一個週期。

## 下一步

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息通道外掛
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型提供者外掛
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    註冊本機 AI 命令列介面後端
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    匯入對照與註冊 API 參考
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

- [外掛掛鉤](/zh-TW/plugins/hooks)
- [外掛架構](/zh-TW/plugins/architecture)
