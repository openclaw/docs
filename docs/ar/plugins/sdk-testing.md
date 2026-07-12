---
read_when:
    - أنت تكتب اختبارات لـ Plugin
    - تحتاج إلى أدوات اختبار مساعدة من SDK الخاص بالـ Plugin
    - تريد فهم اختبارات العقود للملحقات المضمّنة
sidebarTitle: Testing
summary: أدوات وأنماط الاختبار لإضافات OpenClaw
title: اختبار Plugin
x-i18n:
    generated_at: "2026-07-12T06:25:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع لأدوات الاختبار وأنماطه وفرض قواعد التدقيق على Plugins في OpenClaw.

<Tip>
  **هل تبحث عن أمثلة للاختبارات؟** تتضمن الأدلة الإرشادية أمثلة اختبار تطبيقية:
  [اختبارات Plugin القناة](/ar/plugins/sdk-channel-plugins#step-6-test) و
  [اختبارات Plugin المزوّد](/ar/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## أدوات الاختبار

هذه المسارات الفرعية هي نقاط دخول إلى الشيفرة المصدرية المحلية للمستودع، ومخصصة لاختبارات Plugins المضمّنة في OpenClaw. وهي ليست تصديرات `package.json` منشورة لـ Plugins التابعة لجهات خارجية، وقد تستورد Vitest أو تبعيات اختبار أخرى خاصة بالمستودع.

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

استخدم هذه المسارات الفرعية المتخصصة تفضيليًا لاختبارات Plugins المضمّنة الجديدة. أما واجهة التصدير الشاملة `openclaw/plugin-sdk/testing` والاسم البديل `openclaw/plugin-sdk/test-utils` فهما مخصصان للتوافق القديم فقط: يرفض الأمر `pnpm run lint:plugins:no-extension-test-core-imports` ‏(`scripts/check-no-extension-test-core-imports.ts`) أي عمليات استيراد جديدة لأيٍّ منهما من ملفات اختبار الامتدادات، ويظل كلاهما مخصصًا حصريًا لاختبارات تسجيل التوافق.

### التصديرات المتاحة

| التصدير                                              | الغرض                                                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | إنشاء محاكاة مبسطة لواجهة برمجة تطبيقات Plugin لاختبارات الوحدة الخاصة بالتسجيل المباشر. تُستورد من `plugin-sdk/plugin-test-api`       |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | مُثبّت عقد ملف تعريف المصادقة المشترك لمهايئات وقت تشغيل الوكيل الأصلية. يُستورد من `plugin-sdk/agent-runtime-test-contracts`          |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | مُثبّت عقد منع التسليم المشترك لمهايئات وقت تشغيل الوكيل الأصلية. يُستورد من `plugin-sdk/agent-runtime-test-contracts`                 |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | مُثبّت عقد تصنيف الإجراء الاحتياطي المشترك لمهايئات وقت تشغيل الوكيل الأصلية. يُستورد من `plugin-sdk/agent-runtime-test-contracts`     |
| `createParameterFreeTool`                            | إنشاء مُثبّتات مخطط الأدوات الديناميكية لاختبارات عقد وقت التشغيل الأصلي. تُستورد من `plugin-sdk/agent-runtime-test-contracts`         |
| `expectChannelInboundContextContract`                | التحقق من بنية سياق القناة الوارد. تُستورد من `plugin-sdk/channel-contract-testing`                                                     |
| `installChannelOutboundPayloadContractSuite`         | تثبيت حالات عقد الحمولة الصادرة للقناة. تُستورد من `plugin-sdk/channel-contract-testing`                                                |
| `createStartAccountContext`                          | إنشاء سياقات دورة حياة حساب القناة. تُستورد من `plugin-sdk/channel-test-helpers`                                                       |
| `installChannelActionsContractSuite`                 | تثبيت حالات عقد إجراءات رسائل القناة العامة. تُستورد من `plugin-sdk/channel-test-helpers`                                              |
| `installChannelSetupContractSuite`                   | تثبيت حالات عقد إعداد القناة العامة. تُستورد من `plugin-sdk/channel-test-helpers`                                                       |
| `installChannelStatusContractSuite`                  | تثبيت حالات عقد حالة القناة العامة. تُستورد من `plugin-sdk/channel-test-helpers`                                                        |
| `expectDirectoryIds`                                 | التحقق من معرّفات دليل القناة الناتجة من دالة سرد الدليل. تُستورد من `plugin-sdk/channel-test-helpers`                                 |
| `assertBundledChannelEntries`                        | التحقق من أن نقاط دخول القنوات المضمّنة تعرض العقد العام المتوقع. تُستورد من `plugin-sdk/channel-test-helpers`                         |
| `formatEnvelopeTimestamp`                            | تنسيق الطوابع الزمنية الحتمية للمغلفات. تُستورد من `plugin-sdk/channel-test-helpers`                                                    |
| `expectPairingReplyText`                             | التحقق من نص رد إقران القناة واستخراج رمزه. تُستورد من `plugin-sdk/channel-test-helpers`                                                |
| `describePluginRegistrationContract`                 | تثبيت فحوصات عقد تسجيل Plugin. تُستورد من `plugin-sdk/plugin-test-contracts`                                                            |
| `registerSingleProviderPlugin`                       | تسجيل Plugin واحد لمزوّد في اختبارات التحقق الأولية للمحمّل. تُستورد من `plugin-sdk/plugin-test-runtime`                              |
| `registerProviderPlugin`                             | التقاط جميع أنواع المزوّدين من Plugin واحد. تُستورد من `plugin-sdk/plugin-test-runtime`                                                |
| `registerProviderPlugins`                            | التقاط تسجيلات المزوّدين عبر عدة Plugins. تُستورد من `plugin-sdk/plugin-test-runtime`                                                  |
| `requireRegisteredProvider`                          | التحقق من أن مجموعة المزوّدين تحتوي على معرّف. تُستورد من `plugin-sdk/plugin-test-runtime`                                             |
| `createRuntimeEnv`                                   | إنشاء بيئة وقت تشغيل وهمية لـ CLI وPlugin. تُستورد من `plugin-sdk/plugin-test-runtime`                                                 |
| `createPluginRuntimeMock`                            | إنشاء سطح وقت تشغيل وهمي لـ Plugin. تُستورد من `plugin-sdk/plugin-test-runtime`                                                        |
| `createPluginSetupWizardStatus`                      | إنشاء أدوات مساعدة لحالة الإعداد لقنوات Plugins. تُستورد من `plugin-sdk/plugin-test-runtime`                                           |
| `createTestWizardPrompter`                           | إنشاء موجّه وهمي لمعالج الإعداد. تُستورد من `plugin-sdk/plugin-test-runtime`                                                           |
| `createRuntimeTaskFlow`                              | إنشاء حالة معزولة لتدفق مهام وقت التشغيل. تُستورد من `plugin-sdk/plugin-test-runtime`                                                  |
| `runProviderCatalog`                                 | تنفيذ خطاف كتالوج مزوّد باستخدام تبعيات الاختبار. تُستورد من `plugin-sdk/plugin-test-runtime`                                         |
| `resolveProviderWizardOptions`                       | حل خيارات معالج إعداد المزوّد في اختبارات العقد. تُستورد من `plugin-sdk/plugin-test-runtime`                                          |
| `resolveProviderModelPickerEntries`                  | حل إدخالات منتقي نماذج المزوّد في اختبارات العقد. تُستورد من `plugin-sdk/plugin-test-runtime`                                         |
| `buildProviderPluginMethodChoice`                    | إنشاء معرّفات خيارات معالج المزوّد لاستخدامها في عمليات التحقق. تُستورد من `plugin-sdk/plugin-test-runtime`                           |
| `setProviderWizardProvidersResolverForTest`          | حقن مزوّدي معالج المزوّد لاختبارات معزولة. تُستورد من `plugin-sdk/plugin-test-runtime`                                                 |
| `describeOpenAIProviderRuntimeContract`              | تثبيت فحوصات عقد وقت التشغيل لعائلة المزوّدين. تُستورد من `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | التحقق من أن سياسات إعادة التشغيل للمزوّد تمرّر الأدوات والبيانات الوصفية المملوكة له. تُستورد من `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | تشغيل اختبار مباشر لمزوّد تحويل الكلام إلى نص في الوقت الفعلي باستخدام مُثبّتات صوتية مشتركة. تُستورد من `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | تسوية مخرجات النسخ المباشر قبل عمليات التحقق التقريبية. تُستورد من `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | التحقق من أن مزوّدي الفيديو يصرّحون صراحةً بإمكانات وضع التوليد. تُستورد من `plugin-sdk/provider-test-contracts`                        |
| `expectExplicitMusicGenerationCapabilities`          | التحقق من أن مزوّدي الموسيقى يصرّحون صراحةً بإمكانات التوليد والتحرير. تُستورد من `plugin-sdk/provider-test-contracts`                  |
| `mockSuccessfulDashscopeVideoTask`                   | تثبيت استجابة ناجحة لمهمة فيديو متوافقة مع DashScope. تُستورد من `plugin-sdk/provider-test-contracts`                                  |
| `getProviderHttpMocks`                               | الوصول إلى محاكيات Vitest الاختيارية لـ HTTP والمصادقة الخاصة بالمزوّد. تُستورد من `plugin-sdk/provider-http-test-mocks`               |
| `installProviderHttpMockCleanup`                     | إعادة ضبط محاكيات HTTP والمصادقة الخاصة بالمزوّد بعد كل اختبار. تُستورد من `plugin-sdk/provider-http-test-mocks`                       |
| `installCommonResolveTargetErrorCases`               | حالات اختبار مشتركة لمعالجة أخطاء حل الهدف. تُستورد من `plugin-sdk/channel-target-testing`                                             |
| `shouldAckReaction`                                  | التحقق مما إذا كان ينبغي للقناة إضافة تفاعل إقرار. تُستورد من `plugin-sdk/channel-feedback`                                           |
| `removeAckReactionAfterReply`                        | إزالة تفاعل الإقرار بعد تسليم الرد. تُستورد من `plugin-sdk/channel-feedback`                                                           |
| `createTestRegistry`                                 | إنشاء مُثبّت لسجل Plugins القناة. تُستورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                      |
| `createEmptyPluginRegistry`                          | إنشاء مُثبّت لسجل Plugins فارغ. تُستورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                        |
| `setActivePluginRegistry`                            | تثبيت مُثبّت سجل لاختبارات وقت تشغيل Plugin. تُستورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`          |
| `createRequestCaptureJsonFetch`                      | التقاط طلبات جلب JSON في اختبارات أدوات الوسائط المساعدة. تُستورد من `plugin-sdk/test-env`                                             |
| `withServer`                                         | تشغيل الاختبارات على خادم HTTP محلي قابل للتخلص منه. تُستورد من `plugin-sdk/test-env`                                                  |
| `createMockIncomingRequest`                          | إنشاء كائن مبسّط لطلب HTTP وارد. تُستورد من `plugin-sdk/test-env`                                                                      |
| `withFetchPreconnect`                                | تشغيل اختبارات الجلب مع تثبيت خطافات الاتصال المسبق. تُستورد من `plugin-sdk/test-env`                                                  |
| `withEnv` / `withEnvAsync`                           | تعديل متغيرات البيئة مؤقتًا. تُستورد من `plugin-sdk/test-env`                                                                          |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | إنشاء مُثبّتات اختبار معزولة لنظام الملفات. تُستورد من `plugin-sdk/test-env`                                                           |
| `createMockServerResponse`                           | إنشاء محاكاة مبسطة لاستجابة خادم HTTP. تُستورد من `plugin-sdk/test-env`                                                               |
| `createProviderUsageFetch`                           | إنشاء مُثبّتات لجلب استخدام المزوّد. تُستورد من `plugin-sdk/test-env`                                                                 |
| `useFrozenTime` / `useRealTime`                      | تجميد المؤقتات واستعادتها للاختبارات الحساسة للوقت. تُستورد من `plugin-sdk/test-env`                                                   |
| `createCliRuntimeCapture`                            | التقاط مخرجات وقت تشغيل CLI في الاختبارات. تُستورد من `plugin-sdk/test-fixtures`                                                      |
| `importFreshModule`                                  | استيراد وحدة ESM باستخدام رمز استعلام جديد لتجاوز ذاكرة التخزين المؤقت للوحدات. تُستورد من `plugin-sdk/test-fixtures`                  |
| `bundledPluginRoot` / `bundledPluginFile`            | حل مسارات مُثبّتات مصدر Plugin المضمّن أو توزيعه. تُستورد من `plugin-sdk/test-fixtures`                                                |
| `mockNodeBuiltinModule`                              | تثبيت محاكيات Vitest محدودة لوحدات Node المدمجة. تُستورد من `plugin-sdk/test-node-mocks`                                               |
| `createSandboxTestContext`                           | إنشاء سياقات اختبار وضع الحماية. تُستورد من `plugin-sdk/test-fixtures`                                                                |
| `writeSkill`                                         | اكتب تجهيزات Skills الاختبارية. استوردها من `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | أنشئ تجهيزات رسائل سجل محادثة الوكيل. استوردها من `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | افحص تجهيزات أحداث النظام وأعد تعيينها. استوردها من `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | نظّف مخرجات الطرفية لاستخدامها في التحققات. استوردها من `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | تحقّق من بنية مخرجات التقسيم إلى أجزاء. استوردها من `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | حافظ على الأنواع الحرفية للاختبارات المعتمدة على الجداول. استوردها من `plugin-sdk/test-fixtures`                                                    |

تستخدم حزم اختبارات عقد الـ Plugin المضمّنة أيضًا هذه المسارات الفرعية لاختبار SDK من أجل
مساعدات السجل والبيان والعناصر العامة وتجهيزات وقت التشغيل المخصّصة للاختبارات فقط.
أما حزم الاختبارات الخاصة بالنواة فقط، والتي تعتمد على مخزون OpenClaw المضمّن، فتبقى ضمن
`src/plugins/contracts` بدلًا من ذلك.

### الأنواع

تعيد المسارات الفرعية المخصّصة للاختبار المركّز أيضًا تصدير أنواع مفيدة في ملفات الاختبار:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## اختبار تحليل الوجهة

استخدم `installCommonResolveTargetErrorCases` لإضافة حالات الخطأ القياسية الخاصة
بتحليل وجهة القناة:

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

لا تمارس اختبارات الوحدة التي تمرّر محاكاة `api` مكتوبة يدويًا إلى `register(api)`
بوابات قبول المُحمّل في OpenClaw. أضف اختبار تحقق أوليًا واحدًا على الأقل مدعومًا
بالمُحمّل لكل سطح تسجيل يعتمد عليه الـ Plugin، خصوصًا الخطافات والإمكانات الحصرية
مثل الذاكرة.

يفشل المُحمّل الفعلي في تسجيل الـ Plugin عند غياب البيانات الوصفية المطلوبة، أو
عندما يستدعي الـ Plugin واجهة API لإمكانية لا يملكها. على سبيل المثال،
يتطلب `api.registerHook(...)` اسم خطاف، ويتطلب
`api.registerMemoryCapability(...)` أن يصرّح بيان الـ Plugin أو المُدخل المصدَّر
بـ `kind: "memory"`.

### اختبار الوصول إلى إعدادات وقت التشغيل

فضّل محاكاة وقت تشغيل الـ Plugin المشتركة من `openclaw/plugin-sdk/plugin-test-runtime`.
تطرح محاكاتا `runtime.config.loadConfig()` و`runtime.config.writeConfigFile(...)`
أخطاء افتراضيًا كي تكتشف الاختبارات أي استخدام جديد لواجهات API المتقادمة الخاصة
بالتوافق. لا تتجاوز هاتين المحاكاتين إلا عندما يغطي الاختبار صراحةً سلوك التوافق
القديم.

### اختبار وحدة لـ Plugin قناة

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

### اختبار وحدة لـ Plugin موفّر

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

### محاكاة وقت تشغيل الـ Plugin

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

### الاختبار باستخدام بدائل خاصة بكل نسخة

فضّل البدائل الخاصة بكل نسخة على تعديل النموذج الأولي:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## اختبارات العقود (الـ Plugins داخل المستودع)

تتضمن الـ Plugins المضمّنة اختبارات عقود تتحقق من ملكية التسجيل:

```bash
pnpm test src/plugins/contracts/
```

تتحقق هذه الاختبارات مما يلي:

- أي Plugins تسجّل أي موفّرين
- أي Plugins تسجّل أي موفّري تحويل النص إلى كلام
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

## فرض قواعد التدقيق (الـ Plugins داخل المستودع)

يشغّل `scripts/run-additional-boundary-checks.mjs` مجموعة من فحوصات حدود الاستيراد
`lint:plugins:*` في CI، ويمكن أيضًا تشغيل كل منها بشكل مستقل محليًا:

| الأمر                                                          | ما يفرضه                                                                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | لا يمكن للـ Plugins المضمّنة الاستيراد من حزمة التصدير الجذرية الموحّدة `openclaw/plugin-sdk`.                                |
| `pnpm run lint:plugins:no-extension-src-imports`               | لا يمكن لملفات الإضافات الإنتاجية الاستيراد مباشرةً من شجرة `src/**` في المستودع (`../../src/...`).                           |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | لا يمكن لملفات اختبار الإضافات استيراد `openclaw/plugin-sdk/testing` أو `plugin-sdk/test-utils` أو مساعدات الاختبار الخاصة بالنواة فقط. |

لا تخضع الـ Plugins الخارجية لقواعد التدقيق هذه، لكن يُنصح باتباع الأنماط نفسها.

## إعداد الاختبار

يستخدم OpenClaw الإصدار Vitest 4 مع تقارير معلوماتية عن تغطية V8. لاختبارات الـ Plugin:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
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
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل البدء
