---
doc-schema-version: 1
read_when:
    - 你想建立新的 OpenClaw 外掛
    - 你需要外掛開發的快速入門
    - 你正在選擇頻道、提供者、命令列介面後端、工具或鉤子文件
sidebarTitle: Getting Started
summary: 在幾分鐘內建立你的第一個 OpenClaw 外掛
title: 建置外掛
x-i18n:
    generated_at: "2026-07-04T15:08:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

外掛可在不變更核心的情況下擴充 OpenClaw。外掛可以新增訊息
通道、模型提供者、本機命令列介面後端、代理工具、鉤子、媒體提供者，
或另一個由外掛擁有的能力。

你不需要將外部外掛加入 OpenClaw 儲存庫。將套件發布到 [ClawHub](/zh-TW/clawhub)，使用者可使用以下方式安裝：

```bash
openclaw plugins install clawhub:<package-name>
```

在啟動切換期間，裸套件規格仍會從 npm 安裝。當你想使用 ClawHub 解析時，請使用
`clawhub:` 前綴。

## 需求

- 使用 Node 22.19+、Node 23.11+ 或 Node 24+，以及 `npm` 或 `pnpm` 等套件管理器。
- 熟悉 TypeScript ESM 模組。
- 若要進行儲存庫內建外掛工作，請複製儲存庫並執行 `pnpm install`。
  原始碼 checkout 外掛開發僅支援 pnpm，因為 OpenClaw 會從
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
    透過 OpenClaw 模型後援執行本機 AI 命令列介面。
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/zh-TW/plugins/tool-plugins">
    註冊代理工具。
  </Card>
</CardGroup>

## 快速開始

透過註冊一個必要代理工具，建置最小工具外掛。這是
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

    已發布的外部外掛應將執行階段進入點指向已建置的 JavaScript
    檔案。完整進入點合約請參閱 [SDK 進入點](/zh-TW/plugins/sdk-entrypoints)。

    每個外掛都需要清單，即使它沒有設定也一樣。執行階段工具
    必須出現在 `contracts.tools` 中，讓 OpenClaw 不必急切載入每個
    外掛執行階段即可探索所有權。請有意識地設定 `activation.onStartup`。
    此範例會在閘道啟動時啟動。

    主機信任的外掛介面也由清單閘控，且已安裝的外掛需要明確
    啟用。如果已安裝的外掛註冊
    `api.registerAgentToolResultMiddleware(...)`，請在
    `contracts.agentToolResultMiddleware` 中宣告每個目標執行階段。如果它註冊
    `api.registerTrustedToolPolicy(...)`，請在
    `contracts.trustedToolPolicies` 中宣告每個政策 ID。這些宣告可讓安裝時
    檢查與執行階段註冊保持一致。

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
    示範命令應有像是
    `openclaw demo-plugin ping` 的執行驗證。

    對於此儲存庫中的內建外掛，OpenClaw 會從 `extensions/*`
    工作區探索原始碼 checkout 外掛套件。執行最接近的目標測試：

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    發布可打包的外掛之前，請測試使用者會取得的相同安裝形態。
    首先新增建置步驟，將 `openclaw.extensions` 等執行階段進入點
    指向像 `./dist/index.js` 這樣已建置的 JavaScript，並確認
    `npm pack` 包含該 `dist/` 輸出。TypeScript 原始碼進入點
    只用於原始碼 checkout 與本機開發路徑。

    接著打包外掛，並使用 `npm-pack:` 安裝 tarball：

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` 使用 OpenClaw 管理的每外掛 npm 專案，因此能抓出
    原始碼 checkout 測試可能隱藏的執行階段相依性錯誤。它驗證的是
    套件與相依性形態，而非目錄連結的官方信任。
    執行階段匯入必須位於 `dependencies` 或 `optionalDependencies`；
    只留在 `devDependencies` 的相依性不會安裝到受管理的執行階段專案。

    不要將原始封存檔/路徑安裝當作官方或
    特權外掛行為的最終驗證。原始碼對本機除錯很有用，但
    它們無法驗證與 npm 或 ClawHub 安裝相同的相依性路徑。如果
    你的外掛依賴受信任的官方外掛狀態，請加入第二項驗證，
    透過目錄支援的官方安裝，或會記錄官方信任的已發布套件路徑。
    安裝根目錄與相依性所有權詳細資訊請參閱
    [外掛相依性解析](/zh-TW/plugins/dependency-resolution)。

  </Step>

  <Step title="Publish">
    發布前驗證套件：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    標準 ClawHub 片段位於 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="Install">
    透過 ClawHub 安裝已發布套件：

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 註冊工具

工具可以是必要或選用。當外掛啟用時，必要工具永遠可用。
選用工具需要使用者選擇加入。

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

使用者可使用 `tools.allow` 選擇加入：

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

選用工具控制工具是否暴露給模型。當工具
或鉤子應在模型選取後、動作執行前要求核准時，請使用
[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)。

將選用工具用於副作用、不常見的二進位檔，或
預設不應暴露的能力。工具名稱不得與核心工具衝突；
衝突項目會被略過，並在外掛診斷中回報。格式不正確的
註冊，包括沒有 `parameters` 的工具描述元，也會以相同方式略過並回報。
已註冊工具是模型可在政策與允許清單檢查通過後呼叫的型別化函式。

工具工廠會收到執行階段提供的內容物件。當工具需要記錄、顯示，
或配合目前回合的作用中模型調整時，請使用 `ctx.activeModel`。
該物件可包含 `provider`、`modelId` 和 `modelRef`。請將它視為
資訊性的執行階段中繼資料，而不是針對本機操作員、已安裝外掛程式碼，
或已修改 OpenClaw 執行階段的安全邊界。敏感的本機工具仍應要求
明確的外掛或操作員選擇加入，並在作用中模型中繼資料缺失或不適合時
以關閉方式失敗。

清單宣告所有權與探索；執行仍會呼叫即時
註冊的工具實作。請讓 `toolMetadata.<tool>.optional: true`
與 `api.registerTool(..., { optional: true })` 保持一致，讓 OpenClaw 能避免
在工具明確加入允許清單前載入該外掛執行階段。

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
SDK 路徑匯入你自己的外掛。提供者專用輔助工具應留在提供者套件中，
除非該邊界確實具有通用性。

自訂閘道 RPC 方法是進階進入點。請將它們放在
外掛專用前綴下；核心管理命名空間，例如 `config.*`、
`exec.approvals.*`、`operator.admin.*`、`wizard.*` 和 `update.*` 仍保留，
並解析到 `operator.admin`。
`openclaw/plugin-sdk/gateway-method-runtime` 橋接器保留給宣告
`contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP
路由使用。

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

