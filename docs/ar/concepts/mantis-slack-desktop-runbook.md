---
read_when:
    - تشغيل ضمان جودة سطح مكتب Mantis Slack من GitHub أو محليًا
    - تصحيح أخطاء بطء تشغيل Mantis على سطح مكتب Slack
    - اختيار وضع المصدر أو المهيأ مسبقًا أو عقد الإيجار الدافئ
    - نشر أدلة لقطات الشاشة والفيديو في PR
summary: 'دليل تشغيل المشغّل لاختبار ضمان الجودة لسطح مكتب Mantis Slack: الإرسال عبر GitHub، وCLI المحلي، وعقود VNC الدافئة، وأوضاع التهيئة، وتفسير التوقيت، والمُخرجات، والتعامل مع الإخفاقات.'
title: دليل تشغيل Mantis Slack لسطح المكتب
x-i18n:
    generated_at: "2026-06-27T17:29:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

مسار QA لسطح مكتب Mantis Slack هو مسار الواجهة الحقيقية للأخطاء من فئة Slack التي تحتاج إلى
سطح مكتب Linux، وإنقاذ VNC، وSlack Web، وGateway حقيقي من OpenClaw، ولقطات شاشة،
ومقاطع فيديو، وتعليق أدلة على PR.

استخدمه عندما لا تستطيع اختبارات الوحدة أو مسار Slack الحي عديم الواجهة إثبات الخطأ.

## نموذج التخزين

يستخدم Mantis ثلاث طبقات تخزين مختلفة:

- صورة المزوّد: يملكها Crabbox وتُخزَّن في حساب مزوّد السحابة.
  تحتوي على قدرات الجهاز مثل Chrome/Chromium، وffmpeg، وscrot،
  وNode/corepack/pnpm، وأدوات البناء الأصلية، وأدلة ذاكرة تخزين مؤقت فارغة.
- حالة التأجير الدافئة: تملكها جلسة المشغّل الحالية. يمكن أن تحتوي على
  ملف تعريف متصفح مسجّل الدخول، و`/var/cache/crabbox/pnpm`، ونسخة مصدر
  جاهزة ما دام التأجير حيًا.
- آثار Mantis: تملكها عملية تشغيل OpenClaw. توجد تحت
  `.artifacts/qa-e2e/mantis/...`، ثم ترفعها GitHub Actions ويعلّق
  Mantis GitHub App أدلة مضمّنة على PR.

لا تضع أبدًا الأسرار، أو ملفات تعريف ارتباط المتصفح، أو حالة تسجيل دخول Slack، أو نسخ المستودع،
أو `node_modules`، أو `dist/` داخل صورة مزوّد مخبوزة مسبقًا.

## إرسال GitHub

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

قيم `candidate_ref` المسموح بها ضيقة عمدًا لأن سير العمل
يستخدم بيانات اعتماد حية: نسب `main` الحالي، أو وسوم الإصدار، أو رأس PR مفتوح
من `openclaw/openclaw`.

يكتب سير العمل:

- الأثر المرفوع: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- تعليق PR مضمّن من Mantis GitHub App؛
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- سجلات بعيدة مثل `slack-desktop-command.log`، و`openclaw-gateway.log`،
  و`chrome.log`، و`ffmpeg.log`.

يُحدَّث تعليق PR في مكانه بواسطة العلامة المخفية
`<!-- mantis-slack-desktop-smoke -->`.

## CLI المحلي

إثبات مصدر بارد:

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

أبقِ VM لإنقاذ VNC:

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

أعد استخدام تأجير دافئ:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

استخدم `--hydrate-mode prehydrated` فقط عندما تكون مساحة العمل البعيدة المعاد استخدامها
تحتوي مسبقًا على `node_modules` و`dist/` مبني. يفشل Mantis بإغلاق آمن إذا كانت
هذه العناصر مفقودة.

أثبت واجهة موافقة Slack الأصلية:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

