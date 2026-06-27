---
read_when:
    - أنت تكتب اختبارات لـ Plugin
    - تحتاج إلى أدوات الاختبار المساعدة من مجموعة تطوير Plugin
    - تريد فهم اختبارات العقد للـPlugins المضمّنة
sidebarTitle: Testing
summary: أدوات وأنماط الاختبار لـ Plugins في OpenClaw
title: اختبار Plugin
x-i18n:
    generated_at: "2026-06-27T18:19:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

مرجع لأدوات الاختبار المساعدة والأنماط وفرض قواعد التدقيق لإضافات OpenClaw.

<Tip>
  **تبحث عن أمثلة للاختبارات؟** تتضمن أدلة الكيفية أمثلة اختبار عملية:
  [اختبارات إضافات القنوات](/ar/plugins/sdk-channel-plugins#step-6-test) و
  [اختبارات إضافات المزوّدين](/ar/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## أدوات الاختبار المساعدة

مسارات أدوات الاختبار الفرعية هذه هي نقاط دخول مصدرية محلية للمستودع لاختبارات
الإضافات المضمّنة الخاصة بـ OpenClaw. وهي ليست صادرات حزمة للإضافات التابعة
لجهات خارجية، وقد تستورد Vitest أو تبعيات اختبار أخرى خاصة بالمستودع فقط.

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

داخل مستودع OpenClaw، فضّل المسارات الفرعية المركّزة أدناه لاختبارات
الإضافات المضمّنة الجديدة. ملف التجميع العام
`openclaw/plugin-sdk/testing` مخصص للتوافق القديم فقط.
ترفض ضوابط المستودع عمليات الاستيراد الحقيقية الجديدة من `plugin-sdk/testing` و
`plugin-sdk/test-utils`؛ وتبقى هذه الأسماء فقط كأسطح توافق مهملة
لاختبارات سجل التوافق.

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

| التصدير                                             | الغرض                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | أنشئ محاكاة بسيطة لواجهة Plugin API لاختبارات الوحدة الخاصة بالتسجيل المباشر. استورد من `plugin-sdk/plugin-test-api`                        |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | تجهيزة عقد مشتركة لملف تعريف المصادقة لمهايئات وقت تشغيل الوكيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`               |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | تجهيزة عقد مشتركة لكبت التسليم لمهايئات وقت تشغيل الوكيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`                      |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | تجهيزة عقد مشتركة لتصنيف الرجوع الاحتياطي لمهايئات وقت تشغيل الوكيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`           |
| `createParameterFreeTool`                            | أنشئ تجهيزات مخطط الأدوات الديناميكية لاختبارات عقد وقت التشغيل الأصلية. استورد من `plugin-sdk/agent-runtime-test-contracts`               |
| `expectChannelInboundContextContract`                | تحقّق من شكل سياق الإدخال في القناة. استورد من `plugin-sdk/channel-contract-testing`                                                        |
| `installChannelOutboundPayloadContractSuite`         | ثبّت حالات عقد حمولة الإخراج من القناة. استورد من `plugin-sdk/channel-contract-testing`                                                     |
| `createStartAccountContext`                          | أنشئ سياقات دورة حياة حساب القناة. استورد من `plugin-sdk/channel-test-helpers`                                                              |
| `installChannelActionsContractSuite`                 | ثبّت حالات عقد إجراءات رسائل القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                                     |
| `installChannelSetupContractSuite`                   | ثبّت حالات عقد إعداد القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                                             |
| `installChannelStatusContractSuite`                  | ثبّت حالات عقد حالة القناة العامة. استورد من `plugin-sdk/channel-test-helpers`                                                              |
| `expectDirectoryIds`                                 | تحقّق من معرّفات دليل القناة من دالة سرد الدليل. استورد من `plugin-sdk/channel-test-helpers`                                                |
| `assertBundledChannelEntries`                        | تحقّق من أن نقاط دخول القناة المضمّنة تكشف العقد العام المتوقع. استورد من `plugin-sdk/channel-test-helpers`                                |
| `formatEnvelopeTimestamp`                            | نسّق طوابع زمنية حتمية للمغلّف. استورد من `plugin-sdk/channel-test-helpers`                                                                 |
| `expectPairingReplyText`                             | تحقّق من نص رد الاقتران في القناة واستخرج رمزه. استورد من `plugin-sdk/channel-test-helpers`                                                 |
| `describePluginRegistrationContract`                 | ثبّت فحوصات عقد تسجيل Plugin. استورد من `plugin-sdk/plugin-test-contracts`                                                                  |
| `registerSingleProviderPlugin`                       | سجّل Plugin موفّرًا واحدًا في اختبارات السلامة الأولية للمحمّل. استورد من `plugin-sdk/plugin-test-runtime`                                  |
| `registerProviderPlugin`                             | التقط كل أنواع الموفّرين من Plugin واحد. استورد من `plugin-sdk/plugin-test-runtime`                                                         |
| `registerProviderPlugins`                            | التقط تسجيلات الموفّرين عبر عدة Plugins. استورد من `plugin-sdk/plugin-test-runtime`                                                         |
| `requireRegisteredProvider`                          | تحقّق من أن مجموعة موفّرين تحتوي على معرّف. استورد من `plugin-sdk/plugin-test-runtime`                                                      |
| `createRuntimeEnv`                                   | أنشئ بيئة وقت تشغيل CLI/Plugin محاكية. استورد من `plugin-sdk/plugin-test-runtime`                                                           |
| `createPluginSetupWizardStatus`                      | أنشئ مساعدات حالة الإعداد لقنوات Plugin. استورد من `plugin-sdk/plugin-test-runtime`                                                         |
| `describeOpenAIProviderRuntimeContract`              | ثبّت فحوصات عقد وقت التشغيل لعائلة الموفّر. استورد من `plugin-sdk/provider-test-contracts`                                                  |
| `expectPassthroughReplayPolicy`                      | تحقّق من أن سياسات إعادة التشغيل للموفّر تمرّر الأدوات والبيانات الوصفية المملوكة للموفّر كما هي. استورد من `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | شغّل اختبار موفّر STT حيًا في الوقت الفعلي باستخدام تجهيزات صوت مشتركة. استورد من `plugin-sdk/provider-test-contracts`                    |
| `normalizeTranscriptForMatch`                        | طبّع مخرجات النسخ الحي قبل التأكيدات التقريبية. استورد من `plugin-sdk/provider-test-contracts`                                              |
| `expectExplicitVideoGenerationCapabilities`          | تحقّق من أن موفّري الفيديو يصرّحون صراحة بقدرات وضع التوليد. استورد من `plugin-sdk/provider-test-contracts`                                |
| `expectExplicitMusicGenerationCapabilities`          | تحقّق من أن موفّري الموسيقى يصرّحون صراحة بقدرات التوليد/التحرير. استورد من `plugin-sdk/provider-test-contracts`                           |
| `mockSuccessfulDashscopeVideoTask`                   | ثبّت استجابة مهمة فيديو ناجحة ومتوافقة مع DashScope. استورد من `plugin-sdk/provider-test-contracts`                                        |
| `getProviderHttpMocks`                               | اصل إلى محاكيات Vitest الاختيارية التفعيل لـ HTTP/المصادقة الخاصة بالموفّر. استورد من `plugin-sdk/provider-http-test-mocks`               |
| `installProviderHttpMockCleanup`                     | أعد ضبط محاكيات HTTP/المصادقة الخاصة بالموفّر بعد كل اختبار. استورد من `plugin-sdk/provider-http-test-mocks`                              |
| `installCommonResolveTargetErrorCases`               | حالات اختبار مشتركة لمعالجة أخطاء حلّ الهدف. استورد من `plugin-sdk/channel-target-testing`                                                 |
| `shouldAckReaction`                                  | افحص ما إذا كان ينبغي للقناة إضافة تفاعل إقرار. استورد من `plugin-sdk/channel-feedback`                                                     |
| `removeAckReactionAfterReply`                        | أزِل تفاعل الإقرار بعد تسليم الرد. استورد من `plugin-sdk/channel-feedback`                                                                  |
| `createTestRegistry`                                 | أنشئ تجهيزة سجل Plugin للقناة. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                             |
| `createEmptyPluginRegistry`                          | أنشئ تجهيزة سجل Plugin فارغ. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                               |
| `setActivePluginRegistry`                            | ثبّت تجهيزة سجل لاختبارات وقت تشغيل Plugin. استورد من `plugin-sdk/plugin-test-runtime` أو `plugin-sdk/channel-test-helpers`                |
| `createRequestCaptureJsonFetch`                      | التقط طلبات جلب JSON في اختبارات مساعد الوسائط. استورد من `plugin-sdk/test-env`                                                            |
| `withServer`                                         | شغّل الاختبارات مقابل خادم HTTP محلي قابل للتخلص منه. استورد من `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | أنشئ كائن طلب HTTP واردًا بسيطًا. استورد من `plugin-sdk/test-env`                                                                           |
| `withFetchPreconnect`                                | شغّل اختبارات الجلب مع تثبيت خطافات الاتصال المسبق. استورد من `plugin-sdk/test-env`                                                        |
| `withEnv` / `withEnvAsync`                           | رقّع متغيرات البيئة مؤقتًا. استورد من `plugin-sdk/test-env`                                                                                |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | أنشئ تجهيزات اختبار نظام ملفات معزولة. استورد من `plugin-sdk/test-env`                                                                     |
| `createMockServerResponse`                           | أنشئ محاكاة بسيطة لاستجابة خادم HTTP. استورد من `plugin-sdk/test-env`                                                                       |
| `createCliRuntimeCapture`                            | التقط مخرجات وقت تشغيل CLI في الاختبارات. استورد من `plugin-sdk/test-fixtures`                                                             |
| `importFreshModule`                                  | استورد وحدة ESM برمز استعلام جديد لتجاوز ذاكرة التخزين المؤقت للوحدات. استورد من `plugin-sdk/test-fixtures`                               |
| `bundledPluginRoot` / `bundledPluginFile`            | حلّ مسارات تجهيزات مصدر Plugin المضمّن أو توزيعه. استورد من `plugin-sdk/test-fixtures`                                                     |
| `mockNodeBuiltinModule`                              | ثبّت محاكيات Vitest ضيقة للوحدات المضمّنة في Node. استورد من `plugin-sdk/test-node-mocks`                                                  |
| `createSandboxTestContext`                           | أنشئ سياقات اختبار صندوق العزل. استورد من `plugin-sdk/test-fixtures`                                                                       |
| `writeSkill`                                         | اكتب تجهيزات Skills. استورد من `plugin-sdk/test-fixtures`                                                                                  |
| `makeAgentAssistantMessage`                          | أنشئ تجهيزات رسائل نسخ الوكيل. استورد من `plugin-sdk/test-fixtures`                                                                        |
| `peekSystemEvents` / `resetSystemEventsForTest`      | افحص تجهيزات أحداث النظام وأعد ضبطها. استورد من `plugin-sdk/test-fixtures`                                                                |
| `sanitizeTerminalText`                               | نظّف مخرجات الطرفية للتأكيدات. استورد من `plugin-sdk/test-fixtures`                                                                        |
| `countLines` / `hasBalancedFences`                   | تحقّق من شكل مخرجات التقسيم إلى مقاطع. استورد من `plugin-sdk/test-fixtures`                                                               |
| `runProviderCatalog`                                 | نفّذ خطاف كتالوج الموفّر باستخدام تبعيات الاختبار                                                                                         |
| `resolveProviderWizardOptions`                       | حلّ اختيارات معالج إعداد الموفّر في اختبارات العقد                                                                                         |
| `resolveProviderModelPickerEntries`                  | حلّ إدخالات منتقي نموذج الموفّر في اختبارات العقد                                                                                         |
| `buildProviderPluginMethodChoice`                    | أنشئ معرّفات اختيارات معالج الموفّر للتأكيدات                                                                                              |
| `setProviderWizardProvidersResolverForTest`          | احقن موفّري معالج الموفّر للاختبارات المعزولة                                                                                              |
| `createProviderUsageFetch`                           | إنشاء تجهيزات اختبار لجلب استخدام المزوّد                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | تجميد المؤقتات واستعادتها للاختبارات الحساسة للوقت. استورد من `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | إنشاء محفّز معالج إعداد وهمي                                                                                                     |
| `createRuntimeTaskFlow`                              | إنشاء حالة معزولة لتدفّق مهام وقت التشغيل                                                                                                  |
| `typedCases`                                         | الحفاظ على الأنواع الحرفية للاختبارات المعتمدة على الجداول. استورد من `plugin-sdk/test-fixtures`                                                    |

تستخدم مجموعات عقود Plugins المضمّنة أيضًا مسارات SDK فرعية للاختبار لمساعدات fixture الخاصة بالسجل والبيان والقطع العامة ووقت التشغيل، والمخصصة للاختبارات فقط. تبقى المجموعات الخاصة بالنواة فقط التي تعتمد على مخزون OpenClaw المضمّن ضمن `src/plugins/contracts`.
أبقِ اختبارات الإضافات الجديدة على مسار SDK فرعي موثق ومركّز مثل
`plugin-sdk/plugin-test-api` أو `plugin-sdk/channel-contract-testing` أو
`plugin-sdk/agent-runtime-test-contracts` أو `plugin-sdk/channel-test-helpers` أو
`plugin-sdk/plugin-test-contracts` أو `plugin-sdk/plugin-test-runtime` أو
`plugin-sdk/provider-test-contracts` أو `plugin-sdk/provider-http-test-mocks` أو
`plugin-sdk/test-env` أو `plugin-sdk/test-fixtures` بدلًا من استيراد barrel التوافقي الواسع
`plugin-sdk/testing` أو ملفات المستودع `src/**` أو جسور المستودع
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

لا تختبر اختبارات الوحدة التي تمرر محاكاة `api` مكتوبة يدويًا إلى `register(api)` بوابات قبول المُحمّل في OpenClaw. أضف اختبار دخان واحدًا على الأقل مدعومًا بالمُحمّل لكل سطح تسجيل يعتمد عليه Plugin لديك، خصوصًا hooks والقدرات الحصرية مثل الذاكرة.

يفشل المُحمّل الحقيقي تسجيل Plugin عندما تكون بيانات التعريف المطلوبة مفقودة أو عندما يستدعي Plugin واجهة API لقدرة لا يملكها. على سبيل المثال، يتطلب
`api.registerHook(...)` اسم hook، ويتطلب
`api.registerMemoryCapability(...)` أن يعلن بيان Plugin أو نقطة الدخول المصدّرة عن `kind: "memory"`.

### اختبار الوصول إلى إعدادات وقت التشغيل

فضّل محاكاة وقت تشغيل Plugin المشتركة من `openclaw/plugin-sdk/channel-test-helpers`
عند اختبار Plugins القنوات المضمّنة. ترمي محاكيات `runtime.config.loadConfig()` و
`runtime.config.writeConfigFile(...)` المهملة افتراضيًا حتى تلتقط الاختبارات أي استخدام جديد لواجهات API التوافقية. لا تتجاوز هذه المحاكيات إلا عندما يغطي الاختبار صراحةً سلوك التوافق القديم.

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

### الاختبار باستخدام stubs لكل مثيل

فضّل stubs لكل مثيل على تعديل prototype:

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

- أي Plugins تسجل أي مزوّدين
- أي Plugins تسجل أي مزوّدي كلام
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

## فرض lint (Plugins داخل المستودع)

تفرض `pnpm check` ثلاث قواعد على Plugins داخل المستودع:

1. **عدم وجود استيرادات جذرية أحادية** -- يُرفض barrel الجذري `openclaw/plugin-sdk`
2. **عدم وجود استيرادات مباشرة من `src/`** -- لا يمكن لـ Plugins استيراد `../../src/` مباشرة
3. **عدم وجود استيرادات ذاتية** -- لا يمكن لـ Plugins استيراد المسار الفرعي `plugin-sdk/<name>` الخاص بها

لا تخضع Plugins الخارجية لقواعد lint هذه، لكن يُوصى باتباع الأنماط نفسها.

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
- [Plugins مزوّدي SDK](/ar/plugins/sdk-provider-plugins) -- hooks Plugin المزوّد
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل البدء
