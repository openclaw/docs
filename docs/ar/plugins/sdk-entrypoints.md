---
read_when:
    - تحتاج إلى توقيع النوع الدقيق لـ `definePluginEntry` أو `defineChannelPluginEntry`
    - تريد فهم وضع التسجيل (full مقابل setup مقابل بيانات CLI الوصفية)
    - أنت تبحث عن خيارات نقطة الدخول
sidebarTitle: Entry Points
summary: مرجع `definePluginEntry` و`defineChannelPluginEntry` و`defineSetupPluginEntry`
title: نقاط دخول Plugin
x-i18n:
    generated_at: "2026-04-24T07:55:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

يُصدّر كل Plugin كائن إدخال افتراضي. وتوفّر SDK ثلاث مساعدات
لإنشائها.

بالنسبة إلى Plugins المثبّتة، يجب أن يوجّه `package.json` التحميل وقت التشغيل إلى
JavaScript المبنية عند توفرها:

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

تظل `extensions` و`setupEntry` صالحتين كإدخالات مصدر للتطوير ضمن مساحة العمل ونسخ
git المحلية. وتُفضَّل `runtimeExtensions` و`runtimeSetupEntry`
عندما يحمّل OpenClaw حزمة مثبتة، كما تسمح لحزم npm بتجنب
ترجمة TypeScript في وقت التشغيل. وإذا كانت الحزمة المثبّتة تعلن فقط عن إدخال مصدر TypeScript،
فسيستخدم OpenClaw نظير `dist/*.js` المبني المطابق عندما يكون موجودًا،
ثم يعود إلى مصدر TypeScript كرجوع احتياطي.

يجب أن تبقى جميع مسارات الإدخال داخل دليل حزمة Plugin. ولا تجعل
إدخالات وقت التشغيل ونظائر JavaScript المبنية المستنتجة مسار المصدر
الهارب من `extensions` أو `setupEntry` صالحًا.

