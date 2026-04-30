---
read_when:
    - تواجه مشكلات في الاتصال/المصادقة وتريد إصلاحات موجهة
    - لقد حدّثت وتريد إجراء فحص صحة سريع
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + الإصلاحات الموجّهة)
title: أداة التشخيص
x-i18n:
    generated_at: "2026-04-30T07:47:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

فحوصات صحة + إصلاحات سريعة للـ Gateway والقنوات.

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
- `--non-interactive`: التشغيل دون مطالبات؛ للترحيلات الآمنة فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وتكوينه
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات سلسلة المفاتيح/OAuth) إلا عندما يكون stdin هو TTY ولم يتم ضبط `--non-interactive`. ستتخطى عمليات التشغيل دون واجهة طرفية (cron، Telegram، بلا طرفية) المطالبات.
- الأداء: تتخطى عمليات `doctor` غير التفاعلية تحميل Plugin المتلهف كي تبقى فحوصات الصحة دون واجهة طرفية سريعة. لا تزال الجلسات التفاعلية تحمّل Plugins بالكامل عندما يحتاج فحص ما إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعداد غير المعروفة، مع سرد كل عملية إزالة.
- تكتشف فحوصات سلامة الحالة الآن ملفات نصوص المحادثات اليتيمة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ أما `--fix` و`--yes` وعمليات التشغيل دون واجهة طرفية فتتركها في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تسويتها تلقائيًا أثناء وقت التشغيل.
- يصلح Doctor تبعيات وقت تشغيل Plugin المجمعة المفقودة دون الكتابة داخل التثبيتات العالمية المعلبة. بالنسبة إلى تثبيتات npm المملوكة للجذر أو وحدات systemd المقواة، اضبط `OPENCLAW_PLUGIN_STAGE_DIR` على دليل قابل للكتابة مثل `/var/lib/openclaw/plugin-runtime-deps`؛ ويمكن أن يكون أيضًا قائمة مسارات مثل `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`، حيث تكون الجذور السابقة طبقات بحث للقراءة فقط والجذر الأخير هو هدف الإصلاح.
- يصلح Doctor إعدادات Plugin القديمة بإزالة معرّفات Plugin المفقودة من `plugins.allow`/`plugins.entries`، بالإضافة إلى إعدادات القناة المتدلية المطابقة، وأهداف Heartbeat، وتجاوزات نماذج القنوات عندما يكون اكتشاف Plugin سليمًا.
- يعزل Doctor إعدادات Plugin غير الصالحة بتعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة الخاصة به. يتخطى بدء تشغيل Gateway أصلًا ذلك الـ Plugin السيئ فقط كي تتمكن Plugins والقنوات الأخرى من متابعة العمل.
- اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف آخر مالكًا لدورة حياة Gateway. لا يزال Doctor يبلّغ عن صحة Gateway/الخدمة ويطبق إصلاحات غير متعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمات القديمة.
- على Linux، يتجاهل doctor وحدات systemd الإضافية غير النشطة الشبيهة بالـ Gateway ولا يعيد كتابة بيانات الأمر/نقطة الدخول لخدمة Gateway systemd قيد التشغيل أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا إعداد Talk المسطح القديم (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات `doctor --fix` المتكررة تبلّغ/تطبق تسوية Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد التضمين مفقودة.
- يحذر Doctor عند عدم تكوين مالك للأوامر. مالك الأوامر هو حساب المشغل البشري المسموح له بتشغيل الأوامر المخصصة للمالك فقط والموافقة على الإجراءات الخطرة. الاقتران عبر الرسائل الخاصة يسمح فقط لشخص ما بالتحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود تمهيد المالك الأول، فاضبط `commands.ownerAllowFrom` صراحة.
- إذا كان وضع صندوق الرمل مفعّلًا لكن Docker غير متاح، يبلّغ doctor عن تحذير عالي الدلالة مع علاج (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، يبلّغ doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد بديلة بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يواصل doctor العمل ويبلّغ عن تحذير بدلًا من الخروج مبكرًا.
- يتطلب الحل التلقائي لاسم مستخدم Telegram `allowFrom` (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلّغ doctor عن تحذير ويتخطى الحل التلقائي في تلك الجولة.

## macOS: تجاوزات بيئة `launchctl`

إذا كنت قد شغّلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فستتجاوز تلك القيمة ملف الإعدادات لديك وقد تسبب أخطاء “غير مصرح” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
