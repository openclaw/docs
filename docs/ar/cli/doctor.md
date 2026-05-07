---
read_when:
    - تواجه مشكلات في الاتصال/المصادقة وتريد إصلاحات موجّهة
    - أجريت تحديثًا وتريد فحصًا سريعًا للتأكد
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + الإصلاحات الموجّهة)
title: التشخيص
x-i18n:
    generated_at: "2026-05-07T13:14:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
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

لأذونات خاصة بالقنوات، استخدم فحوصات القنوات بدلًا من `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

يعرض فحص قدرات Discord المحدد أذونات القناة الفعلية للبوت؛ ويدقق فحص الحالة قنوات Discord المكونة وأهداف الانضمام التلقائي للصوت.

## الخيارات

- `--no-workspace-suggestions`: تعطيل اقتراحات ذاكرة مساحة العمل/البحث
- `--yes`: قبول الافتراضيات دون مطالبة
- `--repair`: تطبيق إصلاحات غير خدمية موصى بها دون مطالبة؛ لا تزال عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك استبدال إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل دون مطالبات؛ للترحيلات الآمنة والإصلاحات غير الخدمية فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وتكوينه
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية والإبلاغ عن عمليات تسليم إعادة تشغيل مشرف Gateway الحديثة

ملاحظات:

- في وضع Nix (`OPENCLAW_NIX_MODE=1`)، لا تزال فحوصات doctor للقراءة فقط تعمل، لكن `doctor --fix` و`doctor --repair` و`doctor --yes` و`doctor --generate-gateway-token` معطلة لأن `openclaw.json` غير قابل للتغيير. حرر مصدر Nix لهذا التثبيت بدلًا من ذلك؛ وبالنسبة إلى nix-openclaw، استخدم [البداية السريعة](https://github.com/openclaw/nix-openclaw#quick-start) التي تبدأ بالوكيل.
- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin هو TTY ولم يتم تعيين `--non-interactive`. ستتجاوز عمليات التشغيل بلا واجهة (cron، Telegram، دون طرفية) المطالبات.
- الأداء: تتخطى عمليات تشغيل `doctor` غير التفاعلية التحميل المتحمس للـ plugins حتى تبقى فحوصات الصحة بلا واجهة سريعة. لا تزال الجلسات التفاعلية تحمل plugins بالكامل عندما يحتاج فحص إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويسقط مفاتيح الإعدادات غير المعروفة، مع إدراج كل إزالة.
- يبلغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغل `openclaw gateway install` لخدمة مفقودة، أو `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغل.
- تكتشف فحوصات سلامة الحالة الآن ملفات النصوص اليتيمة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ تتركها عمليات `--fix` و`--yes` والتشغيل بلا واجهة في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تسويتها تلقائيًا وقت التشغيل.
- على Linux، يحذر doctor عندما لا يزال crontab الخاص بالمستخدم يشغل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت تتم صيانته ويمكنه تسجيل انقطاعات كاذبة لـ Gateway في WhatsApp عندما يفتقر cron إلى بيئة systemd user-bus.
- عند تمكين WhatsApp، يتحقق doctor من وجود حلقة أحداث Gateway متدهورة مع عملاء `openclaw-tui` المحليين ما زالوا يعملون. يوقف `doctor --fix` عملاء TUI المحليين المتحقق منهم فقط حتى لا تُصف ردود WhatsApp خلف حلقات تحديث TUI القديمة.
- يعيد Doctor كتابة مراجع نماذج `openai-codex/*` القديمة إلى مراجع `openai/*` القياسية عبر النماذج الأساسية والاحتياطيات وتجاوزات heartbeat/subagent/compaction والخطافات وتجاوزات نماذج القنوات ودبابيس مسارات الجلسات القديمة. يختار `--fix` قيمة `agentRuntime.id: "codex"` فقط عندما يكون Plugin Codex مثبتًا وممكنًا ويساهم بحزمة `codex` ولديه OAuth قابل للاستخدام؛ وإلا فإنه يختار `agentRuntime.id: "pi"` حتى يبقى المسار على مشغل OpenClaw الافتراضي.
- ينظف Doctor حالة تجهيز تبعيات plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح plugins القابلة للتنزيل المفقودة التي تشير إليها الإعدادات، مثل `plugins.entries` أو القنوات المكونة أو إعدادات المزود/البحث المكونة أو بيئات تشغيل الوكلاء المكونة. أثناء تحديثات الحزمة، يتخطى doctor إصلاح plugin عبر مدير الحزم حتى يكتمل تبديل الحزمة؛ أعد تشغيل `openclaw doctor --fix` بعد ذلك إذا كان plugin مكون لا يزال يحتاج إلى استرداد. إذا فشل التنزيل، يبلغ doctor عن خطأ التثبيت ويحافظ على إدخال plugin المكون لمحاولة الإصلاح التالية.
- يصلح Doctor إعدادات plugin القديمة عن طريق إزالة معرفات plugin المفقودة من `plugins.allow`/`plugins.entries`، إضافة إلى إعدادات القنوات المعلقة المطابقة وأهداف heartbeat وتجاوزات نماذج القنوات عندما يكون اكتشاف plugin سليمًا.
- يعزل Doctor إعدادات plugin غير الصالحة بتعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة. يتجاوز بدء تشغيل Gateway بالفعل ذلك plugin السيئ فقط حتى تتمكن plugins والقنوات الأخرى من الاستمرار في العمل.
- عين `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يملك مشرف آخر دورة حياة Gateway. لا يزال Doctor يبلغ عن صحة Gateway/الخدمة ويطبق الإصلاحات غير الخدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل doctor وحدات systemd غير النشطة الشبيهة بـ Gateway ولا يعيد كتابة بيانات تعريف الأمر/نقطة الدخول لخدمة Gateway عاملة عبر systemd أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغل النشط.
- يرحل Doctor تلقائيًا إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات تشغيل `doctor --fix` المتكررة تبلغ عن/تطبق تسوية Talk عندما يكون الفرق الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عند فقدان بيانات اعتماد التضمين.
- يحذر Doctor عند عدم تكوين مالك للأوامر. مالك الأوامر هو حساب المشغل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. لا يسمح اقتران الرسائل المباشرة إلا لشخص ما بالتحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود تمهيد أول مالك، فعيّن `commands.ownerAllowFrom` صراحة.
- يحذر Doctor عندما تكون وكلاء وضع Codex مكونة وتوجد أصول Codex CLI شخصية في موطن Codex الخاص بالمشغل. تستخدم عمليات تشغيل خادم تطبيق Codex المحلي مواطن معزولة لكل وكيل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي يجب ترقيتها عمدًا.
- يحذر Doctor عندما تكون Skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة التشغيل الحالية بسبب فقدان البرامج الثنائية أو متغيرات البيئة أو الإعدادات أو متطلبات نظام التشغيل. يمكن لـ `doctor --fix` تعطيل تلك Skills غير المتاحة باستخدام `skills.entries.<skill>.enabled=false`؛ ثبت/كون المتطلب المفقود بدلًا من ذلك عندما تريد إبقاء skill نشطة.
- إذا كان وضع sandbox ممكنًا لكن Docker غير متاح، يبلغ doctor عن تحذير عالي الدلالة مع المعالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت ملفات سجل sandbox القديمة (`~/.openclaw/sandbox/containers.json` أو `~/.openclaw/sandbox/browsers.json`) موجودة، يبلغ doctor عنها؛ ويرحل `openclaw doctor --fix` الإدخالات الصالحة إلى أدلة سجل مجزأة ويعزل الملفات القديمة غير الصالحة.
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، يبلغ doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد احتياطية بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يتابع doctor ويبلغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد ترحيلات دليل الحالة، يحذر doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية الممكنة على بديل متغيرات البيئة ولا يكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` متاحًا لعملية doctor.
- يتطلب حل أسماء مستخدمي `allowFrom` في Telegram تلقائيًا (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلغ doctor عن تحذير ويتخطى الحل التلقائي في تلك الجولة.

## macOS: تجاوزات بيئة `launchctl`

إذا شغلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف الإعدادات لديك وقد تسبب أخطاء "غير مصرح" مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor لـ Gateway](/ar/gateway/doctor)
