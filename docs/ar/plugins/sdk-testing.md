---
read_when:
    - أنت تكتب اختبارات لـ Plugin
    - تحتاج إلى أدوات الاختبار من Plugin SDK
    - تريد فهم اختبارات العقد للـ Plugins المضمّنة
sidebarTitle: Testing
summary: أدوات وأنماط الاختبار لإضافات OpenClaw
title: اختبار Plugin
x-i18n:
    generated_at: "2026-05-02T22:23:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع لأدوات الاختبار، والأنماط، وفرض قواعد lint من أجل Plugins الخاصة بـ OpenClaw.

<Tip>
  **هل تبحث عن أمثلة اختبار؟** تتضمن أدلة الكيفية أمثلة اختبار عملية:
  [اختبارات Channel plugin](/ar/plugins/sdk-channel-plugins#step-6-test) و
  [اختبارات Provider plugin](/ar/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## أدوات الاختبار

**استيراد محاكاة Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**استيراد عقد وقت تشغيل الوكيل:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**استيراد عقد القناة:** `openclaw/plugin-sdk/channel-contract-testing`

**استيراد مساعد اختبار القناة:** `openclaw/plugin-sdk/channel-test-helpers`

**استيراد اختبار هدف القناة:** `openclaw/plugin-sdk/channel-target-testing`

**استيراد عقد Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**استيراد اختبار وقت تشغيل Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**استيراد عقد المزوّد:** `openclaw/plugin-sdk/provider-test-contracts`

**استيراد محاكاة HTTP للمزوّد:** `openclaw/plugin-sdk/provider-http-test-mocks`

**استيراد اختبار البيئة/الشبكة:** `openclaw/plugin-sdk/test-env`

**استيراد التجهيزات العامة:** `openclaw/plugin-sdk/test-fixtures`

**استيراد محاكاة Node المدمجة:** `openclaw/plugin-sdk/test-node-mocks`

فضّل المسارات الفرعية المركّزة أدناه لاختبارات Plugin الجديدة. حزمة التصدير العامة
`openclaw/plugin-sdk/testing` مخصّصة للتوافق القديم فقط.
ترفض حواجز المستودع عمليات الاستيراد الحقيقية الجديدة من `plugin-sdk/testing` و
`plugin-sdk/test-utils`؛ وتبقى هذه الأسماء فقط كأسطح توافق مهملة
لـ Plugins الخارجية واختبارات سجلات التوافق.

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

| التصدير                                             | الغرض                                                                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | إنشاء محاكاة بسيطة لواجهة API الخاصة بـ Plugin لاختبارات الوحدة للتسجيل المباشر. استورده من `plugin-sdk/plugin-test-api`                 |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | مثبت عقد مشترك لملف تعريف المصادقة لمهايئات وقت تشغيل الوكيل الأصلية. استورده من `plugin-sdk/agent-runtime-test-contracts`              |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | مثبت عقد مشترك لمنع التسليم لمهايئات وقت تشغيل الوكيل الأصلية. استورده من `plugin-sdk/agent-runtime-test-contracts`                     |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | مثبت عقد مشترك لتصنيف الرجوع لمهايئات وقت تشغيل الوكيل الأصلية. استورده من `plugin-sdk/agent-runtime-test-contracts`                    |
| `createParameterFreeTool`                            | إنشاء مثبتات مخطط الأدوات الديناميكية لاختبارات عقد وقت التشغيل الأصلية. استورده من `plugin-sdk/agent-runtime-test-contracts`           |
| `expectChannelInboundContextContract`                | التأكد من شكل سياق الوارد للقناة. استورده من `plugin-sdk/channel-contract-testing`                                                        |
| `installChannelOutboundPayloadContractSuite`         | تثبيت حالات عقد الحمولة الصادرة للقناة. استورده من `plugin-sdk/channel-contract-testing`                                                  |
| `createStartAccountContext`                          | إنشاء سياقات دورة حياة حساب القناة. استورده من `plugin-sdk/channel-test-helpers`                                                          |
| `installChannelActionsContractSuite`                 | تثبيت حالات عقد إجراءات رسائل القناة العامة. استورده من `plugin-sdk/channel-test-helpers`                                                 |
| `installChannelSetupContractSuite`                   | تثبيت حالات عقد إعداد القناة العامة. استورده من `plugin-sdk/channel-test-helpers`                                                         |
| `installChannelStatusContractSuite`                  | تثبيت حالات عقد حالة القناة العامة. استورده من `plugin-sdk/channel-test-helpers`                                                          |
| `expectDirectoryIds`                                 | التأكد من معرفات دليل القناة من دالة سرد الدليل. استورده من `plugin-sdk/channel-test-helpers`                                             |
| `assertBundledChannelEntries`                        | التأكد من أن نقاط دخول القنوات المضمنة تعرض العقد العام المتوقع. استورده من `plugin-sdk/channel-test-helpers`                           |
| `formatEnvelopeTimestamp`                            | تنسيق الطوابع الزمنية الحتمية للمغلفات. استورده من `plugin-sdk/channel-test-helpers`                                                      |
| `expectPairingReplyText`                             | التأكد من نص رد إقران القناة واستخراج رمزه. استورده من `plugin-sdk/channel-test-helpers`                                                  |
| `describePluginRegistrationContract`                 | تثبيت فحوصات عقد تسجيل Plugin. استورده من `plugin-sdk/plugin-test-contracts`                                                              |
| `registerSingleProviderPlugin`                       | تسجيل Plugin موفر واحد في اختبارات الدخان للمحمّل. استورده من `plugin-sdk/plugin-test-runtime`                                           |
| `registerProviderPlugin`                             | التقاط جميع أنواع الموفرين من Plugin واحد. استورده من `plugin-sdk/plugin-test-runtime`                                                    |
| `registerProviderPlugins`                            | التقاط تسجيلات الموفرين عبر عدة Plugins. استورده من `plugin-sdk/plugin-test-runtime`                                                      |
| `requireRegisteredProvider`                          | التأكد من أن مجموعة موفرين تحتوي على معرف. استورده من `plugin-sdk/plugin-test-runtime`                                                    |
| `createRuntimeEnv`                                   | إنشاء بيئة وقت تشغيل CLI/Plugin مُحاكاة. استورده من `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | إنشاء مساعدات حالة الإعداد لـ Plugins القنوات. استورده من `plugin-sdk/plugin-test-runtime`                                               |
| `describeOpenAIProviderRuntimeContract`              | تثبيت فحوصات عقد وقت التشغيل لعائلة الموفر. استورده من `plugin-sdk/provider-test-contracts`                                              |
| `expectPassthroughReplayPolicy`                      | التأكد من أن سياسات إعادة التشغيل للموفر تمرر الأدوات والبيانات الوصفية المملوكة للموفر كما هي. استورده من `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | تشغيل اختبار STT مباشر في الوقت الحقيقي للموفر باستخدام مثبتات صوتية مشتركة. استورده من `plugin-sdk/provider-test-contracts`           |
| `normalizeTranscriptForMatch`                        | تطبيع مخرجات النسخ المباشر قبل التأكيدات التقريبية. استورده من `plugin-sdk/provider-test-contracts`                                     |
| `expectExplicitVideoGenerationCapabilities`          | التأكد من أن موفري الفيديو يصرحون بإمكانات وضع التوليد الصريحة. استورده من `plugin-sdk/provider-test-contracts`                         |
| `expectExplicitMusicGenerationCapabilities`          | التأكد من أن موفري الموسيقى يصرحون بإمكانات التوليد/التحرير الصريحة. استورده من `plugin-sdk/provider-test-contracts`                    |
| `mockSuccessfulDashscopeVideoTask`                   | تثبيت استجابة مهمة فيديو ناجحة متوافقة مع DashScope. استورده من `plugin-sdk/provider-test-contracts`                                    |
| `getProviderHttpMocks`                               | الوصول إلى محاكيات Vitest الاختيارية لـ HTTP/المصادقة الخاصة بالموفر. استورده من `plugin-sdk/provider-http-test-mocks`                 |
| `installProviderHttpMockCleanup`                     | إعادة تعيين محاكيات HTTP/المصادقة الخاصة بالموفر بعد كل اختبار. استورده من `plugin-sdk/provider-http-test-mocks`                       |
| `installCommonResolveTargetErrorCases`               | حالات اختبار مشتركة لمعالجة أخطاء حل الهدف. استورده من `plugin-sdk/channel-target-testing`                                              |
| `shouldAckReaction`                                  | التحقق مما إذا كان ينبغي للقناة إضافة تفاعل إقرار. استورده من `plugin-sdk/channel-feedback`                                              |
| `removeAckReactionAfterReply`                        | إزالة تفاعل الإقرار بعد تسليم الرد. استورده من `plugin-sdk/channel-feedback`                                                             |
| `createTestRegistry`                                 | إنشاء مثبت سجل Plugin للقناة. استورده من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                          |
| `createEmptyPluginRegistry`                          | إنشاء مثبت سجل Plugin فارغ. استورده من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                            |
| `setActivePluginRegistry`                            | تثبيت مثبت سجل لاختبارات وقت تشغيل Plugin. استورده من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`             |
| `createRequestCaptureJsonFetch`                      | التقاط طلبات جلب JSON في اختبارات مساعد الوسائط. استورده من `plugin-sdk/test-env`                                                        |
| `withServer`                                         | تشغيل الاختبارات مقابل خادم HTTP محلي قابل للتخلص منه. استورده من `plugin-sdk/test-env`                                                  |
| `createMockIncomingRequest`                          | إنشاء كائن طلب HTTP وارد بسيط. استورده من `plugin-sdk/test-env`                                                                          |
| `withFetchPreconnect`                                | تشغيل اختبارات الجلب مع تثبيت خطاطيف الاتصال المسبق. استورده من `plugin-sdk/test-env`                                                    |
| `withEnv` / `withEnvAsync`                           | تعديل متغيرات البيئة مؤقتًا. استورده من `plugin-sdk/test-env`                                                                            |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | إنشاء مثبتات اختبار نظام ملفات معزولة. استورده من `plugin-sdk/test-env`                                                                 |
| `createMockServerResponse`                           | إنشاء محاكاة بسيطة لاستجابة خادم HTTP. استورده من `plugin-sdk/test-env`                                                                  |
| `createCliRuntimeCapture`                            | التقاط مخرجات وقت تشغيل CLI في الاختبارات. استورده من `plugin-sdk/test-fixtures`                                                        |
| `importFreshModule`                                  | استيراد وحدة ESM برمز استعلام جديد لتجاوز ذاكرة التخزين المؤقت للوحدات. استورده من `plugin-sdk/test-fixtures`                          |
| `bundledPluginRoot` / `bundledPluginFile`            | حل مسارات مثبتات مصدر Plugin المضمن أو توزيعه. استورده من `plugin-sdk/test-fixtures`                                                     |
| `mockNodeBuiltinModule`                              | تثبيت محاكيات Vitest ضيقة لوحدات Node المضمنة. استورده من `plugin-sdk/test-node-mocks`                                                   |
| `createSandboxTestContext`                           | إنشاء سياقات اختبار صندوق العزل. استورده من `plugin-sdk/test-fixtures`                                                                  |
| `writeSkill`                                         | كتابة مثبتات Skills. استورده من `plugin-sdk/test-fixtures`                                                                               |
| `makeAgentAssistantMessage`                          | إنشاء مثبتات رسائل نسخ الوكيل. استورده من `plugin-sdk/test-fixtures`                                                                     |
| `peekSystemEvents` / `resetSystemEventsForTest`      | فحص مثبتات أحداث النظام وإعادة تعيينها. استورده من `plugin-sdk/test-fixtures`                                                           |
| `sanitizeTerminalText`                               | تنظيف مخرجات الطرفية لاستخدامها في التأكيدات. استورده من `plugin-sdk/test-fixtures`                                                     |
| `countLines` / `hasBalancedFences`                   | التأكد من شكل مخرجات التجزئة. استورده من `plugin-sdk/test-fixtures`                                                                      |
| `runProviderCatalog`                                 | تنفيذ خطاف كتالوج موفر باستخدام تبعيات الاختبار                                                                                         |
| `resolveProviderWizardOptions`                       | حل اختيارات معالج إعداد الموفر في اختبارات العقد                                                                                         |
| `resolveProviderModelPickerEntries`                  | حل إدخالات منتقي نموذج الموفر في اختبارات العقد                                                                                          |
| `buildProviderPluginMethodChoice`                    | إنشاء معرفات اختيارات معالج الموفر للتأكيدات                                                                                             |
| `setProviderWizardProvidersResolverForTest`          | حقن موفري معالج الموفر للاختبارات المعزولة                                                                                               |
| `createProviderUsageFetch`                           | إنشاء تركيبات جلب استخدام المزوّد                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | تجميد المؤقّتات واستعادتها للاختبارات الحسّاسة للوقت. استورد من `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | إنشاء موجّه مطالبات وهمي لمعالج الإعداد                                                                                                     |
| `createRuntimeTaskFlow`                              | إنشاء حالة TaskFlow معزولة في وقت التشغيل                                                                                                  |
| `typedCases`                                         | الحفاظ على الأنواع الحرفية للاختبارات المعتمدة على الجداول. استورد من `plugin-sdk/test-fixtures`                                                    |

تستخدم مجموعات عقود Plugins المضمّنة أيضًا مسارات SDK الفرعية للاختبار لمساعدات السجل والبيان والأثر العام وتجهيزات وقت التشغيل الخاصة بالاختبارات فقط. تبقى المجموعات الخاصة بالنواة فقط التي تعتمد على مخزون OpenClaw المضمّن ضمن `src/plugins/contracts`.
اجعل اختبارات الامتدادات الجديدة على مسار فرعي مركّز وموثّق من SDK مثل
`plugin-sdk/plugin-test-api`، أو `plugin-sdk/channel-contract-testing`،
`plugin-sdk/agent-runtime-test-contracts`، أو `plugin-sdk/channel-test-helpers`،
`plugin-sdk/plugin-test-contracts`، أو `plugin-sdk/plugin-test-runtime`،
`plugin-sdk/provider-test-contracts`، أو `plugin-sdk/provider-http-test-mocks`،
`plugin-sdk/test-env`، أو `plugin-sdk/test-fixtures` بدلًا من استيراد حزمة التوافق العامة
`plugin-sdk/testing`، أو ملفات المستودع `src/**`، أو جسور المستودع
`test/helpers/*` مباشرة.

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

استخدم `installCommonResolveTargetErrorCases` لإضافة حالات الخطأ القياسية لحلّ هدف القناة:

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

اختبارات الوحدة التي تمرّر محاكاة `api` مكتوبة يدويًا إلى `register(api)` لا تمرّن بوابات قبول المحمّل في OpenClaw. أضف اختبار دخان واحدًا على الأقل مدعومًا بالمحمّل لكل سطح تسجيل يعتمد عليه Plugin، وخصوصًا الخطافات والقدرات الحصرية مثل الذاكرة.

يفشل المحمّل الحقيقي تسجيل Plugin عندما تكون البيانات الوصفية المطلوبة مفقودة أو عندما يستدعي Plugin واجهة API لقدرة لا يملكها. على سبيل المثال، يتطلب `api.registerHook(...)` اسم خطاف، ويتطلب `api.registerMemoryCapability(...)` أن يعلن بيان Plugin أو المدخل المصدّر `kind: "memory"`.

### اختبار الوصول إلى إعدادات وقت التشغيل

فضّل محاكاة وقت تشغيل Plugin المشتركة من `openclaw/plugin-sdk/channel-test-helpers` عند اختبار Plugins القنوات المضمّنة. ترمي محاكيات `runtime.config.loadConfig()` و`runtime.config.writeConfigFile(...)` المهملة افتراضيًا حتى تلتقط الاختبارات أي استخدام جديد لواجهات API الخاصة بالتوافق. لا تتجاوز تلك المحاكيات إلا عندما يغطي الاختبار صراحةً سلوك التوافق القديم.

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

### محاكاة وقت تشغيل Plugin

بالنسبة إلى الكود الذي يستخدم `createPluginRuntimeStore`، حاكِ وقت التشغيل في الاختبارات:

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

تملك Plugins المضمّنة اختبارات عقود تتحقق من ملكية التسجيل:

```bash
pnpm test -- src/plugins/contracts/
```

تؤكد هذه الاختبارات:

- أي Plugins تسجّل أي موفّرين
- أي Plugins تسجّل أي موفّري كلام
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

## فرض الفحص الساكن (Plugins داخل المستودع)

تفرض `pnpm check` ثلاث قواعد على Plugins داخل المستودع:

1. **لا استيرادات جذرية أحادية كبيرة** -- تُرفض حزمة الجذر `openclaw/plugin-sdk`
2. **لا استيرادات مباشرة من `src/`** -- لا يمكن لـ Plugins استيراد `../../src/` مباشرة
3. **لا استيرادات ذاتية** -- لا يمكن لـ Plugins استيراد مسارها الفرعي الخاص `plugin-sdk/<name>`

لا تخضع Plugins الخارجية لقواعد الفحص الساكن هذه، لكن يُوصى باتباع الأنماط نفسها.

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

## ذات صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- اصطلاحات الاستيراد
- [Plugins قنوات SDK](/ar/plugins/sdk-channel-plugins) -- واجهة Plugin القناة
- [Plugins موفّري SDK](/ar/plugins/sdk-provider-plugins) -- خطافات Plugin الموفّر
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل البدء
