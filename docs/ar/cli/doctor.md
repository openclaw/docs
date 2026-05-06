---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجهة
    - لقد أجريت تحديثًا وتريد التحقق من سلامته
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + الإصلاحات الموجّهة)
title: التشخيص
x-i18n:
    generated_at: "2026-05-06T07:45:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
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

- `--no-workspace-suggestions`: تعطيل اقتراحات ذاكرة/بحث مساحة العمل
- `--yes`: قبول الإعدادات الافتراضية بدون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها غير الخاصة بالخدمة بدون مطالبة؛ ما تزال عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم مستعار لـ `--repair`
- `--force`: تطبيق إصلاحات صارمة، بما في ذلك الكتابة فوق إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل بدون مطالبات؛ للترحيلات الآمنة والإصلاحات غير الخاصة بالخدمة فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وإعداده
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية والإبلاغ عن عمليات تسليم إعادة تشغيل مشرف Gateway الأخيرة

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات سلسلة المفاتيح/OAuth) إلا عندما يكون stdin عبارة عن TTY ولم يتم تعيين `--non-interactive`. ستتخطى عمليات التشغيل بلا واجهة (cron، Telegram، بدون طرفية) المطالبات.
- الأداء: تتخطى عمليات تشغيل `doctor` غير التفاعلية التحميل المبكر للـ plugins كي تبقى فحوصات الصحة بلا واجهة سريعة. ما تزال الجلسات التفاعلية تحمّل plugins بالكامل عندما يحتاج أحد الفحوصات إلى مساهمتها.
- يكتب `--fix` (الاسم المستعار لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعدادات غير المعروفة، مع سرد كل عملية إزالة.
- يبلغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة لكنه لا يثبتها ولا يعيد كتابتها خارج وضع إصلاح التحديث. شغّل `openclaw gateway install` لخدمة مفقودة، أو `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل.
- تكتشف فحوصات سلامة الحالة الآن ملفات النصوص المتروكة في دليل الجلسات. تتطلب أرشفتها بالصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ أما `--fix` و`--yes` وعمليات التشغيل بلا واجهة فتتركها في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تسويتها تلقائيًا وقت التشغيل.
- على Linux، يحذر Doctor عندما ما يزال crontab الخاص بالمستخدم يشغّل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت مُصانًا ويمكنه تسجيل انقطاعات كاذبة في Gateway الخاص بـ WhatsApp عندما يفتقر cron إلى بيئة ناقل مستخدم systemd.
- عند تمكين WhatsApp، يتحقق Doctor من وجود حلقة أحداث Gateway متدهورة مع بقاء عملاء `openclaw-tui` المحليين قيد التشغيل. يوقف `doctor --fix` فقط عملاء TUI المحليين المتحقق منهم كي لا تُصفّ ردود WhatsApp خلف حلقات تحديث TUI قديمة.
- يعيد Doctor كتابة مراجع نماذج `openai-codex/*` القديمة إلى مراجع `openai/*` القياسية عبر النماذج الأساسية، والبدائل الاحتياطية، وتجاوزات heartbeat/subagent/compaction، والخطافات، وتجاوزات نماذج القنوات، وتثبيتات مسارات الجلسات القديمة. يختار `--fix` القيمة `agentRuntime.id: "codex"` فقط عندما يكون Codex plugin مثبتًا وممكّنًا ويساهم بحزمة `codex` ولديه OAuth صالح للاستخدام؛ وإلا فإنه يختار `agentRuntime.id: "pi"` كي يبقى المسار على مشغّل OpenClaw الافتراضي.
- ينظف Doctor حالة تجهيز تبعيات plugins القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح plugins القابلة للتنزيل المفقودة والمشار إليها في الإعدادات، مثل `plugins.entries` أو القنوات المهيأة أو إعدادات المزوّد/البحث المهيأة أو أزمنة تشغيل الوكلاء المهيأة. أثناء تحديثات الحزمة، يتخطى Doctor إصلاح plugins عبر مدير الحزم حتى يكتمل تبديل الحزمة؛ أعد تشغيل `openclaw doctor --fix` بعد ذلك إذا كان plugin مهيأ ما يزال يحتاج إلى استرداد. إذا فشل التنزيل، يبلغ Doctor عن خطأ التثبيت ويحافظ على إدخال plugin المهيأ لمحاولة الإصلاح التالية.
- يصلح Doctor إعدادات plugins القديمة عبر إزالة معرفات plugins المفقودة من `plugins.allow`/`plugins.entries`، بالإضافة إلى إعدادات القنوات المعلقة المطابقة وأهداف Heartbeat وتجاوزات نماذج القنوات عندما يكون اكتشاف plugins سليمًا.
- يعزل Doctor إعدادات plugins غير الصالحة عبر تعطيل الإدخال المتأثر `plugins.entries.<id>` وإزالة حمولة `config` غير الصالحة الخاصة به. يتخطى بدء تشغيل Gateway بالفعل ذلك plugin السيئ فقط حتى يمكن لبقية plugins والقنوات متابعة التشغيل.
- عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يشرف مشرف آخر على دورة حياة Gateway. يظل Doctor يبلغ عن صحة Gateway/الخدمة ويطبق الإصلاحات غير الخاصة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل Doctor وحدات systemd الإضافية غير النشطة الشبيهة بـ Gateway ولا يعيد كتابة بيانات الأمر/نقطة الدخول الوصفية لخدمة Gateway systemd قيد التشغيل أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا إعداد Talk المسطح القديم (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات تشغيل `doctor --fix` المتكررة تبلغ عن/تطبق تسوية Talk عندما يكون الفرق الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه أن يوصي بـ `openclaw configure --section model` عندما تكون بيانات اعتماد التضمين مفقودة.
- يحذر Doctor عندما لا يكون أي مالك أوامر مهيأ. مالك الأوامر هو حساب المشغل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. لا تتيح إقرانات الرسائل المباشرة إلا لشخص ما التحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود تمهيد المالك الأول، فعيّن `commands.ownerAllowFrom` صراحة.
- يحذر Doctor عندما تكون وكلاء وضع Codex مهيأة وتوجد أصول Codex CLI شخصية في منزل Codex الخاص بالمشغل. تستخدم عمليات تشغيل خادم تطبيق Codex المحلي منازل معزولة لكل وكيل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي ينبغي ترقيتها عمدًا.
- يحذر Doctor عندما تكون Skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة التشغيل الحالية لأن الملفات التنفيذية أو متغيرات البيئة أو الإعدادات أو متطلبات نظام التشغيل مفقودة. يمكن لـ `doctor --fix` تعطيل تلك Skills غير المتاحة باستخدام `skills.entries.<skill>.enabled=false`؛ ثبّت/هيئ المتطلب المفقود بدلًا من ذلك عندما تريد إبقاء Skills نشطة.
- إذا كان وضع sandbox ممكّنًا لكن Docker غير متاح، يبلغ Doctor عن تحذير عالي الدلالة مع معالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت ملفات سجل sandbox القديمة (`~/.openclaw/sandbox/containers.json` أو `~/.openclaw/sandbox/browsers.json`) موجودة، يبلغ Doctor عنها؛ يرحّل `openclaw doctor --fix` الإدخالات الصالحة إلى أدلة سجل مجزأة ويعزل الملفات القديمة غير الصالحة.
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة بواسطة SecretRef وغير متاحة في مسار الأمر الحالي، يبلغ Doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد بديلة بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يواصل Doctor العمل ويبلغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد ترحيلات دليل الحالة، يحذر Doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية الممكنة على بديل env وتكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` غير متاحة لعملية Doctor.
- يتطلب حل اسم مستخدم Telegram في `allowFrom` تلقائيًا (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلغ Doctor عن تحذير ويتخطى الحل التلقائي لتلك الجولة.

## macOS: تجاوزات env في `launchctl`

إذا كنت قد شغّلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف الإعدادات الخاص بك ويمكن أن تسبب أخطاء “unauthorized” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
