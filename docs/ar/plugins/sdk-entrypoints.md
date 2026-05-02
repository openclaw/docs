---
read_when:
    - تحتاج إلى توقيع النوع الدقيق لـ definePluginEntry أو defineChannelPluginEntry
    - تريد فهم وضع التسجيل (كامل مقابل إعداد مقابل بيانات CLI الوصفية)
    - أنت تبحث عن خيارات نقطة الدخول
sidebarTitle: Entry Points
summary: مرجع لـ definePluginEntry وdefineChannelPluginEntry وdefineSetupPluginEntry
title: نقاط دخول Plugin
x-i18n:
    generated_at: "2026-05-02T07:38:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

تصدّر كل Plugin كائن إدخال افتراضيًا. يوفّر SDK ثلاث دوال مساعدة
لإنشائها.

بالنسبة إلى Plugins المثبّتة، يجب أن يوجّه `package.json` التحميل وقت التشغيل إلى JavaScript
المبني عند توفره:

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

تبقى `extensions` و`setupEntry` إدخالات مصدر صالحة للتطوير ضمن مساحة العمل وعمليات
checkout عبر git. وتُفضّل `runtimeExtensions` و`runtimeSetupEntry`
عندما يحمّل OpenClaw حزمة مثبّتة، وتسمح لحزم npm بتجنب تجميع
TypeScript وقت التشغيل. إدخالات وقت التشغيل الصريحة مطلوبة: يتطلب `runtimeSetupEntry`
وجود `setupEntry`، ويؤدي غياب نواتج `runtimeExtensions` أو `runtimeSetupEntry`
إلى فشل التثبيت/الاكتشاف بدلًا من الرجوع بصمت إلى المصدر. إذا
كانت حزمة مثبّتة تعلن فقط عن إدخال مصدر TypeScript، فسيستخدم OpenClaw
نظيرًا مبنيًا مطابقًا من `dist/*.js` عند وجوده، ثم يرجع إلى مصدر TypeScript.

يجب أن تبقى كل مسارات الإدخال داخل دليل حزمة Plugin. إدخالات وقت التشغيل
ونظراء JavaScript المبنيون المستنتجون لا تجعل مسار مصدر `extensions` أو
`setupEntry` الذي يخرج من الدليل صالحًا.

