---
read_when:
    - يجب فحص مخرجات النموذج الخام بحثًا عن تسرّب الاستدلال
    - تريد تشغيل Gateway في وضع المراقبة أثناء إجراء التعديلات
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، وتدفقات النموذج الخام، وتتبع تسرّب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-05-05T01:47:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

مساعدات تصحيح الأخطاء لمخرجات البث، خصوصًا عندما يخلط مزوّد ما الاستدلال داخل النص العادي.

## تجاوزات تصحيح أخطاء وقت التشغيل

استخدم `/debug` في المحادثة لتعيين تجاوزات إعداد **وقت التشغيل فقط** (في الذاكرة، لا على القرص).
`/debug` معطّل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.
هذا مفيد عندما تحتاج إلى تبديل إعدادات غامضة دون تعديل `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يمسح `/debug reset` كل التجاوزات ويعود إلى إعدادات القرص.

## مخرجات تتبع الجلسة

استخدم `/trace` عندما تريد رؤية أسطر التتبع/تصحيح الأخطاء المملوكة من Plugin في جلسة واحدة
دون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات Plugin مثل ملخصات تصحيح أخطاء Active Memory.
واصل استخدام `/verbose` لمخرجات الحالة/الأدوات المسهبة العادية، وواصل استخدام
`/debug` لتجاوزات إعدادات وقت التشغيل فقط.

## تتبع دورة حياة Plugin

استخدم `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` عندما تبدو أوامر دورة حياة Plugin بطيئة
وتحتاج إلى تفصيل مراحل مدمج لبيانات Plugin الوصفية، والاكتشاف، والسجل،
ومرآة وقت التشغيل، وتعديل الإعدادات، وأعمال التحديث. التتبع اختياري ويكتب
إلى stderr، لذلك تظل مخرجات أوامر JSON قابلة للتحليل.

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

استخدم هذا للتحقيق في دورة حياة Plugin قبل اللجوء إلى محلل أداء وحدة المعالجة المركزية.
إذا كان الأمر يعمل من نسخة مصدرية محلية، ففضّل قياس وقت التشغيل المبني
باستخدام `node dist/entry.js ...` بعد `pnpm build`؛ يقيس `pnpm openclaw ...`
أيضًا كلفة مشغّل المصدر.

## بدء CLI وتحليل أداء الأوامر

استخدم معيار بدء التشغيل المضمّن في المستودع عندما يبدو الأمر بطيئًا:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

للتحليل لمرة واحدة عبر مشغّل المصدر العادي، اضبط
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

يضيف مشغّل المصدر أعلام ملف أداء وحدة المعالجة المركزية في Node ويكتب ملف `.cpuprofile` للأمر. استخدم هذا قبل إضافة أدوات قياس مؤقتة إلى كود الأمر.

بالنسبة لتوقفات بدء التشغيل التي تبدو كعمل متزامن في نظام الملفات أو محمّل الوحدات،
أضف علم تتبع الإدخال/الإخراج المتزامن الخاص بـ Node عبر مشغّل المصدر:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

يفعّل `pnpm gateway:watch` هذا العلم افتراضيًا لعملية Gateway الفرعية المراقبة.
اضبط `OPENCLAW_TRACE_SYNC_IO=0` لكبت مخرجات تتبع الإدخال/الإخراج المتزامن في Node في وضع المراقبة.

## وضع مراقبة Gateway

للتكرار السريع، شغّل Gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

افتراضيًا، يبدأ هذا أو يعيد تشغيل جلسة tmux باسم
`openclaw-gateway-watch-main` (أو صيغة خاصة بالملف/المنفذ مثل
`openclaw-gateway-watch-dev-19001`) ويرفقها تلقائيًا من الطرفيات التفاعلية.
تبقى الأصداف غير التفاعلية، والتكامل المستمر، واستدعاءات تنفيذ الوكيل منفصلة وتطبع
تعليمات الإرفاق بدلًا من ذلك. أرفق يدويًا عند الحاجة:

```bash
tmux attach -t openclaw-gateway-watch-main
```

تشغّل لوحة tmux المراقب الخام:

```bash
node scripts/watch-node.mjs gateway --force
```

استخدم وضع المقدمة عندما لا تريد tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

عطّل الإرفاق التلقائي مع إبقاء إدارة tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

حلّل وقت CPU الخاص بـ Gateway المراقبة عند تصحيح نقاط الاختناق في بدء التشغيل/وقت التشغيل:

```bash
pnpm gateway:watch --benchmark
```

يستهلك غلاف المراقبة `--benchmark` قبل استدعاء Gateway ويكتب
ملف V8 `.cpuprofile` واحدًا لكل خروج لعملية Gateway فرعية تحت
`.artifacts/gateway-watch-profiles/`. أوقف أو أعد تشغيل Gateway المراقبة
لتفريغ ملف الأداء الحالي، ثم افتحه باستخدام Chrome DevTools أو Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

استخدم `--benchmark-dir <path>` عندما تريد وضع ملفات الأداء في مكان آخر.
استخدم `--benchmark-no-force` عندما تريد أن تتخطى العملية الفرعية المقاسة
تنظيف المنفذ الافتراضي `--force` وأن تفشل سريعًا إذا كان منفذ Gateway قيد الاستخدام بالفعل.
يكبت وضع القياس ضجيج تتبع الإدخال/الإخراج المتزامن افتراضيًا. اضبط
`OPENCLAW_TRACE_SYNC_IO=1` مع `--benchmark` عندما تريد صراحةً ملفات أداء CPU
وتتبعات مكدس الإدخال/الإخراج المتزامن في Node معًا. في وضع القياس، تُكتب كتل التتبع هذه
إلى `gateway-watch-output.log` تحت دليل القياس وتُصفّى من لوحة الطرفية؛ تظل سجلات Gateway العادية مرئية.

ينقل غلاف tmux محددات وقت التشغيل الشائعة غير السرية مثل
`OPENCLAW_PROFILE`، و`OPENCLAW_CONFIG_PATH`، و`OPENCLAW_STATE_DIR`،
و`OPENCLAW_GATEWAY_PORT`، و`OPENCLAW_SKIP_CHANNELS` إلى اللوحة. ضع
اعتمادات المزوّد في ملفك/إعدادك العادي، أو استخدم وضع المقدمة الخام
للأسرار المؤقتة لمرة واحدة.
إذا خرجت Gateway المراقبة أثناء بدء التشغيل، يشغّل المراقب
`openclaw doctor --fix --non-interactive` مرة واحدة ويعيد تشغيل عملية Gateway الفرعية.
استخدم `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` عندما تريد فشل بدء التشغيل الأصلي
دون تمريرة الإصلاح الخاصة بالتطوير فقط.
تستخدم لوحة tmux المُدارة أيضًا سجلات Gateway ملوّنة افتراضيًا لتحسين القراءة؛
اضبط `FORCE_COLOR=0` عند بدء `pnpm gateway:watch` لتعطيل مخرجات ANSI.

يعيد المراقب التشغيل عند تغيّر الملفات ذات الصلة بالبناء تحت `src/`، وملفات مصدر الامتدادات،
وبيانات `package.json` و`openclaw.plugin.json` الوصفية الخاصة بالامتداد، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تغييرات بيانات الامتداد الوصفية تعيد تشغيل
Gateway دون فرض إعادة بناء `tsdown`؛ أما تغييرات المصدر والإعدادات فما زالت
تعيد بناء `dist` أولًا.

أضف أي أعلام CLI خاصة بـ Gateway بعد `gateway:watch` وسيتم تمريرها في
كل إعادة تشغيل. إعادة تشغيل أمر المراقبة نفسه تعيد إنشاء لوحة tmux المسماة، وما زال
المراقب الخام يحتفظ بقفل المراقب الواحد بحيث يتم استبدال آباء المراقبة المكررين
بدلًا من تراكمهم.

## ملف التطوير + Gateway التطويرية (--dev)

استخدم ملف التطوير لعزل الحالة وتشغيل إعداد آمن وقابل للتخلص منه
لتصحيح الأخطاء. يوجد علمان **اثنان** باسم `--dev`:

- **`--dev` العام (الملف):** يعزل الحالة تحت `~/.openclaw-dev` ويضبط
  منفذ Gateway الافتراضي إلى `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`: يخبر Gateway بإنشاء إعداد افتراضي + مساحة عمل تلقائيًا** عند غيابهما (وتخطي BOOTSTRAP.md).

التدفق الموصى به (ملف تطوير + تمهيد تطوير):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

إذا لم يكن لديك تثبيت عام بعد، شغّل CLI عبر `pnpm openclaw ...`.

ما يفعله هذا:

1. **عزل الملف** (`--dev` العام)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (تتحرك منافذ المتصفح/اللوحة تبعًا لذلك)

2. **تمهيد التطوير** (`gateway --dev`)
   - يكتب إعدادًا أدنى إذا كان مفقودًا (`gateway.mode=local`، ربط loopback).
   - يضبط `agent.workspace` إلى مساحة عمل التطوير.
   - يضبط `agent.skipBootstrap=true` (لا يوجد BOOTSTRAP.md).
   - يملأ ملفات مساحة العمل إذا كانت مفقودة:
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - الهوية الافتراضية: **C3‑PO** (روبوت بروتوكول).
   - يتخطى مزوّدي القنوات في وضع التطوير (`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة الضبط (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` هو علم ملف **عام** وتبتلعه بعض المشغّلات. إذا احتجت إلى كتابته صراحةً، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

يمسح `--reset` الإعدادات، والاعتمادات، والجلسات، ومساحة عمل التطوير (باستخدام
`trash`، لا `rm`)، ثم يعيد إنشاء إعداد التطوير الافتراضي.

<Tip>
إذا كانت Gateway غير تطويرية تعمل بالفعل (launchd أو systemd)، فأوقفها أولًا:

```bash
openclaw gateway stop
```

</Tip>

## تسجيل البث الخام (OpenClaw)

يمكن لـ OpenClaw تسجيل **بث المساعد الخام** قبل أي تصفية/تنسيق.
هذه أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل كدلتا نص عادي
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
يعرض pi-mono مسجّلًا منفصلًا:

```bash
PI_RAW_STREAM=1
```

مسار اختياري:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

الملف الافتراضي:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> ملاحظة: لا يصدر هذا إلا من العمليات التي تستخدم مزوّد
> `openai-completions` في pi-mono.

## ملاحظات السلامة

- يمكن أن تتضمن سجلات البث الخام المطالبات الكاملة، ومخرجات الأدوات، وبيانات المستخدم.
- أبقِ السجلات محلية واحذفها بعد تصحيح الأخطاء.
- إذا شاركت السجلات، فأزل الأسرار ومعلومات التعريف الشخصية أولًا.

## ذو صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
