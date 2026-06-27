---
read_when:
    - 你正在為外掛撰寫測試
    - 你需要來自外掛 SDK 的測試工具
    - 你想了解隨附外掛的契約測試
sidebarTitle: Testing
summary: OpenClaw 外掛的測試工具與模式
title: 外掛測試
x-i18n:
    generated_at: "2026-06-27T19:50:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw 外掛的測試工具、模式與 lint 強制執行參考。

<Tip>
  **在找測試範例嗎？** how-to 指南包含完整測試範例：
  [通道外掛測試](/zh-TW/plugins/sdk-channel-plugins#step-6-test)和
  [提供者外掛測試](/zh-TW/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 測試工具

這些測試輔助子路徑是 OpenClaw 自有內建外掛測試的儲存庫本機原始碼進入點。它們不是第三方外掛的套件匯出，且可能會匯入 Vitest 或其他僅限儲存庫使用的測試相依套件。

**外掛 API mock 匯入：** `openclaw/plugin-sdk/plugin-test-api`

**代理程式執行階段合約匯入：** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**通道合約匯入：** `openclaw/plugin-sdk/channel-contract-testing`

**通道測試輔助工具匯入：** `openclaw/plugin-sdk/channel-test-helpers`

**通道目標測試匯入：** `openclaw/plugin-sdk/channel-target-testing`

**外掛合約匯入：** `openclaw/plugin-sdk/plugin-test-contracts`

**外掛執行階段測試匯入：** `openclaw/plugin-sdk/plugin-test-runtime`

**提供者合約匯入：** `openclaw/plugin-sdk/provider-test-contracts`

**提供者 HTTP mock 匯入：** `openclaw/plugin-sdk/provider-http-test-mocks`

**環境/網路測試匯入：** `openclaw/plugin-sdk/test-env`

**通用 fixture 匯入：** `openclaw/plugin-sdk/test-fixtures`

**節點內建 mock 匯入：** `openclaw/plugin-sdk/test-node-mocks`

在 OpenClaw 儲存庫內，新的內建外掛測試應優先使用下方聚焦的子路徑。寬泛的
`openclaw/plugin-sdk/testing` barrel 僅供舊版相容使用。
儲存庫防護機制會拒絕從 `plugin-sdk/testing` 和
`plugin-sdk/test-utils` 新增實際匯入；這些名稱僅作為相容性記錄測試的已棄用相容介面保留。

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### 可用匯出

| 匯出                                                 | 用途                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 建立最小外掛 API 模擬，用於直接註冊單元測試。從 `plugin-sdk/plugin-test-api` 匯入                                                     |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 原生代理執行階段配接器共用的驗證設定檔合約測試固定項。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 原生代理執行階段配接器共用的傳送抑制合約測試固定項。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                  |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 原生代理執行階段配接器共用的備援分類合約測試固定項。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                  |
| `createParameterFreeTool`                            | 建立原生執行階段合約測試的動態工具結構描述測試固定項。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                |
| `expectChannelInboundContextContract`                | 斷言頻道傳入內容脈絡形狀。從 `plugin-sdk/channel-contract-testing` 匯入                                                                 |
| `installChannelOutboundPayloadContractSuite`         | 安裝頻道傳出酬載合約案例。從 `plugin-sdk/channel-contract-testing` 匯入                                                                 |
| `createStartAccountContext`                          | 建立頻道帳號生命週期內容脈絡。從 `plugin-sdk/channel-test-helpers` 匯入                                                                 |
| `installChannelActionsContractSuite`                 | 安裝通用頻道訊息動作合約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                 |
| `installChannelSetupContractSuite`                   | 安裝通用頻道設定合約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                     |
| `installChannelStatusContractSuite`                  | 安裝通用頻道狀態合約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                     |
| `expectDirectoryIds`                                 | 從目錄清單函式斷言頻道目錄 ID。從 `plugin-sdk/channel-test-helpers` 匯入                                                                |
| `assertBundledChannelEntries`                        | 斷言內建頻道進入點公開預期的公用合約。從 `plugin-sdk/channel-test-helpers` 匯入                                                        |
| `formatEnvelopeTimestamp`                            | 格式化確定性的信封時間戳記。從 `plugin-sdk/channel-test-helpers` 匯入                                                                   |
| `expectPairingReplyText`                             | 斷言頻道配對回覆文字並擷取其代碼。從 `plugin-sdk/channel-test-helpers` 匯入                                                            |
| `describePluginRegistrationContract`                 | 安裝外掛註冊合約檢查。從 `plugin-sdk/plugin-test-contracts` 匯入                                                                        |
| `registerSingleProviderPlugin`                       | 在載入器煙霧測試中註冊一個提供者外掛。從 `plugin-sdk/plugin-test-runtime` 匯入                                                         |
| `registerProviderPlugin`                             | 從一個外掛擷取所有提供者種類。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                  |
| `registerProviderPlugins`                            | 擷取多個外掛的提供者註冊。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                      |
| `requireRegisteredProvider`                          | 斷言提供者集合包含某個 ID。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                     |
| `createRuntimeEnv`                                   | 建立模擬的命令列介面/外掛執行階段環境。從 `plugin-sdk/plugin-test-runtime` 匯入                                                        |
| `createPluginSetupWizardStatus`                      | 為頻道外掛建立設定狀態輔助工具。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                |
| `describeOpenAIProviderRuntimeContract`              | 安裝提供者系列執行階段合約檢查。從 `plugin-sdk/provider-test-contracts` 匯入                                                           |
| `expectPassthroughReplayPolicy`                      | 斷言提供者重播原則會傳遞提供者擁有的工具與中繼資料。從 `plugin-sdk/provider-test-contracts` 匯入                                       |
| `runRealtimeSttLiveTest`                             | 使用共用音訊測試固定項執行即時 STT 提供者 live 測試。從 `plugin-sdk/provider-test-contracts` 匯入                                      |
| `normalizeTranscriptForMatch`                        | 在模糊斷言前正規化 live 逐字稿輸出。從 `plugin-sdk/provider-test-contracts` 匯入                                                       |
| `expectExplicitVideoGenerationCapabilities`          | 斷言影片提供者宣告明確的生成模式能力。從 `plugin-sdk/provider-test-contracts` 匯入                                                     |
| `expectExplicitMusicGenerationCapabilities`          | 斷言音樂提供者宣告明確的生成/編輯能力。從 `plugin-sdk/provider-test-contracts` 匯入                                                    |
| `mockSuccessfulDashscopeVideoTask`                   | 安裝成功的 DashScope 相容影片任務回應。從 `plugin-sdk/provider-test-contracts` 匯入                                                     |
| `getProviderHttpMocks`                               | 存取選擇啟用的提供者 HTTP/驗證 Vitest 模擬。從 `plugin-sdk/provider-http-test-mocks` 匯入                                              |
| `installProviderHttpMockCleanup`                     | 在每個測試後重設提供者 HTTP/驗證模擬。從 `plugin-sdk/provider-http-test-mocks` 匯入                                                    |
| `installCommonResolveTargetErrorCases`               | 目標解析錯誤處理的共用測試案例。從 `plugin-sdk/channel-target-testing` 匯入                                                            |
| `shouldAckReaction`                                  | 檢查頻道是否應加入確認反應。從 `plugin-sdk/channel-feedback` 匯入                                                                       |
| `removeAckReactionAfterReply`                        | 在回覆傳送後移除確認反應。從 `plugin-sdk/channel-feedback` 匯入                                                                         |
| `createTestRegistry`                                 | 建立頻道外掛登錄檔測試固定項。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                             |
| `createEmptyPluginRegistry`                          | 建立空的外掛登錄檔測試固定項。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                             |
| `setActivePluginRegistry`                            | 為外掛執行階段測試安裝登錄檔測試固定項。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                  |
| `createRequestCaptureJsonFetch`                      | 在媒體輔助工具測試中擷取 JSON fetch 請求。從 `plugin-sdk/test-env` 匯入                                                                 |
| `withServer`                                         | 針對可拋棄的本機 HTTP 伺服器執行測試。從 `plugin-sdk/test-env` 匯入                                                                     |
| `createMockIncomingRequest`                          | 建立最小傳入 HTTP 請求物件。從 `plugin-sdk/test-env` 匯入                                                                               |
| `withFetchPreconnect`                                | 在已安裝預先連線鉤子的情況下執行 fetch 測試。從 `plugin-sdk/test-env` 匯入                                                             |
| `withEnv` / `withEnvAsync`                           | 暫時修補環境變數。從 `plugin-sdk/test-env` 匯入                                                                                         |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 建立隔離的檔案系統測試固定項。從 `plugin-sdk/test-env` 匯入                                                                             |
| `createMockServerResponse`                           | 建立最小 HTTP 伺服器回應模擬。從 `plugin-sdk/test-env` 匯入                                                                             |
| `createCliRuntimeCapture`                            | 在測試中擷取命令列介面執行階段輸出。從 `plugin-sdk/test-fixtures` 匯入                                                                 |
| `importFreshModule`                                  | 使用新的查詢權杖匯入 ESM 模組，以略過模組快取。從 `plugin-sdk/test-fixtures` 匯入                                                      |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析內建外掛來源或 dist 測試固定項路徑。從 `plugin-sdk/test-fixtures` 匯入                                                              |
| `mockNodeBuiltinModule`                              | 安裝狹窄的節點內建 Vitest 模擬。從 `plugin-sdk/test-node-mocks` 匯入                                                                    |
| `createSandboxTestContext`                           | 建立沙箱測試內容脈絡。從 `plugin-sdk/test-fixtures` 匯入                                                                                |
| `writeSkill`                                         | 寫入 skill 測試固定項。從 `plugin-sdk/test-fixtures` 匯入                                                                                |
| `makeAgentAssistantMessage`                          | 建立代理逐字稿訊息測試固定項。從 `plugin-sdk/test-fixtures` 匯入                                                                        |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 檢查並重設系統事件測試固定項。從 `plugin-sdk/test-fixtures` 匯入                                                                        |
| `sanitizeTerminalText`                               | 清理終端機輸出以供斷言使用。從 `plugin-sdk/test-fixtures` 匯入                                                                          |
| `countLines` / `hasBalancedFences`                   | 斷言分塊輸出形狀。從 `plugin-sdk/test-fixtures` 匯入                                                                                    |
| `runProviderCatalog`                                 | 使用測試相依項執行提供者目錄鉤子                                                                                                       |
| `resolveProviderWizardOptions`                       | 在合約測試中解析提供者設定精靈選項                                                                                                     |
| `resolveProviderModelPickerEntries`                  | 在合約測試中解析提供者模型選擇器項目                                                                                                   |
| `buildProviderPluginMethodChoice`                    | 建立提供者精靈選項 ID 以供斷言使用                                                                                                     |
| `setProviderWizardProvidersResolverForTest`          | 為隔離測試注入提供者精靈提供者                                                                                                         |
| `createProviderUsageFetch`                           | 建立提供者使用量擷取測試資料                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 凍結並還原計時器，以用於時間敏感的測試。從 `plugin-sdk/test-env` 匯入                                                    |
| `createTestWizardPrompter`                           | 建立模擬的設定精靈提示器                                                                                                     |
| `createRuntimeTaskFlow`                              | 建立隔離的執行階段任務流程狀態                                                                                                  |
| `typedCases`                                         | 保留表格驅動測試的字面值型別。從 `plugin-sdk/test-fixtures` 匯入                                                    |

隨附外掛契約套件也會使用 SDK 測試子路徑，提供僅供測試使用的
註冊表、清單、公開成品與執行階段 fixture 輔助工具。僅核心使用、且依賴隨附
OpenClaw 清單的套件會保留在 `src/plugins/contracts` 下。
請將新的擴充功能測試放在已文件化且聚焦的 SDK 子路徑，例如
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、
`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures`，而不是直接匯入
寬泛的 `plugin-sdk/testing` 相容性 barrel、儲存庫 `src/**` 檔案，或儲存庫
`test/helpers/*` 橋接項目。

### 型別

聚焦的測試子路徑也會重新匯出測試檔案中實用的型別：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 測試目標解析

使用 `installCommonResolveTargetErrorCases` 為頻道目標解析新增標準錯誤案例：

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## 測試模式

### 測試註冊契約

將手寫的 `api` mock 傳給 `register(api)` 的單元測試，不會執行
OpenClaw 的載入器接受門檻。請為外掛依賴的每個註冊介面至少新增一個由載入器支援的煙霧測試，
特別是 hooks，以及記憶體等獨占能力。

當必要中繼資料缺失，或外掛呼叫了它不擁有的能力 API 時，真實載入器會讓外掛註冊失敗。
例如，`api.registerHook(...)` 需要 hook 名稱，而
`api.registerMemoryCapability(...)` 需要外掛清單或匯出的進入點宣告
`kind: "memory"`。

### 測試執行階段設定存取

測試隨附頻道外掛時，請優先使用來自 `openclaw/plugin-sdk/channel-test-helpers` 的共用外掛執行階段 mock。
其已棄用的 `runtime.config.loadConfig()` 與
`runtime.config.writeConfigFile(...)` mock 預設會拋出錯誤，讓測試能捕捉對相容性 API 的新使用。
只有在測試明確涵蓋舊版相容性行為時，才覆寫這些 mock。

### 單元測試頻道外掛

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### 單元測試提供者外掛

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### 模擬外掛執行階段

對於使用 `createPluginRuntimeStore` 的程式碼，請在測試中模擬執行階段：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### 使用個別實例 stub 測試

請優先使用個別實例 stub，而不是修改 prototype：

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契約測試（儲存庫內外掛）

隨附外掛有契約測試，用來驗證註冊所有權：

```bash
pnpm test -- src/plugins/contracts/
```

這些測試會斷言：

- 哪些外掛註冊哪些提供者
- 哪些外掛註冊哪些語音提供者
- 註冊形狀正確性
- 執行階段契約合規性

### 執行範圍測試

針對特定外掛：

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

僅執行契約測試：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint 強制規則（儲存庫內外掛）

儲存庫內外掛由 `pnpm check` 強制執行三項規則：

1. **禁止整體式根匯入** -- 會拒絕 `openclaw/plugin-sdk` 根 barrel
2. **禁止直接 `src/` 匯入** -- 外掛不能直接匯入 `../../src/`
3. **禁止自我匯入** -- 外掛不能匯入自己的 `plugin-sdk/<name>` 子路徑

外部外掛不受這些 lint 規則約束，但建議遵循相同模式。

## 測試設定

OpenClaw 使用 Vitest 搭配 V8 覆蓋率門檻。針對外掛測試：

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

如果本機執行造成記憶體壓力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相關內容

- [SDK 概觀](/zh-TW/plugins/sdk-overview) -- 匯入慣例
- [SDK 頻道外掛](/zh-TW/plugins/sdk-channel-plugins) -- 頻道外掛介面
- [SDK 提供者外掛](/zh-TW/plugins/sdk-provider-plugins) -- 提供者外掛 hooks
- [建置外掛](/zh-TW/plugins/building-plugins) -- 入門指南
