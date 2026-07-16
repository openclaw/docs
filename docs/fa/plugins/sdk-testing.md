---
read_when:
    - در حال نوشتن آزمون‌هایی برای یک Plugin هستید
    - به ابزارهای آزمایش از SDK افزونه نیاز دارید
    - می‌خواهید آزمون‌های قرارداد برای Pluginهای همراه را درک کنید
sidebarTitle: Testing
summary: ابزارها و الگوهای آزمون برای Pluginهای OpenClaw
title: آزمایش Plugin
x-i18n:
    generated_at: "2026-07-16T16:58:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع ابزارهای کمکی آزمون، الگوها و اعمال قواعد lint برای Pluginهای
OpenClaw.

<Tip>
  **دنبال نمونه‌های آزمون هستید؟** راهنماهای عملی شامل نمونه‌های کامل آزمون هستند:
  [آزمون‌های Plugin کانال](/fa/plugins/sdk-channel-plugins#step-6-test) و
  [آزمون‌های Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## ابزارهای کمکی آزمون

این زیرمسیرها نقاط ورود کد منبع محلی مخزن برای آزمون‌های Pluginهای همراه
خود OpenClaw هستند. آن‌ها خروجی‌های `package.json` منتشرشده برای Pluginهای
شخص ثالث نیستند و ممکن است Vitest یا دیگر وابستگی‌های آزمون مختص مخزن را وارد کنند.

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

برای آزمون‌های Pluginهای همراه، از این زیرمسیرهای متمرکز استفاده کنید. barrel پیشین
`openclaw/plugin-sdk/testing` محلیِ مخزن بود، از بسته‌های
منتشرشده کنار گذاشته می‌شد و اکنون حذف شده است. نام مستعار قدیمی `openclaw/plugin-sdk/test-utils`
همچنان محلیِ مخزن باقی مانده است؛ `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) واردکردن‌های جدید آزمون افزونه
از آن نام مستعار را رد می‌کند.

### خروجی‌های موجود

| خروجی                                               | هدف                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | ساخت یک ماک حداقلی از API افزونه برای آزمون‌های واحد ثبت مستقیم. وارد کردن از `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | فیکسچر مشترک قرارداد پروفایل احراز هویت برای آداپتورهای زمان اجرای بومی عامل. وارد کردن از `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | فیکسچر مشترک قرارداد جلوگیری از تحویل برای آداپتورهای زمان اجرای بومی عامل. وارد کردن از `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | فیکسچر مشترک قرارداد طبقه‌بندی جایگزین برای آداپتورهای زمان اجرای بومی عامل. وارد کردن از `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | ساخت فیکسچرهای شِمای ابزار پویا برای آزمون‌های قرارداد زمان اجرای بومی. وارد کردن از `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | بررسی شکل زمینه ورودی کانال. وارد کردن از `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | نصب موارد قرارداد بار مفید خروجی کانال. وارد کردن از `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | ساخت زمینه‌های چرخه عمر حساب کانال. وارد کردن از `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | نصب موارد عمومی قرارداد کنش پیام کانال. وارد کردن از `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | نصب موارد عمومی قرارداد راه‌اندازی کانال. وارد کردن از `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | نصب موارد عمومی قرارداد وضعیت کانال. وارد کردن از `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | بررسی شناسه‌های دایرکتوری کانال از یک تابع فهرست دایرکتوری. وارد کردن از `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | بررسی اینکه نقاط ورود کانال‌های همراه، قرارداد عمومی مورد انتظار را ارائه می‌کنند. وارد کردن از `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | قالب‌بندی مُهرهای زمانی قطعی پوشه. وارد کردن از `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | بررسی متن پاسخ جفت‌سازی کانال و استخراج کد آن. وارد کردن از `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | نصب بررسی‌های قرارداد ثبت Plugin. وارد کردن از `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | ثبت یک Plugin ارائه‌دهنده در آزمون‌های دود بارگذار. وارد کردن از `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | ثبت همه انواع ارائه‌دهنده از یک Plugin. وارد کردن از `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | ثبت موارد ثبت ارائه‌دهنده در چند Plugin. وارد کردن از `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | بررسی اینکه یک مجموعه ارائه‌دهنده حاوی یک شناسه است. وارد کردن از `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | ساخت یک محیط ماک‌شده برای زمان اجرای CLI/Plugin. وارد کردن از `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | ساخت یک سطح ماک‌شده برای زمان اجرای Plugin. وارد کردن از `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | ساخت کمک‌کننده‌های وضعیت راه‌اندازی برای Pluginهای کانال. وارد کردن از `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | ساخت یک درخواست‌کننده ماک‌شده برای جادوگر راه‌اندازی. وارد کردن از `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | ایجاد وضعیت مجزای جریان کار زمان اجرا. وارد کردن از `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | اجرای یک هوک کاتالوگ ارائه‌دهنده با وابستگی‌های آزمون. وارد کردن از `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | حل گزینه‌های جادوگر راه‌اندازی ارائه‌دهنده در آزمون‌های قرارداد. وارد کردن از `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | حل ورودی‌های انتخاب‌گر مدل ارائه‌دهنده در آزمون‌های قرارداد. وارد کردن از `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | ساخت شناسه‌های گزینه جادوگر ارائه‌دهنده برای بررسی‌ها. وارد کردن از `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | تزریق ارائه‌دهندگان جادوگر ارائه‌دهنده برای آزمون‌های مجزا. وارد کردن از `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | نصب بررسی‌های قرارداد زمان اجرای خانواده ارائه‌دهنده. وارد کردن از `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | بررسی اینکه سیاست‌های بازپخش ارائه‌دهنده از ابزارها و فراداده‌های متعلق به ارائه‌دهنده عبور می‌کنند. وارد کردن از `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | اجرای یک آزمون زنده ارائه‌دهنده بلادرنگ تبدیل گفتار به متن با فیکسچرهای صوتی مشترک. وارد کردن از `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | عادی‌سازی خروجی رونویسی زنده پیش از بررسی‌های تقریبی. وارد کردن از `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | بررسی اینکه ارائه‌دهندگان ویدئو قابلیت‌های صریح حالت تولید را اعلام می‌کنند. وارد کردن از `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | بررسی اینکه ارائه‌دهندگان موسیقی قابلیت‌های صریح تولید/ویرایش را اعلام می‌کنند. وارد کردن از `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | نصب یک پاسخ موفق وظیفه ویدئویی سازگار با DashScope. وارد کردن از `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | دسترسی به ماک‌های اختیاری HTTP/احراز هویت Vitest ارائه‌دهنده. وارد کردن از `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | بازنشانی ماک‌های HTTP/احراز هویت ارائه‌دهنده پس از هر آزمون. وارد کردن از `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | موارد آزمون مشترک برای مدیریت خطای حل مقصد. وارد کردن از `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | بررسی اینکه آیا یک کانال باید واکنش تأیید اضافه کند. وارد کردن از `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | حذف واکنش تأیید پس از تحویل پاسخ. وارد کردن از `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | ساخت یک فیکسچر رجیستری Plugin کانال. وارد کردن از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | ساخت یک فیکسچر رجیستری خالی Plugin. وارد کردن از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | نصب یک فیکسچر رجیستری برای آزمون‌های زمان اجرای Plugin. وارد کردن از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | ثبت درخواست‌های واکشی JSON در آزمون‌های کمک‌کننده رسانه. وارد کردن از `plugin-sdk/test-env`                                                     |
| `withServer`                                         | اجرای آزمون‌ها روی یک سرور HTTP محلی یک‌بارمصرف. وارد کردن از `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | ساخت یک شیء حداقلی درخواست HTTP ورودی. وارد کردن از `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | اجرای آزمون‌های واکشی با هوک‌های پیش‌اتصال نصب‌شده. وارد کردن از `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | وصله‌کردن موقت متغیرهای محیطی. وارد کردن از `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | ایجاد فیکسچرهای مجزای آزمون سامانه فایل. وارد کردن از `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | ایجاد یک ماک حداقلی پاسخ سرور HTTP. وارد کردن از `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | ساخت فیکسچرهای واکشی مصرف ارائه‌دهنده. وارد کردن از `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | ثابت‌کردن و بازیابی زمان‌سنج‌ها برای آزمون‌های حساس به زمان. وارد کردن از `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | ثبت خروجی زمان اجرای CLI در آزمون‌ها. وارد کردن از `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | وارد کردن یک ماژول ESM با توکن پرس‌وجوی تازه برای دور زدن حافظه نهان ماژول. وارد کردن از `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | حل مسیرهای فیکسچر مبدأ یا توزیع Plugin همراه. وارد کردن از `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | نصب ماک‌های محدود Vitest برای توابع داخلی Node. وارد کردن از `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | ساخت زمینه‌های آزمون جعبه شنی. وارد کردن از `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | نوشتن فیکسچرهای مهارت. وارد کردن از `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | ساخت فیکسچرهای پیام رونوشت عامل. وارد کردن از `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | بررسی و بازنشانی فیکسچرهای رویداد سامانه. وارد کردن از `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | پاک‌سازی خروجی پایانه برای بررسی‌ها. وارد کردن از `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | بررسی شکل خروجی قطعه‌بندی. وارد کردن از `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | حفظ نوع‌های تحت‌اللفظی برای آزمون‌های جدول‌محور. وارد کردن از `plugin-sdk/test-fixtures`                                                    |

مجموعه‌های قرارداد Pluginهای همراه همچنین از این زیرمسیرهای آزمون SDK برای
کمک‌کننده‌های صرفاً آزمایشی رجیستری، مانیفست، مصنوع عمومی و فیکسچر زمان اجرا استفاده می‌کنند.
مجموعه‌های صرفاً هسته‌ای که به موجودی همراه OpenClaw وابسته‌اند، در عوض زیر
`src/plugins/contracts` باقی می‌مانند.

### نوع‌ها

زیرمسیرهای متمرکز آزمایش نیز typeهای مفید در فایل‌های آزمایش را دوباره export می‌کنند:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## آزمایش تفکیک هدف

برای افزودن موارد خطای استاندارد برای تفکیک هدف کانال، از
`installCommonResolveTargetErrorCases` استفاده کنید:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // منطق تفکیک هدف کانال شما
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // افزودن موارد آزمایش مختص کانال
  it("باید اهداف @username را تفکیک کند", () => {
    // ...
  });
});
```

## الگوهای آزمایش

### آزمایش قراردادهای ثبت

آزمایش‌های واحدی که یک mock دست‌نویس `api` را به `register(api)` می‌دهند،
دروازه‌های پذیرش بارگذار OpenClaw را آزمایش نمی‌کنند. برای هر سطح ثبتی که Plugin شما به آن
وابسته است، دست‌کم یک آزمایش دودِ مبتنی بر بارگذار اضافه کنید؛ به‌ویژه برای hookها و
قابلیت‌های انحصاری مانند حافظه.

بارگذار واقعی زمانی ثبت Plugin را ناموفق می‌کند که فراداده الزامی موجود نباشد یا
یک Plugin، API قابلیتی را فراخوانی کند که مالک آن نیست. برای مثال،
`api.registerHook(...)` به نام hook نیاز دارد و
`api.registerMemoryCapability(...)` مستلزم آن است که manifest افزونه یا ورودی
exportشده، `kind: "memory"` را اعلام کند.

### آزمایش دسترسی به پیکربندی زمان اجرا

mock مشترک زمان اجرای Plugin از `openclaw/plugin-sdk/plugin-test-runtime` را ترجیح دهید.
mockهای `runtime.config.loadConfig()` و `runtime.config.writeConfigFile(...)` آن
به‌طور پیش‌فرض خطا ایجاد می‌کنند تا آزمایش‌ها استفاده جدید از APIهای منسوخ سازگاری را
تشخیص دهند. این mockها را فقط زمانی override کنید که آزمایش صراحتاً رفتار سازگاری
قدیمی را پوشش می‌دهد.

### آزمایش واحد یک Plugin کانال

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("باید حساب را از پیکربندی تفکیک کند", () => {
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

  it("باید حساب را بدون مادی‌سازی اطلاعات محرمانه بررسی کند", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // هیچ مقدار token افشا نمی‌شود
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### آزمایش واحد یک Plugin ارائه‌دهنده

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("باید مدل‌های پویا را تفکیک کند", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... زمینه
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("باید هنگام موجود بودن کلید API، کاتالوگ را برگرداند", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... زمینه
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### ساخت mock از زمان اجرای Plugin

برای کدی که از `createPluginRuntimeStore` استفاده می‌کند، در آزمایش‌ها از زمان اجرا mock بسازید:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "زمان اجرای آزمایشی تنظیم نشده است",
});

// در راه‌اندازی آزمایش
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... mockهای دیگر
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... فضای نام‌های دیگر
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// پس از آزمایش‌ها
store.clearRuntime();
```

### آزمایش با stubهای مختص هر نمونه

stubهای مختص هر نمونه را به تغییر prototype ترجیح دهید:

```typescript
// ترجیحی: stub مختص هر نمونه
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// اجتناب شود: تغییر prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## آزمایش‌های قرارداد (Pluginهای درون مخزن)

Pluginهای همراه دارای آزمایش‌های قراردادی هستند که مالکیت ثبت را تأیید می‌کنند:

```bash
pnpm test src/plugins/contracts/
```

این آزمایش‌ها موارد زیر را بررسی می‌کنند:

- کدام Pluginها کدام ارائه‌دهندگان را ثبت می‌کنند
- کدام Pluginها کدام ارائه‌دهندگان گفتار را ثبت می‌کنند
- درستی شکل ثبت
- انطباق با قرارداد زمان اجرا

### اجرای آزمایش‌های محدود به دامنه

برای یک Plugin مشخص:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

فقط برای آزمایش‌های قرارداد:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## اعمال lint (Pluginهای درون مخزن)

`scripts/run-additional-boundary-checks.mjs` مجموعه‌ای از بررسی‌های مرز import در `lint:plugins:*`
را در CI اجرا می‌کند؛ هرکدام را می‌توان به‌صورت مستقل و محلی نیز اجرا کرد:

| فرمان                                                        | مورد اعمال‌شده                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Pluginهای همراه نمی‌توانند barrel ریشه یکپارچه `openclaw/plugin-sdk` را import کنند.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | فایل‌های extension محیط تولید نمی‌توانند درخت `src/**` مخزن را مستقیماً import کنند (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | فایل‌های آزمایش extension نمی‌توانند `plugin-sdk/test-utils` یا دیگر helperهای آزمایش مختص هسته را import کنند. |

Pluginهای خارجی مشمول این قواعد lint نیستند، اما پیروی از همین
الگوها توصیه می‌شود.

## پیکربندی آزمایش

OpenClaw از Vitest 4 با گزارش اطلاعاتی پوشش V8 استفاده می‌کند. برای آزمایش‌های Plugin:

```bash
# اجرای همه آزمایش‌ها
pnpm test

# اجرای آزمایش‌های یک Plugin مشخص
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# اجرا با فیلتر نام آزمایش مشخص
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# اجرا با پوشش
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
- [ساخت Pluginها](/fa/plugins/building-plugins) -- راهنمای شروع به کار
