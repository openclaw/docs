---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجهة
    - لقد أجريتَ تحديثًا وتريد فحصًا سريعًا للتأكد
summary: مرجع CLI لـ `openclaw doctor` (فحوصات السلامة + الإصلاحات الموجَّهة)
title: التشخيص
x-i18n:
    generated_at: "2026-05-02T20:41:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
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

- `--no-workspace-suggestions`: تعطيل اقتراحات ذاكرة مساحة العمل/البحث
- `--yes`: قبول الافتراضيات بدون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها غير الخدمية بدون مطالبة؛ لا تزال عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم مستعار لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك استبدال إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل بدون مطالبات؛ الترحيلات الآمنة والإصلاحات غير الخدمية فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وتكوينه
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية

ملاحظات:

- تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) فقط عندما يكون stdin عبارة عن TTY ولم يتم تعيين `--non-interactive`. ستتجاوز عمليات التشغيل بلا واجهة (cron، Telegram، بدون طرفية) المطالبات.
- الأداء: تتجاوز عمليات تشغيل `doctor` غير التفاعلية التحميل المبكر لـ Plugin حتى تظل فحوصات الصحة بلا واجهة سريعة. لا تزال الجلسات التفاعلية تحمّل Plugin بالكامل عندما يحتاج الفحص إلى مساهمتها.
- يكتب `--fix` (اسم مستعار لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويسقط مفاتيح الإعدادات غير المعروفة، مع سرد كل إزالة.
- يبلغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغّل `openclaw gateway install` للخدمة المفقودة، أو `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل.
- تكتشف فحوصات سلامة الحالة الآن ملفات النصوص المتروكة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ تتركها عمليات `--fix` و`--yes` والتشغيل بلا واجهة في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تطبيعها تلقائيًا وقت التشغيل.
- على Linux، يحذر Doctor عندما لا يزال crontab الخاص بالمستخدم يشغّل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت مُصانًا ويمكنه تسجيل انقطاعات WhatsApp Gateway كاذبة عندما يفتقر cron إلى بيئة systemd user-bus.
- ينظف Doctor حالة تجهيز اعتماديات Plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح Plugin القابلة للتنزيل والمكوّنة المفقودة عندما يستطيع السجل حلّها، ويمرر Doctor في 2026.5.2 يثبّت تلقائيًا Plugin القابلة للتنزيل التي تستخدمها إعدادات أقدم بالفعل قبل وسم الإعدادات بأنها لُمست لذلك الإصدار.
- يصلح Doctor إعدادات Plugin القديمة بإزالة معرفات Plugin المفقودة من `plugins.allow`/`plugins.entries`، إضافةً إلى إعدادات القنوات المتدلية المطابقة، وأهداف Heartbeat، وتجاوزات نموذج القناة عندما يكون اكتشاف Plugin سليمًا.
- يعزل Doctor إعدادات Plugin غير الصالحة عن طريق تعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة الخاصة به. يتجاوز بدء تشغيل Gateway ذلك Plugin السيئ فقط بالفعل حتى تستمر Plugin والقنوات الأخرى في العمل.
- عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يمتلك مشرف آخر دورة حياة Gateway. لا يزال Doctor يبلغ عن صحة Gateway/الخدمة ويطبق الإصلاحات غير الخدمية، لكنه يتجاوز تثبيت/بدء/إعادة تشغيل/bootstrap الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل Doctor وحدات systemd الإضافية غير النشطة الشبيهة بـ Gateway ولا يعيد كتابة بيانات الأمر/نقطة الدخول الوصفية لخدمة Gateway عاملة عبر systemd أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات `doctor --fix` المتكررة تبلغ/تطبق تطبيع Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد التضمين مفقودة.
- يحذر Doctor عندما لا يكون مالك أوامر مكوّنًا. مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. لا يسمح إقران الرسائل المباشرة إلا لشخص ما بالتحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود bootstrap للمالك الأول، فعيّن `commands.ownerAllowFrom` صراحةً.
- يحذر Doctor عندما تكون وكلاء وضع Codex مكوّنة وتوجد أصول Codex CLI شخصية في موطن Codex الخاص بالمشغّل. تستخدم عمليات تشغيل خادم تطبيق Codex المحلية مواطن معزولة لكل وكيل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي ينبغي ترقيتها عمدًا.
- يحذر Doctor عندما تكون Skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة التشغيل الحالية لأن المتطلبات من bins أو متغيرات البيئة أو الإعدادات أو نظام التشغيل مفقودة. يمكن لـ `doctor --fix` تعطيل تلك Skills غير المتاحة باستخدام `skills.entries.<skill>.enabled=false`؛ ثبّت/كوّن المتطلب المفقود بدلًا من ذلك عندما تريد إبقاء Skill نشطة.
- إذا كان وضع sandbox ممكّنًا لكن Docker غير متاح، يبلغ Doctor عن تحذير عالي الإشارة مع معالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، يبلغ Doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد احتياطية بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يتابع Doctor ويبلغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد ترحيلات دليل الحالة، يحذر Doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية الممكّنة على احتياطي متغيرات البيئة ولا يكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` متاحًا لعملية Doctor.
- يتطلب الحل التلقائي لأسماء مستخدمي Telegram في `allowFrom` (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا لم يكن فحص الرمز متاحًا، يبلغ Doctor عن تحذير ويتجاوز الحل التلقائي لتلك الجولة.

## macOS: تجاوزات بيئة `launchctl`

إذا سبق أن شغّلت `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف الإعدادات لديك ويمكن أن تسبب أخطاء “غير مصرّح” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
