---
read_when:
    - شما در حال نوشتن آزمون‌هایی برای یک Plugin هستید
    - به ابزارهای کمکی آزمون از SDK Plugin نیاز دارید
    - می‌خواهید آزمون‌های قرارداد را برای Pluginهای همراه درک کنید
sidebarTitle: Testing
summary: ابزارهای کمکی و الگوهای آزمون برای Pluginهای OpenClaw
title: آزمون Plugin
x-i18n:
    generated_at: "2026-05-10T20:01:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع ابزارهای آزمون، الگوها، و اعمال قواعد وارسی کد برای Pluginهای OpenClaw.

<Tip>
  **به‌دنبال نمونه‌های آزمون هستید؟** راهنماهای آموزشی شامل نمونه‌های آزمون کامل هستند:
  [آزمون‌های Plugin کانال](/fa/plugins/sdk-channel-plugins#step-6-test) و
  [آزمون‌های Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## ابزارهای آزمون

این زیرمسیرهای کمک‌آزمون، نقاط ورود منبع محلی مخزن برای آزمون‌های Pluginهای
همراه خود OpenClaw هستند. آن‌ها خروجی‌های بسته برای Pluginهای شخص ثالث نیستند.

**درون‌ریزی mock برای API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**درون‌ریزی قرارداد زمان اجرای عامل:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**درون‌ریزی قرارداد کانال:** `openclaw/plugin-sdk/channel-contract-testing`

**درون‌ریزی کمک‌آزمون کانال:** `openclaw/plugin-sdk/channel-test-helpers`

**درون‌ریزی آزمون هدف کانال:** `openclaw/plugin-sdk/channel-target-testing`

**درون‌ریزی قرارداد Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**درون‌ریزی آزمون زمان اجرای Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**درون‌ریزی قرارداد ارائه‌دهنده:** `openclaw/plugin-sdk/provider-test-contracts`

**درون‌ریزی mock برای HTTP ارائه‌دهنده:** `openclaw/plugin-sdk/provider-http-test-mocks`

**درون‌ریزی آزمون محیط/شبکه:** `openclaw/plugin-sdk/test-env`

**درون‌ریزی fixture عمومی:** `openclaw/plugin-sdk/test-fixtures`

**درون‌ریزی mock برای داخلی‌های Node:** `openclaw/plugin-sdk/test-node-mocks`

برای آزمون‌های جدید Plugin، زیرمسیرهای متمرکز زیر را ترجیح دهید. barrel گسترده
`openclaw/plugin-sdk/testing` فقط برای سازگاری قدیمی است.
گاردریل‌های مخزن، درون‌ریزی‌های واقعی جدید از `plugin-sdk/testing` و
`plugin-sdk/test-utils` را رد می‌کنند؛ این نام‌ها فقط به‌عنوان سطح‌های
سازگاری منسوخ‌شده برای آزمون‌های رکورد سازگاری باقی می‌مانند.

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

### خروجی‌های موجود

| خروجی                                                | هدف                                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | یک شبیه‌ساز حداقلی API برای Plugin بسازید تا در آزمون‌های واحد ثبت مستقیم استفاده شود. از `plugin-sdk/plugin-test-api` وارد کنید       |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | فیکسچر مشترک قرارداد نمایه احراز هویت برای آداپترهای اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید         |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | فیکسچر مشترک قرارداد سرکوب تحویل برای آداپترهای اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید              |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | فیکسچر مشترک قرارداد طبقه‌بندی جایگزین برای آداپترهای اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید       |
| `createParameterFreeTool`                            | فیکسچرهای شمای ابزار پویا را برای آزمون‌های قرارداد اجرای بومی بسازید. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید        |
| `expectChannelInboundContextContract`                | شکل زمینه ورودی کانال را ارزیابی کنید. از `plugin-sdk/channel-contract-testing` وارد کنید                                               |
| `installChannelOutboundPayloadContractSuite`         | موردهای قرارداد payload خروجی کانال را نصب کنید. از `plugin-sdk/channel-contract-testing` وارد کنید                                    |
| `createStartAccountContext`                          | زمینه‌های چرخه عمر حساب کانال را بسازید. از `plugin-sdk/channel-test-helpers` وارد کنید                                                |
| `installChannelActionsContractSuite`                 | موردهای قرارداد عمومی کنش پیام کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                      |
| `installChannelSetupContractSuite`                   | موردهای قرارداد عمومی راه‌اندازی کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                    |
| `installChannelStatusContractSuite`                  | موردهای قرارداد عمومی وضعیت کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                         |
| `expectDirectoryIds`                                 | شناسه‌های فهرست کانال را از یک تابع فهرست‌کردن دایرکتوری ارزیابی کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                |
| `assertBundledChannelEntries`                        | ارزیابی کنید که نقطه‌های ورود کانال‌های همراه، قرارداد عمومی مورد انتظار را ارائه می‌کنند. از `plugin-sdk/channel-test-helpers` وارد کنید |
| `formatEnvelopeTimestamp`                            | مهرزمان‌های پاکت را به‌صورت قطعی قالب‌بندی کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                       |
| `expectPairingReplyText`                             | متن پاسخ جفت‌سازی کانال را ارزیابی و کد آن را استخراج کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                           |
| `describePluginRegistrationContract`                 | بررسی‌های قرارداد ثبت Plugin را نصب کنید. از `plugin-sdk/plugin-test-contracts` وارد کنید                                              |
| `registerSingleProviderPlugin`                       | یک Plugin ارائه‌دهنده را در آزمون‌های smoke بارگذار ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                           |
| `registerProviderPlugin`                             | همه انواع ارائه‌دهنده را از یک Plugin ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                          |
| `registerProviderPlugins`                            | ثبت‌های ارائه‌دهنده را در چندین Plugin ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                         |
| `requireRegisteredProvider`                          | ارزیابی کنید که یک مجموعه ارائه‌دهنده شامل یک شناسه است. از `plugin-sdk/plugin-test-runtime` وارد کنید                                |
| `createRuntimeEnv`                                   | یک محیط اجرای شبیه‌سازی‌شده CLI/Plugin بسازید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                           |
| `createPluginSetupWizardStatus`                      | کمک‌کننده‌های وضعیت راه‌اندازی را برای Pluginهای کانال بسازید. از `plugin-sdk/plugin-test-runtime` وارد کنید                          |
| `describeOpenAIProviderRuntimeContract`              | بررسی‌های قرارداد اجرای خانواده ارائه‌دهنده را نصب کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                           |
| `expectPassthroughReplayPolicy`                      | ارزیابی کنید که سیاست‌های بازپخش ارائه‌دهنده، ابزارها و فراداده متعلق به ارائه‌دهنده را بدون تغییر عبور می‌دهند. از `plugin-sdk/provider-test-contracts` وارد کنید |
| `runRealtimeSttLiveTest`                             | یک آزمون زنده ارائه‌دهنده STT بلادرنگ را با فیکسچرهای صوتی مشترک اجرا کنید. از `plugin-sdk/provider-test-contracts` وارد کنید        |
| `normalizeTranscriptForMatch`                        | خروجی رونوشت زنده را پیش از ارزیابی‌های fuzzy نرمال‌سازی کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                     |
| `expectExplicitVideoGenerationCapabilities`          | ارزیابی کنید که ارائه‌دهنده‌های ویدئو قابلیت‌های صریح حالت تولید را اعلام می‌کنند. از `plugin-sdk/provider-test-contracts` وارد کنید |
| `expectExplicitMusicGenerationCapabilities`          | ارزیابی کنید که ارائه‌دهنده‌های موسیقی قابلیت‌های صریح تولید/ویرایش را اعلام می‌کنند. از `plugin-sdk/provider-test-contracts` وارد کنید |
| `mockSuccessfulDashscopeVideoTask`                   | یک پاسخ موفق وظیفه ویدئویی سازگار با DashScope نصب کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                           |
| `getProviderHttpMocks`                               | به شبیه‌سازهای اختیاری HTTP/احراز هویت ارائه‌دهنده در Vitest دسترسی پیدا کنید. از `plugin-sdk/provider-http-test-mocks` وارد کنید   |
| `installProviderHttpMockCleanup`                     | شبیه‌سازهای HTTP/احراز هویت ارائه‌دهنده را پس از هر آزمون بازنشانی کنید. از `plugin-sdk/provider-http-test-mocks` وارد کنید         |
| `installCommonResolveTargetErrorCases`               | موردهای آزمون مشترک برای مدیریت خطا در حل مقصد. از `plugin-sdk/channel-target-testing` وارد کنید                                      |
| `shouldAckReaction`                                  | بررسی کنید آیا یک کانال باید واکنش تأیید اضافه کند. از `plugin-sdk/channel-feedback` وارد کنید                                        |
| `removeAckReactionAfterReply`                        | واکنش تأیید را پس از تحویل پاسخ حذف کنید. از `plugin-sdk/channel-feedback` وارد کنید                                                  |
| `createTestRegistry`                                 | یک فیکسچر رجیستری Plugin کانال بسازید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید             |
| `createEmptyPluginRegistry`                          | یک فیکسچر رجیستری خالی Plugin بسازید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید              |
| `setActivePluginRegistry`                            | یک فیکسچر رجیستری را برای آزمون‌های اجرای Plugin نصب کنید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید |
| `createRequestCaptureJsonFetch`                      | درخواست‌های fetch JSON را در آزمون‌های کمک‌کننده رسانه ثبت کنید. از `plugin-sdk/test-env` وارد کنید                                  |
| `withServer`                                         | آزمون‌ها را در برابر یک سرور HTTP محلی دورریختنی اجرا کنید. از `plugin-sdk/test-env` وارد کنید                                       |
| `createMockIncomingRequest`                          | یک شیء حداقلی درخواست HTTP ورودی بسازید. از `plugin-sdk/test-env` وارد کنید                                                           |
| `withFetchPreconnect`                                | آزمون‌های fetch را با hookهای preconnect نصب‌شده اجرا کنید. از `plugin-sdk/test-env` وارد کنید                                        |
| `withEnv` / `withEnvAsync`                           | متغیرهای محیطی را موقتاً وصله کنید. از `plugin-sdk/test-env` وارد کنید                                                                |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | فیکسچرهای آزمون سیستم فایل ایزوله ایجاد کنید. از `plugin-sdk/test-env` وارد کنید                                                     |
| `createMockServerResponse`                           | یک شبیه‌ساز حداقلی پاسخ سرور HTTP ایجاد کنید. از `plugin-sdk/test-env` وارد کنید                                                     |
| `createCliRuntimeCapture`                            | خروجی اجرای CLI را در آزمون‌ها ثبت کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                      |
| `importFreshModule`                                  | یک ماژول ESM را با توکن پرس‌وجوی تازه وارد کنید تا cache ماژول دور زده شود. از `plugin-sdk/test-fixtures` وارد کنید                 |
| `bundledPluginRoot` / `bundledPluginFile`            | مسیرهای فیکسچر منبع یا dist مربوط به Plugin همراه را resolve کنید. از `plugin-sdk/test-fixtures` وارد کنید                            |
| `mockNodeBuiltinModule`                              | شبیه‌سازهای محدود Vitest برای ماژول‌های داخلی Node را نصب کنید. از `plugin-sdk/test-node-mocks` وارد کنید                            |
| `createSandboxTestContext`                           | زمینه‌های آزمون sandbox را بسازید. از `plugin-sdk/test-fixtures` وارد کنید                                                            |
| `writeSkill`                                         | فیکسچرهای مهارت را بنویسید. از `plugin-sdk/test-fixtures` وارد کنید                                                                   |
| `makeAgentAssistantMessage`                          | فیکسچرهای پیام رونوشت عامل را بسازید. از `plugin-sdk/test-fixtures` وارد کنید                                                        |
| `peekSystemEvents` / `resetSystemEventsForTest`      | فیکسچرهای رویداد سیستم را بررسی و بازنشانی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                             |
| `sanitizeTerminalText`                               | خروجی ترمینال را برای ارزیابی‌ها پاک‌سازی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                              |
| `countLines` / `hasBalancedFences`                   | شکل خروجی chunking را ارزیابی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `runProviderCatalog`                                 | یک hook کاتالوگ ارائه‌دهنده را با وابستگی‌های آزمون اجرا کنید                                                                         |
| `resolveProviderWizardOptions`                       | گزینه‌های ویزارد راه‌اندازی ارائه‌دهنده را در آزمون‌های قرارداد resolve کنید                                                         |
| `resolveProviderModelPickerEntries`                  | ورودی‌های انتخاب‌گر مدل ارائه‌دهنده را در آزمون‌های قرارداد resolve کنید                                                             |
| `buildProviderPluginMethodChoice`                    | شناسه‌های انتخاب روش ویزارد ارائه‌دهنده را برای ارزیابی‌ها بسازید                                                                     |
| `setProviderWizardProvidersResolverForTest`          | ارائه‌دهنده‌های ویزارد ارائه‌دهنده را برای آزمون‌های ایزوله تزریق کنید                                                               |
| `createProviderUsageFetch`                           | ساخت داده‌های آزمایشی واکشی مصرف ارائه‌دهنده                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | زمان‌سنج‌ها را برای آزمون‌های حساس به زمان ثابت و بازیابی کنید. از `plugin-sdk/test-env` وارد کنید                                                    |
| `createTestWizardPrompter`                           | ساخت یک درخواست‌دهنده شبیه‌سازی‌شده برای جادوگر راه‌اندازی                                                                                                     |
| `createRuntimeTaskFlow`                              | ایجاد حالت ایزوله برای جریان وظیفه زمان اجرا                                                                                                  |
| `typedCases`                                         | حفظ نوع‌های لفظی برای آزمون‌های جدول‌محور. از `plugin-sdk/test-fixtures` وارد کنید                                                    |

مجموعه‌های قرارداد Pluginهای همراه نیز برای helperهای fixture مخصوص آزمون برای
registry، manifest، public-artifact و runtime از زیرمسیرهای آزمون SDK استفاده می‌کنند. مجموعه‌های
فقط هسته که به موجودی همراه OpenClaw وابسته‌اند، زیر `src/plugins/contracts` می‌مانند.
آزمون‌های جدید افزونه را به‌جای import مستقیم barrel سازگاری گسترده
`plugin-sdk/testing`، فایل‌های `src/**` مخزن، یا پل‌های `test/helpers/*` مخزن،
روی یک زیرمسیر متمرکز و مستند SDK مانند
`plugin-sdk/plugin-test-api`، `plugin-sdk/channel-contract-testing`،
`plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/channel-test-helpers`،
`plugin-sdk/plugin-test-contracts`، `plugin-sdk/plugin-test-runtime`،
`plugin-sdk/provider-test-contracts`، `plugin-sdk/provider-http-test-mocks`،
`plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` نگه دارید.

### انواع

زیرمسیرهای متمرکز آزمون همچنین typeهایی را که در فایل‌های آزمون مفیدند، دوباره export می‌کنند:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## تفکیک هدف آزمون

از `installCommonResolveTargetErrorCases` برای افزودن حالت‌های خطای استاندارد برای
تفکیک هدف کانال استفاده کنید:

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

آزمون‌های واحدی که یک mock دست‌نویس `api` را به `register(api)` می‌دهند، دروازه‌های پذیرش loader
OpenClaw را تمرین نمی‌کنند. برای هر سطح ثبت که Plugin شما به آن وابسته است، به‌ویژه hookها و
قابلیت‌های انحصاری مانند memory، دست‌کم یک آزمون smoke مبتنی بر loader اضافه کنید.

loader واقعی وقتی metadata لازم وجود نداشته باشد یا یک Plugin یک API قابلیت را که مالک آن نیست
فراخوانی کند، ثبت Plugin را ناموفق می‌کند. برای مثال،
`api.registerHook(...)` به نام hook نیاز دارد، و
`api.registerMemoryCapability(...)` نیاز دارد manifest یا entry صادرشده Plugin
`kind: "memory"` را declare کند.

### آزمون دسترسی به پیکربندی runtime

هنگام آزمون Pluginهای کانال همراه، mock مشترک runtime Plugin را از
`openclaw/plugin-sdk/channel-test-helpers` ترجیح دهید. mockهای منسوخ
`runtime.config.loadConfig()` و `runtime.config.writeConfigFile(...)` آن به‌صورت پیش‌فرض خطا می‌دهند
تا آزمون‌ها استفاده جدید از APIهای سازگاری را بگیرند. این mockها را فقط زمانی override کنید
که آزمون صریحا رفتار سازگاری legacy را پوشش می‌دهد.

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

### Mock کردن runtime Plugin

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

stubهای هر instance را به mutation پروتوتایپ ترجیح دهید:

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

این آزمون‌ها موارد زیر را assert می‌کنند:

- کدام Pluginها کدام ارائه‌دهنده‌ها را ثبت می‌کنند
- کدام Pluginها کدام ارائه‌دهنده‌های speech را ثبت می‌کنند
- درستی شکل ثبت
- انطباق با قرارداد runtime

### اجرای آزمون‌های scoped

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

1. **بدون importهای ریشه monolithic** -- barrel ریشه `openclaw/plugin-sdk` رد می‌شود
2. **بدون import مستقیم `src/`** -- Pluginها نمی‌توانند مستقیما `../../src/` را import کنند
3. **بدون self-import** -- Pluginها نمی‌توانند زیرمسیر `plugin-sdk/<name>` خودشان را import کنند

Pluginهای خارجی مشمول این قوانین lint نیستند، اما پیروی از همان الگوها توصیه می‌شود.

## پیکربندی آزمون

OpenClaw از Vitest با آستانه‌های coverage مبتنی بر V8 استفاده می‌کند. برای آزمون‌های Plugin:

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

- [مرور کلی SDK](/fa/plugins/sdk-overview) -- قراردادهای import
- [Pluginهای کانال SDK](/fa/plugins/sdk-channel-plugins) -- رابط Plugin کانال
- [Pluginهای ارائه‌دهنده SDK](/fa/plugins/sdk-provider-plugins) -- hookهای Plugin ارائه‌دهنده
- [ساختن Pluginها](/fa/plugins/building-plugins) -- راهنمای شروع کار
