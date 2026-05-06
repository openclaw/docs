---
read_when:
    - تحتاج إلى توقيع النوع الدقيق لـ definePluginEntry أو defineChannelPluginEntry
    - تريد فهم وضع التسجيل (الكامل مقابل الإعداد مقابل بيانات CLI الوصفية)
    - تبحث عن خيارات نقطة الدخول
sidebarTitle: Entry Points
summary: مرجع لـ definePluginEntry و defineChannelPluginEntry و defineSetupPluginEntry
title: نقاط دخول Plugin
x-i18n:
    generated_at: "2026-05-06T08:07:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

كل Plugin يصدّر كائن إدخال افتراضيًا. يوفّر SDK ثلاثة مساعدين
لإنشائها.

بالنسبة إلى Plugins المثبتة، يجب أن يوجّه `package.json` التحميل في وقت التشغيل إلى
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

تبقى `extensions` و`setupEntry` إدخالات مصدر صالحة للتطوير داخل مساحة العمل
والتطوير عبر git checkout. تُفضَّل `runtimeExtensions` و`runtimeSetupEntry`
عندما يحمّل OpenClaw حزمة مثبتة، وتتيح لحزم npm تجنّب ترجمة TypeScript في وقت
التشغيل. إدخالات وقت التشغيل الصريحة مطلوبة: يتطلب `runtimeSetupEntry`
وجود `setupEntry`، وتؤدي عناصر `runtimeExtensions` أو `runtimeSetupEntry`
المفقودة إلى فشل التثبيت/الاكتشاف بدلًا من الرجوع بصمت إلى المصدر. إذا كانت
الحزمة المثبتة تعلن فقط عن إدخال مصدر TypeScript، فسيستخدم OpenClaw نظيرًا
مبنيًا مطابقًا من `dist/*.js` عند وجوده، ثم يرجع إلى مصدر TypeScript.

يجب أن تبقى جميع مسارات الإدخال داخل دليل حزمة Plugin. لا تجعل إدخالات وقت
التشغيل ونظراء JavaScript المبني المستنتَجون مسار مصدر `extensions` أو
`setupEntry` الخارج من الحزمة صالحًا.

