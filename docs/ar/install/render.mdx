---
read_when:
    - نشر OpenClaw على Render
    - تريد نشرًا سحابيًا تعريفيًا باستخدام Render Blueprints
summary: انشر OpenClaw على Render باستخدام البنية التحتية كتعليمة برمجية
title: العرض
x-i18n:
    generated_at: "2026-07-12T06:00:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

انشر OpenClaw على [Render](https://render.com) باستخدام مخطط Blueprint الموجود في ملف `render.yaml` بالمستودع. يعرّف هذا الملف الخدمة والقرص ومتغيرات البيئة في مكان واحد.

## المتطلبات الأساسية

- [حساب Render](https://render.com) (تتوفر خطة مجانية)
- مفتاح API من [موفّر النموذج](/ar/providers) المفضّل لديك

## النشر

[النشر على Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

يؤدي هذا إلى إنشاء خدمة Render من `render.yaml`، وبناء صورة Docker، ثم نشرها. يتبع عنوان URL الخاص بخدمتك النمط `https://<service-name>.onrender.com`.

## مخطط Blueprint

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # يُنشئ رمزًا آمنًا تلقائيًا
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| الميزة                | الغرض                                                      |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | يبني الصورة من ملف Dockerfile في المستودع                  |
| `healthCheckPath`     | يراقب Render المسار `/health` ويعيد تشغيل النُسخ غير السليمة |
| `generateValue: true` | يُنشئ تلقائيًا قيمة آمنة تشفيريًا                           |
| `disk`                | تخزين دائم يبقى محفوظًا بعد عمليات إعادة النشر             |

## اختيار خطة

| الخطة     | إيقاف التشغيل       | القرص         | الأنسب لـ                         |
| --------- | ------------------- | ------------- | --------------------------------- |
| المجانية  | بعد 15 دقيقة من الخمول | غير متوفر     | الاختبار والعروض التوضيحية        |
| Starter   | أبدًا               | 1GB+          | الاستخدام الشخصي والفِرق الصغيرة |
| Standard+ | أبدًا               | 1GB+          | بيئات الإنتاج والقنوات المتعددة   |

يستخدم مخطط Blueprint خطة `starter` افتراضيًا. لاستخدام الخطة المجانية، غيّر `plan: free` في ملف `render.yaml` ضمن نسختك المتفرعة — لاحظ أنه في غياب قرص دائم، تُعاد تهيئة حالة OpenClaw عند كل عملية نشر.

## بعد النشر

### الوصول إلى واجهة التحكم

تتوفر لوحة تحكم الويب على `https://<your-service>.onrender.com/`. اتصل باستخدام السر المشترك: `OPENCLAW_GATEWAY_TOKEN` المُنشأ تلقائيًا (ستجده في **Dashboard → your service → Environment**)، أو باستخدام كلمة مرورك إذا انتقلت إلى المصادقة بكلمة المرور.

### السجلات

يعرض **Dashboard → your service → Logs** سجلات البناء (إنشاء صورة Docker)، وسجلات النشر (بدء تشغيل الخدمة)، وسجلات وقت التشغيل (مخرجات التطبيق).

### الوصول إلى الصَدَفة

يفتح **Dashboard → your service → Shell** جلسة صَدَفة. يُثبّت القرص الدائم عند `/data`.

### متغيرات البيئة

عدّل المتغيرات في **Dashboard → your service → Environment**. تؤدي التغييرات إلى إعادة نشر تلقائية.

### النشر التلقائي

يعيد Render النشر تلقائيًا عندما يتلقى فرع المستودع المتصل التزامًا جديدًا. إذا نشرت مباشرةً من `openclaw/openclaw` بدلًا من نسختك المتفرعة، فلن تملك صلاحية الدفع اللازمة لتشغيل ذلك؛ لذا حدّث الخدمة بإجراء مزامنة يدوية لمخطط Blueprint من Dashboard، أو وجّه الخدمة إلى نسختك المتفرعة.

## نطاق مخصص

1. **Dashboard → your service → Settings → Custom Domains**
2. أضف نطاقك
3. اضبط DNS وفق التعليمات (سجل CNAME إلى `*.onrender.com`)
4. يوفّر Render شهادة TLS تلقائيًا

## التوسّع

- **رأسيًا**: غيّر الخطة للحصول على مزيد من موارد CPU/RAM. يكفي ذلك عادةً لـ OpenClaw.
- **أفقيًا**: زِد عدد النُسخ (خطة Standard وما فوق). يتطلب ذلك جلسات لاصقة أو إدارة خارجية للحالة، لأن OpenClaw يحتفظ بحالة وقت التشغيل على القرص المحلي.

## النُسخ الاحتياطية والترحيل

من صَدَفة Render Dashboard، يمكنك في أي وقت تصدير الحالة والإعدادات وملفات تعريف المصادقة ومساحة العمل:

```bash
openclaw backup create
```

يؤدي هذا إلى إنشاء أرشيف نسخة احتياطية قابل للنقل. راجع [النسخ الاحتياطي](/ar/cli/backup).

## استكشاف الأخطاء وإصلاحها

### الخدمة لا تبدأ

تحقق من سجلات النشر في Render Dashboard. تشمل المشكلات الشائعة:

- غياب `OPENCLAW_GATEWAY_TOKEN` — تحقّق من ضبطه في **Dashboard → Environment**
- عدم تطابق المنفذ — تأكد من ضبط `OPENCLAW_GATEWAY_PORT=8080` حتى يرتبط Gateway بالمنفذ الذي يتوقعه Render

### بطء بدء التشغيل البارد (الخطة المجانية)

تتوقف خدمات الخطة المجانية بعد 15 دقيقة من عدم النشاط؛ ويستغرق أول طلب بعد التوقف بضع ثوانٍ ريثما تبدأ الحاوية. رقِّ إلى Starter للحصول على تشغيل دائم.

### فقدان البيانات بعد إعادة النشر

يحدث ذلك في الخطة المجانية (لا يوجد قرص دائم). رقِّ إلى خطة مدفوعة، أو صدّر نسخة احتياطية بانتظام باستخدام `openclaw backup create` من صَدَفة Render.

### فشل فحوصات السلامة

إذا نجحت عمليات البناء وفشلت عمليات النشر، فقد تستغرق الخدمة وقتًا أطول من اللازم لبدء التشغيل، أو قد يتعذر الوصول إلى `/health`. تحقق مما يلي:

- سجلات البناء بحثًا عن أخطاء
- ما إذا كانت الحاوية تعمل محليًا باستخدام `docker build && docker run`

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- إعداد Gateway: [إعداد Gateway](/ar/gateway/configuration)
- إبقاء OpenClaw محدّثًا: [التحديث](/ar/install/updating)
