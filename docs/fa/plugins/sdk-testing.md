---
read_when:
    - شما در حال نوشتن آزمون‌هایی برای یک Plugin هستید
    - شما به ابزارهای کمکی آزمایش از کیت توسعه نرم‌افزار Plugin نیاز دارید
    - می‌خواهید تست‌های قرارداد را برای Pluginهای همراه درک کنید
sidebarTitle: Testing
summary: ابزارهای کمکی و الگوهای آزمون برای Plugin‌های OpenClaw
title: آزمایش Plugin
x-i18n:
    generated_at: "2026-04-29T23:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع ابزارهای آزمون، الگوها، و اعمال lint برای Pluginهای OpenClaw.

<Tip>
  **دنبال نمونه‌های آزمون هستید؟** راهنماهای گام‌به‌گام شامل نمونه‌های آزمون حل‌شده هستند:
  [آزمون‌های Plugin کانال](/fa/plugins/sdk-channel-plugins#step-6-test) و
  [آزمون‌های Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## ابزارهای آزمون

**ایمپورت mock برای Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**ایمپورت قرارداد runtime عامل:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**ایمپورت قرارداد کانال:** `openclaw/plugin-sdk/channel-contract-testing`

**ایمپورت کمکی آزمون کانال:** `openclaw/plugin-sdk/channel-test-helpers`

**ایمپورت آزمون هدف کانال:** `openclaw/plugin-sdk/channel-target-testing`

**ایمپورت قرارداد Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**ایمپورت آزمون runtime برای Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**ایمپورت قرارداد ارائه‌دهنده:** `openclaw/plugin-sdk/provider-test-contracts`

**ایمپورت mock برای HTTP ارائه‌دهنده:** `openclaw/plugin-sdk/provider-http-test-mocks`

**ایمپورت آزمون محیط/شبکه:** `openclaw/plugin-sdk/test-env`

**ایمپورت fixture عمومی:** `openclaw/plugin-sdk/test-fixtures`

**ایمپورت mock برای builtin در Node:** `openclaw/plugin-sdk/test-node-mocks`

برای آزمون‌های جدید Plugin، subpathهای متمرکز زیر را ترجیح دهید. barrel گسترده
`openclaw/plugin-sdk/testing` فقط برای سازگاری legacy است.
guardrailهای repo ایمپورت‌های واقعی جدید از `plugin-sdk/testing` و
`plugin-sdk/test-utils` را رد می‌کنند؛ این نام‌ها فقط به‌عنوان سطح‌های سازگاری
منسوخ برای Pluginهای خارجی و آزمون‌های ثبت سازگاری باقی می‌مانند.

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

### خروجی‌های در دسترس

| خروجی                                               | هدف                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | ساخت یک mock حداقلی برای API Plugin جهت آزمون‌های واحد ثبت مستقیم. از `plugin-sdk/plugin-test-api` import کنید                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | fixture قرارداد مشترک نمایه احراز هویت برای آداپتورهای زمان اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` import کنید            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | fixture قرارداد مشترک سرکوب تحویل برای آداپتورهای زمان اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` import کنید    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | fixture قرارداد مشترک طبقه‌بندی fallback برای آداپتورهای زمان اجرای عامل بومی. از `plugin-sdk/agent-runtime-test-contracts` import کنید |
| `createParameterFreeTool`                            | ساخت fixtureهای طرح‌واره ابزار پویا برای آزمون‌های قرارداد زمان اجرای بومی. از `plugin-sdk/agent-runtime-test-contracts` import کنید              |
| `expectChannelInboundContextContract`                | اعتبارسنجی شکل زمینه ورودی کانال. از `plugin-sdk/channel-contract-testing` import کنید                                                  |
| `installChannelOutboundPayloadContractSuite`         | نصب موارد قرارداد payload خروجی کانال. از `plugin-sdk/channel-contract-testing` import کنید                                       |
| `createStartAccountContext`                          | ساخت زمینه‌های چرخه عمر حساب کانال. از `plugin-sdk/channel-test-helpers` import کنید                                                  |
| `installChannelActionsContractSuite`                 | نصب موارد قرارداد عمومی کنش پیام کانال. از `plugin-sdk/channel-test-helpers` import کنید                                     |
| `installChannelSetupContractSuite`                   | نصب موارد قرارداد عمومی راه‌اندازی کانال. از `plugin-sdk/channel-test-helpers` import کنید                                              |
| `installChannelStatusContractSuite`                  | نصب موارد قرارداد عمومی وضعیت کانال. از `plugin-sdk/channel-test-helpers` import کنید                                             |
| `expectDirectoryIds`                                 | اعتبارسنجی شناسه‌های دایرکتوری کانال از یک تابع فهرست‌کردن دایرکتوری. از `plugin-sdk/channel-test-helpers` import کنید                               |
| `assertBundledChannelEntries`                        | اعتبارسنجی اینکه entrypointهای کانال‌های بسته‌بندی‌شده قرارداد عمومی مورد انتظار را ارائه می‌کنند. از `plugin-sdk/channel-test-helpers` import کنید                    |
| `formatEnvelopeTimestamp`                            | قالب‌بندی timestampهای قطعی envelope. از `plugin-sdk/channel-test-helpers` import کنید                                                  |
| `expectPairingReplyText`                             | اعتبارسنجی متن پاسخ جفت‌سازی کانال و استخراج کد آن. از `plugin-sdk/channel-test-helpers` import کنید                                    |
| `describePluginRegistrationContract`                 | نصب بررسی‌های قرارداد ثبت Plugin. از `plugin-sdk/plugin-test-contracts` import کنید                                              |
| `registerSingleProviderPlugin`                       | ثبت یک Plugin ارائه‌دهنده در آزمون‌های smoke بارگذار. از `plugin-sdk/plugin-test-runtime` import کنید                                         |
| `registerProviderPlugin`                             | ثبت همه انواع ارائه‌دهنده از یک Plugin. از `plugin-sdk/plugin-test-runtime` import کنید                                                 |
| `registerProviderPlugins`                            | ثبت ثبت‌نام‌های ارائه‌دهنده در چند Plugin. از `plugin-sdk/plugin-test-runtime` import کنید                                     |
| `requireRegisteredProvider`                          | اعتبارسنجی اینکه یک مجموعه ارائه‌دهنده شامل یک شناسه است. از `plugin-sdk/plugin-test-runtime` import کنید                                           |
| `createRuntimeEnv`                                   | ساخت یک محیط mockشده زمان اجرای CLI/Plugin. از `plugin-sdk/plugin-test-runtime` import کنید                                              |
| `createPluginSetupWizardStatus`                      | ساخت helperهای وضعیت راه‌اندازی برای Pluginهای کانال. از `plugin-sdk/plugin-test-runtime` import کنید                                             |
| `describeOpenAIProviderRuntimeContract`              | نصب بررسی‌های قرارداد زمان اجرای خانواده ارائه‌دهنده. از `plugin-sdk/provider-test-contracts` import کنید                                        |
| `expectPassthroughReplayPolicy`                      | اعتبارسنجی اینکه سیاست‌های بازپخش ارائه‌دهنده، ابزارها و metadata متعلق به ارائه‌دهنده را عبور می‌دهند. از `plugin-sdk/provider-test-contracts` import کنید         |
| `runRealtimeSttLiveTest`                             | اجرای یک آزمون زنده ارائه‌دهنده STT بلادرنگ با fixtureهای صوتی مشترک. از `plugin-sdk/provider-test-contracts` import کنید                       |
| `normalizeTranscriptForMatch`                        | نرمال‌سازی خروجی transcript زنده پیش از assertionهای fuzzy. از `plugin-sdk/provider-test-contracts` import کنید                               |
| `expectExplicitVideoGenerationCapabilities`          | اعتبارسنجی اینکه ارائه‌دهندگان ویدئو قابلیت‌های صریح حالت تولید را اعلام می‌کنند. از `plugin-sdk/provider-test-contracts` import کنید                   |
| `expectExplicitMusicGenerationCapabilities`          | اعتبارسنجی اینکه ارائه‌دهندگان موسیقی قابلیت‌های صریح تولید/ویرایش را اعلام می‌کنند. از `plugin-sdk/provider-test-contracts` import کنید                   |
| `mockSuccessfulDashscopeVideoTask`                   | نصب یک پاسخ task ویدئویی موفق سازگار با DashScope. از `plugin-sdk/provider-test-contracts` import کنید                          |
| `getProviderHttpMocks`                               | دسترسی به mockهای opt-in HTTP/auth ارائه‌دهنده در Vitest. از `plugin-sdk/provider-http-test-mocks` import کنید                                         |
| `installProviderHttpMockCleanup`                     | بازنشانی mockهای HTTP/auth ارائه‌دهنده پس از هر آزمون. از `plugin-sdk/provider-http-test-mocks` import کنید                                        |
| `installCommonResolveTargetErrorCases`               | موارد آزمون مشترک برای مدیریت خطای تفکیک target. از `plugin-sdk/channel-target-testing` import کنید                                  |
| `shouldAckReaction`                                  | بررسی اینکه آیا یک کانال باید واکنش ack اضافه کند. از `plugin-sdk/channel-feedback` import کنید                                            |
| `removeAckReactionAfterReply`                        | حذف واکنش ack پس از تحویل پاسخ. از `plugin-sdk/channel-feedback` import کنید                                                      |
| `createTestRegistry`                                 | ساخت یک fixture رجیستری Plugin کانال. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` import کنید               |
| `createEmptyPluginRegistry`                          | ساخت یک fixture رجیستری خالی Plugin. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` import کنید                |
| `setActivePluginRegistry`                            | نصب یک fixture رجیستری برای آزمون‌های زمان اجرای Plugin. از `plugin-sdk/plugin-test-runtime` یا `plugin-sdk/channel-test-helpers` import کنید   |
| `createRequestCaptureJsonFetch`                      | ثبت درخواست‌های fetch JSON در آزمون‌های helper رسانه. از `plugin-sdk/test-env` import کنید                                                     |
| `withServer`                                         | اجرای آزمون‌ها روی یک سرور HTTP محلی یک‌بارمصرف. از `plugin-sdk/test-env` import کنید                                                      |
| `createMockIncomingRequest`                          | ساخت یک شیء حداقلی درخواست HTTP ورودی. از `plugin-sdk/test-env` import کنید                                                          |
| `withFetchPreconnect`                                | اجرای آزمون‌های fetch با hookهای preconnect نصب‌شده. از `plugin-sdk/test-env` import کنید                                                       |
| `withEnv` / `withEnvAsync`                           | وصله موقت متغیرهای محیطی. از `plugin-sdk/test-env` import کنید                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | ایجاد fixtureهای آزمون filesystem ایزوله. از `plugin-sdk/test-env` import کنید                                                              |
| `createMockServerResponse`                           | ایجاد یک mock حداقلی پاسخ سرور HTTP. از `plugin-sdk/test-env` import کنید                                                            |
| `createCliRuntimeCapture`                            | ثبت خروجی زمان اجرای CLI در آزمون‌ها. از `plugin-sdk/test-fixtures` import کنید                                                              |
| `importFreshModule`                                  | import کردن یک ماژول ESM با یک token پرس‌وجوی تازه برای دور زدن cache ماژول. از `plugin-sdk/test-fixtures` import کنید                             |
| `bundledPluginRoot` / `bundledPluginFile`            | تفکیک مسیرهای fixture منبع یا dist Plugin بسته‌بندی‌شده. از `plugin-sdk/test-fixtures` import کنید                                              |
| `mockNodeBuiltinModule`                              | نصب mockهای محدود Vitest برای builtinهای Node. از `plugin-sdk/test-node-mocks` import کنید                                                       |
| `createSandboxTestContext`                           | ساخت زمینه‌های آزمون sandbox. از `plugin-sdk/test-fixtures` import کنید                                                                      |
| `writeSkill`                                         | نوشتن fixtureهای skill. از `plugin-sdk/test-fixtures` import کنید                                                                             |
| `makeAgentAssistantMessage`                          | ساخت fixtureهای پیام transcript عامل. از `plugin-sdk/test-fixtures` import کنید                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | بررسی و بازنشانی fixtureهای رویداد سیستم. از `plugin-sdk/test-fixtures` import کنید                                                          |
| `sanitizeTerminalText`                               | پاک‌سازی خروجی ترمینال برای assertionها. از `plugin-sdk/test-fixtures` import کنید                                                          |
| `countLines` / `hasBalancedFences`                   | اعتبارسنجی شکل خروجی chunking. از `plugin-sdk/test-fixtures` import کنید                                                                     |
| `runProviderCatalog`                                 | اجرای یک hook کاتالوگ ارائه‌دهنده با وابستگی‌های آزمون                                                                                   |
| `resolveProviderWizardOptions`                       | تفکیک گزینه‌های wizard راه‌اندازی ارائه‌دهنده در آزمون‌های قرارداد                                                                                  |
| `resolveProviderModelPickerEntries`                  | تفکیک entryهای model-picker ارائه‌دهنده در آزمون‌های قرارداد                                                                                  |
| `buildProviderPluginMethodChoice`                    | ساخت شناسه‌های انتخاب wizard ارائه‌دهنده برای assertionها                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | تزریق ارائه‌دهندگان wizard ارائه‌دهنده برای آزمون‌های ایزوله                                                                                      |
| `createProviderUsageFetch`                           | فیکسچرهای واکشی میزان استفادهٔ ارائه‌دهنده را بسازید                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | تایمرها را برای آزمون‌های حساس به زمان ثابت و بازیابی کنید. از `plugin-sdk/test-env` وارد کنید                                                    |
| `createTestWizardPrompter`                           | یک پرامپتر جادوگر راه‌اندازی شبیه‌سازی‌شده بسازید                                                                                                     |
| `createRuntimeTaskFlow`                              | وضعیت جداافتادهٔ جریان وظیفهٔ زمان اجرا را ایجاد کنید                                                                                                  |
| `typedCases`                                         | نوع‌های لیترال را برای آزمون‌های جدول‌محور حفظ کنید. از `plugin-sdk/test-fixtures` وارد کنید                                                    |

مجموعه‌های قرارداد Pluginهای همراه همچنین از زیرمسیرهای آزمون SDK برای کمک‌ابزارهای مخصوص آزمون
registry، manifest، public-artifact و fixtureهای زمان اجرا استفاده می‌کنند. مجموعه‌های فقط هسته
که به موجودی OpenClaw همراه وابسته‌اند، زیر `src/plugins/contracts` باقی می‌مانند.
آزمون‌های جدید extension را به‌جای import مستقیم از barrel سازگاری گسترده
`plugin-sdk/testing`، فایل‌های `src/**` repo، یا پل‌های `test/helpers/*` repo،
روی یک زیرمسیر SDK متمرکز و مستند مانند
`plugin-sdk/plugin-test-api`، `plugin-sdk/channel-contract-testing`،
`plugin-sdk/agent-runtime-test-contracts`، `plugin-sdk/channel-test-helpers`،
`plugin-sdk/plugin-test-contracts`، `plugin-sdk/plugin-test-runtime`،
`plugin-sdk/provider-test-contracts`، `plugin-sdk/provider-http-test-mocks`،
`plugin-sdk/test-env`، یا `plugin-sdk/test-fixtures` نگه دارید.

### انواع

زیرمسیرهای آزمون متمرکز همچنین نوع‌هایی را که در فایل‌های آزمون مفید هستند دوباره export می‌کنند:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## تفکیک هدف آزمون

از `installCommonResolveTargetErrorCases` برای افزودن حالت‌های خطای استاندارد برای
تفکیک هدف channel استفاده کنید:

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
دروازه‌های پذیرش loader در OpenClaw را اجرا نمی‌کنند. برای هر سطح ثبت که Plugin شما به آن وابسته است،
به‌ویژه hookها و قابلیت‌های انحصاری مانند memory، دست‌کم یک آزمون smoke پشتوانه‌دار با loader اضافه کنید.

loader واقعی وقتی metadata لازم وجود نداشته باشد یا یک Plugin API قابلیتی را فراخوانی کند که مالک آن نیست،
ثبت Plugin را با شکست مواجه می‌کند. برای نمونه،
`api.registerHook(...)` به نام hook نیاز دارد، و
`api.registerMemoryCapability(...)` نیاز دارد manifest مربوط به Plugin یا
ورودی exportشده `kind: "memory"` را اعلام کند.

### آزمون دسترسی به پیکربندی زمان اجرا

هنگام آزمون Pluginهای channel همراه، mock مشترک زمان اجرای Plugin از `openclaw/plugin-sdk/channel-test-helpers`
را ترجیح دهید. mockهای منسوخ `runtime.config.loadConfig()` و
`runtime.config.writeConfigFile(...)` آن به‌صورت پیش‌فرض خطا می‌دهند تا آزمون‌ها استفاده جدید
از APIهای سازگاری را تشخیص دهند. این mockها را فقط وقتی override کنید که آزمون
صراحتا رفتار سازگاری قدیمی را پوشش می‌دهد.

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

### آزمون با stubهای هر نمونه

stubهای هر نمونه را به جهش prototype ترجیح دهید:

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

این آزمون‌ها بررسی می‌کنند:

- کدام Pluginها کدام ارائه‌دهنده‌ها را ثبت می‌کنند
- کدام Pluginها کدام ارائه‌دهنده‌های گفتار را ثبت می‌کنند
- درستی شکل ثبت
- انطباق قرارداد زمان اجرا

### اجرای آزمون‌های scoped

برای یک Plugin مشخص:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

فقط برای آزمون‌های قرارداد:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## اعمال lint (Pluginهای داخل repo)

سه قانون توسط `pnpm check` برای Pluginهای داخل repo اعمال می‌شود:

1. **بدون importهای ریشه یکپارچه** -- barrel ریشه `openclaw/plugin-sdk` رد می‌شود
2. **بدون import مستقیم از `src/`** -- Pluginها نمی‌توانند مستقیما از `../../src/` import کنند
3. **بدون self-import** -- Pluginها نمی‌توانند زیرمسیر `plugin-sdk/<name>` خودشان را import کنند

Pluginهای خارجی مشمول این قوانین lint نیستند، اما پیروی از همین
الگوها توصیه می‌شود.

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
