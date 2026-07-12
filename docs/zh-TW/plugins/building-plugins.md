---
doc-schema-version: 1
read_when:
    - 你想要建立新的 OpenClaw 外掛
    - 你需要外掛開發的快速入門指南
    - 你正在選擇頻道、供應商、命令列介面後端、工具或掛鉤文件
sidebarTitle: Getting Started
summary: 幾分鐘內建立你的第一個 OpenClaw 外掛
title: 建置外掛
x-i18n:
    generated_at: "2026-07-12T14:36:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

外掛可在不變更核心的情況下擴充 OpenClaw。外掛可新增訊息傳遞
頻道、模型提供者、本機命令列介面後端、代理工具、鉤子、媒體提供者，
或其他由外掛擁有的功能。

你不需要將外部外掛新增至 OpenClaw 儲存庫。請將
套件發佈至 [ClawHub](/clawhub)，使用者可透過以下命令安裝：

```bash
openclaw plugins install clawhub:<package-name>
```

在發布切換期間，未加前綴的套件規格仍會從 npm 安裝。需要透過 ClawHub
解析時，請使用 `clawhub:` 前綴。

## 需求

- Node 22.19+、Node 23.11+ 或 Node 24+，以及 `npm` 或 `pnpm`。
- TypeScript ESM 模組。
- 若要開發儲存庫內隨附的外掛，請複製儲存庫並執行 `pnpm install`。
  原始碼簽出環境中的外掛開發僅支援 pnpm，因為 OpenClaw 會從
  `extensions/*` 工作區套件探索隨附的外掛。

## 選擇外掛形式

<CardGroup cols={2}>
  <Card title="頻道外掛" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    將 OpenClaw 連接至訊息傳遞平台。
  </Card>
  <Card title="提供者外掛" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    新增模型、媒體、搜尋、擷取、語音或即時提供者。
  </Card>
  <Card title="命令列介面後端外掛" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    透過 OpenClaw 模型備援機制執行本機 AI 命令列介面。
  </Card>
  <Card title="工具外掛" icon="wrench" href="/zh-TW/plugins/tool-plugins">
    註冊代理工具。
  </Card>
</CardGroup>

## 快速入門

