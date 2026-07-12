---
read_when:
    - تريد إنشاء Plugin بسيط لـ OpenClaw لا يضيف سوى أدوات للوكيل
    - تريد استخدام defineToolPlugin بدلًا من كتابة البيانات الوصفية لبيان Plugin يدويًا
    - تحتاج إلى إنشاء الهيكل الأولي لـ plugin مخصّص للأدوات فقط، أو توليده، أو التحقق من صلاحيته، أو اختباره، أو نشره
sidebarTitle: Tool Plugins
summary: أنشئ أدوات وكيل بسيطة ومحددة الأنواع باستخدام defineToolPlugin وopenclaw plugins init/build/validate
title: إضافات الأدوات
x-i18n:
    generated_at: "2026-07-12T06:24:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

يبني `defineToolPlugin` مكوّنًا إضافيًا لا يضيف سوى أدوات يمكن للوكيل استدعاؤها: بلا
قناة أو موفّر نماذج أو خطاف أو خدمة أو واجهة إعداد خلفية. وهو يولّد
بيانات البيان الوصفية التي يحتاجها OpenClaw لاكتشاف الأدوات دون تحميل
شفرة وقت تشغيل المكوّن الإضافي.

بالنسبة إلى المكوّنات الإضافية الخاصة بالموفّرين أو القنوات أو الخطافات أو الخدمات أو ذات القدرات المختلطة، ابدأ بدلًا من ذلك بـ
[بناء المكوّنات الإضافية](/ar/plugins/building-plugins) أو [مكوّنات القنوات الإضافية](/ar/plugins/sdk-channel-plugins)،
أو [مكوّنات الموفّرين الإضافية](/ar/plugins/sdk-provider-plugins).

## المتطلبات

- Node 22.19+ أو Node 23.11+ أو Node 24+.
- مخرجات حزمة TypeScript ESM.
- وجود `typebox` في `dependencies` (وليس في `devDependencies` فقط، إذ يستورده
  المكوّن الإضافي المولّد في وقت التشغيل).
- الإصدار `openclaw >=2026.5.17`، وهو أول إصدار يصدّر
  `openclaw/plugin-sdk/tool-plugin`.
- جذر حزمة يوزّع `dist/` و`openclaw.plugin.json` و
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

ينشئ `plugins init` البنية الأولية التالية:

