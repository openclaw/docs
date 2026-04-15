---
read_when:
    - أنت تكتب اختبارات لإضافة Plugin
    - أنت بحاجة إلى أدوات اختبار من Plugin SDK
    - تريد فهم اختبارات العقد للإضافات المضمنة
sidebarTitle: Testing
summary: أدوات الاختبار والأنماط الخاصة بإضافات OpenClaw
title: اختبار الإضافات
x-i18n:
    generated_at: "2026-04-15T19:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f75bd3f3b5ba34b05786e0dd96d493c36db73a1d258998bf589e27e45c0bd09
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# اختبار الإضافات

مرجع لأدوات الاختبار والأنماط وفرض قواعد lint لإضافات OpenClaw.

<Tip>
  **هل تبحث عن أمثلة للاختبارات؟** تتضمن أدلة الشرح العملية أمثلة اختبار مكتملة:
  [اختبارات إضافات القنوات](/ar/plugins/sdk-channel-plugins#step-6-test) و
  [اختبارات إضافات المزوّدين](/ar/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## أدوات الاختبار

**الاستيراد:** `openclaw/plugin-sdk/testing`

يُصدّر المسار الفرعي الخاص بالاختبار مجموعة محدودة من المساعدات لمؤلفي الإضافات:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### العناصر المصدّرة المتاحة

| العنصر المصدَّر                         | الغرض                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | حالات اختبار مشتركة لمعالجة أخطاء حل الهدف            |
| `shouldAckReaction`                    | التحقق مما إذا كان يجب على القناة إضافة تفاعل إقرار    |
| `removeAckReactionAfterReply`          | إزالة تفاعل الإقرار بعد تسليم الرد                     |

### الأنواع

يعيد المسار الفرعي الخاص بالاختبار أيضًا تصدير أنواع مفيدة في ملفات الاختبار:

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

## اختبار حل الهدف

استخدم `installCommonResolveTargetErrorCases` لإضافة حالات الخطأ القياسية لحل هدف القناة:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

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

### اختبار وحدة لإضافة قناة

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

### اختبار وحدة لإضافة مزوّد

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

### محاكاة Runtime الخاص بالإضافة

بالنسبة إلى الشيفرة التي تستخدم `createPluginRuntimeStore`، قم بمحاكاة runtime في الاختبارات:

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
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### الاختبار باستخدام بدائل على مستوى المثيل

فضّل استخدام البدائل على مستوى المثيل بدلًا من تعديل prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## اختبارات العقد (الإضافات داخل المستودع)

تحتوي الإضافات المضمنة على اختبارات عقد تتحقق من ملكية التسجيل:

```bash
pnpm test -- src/plugins/contracts/
```

تؤكد هذه الاختبارات ما يلي:

- أي الإضافات تسجل أي مزوّدين
- أي الإضافات تسجل أي مزوّدي speech
- صحة شكل التسجيل
- الامتثال لعقد Runtime

### تشغيل اختبارات محددة النطاق

لإضافة محددة:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

لاختبارات العقد فقط:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## فرض قواعد lint (الإضافات داخل المستودع)

يتم فرض ثلاث قواعد بواسطة `pnpm check` للإضافات داخل المستودع:

1. **عدم استخدام استيرادات الجذر الأحادية** -- يتم رفض الحزمة المجمعة الجذرية `openclaw/plugin-sdk`
2. **عدم استخدام استيرادات `src/` المباشرة** -- لا يمكن للإضافات الاستيراد مباشرة من `../../src/`
3. **عدم استخدام الاستيراد الذاتي** -- لا يمكن للإضافات استيراد مسارها الفرعي `plugin-sdk/<name>` الخاص بها

لا تخضع الإضافات الخارجية لقواعد lint هذه، ولكن يُنصح باتباع الأنماط نفسها.

## إعداد الاختبار

يستخدم OpenClaw أداة Vitest مع حدود تغطية V8. بالنسبة لاختبارات الإضافات:

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

إذا كانت عمليات التشغيل المحلية تسبب ضغطًا على الذاكرة:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- اصطلاحات الاستيراد
- [إضافات قنوات SDK](/ar/plugins/sdk-channel-plugins) -- واجهة إضافة القناة
- [إضافات مزوّدي SDK](/ar/plugins/sdk-provider-plugins) -- خطافات إضافة المزوّد
- [بناء الإضافات](/ar/plugins/building-plugins) -- دليل البدء
