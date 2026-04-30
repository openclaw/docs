---
read_when:
    - 你需要知道要從哪個 SDK 子路徑匯入
    - 你想要 OpenClawPluginApi 上所有註冊方法的參考資料
    - 你正在查詢特定的 SDK 匯出項
sidebarTitle: Plugin SDK overview
summary: 匯入對應表、註冊 API 參考與 SDK 架構
title: Plugin SDK 概觀
x-i18n:
    generated_at: "2026-04-30T03:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK 是 plugins 與 core 之間的型別化合約。本頁是**要匯入什麼**以及**可以註冊什麼**的參考。

<Note>
  本頁適用於在 OpenClaw 內使用 `openclaw/plugin-sdk/*` 的 plugin 作者。對於想要透過 Gateway 執行 agents 的外部應用程式、scripts、dashboards、CI jobs 與 IDE extensions，請改用
  [OpenClaw App SDK](/zh-TW/concepts/openclaw-sdk) 與 `@openclaw/sdk` package。
</Note>

<Tip>
想找操作指南嗎？請從[建置 plugins](/zh-TW/plugins/building-plugins) 開始；channel plugins 請使用 [Channel plugins](/zh-TW/plugins/sdk-channel-plugins)，provider plugins 請使用 [Provider plugins](/zh-TW/plugins/sdk-provider-plugins)，tool 或 lifecycle hook plugins 請使用 [Plugin hooks](/zh-TW/plugins/hooks)。
</Tip>

## 匯入慣例

一律從特定 subpath 匯入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每個 subpath 都是小型、自包含的 module。這能讓啟動保持快速，並避免循環相依問題。對於 channel 專屬的 entry/build helpers，請優先使用 `openclaw/plugin-sdk/channel-core`；將 `openclaw/plugin-sdk/core` 保留給更廣泛的 umbrella surface，以及像 `buildChannelConfigSchema` 這類 shared helpers。

對於 channel config，請透過 `openclaw.plugin.json#channelConfigs` 發布 channel 擁有的 JSON Schema。`plugin-sdk/channel-config-schema` subpath 用於 shared schema primitives 與 generic builder。OpenClaw 內建 plugins 使用 `plugin-sdk/bundled-channel-config-schema` 來保留 bundled-channel schemas。已棄用的相容性 exports 仍保留在 `plugin-sdk/channel-config-schema-legacy`；這兩個 bundled schema subpath 都不是新 plugins 應採用的模式。

<Warning>
  不要匯入帶有 provider 或 channel 品牌名稱的便利 seams（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。Bundled plugins 會在自己的 `api.ts` / `runtime-api.ts` barrels 內組合 generic SDK subpaths；core consumers 應使用那些 plugin-local barrels，或在需求確實跨 channel 時新增狹窄的 generic SDK contract。

當一小組 bundled-plugin helper seams 具有已追蹤的 owner usage 時，仍會出現在產生的 export map 中。它們只用於 bundled-plugin 維護，不建議作為新的第三方 plugins 的 import paths。

`openclaw/plugin-sdk/discord` 與 `openclaw/plugin-sdk/telegram-account` 也保留為已棄用的相容性 facades，供已追蹤的 owner usage 使用。不要將這些 import paths 複製到新 plugins；請改用 injected runtime helpers 與 generic channel SDK subpaths。
</Warning>

## Subpath 參考

Plugin SDK 以一組依領域分組的狹窄 subpaths 公開（plugin entry、channel、provider、auth、runtime、capability、memory，以及保留的 bundled-plugin helpers）。完整目錄已分組並附連結，請參閱
[Plugin SDK subpaths](/zh-TW/plugins/sdk-subpaths)。

產生的 200+ subpaths 清單位於 `scripts/lib/plugin-sdk-entrypoints.json`。

## 註冊 API

`register(api)` callback 會收到包含以下 methods 的 `OpenClawPluginApi` 物件：

### Capability 註冊

| Method                                           | 註冊內容                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文字推論（LLM）                      |
| `api.registerAgentHarness(...)`                  | 實驗性低階 agent executor             |
| `api.registerCliBackend(...)`                    | 本機 CLI inference backend            |
| `api.registerChannel(...)`                       | Messaging channel                     |
| `api.registerSpeechProvider(...)`                | 文字轉語音 / STT synthesis            |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming 即時 transcription          |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex 即時 voice sessions            |
| `api.registerMediaUnderstandingProvider(...)`    | Image/audio/video 分析                |
| `api.registerImageGenerationProvider(...)`       | Image generation                      |
| `api.registerMusicGenerationProvider(...)`       | Music generation                      |
| `api.registerVideoGenerationProvider(...)`       | Video generation                      |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider           |
| `api.registerWebSearchProvider(...)`             | Web search                            |

### Tools 與 commands

