---
read_when:
    - تواجه مشكلات في الاتصال/المصادقة وتريد إصلاحات موجّهة
    - لقد أجريت التحديث وتريد فحصًا سريعًا
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + الإصلاحات الموجّهة)
title: التشخيص
x-i18n:
    generated_at: "2026-05-04T02:23:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

فحوصات الصحة + إصلاحات سريعة لـ Gateway والقنوات.

ذات صلة:

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
- `--repair`: تطبيق إصلاحات غير خدمية موصى بها دون مطالبة؛ لا تزال عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات صارمة، بما في ذلك استبدال إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل دون مطالبات؛ للترحيلات الآمنة والإصلاحات غير الخدمية فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وإعداده
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin عبارة عن TTY ولم يتم تعيين `--non-interactive`. ستتخطى عمليات التشغيل بلا واجهة (cron، Telegram، بلا طرفية) المطالبات.
- الأداء: تتخطى عمليات تشغيل `doctor` غير التفاعلية التحميل الاستباقي لـ Plugin حتى تبقى فحوصات الصحة بلا واجهة سريعة. لا تزال الجلسات التفاعلية تحمّل Plugins بالكامل عندما يحتاج الفحص إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعدادات غير المعروفة، مع سرد كل إزالة.
- يبلغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة، لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغّل `openclaw gateway install` للخدمة المفقودة، أو `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل.
- تكتشف فحوصات سلامة الحالة الآن ملفات نصوص محادثة يتيمة في دليل الجلسات. تتطلب أرشفتها باسم `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ أما `--fix` و`--yes` وعمليات التشغيل بلا واجهة فتتركها في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام Cron القديمة، ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تطبيعها تلقائيًا وقت التشغيل.
- على Linux، يحذر Doctor عندما لا يزال crontab الخاص بالمستخدم يشغّل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت مُصانًا ويمكنه تسجيل انقطاعات WhatsApp Gateway زائفة عندما يفتقر Cron إلى بيئة systemd user-bus.
- ينظف Doctor حالة تجهيز تبعيات Plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح Plugins القابلة للتنزيل والمكوّنة المفقودة عندما يستطيع السجل حلّها، وتثبت تمريرة Doctor في 2026.5.2 تلقائيًا Plugins القابلة للتنزيل التي تستخدمها إعدادات أقدم بالفعل قبل وضع علامة على الإعدادات بأنها مُعدّلة لذلك الإصدار. إذا فشل التنزيل، يبلغ Doctor عن خطأ التثبيت ويحافظ على إدخال Plugin المكوّن لمحاولة الإصلاح التالية.
- يصلح Doctor إعدادات Plugin القديمة بإزالة معرفات Plugins المفقودة من `plugins.allow`/`plugins.entries`، إضافة إلى إعدادات القنوات المعلقة المطابقة، وأهداف Heartbeat، وتجاوزات نماذج القنوات عندما يكون اكتشاف Plugin سليمًا.
- يعزل Doctor إعدادات Plugin غير الصالحة بتعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة الخاصة به. يتخطى بدء تشغيل Gateway بالفعل ذلك Plugin السيئ فقط حتى تتمكن Plugins والقنوات الأخرى من متابعة العمل.
- عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف آخر مسؤولًا عن دورة حياة Gateway. يظل Doctor يبلغ عن صحة Gateway/الخدمة ويطبّق الإصلاحات غير الخدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمات القديمة.
- على Linux، يتجاهل Doctor وحدات systemd الإضافية غير النشطة الشبيهة بـ Gateway ولا يعيد كتابة بيانات تعريف الأمر/نقطة الدخول لخدمة Gateway systemd قيد التشغيل أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابهها) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات تشغيل `doctor --fix` المتكررة تبلغ عن/تطبق تطبيع Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد التضمين مفقودة.
- يحذر Doctor عندما لا يكون هناك مالك أوامر مكوّن. مالك الأوامر هو حساب المشغل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. يتيح إقران الرسائل المباشرة فقط لشخص ما التحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود تمهيد المالك الأول، فعيّن `commands.ownerAllowFrom` صراحةً.
- يحذر Doctor عندما تكون وكلاء وضع Codex مكوّنة وتوجد أصول Codex CLI شخصية في موطن Codex الخاص بالمشغل. تستخدم عمليات إطلاق خادم تطبيق Codex المحلي مواطن معزولة لكل وكيل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي ينبغي ترقيتها عمدًا.
- يحذر Doctor عندما تكون Skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة التشغيل الحالية لأن المتطلبات الخاصة بالملفات التنفيذية أو متغيرات البيئة أو الإعدادات أو نظام التشغيل مفقودة. يمكن لـ `doctor --fix` تعطيل تلك Skills غير المتاحة باستخدام `skills.entries.<skill>.enabled=false`؛ ثبّت/اضبط المتطلب المفقود بدلًا من ذلك عندما تريد إبقاء Skill نشطة.
- إذا كان وضع sandbox مفعّلًا لكن Docker غير متاح، يبلغ Doctor عن تحذير واضح عالي الدلالة مع طريقة معالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت ملفات سجل sandbox القديمة (`~/.openclaw/sandbox/containers.json` أو `~/.openclaw/sandbox/browsers.json`) موجودة، يبلغ Doctor عنها؛ ويرحّل `openclaw doctor --fix` الإدخالات الصالحة إلى أدلة سجلات مجزأة ويعزل الملفات القديمة غير الصالحة.
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة بواسطة SecretRef وغير متاحة في مسار الأمر الحالي، يبلغ Doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد احتياطية بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يتابع Doctor ويبلغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد ترحيلات دليل الحالة، يحذر Doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية المفعّلة على بديل متغيرات البيئة ويكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` غير متاح لعملية Doctor.
- يتطلب الحل التلقائي لاسم مستخدم Telegram `allowFrom` (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلغ Doctor عن تحذير ويتخطى الحل التلقائي لتلك التمريرة.

## macOS: تجاوزات بيئة `launchctl`

إذا سبق لك تشغيل `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف إعداداتك ويمكن أن تسبب أخطاء “unauthorized” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Gateway doctor](/ar/gateway/doctor)
