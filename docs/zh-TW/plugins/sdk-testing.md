---
read_when:
    - 你正在為外掛撰寫測試
    - 你需要外掛 SDK 的測試工具
    - 你想瞭解內建外掛的契約測試
sidebarTitle: Testing
summary: OpenClaw 外掛的測試工具與模式
title: 外掛測試
x-i18n:
    generated_at: "2026-07-16T11:56:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw 外掛的測試公用程式、模式與 lint 強制規則參考。

<Tip>
  **想找測試範例嗎？** 操作指南包含完整的測試範例：
  [頻道外掛測試](/zh-TW/plugins/sdk-channel-plugins#step-6-test)與
  [提供者外掛測試](/zh-TW/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 測試公用程式

這些子路徑是儲存庫本機的原始碼進入點，供 OpenClaw 自有的隨附
外掛測試使用。它們並非針對第三方外掛發布的 `package.json`
匯出項目，且可能匯入 Vitest 或其他僅供儲存庫使用的測試相依套件。

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

隨附外掛測試請使用這些特定子路徑。先前的
`openclaw/plugin-sdk/testing` 彙整匯出是儲存庫本機項目，不包含在已發布的
套件中，現已移除。舊版 `openclaw/plugin-sdk/test-utils`
別名仍僅供儲存庫本機使用；`pnpm run lint:plugins:no-extension-test-core-imports`
（`scripts/check-no-extension-test-core-imports.ts`）會拒絕新的擴充功能測試
匯入該別名。

### 可用的匯出項目

| 匯出項目                                               | 用途                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 建立最小化的外掛 API 模擬物件，用於直接註冊單元測試。從 `plugin-sdk/plugin-test-api` 匯入                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 原生代理程式執行階段配接器的共用認證設定檔合約測試資料。從 `plugin-sdk/agent-runtime-test-contracts` 匯入            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 原生代理程式執行階段配接器的共用傳遞抑制合約測試資料。從 `plugin-sdk/agent-runtime-test-contracts` 匯入    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 原生代理程式執行階段配接器的共用備援分類合約測試資料。從 `plugin-sdk/agent-runtime-test-contracts` 匯入 |
| `createParameterFreeTool`                            | 建立動態工具結構描述測試資料，用於原生執行階段合約測試。從 `plugin-sdk/agent-runtime-test-contracts` 匯入              |
| `expectChannelInboundContextContract`                | 驗證頻道傳入內容的形狀。從 `plugin-sdk/channel-contract-testing` 匯入                                                  |
| `installChannelOutboundPayloadContractSuite`         | 安裝頻道傳出承載資料合約測試案例。從 `plugin-sdk/channel-contract-testing` 匯入                                       |
| `createStartAccountContext`                          | 建立頻道帳號生命週期內容。從 `plugin-sdk/channel-test-helpers` 匯入                                                  |
| `installChannelActionsContractSuite`                 | 安裝通用頻道訊息動作合約測試案例。從 `plugin-sdk/channel-test-helpers` 匯入                                     |
| `installChannelSetupContractSuite`                   | 安裝通用頻道設定合約測試案例。從 `plugin-sdk/channel-test-helpers` 匯入                                              |
| `installChannelStatusContractSuite`                  | 安裝通用頻道狀態合約測試案例。從 `plugin-sdk/channel-test-helpers` 匯入                                             |
| `expectDirectoryIds`                                 | 根據目錄清單函式驗證頻道目錄 ID。從 `plugin-sdk/channel-test-helpers` 匯入                               |
| `assertBundledChannelEntries`                        | 驗證隨附頻道進入點公開預期的公用合約。從 `plugin-sdk/channel-test-helpers` 匯入                    |
| `formatEnvelopeTimestamp`                            | 格式化確定性的信封時間戳記。從 `plugin-sdk/channel-test-helpers` 匯入                                                  |
| `expectPairingReplyText`                             | 驗證頻道配對回覆文字並擷取其代碼。從 `plugin-sdk/channel-test-helpers` 匯入                                    |
| `describePluginRegistrationContract`                 | 安裝外掛註冊合約檢查。從 `plugin-sdk/plugin-test-contracts` 匯入                                              |
| `registerSingleProviderPlugin`                       | 在載入器煙霧測試中註冊一個供應商外掛。從 `plugin-sdk/plugin-test-runtime` 匯入                                         |
| `registerProviderPlugin`                             | 從一個外掛擷取所有供應商種類。從 `plugin-sdk/plugin-test-runtime` 匯入                                                 |
| `registerProviderPlugins`                            | 擷取多個外掛的供應商註冊。從 `plugin-sdk/plugin-test-runtime` 匯入                                     |
| `requireRegisteredProvider`                          | 驗證供應商集合包含某個 ID。從 `plugin-sdk/plugin-test-runtime` 匯入                                           |
| `createRuntimeEnv`                                   | 建立模擬的命令列介面／外掛執行階段環境。從 `plugin-sdk/plugin-test-runtime` 匯入                                              |
| `createPluginRuntimeMock`                            | 建立模擬的外掛執行階段介面。從 `plugin-sdk/plugin-test-runtime` 匯入                                                      |
| `createPluginSetupWizardStatus`                      | 建立頻道外掛的設定狀態輔助工具。從 `plugin-sdk/plugin-test-runtime` 匯入                                             |
| `createTestWizardPrompter`                           | 建立模擬的設定精靈提示器。從 `plugin-sdk/plugin-test-runtime` 匯入                                                       |
| `createRuntimeTaskFlow`                              | 建立隔離的執行階段任務流程狀態。從 `plugin-sdk/plugin-test-runtime` 匯入                                                    |
| `runProviderCatalog`                                 | 使用測試相依項目執行供應商目錄鉤子。從 `plugin-sdk/plugin-test-runtime` 匯入                                     |
| `resolveProviderWizardOptions`                       | 在合約測試中解析供應商設定精靈選項。從 `plugin-sdk/plugin-test-runtime` 匯入                                    |
| `resolveProviderModelPickerEntries`                  | 在合約測試中解析供應商模型選擇器項目。從 `plugin-sdk/plugin-test-runtime` 匯入                                    |
| `buildProviderPluginMethodChoice`                    | 建立供應商精靈選項 ID 以供驗證。從 `plugin-sdk/plugin-test-runtime` 匯入                                            |
| `setProviderWizardProvidersResolverForTest`          | 注入供應商精靈供應商，以進行隔離測試。從 `plugin-sdk/plugin-test-runtime` 匯入                                        |
| `describeOpenAIProviderRuntimeContract`              | 安裝供應商系列執行階段合約檢查。從 `plugin-sdk/provider-test-contracts` 匯入                                        |
| `expectPassthroughReplayPolicy`                      | 驗證供應商重播原則會傳遞供應商所擁有的工具與中繼資料。從 `plugin-sdk/provider-test-contracts` 匯入         |
| `runRealtimeSttLiveTest`                             | 使用共用音訊測試資料執行即時語音轉文字供應商測試。從 `plugin-sdk/provider-test-contracts` 匯入                       |
| `normalizeTranscriptForMatch`                        | 在模糊驗證前正規化即時逐字稿輸出。從 `plugin-sdk/provider-test-contracts` 匯入                               |
| `expectExplicitVideoGenerationCapabilities`          | 驗證影片供應商宣告明確的生成模式能力。從 `plugin-sdk/provider-test-contracts` 匯入                   |
| `expectExplicitMusicGenerationCapabilities`          | 驗證音樂供應商宣告明確的生成／編輯能力。從 `plugin-sdk/provider-test-contracts` 匯入                   |
| `mockSuccessfulDashscopeVideoTask`                   | 安裝成功的 DashScope 相容影片任務回應。從 `plugin-sdk/provider-test-contracts` 匯入                          |
| `getProviderHttpMocks`                               | 存取選擇啟用的供應商 HTTP／認證 Vitest 模擬物件。從 `plugin-sdk/provider-http-test-mocks` 匯入                                         |
| `installProviderHttpMockCleanup`                     | 在每個測試後重設供應商 HTTP／認證模擬物件。從 `plugin-sdk/provider-http-test-mocks` 匯入                                        |
| `installCommonResolveTargetErrorCases`               | 目標解析錯誤處理的共用測試案例。從 `plugin-sdk/channel-target-testing` 匯入                                  |
| `shouldAckReaction`                                  | 檢查頻道是否應新增確認反應。從 `plugin-sdk/channel-feedback` 匯入                                            |
| `removeAckReactionAfterReply`                        | 回覆傳遞後移除確認反應。從 `plugin-sdk/channel-feedback` 匯入                                                      |
| `createTestRegistry`                                 | 建立頻道外掛登錄檔測試資料。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入               |
| `createEmptyPluginRegistry`                          | 建立空白外掛登錄檔測試資料。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                |
| `setActivePluginRegistry`                            | 安裝外掛執行階段測試所需的登錄檔測試資料。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入   |
| `createRequestCaptureJsonFetch`                      | 在媒體輔助工具測試中擷取 JSON fetch 請求。從 `plugin-sdk/test-env` 匯入                                                     |
| `withServer`                                         | 對可拋棄的本機 HTTP 伺服器執行測試。從 `plugin-sdk/test-env` 匯入                                                      |
| `createMockIncomingRequest`                          | 建立最小化的傳入 HTTP 請求物件。從 `plugin-sdk/test-env` 匯入                                                          |
| `withFetchPreconnect`                                | 在已安裝預先連線鉤子的情況下執行 fetch 測試。從 `plugin-sdk/test-env` 匯入                                                       |
| `withEnv` / `withEnvAsync`                           | 暫時修補環境變數。從 `plugin-sdk/test-env` 匯入                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 建立隔離的檔案系統測試資料。從 `plugin-sdk/test-env` 匯入                                                              |
| `createMockServerResponse`                           | 建立最小化的 HTTP 伺服器回應模擬物件。從 `plugin-sdk/test-env` 匯入                                                            |
| `createProviderUsageFetch`                           | 建立供應商用量 fetch 測試資料。從 `plugin-sdk/test-env` 匯入                                                                   |
| `useFrozenTime` / `useRealTime`                      | 凍結並還原計時器，用於時間敏感的測試。從 `plugin-sdk/test-env` 匯入                                                    |
| `createCliRuntimeCapture`                            | 在測試中擷取命令列介面執行階段輸出。從 `plugin-sdk/test-fixtures` 匯入                                                              |
| `importFreshModule`                                  | 使用新的查詢權杖匯入 ESM 模組，以略過模組快取。從 `plugin-sdk/test-fixtures` 匯入                             |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析隨附外掛的原始碼或發行版測試資料路徑。從 `plugin-sdk/test-fixtures` 匯入                                              |
| `mockNodeBuiltinModule`                              | 安裝限定範圍的 Node 內建 Vitest 模擬物件。從 `plugin-sdk/test-node-mocks` 匯入                                                       |
| `createSandboxTestContext`                           | 建立沙箱測試內容。從 `plugin-sdk/test-fixtures` 匯入                                                                      |
| `writeSkill`                                         | 寫入技能測試資料。從 `plugin-sdk/test-fixtures` 匯入                                                                             |
| `makeAgentAssistantMessage`                          | 建立代理程式逐字稿訊息測試資料。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 檢查並重設系統事件測試資料。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `sanitizeTerminalText`                               | 清理終端機輸出以供驗證。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `countLines` / `hasBalancedFences`                   | 驗證分塊輸出形狀。從 `plugin-sdk/test-fixtures` 匯入                                                                     |
| `typedCases`                                         | 保留表格驅動測試的常值型別。從 `plugin-sdk/test-fixtures` 匯入                                                    |

隨附外掛合約測試套件也會使用這些 SDK 測試子路徑，取得
僅供測試使用的登錄檔、資訊清單、公用成品與執行階段測試資料輔助工具。
依賴隨附 OpenClaw 清單的核心專用測試套件則仍位於
`src/plugins/contracts`。

### 型別

專注測試子路徑也會重新匯出測試檔案中實用的型別：

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
      // 你的頻道目標解析邏輯
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 新增頻道專屬的測試案例
  it("應解析 @username 目標", () => {
    // ...
  });
});
```

## 測試模式

### 測試註冊合約

將手寫的 `api` 模擬物件傳給 `register(api)` 的單元測試，不會執行 OpenClaw 的載入器接受閘門。請為外掛依賴的每個註冊介面至少新增一項由載入器支援的冒煙測試，尤其是鉤子與記憶體等獨佔功能。

缺少必要的中繼資料，或外掛呼叫不屬於它的功能 API 時，實際載入器會使外掛註冊失敗。例如，`api.registerHook(...)` 需要鉤子名稱，而 `api.registerMemoryCapability(...)` 需要外掛資訊清單或匯出的進入點宣告 `kind: "memory"`。

### 測試執行階段設定存取

優先使用 `openclaw/plugin-sdk/plugin-test-runtime` 的共用外掛執行階段模擬物件。其 `runtime.config.loadConfig()` 和 `runtime.config.writeConfigFile(...)` 模擬物件預設會擲回錯誤，讓測試能偵測對已淘汰相容性 API 的新用法。只有在測試明確涵蓋舊版相容性行為時，才覆寫這些模擬物件。

### 對頻道外掛進行單元測試

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("應從設定解析帳號", () => {
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

  it("應在不具現化密鑰的情況下檢查帳號", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // 不公開權杖值
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### 對供應商外掛進行單元測試

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("應解析動態模型", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... 情境
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("API 金鑰可用時應傳回目錄", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... 情境
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
  errorMessage: "測試執行階段尚未設定",
});

// 在測試設定中
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... 其他模擬物件
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... 其他命名空間
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// 測試後
store.clearRuntime();
```

