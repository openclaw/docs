---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجهة
    - لقد حدّثت وتريد إجراء فحص سريع للتأكد
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + الإصلاحات الموجّهة)
title: الفحص التشخيصي
x-i18n:
    generated_at: "2026-05-10T19:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
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

لأذونات خاصة بالقنوات، استخدم فحوصات القناة بدلا من `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

يعرض فحص إمكانات Discord المستهدف أذونات القناة الفعلية للبوت؛ ويدقق فحص الحالة قنوات Discord المكونة وأهداف الانضمام التلقائي للصوت.

## الخيارات

- `--no-workspace-suggestions`: تعطيل اقتراحات ذاكرة/بحث مساحة العمل
- `--yes`: قبول الإعدادات الافتراضية دون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها غير الخاصة بالخدمة دون مطالبة؛ لا تزال عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدا تفاعليا أو أوامر Gateway صريحة
- `--fix`: اسم مستعار لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك استبدال إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل دون مطالبات؛ الترحيلات الآمنة والإصلاحات غير الخاصة بالخدمة فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وتكوينه
- `--deep`: فحص خدمات النظام بحثا عن عمليات تثبيت Gateway إضافية والإبلاغ عن عمليات تسليم إعادة تشغيل مشرف Gateway الحديثة

ملاحظات:

- في وضع Nix (`OPENCLAW_NIX_MODE=1`)، لا تزال فحوصات doctor للقراءة فقط تعمل، لكن `doctor --fix` و`doctor --repair` و`doctor --yes` و`doctor --generate-gateway-token` معطلة لأن `openclaw.json` غير قابل للتغيير. عدل مصدر Nix لهذا التثبيت بدلا من ذلك؛ وبالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) المعتمد على الوكيل أولا.
- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin هو TTY ولم يتم تعيين `--non-interactive`. ستتجاوز عمليات التشغيل دون واجهة (cron، Telegram، دون طرفية) المطالبات.
- الأداء: تتجاوز عمليات تشغيل `doctor` غير التفاعلية التحميل الاستباقي للـ Plugins حتى تبقى فحوصات السلامة دون واجهة سريعة. لا تزال الجلسات التفاعلية تحمل الـ Plugins بالكامل عندما يحتاج الفحص إلى مساهمتها.
- يكتب `--fix` (اسم مستعار لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعدادات غير المعروفة، مع سرد كل إزالة.
- يبلغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة، لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغل `openclaw gateway install` لخدمة مفقودة، أو `openclaw gateway install --force` عندما تريد عمدا استبدال المشغل.
- تكشف فحوصات سلامة الحالة الآن ملفات المحادثات اليتيمة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدا تفاعليا؛ بينما يتركها `--fix` و`--yes` وعمليات التشغيل دون واجهة في مكانها.
- يفحص Doctor أيضا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثا عن أشكال وظائف cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تطبيعها تلقائيا أثناء التشغيل.
- على Linux، يحذر doctor عندما لا يزال crontab الخاص بالمستخدم يشغل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت مصانا وقد يسجل انقطاعات Gateway WhatsApp كاذبة عندما يفتقر cron إلى بيئة ناقل مستخدم systemd.
- عندما يكون WhatsApp مفعلا، يتحقق doctor من وجود حلقة أحداث Gateway متدهورة مع استمرار تشغيل عملاء `openclaw-tui` المحليين. يوقف `doctor --fix` فقط عملاء TUI المحليين المتحقق منهم حتى لا تصطف ردود WhatsApp خلف حلقات تحديث TUI القديمة.
- يعيد Doctor كتابة مراجع النماذج القديمة `openai-codex/*` إلى مراجع `openai/*` القياسية عبر النماذج الأساسية، والبدائل، وتجاوزات Heartbeat/الوكيل الفرعي/Compaction، والخطافات، وتجاوزات نماذج القنوات، وتثبيتات مسارات الجلسات القديمة. ينقل `--fix` نية Codex إلى إدخالات `agentRuntime.id: "codex"` ذات نطاق المزود/النموذج، ويحافظ على تثبيتات auth-profile للجلسة مثل `openai-codex:...`، ويزيل تثبيتات وقت التشغيل القديمة للوكيل الكامل/الجلسة، ويبقي مراجع وكلاء OpenAI التي تم إصلاحها على توجيه مصادقة Codex بدلا من مصادقة مفتاح OpenAI API المباشرة.
- ينظف Doctor حالة تجهيز تبعيات Plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح الـ Plugins القابلة للتنزيل المفقودة التي تشير إليها الإعدادات، مثل `plugins.entries` أو القنوات المكونة أو إعدادات المزود/البحث المكونة أو أوقات تشغيل الوكلاء المكونة. أثناء تحديثات الحزم، يتجاوز doctor إصلاح Plugin عبر مدير الحزم حتى يكتمل تبديل الحزمة؛ أعد تشغيل `openclaw doctor --fix` بعد ذلك إذا ظل Plugin مكون بحاجة إلى استرداد. إذا فشل التنزيل، يبلغ doctor عن خطأ التثبيت ويحافظ على إدخال Plugin المكون لمحاولة الإصلاح التالية.
- يصلح Doctor إعدادات Plugin القديمة بإزالة معرفات Plugin المفقودة من `plugins.allow`/`plugins.entries`، إضافة إلى إعدادات القناة المعلقة المطابقة، وأهداف Heartbeat، وتجاوزات نماذج القنوات عندما يكون اكتشاف Plugin سليما.
- يعزل Doctor إعدادات Plugin غير الصالحة بتعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة الخاصة به. يتجاوز بدء تشغيل Gateway ذلك الـ Plugin السيئ فقط حتى تتمكن الـ Plugins والقنوات الأخرى من متابعة العمل.
- عين `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يشرف مشرف آخر على دورة حياة Gateway. لا يزال Doctor يبلغ عن سلامة Gateway/الخدمة ويطبق الإصلاحات غير الخاصة بالخدمة، لكنه يتجاوز تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمات القديمة.
- على Linux، يتجاهل doctor وحدات systemd الإضافية الشبيهة بـ Gateway غير النشطة ولا يعيد كتابة بيانات وصف الأمر/نقطة الدخول لخدمة Gateway systemd قيد التشغيل أثناء الإصلاح. أوقف الخدمة أولا أو استخدم `openclaw gateway install --force` عندما تريد عمدا استبدال المشغل النشط.
- يرحل Doctor تلقائيا إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات تشغيل `doctor --fix` المتكررة تبلغ عن/تطبق تطبيع Talk عندما يكون الفرق الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عند فقدان بيانات اعتماد التضمين.
- يحذر Doctor عندما لا يكون مالك الأوامر مكونا. مالك الأوامر هو حساب المشغل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. لا يسمح اقتران الرسائل المباشرة إلا لشخص ما بالتحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود تمهيد المالك الأول، فاضبط `commands.ownerAllowFrom` صراحة.
- يحذر Doctor عندما تكون وكلاء وضع Codex مكونة وتوجد أصول Codex CLI الشخصية في مسكن Codex الخاص بالمشغل. تستخدم عمليات تشغيل خادم تطبيق Codex المحلية مساكن معزولة لكل وكيل، لذلك استخدم `openclaw migrate codex --dry-run` لحصر الأصول التي يجب ترقيتها عمدا.
- يزيل Doctor المفتاح المتقاعد `plugins.entries.codex.config.codexDynamicToolsProfile`؛ يحافظ خادم تطبيق Codex دائما على أدوات مساحة العمل الأصلية لـ Codex بصورتها الأصلية.
- يحذر Doctor عندما تكون Skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة التشغيل الحالية بسبب فقدان ثنائيات أو متغيرات بيئة أو إعدادات أو متطلبات نظام تشغيل. يمكن لـ `doctor --fix` تعطيل تلك Skills غير المتاحة عبر `skills.entries.<skill>.enabled=false`؛ ثبت/كون المتطلب المفقود بدلا من ذلك عندما تريد إبقاء Skill نشطة.
- إذا كان وضع sandbox مفعلا لكن Docker غير متاح، يبلغ doctor عن تحذير عالي الإشارة مع معالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت ملفات سجل sandbox القديمة (`~/.openclaw/sandbox/containers.json` أو `~/.openclaw/sandbox/browsers.json`) موجودة، يبلغ doctor عنها؛ ويرحل `openclaw doctor --fix` الإدخالات الصالحة إلى أدلة سجل مجزأة ويعزل الملفات القديمة غير الصالحة.
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مدارة بواسطة SecretRef وغير متاحة في مسار الأمر الحالي، يبلغ doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد بديلة بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يتابع doctor ويبلغ عن تحذير بدلا من الخروج مبكرا.
- بعد ترحيلات دليل الحالة، يحذر doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية المفعلة على بديل env ولا يكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` متاحا لعملية doctor.
- يتطلب حل اسم مستخدم Telegram في `allowFrom` تلقائيا (`doctor --fix`) رمز Telegram قابلا للحل في مسار الأمر الحالي. إذا لم يكن فحص الرمز متاحا، يبلغ doctor عن تحذير ويتجاوز الحل التلقائي لتلك الجولة.

## macOS: تجاوزات env في `launchctl`

إذا شغلت سابقا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف إعداداتك وقد تسبب أخطاء "unauthorized" مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Gateway doctor](/ar/gateway/doctor)
