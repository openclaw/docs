---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجهة
    - أجريتَ تحديثًا وتريد فحصًا سريعًا للتأكد
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + الإصلاحات الموجّهة)
title: التشخيص
x-i18n:
    generated_at: "2026-05-12T08:45:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
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

لأذونات خاصة بالقناة، استخدم فحوصات القنوات بدلًا من `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

يعرض فحص قدرات Discord الموجّه أذونات القناة الفعلية للبوت؛ ويدقق فحص الحالة قنوات Discord المكوّنة وأهداف الانضمام التلقائي إلى الصوت.

## الخيارات

- `--no-workspace-suggestions`: تعطيل اقتراحات ذاكرة/بحث مساحة العمل
- `--yes`: قبول القيم الافتراضية دون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها غير الخدمية دون مطالبة؛ ما تزال عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك استبدال إعداد الخدمة المخصص عند الحاجة
- `--non-interactive`: التشغيل دون مطالبات؛ عمليات الترحيل الآمنة والإصلاحات غير الخدمية فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وإعداده
- `--deep`: فحص خدمات النظام بحثًا عن عمليات تثبيت Gateway إضافية والإبلاغ عن عمليات تسليم إعادة تشغيل مشرف Gateway الحديثة

ملاحظات:

- في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تظل فحوصات doctor للقراءة فقط تعمل، لكن `doctor --fix` و`doctor --repair` و`doctor --yes` و`doctor --generate-gateway-token` تكون معطلة لأن `openclaw.json` غير قابل للتغيير. عدّل مصدر Nix لهذا التثبيت بدلًا من ذلك؛ وبالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) المعتمد على الوكيل أولًا.
- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin هو TTY ولا يكون `--non-interactive` مضبوطًا. ستتخطى عمليات التشغيل بلا واجهة (cron، Telegram، دون طرفية) المطالبات.
- الأداء: تتخطى عمليات تشغيل `doctor` غير التفاعلية التحميل المبكر للـ plugins حتى تظل فحوصات الصحة بلا واجهة سريعة. ما تزال الجلسات التفاعلية تحمّل الـ plugins بالكامل عندما يحتاج فحص ما إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعداد غير المعروفة، مع سرد كل إزالة.
- يبلّغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة، لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغّل `openclaw gateway install` للخدمة المفقودة، أو `openclaw gateway install --force` عندما تريد استبدال المشغّل عمدًا.
- تكتشف فحوصات سلامة الحالة الآن ملفات نصوص الجلسات اليتيمة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ وتتركها `--fix` و`--yes` وعمليات التشغيل بلا واجهة في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تطبيعها تلقائيًا وقت التشغيل.
- على Linux، يحذر doctor عندما يظل crontab الخاص بالمستخدم يشغّل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت مصانًا ويمكنه تسجيل انقطاعات WhatsApp Gateway كاذبة عندما يفتقر cron إلى بيئة systemd user-bus.
- عند تفعيل WhatsApp، يفحص doctor وجود حلقة أحداث Gateway متدهورة مع عملاء `openclaw-tui` المحليين الذين ما زالوا قيد التشغيل. يوقف `doctor --fix` عملاء TUI المحليين المتحقق منهم فقط حتى لا تصطف ردود WhatsApp خلف حلقات تحديث TUI قديمة.
- يعيد Doctor كتابة مراجع نماذج `openai-codex/*` القديمة إلى مراجع `openai/*` القياسية عبر النماذج الأساسية والبدائل وتجاوزات heartbeat/subagent/compaction والخطافات وتجاوزات نماذج القنوات ومثبتات مسارات الجلسات القديمة. ينقل `--fix` نية Codex إلى إدخالات `agentRuntime.id: "codex"` المحددة بنطاق الموفر/النموذج، ويحافظ على مثبتات ملفات تعريف مصادقة الجلسة مثل `openai-codex:...`، ويزيل مثبتات وقت تشغيل الوكيل الكامل/الجلسة القديمة، ويحافظ على مراجع وكلاء OpenAI التي تم إصلاحها على توجيه مصادقة Codex بدلًا من مصادقة مفتاح OpenAI API المباشرة.
- ينظف Doctor حالة تمهيد اعتماديات plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم، ويعيد ربط حزمة `openclaw` المضيفة للـ plugins المُدارة عبر npm التي تعلنها كاعتمادية نظيرة. كما يصلح الـ plugins القابلة للتنزيل المفقودة والمشار إليها في الإعداد، مثل `plugins.entries` أو القنوات المكوّنة أو إعدادات الموفر/البحث المكوّنة أو أوقات تشغيل الوكلاء المكوّنة. أثناء تحديثات الحزم، يتخطى doctor إصلاح plugins عبر مدير الحزم إلى أن يكتمل تبديل الحزمة؛ أعد تشغيل `openclaw doctor --fix` بعد ذلك إذا كان plugin مكوّن ما يزال يحتاج إلى استعادة. إذا فشل التنزيل، يبلّغ doctor عن خطأ التثبيت ويحافظ على إدخال plugin المكوّن لمحاولة الإصلاح التالية.
- يصلح Doctor إعداد plugin القديم بإزالة معرّفات plugins المفقودة من `plugins.allow`/`plugins.deny`/`plugins.entries`، بالإضافة إلى إعداد القناة المعلّق المطابق وأهداف heartbeat وتجاوزات نماذج القنوات عندما يكون اكتشاف plugins سليمًا.
- يعزل Doctor إعداد plugin غير الصالح بتعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة الخاصة به. يتخطى بدء تشغيل Gateway ذلك plugin السيئ فقط بالفعل حتى يمكن لبقية plugins والقنوات متابعة العمل.
- اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف آخر مالكًا لدورة حياة Gateway. يظل Doctor يبلّغ عن صحة Gateway/الخدمة ويطبق الإصلاحات غير الخدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل doctor وحدات systemd الإضافية غير النشطة الشبيهة بـ Gateway ولا يعيد كتابة بيانات تعريف الأمر/نقطة الدخول لخدمة Gateway systemd قيد التشغيل أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد استبدال المشغّل النشط عمدًا.
- يرحّل Doctor تلقائيًا إعداد Talk المسطح القديم (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات تشغيل `doctor --fix` المتكررة تبلّغ/تطبق تطبيع Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد التضمين مفقودة.
- يحذر Doctor عندما لا يكون مالك الأوامر مكوّنًا. مالك الأوامر هو حساب المشغل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطيرة. يتيح إقران الرسائل الخاصة فقط لشخص ما التحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود تمهيد المالك الأول، فاضبط `commands.ownerAllowFrom` صراحة.
- يحذر Doctor عندما تكون وكلاء وضع Codex مكوّنة وتوجد أصول Codex CLI شخصية في منزل Codex الخاص بالمشغل. تستخدم عمليات تشغيل خادم تطبيق Codex المحلية منازل معزولة لكل وكيل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي ينبغي ترقيتها عمدًا.
- يزيل Doctor المفتاح المتقاعد `plugins.entries.codex.config.codexDynamicToolsProfile`؛ يحافظ خادم تطبيق Codex دائمًا على أدوات مساحة عمل Codex الأصلية كأدوات أصلية.
- يحذر Doctor عندما تكون Skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة وقت التشغيل الحالية لأن المتطلبات الخاصة بالملفات التنفيذية أو متغيرات البيئة أو الإعداد أو نظام التشغيل مفقودة. يمكن لـ `doctor --fix` تعطيل تلك Skills غير المتاحة باستخدام `skills.entries.<skill>.enabled=false`؛ ثبّت/اضبط المتطلب المفقود بدلًا من ذلك عندما تريد إبقاء skill نشطة.
- إذا كان وضع sandbox مفعّلًا لكن Docker غير متاح، يبلّغ doctor عن تحذير عالي الإشارة مع المعالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت ملفات سجل sandbox القديمة (`~/.openclaw/sandbox/containers.json` أو `~/.openclaw/sandbox/browsers.json`) موجودة، يبلّغ عنها doctor؛ ويرحّل `openclaw doctor --fix` الإدخالات الصالحة إلى أدلة سجل مجزأة ويعزل الملفات القديمة غير الصالحة.
- إذا كان `gateway.auth.token`/`gateway.auth.password` مُدارين بواسطة SecretRef وغير متاحين في مسار الأمر الحالي، يبلّغ doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد بديلة بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، يواصل doctor العمل ويبلّغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد عمليات ترحيل دليل الحالة، يحذر doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية المفعّلة على بديل من البيئة ويكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` غير متاح لعملية doctor.
- يتطلب الحل التلقائي لأسماء مستخدمي `allowFrom` في Telegram (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلّغ doctor عن تحذير ويتخطى الحل التلقائي لتلك الجولة.

## macOS: تجاوزات بيئة `launchctl`

إذا شغّلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف الإعداد الخاص بك ويمكن أن تسبب أخطاء "غير مصرّح" مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Gateway doctor](/ar/gateway/doctor)
