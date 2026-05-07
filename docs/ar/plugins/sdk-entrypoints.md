---
read_when:
    - تحتاج إلى توقيع النوع الدقيق لـ definePluginEntry أو defineChannelPluginEntry
    - تريد فهم وضع التسجيل (الكامل مقابل الإعداد مقابل بيانات CLI الوصفية)
    - أنت تبحث عن خيارات نقطة الدخول
sidebarTitle: Entry Points
summary: مرجع لـ definePluginEntry وdefineChannelPluginEntry وdefineSetupPluginEntry
title: نقاط دخول Plugin
x-i18n:
    generated_at: "2026-05-07T13:26:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

يصدّر كل Plugin كائن إدخال افتراضيًا. يوفّر SDK ثلاث دوال مساعدة
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

تظل `extensions` و`setupEntry` إدخالات مصدر صالحة لتطوير مساحة العمل وعمليات
git checkout. تكون `runtimeExtensions` و`runtimeSetupEntry` مفضّلة عندما يحمّل
OpenClaw حزمة مثبّتة، وتتيح لحزم npm تجنّب ترجمة TypeScript في وقت التشغيل.
إدخالات وقت التشغيل الصريحة مطلوبة: يتطلب `runtimeSetupEntry` وجود `setupEntry`،
وتؤدي ملفات `runtimeExtensions` أو `runtimeSetupEntry` الناقصة إلى فشل التثبيت/الاكتشاف
بدل الرجوع بصمت إلى المصدر. إذا أعلنت حزمة مثبّتة إدخال مصدر TypeScript فقط،
فسيستخدم OpenClaw النظير المبني المطابق `dist/*.js` عند وجوده، ثم يرجع إلى مصدر
TypeScript.

يجب أن تبقى كل مسارات الإدخال داخل دليل حزمة Plugin. لا تجعل إدخالات وقت التشغيل
ونظراء JavaScript المبنيون المستنتجون مسار مصدر `extensions` أو `setupEntry`
الخارج من الدليل مسارًا صالحًا.

