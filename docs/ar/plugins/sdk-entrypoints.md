---
read_when:
    - أنت بحاجة إلى التوقيع النوعي الدقيق لـ `definePluginEntry` أو `defineChannelPluginEntry`
    - تريد فهم وضع التسجيل (كامل مقابل الإعداد مقابل بيانات CLI الوصفية)
    - أنت تبحث عن خيارات نقطة الدخول
sidebarTitle: Entry Points
summary: مرجع `definePluginEntry` و`defineChannelPluginEntry` و`defineSetupPluginEntry`
title: نقاط دخول Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabca25bc9b8ff1b5bb4852bafe83640ffeba006ea6b6a8eff4e2c37a10f1fe4
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# نقاط دخول Plugin

يُصدر كل Plugin كائن دخول افتراضيًا. توفّر SDK ثلاثة مساعدين
لإنشائها.

<Tip>
  **هل تبحث عن شرح عملي؟** راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  أو [Plugins المزوّد](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة.
</Tip>

## `definePluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/plugin-entry`

لـ Plugins المزوّد، وPlugins الأدوات، وPlugins الخطافات، وأي شيء **ليس**
قناة مراسلة.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| الحقل          | النوع                                                            | مطلوب | الافتراضي          |
| -------------- | ---------------------------------------------------------------- | ----- | ------------------ |
| `id`           | `string`                                                         | نعم   | —                  |
| `name`         | `string`                                                         | نعم   | —                  |
| `description`  | `string`                                                         | نعم   | —                  |
| `kind`         | `string`                                                         | لا    | —                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا    | مخطط كائن فارغ     |
| `register`     | `(api: OpenClawPluginApi) => void`                               | نعم   | —                  |

- يجب أن يطابق `id` ملف manifest ‏`openclaw.plugin.json` الخاص بك.
- يُستخدم `kind` للخانات الحصرية: `"memory"` أو `"context-engine"`.
- يمكن أن يكون `configSchema` دالة للتقييم الكسول.
- يقوم OpenClaw بحل هذا المخطط وتخزينه مؤقتًا عند أول وصول، لذلك فإن بُناة
  المخططات المكلفة لا تعمل إلا مرة واحدة.

## `defineChannelPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

يلف `definePluginEntry` مع توصيلات خاصة بالقنوات. ويستدعي تلقائيًا
`api.registerChannel({ plugin })`، ويكشف عن نقطة وصل اختيارية لبيانات CLI الوصفية
للمساعدة الجذرية، ويقيّد `registerFull` حسب وضع التسجيل.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| الحقل                 | النوع                                                            | مطلوب | الافتراضي          |
| --------------------- | ---------------------------------------------------------------- | ----- | ------------------ |
| `id`                  | `string`                                                         | نعم   | —                  |
| `name`                | `string`                                                         | نعم   | —                  |
| `description`         | `string`                                                         | نعم   | —                  |
| `plugin`              | `ChannelPlugin`                                                  | نعم   | —                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا    | مخطط كائن فارغ     |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | لا    | —                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | لا    | —                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | لا    | —                  |

- يتم استدعاء `setRuntime` أثناء التسجيل حتى تتمكن من تخزين مرجع runtime
  (عادةً عبر `createPluginRuntimeStore`). ويتم تخطيه أثناء
  التقاط بيانات CLI الوصفية.
- يعمل `registerCliMetadata` أثناء كل من
  `api.registrationMode === "cli-metadata"` و `api.registrationMode === "full"`.
  استخدمه باعتباره المكان القياسي لوصفات CLI المملوكة للقناة حتى
  تبقى المساعدة الجذرية غير مفعِّلة، مع بقاء تسجيل أوامر CLI العادي متوافقًا
  مع تحميلات Plugin الكاملة.
- لا يعمل `registerFull` إلا عندما يكون `api.registrationMode === "full"`. ويتم تخطيه
  أثناء التحميل الخاص بالإعداد فقط.
- مثل `definePluginEntry`، يمكن أن يكون `configSchema` مصنعًا كسولًا ويقوم OpenClaw
  بتخزين المخطط المحلول مؤقتًا عند أول وصول.
- بالنسبة إلى أوامر CLI الجذرية المملوكة لـ Plugin، ففضّل `api.registerCli(..., { descriptors: [...] })`
  عندما تريد أن يبقى الأمر محمّلًا كسولًا من دون أن يختفي من
  شجرة تحليل CLI الجذرية. أما بالنسبة إلى Plugins القنوات، ففضّل تسجيل تلك
  الواصفات من `registerCliMetadata(...)` وأبقِ `registerFull(...)` مركّزًا
  على الأعمال الخاصة بـ runtime فقط.
- إذا كان `registerFull(...)` يسجّل أيضًا أساليب Gateway RPC، فأبقِها على
  بادئة خاصة بالـ Plugin. يتم دائمًا فرض مساحات أسماء إدارة النواة المحجوزة (`config.*`،
  `exec.approvals.*`، `wizard.*`، `update.*`) إلى
  `operator.admin`.

## `defineSetupPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

لملف `setup-entry.ts` خفيف الوزن. يُرجع فقط `{ plugin }` من دون
توصيلات runtime أو CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

يقوم OpenClaw بتحميل هذا بدلًا من نقطة الدخول الكاملة عندما تكون القناة معطّلة،
أو غير مُعدّة، أو عند تمكين التحميل المؤجّل. راجع
[الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) لمعرفة متى يكون هذا مهمًا.

عمليًا، يمكنك إقران `defineSetupPluginEntry(...)` بعائلات
مساعدات الإعداد الضيقة التالية:

- `openclaw/plugin-sdk/setup-runtime` لمساعدات الإعداد الآمنة مع runtime مثل
  محولات تصحيح الإعداد الآمنة للاستيراد، ومخرجات ملاحظات البحث،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوَّضين
- `openclaw/plugin-sdk/channel-setup` لواجهات الإعداد الخاصة بالتثبيت الاختياري
- `openclaw/plugin-sdk/setup-tools` لمساعدات CLI/الأرشيف/الوثائق الخاصة بالإعداد/التثبيت

أبقِ SDKs الثقيلة، وتسجيل CLI، وخدمات runtime طويلة العمر في
نقطة الدخول الكاملة.

يمكن لقنوات مساحة العمل المجمّعة التي تقسّم بين أسطح الإعداد وruntime استخدام
`defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من ذلك. يتيح هذا العقد لـ
نقطة دخول الإعداد الاحتفاظ بتصديرات plugin/secrets الآمنة للإعداد مع
الاستمرار في كشف أداة تعيين runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

استخدم هذا العقد المجمّع فقط عندما تحتاج تدفقات الإعداد فعلًا إلى أداة تعيين
runtime خفيفة الوزن قبل تحميل نقطة دخول القناة الكاملة.

## وضع التسجيل

يخبر `api.registrationMode` الـ Plugin الخاص بك بكيفية تحميله:

| الوضع             | متى                                 | ما الذي يجب تسجيله                                                                  |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `"full"`          | بدء تشغيل Gateway العادي            | كل شيء                                                                               |
| `"setup-only"`    | قناة معطّلة/غير مُعدّة              | تسجيل القناة فقط                                                                     |
| `"setup-runtime"` | تدفق إعداد مع توفر runtime          | تسجيل القناة بالإضافة إلى runtime الخفيف فقط المطلوب قبل تحميل نقطة الدخول الكاملة |
| `"cli-metadata"`  | المساعدة الجذرية / التقاط بيانات CLI الوصفية | واصفات CLI فقط                                                                       |

يتعامل `defineChannelPluginEntry` مع هذا التقسيم تلقائيًا. إذا استخدمت
`definePluginEntry` مباشرةً لقناة، فتحقق من الوضع بنفسك:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

تعامل مع `"setup-runtime"` باعتباره النافذة التي يجب أن تكون فيها أسطح بدء التشغيل
الخاصة بالإعداد فقط موجودة من دون إعادة الدخول إلى runtime القناة المجمّعة الكاملة.
وتشمل الحالات المناسبة تسجيل القنوات، ومسارات HTTP الآمنة للإعداد، وأساليب Gateway
الآمنة للإعداد، ومساعدات الإعداد المفوَّضة. أما خدمات الخلفية الثقيلة، ومسجلات CLI،
وتهيئات SDK الخاصة بالمزوّد/العميل فما تزال تنتمي إلى `"full"`.

وبالنسبة إلى مسجلات CLI تحديدًا:

- استخدم `descriptors` عندما يمتلك المسجل أمرًا جذريًا واحدًا أو أكثر وتريد
  من OpenClaw أن يحمّل وحدة CLI الحقيقية بكسل عند أول استدعاء
- تأكد من أن هذه الواصفات تغطي كل جذر أوامر من المستوى الأعلى يكشفه
  المسجل
- استخدم `commands` وحده فقط لمسارات التوافق المتعجلة

## أشكال Plugin

يصنّف OpenClaw Plugins المحمّلة وفقًا لسلوك التسجيل الخاص بها:

| الشكل                 | الوصف                                            |
| --------------------- | ------------------------------------------------ |
| **plain-capability**  | نوع قدرة واحد (مثل مزوّد فقط)                    |
| **hybrid-capability** | أنواع قدرات متعددة (مثل مزوّد + كلام)            |
| **hook-only**         | خطافات فقط، من دون قدرات                         |
| **non-capability**    | أدوات/أوامر/خدمات ولكن من دون قدرات             |

استخدم `openclaw plugins inspect <id>` لرؤية شكل Plugin.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع API التسجيل والمسارات الفرعية
- [مساعدات Runtime](/ar/plugins/sdk-runtime) — ‏`api.runtime` و`createPluginRuntimeStore`
- [الإعداد والتهيئة](/ar/plugins/sdk-setup) — manifest، ونقطة دخول الإعداد، والتحميل المؤجّل
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء كائن `ChannelPlugin`
- [Plugins المزوّد](/ar/plugins/sdk-provider-plugins) — تسجيل المزوّد والخطافات
