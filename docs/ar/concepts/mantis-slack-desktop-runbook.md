---
read_when:
    - تشغيل اختبارات ضمان الجودة لسطح مكتب Mantis Slack من GitHub أو محليًا
    - تصحيح أخطاء عمليات تشغيل Mantis Slack البطيئة على سطح المكتب
    - اختيار وضع المصدر أو الوضع المُهيأ مسبقًا أو وضع التأجير الدافئ
    - نشر أدلة بلقطات شاشة وفيديو في طلب سحب
summary: 'دليل تشغيل للمشغّل لضمان جودة سطح مكتب Mantis Slack: تشغيل GitHub، وCLI المحلي، وحجوزات VNC الجاهزة، وأوضاع الترطيب، وتفسير التوقيت، والآثار، والتعامل مع الإخفاقات.'
title: دليل تشغيل Mantis Slack لسطح المكتب
x-i18n:
    generated_at: "2026-05-06T07:48:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA هو مسار واجهة المستخدم الحقيقية لأخطاء فئة Slack التي تحتاج إلى
سطح مكتب Linux، وإنقاذ عبر VNC، وSlack Web، وGateway حقيقي من OpenClaw، ولقطات شاشة،
وفيديوهات، وتعليق أدلة على PR.

استخدمه عندما لا تستطيع اختبارات الوحدة أو مسار Slack الحي عديم الواجهة إثبات الخطأ.

## نموذج التخزين

يستخدم Mantis ثلاث طبقات تخزين مختلفة:

- صورة المزوّد: يملكها Crabbox وتُخزَّن في حساب مزوّد السحابة.
  تحتوي على قدرات الجهاز مثل Chrome/Chromium، وffmpeg، وscrot،
  وNode/corepack/pnpm، وأدوات البناء الأصلية، ومجلدات تخزين مؤقت فارغة.
- حالة التأجير الدافئة: تملكها جلسة المشغّل الحالية. يمكن أن تحتوي على
  ملف تعريف متصفح مسجّل الدخول، و`/var/cache/crabbox/pnpm`، ونسخة مصدر جاهزة
  أثناء بقاء التأجير حيًا.
- آثار Mantis: تملكها عملية تشغيل OpenClaw. توجد تحت
  `.artifacts/qa-e2e/mantis/...`، ثم يرفعها GitHub Actions ويعلّق
  تطبيق Mantis GitHub App أدلة مضمنة على PR.

لا تضع أبدًا أسرارًا، أو ملفات تعريف ارتباط المتصفح، أو حالة تسجيل دخول Slack، أو نسخ المستودعات،
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
يستخدم بيانات اعتماد حية: أصل `main` الحالي، أو وسوم الإصدار، أو رأس PR مفتوح
من `openclaw/openclaw`.

يكتب سير العمل:

- الأثر المرفوع: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- تعليق PR مضمن من تطبيق Mantis GitHub App؛
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- سجلات بعيدة مثل `slack-desktop-command.log`، و`openclaw-gateway.log`،
  و`chrome.log`، و`ffmpeg.log`.

يُحدَّث تعليق PR في موضعه عبر العلامة المخفية
`<!-- mantis-slack-desktop-smoke -->`.

## CLI المحلية

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

أبقِ الآلة الافتراضية لإنقاذ VNC:

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
تحتوي مسبقًا على `node_modules` و`dist/` مبني. يفشل Mantis بإغلاق إذا كانت هذه
مفقودة.

## أوضاع التهيئة

| الوضع          | استخدمه عندما                                  | السلوك البعيد                                                                       | المفاضلة                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | إثبات PR عادي، أجهزة باردة، CI        | يشغّل `pnpm install --frozen-lockfile --prefer-offline` و`pnpm build` داخل الآلة الافتراضية | الأبطأ، وأقوى إثبات لنسخة مصدر                 |
| `prehydrated` | حضرتَ عمدًا تأجيرًا معاد استخدامه | يتطلب وجود `node_modules` و`dist/`؛ ويتخطى التثبيت/البناء                     | سريع، لكنه صالح فقط للتأجيرات الدافئة التي يتحكم بها المشغّل |