<Tip>
  **تبحث عن شرح تفصيلي؟** راجع [Channel Plugins](/ar/plugins/sdk-channel-plugins)
  أو [Provider Plugins](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة.
</Tip>

## `definePluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/plugin-entry`

بالنسبة إلى Plugins المزوّدين، وPlugins الأدوات، وPlugins الخطافات، وأي شيء **ليس**
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

| الحقل          | النوع                                                            | مطلوب | الافتراضي             |
| -------------- | ---------------------------------------------------------------- | ----- | --------------------- |
| `id`           | `string`                                                         | نعم   | -                     |
| `name`         | `string`                                                         | نعم   | -                     |
| `description`  | `string`                                                         | نعم   | -                     |
| `kind`         | `string`                                                         | لا    | -                     |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا    | مخطط كائن فارغ        |
| `register`     | `(api: OpenClawPluginApi) => void`                               | نعم   | -                     |

- يجب أن يطابق `id` بيان `openclaw.plugin.json` الخاص بك.
- يُستخدم `kind` للفتحات الحصرية: `"memory"` أو `"context-engine"`.
- يمكن أن يكون `configSchema` دالة للتقييم الكسول.
- يحل OpenClaw هذا المخطط ويخزّنه مؤقتًا عند أول وصول، لذلك لا تعمل بُناة المخططات
  المكلفة إلا مرة واحدة.

## `defineChannelPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

يلف `definePluginEntry` بأسلاك خاصة بالقناة. يستدعي تلقائيًا
`api.registerChannel({ plugin })`، ويكشف وصلة بيانات وصفية اختيارية لـ CLI للمساعدة
الجذرية، ويقيّد `registerFull` بوضع التسجيل.

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

| الحقل                 | النوع                                                            | مطلوب | الافتراضي             |
| --------------------- | ---------------------------------------------------------------- | ----- | --------------------- |
| `id`                  | `string`                                                         | نعم   | -                     |
| `name`                | `string`                                                         | نعم   | -                     |
| `description`         | `string`                                                         | نعم   | -                     |
| `plugin`              | `ChannelPlugin`                                                  | نعم   | -                     |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا    | مخطط كائن فارغ        |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | لا    | -                     |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | لا    | -                     |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | لا    | -                     |

- يُستدعى `setRuntime` أثناء التسجيل حتى تتمكن من تخزين مرجع وقت التشغيل
  (عادةً عبر `createPluginRuntimeStore`). يتم تخطيه أثناء التقاط بيانات CLI الوصفية.
- يعمل `registerCliMetadata` أثناء `api.registrationMode === "cli-metadata"`،
  و`api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"`.
  استخدمه كمكان مرجعي لموصّفات CLI المملوكة للقناة حتى تبقى المساعدة الجذرية
  غير مفعّلة، وتتضمن لقطات الاكتشاف بيانات تعريف أوامر ثابتة، ويبقى تسجيل أوامر
  CLI العادي متوافقًا مع تحميلات Plugin الكاملة.
- تسجيل الاكتشاف غير مفعّل، وليس خاليًا من الاستيراد. قد يقيّم OpenClaw إدخال
  Plugin الموثوق ووحدة Plugin القناة لبناء اللقطة، لذلك أبقِ الاستيرادات على
  المستوى الأعلى خالية من الآثار الجانبية، وضع المقابس والعملاء والعمّال والخدمات
  خلف مسارات `"full"` فقط.
- لا يعمل `registerFull` إلا عندما يكون `api.registrationMode === "full"`. يتم تخطيه
  أثناء التحميل المخصص للإعداد فقط.
- مثل `definePluginEntry`، يمكن أن يكون `configSchema` مصنعًا كسولًا، ويخزّن OpenClaw
  المخطط المحلول مؤقتًا عند أول وصول.
- بالنسبة إلى أوامر CLI الجذرية المملوكة لـ Plugin، فضّل `api.registerCli(..., { descriptors: [...] })`
  عندما تريد أن يبقى الأمر محمّلًا بكسل دون أن يختفي من شجرة تحليل CLI الجذرية.
  بالنسبة إلى أوامر ميزات العقد المزدوجة، فضّل
  `api.registerNodeCliFeature(...)` حتى يقع الأمر تحت `openclaw nodes`.
  بالنسبة إلى أوامر Plugin المتداخلة الأخرى، أضف `parentPath` وسجّل الأوامر على
  كائن `program` الممرّر إلى المسجّل؛ يحلّه OpenClaw إلى الأمر الأب قبل استدعاء
  Plugin. بالنسبة إلى Channel Plugins، فضّل تسجيل تلك الموصّفات من
  `registerCliMetadata(...)` وأبقِ `registerFull(...)` مركّزًا على العمل الخاص بوقت التشغيل فقط.
- إذا كان `registerFull(...)` يسجّل أيضًا طرق RPC في Gateway، فأبقها على بادئة
  خاصة بـ Plugin. تُجبر مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`،
  `exec.approvals.*`، و`wizard.*`، و`update.*`) دائمًا على
  `operator.admin`.

## `defineSetupPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

للملف الخفيف `setup-entry.ts`. يعيد فقط `{ plugin }` من دون أسلاك وقت تشغيل أو CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

يحمّل OpenClaw هذا بدل الإدخال الكامل عندما تكون القناة معطّلة أو غير مهيأة،
أو عندما يكون التحميل المؤجل ممكّنًا. راجع
[Setup and Config](/ar/plugins/sdk-setup#setup-entry) لمعرفة متى يكون ذلك مهمًا.

عمليًا، اقرن `defineSetupPluginEntry(...)` بعائلات دوال الإعداد المساعدة الضيقة:

- `openclaw/plugin-sdk/setup-runtime` لدوال الإعداد المساعدة الآمنة لوقت التشغيل مثل
  محوّلات تصحيح الإعداد الآمنة للاستيراد، ومخرجات ملاحظات البحث،
  `promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوّضين
- `openclaw/plugin-sdk/channel-setup` لأسطح إعداد التثبيت الاختياري
- `openclaw/plugin-sdk/setup-tools` لدوال CLI/الأرشيف/التوثيق المساعدة للإعداد/التثبيت

أبقِ SDKs الثقيلة، وتسجيل CLI، وخدمات وقت التشغيل طويلة العمر في الإدخال الكامل.

يمكن لقنوات مساحة العمل المضمّنة التي تفصل أسطح الإعداد ووقت التشغيل استخدام
`defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من ذلك. يسمح ذلك العقد لإدخال
الإعداد بالاحتفاظ بتصديرات Plugin/الأسرار الآمنة للإعداد، مع الاستمرار في كشف
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
});
```

استخدم ذلك العقد المضمّن فقط عندما تحتاج تدفقات الإعداد فعلًا إلى مُعيّن وقت تشغيل
خفيف قبل تحميل إدخال القناة الكامل.

## وضع التسجيل

يخبر `api.registrationMode` الـ Plugin الخاص بك بكيفية تحميله:

| الوضع             | متى                              | ما الذي يجب تسجيله                                                                                                      |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | بدء تشغيل Gateway العادي         | كل شيء                                                                                                                  |
| `"discovery"`     | اكتشاف قدرات للقراءة فقط         | تسجيل القناة بالإضافة إلى موصّفات CLI الثابتة؛ قد تُحمّل شيفرة الإدخال، لكن تخطَّ المقابس والعمّال والعملاء والخدمات |
| `"setup-only"`    | قناة معطّلة/غير مهيأة            | تسجيل القناة فقط                                                                                                        |
| `"setup-runtime"` | تدفق إعداد مع توفر وقت التشغيل   | تسجيل القناة بالإضافة فقط إلى وقت التشغيل الخفيف المطلوب قبل تحميل الإدخال الكامل                                     |
| `"cli-metadata"`  | المساعدة الجذرية / التقاط بيانات CLI الوصفية | موصّفات CLI فقط                                                                                             |

يتعامل `defineChannelPluginEntry` مع هذا الفصل تلقائيًا. إذا استخدمت
`definePluginEntry` مباشرةً لقناة، فتحقق من الوضع بنفسك:

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

يبني وضع الاكتشاف لقطة سجل غير مفعّلة. وقد يظل يقيّم إدخال Plugin وكائن Plugin
القناة حتى يتمكن OpenClaw من تسجيل قدرات القناة وموصّفات CLI الثابتة. تعامل مع
تقييم الوحدة في الاكتشاف على أنه موثوق لكنه خفيف: لا عملاء شبكة، ولا عمليات فرعية،
ولا مستمعين، ولا اتصالات قواعد بيانات، ولا عمّال خلفية، ولا قراءة بيانات اعتماد،
ولا آثار جانبية حية أخرى لوقت التشغيل على المستوى الأعلى.

تعامل مع `"setup-runtime"` بوصفه النافذة التي يجب أن توجد فيها أسطح بدء التشغيل
المخصصة للإعداد فقط من دون إعادة الدخول إلى وقت تشغيل القناة المضمّنة الكامل.
الملائمات الجيدة هي تسجيل القناة، ومسارات HTTP الآمنة للإعداد، وطرق Gateway
الآمنة للإعداد، ودوال الإعداد المساعدة المفوّضة. لا تزال خدمات الخلفية الثقيلة،
ومسجّلات CLI، وعمليات تمهيد SDK للمزوّد/العميل تنتمي إلى `"full"`.

بالنسبة إلى مسجّلات CLI تحديدًا:

- استخدم `descriptors` عندما يملك المسجِّل أمرا جذريا واحدا أو أكثر وتريد من OpenClaw
  تحميل وحدة CLI الفعلية كسولا عند أول استدعاء
- تأكد من أن تلك الواصفات تغطي كل جذر أمر من المستوى الأعلى يعرّضه
  المسجِّل
- أبقِ أسماء أوامر الواصفات مقتصرة على الأحرف والأرقام والواصلة والشرطة السفلية،
  وأن تبدأ بحرف أو رقم؛ يرفض OpenClaw أسماء الواصفات الخارجة عن
  هذا الشكل ويزيل تسلسلات التحكم الطرفية من الأوصاف قبل
  عرض المساعدة
- استخدم `commands` وحدها فقط لمسارات التوافق المحمّلة بشغف

## أشكال Plugin

يصنّف OpenClaw Plugins المحمّلة حسب سلوك تسجيلها:

| الشكل                 | الوصف                                             |
| --------------------- | ------------------------------------------------ |
| **plain-capability**  | نوع قدرة واحد (مثلا مزوّد فقط)                  |
| **hybrid-capability** | أنواع قدرات متعددة (مثلا مزوّد + كلام)          |
| **hook-only**         | خطافات فقط، بلا قدرات                           |
| **non-capability**    | أدوات/أوامر/خدمات ولكن بلا قدرات                |

استخدم `openclaw plugins inspect <id>` لرؤية شكل Plugin.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - واجهة API للتسجيل ومرجع المسارات الفرعية
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) - `api.runtime` و`createPluginRuntimeStore`
- [الإعداد والتكوين](/ar/plugins/sdk-setup) - البيان، نقطة دخول الإعداد، التحميل المؤجل
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - بناء كائن `ChannelPlugin`
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) - تسجيل المزوّد والخطافات
