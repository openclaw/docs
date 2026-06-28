---
read_when:
    - 你正在為外掛撰寫測試
    - 你需要外掛 SDK 的測試工具
    - 你想了解隨附外掛的契約測試
sidebarTitle: Testing
summary: OpenClaw 外掛的測試工具與模式
title: 外掛測試
x-i18n:
    generated_at: "2026-06-28T07:42:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw 外掛的測試工具、公用模式與 lint 強制規則參考。

<Tip>
  **正在尋找測試範例？** 操作指南包含完整測試範例：
  [頻道外掛測試](/zh-TW/plugins/sdk-channel-plugins#step-6-test)和
  [提供者外掛測試](/zh-TW/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 測試工具

這些測試輔助子路徑是 OpenClaw 自有內建外掛測試的 repo 本機原始碼進入點。它們不是第三方外掛的套件匯出，且可能匯入 Vitest 或其他僅限 repo 使用的測試相依項。

**外掛 API 模擬匯入：** `openclaw/plugin-sdk/plugin-test-api`

**代理程式執行階段合約匯入：** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**頻道合約匯入：** `openclaw/plugin-sdk/channel-contract-testing`

**頻道測試輔助工具匯入：** `openclaw/plugin-sdk/channel-test-helpers`

**頻道目標測試匯入：** `openclaw/plugin-sdk/channel-target-testing`

**外掛合約匯入：** `openclaw/plugin-sdk/plugin-test-contracts`

**外掛執行階段測試匯入：** `openclaw/plugin-sdk/plugin-test-runtime`

**提供者合約匯入：** `openclaw/plugin-sdk/provider-test-contracts`

**提供者 HTTP 模擬匯入：** `openclaw/plugin-sdk/provider-http-test-mocks`

**環境/網路測試匯入：** `openclaw/plugin-sdk/test-env`

**通用 fixture 匯入：** `openclaw/plugin-sdk/test-fixtures`

**Node 內建模組模擬匯入：** `openclaw/plugin-sdk/test-node-mocks`

在 OpenClaw repo 內，新的內建外掛測試請優先使用下列聚焦子路徑。廣泛的
`openclaw/plugin-sdk/testing` barrel 僅用於舊版相容性。
Repo 護欄會拒絕新的實際匯入使用 `plugin-sdk/testing` 和
`plugin-sdk/test-utils`；這些名稱僅作為已棄用的相容性介面保留給相容性記錄測試。

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

| 匯出                                               | 目的                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 建立最小外掛 API mock，用於直接註冊單元測試。從 `plugin-sdk/plugin-test-api` 匯入                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 原生代理程式執行階段配接器的共用驗證設定檔契約 fixture。從 `plugin-sdk/agent-runtime-test-contracts` 匯入            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 原生代理程式執行階段配接器的共用送達抑制契約 fixture。從 `plugin-sdk/agent-runtime-test-contracts` 匯入    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 原生代理程式執行階段配接器的共用後援分類契約 fixture。從 `plugin-sdk/agent-runtime-test-contracts` 匯入 |
| `createParameterFreeTool`                            | 建立原生執行階段契約測試的動態工具 schema fixture。從 `plugin-sdk/agent-runtime-test-contracts` 匯入              |
| `expectChannelInboundContextContract`                | 判斷通道傳入內容情境形狀。從 `plugin-sdk/channel-contract-testing` 匯入                                                  |
| `installChannelOutboundPayloadContractSuite`         | 安裝通道傳出 payload 契約案例。從 `plugin-sdk/channel-contract-testing` 匯入                                       |
| `createStartAccountContext`                          | 建立通道帳號生命週期內容情境。從 `plugin-sdk/channel-test-helpers` 匯入                                                  |
| `installChannelActionsContractSuite`                 | 安裝通用通道訊息動作契約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                     |
| `installChannelSetupContractSuite`                   | 安裝通用通道設定契約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                              |
| `installChannelStatusContractSuite`                  | 安裝通用通道狀態契約案例。從 `plugin-sdk/channel-test-helpers` 匯入                                             |
| `expectDirectoryIds`                                 | 從目錄列表函式判斷通道目錄 ID。從 `plugin-sdk/channel-test-helpers` 匯入                               |
| `assertBundledChannelEntries`                        | 判斷內建通道進入點公開預期的公開契約。從 `plugin-sdk/channel-test-helpers` 匯入                    |
| `formatEnvelopeTimestamp`                            | 格式化確定性的 envelope 時間戳記。從 `plugin-sdk/channel-test-helpers` 匯入                                                  |
| `expectPairingReplyText`                             | 判斷通道配對回覆文字並擷取其程式碼。從 `plugin-sdk/channel-test-helpers` 匯入                                    |
| `describePluginRegistrationContract`                 | 安裝外掛註冊契約檢查。從 `plugin-sdk/plugin-test-contracts` 匯入                                              |
| `registerSingleProviderPlugin`                       | 在載入器煙霧測試中註冊一個供應商外掛。從 `plugin-sdk/plugin-test-runtime` 匯入                                         |
| `registerProviderPlugin`                             | 從一個外掛擷取所有供應商種類。從 `plugin-sdk/plugin-test-runtime` 匯入                                                 |
| `registerProviderPlugins`                            | 跨多個外掛擷取供應商註冊。從 `plugin-sdk/plugin-test-runtime` 匯入                                     |
| `requireRegisteredProvider`                          | 判斷供應商集合包含某個 ID。從 `plugin-sdk/plugin-test-runtime` 匯入                                           |
| `createRuntimeEnv`                                   | 建立 mocked 命令列介面/外掛執行階段環境。從 `plugin-sdk/plugin-test-runtime` 匯入                                              |
| `createPluginRuntimeMock`                            | 建立 mocked 外掛執行階段介面。從 `plugin-sdk/plugin-test-runtime` 匯入                                                      |
| `createPluginSetupWizardStatus`                      | 為通道外掛建立設定狀態 helper。從 `plugin-sdk/plugin-test-runtime` 匯入                                             |
| `describeOpenAIProviderRuntimeContract`              | 安裝供應商家族執行階段契約檢查。從 `plugin-sdk/provider-test-contracts` 匯入                                        |
| `expectPassthroughReplayPolicy`                      | 判斷供應商重放政策會傳遞供應商擁有的工具與 metadata。從 `plugin-sdk/provider-test-contracts` 匯入         |
| `runRealtimeSttLiveTest`                             | 使用共用音訊 fixture 執行即時 STT 供應商即時測試。從 `plugin-sdk/provider-test-contracts` 匯入                       |
| `normalizeTranscriptForMatch`                        | 在模糊判斷前正規化即時逐字稿輸出。從 `plugin-sdk/provider-test-contracts` 匯入                               |
| `expectExplicitVideoGenerationCapabilities`          | 判斷影片供應商宣告明確的生成模式能力。從 `plugin-sdk/provider-test-contracts` 匯入                   |
| `expectExplicitMusicGenerationCapabilities`          | 判斷音樂供應商宣告明確的生成/編輯能力。從 `plugin-sdk/provider-test-contracts` 匯入                   |
| `mockSuccessfulDashscopeVideoTask`                   | 安裝成功的 DashScope 相容影片任務回應。從 `plugin-sdk/provider-test-contracts` 匯入                          |
| `getProviderHttpMocks`                               | 存取選擇啟用的供應商 HTTP/驗證 Vitest mock。從 `plugin-sdk/provider-http-test-mocks` 匯入                                         |
| `installProviderHttpMockCleanup`                     | 在每個測試後重設供應商 HTTP/驗證 mock。從 `plugin-sdk/provider-http-test-mocks` 匯入                                        |
| `installCommonResolveTargetErrorCases`               | 目標解析錯誤處理的共用測試案例。從 `plugin-sdk/channel-target-testing` 匯入                                  |
| `shouldAckReaction`                                  | 檢查通道是否應新增 ack reaction。從 `plugin-sdk/channel-feedback` 匯入                                            |
| `removeAckReactionAfterReply`                        | 在回覆送達後移除 ack reaction。從 `plugin-sdk/channel-feedback` 匯入                                                      |
| `createTestRegistry`                                 | 建立通道外掛 registry fixture。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入               |
| `createEmptyPluginRegistry`                          | 建立空的外掛 registry fixture。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                |
| `setActivePluginRegistry`                            | 為外掛執行階段測試安裝 registry fixture。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入   |
| `createRequestCaptureJsonFetch`                      | 在 media helper 測試中擷取 JSON fetch 請求。從 `plugin-sdk/test-env` 匯入                                                     |
| `withServer`                                         | 針對一次性本機 HTTP 伺服器執行測試。從 `plugin-sdk/test-env` 匯入                                                      |
| `createMockIncomingRequest`                          | 建立最小傳入 HTTP 請求物件。從 `plugin-sdk/test-env` 匯入                                                          |
| `withFetchPreconnect`                                | 在已安裝 preconnect hook 的情況下執行 fetch 測試。從 `plugin-sdk/test-env` 匯入                                                       |
| `withEnv` / `withEnvAsync`                           | 暫時修補環境變數。從 `plugin-sdk/test-env` 匯入                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 建立隔離的檔案系統測試 fixture。從 `plugin-sdk/test-env` 匯入                                                              |
| `createMockServerResponse`                           | 建立最小 HTTP 伺服器回應 mock。從 `plugin-sdk/test-env` 匯入                                                            |
| `createCliRuntimeCapture`                            | 在測試中擷取命令列介面執行階段輸出。從 `plugin-sdk/test-fixtures` 匯入                                                              |
| `importFreshModule`                                  | 使用新的查詢 token 匯入 ESM 模組以繞過模組快取。從 `plugin-sdk/test-fixtures` 匯入                             |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析內建外掛來源或 dist fixture 路徑。從 `plugin-sdk/test-fixtures` 匯入                                              |
| `mockNodeBuiltinModule`                              | 安裝狹窄的節點內建 Vitest mock。從 `plugin-sdk/test-node-mocks` 匯入                                                       |
| `createSandboxTestContext`                           | 建立 sandbox 測試內容情境。從 `plugin-sdk/test-fixtures` 匯入                                                                      |
| `writeSkill`                                         | 寫入 skill fixture。從 `plugin-sdk/test-fixtures` 匯入                                                                             |
| `makeAgentAssistantMessage`                          | 建立代理程式逐字稿訊息 fixture。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 檢查並重設系統事件 fixture。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `sanitizeTerminalText`                               | 清理終端機輸出以供判斷。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `countLines` / `hasBalancedFences`                   | 判斷分塊輸出形狀。從 `plugin-sdk/test-fixtures` 匯入                                                                     |
| `runProviderCatalog`                                 | 使用測試依賴項執行供應商 catalog hook                                                                                   |
| `resolveProviderWizardOptions`                       | 在契約測試中解析供應商設定精靈選項                                                                                  |
| `resolveProviderModelPickerEntries`                  | 在契約測試中解析供應商模型選擇器項目                                                                                  |
| `buildProviderPluginMethodChoice`                    | 建立供應商精靈選項 ID 以供判斷                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | 為隔離測試注入提供者精靈提供者                                                                                      |
| `createProviderUsageFetch`                           | 建立提供者使用量擷取測試夾具                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 為時間敏感測試凍結並還原計時器。從 `plugin-sdk/test-env` 匯入                                                    |
| `createTestWizardPrompter`                           | 建立模擬的設定精靈提示器                                                                                                     |
| `createRuntimeTaskFlow`                              | 建立隔離的執行階段 TaskFlow 狀態                                                                                                  |
| `typedCases`                                         | 保留表格驅動測試的字面值型別。從 `plugin-sdk/test-fixtures` 匯入                                                    |

Bundled-plugin 合約套件也會使用 SDK 測試子路徑，提供僅供測試使用的
registry、manifest、public-artifact 與 runtime fixture 輔助工具。僅核心的
套件若依賴 bundled OpenClaw 清單，會保留在 `src/plugins/contracts` 下。
請將新的擴充測試放在有文件記載且聚焦的 SDK 子路徑，例如
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、
`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures`，而不是直接匯入寬泛的
`plugin-sdk/testing` 相容性 barrel、repo `src/**` 檔案，或 repo
`test/helpers/*` 橋接。

### 型別

聚焦的測試子路徑也會重新匯出在測試檔案中實用的型別：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 測試目標解析

使用 `installCommonResolveTargetErrorCases` 來加入通道目標解析的標準錯誤案例：

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
OpenClaw 的載入器接受閘門。請為你的外掛依賴的每個註冊介面至少加入一個
由載入器支援的煙霧測試，尤其是 hooks 與 memory 這類獨占能力。

真正的載入器會在必要中繼資料缺失，或外掛呼叫其不擁有的能力 API 時，
讓外掛註冊失敗。例如，`api.registerHook(...)` 需要 hook 名稱，而
`api.registerMemoryCapability(...)` 需要外掛 manifest 或匯出的進入點宣告
`kind: "memory"`。

### 測試 runtime config 存取

優先使用 `openclaw/plugin-sdk/plugin-test-runtime` 提供的共享外掛 runtime mock。
其已棄用的 `runtime.config.loadConfig()` 與 `runtime.config.writeConfigFile(...)`
mock 預設會拋出錯誤，讓測試能捕捉相容性 API 的新用法。只有在測試明確涵蓋
舊版相容性行為時，才覆寫這些 mock。

### 單元測試通道外掛

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

### 單元測試 provider 外掛

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

### Mock 外掛 runtime

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

### 使用每個執行個體各自的 stub 進行測試

優先使用每個執行個體各自的 stub，而不是修改 prototype：

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 合約測試（repo 內外掛）

Bundled 外掛有合約測試，用來驗證註冊所有權：

```bash
pnpm test -- src/plugins/contracts/
```

這些測試會斷言：

- 哪些外掛註冊哪些 providers
- 哪些外掛註冊哪些 speech providers
- 註冊形狀正確性
- Runtime 合約合規性

### 執行範圍測試

針對特定外掛：

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

僅執行合約測試：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint 強制規則（repo 內外掛）

`pnpm check` 會針對 repo 內外掛強制執行三項規則：

1. **禁止單體根匯入** -- `openclaw/plugin-sdk` 根 barrel 會被拒絕
2. **禁止直接匯入 `src/`** -- 外掛不能直接匯入 `../../src/`
3. **禁止自我匯入** -- 外掛不能匯入自己的 `plugin-sdk/<name>` 子路徑

外部外掛不受這些 lint 規則限制，但建議遵循相同模式。

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

## 相關

- [SDK 概覽](/zh-TW/plugins/sdk-overview) -- 匯入慣例
- [SDK 通道外掛](/zh-TW/plugins/sdk-channel-plugins) -- 通道外掛介面
- [SDK Provider 外掛](/zh-TW/plugins/sdk-provider-plugins) -- provider 外掛 hooks
- [建置外掛](/zh-TW/plugins/building-plugins) -- 入門指南