يحضّر GitHub Actions دائمًا نسخة المرشح قبل تشغيل الآلة الافتراضية. ويُخزَّن
مخزن pnpm مؤقتًا بحسب نظام التشغيل، وإصدار Node، وملف القفل. يستخدم تشغيل مصدر الآلة الافتراضية أيضًا
`/var/cache/crabbox/pnpm` عند وجوده.

## تفسير التوقيت

يتضمن `mantis-slack-desktop-smoke-report.md` توقيتات المراحل:

- `crabbox.warmup`: إقلاع مزوّد السحابة، وجاهزية سطح المكتب/المتصفح، وSSH.
- `crabbox.inspect`: البحث عن بيانات تعريف التأجير.
- `credentials.prepare`: الحصول على تأجير بيانات اعتماد Convex.
- `crabbox.remote_run`: المزامنة، وتشغيل المتصفح، وتثبيت/بناء OpenClaw أو
  التحقق من التهيئة، وبدء Gateway، ولقطة الشاشة، والتقاط الفيديو.
- `artifacts.copy`: النسخ عبر rsync من الآلة الافتراضية.

يمكن وسم `crabbox.remote_run` بأنه `accepted` عندما يعيد Crabbox حالة بعيدة غير صفرية
بعد أن ينسخ Mantis بيانات تعريف تثبت أن Gateway الخاص بـ OpenClaw
حي وأن الإعداد اكتمل. تعامل مع `accepted` كنجاح مع توضيح،
وليس كسيناريو فاشل.

إذا كان التشغيل بطيئًا:

- يهيمن warmup: اخبز مسبقًا أو رقِّ صورة مزوّد Crabbox أفضل؛
- يهيمن remote_run في `source`: استخدم تأجيرًا دافئًا، أو حسّن إعادة استخدام مخزن pnpm،
  أو انقل متطلبات الجهاز المسبقة إلى صورة المزوّد؛
- يهيمن remote_run في `prehydrated`: لم تكن مساحة العمل البعيدة
  جاهزة فعليًا، أو أن إعداد Gateway/المتصفح/Slack بطيء؛
- يهيمن نسخ الآثار: افحص حجم الفيديو ومحتويات مجلد الآثار.

## قائمة تدقيق الأدلة

ينبغي أن يعرض تعليق PR الجيد:

- معرّف السيناريو وSHA المرشح؛
- عنوان URL لتشغيل GitHub Actions؛
- عنوان URL للأثر؛
- لقطة شاشة مضمنة؛
- معاينة متحركة مضمنة عند توفرها؛
- روابط MP4 الكامل وMP4 المقتطع؛
- حالة النجاح/الفشل؛
- ملخص التوقيت في التقرير المرفق.

لا تلتزم بلقطات الشاشة أو الفيديوهات داخل المستودع. احتفظ بها في آثار GitHub
Actions أو تعليق PR.

## التعامل مع الفشل

إذا فشل سير العمل قبل تشغيل الآلة الافتراضية، فافحص مهمة Actions أولًا. الأسباب
المعتادة هي `candidate_ref` غير موثوق، أو أسرار بيئة مفقودة، أو فشل تثبيت/بناء المرشح.

إذا فشل تشغيل الآلة الافتراضية لكن لقطات الشاشة نُسخت عائدةً، فافحص:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

إذا أبقى التشغيل التأجير، فافتح VNC باستخدام أمر `crabbox vnc ...` الموجود في التقرير.
أوقف التأجير عند الانتهاء:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

إذا انتهت صلاحية تسجيل دخول Slack، فأصلحه في VNC على تأجير مُبقى عليه وأعد التشغيل باستخدام
`--lease-id`. لا تخبز ملف تعريف المتصفح هذا داخل صورة مزوّد.

## ذات صلة

- [نظرة عامة على QA](/ar/concepts/qa-e2e-automation)
- [قناة Slack](/ar/channels/slack)
- [الاختبار](/ar/help/testing)