وضع نقطة تحقق الموافقة متنافي التفعيل مع `--gateway-setup`. يشغّل
سيناريوهي الاشتراك `slack-approval-exec-native` و`slack-approval-plugin-native`
ما لم تمرّر أعلام `--scenario` صريحة لنقطة تحقق الموافقة؛ تُرفض سيناريوهات
Slack الأخرى قبل بدء VM. يكتب مشغّل Slack QA
كل ملف JSON لنقطة تحقق من رسالة Slack API الحقيقية التي رصدها، ثم يعرض
المراقب البعيد لقطة الرسالة تلك في
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png`. تفشل عملية التشغيل إذا كان أي
JSON لنقطة تحقق، أو دليل رسالة، أو JSON إقرار، أو لقطة شاشة معروضة مفقودًا أو فارغًا.

لا تحتوي تأجيرات GitHub Actions الباردة على ملفات تعريف ارتباط Slack Web، لذلك يمكن أن
ينتهي التقاط المتصفح عند تسجيل دخول Slack. لإثبات نقطة تحقق الموافقة، ثق
بصور نقاط التحقق المعروضة وآثار Slack QA بدلًا من
`slack-desktop-smoke.png`. استخدم تأجيرًا دافئًا محفوظًا مع ملف تعريف Slack
Web مسجّل الدخول يدويًا فقط عندما يجب أن تُظهر لقطة شاشة المتصفح نفسها Slack Web.

## أوضاع التهيئة

| الوضع          | يُستخدم عندما                                  | السلوك البعيد                                                                       | المفاضلة                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | إثبات PR عادي، أجهزة باردة، CI        | يشغّل `pnpm install --frozen-lockfile --prefer-offline` و`pnpm build` داخل VM | الأبطأ، وأقوى إثبات لنسخة المصدر                 |
| `prehydrated` | أعددت تأجيرًا معاد استخدامه عمدًا | يتطلب `node_modules` و`dist/` موجودين؛ يتجاوز التثبيت/البناء                     | سريع، لكنه صالح فقط للتأجيرات الدافئة التي يتحكم بها المشغّل |

تُعد GitHub Actions دائمًا نسخة المرشح قبل تشغيل VM. ويُخزَّن
مخزن pnpm مؤقتًا حسب OS، وإصدار Node، وملف القفل. يستخدم تشغيل مصدر VM أيضًا
`/var/cache/crabbox/pnpm` عند وجوده.

## تفسير التوقيت

يتضمن `mantis-slack-desktop-smoke-report.md` توقيتات المراحل:

- `crabbox.warmup`: إقلاع مزوّد السحابة، وجاهزية سطح المكتب/المتصفح، وSSH.
- `crabbox.inspect`: بحث بيانات تعريف التأجير.
- `credentials.prepare`: الحصول على تأجير بيانات اعتماد Convex.
- `crabbox.remote_run`: المزامنة، وتشغيل المتصفح، وتثبيت/بناء OpenClaw أو
  التحقق من التهيئة، وبدء Gateway، ولقطة الشاشة، والتقاط الفيديو.
- `artifacts.copy`: النسخ عائدًا من VM عبر rsync.

يمكن وسم `crabbox.remote_run` بأنه `accepted` عندما يعيد Crabbox حالة بعيدة
غير صفرية بعد أن يكون Mantis قد نسخ بيانات تعريف تثبت أن إعداد OpenClaw
Gateway قد اكتمل أو أن أمر Slack QA نفسه خرج بنجاح.
تعامل مع `accepted` على أنه نجاح مع تفسير، وليس سيناريو فاشلًا.

إذا كان التشغيل بطيئًا:

- يهيمن warmup: اخبز مسبقًا أو رقِّ صورة مزوّد Crabbox أفضل؛
- يهيمن remote_run في `source`: استخدم تأجيرًا دافئًا، أو حسّن إعادة استخدام مخزن pnpm،
  أو انقل متطلبات الجهاز المسبقة إلى صورة المزوّد؛
- يهيمن remote_run في `prehydrated`: لم تكن مساحة العمل البعيدة جاهزة فعليًا،
  أو أن إعداد Gateway/المتصفح/Slack بطيء؛
- يهيمن نسخ الآثار: افحص حجم الفيديو ومحتويات دليل الآثار.

## قائمة تحقق الأدلة

يجب أن يُظهر تعليق PR الجيد:

- معرّف السيناريو وSHA المرشح؛
- عنوان URL لتشغيل GitHub Actions؛
- عنوان URL للأثر؛
- لقطة شاشة مضمنة لنقطة تحقق الموافقة، أو لقطة شاشة Slack Web من
  تأجير دافئ مسجّل الدخول؛
- معاينة متحركة مضمنة عند توفرها؛
- روابط MP4 الكامل وMP4 المقتطع؛
- حالة النجاح/الفشل؛
- ملخص التوقيت في التقرير المرفق.

لا تودع لقطات الشاشة أو مقاطع الفيديو في المستودع. أبقها في آثار GitHub
Actions أو تعليق PR.

## التعامل مع الفشل

إذا فشل سير العمل قبل تشغيل VM، فافحص مهمة Actions أولًا. الأسباب الشائعة
هي `candidate_ref` غير موثوق به، أو أسرار بيئة مفقودة، أو فشل تثبيت/بناء المرشح.

إذا فشل تشغيل VM لكن نُسخت لقطات الشاشة عائدة، فافحص:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

إذا أبقت عملية التشغيل التأجير، فافتح VNC باستخدام أمر `crabbox vnc ...` الموجود في التقرير.
أوقف التأجير عند الانتهاء:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

إذا انتهت صلاحية تسجيل دخول Slack، فأصلحه في VNC على تأجير محفوظ وأعد التشغيل باستخدام
`--lease-id`. لا تخبز ملف تعريف المتصفح ذلك داخل صورة مزوّد.

## ذات صلة

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation)
- [قناة Slack](/ar/channels/slack)
- [الاختبار](/ar/help/testing)
