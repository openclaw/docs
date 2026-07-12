---
read_when:
    - تحتاج إلى فحص المخرجات الأولية للنموذج للتحقق من تسرّب الاستدلال
    - تريد تشغيل Gateway في وضع المراقبة أثناء إجراء التعديلات المتكررة
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، وتدفقات النموذج الخام، وتتبع تسرّب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-07-12T05:57:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

مساعدات تصحيح الأخطاء لإخراج البث، وتكرار Gateway، وتحليل أداء بدء التشغيل.

## تجاوزات تصحيح أخطاء وقت التشغيل

يضبط `/debug` تجاوزات إعدادات **خاصة بوقت التشغيل فقط** (في الذاكرة، لا على القرص). تكون معطلة افتراضيًا؛ فعّلها باستخدام `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يمسح `/debug reset` جميع التجاوزات ويعود إلى الإعدادات المخزنة على القرص.

## إخراج تتبّع الجلسة

يعرض `/trace` أسطر التتبّع/تصحيح الأخطاء التي يملكها Plugin لجلسة واحدة دون تفعيل الوضع المطوّل بالكامل. استخدمه لتشخيص Plugin مثل ملخصات تصحيح أخطاء Active Memory؛ واستخدم `/verbose` لإخراج الحالة/الأدوات المعتاد.

```text
/trace
/trace on
/trace off
```

## تتبّع دورة حياة Plugin

اضبط `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` للحصول على تفصيل مرحلة بمرحلة لبيانات Plugin الوصفية، والاكتشاف، والسجل، ونسخة وقت التشغيل، وتعديل الإعدادات، وأعمال التحديث. يُكتب الإخراج إلى stderr، لذلك يظل إخراج أوامر JSON قابلًا للتحليل.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

استخدم هذا قبل اللجوء إلى محلّل أداء وحدة المعالجة المركزية. من نسخة مصدرية مستنسخة، قِس وقت التشغيل المبني باستخدام `node dist/entry.js ...` بعد `pnpm build`؛ إذ يقيس `pnpm openclaw ...` أيضًا الحمل الإضافي لمشغّل المصدر.

## تحليل بدء تشغيل CLI والأوامر

معايير أداء بدء التشغيل المضمّنة في المستودع:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

لتحليل لمرة واحدة عبر مشغّل المصدر المعتاد، اضبط `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

يضيف مشغّل المصدر علامات تحليل وحدة المعالجة المركزية الخاصة بـ Node ويكتب ملف `.cpuprofile` للأمر. استخدم هذا قبل إضافة أدوات قياس مؤقتة إلى شيفرة الأمر.

عند حدوث توقفات في بدء التشغيل تبدو ناتجة عن عمل متزامن لنظام الملفات أو محمّل الوحدات، أضف علامة تتبّع الإدخال/الإخراج المتزامن الخاصة بـ Node عبر مشغّل المصدر:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

يترك `pnpm gateway:watch` هذه العلامة معطلة افتراضيًا لعملية Gateway الفرعية المراقبة؛ اضبط `OPENCLAW_TRACE_SYNC_IO=1` عندما تريد إخراج تتبّع الإدخال/الإخراج المتزامن في وضع المراقبة أيضًا.

## وضع مراقبة Gateway

```bash
pnpm gateway:watch
```

يبدأ هذا افتراضيًا جلسة tmux باسم `openclaw-gateway-watch-<profile>` أو يعيد تشغيلها (مثل `openclaw-gateway-watch-main`)، مع إضافة لاحقة للمنفذ مثل `openclaw-gateway-watch-dev-19001` فقط عندما يختلف `OPENCLAW_GATEWAY_PORT` عن المنفذ الافتراضي `18789`. ويتصل بها تلقائيًا من الطرفيات التفاعلية؛ أما أصداف الأوامر غير التفاعلية وCI واستدعاءات تنفيذ الوكيل فتبقى منفصلة وتطبع تعليمات الاتصال بدلًا من ذلك:

```bash
tmux attach -t openclaw-gateway-watch-main
```

تشغّل لوحة tmux المراقب الخام:

```bash
node scripts/watch-node.mjs gateway --force
```

أوقف خدمة Gateway المثبتة قبل مراقبة المنفذ نفسه:

```bash
pnpm openclaw gateway stop
```

يمسح الخيار `--force` الخاص بالمراقب المستمع الحالي، لكنه لا يعطّل خدمة خاضعة للإشراف. وإلا فقد تعيد خدمة launchd أو systemd أو Scheduled Task التشغيل وتحل محل Gateway المراقب.

