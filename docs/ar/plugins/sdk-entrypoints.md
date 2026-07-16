---
read_when:
    - تحتاج إلى توقيع النوع الدقيق لـ defineToolPlugin أو definePluginEntry أو defineChannelPluginEntry
    - تريد فهم وضع التسجيل (الكامل مقابل الإعداد مقابل بيانات CLI الوصفية)
    - أنت تبحث عن خيارات نقطة الدخول
sidebarTitle: Entry Points
summary: مرجع لـ defineToolPlugin وdefinePluginEntry وdefineChannelPluginEntry وdefineSetupPluginEntry
title: نقاط دخول Plugin
x-i18n:
    generated_at: "2026-07-16T14:54:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

يُصدّر كل Plugin كائن إدخال افتراضيًا. توفّر SDK دالة مساعدة لكل
بنية إدخال: `defineToolPlugin`، و`definePluginEntry`،
و`defineChannelPluginEntry`، و`defineSetupPluginEntry`.

<Tip>
  **هل تبحث عن شرح تفصيلي؟** راجع [Plugins الأدوات](/ar/plugins/tool-plugins)،
  أو [Plugins القنوات](/ar/plugins/sdk-channel-plugins)، أو
  [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) للاطلاع على أدلة خطوة بخطوة.
</Tip>

## إدخالات الحزمة

توجّه Plugins المثبّتة حقول `package.json` و`openclaw` إلى إدخالات المصدر
والإدخالات المبنية معًا:

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

- `extensions` و`setupEntry` هما إدخالا المصدر، ويُستخدمان للتطوير في مساحة العمل ونسخ
  مستودعات git.
- يُفضّل استخدام `runtimeExtensions` و`runtimeSetupEntry` للحزم
  المثبّتة، إذ يتيحان لحزم npm تجاوز تصريف TypeScript في وقت التشغيل.
- يجب أن يطابق `runtimeExtensions`، عند وجوده، طول مصفوفة `extensions`
  (تُقرن الإدخالات بحسب مواضعها). يتطلب `runtimeSetupEntry` وجود `setupEntry`.
- إذا صُرّح عن عنصر `runtimeExtensions`/`runtimeSetupEntry` لكنه كان
  مفقودًا، يفشل التثبيت/الاكتشاف بسبب خطأ في التحزيم؛ ولا يعود OpenClaw
  ضمنيًا إلى المصدر. ولا ينطبق الرجوع إلى المصدر (أدناه) إلا في حال عدم
  التصريح عن أي إدخال لوقت التشغيل أصلًا.
- إذا صرّحت حزمة مثبّتة عن إدخال مصدر TypeScript فقط، يبحث OpenClaw
  عن نظير مبني مطابق من `dist/*.js` (أو `.mjs`/`.cjs`) ويستخدمه؛
  وإلا فإنه يعود إلى مصدر TypeScript.
- يجب أن تبقى جميع مسارات الإدخال داخل دليل حزمة Plugin. ولا تجعل إدخالات
  وقت التشغيل ولا نظراء JavaScript المبنيون والمستنتجون مسار مصدر `extensions` أو
  `setupEntry` الخارج من الحزمة صالحًا.

## `defineToolPlugin`

**الاستيراد:** `openclaw/plugin-sdk/tool-plugin`

لـ Plugins التي لا تضيف سوى أدوات الوكيل. يحافظ على صغر حجم المصدر، ويستنتج أنواع
الإعداد ومعاملات الأدوات من مخططات TypeBox، ويغلّف قيم الإرجاع العادية بتنسيق
نتائج أدوات OpenClaw، ويعرض بيانات وصفية ثابتة يكتبها
`openclaw plugins build` في بيان Plugin ‏(`contracts.tools`،
`configSchema`).

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

- `configSchema` اختياري؛ ويؤدي حذفه إلى استخدام مخطط كائن فارغ صارم
  (يظل البيان المُنشأ متضمنًا `configSchema`).
- يعيد `execute` سلسلة عادية أو قيمة قابلة للتسلسل إلى JSON؛ وتغلّفها الدالة المساعدة
  كنتيجة أداة نصية مع تعيين `details` إلى قيمة الإرجاع الأصلية
  (غير المحوّلة إلى سلسلة).
- لنتائج الأدوات المخصّصة، يصدّر `openclaw/plugin-sdk/tool-results`
  كلاً من `textResult` و`jsonResult`.
- أسماء الأدوات ثابتة، لذا يستنتج `openclaw plugins build`
  قيمة `contracts.tools` من الأدوات المعلنة دون تكرار الأسماء يدويًا.