| الملف                  | الغرض                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| `src/index.ts`         | نقطة دخول `defineToolPlugin` تتضمن أداة `echo` واحدة                     |
| `src/index.test.ts`    | اختبار للبيانات الوصفية يتحقق من قائمة الأدوات                           |
| `tsconfig.json`        | مخرجات TypeScript بنمط NodeNext إلى `dist/`                              |
| `vitest.config.ts`     | إعداد Vitest للملفات `src/**/*.test.ts`                                  |
| `package.json`         | البرامج النصية وتبعيات وقت التشغيل و`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | بيانات بيان وصفية مولّدة للأداة الأولية                                  |

يشغّل `npm run plugin:build` الأمر `npm run build` ‏(tsc)، ثم
`openclaw plugins build --entry ./dist/index.js`. ويعيد `npm run plugin:validate`
البناء ثم يشغّل `openclaw plugins validate --entry ./dist/index.js`.
تطبع عملية التحقق الناجحة:

```text
Plugin stock-quotes is valid.
```

خيارات `openclaw plugins init <id>`:

| العلامة              | القيمة الافتراضية        | التأثير                                      |
| -------------------- | ------------------------ | -------------------------------------------- |
| `--directory <path>` | `<id>`                   | دليل المخرجات                                |
| `--name <name>`      | `<id>` بصيغة عنوان       | اسم العرض                                    |
| `--type <type>`      | `tool`                   | نوع البنية الأولية: `tool` أو `provider`     |
| `--force`            | معطّل                    | الكتابة فوق دليل مخرجات موجود                |

## كتابة أداة

تأخذ `defineToolPlugin` هوية المكوّن الإضافي ومخطط إعداد اختياريًا وقائمة
ثابتة من الأدوات. وتُستنتج أنواع المعاملات والإعداد من مخططات
TypeBox.

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

أسماء الأدوات هي واجهة API المستقرة. اختر أسماء فريدة وبأحرف صغيرة
ومحددة بما يكفي لتجنب التعارض مع الأدوات الأساسية أو المكوّنات الإضافية الأخرى.

## الأدوات الاختيارية وأدوات المصنع

عيّن `optional: true` عندما ينبغي للمستخدمين إضافة الأداة صراحةً إلى قائمة السماح قبل
إرسالها إلى نموذج. يكتب `openclaw plugins build` إدخال البيان المطابق
`toolMetadata.<tool>.optional`، بحيث يستطيع OpenClaw معرفة أن
الأداة اختيارية دون تحميل شفرة وقت تشغيل المكوّن الإضافي.

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
إنشائها، سواءً لاستبعادها من تشغيل محدد أو فحص حالة صندوق العزل أو ربط
مساعدات وقت التشغيل. تبقى البيانات الوصفية ثابتة رغم أن الأداة الفعلية تُبنى
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

تظل المصانع تصرّح باسم أداة ثابت مقدمًا. استخدم `definePluginEntry`
مباشرةً عندما يحسب المكوّن الإضافي أسماء الأدوات ديناميكيًا أو يجمع الأدوات
مع الخطافات أو الخدمات أو الموفّرين أو الأوامر.

## القيم المرجعة

تغلّف `defineToolPlugin` القيم المرجعة العادية بتنسيق نتيجة أداة
OpenClaw:

- أرجع سلسلة نصية عندما ينبغي للنموذج رؤية ذلك النص نفسه.
- أرجع قيمة متوافقة مع JSON عندما تريد أن يرى النموذج JSON منسقًا
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
تنفيذ موجود لـ`api.registerTool`.

## الإعداد

`configSchema` اختياري. احذفه وسيطبّق OpenClaw مخطط كائن فارغًا صارمًا؛
ويظل البيان المولّد يتضمن `configSchema`.

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

يقرأ OpenClaw إعداد المكوّن الإضافي من إدخال المكوّن الإضافي في إعداد Gateway. لا
تضمّن الأسرار مباشرةً في المصدر أو أمثلة التوثيق؛ استخدم الإعداد أو متغيرات
البيئة أو SecretRefs وفقًا لنموذج أمان المكوّن الإضافي.

## البيانات الوصفية المولّدة

يجب أن يقرأ OpenClaw بيان المكوّن الإضافي قبل استيراد شفرة وقت تشغيل المكوّن الإضافي.
تكشف `defineToolPlugin` بيانات وصفية ثابتة لهذا الغرض، ويكتبها
`openclaw plugins build` في الحزمة. أعد تشغيل المولّد بعد
تغيير معرّف المكوّن الإضافي أو اسمه أو وصفه أو مخطط إعداده أو تفعيله أو أسماء
أدواته:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

بيان مولّد لمكوّن إضافي ذي أداة واحدة:

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

يمثل `contracts.tools` عقد الاكتشاف المهم: فهو يخبر OpenClaw بأي
مكوّن إضافي يملك كل أداة دون تحميل وقت تشغيل كل مكوّن إضافي مثبّت. وقد
يتسبب البيان القديم في غياب أداة عن الاكتشاف، أو في إسناد خطأ
التسجيل إلى المكوّن الإضافي الخطأ.

## بيانات الحزمة الوصفية

يوائم `openclaw plugins build` أيضًا ملف `package.json` مع نقطة دخول وقت التشغيل
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

وزّع JavaScript المبني (`./dist/index.js`)، لا نقطة دخول مصدر TypeScript.
لا تعمل نقاط دخول المصدر إلا للتطوير المحلي داخل مساحة العمل.

## التحقق في CI

يفشل `plugins build --check` دون إعادة كتابة الملفات عندما تكون البيانات الوصفية
المولّدة قديمة:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

يتحقق `plugins validate` مما يلي:

- وجود `openclaw.plugin.json` واجتيازه لمحمّل البيان المعتاد.
- تصدير نقطة الدخول الحالية للبيانات الوصفية الخاصة بـ`defineToolPlugin`.
- تطابق حقول البيان المولّد مع البيانات الوصفية لنقطة الدخول.
- تطابق `contracts.tools` مع أسماء الأدوات المصرّح بها.
- إشارة `openclaw.extensions` في `package.json` إلى نقطة دخول وقت التشغيل المحددة.

## التثبيت والفحص محليًا

من نسخة مستقلة من OpenClaw أو CLI مثبّت، ثبّت مسار الحزمة:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

لإجراء اختبار دخاني على الحزمة، أنشئ الحزمة أولًا ثم ثبّت ملف tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

بعد التثبيت، أعد تشغيل Gateway أو أعد تحميله واطلب من الوكيل استخدام
الأداة. إذا لم تكن الأداة ظاهرة، فافحص وقت تشغيل المكوّن الإضافي وفهرس
الأدوات الفعلي قبل تغيير الشفرة (راجع [استكشاف الأخطاء وإصلاحها](#troubleshooting)).

## النشر

انشر عبر ClawHub بعد أن تصبح الحزمة جاهزة. يأخذ `clawhub package publish`
مصدرًا: مجلدًا محليًا أو مستودع GitHub ‏(`owner/repo[@ref]`) أو عنوان URL
لملف tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

ثبّت باستخدام محدِّد ClawHub صريح:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

تظل مواصفات حزم npm المجرّدة قابلة للتثبيت من npm أثناء الانتقال عند الإطلاق، لكن
ClawHub هو السطح المفضل لاكتشاف مكوّنات OpenClaw الإضافية وتوزيعها.
راجع [النشر عبر ClawHub](/ar/clawhub/publishing) لمعرفة نطاق المالك
ومراجعة الإصدار.

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

لم يعد البيان يطابق البيانات الوصفية لنقطة الدخول. شغّل:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

أودع تغييرات `openclaw.plugin.json` و`package.json` كليهما.

### `package.json openclaw.extensions must include ./dist/index.js`

تشير بيانات الحزمة الوصفية إلى نقطة دخول وقت تشغيل مختلفة. شغّل
`openclaw plugins build --entry ./dist/index.js` لكي يوائم المولّد
بيانات الحزمة الوصفية مع نقطة الدخول التي تنوي توزيعها.

### `Cannot find package 'typebox'`

يستورد المكوّن الإضافي المبني `typebox` في وقت التشغيل. أبقه في `dependencies`،
ثم أعد التثبيت والبناء والتحقق.

### لا تظهر الأداة بعد التثبيت

تحقق من الآتي بالترتيب:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. يحتوي `openclaw.plugin.json` على `contracts.tools` بأسماء الأدوات المتوقعة.
4. يحتوي `package.json` على `openclaw.extensions: ["./dist/index.js"]`.
5. أُعيد تشغيل Gateway أو أُعيد تحميله بعد تثبيت الـ Plugin.

## انظر أيضًا

- [إنشاء Plugins](/ar/plugins/building-plugins)
- [نقاط دخول الـ Plugin](/ar/plugins/sdk-entrypoints)
- [المسارات الفرعية لحزمة تطوير الـ Plugin](/ar/plugins/sdk-subpaths)
- [بيان الـ Plugin](/ar/plugins/manifest)
- [CLI الخاص بـ Plugins](/ar/cli/plugins)
- [النشر على ClawHub](/ar/clawhub/publishing)
