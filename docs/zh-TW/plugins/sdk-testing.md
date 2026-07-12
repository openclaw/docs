---
read_when:
    - 您正在為外掛撰寫測試
    - 你需要外掛 SDK 提供的測試工具
    - 你想了解內建外掛的契約測試
sidebarTitle: Testing
summary: OpenClaw 外掛的測試工具與模式
title: 外掛測試
x-i18n:
    generated_at: "2026-07-11T21:39:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw 外掛的測試公用工具、模式與 lint 強制規則參考。

<Tip>
  **正在尋找測試範例嗎？** 操作指南包含完整的測試範例：
  [頻道外掛測試](/zh-TW/plugins/sdk-channel-plugins#step-6-test)與
  [供應商外掛測試](/zh-TW/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 測試公用工具

這些子路徑是 OpenClaw 自有內建外掛測試所使用的儲存庫本機原始碼進入點。
它們並非提供給第三方外掛的已發布 `package.json` 匯出項目，且可能會匯入
Vitest 或其他僅限儲存庫使用的測試相依套件。

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

新的內建外掛測試應優先使用這些用途明確的子路徑。廣泛涵蓋的
`openclaw/plugin-sdk/testing` 彙總匯出與 `openclaw/plugin-sdk/test-utils` 別名
僅供舊版相容性使用：`pnpm run lint:plugins:no-extension-test-core-imports`
（`scripts/check-no-extension-test-core-imports.ts`）會拒絕擴充套件測試檔案新增
上述任一項目的匯入，而兩者也都僅保留供相容性記錄測試使用。

### 可用的匯出項目

| 匯出項目                                             | 用途                                                                                                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 建立最小化的外掛 API 模擬物件，用於直接註冊單元測試。從 `plugin-sdk/plugin-test-api` 匯入                                                   |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 原生代理程式執行階段配接器共用的驗證設定檔合約測試資料。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                   |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 原生代理程式執行階段配接器共用的傳遞抑制合約測試資料。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                     |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 原生代理程式執行階段配接器共用的後備分類合約測試資料。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                     |
| `createParameterFreeTool`                            | 建立動態工具結構描述測試資料，用於原生執行階段合約測試。從 `plugin-sdk/agent-runtime-test-contracts` 匯入                                  |
| `expectChannelInboundContextContract`                | 斷言頻道傳入內容的結構。從 `plugin-sdk/channel-contract-testing` 匯入                                                                         |
| `installChannelOutboundPayloadContractSuite`         | 安裝頻道傳出承載資料合約測試案例。從 `plugin-sdk/channel-contract-testing` 匯入                                                              |
| `createStartAccountContext`                          | 建立頻道帳號生命週期內容。從 `plugin-sdk/channel-test-helpers` 匯入                                                                            |
| `installChannelActionsContractSuite`                 | 安裝通用頻道訊息動作合約測試案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                   |
| `installChannelSetupContractSuite`                   | 安裝通用頻道設定合約測試案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                        |
| `installChannelStatusContractSuite`                  | 安裝通用頻道狀態合約測試案例。從 `plugin-sdk/channel-test-helpers` 匯入                                                                        |
| `expectDirectoryIds`                                 | 斷言目錄清單函式傳回的頻道目錄 ID。從 `plugin-sdk/channel-test-helpers` 匯入                                                                  |
| `assertBundledChannelEntries`                        | 斷言隨附頻道進入點公開預期的公用合約。從 `plugin-sdk/channel-test-helpers` 匯入                                                               |
| `formatEnvelopeTimestamp`                            | 格式化具確定性的信封時間戳記。從 `plugin-sdk/channel-test-helpers` 匯入                                                                        |
| `expectPairingReplyText`                             | 斷言頻道配對回覆文字並擷取其代碼。從 `plugin-sdk/channel-test-helpers` 匯入                                                                   |
| `describePluginRegistrationContract`                 | 安裝外掛註冊合約檢查。從 `plugin-sdk/plugin-test-contracts` 匯入                                                                               |
| `registerSingleProviderPlugin`                       | 在載入器冒煙測試中註冊一個供應商外掛。從 `plugin-sdk/plugin-test-runtime` 匯入                                                               |
| `registerProviderPlugin`                             | 從一個外掛擷取所有供應商類型。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                         |
| `registerProviderPlugins`                            | 擷取多個外掛的供應商註冊。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                             |
| `requireRegisteredProvider`                          | 斷言供應商集合包含指定 ID。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                            |
| `createRuntimeEnv`                                   | 建立模擬的命令列介面／外掛執行階段環境。從 `plugin-sdk/plugin-test-runtime` 匯入                                                             |
| `createPluginRuntimeMock`                            | 建立模擬的外掛執行階段介面。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                           |
| `createPluginSetupWizardStatus`                      | 建立頻道外掛的設定狀態輔助工具。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                       |
| `createTestWizardPrompter`                           | 建立模擬的設定精靈提示器。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                             |
| `createRuntimeTaskFlow`                              | 建立隔離的執行階段 TaskFlow 狀態。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                    |
| `runProviderCatalog`                                 | 使用測試相依項目執行供應商目錄鉤子。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                 |
| `resolveProviderWizardOptions`                       | 在合約測試中解析供應商設定精靈選項。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                  |
| `resolveProviderModelPickerEntries`                  | 在合約測試中解析供應商模型選擇器項目。從 `plugin-sdk/plugin-test-runtime` 匯入                                                               |
| `buildProviderPluginMethodChoice`                    | 建立供應商精靈選項 ID 以供斷言。從 `plugin-sdk/plugin-test-runtime` 匯入                                                                      |
| `setProviderWizardProvidersResolverForTest`          | 注入供應商精靈的供應商解析器，以進行隔離測試。從 `plugin-sdk/plugin-test-runtime` 匯入                                                       |
| `describeOpenAIProviderRuntimeContract`              | 安裝供應商系列執行階段合約檢查。從 `plugin-sdk/provider-test-contracts` 匯入                                                                  |
| `expectPassthroughReplayPolicy`                      | 斷言供應商重新播放政策會直接傳遞供應商所擁有的工具與中繼資料。從 `plugin-sdk/provider-test-contracts` 匯入                                 |
| `runRealtimeSttLiveTest`                             | 使用共用音訊測試資料執行即時 STT 供應商實況測試。從 `plugin-sdk/provider-test-contracts` 匯入                                              |
| `normalizeTranscriptForMatch`                        | 在模糊斷言前正規化實況逐字稿輸出。從 `plugin-sdk/provider-test-contracts` 匯入                                                               |
| `expectExplicitVideoGenerationCapabilities`          | 斷言影片供應商明確宣告生成模式功能。從 `plugin-sdk/provider-test-contracts` 匯入                                                             |
| `expectExplicitMusicGenerationCapabilities`          | 斷言音樂供應商明確宣告生成／編輯功能。從 `plugin-sdk/provider-test-contracts` 匯入                                                          |
| `mockSuccessfulDashscopeVideoTask`                   | 安裝成功的 DashScope 相容影片工作回應。從 `plugin-sdk/provider-test-contracts` 匯入                                                         |
| `getProviderHttpMocks`                               | 存取選擇啟用的供應商 HTTP／驗證 Vitest 模擬。從 `plugin-sdk/provider-http-test-mocks` 匯入                                                |
| `installProviderHttpMockCleanup`                     | 在每項測試後重設供應商 HTTP／驗證模擬。從 `plugin-sdk/provider-http-test-mocks` 匯入                                                       |
| `installCommonResolveTargetErrorCases`               | 用於處理目標解析錯誤的共用測試案例。從 `plugin-sdk/channel-target-testing` 匯入                                                              |
| `shouldAckReaction`                                  | 檢查頻道是否應新增確認反應。從 `plugin-sdk/channel-feedback` 匯入                                                                              |
| `removeAckReactionAfterReply`                        | 傳遞回覆後移除確認反應。從 `plugin-sdk/channel-feedback` 匯入                                                                                  |
| `createTestRegistry`                                 | 建立頻道外掛登錄檔測試資料。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                                |
| `createEmptyPluginRegistry`                          | 建立空白外掛登錄檔測試資料。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                               |
| `setActivePluginRegistry`                            | 為外掛執行階段測試安裝登錄檔測試資料。從 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 匯入                    |
| `createRequestCaptureJsonFetch`                      | 在媒體輔助工具測試中擷取 JSON 提取要求。從 `plugin-sdk/test-env` 匯入                                                                         |
| `withServer`                                         | 對可拋棄的本機 HTTP 伺服器執行測試。從 `plugin-sdk/test-env` 匯入                                                                              |
| `createMockIncomingRequest`                          | 建立最小化的 HTTP 傳入要求物件。從 `plugin-sdk/test-env` 匯入                                                                                  |
| `withFetchPreconnect`                                | 在安裝預先連線鉤子的情況下執行提取測試。從 `plugin-sdk/test-env` 匯入                                                                         |
| `withEnv` / `withEnvAsync`                           | 暫時修補環境變數。從 `plugin-sdk/test-env` 匯入                                                                                                |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 建立隔離的檔案系統測試資料。從 `plugin-sdk/test-env` 匯入                                                                                      |
| `createMockServerResponse`                           | 建立最小化的 HTTP 伺服器回應模擬。從 `plugin-sdk/test-env` 匯入                                                                                |
| `createProviderUsageFetch`                           | 建立供應商用量提取測試資料。從 `plugin-sdk/test-env` 匯入                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 凍結並還原計時器，以用於時間敏感測試。從 `plugin-sdk/test-env` 匯入                                                                            |
| `createCliRuntimeCapture`                            | 在測試中擷取命令列介面執行階段輸出。從 `plugin-sdk/test-fixtures` 匯入                                                                      |
| `importFreshModule`                                  | 使用新的查詢權杖匯入 ESM 模組，以略過模組快取。從 `plugin-sdk/test-fixtures` 匯入                                                           |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析隨附外掛的原始碼或發行版測試資料路徑。從 `plugin-sdk/test-fixtures` 匯入                                                                 |
| `mockNodeBuiltinModule`                              | 安裝範圍受限的 Node 內建 Vitest 模擬。從 `plugin-sdk/test-node-mocks` 匯入                                                                   |
| `createSandboxTestContext`                           | 建立沙箱測試內容。從 `plugin-sdk/test-fixtures` 匯入                                                                                           |
| `writeSkill`                                         | 寫入 Skills 測試資料。從 `plugin-sdk/test-fixtures` 匯入                                                                             |
| `makeAgentAssistantMessage`                          | 建立代理程式逐字稿訊息測試資料。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 檢查並重設系統事件測試資料。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `sanitizeTerminalText`                               | 清理終端輸出以供斷言使用。從 `plugin-sdk/test-fixtures` 匯入                                                          |
| `countLines` / `hasBalancedFences`                   | 斷言分塊輸出格式。從 `plugin-sdk/test-fixtures` 匯入                                                                     |
| `typedCases`                                         | 為表格驅動測試保留字面值型別。從 `plugin-sdk/test-fixtures` 匯入                                                    |

隨附外掛的契約測試套件也會使用這些 SDK 測試子路徑，取得僅供測試使用的登錄、資訊清單、公開成品及執行階段固定裝置輔助工具。
依賴隨附 OpenClaw 清單的核心專用測試套件則仍放在
`src/plugins/contracts` 下。

### 型別

專用測試子路徑也會重新匯出測試檔案中實用的型別：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 測試目標解析

使用 `installCommonResolveTargetErrorCases` 新增頻道目標解析的標準錯誤案例：

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // 您頻道的目標解析邏輯
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 新增頻道專屬的測試案例
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## 測試模式

### 測試註冊契約

將手寫的 `api` 模擬物件傳給 `register(api)` 的單元測試，不會執行 OpenClaw 載入器的驗收閘門。請為外掛所依賴的每個註冊介面，至少新增一個由載入器驅動的冒煙測試，尤其是鉤子和記憶體等獨佔能力。

缺少必要中繼資料，或外掛呼叫其不具所有權的能力 API 時，真正的載入器會讓外掛註冊失敗。例如，`api.registerHook(...)` 需要鉤子名稱，而 `api.registerMemoryCapability(...)` 則要求外掛資訊清單或匯出的進入點宣告 `kind: "memory"`。

### 測試執行階段設定存取

優先使用 `openclaw/plugin-sdk/plugin-test-runtime` 提供的共用外掛執行階段模擬物件。
其 `runtime.config.loadConfig()` 和 `runtime.config.writeConfigFile(...)`
模擬預設會擲回錯誤，讓測試能偵測到已棄用相容性 API 的新用法。只有在測試明確涵蓋舊版相容行為時，才覆寫這些模擬物件。

### 對頻道外掛進行單元測試

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
    // 不公開權杖值
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### 對提供者外掛進行單元測試

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... 情境
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
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
  errorMessage: "test runtime not set",
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

### 使用個別實例的樁件進行測試

優先使用個別實例的樁件，而非修改原型：

```typescript
// 建議：個別實例的樁件
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 避免：修改原型
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契約測試（儲存庫內外掛）

隨附外掛具有用來驗證註冊所有權的契約測試：

```bash
pnpm test src/plugins/contracts/
```

這些測試會驗證：

- 哪些外掛註冊哪些提供者
- 哪些外掛註冊哪些語音提供者
- 註冊結構的正確性
- 執行階段契約的合規性

### 執行限定範圍的測試

針對特定外掛：

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

僅執行契約測試：

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint 強制檢查（儲存庫內外掛）

`scripts/run-additional-boundary-checks.mjs` 會在 CI 中執行一組 `lint:plugins:*`
匯入邊界檢查；每項檢查也可以在本機獨立執行：

| 命令                                                           | 強制規則                                                                                                                   |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | 隨附外掛不可匯入整合式的 `openclaw/plugin-sdk` 根彙總模組。                                                               |
| `pnpm run lint:plugins:no-extension-src-imports`               | 生產環境的擴充功能檔案不可直接匯入儲存庫的 `src/**` 目錄樹（`../../src/...`）。                                            |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | 擴充功能測試檔案不可匯入 `openclaw/plugin-sdk/testing`、`plugin-sdk/test-utils` 或其他僅供核心使用的測試輔助工具。          |

外部外掛不受這些 Lint 規則約束，但仍建議遵循相同模式。

## 測試設定

OpenClaw 使用 Vitest 4，並提供僅供參考的 V8 覆蓋率報告。外掛測試的執行方式如下：

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

## 相關資源

- [SDK 概覽](/zh-TW/plugins/sdk-overview) -- 匯入慣例
- [SDK 頻道外掛](/zh-TW/plugins/sdk-channel-plugins) -- 頻道外掛介面
- [SDK 提供者外掛](/zh-TW/plugins/sdk-provider-plugins) -- 提供者外掛鉤子
- [建置外掛](/zh-TW/plugins/building-plugins) -- 入門指南
