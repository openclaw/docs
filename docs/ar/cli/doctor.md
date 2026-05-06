---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجّهة
    - لقد أجريت تحديثًا وتريد فحصًا سريعًا للتأكد
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + الإصلاحات الموجّهة)
title: الفحص التشخيصي
x-i18n:
    generated_at: "2026-05-06T17:53:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
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
- `--repair`: تطبيق الإصلاحات الموصى بها غير المتعلقة بالخدمات دون مطالبة؛ ما زالت عمليات تثبيت خدمة Gateway وإعادة كتابتها تتطلب تأكيدًا تفاعليًا أو أوامر Gateway صريحة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك الكتابة فوق إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل دون مطالبات؛ للترحيلات الآمنة والإصلاحات غير المتعلقة بالخدمات فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وتكوينه
- `--deep`: فحص خدمات النظام بحثًا عن عمليات تثبيت Gateway إضافية والإبلاغ عن عمليات تسليم إعادة تشغيل مشرف Gateway الأخيرة

ملاحظات:

- في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تظل فحوصات doctor للقراءة فقط تعمل، لكن `doctor --fix` و`doctor --repair` و`doctor --yes` و`doctor --generate-gateway-token` معطلة لأن `openclaw.json` غير قابل للتغيير. حرّر مصدر Nix لهذا التثبيت بدلًا من ذلك؛ بالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) ذي الأولوية للوكيل.
- لا تعمل المطالبات التفاعلية (مثل إصلاحات سلسلة المفاتيح/OAuth) إلا عندما يكون stdin طرفية TTY ولم يتم تعيين `--non-interactive`. ستتجاوز عمليات التشغيل دون واجهة (cron، Telegram، بلا طرفية) المطالبات.
- الأداء: تتخطى عمليات تشغيل `doctor` غير التفاعلية تحميل Plugin المسبق حتى تبقى فحوصات السلامة دون واجهة سريعة. لا تزال الجلسات التفاعلية تحمّل Plugins بالكامل عندما يحتاج الفحص إلى مساهمتها.
- يكتب `--fix` (اسم بديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعدادات غير المعروفة، مع سرد كل إزالة.
- يبلّغ `doctor --fix --non-interactive` عن تعريفات خدمة Gateway المفقودة أو القديمة لكنه لا يثبتها أو يعيد كتابتها خارج وضع إصلاح التحديث. شغّل `openclaw gateway install` لخدمة مفقودة، أو `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل.
- تكتشف فحوصات سلامة الحالة الآن ملفات النصوص المتروكة في دليل الجلسات. تتطلب أرشفتها بصيغة `.deleted.<timestamp>` تأكيدًا تفاعليًا؛ يتركها `--fix` و`--yes` وعمليات التشغيل دون واجهة في مكانها.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدوِل إلى تسويتها تلقائيًا وقت التشغيل.
- على Linux، يحذر doctor عندما لا يزال crontab الخاص بالمستخدم يشغّل `~/.openclaw/bin/ensure-whatsapp.sh` القديم؛ لم يعد هذا السكربت مُصانًا ويمكنه تسجيل انقطاعات WhatsApp Gateway كاذبة عندما يفتقر cron إلى بيئة ناقل مستخدم systemd.
- عندما يكون WhatsApp مفعّلًا، يتحقق doctor من وجود حلقة أحداث Gateway متدهورة مع استمرار عمل عملاء `openclaw-tui` المحليين. يوقف `doctor --fix` فقط عملاء TUI المحليين المتحقق منهم حتى لا تُصفّ ردود WhatsApp خلف حلقات تحديث TUI قديمة.
- يعيد Doctor كتابة مراجع نماذج `openai-codex/*` القديمة إلى مراجع `openai/*` القياسية عبر النماذج الأساسية، والاحتياطيات، وتجاوزات heartbeat/الوكيل الفرعي/compaction، والخطافات، وتجاوزات نماذج القنوات، ودبابيس مسارات الجلسات القديمة. يختار `--fix` قيمة `agentRuntime.id: "codex"` فقط عندما يكون Codex plugin مثبتًا ومفعّلًا ويساهم بحزام `codex` ولديه OAuth صالح للاستخدام؛ وإلا فإنه يختار `agentRuntime.id: "pi"` حتى يبقى المسار على مشغّل OpenClaw الافتراضي.
- ينظف Doctor حالة تحضير اعتماديات Plugin القديمة التي أنشأتها إصدارات OpenClaw الأقدم. كما يصلح Plugins القابلة للتنزيل المفقودة والمشار إليها في الإعدادات، مثل `plugins.entries` أو القنوات المكوّنة أو إعدادات المزوّد/البحث المكوّنة أو أزمنة تشغيل الوكلاء المكوّنة. أثناء تحديثات الحزمة، يتخطى doctor إصلاح Plugin الخاص بمدير الحزم حتى يكتمل استبدال الحزمة؛ أعد تشغيل `openclaw doctor --fix` بعد ذلك إذا ظل Plugin مكوّن يحتاج إلى استرداد. إذا فشل التنزيل، يبلّغ doctor عن خطأ التثبيت ويحافظ على إدخال Plugin المكوّن لمحاولة الإصلاح التالية.
- يصلح Doctor إعدادات Plugin القديمة بإزالة معرّفات Plugin المفقودة من `plugins.allow`/`plugins.entries`، إضافة إلى إعدادات القنوات المتدلية المطابقة، وأهداف Heartbeat، وتجاوزات نماذج القنوات عندما يكون اكتشاف Plugin سليمًا.
- يعزل Doctor إعدادات Plugin غير الصالحة بتعطيل إدخال `plugins.entries.<id>` المتأثر وإزالة حمولة `config` غير الصالحة الخاصة به. يتجاوز بدء تشغيل Gateway بالفعل ذلك Plugin السيئ فقط حتى تتمكن Plugins والقنوات الأخرى من الاستمرار في العمل.
- عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يمتلك مشرف آخر دورة حياة Gateway. يظل Doctor يبلّغ عن سلامة Gateway/الخدمة ويطبق الإصلاحات غير المتعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمة القديمة.
- على Linux، يتجاهل doctor وحدات systemd الإضافية غير النشطة الشبيهة بـ Gateway ولا يعيد كتابة بيانات الأمر/نقطة الدخول الوصفية لخدمة Gateway systemd قيد التشغيل أثناء الإصلاح. أوقف الخدمة أولًا أو استخدم `openclaw gateway install --force` عندما تريد عمدًا استبدال المشغّل النشط.
- يرحّل Doctor تلقائيًا إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات تشغيل `doctor --fix` المتكررة تبلّغ أو تطبق تسوية Talk عندما يكون الفرق الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بـ `openclaw configure --section model` عندما تكون بيانات اعتماد التضمين مفقودة.
- يحذر Doctor عندما لا يكون أي مالك أوامر مكوّنًا. مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة. إقران الرسائل المباشرة يسمح فقط لشخص ما بالتحدث إلى البوت؛ إذا وافقت على مرسل قبل وجود تمهيد أول مالك، فعيّن `commands.ownerAllowFrom` صراحةً.
- يحذر Doctor عندما تكون وكلاء وضع Codex مكوّنة وتوجد أصول Codex CLI شخصية في منزل Codex الخاص بالمشغّل. تستخدم عمليات تشغيل خادم تطبيق Codex المحلية منازل معزولة لكل وكيل، لذا استخدم `openclaw migrate codex --dry-run` لجرد الأصول التي ينبغي ترقيتها عمدًا.
- يحذر Doctor عندما تكون Skills المسموح بها للوكيل الافتراضي غير متاحة في بيئة التشغيل الحالية لأن المتطلبات الخاصة بالثنائيات أو متغيرات البيئة أو الإعدادات أو نظام التشغيل مفقودة. يمكن لـ `doctor --fix` تعطيل تلك Skills غير المتاحة باستخدام `skills.entries.<skill>.enabled=false`؛ ثبّت/كوّن المتطلب المفقود بدلًا من ذلك عندما تريد إبقاء Skill نشطة.
- إذا كان وضع sandbox مفعّلًا لكن Docker غير متاح، يبلّغ doctor عن تحذير عالي الدلالة مع المعالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت ملفات سجل sandbox القديمة (`~/.openclaw/sandbox/containers.json` أو `~/.openclaw/sandbox/browsers.json`) موجودة، يبلّغ doctor عنها؛ يرحّل `openclaw doctor --fix` الإدخالات الصالحة إلى أدلة سجل مجزأة ويعزل الملفات القديمة غير الصالحة.
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، يبلّغ doctor عن تحذير للقراءة فقط ولا يكتب بيانات اعتماد بديلة بنص عادي.
- إذا فشل فحص SecretRef الخاص بالقناة في مسار إصلاح، يواصل doctor العمل ويبلّغ عن تحذير بدلًا من الخروج مبكرًا.
- بعد ترحيلات دليل الحالة، يحذر doctor عندما تعتمد حسابات Telegram أو Discord الافتراضية المفعّلة على بديل متغيرات البيئة ويكون `TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN` غير متاح لعملية doctor.
- يتطلب الحل التلقائي لاسم مستخدم Telegram في `allowFrom` (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. إذا كان فحص الرمز غير متاح، يبلّغ doctor عن تحذير ويتخطى الحل التلقائي في تلك الجولة.

## macOS: تجاوزات بيئة `launchctl`

إذا سبق لك تشغيل `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف الإعدادات لديك ويمكن أن تسبب أخطاء "غير مصرّح" مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
