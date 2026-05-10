---
read_when:
    - أنت تكتب اختبارات لـ Plugin
    - تحتاج إلى أدوات الاختبار المساعدة من SDK الخاص بـ Plugin
    - تريد فهم اختبارات العقد للـ Plugins المضمّنة
sidebarTitle: Testing
summary: أدوات وأنماط الاختبار لـ Plugins الخاصة بـ OpenClaw
title: اختبار Plugin
x-i18n:
    generated_at: "2026-05-10T19:56:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع لأدوات الاختبار وأنماطه وفرض قواعد الفحص في Plugins الخاصة بـ OpenClaw.

<Tip>
  **هل تبحث عن أمثلة اختبار؟** تتضمن أدلة الكيفية أمثلة اختبار عملية:
  [اختبارات Plugin القناة](/ar/plugins/sdk-channel-plugins#step-6-test) و
  [اختبارات Plugin المزوّد](/ar/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## أدوات الاختبار

مسارات أدوات الاختبار الفرعية هذه هي نقاط دخول مصدرية محلية للمستودع لاختبارات
Plugins المضمّنة الخاصة بـ OpenClaw. وهي ليست تصديرات حزم لـ Plugins الجهات الخارجية.

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

**استيراد التثبيت العام:** `openclaw/plugin-sdk/test-fixtures`

**استيراد محاكاة Node المضمّنة:** `openclaw/plugin-sdk/test-node-mocks`

فضّل المسارات الفرعية المركّزة أدناه لاختبارات Plugin الجديدة. أما مجموعة
`openclaw/plugin-sdk/testing` الواسعة فهي للتوافق القديم فقط.
ترفض حواجز حماية المستودع الاستيرادات الحقيقية الجديدة من `plugin-sdk/testing` و
`plugin-sdk/test-utils`؛ وتبقى هذه الأسماء فقط كأسطح توافق مهملة
لاختبارات سجلات التوافق.

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

| التصدير                                             | الغرض                                                                                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | ابنِ محاكاة صغيرة لواجهة Plugin API لاختبارات الوحدة الخاصة بالتسجيل المباشر. استورد من `plugin-sdk/plugin-test-api`                           |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | تجهيز عقد ملف تعريف المصادقة المشترك لمحوّلات وقت تشغيل الوكيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`                  |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | تجهيز عقد كبت التسليم المشترك لمحوّلات وقت تشغيل الوكيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`                         |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | تجهيز عقد تصنيف الرجوع الاحتياطي المشترك لمحوّلات وقت تشغيل الوكيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`             |
| `createParameterFreeTool`                            | ابنِ تجهيزات مخطط الأدوات الديناميكية لاختبارات عقود وقت التشغيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`                |
| `expectChannelInboundContextContract`                | تأكّد من شكل سياق القناة الوارد. استورد من `plugin-sdk/channel-contract-testing`                                                              |
| `installChannelOutboundPayloadContractSuite`         | ثبّت حالات عقد حمولة القناة الصادرة. استورد من `plugin-sdk/channel-contract-testing`                                                          |
| `createStartAccountContext`                          | ابنِ سياقات دورة حياة حساب القناة. استورد من `plugin-sdk/channel-test-helpers`                                                                |
| `installChannelActionsContractSuite`                 | ثبّت حالات عقد إجراءات رسائل القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                                       |
| `installChannelSetupContractSuite`                   | ثبّت حالات عقد إعداد القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                                               |
| `installChannelStatusContractSuite`                  | ثبّت حالات عقد حالة القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                                                |
| `expectDirectoryIds`                                 | تأكّد من معرّفات دليل القناة من دالة سرد الدليل. استورد من `plugin-sdk/channel-test-helpers`                                                  |
| `assertBundledChannelEntries`                        | تأكّد من أن نقاط دخول القنوات المضمّنة تعرض العقد العام المتوقع. استورد من `plugin-sdk/channel-test-helpers`                                 |
| `formatEnvelopeTimestamp`                            | نسّق الطوابع الزمنية الحتمية للمغلّف. استورد من `plugin-sdk/channel-test-helpers`                                                            |
| `expectPairingReplyText`                             | تأكّد من نص رد إقران القناة واستخرج رمزه. استورد من `plugin-sdk/channel-test-helpers`                                                        |
| `describePluginRegistrationContract`                 | ثبّت فحوصات عقد تسجيل Plugin. استورد من `plugin-sdk/plugin-test-contracts`                                                                    |
| `registerSingleProviderPlugin`                       | سجّل Plugin مزوّدًا واحدًا في اختبارات الدخان للمحمّل. استورد من `plugin-sdk/plugin-test-runtime`                                            |
| `registerProviderPlugin`                             | التقط كل أنواع المزوّدين من Plugin واحد. استورد من `plugin-sdk/plugin-test-runtime`                                                          |
| `registerProviderPlugins`                            | التقط تسجيلات المزوّدين عبر عدة Plugins. استورد من `plugin-sdk/plugin-test-runtime`                                                          |
| `requireRegisteredProvider`                          | تأكّد من أن مجموعة المزوّدين تحتوي على معرّف. استورد من `plugin-sdk/plugin-test-runtime`                                                     |
| `createRuntimeEnv`                                   | ابنِ بيئة وقت تشغيل CLI/Plugin محاكية. استورد من `plugin-sdk/plugin-test-runtime`                                                            |
| `createPluginSetupWizardStatus`                      | ابنِ مساعدات حالة الإعداد لقنوات Plugin. استورد من `plugin-sdk/plugin-test-runtime`                                                          |
| `describeOpenAIProviderRuntimeContract`              | ثبّت فحوصات عقد وقت التشغيل لعائلة المزوّد. استورد من `plugin-sdk/provider-test-contracts`                                                   |
| `expectPassthroughReplayPolicy`                      | تأكّد من أن سياسات إعادة التشغيل للمزوّد تمرّر الأدوات والبيانات الوصفية المملوكة للمزوّد. استورد من `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | شغّل اختبار مزوّد STT مباشرًا وفوريًا باستخدام تجهيزات صوتية مشتركة. استورد من `plugin-sdk/provider-test-contracts`                        |
| `normalizeTranscriptForMatch`                        | طبّع مخرجات النص المباشر قبل التأكيدات التقريبية. استورد من `plugin-sdk/provider-test-contracts`                                            |
| `expectExplicitVideoGenerationCapabilities`          | تأكّد من أن مزوّدي الفيديو يعلنون قدرات صريحة لوضع التوليد. استورد من `plugin-sdk/provider-test-contracts`                                  |
| `expectExplicitMusicGenerationCapabilities`          | تأكّد من أن مزوّدي الموسيقى يعلنون قدرات صريحة للتوليد/التحرير. استورد من `plugin-sdk/provider-test-contracts`                              |
| `mockSuccessfulDashscopeVideoTask`                   | ثبّت استجابة مهمة فيديو ناجحة ومتوافقة مع DashScope. استورد من `plugin-sdk/provider-test-contracts`                                          |
| `getProviderHttpMocks`                               | صِل إلى محاكيات Vitest الاختيارية الخاصة ببروتوكول HTTP/المصادقة للمزوّد. استورد من `plugin-sdk/provider-http-test-mocks`                  |
| `installProviderHttpMockCleanup`                     | أعد ضبط محاكيات HTTP/المصادقة للمزوّد بعد كل اختبار. استورد من `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | حالات اختبار مشتركة لمعالجة أخطاء حل الهدف. استورد من `plugin-sdk/channel-target-testing`                                                   |
| `shouldAckReaction`                                  | افحص ما إذا كان ينبغي للقناة إضافة تفاعل إقرار. استورد من `plugin-sdk/channel-feedback`                                                     |
| `removeAckReactionAfterReply`                        | أزل تفاعل الإقرار بعد تسليم الرد. استورد من `plugin-sdk/channel-feedback`                                                                    |
| `createTestRegistry`                                 | ابنِ تجهيز سجل Plugin للقناة. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                               |
| `createEmptyPluginRegistry`                          | ابنِ تجهيز سجل Plugin فارغ. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                                 |
| `setActivePluginRegistry`                            | ثبّت تجهيز سجل لاختبارات وقت تشغيل Plugin. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                 |
| `createRequestCaptureJsonFetch`                      | التقط طلبات جلب JSON في اختبارات مساعد الوسائط. استورد من `plugin-sdk/test-env`                                                             |
| `withServer`                                         | شغّل الاختبارات على خادم HTTP محلي قابل للتخلص منه. استورد من `plugin-sdk/test-env`                                                         |
| `createMockIncomingRequest`                          | ابنِ كائن طلب HTTP واردًا بالحد الأدنى. استورد من `plugin-sdk/test-env`                                                                      |
| `withFetchPreconnect`                                | شغّل اختبارات الجلب مع تثبيت خطافات الاتصال المسبق. استورد من `plugin-sdk/test-env`                                                         |
| `withEnv` / `withEnvAsync`                           | رقّع متغيرات البيئة مؤقتًا. استورد من `plugin-sdk/test-env`                                                                                 |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | أنشئ تجهيزات اختبار معزولة لنظام الملفات. استورد من `plugin-sdk/test-env`                                                                  |
| `createMockServerResponse`                           | أنشئ محاكاة صغيرة لاستجابة خادم HTTP. استورد من `plugin-sdk/test-env`                                                                       |
| `createCliRuntimeCapture`                            | التقط مخرجات وقت تشغيل CLI في الاختبارات. استورد من `plugin-sdk/test-fixtures`                                                             |
| `importFreshModule`                                  | استورد وحدة ESM برمز استعلام جديد لتجاوز ذاكرة الوحدات المؤقتة. استورد من `plugin-sdk/test-fixtures`                                       |
| `bundledPluginRoot` / `bundledPluginFile`            | حلّ مسارات تجهيزات مصدر Plugin المضمّن أو توزيعه. استورد من `plugin-sdk/test-fixtures`                                                      |
| `mockNodeBuiltinModule`                              | ثبّت محاكيات Vitest ضيقة لوحدات Node المدمجة. استورد من `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | ابنِ سياقات اختبار الصندوق المعزول. استورد من `plugin-sdk/test-fixtures`                                                                    |
| `writeSkill`                                         | اكتب تجهيزات Skills. استورد من `plugin-sdk/test-fixtures`                                                                                  |
| `makeAgentAssistantMessage`                          | ابنِ تجهيزات رسائل نص الوكيل. استورد من `plugin-sdk/test-fixtures`                                                                         |
| `peekSystemEvents` / `resetSystemEventsForTest`      | افحص تجهيزات أحداث النظام وأعد ضبطها. استورد من `plugin-sdk/test-fixtures`                                                                 |
| `sanitizeTerminalText`                               | عقّم مخرجات الطرفية للتأكيدات. استورد من `plugin-sdk/test-fixtures`                                                                        |
| `countLines` / `hasBalancedFences`                   | تأكّد من شكل مخرجات التجزئة. استورد من `plugin-sdk/test-fixtures`                                                                          |
| `runProviderCatalog`                                 | نفّذ خطاف كتالوج المزوّد باستخدام تبعيات الاختبار                                                                                          |
| `resolveProviderWizardOptions`                       | حلّ اختيارات معالج إعداد المزوّد في اختبارات العقد                                                                                         |
| `resolveProviderModelPickerEntries`                  | حلّ إدخالات منتقي نماذج المزوّد في اختبارات العقد                                                                                          |
| `buildProviderPluginMethodChoice`                    | ابنِ معرّفات اختيارات معالج المزوّد للتأكيدات                                                                                              |
| `setProviderWizardProvidersResolverForTest`          | احقن مزوّدي معالج المزوّد للاختبارات المعزولة                                                                                              |
| `createProviderUsageFetch`                           | بناء تجهيزات اختبار لجلب استخدام الموفّر                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | تجميد واستعادة المؤقّتات للاختبارات الحساسة للوقت. استورِد من `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | بناء موجّه معالج إعداد وهمي                                                                                                     |
| `createRuntimeTaskFlow`                              | إنشاء حالة تدفّق مهام وقت تشغيل معزولة                                                                                                  |
| `typedCases`                                         | الحفاظ على الأنواع الحرفية للاختبارات المعتمدة على الجداول. استورِد من `plugin-sdk/test-fixtures`                                                    |

تستخدم حزم عقود Plugin المضمّنة أيضًا مسارات SDK فرعية للاختبار خاصة بمساعدات السجل والبيان والأثر العام وتجهيزات وقت التشغيل المخصصة للاختبارات فقط. تبقى حزم Core-only التي تعتمد على مخزون OpenClaw المضمّن ضمن `src/plugins/contracts`.
أبقِ اختبارات الإضافات الجديدة على مسار SDK فرعي موثق ومركّز مثل
`plugin-sdk/plugin-test-api` أو `plugin-sdk/channel-contract-testing` أو
`plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/channel-test-helpers` أو
`plugin-sdk/plugin-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو
`plugin-sdk/provider-test-contracts` أو `plugin-sdk/provider-http-test-mocks` أو
`plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلًا من استيراد barrel التوافق الواسع
`plugin-sdk/testing` أو ملفات المستودع `src/**` أو جسور المستودع
`test/helpers/*` مباشرةً.

### الأنواع

تعيد المسارات الفرعية المركّزة للاختبار أيضًا تصدير أنواع مفيدة في ملفات الاختبار:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## حل هدف الاختبار

استخدم `installCommonResolveTargetErrorCases` لإضافة حالات الخطأ القياسية لحل أهداف القناة:

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

اختبارات الوحدة التي تمرر محاكاة `api` مكتوبة يدويًا إلى `register(api)` لا تختبر بوابات قبول مُحمّل OpenClaw. أضف اختبار دخان واحدًا على الأقل مدعومًا بالمُحمّل لكل سطح تسجيل يعتمد عليه Plugin الخاص بك، وخصوصًا الخطافات والإمكانات الحصرية مثل الذاكرة.

يفشل المُحمّل الحقيقي تسجيل Plugin عندما تكون البيانات الوصفية المطلوبة مفقودة أو عندما يستدعي Plugin واجهة API لإمكانة لا يملكها. على سبيل المثال، يتطلب
`api.registerHook(...)` اسم خطاف، ويتطلب
`api.registerMemoryCapability(...)` أن يصرّح بيان Plugin أو المدخل المصدّر بـ `kind: "memory"`.

### اختبار الوصول إلى إعداد وقت التشغيل

فضّل محاكاة وقت تشغيل Plugin المشتركة من `openclaw/plugin-sdk/channel-test-helpers`
عند اختبار Plugin القنوات المضمّنة. محاكيتا `runtime.config.loadConfig()` و
`runtime.config.writeConfigFile(...)` المهجورتان فيها ترميان خطأ افتراضيًا حتى تلتقط الاختبارات أي استخدام جديد لواجهات API التوافقية. لا تتجاوز هذه المحاكيات إلا عندما يكون الاختبار يغطي صراحةً سلوك التوافق القديم.

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

للتعليمات البرمجية التي تستخدم `createPluginRuntimeStore`، حاكِ وقت التشغيل في الاختبارات:

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

## اختبارات العقد (Plugin داخل المستودع)

تملك Plugins المضمّنة اختبارات عقد تتحقق من ملكية التسجيل:

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

لاختبارات العقد فقط:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## فرض الفحص الساكن (Plugins داخل المستودع)

يفرض `pnpm check` ثلاث قواعد على Plugins داخل المستودع:

1. **لا استيرادات جذرية موحّدة** -- يُرفض barrel الجذري `openclaw/plugin-sdk`
2. **لا استيرادات مباشرة من `src/`** -- لا يمكن لـ Plugins استيراد `../../src/` مباشرةً
3. **لا استيرادات ذاتية** -- لا يمكن لـ Plugins استيراد مسارها الفرعي الخاص `plugin-sdk/<name>`

لا تخضع Plugins الخارجية لقواعد الفحص الساكن هذه، لكن يوصى باتباع الأنماط نفسها.

## إعداد الاختبار

يستخدم OpenClaw Vitest مع حدود تغطية V8. لاختبارات Plugin:

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

إذا سبّبت عمليات التشغيل المحلية ضغطًا على الذاكرة:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ذات صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- اصطلاحات الاستيراد
- [Plugins قنوات SDK](/ar/plugins/sdk-channel-plugins) -- واجهة Plugin القناة
- [Plugins موفّري SDK](/ar/plugins/sdk-provider-plugins) -- خطافات Plugin الموفّر
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل البدء
