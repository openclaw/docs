---
read_when:
    - تواجه مشكلات في الاتصال/المصادقة وتريد إصلاحات موجّهة
    - أجريت تحديثًا وتريد إجراء فحص سريع
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + الإصلاحات الموجّهة)
title: أداة التشخيص
x-i18n:
    generated_at: "2026-05-02T07:22:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

فحوصات صحة + إصلاحات سريعة لـ Gateway والقنوات.

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

- `--no-workspace-suggestions`: تعطيل اقتراحات ذاكرة مساحة العمل/البحث
- `--yes`: قبول الإعدادات الافتراضية دون مطالبة
- `--repair`: تطبيق إصلاحات غير خدمية موصى بها دون مطالبة؛ ما تزال عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك الكتابة فوق إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل دون مطالبات؛ الترحيلات الآمنة والإصلاحات غير الخدمية فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وتكوينه
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات سلسلة المفاتيح/OAuth) إلا عندما يكون stdin طرفية TTY ولا يكون `--non-interactive` مضبوطًا. ستتخطى عمليات التشغيل بلا واجهة (cron، Telegram، بلا طرفية) المطالبات.
- الأداء: تتخطى عمليات تشغيل `doctor` غير التفاعلية تحميل Plugin المبكر حتى تبقى فحوصات الصحة بلا واجهة سريعة. ما تزال الجلسات التفاعلية تحمّل Plugins بالكامل عندما يحتاج فحص إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعدادات غير المعروفة، مع سرد كل إزالة.
- يبلّغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغّل `openclaw gateway install` لخدمة مفقودة، أو `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل.
- تكتشف فحوصات سلامة الحالة الآن ملفات النصوص اليتيمة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ أما `--fix` و`--yes` وعمليات التشغيل بلا واجهة فتتركها في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تطبيعها تلقائيًا وقت التشغيل.
- على Linux، يحذّر Doctor عندما ما يزال crontab الخاص بالمستخدم يشغّل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت مُصانًا ويمكنه تسجيل انقطاعات وهمية في WhatsApp Gateway عندما يفتقر cron إلى بيئة ناقل مستخدم systemd.
- ينظف Doctor حالة تحضير تبعيات Plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح Plugins القابلة للتنزيل والمكوّنة المفقودة عندما يستطيع السجل حلّها.
- يصلح Doctor إعدادات Plugin القديمة عبر إزالة معرّفات Plugin المفقودة من `plugins.allow`/`plugins.entries`، إضافة إلى إعدادات القنوات المعلقة المطابقة، وأهداف Heartbeat، وتجاوزات نموذج القناة عندما يكون اكتشاف Plugin سليمًا.
- يعزل Doctor إعدادات Plugin غير الصالحة عبر تعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة الخاصة به. يتخطى بدء تشغيل Gateway ذلك Plugin السيئ فقط مسبقًا حتى تواصل Plugins والقنوات الأخرى العمل.
- اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف آخر مسؤولًا عن دورة حياة Gateway. ما يزال Doctor يبلّغ عن صحة Gateway/الخدمة ويطبق الإصلاحات غير الخدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل Doctor وحدات systemd غير النشطة الشبيهة بـ Gateway الإضافية ولا يعيد كتابة بيانات الأمر/نقطة الدخول الوصفية لخدمة Gateway عاملة بنظام systemd أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابهها) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات تشغيل `doctor --fix` المتكررة تبلّغ/تطبق تطبيع Talk عندما يكون الفرق الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد التضمين مفقودة.
- يحذّر Doctor عندما لا يكون مالك أوامر مكوّنًا. مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. يتيح اقتران الرسائل المباشرة لشخص ما التحدث إلى البوت فقط؛ إذا وافقت على مرسل قبل وجود تمهيد المالك الأول، فاضبط `commands.ownerAllowFrom` صراحة.
- يحذّر Doctor عندما تكون عوامل وضع Codex مكوّنة وتوجد أصول Codex CLI الشخصية في منزل Codex الخاص بالمشغّل. تستخدم عمليات إطلاق خادم تطبيق Codex المحلية منازل معزولة لكل عامل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي ينبغي ترقيتها عمدًا.
- إذا كان وضع الصندوق الرملي مفعّلًا لكن Docker غير متاح، يبلّغ Doctor عن تحذير عالي الدلالة مع علاج (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة بواسطة SecretRef وغير متاحة في مسار الأمر الحالي، يبلّغ Doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد احتياطية بنص عادي.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يواصل Doctor العمل ويبلّغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد ترحيلات دليل الحالة، يحذّر Doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية المفعّلة على احتياطي البيئة ويكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` غير متاح لعملية Doctor.
- يتطلب الحل التلقائي لاسم مستخدم `allowFrom` في Telegram (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلّغ Doctor عن تحذير ويتخطى الحل التلقائي في تلك الجولة.

## macOS: تجاوزات بيئة `launchctl`

إذا كنت قد شغّلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فستتجاوز تلك القيمة ملف إعداداتك ويمكن أن تسبب أخطاء “unauthorized” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
