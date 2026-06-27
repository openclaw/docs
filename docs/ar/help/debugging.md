---
read_when:
    - تحتاج إلى فحص مخرجات النموذج الخام بحثًا عن تسرّب الاستدلال
    - تريد تشغيل Gateway في وضع المراقبة أثناء التكرار
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، وتدفّقات النموذج الخام، وتتبع تسرّب الاستدلال'
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-06-27T17:45:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

مساعدات تصحيح الأخطاء لمخرجات البث، خصوصا عندما يخلط مزود ما الاستدلال داخل النص العادي.

## تجاوزات التصحيح في وقت التشغيل

استخدم `/debug` في الدردشة لتعيين تجاوزات إعدادات **وقت التشغيل فقط** (في الذاكرة، لا على القرص).
يكون `/debug` معطلا افتراضيا؛ فعله باستخدام `commands.debug: true`.
هذا مفيد عندما تحتاج إلى تبديل إعدادات غامضة دون تعديل `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يمسح `/debug reset` كل التجاوزات ويعود إلى الإعدادات الموجودة على القرص.

## مخرجات تتبع الجلسة

استخدم `/trace` عندما تريد رؤية أسطر التتبع/التصحيح التي يملكها Plugin في جلسة واحدة
دون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات Plugin مثل ملخصات تصحيح Active Memory.
استمر في استخدام `/verbose` لمخرجات الحالة/الأدوات المسهبة العادية، واستمر في استخدام
`/debug` لتجاوزات إعدادات وقت التشغيل فقط.

## تتبع دورة حياة Plugin

استخدم `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` عندما تبدو أوامر دورة حياة Plugin بطيئة
وتحتاج إلى تفصيل مراحل مدمج لبيانات Plugin الوصفية، والاكتشاف، والسجل،
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

استخدم هذا للتحقيق في دورة حياة Plugin قبل اللجوء إلى محلل CPU.
إذا كان الأمر يعمل من نسخة مصدرية، ففضل قياس وقت التشغيل المبني
باستخدام `node dist/entry.js ...` بعد `pnpm build`؛ يقيس `pnpm openclaw ...`
أيضا حمل مشغل المصدر.

## بدء CLI وقياس أداء الأوامر

استخدم اختبار بدء التشغيل المرجعي المودع عندما يبدو أمر ما بطيئا:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

للقياس لمرة واحدة عبر مشغل المصدر العادي، عين
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

يضيف مشغل المصدر أعلام ملف تعريف CPU في Node ويكتب ملف `.cpuprofile` للأمر.
استخدم هذا قبل إضافة أدوات قياس مؤقتة إلى كود الأمر.

لتوقفات بدء التشغيل التي تبدو كعمل نظام ملفات متزامن أو محمل وحدات،
أضف علم تتبع الإدخال/الإخراج المتزامن في Node عبر مشغل المصدر:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

يترك `pnpm gateway:watch` هذا العلم معطلا افتراضيا لعملية Gateway الفرعية المراقبة.
عين `OPENCLAW_TRACE_SYNC_IO=1` عندما تريد صراحة مخرجات تتبع الإدخال/الإخراج المتزامن في Node
في وضع المراقبة.

## وضع مراقبة Gateway

للتكرار السريع، شغل Gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

افتراضيا، يبدأ هذا أو يعيد تشغيل جلسة tmux باسم
`openclaw-gateway-watch-main` (أو صيغة خاصة بملف/منفذ مثل
`openclaw-gateway-watch-dev-19001`) ويرفقها تلقائيا من الطرفيات التفاعلية.
تبقى الصدف غير التفاعلية وCI واستدعاءات تنفيذ الوكيل منفصلة وتطبع
تعليمات الإرفاق بدلا من ذلك. أرفق يدويا عند الحاجة:

```bash
tmux attach -t openclaw-gateway-watch-main
```

يشغل جزء tmux المراقب الخام:

```bash
node scripts/watch-node.mjs gateway --force
```

استخدم وضع المقدمة عندما لا يكون tmux مطلوبا:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

عطل الإرفاق التلقائي مع إبقاء إدارة tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

قس وقت CPU الخاص ب Gateway المراقب عند تصحيح النقاط الساخنة في بدء التشغيل/وقت التشغيل:

```bash
pnpm gateway:watch --benchmark
```

يستهلك غلاف المراقبة `--benchmark` قبل استدعاء Gateway ويكتب
ملف V8 `.cpuprofile` واحدا لكل خروج لعملية Gateway فرعية تحت
`.artifacts/gateway-watch-profiles/`. أوقف أو أعد تشغيل Gateway المراقب
لتفريغ الملف الشخصي الحالي، ثم افتحه باستخدام Chrome DevTools أو Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

استخدم `--benchmark-dir <path>` عندما تريد الملفات الشخصية في مكان آخر.
استخدم `--benchmark-no-force` عندما تريد من العملية الفرعية المقاسة تخطي
تنظيف المنفذ الافتراضي `--force` والفشل بسرعة إذا كان منفذ Gateway مستخدما بالفعل.
يخمد وضع القياس ضجيج تتبع الإدخال/الإخراج المتزامن افتراضيا. عين
`OPENCLAW_TRACE_SYNC_IO=1` مع `--benchmark` عندما تريد صراحة كلا من
ملفات CPU الشخصية وتتبع مكدسات الإدخال/الإخراج المتزامن في Node. في وضع القياس، تكتب كتل التتبع تلك
إلى `gateway-watch-output.log` تحت دليل القياس وتصفى من جزء الطرفية؛ تبقى سجلات Gateway العادية مرئية.

ينقل غلاف tmux محددات وقت التشغيل الشائعة غير السرية مثل
`OPENCLAW_PROFILE`، و`OPENCLAW_CONFIG_PATH`، و`OPENCLAW_STATE_DIR`،
و`OPENCLAW_GATEWAY_PORT`، و`OPENCLAW_SKIP_CHANNELS` إلى الجزء. ضع
بيانات اعتماد المزود في ملفك/إعداداتك العادية، أو استخدم وضع المقدمة الخام
للأسرار المؤقتة لمرة واحدة.
إذا خرج Gateway المراقب أثناء بدء التشغيل، يشغل المراقب
`openclaw doctor --fix --non-interactive` مرة واحدة ويعيد تشغيل عملية Gateway الفرعية.
استخدم `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` عندما تريد فشل بدء التشغيل الأصلي
دون تمريرة الإصلاح الخاصة بالتطوير فقط.
يفترض جزء tmux المدار أيضا سجلات Gateway ملونة لتحسين القراءة؛
عين `FORCE_COLOR=0` عند بدء `pnpm gateway:watch` لتعطيل مخرجات ANSI.

يعيد المراقب التشغيل عند تغير الملفات ذات الصلة بالبناء تحت `src/`، وملفات مصدر الإضافة،
وبيانات `package.json` و`openclaw.plugin.json` الوصفية للإضافة، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تعيد تغييرات بيانات الإضافة الوصفية تشغيل
Gateway دون فرض إعادة بناء `tsdown`؛ ما زالت تغييرات المصدر والإعدادات
تعيد بناء `dist` أولا.

أضف أي أعلام CLI خاصة ب Gateway بعد `gateway:watch` وستمرر عبره في
كل إعادة تشغيل. إعادة تشغيل أمر المراقبة نفسه تعيد إنشاء جزء tmux المسمى، وما زال
المراقب الخام يحتفظ بقفل مراقب واحد بحيث تستبدل عمليات المراقبة الأصلية المكررة
بدلا من تراكمها.

## ملف التطوير + Gateway التطوير (`--dev`)

استخدم ملف التطوير لعزل الحالة وتشغيل إعداد آمن وقابل للتخلص منه
للتصحيح. توجد علامتا `--dev` **اثنتان**:

- **`--dev` العام (الملف):** يعزل الحالة تحت `~/.openclaw-dev` ويجعل
  منفذ Gateway الافتراضي `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`: يخبر Gateway بإنشاء إعداد افتراضي +
  مساحة عمل تلقائيا** عند غيابهما (وتخطي BOOTSTRAP.md).

التدفق الموصى به (ملف التطوير + تمهيد التطوير):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

إذا لم يكن لديك تثبيت عام بعد، شغل CLI عبر `pnpm openclaw ...`.

ما يفعله هذا:

1. **عزل الملف** (`--dev` العام)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (يتحرك المتصفح/اللوحة وفقا لذلك)

2. **تمهيد التطوير** (`gateway --dev`)
   - يكتب إعدادا بسيطا إذا كان مفقودا (`gateway.mode=local`، ربط loopback).
   - يعين `agent.workspace` إلى مساحة عمل التطوير.
   - يعين `agent.skipBootstrap=true` (لا يوجد BOOTSTRAP.md).
   - يزرع ملفات مساحة العمل إذا كانت مفقودة:
     `AGENTS.md`، و`SOUL.md`، و`TOOLS.md`، و`IDENTITY.md`، و`USER.md`، و`HEARTBEAT.md`.
   - الهوية الافتراضية: **C3-PO** (روبوت بروتوكول).
   - يتخطى مزودي القنوات في وضع التطوير (`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة الضبط (بدء جديد):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` هو علم ملف **عام** وتبتلعه بعض المشغلات. إذا احتجت إلى كتابته صراحة، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

يمسح `--reset` الإعدادات وبيانات الاعتماد والجلسات ومساحة عمل التطوير (باستخدام
`trash`، وليس `rm`)، ثم يعيد إنشاء إعداد التطوير الافتراضي.

<Tip>
إذا كان Gateway غير تطويري يعمل بالفعل (launchd أو systemd)، فأوقفه أولا:

```bash
openclaw gateway stop
```

</Tip>

## تسجيل البث الخام (OpenClaw)

يمكن ل OpenClaw تسجيل **تيار المساعد الخام** قبل أي ترشيح/تنسيق.
هذه أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل كفروق نصية صرفة
(أو ككتل تفكير منفصلة).

فعله عبر CLI:

```bash
pnpm gateway:watch --raw-stream
```

تجاوز مسار اختياري:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

متغيرات بيئة مكافئة:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

الملف الافتراضي:

`~/.openclaw/logs/raw-stream.jsonl`

## تسجيل أجزاء OpenAI المتوافقة الخام

لالتقاط **أجزاء OpenAI المتوافقة الخام** قبل تحليلها إلى كتل،
فعل مسجل النقل:

```bash
OPENCLAW_RAW_STREAM=1
```

مسار اختياري:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

الملف الافتراضي:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## ملاحظات السلامة

- يمكن أن تتضمن سجلات البث الخام المطالبات الكاملة، ومخرجات الأدوات، وبيانات المستخدم.
- أبق السجلات محلية واحذفها بعد التصحيح.
- إذا شاركت السجلات، فأزل الأسرار ومعلومات التعريف الشخصية أولا.

## التصحيح في VSCode

خرائط المصدر مطلوبة لتمكين التصحيح في بيئات IDE المستندة إلى VSCode لأن كثيرا من الملفات المولدة ينتهي بها الأمر بأسماء مجزأة كجزء من عملية البناء. تستهدف إعدادات `launch.json` المضمنة خدمة Gateway، لكنها قابلة للتكييف بسرعة لأغراض أخرى:

1. **إعادة بناء وتصحيح Gateway** - يصحح خدمة Gateway بعد إنشاء بناء جديد
2. **تصحيح Gateway** - يصحح خدمة Gateway من بناء موجود مسبقا

### الإعداد

إعداد **إعادة بناء وتصحيح Gateway** الافتراضي مكتمل التجهيز، وسيحذف مجلد `/dist` تلقائيا ويعيد بناء المشروع مع تمكين التصحيح:

1. افتح لوحة **تشغيل وتصحيح** من شريط النشاط أو اضغط `Ctrl`+`Shift`+`D`
2. في IDE، تأكد من تحديد **إعادة بناء وتصحيح Gateway** في قائمة الإعدادات المنسدلة ثم اضغط زر **بدء التصحيح**

بدلا من ذلك - إذا كنت تفضل إدارة عمليتي البناء والتصحيح يدويا:

1. افتح طرفية وفعل خرائط المصدر:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. في الطرفية نفسها، أعد بناء المشروع: `pnpm clean:dist && pnpm build`
3. في IDE، حدد خيار **تصحيح Gateway** في قائمة إعدادات **تشغيل وتصحيح** المنسدلة ثم اضغط زر **بدء التصحيح**

يمكنك الآن تعيين نقاط توقف في ملفات مصدر TypeScript الخاصة بك (دليل `src/`) وسيقوم المصحح بربط نقاط التوقف بشكل صحيح ب JavaScript المترجم عبر خرائط المصدر. ستتمكن من فحص المتغيرات، والتنقل خطوة بخطوة في الكود، وفحص مكدسات الاستدعاء كما هو متوقع.

### ملاحظات

- عند استخدام خيار **"إعادة بناء وتصحيح Gateway"** - في كل مرة يطلق فيها المصحح سيحذف مجلد `/dist` بالكامل ويشغل `pnpm build` كاملا مع تمكين خرائط المصدر قبل بدء Gateway
- عند استخدام خيار **"تصحيح Gateway"** - يمكن بدء جلسات التصحيح وإيقافها في أي وقت دون التأثير على مجلد `/dist`، لكن يجب استخدام عملية طرفية منفصلة لكل من تمكين التصحيح وإدارة دورة البناء
- عدل إعدادات `launch.json` الخاصة ب `args` لتصحيح أقسام أخرى من المشروع
- إذا احتجت إلى استخدام OpenClaw CLI المبني لمهام أخرى (مثل `dashboard --no-open` إذا أنشأت جلسة التصحيح رمز مصادقة جديدا)، فيمكنك تنفيذه في طرفية أخرى ك `node ./openclaw.mjs` أو إنشاء اسم مستعار للصدفة مثل `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## ذو صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
