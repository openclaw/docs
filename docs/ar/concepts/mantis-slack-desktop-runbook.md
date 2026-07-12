---
read_when:
    - تشغيل اختبار ضمان الجودة لتطبيق Mantis المكتبي على Slack من GitHub أو محليًا
    - تصحيح بطء تشغيل Mantis على تطبيق Slack لسطح المكتب
    - اختيار وضع المصدر أو الوضع المُجهّز مسبقًا أو وضع التأجير الدافئ
    - نشر لقطات الشاشة ومقاطع الفيديو كأدلة في طلب سحب
summary: 'دليل تشغيل المشغّل لضمان جودة Mantis على تطبيق Slack لسطح المكتب: التشغيل عبر GitHub، وCLI المحلي، وجلسات VNC الدافئة، وأوضاع التهيئة، وتفسير التوقيت، والمخرجات، ومعالجة الإخفاقات.'
title: دليل تشغيل Mantis لتطبيق Slack لسطح المكتب
x-i18n:
    generated_at: "2026-07-12T05:47:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

مسار ضمان الجودة لسطح مكتب Slack في Mantis هو مسار واجهة المستخدم الفعلية للأخطاء من فئة Slack التي تتطلب
سطح مكتب Linux، واستعادة عبر VNC، وSlack Web، وGateway حقيقيًا لـ OpenClaw، ولقطات شاشة،
ومقاطع فيديو، وتعليق أدلة على طلب السحب. استخدمه عندما لا تتمكن اختبارات الوحدات أو مسار
Slack المباشر دون واجهة رسومية من إثبات الخطأ.

## نموذج التخزين

يستخدم Mantis ثلاث طبقات تخزين:

- **صورة المزوّد** - مملوكة لـ Crabbox ومخزّنة في حساب المزوّد السحابي.
  تحتوي على إمكانات الجهاز (Chrome/Chromium، وffmpeg، وscrot،
  وNode/corepack/pnpm، وأدوات البناء الأصلية) وأدلة ذاكرة تخزين مؤقت فارغة.
- **حالة مدة الاستخدام الدافئة** - مملوكة لجلسة المشغّل الحالية. يمكن أن تحتوي على
  ملف تعريف متصفح مسجّل الدخول، و`/var/cache/crabbox/pnpm`، ونسخة عمل مصدرية
  مُعَدّة ما دامت مدة الاستخدام نشطة.
- **عناصر Mantis الأثرية** - مملوكة لتشغيل OpenClaw. توجد ضمن
  `.artifacts/qa-e2e/mantis/...`؛ ترفعها GitHub Actions ويعلّق تطبيق Mantis
  على GitHub بأدلة مضمّنة في طلب السحب.

لا تضمّن مطلقًا الأسرار، أو ملفات تعريف ارتباط المتصفح، أو حالة تسجيل الدخول إلى Slack، أو نسخ عمل المستودع،
أو `node_modules`، أو `dist/` في صورة مزوّد.

## التشغيل من GitHub

شغّل سير العمل من `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

يخضع `candidate_ref` لقيود لأن سير العمل يستخدم بيانات اعتماد فعلية: إذ
يجب أن يُحل إلى سلف لـ `main` الحالي، أو وسم إصدار، أو رأس طلب سحب مفتوح في
`openclaw/openclaw`.

ينتج سير العمل:

- العنصر الأثري المرفوع `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- تعليقًا مضمّنًا في طلب السحب من تطبيق Mantis على GitHub
- `slack-desktop-smoke.png`، و`slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`، و`slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`، و`mantis-slack-desktop-smoke-report.md`
- سجلات بعيدة: `slack-desktop-command.log`، و`openclaw-gateway.log`، و`chrome.log`، و`ffmpeg.log`

يُحدَّث تعليق طلب السحب في موضعه عبر العلامة المخفية `<!-- mantis-slack-desktop-smoke -->`.

## CLI المحلي

إثبات بارد من المصدر:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

أبقِ الآلة الافتراضية للاستعادة عبر VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

افتح VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

أعد استخدام مدة استخدام دافئة:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

استخدم `--hydrate-mode prehydrated` فقط عندما تحتوي مساحة العمل البعيدة المُعاد استخدامها بالفعل
على `node_modules` ونسخة مبنية من `dist/`؛ وإلا يفشل Mantis بوضع مغلق.

أثبت واجهة الموافقة الأصلية في Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