وضع المقدمة دون tmux:

```bash
pnpm gateway:watch:raw
# أو
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

أبقِ إدارة tmux لكن عطّل الاتصال التلقائي:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

حلّل وقت وحدة المعالجة المركزية لـ Gateway المراقب عند تصحيح النقاط الساخنة في بدء التشغيل/وقت التشغيل:

```bash
pnpm gateway:watch --benchmark
```

يستهلك غلاف المراقبة `--benchmark` قبل استدعاء Gateway ويكتب ملف V8 واحدًا بامتداد `.cpuprofile` لكل خروج لعملية Gateway فرعية ضمن `.artifacts/gateway-watch-profiles/`. أوقف Gateway المراقب أو أعد تشغيله لكتابة ملف التعريف الحالي، ثم افتحه باستخدام Chrome DevTools أو Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: اكتب ملفات التعريف في مكان آخر.
- `--benchmark-no-force`: تخطَّ تنظيف المنفذ الافتراضي باستخدام `--force` وافشل فورًا إذا كان منفذ Gateway مستخدمًا بالفعل.

يكبت وضع قياس الأداء افتراضيًا الرسائل المتكررة لتتبّع الإدخال/الإخراج المتزامن. اضبط `OPENCLAW_TRACE_SYNC_IO=1` مع `--benchmark` للحصول على كل من ملفات تعريف وحدة المعالجة المركزية وتتبّعات مكدس الإدخال/الإخراج المتزامن؛ وفي وضع قياس الأداء، تذهب كتل التتبّع هذه إلى `gateway-watch-output.log` ضمن دليل قياس الأداء (بعد تصفيتها من لوحة الطرفية)، بينما تظل سجلات Gateway العادية مرئية.

ينقل غلاف tmux محددات وقت التشغيل الشائعة غير السرية إلى اللوحة، بما فيها `OPENCLAW_PROFILE` و`OPENCLAW_CONFIG_PATH` و`OPENCLAW_STATE_DIR` و`OPENCLAW_GATEWAY_PORT` و`OPENCLAW_SKIP_CHANNELS`. ضع بيانات اعتماد المزوّد في ملف التعريف/الإعدادات المعتاد، أو استخدم وضع المقدمة الخام للأسرار المؤقتة لمرة واحدة.

إذا خرج Gateway المراقب أثناء بدء التشغيل، يشغّل المراقب `openclaw doctor --fix --non-interactive` مرة واحدة ويعيد تشغيل عملية Gateway الفرعية. اضبط `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` لرؤية فشل بدء التشغيل الأصلي دون تمريرة الإصلاح الخاصة بالتطوير فقط.

تستخدم لوحة tmux المُدارة افتراضيًا سجلات Gateway ملوّنة؛ اضبط `FORCE_COLOR=0` عند بدء `pnpm gateway:watch` لتعطيل إخراج ANSI.

يعيد المراقب التشغيل عند تغيير الملفات ذات الصلة بالبناء ضمن `src/`، وملفات مصدر الامتدادات، وبيانات `package.json` و`openclaw.plugin.json` الوصفية للامتدادات، و`tsconfig.json`، و`package.json`، و`tsdown.config.ts`. تؤدي تغييرات البيانات الوصفية للامتدادات إلى إعادة تشغيل Gateway دون فرض إعادة بناء؛ بينما لا تزال تغييرات المصدر والإعدادات تعيد بناء `dist` أولًا.

أضف علامات CLI الخاصة بـ Gateway بعد `gateway:watch` وسيجري تمريرها في كل إعادة تشغيل. تؤدي إعادة تشغيل أمر المراقبة نفسه إلى إعادة إنشاء لوحة tmux المسماة؛ ويحافظ المراقب الخام على قفل لمراقب واحد، بحيث تُستبدل عمليات المراقبة الأصلية المكررة بدلًا من تراكمها.

## ملف تعريف التطوير + Gateway التطوير (`--dev`)

علامتا `--dev` **منفصلتان**:

- **`--dev` العامة (ملف التعريف):** تعزل الحالة ضمن `~/.openclaw-dev` وتضبط منفذ Gateway افتراضيًا على `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`:** تطلب من Gateway إنشاء إعدادات افتراضية + مساحة عمل تلقائيًا عند فقدانهما (وتخطي التهيئة الأولية).

التدفق الموصى به (ملف تعريف التطوير + تهيئة التطوير الأولية):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

من دون تثبيت عام، شغّل CLI عبر `pnpm openclaw ...`.

ما يفعله هذا:

1. **عزل ملف التعريف** (`--dev` العامة)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (تتحرك منافذ المتصفح/لوحة الرسم وفقًا لذلك)

2. **تهيئة التطوير الأولية** (`gateway --dev`)
   - يكتب إعدادات مصغّرة إذا كانت مفقودة (`gateway.mode=local`، والربط بـ local loopback).
   - يضبط `agents.defaults.workspace` على مساحة عمل التطوير و`agents.defaults.skipBootstrap=true`.
   - ينشئ ملفات مساحة العمل الأولية إذا كانت مفقودة: `AGENTS.md`، و`SOUL.md`، و`TOOLS.md`، و`IDENTITY.md`، و`USER.md`.
   - الهوية الافتراضية: **C3-PO** (روبوت بروتوكول).
   - يضبط `pnpm gateway:dev` أيضًا `OPENCLAW_SKIP_CHANNELS=1` لتخطي مزوّدي القنوات.

تدفق إعادة الضبط (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` علامة ملف تعريف **عامة** وتستهلكها بعض المشغّلات. إذا احتجت إلى تحديدها صراحةً، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

