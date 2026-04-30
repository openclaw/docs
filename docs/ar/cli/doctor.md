---
read_when:
    - تواجه مشكلات في الاتصال/المصادقة وتريد إصلاحات موجَّهة
    - لقد أجريت تحديثًا وتريد إجراء فحص سريع
summary: مرجع CLI لـ `openclaw doctor` (فحوصات السلامة + الإصلاحات الموجّهة)
title: التشخيص
x-i18n:
    generated_at: "2026-04-30T20:05:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

فحوصات السلامة + إصلاحات سريعة لـ Gateway والقنوات.

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
- `--yes`: قبول الإعدادات الافتراضية دون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها دون مطالبة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك استبدال إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل دون مطالبات؛ عمليات ترحيل آمنة فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وتكوينه
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin هو TTY و**لم** يتم تعيين `--non-interactive`. ستتخطى عمليات التشغيل بلا واجهة (cron، Telegram، بلا طرفية) المطالبات.
- الأداء: تتخطى عمليات تشغيل `doctor` غير التفاعلية التحميل المبكر للـ plugin حتى تظل فحوصات السلامة بلا واجهة سريعة. لا تزال الجلسات التفاعلية تحمّل plugins بالكامل عندما يحتاج الفحص إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويسقط مفاتيح الإعدادات غير المعروفة، مع سرد كل إزالة.
- تكتشف فحوصات سلامة الحالة الآن ملفات النصوص اليتيمة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ وتتركها عمليات `--fix` و`--yes` والتشغيل بلا واجهة في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال وظائف cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدوِل إلى تطبيعها تلقائيًا في وقت التشغيل.
- يصلح Doctor تبعيات وقت تشغيل bundled plugin المفقودة دون الكتابة داخل التثبيتات العامة المعبأة. بالنسبة لتثبيتات npm المملوكة للجذر أو وحدات systemd المقواة، عيّن `OPENCLAW_PLUGIN_STAGE_DIR` إلى دليل قابل للكتابة مثل `/var/lib/openclaw/plugin-runtime-deps`؛ ويمكن أن يكون أيضًا قائمة مسارات مثل `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`، حيث تكون الجذور السابقة طبقات بحث للقراءة فقط والجذر النهائي هو هدف الإصلاح.
- يصلح Doctor إعدادات plugin القديمة بإزالة معرّفات plugin المفقودة من `plugins.allow`/`plugins.entries`، إضافةً إلى إعدادات القنوات المعلّقة المطابقة، وأهداف heartbeat، وتجاوزات نماذج القنوات عندما يكون اكتشاف plugin سليمًا.
- يعزل Doctor إعدادات plugin غير الصالحة بتعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة منه. يتخطى بدء تشغيل Gateway مسبقًا ذلك الـ plugin السيئ فقط حتى تتمكن plugins والقنوات الأخرى من الاستمرار في العمل.
- عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف آخر مالكًا لدورة حياة Gateway. يظل Doctor يبلغ عن سلامة Gateway/الخدمة ويطبق الإصلاحات غير المتعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل doctor وحدات systemd الإضافية الشبيهة بـ Gateway وغير النشطة، ولا يعيد كتابة بيانات تعريف الأمر/نقطة الدخول لخدمة Gateway systemd قيد التشغيل أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابهها) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات `doctor --fix` المتكررة تبلغ عن/تطبق تطبيع Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد embedding مفقودة.
- يحذر Doctor عندما لا يتم تكوين مالك للأوامر. مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل الأوامر المخصصة للمالك فقط والموافقة على الإجراءات الخطرة. لا يتيح إقران الرسائل الخاصة إلا لشخص ما التحدث إلى البوت؛ إذا كنت قد وافقت على مرسل قبل وجود تمهيد المالك الأول، فعيّن `commands.ownerAllowFrom` صراحةً.
- يحذر Doctor عندما تكون وكلاء وضع Codex مكوّنة وتوجد أصول Codex CLI شخصية في موطن Codex الخاص بالمشغّل. تستخدم عمليات تشغيل خادم تطبيق Codex المحلي مواطن معزولة لكل وكيل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي ينبغي ترقيتها عمدًا.
- إذا كان وضع sandbox مفعّلًا لكن Docker غير متاح، يبلغ doctor عن تحذير عالي الدلالة مع إجراء معالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة بواسطة SecretRef وغير متاحة في مسار الأمر الحالي، يبلغ doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد احتياطية بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يواصل doctor العمل ويبلغ عن تحذير بدلًا من الخروج مبكرًا.
- يتطلب الحل التلقائي لاسم مستخدم Telegram `allowFrom` ‏(`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا لم يكن فحص الرمز متاحًا، يبلغ doctor عن تحذير ويتخطى الحل التلقائي لتلك الجولة.

## macOS: تجاوزات بيئة `launchctl`

إذا شغّلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف إعداداتك وقد تسبب أخطاء “غير مصرح” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
