---
read_when:
    - تحتاج إلى فحص مخرجات النموذج الخام بحثًا عن تسرّب الاستدلال.
    - تريد تشغيل Gateway في وضع المراقبة أثناء التكرار
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات التصحيح: وضع المراقبة، وتدفقات النموذج الخام، وتتبع تسرّب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-05-10T19:43:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

مساعدات لتصحيح أخطاء خرج البث، خصوصًا عندما يمزج مزوّد الاستدلال داخل النص العادي.

## تجاوزات تصحيح أخطاء وقت التشغيل

استخدم `/debug` في الدردشة لضبط تجاوزات إعدادات **وقت التشغيل فقط** (في الذاكرة، وليس على القرص).
يكون `/debug` معطّلًا افتراضيًا؛ فعّله باستخدام `commands.debug: true`.
هذا مفيد عندما تحتاج إلى تبديل إعدادات غير شائعة دون تعديل `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يمسح `/debug reset` كل التجاوزات ويعود إلى الإعدادات الموجودة على القرص.

## خرج تتبّع الجلسة

استخدم `/trace` عندما تريد رؤية أسطر التتبّع/تصحيح الأخطاء المملوكة من Plugin في جلسة واحدة
دون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات Plugin مثل ملخصات تصحيح أخطاء Active Memory.
واصل استخدام `/verbose` لخرج الحالة/الأدوات التفصيلي العادي، وواصل استخدام
`/debug` لتجاوزات إعدادات وقت التشغيل فقط.

## تتبّع دورة حياة Plugin

استخدم `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` عندما تبدو أوامر دورة حياة Plugin بطيئة
وتحتاج إلى تفصيل مراحل مدمج لبيانات Plugin الوصفية، والاكتشاف، والسجل،
ومرآة وقت التشغيل، وتعديل الإعدادات، وأعمال التحديث. التتبّع اختياري ويكتب
إلى stderr، لذلك يبقى خرج أوامر JSON قابلًا للتحليل.

مثال:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

مثال على الخرج:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

استخدم هذا للتحقيق في دورة حياة Plugin قبل اللجوء إلى محلّل أداء CPU.
إذا كان الأمر يعمل من نسخة مصدر، ففضّل قياس وقت التشغيل المبني
باستخدام `node dist/entry.js ...` بعد `pnpm build`؛ كما أن `pnpm openclaw ...`
يقيس أيضًا كلفة مشغّل المصدر.

## بدء CLI وتحليل أداء الأوامر

استخدم معيار قياس بدء التشغيل المضمّن عندما يبدو أمر ما بطيئًا:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

لتحليل أداء لمرة واحدة عبر مشغّل المصدر العادي، اضبط
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

يضيف مشغّل المصدر أعلام ملف أداء CPU الخاصة بـ Node ويكتب ملف `.cpuprofile` للأمر.
استخدم هذا قبل إضافة أدوات قياس مؤقتة إلى كود الأوامر.

لحالات توقف بدء التشغيل التي تبدو مثل عمل متزامن على نظام الملفات أو محمّل الوحدات،
أضف علم تتبّع I/O المتزامن في Node عبر مشغّل المصدر:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

يترك `pnpm gateway:watch` هذا العلم معطّلًا افتراضيًا لعملية Gateway الفرعية المراقبة.
اضبط `OPENCLAW_TRACE_SYNC_IO=1` عندما تريد صراحةً خرج تتبّع I/O المتزامن في Node
ضمن وضع المراقبة.

## وضع مراقبة Gateway

للتكرار السريع، شغّل Gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

افتراضيًا، يبدأ هذا جلسة tmux باسم
`openclaw-gateway-watch-main` أو يعيد تشغيلها (أو متغيرًا خاصًا بالملف/المنفذ مثل
`openclaw-gateway-watch-dev-19001`) ويلتحق تلقائيًا من الطرفيات التفاعلية.
تبقى الأصداف غير التفاعلية، وCI، واستدعاءات تنفيذ الوكيل منفصلة وتطبع
تعليمات الالتحاق بدلًا من ذلك. التحق يدويًا عند الحاجة:

```bash
tmux attach -t openclaw-gateway-watch-main
```

يشغّل جزء tmux المراقب الخام:

```bash
node scripts/watch-node.mjs gateway --force
```

استخدم وضع المقدمة عندما لا تريد tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

عطّل الالتحاق التلقائي مع إبقاء إدارة tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

حلّل وقت CPU الخاص بـ Gateway المراقبة عند تصحيح نقاط الاختناق في بدء التشغيل/وقت التشغيل:

```bash
pnpm gateway:watch --benchmark
```

يستهلك غلاف المراقبة `--benchmark` قبل استدعاء Gateway ويكتب
ملف V8 `.cpuprofile` واحدًا لكل خروج لعملية Gateway فرعية تحت
`.artifacts/gateway-watch-profiles/`. أوقف Gateway المراقبة أو أعد تشغيلها
لتفريغ الملف الحالي، ثم افتحه باستخدام Chrome DevTools أو Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

استخدم `--benchmark-dir <path>` عندما تريد الملفات في مكان آخر.
استخدم `--benchmark-no-force` عندما تريد من العملية الفرعية المقاسة تخطي
تنظيف المنفذ الافتراضي `--force` والفشل بسرعة إذا كان منفذ Gateway مستخدمًا بالفعل.
يكتم وضع القياس افتراضيًا رسائل تتبّع I/O المتزامن المزعجة. اضبط
`OPENCLAW_TRACE_SYNC_IO=1` مع `--benchmark` عندما تريد صراحةً كلًا من ملفات
أداء CPU وتتبع مكدس I/O المتزامن في Node. في وضع القياس، تُكتب كتل التتبّع هذه
إلى `gateway-watch-output.log` تحت دليل القياس وتُرشّح من جزء الطرفية؛ وتبقى
سجلات Gateway العادية مرئية.

ينقل غلاف tmux محددات وقت التشغيل الشائعة غير السرية مثل
`OPENCLAW_PROFILE`، و`OPENCLAW_CONFIG_PATH`، و`OPENCLAW_STATE_DIR`،
و`OPENCLAW_GATEWAY_PORT`، و`OPENCLAW_SKIP_CHANNELS` إلى الجزء. ضع
اعتمادات المزوّد في ملفك/إعداداتك العادية، أو استخدم وضع المقدمة الخام
للأسرار المؤقتة لمرة واحدة.
إذا خرجت Gateway المراقبة أثناء بدء التشغيل، يشغّل المراقب
`openclaw doctor --fix --non-interactive` مرة واحدة ويعيد تشغيل عملية Gateway الفرعية.
استخدم `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` عندما تريد فشل بدء التشغيل الأصلي
دون تمريرة الإصلاح الخاصة بالتطوير.
يضبط جزء tmux المُدار أيضًا سجلات Gateway الملوّنة افتراضيًا لتحسين قابلية القراءة؛
اضبط `FORCE_COLOR=0` عند بدء `pnpm gateway:watch` لتعطيل خرج ANSI.

يعيد المراقب التشغيل عند تغيير ملفات ذات صلة بالبناء تحت `src/`، وملفات مصدر الإضافات،
وبيانات `package.json` و`openclaw.plugin.json` الوصفية للإضافات، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تغييرات بيانات الإضافات الوصفية تعيد تشغيل
Gateway دون فرض إعادة بناء `tsdown`؛ أما تغييرات المصدر والإعدادات فما زالت
تعيد بناء `dist` أولًا.

أضف أي أعلام CLI خاصة بـ Gateway بعد `gateway:watch` وسيتم تمريرها عند
كل إعادة تشغيل. إعادة تشغيل أمر المراقبة نفسه تعيد توليد جزء tmux المسمّى، وما زال
المراقب الخام يحتفظ بقفل المراقب الواحد بحيث تُستبدل عمليات المراقبة الأصلية المكررة
بدلًا من تراكمها.

## ملف التطوير + Gateway التطوير (`--dev`)

استخدم ملف التطوير لعزل الحالة وتشغيل إعداد آمن قابل للتخلص منه لأغراض
تصحيح الأخطاء. توجد علامتا `--dev` **اثنتان**:

- **`--dev` العامة (الملف):** تعزل الحالة تحت `~/.openclaw-dev` وتضبط
  منفذ Gateway افتراضيًا إلى `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`: تخبر Gateway بإنشاء إعداد افتراضي + مساحة عمل تلقائيًا** عند غيابهما (وتخطي BOOTSTRAP.md).

التدفق الموصى به (ملف التطوير + تمهيد التطوير):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

إذا لم يكن لديك تثبيت عام بعد، فشغّل CLI عبر `pnpm openclaw ...`.

ما يفعله هذا:

1. **عزل الملف** (`--dev` العامة)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (يتغير المتصفح/اللوحة وفقًا لذلك)

2. **تمهيد التطوير** (`gateway --dev`)
   - يكتب إعدادًا أدنى إذا كان مفقودًا (`gateway.mode=local`، ربط loopback).
   - يضبط `agent.workspace` إلى مساحة عمل التطوير.
   - يضبط `agent.skipBootstrap=true` (لا يوجد BOOTSTRAP.md).
   - يزرع ملفات مساحة العمل إذا كانت مفقودة:
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - الهوية الافتراضية: **C3-PO** (روبوت بروتوكول).
   - يتخطى مزوّدي القنوات في وضع التطوير (`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة الضبط (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` هو علم ملف **عام** وتلتهمه بعض المشغّلات. إذا احتجت إلى كتابته صراحةً، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

يمسح `--reset` الإعدادات، والاعتمادات، والجلسات، ومساحة عمل التطوير (باستخدام
`trash`، وليس `rm`)، ثم يعيد إنشاء إعداد التطوير الافتراضي.

<Tip>
إذا كانت Gateway غير التطوير تعمل بالفعل (launchd أو systemd)، فأوقفها أولًا:

```bash
openclaw gateway stop
```

</Tip>

## تسجيل البث الخام (OpenClaw)

يمكن لـ OpenClaw تسجيل **بث المساعد الخام** قبل أي ترشيح/تنسيق.
هذه أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل كتغييرات نصية عادية
(أو ككتل تفكير منفصلة).

فعّله عبر CLI:

```bash
pnpm gateway:watch --raw-stream
```

تجاوز اختياري للمسار:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

متغيرات البيئة المكافئة:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

الملف الافتراضي:

`~/.openclaw/logs/raw-stream.jsonl`

## تسجيل الأجزاء الخام (pi-mono)

لالتقاط **أجزاء OpenAI-compat الخام** قبل تحليلها إلى كتل،
يوفر pi-mono مسجّلًا منفصلًا:

```bash
PI_RAW_STREAM=1
```

مسار اختياري:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

الملف الافتراضي:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> ملاحظة: لا يصدر هذا إلا من العمليات التي تستخدم مزوّد pi-mono
> `openai-completions`.

## ملاحظات السلامة

- يمكن أن تتضمن سجلات البث الخام المطالبات الكاملة، وخرج الأدوات، وبيانات المستخدم.
- أبقِ السجلات محلية واحذفها بعد تصحيح الأخطاء.
- إذا شاركت السجلات، فاحذف الأسرار ومعلومات التعريف الشخصية أولًا.

## تصحيح الأخطاء في VSCode

خرائط المصدر مطلوبة لتمكين تصحيح الأخطاء في بيئات IDE المبنية على VSCode لأن كثيرًا من الملفات المولّدة ينتهي بها الأمر بأسماء مجزأة كجزء من عملية البناء. تستهدف إعدادات `launch.json` المضمّنة خدمة Gateway، لكن يمكن تكييفها بسرعة لأغراض أخرى:

1. **إعادة بناء Gateway وتصحيحها** - يصحح خدمة Gateway بعد إنشاء بناء جديد
2. **تصحيح Gateway** - يصحح خدمة Gateway من بناء موجود مسبقًا

### الإعداد

إعداد **إعادة بناء Gateway وتصحيحها** الافتراضي مكتمل، وسيحذف مجلد `/dist` تلقائيًا ويعيد بناء المشروع مع تفعيل تصحيح الأخطاء:

1. افتح لوحة **التشغيل وتصحيح الأخطاء** من شريط النشاط أو اضغط `Ctrl`+`Shift`+`D`
2. في IDE، تأكد من تحديد **إعادة بناء Gateway وتصحيحها** في قائمة الإعدادات المنسدلة ثم اضغط زر **بدء تصحيح الأخطاء**

بدلًا من ذلك - إذا كنت تفضل إدارة عمليتي البناء وتصحيح الأخطاء يدويًا:

1. افتح طرفية وفعّل خرائط المصدر:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. في الطرفية نفسها، أعد بناء المشروع: `pnpm clean:dist && pnpm build`
3. في IDE، حدد خيار **تصحيح Gateway** من قائمة إعدادات **التشغيل وتصحيح الأخطاء** المنسدلة ثم اضغط زر **بدء تصحيح الأخطاء**

يمكنك الآن تعيين نقاط توقف في ملفات مصدر TypeScript الخاصة بك (دليل `src/`) وسيقوم المصحح بربط نقاط التوقف بشكل صحيح مع JavaScript المجمّع عبر خرائط المصدر. ستتمكن من فحص المتغيرات، والتنقل خطوة بخطوة عبر الكود، وفحص مكدسات الاستدعاء كما هو متوقع.

### ملاحظات

- عند استخدام خيار **"إعادة بناء Gateway وتصحيحها"** - في كل مرة يُشغَّل فيها المصحح سيحذف مجلد `/dist` بالكامل ويشغّل `pnpm build` كاملًا مع تفعيل خرائط المصدر قبل بدء Gateway
- عند استخدام خيار **"تصحيح Gateway"** - يمكن بدء جلسات التصحيح وإيقافها في أي وقت دون التأثير على مجلد `/dist`، لكن يجب استخدام عملية طرفية منفصلة لكل من تفعيل التصحيح وإدارة دورة البناء
- عدّل إعدادات `launch.json` لـ `args` لتصحيح أقسام أخرى من المشروع
- إذا احتجت إلى استخدام OpenClaw CLI المبني لمهام أخرى (أي `dashboard --no-open` إذا أنشأت جلسة التصحيح رمز مصادقة جديدًا)، فيمكنك تنفيذه في طرفية أخرى كـ `node ./openclaw.mjs` أو إنشاء اسم مستعار للصدفة مثل `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## ذات صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
