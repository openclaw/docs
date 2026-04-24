---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجهة
    - لقد أجريت تحديثًا وتريد فحصًا سريعًا للتأكد من سلامة الأمور
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + إصلاحات موجهة)
title: Doctor
x-i18n:
    generated_at: "2026-04-24T07:34:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

فحوصات الصحة + إصلاحات سريعة للـ gateway والقنوات.

ذو صلة:

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
- `--yes`: قبول القيم الافتراضية دون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها دون مطالبة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك الكتابة فوق إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل دون مطالبات؛ عمليات ترحيل آمنة فقط
- `--generate-gateway-token`: إنشاء رمز gateway وإعداده
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin من نوع TTY وعندما لا يكون `--non-interactive` مضبوطًا. التشغيلات دون واجهة (Cron أو Telegram أو من دون طرفية) ستتخطى المطالبات.
- الأداء: تتخطى تشغيلات `doctor` غير التفاعلية التحميل المبكر للـ plugins بحيث تبقى فحوصات الصحة دون واجهة سريعة. أما الجلسات التفاعلية فما تزال تحمّل plugins بالكامل عندما يحتاج الفحص إلى مساهمتها.
- يكتب `--fix` (الاسم البديل لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعداد غير المعروفة، مع سرد كل عملية إزالة.
- تكشف فحوصات سلامة الحالة الآن ملفات transcript اليتيمة في دليل الجلسات، ويمكنها أرشفتها بصيغة `.deleted.<timestamp>` لاستعادة المساحة بأمان.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال وظائف Cron القديمة، ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تسويتها تلقائيًا وقت التشغيل.
- يصلح Doctor تبعيات وقت التشغيل المفقودة للـ bundled plugin من دون الحاجة إلى إذن كتابة على حزمة OpenClaw المثبتة. بالنسبة إلى تثبيتات npm المملوكة للجذر أو وحدات systemd المقواة، اضبط `OPENCLAW_PLUGIN_STAGE_DIR` على دليل قابل للكتابة مثل `/var/lib/openclaw/plugin-runtime-deps`.
- يقوم Doctor تلقائيًا بترحيل إعداد Talk المسطح القديم (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد تشغيلات `doctor --fix` المتكررة تبلغ عن/تطبق تسوية Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية memory-search ويمكنه التوصية بـ `openclaw configure --section model` عند غياب بيانات اعتماد embedding.
- إذا كان وضع sandbox مفعّلًا لكن Docker غير متاح، فسيبلغ doctor عن تحذير عالي الإشارة مع المعالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، فسيبلغ doctor عن تحذير للقراءة فقط ولن يكتب بيانات اعتماد احتياطية بنص واضح.
- إذا فشل فحص SecretRef الخاص بالقناة في مسار إصلاح، فسيواصل doctor العمل ويبلغ عن تحذير بدلًا من الخروج مبكرًا.
- يتطلب التحليل التلقائي لاسم المستخدم في Telegram داخل `allowFrom` (`doctor --fix`) وجود رمز Telegram قابل للتحليل في مسار الأمر الحالي. وإذا لم يكن فحص الرمز متاحًا، فسيبلغ doctor عن تحذير ويتخطى التحليل التلقائي في تلك الجولة.

## macOS: تجاوزات البيئة في `launchctl`

إذا كنت قد شغّلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن هذه القيمة تتجاوز ملف الإعداد لديك ويمكن أن تسبب أخطاء “unauthorized” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاصة بـ Gateway](/ar/gateway/doctor)