- يظل التحميل في وقت التشغيل صارمًا: لا تزال Plugins المثبّتة بحاجة إلى
  `openclaw.plugin.json` و`package.json` `openclaw.extensions`. ولا ينفّذ OpenClaw
  أبدًا شيفرة Plugin لاستنتاج بيانات البيان المفقودة.

## `definePluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/plugin-entry`

لـ Plugins المزوّدين وPlugins الأدوات المتقدمة وPlugins الخطافات وأي شيء
**ليس** قناة مراسلة.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| الحقل                     | النوع                                                             | مطلوب | القيمة الافتراضية             |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | نعم      | -                   |
| `name`                    | `string`                                                         | نعم      | -                   |
| `description`             | `string`                                                         | نعم      | -                   |
| `kind`                    | `string` (مهمل، راجع أدناه)                                 | لا       | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا       | مخطط كائن فارغ |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | لا       | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | لا       | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | لا       | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | نعم      | -                   |

- يجب أن يطابق `id` بيان `openclaw.plugin.json` الخاص بك.
- تستخدم كتالوجات الجلسات الخارجية
  `openclaw/plugin-sdk/session-catalog` و
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  يمتلك النواة توابع Gateway ‏`sessions.catalog.*`؛ ويعيد المزوّدون إسقاطات المضيف
  والجلسة والنص المنسوخ الموحّد من دون تسجيل استدعاءات RPC.
- `kind` مهمل: أعلن عن خانة حصرية (`"memory"` أو
  `"context-engine"`) في حقل `kind` من بيان `openclaw.plugin.json`
  بدلًا منه. لا يبقى `kind` في إدخال وقت التشغيل إلا بوصفه رجوعًا للتوافق مع
  Plugins الأقدم.
- يمكن أن تكون `configSchema` دالة للتقييم الكسول. يحل OpenClaw المخطط
  ويخزّنه مؤقتًا عند أول وصول، وبذلك لا تعمل منشئات المخطط المكلفة إلا
  مرة واحدة.
- يمكن لواصف `nodeHostCommands` تعريف `isAvailable({ config, env })`.
  يؤدي إرجاع `false` إلى حذف ذلك الأمر وإمكاناته من إعلان Gateway الخاص بـ Node
  عديمة الواجهة. يقيّمه OpenClaw بالاستناد إلى إعداد بدء التشغيل المحلي
  لـ Node؛ ومع ذلك ينبغي لمعالجات الأوامر التحقق من التوفر عند
  استدعائها.

## `defineChannelPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

يغلّف `definePluginEntry` بتوصيلات خاصة بالقناة: إذ يستدعي
`api.registerChannel({ plugin })` تلقائيًا، ويعرض واجهة اختيارية للبيانات الوصفية لـ CLI
الخاصة بمساعدة الجذر، ويقيّد `registerFull` وفق وضع التسجيل.

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

| الحقل                 | النوع                                                             | مطلوب | القيمة الافتراضية             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | نعم      | -                   |
| `name`                | `string`                                                         | نعم      | -                   |
| `description`         | `string`                                                         | نعم      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | نعم      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا       | مخطط كائن فارغ |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | لا       | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | لا       | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | لا       | -                   |

