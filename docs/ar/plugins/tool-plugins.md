---
read_when:
    - تريد إنشاء Plugin بسيط لـ OpenClaw يضيف أدوات الوكيل فقط
    - تريد استخدام defineToolPlugin بدلًا من كتابة بيانات التعريف الوصفية لبيان Plugin يدويًا
    - تحتاج إلى إنشاء هيكل أو توليد أو التحقق من الصحة أو اختبار أو نشر Plugin مخصص للأدوات فقط
sidebarTitle: Tool Plugins
summary: أنشئ أدوات وكيل بسيطة محددة الأنواع باستخدام defineToolPlugin و openclaw plugins init/build/validate
title: إضافات الأدوات
x-i18n:
    generated_at: "2026-06-27T18:21:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

تضيف Plugins الأدوات أدوات قابلة للاستدعاء من الوكيل إلى OpenClaw دون إضافة قناة أو موفّر نماذج أو خطاف أو خدمة أو خلفية إعداد. استخدم `defineToolPlugin` عندما يملك Plugin قائمة ثابتة من الأدوات وتريد أن ينشئ OpenClaw بيانات التعريف الخاصة بالبيان التي تجعل تلك الأدوات قابلة للاكتشاف دون تحميل كود وقت التشغيل.

التدفق الموصى به هو:

1. أنشئ هيكل حزمة باستخدام `openclaw plugins init`.
2. اكتب الأدوات باستخدام `defineToolPlugin`.
3. ابنِ JavaScript.
4. أنشئ بيانات تعريف `openclaw.plugin.json` و`package.json` باستخدام
   `openclaw plugins build`.
5. تحقّق من بيانات التعريف المُنشأة قبل النشر أو التثبيت.

