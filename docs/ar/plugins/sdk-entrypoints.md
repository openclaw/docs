---
read_when:
    - تحتاج إلى توقيع النوع الدقيق لـ defineToolPlugin أو definePluginEntry أو defineChannelPluginEntry
    - تريد فهم وضع التسجيل (الكامل مقابل الإعداد مقابل بيانات CLI الوصفية)
    - أنت تبحث عن خيارات نقطة الدخول
sidebarTitle: Entry Points
summary: مرجع لـ defineToolPlugin و definePluginEntry و defineChannelPluginEntry و defineSetupPluginEntry
title: نقاط دخول Plugin
x-i18n:
    generated_at: "2026-06-27T18:17:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

تُصدّر كل Plugin كائن إدخال افتراضيًا. يوفّر SDK مساعدين
لإنشائها.

بالنسبة إلى Plugins المثبّتة، يجب أن يوجّه `package.json` تحميل وقت التشغيل إلى
JavaScript المبني عند توفره:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

تظل `extensions` و`setupEntry` إدخالات مصدر صالحة للتطوير في مساحة العمل وعمليات
checkout عبر git. تُفضّل `runtimeExtensions` و`runtimeSetupEntry`
عندما يحمّل OpenClaw حزمة مثبّتة، وتتيح لحزم npm تجنّب تصريف TypeScript
في وقت التشغيل. إدخالات وقت التشغيل الصريحة مطلوبة: تتطلب `runtimeSetupEntry`
وجود `setupEntry`، كما أن غياب عناصر `runtimeExtensions` أو `runtimeSetupEntry`
المبنية يفشل التثبيت/الاكتشاف بدلًا من الرجوع بصمت إلى المصدر. إذا
صرّحت حزمة مثبّتة بإدخال مصدر TypeScript فقط، فسيستخدم OpenClaw نظيرًا
مبنيًا مطابقًا في `dist/*.js` عند وجوده، ثم يرجع إلى مصدر TypeScript.

يجب أن تبقى جميع مسارات الإدخال داخل دليل حزمة Plugin. لا تجعل إدخالات وقت التشغيل
ونظراء JavaScript المبنيون المستنتجون مسار مصدر `extensions` أو
`setupEntry` الخارج من الدليل صالحًا.

