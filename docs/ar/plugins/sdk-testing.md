---
read_when:
    - أنت تكتب اختبارات لـ Plugin
    - تحتاج إلى أدوات مساعدة للاختبار من SDK الخاص بـ Plugin
    - تريد فهم اختبارات العقود للـ Plugins المضمّنة
sidebarTitle: Testing
summary: أدوات وأنماط الاختبار لـ Plugins الخاصة بـ OpenClaw
title: اختبار Plugin
x-i18n:
    generated_at: "2026-04-30T08:18:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع لأدوات الاختبار والأنماط وفرض قواعد lint الخاصة بـ OpenClaw
plugins.

<Tip>
  **تبحث عن أمثلة اختبار؟** تتضمن أدلة الكيفية أمثلة اختبار عملية:
  [اختبارات Channel plugin](/ar/plugins/sdk-channel-plugins#step-6-test) و
  [اختبارات Provider plugin](/ar/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## أدوات الاختبار

**استيراد محاكاة Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**استيراد عقد تشغيل Agent:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**استيراد عقد Channel:** `openclaw/plugin-sdk/channel-contract-testing`

**استيراد مساعد اختبار Channel:** `openclaw/plugin-sdk/channel-test-helpers`

**استيراد اختبار هدف Channel:** `openclaw/plugin-sdk/channel-target-testing`

**استيراد عقد Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**استيراد اختبار تشغيل Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**استيراد عقد Provider:** `openclaw/plugin-sdk/provider-test-contracts`

**استيراد محاكاة HTTP لـ Provider:** `openclaw/plugin-sdk/provider-http-test-mocks`

**استيراد اختبار البيئة/الشبكة:** `openclaw/plugin-sdk/test-env`

**استيراد المثبت العام:** `openclaw/plugin-sdk/test-fixtures`

**استيراد محاكاة Node builtin:** `openclaw/plugin-sdk/test-node-mocks`

فضّل المسارات الفرعية المركزة أدناه لاختبارات Plugin الجديدة. إن barrel الواسع
`openclaw/plugin-sdk/testing` مخصص للتوافق القديم فقط.
ترفض حواجز المستودع عمليات الاستيراد الحقيقية الجديدة من `plugin-sdk/testing` و
`plugin-sdk/test-utils`؛ وتبقى هذه الأسماء فقط كأسطح توافق مهملة
لـ plugins خارجية واختبارات سجلات التوافق.

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

### الصادرات المتاحة

| التصدير                                               | الغرض                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | إنشاء محاكاة بسيطة لواجهة API الخاصة بـ Plugin لاختبارات الوحدة للتسجيل المباشر. استورد من `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | عنصر تثبيت مشترك لعقد ملف تعريف المصادقة لمحوّلات تشغيل الوكلاء الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | عنصر تثبيت مشترك لعقد منع التسليم لمحوّلات تشغيل الوكلاء الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | عنصر تثبيت مشترك لعقد تصنيف الرجوع لمحوّلات تشغيل الوكلاء الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | إنشاء عناصر تثبيت لمخطط الأدوات الديناميكية لاختبارات عقد التشغيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | التحقق من شكل سياق القناة الوارد. استورد من `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | تثبيت حالات عقد حمولة القناة الصادرة. استورد من `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | إنشاء سياقات دورة حياة حساب القناة. استورد من `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | تثبيت حالات عقد إجراءات رسائل القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | تثبيت حالات عقد إعداد القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | تثبيت حالات عقد حالة القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | التحقق من معرّفات دليل القناة من دالة سرد دليل. استورد من `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | التحقق من أن نقاط إدخال القنوات المضمّنة تكشف العقد العام المتوقع. استورد من `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | تنسيق الطوابع الزمنية الحتمية للمغلّف. استورد من `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | التحقق من نص رد إقران القناة واستخراج الرمز الخاص به. استورد من `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | تثبيت فحوص عقد تسجيل Plugin. استورد من `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | تسجيل Plugin موفّر واحد في اختبارات الدخان للمحمّل. استورد من `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | التقاط جميع أنواع الموفّرين من Plugin واحد. استورد من `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | التقاط تسجيلات الموفّرين عبر عدة Plugins. استورد من `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | التحقق من أن مجموعة موفّرين تحتوي على معرّف. استورد من `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | إنشاء بيئة تشغيل CLI/Plugin محاكية. استورد من `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginSetupWizardStatus`                      | إنشاء مساعدات حالة الإعداد لـ Plugins القنوات. استورد من `plugin-sdk/plugin-test-runtime`                                             |
| `describeOpenAIProviderRuntimeContract`              | تثبيت فحوص عقد تشغيل عائلة الموفّرين. استورد من `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | التحقق من أن سياسات إعادة التشغيل لدى الموفّر تمرر الأدوات والبيانات الوصفية المملوكة للموفّر كما هي. استورد من `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | تشغيل اختبار موفّر STT فوري مباشر باستخدام عناصر تثبيت صوتية مشتركة. استورد من `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | تطبيع خرج النص المنسوخ المباشر قبل التأكيدات التقريبية. استورد من `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | التحقق من أن موفّري الفيديو يعلنون صراحة إمكانات وضع التوليد. استورد من `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | التحقق من أن موفّري الموسيقى يعلنون صراحة إمكانات التوليد/التحرير. استورد من `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | تثبيت استجابة مهمة فيديو ناجحة متوافقة مع DashScope. استورد من `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | الوصول إلى محاكيات Vitest الاختيارية لـ HTTP/المصادقة الخاصة بالموفّر. استورد من `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | إعادة تعيين محاكيات HTTP/المصادقة الخاصة بالموفّر بعد كل اختبار. استورد من `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | حالات اختبار مشتركة لمعالجة أخطاء حل الهدف. استورد من `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | التحقق مما إذا كان ينبغي للقناة إضافة تفاعل إقرار. استورد من `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | إزالة تفاعل الإقرار بعد تسليم الرد. استورد من `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | إنشاء عنصر تثبيت لسجل Plugin قناة. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | إنشاء عنصر تثبيت لسجل Plugin فارغ. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | تثبيت عنصر تثبيت للسجل لاختبارات تشغيل Plugin. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | التقاط طلبات جلب JSON في اختبارات مساعد الوسائط. استورد من `plugin-sdk/test-env`                                                     |
| `withServer`                                         | تشغيل الاختبارات مقابل خادم HTTP محلي قابل للتخلص منه. استورد من `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | إنشاء كائن طلب HTTP وارد بسيط. استورد من `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | تشغيل اختبارات الجلب مع تثبيت خطافات الاتصال المسبق. استورد من `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | تعديل متغيرات البيئة مؤقتا. استورد من `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | إنشاء عناصر تثبيت لاختبارات نظام ملفات معزولة. استورد من `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | إنشاء محاكاة بسيطة لاستجابة خادم HTTP. استورد من `plugin-sdk/test-env`                                                            |
| `createCliRuntimeCapture`                            | التقاط خرج تشغيل CLI في الاختبارات. استورد من `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | استيراد وحدة ESM باستخدام رمز استعلام جديد لتجاوز ذاكرة التخزين المؤقت للوحدات. استورد من `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | حل مسارات عناصر تثبيت مصدر Plugin المضمّن أو التوزيعة. استورد من `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | تثبيت محاكيات Vitest ضيقة لوحدات Node المضمّنة. استورد من `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | إنشاء سياقات اختبار وضع الحماية. استورد من `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | كتابة عناصر تثبيت Skills. استورد من `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | إنشاء عناصر تثبيت لرسائل نصوص الوكيل. استورد من `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | فحص عناصر تثبيت أحداث النظام وإعادة تعيينها. استورد من `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | تنقية خرج الطرفية للتأكيدات. استورد من `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | التحقق من شكل خرج التقسيم إلى أجزاء. استورد من `plugin-sdk/test-fixtures`                                                                     |
| `runProviderCatalog`                                 | تنفيذ خطاف كتالوج موفّر باستخدام اعتماديات الاختبار                                                                                   |
| `resolveProviderWizardOptions`                       | حل اختيارات معالج إعداد الموفّر في اختبارات العقد                                                                                  |
| `resolveProviderModelPickerEntries`                  | حل إدخالات منتقي نماذج الموفّر في اختبارات العقد                                                                                  |
| `buildProviderPluginMethodChoice`                    | إنشاء معرّفات اختيارات معالج الموفّر للتأكيدات                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | حقن موفّري معالج الموفّر للاختبارات المعزولة                                                                                      |
| `createProviderUsageFetch`                           | إنشاء تجهيزات اختبار لجلب استخدام المزوّد                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | تجميد المؤقّتات واستعادتها للاختبارات الحسّاسة للوقت. استورد من `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | إنشاء مُوجّه معالج إعدادات وهمي                                                                                                     |
| `createRuntimeTaskFlow`                              | إنشاء حالة تدفّق مهام وقت تشغيل معزولة                                                                                                  |
| `typedCases`                                         | الحفاظ على الأنواع الحرفية للاختبارات المعتمدة على الجداول. استورد من `plugin-sdk/test-fixtures`                                                    |

تستخدم مجموعات عقود Plugin المضمّنة أيضًا مسارات SDK الفرعية للاختبار لمساعدات
السجل والبيان والأثر العام وتركيبات وقت التشغيل المخصّصة للاختبار فقط. تبقى
المجموعات الخاصة بالنواة فقط التي تعتمد على مخزون OpenClaw المضمّن ضمن `src/plugins/contracts`.
أبقِ اختبارات الإضافات الجديدة على مسار SDK فرعي موثّق ومركّز مثل
`plugin-sdk/plugin-test-api` أو `plugin-sdk/channel-contract-testing` أو
`plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/channel-test-helpers` أو
`plugin-sdk/plugin-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو
`plugin-sdk/provider-test-contracts` أو `plugin-sdk/provider-http-test-mocks` أو
`plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلًا من استيراد حزمة
التوافق العامة `plugin-sdk/testing` أو ملفات المستودع `src/**` أو جسور
`test/helpers/*` الخاصة بالمستودع مباشرةً.

### الأنواع

تعيد مسارات الاختبار الفرعية المركّزة أيضًا تصدير أنواع مفيدة في ملفات الاختبار:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## اختبار حلّ الهدف

استخدم `installCommonResolveTargetErrorCases` لإضافة حالات الخطأ القياسية لحلّ
هدف القناة:

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

## أنماط الاختبار

### اختبار عقود التسجيل

اختبارات الوحدة التي تمرّر محاكاة `api` مكتوبة يدويًا إلى `register(api)` لا تختبر
بوابات قبول محمّل OpenClaw. أضف اختبار دخان واحدًا على الأقل مدعومًا بالمحمّل
لكل سطح تسجيل يعتمد عليه Plugin لديك، وخصوصًا الخطافات والقدرات الحصرية مثل
الذاكرة.

يفشل المحمّل الحقيقي تسجيل Plugin عندما تكون البيانات الوصفية المطلوبة مفقودة أو
عندما يستدعي Plugin واجهة API لقدرة لا يملكها. على سبيل المثال،
يتطلب `api.registerHook(...)` اسم خطاف، ويتطلب
`api.registerMemoryCapability(...)` أن يعلن بيان Plugin أو مدخل التصدير
`kind: "memory"`.

### اختبار الوصول إلى إعدادات وقت التشغيل

فضّل محاكاة وقت تشغيل Plugin المشتركة من `openclaw/plugin-sdk/channel-test-helpers`
عند اختبار Plugins القنوات المضمّنة. ترمي محاكيات `runtime.config.loadConfig()` و
`runtime.config.writeConfigFile(...)` المهملة افتراضيًا كي تلتقط الاختبارات أي
استخدام جديد لواجهات API الخاصة بالتوافق. لا تتجاوز هذه المحاكيات إلا عندما يكون
الاختبار يغطي صراحةً سلوك التوافق القديم.

### اختبار وحدة Plugin قناة

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

### اختبار وحدة Plugin مزوّد

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

### محاكاة وقت تشغيل Plugin

بالنسبة إلى الشيفرة التي تستخدم `createPluginRuntimeStore`، حاكِ وقت التشغيل في الاختبارات:

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

### الاختبار باستخدام بدائل لكل مثيل

فضّل البدائل لكل مثيل على تعديل النموذج الأولي:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## اختبارات العقود (Plugins داخل المستودع)

لدى Plugins المضمّنة اختبارات عقود تتحقق من ملكية التسجيل:

```bash
pnpm test -- src/plugins/contracts/
```

تؤكد هذه الاختبارات:

- أي Plugins تسجّل أي مزوّدين
- أي Plugins تسجّل أي مزوّدي كلام
- صحة شكل التسجيل
- الامتثال لعقد وقت التشغيل

### تشغيل الاختبارات محددة النطاق

بالنسبة إلى Plugin محدد:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

لاختبارات العقود فقط:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## فرض الفحص (Plugins داخل المستودع)

يفرض `pnpm check` ثلاث قواعد على Plugins داخل المستودع:

1. **لا استيرادات جذرية أحادية ضخمة** -- تُرفض حزمة الجذر `openclaw/plugin-sdk`
2. **لا استيرادات مباشرة من `src/`** -- لا يمكن لـ Plugins استيراد `../../src/` مباشرةً
3. **لا استيرادات ذاتية** -- لا يمكن لـ Plugins استيراد مسارها الفرعي `plugin-sdk/<name>` الخاص بها

لا تخضع Plugins الخارجية لقواعد الفحص هذه، لكن يوصى باتباع الأنماط نفسها.

## إعدادات الاختبار

يستخدم OpenClaw Vitest مع عتبات تغطية V8. لاختبارات Plugin:

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

إذا سببت عمليات التشغيل المحلية ضغطًا على الذاكرة:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ذات صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- اصطلاحات الاستيراد
- [Plugins قنوات SDK](/ar/plugins/sdk-channel-plugins) -- واجهة Plugin القناة
- [Plugins مزوّدي SDK](/ar/plugins/sdk-provider-plugins) -- خطافات Plugin المزوّد
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل البدء السريع
