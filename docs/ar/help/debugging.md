---
read_when:
    - تحتاج إلى فحص مخرجات النموذج الخام بحثًا عن تسرّب الاستدلال
    - تريد تشغيل Gateway في وضع المراقبة أثناء التطوير التكراري
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، وتدفقات النموذج الأولية، وتتبع تسرب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-05-06T07:57:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

مساعدات تصحيح الأخطاء لمخرجات البث، خصوصًا عندما يمزج موفّر الاستدلال داخل النص العادي.

## تجاوزات تصحيح الأخطاء وقت التشغيل

استخدم `/debug` في الدردشة لتعيين تجاوزات إعدادات **خاصة بوقت التشغيل فقط** (في الذاكرة، لا على القرص).
يكون `/debug` معطّلًا افتراضيًا؛ فعّله باستخدام `commands.debug: true`.
هذا مفيد عندما تحتاج إلى تبديل إعدادات غير ظاهرة دون تعديل `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يمسح `/debug reset` كل التجاوزات ويعود إلى الإعدادات الموجودة على القرص.

## مخرجات تتبع الجلسة

استخدم `/trace` عندما تريد رؤية سطور التتبع/التصحيح المملوكة للـ plugin في جلسة واحدة
دون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات plugin مثل ملخصات تصحيح Active Memory.
واصل استخدام `/verbose` لمخرجات الحالة/الأدوات الإسهابية العادية، وواصل استخدام
`/debug` لتجاوزات الإعدادات الخاصة بوقت التشغيل فقط.

## تتبع دورة حياة Plugin

استخدم `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` عندما تبدو أوامر دورة حياة plugin بطيئة
وتحتاج إلى تفصيل مراحل مضمّن لبيانات plugin الوصفية، والاكتشاف، والسجل،
ومرآة وقت التشغيل، وتعديل الإعدادات، وأعمال التحديث. التتبع اختياري ويكتب
إلى stderr، لذلك تبقى مخرجات أوامر JSON قابلة للتحليل.

مثال:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

مثال على المخرجات:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

استخدم هذا للتحقيق في دورة حياة plugin قبل اللجوء إلى محلّل أداء CPU.
إذا كان الأمر يعمل من نسخة مصدرية، ففضّل قياس وقت التشغيل المبني
باستخدام `node dist/entry.js ...` بعد `pnpm build`؛ كما أن `pnpm openclaw ...`
يقيس حمل مشغّل المصدر.

## بدء CLI وقياس أداء الأوامر

استخدم معيار بدء التشغيل المحفوظ في المستودع عندما يبدو أمر ما بطيئًا:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

للقياس لمرة واحدة عبر مشغّل المصدر العادي، عيّن
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

يضيف مشغّل المصدر أعلام ملفات تعريف CPU الخاصة بـ Node ويكتب ملف `.cpuprofile` للأمر.
استخدم هذا قبل إضافة أدوات قياس مؤقتة إلى كود الأوامر.

لتوقفات بدء التشغيل التي تبدو كأنها عمل متزامن في نظام الملفات أو محمّل الوحدات،
أضف علم تتبع I/O المتزامن في Node عبر مشغّل المصدر:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

يفعّل `pnpm gateway:watch` هذا العلم افتراضيًا لعملية Gateway الفرعية التي تتم مراقبتها.
عيّن `OPENCLAW_TRACE_SYNC_IO=0` لإخفاء مخرجات تتبع I/O المتزامن في Node ضمن وضع المراقبة.

## وضع مراقبة Gateway

للتكرار السريع، شغّل gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

افتراضيًا، يبدأ هذا أو يعيد تشغيل جلسة tmux باسم
`openclaw-gateway-watch-main` (أو صيغة خاصة بالملف/المنفذ مثل
`openclaw-gateway-watch-dev-19001`) ويرفقها تلقائيًا من الطرفيات التفاعلية.
تبقى shells غير التفاعلية وCI واستدعاءات تنفيذ الوكيل منفصلة وتطبع تعليمات الإرفاق
بدلًا من ذلك. أرفق يدويًا عند الحاجة:

```bash
tmux attach -t openclaw-gateway-watch-main
```

يشغّل جزء tmux المراقب الخام:

```bash
node scripts/watch-node.mjs gateway --force
```

استخدم وضع الواجهة الأمامية عندما لا تريد tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

عطّل الإرفاق التلقائي مع إبقاء إدارة tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

قس وقت CPU الخاص بـ Gateway المراقَب عند تصحيح النقاط الساخنة في بدء التشغيل/وقت التشغيل:

```bash
pnpm gateway:watch --benchmark
```

يستهلك غلاف المراقبة `--benchmark` قبل استدعاء Gateway ويكتب
ملف V8 `.cpuprofile` واحدًا لكل خروج لعملية Gateway فرعية تحت
`.artifacts/gateway-watch-profiles/`. أوقف أو أعد تشغيل gateway المراقَب
لتفريغ الملف الحالي، ثم افتحه باستخدام Chrome DevTools أو Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

استخدم `--benchmark-dir <path>` عندما تريد الملفات في مكان آخر.
استخدم `--benchmark-no-force` عندما تريد من العملية الفرعية المقيسة تخطي
تنظيف المنفذ الافتراضي `--force` والفشل سريعًا إذا كان منفذ Gateway قيد الاستخدام بالفعل.
يخفي وضع القياس رسائل تتبع sync-I/O افتراضيًا. عيّن
`OPENCLAW_TRACE_SYNC_IO=1` مع `--benchmark` عندما تريد صراحةً ملفات تعريف CPU
وتتبعات مكدس sync-I/O في Node معًا. في وضع القياس تُكتب كتل التتبع هذه
إلى `gateway-watch-output.log` تحت مجلد القياس وتُرشّح من جزء الطرفية؛
وتظل سجلات Gateway العادية مرئية.

ينقل غلاف tmux محددات وقت التشغيل الشائعة غير السرية مثل
`OPENCLAW_PROFILE` و`OPENCLAW_CONFIG_PATH` و`OPENCLAW_STATE_DIR`
و`OPENCLAW_GATEWAY_PORT` و`OPENCLAW_SKIP_CHANNELS` إلى الجزء. ضع
اعتمادات الموفّر في ملفك الشخصي/إعداداتك العادية، أو استخدم وضع الواجهة الأمامية الخام
للأسرار المؤقتة لمرة واحدة.
إذا خرج Gateway المراقَب أثناء بدء التشغيل، يشغّل المراقب
`openclaw doctor --fix --non-interactive` مرة واحدة ثم يعيد تشغيل عملية Gateway الفرعية.
استخدم `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` عندما تريد فشل بدء التشغيل الأصلي
دون تمريرة الإصلاح الخاصة بالتطوير.
يضبط جزء tmux المدار أيضًا سجلات Gateway الملونة افتراضيًا لسهولة القراءة؛
عيّن `FORCE_COLOR=0` عند بدء `pnpm gateway:watch` لتعطيل مخرجات ANSI.

يعيد المراقب التشغيل عند تغيّر الملفات ذات الصلة بالبناء تحت `src/`، وملفات مصدر الإضافات،
وبيانات `package.json` و`openclaw.plugin.json` الوصفية الخاصة بالإضافات، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تغييرات بيانات الإضافات الوصفية تعيد تشغيل
gateway دون فرض إعادة بناء `tsdown`؛ أما تغييرات المصدر والإعدادات فما زالت
تعيد بناء `dist` أولًا.

أضف أي أعلام CLI خاصة بـ gateway بعد `gateway:watch` وسيتم تمريرها في كل
إعادة تشغيل. إعادة تشغيل أمر المراقبة نفسه تعيد إنشاء جزء tmux المسمى، وما زال
المراقب الخام يحتفظ بقفل المراقب الواحد بحيث تُستبدل عمليات المراقبة الأبوية المكررة
بدلًا من تراكمها.

## ملف التطوير + Gateway التطوير (`--dev`)

استخدم ملف التطوير لعزل الحالة وتشغيل إعداد آمن وقابل للتخلص منه
للتصحيح. توجد علامتا `--dev` **اثنتان**:

- **`--dev` العامة (الملف):** تعزل الحالة تحت `~/.openclaw-dev` وتضبط
  منفذ gateway الافتراضي على `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`: يخبر Gateway بإنشاء إعداد افتراضي + مساحة عمل تلقائيًا**
  عند غيابهما (وتخطي BOOTSTRAP.md).

التدفق الموصى به (ملف التطوير + تمهيد التطوير):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

إذا لم يكن لديك تثبيت عام بعد، شغّل CLI عبر `pnpm openclaw ...`.

ما يفعله هذا:

1. **عزل الملف** (`--dev` العامة)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (يتحرك المتصفح/canvas وفقًا لذلك)

2. **تمهيد التطوير** (`gateway --dev`)
   - يكتب إعدادًا أدنى إذا كان مفقودًا (`gateway.mode=local`، ربط loopback).
   - يعيّن `agent.workspace` إلى مساحة عمل التطوير.
   - يعيّن `agent.skipBootstrap=true` (لا يوجد BOOTSTRAP.md).
   - يزرع ملفات مساحة العمل إذا كانت مفقودة:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - الهوية الافتراضية: **C3-PO** (درويد بروتوكول).
   - يتخطى موفّري القنوات في وضع التطوير (`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة الضبط (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` هو علم ملف **عام** وتبتلعه بعض المشغلات. إذا احتجت إلى كتابته صراحةً، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

يمسح `--reset` الإعدادات والاعتمادات والجلسات ومساحة عمل التطوير (باستخدام
`trash`، وليس `rm`)، ثم يعيد إنشاء إعداد التطوير الافتراضي.

<Tip>
إذا كان gateway غير خاص بالتطوير يعمل بالفعل (launchd أو systemd)، فأوقفه أولًا:

```bash
openclaw gateway stop
```

</Tip>

## تسجيل البث الخام (OpenClaw)

يمكن لـ OpenClaw تسجيل **بث المساعد الخام** قبل أي ترشيح/تنسيق.
هذه أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل كدلتا نصية عادية
(أو ككتل تفكير منفصلة).

فعّله عبر CLI:

```bash
pnpm gateway:watch --raw-stream
```

تجاوز مسار اختياري:

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

## تسجيل القطع الخام (pi-mono)

لالتقاط **قطع OpenAI-compat الخام** قبل تحليلها إلى كتل،
يوفر pi-mono مسجلًا منفصلًا:

```bash
PI_RAW_STREAM=1
```

مسار اختياري:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

الملف الافتراضي:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> ملاحظة: لا يصدر هذا إلا من العمليات التي تستخدم موفّر
> `openai-completions` الخاص بـ pi-mono.

## ملاحظات السلامة

- يمكن أن تتضمن سجلات البث الخام المطالبات الكاملة، ومخرجات الأدوات، وبيانات المستخدم.
- أبقِ السجلات محلية واحذفها بعد التصحيح.
- إذا شاركت السجلات، فأزل الأسرار وPII أولًا.

## التصحيح في VSCode

خرائط المصدر مطلوبة لتمكين التصحيح في IDEs المعتمدة على VSCode لأن كثيرًا من الملفات المولدة تنتهي بأسماء مجزأة كجزء من عملية البناء. تستهدف إعدادات `launch.json` المضمنة خدمة Gateway، لكن يمكن تكييفها بسرعة لأغراض أخرى:

1. **إعادة بناء Gateway وتصحيحه** - يصحح خدمة Gateway بعد إنشاء بناء جديد
2. **تصحيح Gateway** - يصحح خدمة Gateway لبناء موجود مسبقًا

### الإعداد

إعداد **إعادة بناء Gateway وتصحيحه** الافتراضي شامل؛ سيحذف مجلد `/dist` تلقائيًا ويعيد بناء المشروع مع تمكين التصحيح:

1. افتح لوحة **Run and Debug** من Activity Bar أو اضغط `Ctrl`+`Shift`+`D`
2. في IDE، تأكد من تحديد **Rebuild and Debug Gateway** في قائمة الإعدادات المنسدلة ثم اضغط زر **Start Debugging**

بدلًا من ذلك - إذا كنت تفضل إدارة عمليتي البناء والتصحيح يدويًا:

1. افتح طرفية وفعّل خرائط المصدر:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. في الطرفية نفسها، أعد بناء المشروع: `pnpm clean:dist && pnpm build`
3. في IDE، حدد خيار **Debug Gateway** في قائمة إعدادات **Run and Debug** المنسدلة ثم اضغط زر **Start Debugging**

يمكنك الآن تعيين نقاط توقف في ملفات مصدر TypeScript الخاصة بك (مجلد `src/`) وسيقوم المصحح بربط نقاط التوقف بشكل صحيح بملفات JavaScript المترجمة عبر خرائط المصدر. ستتمكن من فحص المتغيرات، والتنقل خطوة بخطوة عبر الكود، وفحص مكدسات الاستدعاء كما هو متوقع.

### ملاحظات

- عند استخدام خيار **"Rebuild and Debug Gateway"** - في كل مرة يُشغّل فيها المصحح سيحذف مجلد `/dist` بالكامل ويشغّل `pnpm build` كاملًا مع تمكين خرائط المصدر قبل بدء Gateway
- عند استخدام خيار **"Debug Gateway"** - يمكن بدء جلسات التصحيح وإيقافها في أي وقت دون التأثير على مجلد `/dist`، لكن يجب استخدام عملية طرفية منفصلة لكل من تمكين التصحيح وإدارة دورة البناء
- عدّل إعدادات `launch.json` الخاصة بـ `args` لتصحيح أقسام أخرى من المشروع
- إذا احتجت إلى استخدام OpenClaw CLI المبني لمهام أخرى (أي `dashboard --no-open` إذا أنشأت جلسة التصحيح رمز مصادقة جديدًا)، يمكنك تنفيذه في طرفية أخرى كـ `node ./openclaw.mjs` أو إنشاء اسم مستعار في shell مثل `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## ذات صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