يمسح `--reset` الإعدادات وبيانات الاعتماد والجلسات ومساحة عمل التطوير (تُنقل إلى سلة المهملات، ولا تُحذف)، ثم يعيد إنشاء إعداد التطوير الافتراضي.

<Tip>
إذا كان Gateway غير مخصص للتطوير قيد التشغيل بالفعل (عبر launchd أو systemd)، فأوقفه أولًا:

```bash
openclaw gateway stop
```

</Tip>

## تسجيل البث الخام

يمكن لـ OpenClaw تسجيل **بث المساعد الخام** قبل أي تصفية/تنسيق. وهذه أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل على هيئة فروق نصية عادية (أو ككتل تفكير منفصلة).

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

الملف الافتراضي: `~/.openclaw/logs/raw-stream.jsonl`

## ملاحظات السلامة

- قد تتضمن سجلات البث الخام المطالبات الكاملة، وإخراج الأدوات، وبيانات المستخدم.
- احتفظ بالسجلات محليًا واحذفها بعد تصحيح الأخطاء.
- إذا شاركت السجلات، فاحذف منها الأسرار ومعلومات التعريف الشخصية أولًا.

## تصحيح الأخطاء في VSCode

خرائط المصدر مطلوبة لأن عملية البناء تُدخل تجزئة في أسماء الملفات المُنشأة. يستهدف ملف `launch.json` المضمّن خدمة Gateway:

1. **Rebuild and Debug Gateway** - يحذف `/dist` ويعيد البناء مع تفعيل تصحيح الأخطاء قبل بدء Gateway.
2. **Debug Gateway** - يصحح أخطاء بناء موجود دون المساس بـ `/dist`.

### الإعداد

1. افتح **Run and Debug** (شريط النشاط، أو `Ctrl`+`Shift`+`D`).
2. حدّد **Rebuild and Debug Gateway** واضغط **Start Debugging**.

لإدارة دورة البناء/تصحيح الأخطاء يدويًا بدلًا من ذلك:

1. فعّل خرائط المصدر في طرفية:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. أعد البناء: `pnpm clean:dist && pnpm build`
3. حدّد **Debug Gateway** واضغط **Start Debugging**.

عيّن نقاط توقف في ملفات TypeScript ضمن `src/`؛ ويربطها مصحح الأخطاء بملفات JavaScript المترجمة عبر خرائط المصدر.

### ملاحظات

- يحذف **Rebuild and Debug Gateway** الدليل `/dist` ويشغّل بناء `pnpm build` كاملًا مع خرائط المصدر عند كل تشغيل.
- يمكن بدء **Debug Gateway** وإيقافه دون التأثير في `/dist`، لكنك تدير دورة البناء في طرفية منفصلة.
- عدّل `args` في `launch.json` لتصحيح أخطاء أوامر CLI الفرعية الأخرى.
- لاستخدام CLI المبني لمهام أخرى (مثل `dashboard --no-open` إذا أنشأت جلسة تصحيح الأخطاء رمز مصادقة جديدًا)، شغّله من طرفية أخرى: `node ./openclaw.mjs` أو باستخدام اسم مستعار مثل `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## ذو صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