<Tip>
  **تبحث عن شرح عملي؟** راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  أو [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة.
</Tip>

## `definePluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/plugin-entry`

لـ Plugins المزوّدين، وPlugins الأدوات، وPlugins الخطّافات، وأي شيء **ليس**
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

| الحقل          | النوع                                                            | مطلوب | القيمة الافتراضية   |
| -------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`           | `string`                                                         | نعم   | —                   |
| `name`         | `string`                                                         | نعم   | —                   |
| `description`  | `string`                                                         | نعم   | —                   |
| `kind`         | `string`                                                         | لا    | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا    | مخطط كائن فارغ      |
| `register`     | `(api: OpenClawPluginApi) => void`                               | نعم   | —                   |

- يجب أن يطابق `id` ملف البيان `openclaw.plugin.json` الخاص بك.
- يُستخدم `kind` للخانات الحصرية: `"memory"` أو `"context-engine"`.
- يمكن أن يكون `configSchema` دالة للتقييم الكسول.
- يحل OpenClaw ذلك المخطط ويحفظه مؤقتًا عند أول وصول، لذلك لا تعمل بُناة المخططات
  المكلفة إلا مرة واحدة.

## `defineChannelPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

يلف `definePluginEntry` مع توصيلات خاصة بالقنوات. يستدعي تلقائيًا
`api.registerChannel({ plugin })`، ويعرض موضع توسيع اختياريًا لبيانات CLI الوصفية
في مساعدة الجذر، ويقيّد `registerFull` بناءً على وضع التسجيل.

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

| الحقل                 | النوع                                                            | مطلوب | القيمة الافتراضية   |
| --------------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`                  | `string`                                                         | نعم   | —                   |
| `name`                | `string`                                                         | نعم   | —                   |
| `description`         | `string`                                                         | نعم   | —                   |
| `plugin`              | `ChannelPlugin`                                                  | نعم   | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا    | مخطط كائن فارغ      |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | لا    | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | لا    | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | لا    | —                   |

- يُستدعى `setRuntime` أثناء التسجيل حتى تتمكن من تخزين مرجع وقت التشغيل
  (عادة عبر `createPluginRuntimeStore`). ويتم تخطيه أثناء التقاط بيانات CLI الوصفية.
- يعمل `registerCliMetadata` أثناء `api.registrationMode === "cli-metadata"`،
  و`api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"`.
  استخدمه كمكان أساسي للواصفات المملوكة للقناة في CLI حتى تبقى مساعدة الجذر
  غير منشِّطة، وتتضمن لقطات الاكتشاف بيانات وصفية ثابتة للأوامر، ويظل
  تسجيل أوامر CLI العادي متوافقًا مع تحميلات Plugin الكاملة.
- تسجيل الاكتشاف غير منشّط، وليس خاليًا من الاستيراد. قد يقيّم OpenClaw
  إدخال Plugin الموثوق ووحدة Plugin القناة لبناء
  اللقطة، لذلك أبقِ الاستيرادات على المستوى الأعلى بلا آثار جانبية، وضع المقابس
  والعملاء والعاملين والخدمات خلف مسارات مخصصة لـ `"full"` فقط.
- لا يعمل `registerFull` إلا عندما يكون `api.registrationMode === "full"`. ويتم تخطيه
  أثناء التحميل المخصص للإعداد فقط.
- مثل `definePluginEntry`، يمكن أن يكون `configSchema` مصنعًا كسولًا، ويحفظ OpenClaw
  المخطط المحلول مؤقتًا عند أول وصول.
- بالنسبة إلى أوامر CLI الجذرية المملوكة لـ Plugin، فضّل `api.registerCli(..., { descriptors: [...] })`
  عندما تريد أن يبقى الأمر محمّلًا كسولًا دون أن يختفي من
  شجرة تحليل CLI الجذرية. بالنسبة إلى Plugins القنوات، فضّل تسجيل تلك الواصفات
  من `registerCliMetadata(...)` وأبقِ `registerFull(...)` مركّزًا على العمل الخاص بوقت التشغيل فقط.
- إذا كان `registerFull(...)` يسجل أيضًا طرائق RPC في Gateway، فأبقها ضمن
  بادئة خاصة بـ Plugin. مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`،
  و`exec.approvals.*`، و`wizard.*`، و`update.*`) تُجبر دائمًا على
  `operator.admin`.

## `defineSetupPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

لملف `setup-entry.ts` الخفيف. يعيد فقط `{ plugin }` دون
توصيلات وقت تشغيل أو CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

يحمّل OpenClaw هذا بدلًا من الإدخال الكامل عندما تكون قناة معطّلة،
أو غير مهيأة، أو عندما يكون التحميل المؤجل مفعّلًا. راجع
[الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) لمعرفة متى يكون هذا مهمًا.

عمليًا، اربط `defineSetupPluginEntry(...)` بعائلات دوال الإعداد المساعدة الضيقة:

- `openclaw/plugin-sdk/setup-runtime` لدوال الإعداد المساعدة الآمنة وقت التشغيل مثل
  محوّلات تصحيح الإعداد الآمنة للاستيراد، ومخرجات ملاحظات البحث،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوضين
- `openclaw/plugin-sdk/channel-setup` لأسطح إعداد التثبيت الاختياري
- `openclaw/plugin-sdk/setup-tools` لدوال CLI/الأرشيف/الوثائق المساعدة الخاصة بالإعداد/التثبيت

أبقِ SDKs الثقيلة، وتسجيل CLI، وخدمات وقت التشغيل طويلة العمر في الإدخال الكامل.

يمكن لقنوات مساحة العمل المضمّنة التي تفصل بين أسطح الإعداد ووقت التشغيل استخدام
`defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من ذلك. يتيح ذلك العقد
لإدخال الإعداد الاحتفاظ بصادرات Plugin/الأسرار الآمنة للإعداد مع الاستمرار في عرض
ضابط وقت تشغيل:

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

استخدم ذلك العقد المضمّن فقط عندما تحتاج تدفقات الإعداد فعلًا إلى ضابط وقت تشغيل خفيف
قبل تحميل إدخال القناة الكامل.

## وضع التسجيل

يخبر `api.registrationMode` الـ Plugin بكيفية تحميله:

| الوضع            | متى                              | ما الذي يجب تسجيله                                                                                                      |
| ---------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`         | بدء Gateway العادي               | كل شيء                                                                                                                  |
| `"discovery"`    | اكتشاف قدرات للقراءة فقط         | تسجيل القناة إضافة إلى واصفات CLI ثابتة؛ قد يتم تحميل كود الإدخال، لكن تخطَّ المقابس والعاملين والعملاء والخدمات        |
| `"setup-only"`   | قناة معطّلة/غير مهيأة            | تسجيل القناة فقط                                                                                                        |
| `"setup-runtime"` | تدفق إعداد مع توفر وقت التشغيل   | تسجيل القناة إضافة إلى وقت التشغيل الخفيف فقط المطلوب قبل تحميل الإدخال الكامل                                          |
| `"cli-metadata"` | مساعدة الجذر / التقاط بيانات CLI الوصفية | واصفات CLI فقط                                                                                                  |

يتولى `defineChannelPluginEntry` هذا التقسيم تلقائيًا. إذا استخدمت
`definePluginEntry` مباشرة لقناة، فتحقق من الوضع بنفسك:

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

يبني وضع الاكتشاف لقطة سجل غير منشّطة. وقد يظل يقيّم
إدخال Plugin وكائن Plugin القناة حتى يتمكن OpenClaw من تسجيل قدرات القناة
وواصفات CLI الثابتة. تعامل مع تقييم الوحدات في الاكتشاف على أنه
موثوق لكنه خفيف: لا عملاء شبكة، أو عمليات فرعية، أو مستمعون، أو اتصالات قواعد بيانات،
أو عاملون في الخلفية، أو قراءات بيانات اعتماد، أو آثار جانبية حية أخرى لوقت التشغيل على المستوى الأعلى.

تعامل مع `"setup-runtime"` على أنه النافذة التي يجب أن تتوفر فيها أسطح بدء التشغيل المخصصة للإعداد فقط
من دون إعادة الدخول إلى وقت تشغيل القناة المضمّنة الكامل. من الاستخدامات المناسبة
تسجيل القناة، ومسارات HTTP الآمنة للإعداد، وطرائق Gateway الآمنة للإعداد، و
دوال الإعداد المساعدة المفوضة. أما خدمات الخلفية الثقيلة، ومسجّلات CLI، و
تهيئة SDKs المزوّد/العميل فما تزال تنتمي إلى `"full"`.

بالنسبة إلى مسجّلات CLI تحديدًا:

- استخدم `descriptors` عندما يملك المسجّل أمرًا جذريًا واحدًا أو أكثر وتريد
  أن يحمّل OpenClaw وحدة CLI الحقيقية كسولًا عند أول استدعاء
- تأكد من أن تلك الواصفات تغطي كل جذر أمر من المستوى الأعلى يعرضه
  المسجّل
- أبقِ أسماء أوامر الواصفات مقتصرة على الأحرف والأرقام والشرطة والشرطة السفلية،
  وأن تبدأ بحرف أو رقم؛ يرفض OpenClaw أسماء الواصفات خارج
  هذا الشكل، ويزيل تسلسلات التحكم الطرفية من الأوصاف قبل
  عرض المساعدة
- استخدم `commands` وحدها فقط لمسارات التوافق الفورية

## أشكال Plugin

يصنّف OpenClaw Plugins المحمّلة حسب سلوك تسجيلها:

| الشكل                 | الوصف                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | نوع قدرة واحد (مثلًا: موفّر فقط)           |
| **hybrid-capability** | أنواع قدرات متعددة (مثلًا: موفّر + كلام) |
| **hook-only**         | خطّافات فقط، بلا قدرات                        |
| **non-capability**    | أدوات/أوامر/خدمات لكن بلا قدرات        |

استخدم `openclaw plugins inspect <id>` لرؤية شكل Plugin.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — واجهة API للتسجيل ومرجع المسارات الفرعية
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) — `api.runtime` و`createPluginRuntimeStore`
- [الإعداد والتهيئة](/ar/plugins/sdk-setup) — البيان، مدخل الإعداد، التحميل المؤجّل
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء كائن `ChannelPlugin`
- [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins) — تسجيل الموفّر والخطّافات
