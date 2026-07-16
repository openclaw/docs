---
read_when:
    - تريد إنشاء Plugin بسيط لـ OpenClaw لا يضيف سوى أدوات للوكيل
    - تريد استخدام defineToolPlugin بدلًا من كتابة بيانات تعريف بيان Plugin يدويًا
    - تحتاج إلى إنشاء هيكل أولي أو توليد أو التحقق من صحة أو اختبار أو نشر Plugin مخصّص للأدوات فقط
sidebarTitle: Tool Plugins
summary: أنشئ أدوات وكيل بسيطة ومحددة الأنواع باستخدام defineToolPlugin وopenclaw plugins init/build/validate
title: Plugins الأدوات
x-i18n:
    generated_at: "2026-07-16T14:57:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` ينشئ plugin لا يضيف سوى أدوات قابلة للاستدعاء من الوكيل: من دون
قناة، أو موفّر نماذج، أو خطاف، أو خدمة، أو واجهة خلفية للإعداد. ويولّد
بيانات manifest الوصفية التي يحتاج إليها OpenClaw لاكتشاف الأدوات من دون تحميل شيفرة
وقت تشغيل plugin.

بالنسبة إلى plugins الخاصة بالموفّرين أو القنوات أو الخطافات أو الخدمات أو ذات الإمكانات المختلطة، ابدأ بدلًا من ذلك بـ
[إنشاء plugins](/ar/plugins/building-plugins)، أو [Plugins القنوات](/ar/plugins/sdk-channel-plugins)،
أو [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins).

## المتطلبات

- Node 22.22.3+، أو Node 24.15+، أو Node 25.9+.
- مخرجات حزمة TypeScript ESM.
- `typebox` في `dependencies` (وليس فقط `devDependencies` - إذ يستورده
  plugin المولّد في وقت التشغيل).
- `openclaw >=2026.5.17`، وهو أول إصدار يصدّر
  `openclaw/plugin-sdk/tool-plugin`.
- جذر حزمة يشحن `dist/`، و`openclaw.plugin.json`، و
  `package.json`.

## البدء السريع

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

ينشئ `plugins init` الهيكل التالي:

| الملف                   | الغرض                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | نقطة دخول `defineToolPlugin` بأداة `echo` واحدة                     |
| `src/index.test.ts`    | اختبار بيانات وصفية يتحقق من قائمة الأدوات                             |
| `tsconfig.json`        | مخرجات TypeScript بنمط NodeNext إلى `dist/`                             |
| `vitest.config.ts`     | إعداد Vitest لـ `src/**/*.test.ts`                              |
| `package.json`         | البرامج النصية، وتبعيات وقت التشغيل، و`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | بيانات manifest الوصفية المولّدة للأداة الأولية                  |

يشغّل `npm run plugin:build` الأمر `npm run build` (tsc) ثم
`openclaw plugins build --entry ./dist/index.js`. ويعيد `npm run plugin:validate`
البناء ويشغّل `openclaw plugins validate --entry ./dist/index.js`.
تطبع عملية التحقق الناجحة:

```text
Plugin stock-quotes صالح.
```

خيارات `openclaw plugins init <id>`:

| العلامة                 | القيمة الافتراضية            | التأثير                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | دليل المخرجات                       |
| `--name <name>`      | `<id>` بحالة أحرف العنوان | اسم العرض                           |
| `--type <type>`      | `tool`             | نوع الهيكل: `tool` أو `provider`    |
| `--force`            | معطّل                | استبدال دليل مخرجات موجود |

## كتابة أداة

تأخذ `defineToolPlugin` هوية plugin، ومخطط إعداد اختياريًا، وقائمة
ثابتة من الأدوات. ويُستدل على أنواع المعاملات والإعداد من
مخططات TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

أسماء الأدوات هي واجهة API المستقرة. اختر أسماء فريدة، وبأحرف صغيرة، و
محددة بما يكفي لتجنّب التعارض مع الأدوات الأساسية أو plugins الأخرى.

## الأدوات الاختيارية وأدوات المصانع

عيّن `optional: true` عندما ينبغي للمستخدمين إضافة الأداة صراحةً إلى قائمة السماح قبل
إرسالها إلى نموذج. تكتب `openclaw plugins build` إدخال manifest المطابق
`toolMetadata.<tool>.optional`، بحيث يستطيع OpenClaw معرفة أن
الأداة اختيارية من دون تحميل شيفرة وقت تشغيل plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

استخدم `factory` عندما تحتاج الأداة إلى سياق أداة وقت التشغيل قبل إمكان
إنشائها - لتعطيلها لتشغيل محدد، أو فحص حالة صندوق العزل، أو ربط
مساعدات وقت التشغيل. تظل البيانات الوصفية ثابتة رغم إنشاء الأداة الفعلية
في وقت التشغيل.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

تظل المصانع تعلن اسم أداة ثابتًا مسبقًا. استخدم `definePluginEntry`
مباشرةً عندما يحسب plugin أسماء الأدوات ديناميكيًا أو يدمج الأدوات
مع الخطافات أو الخدمات أو الموفّرين أو الأوامر.

## قيم الإرجاع

تغلّف `defineToolPlugin` قيم الإرجاع العادية بتنسيق نتيجة أداة OpenClaw:

- أعِد سلسلة نصية عندما ينبغي أن يرى النموذج ذلك النص نفسه تمامًا.
- أعِد قيمة متوافقة مع JSON عندما تريد أن يرى النموذج JSON منسقًا
  وأن يحتفظ OpenClaw بالقيمة الأصلية في `details`.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

استخدم أداة مصنع عندما تحتاج إلى `AgentToolResult` مخصص أو تريد إعادة استخدام
تنفيذ `api.registerTool` موجود.

## الإعداد

`configSchema` اختياري. إذا حذفته، يطبّق OpenClaw مخطط كائن فارغًا صارمًا؛
ويظل manifest المولّد يتضمن `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

عند وجود `configSchema`، يُحدَّد نوع وسيطة `execute` الثانية منه:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

يقرأ OpenClaw إعداد plugin من إدخال plugin في إعداد Gateway. لا
تضمّن الأسرار مباشرةً في المصدر أو أمثلة التوثيق؛ استخدم الإعداد، أو متغيرات
البيئة، أو SecretRefs وفقًا لنموذج أمان plugin.

## البيانات الوصفية المولّدة

يجب أن يقرأ OpenClaw manifest الخاص بـ plugin قبل استيراد شيفرة وقت تشغيل plugin.
تكشف `defineToolPlugin` بيانات وصفية ثابتة لهذا الغرض، و
تكتبها `openclaw plugins build` في الحزمة. أعد تشغيل المولّد بعد
تغيير معرّف plugin أو اسمه أو وصفه أو مخطط إعداده أو تفعيله أو أسماء
الأدوات:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

manifest مولّد لـ plugin ذي أداة واحدة:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

يمثّل `contracts.tools` عقد الاكتشاف المهم: فهو يخبر OpenClaw بأي
plugin يملك كل أداة من دون تحميل وقت تشغيل كل plugin مثبّت. يعني
manifest القديم أن أداة قد تختفي من الاكتشاف، أو أن خطأ تسجيل
يُنسب إلى plugin غير الصحيح.

## بيانات الحزمة الوصفية

تحاذي `openclaw plugins build` أيضًا `package.json` مع نقطة دخول وقت التشغيل
المحددة:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

اشحن JavaScript المبني (`./dist/index.js`)، لا نقطة دخول مصدر TypeScript.
لا تعمل نقاط دخول المصدر إلا للتطوير المحلي داخل مساحة العمل.

## التحقق في CI

يفشل `plugins build --check` من دون إعادة كتابة الملفات عندما تكون البيانات الوصفية المولّدة
قديمة:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

