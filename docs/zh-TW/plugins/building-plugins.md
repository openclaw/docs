---
doc-schema-version: 1
read_when:
    - 你想要建立新的 OpenClaw 外掛
    - 你需要外掛開發的快速入門指南
    - 你正在選擇頻道、提供者、命令列介面後端、工具或鉤子文件
sidebarTitle: Getting Started
summary: 幾分鐘內建立你的第一個 OpenClaw 外掛
title: 建置外掛
x-i18n:
    generated_at: "2026-07-05T11:27:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71634f848091562bb2c1f5d3aa92a2b623beac190e3bd0b56cc01a1e333143b4
    source_path: plugins/building-plugins.md
    workflow: 16
---

外掛可擴充 OpenClaw，而無需變更核心。外掛可以新增訊息
通道、模型供應商、本機命令列介面後端、代理工具、hook、媒體供應商，
或另一個由外掛擁有的能力。

你不需要將外部外掛加入 OpenClaw 儲存庫。請將
套件發布到 [ClawHub](/clawhub)，使用者可透過以下方式安裝：

```bash
openclaw plugins install clawhub:<package-name>
```

裸套件規格在啟動切換期間仍會從 npm 安裝。當你想要使用 ClawHub 解析時，請使用
`clawhub:` 前綴。

## 需求

- 節點 22.19+、節點 23.11+，或節點 24+，以及 `npm` 或 `pnpm`。
- TypeScript ESM 模組。
- 若要進行儲存庫內建外掛工作，請複製儲存庫並執行 `pnpm install`。
  原始碼 checkout 的外掛開發僅支援 pnpm，因為 OpenClaw 會從
  `extensions/*` 工作區套件探索內建外掛。

## 選擇外掛形態

<CardGroup cols={2}>
  <Card title="通道外掛" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    將 OpenClaw 連接到訊息平台。
  </Card>
  <Card title="供應商外掛" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    新增模型、媒體、搜尋、擷取、語音或即時供應商。
  </Card>
  <Card title="命令列介面後端外掛" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    透過 OpenClaw 模型後備執行本機 AI 命令列介面。
  </Card>
  <Card title="工具外掛" icon="wrench" href="/zh-TW/plugins/tool-plugins">
    註冊代理工具。
  </Card>
</CardGroup>

## 快速開始

透過註冊一個必要代理工具來建置最小工具外掛。這是
最短且實用的外掛形態，涵蓋套件、manifest、進入點與
本機驗證。