1. 留意 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 發行標籤，並透過 `Watch` > `Releases` 訂閱。Beta 標籤看起來像 `v2026.3.N-beta.1`。你也可以開啟官方 OpenClaw X 帳號 [@openclaw](https://x.com/openclaw) 的通知，以接收發行公告。
2. Beta 標籤一出現，就立即用它測試你的外掛。穩定版發布前的時間通常只有幾個小時。
3. 測試後，在 `plugin-forum` Discord 頻道中你的外掛討論串發文，內容可以是 `all good` 或說明哪裡壞了。如果你還沒有討論串，請建立一個。
4. 如果有東西壞了，請開啟或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的 issue，並套用 `beta-blocker` 標籤。把 issue 連結放進你的討論串。
5. 開一個指向 `main` 的 PR，標題為 `fix(<plugin-id>): beta blocker - <summary>`，並在 PR 和你的 Discord 討論串中連結該 issue。貢獻者無法替 PR 加標籤，所以標題就是給維護者和自動化使用的 PR 端訊號。有 PR 的阻斷問題會被合併；沒有 PR 的阻斷問題仍可能照常發布。維護者會在 Beta 測試期間關注這些討論串。
6. 沒有回報就代表綠燈。如果你錯過這個時段，你的修復很可能會進入下一個週期。

## 下一步

<CardGroup cols={2}>
  <Card title="頻道外掛" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建立訊息頻道外掛
  </Card>
  <Card title="提供者外掛" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建立模型提供者外掛
  </Card>
  <Card title="命令列介面後端外掛" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    註冊本機 AI 命令列介面後端
  </Card>
  <Card title="SDK 概覽" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    匯入映射與註冊 API 參考
  </Card>
  <Card title="執行階段輔助工具" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、搜尋、子代理
  </Card>
  <Card title="測試" icon="test-tubes" href="/zh-TW/plugins/sdk-testing">
    測試工具與模式
  </Card>
  <Card title="外掛資訊清單" icon="file-json" href="/zh-TW/plugins/manifest">
    完整資訊清單結構描述參考
  </Card>
</CardGroup>

## 相關

- [外掛 hooks](/zh-TW/plugins/hooks)
- [外掛架構](/zh-TW/plugins/architecture)