يتنافى `--approval-checkpoints` مع `--gateway-setup`. ويشغّل
سيناريوهَي `slack-approval-exec-native` و`slack-approval-plugin-native`
الاختياريين ما لم تمرّر سيناريو نقطة تحقق للموافقة صريحًا عبر `--scenario`؛ وتُرفض
سيناريوهات Slack الأخرى قبل بدء الآلة الافتراضية. يكتب مشغّل ضمان الجودة في Slack
كل ملف JSON لنقطة تحقق استنادًا إلى رسالة Slack API الفعلية التي رصدها، ثم
يعرض المراقب البعيد تلك الرسالة في
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png`. يفشل التشغيل إذا كان أي
ملف JSON لنقطة تحقق، أو دليل رسالة، أو ملف JSON للإقرار، أو لقطة شاشة معروضة مفقودًا
أو فارغًا.

لا تحتوي مدد الاستخدام الباردة في GitHub Actions على ملفات تعريف ارتباط Slack Web، لذلك قد ينتهي التقاط
المتصفح عند شاشة تسجيل الدخول إلى Slack. لإثبات نقاط تحقق الموافقة، اعتمد على
صور نقاط التحقق المعروضة وعناصر ضمان الجودة في Slack بدلًا من
`slack-desktop-smoke.png`. لا تستخدم مدة استخدام دافئة مُبقاة مع ملف تعريف
Slack Web مسجّل الدخول يدويًا إلا عندما يجب أن تُظهر لقطة شاشة المتصفح نفسها
Slack Web.

## أوضاع التجهيز

| الوضع          | يُستخدم عندما                                  | السلوك البعيد                                                                       | المقايضة                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | إثبات طلب سحب عادي، وآلات باردة، وتكامل مستمر        | يشغّل `pnpm install --frozen-lockfile --prefer-offline` و`pnpm build` داخل الآلة الافتراضية | الأبطأ، وأقوى إثبات من نسخة العمل المصدرية                 |
| `prehydrated` | أعددت عمدًا مدة استخدام مُعاد استخدامها | يتطلب وجود `node_modules` و`dist/`؛ ويتخطى التثبيت/البناء                     | سريع، لكنه صالح فقط لمدد الاستخدام الدافئة التي يتحكم بها المشغّل |

تُعِد GitHub Actions دائمًا نسخة عمل المرشح قبل تشغيل الآلة الافتراضية. ويُخزَّن
مستودع pnpm مؤقتًا بحسب نظام التشغيل، وإصدار Node، وملف القفل. كما يعيد تشغيل
`source` في الآلة الافتراضية استخدام `/var/cache/crabbox/pnpm` عند وجوده.

## تفسير التوقيت

يتضمن `mantis-slack-desktop-smoke-report.md` توقيتات المراحل:

- `crabbox.warmup` - إقلاع المزوّد السحابي، وجاهزية سطح المكتب/المتصفح، وSSH.
- `crabbox.inspect` - البحث عن بيانات مدة الاستخدام الوصفية.
- `credentials.prepare` - الحصول على مدة استخدام بيانات الاعتماد من Convex.
- `crabbox.remote_run` - المزامنة، وتشغيل المتصفح، وتثبيت/بناء OpenClaw أو
  التحقق من التجهيز، وبدء Gateway، والتقاط لقطة الشاشة والفيديو.
- `artifacts.copy` - المزامنة العكسية عبر rsync من الآلة الافتراضية.

قد يعرض `crabbox.remote_run` الحالة `accepted` عندما يعيد Crabbox حالة بعيدة
غير صفرية، لكن Mantis نسخ بيانات وصفية تثبت إما اكتمال إعداد Gateway في OpenClaw
أو خروج أمر ضمان الجودة في Slack نفسه بنجاح. تعامل مع
`accepted` على أنه نجاح مصحوب بتفسير، لا سيناريو فاشلًا.

إذا كان التشغيل بطيئًا:

- تهيمن مرحلة الإحماء: أنشئ مسبقًا أو روّج صورة مزوّد Crabbox أفضل.
- تهيمن `remote_run` في وضع `source`: استخدم مدة استخدام دافئة، أو حسّن إعادة استخدام مستودع pnpm،
  أو انقل متطلبات الجهاز المسبقة إلى صورة المزوّد.
- تهيمن `remote_run` في وضع `prehydrated`: مساحة العمل البعيدة لم تكن
  جاهزة فعليًا، أو أن إعداد Gateway/المتصفح/Slack بطيء.
- تهيمن عملية نسخ العناصر الأثرية: افحص حجم الفيديو ومحتويات دليل العناصر الأثرية.

## قائمة تحقق الأدلة

يعرض تعليق طلب السحب الجيد:

- معرّف السيناريو وSHA المرشح
- عنوان URL لتشغيل GitHub Actions وعنوان URL للعنصر الأثري
- لقطة شاشة مضمّنة لنقطة تحقق الموافقة، أو لقطة شاشة لـ Slack Web من
  مدة استخدام دافئة مسجّل الدخول فيها
- معاينة متحركة مضمّنة عند توفرها
- روابط ملف MP4 الكامل وملف MP4 المشذّب
- حالة النجاح/الفشل وملخص توقيت التقرير

لا تُضمّن لقطات الشاشة أو مقاطع الفيديو في المستودع. احتفظ بها ضمن عناصر
GitHub Actions الأثرية أو تعليق طلب السحب.

## معالجة الإخفاقات

إذا فشل سير العمل قبل تشغيل الآلة الافتراضية، فافحص مهمة Actions أولًا.
تشمل الأسباب المعتادة: `candidate_ref` غير موثوق، أو أسرار البيئة المفقودة، أو
فشل تثبيت/بناء المرشح.

إذا فشل تشغيل الآلة الافتراضية لكن نُسخت لقطات الشاشة، فافحص:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

إذا أبقى التشغيل مدة الاستخدام، فافتح VNC باستخدام أمر `crabbox vnc ...`
الوارد في التقرير، ثم أوقف مدة الاستخدام عند الانتهاء:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

إذا انتهت صلاحية تسجيل الدخول إلى Slack، فأصلحه عبر VNC في مدة استخدام مُبقاة وأعد التشغيل باستخدام
`--lease-id`. لا تضمّن ملف تعريف المتصفح هذا في صورة مزوّد.

## ذو صلة

- [نظرة عامة على ضمان الجودة](/ar/concepts/qa-e2e-automation)
- [قناة Slack](/ar/channels/slack)
- [الاختبار](/ar/help/testing)
