---
read_when:
    - 你正在為一個 Plugin 撰寫測試
    - 你需要 Plugin SDK 中的測試工具
    - 您想了解隨附 Plugin 的契約測試
sidebarTitle: Testing
summary: OpenClaw Plugin 的測試工具與模式
title: Plugin 測試
x-i18n:
    generated_at: "2026-04-30T03:27:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin 的測試工具、模式與 lint 強制執行參考。

<Tip>
  **正在尋找測試範例？** 操作指南包含完整測試範例：
  [通道 Plugin 測試](/zh-TW/plugins/sdk-channel-plugins#step-6-test) 和
  [提供者 Plugin 測試](/zh-TW/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 測試工具

**Plugin API mock 匯入：** `openclaw/plugin-sdk/plugin-test-api`

**代理執行階段契約匯入：** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**通道契約匯入：** `openclaw/plugin-sdk/channel-contract-testing`

**通道測試輔助工具匯入：** `openclaw/plugin-sdk/channel-test-helpers`

**通道目標測試匯入：** `openclaw/plugin-sdk/channel-target-testing`

**Plugin 契約匯入：** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin 執行階段測試匯入：** `openclaw/plugin-sdk/plugin-test-runtime`

**提供者契約匯入：** `openclaw/plugin-sdk/provider-test-contracts`

**提供者 HTTP mock 匯入：** `openclaw/plugin-sdk/provider-http-test-mocks`

**環境/網路測試匯入：** `openclaw/plugin-sdk/test-env`

**通用 fixture 匯入：** `openclaw/plugin-sdk/test-fixtures`

**Node 內建 mock 匯入：** `openclaw/plugin-sdk/test-node-mocks`

新的 Plugin 測試請優先使用下方聚焦的子路徑。寬泛的
`openclaw/plugin-sdk/testing` barrel 僅供舊版相容性使用。
Repo 護欄會拒絕來自 `plugin-sdk/testing` 和
`plugin-sdk/test-utils` 的新實際匯入；這些名稱僅保留為外部 Plugin
與相容性記錄測試的已棄用相容性介面。

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

### 可用的匯出

| 匯出項目                                             | 用途                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 建立最小 Plugin API 模擬，用於直接註冊單元測試。從 `plugin-sdk/plugin-test-api` 匯入                                                     |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 原生代理程式執行階段配接器共用的驗證設定檔契約夾具。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                     |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 原生代理程式執行階段配接器共用的傳遞抑制契約夾具。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                       |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 原生代理程式執行階段配接器共用的備援分類契約夾具。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                       |
| `createParameterFreeTool`                            | 為原生執行階段契約測試建立動態工具結構描述夾具。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                         |
| `expectChannelInboundContextContract`                | 判斷通道入站內容的形狀。從 `plugin-sdk/channel-contract-testing` 匯入                                                                     |
| `installChannelOutboundPayloadContractSuite`         | 安裝通道出站承載契約案例。從 `plugin-sdk/channel-contract-testing` 匯入                                                                   |
| `createStartAccountContext`                          | 建立通道帳戶生命週期內容。從 `plugin-sdk/channel-test-helpers` 匯入                                                                      |
| `installChannelActionsContractSuite`                 | 安裝通用通道訊息動作契約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                  |
| `installChannelSetupContractSuite`                   | 安裝通用通道設定契約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                      |
| `installChannelStatusContractSuite`                  | 安裝通用通道狀態契約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                      |
| `expectDirectoryIds`                                 | 判斷目錄清單函式傳回的通道目錄 ID。從 `plugin-sdk/channel-test-helpers` 匯入                                                              |
| `assertBundledChannelEntries`                        | 判斷內建通道進入點會公開預期的公開契約。從 `plugin-sdk/channel-test-helpers` 匯入                                                        |
| `formatEnvelopeTimestamp`                            | 格式化決定性的信封時間戳記。從 `plugin-sdk/channel-test-helpers` 匯入                                                                    |
| `expectPairingReplyText`                             | 判斷通道配對回覆文字並擷取其代碼。從 `plugin-sdk/channel-test-helpers` 匯入                                                              |
| `describePluginRegistrationContract`                 | 安裝 Plugin 註冊契約檢查。從 `plugin-sdk/plugin-test-contracts` 匯入                                                                     |
| `registerSingleProviderPlugin`                       | 在載入器煙霧測試中註冊單一提供者 Plugin。從 `plugin-sdk/plugin-test-runtime` 匯入                                                        |
| `registerProviderPlugin`                             | 從單一 Plugin 擷取所有提供者種類。從 `plugin-sdk/plugin-test-runtime` 匯入                                                               |
| `registerProviderPlugins`                            | 跨多個 Plugin 擷取提供者註冊。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                   |
| `requireRegisteredProvider`                          | 判斷提供者集合包含某個 ID。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                      |
| `createRuntimeEnv`                                   | 建立模擬的 CLI/Plugin 執行階段環境。從 `plugin-sdk/plugin-test-runtime` 匯入                                                             |
| `createPluginSetupWizardStatus`                      | 為通道 Plugin 建立設定狀態輔助工具。從 `plugin-sdk/plugin-test-runtime` 匯入                                                             |
| `describeOpenAIProviderRuntimeContract`              | 安裝提供者系列執行階段契約檢查。從 `plugin-sdk/provider-test-contracts` 匯入                                                             |
| `expectPassthroughReplayPolicy`                      | 判斷提供者重播政策會傳遞由提供者擁有的工具與中繼資料。從 `plugin-sdk/provider-test-contracts` 匯入                                        |
| `runRealtimeSttLiveTest`                             | 使用共用音訊夾具執行即時 STT 提供者即時測試。從 `plugin-sdk/provider-test-contracts` 匯入                                                |
| `normalizeTranscriptForMatch`                        | 在模糊判斷前正規化即時轉錄輸出。從 `plugin-sdk/provider-test-contracts` 匯入                                                             |
| `expectExplicitVideoGenerationCapabilities`          | 判斷影片提供者宣告明確的生成模式功能。從 `plugin-sdk/provider-test-contracts` 匯入                                                       |
| `expectExplicitMusicGenerationCapabilities`          | 判斷音樂提供者宣告明確的生成/編輯功能。從 `plugin-sdk/provider-test-contracts` 匯入                                                      |
| `mockSuccessfulDashscopeVideoTask`                   | 安裝成功的 DashScope 相容影片任務回應。從 `plugin-sdk/provider-test-contracts` 匯入                                                       |
| `getProviderHttpMocks`                               | 存取選用的提供者 HTTP/驗證 Vitest 模擬。從 `plugin-sdk/provider-http-test-mocks` 匯入                                                     |
| `installProviderHttpMockCleanup`                     | 在每個測試後重設提供者 HTTP/驗證模擬。從 `plugin-sdk/provider-http-test-mocks` 匯入                                                       |
| `installCommonResolveTargetErrorCases`               | 目標解析錯誤處理的共用測試案例。從 `plugin-sdk/channel-target-testing` 匯入                                                              |
| `shouldAckReaction`                                  | 檢查通道是否應加入確認反應。從 `plugin-sdk/channel-feedback` 匯入                                                                        |
| `removeAckReactionAfterReply`                        | 在回覆傳遞後移除確認反應。從 `plugin-sdk/channel-feedback` 匯入                                                                          |
| `createTestRegistry`                                 | 建立通道 Plugin 登錄夾具。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                                  |
| `createEmptyPluginRegistry`                          | 建立空白 Plugin 登錄夾具。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                                  |
| `setActivePluginRegistry`                            | 為 Plugin 執行階段測試安裝登錄夾具。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                        |
| `createRequestCaptureJsonFetch`                      | 在媒體輔助工具測試中擷取 JSON fetch 請求。從 `plugin-sdk/test-env` 匯入                                                                  |
| `withServer`                                         | 對一次性本機 HTTP 伺服器執行測試。從 `plugin-sdk/test-env` 匯入                                                                          |
| `createMockIncomingRequest`                          | 建立最小傳入 HTTP 請求物件。從 `plugin-sdk/test-env` 匯入                                                                                |
| `withFetchPreconnect`                                | 在已安裝預先連線鉤子的情況下執行 fetch 測試。從 `plugin-sdk/test-env` 匯入                                                              |
| `withEnv` / `withEnvAsync`                           | 暫時修補環境變數。從 `plugin-sdk/test-env` 匯入                                                                                          |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 建立隔離的檔案系統測試夾具。從 `plugin-sdk/test-env` 匯入                                                                                |
| `createMockServerResponse`                           | 建立最小 HTTP 伺服器回應模擬。從 `plugin-sdk/test-env` 匯入                                                                              |
| `createCliRuntimeCapture`                            | 在測試中擷取 CLI 執行階段輸出。從 `plugin-sdk/test-fixtures` 匯入                                                                        |
| `importFreshModule`                                  | 使用新的查詢權杖匯入 ESM 模組以略過模組快取。從 `plugin-sdk/test-fixtures` 匯入                                                         |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析內建 Plugin 原始碼或 dist 夾具路徑。從 `plugin-sdk/test-fixtures` 匯入                                                               |
| `mockNodeBuiltinModule`                              | 安裝範圍狹窄的 Node 內建 Vitest 模擬。從 `plugin-sdk/test-node-mocks` 匯入                                                               |
| `createSandboxTestContext`                           | 建立沙盒測試內容。從 `plugin-sdk/test-fixtures` 匯入                                                                                     |
| `writeSkill`                                         | 寫入技能夾具。從 `plugin-sdk/test-fixtures` 匯入                                                                                         |
| `makeAgentAssistantMessage`                          | 建立代理程式轉錄訊息夾具。從 `plugin-sdk/test-fixtures` 匯入                                                                             |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 檢查並重設系統事件夾具。從 `plugin-sdk/test-fixtures` 匯入                                                                               |
| `sanitizeTerminalText`                               | 清理終端機輸出以供判斷。從 `plugin-sdk/test-fixtures` 匯入                                                                               |
| `countLines` / `hasBalancedFences`                   | 判斷分塊輸出的形狀。從 `plugin-sdk/test-fixtures` 匯入                                                                                   |
| `runProviderCatalog`                                 | 使用測試相依項執行提供者目錄鉤子                                                                                                        |
| `resolveProviderWizardOptions`                       | 在契約測試中解析提供者設定精靈選項                                                                                                      |
| `resolveProviderModelPickerEntries`                  | 在契約測試中解析提供者模型選擇器項目                                                                                                    |
| `buildProviderPluginMethodChoice`                    | 建立提供者精靈選項 ID 以供判斷                                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | 為隔離測試注入提供者精靈提供者                                                                                                          |
| `createProviderUsageFetch`                           | 建置提供者使用量擷取測試夾具                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 凍結並還原時間敏感測試的計時器。從 `plugin-sdk/test-env` 匯入                                                    |
| `createTestWizardPrompter`                           | 建置模擬的設定精靈提示器                                                                                                     |
| `createRuntimeTaskFlow`                              | 建立隔離的執行階段 TaskFlow 狀態                                                                                                  |
| `typedCases`                                         | 保留表格驅動測試的字面值型別。從 `plugin-sdk/test-fixtures` 匯入                                                    |

內建 Plugin 合約套件也會使用 SDK 測試子路徑，提供僅供測試使用的
registry、manifest、public-artifact 與 runtime fixture 輔助工具。僅限核心的
套件若依賴內建 OpenClaw inventory，則維持放在 `src/plugins/contracts` 下。
請將新的 extension 測試放在已記錄且聚焦的 SDK 子路徑，例如
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、
`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures`，而不是直接匯入
寬泛的 `plugin-sdk/testing` 相容性 barrel、repo `src/**` 檔案，或 repo
`test/helpers/*` 橋接工具。

### 型別

聚焦的測試子路徑也會重新匯出測試檔案中有用的型別：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 測試目標解析

使用 `installCommonResolveTargetErrorCases` 為 channel 目標解析新增標準錯誤案例：

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

### 測試註冊合約

將手寫的 `api` mock 傳給 `register(api)` 的單元測試，不會執行
OpenClaw loader 的接受閘門。請針對你的 Plugin 依賴的每個註冊表面，
至少新增一個由 loader 支援的煙霧測試，尤其是 hooks 與 memory 等
獨占 capability。

真正的 loader 會在缺少必要 metadata，或 Plugin 呼叫自己不擁有的
capability API 時，讓 Plugin 註冊失敗。例如，
`api.registerHook(...)` 需要 hook 名稱，而
`api.registerMemoryCapability(...)` 需要 Plugin manifest 或匯出的
entry 宣告 `kind: "memory"`。

### 測試 runtime 設定存取

測試內建 channel Plugin 時，優先使用來自 `openclaw/plugin-sdk/channel-test-helpers`
的共用 Plugin runtime mock。它已棄用的 `runtime.config.loadConfig()` 與
`runtime.config.writeConfigFile(...)` mock 預設會丟出錯誤，讓測試能捕捉到
相容性 API 的新用法。只有在測試明確涵蓋舊版相容性行為時，才覆寫這些 mock。

### 單元測試 channel Plugin

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

### 單元測試 provider Plugin

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

### Mock Plugin runtime

對於使用 `createPluginRuntimeStore` 的程式碼，請在測試中 mock runtime：

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

### 使用每個 instance 專屬 stub 進行測試

優先使用每個 instance 專屬 stub，而不是修改 prototype：

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 合約測試（repo 內 Plugin）

內建 Plugin 有合約測試，用來驗證註冊所有權：

```bash
pnpm test -- src/plugins/contracts/
```

這些測試會斷言：

- 哪些 Plugin 註冊哪些 provider
- 哪些 Plugin 註冊哪些 speech provider
- 註冊形狀的正確性
- Runtime 合約合規性

### 執行有範圍的測試

針對特定 Plugin：

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

僅執行合約測試：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint 強制規則（repo 內 Plugin）

`pnpm check` 會針對 repo 內 Plugin 強制執行三條規則：

1. **禁止單體 root 匯入** -- 會拒絕 `openclaw/plugin-sdk` root barrel
2. **禁止直接 `src/` 匯入** -- Plugin 不能直接匯入 `../../src/`
3. **禁止自我匯入** -- Plugin 不能匯入自己的 `plugin-sdk/<name>` 子路徑

外部 Plugin 不受這些 lint 規則限制，但建議遵循相同模式。

## 測試設定

OpenClaw 使用 Vitest 搭配 V8 coverage 閾值。Plugin 測試：

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

- [SDK 概覽](/zh-TW/plugins/sdk-overview) -- 匯入慣例
- [SDK Channel Plugin](/zh-TW/plugins/sdk-channel-plugins) -- channel Plugin 介面
- [SDK Provider Plugin](/zh-TW/plugins/sdk-provider-plugins) -- provider Plugin hooks
- [建置 Plugin](/zh-TW/plugins/building-plugins) -- 入門指南
