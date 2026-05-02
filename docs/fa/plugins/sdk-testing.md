---
read_when:
    - شما در حال نوشتن آزمون‌هایی برای یک Plugin هستید
    - به ابزارهای کمکی آزمون از SDK مربوط به Plugin نیاز دارید
    - می‌خواهید آزمون‌های قرارداد مربوط به Pluginهای همراه را درک کنید
sidebarTitle: Testing
summary: ابزارهای کمکی و الگوهای آزمون برای Plugin‌های OpenClaw
title: آزمایش Plugin
x-i18n:
    generated_at: "2026-05-02T22:23:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع ابزارهای کمکی آزمون، الگوها، و اعمال lint برای Pluginهای OpenClaw.

<Tip>
  **به‌دنبال نمونه‌های آزمون هستید؟** راهنماهای چگونگی شامل نمونه‌های آزمون کارشده هستند:
  [آزمون‌های Plugin کانال](/fa/plugins/sdk-channel-plugins#step-6-test) و
  [آزمون‌های Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## ابزارهای کمکی آزمون

**واردسازی شبیه‌ساز API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**واردسازی قرارداد اجرای عامل:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**واردسازی قرارداد کانال:** `openclaw/plugin-sdk/channel-contract-testing`

**واردسازی کمک‌کننده آزمون کانال:** `openclaw/plugin-sdk/channel-test-helpers`

**واردسازی آزمون هدف کانال:** `openclaw/plugin-sdk/channel-target-testing`

**واردسازی قرارداد Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**واردسازی آزمون اجرای Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**واردسازی قرارداد ارائه‌دهنده:** `openclaw/plugin-sdk/provider-test-contracts`

**واردسازی شبیه‌ساز HTTP ارائه‌دهنده:** `openclaw/plugin-sdk/provider-http-test-mocks`

**واردسازی آزمون محیط/شبکه:** `openclaw/plugin-sdk/test-env`

**واردسازی fixture عمومی:** `openclaw/plugin-sdk/test-fixtures`

**واردسازی شبیه‌ساز داخلی Node:** `openclaw/plugin-sdk/test-node-mocks`

برای آزمون‌های جدید Plugin، زیربخشی‌های متمرکز زیر را ترجیح دهید. صادرات تجمیعی گسترده
`openclaw/plugin-sdk/testing` فقط برای سازگاری قدیمی است.
حفاظ‌های مخزن واردسازی‌های واقعی جدید از `plugin-sdk/testing` و
`plugin-sdk/test-utils` را رد می‌کنند؛ این نام‌ها فقط به‌عنوان سطح‌های سازگاری
منسوخ‌شده برای Pluginهای خارجی و آزمون‌های رکورد سازگاری باقی می‌مانند.

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

### صادرات موجود

| خروجی                                               | هدف                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | یک mock حداقلی از API مربوط به Plugin برای آزمون‌های واحد ثبت مستقیم بسازید. از `plugin-sdk/plugin-test-api` وارد کنید                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | fixture قرارداد مشترک نمایه احراز هویت برای آداپتورهای زمان اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | fixture قرارداد مشترک سرکوب تحویل برای آداپتورهای زمان اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | fixture قرارداد مشترک دسته‌بندی fallback برای آداپتورهای زمان اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید |
| `createParameterFreeTool`                            | fixtureهای schema ابزار پویا را برای آزمون‌های قرارداد زمان اجرای بومی بسازید. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید              |
| `expectChannelInboundContextContract`                | شکل context ورودی کانال را assert کنید. از `plugin-sdk/channel-contract-testing` وارد کنید                                                  |
| `installChannelOutboundPayloadContractSuite`         | موردهای قرارداد payload خروجی کانال را نصب کنید. از `plugin-sdk/channel-contract-testing` وارد کنید                                       |
| `createStartAccountContext`                          | contextهای چرخه عمر حساب کانال را بسازید. از `plugin-sdk/channel-test-helpers` وارد کنید                                                  |
| `installChannelActionsContractSuite`                 | موردهای قرارداد عمومی کنش پیام کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                     |
| `installChannelSetupContractSuite`                   | موردهای قرارداد عمومی راه‌اندازی کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                              |
| `installChannelStatusContractSuite`                  | موردهای قرارداد عمومی وضعیت کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                             |
| `expectDirectoryIds`                                 | شناسه‌های دایرکتوری کانال را از یک تابع فهرست دایرکتوری assert کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                               |
| `assertBundledChannelEntries`                        | assert کنید entrypointهای کانال همراه، قرارداد عمومی مورد انتظار را expose می‌کنند. از `plugin-sdk/channel-test-helpers` وارد کنید                    |
| `formatEnvelopeTimestamp`                            | Timestampهای deterministic پاکت را قالب‌بندی کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                                  |
| `expectPairingReplyText`                             | متن پاسخ pairing کانال را assert کنید و کد آن را استخراج کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                    |
| `describePluginRegistrationContract`                 | بررسی‌های قرارداد ثبت Plugin را نصب کنید. از `plugin-sdk/plugin-test-contracts` وارد کنید                                              |
| `registerSingleProviderPlugin`                       | یک Plugin ارائه‌دهنده را در آزمون‌های smoke بارگذار ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                         |
| `registerProviderPlugin`                             | همه گونه‌های ارائه‌دهنده را از یک Plugin ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                                 |
| `registerProviderPlugins`                            | ثبت‌های ارائه‌دهنده را در چند Plugin ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                     |
| `requireRegisteredProvider`                          | assert کنید یک مجموعه ارائه‌دهنده شامل یک شناسه است. از `plugin-sdk/plugin-test-runtime` وارد کنید                                           |
| `createRuntimeEnv`                                   | یک محیط زمان اجرای mock شده CLI/Plugin بسازید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                              |
| `createPluginSetupWizardStatus`                      | helperهای وضعیت راه‌اندازی را برای Pluginهای کانال بسازید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                             |
| `describeOpenAIProviderRuntimeContract`              | بررسی‌های قرارداد زمان اجرای خانواده ارائه‌دهنده را نصب کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                                        |
| `expectPassthroughReplayPolicy`                      | assert کنید سیاست‌های replay ارائه‌دهنده، ابزارها و metadata متعلق به ارائه‌دهنده را بدون تغییر عبور می‌دهند. از `plugin-sdk/provider-test-contracts` وارد کنید         |
| `runRealtimeSttLiveTest`                             | یک آزمون زنده ارائه‌دهنده STT realtime را با fixtureهای صوتی مشترک اجرا کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                       |
| `normalizeTranscriptForMatch`                        | خروجی transcript زنده را پیش از assertهای fuzzy نرمال‌سازی کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                               |
| `expectExplicitVideoGenerationCapabilities`          | assert کنید ارائه‌دهندگان ویدیو قابلیت‌های صریح حالت تولید را اعلام می‌کنند. از `plugin-sdk/provider-test-contracts` وارد کنید                   |
| `expectExplicitMusicGenerationCapabilities`          | assert کنید ارائه‌دهندگان موسیقی قابلیت‌های صریح تولید/ویرایش را اعلام می‌کنند. از `plugin-sdk/provider-test-contracts` وارد کنید                   |
| `mockSuccessfulDashscopeVideoTask`                   | یک پاسخ موفق وظیفه ویدیویی سازگار با DashScope نصب کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                          |
| `getProviderHttpMocks`                               | به mockهای opt-in مربوط به HTTP/auth ارائه‌دهنده در Vitest دسترسی پیدا کنید. از `plugin-sdk/provider-http-test-mocks` وارد کنید                                         |
| `installProviderHttpMockCleanup`                     | mockهای HTTP/auth ارائه‌دهنده را پس از هر آزمون reset کنید. از `plugin-sdk/provider-http-test-mocks` وارد کنید                                        |
| `installCommonResolveTargetErrorCases`               | موردهای آزمون مشترک برای مدیریت خطای resolution مقصد. از `plugin-sdk/channel-target-testing` وارد کنید                                  |
| `shouldAckReaction`                                  | بررسی کنید آیا یک کانال باید یک واکنش ack اضافه کند. از `plugin-sdk/channel-feedback` وارد کنید                                            |
| `removeAckReactionAfterReply`                        | واکنش ack را پس از تحویل پاسخ حذف کنید. از `plugin-sdk/channel-feedback` وارد کنید                                                      |
| `createTestRegistry`                                 | یک fixture رجیستری Plugin کانال بسازید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید               |
| `createEmptyPluginRegistry`                          | یک fixture رجیستری Plugin خالی بسازید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید                |
| `setActivePluginRegistry`                            | یک fixture رجیستری را برای آزمون‌های زمان اجرای Plugin نصب کنید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید   |
| `createRequestCaptureJsonFetch`                      | درخواست‌های JSON fetch را در آزمون‌های helper رسانه ثبت کنید. از `plugin-sdk/test-env` وارد کنید                                                     |
| `withServer`                                         | آزمون‌ها را در برابر یک سرور HTTP محلی disposable اجرا کنید. از `plugin-sdk/test-env` وارد کنید                                                      |
| `createMockIncomingRequest`                          | یک شیء حداقلی درخواست HTTP ورودی بسازید. از `plugin-sdk/test-env` وارد کنید                                                          |
| `withFetchPreconnect`                                | آزمون‌های fetch را با hookهای preconnect نصب‌شده اجرا کنید. از `plugin-sdk/test-env` وارد کنید                                                       |
| `withEnv` / `withEnvAsync`                           | متغیرهای محیطی را موقتاً patch کنید. از `plugin-sdk/test-env` وارد کنید                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | fixtureهای آزمون فایل‌سیستم ایزوله ایجاد کنید. از `plugin-sdk/test-env` وارد کنید                                                              |
| `createMockServerResponse`                           | یک mock حداقلی پاسخ سرور HTTP ایجاد کنید. از `plugin-sdk/test-env` وارد کنید                                                            |
| `createCliRuntimeCapture`                            | خروجی زمان اجرای CLI را در آزمون‌ها ثبت کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                              |
| `importFreshModule`                                  | یک ماژول ESM را با یک توکن query تازه وارد کنید تا cache ماژول دور زده شود. از `plugin-sdk/test-fixtures` وارد کنید                             |
| `bundledPluginRoot` / `bundledPluginFile`            | مسیرهای fixture منبع یا dist مربوط به Plugin همراه را resolve کنید. از `plugin-sdk/test-fixtures` وارد کنید                                              |
| `mockNodeBuiltinModule`                              | mockهای محدود Vitest برای builtinهای Node را نصب کنید. از `plugin-sdk/test-node-mocks` وارد کنید                                                       |
| `createSandboxTestContext`                           | contextهای آزمون sandbox را بسازید. از `plugin-sdk/test-fixtures` وارد کنید                                                                      |
| `writeSkill`                                         | fixtureهای skill را بنویسید. از `plugin-sdk/test-fixtures` وارد کنید                                                                             |
| `makeAgentAssistantMessage`                          | fixtureهای پیام transcript عامل را بسازید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | fixtureهای رویداد سیستم را inspect و reset کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `sanitizeTerminalText`                               | خروجی terminal را برای assertها پاک‌سازی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `countLines` / `hasBalancedFences`                   | شکل خروجی chunking را assert کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                                     |
| `runProviderCatalog`                                 | یک hook کاتالوگ ارائه‌دهنده را با وابستگی‌های آزمون اجرا کنید                                                                                   |
| `resolveProviderWizardOptions`                       | گزینه‌های ویزارد راه‌اندازی ارائه‌دهنده را در آزمون‌های قرارداد resolve کنید                                                                                  |
| `resolveProviderModelPickerEntries`                  | entryهای انتخاب‌گر مدل ارائه‌دهنده را در آزمون‌های قرارداد resolve کنید                                                                                  |
| `buildProviderPluginMethodChoice`                    | شناسه‌های انتخاب ویزارد ارائه‌دهنده را برای assertها بسازید                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | ارائه‌دهندگان ویزارد ارائه‌دهنده را برای آزمون‌های ایزوله inject کنید                                                                                      |
| `createProviderUsageFetch`                           | فیکسچرهای واکشی میزان استفادهٔ ارائه‌دهنده را بسازید                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | تایمرها را برای آزمون‌های حساس به زمان منجمد و بازیابی کنید. از `plugin-sdk/test-env` وارد کنید                                                    |
| `createTestWizardPrompter`                           | یک اعلان‌گر جادوگر راه‌اندازی شبیه‌سازی‌شده بسازید                                                                                                     |
| `createRuntimeTaskFlow`                              | وضعیت ایزولهٔ TaskFlow زمان اجرا را ایجاد کنید                                                                                                  |
| `typedCases`                                         | نوع‌های لفظی را برای آزمون‌های جدول‌محور حفظ کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                    |

مجموعه‌های قرارداد Pluginهای همراه همچنین از زیـرمسیرهای آزمایشی SDK برای کمک‌کننده‌های فقط-آزمونِ رجیستری، مانیفست، مصنوع عمومی، و فیکسچر زمان اجرا استفاده می‌کنند. مجموعه‌های فقط-هسته که به موجودی OpenClaw همراه وابسته‌اند، زیر `src/plugins/contracts` باقی می‌مانند. آزمون‌های جدید افزونه را روی یک زیـرمسیر متمرکز و مستند SDK مانند `plugin-sdk/plugin-test-api`، `plugin-sdk/channel-contract-testing`، `plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/plugin-test-contracts`، `plugin-sdk/plugin-test-runtime`، `plugin-sdk/provider-test-contracts`، `plugin-sdk/provider-http-test-mocks`، `plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` نگه دارید، نه اینکه barrel سازگاریِ گسترده‌ی `plugin-sdk/testing`، فایل‌های `src/**` مخزن، یا پل‌های `test/helpers/*` مخزن را مستقیما import کنید.

### نوع‌ها

زیـرمسیرهای متمرکز آزمایشی همچنین نوع‌های مفید در فایل‌های آزمون را دوباره export می‌کنند:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## تشخیص مقصد آزمون

از `installCommonResolveTargetErrorCases` برای افزودن حالت‌های خطای استاندارد برای تشخیص مقصد کانال استفاده کنید:

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

### آزمودن قراردادهای ثبت

آزمون‌های واحدی که یک mock دست‌نویس `api` را به `register(api)` می‌دهند، دروازه‌های پذیرش loader در OpenClaw را اجرا نمی‌کنند. برای هر سطح ثبت که Plugin شما به آن وابسته است، به‌ویژه hookها و قابلیت‌های انحصاری مانند حافظه، دست‌کم یک آزمون smoke متکی بر loader اضافه کنید.

loader واقعی وقتی فراداده‌ی الزامی وجود نداشته باشد یا یک Plugin API قابلیتی را فراخوانی کند که مالک آن نیست، ثبت Plugin را ناموفق می‌کند. برای مثال، `api.registerHook(...)` به نام hook نیاز دارد، و `api.registerMemoryCapability(...)` نیاز دارد مانیفست Plugin یا entry خروجی، `kind: "memory"` را declare کند.

### آزمودن دسترسی به پیکربندی زمان اجرا

هنگام آزمودن Pluginهای کانال همراه، mock مشترک زمان اجرای Plugin را از `openclaw/plugin-sdk/channel-test-helpers` ترجیح دهید. mockهای منسوخ `runtime.config.loadConfig()` و `runtime.config.writeConfigFile(...)` آن به‌طور پیش‌فرض throw می‌کنند تا آزمون‌ها استفاده‌ی جدید از APIهای سازگاری را تشخیص دهند. این mockها را فقط وقتی override کنید که آزمون صریحا رفتار سازگاری قدیمی را پوشش می‌دهد.

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

### mock کردن زمان اجرای Plugin

برای کدی که از `createPluginRuntimeStore` استفاده می‌کند، زمان اجرا را در آزمون‌ها mock کنید:

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

### آزمودن با stubهای مخصوص هر instance

stubهای مخصوص هر instance را به جهش prototype ترجیح دهید:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## آزمون‌های قرارداد (Pluginهای داخل مخزن)

Pluginهای همراه آزمون‌های قراردادی دارند که مالکیت ثبت را بررسی می‌کنند:

```bash
pnpm test -- src/plugins/contracts/
```

این آزمون‌ها بررسی می‌کنند:

- کدام Pluginها کدام ارائه‌دهنده‌ها را ثبت می‌کنند
- کدام Pluginها کدام ارائه‌دهنده‌های گفتار را ثبت می‌کنند
- درستی شکل ثبت
- تطابق با قرارداد زمان اجرا

### اجرای آزمون‌های محدود به دامنه

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

## اعمال lint (Pluginهای داخل مخزن)

سه قانون توسط `pnpm check` برای Pluginهای داخل مخزن اعمال می‌شود:

1. **بدون importهای ریشه‌ی یکپارچه** -- barrel ریشه‌ی `openclaw/plugin-sdk` رد می‌شود
2. **بدون import مستقیم `src/`** -- Pluginها نمی‌توانند مستقیما `../../src/` را import کنند
3. **بدون self-import** -- Pluginها نمی‌توانند زیـرمسیر `plugin-sdk/<name>` خودشان را import کنند

Pluginهای خارجی مشمول این قوانین lint نیستند، اما پیروی از همان الگوها توصیه می‌شود.

## پیکربندی آزمون

OpenClaw از Vitest با آستانه‌های پوشش V8 استفاده می‌کند. برای آزمون‌های Plugin:

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

اگر اجراهای محلی باعث فشار حافظه می‌شوند:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) -- قراردادهای import
- [Pluginهای کانال SDK](/fa/plugins/sdk-channel-plugins) -- رابط Plugin کانال
- [Pluginهای ارائه‌دهنده SDK](/fa/plugins/sdk-provider-plugins) -- hookهای Plugin ارائه‌دهنده
- [ساخت Pluginها](/fa/plugins/building-plugins) -- راهنمای شروع کار