يتحقق `plugins validate` مما يلي:

- وجود `openclaw.plugin.json` واجتيازه محمّل manifest المعتاد.
- تصدير نقطة الدخول الحالية بيانات `defineToolPlugin` الوصفية.
- تطابق حقول manifest المولّد مع بيانات نقطة الدخول الوصفية.
- تطابق `contracts.tools` مع أسماء الأدوات المعلنة.
- توجيه `package.json` للعنصر `openclaw.extensions` إلى نقطة دخول وقت التشغيل المحددة.

## التثبيت والفحص محليًا

من نسخة OpenClaw منفصلة أو CLI مثبّت، ثبّت مسار الحزمة:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

لاختبار دخان لحزمة، أنشئ الحزمة أولًا ثم ثبّت ملف tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

بعد التثبيت، أعد تشغيل Gateway أو أعد تحميله واطلب من الوكيل استخدام
الأداة. إذا لم تكن الأداة ظاهرة، فافحص وقت تشغيل plugin وكتالوج
الأدوات الفعّال قبل تغيير الشيفرة (راجع [استكشاف الأخطاء وإصلاحها](#troubleshooting)).

## النشر

انشر عبر ClawHub بمجرد أن تصبح الحزمة جاهزة. تأخذ `clawhub package publish`
مصدرًا: مجلدًا محليًا، أو مستودع GitHub (`owner/repo[@ref]`)، أو
عنوان URL لملف tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

ثبّت باستخدام محدِّد ClawHub صريح:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

تظل مواصفات حزم npm المجردة تُثبّت من npm أثناء الانتقال عند الإطلاق، لكن
ClawHub هو سطح الاكتشاف والتوزيع المفضّل لـ plugins الخاصة بـ OpenClaw.
راجع [النشر على ClawHub](/ar/clawhub/publishing) لمعرفة نطاق المالك و
مراجعة الإصدار.

## استكشاف الأخطاء وإصلاحها

### `plugin entry not found: ./dist/index.js`

ملف نقطة الدخول المحدد غير موجود. شغّل `npm run build`، ثم أعد تشغيل
`openclaw plugins build --entry ./dist/index.js` أو
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

لم تصدّر نقطة الدخول قيمة أنشأتها `defineToolPlugin`. تأكد من أن
التصدير الافتراضي للوحدة هو نتيجة `defineToolPlugin(...)`، أو مرّر
نقطة الدخول الصحيحة باستخدام `--entry`.

### `openclaw.plugin.json generated metadata is stale`

لم يعد manifest يطابق بيانات نقطة الدخول الوصفية. شغّل:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

ثبّت تغييرات كل من `openclaw.plugin.json` و`package.json` في commit.

### `package.json openclaw.extensions must include ./dist/index.js`

تشير بيانات الحزمة الوصفية إلى نقطة دخول وقت تشغيل مختلفة. شغّل
`openclaw plugins build --entry ./dist/index.js` كي يحاذي المولّد
بيانات الحزمة الوصفية مع نقطة الدخول التي تنوي شحنها.

### `Cannot find package 'typebox'`

يستورد plugin المبني `typebox` في وقت التشغيل. أبقه في `dependencies`،
ثم أعد التثبيت والبناء والتحقق.

### لا تظهر الأداة بعد التثبيت

تحقق مما يلي بالترتيب:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` يحتوي على `contracts.tools` بأسماء الأدوات المتوقعة.
4. `package.json` يحتوي على `openclaw.extensions: ["./dist/index.js"]`.
5. أُعيد تشغيل Gateway أو تحميله بعد تثبيت Plugin.

## انظر أيضًا

- [إنشاء Plugins](/ar/plugins/building-plugins)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths)
- [بيان Plugin](/ar/plugins/manifest)
- [CLI لـ Plugins](/ar/cli/plugins)
- [النشر على ClawHub](/ar/clawhub/publishing)
