---
read_when:
    - أنت تكتب اختبارات لـ Plugin
    - تحتاج إلى أدوات اختبار من Plugin SDK
    - تريد فهم اختبارات العقود لـ Plugins المضمنة
sidebarTitle: Testing
summary: أدوات وأنماط الاختبار الخاصة بـ Plugins في OpenClaw
title: اختبار Plugin
x-i18n:
    generated_at: "2026-04-24T07:56:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

مرجع لأدوات الاختبار، والأنماط، وفرض lint الخاصة بـ Plugins في OpenClaw.

<Tip>
  **هل تبحث عن أمثلة للاختبارات؟** تتضمن أدلة how-to أمثلة اختبار عملية:
  [اختبارات Plugin القنوات](/ar/plugins/sdk-channel-plugins#step-6-test) و
  [اختبارات Plugin المزوّدين](/ar/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## أدوات الاختبار

**الاستيراد:** `openclaw/plugin-sdk/testing`

يصدر المسار الفرعي للاختبار مجموعة ضيقة من المساعدات لمؤلفي Plugins:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### الصادرات المتاحة

| التصدير                               | الغرض                                                 |
| ------------------------------------- | ----------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | حالات اختبار مشتركة لمعالجة أخطاء تحليل الهدف         |
| `shouldAckReaction`                    | التحقق مما إذا كانت القناة يجب أن تضيف تفاعل ack      |
| `removeAckReactionAfterReply`          | إزالة تفاعل ack بعد تسليم الرد                        |

### الأنواع

يعيد المسار الفرعي للاختبار أيضًا تصدير أنواع مفيدة في ملفات الاختبار:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
  OpenClawConfig,
  PluginRuntime,
  RuntimeEnv,
  MockFn,
} from "openclaw/plugin-sdk/testing";
```

## اختبار تحليل الهدف

استخدم `installCommonResolveTargetErrorCases` لإضافة حالات الخطأ القياسية الخاصة
بتحليل هدف القناة:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // منطق تحليل الهدف الخاص بقناتك
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // أضف حالات اختبار خاصة بالقناة
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## أنماط الاختبار

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
    // لا يتم كشف قيمة الرمز
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### اختبار وحدة لـ Plugin مزوّد

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

### عمل mock لوقت تشغيل Plugin

بالنسبة إلى الشيفرة التي تستخدم `createPluginRuntimeStore`, قم بعمل mock لوقت التشغيل في الاختبارات:

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
    // ... mocks أخرى
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... مساحات أسماء أخرى
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// بعد الاختبارات
store.clearRuntime();
```

### الاختبار باستخدام stubs لكل مثيل

فضّل stubs لكل مثيل بدلًا من تعديل prototype:

```typescript
// المفضل: stub لكل مثيل
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// تجنّب: تعديل prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## اختبارات العقود (Plugins داخل المستودع)

تحتوي Plugins المضمنة على اختبارات عقود تتحقق من ملكية التسجيل:

```bash
pnpm test -- src/plugins/contracts/
```

تؤكد هذه الاختبارات ما يلي:

- أي Plugins تسجل أي مزوّدين
- أي Plugins تسجل أي مزوّدي كلام
- صحة شكل التسجيل
- الامتثال لعقد وقت التشغيل

### تشغيل اختبارات محددة النطاق

بالنسبة إلى Plugin محدد:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

بالنسبة إلى اختبارات العقود فقط:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## فرض lint ‏(Plugins داخل المستودع)

يتم فرض ثلاث قواعد بواسطة `pnpm check` بالنسبة إلى Plugins داخل المستودع:

1. **عدم استخدام استيرادات الجذر الضخمة** -- يتم رفض الحاوية الجذرية `openclaw/plugin-sdk`
2. **عدم استخدام استيرادات `src/` المباشرة** -- لا يمكن للـ Plugins الاستيراد من `../../src/` مباشرة
3. **عدم استخدام الاستيراد الذاتي** -- لا يمكن للـ Plugins استيراد المسار الفرعي الخاص بها `plugin-sdk/<name>`

لا تخضع Plugins الخارجية لقواعد lint هذه، لكن يوصى باتباع الأنماط نفسها.

## إعداد الاختبار

يستخدم OpenClaw أداة Vitest مع حدود تغطية V8. وبالنسبة إلى اختبارات Plugins:

```bash
# شغّل جميع الاختبارات
pnpm test

# شغّل اختبارات Plugin محدد
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# شغّل باستخدام مرشح اسم اختبار محدد
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# شغّل مع التغطية
pnpm test:coverage
```

إذا سببت التشغيلات المحلية ضغطًا على الذاكرة:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- اصطلاحات الاستيراد
- [SDK الخاص بـ Plugins القنوات](/ar/plugins/sdk-channel-plugins) -- واجهة Plugin القناة
- [SDK الخاص بـ Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) -- خطافات Plugin المزوّد
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل البدء
