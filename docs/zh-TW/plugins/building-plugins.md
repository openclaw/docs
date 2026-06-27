---
doc-schema-version: 1
read_when:
    - 你想要建立新的 OpenClaw 外掛
    - 你需要一份外掛開發快速入門
    - 你正在選擇頻道、供應商、命令列介面後端、工具或鉤子文件
sidebarTitle: Getting Started
summary: 幾分鐘內建立你的第一個 OpenClaw 外掛
title: 建置外掛
x-i18n:
    generated_at: "2026-06-27T19:33:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

外掛可在不變更核心的情況下擴充 OpenClaw。外掛可以新增訊息
通道、模型提供者、本機命令列介面後端、代理工具、掛鉤、媒體提供者，
或其他由外掛擁有的能力。

你不需要將外部外掛加入 OpenClaw 儲存庫。請將
套件發布到 [ClawHub](/zh-TW/clawhub)，使用者可用以下方式安裝：

```bash
openclaw plugins install clawhub:<package-name>
```

在啟動切換期間，裸套件規格仍會從 npm 安裝。當你想使用 ClawHub
解析時，請使用 `clawhub:` 前綴。

## 需求

- 使用 節點 22.19 或更新版本，以及像 `npm` 或 `pnpm` 這類套件管理器。
- 熟悉 TypeScript ESM 模組。
- 若要處理儲存庫內的內建外掛，請複製儲存庫並執行 `pnpm install`。
  原始碼簽出外掛開發僅支援 pnpm，因為 OpenClaw 會從
  `extensions/*` 工作區套件載入內建外掛。

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

透過註冊一個必要代理工具來建立最小工具外掛。這是
最短且實用的外掛形態，並展示套件、清單、進入點與
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

    已發布的外部外掛應將執行階段進入點指向建置後的 JavaScript
    檔案。完整進入點契約請參閱 [SDK 進入點](/zh-TW/plugins/sdk-entrypoints)。

    每個外掛都需要清單，即使它沒有設定也是如此。執行階段工具
    必須出現在 `contracts.tools` 中，讓 OpenClaw 可在不急切載入
    每個外掛執行階段的情況下探索擁有權。請有意識地設定
    `activation.onStartup`。此範例會在 閘道 啟動時啟動。

    主機信任的外掛介面同樣受清單控管，且已安裝外掛需要明確
    啟用。如果已安裝外掛註冊了
    `api.registerAgentToolResultMiddleware(...)`，請在
    `contracts.agentToolResultMiddleware` 中宣告每個目標執行階段。
    如果它註冊了 `api.registerTrustedToolPolicy(...)`，請在
    `contracts.trustedToolPolicies` 中宣告每個政策 ID。這些宣告可讓
    安裝時檢查與執行階段註冊保持一致。

    每個清單欄位請參閱 [外掛清單](/zh-TW/plugins/manifest)。

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
    對於已安裝或外部外掛，請檢查已載入的執行階段：

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    如果外掛註冊了命令列介面命令，也請執行該命令。例如，
    示範命令應具有像 `openclaw demo-plugin ping` 這樣的執行證明。

    對於此儲存庫中的內建外掛，OpenClaw 會從 `extensions/*`
    工作區探索原始碼簽出外掛套件。執行最接近的目標測試：

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

工具可以是必要或選用。必要工具在外掛啟用時一律可用。
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
外掛清單中宣告：

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

使用者可使用 `tools.allow` 選擇啟用：

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

選用工具會控制工具是否公開給模型。當工具或掛鉤應在
模型選取後、動作執行前要求核准時，請使用
[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)。

對於副作用、不常見的二進位檔，或不應預設公開的能力，請使用
選用工具。工具名稱不得與核心工具衝突；衝突會被略過並在外掛
診斷中回報。格式錯誤的註冊，包括沒有 `parameters` 的工具描述元，
也會以相同方式略過並回報。已註冊工具是具型別的函式，模型可在
政策與允許清單檢查通過後呼叫。

工具工廠會收到執行階段提供的內容物件。當工具需要記錄、顯示，
或依目前回合的作用中模型調整時，請使用 `ctx.activeModel`。
該物件可包含 `provider`、`modelId` 和 `modelRef`。請將它視為
資訊性的執行階段中繼資料，而不是用來抵禦本機操作者、已安裝外掛程式碼，
或已修改 OpenClaw 執行階段的安全邊界。敏感的本機工具仍應要求
明確的外掛或操作者選擇啟用，並在作用中模型中繼資料遺失或不合適時
失敗關閉。

清單宣告擁有權與探索；執行時仍會呼叫即時註冊的工具實作。
請讓 `toolMetadata.<tool>.optional: true` 與
`api.registerTool(..., { optional: true })` 保持一致，讓 OpenClaw
可避免載入該外掛執行階段，直到工具被明確加入允許清單。

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

在你的外掛套件內，請使用像 `api.ts` 和 `runtime-api.ts` 這類本機
barrel 檔案進行內部匯入。不要透過 SDK 路徑匯入你自己的外掛。
提供者專用輔助程式應留在提供者套件中，除非該接縫確實是通用的。

自訂 閘道 RPC 方法是進階進入點。請將它們放在外掛專屬前綴下；
像 `config.*`、`exec.approvals.*`、`operator.admin.*`、`wizard.*`
和 `update.*` 這類核心管理命名空間保留使用，並解析到
`operator.admin`。`openclaw/plugin-sdk/gateway-method-runtime` 橋接
保留給宣告 `contracts.gatewayMethodDispatch: ["authenticated-request"]`
的外掛 HTTP 路由使用。

完整匯入對應請參閱 [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` 中繼資料</Check>
<Check>**openclaw.plugin.json** 清單存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入都使用聚焦的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而非 SDK 自我匯入</Check>
<Check>測試通過（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通過（儲存庫內外掛）</Check>

## 針對 beta 版本測試

1. 監看 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 發布標籤，並透過 `Watch` > `Releases` 訂閱。Beta 標籤看起來像 `v2026.3.N-beta.1`。你也可以開啟官方 OpenClaw X 帳號 [@openclaw](https://x.com/openclaw) 的通知，以取得發布公告。
2. Beta 標籤一出現，就立即用它測試你的外掛。穩定版前的時間窗口通常只有幾個小時。
3. 測試後，在 `plugin-forum` Discord 頻道中你的外掛討論串發布 `all good` 或說明壞掉的內容。如果你還沒有討論串，請建立一個。
4. 如果有東西壞掉，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的議題，並套用 `beta-blocker` 標籤。將議題連結放入你的討論串。
5. 開啟一個指向 `main` 的 PR，標題為 `fix(<plugin-id>): beta blocker - <summary>`，並在 PR 與你的 Discord 討論串中連結該議題。貢獻者無法標記 PR，因此標題是給維護者與自動化的 PR 端訊號。有 PR 的阻斷問題會被合併；沒有 PR 的阻斷問題可能仍會照常發布。維護者會在 beta 測試期間監看這些討論串。
6. 沉默表示綠燈。如果你錯過時間窗口，你的修復很可能會落在下一個週期。

## 後續步驟

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建立訊息通道外掛
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建立模型提供者外掛
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    註冊本機 AI 命令列介面後端
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    匯入對應與註冊 API 參考
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、搜尋、子代理
  </Card>
  <Card title="Testing" icon="test-tubes" href="/zh-TW/plugins/sdk-testing">
    測試工具與模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-TW/plugins/manifest">
    完整清單結構描述參考
  </Card>
</CardGroup>

## 相關

- [外掛掛鉤](/zh-TW/plugins/hooks)
- [外掛架構](/zh-TW/plugins/architecture)
