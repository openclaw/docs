---
read_when:
    - أنت تكتب اختبارات لـ plugin
    - تحتاج إلى أدوات الاختبار المساعدة من حزمة تطوير البرمجيات الخاصة بالـ Plugin
    - تريد فهم اختبارات العقود للـ plugins المضمّنة
sidebarTitle: Testing
summary: أدوات وأنماط اختبار إضافات OpenClaw
title: اختبار Plugin
x-i18n:
    generated_at: "2026-07-16T14:43:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع لأدوات الاختبار وأنماطه وإنفاذ قواعد التدقيق في Plugins الخاصة بـ OpenClaw.

<Tip>
  **هل تبحث عن أمثلة للاختبارات؟** تتضمن الأدلة الإرشادية أمثلة اختبار تطبيقية:
  [اختبارات Plugin القناة](/ar/plugins/sdk-channel-plugins#step-6-test) و
  [اختبارات Plugin المزوّد](/ar/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## أدوات الاختبار

هذه المسارات الفرعية هي نقاط دخول مصدرية محلية للمستودع لاختبارات Plugins
المدمجة الخاصة بـ OpenClaw. وهي ليست صادرات `package.json` منشورة للـ
Plugins التابعة لجهات خارجية، وقد تستورد Vitest أو تبعيات اختبار أخرى خاصة بالمستودع فقط.

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

استخدم هذه المسارات الفرعية المركّزة لاختبارات Plugins المدمجة. كان ملف التصدير
`openclaw/plugin-sdk/testing` السابق محليًا للمستودع، ومستبعدًا من الحزم
المشحونة، وقد أُزيل. لا يزال الاسم البديل القديم `openclaw/plugin-sdk/test-utils`
محليًا للمستودع؛ ويرفض `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) عمليات الاستيراد الجديدة لاختبارات
الإضافات من ذلك الاسم البديل.

### الصادرات المتاحة

| التصدير                                               | الغرض                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | إنشاء محاكاة بسيطة لواجهة API الخاصة بـ Plugin لاختبارات الوحدة للتسجيل المباشر. تُستورد من `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | مُثبّت عقد ملف تعريف المصادقة المشترك لمهايئات وقت تشغيل الوكيل الأصلية. يُستورد من `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | مُثبّت عقد منع التسليم المشترك لمهايئات وقت تشغيل الوكيل الأصلية. يُستورد من `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | مُثبّت عقد تصنيف الرجوع الاحتياطي المشترك لمهايئات وقت تشغيل الوكيل الأصلية. يُستورد من `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | إنشاء مُثبّتات مخطط الأدوات الديناميكية لاختبارات عقود وقت التشغيل الأصلية. تُستورد من `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | التحقق من بنية سياق القناة الوارد. تُستورد من `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | تثبيت حالات عقد حمولة القناة الصادرة. تُستورد من `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | إنشاء سياقات دورة حياة حساب القناة. تُستورد من `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | تثبيت حالات عقد إجراءات رسائل القناة العامة. تُستورد من `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | تثبيت حالات عقد إعداد القناة العامة. تُستورد من `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | تثبيت حالات عقد حالة القناة العامة. تُستورد من `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | التحقق من معرّفات دليل القناة من دالة تسرد الدليل. تُستورد من `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | التحقق من أن نقاط دخول القنوات المضمّنة تعرض العقد العام المتوقع. تُستورد من `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | تنسيق الطوابع الزمنية الحتمية للمغلفات. تُستورد من `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | التحقق من نص رد إقران القناة واستخراج رمزه. تُستورد من `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | تثبيت عمليات التحقق من عقد تسجيل Plugin. تُستورد من `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | تسجيل Plugin واحد لمزوّد في اختبارات التحقق الأولية للمحمّل. تُستورد من `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | التقاط جميع أنواع المزوّدين من Plugin واحد. تُستورد من `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | التقاط تسجيلات المزوّدين عبر عدة Plugins. تُستورد من `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | التحقق من أن مجموعة مزوّدين تحتوي على معرّف. تُستورد من `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | إنشاء بيئة محاكاة لوقت تشغيل CLI وPlugin. تُستورد من `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | إنشاء سطح محاكاة لوقت تشغيل Plugin. تُستورد من `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | إنشاء أدوات مساعدة لحالة الإعداد لـ Plugins القنوات. تُستورد من `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | إنشاء موجّه مطالبات محاكى لمعالج الإعداد. تُستورد من `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | إنشاء حالة TaskFlow معزولة لوقت التشغيل. تُستورد من `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | تنفيذ خطاف كتالوج المزوّد باستخدام تبعيات الاختبار. تُستورد من `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | حل خيارات معالج إعداد المزوّد في اختبارات العقود. تُستورد من `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | حل إدخالات منتقي نموذج المزوّد في اختبارات العقود. تُستورد من `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | إنشاء معرّفات خيارات معالج المزوّد لاستخدامها في عمليات التحقق. تُستورد من `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | حقن مزوّدي معالج المزوّد للاختبارات المعزولة. تُستورد من `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | تثبيت عمليات التحقق من عقد وقت التشغيل لعائلة المزوّدين. تُستورد من `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | التحقق من تمرير سياسات إعادة التشغيل الخاصة بالمزوّد عبر الأدوات والبيانات الوصفية التي يملكها المزوّد. تُستورد من `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | تشغيل اختبار مباشر وفوري لمزوّد تحويل الكلام إلى نص باستخدام مُثبّتات صوتية مشتركة. تُستورد من `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | تسوية مخرجات النسخ المباشر قبل عمليات التحقق التقريبية. تُستورد من `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | التحقق من أن مزوّدي الفيديو يعلنون صراحةً قدرات وضع التوليد. تُستورد من `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | التحقق من أن مزوّدي الموسيقى يعلنون صراحةً قدرات التوليد والتحرير. تُستورد من `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | تثبيت استجابة ناجحة لمهمة فيديو متوافقة مع DashScope. تُستورد من `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | الوصول إلى محاكيات Vitest الاختيارية لـ HTTP والمصادقة الخاصة بالمزوّد. تُستورد من `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | إعادة تعيين محاكيات HTTP والمصادقة الخاصة بالمزوّد بعد كل اختبار. تُستورد من `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | حالات اختبار مشتركة لمعالجة أخطاء حل الهدف. تُستورد من `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | التحقق مما إذا كان ينبغي للقناة إضافة تفاعل إقرار. تُستورد من `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | إزالة تفاعل الإقرار بعد تسليم الرد. تُستورد من `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | إنشاء مُثبّت سجل Plugins للقنوات. يُستورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | إنشاء مُثبّت سجل Plugins فارغ. يُستورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | تثبيت مُثبّت سجل لاختبارات وقت تشغيل Plugin. يُستورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | التقاط طلبات جلب JSON في اختبارات أدوات الوسائط المساعدة. تُستورد من `plugin-sdk/test-env`                                                     |
| `withServer`                                         | تشغيل الاختبارات على خادم HTTP محلي مؤقت. تُستورد من `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | إنشاء كائن بسيط لطلب HTTP وارد. يُستورد من `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | تشغيل اختبارات الجلب مع تثبيت خطافات الاتصال المسبق. تُستورد من `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | تعديل متغيرات البيئة مؤقتًا. تُستورد من `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | إنشاء مُثبّتات اختبار معزولة لنظام الملفات. تُستورد من `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | إنشاء محاكاة بسيطة لاستجابة خادم HTTP. تُستورد من `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | إنشاء مُثبّتات جلب استخدام المزوّد. تُستورد من `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | تجميد المؤقتات واستعادتها للاختبارات الحساسة للوقت. تُستورد من `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | التقاط مخرجات وقت تشغيل CLI في الاختبارات. تُستورد من `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | استيراد وحدة ESM باستخدام رمز استعلام جديد لتجاوز ذاكرة التخزين المؤقت للوحدات. تُستورد من `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | حل مسارات مُثبّتات المصدر أو التوزيعة لـ Plugin المضمّن. تُستورد من `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | تثبيت محاكيات Vitest محدودة للمكونات المدمجة في Node. تُستورد من `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | إنشاء سياقات اختبار وضع الحماية. تُستورد من `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | كتابة مُثبّتات Skills. تُستورد من `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | إنشاء مُثبّتات رسائل نص جلسة الوكيل. تُستورد من `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | فحص مُثبّتات أحداث النظام وإعادة تعيينها. تُستورد من `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | تنقية مخرجات الطرفية لاستخدامها في عمليات التحقق. تُستورد من `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | التحقق من بنية مخرجات التقسيم. تُستورد من `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | الحفاظ على الأنواع الحرفية للاختبارات المعتمدة على الجداول. تُستورد من `plugin-sdk/test-fixtures`                                                    |

تستخدم مجموعات عقود Plugins المضمّنة أيضًا مسارات الاختبار الفرعية هذه في SDK لأدوات
السجل وبيان التعريف والعناصر العامة ومُثبّتات وقت التشغيل المخصصة للاختبار فقط.
أما المجموعات الخاصة بالنواة فقط والتي تعتمد على مخزون OpenClaw المضمّن فتبقى ضمن
`src/plugins/contracts` بدلًا من ذلك.

### الأنواع

تعيد مسارات الاختبار الفرعية المركّزة أيضًا تصدير الأنواع المفيدة في ملفات الاختبار:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## اختبار تحليل الوجهة

استخدم `installCommonResolveTargetErrorCases` لإضافة حالات الخطأ القياسية
لتحليل وجهة القناة:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // منطق تحليل وجهة قناتك
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // إضافة حالات اختبار خاصة بالقناة
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## أنماط الاختبار

### اختبار عقود التسجيل

اختبارات الوحدات التي تمرّر محاكاة `api` مكتوبة يدويًا إلى `register(api)` لا
تختبر بوابات قبول المُحمِّل في OpenClaw. أضف اختبار تحقق أوليًا واحدًا على الأقل مدعومًا بالمُحمِّل
لكل سطح تسجيل يعتمد عليه Plugin الخاص بك، وخصوصًا
الخطافات والإمكانات الحصرية مثل الذاكرة.

يفشل المُحمِّل الفعلي في تسجيل Plugin عندما تكون البيانات الوصفية المطلوبة مفقودة أو
يستدعي Plugin واجهة API لإمكان لا يملكه. على سبيل المثال،
يتطلب `api.registerHook(...)` اسم خطاف، ويتطلب
`api.registerMemoryCapability(...)` أن يصرّح بيان Plugin أو
مدخل التصدير بـ `kind: "memory"`.

### اختبار الوصول إلى إعدادات وقت التشغيل

فضّل محاكاة وقت تشغيل Plugin المشتركة من `openclaw/plugin-sdk/plugin-test-runtime`.
تطرح محاكاتا `runtime.config.loadConfig()` و`runtime.config.writeConfigFile(...)`
أخطاء افتراضيًا كي تكتشف الاختبارات الاستخدام الجديد لواجهات API المتقادمة
الخاصة بالتوافق. لا تتجاوز هذه المحاكيات إلا عندما يغطي الاختبار صراحةً
سلوك التوافق القديم.

### اختبار وحدات Plugin قناة

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
    // لا تُكشف قيمة الرمز المميز
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### اختبار وحدات Plugin موفّر

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... السياق
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... السياق
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

// في إعداد الاختبار
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... محاكيات أخرى
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... مساحات أسماء أخرى
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// بعد الاختبارات
store.clearRuntime();
```

### الاختبار باستخدام بدائل لكل مثيل

فضّل البدائل الخاصة بكل مثيل على تعديل النموذج الأولي:

```typescript
// مفضّل: بديل خاص بكل مثيل
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// تجنّب: تعديل النموذج الأولي
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## اختبارات العقود (Plugins داخل المستودع)

تتضمن Plugins المضمّنة اختبارات عقود تتحقق من ملكية التسجيل:

```bash
pnpm test src/plugins/contracts/
```

تتحقق هذه الاختبارات مما يلي:

- أي Plugins تسجّل أي موفّرين
- أي Plugins تسجّل أي موفّري نطق
- صحة بنية التسجيل
- الامتثال لعقد وقت التشغيل

### تشغيل اختبارات محددة النطاق

لـ Plugin معيّن:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

لاختبارات العقود فقط:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## فرض قواعد التدقيق (Plugins داخل المستودع)

يشغّل `scripts/run-additional-boundary-checks.mjs` مجموعة من فحوصات `lint:plugins:*`
لحدود الاستيراد في CI؛ ويمكن أيضًا تشغيل كل منها بصورة مستقلة محليًا:

| الأمر                                                        | ما يفرضه                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | لا يمكن لـ Plugins المضمّنة استيراد حزمة التصدير الجذرية الأحادية `openclaw/plugin-sdk`.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | لا يمكن لملفات الامتدادات الإنتاجية استيراد شجرة المستودع `src/**` مباشرةً (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | لا يمكن لملفات اختبار الامتدادات استيراد `plugin-sdk/test-utils` أو مساعدات الاختبار الأخرى الخاصة بالنواة فقط. |

لا تخضع Plugins الخارجية لقواعد التدقيق هذه، ولكن يُوصى باتباع
الأنماط نفسها.

## إعدادات الاختبار

يستخدم OpenClaw الإصدار Vitest 4 مع تقارير معلوماتية عن تغطية V8. لاختبارات Plugin:

```bash
# تشغيل جميع الاختبارات
pnpm test

# تشغيل اختبارات Plugin معيّن
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# التشغيل باستخدام مرشح اسم اختبار محدد
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# التشغيل مع التغطية
pnpm test:coverage
```

إذا سببت عمليات التشغيل المحلية ضغطًا على الذاكرة:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- اصطلاحات الاستيراد
- [Plugins القنوات في SDK](/ar/plugins/sdk-channel-plugins) -- واجهة Plugin القناة
- [Plugins الموفّرين في SDK](/ar/plugins/sdk-provider-plugins) -- خطافات Plugin الموفّر
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل البدء السريع
