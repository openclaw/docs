---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجّهة
    - لقد أجريت تحديثًا وتريد فحص سلامة سريعًا
summary: مرجع CLI لـ `openclaw doctor` (فحوصات السلامة + الإصلاحات الموجّهة)
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:26:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

فحوصات السلامة + إصلاحات سريعة لـ Gateway والقنوات.

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
- `--yes`: قبول القيم الافتراضية بدون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها بدون مطالبة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك الكتابة فوق إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل بدون مطالبات؛ عمليات ترحيل آمنة فقط
- `--generate-gateway-token`: إنشاء وتهيئة رمز Gateway مميز
- `--deep`: فحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin عبارة عن TTY ولا تكون قيمة `--non-interactive` مضبوطة. أما عمليات التشغيل غير التفاعلية (Cron أو Telegram أو بدون طرفية) فتتخطى المطالبات.
- الأداء: تتخطى عمليات `doctor` غير التفاعلية التحميل المبكر للـ Plugin حتى تظل فحوصات السلامة غير التفاعلية سريعة. أما الجلسات التفاعلية فما تزال تحمّل Plugins بالكامل عندما يحتاج فحص ما إلى مساهمتها.
- يقوم `--fix` (الاسم البديل لـ `--repair`) بكتابة نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعدادات غير المعروفة، مع إدراج كل عملية إزالة.
- تكتشف فحوصات تكامل الحالة الآن ملفات transcript اليتيمة في دليل الجلسات ويمكنها أرشفتها كـ `.deleted.<timestamp>` لاستعادة المساحة بأمان.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال وظائف Cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تسويتها تلقائيًا وقت التشغيل.
- يصلح Doctor تبعيات وقت تشغيل Plugin المضمنة المفقودة بدون الكتابة داخل التثبيتات العامة المعبأة. بالنسبة إلى تثبيتات npm المملوكة للجذر أو وحدات systemd المقواة، اضبط `OPENCLAW_PLUGIN_STAGE_DIR` على دليل قابل للكتابة مثل `/var/lib/openclaw/plugin-runtime-deps`.
- اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون هناك مشرف آخر يملك دورة حياة Gateway. سيواصل Doctor الإبلاغ عن سلامة Gateway/الخدمة وتطبيق الإصلاحات غير المتعلقة بالخدمة، لكنه سيتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة وتنظيف الخدمة القديمة.
- يقوم Doctor بترحيل إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابه) تلقائيًا إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات `doctor --fix` المتكررة تبلغ عن/تطبق تسوية Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية memory-search ويمكنه أن يوصي بـ `openclaw configure --section model` عند غياب بيانات اعتماد embeddings.
- إذا كان وضع sandbox مفعّلًا ولكن Docker غير متاح، فسيبلّغ doctor عن تحذير عالي الأهمية مع المعالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، فسيبلغ doctor عن تحذير للقراءة فقط ولن يكتب بيانات اعتماد fallback نصية صريحة.
- إذا فشل فحص SecretRef الخاص بالقناة في مسار إصلاح، فسيواصل doctor العمل ويبلغ عن تحذير بدلًا من الخروج المبكر.
- يتطلب التحليل التلقائي لاسم المستخدم في Telegram ضمن `allowFrom` (`doctor --fix`) رمز Telegram مميزًا قابلًا للتحليل في مسار الأمر الحالي. وإذا لم يكن فحص الرمز المميز متاحًا، فسيبلغ doctor عن تحذير ويتخطى التحليل التلقائي في تلك الجولة.

## macOS: تجاوزات بيئة `launchctl`

إذا كنت قد شغّلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فستتجاوز هذه القيمة ملف الإعدادات لديك وقد تسبب أخطاء "unauthorized" مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