註冊一個必要的代理工具，以建置最精簡的工具外掛。這是最短且實用的
外掛形式，涵蓋套件、中繼資料清單、進入點與本機驗證。

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

    已發佈的外部外掛應讓執行階段進入點指向建置完成的 JavaScript
    檔案。如需完整的進入點合約，請參閱 [SDK 進入點](/zh-TW/plugins/sdk-entrypoints)。

    每個外掛都需要中繼資料清單，即使沒有設定也一樣。執行階段工具必須
    列於 `contracts.tools`，OpenClaw 才能在不急切載入每個外掛執行階段的
    情況下探索其擁有者。請有意識地設定 `activation.onStartup`；
    此範例會在閘道啟動時載入。

    主機信任的外掛介面也受中繼資料清單控管，且已安裝的外掛必須明確
    宣告：`api.registerAgentToolResultMiddleware(...)` 需要將每個目標執行階段
    列於 `contracts.agentToolResultMiddleware`，而
    `api.registerTrustedToolPolicy(...)` 則需要將每個原則 ID 列於
    `contracts.trustedToolPolicies`。這些宣告可讓安裝時檢查與執行階段註冊
    保持一致。

    如需每個中繼資料清單欄位的說明，請參閱
    [外掛中繼資料清單](/zh-TW/plugins/manifest)。

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

    非頻道外掛請使用 `definePluginEntry`。頻道外掛則改用
    `openclaw/plugin-sdk/core` 中的 `defineChannelPluginEntry`。

  </Step>

  <Step title="測試執行階段">
    對於已安裝或外部外掛，請檢查已載入的執行階段：

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    如果外掛註冊了命令列介面命令，也請執行該命令並確認輸出，
    例如 `openclaw demo-plugin ping`。

    對於此儲存庫中的隨附外掛，OpenClaw 會從 `extensions/*` 工作區探索
    原始碼簽出環境中的外掛套件。請執行最接近的目標測試：

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="測試套件安裝">
    發佈已準備成套件的外掛前，請測試使用者實際取得的相同安裝形式。
    首先新增建置步驟，讓 `openclaw.extensions` 等執行階段進入點指向
    `./dist/index.js` 之類的建置完成 JavaScript，並確認 `npm pack` 包含該
    `dist/` 輸出。TypeScript 原始碼進入點僅供原始碼簽出環境與本機開發
    路徑使用。

    接著封裝外掛，並使用 `npm-pack:` 安裝 tarball：

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` 會使用由 OpenClaw 管理、每個外掛各自獨立的 npm 專案，
    因此能找出原始碼簽出測試可能掩蓋的執行階段相依性錯誤。它驗證的是
    套件與相依性形式，而不是由目錄連結的官方信任狀態。執行階段匯入項目
    必須列於 `dependencies` 或 `optionalDependencies`；僅留在
    `devDependencies` 中的相依性不會安裝至受管理的執行階段專案。

    請勿將原始封存檔／路徑安裝作為官方或高權限外掛行為的最終驗證。
    原始碼適合用於本機偵錯，但無法證明與 npm 或 ClawHub 安裝相同的
    相依性路徑。如果你的外掛仰賴受信任的官方外掛狀態，請再透過
    目錄支援的官方安裝，或會記錄官方信任狀態的已發佈套件路徑進行
    第二次驗證。如需安裝根目錄與相依性擁有權的詳細資訊，請參閱
    [外掛相依性解析](/zh-TW/plugins/dependency-resolution)。

  </Step>

  <Step title="發佈">
    發佈前請驗證套件：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    標準 ClawHub 套件片段位於 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="安裝">
    透過 ClawHub 安裝已發佈的套件：

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 註冊工具

工具可以是必要或選用。啟用外掛時，必要工具一律可用。選用工具則需要
使用者明確選擇加入，OpenClaw 才會載入其所屬的外掛執行階段。

工具工廠會收到受信任的執行階段情境，其中包括 `deliveryContext`、可用時
代表目前平台對話的 `nativeChannelId`，以及 `requesterSenderId`。

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

每個使用 `api.registerTool(...)` 註冊的工具，也必須在外掛中繼資料清單中
宣告：

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

使用者可透過 `tools.allow` 選擇加入：

```json5
{
  tools: { allow: ["workflow_tool"] }, // 或使用 ["my-plugin"] 允許單一外掛的所有工具
}
```

選用工具控制是否將工具提供給模型。若工具或鉤子應在模型選取後、動作
執行前要求核准，請使用[外掛權限要求](/zh-TW/plugins/plugin-permission-requests)。

對於具有副作用、使用罕見二進位檔，或預設不應公開的功能，請使用選用
工具。工具名稱不得與核心工具名稱衝突；發生衝突時會略過，並在外掛
診斷中回報。格式錯誤的註冊也會以相同方式略過並回報：缺少非空白的
`name`、`execute` 不是函式，或工具描述項沒有 `parameters` 物件。

工具工廠會收到由執行階段提供的情境物件。如果工具需要記錄、顯示目前
回合所使用的作用中模型，或依其調整行為，請使用 `ctx.activeModel`；
其中可能包含 `provider`、`modelId` 與 `modelRef`。請將其視為資訊性
執行階段中繼資料，而非用來防範本機操作員、已安裝外掛程式碼或經修改
OpenClaw 執行階段的安全邊界。敏感的本機工具仍應要求明確的外掛或
操作員選擇加入，並在缺少作用中模型中繼資料或該資料不適用時採取
封閉式失敗。

中繼資料清單會宣告擁有權與探索資訊；執行時仍會呼叫即時註冊的工具
實作。請讓 `toolMetadata.<tool>.optional: true` 與
`api.registerTool(..., { optional: true })` 保持一致，OpenClaw 才能在工具
明確列入允許清單前，避免載入該外掛執行階段。

## 匯入慣例

請從特定用途的 SDK 子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

請勿從已棄用的根彙整模組匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

在你的外掛套件內，請使用 `api.ts` 與 `runtime-api.ts` 等本機彙整檔案
進行內部匯入。請勿透過 SDK 路徑匯入你自己的外掛。特定提供者的
輔助工具應留在提供者套件中，除非該介面確實具通用性。

自訂閘道 RPC 方法屬於進階進入點。請讓其使用外掛專屬前綴；核心管理
命名空間（例如 `config.*`、`exec.approvals.*`、`operator.admin.*`、
`wizard.*` 與 `update.*`）維持保留，並解析為 `operator.admin`。
`openclaw/plugin-sdk/gateway-method-runtime` 橋接器僅供宣告
`contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP
路由使用。