| Method                          | 註冊內容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent tool（required 或 `{ optional: true }`） |
| `api.registerCommand(def)`      | Custom command（繞過 LLM）                    |

當 agent 需要一小段 command 擁有的 routing hint 時，Plugin commands 可以設定 `agentPromptGuidance`。請讓該文字聚焦於 command 本身；不要把 provider 或 plugin 專屬 policy 加到 core prompt builders。

### Infrastructure

| Method                                         | 註冊內容                                |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                      |
| `api.registerGatewayDiscoveryService(service)` | 本機 Gateway discovery advertiser       |
| `api.registerCli(registrar, opts?)`            | CLI subcommand                          |
| `api.registerService(service)`                 | Background service                      |
| `api.registerInteractiveHandler(registration)` | Interactive handler                     |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime tool-result middleware          |
| `api.registerMemoryPromptSupplement(builder)`  | Additive memory-adjacent prompt section |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additive memory search/read corpus      |

### Workflow plugins 的 host hooks

Host hooks 是供需要參與 host lifecycle，而不只是新增 provider、channel 或 tool 的 plugins 使用的 SDK seams。它們是 generic contracts；Plan Mode 可以使用它們，approval workflows、workspace policy gates、background monitors、setup wizards 與 UI companion plugins 也都可以使用。

| Method                                                                   | 擁有的 contract                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin 擁有、JSON-compatible 的 session state，透過 Gateway sessions 投射        |
| `api.enqueueNextTurnInjection(...)`                                      | Durable exactly-once context，注入到某個 session 的下一個 agent turn             |
| `api.registerTrustedToolPolicy(...)`                                     | Bundled/trusted pre-plugin tool policy，可封鎖或改寫 tool params                 |
| `api.registerToolMetadata(...)`                                          | Tool catalog display metadata，不改變 tool implementation                         |
| `api.registerCommand(...)`                                               | Scoped plugin commands；command results 可設定 `continueAgent: true`              |
| `api.registerControlUiDescriptor(...)`                                   | Session、tool、run 或 settings surfaces 的 Control UI contribution descriptors    |
| `api.registerRuntimeLifecycle(...)`                                      | Reset/delete/reload paths 上 plugin 擁有的 runtime resources cleanup callbacks    |
| `api.registerAgentEventSubscription(...)`                                | Workflow state 與 monitors 的 sanitized event subscriptions                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 每次 run 的 plugin scratch state，會在 terminal run lifecycle 時清除              |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin 擁有的 session scheduler job records，具 deterministic cleanup             |

這些 contracts 有意拆分 authority：

- External plugins 可以擁有 session extensions、UI descriptors、commands、tool metadata、next-turn injections 與一般 hooks。
- Trusted tool policies 會在一般 `before_tool_call` hooks 之前執行，且僅限 bundled，因為它們會參與 host safety policy。
- Reserved command ownership 僅限 bundled。External plugins 應使用自己的 command names 或 aliases。
- `allowPromptInjection=false` 會停用會改變 prompt 的 hooks，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、legacy `before_agent_start` 的 prompt fields，以及 `enqueueNextTurnInjection`。

非 Plan consumers 範例：

| Plugin archetype             | 使用的 hooks                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Approval workflow            | Session extension、command continuation、next-turn injection、UI descriptor                                                            |
| Budget/workspace policy gate | Trusted tool policy、tool metadata、session projection                                                                                 |
| Background lifecycle monitor | Runtime lifecycle cleanup、agent event subscription、session scheduler ownership/cleanup、heartbeat prompt contribution、UI descriptor |
| Setup 或 onboarding wizard   | Session extension、scoped commands、Control UI descriptor                                                                              |

<Note>
  保留的 core admin namespaces（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）一律保持 `operator.admin`，即使 plugin 嘗試指派較窄的 gateway method scope 也是如此。Plugin 擁有的 methods 請優先使用 plugin-specific prefixes。
</Note>

<Accordion title="何時使用 tool-result middleware">
  Bundled plugins 可以在需要於 execution 之後、runtime 將 tool result 回饋給 model 之前改寫 tool result 時，使用 `api.registerAgentToolResultMiddleware(...)`。這是 async output reducers（例如 tokenjuice）的 trusted runtime-neutral seam。

Bundled plugins 必須為每個目標 runtime 宣告 `contracts.agentToolResultMiddleware`，例如 `["pi", "codex"]`。External plugins 無法註冊此 middleware；不需要 pre-model tool-result timing 的工作，請保留使用一般 OpenClaw plugin hooks。舊的 Pi-only embedded extension factory registration path 已移除。
</Accordion>

### Gateway discovery 註冊

