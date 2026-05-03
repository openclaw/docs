---
read_when:
    - تواجه مشكلات في الاتصال/المصادقة وتريد إصلاحات موجّهة
    - لقد أجريت تحديثًا وتريد إجراء فحص سريع للتأكد
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الحالة الصحية + الإصلاحات الموجَّهة)
title: الفحص التشخيصي
x-i18n:
    generated_at: "2026-05-03T21:28:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

فحوصات السلامة + إصلاحات سريعة لـ Gateway والقنوات.

ذو صلة:

- استكشاف الأخطاء وإصلاحها: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- تدقيق الأمان: [الأمان](/ar/gateway/security)

## أمثلة

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## الخيارات

- `--no-workspace-suggestions`: تعطيل اقتراحات ذاكرة/بحث مساحة العمل
- `--yes`: قبول القيم الافتراضية دون مطالبة
- `--repair`: تطبيق إصلاحات غير خدمية موصى بها دون مطالبة؛ ما زالت عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات أكثر حزمًا، بما في ذلك استبدال إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل دون مطالبات؛ للترحيلات الآمنة والإصلاحات غير الخدمية فقط
- `--generate-gateway-token`: توليد رمز Gateway وإعداده
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin عبارة عن TTY ولا يكون `--non-interactive` مضبوطًا. ستتجاوز عمليات التشغيل بلا واجهة (cron، Telegram، دون طرفية) المطالبات.
- الأداء: تتجاوز عمليات تشغيل `doctor` غير التفاعلية تحميل Plugin المسبق حتى تبقى فحوصات السلامة بلا واجهة سريعة. لا تزال الجلسات التفاعلية تحمّل Plugins بالكامل عندما يحتاج الفحص إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويسقط مفاتيح الإعدادات غير المعروفة، مع سرد كل إزالة.
- يبلّغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة، لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغّل `openclaw gateway install` لخدمة مفقودة، أو `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل.
- تكتشف فحوصات سلامة الحالة الآن ملفات النصوص المتروكة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ أما `--fix` و`--yes` وعمليات التشغيل بلا واجهة فتتركها في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة، ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تسويتها تلقائيًا وقت التشغيل.
- على Linux، يحذر Doctor عندما لا يزال crontab الخاص بالمستخدم يشغّل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت مُصانًا ويمكنه تسجيل انقطاعات WhatsApp Gateway خاطئة عندما يفتقد cron بيئة systemd user-bus.
- ينظف Doctor حالة تجهيز تبعيات Plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح Plugins القابلة للتنزيل والمفقودة من الإعدادات عندما يستطيع السجل حلها، وتثبت تمريرة Doctor في 2026.5.2 تلقائيًا Plugins القابلة للتنزيل التي تستخدمها إعدادات أقدم بالفعل قبل وسم الإعدادات بأنها مُمَسّة لذلك الإصدار.
- يصلح Doctor إعدادات Plugin القديمة بإزالة معرّفات Plugin المفقودة من `plugins.allow`/`plugins.entries`، إضافة إلى إعدادات القناة المعلقة المطابقة، وأهداف Heartbeat، وتجاوزات نموذج القناة عندما يكون اكتشاف Plugin سليمًا.
- يعزل Doctor إعدادات Plugin غير الصالحة بتعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة. يتجاوز بدء تشغيل Gateway ذلك Plugin السيئ فقط، حتى تتمكن Plugins والقنوات الأخرى من الاستمرار في العمل.
- اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف آخر مالكًا لدورة حياة Gateway. يظل Doctor يبلّغ عن سلامة Gateway/الخدمة ويطبق الإصلاحات غير الخدمية، لكنه يتجاوز تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل Doctor وحدات systemd الإضافية غير النشطة الشبيهة بـ Gateway، ولا يعيد كتابة بيانات الأمر/نقطة الدخول الوصفية لخدمة Gateway عاملة تحت systemd أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا إعداد Talk المسطح القديم (`talk.voiceId` و`talk.modelId` وما شابههما) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات `doctor --fix` المتكررة تبلّغ/تطبق تسوية Talk عندما يكون الفرق الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد التضمين مفقودة.
- يحذر Doctor عندما لا يكون مالك أوامر مضبوطًا. مالك الأوامر هو حساب المشغل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. لا يتيح اقتران الرسائل المباشرة إلا لشخص ما التحدث إلى الروبوت؛ إذا وافقت على مرسل قبل وجود تمهيد المالك الأول، فاضبط `commands.ownerAllowFrom` صراحة.
- يحذر Doctor عندما تكون وكلاء وضع Codex مضبوطة وتوجد أصول Codex CLI شخصية في موطن Codex الخاص بالمشغل. تستخدم عمليات إطلاق خادم تطبيق Codex المحلي مواطن معزولة لكل وكيل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي ينبغي ترقيتها عمدًا.
- يحذر Doctor عندما تكون Skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة التشغيل الحالية لأن المتطلبات الخاصة بالملفات التنفيذية أو متغيرات البيئة أو الإعدادات أو نظام التشغيل مفقودة. يمكن لـ `doctor --fix` تعطيل تلك Skills غير المتاحة باستخدام `skills.entries.<skill>.enabled=false`؛ ثبّت/اضبط المتطلب المفقود بدلًا من ذلك عندما تريد إبقاء Skill نشطة.
- إذا كان وضع صندوق الرمل مفعّلًا لكن Docker غير متاح، يبلّغ Doctor عن تحذير عالي الدلالة مع معالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت ملفات سجل صندوق الرمل القديمة (`~/.openclaw/sandbox/containers.json` أو `~/.openclaw/sandbox/browsers.json`) موجودة، يبلّغ Doctor عنها؛ ويرحّل `openclaw doctor --fix` الإدخالات الصالحة إلى أدلة سجل مجزأة ويعزل الملفات القديمة غير الصالحة.
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، يبلّغ Doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد احتياطية بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يواصل Doctor العمل ويبلّغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد ترحيلات دليل الحالة، يحذر Doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية المفعلة على احتياطي متغيرات البيئة ويكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` غير متاح لعملية Doctor.
- يتطلب الحل التلقائي لاسم مستخدم Telegram في `allowFrom` (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلّغ Doctor عن تحذير ويتجاوز الحل التلقائي لتلك التمريرة.

## macOS: تجاوزات بيئة `launchctl`

إذا كنت قد شغلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف إعداداتك ويمكن أن تسبب أخطاء “غير مصرّح” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