<Tip>
  **هل تبحث عن شرح تطبيقي؟** راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  أو [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة.
</Tip>

## `definePluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/plugin-entry`

بالنسبة إلى Plugins الموفّرين، وPlugins الأدوات، وPlugins hooks، وأي شيء **ليس**
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

| الحقل         | النوع                                                           | مطلوب | الافتراضي          |
| ------------- | --------------------------------------------------------------- | ------ | ------------------ |
| `id`          | `string`                                                        | نعم    | —                  |
| `name`        | `string`                                                        | نعم    | —                  |
| `description` | `string`                                                        | نعم    | —                  |
| `kind`        | `string`                                                        | لا     | —                  |
| `configSchema`| `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا     | مخطط كائن فارغ     |
| `register`    | `(api: OpenClawPluginApi) => void`                              | نعم    | —                  |

- يجب أن يطابق `id` بيان `openclaw.plugin.json` الخاص بك.
- يُستخدم `kind` للفتحات الحصرية: `"memory"` أو `"context-engine"`.
- يمكن أن يكون `configSchema` دالة من أجل التقييم الكسول.
- يقوم OpenClaw بحل هذا المخطط وحفظه مؤقتًا عند أول وصول، بحيث لا تعمل
  بانيات المخططات المكلفة إلا مرة واحدة.

## `defineChannelPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

يلف `definePluginEntry` بأسلاك خاصة بالقناة. ويستدعي تلقائيًا
`api.registerChannel({ plugin })`، ويكشف سطحًا اختياريًا لبيانات root-help CLI الوصفية، ويقيّد
`registerFull` على وضع التسجيل.

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

| الحقل                | النوع                                                           | مطلوب | الافتراضي          |
| -------------------- | --------------------------------------------------------------- | ------ | ------------------ |
| `id`                 | `string`                                                        | نعم    | —                  |
| `name`               | `string`                                                        | نعم    | —                  |
| `description`        | `string`                                                        | نعم    | —                  |
| `plugin`             | `ChannelPlugin`                                                 | نعم    | —                  |
| `configSchema`       | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا     | مخطط كائن فارغ     |
| `setRuntime`         | `(runtime: PluginRuntime) => void`                              | لا     | —                  |
| `registerCliMetadata`| `(api: OpenClawPluginApi) => void`                              | لا     | —                  |
| `registerFull`       | `(api: OpenClawPluginApi) => void`                              | لا     | —                  |

- يُستدعى `setRuntime` أثناء التسجيل بحيث يمكنك تخزين مرجع وقت التشغيل
  (عادةً عبر `createPluginRuntimeStore`). ويتم تجاوزه أثناء
  التقاط بيانات CLI الوصفية.
- تعمل `registerCliMetadata` أثناء كل من `api.registrationMode === "cli-metadata"`
  و`api.registrationMode === "full"`.
  استخدمها بوصفها المكان المرجعي لوصفات CLI المملوكة للقناة بحيث يبقى root help
  غير مفعِّل مع الحفاظ على توافق تسجيل أوامر CLI العادية
  مع التحميلات الكاملة لـ Plugin.
- تعمل `registerFull` فقط عندما يكون `api.registrationMode === "full"`. ويتم تجاوزها
  أثناء التحميل الخاص بالإعداد فقط.
- وكما في `definePluginEntry`، يمكن أن يكون `configSchema` مصنعًا كسولًا ويقوم OpenClaw
  بحفظ المخطط المحلول مؤقتًا عند أول وصول.
- بالنسبة إلى أوامر CLI الجذرية المملوكة لـ Plugin، فضّل `api.registerCli(..., { descriptors: [...] })`
  عندما تريد أن يبقى الأمر محمّلًا بكسل من دون أن يختفي من
  شجرة تحليل CLI الجذرية. أما بالنسبة إلى Plugins القنوات، ففضّل تسجيل تلك الواصفات
  من `registerCliMetadata(...)` وأبقِ `registerFull(...)` مركّزًا على الأعمال الخاصة بوقت التشغيل فقط.
- إذا كانت `registerFull(...)` تسجل أيضًا طرق Gateway RPC، فأبقِها على
  بادئة خاصة بـ Plugin. إذ تُجبر دائمًا مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`،
  و`exec.approvals.*`، و`wizard.*`، و`update.*`) إلى
  `operator.admin`.

## `defineSetupPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

بالنسبة إلى ملف `setup-entry.ts` الخفيف. ويعيد فقط `{ plugin }` من دون
أسلاك وقت تشغيل أو CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

يحمّل OpenClaw هذا بدلًا من الإدخال الكامل عندما تكون القناة معطّلة،
أو غير مهيأة، أو عندما يكون التحميل المؤجل مفعّلًا. راجع
[الإعداد والضبط](/ar/plugins/sdk-setup#setup-entry) لمعرفة متى يهم ذلك.

عمليًا، اجمع `defineSetupPluginEntry(...)` مع عائلات مساعدات الإعداد
الضيقة:

- `openclaw/plugin-sdk/setup-runtime` من أجل مساعدات الإعداد الآمنة وقت التشغيل مثل
  محوّلات setup patch الآمنة للاستيراد، ومخرجات lookup-note،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، وdelegated setup proxies
- `openclaw/plugin-sdk/channel-setup` من أجل أسطح إعداد التثبيت الاختياري
- `openclaw/plugin-sdk/setup-tools` من أجل مساعدات setup/install الخاصة بـ CLI/archive/docs

أبقِ SDKs الثقيلة، وتسجيل CLI، وخدمات وقت التشغيل طويلة الأمد داخل
الإدخال الكامل.

يمكن للقنوات المجمعة في مساحة العمل التي تفصل بين أسطح الإعداد ووقت التشغيل استخدام
`defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من ذلك. ويتيح هذا العقد لـ
إدخال الإعداد الاحتفاظ بصادرات plugin/secrets الآمنة للإعداد مع الاستمرار في كشف
setter خاص بوقت التشغيل:

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

استخدم هذا العقد المجمّع فقط عندما تحتاج تدفقات الإعداد فعلًا إلى setter خفيف لوقت التشغيل
قبل تحميل الإدخال الكامل للقناة.

## وضع التسجيل

تُعلمك `api.registrationMode` بكيفية تحميل Plugin لديك:

| الوضع             | متى                              | ما الذي يجب تسجيله                                                                     |
| ----------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| `"full"`          | بدء التشغيل العادي لـ gateway    | كل شيء                                                                                |
| `"setup-only"`    | قناة معطلة/غير مهيأة             | تسجيل القناة فقط                                                                      |
| `"setup-runtime"` | تدفق إعداد مع توفر وقت التشغيل   | تسجيل القناة بالإضافة إلى وقت التشغيل الخفيف اللازم فقط قبل تحميل الإدخال الكامل      |
| `"cli-metadata"`  | root help / التقاط بيانات CLI الوصفية | واصفات CLI فقط                                                                    |

يتعامل `defineChannelPluginEntry` مع هذا الفصل تلقائيًا. وإذا استخدمت
`definePluginEntry` مباشرةً لقناة، فتحقق من الوضع بنفسك:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // تسجيلات ثقيلة خاصة بوقت التشغيل فقط
  api.registerService(/* ... */);
}
```

تعامل مع `"setup-runtime"` على أنه النافذة التي يجب أن تكون فيها أسطح بدء التشغيل الخاصة بالإعداد فقط
موجودة من دون إعادة الدخول إلى وقت تشغيل القناة المجمعة الكامل. ومن الأمثلة المناسبة
تسجيل القناة، وHTTP routes الآمنة للإعداد، وطرق gateway الآمنة للإعداد، و
مساعدات الإعداد المفوّضة. أما background services الثقيلة، وCLI registrars،
وتهيئات SDK الخاصة بالموفّر/العميل فلا تزال تنتمي إلى `"full"`.

أما بالنسبة إلى CLI registrars تحديدًا:

- استخدم `descriptors` عندما يمتلك registrar أمرًا جذريًا واحدًا أو أكثر وتريد
  من OpenClaw أن تحمّل وحدة CLI الحقيقية بكسل عند أول استدعاء
- تأكد من أن هذه الواصفات تغطي كل جذر أمر علوي تكشفه
  registrar
- استخدم `commands` وحدها فقط لمسارات التوافق eager

## أشكال Plugins

يصنّف OpenClaw Plugins المحمّلة وفقًا لسلوك تسجيلها:

| الشكل                 | الوصف                                              |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | نوع قدرة واحد (مثل موفّر فقط)                      |
| **hybrid-capability** | أنواع قدرات متعددة (مثل موفّر + كلام)             |
| **hook-only**         | hooks فقط، من دون قدرات                            |
| **non-capability**    | tools/commands/services ولكن من دون قدرات          |

استخدم `openclaw plugins inspect <id>` لمعرفة شكل Plugin.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع API الخاصة بالتسجيل والمسارات الفرعية
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) — `api.runtime` و`createPluginRuntimeStore`
- [الإعداد والضبط](/ar/plugins/sdk-setup) — البيان، وإدخال الإعداد، والتحميل المؤجل
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء كائن `ChannelPlugin`
- [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins) — تسجيل الموفّر وhooks
