---
read_when:
    - 你需要知道應從哪個 SDK 子路徑匯入
    - 你想要 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查詢特定的 SDK 匯出項目
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考，以及 SDK 架構
title: Plugin SDK 概覽
x-i18n:
    generated_at: "2026-05-10T19:46:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK 是 Plugin 與核心之間的型別化契約。本頁是**應匯入什麼**與**可以註冊什麼**的參考資料。

<Note>
  本頁適用於在 OpenClaw 內部使用 `openclaw/plugin-sdk/*` 的 Plugin
  作者。對於想要透過 Gateway 執行代理的外部應用程式、指令碼、儀表板、CI
  工作與 IDE 擴充功能，請改用 [OpenClaw App SDK](/zh-TW/concepts/openclaw-sdk)
  與 `@openclaw/sdk` 套件。
</Note>

<Tip>
想找操作指南？請從[建置 Plugin](/zh-TW/plugins/building-plugins) 開始；通道 Plugin 請使用[通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)，提供者 Plugin 請使用[提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins)，本機 AI CLI 後端請使用 [CLI 後端 Plugin](/zh-TW/plugins/cli-backend-plugins)，工具或生命週期鉤子 Plugin 請使用 [Plugin 鉤子](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型、自足的模組。這能讓啟動保持快速，並避免循環相依問題。對於通道專屬的進入點/建置輔助工具，優先使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給較廣泛的總括介面，以及像 `buildChannelConfigSchema` 這類共用輔助工具。

對於通道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布由通道擁有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路徑適用於共用 schema 基元與通用建置器。OpenClaw 的內建 Plugin 使用 `plugin-sdk/bundled-channel-config-schema` 來保留內建通道 schema。已棄用的相容性匯出仍保留在 `plugin-sdk/channel-config-schema-legacy`；這兩個內建 schema 子路徑都不是新 Plugin 應採用的模式。

<Warning>
  請勿匯入提供者或通道品牌化的便利接縫（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  內建 Plugin 會在自己的 `api.ts` / `runtime-api.ts` barrel 內組合通用 SDK
  子路徑；核心消費者應使用那些 Plugin 本機 barrel，或在需求確實跨通道時新增狹窄的通用 SDK 契約。

少數內建 Plugin 輔助接縫在已有追蹤的擁有者使用情境下，仍會出現在產生的匯出對應中。它們只為內建 Plugin 維護而存在，不建議作為新的第三方 Plugin 匯入路徑。

`openclaw/plugin-sdk/discord` 與 `openclaw/plugin-sdk/telegram-account` 也會作為已棄用的相容性 facade 保留給已追蹤的擁有者使用。請勿將這些匯入路徑複製到新的 Plugin；請改用注入的執行期輔助工具與通用通道 SDK 子路徑。
</Warning>

## 子路徑參考

Plugin SDK 會以一組按領域分組的狹窄子路徑公開（Plugin 進入點、通道、提供者、驗證、執行期、能力、記憶體，以及保留的內建 Plugin 輔助工具）。完整目錄（已分組並附連結）請參閱 [Plugin SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出會在扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的儲存庫本機測試/內部子路徑後，從公開子集產生。執行 `pnpm plugin-sdk:surface` 以稽核公開匯出數量。已夠舊且未被內建擴充功能生產程式碼使用的已棄用公開子路徑，會追蹤在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；廣泛的已棄用重新匯出 barrel 則追蹤在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`。

## 註冊 API

`register(api)` 回呼會收到具有以下方法的 `OpenClawPluginApi` 物件：

### 能力註冊

| 方法                                             | 它註冊的內容                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論 (LLM)                        |
| `api.registerAgentHarness(...)`                  | 實驗性低階代理執行器                  |
| `api.registerCliBackend(...)`                    | 本機 CLI 推論後端                     |
| `api.registerChannel(...)`                       | 訊息通道                              |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT 合成                 |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                          |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                  |
| `api.registerMediaUnderstandingProvider(...)`    | 圖像/音訊/影片分析                    |
| `api.registerImageGenerationProvider(...)`       | 圖像生成                              |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                              |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                              |
| `api.registerWebFetchProvider(...)`              | 網頁擷取 / 抓取提供者                 |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                              |

### 工具與命令

| 方法                            | 它註冊的內容                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 代理工具（必填或 `{ optional: true }`）       |
| `api.registerCommand(def)`      | 自訂命令（繞過 LLM）                          |

當代理需要一段由命令擁有的簡短路由提示時，Plugin 命令可以設定 `agentPromptGuidance`。請讓該文字聚焦於命令本身；不要將提供者或 Plugin 專屬政策加入核心提示建置器。

### 基礎設施

| 方法                                           | 它註冊的內容                          |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件鉤子                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP 端點                     |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 方法                      |
| `api.registerGatewayDiscoveryService(service)` | 本機 Gateway 探索公告器               |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                            |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 底下的 Node 功能 CLI |
| `api.registerService(service)`                 | 背景服務                              |
| `api.registerInteractiveHandler(registration)` | 互動式處理器                          |
| `api.registerAgentToolResultMiddleware(...)`   | 執行期工具結果中介軟體                |
| `api.registerMemoryPromptSupplement(builder)`  | 附加的記憶體相鄰提示段落              |
| `api.registerMemoryCorpusSupplement(adapter)`  | 附加的記憶體搜尋/讀取語料庫           |

### 工作流程 Plugin 的主機鉤子

主機鉤子是讓 Plugin 參與主機生命週期的 SDK 接縫，而不只是新增提供者、通道或工具。它們是通用契約；Plan Mode 可以使用它們，核准工作流程、工作區政策閘門、背景監視器、設定精靈與 UI 伴隨 Plugin 也可以使用。

| 方法                                                                     | 它擁有的契約                                                                                                                      |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | 由 Plugin 擁有、JSON 相容，並透過 Gateway 工作階段投影的工作階段狀態                                                             |
| `api.enqueueNextTurnInjection(...)`                                      | 針對單一工作階段，注入下一次代理回合且具持久性的恰好一次上下文                                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | 內建/受信任的前 Plugin 工具政策，可封鎖或重寫工具參數                                                                             |
| `api.registerToolMetadata(...)`                                          | 不變更工具實作的工具目錄顯示中繼資料                                                                                              |
| `api.registerCommand(...)`                                               | 有作用域的 Plugin 命令；命令結果可以設定 `continueAgent: true`；Discord 原生命令支援 `descriptionLocalizations`                 |
| `api.registerControlUiDescriptor(...)`                                   | 工作階段、工具、執行或設定介面的 Control UI 貢獻描述子                                                                           |
| `api.registerRuntimeLifecycle(...)`                                      | 在重設/刪除/重新載入路徑上，清理由 Plugin 擁有的執行期資源的回呼                                                                  |
| `api.registerAgentEventSubscription(...)`                                | 供工作流程狀態與監視器使用的已清理事件訂閱                                                                                        |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 每次執行的 Plugin 暫存狀態，會在終止執行生命週期時清除                                                                            |
| `api.registerSessionSchedulerJob(...)`                                   | 由 Plugin 擁有、具確定性清理的工作階段排程器工作記錄                                                                              |

這些契約刻意拆分權限：

- 外部 Plugin 可以擁有工作階段擴充、UI 描述子、命令、工具中繼資料、下一回合注入與一般鉤子。
- 受信任工具政策會在一般 `before_tool_call` 鉤子之前執行，且僅限內建，因為它們參與主機安全政策。
- 保留命令所有權僅限內建。外部 Plugin 應使用自己的命令名稱或別名。
- `allowPromptInjection=false` 會停用會改變提示的鉤子，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、舊版 `before_agent_start` 的提示欄位，以及 `enqueueNextTurnInjection`。

非 Plan 消費者範例：

| Plugin 原型                 | 使用的鉤子                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 核准工作流程                | 工作階段擴充、命令延續、下一回合注入、UI 描述子                                                                                   |
| 預算/工作區政策閘門         | 受信任工具政策、工具中繼資料、工作階段投影                                                                                         |
| 背景生命週期監視器          | 執行期生命週期清理、代理事件訂閱、工作階段排程器所有權/清理、heartbeat 提示貢獻、UI 描述子                                       |
| 設定或入門精靈              | 工作階段擴充、有作用域的命令、Control UI 描述子                                                                                   |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律維持 `operator.admin`，即使 Plugin 嘗試指派更狹窄的 gateway
  方法作用域也是如此。Plugin 擁有的方法建議使用 Plugin 專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  Bundled plugins 可以在需要於執行後、runtime 將工具結果回饋給模型之前
  重寫工具結果時使用 `api.registerAgentToolResultMiddleware(...)`。
  這是適用於 tokenjuice 等非同步輸出縮減器的受信任、runtime 中立
  seam。

Bundled plugins 必須為每個目標 runtime 宣告 `contracts.agentToolResultMiddleware`，
例如 `["pi", "codex"]`。外部 plugins
無法註冊此中介軟體；不需要模型前工具結果時序的工作，請保留使用一般
OpenClaw plugin hooks。舊有僅限 Pi 的內嵌
extension factory 註冊路徑已移除。
</Accordion>

### Gateway 探索註冊

`api.registerGatewayDiscoveryService(...)` 讓 plugin 可在 mDNS/Bonjour 等
本機探索傳輸上公告作用中的 Gateway。啟用本機探索時，OpenClaw 會在
Gateway 啟動期間呼叫該服務，傳入目前的 Gateway 連接埠與非機密 TXT
提示資料，並在 Gateway 關閉期間呼叫回傳的
`stop` handler。

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway 探索 plugins 不得將公告的 TXT 值視為秘密或
驗證資訊。探索是路由提示；Gateway 驗證與 TLS pinning 仍然
負責信任。

### CLI 註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種命令中繼資料：

- `commands`：registrar 擁有的明確命令名稱
- `descriptors`：用於 CLI 說明、
  路由與延遲 plugin CLI 註冊的解析時命令描述元
- `parentPath`：巢狀命令群組的選用父命令路徑，例如
  `["nodes"]`

對於成對 Node 功能，偏好使用
`api.registerNodeCliFeature(registrar, opts?)`。它是
`api.registerCli(..., { parentPath: ["nodes"] })` 的小型包裝器，並使
`openclaw nodes canvas` 等命令成為明確由 plugin 擁有的 Node 功能。

如果你希望 plugin 命令在一般根 CLI 路徑中維持延遲載入，
請提供涵蓋該 registrar 公開之每個頂層命令根的 `descriptors`。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

巢狀命令會以 `program` 接收已解析的父命令：

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

只有在不需要延遲根 CLI 註冊時，才單獨使用 `commands`。
該急切相容路徑仍受支援，但它不會安裝
由描述元支援、用於解析時延遲載入的 placeholders。

### CLI 後端註冊

`api.registerCliBackend(...)` 讓 plugin 可擁有本機
AI CLI 後端（例如 `codex-cli`）的預設設定。

- 後端 `id` 會成為 `codex-cli/gpt-5` 等模型 refs 中的 provider 前綴。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍會優先。OpenClaw 會先將 `agents.defaults.cliBackends.<id>` 合併到
  plugin 預設值之上，再執行 CLI。
- 當後端需要在合併後進行相容性重寫時，使用 `normalizeConfig`
  （例如正規化舊的旗標形狀）。
- 對於屬於 CLI dialect 的 request-scoped argv 重寫，使用 `resolveExecutionArgs`，
  例如將 OpenClaw thinking levels 對應到原生 effort
  flag。

如需端到端撰寫指南，請參閱
[CLI 後端 plugins](/zh-TW/plugins/cli-backend-plugins)。

### 專屬 slots

| 方法                                       | 註冊內容                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine（一次一個作用中）。`assemble()` callback 會接收 `availableTools` 與 `citationsMode`，讓 engine 可調整 prompt additions。                  |
| `api.registerMemoryCapability(capability)` | 統一 memory capability                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Memory prompt section builder                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Memory flush plan resolver                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Memory runtime adapter                                                                                                                                    |

### Memory embedding adapters

| 方法                                           | 註冊內容                                       |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中 plugin 的 memory embedding adapter      |

- `registerMemoryCapability` 是偏好的專屬 memory-plugin API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，
  讓 companion plugins 可透過
  `openclaw/plugin-sdk/memory-host-core` 使用匯出的 memory artifacts，而不是進入特定
  memory plugin 的私有 layout。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是 legacy-compatible 專屬 memory-plugin APIs。
- `MemoryFlushPlan.model` 可將 flush turn 釘選到精確的 `provider/model`
  reference，例如 `ollama/qwen3:8b`，而不繼承作用中的 fallback
  chain。
- `registerMemoryEmbeddingProvider` 讓作用中 memory plugin 可註冊一個
  或多個 embedding adapter ids（例如 `openai`、`gemini`，或自訂
  plugin-defined id）。
- 使用者設定（例如 `agents.defaults.memorySearch.provider` 與
  `agents.defaults.memorySearch.fallback`）會對照這些已註冊的
  adapter ids 解析。

### 事件與生命週期

| 方法                                         | 作用                          |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期 hook           |
| `api.onConversationBindingResolved(handler)` | 對話繫結 callback             |

請參閱 [Plugin hooks](/zh-TW/plugins/hooks) 取得範例、常見 hook 名稱與 guard
語意。

### Hook 決策語意

- `before_tool_call`：回傳 `{ block: true }` 是終止性決策。一旦任何 handler 設定它，較低優先序的 handlers 會被略過。
- `before_tool_call`：回傳 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `before_install`：回傳 `{ block: true }` 是終止性決策。一旦任何 handler 設定它，較低優先序的 handlers 會被略過。
- `before_install`：回傳 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `reply_dispatch`：回傳 `{ handled: true, ... }` 是終止性決策。一旦任何 handler 宣告處理 dispatch，較低優先序的 handlers 與預設模型 dispatch 路徑都會被略過。
- `message_sending`：回傳 `{ cancel: true }` 是終止性決策。一旦任何 handler 設定它，較低優先序的 handlers 會被略過。
- `message_sending`：回傳 `{ cancel: false }` 會被視為沒有決策（與省略 `cancel` 相同），而不是覆寫。
- `message_received`：當你需要 inbound thread/topic routing 時，使用型別化的 `threadId` 欄位。保留 `metadata` 給 channel-specific extras。
- `message_sending`：先使用型別化的 `replyToId` / `threadId` routing 欄位，再 fallback 到 channel-specific `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得 gateway-owned startup state，而不是依賴內部 `gateway:startup` hooks。
- `cron_changed`：觀察 gateway-owned cron 生命週期變更。同步外部喚醒排程器時，使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並維持 OpenClaw 作為 due checks 與執行的真實來源。

### API object 欄位

| 欄位                     | 類型                      | 說明                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                   |
| `api.name`               | `string`                  | 顯示名稱                                                                                    |
| `api.version`            | `string?`                 | Plugin 版本（選用）                                                                         |
| `api.description`        | `string?`                 | Plugin 說明（選用）                                                                         |
| `api.source`             | `string`                  | Plugin source path                                                                          |
| `api.rootDir`            | `string?`                 | Plugin root directory（選用）                                                               |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為作用中的 in-memory runtime snapshot）                                 |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的 Plugin-specific config                                |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/zh-TW/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Scoped logger（`debug`、`info`、`warn`、`error`）                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是輕量的 pre-full-entry startup/setup window                 |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於 plugin root 的路徑                                                               |

## 內部模組慣例

在你的 plugin 內，使用本機 barrel files 進行內部 imports：

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  永遠不要在 production code 中透過 `openclaw/plugin-sdk/<your-plugin>`
  import 你自己的 plugin。請透過 `./api.ts` 或
  `./runtime-api.ts` 路由內部 imports。SDK path 僅是外部 contract。
</Warning>

由 Facade 載入的 bundled plugin 公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`，以及類似的公開進入點檔案）會在 OpenClaw 已在執行時，優先使用
作用中的 runtime config 快照。如果尚未存在 runtime
快照，它們會退回使用磁碟上已解析的 config 檔案。
封裝後的 bundled plugin facade 應透過 OpenClaw 的 Plugin
facade loaders 載入；直接從 `dist/extensions/...` 匯入會繞過 packaged installs 用於 plugin-owned code 的 manifest
與 runtime sidecar 檢查。

Provider plugins 可以在某個 helper 明確是供應商專用，且尚不屬於通用 SDK
子路徑時，公開狹窄的 plugin-local contract barrel。Bundled 範例：

- **Anthropic**：公開 `api.ts` / `contract-api.ts` 介面，用於 Claude
  beta-header 與 `service_tier` stream helpers。
- **`@openclaw/openai-provider`**：`api.ts` 匯出 provider builders、
  default-model helpers，以及 realtime provider builders。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出 provider builder
  以及 onboarding/config helpers。

<Warning>
  Extension production code 也應避免 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果某個 helper 確實是共用的，請將它提升到中立的 SDK 子路徑，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或另一個
  以能力為導向的介面，而不是將兩個 plugins 耦合在一起。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="進入點" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="設定與 config" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    Packaging、manifests 與 config schemas。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試工具與 lint 規則。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用介面遷移。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入架構與 capability model。
  </Card>
</CardGroup>