<Tip>
  **هل تبحث عن شرح تفصيلي؟** راجع [Plugins الأدوات](/ar/plugins/tool-plugins)،
  أو [Plugins القنوات](/ar/plugins/sdk-channel-plugins)، أو
  [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة.
</Tip>

## `defineToolPlugin`

**الاستيراد:** `openclaw/plugin-sdk/tool-plugin`

لـ Plugins البسيطة التي تضيف أدوات الوكيل فقط. يُبقي `defineToolPlugin`
مصدر التأليف صغيرًا، ويستنتج أنواع إعدادات التكوين ومعلمات الأدوات من مخططات TypeBox،
ويلفّ قيم الإرجاع العادية بتنسيق نتيجة أداة OpenClaw، ويكشف بيانات وصفية ثابتة
يكتبها `openclaw plugins build` في بيان Plugin.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` اختياري. عند حذفه، يستخدم OpenClaw مخطط كائن فارغًا صارمًا
  ويظل البيان المولّد يتضمن `configSchema`.
- تعيد `execute` سلسلة نصية عادية أو قيمة قابلة للتسلسل إلى JSON. يلفّها المساعد
  كنتيجة أداة نصية مع `details`.
- أسماء الأدوات ثابتة. يشتق `openclaw plugins build` قيمة `contracts.tools`
  من الأدوات المصرّح بها، لذلك لا يكرّر المؤلفون الأسماء يدويًا.
- يظل تحميل وقت التشغيل صارمًا. ما تزال Plugins المثبّتة تحتاج إلى
  `openclaw.plugin.json` و`package.json` `openclaw.extensions`؛ ولا ينفّذ OpenClaw
  كود Plugin لاستنتاج بيانات بيان مفقودة.

## `definePluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/plugin-entry`

لـ Plugins المزوّدين، وPlugins الأدوات المتقدمة، وPlugins الخطافات، وأي شيء
**ليس** قناة مراسلة.

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
| -------------- | ---------------------------------------------------------------- | ------ | ------------------ |
| `id`           | `string`                                                         | نعم    | -                  |
| `name`         | `string`                                                         | نعم    | -                  |
| `description`  | `string`                                                         | نعم    | -                  |
| `kind`         | `string`                                                         | لا     | -                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا     | مخطط كائن فارغ     |
| `register`     | `(api: OpenClawPluginApi) => void`                               | نعم    | -                  |

- يجب أن يطابق `id` بيان `openclaw.plugin.json` لديك.
- `kind` مخصص للخانات الحصرية: `"memory"` أو `"context-engine"`.
- يمكن أن تكون `configSchema` دالة للتقييم الكسول.
- يحل OpenClaw ذلك المخطط ويخزّنه عند أول وصول، لذلك لا تعمل بُناة المخططات
  المكلفة إلا مرة واحدة.

## `defineChannelPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

يلفّ `definePluginEntry` بتوصيل خاص بالقنوات. يستدعي تلقائيًا
`api.registerChannel({ plugin })`، ويكشف وصلة بيانات وصفية اختيارية لـ CLI مساعدة الجذر،
ويقيّد `registerFull` بحسب وضع التسجيل.

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

| الحقل                 | النوع                                                            | مطلوب | الافتراضي      |
| --------------------- | ---------------------------------------------------------------- | ------ | --------------- |
| `id`                  | `string`                                                         | نعم    | -               |
| `name`                | `string`                                                         | نعم    | -               |
| `description`         | `string`                                                         | نعم    | -               |
| `plugin`              | `ChannelPlugin`                                                  | نعم    | -               |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا     | مخطط كائن فارغ  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | لا     | -               |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | لا     | -               |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | لا     | -               |

- يُستدعى `setRuntime` أثناء التسجيل حتى تتمكن من تخزين مرجع وقت التشغيل
  (عادةً عبر `createPluginRuntimeStore`). ويُتجاوز أثناء التقاط بيانات CLI الوصفية.
- يعمل `registerCliMetadata` أثناء `api.registrationMode === "cli-metadata"`،
  و`api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"`.
  استخدمه كمكان أساسي لوصفات CLI المملوكة للقناة حتى تبقى مساعدة الجذر
  غير مفعِّلة، وتتضمن لقطات الاكتشاف بيانات وصفية ثابتة للأوامر، ويبقى
  تسجيل أوامر CLI العادي متوافقًا مع تحميلات Plugin الكاملة.
- تسجيل الاكتشاف غير مفعِّل، وليس خاليًا من الاستيراد. قد يقيّم OpenClaw
  إدخال Plugin الموثوق ووحدة Plugin القناة لبناء اللقطة، لذلك أبقِ الاستيرادات
  على المستوى الأعلى خالية من الآثار الجانبية وضع المقابس والعملاء والعاملين
  والخدمات خلف مسارات `"full"` فقط.
- يعمل `registerFull` فقط عندما تكون `api.registrationMode === "full"`. ويُتجاوز
  أثناء التحميل المخصص للإعداد فقط.
- مثل `definePluginEntry`، يمكن أن تكون `configSchema` مصنعًا كسولًا، ويخزّن OpenClaw
  المخطط المحلول عند أول وصول.
- بالنسبة إلى أوامر CLI الجذرية المملوكة لـ Plugin، فضّل `api.registerCli(..., { descriptors: [...] })`
  عندما تريد أن يبقى الأمر محمّلًا بكسل دون أن يختفي من شجرة تحليل CLI الجذرية.
  بالنسبة إلى أوامر الميزات ذات العقد المقترنة، فضّل
  `api.registerNodeCliFeature(...)` حتى يصل الأمر تحت `openclaw nodes`.
  بالنسبة إلى أوامر Plugins المتداخلة الأخرى، أضف `parentPath` وسجّل الأوامر على
  كائن `program` الممرّر إلى المسجّل؛ يحلّه OpenClaw إلى الأمر الأب قبل
  استدعاء Plugin. بالنسبة إلى Plugins القنوات، فضّل تسجيل تلك الوصفات من
  `registerCliMetadata(...)` واجعل `registerFull(...)` مركّزًا على عمل وقت التشغيل فقط.
- إذا كان `registerFull(...)` يسجل أيضًا طرائق RPC في Gateway، فأبقِها على بادئة
  خاصة بـ Plugin. تُجبر مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`،
  و`exec.approvals.*`، و`wizard.*`، و`update.*`) دائمًا إلى
  `operator.admin`.

## `defineSetupPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

لملف `setup-entry.ts` الخفيف. يعيد فقط `{ plugin }` بدون
توصيل وقت تشغيل أو CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

يحمّل OpenClaw هذا بدلًا من الإدخال الكامل عندما تكون قناة معطّلة،
أو غير مكوّنة، أو عند تمكين التحميل المؤجل. راجع
[الإعداد والتكوين](/ar/plugins/sdk-setup#setup-entry) لمعرفة متى يكون هذا مهمًا.

عمليًا، اقرن `defineSetupPluginEntry(...)` بعائلات مساعدي الإعداد الضيقة:

- `openclaw/plugin-sdk/setup-runtime` لمساعدي الإعداد الآمنين لوقت التشغيل مثل
  `createSetupTranslator`، ومحوّلات تصحيح الإعداد الآمنة للاستيراد، ومخرجات ملاحظات البحث،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوّضين
- `openclaw/plugin-sdk/channel-setup` لأسطح إعداد التثبيت الاختياري
- `openclaw/plugin-sdk/setup-tools` لمساعدي CLI/الأرشيف/المستندات للإعداد/التثبيت

أبقِ SDKs الثقيلة، وتسجيل CLI، وخدمات وقت التشغيل طويلة العمر في
الإدخال الكامل.

يمكن لقنوات مساحة العمل المضمّنة التي تفصل بين أسطح الإعداد ووقت التشغيل استخدام
`defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من ذلك. يتيح ذلك العقد
لإدخال الإعداد أن يحتفظ بتصديرات Plugin/الأسرار الآمنة للإعداد مع الاستمرار في كشف
مُعيّن وقت تشغيل:

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
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

استخدم ذلك العقد المضمّن فقط عندما تحتاج تدفقات الإعداد فعلًا إلى مُعيّن وقت تشغيل
خفيف أو سطح Gateway آمن للإعداد قبل تحميل إدخال القناة الكامل.
يعمل `registerSetupRuntime` فقط لتحميلات `"setup-runtime"`؛ أبقِه محدودًا على
المسارات أو الطرائق الخاصة بالتكوين فقط والتي يجب أن توجد قبل التنشيط الكامل المؤجل.

## وضع التسجيل

يخبر `api.registrationMode` الـ Plugin لديك بكيفية تحميله:

| الوضع              | متى                              | ما يجب تسجيله                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | بدء تشغيل Gateway العادي            | كل شيء                                                                                                              |
| `"discovery"`     | اكتشاف الإمكانات للقراءة فقط    | تسجيل القناة مع واصفات CLI الثابتة؛ قد يتم تحميل رمز الإدخال، لكن تخطَّ المقابس والعمّال والعملاء والخدمات |
| `"setup-only"`    | قناة معطّلة/غير مهيأة     | تسجيل القناة فقط                                                                                               |
| `"setup-runtime"` | مسار الإعداد مع توفّر وقت التشغيل | تسجيل القناة مع وقت التشغيل الخفيف فقط المطلوب قبل تحميل المدخل الكامل                               |
| `"cli-metadata"`  | التقاط مساعدة الجذر / بيانات CLI الوصفية  | واصفات CLI فقط                                                                                                    |

يتعامل `defineChannelPluginEntry` مع هذا التقسيم تلقائيًا. إذا كنت تستخدم
`definePluginEntry` مباشرةً لقناة، فتحقّق من الوضع بنفسك:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

يبني وضع الاكتشاف لقطة سجل غير مُفعِّلة. قد يظل يقيّم
مدخل Plugin وكائن Plugin القناة حتى يتمكن OpenClaw من تسجيل إمكانات القناة
وواصفات CLI الثابتة. تعامل مع تقييم الوحدة في وضع الاكتشاف على أنه
موثوق لكنه خفيف: لا عملاء شبكة، أو عمليات فرعية، أو مستمعين، أو اتصالات قاعدة بيانات،
أو عمّال خلفية، أو قراءة بيانات اعتماد، أو آثار جانبية أخرى لوقت التشغيل الحي
على المستوى الأعلى.

تعامل مع `"setup-runtime"` على أنه النافذة التي يجب أن توجد فيها واجهات بدء التشغيل الخاصة بالإعداد فقط
من دون إعادة الدخول إلى وقت تشغيل القناة المضمّن الكامل. من الخيارات المناسبة
تسجيل القناة، ومسارات HTTP الآمنة للإعداد، وطرق Gateway الآمنة للإعداد، ومساعدو الإعداد المفوّضون.
أما خدمات الخلفية الثقيلة، ومسجلو CLI، وعمليات تهيئة SDK الخاصة بالمزوّد/العميل
فما زالت تنتمي إلى `"full"`.

بالنسبة إلى مسجلي CLI تحديدًا:

- استخدم `descriptors` عندما يمتلك المسجل أمر جذر واحدًا أو أكثر وتريد من
  OpenClaw تحميل وحدة CLI الحقيقية بتكاسل عند الاستدعاء الأول
- تأكّد من أن تلك الواصفات تغطي كل جذر أمر من المستوى الأعلى يعرّضه
  المسجل
- اجعل أسماء أوامر الواصفات مقتصرة على الأحرف والأرقام والشرطة والشرطة السفلية،
  وأن تبدأ بحرف أو رقم؛ يرفض OpenClaw أسماء الواصفات التي تقع خارج
  هذا الشكل ويزيل تسلسلات التحكم الطرفية من الأوصاف قبل
  عرض المساعدة
- استخدم `commands` وحدها فقط لمسارات التوافق الحثيثة

## أشكال Plugin

يصنّف OpenClaw Plugins المحمّلة حسب سلوك تسجيلها:

| الشكل                 | الوصف                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | نوع إمكانية واحد (مثل مزوّد فقط)           |
| **hybrid-capability** | أنواع إمكانات متعددة (مثل مزوّد + كلام) |
| **hook-only**         | خطافات فقط، بلا إمكانات                        |
| **non-capability**    | أدوات/أوامر/خدمات لكن بلا إمكانات        |

استخدم `openclaw plugins inspect <id>` لرؤية شكل Plugin.

## ذات صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - واجهة API للتسجيل ومرجع المسارات الفرعية
- [مساعدو وقت التشغيل](/ar/plugins/sdk-runtime) - `api.runtime` و`createPluginRuntimeStore`
- [الإعداد والتكوين](/ar/plugins/sdk-setup) - البيان ومدخل الإعداد والتحميل المؤجل
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - بناء كائن `ChannelPlugin`
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) - تسجيل المزوّد والخطافات