<Tip>
  **تبحث عن شرح تفصيلي؟** راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  أو [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة.
</Tip>

## `definePluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/plugin-entry`

لـ Plugins المزوّدين وPlugins الأدوات وPlugins الخطافات وأي شيء **ليس**
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
| `id`           | `string`                                                         | نعم   | -                  |
| `name`         | `string`                                                         | نعم   | -                  |
| `description`  | `string`                                                         | نعم   | -                  |
| `kind`         | `string`                                                         | لا    | -                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا    | مخطط كائن فارغ     |
| `register`     | `(api: OpenClawPluginApi) => void`                               | نعم   | -                  |

- يجب أن يطابق `id` ملف البيان `openclaw.plugin.json` الخاص بك.
- يُستخدم `kind` للفتحات الحصرية: `"memory"` أو `"context-engine"`.
- يمكن أن يكون `configSchema` دالة للتقييم الكسول.
- يحل OpenClaw هذا المخطط ويخزّنه مؤقتًا عند أول وصول، لذلك لا تعمل
  بُناة المخططات المكلفة إلا مرة واحدة.

## `defineChannelPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

يلف `definePluginEntry` بتوصيلات خاصة بالقنوات. يستدعي تلقائيًا
`api.registerChannel({ plugin })`، ويكشف وصلة بيانات وصفية اختيارية لمساعدة CLI
الجذرية، ويقيّد `registerFull` حسب وضع التسجيل.

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
| `id`                  | `string`                                                         | نعم   | -                  |
| `name`                | `string`                                                         | نعم   | -                  |
| `description`         | `string`                                                         | نعم   | -                  |
| `plugin`              | `ChannelPlugin`                                                  | نعم   | -                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا    | مخطط كائن فارغ     |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | لا    | -                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | لا    | -                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | لا    | -                  |

- يتم استدعاء `setRuntime` أثناء التسجيل حتى تتمكن من تخزين مرجع وقت التشغيل
  (عادةً عبر `createPluginRuntimeStore`). يتم تخطيه أثناء التقاط بيانات CLI
  الوصفية.
- يعمل `registerCliMetadata` أثناء `api.registrationMode === "cli-metadata"`،
  و`api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"`.
  استخدمه بصفته المكان القانوني لواصفات CLI المملوكة للقناة حتى تبقى مساعدة الجذر
  غير مُفعِّلة، وتتضمن لقطات الاكتشاف بيانات وصفية ثابتة للأوامر، ويظل تسجيل
  أوامر CLI العادي متوافقًا مع تحميلات Plugin الكاملة.
- تسجيل الاكتشاف غير مُفعِّل، وليس خاليًا من الاستيراد. قد يقيّم OpenClaw
  إدخال Plugin الموثوق ووحدة Plugin القناة لبناء اللقطة، لذلك أبقِ الاستيرادات
  ذات المستوى الأعلى بلا آثار جانبية وضع المقابس والعملاء والعاملين والخدمات
  خلف مسارات `"full"` فقط.
- يعمل `registerFull` فقط عندما يكون `api.registrationMode === "full"`. يتم
  تخطيه أثناء التحميل الخاص بالإعداد فقط.
- مثل `definePluginEntry`، يمكن أن يكون `configSchema` مصنعًا كسولًا، ويخزّن
  OpenClaw المخطط المحلول مؤقتًا عند أول وصول.
- بالنسبة إلى أوامر CLI الجذرية المملوكة لـ Plugin، فضّل
  `api.registerCli(..., { descriptors: [...] })` عندما تريد أن يبقى الأمر محمّلًا
  بكسل دون أن يختفي من شجرة تحليل CLI الجذرية. بالنسبة إلى Plugins القنوات،
  فضّل تسجيل تلك الواصفات من `registerCliMetadata(...)` وأبقِ
  `registerFull(...)` مركّزًا على العمل الخاص بوقت التشغيل فقط.
- إذا كان `registerFull(...)` يسجل أيضًا أساليب Gateway RPC، فأبقِها على بادئة
  خاصة بـ Plugin. تُجبَر دائمًا مساحات أسماء الإدارة الأساسية المحجوزة
  (`config.*`، و`exec.approvals.*`، و`wizard.*`، و`update.*`) إلى
  `operator.admin`.

## `defineSetupPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

للملف الخفيف `setup-entry.ts`. يعيد فقط `{ plugin }` دون توصيلات وقت تشغيل أو
CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

يحمّل OpenClaw هذا بدلًا من الإدخال الكامل عندما تكون القناة معطلة أو غير
مهيأة، أو عندما يكون التحميل المؤجل مفعّلًا. راجع
[الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) لمعرفة متى يهم ذلك.

عمليًا، اقرن `defineSetupPluginEntry(...)` بعائلات مساعدي الإعداد الضيقة:

- `openclaw/plugin-sdk/setup-runtime` لمساعدي الإعداد الآمنين في وقت التشغيل مثل
  محوّلات تصحيح الإعداد الآمنة للاستيراد، ومخرجات ملاحظات البحث،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوضين
- `openclaw/plugin-sdk/channel-setup` لأسطح إعداد التثبيت الاختياري
- `openclaw/plugin-sdk/setup-tools` لمساعدي CLI/الأرشيف/المستندات للإعداد والتثبيت

أبقِ حِزم SDK الثقيلة، وتسجيل CLI، وخدمات وقت التشغيل طويلة العمر في الإدخال
الكامل.

يمكن لقنوات مساحة العمل المضمّنة التي تفصل أسطح الإعداد ووقت التشغيل استخدام
`defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من ذلك. يتيح هذا العقد لإدخال
الإعداد الاحتفاظ بصادرات Plugin/الأسرار الآمنة للإعداد مع الاستمرار في كشف
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

استخدم هذا العقد المضمّن فقط عندما تحتاج تدفقات الإعداد فعلًا إلى مُعيّن وقت
تشغيل خفيف قبل تحميل إدخال القناة الكامل.

## وضع التسجيل

يخبر `api.registrationMode` الـ Plugin بكيفية تحميله:

| الوضع            | متى                              | ما يجب تسجيله                                                                                                           |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `"full"`         | بدء تشغيل Gateway العادي         | كل شيء                                                                                                                   |
| `"discovery"`    | اكتشاف الإمكانات للقراءة فقط     | تسجيل القناة بالإضافة إلى واصفات CLI الثابتة؛ قد يتم تحميل كود الإدخال، لكن تخطَّ المقابس والعاملين والعملاء والخدمات |
| `"setup-only"`   | قناة معطلة/غير مهيأة             | تسجيل القناة فقط                                                                                                         |
| `"setup-runtime"` | تدفق إعداد مع توفر وقت التشغيل  | تسجيل القناة بالإضافة فقط إلى وقت التشغيل الخفيف المطلوب قبل تحميل الإدخال الكامل                                       |
| `"cli-metadata"` | التقاط مساعدة الجذر/بيانات CLI الوصفية | واصفات CLI فقط                                                                                                           |

يتولى `defineChannelPluginEntry` هذا الفصل تلقائيًا. إذا استخدمت
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

يبني وضع الاكتشاف لقطة سجل غير مُفعِّلة. قد يظل يقيّم إدخال Plugin وكائن Plugin
القناة حتى يتمكن OpenClaw من تسجيل إمكانات القناة وواصفات CLI الثابتة. تعامل مع
تقييم الوحدة في الاكتشاف على أنه موثوق لكنه خفيف: لا عملاء شبكة، ولا عمليات
فرعية، ولا مستمعين، ولا اتصالات قاعدة بيانات، ولا عاملين في الخلفية، ولا قراءة
اعتمادات، ولا آثار جانبية أخرى حية لوقت التشغيل في المستوى الأعلى.

تعامل مع `"setup-runtime"` باعتباره النافذة التي يجب أن توجد فيها أسطح بدء
التشغيل الخاصة بالإعداد فقط دون إعادة الدخول إلى وقت تشغيل القناة المضمّنة
الكامل. الخيارات المناسبة هي تسجيل القناة، ومسارات HTTP الآمنة للإعداد، وأساليب
Gateway الآمنة للإعداد، ومساعدو الإعداد المفوضون. ما تزال خدمات الخلفية الثقيلة،
ومسجلو CLI، وتمهيدات SDK الخاصة بالمزوّد/العميل تنتمي إلى `"full"`.

بالنسبة إلى مسجلي CLI تحديدًا:

- استخدم `descriptors` عندما يملك المسجل أمرًا جذريًا واحدًا أو أكثر وتريد أن
  يحمّل OpenClaw وحدة CLI الحقيقية بكسل عند أول استدعاء
- تأكد من أن تلك الواصفات تغطي كل جذر أمر من المستوى الأعلى يكشفه المسجل
- أبقِ أسماء أوامر الواصفات محصورة في الأحرف والأرقام والشرطة والشرطة السفلية،
  وأن تبدأ بحرف أو رقم؛ يرفض OpenClaw أسماء الواصفات خارج هذا الشكل ويزيل
  تسلسلات التحكم الطرفية من الأوصاف قبل عرض المساعدة
- استخدم `commands` وحدها فقط لمسارات التوافق المحمّلة مبكرًا

## أشكال Plugin

يصنّف OpenClaw مكوّنات Plugin المحمّلة حسب سلوك تسجيلها:

| الشكل                 | الوصف                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | نوع قدرة واحد (مثل provider-only)           |
| **hybrid-capability** | أنواع قدرات متعددة (مثل provider + speech) |
| **hook-only**         | خطافات فقط، بلا قدرات                        |
| **non-capability**    | أدوات/أوامر/خدمات لكن بلا قدرات        |

استخدم `openclaw plugins inspect <id>` لمعرفة شكل Plugin.

## ذات صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - واجهة API للتسجيل ومرجع المسارات الفرعية
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) - `api.runtime` و`createPluginRuntimeStore`
- [الإعداد والتهيئة](/ar/plugins/sdk-setup) - البيان، ومدخل الإعداد، والتحميل المؤجل
- [مكوّنات Plugin للقنوات](/ar/plugins/sdk-channel-plugins) - بناء كائن `ChannelPlugin`
- [مكوّنات Plugin للموفرين](/ar/plugins/sdk-provider-plugins) - تسجيل الموفر والخطافات
