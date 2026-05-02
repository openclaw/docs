---
read_when:
    - تحتاج إلى فحص مخرجات النموذج الخام بحثًا عن تسرّب الاستدلال
    - تريد تشغيل Gateway في وضع المراقبة أثناء التكرار
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، وتدفقات النموذج الخام، وتتبع تسرب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-05-02T22:20:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

مساعدات تصحيح الأخطاء لمخرجات البث، خاصة عندما يخلط موفّر ما الاستدلال داخل النص العادي.

## تجاوزات تصحيح أخطاء وقت التشغيل

استخدم `/debug` في المحادثة لتعيين تجاوزات إعدادات **وقت التشغيل فقط** (في الذاكرة، وليس على القرص).
يكون `/debug` معطلاً افتراضياً؛ فعّله باستخدام `commands.debug: true`.
هذا مفيد عندما تحتاج إلى تبديل إعدادات غامضة بدون تعديل `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يمسح `/debug reset` كل التجاوزات ويعود إلى الإعدادات الموجودة على القرص.

## مخرجات تتبّع الجلسة

استخدم `/trace` عندما تريد رؤية أسطر التتبّع/تصحيح الأخطاء المملوكة لـ Plugin في جلسة واحدة
بدون تشغيل الوضع المطوّل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات Plugin مثل ملخصات تصحيح أخطاء Active Memory.
استمر في استخدام `/verbose` لمخرجات الحالة/الأدوات المطوّلة العادية، واستمر في استخدام
`/debug` لتجاوزات إعدادات وقت التشغيل فقط.

## تتبّع دورة حياة Plugin

استخدم `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` عندما تبدو أوامر دورة حياة Plugin بطيئة
وتحتاج إلى تفصيل مراحل مضمّن لبيانات Plugin الوصفية، والاكتشاف، والسجل،
ومرآة وقت التشغيل، وتعديل الإعدادات، وأعمال التحديث. التتبّع اختياري ويكتب
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

استخدم هذا للتحقيق في دورة حياة Plugin قبل اللجوء إلى محلّل CPU.
إذا كان الأمر يعمل من نسخة مصدرية، ففضّل قياس وقت التشغيل المبني
باستخدام `node dist/entry.js ...` بعد `pnpm build`؛ يقيس `pnpm openclaw ...`
أيضاً حمل مشغّل المصدر.

## بدء تشغيل CLI وتحليل أداء الأوامر

استخدم معيار بدء التشغيل المحفوظ في المستودع عندما يبدو أمر ما بطيئاً:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

للتحليل لمرة واحدة عبر مشغّل المصدر العادي، عيّن
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

يضيف مشغّل المصدر أعلام ملف تعريف CPU في Node ويكتب ملف `.cpuprofile` للأمر.
استخدم هذا قبل إضافة أدوات قياس مؤقتة إلى كود الأمر.

## وضع مراقبة Gateway

للتكرار السريع، شغّل Gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

افتراضياً، يبدأ هذا جلسة tmux باسم
`openclaw-gateway-watch-main` أو يعيد تشغيلها (أو متغيراً خاصاً بالملف الشخصي/المنفذ مثل
`openclaw-gateway-watch-dev-19001`) ويلتحق بها تلقائياً من الطرفيات التفاعلية.
تبقى الصدفات غير التفاعلية، وCI، واستدعاءات تنفيذ الوكلاء منفصلة وتطبع تعليمات الالتحاق
بدلاً من ذلك. التحق يدوياً عند الحاجة:

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
# أو
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

عطّل الالتحاق التلقائي مع الإبقاء على إدارة tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

حلّل وقت CPU في Gateway المُراقَب عند تصحيح نقاط الاختناق في بدء التشغيل/وقت التشغيل:

```bash
pnpm gateway:watch --benchmark
```

يستهلك غلاف المراقبة `--benchmark` قبل استدعاء Gateway ويكتب
ملف V8 `.cpuprofile` واحداً لكل خروج لعملية Gateway فرعية تحت
`.artifacts/gateway-watch-profiles/`. أوقف Gateway المُراقَب أو أعد تشغيله
لتفريغ الملف الحالي، ثم افتحه باستخدام Chrome DevTools أو Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

استخدم `--benchmark-dir <path>` عندما تريد الملفات في مكان آخر.

ينقل غلاف tmux محددات وقت التشغيل الشائعة غير السرية مثل
`OPENCLAW_PROFILE`، و`OPENCLAW_CONFIG_PATH`، و`OPENCLAW_STATE_DIR`،
و`OPENCLAW_GATEWAY_PORT`، و`OPENCLAW_SKIP_CHANNELS` إلى الجزء. ضع
اعتمادات الموفّر في ملفك الشخصي/إعداداتك العادية، أو استخدم وضع المقدمة الخام
للأسرار المؤقتة لمرة واحدة.
كما يستخدم جزء tmux المُدار افتراضياً سجلات Gateway ملوّنة لتسهيل القراءة؛
عيّن `FORCE_COLOR=0` عند بدء `pnpm gateway:watch` لتعطيل مخرجات ANSI.

يعيد المراقب التشغيل عند تغيّر الملفات ذات الصلة بالبناء تحت `src/`، وملفات مصدر Plugin،
وبيانات `package.json` و`openclaw.plugin.json` الوصفية الخاصة بـ Plugin، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تغييرات بيانات Plugin الوصفية تعيد تشغيل
Gateway بدون فرض إعادة بناء `tsdown`؛ لا تزال تغييرات المصدر والإعدادات
تعيد بناء `dist` أولاً.

أضف أي أعلام CLI خاصة بـ Gateway بعد `gateway:watch` وسيتم تمريرها في
كل إعادة تشغيل. إعادة تشغيل أمر المراقبة نفسه تعيد إنشاء جزء tmux المسمّى، ولا يزال
المراقب الخام يحافظ على قفل المراقب الواحد بحيث تُستبدل عمليات المراقبة الأصلية المكررة
بدلاً من تراكمها.

## ملف dev الشخصي + Gateway dev (`--dev`)

استخدم ملف dev الشخصي لعزل الحالة وتشغيل إعداد آمن وقابل للتخلص منه
لتصحيح الأخطاء. هناك علمان **اثنان** باسم `--dev`:

- **`--dev` العالمي (الملف الشخصي):** يعزل الحالة تحت `~/.openclaw-dev` ويجعل
  منفذ Gateway الافتراضي `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`: يخبر Gateway بإنشاء إعداد افتراضي + مساحة عمل تلقائياً** عند غيابهما (وتجاوز BOOTSTRAP.md).

التدفق الموصى به (ملف dev الشخصي + تمهيد dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

إذا لم يكن لديك تثبيت عالمي بعد، فشغّل CLI عبر `pnpm openclaw ...`.

ما يفعله هذا:

1. **عزل الملف الشخصي** (`--dev` العالمي)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (يتحوّل المتصفح/canvas وفقاً لذلك)

2. **تمهيد dev** (`gateway --dev`)
   - يكتب إعدادات حدّية إذا كانت مفقودة (`gateway.mode=local`، وربط loopback).
   - يعيّن `agent.workspace` إلى مساحة عمل dev.
   - يعيّن `agent.skipBootstrap=true` (بدون BOOTSTRAP.md).
   - يزرع ملفات مساحة العمل إذا كانت مفقودة:
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - الهوية الافتراضية: **C3‑PO** (روبوت بروتوكول).
   - يتجاوز موفّري القنوات في وضع dev (`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة الضبط (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` هو علم ملف شخصي **عالمي** وتبتلعه بعض المشغّلات. إذا احتجت إلى كتابته صراحة، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

يمسح `--reset` الإعدادات، والاعتمادات، والجلسات، ومساحة عمل dev (باستخدام
`trash`، وليس `rm`)، ثم يعيد إنشاء إعداد dev الافتراضي.

<Tip>
إذا كان Gateway غير خاص بـ dev يعمل بالفعل (launchd أو systemd)، فأوقفه أولاً:

```bash
openclaw gateway stop
```

</Tip>

## تسجيل البث الخام (OpenClaw)

يمكن لـ OpenClaw تسجيل **بث المساعد الخام** قبل أي ترشيح/تنسيق.
هذه هي أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل كفروق نصية عادية
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

## تسجيل المقاطع الخام (pi-mono)

لالتقاط **مقاطع OpenAI-compat الخام** قبل تحليلها إلى كتل،
يوفّر pi-mono مسجّلاً منفصلاً:

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
> `openai-completions` في pi-mono.

## ملاحظات السلامة

- يمكن أن تتضمن سجلات البث الخام المطالبات الكاملة، ومخرجات الأدوات، وبيانات المستخدم.
- أبقِ السجلات محلية واحذفها بعد تصحيح الأخطاء.
- إذا شاركت السجلات، فاحذف الأسرار ومعلومات التعريف الشخصية أولاً.

## ذات صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
