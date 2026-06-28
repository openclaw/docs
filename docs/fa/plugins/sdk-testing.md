---
read_when:
    - در حال نوشتن آزمایش‌ها برای یک Plugin هستید
    - به ابزارهای کمکی تست از SDK مربوط به Plugin نیاز دارید
    - می‌خواهید آزمون‌های قرارداد برای Pluginهای همراه را درک کنید
sidebarTitle: Testing
summary: ابزارها و الگوهای آزمون برای Pluginهای OpenClaw
title: آزمایش Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع ابزارهای تست، الگوها، و اعمال lint برای Pluginهای OpenClaw.

<Tip>
  **دنبال نمونه‌های تست هستید؟** راهنماهای چگونگی انجام کار شامل نمونه‌های تست کامل هستند:
  [تست‌های Plugin کانال](/fa/plugins/sdk-channel-plugins#step-6-test) و
  [تست‌های Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## ابزارهای تست

این زیرمسیرهای کمک‌کنندهٔ تست، نقطه‌های ورود منبع محلی مخزن برای تست‌های Pluginهای
باندل‌شدهٔ خود OpenClaw هستند. آن‌ها exportهای بسته برای Pluginهای شخص ثالث نیستند و
ممکن است Vitest یا وابستگی‌های تست مخصوص مخزن را import کنند.

**Import موک API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Import قرارداد زمان اجرای عامل:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import قرارداد کانال:** `openclaw/plugin-sdk/channel-contract-testing`

**Import کمک‌کنندهٔ تست کانال:** `openclaw/plugin-sdk/channel-test-helpers`

**Import تست هدف کانال:** `openclaw/plugin-sdk/channel-target-testing`

**Import قرارداد Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import تست زمان اجرای Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import قرارداد ارائه‌دهنده:** `openclaw/plugin-sdk/provider-test-contracts`

**Import موک HTTP ارائه‌دهنده:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import تست محیط/شبکه:** `openclaw/plugin-sdk/test-env`

**Import fixture عمومی:** `openclaw/plugin-sdk/test-fixtures`

**Import موک داخلی Node:** `openclaw/plugin-sdk/test-node-mocks`

در مخزن OpenClaw، برای تست‌های جدید Pluginهای باندل‌شده، زیرمسیرهای متمرکز زیر را ترجیح دهید.
barrel گستردهٔ
`openclaw/plugin-sdk/testing` فقط برای سازگاری قدیمی است.
گاردریل‌های مخزن، importهای واقعی جدید از `plugin-sdk/testing` و
`plugin-sdk/test-utils` را رد می‌کنند؛ این نام‌ها فقط به‌عنوان سطح‌های سازگاری منسوخ
برای تست‌های رکورد سازگاری باقی می‌مانند.

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

### exportهای موجود

| خروجی                                               | هدف                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | یک mock حداقلی از API مربوط به Plugin برای آزمون‌های واحد ثبت مستقیم بسازید. از `plugin-sdk/plugin-test-api` وارد کنید                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | fixture مشترک قرارداد نمایه احراز هویت برای آداپتورهای runtime عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | fixture مشترک قرارداد جلوگیری از تحویل پاسخ برای آداپتورهای runtime عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | fixture مشترک قرارداد دسته‌بندی fallback برای آداپتورهای runtime عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید |
| `createParameterFreeTool`                            | fixtureهای schema ابزار پویا را برای آزمون‌های قرارداد runtime بومی بسازید. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید              |
| `expectChannelInboundContextContract`                | شکل context ورودی کانال را assert کنید. از `plugin-sdk/channel-contract-testing` وارد کنید                                                  |
| `installChannelOutboundPayloadContractSuite`         | caseهای قرارداد payload خروجی کانال را نصب کنید. از `plugin-sdk/channel-contract-testing` وارد کنید                                       |
| `createStartAccountContext`                          | contextهای چرخه عمر حساب کانال را بسازید. از `plugin-sdk/channel-test-helpers` وارد کنید                                                  |
| `installChannelActionsContractSuite`                 | caseهای قرارداد عمومی action پیام کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                     |
| `installChannelSetupContractSuite`                   | caseهای قرارداد عمومی راه‌اندازی کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                              |
| `installChannelStatusContractSuite`                  | caseهای قرارداد عمومی وضعیت کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                             |
| `expectDirectoryIds`                                 | شناسه‌های دایرکتوری کانال را از یک تابع فهرست دایرکتوری assert کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                               |
| `assertBundledChannelEntries`                        | assert کنید که entrypointهای کانال bundled قرارداد عمومی مورد انتظار را expose می‌کنند. از `plugin-sdk/channel-test-helpers` وارد کنید                    |
| `formatEnvelopeTimestamp`                            | timestampهای envelope قطعی را قالب‌بندی کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                                  |
| `expectPairingReplyText`                             | متن پاسخ pairing کانال را assert کنید و کد آن را استخراج کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                    |
| `describePluginRegistrationContract`                 | بررسی‌های قرارداد ثبت Plugin را نصب کنید. از `plugin-sdk/plugin-test-contracts` وارد کنید                                              |
| `registerSingleProviderPlugin`                       | یک Plugin ارائه‌دهنده را در آزمون‌های smoke loader ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                         |
| `registerProviderPlugin`                             | همه نوع‌های ارائه‌دهنده را از یک Plugin capture کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                                 |
| `registerProviderPlugins`                            | ثبت‌های ارائه‌دهنده را در چند Plugin capture کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                     |
| `requireRegisteredProvider`                          | assert کنید که یک مجموعه ارائه‌دهنده شامل یک شناسه است. از `plugin-sdk/plugin-test-runtime` وارد کنید                                           |
| `createRuntimeEnv`                                   | یک محیط runtime شبیه‌سازی‌شده CLI/Plugin بسازید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                              |
| `createPluginRuntimeMock`                            | یک سطح runtime شبیه‌سازی‌شده Plugin بسازید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                                      |
| `createPluginSetupWizardStatus`                      | helperهای وضعیت راه‌اندازی را برای Pluginهای کانال بسازید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                             |
| `describeOpenAIProviderRuntimeContract`              | بررسی‌های قرارداد runtime خانواده ارائه‌دهنده را نصب کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                                        |
| `expectPassthroughReplayPolicy`                      | assert کنید که سیاست‌های replay ارائه‌دهنده، ابزارها و metadataهای متعلق به ارائه‌دهنده را بدون تغییر عبور می‌دهند. از `plugin-sdk/provider-test-contracts` وارد کنید         |
| `runRealtimeSttLiveTest`                             | یک آزمون live ارائه‌دهنده realtime STT را با fixtureهای صوتی مشترک اجرا کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                       |
| `normalizeTranscriptForMatch`                        | خروجی transcript live را پیش از assertهای fuzzy نرمال‌سازی کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                               |
| `expectExplicitVideoGenerationCapabilities`          | assert کنید که ارائه‌دهنده‌های ویدئو قابلیت‌های صریح حالت تولید را declare می‌کنند. از `plugin-sdk/provider-test-contracts` وارد کنید                   |
| `expectExplicitMusicGenerationCapabilities`          | assert کنید که ارائه‌دهنده‌های موسیقی قابلیت‌های صریح تولید/ویرایش را declare می‌کنند. از `plugin-sdk/provider-test-contracts` وارد کنید                   |
| `mockSuccessfulDashscopeVideoTask`                   | یک پاسخ موفق task ویدئویی سازگار با DashScope نصب کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                          |
| `getProviderHttpMocks`                               | به mockهای opt-in مربوط به HTTP/auth ارائه‌دهنده در Vitest دسترسی پیدا کنید. از `plugin-sdk/provider-http-test-mocks` وارد کنید                                         |
| `installProviderHttpMockCleanup`                     | پس از هر آزمون، mockهای HTTP/auth ارائه‌دهنده را reset کنید. از `plugin-sdk/provider-http-test-mocks` وارد کنید                                        |
| `installCommonResolveTargetErrorCases`               | caseهای آزمون مشترک برای رسیدگی به خطای resolve هدف. از `plugin-sdk/channel-target-testing` وارد کنید                                  |
| `shouldAckReaction`                                  | بررسی کنید آیا کانال باید یک واکنش ack اضافه کند. از `plugin-sdk/channel-feedback` وارد کنید                                            |
| `removeAckReactionAfterReply`                        | واکنش ack را پس از تحویل پاسخ حذف کنید. از `plugin-sdk/channel-feedback` وارد کنید                                                      |
| `createTestRegistry`                                 | یک fixture رجیستری Plugin کانال بسازید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید               |
| `createEmptyPluginRegistry`                          | یک fixture رجیستری خالی Plugin بسازید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید                |
| `setActivePluginRegistry`                            | یک fixture رجیستری را برای آزمون‌های runtime Plugin نصب کنید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید   |
| `createRequestCaptureJsonFetch`                      | درخواست‌های fetch مربوط به JSON را در آزمون‌های helper رسانه capture کنید. از `plugin-sdk/test-env` وارد کنید                                                     |
| `withServer`                                         | آزمون‌ها را در برابر یک سرور HTTP محلی یک‌بارمصرف اجرا کنید. از `plugin-sdk/test-env` وارد کنید                                                      |
| `createMockIncomingRequest`                          | یک شیء درخواست HTTP ورودی حداقلی بسازید. از `plugin-sdk/test-env` وارد کنید                                                          |
| `withFetchPreconnect`                                | آزمون‌های fetch را با hookهای preconnect نصب‌شده اجرا کنید. از `plugin-sdk/test-env` وارد کنید                                                       |
| `withEnv` / `withEnvAsync`                           | متغیرهای محیطی را به‌طور موقت patch کنید. از `plugin-sdk/test-env` وارد کنید                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | fixtureهای آزمون filesystem ایزوله بسازید. از `plugin-sdk/test-env` وارد کنید                                                              |
| `createMockServerResponse`                           | یک mock حداقلی پاسخ سرور HTTP بسازید. از `plugin-sdk/test-env` وارد کنید                                                            |
| `createCliRuntimeCapture`                            | خروجی runtime مربوط به CLI را در آزمون‌ها capture کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                              |
| `importFreshModule`                                  | یک ماژول ESM را با token query تازه وارد کنید تا cache ماژول دور زده شود. از `plugin-sdk/test-fixtures` وارد کنید                             |
| `bundledPluginRoot` / `bundledPluginFile`            | مسیرهای fixture مربوط به source یا dist برای Plugin bundled را resolve کنید. از `plugin-sdk/test-fixtures` وارد کنید                                              |
| `mockNodeBuiltinModule`                              | mockهای محدود Vitest برای builtinهای Node را نصب کنید. از `plugin-sdk/test-node-mocks` وارد کنید                                                       |
| `createSandboxTestContext`                           | contextهای آزمون sandbox را بسازید. از `plugin-sdk/test-fixtures` وارد کنید                                                                      |
| `writeSkill`                                         | fixtureهای skill را بنویسید. از `plugin-sdk/test-fixtures` وارد کنید                                                                             |
| `makeAgentAssistantMessage`                          | fixtureهای پیام transcript عامل را بسازید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | fixtureهای رویداد سیستم را inspect و reset کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `sanitizeTerminalText`                               | خروجی terminal را برای assertها sanitize کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `countLines` / `hasBalancedFences`                   | شکل خروجی chunking را assert کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                                     |
| `runProviderCatalog`                                 | یک hook کاتالوگ ارائه‌دهنده را با وابستگی‌های آزمون اجرا کنید                                                                                   |
| `resolveProviderWizardOptions`                       | انتخاب‌های wizard راه‌اندازی ارائه‌دهنده را در آزمون‌های قرارداد resolve کنید                                                                                  |
| `resolveProviderModelPickerEntries`                  | entryهای model-picker ارائه‌دهنده را در آزمون‌های قرارداد resolve کنید                                                                                  |
| `buildProviderPluginMethodChoice`                    | شناسه‌های انتخاب wizard ارائه‌دهنده را برای assertها بسازید                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | ارائه‌دهندگان جادوگر ارائه‌دهنده را برای آزمون‌های ایزوله تزریق می‌کند                                                                                      |
| `createProviderUsageFetch`                           | فیکسچرهای واکشی مصرف ارائه‌دهنده را می‌سازد                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | تایمرها را برای آزمون‌های حساس به زمان منجمد و بازیابی می‌کند. از `plugin-sdk/test-env` وارد کنید                                                    |
| `createTestWizardPrompter`                           | یک پرامپتر جادوگر راه‌اندازی شبیه‌سازی‌شده می‌سازد                                                                                                     |
| `createRuntimeTaskFlow`                              | وضعیت task-flow زمان اجرای ایزوله را ایجاد می‌کند                                                                                                  |
| `typedCases`                                         | نوع‌های literal را برای آزمون‌های جدول‌محور حفظ می‌کند. از `plugin-sdk/test-fixtures` وارد کنید                                                    |

مجموعه‌های قرارداد Pluginهای همراه نیز از مسیرهای فرعی آزمون SDK برای کمک‌تابع‌های فقط-آزمونِ
registry، manifest، public-artifact، و fixtureهای runtime استفاده می‌کنند. مجموعه‌های فقط-هسته
که به فهرست موجودی OpenClaw همراه وابسته‌اند، زیر `src/plugins/contracts` باقی می‌مانند.
آزمون‌های extension جدید را به‌جای import مستقیم از barrel سازگاری گسترده‌ی
`plugin-sdk/testing`، فایل‌های repo `src/**`، یا پل‌های repo
`test/helpers/*`، روی یک مسیر فرعی SDK متمرکز و مستند نگه دارید، مانند
`plugin-sdk/plugin-test-api`، `plugin-sdk/channel-contract-testing`،
`plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/channel-test-helpers`،
`plugin-sdk/plugin-test-contracts`، `plugin-sdk/plugin-test-runtime`،
`plugin-sdk/provider-test-contracts`، `plugin-sdk/provider-http-test-mocks`،
`plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures`.

### انواع

مسیرهای فرعی متمرکز آزمون همچنین نوع‌هایی را که در فایل‌های آزمون مفیدند دوباره export می‌کنند:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## حل هدف آزمون

از `installCommonResolveTargetErrorCases` برای افزودن حالت‌های خطای استاندارد برای
حل هدف channel استفاده کنید:

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

## الگوهای آزمون

### آزمون قراردادهای ثبت

آزمون‌های واحدی که یک mock دست‌نویس `api` را به `register(api)` می‌دهند،
دروازه‌های پذیرش loader در OpenClaw را اجرا نمی‌کنند. برای هر سطح ثبتی که Plugin شما به آن وابسته است،
به‌ویژه hookها و قابلیت‌های انحصاری مانند memory، دست‌کم یک آزمون smoke با پشتوانه‌ی loader اضافه کنید.

loader واقعی وقتی metadata لازم وجود نداشته باشد یا یک Plugin یک API قابلیت را صدا بزند که مالک آن نیست،
ثبت Plugin را ناموفق می‌کند. برای مثال،
`api.registerHook(...)` به نام hook نیاز دارد، و
`api.registerMemoryCapability(...)` نیاز دارد که manifest Plugin یا entry صادرشده
`kind: "memory"` را declare کند.

### آزمون دسترسی به پیکربندی runtime

mock مشترک runtime Plugin را از `openclaw/plugin-sdk/plugin-test-runtime` ترجیح دهید.
mockهای منسوخ `runtime.config.loadConfig()` و `runtime.config.writeConfigFile(...)`
آن به‌طور پیش‌فرض خطا می‌دهند تا آزمون‌ها استفاده‌ی جدید از APIهای سازگاری را بگیرند. این mockها را
فقط وقتی override کنید که آزمون صراحتا رفتار سازگاری legacy را پوشش می‌دهد.

### آزمون واحد یک Plugin کانال

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

### آزمون واحد یک Plugin ارائه‌دهنده

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

### mock کردن runtime Plugin

برای کدی که از `createPluginRuntimeStore` استفاده می‌کند، runtime را در آزمون‌ها mock کنید:

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

### آزمون با stubهای هر instance

stubهای هر instance را به تغییر prototype ترجیح دهید:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## آزمون‌های قرارداد (Pluginهای داخل repo)

Pluginهای همراه آزمون‌های قراردادی دارند که مالکیت ثبت را راستی‌آزمایی می‌کنند:

```bash
pnpm test -- src/plugins/contracts/
```

این آزمون‌ها assert می‌کنند:

- کدام Pluginها کدام ارائه‌دهنده‌ها را ثبت می‌کنند
- کدام Pluginها کدام ارائه‌دهنده‌های گفتار را ثبت می‌کنند
- درستی شکل ثبت
- انطباق با قرارداد runtime

### اجرای آزمون‌های محدود به scope

برای یک Plugin مشخص:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

فقط برای آزمون‌های قرارداد:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## اجرای lint (Pluginهای داخل repo)

سه قانون توسط `pnpm check` برای Pluginهای داخل repo اجرا می‌شود:

1. **بدون importهای monolithic از root** -- barrel ریشه‌ی `openclaw/plugin-sdk` رد می‌شود
2. **بدون import مستقیم از `src/`** -- Pluginها نمی‌توانند مستقیم از `../../src/` import کنند
3. **بدون self-import** -- Pluginها نمی‌توانند مسیر فرعی `plugin-sdk/<name>` خودشان را import کنند

Pluginهای خارجی مشمول این قوانین lint نیستند، اما پیروی از همین الگوها توصیه می‌شود.

## پیکربندی آزمون

OpenClaw از Vitest با آستانه‌های coverage در V8 استفاده می‌کند. برای آزمون‌های Plugin:

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

اگر اجرای محلی باعث فشار حافظه شد:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) -- قراردادهای import
- [Pluginهای کانال SDK](/fa/plugins/sdk-channel-plugins) -- رابط Plugin کانال
- [Pluginهای ارائه‌دهنده SDK](/fa/plugins/sdk-provider-plugins) -- hookهای Plugin ارائه‌دهنده
- [ساخت Pluginها](/fa/plugins/building-plugins) -- راهنمای شروع