如需完整匯入對照表，請參閱 [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)。

## 提交前檢查清單

<Check>**package.json** 具有正確的 `openclaw` 中繼資料</Check>
<Check>**openclaw.plugin.json** 中繼資料清單存在且有效</Check>
<Check>進入點使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有匯入均使用特定用途的 `plugin-sdk/<subpath>` 路徑</Check>
<Check>內部匯入使用本機模組，而非 SDK 自我匯入</Check>
<Check>測試通過（`pnpm test <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通過（儲存庫內外掛）</Check>

## 針對 Beta 版本進行測試

1. 監看 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 的發行版本（`Watch` > `Releases`）。Beta 標籤的格式類似 `v2026.3.N-beta.1`。你也可以在 X 上追蹤 [@openclaw](https://x.com/openclaw)，取得發行公告。
2. Beta 標籤出現後，請立即使用該標籤測試你的外掛。正式版發布前通常只有幾個小時的時間。
3. 測試後，在 Discord 的 `plugin-forum` 頻道（[discord.gg/clawd](https://discord.gg/clawd)）中你的外掛討論串發文，回報 `all good` 或說明發生的問題。如果你還沒有討論串，請建立一個。
4. 如果發生問題，請建立或更新標題為 `Beta blocker: <plugin-name> - <summary>` 的議題，並套用 `beta-blocker` 標籤。在你的討論串中附上該議題的連結。
5. 建立一個合併至 `main`、標題為 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，並在 PR 和你的 Discord 討論串中附上該議題的連結。貢獻者無法為 PR 加上標籤，因此標題是提供給維護者和自動化機制的 PR 端訊號。已有 PR 的阻擋問題會被合併；沒有 PR 的阻擋問題仍可能隨版本發布。
6. 沒有回報就代表一切正常。錯過這段時間通常表示你的修正會在下一個週期才合併。

## 後續步驟

<CardGroup cols={2}>
  <Card title="頻道外掛" icon="messages-square" href="/zh-TW/plugins/sdk-channel-plugins">
    建立訊息頻道外掛
  </Card>
  <Card title="供應商外掛" icon="cpu" href="/zh-TW/plugins/sdk-provider-plugins">
    建立模型供應商外掛
  </Card>
  <Card title="命令列介面後端外掛" icon="terminal" href="/zh-TW/plugins/cli-backend-plugins">
    註冊本機 AI 命令列介面後端
  </Card>
  <Card title="SDK 概覽" icon="book-open" href="/zh-TW/plugins/sdk-overview">
    匯入映射與註冊 API 參考
  </Card>
  <Card title="執行階段輔助工具" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、搜尋與子代理程式
  </Card>
  <Card title="測試" icon="test-tubes" href="/zh-TW/plugins/sdk-testing">
    測試公用工具與模式
  </Card>
  <Card title="外掛資訊清單" icon="file-json" href="/zh-TW/plugins/manifest">
    完整的資訊清單結構描述參考
  </Card>
</CardGroup>

## 相關內容

- [外掛鉤子](/zh-TW/plugins/hooks)
- [外掛架構](/zh-TW/plugins/architecture)