### 使用個別執行個體存根進行測試

優先使用個別執行個體存根，而非修改原型：

```typescript
// 建議：個別執行個體存根
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 避免：修改原型
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 合約測試（存放於存放庫內的外掛）

內建外掛具有驗證註冊所有權的合約測試：

```bash
pnpm test src/plugins/contracts/
```

這些測試會判定：

- 哪些外掛註冊哪些供應商
- 哪些外掛註冊哪些語音供應商
- 註冊形式的正確性
- 執行階段合約合規性

### 執行限定範圍的測試

針對特定外掛：

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

僅執行合約測試：

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint 強制檢查（存放於存放庫內的外掛）

`scripts/run-additional-boundary-checks.mjs` 會在 CI 中執行一組 `lint:plugins:*` 匯入邊界檢查；每項檢查也都可以在本機獨立執行：

| 命令                                                        | 強制規則                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | 內建外掛不得匯入整體式 `openclaw/plugin-sdk` 根彙總模組。             |
| `pnpm run lint:plugins:no-extension-src-imports`               | 正式環境的擴充套件檔案不得直接匯入存放庫的 `src/**` 樹狀結構（`../../src/...`）。 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | 擴充套件測試檔案不得匯入 `plugin-sdk/test-utils` 或其他僅供核心使用的測試輔助工具。 |

外部外掛不受這些 Lint 規則限制，但建議遵循相同模式。

## 測試設定

OpenClaw 使用 Vitest 4，並提供資訊用途的 V8 覆蓋率報告。針對外掛測試：

```bash
# 執行所有測試
pnpm test

# 執行特定外掛測試
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# 使用特定測試名稱篩選條件執行
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# 執行並產生覆蓋率
pnpm test:coverage
```

如果本機執行造成記憶體壓力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相關內容

- [SDK 概觀](/zh-TW/plugins/sdk-overview) -- 匯入慣例
- [SDK 頻道外掛](/zh-TW/plugins/sdk-channel-plugins) -- 頻道外掛介面
- [SDK 供應商外掛](/zh-TW/plugins/sdk-provider-plugins) -- 供應商外掛鉤子
- [建置外掛](/zh-TW/plugins/building-plugins) -- 入門指南
