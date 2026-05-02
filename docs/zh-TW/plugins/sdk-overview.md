---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 您需要 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查詢特定的 SDK 匯出項目
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考與 SDK 架構
title: Plugin SDK 概覽
x-i18n:
    generated_at: "2026-05-02T02:56:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK 是 Plugin 與核心之間的型別化合約。此頁面是
**要匯入什麼**以及**可以註冊什麼**的參考資料。

<Note>
  此頁面適用於在 OpenClaw 內部使用 `openclaw/plugin-sdk/*` 的 Plugin 作者。對於想要透過 Gateway 執行代理程式的外部應用程式、腳本、儀表板、CI 工作和 IDE 擴充功能，請改用
  [OpenClaw App SDK](/zh-TW/concepts/openclaw-sdk) 和 `@openclaw/sdk` 套件。
</Note>

<Tip>
想找操作指南嗎？從[建置 Plugin](/zh-TW/plugins/building-plugins) 開始；通道 Plugin 請使用[通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)，供應者 Plugin 請使用[供應者 Plugin](/zh-TW/plugins/sdk-provider-plugins)，工具或生命週期 hook Plugin 請使用 [Plugin hooks](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定子路徑匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個子路徑都是小型且自包含的模組。這能讓啟動保持快速，並
避免循環依賴問題。對於通道專屬的進入點/建置輔助工具，
偏好使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給
更廣泛的總覽介面，以及像
`buildChannelConfigSchema` 這類共用輔助工具。

對於通道設定，請透過 `openclaw.plugin.json#channelConfigs` 發布通道擁有的 JSON Schema。`plugin-sdk/channel-config-schema`
子路徑用於共用 schema 基本元件和通用建構器。OpenClaw 的
內建 Plugin 使用 `plugin-sdk/bundled-channel-config-schema` 來保留
內建通道 schema。已棄用的相容性匯出仍保留在
`plugin-sdk/channel-config-schema-legacy`；這兩個內建 schema 子路徑都不是
新 Plugin 的模式。

<Warning>
  請勿匯入帶有供應者或通道品牌的便利接縫（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  內建 Plugin 會在自己的 `api.ts` /
  `runtime-api.ts` barrel 中組合通用 SDK 子路徑；核心消費者應使用這些 Plugin 本地
  barrel，或在需求確實跨通道時新增狹窄的通用 SDK 合約。

少量內建 Plugin 輔助接縫在有追蹤到擁有者使用情況時，仍會出現在產生的匯出
對映中。它們僅供內建 Plugin
維護使用，不建議作為新的第三方
Plugin 的匯入路徑。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也
保留為已棄用的相容性 facade，供追蹤到的擁有者使用。請勿
將這些匯入路徑複製到新的 Plugin；請改用注入的執行階段輔助工具和
通用通道 SDK 子路徑。
</Warning>

## 子路徑參考

Plugin SDK 以一組依領域分組的狹窄子路徑公開（Plugin
進入點、通道、供應者、驗證、執行階段、能力、記憶體，以及保留的
內建 Plugin 輔助工具）。完整目錄按群組整理並附有連結，請參閱
[Plugin SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。

產生的 200 多個子路徑清單位於 `scripts/lib/plugin-sdk-entrypoints.json`。

## 註冊 API

`register(api)` 回呼會接收一個 `OpenClawPluginApi` 物件，其中包含這些
方法：

### 能力註冊

| 方法                                             | 註冊內容                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論 (LLM)                        |
| `api.registerAgentHarness(...)`                  | 實驗性低階代理程式執行器             |
| `api.registerCliBackend(...)`                    | 本機 CLI 推論後端                     |
| `api.registerChannel(...)`                       | 訊息通道                              |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT 合成                 |
| `api.registerRealtimeTranscriptionProvider(...)` | 串流即時轉錄                          |
| `api.registerRealtimeVoiceProvider(...)`         | 雙工即時語音工作階段                  |
| `api.registerMediaUnderstandingProvider(...)`    | 影像/音訊/影片分析                    |
| `api.registerImageGenerationProvider(...)`       | 影像生成                              |
| `api.registerMusicGenerationProvider(...)`       | 音樂生成                              |
| `api.registerVideoGenerationProvider(...)`       | 影片生成                              |
| `api.registerWebFetchProvider(...)`              | 網頁擷取 / 擷取供應者                 |
| `api.registerWebSearchProvider(...)`             | 網頁搜尋                              |

### 工具與命令

| 方法                           | 註冊內容                                      |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 代理程式工具（必要或 `{ optional: true }`）   |
| `api.registerCommand(def)`      | 自訂命令（繞過 LLM）                          |

當代理程式需要簡短、由命令擁有的路由提示時，Plugin 命令可以設定 `agentPromptGuidance`。請讓該文字聚焦於命令本身；不要將
供應者或 Plugin 專屬政策加入核心提示建構器。

### 基礎架構

| 方法                                           | 註冊內容                                |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件 hook                               |
| `api.registerHttpRoute(params)`                | Gateway HTTP 端點                       |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 方法                        |
| `api.registerGatewayDiscoveryService(service)` | 本機 Gateway 探索廣告器                 |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                              |
| `api.registerService(service)`                 | 背景服務                                |
| `api.registerInteractiveHandler(registration)` | 互動式處理器                            |
| `api.registerAgentToolResultMiddleware(...)`   | 執行階段工具結果中介軟體                |
| `api.registerMemoryPromptSupplement(builder)`  | 加成式記憶體相鄰提示區段                |
| `api.registerMemoryCorpusSupplement(adapter)`  | 加成式記憶體搜尋/讀取語料庫             |

### 工作流程 Plugin 的主機 hook

主機 hook 是需要參與主機生命週期的 Plugin 所使用的 SDK 接縫，而不只是新增供應者、通道或工具。它們是
通用合約；Plan Mode 可以使用它們，核准工作流程、
工作區政策閘門、背景監控器、設定精靈和 UI 伴隨
Plugin 也可以使用。

| 方法                                                                     | 它擁有的合約                                                                                                                        |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin 擁有、JSON 相容的工作階段狀態，透過 Gateway 工作階段投射                                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | 對單一工作階段下一個代理程式回合注入的持久、恰好一次內容                                                                            |
| `api.registerTrustedToolPolicy(...)`                                     | 可封鎖或重寫工具參數的內建/受信任預先 Plugin 工具政策                                                                               |
| `api.registerToolMetadata(...)`                                          | 不變更工具實作的工具目錄顯示中繼資料                                                                                                |
| `api.registerCommand(...)`                                               | 具範圍的 Plugin 命令；命令結果可以設定 `continueAgent: true`；Discord 原生命令支援 `descriptionLocalizations`                       |
| `api.registerControlUiDescriptor(...)`                                   | 工作階段、工具、執行或設定介面的 Control UI 貢獻描述元                                                                              |
| `api.registerRuntimeLifecycle(...)`                                      | 在重設/刪除/重新載入路徑上清理 Plugin 擁有執行階段資源的回呼                                                                        |
| `api.registerAgentEventSubscription(...)`                                | 用於工作流程狀態和監控器的已清理事件訂閱                                                                                            |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 每次執行的 Plugin 暫存狀態，會在終止執行生命週期時清除                                                                              |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin 擁有的工作階段排程器工作記錄，具決定性清理                                                                                   |

這些合約刻意拆分權限：

- 外部 Plugin 可以擁有工作階段擴充、UI 描述元、命令、工具
  中繼資料、下一回合注入和一般 hook。
- 受信任工具政策會在一般 `before_tool_call` hook 之前執行，並且
  僅限內建，因為它們參與主機安全政策。
- 保留命令所有權僅限內建。外部 Plugin 應使用自己的
  命令名稱或別名。
- `allowPromptInjection=false` 會停用會變更提示的 hook，包括
  `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、
  舊版 `before_agent_start` 的提示欄位，以及
  `enqueueNextTurnInjection`。

非 Plan 使用者範例：

| Plugin 原型                  | 使用的 hook                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 核准工作流程                 | 工作階段擴充、命令接續、下一回合注入、UI 描述元                                                                                      |
| 預算/工作區政策閘門          | 受信任工具政策、工具中繼資料、工作階段投射                                                                                           |
| 背景生命週期監控器           | 執行階段生命週期清理、代理程式事件訂閱、工作階段排程器所有權/清理、Heartbeat 提示貢獻、UI 描述元                                     |
| 設定或入門精靈               | 工作階段擴充、具範圍的命令、Control UI 描述元                                                                                        |

<Note>
  保留的核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）一律維持 `operator.admin`，即使 Plugin 嘗試指派
  較窄的 Gateway 方法範圍也一樣。Plugin 擁有的方法請偏好使用 Plugin 專屬前綴。
</Note>

<Accordion title="何時使用工具結果中介軟體">
  內建 Plugin 可以在需要於執行後、且執行階段將工具結果回饋給模型之前重寫工具結果時，使用 `api.registerAgentToolResultMiddleware(...)`。這是供 tokenjuice 這類非同步輸出縮減器使用的受信任、執行階段中立
  接縫。

內建 Plugin 必須為每個目標執行階段宣告 `contracts.agentToolResultMiddleware`，
例如 `["pi", "codex"]`。外部 Plugin
不能註冊此中介軟體；對於不需要模型前工具結果時序的工作，請保留使用一般 OpenClaw Plugin hook。舊的僅限 Pi 的嵌入式
擴充功能工廠註冊路徑已移除。
</Accordion>

### Gateway 探索註冊

`api.registerGatewayDiscoveryService(...)` 可讓 Plugin 在 mDNS/Bonjour 等本機探索傳輸上宣告作用中的
Gateway。啟用本機探索時，OpenClaw 會在 Gateway 啟動期間呼叫該服務、傳入目前的 Gateway 連接埠與非機密的 TXT 提示資料，並在 Gateway 關閉期間呼叫傳回的
`stop` 處理常式。

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

Gateway 探索 Plugin 不得將宣告的 TXT 值視為機密或驗證資訊。探索只是路由提示；信任仍由 Gateway 驗證與 TLS 釘選負責。

### CLI 註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種最上層中繼資料：

- `commands`：由註冊器擁有的明確命令根
- `descriptors`：用於根 CLI 說明、路由，以及延遲 Plugin CLI 註冊的解析時命令描述元

如果你希望 Plugin 命令在一般根 CLI 路徑中保持延遲載入，請提供涵蓋該註冊器公開的每個最上層命令根的 `descriptors`。

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

只有在不需要延遲根 CLI 註冊時，才單獨使用 `commands`。該即時相容路徑仍受支援，但不會安裝以描述元為後盾、用於解析時延遲載入的預留位置。

### CLI 後端註冊

`api.registerCliBackend(...)` 可讓 Plugin 擁有本機 AI CLI 後端（例如 `codex-cli`）的預設設定。

- 後端 `id` 會成為模型參照中的提供者前綴，例如 `codex-cli/gpt-5`。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍然優先。OpenClaw 會在執行 CLI 前，將 `agents.defaults.cliBackends.<id>` 合併到 Plugin 預設值之上。
- 當後端需要在合併後進行相容性重寫時，請使用 `normalizeConfig`（例如正規化舊的旗標形狀）。

### 專屬插槽

| 方法                                       | 註冊內容                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine（同一時間只有一個作用中）。`assemble()` 回呼會接收 `availableTools` 與 `citationsMode`，讓引擎能調整提示新增內容。 |
| `api.registerMemoryCapability(capability)` | 統一記憶體能力                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | 記憶體提示區段建構器                                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶體清除計畫解析器                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | 記憶體執行階段配接器                                                                                                                                       |

### 記憶體嵌入配接器

| 方法                                           | 註冊內容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中 Plugin 的記憶體嵌入配接器 |

- `registerMemoryCapability` 是偏好的專屬記憶體 Plugin API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，讓配套 Plugin 能透過
  `openclaw/plugin-sdk/memory-host-core` 使用匯出的記憶體成品，而不是深入特定記憶體 Plugin 的私有配置。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是舊版相容的專屬記憶體 Plugin API。
- `MemoryFlushPlan.model` 可以將清除回合固定到確切的 `provider/model`
  參照，例如 `ollama/qwen3:8b`，而不繼承作用中的後援鏈。
- `registerMemoryEmbeddingProvider` 可讓作用中的記憶體 Plugin 註冊一個或多個嵌入配接器 ID（例如 `openai`、`gemini`，或自訂的 Plugin 定義 ID）。
- `agents.defaults.memorySearch.provider` 和
  `agents.defaults.memorySearch.fallback` 等使用者設定會依據那些已註冊的配接器 ID 解析。

### 事件與生命週期

| 方法                                         | 作用             |
| -------------------------------------------- | ---------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期 hook |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼     |

請參閱 [Plugin hooks](/zh-TW/plugins/hooks)，取得範例、常見 hook 名稱與防護語意。

### Hook 決策語意

- `before_tool_call`：傳回 `{ block: true }` 會終止處理。一旦任何處理常式設定它，較低優先順序的處理常式就會被略過。
- `before_tool_call`：傳回 `{ block: false }` 會被視為沒有決策（等同省略 `block`），而不是覆寫。
- `before_install`：傳回 `{ block: true }` 會終止處理。一旦任何處理常式設定它，較低優先順序的處理常式就會被略過。
- `before_install`：傳回 `{ block: false }` 會被視為沒有決策（等同省略 `block`），而不是覆寫。
- `reply_dispatch`：傳回 `{ handled: true, ... }` 會終止處理。一旦任何處理常式宣告處理派送，較低優先順序的處理常式與預設模型派送路徑就會被略過。
- `message_sending`：傳回 `{ cancel: true }` 會終止處理。一旦任何處理常式設定它，較低優先順序的處理常式就會被略過。
- `message_sending`：傳回 `{ cancel: false }` 會被視為沒有決策（等同省略 `cancel`），而不是覆寫。
- `message_received`：需要傳入執行緒/主題路由時，請使用型別化的 `threadId` 欄位。將 `metadata` 保留給通道特定的額外資料。
- `message_sending`：先使用型別化的 `replyToId` / `threadId` 路由欄位，再退回使用通道特定的 `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得 Gateway 擁有的啟動狀態，而不是依賴內部 `gateway:startup` hook。
- `cron_changed`：觀察 Gateway 擁有的 Cron 生命週期變更。同步外部喚醒排程器時，使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並讓 OpenClaw 成為到期檢查與執行的事實來源。

### API 物件欄位

| 欄位                     | 類型                      | 說明                                                                                   |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                              |
| `api.name`               | `string`                  | 顯示名稱                                                                               |
| `api.version`            | `string?`                 | Plugin 版本（選用）                                                                    |
| `api.description`        | `string?`                 | Plugin 說明（選用）                                                                    |
| `api.source`             | `string`                  | Plugin 來源路徑                                                                        |
| `api.rootDir`            | `string?`                 | Plugin 根目錄（選用）                                                                  |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為作用中的記憶體內執行階段快照）                                   |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的 Plugin 特定設定                                  |
| `api.runtime`            | `PluginRuntime`           | [執行階段協助程式](/zh-TW/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | 有範圍的記錄器（`debug`、`info`、`warn`、`error`）                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是完整進入點前的輕量啟動/設定視窗                      |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於 Plugin 根目錄的路徑                                                         |

## 內部模組慣例

在你的 Plugin 內，請使用本機 barrel 檔案進行內部匯入：

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  切勿在生產程式碼中透過 `openclaw/plugin-sdk/<your-plugin>`
  匯入你自己的 Plugin。請透過 `./api.ts` 或
  `./runtime-api.ts` 路由內部匯入。SDK 路徑僅是外部契約。
</Warning>

透過外觀載入的內建 Plugin 公開介面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`，以及類似的公開進入檔案）在 OpenClaw 已執行時，會偏好使用作用中的執行階段設定快照。如果尚未存在執行階段快照，則會退回使用磁碟上已解析的設定檔。
封裝後的內建 Plugin 外觀應透過 OpenClaw 的 Plugin 外觀載入器載入；直接從 `dist/extensions/...` 匯入會繞過封裝安裝用於 Plugin 擁有程式碼的資訊清單與執行階段 sidecar 檢查。

提供者 Plugin 可以公開狹窄的 Plugin 本機契約 barrel，供刻意限定提供者的協助程式使用，且該協助程式尚不屬於泛用 SDK 子路徑。內建範例：

- **Anthropic**：供 Claude beta-header 與 `service_tier` 串流協助程式使用的公開 `api.ts` / `contract-api.ts` seam。
- **`@openclaw/openai-provider`**：`api.ts` 匯出提供者建構器、預設模型協助程式，以及即時提供者建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出提供者建構器以及上手/設定協助程式。

<Warning>
  Extension 生產程式碼也應避免 `openclaw/plugin-sdk/<other-plugin>`
  匯入。如果協助程式確實共用，請將它提升到中立的 SDK 子路徑，例如
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或其他以能力為導向的介面，而不是將兩個 Plugin 耦合在一起。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="進入點" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="執行階段輔助工具" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="設定與配置" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、manifest 和配置 schema。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試工具程式與 lint 規則。
  </Card>
  <Card title="SDK 遷移" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用介面遷移。
  </Card>
  <Card title="Plugin 內部機制" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入的架構與 capability 模型。
  </Card>
</CardGroup>
