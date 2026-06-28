---
read_when:
    - أنت تكتب اختبارات لـ Plugin
    - تحتاج إلى أدوات الاختبار من SDK الخاص بـ Plugin
    - تريد فهم اختبارات العقد للـ Plugins المضمّنة
sidebarTitle: Testing
summary: أدوات وأنماط الاختبار لـ OpenClaw plugins
title: اختبار Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع لأدوات الاختبار وأنماطه وفرض قواعد الفحص لإضافات OpenClaw.

<Tip>
  **تبحث عن أمثلة اختبار؟** تتضمن أدلة الكيفية أمثلة اختبار مفصلة:
  [اختبارات إضافات القنوات](/ar/plugins/sdk-channel-plugins#step-6-test) و
  [اختبارات إضافات المزوّدين](/ar/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## أدوات الاختبار

مسارات أدوات الاختبار الفرعية هذه هي نقاط دخول مصدرية محلية داخل المستودع لاختبارات الإضافات المضمنة الخاصة بـ OpenClaw. وهي ليست تصديرات حزم لإضافات الجهات الخارجية، وقد تستورد Vitest أو تبعيات اختبار أخرى خاصة بالمستودع فقط.

**استيراد محاكاة واجهة Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**استيراد عقد وقت تشغيل الوكيل:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**استيراد عقد القناة:** `openclaw/plugin-sdk/channel-contract-testing`

**استيراد مساعد اختبار القناة:** `openclaw/plugin-sdk/channel-test-helpers`

**استيراد اختبار هدف القناة:** `openclaw/plugin-sdk/channel-target-testing`

**استيراد عقد Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**استيراد اختبار وقت تشغيل Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**استيراد عقد المزوّد:** `openclaw/plugin-sdk/provider-test-contracts`

**استيراد محاكاة HTTP للمزوّد:** `openclaw/plugin-sdk/provider-http-test-mocks`

**استيراد اختبار البيئة/الشبكة:** `openclaw/plugin-sdk/test-env`

**استيراد التجهيز العام:** `openclaw/plugin-sdk/test-fixtures`

**استيراد محاكاة مكوّن Node المدمج:** `openclaw/plugin-sdk/test-node-mocks`

داخل مستودع OpenClaw، فضّل المسارات الفرعية المركزة أدناه لاختبارات الإضافات المضمنة الجديدة. ملف التجميع الواسع
`openclaw/plugin-sdk/testing` مخصص للتوافق القديم فقط.
ترفض حواجز المستودع الوقائية أي استيرادات فعلية جديدة من `plugin-sdk/testing` و
`plugin-sdk/test-utils`؛ وتبقى هذه الأسماء فقط كأسطح توافق مهملة لاختبارات سجل التوافق.

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

### التصديرات المتاحة

| التصدير                                             | الغرض                                                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | بناء محاكاة بسيطة لواجهة API الخاصة بـ Plugin لاختبارات الوحدة للتسجيل المباشر. استورد من `plugin-sdk/plugin-test-api`                   |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | مثبتة عقد ملف تعريف المصادقة المشتركة لمحوّلات وقت تشغيل الوكيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`           |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | مثبتة عقد منع التسليم المشتركة لمحوّلات وقت تشغيل الوكيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`                  |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | مثبتة عقد تصنيف الاحتياطي المشتركة لمحوّلات وقت تشغيل الوكيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`              |
| `createParameterFreeTool`                            | بناء مثبتات مخطط الأدوات الديناميكية لاختبارات عقد وقت التشغيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`            |
| `expectChannelInboundContextContract`                | تأكيد شكل سياق القناة الوارد. استورد من `plugin-sdk/channel-contract-testing`                                                            |
| `installChannelOutboundPayloadContractSuite`         | تثبيت حالات عقد حمولة القناة الصادرة. استورد من `plugin-sdk/channel-contract-testing`                                                     |
| `createStartAccountContext`                          | بناء سياقات دورة حياة حساب القناة. استورد من `plugin-sdk/channel-test-helpers`                                                           |
| `installChannelActionsContractSuite`                 | تثبيت حالات عقد إجراءات رسائل القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                                 |
| `installChannelSetupContractSuite`                   | تثبيت حالات عقد إعداد القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                                         |
| `installChannelStatusContractSuite`                  | تثبيت حالات عقد حالة القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                                          |
| `expectDirectoryIds`                                 | تأكيد معرّفات دليل القناة من دالة قائمة الدليل. استورد من `plugin-sdk/channel-test-helpers`                                              |
| `assertBundledChannelEntries`                        | تأكيد أن نقاط دخول القنوات المضمّنة تعرض العقد العام المتوقع. استورد من `plugin-sdk/channel-test-helpers`                               |
| `formatEnvelopeTimestamp`                            | تنسيق طوابع زمنية حتمية للمغلف. استورد من `plugin-sdk/channel-test-helpers`                                                              |
| `expectPairingReplyText`                             | تأكيد نص رد إقران القناة واستخراج رمزه. استورد من `plugin-sdk/channel-test-helpers`                                                      |
| `describePluginRegistrationContract`                 | تثبيت فحوصات عقد تسجيل Plugin. استورد من `plugin-sdk/plugin-test-contracts`                                                              |
| `registerSingleProviderPlugin`                       | تسجيل Plugin موفر واحد في اختبارات الدخان للمحمّل. استورد من `plugin-sdk/plugin-test-runtime`                                            |
| `registerProviderPlugin`                             | التقاط جميع أنواع الموفرين من Plugin واحد. استورد من `plugin-sdk/plugin-test-runtime`                                                    |
| `registerProviderPlugins`                            | التقاط تسجيلات الموفرين عبر عدة Plugins. استورد من `plugin-sdk/plugin-test-runtime`                                                      |
| `requireRegisteredProvider`                          | تأكيد أن مجموعة موفرين تحتوي على معرّف. استورد من `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeEnv`                                   | بناء بيئة وقت تشغيل CLI/Plugin بمحاكاة. استورد من `plugin-sdk/plugin-test-runtime`                                                       |
| `createPluginRuntimeMock`                            | بناء سطح وقت تشغيل Plugin بمحاكاة. استورد من `plugin-sdk/plugin-test-runtime`                                                            |
| `createPluginSetupWizardStatus`                      | بناء مساعدات حالة الإعداد لقنوات Plugins. استورد من `plugin-sdk/plugin-test-runtime`                                                     |
| `describeOpenAIProviderRuntimeContract`              | تثبيت فحوصات عقد وقت تشغيل عائلة الموفرين. استورد من `plugin-sdk/provider-test-contracts`                                                |
| `expectPassthroughReplayPolicy`                      | تأكيد أن سياسات إعادة التشغيل الخاصة بالموفر تمرر أدوات الموفر وبياناته الوصفية كما هي. استورد من `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | تشغيل اختبار مباشر لموفر تحويل الكلام إلى نص في الوقت الفعلي باستخدام مثبتات صوت مشتركة. استورد من `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | تطبيع مخرجات النص المباشر قبل التأكيدات التقريبية. استورد من `plugin-sdk/provider-test-contracts`                                       |
| `expectExplicitVideoGenerationCapabilities`          | تأكيد أن موفري الفيديو يعلنون صراحة عن قدرات وضع التوليد. استورد من `plugin-sdk/provider-test-contracts`                                |
| `expectExplicitMusicGenerationCapabilities`          | تأكيد أن موفري الموسيقى يعلنون صراحة عن قدرات التوليد/التحرير. استورد من `plugin-sdk/provider-test-contracts`                           |
| `mockSuccessfulDashscopeVideoTask`                   | تثبيت استجابة مهمة فيديو ناجحة متوافقة مع DashScope. استورد من `plugin-sdk/provider-test-contracts`                                      |
| `getProviderHttpMocks`                               | الوصول إلى محاكاة Vitest الاختيارية لـ HTTP/المصادقة الخاصة بالموفر. استورد من `plugin-sdk/provider-http-test-mocks`                   |
| `installProviderHttpMockCleanup`                     | إعادة ضبط محاكاة HTTP/المصادقة الخاصة بالموفر بعد كل اختبار. استورد من `plugin-sdk/provider-http-test-mocks`                           |
| `installCommonResolveTargetErrorCases`               | حالات اختبار مشتركة لمعالجة أخطاء حل الهدف. استورد من `plugin-sdk/channel-target-testing`                                               |
| `shouldAckReaction`                                  | التحقق مما إذا كان ينبغي للقناة إضافة تفاعل إقرار. استورد من `plugin-sdk/channel-feedback`                                               |
| `removeAckReactionAfterReply`                        | إزالة تفاعل الإقرار بعد تسليم الرد. استورد من `plugin-sdk/channel-feedback`                                                              |
| `createTestRegistry`                                 | بناء مثبتة سجل Plugin للقناة. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                           |
| `createEmptyPluginRegistry`                          | بناء مثبتة سجل Plugin فارغ. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                             |
| `setActivePluginRegistry`                            | تثبيت مثبتة سجل لاختبارات وقت تشغيل Plugin. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`             |
| `createRequestCaptureJsonFetch`                      | التقاط طلبات جلب JSON في اختبارات مساعدات الوسائط. استورد من `plugin-sdk/test-env`                                                       |
| `withServer`                                         | تشغيل الاختبارات مقابل خادم HTTP محلي قابل للتخلص منه. استورد من `plugin-sdk/test-env`                                                   |
| `createMockIncomingRequest`                          | بناء كائن طلب HTTP وارد بسيط. استورد من `plugin-sdk/test-env`                                                                            |
| `withFetchPreconnect`                                | تشغيل اختبارات الجلب مع تثبيت خطافات الاتصال المسبق. استورد من `plugin-sdk/test-env`                                                     |
| `withEnv` / `withEnvAsync`                           | تعديل متغيرات البيئة مؤقتًا. استورد من `plugin-sdk/test-env`                                                                             |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | إنشاء مثبتات اختبار نظام ملفات معزولة. استورد من `plugin-sdk/test-env`                                                                  |
| `createMockServerResponse`                           | إنشاء محاكاة بسيطة لاستجابة خادم HTTP. استورد من `plugin-sdk/test-env`                                                                   |
| `createCliRuntimeCapture`                            | التقاط مخرجات وقت تشغيل CLI في الاختبارات. استورد من `plugin-sdk/test-fixtures`                                                          |
| `importFreshModule`                                  | استيراد وحدة ESM باستخدام رمز استعلام جديد لتجاوز ذاكرة تخزين الوحدات المؤقتة. استورد من `plugin-sdk/test-fixtures`                    |
| `bundledPluginRoot` / `bundledPluginFile`            | حل مسارات مثبتات مصدر أو توزيع Plugin المضمّن. استورد من `plugin-sdk/test-fixtures`                                                      |
| `mockNodeBuiltinModule`                              | تثبيت محاكاة Vitest ضيقة لوحدات Node المدمجة. استورد من `plugin-sdk/test-node-mocks`                                                     |
| `createSandboxTestContext`                           | بناء سياقات اختبار صندوق الرمل. استورد من `plugin-sdk/test-fixtures`                                                                    |
| `writeSkill`                                         | كتابة مثبتات Skills. استورد من `plugin-sdk/test-fixtures`                                                                                |
| `makeAgentAssistantMessage`                          | بناء مثبتات رسائل نص الوكيل. استورد من `plugin-sdk/test-fixtures`                                                                        |
| `peekSystemEvents` / `resetSystemEventsForTest`      | فحص مثبتات أحداث النظام وإعادة ضبطها. استورد من `plugin-sdk/test-fixtures`                                                              |
| `sanitizeTerminalText`                               | تنقية مخرجات الطرفية للتأكيدات. استورد من `plugin-sdk/test-fixtures`                                                                    |
| `countLines` / `hasBalancedFences`                   | تأكيد شكل مخرجات التقسيم إلى أجزاء. استورد من `plugin-sdk/test-fixtures`                                                                |
| `runProviderCatalog`                                 | تنفيذ خطاف كتالوج موفر باستخدام تبعيات اختبار                                                                                           |
| `resolveProviderWizardOptions`                       | حل خيارات معالج إعداد الموفر في اختبارات العقد                                                                                           |
| `resolveProviderModelPickerEntries`                  | حل إدخالات منتقي نموذج الموفر في اختبارات العقد                                                                                          |
| `buildProviderPluginMethodChoice`                    | بناء معرّفات خيارات معالج الموفر للتأكيدات                                                                                               |
| `setProviderWizardProvidersResolverForTest`          | حقن مزودي معالج المزود للاختبارات المعزولة                                                                                      |
| `createProviderUsageFetch`                           | بناء تجهيزات جلب استخدام المزود                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | تجميد المؤقتات واستعادتها للاختبارات الحساسة للوقت. استورد من `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | بناء موجّه معالج إعداد وهمي                                                                                                     |
| `createRuntimeTaskFlow`                              | إنشاء حالة task-flow وقت تشغيل معزولة                                                                                                  |
| `typedCases`                                         | الحفاظ على الأنواع الحرفية للاختبارات المعتمدة على الجداول. استورد من `plugin-sdk/test-fixtures`                                                    |

تستخدم مجموعات عقود Plugins المضمنة أيضًا مسارات SDK الفرعية الخاصة بالاختبار لمساعدات سجل الاختبار فقط، والبيان، والأثر العام، وتجهيزات وقت التشغيل. تبقى المجموعات الخاصة بالنواة فقط التي تعتمد على مخزون OpenClaw المضمن ضمن `src/plugins/contracts`.
أبقِ اختبارات الإضافات الجديدة على مسار فرعي مركّز وموثّق في SDK مثل
`plugin-sdk/plugin-test-api`، أو `plugin-sdk/channel-contract-testing`،
أو `plugin-sdk/agent-runtime-test-contracts`، أو `plugin-sdk/channel-test-helpers`،
أو `plugin-sdk/plugin-test-contracts`، أو `plugin-sdk/plugin-test-runtime`،
أو `plugin-sdk/provider-test-contracts`، أو `plugin-sdk/provider-http-test-mocks`،
أو `plugin-sdk/test-env`، أو `plugin-sdk/test-fixtures` بدلًا من استيراد تجميعة التوافق
العريضة `plugin-sdk/testing`، أو ملفات المستودع `src/**`، أو جسور المستودع
`test/helpers/*` مباشرة.

### الأنواع

تعيد مسارات الاختبار الفرعية المركّزة أيضًا تصدير أنواع مفيدة في ملفات الاختبار:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## اختبار حل الوجهات

استخدم `installCommonResolveTargetErrorCases` لإضافة حالات الخطأ القياسية الخاصة
بحل وجهات القنوات:

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

اختبارات الوحدة التي تمرر محاكاة `api` مكتوبة يدويًا إلى `register(api)` لا تختبر
بوابات قبول المحمّل في OpenClaw. أضف اختبار دخان واحدًا على الأقل مدعومًا بالمحمّل
لكل سطح تسجيل يعتمد عليه Plugin الخاص بك، ولا سيما الخطافات والقدرات الحصرية
مثل الذاكرة.

يفشل المحمّل الحقيقي تسجيل Plugin عندما تكون البيانات الوصفية المطلوبة مفقودة أو
عندما يستدعي Plugin واجهة API لقدرة لا يملكها. على سبيل المثال،
يتطلب `api.registerHook(...)` اسم خطاف، ويتطلب
`api.registerMemoryCapability(...)` أن يعلن بيان Plugin أو المدخل المصدّر
`kind: "memory"`.

### اختبار الوصول إلى إعدادات وقت التشغيل

فضّل محاكاة وقت تشغيل Plugin المشتركة من `openclaw/plugin-sdk/plugin-test-runtime`.
ترمي محاكاتاها المهملتان `runtime.config.loadConfig()` و`runtime.config.writeConfigFile(...)`
افتراضيًا كي تلتقط الاختبارات أي استخدام جديد لواجهات API الخاصة بالتوافق. لا تتجاوز
هذه المحاكيات إلا عندما يغطي الاختبار صراحةً سلوك التوافق القديم.

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

### اختبار وحدة Plugin موفّر

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

### الاختبار باستخدام بدائل لكل نسخة

فضّل البدائل لكل نسخة على تعديل النموذج الأولي:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## اختبارات العقود (Plugins داخل المستودع)

تملك Plugins المضمنة اختبارات عقود تتحقق من ملكية التسجيل:

```bash
pnpm test -- src/plugins/contracts/
```

تؤكد هذه الاختبارات:

- أي Plugins تسجل أي موفرين
- أي Plugins تسجل أي موفري كلام
- صحة شكل التسجيل
- الامتثال لعقد وقت التشغيل

### تشغيل اختبارات محددة النطاق

لـ Plugin محدد:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

لاختبارات العقود فقط:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## فرض الفحص (Plugins داخل المستودع)

يفرض `pnpm check` ثلاث قواعد على Plugins داخل المستودع:

1. **لا استيرادات جذرية أحادية** -- تُرفض تجميعة الجذر `openclaw/plugin-sdk`
2. **لا استيرادات مباشرة من `src/`** -- لا يمكن لـ Plugins استيراد `../../src/` مباشرة
3. **لا استيرادات ذاتية** -- لا يمكن لـ Plugins استيراد مسارها الفرعي `plugin-sdk/<name>` الخاص بها

لا تخضع Plugins الخارجية لهذه القواعد الخاصة بالفحص، لكن يُوصى باتباع الأنماط نفسها.

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

إذا سببت التشغيلات المحلية ضغطًا على الذاكرة:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- أعراف الاستيراد
- [Plugins قنوات SDK](/ar/plugins/sdk-channel-plugins) -- واجهة Plugin القناة
- [Plugins موفري SDK](/ar/plugins/sdk-provider-plugins) -- خطافات Plugin الموفّر
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل البدء
