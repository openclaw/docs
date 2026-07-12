---
read_when:
    - شما در حال نوشتن آزمون‌هایی برای یک Plugin هستید
    - به ابزارهای آزمایشِ SDK افزونه نیاز دارید
    - می‌خواهید آزمون‌های قرارداد برای Pluginهای همراه را درک کنید
sidebarTitle: Testing
summary: ابزارها و الگوهای آزمون برای Plugin‌های OpenClaw
title: آزمایش Plugin
x-i18n:
    generated_at: "2026-07-12T10:36:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجعی برای ابزارهای کمکی آزمون، الگوها و اعمال قواعد لینت برای Pluginهای OpenClaw.

<Tip>
  **به‌دنبال نمونه‌های آزمون هستید؟** راهنماهای عملی شامل نمونه‌های کامل آزمون هستند:
  [آزمون‌های Plugin کانال](/fa/plugins/sdk-channel-plugins#step-6-test) و
  [آزمون‌های Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## ابزارهای کمکی آزمون

این زیرمسیرها نقاط ورودی کد منبع محلی مخزن برای آزمون‌های Pluginهای همراه خود OpenClaw هستند. آن‌ها خروجی‌های منتشرشدهٔ `package.json` برای Pluginهای شخص ثالث نیستند و ممکن است Vitest یا دیگر وابستگی‌های آزمون مختص مخزن را وارد کنند.

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

برای آزمون‌های جدید Pluginهای همراه، این زیرمسیرهای متمرکز را ترجیح دهید. مسیر تجمیعی گستردهٔ `openclaw/plugin-sdk/testing` و نام مستعار `openclaw/plugin-sdk/test-utils` فقط برای سازگاری قدیمی هستند: `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) واردکردن جدید هر یک از آن‌ها را از فایل‌های آزمون افزونه رد می‌کند و هر دو صرفاً برای آزمون‌های ثبت سازگاری باقی مانده‌اند.

### خروجی‌های در دسترس

| خروجی                                               | هدف                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | یک شبیه‌ساز حداقلی API افزونه برای آزمون‌های واحد ثبت مستقیم می‌سازد. از `plugin-sdk/plugin-test-api` وارد کنید                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | فیکسچر مشترک قرارداد پروفایل احراز هویت برای آداپتورهای زمان‌اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | فیکسچر مشترک قرارداد سرکوب تحویل برای آداپتورهای زمان‌اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | فیکسچر مشترک قرارداد طبقه‌بندی بازگشت جایگزین برای آداپتورهای زمان‌اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید |
| `createParameterFreeTool`                            | فیکسچرهای شِمای ابزار پویا را برای آزمون‌های قرارداد زمان‌اجرای بومی می‌سازد. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید              |
| `expectChannelInboundContextContract`                | شکل زمینه ورودی کانال را بررسی می‌کند. از `plugin-sdk/channel-contract-testing` وارد کنید                                                  |
| `installChannelOutboundPayloadContractSuite`         | موارد قرارداد بارِ خروجی کانال را نصب می‌کند. از `plugin-sdk/channel-contract-testing` وارد کنید                                       |
| `createStartAccountContext`                          | زمینه‌های چرخه‌عمر حساب کانال را می‌سازد. از `plugin-sdk/channel-test-helpers` وارد کنید                                                  |
| `installChannelActionsContractSuite`                 | موارد عمومی قرارداد کنش پیام کانال را نصب می‌کند. از `plugin-sdk/channel-test-helpers` وارد کنید                                     |
| `installChannelSetupContractSuite`                   | موارد عمومی قرارداد راه‌اندازی کانال را نصب می‌کند. از `plugin-sdk/channel-test-helpers` وارد کنید                                              |
| `installChannelStatusContractSuite`                  | موارد عمومی قرارداد وضعیت کانال را نصب می‌کند. از `plugin-sdk/channel-test-helpers` وارد کنید                                             |
| `expectDirectoryIds`                                 | شناسه‌های دایرکتوری کانال را از یک تابع فهرست‌کردن دایرکتوری بررسی می‌کند. از `plugin-sdk/channel-test-helpers` وارد کنید                               |
| `assertBundledChannelEntries`                        | بررسی می‌کند که نقاط ورود کانال‌های همراه، قرارداد عمومی مورد انتظار را ارائه می‌دهند. از `plugin-sdk/channel-test-helpers` وارد کنید                    |
| `formatEnvelopeTimestamp`                            | مُهرهای زمانی قطعی پاکت را قالب‌بندی می‌کند. از `plugin-sdk/channel-test-helpers` وارد کنید                                                  |
| `expectPairingReplyText`                             | متن پاسخ جفت‌سازی کانال را بررسی و کد آن را استخراج می‌کند. از `plugin-sdk/channel-test-helpers` وارد کنید                                    |
| `describePluginRegistrationContract`                 | بررسی‌های قرارداد ثبت Plugin را نصب می‌کند. از `plugin-sdk/plugin-test-contracts` وارد کنید                                              |
| `registerSingleProviderPlugin`                       | یک Plugin ارائه‌دهنده را در آزمون‌های دودِ بارگذار ثبت می‌کند. از `plugin-sdk/plugin-test-runtime` وارد کنید                                         |
| `registerProviderPlugin`                             | همه انواع ارائه‌دهنده را از یک Plugin ثبت می‌کند. از `plugin-sdk/plugin-test-runtime` وارد کنید                                                 |
| `registerProviderPlugins`                            | ثبت‌های ارائه‌دهنده را در چند Plugin ثبت می‌کند. از `plugin-sdk/plugin-test-runtime` وارد کنید                                     |
| `requireRegisteredProvider`                          | بررسی می‌کند که یک مجموعه ارائه‌دهنده دارای یک شناسه باشد. از `plugin-sdk/plugin-test-runtime` وارد کنید                                           |
| `createRuntimeEnv`                                   | یک محیط شبیه‌سازی‌شده زمان‌اجرای CLI/Plugin می‌سازد. از `plugin-sdk/plugin-test-runtime` وارد کنید                                              |
| `createPluginRuntimeMock`                            | یک سطح شبیه‌سازی‌شده زمان‌اجرای Plugin می‌سازد. از `plugin-sdk/plugin-test-runtime` وارد کنید                                                      |
| `createPluginSetupWizardStatus`                      | کمک‌تابع‌های وضعیت راه‌اندازی را برای Pluginهای کانال می‌سازد. از `plugin-sdk/plugin-test-runtime` وارد کنید                                             |
| `createTestWizardPrompter`                           | یک درخواست‌گر شبیه‌سازی‌شده جادوگر راه‌اندازی می‌سازد. از `plugin-sdk/plugin-test-runtime` وارد کنید                                                       |
| `createRuntimeTaskFlow`                              | وضعیت ایزوله جریان وظیفه زمان‌اجرا را ایجاد می‌کند. از `plugin-sdk/plugin-test-runtime` وارد کنید                                                    |
| `runProviderCatalog`                                 | یک هوک کاتالوگ ارائه‌دهنده را با وابستگی‌های آزمون اجرا می‌کند. از `plugin-sdk/plugin-test-runtime` وارد کنید                                     |
| `resolveProviderWizardOptions`                       | گزینه‌های جادوگر راه‌اندازی ارائه‌دهنده را در آزمون‌های قرارداد حل می‌کند. از `plugin-sdk/plugin-test-runtime` وارد کنید                                    |
| `resolveProviderModelPickerEntries`                  | ورودی‌های انتخاب‌گر مدل ارائه‌دهنده را در آزمون‌های قرارداد حل می‌کند. از `plugin-sdk/plugin-test-runtime` وارد کنید                                    |
| `buildProviderPluginMethodChoice`                    | شناسه‌های انتخاب جادوگر ارائه‌دهنده را برای بررسی‌ها می‌سازد. از `plugin-sdk/plugin-test-runtime` وارد کنید                                            |
| `setProviderWizardProvidersResolverForTest`          | ارائه‌دهندگان جادوگر ارائه‌دهنده را برای آزمون‌های ایزوله تزریق می‌کند. از `plugin-sdk/plugin-test-runtime` وارد کنید                                        |
| `describeOpenAIProviderRuntimeContract`              | بررسی‌های قرارداد زمان‌اجرای خانواده ارائه‌دهنده را نصب می‌کند. از `plugin-sdk/provider-test-contracts` وارد کنید                                        |
| `expectPassthroughReplayPolicy`                      | بررسی می‌کند که سیاست‌های بازپخش ارائه‌دهنده، ابزارها و فراداده‌های تحت مالکیت ارائه‌دهنده را بدون تغییر عبور می‌دهند. از `plugin-sdk/provider-test-contracts` وارد کنید         |
| `runRealtimeSttLiveTest`                             | یک آزمون زنده STT بلادرنگ ارائه‌دهنده را با فیکسچرهای صوتی مشترک اجرا می‌کند. از `plugin-sdk/provider-test-contracts` وارد کنید                       |
| `normalizeTranscriptForMatch`                        | خروجی رونویسی زنده را پیش از بررسی‌های تقریبی عادی‌سازی می‌کند. از `plugin-sdk/provider-test-contracts` وارد کنید                               |
| `expectExplicitVideoGenerationCapabilities`          | بررسی می‌کند که ارائه‌دهندگان ویدئو قابلیت‌های صریح حالت تولید را اعلام کنند. از `plugin-sdk/provider-test-contracts` وارد کنید                   |
| `expectExplicitMusicGenerationCapabilities`          | بررسی می‌کند که ارائه‌دهندگان موسیقی قابلیت‌های صریح تولید/ویرایش را اعلام کنند. از `plugin-sdk/provider-test-contracts` وارد کنید                   |
| `mockSuccessfulDashscopeVideoTask`                   | یک پاسخ موفق وظیفه ویدئویی سازگار با DashScope را نصب می‌کند. از `plugin-sdk/provider-test-contracts` وارد کنید                          |
| `getProviderHttpMocks`                               | به شبیه‌سازهای اختیاری HTTP/احراز هویت ارائه‌دهنده در Vitest دسترسی می‌یابد. از `plugin-sdk/provider-http-test-mocks` وارد کنید                                         |
| `installProviderHttpMockCleanup`                     | شبیه‌سازهای HTTP/احراز هویت ارائه‌دهنده را پس از هر آزمون بازنشانی می‌کند. از `plugin-sdk/provider-http-test-mocks` وارد کنید                                        |
| `installCommonResolveTargetErrorCases`               | موارد آزمون مشترک برای مدیریت خطاهای حل مقصد. از `plugin-sdk/channel-target-testing` وارد کنید                                  |
| `shouldAckReaction`                                  | بررسی می‌کند که آیا یک کانال باید واکنش تأیید اضافه کند. از `plugin-sdk/channel-feedback` وارد کنید                                            |
| `removeAckReactionAfterReply`                        | واکنش تأیید را پس از تحویل پاسخ حذف می‌کند. از `plugin-sdk/channel-feedback` وارد کنید                                                      |
| `createTestRegistry`                                 | یک فیکسچر رجیستری Plugin کانال می‌سازد. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید               |
| `createEmptyPluginRegistry`                          | یک فیکسچر رجیستری خالی Plugin می‌سازد. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید                |
| `setActivePluginRegistry`                            | یک فیکسچر رجیستری را برای آزمون‌های زمان‌اجرای Plugin نصب می‌کند. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید   |
| `createRequestCaptureJsonFetch`                      | درخواست‌های واکشی JSON را در آزمون‌های کمک‌تابع رسانه ثبت می‌کند. از `plugin-sdk/test-env` وارد کنید                                                     |
| `withServer`                                         | آزمون‌ها را در برابر یک سرور محلی HTTP یک‌بارمصرف اجرا می‌کند. از `plugin-sdk/test-env` وارد کنید                                                      |
| `createMockIncomingRequest`                          | یک شیء حداقلی درخواست ورودی HTTP می‌سازد. از `plugin-sdk/test-env` وارد کنید                                                          |
| `withFetchPreconnect`                                | آزمون‌های واکشی را با هوک‌های پیش‌اتصال نصب‌شده اجرا می‌کند. از `plugin-sdk/test-env` وارد کنید                                                       |
| `withEnv` / `withEnvAsync`                           | متغیرهای محیطی را به‌طور موقت وصله می‌کند. از `plugin-sdk/test-env` وارد کنید                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | فیکسچرهای آزمون ایزوله سامانه فایل را ایجاد می‌کند. از `plugin-sdk/test-env` وارد کنید                                                              |
| `createMockServerResponse`                           | یک شبیه‌ساز حداقلی پاسخ سرور HTTP ایجاد می‌کند. از `plugin-sdk/test-env` وارد کنید                                                            |
| `createProviderUsageFetch`                           | فیکسچرهای واکشی مصرف ارائه‌دهنده را می‌سازد. از `plugin-sdk/test-env` وارد کنید                                                                   |
| `useFrozenTime` / `useRealTime`                      | زمان‌سنج‌ها را برای آزمون‌های حساس به زمان ثابت و بازیابی می‌کند. از `plugin-sdk/test-env` وارد کنید                                                    |
| `createCliRuntimeCapture`                            | خروجی زمان‌اجرای CLI را در آزمون‌ها ثبت می‌کند. از `plugin-sdk/test-fixtures` وارد کنید                                                              |
| `importFreshModule`                                  | یک ماژول ESM را با توکن پرس‌وجوی تازه برای دور زدن کش ماژول وارد می‌کند. از `plugin-sdk/test-fixtures` وارد کنید                             |
| `bundledPluginRoot` / `bundledPluginFile`            | مسیرهای فیکسچر منبع یا توزیع Plugin همراه را حل می‌کند. از `plugin-sdk/test-fixtures` وارد کنید                                              |
| `mockNodeBuiltinModule`                              | شبیه‌سازهای محدود Vitest برای ماژول‌های داخلی Node را نصب می‌کند. از `plugin-sdk/test-node-mocks` وارد کنید                                                       |
| `createSandboxTestContext`                           | زمینه‌های آزمون سندباکس را می‌سازد. از `plugin-sdk/test-fixtures` وارد کنید                                                                      |
| `writeSkill`                                         | فیکسچرهای Skill را بنویسید. از `plugin-sdk/test-fixtures` وارد کنید                                                                             |
| `makeAgentAssistantMessage`                          | فیکسچرهای پیام رونوشت عامل را بسازید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | فیکسچرهای رویداد سیستم را بررسی و بازنشانی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `sanitizeTerminalText`                               | خروجی پایانه را برای گزاره‌های آزمون پاک‌سازی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `countLines` / `hasBalancedFences`                   | شکل خروجی قطعه‌بندی را بررسی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                                     |
| `typedCases`                                         | نوع‌های لفظی را برای آزمون‌های جدول‌محور حفظ کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                    |

مجموعه‌آزمون‌های قرارداد Pluginهای همراه نیز از این زیرمسیرهای آزمون SDK برای
ابزارهای کمکی رجیستری، مانیفست، آرتیفکت عمومی و فیکسچر زمان اجرا که فقط مخصوص آزمون هستند، استفاده می‌کنند.
در عوض، مجموعه‌آزمون‌های مختص هسته که به موجودی Pluginهای همراه OpenClaw وابسته‌اند، در
`src/plugins/contracts` باقی می‌مانند.

### نوع‌ها

زیرمسیرهای متمرکز آزمون، نوع‌های مفید در فایل‌های آزمون را نیز دوباره صادر می‌کنند:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## آزمون تفکیک مقصد

برای افزودن حالت‌های خطای استاندارد تفکیک مقصد کانال، از `installCommonResolveTargetErrorCases` استفاده کنید:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // منطق تفکیک مقصد کانال شما
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // افزودن حالت‌های آزمون مختص کانال
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## الگوهای آزمون

### آزمون قراردادهای ثبت

آزمون‌های واحدی که یک نمونه ساختگی دست‌نویس `api` را به `register(api)` می‌دهند،
دروازه‌های پذیرش بارگذار OpenClaw را پوشش نمی‌دهند. برای هر سطح ثبتی که Plugin شما به آن وابسته است،
حداقل یک آزمون دود مبتنی بر بارگذار اضافه کنید؛ به‌ویژه برای هوک‌ها و قابلیت‌های انحصاری مانند حافظه.

بارگذار واقعی زمانی ثبت Plugin را ناموفق می‌کند که فراداده الزامی وجود نداشته باشد یا
Plugin یک API قابلیت را فراخوانی کند که مالک آن نیست. برای مثال،
`api.registerHook(...)` به نام هوک نیاز دارد و
`api.registerMemoryCapability(...)` مستلزم آن است که مانیفست Plugin یا ورودی صادرشده،
`kind: "memory"` را اعلام کند.

### آزمون دسترسی به پیکربندی زمان اجرا

نمونه ساختگی مشترک زمان اجرای Plugin از `openclaw/plugin-sdk/plugin-test-runtime` را ترجیح دهید.
نمونه‌های ساختگی `runtime.config.loadConfig()` و `runtime.config.writeConfigFile(...)`
آن به‌طور پیش‌فرض خطا می‌دهند تا آزمون‌ها استفاده جدید از APIهای سازگاری منسوخ‌شده را تشخیص دهند.
این نمونه‌های ساختگی را فقط زمانی بازنویسی کنید که آزمون صراحتاً رفتار سازگاری قدیمی را پوشش می‌دهد.

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
    // هیچ مقدار توکنی افشا نمی‌شود
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
      // ... زمینه
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... زمینه
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### ساخت نمونه مصنوعی از زمان اجرای Plugin

برای کدی که از `createPluginRuntimeStore` استفاده می‌کند، در آزمون‌ها زمان اجرا را شبیه‌سازی کنید:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// در راه‌اندازی آزمون
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... سایر نمونه‌های ساختگی
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... سایر فضاهای نام
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// پس از آزمون‌ها
store.clearRuntime();
```

### آزمون با جایگزین‌های مخصوص هر نمونه

جایگزین‌های مخصوص هر نمونه را به تغییر پروتوتایپ ترجیح دهید:

```typescript
// ترجیحی: جایگزین مخصوص هر نمونه
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// اجتناب کنید: تغییر پروتوتایپ
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## آزمون‌های قرارداد (Pluginهای درون مخزن)

Pluginهای همراه آزمون‌های قراردادی دارند که مالکیت ثبت را تأیید می‌کنند:

```bash
pnpm test src/plugins/contracts/
```

این آزمون‌ها موارد زیر را بررسی می‌کنند:

- کدام Pluginها کدام ارائه‌دهندگان را ثبت می‌کنند
- کدام Pluginها کدام ارائه‌دهندگان گفتار را ثبت می‌کنند
- درستی ساختار ثبت
- انطباق با قرارداد زمان اجرا

### اجرای آزمون‌های محدودشده

برای یک Plugin مشخص:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

فقط برای آزمون‌های قرارداد:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## اعمال قواعد لینت (Pluginهای درون مخزن)

`scripts/run-additional-boundary-checks.mjs` مجموعه‌ای از بررسی‌های مرز واردسازی
`lint:plugins:*` را در CI اجرا می‌کند؛ هرکدام را می‌توان به‌صورت مستقل در محیط محلی نیز اجرا کرد:

| فرمان                                                           | آنچه اعمال می‌کند                                                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Pluginهای همراه نمی‌توانند barrel ریشه یکپارچه `openclaw/plugin-sdk` را وارد کنند.                                                       |
| `pnpm run lint:plugins:no-extension-src-imports`               | فایل‌های افزونه محیط تولید نمی‌توانند درخت `src/**` مخزن را مستقیماً وارد کنند (`../../src/...`).                                        |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | فایل‌های آزمون افزونه نمی‌توانند `openclaw/plugin-sdk/testing`،‏ `plugin-sdk/test-utils` یا سایر ابزارهای کمکی آزمون مختص هسته را وارد کنند. |

Pluginهای خارجی مشمول این قواعد لینت نیستند، اما پیروی از همین
الگوها توصیه می‌شود.

## پیکربندی آزمون

OpenClaw از Vitest 4 با گزارش‌دهی اطلاع‌رسان پوشش V8 استفاده می‌کند. برای آزمون‌های Plugin:

```bash
# اجرای همه آزمون‌ها
pnpm test

# اجرای آزمون‌های یک Plugin مشخص
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# اجرا با فیلتر نام آزمون مشخص
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# اجرا با پوشش
pnpm test:coverage
```

اگر اجراهای محلی باعث فشار حافظه می‌شوند:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) -- قراردادهای واردسازی
- [Pluginهای کانال SDK](/fa/plugins/sdk-channel-plugins) -- رابط Plugin کانال
- [Pluginهای ارائه‌دهنده SDK](/fa/plugins/sdk-provider-plugins) -- هوک‌های Plugin ارائه‌دهنده
- [ساخت Pluginها](/fa/plugins/building-plugins) -- راهنمای شروع کار
