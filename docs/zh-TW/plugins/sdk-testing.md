---
read_when:
    - 你正在為外掛撰寫測試
    - 你需要來自外掛 SDK 的測試工具
    - 你想了解隨附外掛的合約測試
sidebarTitle: Testing
summary: OpenClaw 外掛的測試工具與模式
title: 外掛測試
x-i18n:
    generated_at: "2026-07-05T11:33:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9837eae92abfc6e7e7ebc5802ddc7bf2f452140f34adca266c5c069fb927ffb9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw 外掛的測試工具、模式與 lint 強制規則參考。

<Tip>
  **在找測試範例嗎？** 操作指南包含完整測試範例：
  [通道外掛測試](/zh-TW/plugins/sdk-channel-plugins#step-6-test) 和
  [提供者外掛測試](/zh-TW/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 測試工具

這些子路徑是 OpenClaw 自有隨附外掛測試的儲存庫本機原始碼進入點。它們不是為第三方外掛發布的 `package.json` 匯出，且可能會匯入 Vitest 或其他僅限儲存庫使用的測試相依項。

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

新的隨附外掛測試應優先使用這些聚焦的子路徑。寬泛的 `openclaw/plugin-sdk/testing` 匯出入口和 `openclaw/plugin-sdk/test-utils` 別名僅供舊版相容性使用：`pnpm run lint:plugins:no-extension-test-core-imports`（`scripts/check-no-extension-test-core-imports.ts`）會拒絕在擴充功能測試檔案中新增對任一者的匯入，且兩者都只保留給相容性記錄測試使用。

### 可用的匯出

| 匯出                                               | 用途                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 建立最小外掛 API 模擬，用於直接註冊單元測試。請從 `plugin-sdk/plugin-test-api` 匯入                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 原生代理執行階段配接器的共用驗證設定檔合約測試夾具。請從 `plugin-sdk/agent-runtime-test-contracts` 匯入            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 原生代理執行階段配接器的共用傳遞抑制合約測試夾具。請從 `plugin-sdk/agent-runtime-test-contracts` 匯入    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 原生代理執行階段配接器的共用後援分類合約測試夾具。請從 `plugin-sdk/agent-runtime-test-contracts` 匯入 |
| `createParameterFreeTool`                            | 為原生執行階段合約測試建立動態工具 schema 測試夾具。請從 `plugin-sdk/agent-runtime-test-contracts` 匯入              |
| `expectChannelInboundContextContract`                | 斷言頻道傳入內容情境形狀。請從 `plugin-sdk/channel-contract-testing` 匯入                                                  |
| `installChannelOutboundPayloadContractSuite`         | 安裝頻道傳出承載合約案例。請從 `plugin-sdk/channel-contract-testing` 匯入                                       |
| `createStartAccountContext`                          | 建立頻道帳號生命週期內容情境。請從 `plugin-sdk/channel-test-helpers` 匯入                                                  |
| `installChannelActionsContractSuite`                 | 安裝通用頻道訊息動作合約案例。請從 `plugin-sdk/channel-test-helpers` 匯入                                     |
| `installChannelSetupContractSuite`                   | 安裝通用頻道設定合約案例。請從 `plugin-sdk/channel-test-helpers` 匯入                                              |
| `installChannelStatusContractSuite`                  | 安裝通用頻道狀態合約案例。請從 `plugin-sdk/channel-test-helpers` 匯入                                             |
| `expectDirectoryIds`                                 | 從目錄清單函式斷言頻道目錄 ID。請從 `plugin-sdk/channel-test-helpers` 匯入                               |
| `assertBundledChannelEntries`                        | 斷言隨附頻道進入點公開預期的公開合約。請從 `plugin-sdk/channel-test-helpers` 匯入                    |
| `formatEnvelopeTimestamp`                            | 格式化確定性的信封時間戳記。請從 `plugin-sdk/channel-test-helpers` 匯入                                                  |
| `expectPairingReplyText`                             | 斷言頻道配對回覆文字並擷取其代碼。請從 `plugin-sdk/channel-test-helpers` 匯入                                    |
| `describePluginRegistrationContract`                 | 安裝外掛註冊合約檢查。請從 `plugin-sdk/plugin-test-contracts` 匯入                                              |
| `registerSingleProviderPlugin`                       | 在載入器煙霧測試中註冊一個提供者外掛。請從 `plugin-sdk/plugin-test-runtime` 匯入                                         |
| `registerProviderPlugin`                             | 從一個外掛擷取所有提供者種類。請從 `plugin-sdk/plugin-test-runtime` 匯入                                                 |
| `registerProviderPlugins`                            | 跨多個外掛擷取提供者註冊。請從 `plugin-sdk/plugin-test-runtime` 匯入                                     |
| `requireRegisteredProvider`                          | 斷言提供者集合包含某個 ID。請從 `plugin-sdk/plugin-test-runtime` 匯入                                           |
| `createRuntimeEnv`                                   | 建立模擬的命令列介面/外掛執行階段環境。請從 `plugin-sdk/plugin-test-runtime` 匯入                                              |
| `createPluginRuntimeMock`                            | 建立模擬的外掛執行階段表面。請從 `plugin-sdk/plugin-test-runtime` 匯入                                                      |
| `createPluginSetupWizardStatus`                      | 為頻道外掛建立設定狀態輔助工具。請從 `plugin-sdk/plugin-test-runtime` 匯入                                             |
| `createTestWizardPrompter`                           | 建立模擬的設定精靈提示器。請從 `plugin-sdk/plugin-test-runtime` 匯入                                                       |
| `createRuntimeTaskFlow`                              | 建立隔離的執行階段 TaskFlow 狀態。請從 `plugin-sdk/plugin-test-runtime` 匯入                                                    |
| `runProviderCatalog`                                 | 使用測試相依項執行提供者目錄 hook。請從 `plugin-sdk/plugin-test-runtime` 匯入                                     |
| `resolveProviderWizardOptions`                       | 在合約測試中解析提供者設定精靈選項。請從 `plugin-sdk/plugin-test-runtime` 匯入                                    |
| `resolveProviderModelPickerEntries`                  | 在合約測試中解析提供者模型選擇器項目。請從 `plugin-sdk/plugin-test-runtime` 匯入                                    |
| `buildProviderPluginMethodChoice`                    | 建立提供者精靈選項 ID 以供斷言。請從 `plugin-sdk/plugin-test-runtime` 匯入                                            |
| `setProviderWizardProvidersResolverForTest`          | 為隔離測試注入提供者精靈提供者。請從 `plugin-sdk/plugin-test-runtime` 匯入                                        |
| `describeOpenAIProviderRuntimeContract`              | 安裝提供者系列執行階段合約檢查。請從 `plugin-sdk/provider-test-contracts` 匯入                                        |
| `expectPassthroughReplayPolicy`                      | 斷言提供者重播政策會傳遞提供者擁有的工具與中繼資料。請從 `plugin-sdk/provider-test-contracts` 匯入         |
| `runRealtimeSttLiveTest`                             | 使用共用音訊測試夾具執行即時 STT 提供者即時測試。請從 `plugin-sdk/provider-test-contracts` 匯入                       |
| `normalizeTranscriptForMatch`                        | 在模糊斷言前正規化即時逐字稿輸出。請從 `plugin-sdk/provider-test-contracts` 匯入                               |
| `expectExplicitVideoGenerationCapabilities`          | 斷言影片提供者宣告明確的生成模式能力。請從 `plugin-sdk/provider-test-contracts` 匯入                   |
| `expectExplicitMusicGenerationCapabilities`          | 斷言音樂提供者宣告明確的生成/編輯能力。請從 `plugin-sdk/provider-test-contracts` 匯入                   |
| `mockSuccessfulDashscopeVideoTask`                   | 安裝成功的 DashScope 相容影片任務回應。請從 `plugin-sdk/provider-test-contracts` 匯入                          |
| `getProviderHttpMocks`                               | 存取選擇加入的提供者 HTTP/驗證 Vitest 模擬。請從 `plugin-sdk/provider-http-test-mocks` 匯入                                         |
| `installProviderHttpMockCleanup`                     | 在每個測試後重設提供者 HTTP/驗證模擬。請從 `plugin-sdk/provider-http-test-mocks` 匯入                                        |
| `installCommonResolveTargetErrorCases`               | 目標解析錯誤處理的共用測試案例。請從 `plugin-sdk/channel-target-testing` 匯入                                  |
| `shouldAckReaction`                                  | 檢查頻道是否應新增確認反應。請從 `plugin-sdk/channel-feedback` 匯入                                            |
| `removeAckReactionAfterReply`                        | 在回覆傳遞後移除確認反應。請從 `plugin-sdk/channel-feedback` 匯入                                                      |
| `createTestRegistry`                                 | 建立頻道外掛登錄測試夾具。請從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入               |
| `createEmptyPluginRegistry`                          | 建立空的外掛登錄測試夾具。請從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                |
| `setActivePluginRegistry`                            | 為外掛執行階段測試安裝登錄測試夾具。請從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入   |
| `createRequestCaptureJsonFetch`                      | 在媒體輔助工具測試中擷取 JSON fetch 請求。請從 `plugin-sdk/test-env` 匯入                                                     |
| `withServer`                                         | 針對可拋棄的本機 HTTP 伺服器執行測試。請從 `plugin-sdk/test-env` 匯入                                                      |
| `createMockIncomingRequest`                          | 建立最小傳入 HTTP 請求物件。請從 `plugin-sdk/test-env` 匯入                                                          |
| `withFetchPreconnect`                                | 安裝預連線 hook 後執行 fetch 測試。請從 `plugin-sdk/test-env` 匯入                                                       |
| `withEnv` / `withEnvAsync`                           | 暫時修補環境變數。請從 `plugin-sdk/test-env` 匯入                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 建立隔離的檔案系統測試夾具。請從 `plugin-sdk/test-env` 匯入                                                              |
| `createMockServerResponse`                           | 建立最小 HTTP 伺服器回應模擬。請從 `plugin-sdk/test-env` 匯入                                                            |
| `createProviderUsageFetch`                           | 建立提供者用量 fetch 測試夾具。請從 `plugin-sdk/test-env` 匯入                                                                   |
| `useFrozenTime` / `useRealTime`                      | 為時間敏感測試凍結並還原計時器。請從 `plugin-sdk/test-env` 匯入                                                    |
| `createCliRuntimeCapture`                            | 在測試中擷取命令列介面執行階段輸出。請從 `plugin-sdk/test-fixtures` 匯入                                                              |
| `importFreshModule`                                  | 使用新的查詢權杖匯入 ESM 模組以略過模組快取。請從 `plugin-sdk/test-fixtures` 匯入                             |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析隨附外掛來源或 dist 測試夾具路徑。請從 `plugin-sdk/test-fixtures` 匯入                                              |
| `mockNodeBuiltinModule`                              | 安裝範圍狹窄的節點內建 Vitest 模擬。請從 `plugin-sdk/test-node-mocks` 匯入                                                       |
| `createSandboxTestContext`                           | 建立沙箱測試內容情境。請從 `plugin-sdk/test-fixtures` 匯入                                                                      |
| `writeSkill`                                         | 寫入 skill fixtures。從 `plugin-sdk/test-fixtures` 匯入                                                                             |
| `makeAgentAssistantMessage`                          | 建立 agent transcript message fixtures。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 檢查並重設 system event fixtures。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `sanitizeTerminalText`                               | 清理終端機輸出以供斷言使用。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `countLines` / `hasBalancedFences`                   | 斷言 chunking output shape。從 `plugin-sdk/test-fixtures` 匯入                                                                     |
| `typedCases`                                         | 為表格驅動測試保留字面型別。從 `plugin-sdk/test-fixtures` 匯入                                                    |

bundled 外掛契約套件也會使用這些 SDK 測試子路徑，作為
僅供測試的登錄檔、manifest、公開成品，以及執行階段 fixture 輔助工具。
只依賴 bundled OpenClaw 清單的核心專用套件則維持放在
`src/plugins/contracts` 底下。

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

使用 `installCommonResolveTargetErrorCases` 來加入頻道目標解析的標準錯誤案例：

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

將手寫的 `api` mock 傳給 `register(api)` 的單元測試，不會
執行 OpenClaw 的 loader 接受閘門。請為外掛依賴的每個註冊介面至少加入一個
由 loader 支援的煙霧測試，特別是 hooks 和 memory 這類獨占能力。

真正的 loader 會在必要 metadata 遺失，或外掛呼叫不屬於自己的能力 API 時，
讓外掛註冊失敗。例如，`api.registerHook(...)` 需要 hook 名稱，而
`api.registerMemoryCapability(...)` 需要外掛 manifest 或匯出的
entry 宣告 `kind: "memory"`。

### 測試執行階段設定存取

偏好使用來自 `openclaw/plugin-sdk/plugin-test-runtime` 的共用外掛執行階段 mock。
它的 `runtime.config.loadConfig()` 和 `runtime.config.writeConfigFile(...)`
mock 預設會拋出錯誤，因此測試能捕捉到對已棄用相容性 API 的新使用。
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

### 使用每個執行個體的 stub 進行測試

偏好使用每個執行個體的 stub，而不是修改 prototype：

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契約測試（repo 內外掛）

Bundled 外掛有契約測試會驗證註冊所有權：

```bash
pnpm test src/plugins/contracts/
```

這些測試會斷言：

- 哪些外掛註冊哪些提供者
- 哪些外掛註冊哪些語音提供者
- 註冊形狀正確性
- 執行階段契約遵循狀況

### 執行限定範圍的測試

針對特定外掛：

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

僅針對契約測試：

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint 強制檢查（repo 內外掛）

`scripts/run-additional-boundary-checks.mjs` 會在 CI 中執行一組 `lint:plugins:*`
匯入邊界檢查；每項也都可以在本機獨立執行：

| 命令                                                        | 強制檢查                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Bundled 外掛不能匯入整體式 `openclaw/plugin-sdk` 根 barrel。                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Production extension 檔案不能直接匯入 repo `src/**` tree（`../../src/...`）。                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Extension 測試檔案不能匯入 `openclaw/plugin-sdk/testing`、`plugin-sdk/test-utils`，或其他核心專用測試輔助工具。 |

外部外掛不受這些 lint 規則約束，但建議遵循相同模式。

## 測試設定

OpenClaw 使用 Vitest 4 搭配 V8 覆蓋率門檻。對於外掛測試：

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

如果本機執行造成記憶體壓力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相關

- [SDK 概觀](/zh-TW/plugins/sdk-overview) -- 匯入慣例
- [SDK 頻道外掛](/zh-TW/plugins/sdk-channel-plugins) -- 頻道外掛介面
- [SDK 提供者外掛](/zh-TW/plugins/sdk-provider-plugins) -- 提供者外掛 hooks
- [建置外掛](/zh-TW/plugins/building-plugins) -- 入門指南
