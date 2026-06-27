---
read_when:
    - شما در حال نوشتن آزمون‌هایی برای یک Plugin هستید
    - به ابزارهای کمکی آزمون از SDK مربوط به Plugin نیاز دارید
    - می‌خواهید تست‌های قرارداد را برای Pluginهای همراه درک کنید
sidebarTitle: Testing
summary: ابزارها و الگوهای آزمون برای Pluginهای OpenClaw
title: تست Plugin
x-i18n:
    generated_at: "2026-06-27T18:33:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع ابزارهای تست، الگوها و اعمال lint برای Pluginهای OpenClaw.

<Tip>
  **به‌دنبال نمونه‌های تست هستید؟** راهنماهای چگونگی شامل نمونه‌های تست کارشده هستند:
  [تست‌های Plugin کانال](/fa/plugins/sdk-channel-plugins#step-6-test) و
  [تست‌های Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## ابزارهای تست

این زیربخش‌های کمک‌کننده تست، نقطه‌های ورود منبع محلی مخزن برای تست‌های Pluginهای
باندل‌شده خود OpenClaw هستند. آن‌ها exportهای پکیج برای Pluginهای شخص ثالث نیستند و
ممکن است Vitest یا دیگر وابستگی‌های تست مختص مخزن را import کنند.

**import موک API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**import قرارداد runtime عامل:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**import قرارداد کانال:** `openclaw/plugin-sdk/channel-contract-testing`

**import کمک‌کننده تست کانال:** `openclaw/plugin-sdk/channel-test-helpers`

**import تست مقصد کانال:** `openclaw/plugin-sdk/channel-target-testing`

**import قرارداد Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**import تست runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**import قرارداد ارائه‌دهنده:** `openclaw/plugin-sdk/provider-test-contracts`

**import موک HTTP ارائه‌دهنده:** `openclaw/plugin-sdk/provider-http-test-mocks`

**import تست محیط/شبکه:** `openclaw/plugin-sdk/test-env`

**import fixture عمومی:** `openclaw/plugin-sdk/test-fixtures`

**import موک داخلی Node:** `openclaw/plugin-sdk/test-node-mocks`

در مخزن OpenClaw، برای تست‌های جدید Pluginهای باندل‌شده، زیربخش‌های متمرکز زیر را ترجیح دهید.
barrel گسترده
`openclaw/plugin-sdk/testing` فقط برای سازگاری قدیمی است.
guardrailهای مخزن، importهای واقعی جدید از `plugin-sdk/testing` و
`plugin-sdk/test-utils` را رد می‌کنند؛ این نام‌ها فقط به‌عنوان سطح‌های سازگاری منسوخ
برای تست‌های ثبت سازگاری باقی می‌مانند.

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
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | فیکسچر قرارداد مشترک نمایه احراز هویت برای آداپتورهای زمان اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | فیکسچر قرارداد مشترک سرکوب تحویل برای آداپتورهای زمان اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | فیکسچر قرارداد مشترک دسته‌بندی fallback برای آداپتورهای زمان اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید |
| `createParameterFreeTool`                            | فیکسچرهای طرح‌واره ابزار پویا را برای آزمون‌های قرارداد زمان اجرای بومی بسازید. از `plugin-sdk/agent-runtime-test-contracts` وارد کنید              |
| `expectChannelInboundContextContract`                | شکل زمینه ورودی کانال را بررسی کنید. از `plugin-sdk/channel-contract-testing` وارد کنید                                                  |
| `installChannelOutboundPayloadContractSuite`         | موارد قرارداد payload خروجی کانال را نصب کنید. از `plugin-sdk/channel-contract-testing` وارد کنید                                       |
| `createStartAccountContext`                          | زمینه‌های چرخه عمر حساب کانال را بسازید. از `plugin-sdk/channel-test-helpers` وارد کنید                                                  |
| `installChannelActionsContractSuite`                 | موارد قرارداد عمومی کنش پیام کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                     |
| `installChannelSetupContractSuite`                   | موارد قرارداد عمومی راه‌اندازی کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                              |
| `installChannelStatusContractSuite`                  | موارد قرارداد عمومی وضعیت کانال را نصب کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                             |
| `expectDirectoryIds`                                 | شناسه‌های دایرکتوری کانال را از یک تابع فهرست دایرکتوری بررسی کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                               |
| `assertBundledChannelEntries`                        | بررسی کنید که نقاط ورود کانال‌های bundled قرارداد عمومی مورد انتظار را در معرض دسترس قرار می‌دهند. از `plugin-sdk/channel-test-helpers` وارد کنید                    |
| `formatEnvelopeTimestamp`                            | timestampهای قطعی envelope را قالب‌بندی کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                                  |
| `expectPairingReplyText`                             | متن پاسخ جفت‌سازی کانال را بررسی و کد آن را استخراج کنید. از `plugin-sdk/channel-test-helpers` وارد کنید                                    |
| `describePluginRegistrationContract`                 | بررسی‌های قرارداد ثبت Plugin را نصب کنید. از `plugin-sdk/plugin-test-contracts` وارد کنید                                              |
| `registerSingleProviderPlugin`                       | یک Plugin ارائه‌دهنده را در آزمون‌های smoke بارگذار ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                         |
| `registerProviderPlugin`                             | همه گونه‌های ارائه‌دهنده را از یک Plugin ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                                 |
| `registerProviderPlugins`                            | ثبت‌های ارائه‌دهنده را در چند Plugin ثبت کنید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                     |
| `requireRegisteredProvider`                          | بررسی کنید که یک مجموعه ارائه‌دهنده شامل یک شناسه باشد. از `plugin-sdk/plugin-test-runtime` وارد کنید                                           |
| `createRuntimeEnv`                                   | یک محیط زمان اجرای mockشده برای CLI/Plugin بسازید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                              |
| `createPluginSetupWizardStatus`                      | helperهای وضعیت راه‌اندازی را برای Pluginهای کانال بسازید. از `plugin-sdk/plugin-test-runtime` وارد کنید                                             |
| `describeOpenAIProviderRuntimeContract`              | بررسی‌های قرارداد زمان اجرای خانواده ارائه‌دهنده را نصب کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                                        |
| `expectPassthroughReplayPolicy`                      | بررسی کنید که سیاست‌های بازپخش ارائه‌دهنده، ابزارها و فراداده‌های متعلق به ارائه‌دهنده را بدون تغییر عبور می‌دهند. از `plugin-sdk/provider-test-contracts` وارد کنید         |
| `runRealtimeSttLiveTest`                             | یک آزمون زنده ارائه‌دهنده STT بلادرنگ را با فیکسچرهای صوتی مشترک اجرا کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                       |
| `normalizeTranscriptForMatch`                        | خروجی transcript زنده را پیش از assertionهای fuzzy نرمال‌سازی کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                               |
| `expectExplicitVideoGenerationCapabilities`          | بررسی کنید که ارائه‌دهنده‌های ویدئو قابلیت‌های صریح حالت تولید را اعلام می‌کنند. از `plugin-sdk/provider-test-contracts` وارد کنید                   |
| `expectExplicitMusicGenerationCapabilities`          | بررسی کنید که ارائه‌دهنده‌های موسیقی قابلیت‌های صریح تولید/ویرایش را اعلام می‌کنند. از `plugin-sdk/provider-test-contracts` وارد کنید                   |
| `mockSuccessfulDashscopeVideoTask`                   | یک پاسخ موفق وظیفه ویدئویی سازگار با DashScope نصب کنید. از `plugin-sdk/provider-test-contracts` وارد کنید                          |
| `getProviderHttpMocks`                               | به mockهای اختیاری HTTP/احراز هویت ارائه‌دهنده در Vitest دسترسی پیدا کنید. از `plugin-sdk/provider-http-test-mocks` وارد کنید                                         |
| `installProviderHttpMockCleanup`                     | پس از هر آزمون، mockهای HTTP/احراز هویت ارائه‌دهنده را بازنشانی کنید. از `plugin-sdk/provider-http-test-mocks` وارد کنید                                        |
| `installCommonResolveTargetErrorCases`               | موارد آزمون مشترک برای مدیریت خطای حل مقصد. از `plugin-sdk/channel-target-testing` وارد کنید                                  |
| `shouldAckReaction`                                  | بررسی کنید که آیا یک کانال باید واکنش تأیید اضافه کند یا نه. از `plugin-sdk/channel-feedback` وارد کنید                                            |
| `removeAckReactionAfterReply`                        | واکنش تأیید را پس از تحویل پاسخ حذف کنید. از `plugin-sdk/channel-feedback` وارد کنید                                                      |
| `createTestRegistry`                                 | یک فیکسچر registry برای Plugin کانال بسازید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید               |
| `createEmptyPluginRegistry`                          | یک فیکسچر registry خالی برای Plugin بسازید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید                |
| `setActivePluginRegistry`                            | یک فیکسچر registry برای آزمون‌های زمان اجرای Plugin نصب کنید. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` وارد کنید   |
| `createRequestCaptureJsonFetch`                      | درخواست‌های fetch مربوط به JSON را در آزمون‌های helper رسانه ثبت کنید. از `plugin-sdk/test-env` وارد کنید                                                     |
| `withServer`                                         | آزمون‌ها را در برابر یک سرور HTTP محلی disposable اجرا کنید. از `plugin-sdk/test-env` وارد کنید                                                      |
| `createMockIncomingRequest`                          | یک شیء حداقلی درخواست HTTP ورودی بسازید. از `plugin-sdk/test-env` وارد کنید                                                          |
| `withFetchPreconnect`                                | آزمون‌های fetch را با hookهای preconnect نصب‌شده اجرا کنید. از `plugin-sdk/test-env` وارد کنید                                                       |
| `withEnv` / `withEnvAsync`                           | متغیرهای محیطی را به‌طور موقت patch کنید. از `plugin-sdk/test-env` وارد کنید                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | فیکسچرهای آزمون filesystem ایزوله بسازید. از `plugin-sdk/test-env` وارد کنید                                                              |
| `createMockServerResponse`                           | یک mock حداقلی از پاسخ سرور HTTP ایجاد کنید. از `plugin-sdk/test-env` وارد کنید                                                            |
| `createCliRuntimeCapture`                            | خروجی زمان اجرای CLI را در آزمون‌ها ثبت کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                              |
| `importFreshModule`                                  | یک ماژول ESM را با یک توکن query تازه وارد کنید تا cache ماژول دور زده شود. از `plugin-sdk/test-fixtures` وارد کنید                             |
| `bundledPluginRoot` / `bundledPluginFile`            | مسیرهای فیکسچر منبع یا dist مربوط به Plugin bundled را resolve کنید. از `plugin-sdk/test-fixtures` وارد کنید                                              |
| `mockNodeBuiltinModule`                              | mockهای محدود Vitest برای builtinهای Node را نصب کنید. از `plugin-sdk/test-node-mocks` وارد کنید                                                       |
| `createSandboxTestContext`                           | زمینه‌های آزمون sandbox بسازید. از `plugin-sdk/test-fixtures` وارد کنید                                                                      |
| `writeSkill`                                         | فیکسچرهای skill را بنویسید. از `plugin-sdk/test-fixtures` وارد کنید                                                                             |
| `makeAgentAssistantMessage`                          | فیکسچرهای پیام transcript عامل را بسازید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | فیکسچرهای رویداد سیستم را بررسی و بازنشانی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `sanitizeTerminalText`                               | خروجی ترمینال را برای assertionها پاک‌سازی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                          |
| `countLines` / `hasBalancedFences`                   | شکل خروجی chunking را بررسی کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                                     |
| `runProviderCatalog`                                 | یک hook کاتالوگ ارائه‌دهنده را با وابستگی‌های آزمون اجرا کنید                                                                                   |
| `resolveProviderWizardOptions`                       | گزینه‌های ویزارد راه‌اندازی ارائه‌دهنده را در آزمون‌های قرارداد resolve کنید                                                                                  |
| `resolveProviderModelPickerEntries`                  | ورودی‌های انتخاب‌گر مدل ارائه‌دهنده را در آزمون‌های قرارداد resolve کنید                                                                                  |
| `buildProviderPluginMethodChoice`                    | شناسه‌های انتخاب ویزارد ارائه‌دهنده را برای assertionها بسازید                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | ارائه‌دهنده‌های ویزارد ارائه‌دهنده را برای آزمون‌های ایزوله inject کنید                                                                                      |
| `createProviderUsageFetch`                           | ساخت fixtureهای واکشی مصرف ارائه‌دهنده                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | ثابت کردن و بازیابی تایمرها برای آزمون‌های حساس به زمان. از `plugin-sdk/test-env` وارد کنید                                                    |
| `createTestWizardPrompter`                           | ساخت اعلان‌گر شبیه‌سازی‌شده برای جادوگر راه‌اندازی                                                                                                     |
| `createRuntimeTaskFlow`                              | ایجاد وضعیت TaskFlow زمان اجرای ایزوله                                                                                                  |
| `typedCases`                                         | حفظ نوع‌های لفظی برای آزمون‌های جدول‌محور. از `plugin-sdk/test-fixtures` وارد کنید                                                    |

مجموعه‌های قرارداد Pluginهای همراه همچنین از زیرمسیرهای آزمون SDK برای
کمک‌کننده‌های فقط-آزمونِ رجیستری، مانیفست، آرتیفکت عمومی، و فیکسچرهای runtime استفاده می‌کنند. مجموعه‌های فقط-هسته
که به موجودی Pluginهای همراه OpenClaw وابسته‌اند زیر `src/plugins/contracts` می‌مانند.
آزمون‌های extension جدید را روی یک زیرمسیر متمرکز و مستند SDK مانند
`plugin-sdk/plugin-test-api`، `plugin-sdk/channel-contract-testing`،
`plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/channel-test-helpers`،
`plugin-sdk/plugin-test-contracts`، `plugin-sdk/plugin-test-runtime`،
`plugin-sdk/provider-test-contracts`، `plugin-sdk/provider-http-test-mocks`،
`plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` نگه دارید، نه اینکه
barrel سازگاری گسترده‌ی `plugin-sdk/testing`، فایل‌های `src/**` مخزن، یا پل‌های
`test/helpers/*` مخزن را مستقیما import کنید.

### نوع‌ها

زیرمسیرهای آزمون متمرکز همچنین نوع‌های مفید در فایل‌های آزمون را دوباره صادر می‌کنند:

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
حل هدف کانال استفاده کنید:

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

آزمون‌های واحدی که یک mock دست‌نویس `api` را به `register(api)` می‌دهند، gateهای پذیرش loader در
OpenClaw را اجرا نمی‌کنند. برای هر سطح ثبت که Plugin شما به آن وابسته است،
به‌ویژه hookها و قابلیت‌های انحصاری مانند memory، دست‌کم یک آزمون smoke پشتوانه‌دار با loader اضافه کنید.

loader واقعی وقتی متادیتای لازم وجود نداشته باشد یا یک
Plugin یک API قابلیت را صدا بزند که مالک آن نیست، ثبت Plugin را ناموفق می‌کند. برای نمونه،
`api.registerHook(...)` به نام hook نیاز دارد، و
`api.registerMemoryCapability(...)` نیاز دارد که مانیفست Plugin یا entry صادرشده
`kind: "memory"` را declare کند.

### آزمون دسترسی به پیکربندی runtime

هنگام آزمون Pluginهای کانال همراه، mock مشترک runtime Plugin را از `openclaw/plugin-sdk/channel-test-helpers`
ترجیح دهید. mockهای منسوخ `runtime.config.loadConfig()` و
`runtime.config.writeConfigFile(...)` آن به‌صورت پیش‌فرض خطا می‌دهند تا آزمون‌ها استفاده‌ی جدید
از APIهای سازگاری را بگیرند. این mockها را فقط زمانی override کنید که آزمون
صراحتا رفتار سازگاری legacy را پوشش می‌دهد.

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

### آزمون واحد یک Plugin provider

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

### آزمون با stubهای جداگانه برای هر نمونه

stubهای جداگانه برای هر نمونه را به mutation روی prototype ترجیح دهید:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## آزمون‌های قرارداد (Pluginهای درون مخزن)

Pluginهای همراه آزمون‌های قراردادی دارند که مالکیت ثبت را بررسی می‌کنند:

```bash
pnpm test -- src/plugins/contracts/
```

این آزمون‌ها assert می‌کنند:

- کدام Pluginها کدام providerها را ثبت می‌کنند
- کدام Pluginها کدام providerهای گفتار را ثبت می‌کنند
- درستی شکل ثبت
- انطباق با قرارداد runtime

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

## اعمال lint (Pluginهای درون مخزن)

سه قاعده توسط `pnpm check` برای Pluginهای درون مخزن اعمال می‌شود:

1. **بدون importهای یکپارچه از ریشه** -- barrel ریشه‌ی `openclaw/plugin-sdk` رد می‌شود
2. **بدون import مستقیم از `src/`** -- Pluginها نمی‌توانند مستقیما `../../src/` را import کنند
3. **بدون self-import** -- Pluginها نمی‌توانند زیرمسیر `plugin-sdk/<name>` خودشان را import کنند

Pluginهای خارجی مشمول این قواعد lint نیستند، اما پیروی از همان
الگوها توصیه می‌شود.

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

اگر اجراهای محلی باعث فشار حافظه می‌شوند:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview) -- قراردادهای import
- [Pluginهای کانال SDK](/fa/plugins/sdk-channel-plugins) -- interface مربوط به Plugin کانال
- [Pluginهای provider در SDK](/fa/plugins/sdk-provider-plugins) -- hookهای Plugin provider
- [ساخت Pluginها](/fa/plugins/building-plugins) -- راهنمای شروع
