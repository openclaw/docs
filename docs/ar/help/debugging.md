---
read_when:
    - تحتاج إلى فحص مخرجات النموذج الخام بحثًا عن تسرّب الاستدلال
    - تريد تشغيل Gateway في وضع المراقبة أثناء التكرار
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، تدفقات النموذج الخام، وتتبع تسرب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-05-03T21:35:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

مساعدات تصحيح الأخطاء لإخراج البث، خصوصًا عندما يخلط موفّر ما الاستدلال داخل النص العادي.

## تجاوزات تصحيح أخطاء وقت التشغيل

استخدم `/debug` في المحادثة لضبط تجاوزات إعدادات **وقت التشغيل فقط** (في الذاكرة، وليس على القرص).
يكون `/debug` معطّلًا افتراضيًا؛ فعّله باستخدام `commands.debug: true`.
يفيد هذا عندما تحتاج إلى تبديل إعدادات غامضة بدون تعديل `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يمسح `/debug reset` كل التجاوزات ويعود إلى الإعدادات المخزّنة على القرص.

## إخراج تتبّع الجلسة

استخدم `/trace` عندما تريد رؤية أسطر التتبّع/تصحيح الأخطاء المملوكة لـ Plugin في جلسة واحدة
بدون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات Plugin مثل ملخصات تصحيح أخطاء Active Memory.
استمر في استخدام `/verbose` لإخراج الحالة/الأدوات الإسهابي العادي، واستمر في استخدام
`/debug` لتجاوزات إعدادات وقت التشغيل فقط.

## تتبّع دورة حياة Plugin

استخدم `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` عندما تبدو أوامر دورة حياة Plugin بطيئة
وتحتاج إلى تفصيل مراحل مضمّن لبيانات Plugin الوصفية، والاكتشاف، والسجل،
ومرآة وقت التشغيل، وتعديل الإعدادات، وأعمال التحديث. التتبّع اختياري ويكتب
إلى stderr، لذلك يبقى إخراج أوامر JSON قابلًا للتحليل.

مثال:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

مثال على الإخراج:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

استخدم هذا للتحقيق في دورة حياة Plugin قبل اللجوء إلى محلّل أداء CPU.
إذا كان الأمر يعمل من نسخة مصدرية، ففضّل قياس وقت التشغيل المبني
باستخدام `node dist/entry.js ...` بعد `pnpm build`؛ كما أن `pnpm openclaw ...`
يقيس أيضًا كلفة مشغّل المصدر.

## بدء CLI وقياس أداء الأوامر

استخدم معيار بدء التشغيل المضمّن في المستودع عندما يبدو أمر ما بطيئًا:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

للقياس لمرة واحدة عبر مشغّل المصدر العادي، اضبط
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

يضيف مشغّل المصدر أعلام ملف تعريف CPU الخاصة بـ Node ويكتب ملف `.cpuprofile` للأمر.
استخدم هذا قبل إضافة قياسات مؤقتة إلى كود الأمر.

## وضع مراقبة Gateway

للتكرار السريع، شغّل Gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

افتراضيًا، يبدأ هذا جلسة tmux باسم
`openclaw-gateway-watch-main` أو يعيد تشغيلها (أو صيغة خاصة بالملف/المنفذ مثل
`openclaw-gateway-watch-dev-19001`) ويرفقها تلقائيًا من الطرفيات التفاعلية.
تبقى الصدف غير التفاعلية وCI واستدعاءات تنفيذ الوكيل منفصلة وتطبع تعليمات الإرفاق
بدلًا من ذلك. أرفقها يدويًا عند الحاجة:

```bash
tmux attach -t openclaw-gateway-watch-main
```

يشغّل جزء tmux المراقب الخام:

```bash
node scripts/watch-node.mjs gateway --force
```

استخدم وضع المقدمة عندما لا تكون tmux مطلوبة:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

عطّل الإرفاق التلقائي مع الإبقاء على إدارة tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

اقِس وقت CPU الخاص بـ Gateway أثناء المراقبة عند تصحيح النقاط الساخنة في بدء التشغيل/وقت التشغيل:

```bash
pnpm gateway:watch --benchmark
```

يستهلك غلاف المراقبة `--benchmark` قبل استدعاء Gateway ويكتب
ملف V8 `.cpuprofile` واحدًا لكل خروج لطفل Gateway تحت
`.artifacts/gateway-watch-profiles/`. أوقف Gateway المُراقب أو أعد تشغيله
لتفريغ ملف التعريف الحالي، ثم افتحه باستخدام Chrome DevTools أو Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

استخدم `--benchmark-dir <path>` عندما تريد الملفات التعريفية في مكان آخر.
استخدم `--benchmark-no-force` عندما تريد أن يتخطى الطفل الخاضع للقياس
تنظيف المنفذ الافتراضي `--force` ويفشل سريعًا إذا كان منفذ Gateway قيد الاستخدام بالفعل.

ينقل غلاف tmux محددات وقت التشغيل الشائعة غير السرية مثل
`OPENCLAW_PROFILE`، و`OPENCLAW_CONFIG_PATH`، و`OPENCLAW_STATE_DIR`،
و`OPENCLAW_GATEWAY_PORT`، و`OPENCLAW_SKIP_CHANNELS` إلى الجزء. ضع
اعتمادات الموفّر في ملفك/إعداداتك العادية، أو استخدم وضع المقدمة الخام
للأسرار العابرة لمرة واحدة.
إذا خرجت Gateway المُراقبة أثناء بدء التشغيل، يشغّل المراقب
`openclaw doctor --fix --non-interactive` مرة واحدة ويعيد تشغيل طفل Gateway.
استخدم `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` عندما تريد فشل بدء التشغيل الأصلي
بدون تمريرة الإصلاح الخاصة بالتطوير فقط.
يفترض جزء tmux المُدار أيضًا سجلات Gateway ملوّنة لتحسين قابلية القراءة؛
اضبط `FORCE_COLOR=0` عند بدء `pnpm gateway:watch` لتعطيل إخراج ANSI.

يعيد المراقب التشغيل عند تغيّر الملفات ذات الصلة بالبناء تحت `src/`، وملفات مصدر الامتدادات،
وبيانات `package.json` و`openclaw.plugin.json` الوصفية الخاصة بالامتدادات، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تعيد تغييرات بيانات الامتداد الوصفية تشغيل
Gateway بدون فرض إعادة بناء `tsdown`؛ أما تغييرات المصدر والإعدادات فما زالت
تعيد بناء `dist` أولًا.

أضف أي أعلام CLI خاصة بـ Gateway بعد `gateway:watch` وستُمرّر في كل إعادة تشغيل.
إعادة تشغيل أمر المراقبة نفسه تعيد إنشاء جزء tmux المسمّى، وما زال المراقب الخام
يحافظ على قفل المراقب الواحد الخاص به بحيث تُستبدل آباء المراقبين المكررة
بدلًا من تراكمها.

## ملف تطوير + Gateway تطوير (`--dev`)

استخدم ملف التطوير لعزل الحالة وتشغيل إعداد آمن وقابل للتخلص منه
للتصحيح. هناك علما `--dev` **اثنان**:

- **`--dev` العام (الملف):** يعزل الحالة تحت `~/.openclaw-dev` ويجعل
  منفذ Gateway الافتراضي `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`: يطلب من Gateway إنشاء إعداد افتراضي +
  مساحة عمل تلقائيًا** عند غيابهما (وتخطي BOOTSTRAP.md).

التدفق الموصى به (ملف التطوير + تمهيد التطوير):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (ينتقل المتصفح/اللوحة تبعًا لذلك)

2. **تمهيد التطوير** (`gateway --dev`)
   - يكتب إعدادًا حدًا أدنى إذا كان مفقودًا (`gateway.mode=local`، ربط local loopback).
   - يضبط `agent.workspace` إلى مساحة عمل التطوير.
   - يضبط `agent.skipBootstrap=true` (بدون BOOTSTRAP.md).
   - يزرع ملفات مساحة العمل إذا كانت مفقودة:
     `AGENTS.md`، و`SOUL.md`، و`TOOLS.md`، و`IDENTITY.md`، و`USER.md`، و`HEARTBEAT.md`.
   - الهوية الافتراضية: **C3‑PO** (روبوت بروتوكول).
   - يتخطى موفّري القنوات في وضع التطوير (`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة الضبط (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` هو علم ملف **عام** وتبتلعه بعض المشغّلات. إذا احتجت إلى كتابته صراحة، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

يمسح `--reset` الإعدادات، والاعتمادات، والجلسات، ومساحة عمل التطوير (باستخدام
`trash`، وليس `rm`)، ثم يعيد إنشاء إعداد التطوير الافتراضي.

<Tip>
إذا كانت Gateway غير تطويرية قيد التشغيل بالفعل (launchd أو systemd)، فأوقفها أولًا:

```bash
openclaw gateway stop
```

</Tip>

## تسجيل البث الخام (OpenClaw)

يمكن لـ OpenClaw تسجيل **بث المساعد الخام** قبل أي ترشيح/تنسيق.
هذه هي أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل كتغيرات نصية عادية
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

## تسجيل القطع الخام (pi-mono)

لالتقاط **قطع OpenAI المتوافقة الخام** قبل تحليلها إلى كتل،
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

> ملاحظة: لا يصدر هذا إلا من العمليات التي تستخدم موفّر
> `openai-completions` الخاص بـ pi-mono.

## ملاحظات السلامة

- يمكن أن تتضمن سجلات البث الخام المطالبات الكاملة، وإخراج الأدوات، وبيانات المستخدم.
- أبقِ السجلات محلية واحذفها بعد التصحيح.
- إذا شاركت السجلات، فأزل الأسرار ومعلومات التعريف الشخصية أولًا.

## ذات صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