بالنسبة إلى Plugins موفّري النماذج أو القنوات أو الخطافات أو الخدمات أو Plugins ذات القدرات المختلطة، ابدأ بدلًا من ذلك بـ
[بناء Plugins](/ar/plugins/building-plugins) أو [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
أو [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins).

## المتطلبات

- Node >= 22.
- إخراج حزمة TypeScript ESM.
- `typebox` لمخططات الإعدادات ومعاملات الأدوات.
- `openclaw >=2026.5.17`، أول إصدار من OpenClaw يصدّر
  `openclaw/plugin-sdk/tool-plugin`.
- جذر حزمة يمكنه شحن `dist/` و`openclaw.plugin.json` و
  `package.json`.

يستورد Plugin المُنشأ `typebox` في وقت التشغيل، لذا أبقِ `typebox` ضمن
`dependencies`، وليس فقط ضمن `devDependencies`.

## البدء السريع

أنشئ حزمة Plugin جديدة:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

ينشئ الهيكل:

- `src/index.ts`: نقطة دخول `defineToolPlugin` تتضمن أداة `echo`.
- `src/index.test.ts`: اختبارًا صغيرًا لبيانات التعريف.
- `tsconfig.json`: إخراج TypeScript بنمط NodeNext إلى `dist/`.
- `package.json`: السكربتات وتبعيات وقت التشغيل و
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: بيانات تعريف البيان المُنشأة للأداة الأولية.

مخرجات التحقق المتوقعة:

```text
Plugin stock-quotes is valid.
```

## كتابة أداة

يأخذ `defineToolPlugin` هوية Plugin ومخطط إعدادات اختياريًا وقائمة ثابتة من الأدوات. تُستنتج أنواع المعاملات والإعدادات من مخططات TypeBox.

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

أسماء الأدوات هي واجهة API المستقرة. اختر أسماء فريدة وبأحرف صغيرة ومحددة بما يكفي لتجنب التعارض مع أدوات النواة أو Plugins أخرى.

## الأدوات الاختيارية وأدوات المصنع

عيّن `optional: true` عندما ينبغي للمستخدمين السماح بالأداة صراحةً قبل إرسالها إلى نموذج:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

يكتب `openclaw plugins build` إدخال البيان المطابق `toolMetadata.<tool>.optional`، بحيث يستطيع OpenClaw اكتشاف الأداة دون تحميل كود وقت تشغيل Plugin.

استخدم `factory` عندما تحتاج الأداة إلى سياق أداة وقت التشغيل قبل إنشائها. يُبقي المصنع بيانات التعريف ثابتة مع السماح للأداة بالانسحاب لتشغيل محدد، أو فحص حالة صندوق العزل، أو ربط مساعدي وقت التشغيل.

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

تظل المصانع مخصصة لأسماء أدوات ثابتة. استخدم `definePluginEntry` مباشرةً عندما يحسب Plugin أسماء الأدوات ديناميكيًا أو يدمج الأدوات مع الخطافات أو الخدمات أو الموفّرين أو الأوامر أو أسطح وقت تشغيل أخرى.

## قيم الإرجاع

يلف `defineToolPlugin` قيم الإرجاع العادية ضمن تنسيق نتيجة الأداة في OpenClaw:

- أرجع سلسلة نصية عندما يجب أن يرى النموذج ذلك النص بالضبط.
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

استخدم أداة مصنع عندما تحتاج إلى إرجاع `AgentToolResult` مخصص أو إعادة استخدام تنفيذ `api.registerTool` موجود. استخدم `definePluginEntry` بدلًا من `defineToolPlugin` عندما تحتاج إلى أدوات ديناميكية بالكامل أو قدرات Plugin مختلطة.

## الإعدادات

`configSchema` اختياري. إذا حذفته، يستخدم OpenClaw مخطط كائن فارغًا صارمًا ويظل البيان المُنشأ يتضمن `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

عندما تُضمّن `configSchema`، يُكتب نوع وسيط `execute` الثاني من المخطط:

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

يقرأ OpenClaw إعدادات Plugin من إدخال Plugin في إعدادات Gateway. لا تضع الأسرار مباشرةً في المصدر أو في أمثلة الوثائق. استخدم الإعدادات أو متغيرات البيئة أو SecretRefs وفقًا لنموذج أمان Plugin.

## بيانات التعريف المُنشأة

يكتشف OpenClaw Plugins المثبتة من بيانات تعريف باردة. يجب أن يكون قادرًا على قراءة بيان Plugin قبل استيراد كود وقت تشغيل Plugin. لذلك يكشف `defineToolPlugin` بيانات تعريف ثابتة، ويكتب `openclaw plugins build` تلك البيانات في الحزمة.

شغّل المُنشئ بعد تغيير معرّف Plugin أو اسمه أو وصفه أو مخطط إعداداته أو التنشيط أو أسماء الأدوات:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

بالنسبة إلى Plugin بأداة واحدة، يبدو البيان المُنشأ هكذا:

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

`contracts.tools` هو عقد الاكتشاف المهم. يخبر OpenClaw أي Plugin يملك كل أداة دون تحميل وقت تشغيل كل Plugin مثبت. إذا كان البيان قديمًا، فقد تكون الأداة مفقودة من الاكتشاف أو قد يُلام Plugin الخطأ على خطأ تسجيل.

## بيانات تعريف الحزمة

بالنسبة إلى تدفق Plugin الأدوات البسيط، يضبط `openclaw plugins build`
`package.json` ليتوافق مع نقطة دخول وقت التشغيل المفردة المحددة:

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

استخدم JavaScript مبنيًا مثل `./dist/index.js` للحزم المثبتة. نقاط دخول المصدر مفيدة في تطوير مساحة العمل، لكن الحزم المنشورة يجب ألا تعتمد على تحميل وقت تشغيل TypeScript.

## التحقق في CI

استخدم `plugins build --check` لإفشال CI عندما تكون بيانات التعريف المُنشأة قديمة دون إعادة كتابة الملفات:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

يتحقق `plugins validate` مما يلي:

- وجود `openclaw.plugin.json` واجتيازه محمّل البيان العادي.
- تصدير نقطة الدخول الحالية بيانات تعريف `defineToolPlugin`.
- تطابق حقول البيان المُنشأ مع بيانات تعريف نقطة الدخول.
- تطابق `contracts.tools` مع أسماء الأدوات المعلنة.
- توجيه `package.json` لـ `openclaw.extensions` إلى نقطة دخول وقت التشغيل المحددة.

## التثبيت والفحص محليًا

من نسخة OpenClaw منفصلة أو CLI مثبتة، ثبّت مسار الحزمة:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

لاختبار سريع لحزمة، أنشئ الحزمة أولًا وثبّت ملف tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

بعد التثبيت، ابدأ Gateway أو أعد تشغيله واطلب من الوكيل استخدام الأداة. إذا كنت تصحح ظهور الأدوات، افحص وقت تشغيل Plugin وفهرس الأدوات الفعّال قبل تغيير الكود.

## النشر

انشر عبر ClawHub عندما تصبح الحزمة جاهزة:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

ثبّت باستخدام محدد ClawHub صريح:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

تظل مواصفات حزم npm المجردة مدعومة أثناء انتقال الإطلاق، لكن ClawHub هو سطح الاكتشاف والتوزيع المفضّل لـ Plugins الخاصة بـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

### `plugin entry not found: ./dist/index.js`

ملف نقطة الدخول المحدد غير موجود. شغّل `npm run build`، ثم أعد تشغيل
`openclaw plugins build --entry ./dist/index.js` أو
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

لم تصدّر نقطة الدخول قيمة أُنشئت بواسطة `defineToolPlugin`. تحقق من أن التصدير الافتراضي للوحدة هو نتيجة `defineToolPlugin(...)`، أو مرّر نقطة الدخول الصحيحة باستخدام `--entry`.

### `openclaw.plugin.json generated metadata is stale`

لم يعد البيان يطابق بيانات تعريف نقطة الدخول. شغّل:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

ثبّت تغييرات كل من `openclaw.plugin.json` و`package.json` في Git.

### `package.json openclaw.extensions must include ./dist/index.js`

تشير بيانات تعريف الحزمة إلى نقطة دخول وقت تشغيل مختلفة. شغّل
`openclaw plugins build --entry ./dist/index.js` لكي يضبط المُنشئ بيانات تعريف الحزمة لتتوافق مع نقطة الدخول التي تنوي شحنها.

### `Cannot find package 'typebox'`

يستورد Plugin المبني `typebox` في وقت التشغيل. أبقِ `typebox` ضمن
`dependencies`، وأعد تثبيت تبعيات الحزمة، وأعد البناء، ثم أعد تشغيل التحقق.

### لا تظهر الأداة بعد التثبيت

تحقق مما يلي بالترتيب:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. يحتوي `openclaw.plugin.json` على `contracts.tools` مع أسماء الأدوات المتوقعة.
4. يحتوي `package.json` على `openclaw.extensions: ["./dist/index.js"]`.
5. أُعيد تشغيل Gateway أو إعادة تحميله بعد تثبيت Plugin.

## انظر أيضًا

- [بناء Plugins](/ar/plugins/building-plugins)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths)
- [بيان Plugin](/ar/plugins/manifest)
- [CLI الخاص بـ Plugins](/ar/cli/plugins)
- [النشر عبر ClawHub](/ar/clawhub/publishing)
