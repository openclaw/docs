---
read_when:
    - 你正在為 Plugin 撰寫測試
    - 你需要 Plugin SDK 的測試工具
    - 你想了解隨附 Plugin 的合約測試
sidebarTitle: Testing
summary: OpenClaw Plugin 的測試工具與模式
title: Plugin 測試
x-i18n:
    generated_at: "2026-05-02T22:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin 測試工具、模式與 lint 強制規則的參考。

<Tip>
  **想找測試範例嗎？** 操作指南包含完整的測試範例：
  [頻道 Plugin 測試](/zh-TW/plugins/sdk-channel-plugins#step-6-test) 和
  [供應者 Plugin 測試](/zh-TW/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 測試工具

**Plugin API mock 匯入：** `openclaw/plugin-sdk/plugin-test-api`

**代理程式執行階段合約匯入：** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**頻道合約匯入：** `openclaw/plugin-sdk/channel-contract-testing`

**頻道測試輔助工具匯入：** `openclaw/plugin-sdk/channel-test-helpers`

**頻道目標測試匯入：** `openclaw/plugin-sdk/channel-target-testing`

**Plugin 合約匯入：** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin 執行階段測試匯入：** `openclaw/plugin-sdk/plugin-test-runtime`

**供應者合約匯入：** `openclaw/plugin-sdk/provider-test-contracts`

**供應者 HTTP mock 匯入：** `openclaw/plugin-sdk/provider-http-test-mocks`

**環境／網路測試匯入：** `openclaw/plugin-sdk/test-env`

**通用測試資料匯入：** `openclaw/plugin-sdk/test-fixtures`

**Node 內建 mock 匯入：** `openclaw/plugin-sdk/test-node-mocks`

新的 Plugin 測試請優先使用下方聚焦的子路徑。廣泛的
`openclaw/plugin-sdk/testing` barrel 僅用於舊版相容性。
Repo guardrails 會拒絕新的實際匯入來源使用 `plugin-sdk/testing` 和
`plugin-sdk/test-utils`；這些名稱僅保留作為外部 Plugin 和相容性記錄測試的已棄用相容介面。

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

### 可用的匯出項目

| 匯出項目                                             | 用途                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 為直接註冊單元測試建置最小 Plugin API mock。從 `plugin-sdk/plugin-test-api` 匯入                                                         |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 原生 agent 執行階段適配器的共用驗證設定檔合約測試夾具。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                 |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 原生 agent 執行階段適配器的共用傳遞抑制合約測試夾具。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                   |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 原生 agent 執行階段適配器的共用 fallback 分類合約測試夾具。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                             |
| `createParameterFreeTool`                            | 為原生執行階段合約測試建置動態工具 schema 測試夾具。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                    |
| `expectChannelInboundContextContract`                | 斷言頻道傳入內容脈絡形狀。從 `plugin-sdk/channel-contract-testing` 匯入                                                                   |
| `installChannelOutboundPayloadContractSuite`         | 安裝頻道傳出 payload 合約案例。從 `plugin-sdk/channel-contract-testing` 匯入                                                              |
| `createStartAccountContext`                          | 建置頻道帳號生命週期內容脈絡。從 `plugin-sdk/channel-test-helpers` 匯入                                                                  |
| `installChannelActionsContractSuite`                 | 安裝通用頻道訊息動作合約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                  |
| `installChannelSetupContractSuite`                   | 安裝通用頻道設定合約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                      |
| `installChannelStatusContractSuite`                  | 安裝通用頻道狀態合約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                      |
| `expectDirectoryIds`                                 | 從目錄清單函式斷言頻道目錄 ID。從 `plugin-sdk/channel-test-helpers` 匯入                                                                 |
| `assertBundledChannelEntries`                        | 斷言內建頻道進入點公開預期的公開合約。從 `plugin-sdk/channel-test-helpers` 匯入                                                          |
| `formatEnvelopeTimestamp`                            | 格式化確定性的 envelope 時間戳記。從 `plugin-sdk/channel-test-helpers` 匯入                                                              |
| `expectPairingReplyText`                             | 斷言頻道配對回覆文字並擷取其程式碼。從 `plugin-sdk/channel-test-helpers` 匯入                                                            |
| `describePluginRegistrationContract`                 | 安裝 Plugin 註冊合約檢查。從 `plugin-sdk/plugin-test-contracts` 匯入                                                                     |
| `registerSingleProviderPlugin`                       | 在 loader smoke 測試中註冊一個提供者 Plugin。從 `plugin-sdk/plugin-test-runtime` 匯入                                                    |
| `registerProviderPlugin`                             | 從一個 Plugin 擷取所有提供者種類。從 `plugin-sdk/plugin-test-runtime` 匯入                                                               |
| `registerProviderPlugins`                            | 擷取多個 Plugin 的提供者註冊。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                   |
| `requireRegisteredProvider`                          | 斷言提供者集合包含某個 ID。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                      |
| `createRuntimeEnv`                                   | 建置模擬的 CLI/Plugin 執行階段環境。從 `plugin-sdk/plugin-test-runtime` 匯入                                                             |
| `createPluginSetupWizardStatus`                      | 為頻道 Plugin 建置設定狀態輔助工具。從 `plugin-sdk/plugin-test-runtime` 匯入                                                             |
| `describeOpenAIProviderRuntimeContract`              | 安裝提供者系列執行階段合約檢查。從 `plugin-sdk/provider-test-contracts` 匯入                                                             |
| `expectPassthroughReplayPolicy`                      | 斷言提供者重播政策會透傳由提供者擁有的工具與中繼資料。從 `plugin-sdk/provider-test-contracts` 匯入                                       |
| `runRealtimeSttLiveTest`                             | 使用共用音訊測試夾具執行即時 STT 提供者 live 測試。從 `plugin-sdk/provider-test-contracts` 匯入                                          |
| `normalizeTranscriptForMatch`                        | 在模糊斷言前正規化 live 逐字稿輸出。從 `plugin-sdk/provider-test-contracts` 匯入                                                         |
| `expectExplicitVideoGenerationCapabilities`          | 斷言影片提供者宣告明確的生成模式能力。從 `plugin-sdk/provider-test-contracts` 匯入                                                       |
| `expectExplicitMusicGenerationCapabilities`          | 斷言音樂提供者宣告明確的生成/編輯能力。從 `plugin-sdk/provider-test-contracts` 匯入                                                      |
| `mockSuccessfulDashscopeVideoTask`                   | 安裝成功的 DashScope 相容影片任務回應。從 `plugin-sdk/provider-test-contracts` 匯入                                                      |
| `getProviderHttpMocks`                               | 存取選用的提供者 HTTP/驗證 Vitest mock。從 `plugin-sdk/provider-http-test-mocks` 匯入                                                    |
| `installProviderHttpMockCleanup`                     | 在每個測試後重設提供者 HTTP/驗證 mock。從 `plugin-sdk/provider-http-test-mocks` 匯入                                                     |
| `installCommonResolveTargetErrorCases`               | 目標解析錯誤處理的共用測試案例。從 `plugin-sdk/channel-target-testing` 匯入                                                              |
| `shouldAckReaction`                                  | 檢查頻道是否應加入 ack 反應。從 `plugin-sdk/channel-feedback` 匯入                                                                       |
| `removeAckReactionAfterReply`                        | 在回覆傳遞後移除 ack 反應。從 `plugin-sdk/channel-feedback` 匯入                                                                         |
| `createTestRegistry`                                 | 建置頻道 Plugin registry 測試夾具。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                         |
| `createEmptyPluginRegistry`                          | 建置空的 Plugin registry 測試夾具。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                         |
| `setActivePluginRegistry`                            | 為 Plugin 執行階段測試安裝 registry 測試夾具。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入              |
| `createRequestCaptureJsonFetch`                      | 在媒體輔助工具測試中擷取 JSON fetch 請求。從 `plugin-sdk/test-env` 匯入                                                                  |
| `withServer`                                         | 針對一次性本機 HTTP 伺服器執行測試。從 `plugin-sdk/test-env` 匯入                                                                        |
| `createMockIncomingRequest`                          | 建置最小傳入 HTTP 請求物件。從 `plugin-sdk/test-env` 匯入                                                                                |
| `withFetchPreconnect`                                | 在已安裝預連線 hook 的情況下執行 fetch 測試。從 `plugin-sdk/test-env` 匯入                                                               |
| `withEnv` / `withEnvAsync`                           | 暫時修補環境變數。從 `plugin-sdk/test-env` 匯入                                                                                          |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 建立隔離的檔案系統測試夾具。從 `plugin-sdk/test-env` 匯入                                                                                |
| `createMockServerResponse`                           | 建立最小 HTTP 伺服器回應 mock。從 `plugin-sdk/test-env` 匯入                                                                             |
| `createCliRuntimeCapture`                            | 在測試中擷取 CLI 執行階段輸出。從 `plugin-sdk/test-fixtures` 匯入                                                                        |
| `importFreshModule`                                  | 使用新的查詢 token 匯入 ESM 模組以略過模組快取。從 `plugin-sdk/test-fixtures` 匯入                                                       |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析內建 Plugin 原始碼或 dist 測試夾具路徑。從 `plugin-sdk/test-fixtures` 匯入                                                           |
| `mockNodeBuiltinModule`                              | 安裝窄範圍的 Node 內建 Vitest mock。從 `plugin-sdk/test-node-mocks` 匯入                                                                 |
| `createSandboxTestContext`                           | 建置 sandbox 測試內容脈絡。從 `plugin-sdk/test-fixtures` 匯入                                                                            |
| `writeSkill`                                         | 寫入 skill 測試夾具。從 `plugin-sdk/test-fixtures` 匯入                                                                                  |
| `makeAgentAssistantMessage`                          | 建置 agent 逐字稿訊息測試夾具。從 `plugin-sdk/test-fixtures` 匯入                                                                        |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 檢查並重設系統事件測試夾具。從 `plugin-sdk/test-fixtures` 匯入                                                                           |
| `sanitizeTerminalText`                               | 清理終端機輸出以用於斷言。從 `plugin-sdk/test-fixtures` 匯入                                                                             |
| `countLines` / `hasBalancedFences`                   | 斷言分塊輸出形狀。從 `plugin-sdk/test-fixtures` 匯入                                                                                     |
| `runProviderCatalog`                                 | 使用測試依賴項執行提供者目錄 hook                                                                                                       |
| `resolveProviderWizardOptions`                       | 在合約測試中解析提供者設定精靈選項                                                                                                      |
| `resolveProviderModelPickerEntries`                  | 在合約測試中解析提供者模型選擇器項目                                                                                                    |
| `buildProviderPluginMethodChoice`                    | 建置提供者精靈選項 ID 以用於斷言                                                                                                        |
| `setProviderWizardProvidersResolverForTest`          | 為隔離測試注入提供者精靈提供者                                                                                                          |
| `createProviderUsageFetch`                           | 建立提供者使用量擷取測試夾具                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 凍結並還原計時器，用於時間敏感的測試。從 `plugin-sdk/test-env` 匯入                                                    |
| `createTestWizardPrompter`                           | 建立模擬的設定精靈提示器                                                                                                     |
| `createRuntimeTaskFlow`                              | 建立隔離的執行階段任務流程狀態                                                                                                  |
| `typedCases`                                         | 保留表格驅動測試的字面值型別。從 `plugin-sdk/test-fixtures` 匯入                                                    |

Bundled-plugin 合約套件也會使用 SDK 測試子路徑，提供僅限測試使用的登錄、manifest、公開成品與執行階段 fixture 輔助工具。依賴 bundled OpenClaw 清單的僅核心套件會保留在 `src/plugins/contracts` 底下。新的擴充功能測試應放在已記錄且聚焦的 SDK 子路徑上，例如 `plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures`，而不是直接匯入範圍廣泛的 `plugin-sdk/testing` 相容性 barrel、repo `src/**` 檔案或 repo `test/helpers/*` 橋接。

### 型別

聚焦的測試子路徑也會重新匯出測試檔案中實用的型別：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 測試目標解析

使用 `installCommonResolveTargetErrorCases` 為頻道目標解析加入標準錯誤案例：

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

將手寫 `api` mock 傳給 `register(api)` 的單元測試，不會執行 OpenClaw 的載入器接受閘門。請為 Plugin 依賴的每個註冊介面至少加入一個由載入器支援的煙霧測試，特別是 hooks 以及像記憶體這類獨占能力。

當必要 metadata 缺失，或 Plugin 呼叫不屬於自己的能力 API 時，真正的載入器會讓 Plugin 註冊失敗。例如，`api.registerHook(...)` 需要 hook 名稱，而 `api.registerMemoryCapability(...)` 則需要 Plugin manifest 或匯出的進入點宣告 `kind: "memory"`。

### 測試執行階段設定存取

測試 bundled 頻道 Plugin 時，優先使用來自 `openclaw/plugin-sdk/channel-test-helpers` 的共用 Plugin 執行階段 mock。其已棄用的 `runtime.config.loadConfig()` 與 `runtime.config.writeConfigFile(...)` mock 預設會擲出錯誤，讓測試能捕捉相容性 API 的新用法。只有在測試明確涵蓋舊版相容性行為時，才覆寫這些 mock。

### 對頻道 Plugin 進行單元測試

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

### 對提供者 Plugin 進行單元測試

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

### 模擬 Plugin 執行階段

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

### 使用逐實例 stub 進行測試

優先使用逐實例 stub，而不是變更 prototype：

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 合約測試（repo 內 Plugin）

Bundled Plugin 具有合約測試，用來驗證註冊所有權：

```bash
pnpm test -- src/plugins/contracts/
```

這些測試會斷言：

- 哪些 Plugin 註冊哪些提供者
- 哪些 Plugin 註冊哪些語音提供者
- 註冊形狀正確性
- 執行階段合約遵循情況

### 執行範圍限定測試

針對特定 Plugin：

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

僅針對合約測試：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint 強制規則（repo 內 Plugin）

`pnpm check` 會針對 repo 內 Plugin 強制執行三項規則：

1. **禁止單體根匯入** -- 拒絕使用 `openclaw/plugin-sdk` 根 barrel
2. **禁止直接 `src/` 匯入** -- Plugin 不能直接匯入 `../../src/`
3. **禁止自我匯入** -- Plugin 不能匯入自己的 `plugin-sdk/<name>` 子路徑

外部 Plugin 不受這些 lint 規則約束，但建議遵循相同模式。

## 測試設定

OpenClaw 使用 Vitest 搭配 V8 覆蓋率門檻。針對 Plugin 測試：

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

## 相關

- [SDK 概覽](/zh-TW/plugins/sdk-overview) -- 匯入慣例
- [SDK 頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins) -- 頻道 Plugin 介面
- [SDK 提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins) -- 提供者 Plugin hook
- [建構 Plugin](/zh-TW/plugins/building-plugins) -- 入門指南