`api.registerGatewayDiscoveryService(...)` 可讓 plugin 在本機 discovery transport（例如 mDNS/Bonjour）上宣告 active Gateway。當 local discovery 啟用時，OpenClaw 會在 Gateway startup 期間呼叫該 service、傳入目前 Gateway ports 與非秘密的 TXT hint data，並在 Gateway shutdown 期間呼叫回傳的 `stop` handler。

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

Gateway 探索 Plugin 不得將公告的 TXT 值視為祕密或驗證。探索是路由提示；Gateway 驗證與 TLS 釘選仍負責信任。

### CLI 註冊中繼資料

`api.registerCli(registrar, opts?)` 接受兩種頂層中繼資料：

- `commands`：由註冊器擁有的明確命令根
- `descriptors`：用於根 CLI 說明、路由，以及延遲 Plugin CLI 註冊的解析階段命令描述子

如果你希望 Plugin 命令在一般根 CLI 路徑中保持延遲載入，請提供涵蓋該註冊器公開的每個頂層命令根的 `descriptors`。

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

只有在不需要延遲根 CLI 註冊時，才單獨使用 `commands`。該急切相容路徑仍受支援，但它不會安裝由描述子支援、用於解析階段延遲載入的佔位項。

### CLI 後端註冊

`api.registerCliBackend(...)` 讓 Plugin 擁有本機 AI CLI 後端的預設設定，例如 `codex-cli`。

- 後端 `id` 會成為模型參照中的提供者前綴，例如 `codex-cli/gpt-5`。
- 後端 `config` 使用與 `agents.defaults.cliBackends.<id>` 相同的形狀。
- 使用者設定仍然優先。OpenClaw 會先將 `agents.defaults.cliBackends.<id>` 合併到 Plugin 預設值之上，再執行 CLI。
- 當後端需要在合併後進行相容性重寫時，請使用 `normalizeConfig`（例如正規化舊旗標形狀）。

### 專屬插槽

| 方法                                       | 註冊內容                                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能啟用一個）。`assemble()` 回呼會收到 `availableTools` 和 `citationsMode`，讓引擎可以調整提示詞附加內容。 |
| `api.registerMemoryCapability(capability)` | 統一記憶體能力                                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | 記憶體提示詞區段建構器                                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | 記憶體清除計畫解析器                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | 記憶體執行階段配接器                                                                                                                                     |

### 記憶體嵌入配接器

| 方法                                           | 註冊內容                             |
| ---------------------------------------------- | ------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | 作用中 Plugin 的記憶體嵌入配接器 |

- `registerMemoryCapability` 是偏好的專屬記憶體 Plugin API。
- `registerMemoryCapability` 也可以公開 `publicArtifacts.listArtifacts(...)`，讓伴隨 Plugin 可透過 `openclaw/plugin-sdk/memory-host-core` 消費匯出的記憶體成品，而不是觸及特定記憶體 Plugin 的私有配置。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 是舊版相容的專屬記憶體 Plugin API。
- `MemoryFlushPlan.model` 可以將清除回合固定到精確的 `provider/model` 參照，例如 `ollama/qwen3:8b`，而不繼承作用中的後援鏈。
- `registerMemoryEmbeddingProvider` 讓作用中的記憶體 Plugin 註冊一個或多個嵌入配接器 ID（例如 `openai`、`gemini`，或自訂的 Plugin 定義 ID）。
- 使用者設定（例如 `agents.defaults.memorySearch.provider` 和 `agents.defaults.memorySearch.fallback`）會針對這些已註冊的配接器 ID 解析。

### 事件與生命週期

| 方法                                         | 功能             |
| -------------------------------------------- | ---------------- |
| `api.on(hookName, handler, opts?)`           | 型別化生命週期掛鉤 |
| `api.onConversationBindingResolved(handler)` | 對話繫結回呼     |

請參閱 [Plugin 掛鉤](/zh-TW/plugins/hooks)，了解範例、常見掛鉤名稱與防護語意。

### 掛鉤決策語意

- `before_tool_call`：回傳 `{ block: true }` 是終止決策。一旦任何處理器設定它，較低優先序的處理器就會被略過。
- `before_tool_call`：回傳 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `before_install`：回傳 `{ block: true }` 是終止決策。一旦任何處理器設定它，較低優先序的處理器就會被略過。
- `before_install`：回傳 `{ block: false }` 會被視為沒有決策（與省略 `block` 相同），而不是覆寫。
- `reply_dispatch`：回傳 `{ handled: true, ... }` 是終止決策。一旦任何處理器宣告已處理派送，較低優先序的處理器與預設模型派送路徑就會被略過。
- `message_sending`：回傳 `{ cancel: true }` 是終止決策。一旦任何處理器設定它，較低優先序的處理器就會被略過。
- `message_sending`：回傳 `{ cancel: false }` 會被視為沒有決策（與省略 `cancel` 相同），而不是覆寫。
- `message_received`：當你需要入站討論串/主題路由時，請使用型別化的 `threadId` 欄位。將 `metadata` 保留給通道特定的額外資訊。
- `message_sending`：先使用型別化的 `replyToId` / `threadId` 路由欄位，再退回到通道特定的 `metadata`。
- `gateway_start`：請使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 取得 Gateway 擁有的啟動狀態，而不是依賴內部 `gateway:startup` 掛鉤。
- `cron_changed`：觀察 Gateway 擁有的 Cron 生命週期變更。同步外部喚醒排程器時，請使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，並讓 OpenClaw 作為到期檢查與執行的真實來源。