تُشغّل دوال رد النداء وفق وضع التسجيل (الجدول الكامل ضمن
[وضع التسجيل](#registration-mode)):

- تعمل `setRuntime` في كل وضع باستثناء `"cli-metadata"` و
  `"tool-discovery"`. خزّن مرجع وقت التشغيل هنا، عادةً عبر
  `createPluginRuntimeStore`.
- تعمل `registerCliMetadata` مع `"cli-metadata"` و`"discovery"` و
  `"full"`. استخدمها باعتبارها الموضع الأساسي للواصفات التي يملكها CLI الخاص بالقناة
  لكي تظل مساعدة الجذر غير منشّطة، وتتضمن لقطات الاكتشاف البيانات الوصفية الثابتة
  للأوامر، ويظل تسجيل CLI العادي متوافقًا مع عمليات التحميل الكامل
  لـ Plugin.
- لا تعمل `registerFull` إلا مع `"full"` و`"tool-discovery"`. أما مع
  `"tool-discovery"` فتعمل _بدلًا من_ تسجيل القناة: يتجاوز OpenClaw
  `registerChannel`/`setRuntime` بالكامل ولا يستدعي سوى
  `registerFull`، لذا يجب أن يوجد هناك أي تسجيل لمزوّد/أداة تحتاج إليه قناتك
  لاكتشاف الأدوات أو تنفيذها بصورة مستقلة، لا خلف إعداد القناة
  المعتاد.
- تسجيل الاكتشاف غير منشّط، لكنه ليس خاليًا من الاستيراد: قد يقيّم OpenClaw
  إدخال Plugin الموثوق ووحدة Plugin القناة لبناء
  اللقطة. أبقِ الاستيرادات في المستوى الأعلى خالية من الآثار الجانبية، وضع المقابس
  والعملاء والعمّال والخدمات خلف مسارات `"full"` فقط.
- كما هو الحال مع `definePluginEntry`، يمكن أن تكون `configSchema` مصنعًا كسولًا؛ ويخزّن OpenClaw
  المخطط المحلول مؤقتًا عند أول وصول.

تسجيل CLI:

- استخدم `api.registerCli(..., { descriptors: [...] })` لأوامر CLI الجذرية المملوكة لـ Plugin
  التي تريد تحميلها تحميلًا كسولًا من دون أن تختفي من شجرة التحليل الجذرية لـ CLI.
  يجب أن تتطابق أسماء الواصفات مع الحروف والأرقام والواصلة والشرطة
  السفلية، وأن تبدأ بحرف أو رقم؛ يرفض OpenClaw البنى الأخرى
  ويزيل تسلسلات التحكم الطرفية من الأوصاف قبل عرض
  المساعدة. غطِّ كل جذر لأوامر المستوى الأعلى يعرضه المسجِّل.
  يظل `commands` وحده في مسار التوافق الحريص.
- استخدم `api.registerNodeCliFeature(...)` لأوامر ميزات Node المقترنة كي
  تندرج ضمن `openclaw nodes` (بما يعادل
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- لأوامر Plugin المتداخلة الأخرى، أضف `parentPath` وسجّل الأوامر
  على كائن `program` الممرّر إلى المسجِّل؛ يحلّه OpenClaw إلى
  الأمر الأب قبل استدعاء Plugin.
- بالنسبة إلى Plugins القنوات، سجّل واصفات CLI من `registerCliMetadata`
  وأبقِ `registerFull` مركّزًا على عمل وقت التشغيل فقط.
- إذا كانت `registerFull` تسجّل أيضًا توابع RPC لـ Gateway، فأبقِها ضمن بادئة
  خاصة بـ Plugin. تُجبر مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`
  و`exec.approvals.*` و`wizard.*` و`update.*`) دائمًا على
  `operator.admin`.

## `defineSetupPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

للملف الخفيف `setup-entry.ts`. يعيد `{ plugin }` فقط من دون
توصيلات لوقت التشغيل أو CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

يحمّل OpenClaw هذا بدلًا من الإدخال الكامل عندما تكون القناة معطّلة،
أو غير مهيأة، أو عندما يكون التحميل المؤجل مفعّلًا. راجع
[الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) لمعرفة الحالات التي يكون فيها ذلك مهمًا.

اقرن `defineSetupPluginEntry(...)` بعائلات مساعدات الإعداد محدودة النطاق:

| الاستيراد                              | الاستخدام                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | مساعدات إعداد آمنة لوقت التشغيل: `createSetupTranslator`، ومهايئات رقع إعداد آمنة للاستيراد، ومخرجات ملاحظات البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء إعداد مفوّضون |
| `openclaw/plugin-sdk/channel-setup` | واجهات إعداد التثبيت الاختياري                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | مساعدات CLI والأرشيف والوثائق للإعداد/التثبيت                                                                                                                                       |

احتفظ بحِزم SDK الثقيلة وتسجيل CLI وخدمات وقت التشغيل طويلة العمر في
الإدخال الكامل.

يمكن لقنوات مساحة العمل المضمّنة التي تفصل واجهات الإعداد ووقت التشغيل استخدام
`defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من ذلك. فهو يتيح لإدخال الإعداد
الاحتفاظ بصادرات Plugin/الأسرار الآمنة للإعداد، مع الاستمرار في إتاحة أداة ضبط لوقت التشغيل:

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
        /* مسار آمن للإعداد */
      },
    });
  },
});
```

استخدم هذا فقط عندما يحتاج تدفق إعداد فعلًا إلى أداة ضبط خفيفة لوقت التشغيل أو
واجهة Gateway آمنة للإعداد قبل تحميل إدخال القناة الكامل.
يعمل `registerSetupRuntime` فقط لعمليات تحميل `"setup-runtime"`؛ اجعله
مقتصرًا على المسارات أو الأساليب الخاصة بالتهيئة فقط التي يجب أن تتوفر قبل
التفعيل الكامل المؤجل.

## وضع التسجيل

يبيّن `api.registrationMode` للـPlugin كيفية تحميله:

| الوضع               | متى                                               | ما يجب تسجيله                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | بدء تشغيل Gateway العادي                             | كل شيء                                                                                                              |
| `"discovery"`      | اكتشاف الإمكانات للقراءة فقط                     | تسجيل القناة بالإضافة إلى واصفات CLI الثابتة؛ يمكن تحميل رمز الإدخال، لكن تخطَّ المقابس والعاملين والعملاء والخدمات |
| `"tool-discovery"` | تحميل محدود النطاق لسرد أدوات Plugins محددة أو تشغيلها | تسجيل الإمكانات/الأدوات فقط؛ من دون تفعيل القناة                                                                |
| `"setup-only"`     | قناة معطّلة/غير مهيأة                      | تسجيل القناة فقط                                                                                               |
| `"setup-runtime"`  | تدفق إعداد مع توفر وقت التشغيل                  | تسجيل القناة بالإضافة فقط إلى وقت التشغيل الخفيف المطلوب قبل تحميل الإدخال الكامل                               |
| `"cli-metadata"`   | التقاط بيانات تعريف المساعدة الجذرية / CLI                   | واصفات CLI فقط                                                                                                    |

يتولى `defineChannelPluginEntry` هذا الفصل تلقائيًا. إذا استخدمت
`definePluginEntry` مباشرةً لقناة، فتحقق من الوضع بنفسك وتذكّر أن
`"tool-discovery"` يتخطى تسجيل القناة:

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

  if (api.registrationMode === "tool-discovery") {
    // سجّل واجهات الإمكانات فقط (المزوّدين/الأدوات)، من دون قناة.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // تسجيلات ثقيلة خاصة بوقت التشغيل
  api.registerService(/* ... */);
}
```

يمكن للخدمات طويلة العمر إصدار أحداث إبطال صغيرة أو أحداث دورة حياة من خلال
سياق خدمتها:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

يضع OpenClaw هذا ضمن نطاق أسماء `plugin.<plugin-id>.changed`. تتكون أسماء الأحداث من
مقطع واحد بأحرف صغيرة، ويجب أن تكون الحمولات JSON محدودة الحجم، ويجب أن يكون النطاق
`operator.read` أو `operator.write` أو `operator.admin`. لا يتوفر الباعث إلا
طوال عمر الخدمة ويُلغى بعد الإيقاف أو فشل البدء. فضّل
حمولات الإصدار أو الإبطال على السجلات الكاملة، كي يعيد العملاء المصرّح لهم قراءة
الحالة المعيارية عبر أساليب Gateway محدودة النطاق الخاصة بالـPlugin.

ينشئ وضع الاكتشاف لقطة سجل غير مفعّلة. وقد يظل
يقيّم إدخال الـPlugin وكائن Plugin القناة كي يتمكن OpenClaw من
تسجيل إمكانات القناة وواصفات CLI الثابتة. تعامل مع تقييم الوحدة
في وضع الاكتشاف على أنه موثوق لكن خفيف: لا عملاء شبكة،
ولا عمليات فرعية، ولا مستمعين، ولا اتصالات قواعد بيانات، ولا عاملين في الخلفية،
ولا قراءة لبيانات الاعتماد، ولا آثار جانبية حية أخرى لوقت التشغيل في المستوى الأعلى.

تعامل مع `"setup-runtime"` بوصفه النافذة التي يجب أن تتوفر خلالها واجهات بدء التشغيل
الخاصة بالإعداد فقط، من دون إعادة الدخول إلى وقت تشغيل القناة المضمّنة الكامل. ومن الاستخدامات
المناسبة تسجيل القناة ومسارات HTTP الآمنة للإعداد وأساليب Gateway الآمنة للإعداد
ومساعدات الإعداد المفوّضة. أما خدمات الخلفية الثقيلة ومسجّلات CLI وعمليات
تمهيد حِزم SDK للمزوّدين/العملاء، فتظل ضمن `"full"`.

## أشكال Plugins

يصنّف OpenClaw الـPlugins المحمّلة حسب سلوك تسجيلها:

| الشكل                 | الوصف                                        |
| --------------------- | -------------------------------------------------- |
| **إمكانات عادية**  | نوع إمكانات واحد (مثلًا: مزوّد فقط)           |
| **إمكانات هجينة** | أنواع إمكانات متعددة (مثلًا: مزوّد + نطق) |
| **خطافات فقط**         | خطافات فقط، من دون إمكانات                        |
| **بلا إمكانات**    | أدوات/أوامر/خدمات، لكن من دون إمكانات        |

استخدم `openclaw plugins inspect <id>` للاطلاع على شكل Plugin.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - واجهة API للتسجيل ومرجع المسارات الفرعية
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) - `api.runtime` و`createPluginRuntimeStore`
- [الإعداد والتهيئة](/ar/plugins/sdk-setup) - البيان وإدخال الإعداد والتحميل المؤجل
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - إنشاء كائن `ChannelPlugin`
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) - تسجيل المزوّد والخطافات
