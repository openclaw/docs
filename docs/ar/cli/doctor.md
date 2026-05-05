---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجّهة
    - أجريت التحديث وتريد التحقق من سلامته
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الحالة + الإصلاحات الموجّهة)
title: أداة التشخيص
x-i18n:
    generated_at: "2026-05-05T01:44:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

فحوصات الصحة + إصلاحات سريعة للـ Gateway والقنوات.

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
- `--yes`: قبول القيم الافتراضية من دون مطالبة
- `--repair`: تطبيق إصلاحات غير خدمية موصى بها من دون مطالبة؛ لا تزال عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك استبدال إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل من دون مطالبات؛ للترحيلات الآمنة والإصلاحات غير الخدمية فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وإعداده
- `--deep`: فحص خدمات النظام بحثًا عن عمليات تثبيت Gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin طرفية TTY ولا يكون `--non-interactive` مضبوطًا. ستتجاوز عمليات التشغيل بلا واجهة (cron، Telegram، بلا طرفية) المطالبات.
- الأداء: تتجاوز عمليات تشغيل `doctor` غير التفاعلية التحميل الاستباقي للـ Plugin كي تبقى فحوصات الصحة بلا واجهة سريعة. لا تزال الجلسات التفاعلية تحمّل الـ plugins بالكامل عندما يحتاج الفحص إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعدادات غير المعروفة، مع سرد كل إزالة.
- يبلّغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغّل `openclaw gateway install` لخدمة مفقودة، أو `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل.
- أصبحت فحوصات سلامة الحالة ترصد الآن ملفات transcript اليتيمة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ يتركها `--fix` و`--yes` وعمليات التشغيل بلا واجهة في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة، ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تسويتها تلقائيًا وقت التشغيل.
- على Linux، يحذر doctor عندما يظل crontab الخاص بالمستخدم يشغّل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد ذلك السكربت مصانًا ويمكنه تسجيل انقطاعات WhatsApp Gateway كاذبة عندما يفتقر cron إلى بيئة systemd user-bus.
- ينظف Doctor حالة تجهيز تبعيات Plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح الـ plugins القابلة للتنزيل المفقودة والمشار إليها في الإعدادات، مثل `plugins.entries` أو القنوات المهيأة أو إعدادات provider/search المهيأة أو runtimes الوكلاء المهيأة. أثناء تحديثات الحزمة، يتجاوز doctor إصلاح Plugin عبر مدير الحزم إلى أن يكتمل تبديل الحزمة؛ أعد تشغيل `openclaw doctor --fix` بعد ذلك إذا كان Plugin مهيأ لا يزال يحتاج إلى استرداد. إذا فشل التنزيل، يبلّغ doctor عن خطأ التثبيت ويحافظ على إدخال Plugin المهيأ لمحاولة الإصلاح التالية.
- يصلح Doctor إعدادات Plugin القديمة بإزالة معرّفات Plugin المفقودة من `plugins.allow`/`plugins.entries`، إضافة إلى إعدادات القناة المعلقة المطابقة، وأهداف Heartbeat، وتجاوزات نموذج القناة عندما يكون اكتشاف Plugin سليمًا.
- يعزل Doctor إعدادات Plugin غير الصالحة عن طريق تعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة الخاصة به. يتجاوز بدء تشغيل Gateway ذلك الـ Plugin السيئ فقط بالفعل، بحيث يمكن للـ plugins والقنوات الأخرى الاستمرار في العمل.
- اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف آخر مالكًا لدورة حياة Gateway. لا يزال Doctor يبلّغ عن صحة Gateway/الخدمة ويطبق الإصلاحات غير الخدمية، لكنه يتجاوز تثبيت/بدء/إعادة تشغيل/bootstrap الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل doctor وحدات systemd غير النشطة الشبيهة بـ Gateway ولا يعيد كتابة بيانات command/entrypoint الوصفية لخدمة Gateway قيد التشغيل عبر systemd أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابهها) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات تشغيل `doctor --fix` المتكررة تبلّغ عن/تطبّق تسوية Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد embeddings مفقودة.
- يحذر Doctor عندما لا يكون أي مالك أوامر مهيأ. مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. لا تتيح إقرانات DM إلا التحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود bootstrap المالك الأول، فاضبط `commands.ownerAllowFrom` صراحة.
- يحذر Doctor عندما تكون وكلاء وضع Codex مهيأة وتوجد أصول Codex CLI شخصية في موطن Codex الخاص بالمشغّل. تستخدم عمليات تشغيل خادم تطبيق Codex المحلي مواطن معزولة لكل وكيل، لذلك استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي ينبغي ترقيتها عمدًا.
- يحذر Doctor عندما تكون skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة التشغيل الحالية بسبب فقدان bins أو env vars أو config أو متطلبات نظام التشغيل. يمكن لـ `doctor --fix` تعطيل تلك skills غير المتاحة باستخدام `skills.entries.<skill>.enabled=false`؛ ثبّت/هيّئ المتطلب المفقود بدلًا من ذلك عندما تريد إبقاء skill نشطة.
- إذا كان وضع sandbox مفعّلًا لكن Docker غير متاح، يبلّغ doctor بتحذير عالي الإشارة مع إجراء إصلاح (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت ملفات سجل sandbox القديمة (`~/.openclaw/sandbox/containers.json` أو `~/.openclaw/sandbox/browsers.json`) موجودة، يبلّغ doctor عنها؛ يرحّل `openclaw doctor --fix` الإدخالات الصالحة إلى دلائل سجل مجزأة ويعزل الملفات القديمة غير الصالحة.
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، يبلّغ doctor بتحذير للقراءة فقط ولا يكتب بيانات اعتماد بديلة بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يواصل doctor العمل ويبلّغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد ترحيلات دليل الحالة، يحذر doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية المفعّلة على env fallback ويكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` غير متاح لعملية doctor.
- يتطلب الحل التلقائي لأسماء مستخدمي Telegram في `allowFrom` (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلّغ doctor عن تحذير ويتجاوز الحل التلقائي في تلك الجولة.

## macOS: تجاوزات بيئة `launchctl`

إذا كنت قد شغّلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف الإعدادات لديك ويمكن أن تسبب أخطاء “غير مصرح” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