### API 物件欄位

| 欄位                     | 型別                      | 說明                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin ID                                                                                  |
| `api.name`               | `string`                  | 顯示名稱                                                                                   |
| `api.version`            | `string?`                 | Plugin 版本（選用）                                                                        |
| `api.description`        | `string?`                 | Plugin 說明（選用）                                                                        |
| `api.source`             | `string`                  | Plugin 來源路徑                                                                            |
| `api.rootDir`            | `string?`                 | Plugin 根目錄（選用）                                                                      |
| `api.config`             | `OpenClawConfig`          | 目前設定快照（可用時為作用中的記憶體內執行階段快照）                                     |
| `api.pluginConfig`       | `Record<string, unknown>` | 來自 `plugins.entries.<id>.config` 的 Plugin 特定設定                                      |
| `api.runtime`            | `PluginRuntime`           | [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | 具作用域的記錄器（`debug`、`info`、`warn`、`error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 目前載入模式；`"setup-runtime"` 是輕量的完整進入點前啟動/設定窗口                         |
| `api.resolvePath(input)` | `(string) => string`      | 解析相對於 Plugin 根目錄的路徑                                                             |

## 內部模組慣例

在你的 Plugin 內，使用本機彙總檔進行內部匯入：

```
my-plugin/
  api.ts            # 外部消費者的公開匯出
  runtime-api.ts    # 僅供內部使用的執行階段匯出
  index.ts          # Plugin 進入點
  setup-entry.ts    # 輕量的僅設定進入點（選用）
```

<Warning>
  切勿在生產程式碼中透過 `openclaw/plugin-sdk/<your-plugin>` 匯入你自己的 Plugin。請透過 `./api.ts` 或 `./runtime-api.ts` 路由內部匯入。SDK 路徑僅是外部合約。
</Warning>

由外觀載入的內建 Plugin 公開介面（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts` 以及類似的公開進入檔）會在 OpenClaw 已執行時優先使用作用中的執行階段設定快照。如果尚未存在執行階段快照，它們會退回到磁碟上解析後的設定檔。封裝後的內建 Plugin 外觀應透過 OpenClaw 的 Plugin 外觀載入器載入；直接從 `dist/extensions/...` 匯入會略過封裝安裝用於 Plugin 擁有相依性的分階段執行階段相依鏡像。

當輔助工具刻意為提供者特定，且尚不屬於通用 SDK 子路徑時，提供者 Plugin 可以公開狹窄的 Plugin 本機合約彙總檔。內建範例：

- **Anthropic**：供 Claude beta-header 與 `service_tier` 串流輔助工具使用的公開 `api.ts` / `contract-api.ts` 介面。
- **`@openclaw/openai-provider`**：`api.ts` 匯出提供者建構器、預設模型輔助工具，以及即時提供者建構器。
- **`@openclaw/openrouter-provider`**：`api.ts` 匯出提供者建構器，以及上線導引/設定輔助工具。

<Warning>
  Extension 生產程式碼也應避免匯入 `openclaw/plugin-sdk/<other-plugin>`。如果輔助工具確實是共享的，請將它提升到中立的 SDK 子路徑，例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或另一個以能力為導向的介面，而不是將兩個 Plugin 耦合在一起。
</Warning>

## 相關內容

<CardGroup cols={2}>
  <Card title="進入點" icon="door-open" href="/zh-TW/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 選項。
  </Card>
  <Card title="執行階段輔助工具" icon="gears" href="/zh-TW/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空間參考。
  </Card>
  <Card title="設定與組態" icon="sliders" href="/zh-TW/plugins/sdk-setup">
    封裝、資訊清單與設定結構描述。
  </Card>
  <Card title="測試" icon="vial" href="/zh-TW/plugins/sdk-testing">
    測試工具與 lint 規則。
  </Card>
  <Card title="SDK 遷移" icon="arrows-turn-right" href="/zh-TW/plugins/sdk-migration">
    從已棄用介面遷移。
  </Card>
  <Card title="Plugin 內部架構" icon="diagram-project" href="/zh-TW/plugins/architecture">
    深入架構與能力模型。
  </Card>
</CardGroup>
