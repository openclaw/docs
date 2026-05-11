---
read_when:
    - تواجه مشكلات في الاتصال/المصادقة وتريد إصلاحات موجّهة
    - أجريت تحديثًا وتريد إجراء تحقق سريع
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + الإصلاحات الموجّهة)
title: الفاحص
x-i18n:
    generated_at: "2026-05-11T20:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
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

لأذونات القنوات الخاصة، استخدم فحوصات القنوات بدلًا من `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

يعرض فحص إمكانات Discord الموجّه أذونات القناة الفعلية للبوت؛ ويفحص فحص الحالة قنوات Discord المكوّنة وأهداف الانضمام التلقائي للصوت.

## الخيارات

- `--no-workspace-suggestions`: تعطيل اقتراحات ذاكرة مساحة العمل/البحث
- `--yes`: قبول القيم الافتراضية من دون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها غير المتعلقة بالخدمة من دون مطالبة؛ لا تزال عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك استبدال تكوين الخدمة المخصص عند الحاجة
- `--non-interactive`: التشغيل من دون مطالبات؛ للترحيلات الآمنة والإصلاحات غير المتعلقة بالخدمة فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وتكوينه
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية والإبلاغ عن عمليات تسليم إعادة تشغيل مشرف Gateway الأخيرة

ملاحظات:

- في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تظل فحوصات doctor للقراءة فقط تعمل، لكن `doctor --fix` و`doctor --repair` و`doctor --yes` و`doctor --generate-gateway-token` تكون معطلة لأن `openclaw.json` غير قابل للتغيير. حرّر مصدر Nix لهذا التثبيت بدلًا من ذلك؛ وبالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) الذي يبدأ بالوكيل.
- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin طرفية TTY ولم يتم تعيين `--non-interactive`. ستتخطى عمليات التشغيل بلا واجهة (cron، Telegram، بلا طرفية) المطالبات.
- الأداء: تتخطى عمليات `doctor` غير التفاعلية تحميل Plugin المبكر حتى تبقى فحوصات الصحة بلا واجهة سريعة. لا تزال الجلسات التفاعلية تحمّل Plugins بالكامل عندما يحتاج الفحص إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح التكوين غير المعروفة، مع سرد كل إزالة.
- يبلغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة، لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغّل `openclaw gateway install` لخدمة مفقودة، أو `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل.
- تكتشف فحوصات سلامة الحالة الآن ملفات نصوص جلسات يتيمة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ وتتركها عمليات `--fix` و`--yes` والتشغيل بلا واجهة في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن صيغ مهام cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تطبيعها تلقائيًا في وقت التشغيل.
- على Linux، يحذّر doctor عندما لا يزال crontab الخاص بالمستخدم يشغّل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت مُصانًا ويمكنه تسجيل انقطاعات WhatsApp Gateway كاذبة عندما يفتقر cron إلى بيئة ناقل مستخدم systemd.
- عندما يكون WhatsApp مفعّلًا، يفحص doctor وجود حلقة أحداث Gateway متدهورة مع عملاء `openclaw-tui` المحليين الذين لا يزالون يعملون. يوقف `doctor --fix` عملاء TUI المحليين المتحقق منهم فقط حتى لا تُصفّ ردود WhatsApp خلف حلقات تحديث TUI القديمة.
- يعيد Doctor كتابة مراجع نماذج `openai-codex/*` القديمة إلى مراجع `openai/*` القياسية عبر النماذج الأساسية والاحتياطيات وتجاوزات heartbeat/subagent/compaction والخطافات وتجاوزات نماذج القنوات ودبابيس توجيه الجلسات القديمة. ينقل `--fix` نية Codex إلى إدخالات `agentRuntime.id: "codex"` محددة بنطاق المزوّد/النموذج، ويحافظ على دبابيس ملفات تعريف مصادقة الجلسة مثل `openai-codex:...`، ويزيل دبابيس وقت التشغيل القديمة للوكيل بالكامل/الجلسة، ويحافظ على مراجع وكلاء OpenAI المُصلحة على توجيه مصادقة Codex بدلًا من مصادقة مفتاح OpenAI API المباشرة.
- ينظّف Doctor حالة تمهيد تبعيات Plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح Plugins القابلة للتنزيل المفقودة المشار إليها في التكوين، مثل `plugins.entries` أو القنوات المكوّنة أو إعدادات المزوّد/البحث المكوّنة أو أوقات تشغيل الوكلاء المكوّنة. أثناء تحديثات الحزم، يتخطى doctor إصلاح Plugin عبر مدير الحزم حتى يكتمل تبديل الحزمة؛ أعد تشغيل `openclaw doctor --fix` بعد ذلك إذا كان Plugin مكوّن لا يزال يحتاج إلى استرداد. إذا فشل التنزيل، يبلغ doctor عن خطأ التثبيت ويحافظ على إدخال Plugin المكوّن لمحاولة الإصلاح التالية.
- يصلح Doctor تكوين Plugin القديم بإزالة معرّفات Plugin المفقودة من `plugins.allow`/`plugins.deny`/`plugins.entries`، إضافة إلى تكوين القنوات المعلّق المطابق وأهداف Heartbeat وتجاوزات نماذج القنوات عندما يكون اكتشاف Plugin سليمًا.
- يعزل Doctor تكوين Plugin غير الصالح بتعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة الخاصة به. يتخطى بدء تشغيل Gateway بالفعل Plugin السيئ فقط حتى تتمكن Plugins والقنوات الأخرى من متابعة العمل.
- عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف آخر مالكًا لدورة حياة Gateway. يستمر Doctor في الإبلاغ عن صحة Gateway/الخدمة وتطبيق الإصلاحات غير المتعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/bootstrap الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل doctor وحدات systemd الإضافية غير النشطة الشبيهة بـ Gateway ولا يعيد كتابة بيانات تعريف الأمر/نقطة الدخول لخدمة Gateway systemd قيد التشغيل أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا تكوين Talk المسطح القديم (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات `doctor --fix` المتكررة تبلغ/تطبّق تطبيع Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد التضمين مفقودة.
- يحذّر Doctor عندما لا يكون هناك مالك أوامر مكوّن. مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. لا تتيح مزاوجة الرسائل المباشرة إلا لشخص ما التحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود تهيئة المالك الأول، فاضبط `commands.ownerAllowFrom` صراحةً.
- يحذّر Doctor عندما تكون الوكلاء في وضع Codex مكوّنة وتوجد أصول Codex CLI شخصية في موطن Codex الخاص بالمشغّل. تستخدم عمليات تشغيل خادم تطبيق Codex المحلية مواطن معزولة لكل وكيل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي يجب ترقيتها عمدًا.
- يزيل Doctor المفتاح المتقاعد `plugins.entries.codex.config.codexDynamicToolsProfile`؛ يحافظ خادم تطبيق Codex دائمًا على أدوات مساحة العمل الأصلية في Codex أصلية.
- يحذّر Doctor عندما تكون Skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة وقت التشغيل الحالية لأن المتطلبات من binaries أو متغيرات البيئة أو التكوين أو نظام التشغيل مفقودة. يمكن لـ `doctor --fix` تعطيل تلك Skills غير المتاحة باستخدام `skills.entries.<skill>.enabled=false`؛ ثبّت/كوّن المتطلب المفقود بدلًا من ذلك عندما تريد إبقاء Skills نشطة.
- إذا كان وضع sandbox مفعّلًا لكن Docker غير متاح، يبلغ doctor عن تحذير عالي الدلالة مع معالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت ملفات سجل sandbox القديمة (`~/.openclaw/sandbox/containers.json` أو `~/.openclaw/sandbox/browsers.json`) موجودة، يبلغ doctor عنها؛ يرحّل `openclaw doctor --fix` الإدخالات الصالحة إلى أدلة سجل مجزأة ويعزل الملفات القديمة غير الصالحة.
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة بواسطة SecretRef وغير متاحة في مسار الأمر الحالي، يبلغ doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد احتياطية بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يواصل doctor العمل ويبلغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد ترحيلات دليل الحالة، يحذّر doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية المفعّلة على رجوع env وتكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` غير متاحة لعملية doctor.
- يتطلب التحليل التلقائي لاسم مستخدم `allowFrom` في Telegram (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلغ doctor عن تحذير ويتخطى التحليل التلقائي في تلك الجولة.

## macOS: تجاوزات env في `launchctl`

إذا سبق لك تشغيل `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن هذه القيمة تتجاوز ملف التكوين ويمكن أن تسبب أخطاء "غير مصرّح" مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Gateway doctor](/ar/gateway/doctor)