<Steps>
  <Step title="建立套件中繼資料">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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

    已發布的外部外掛應將 runtime 進入點指向建置後的 JavaScript
    檔案。完整進入點契約請參閱 [SDK 進入點](/zh-TW/plugins/sdk-entrypoints)。

    每個外掛都需要 manifest，即使沒有設定也一樣。Runtime 工具必須
    出現在 `contracts.tools` 中，讓 OpenClaw 不必急切載入每個外掛 runtime
    就能探索擁有權。請有意識地設定 `activation.onStartup`；
    此範例會在閘道啟動時載入。

    主機信任的外掛介面也由 manifest 閘控，且已安裝的外掛需要明確
    宣告：`api.registerAgentToolResultMiddleware(...)`
    需要將每個目標 runtime 列在 `contracts.agentToolResultMiddleware` 中，
    而 `api.registerTrustedToolPolicy(...)` 需要將每個 policy id 列在
    `contracts.trustedToolPolicies` 中。這些宣告可讓安裝時檢查
    與 runtime 註冊保持一致。

    每個 manifest 欄位請參閱 [外掛 manifest](/zh-TW/plugins/manifest)。

  </Step>

  <Step title="註冊工具">
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

    對非通道外掛使用 `definePluginEntry`。通道外掛則改用
    來自 `openclaw/plugin-sdk/core` 的 `defineChannelPluginEntry`。

  </Step>

  <Step title="測試 runtime">
    對已安裝或外部外掛，檢查已載入的 runtime：

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    如果外掛註冊了命令列介面命令，也請執行該命令並確認
    輸出，例如 `openclaw demo-plugin ping`。

    對此儲存庫中的內建外掛，OpenClaw 會從 `extensions/*` 工作區
    探索原始碼 checkout 的外掛套件。執行最接近的目標
    測試：

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="測試套件安裝">
    發布可封裝外掛前，請測試使用者將取得的相同安裝形態。
    先新增建置步驟，將 `openclaw.extensions` 等 runtime 進入點
    指向像 `./dist/index.js` 這樣的建置後 JavaScript，並確保
    `npm pack` 包含該 `dist/` 輸出。TypeScript 原始碼進入點
    僅適用於原始碼 checkout 與本機開發路徑。

    然後封裝外掛，並使用 `npm-pack:` 安裝 tarball：

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` 使用 OpenClaw 管理的個別外掛 npm 專案，因此可以抓出
    原始碼 checkout 測試可能隱藏的 runtime 相依性錯誤。它證明的是
    套件與相依性形態，而不是與 catalog 連結的官方信任。
    Runtime 匯入必須位於 `dependencies` 或 `optionalDependencies`；
    僅留在 `devDependencies` 中的相依性不會安裝到
    受管理的 runtime 專案。

    不要將原始封存/路徑安裝作為官方或
    特權外掛行為的最終驗證。原始碼對本機除錯很有用，但
    它們無法證明與 npm 或 ClawHub 安裝相同的相依性路徑。如果
    你的外掛依賴受信任官方外掛狀態，請加入第二項驗證，
    透過以 catalog 為基礎的官方安裝，或透過記錄官方信任的
    已發布套件路徑。安裝根與相依性擁有權細節請參閱
    [外掛相依性解析](/zh-TW/plugins/dependency-resolution)。

  </Step>

  <Step title="發布">
    發布前驗證套件：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    標準 ClawHub 套件片段位於 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="安裝">
    透過 ClawHub 安裝已發布套件：

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 註冊工具

工具可以是必要或選用。當外掛啟用時，必要工具一律可用。
選用工具需要使用者明確選擇加入，OpenClaw 才會載入
擁有該工具的外掛 runtime。

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

每個使用 `api.registerTool(...)` 註冊的工具，也必須在
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

使用者透過 `tools.allow` 選擇加入：

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

選用工具控制工具是否暴露給模型。當工具
或 hook 應在模型選擇後、動作執行前要求核准時，請使用
[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)。

對副作用、不常見的二進位檔，或不應預設暴露的能力使用選用工具。
工具名稱不得與核心工具名稱衝突；衝突會被略過並在外掛診斷中回報。
格式錯誤的註冊也會以相同方式略過並回報：缺少非空白
`name`、非函式 `execute`，或沒有 `parameters`
物件的工具描述子。

工具 factory 會接收 runtime 提供的 context 物件。當工具需要記錄、
顯示，或依目前回合的作用中模型調整時，請使用 `ctx.activeModel`；
它可以包含 `provider`、`modelId` 和 `modelRef`。請將其視為
資訊性的 runtime 中繼資料，而不是用來防範本機
操作者、已安裝外掛程式碼或經修改 OpenClaw runtime 的安全邊界。
敏感的本機工具仍應要求明確的外掛或操作者選擇加入，並在
作用中模型中繼資料缺失或不適合時封閉失敗。

Manifest 宣告擁有權與探索；執行仍會呼叫即時註冊的工具實作。
請讓 `toolMetadata.<tool>.optional: true` 與
`api.registerTool(..., { optional: true })` 保持一致，讓 OpenClaw 可以避免
在工具被明確 allowlist 前載入該外掛 runtime。

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

在你的外掛套件內，請使用 `api.ts` 和
`runtime-api.ts` 等本機 barrel 檔案進行內部匯入。不要透過
SDK 路徑匯入你自己的外掛。供應商專用 helper 應留在供應商套件中，
除非該接縫確實是通用的。

自訂閘道 RPC 方法是進階進入點。請將它們保留在
外掛專用前綴上；核心管理命名空間，例如 `config.*`、
`exec.approvals.*`、`operator.admin.*`、`wizard.*` 和 `update.*` 仍為保留，
並解析為 `operator.admin`。
`openclaw/plugin-sdk/gateway-method-runtime` bridge 保留給宣告
`contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP
路由使用。

完整匯入對照請參閱 [外掛 SDK 總覽](/zh-TW/plugins/sdk-overview)。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` 中繼資料</Check>
<Check>**openclaw.plugin.json** manifest 存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入都使用聚焦的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而不是 SDK 自我匯入</Check>
<Check>測試通過（`pnpm test <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通過（儲存庫內外掛）</Check>

## 針對 beta 發行版本測試

1. 觀看 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 發行版（`Watch` > `Releases`）。Beta 標籤看起來像 `v2026.3.N-beta.1`。你也可以在 X 上追蹤 [@openclaw](https://x.com/openclaw) 以取得發行公告。
2. Beta 標籤一出現，就立即用它測試你的外掛。穩定版發布前的時間通常只有幾個小時。
3. 測試後，在 `plugin-forum` Discord 頻道（[discord.gg/clawd](https://discord.gg/clawd)）中你的外掛討論串發文，內容可以是 `all good` 或說明哪裡壞了。如果你還沒有討論串，請建立一個。
4. 如果有東西壞了，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的議題，並套用 `beta-blocker` 標籤。在你的討論串中連結該議題。
5. 開啟一個到 `main` 的 PR，標題為 `fix(<plugin-id>): beta blocker - <summary>`，並在 PR 和你的 Discord 討論串中連結該議題。貢獻者無法為 PR 加上標籤，因此標題是給維護者和自動化系統的 PR 端訊號。有 PR 的阻擋問題會被合併；沒有 PR 的阻擋問題仍可能照常發布。
6. 沉默表示綠燈。錯過這個時段通常表示你的修正會進入下一個週期。

## 下一步

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
    完整 manifest 結構描述參考
  </Card>
</CardGroup>

## 相關

- [外掛 hooks](/zh-TW/plugins/hooks)
- [外掛架構](/zh-TW/plugins/architecture)
