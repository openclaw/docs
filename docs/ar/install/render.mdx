---
read_when:
    - نشر OpenClaw إلى Render
    - أنت تريد نشرًا سحابيًا تصريحيًا باستخدام Render Blueprints
summary: نشر OpenClaw على Render باستخدام Infrastructure-as-Code
title: Render
x-i18n:
    generated_at: "2026-04-23T07:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
    postprocess_version: locale-links-v1
---

# Render

انشر OpenClaw على Render باستخدام Infrastructure as Code. يعرّف Blueprint المضمّن `render.yaml` كامل المكدس لديك بشكل تصريحي، بما في ذلك الخدمة، والقرص، ومتغيرات البيئة، بحيث يمكنك النشر بنقرة واحدة وإصدار البنية التحتية لديك جنبًا إلى جنب مع الشيفرة.

## المتطلبات المسبقة

- [حساب Render](https://render.com) (تتوفر فئة مجانية)
- مفتاح API من [موفر النموذج](/ar/providers) الذي تفضله

## النشر باستخدام Render Blueprint

[النشر إلى Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

سيؤدي النقر على هذا الرابط إلى:

1. إنشاء خدمة Render جديدة من Blueprint `render.yaml` الموجود في جذر هذا المستودع.
2. بناء صورة Docker والنشر

بعد النشر، سيتبع عنوان URL الخاص بخدمتك النمط `https://<service-name>.onrender.com`.

## فهم Blueprint

تُعد Render Blueprints ملفات YAML تعرّف البنية التحتية لديك. يضبط `render.yaml` في هذا
المستودع كل ما يلزم لتشغيل OpenClaw:

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

ميزات Blueprint الرئيسية المستخدمة:

| الميزة | الغرض |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker` | البناء من Dockerfile الخاص بالمستودع |
| `healthCheckPath` | يراقب Render المسار `/health` ويعيد تشغيل المثيلات غير السليمة |
| `generateValue: true` | يُنشئ قيمة آمنة تشفيريًا تلقائيًا |
| `disk` | تخزين دائم يبقى بعد إعادة النشر |

## اختيار الخطة

| الخطة | الإيقاف التلقائي | القرص | الأنسب لـ |
| --------- | ----------------- | ------------- | ----------------------------- |
| Free | بعد 15 دقيقة من الخمول | غير متاح | الاختبار، العروض التوضيحية |
| Starter | أبدًا | 1GB+ | الاستخدام الشخصي، الفرق الصغيرة |
| Standard+ | أبدًا | 1GB+ | الإنتاج، قنوات متعددة |

يستخدم Blueprint الخطة `starter` افتراضيًا. لاستخدام الفئة المجانية، غيّر `plan: free` في
`render.yaml` ضمن نسختك المتفرعة (لكن لاحظ: عدم وجود قرص دائم يعني أن حالة OpenClaw
ستُعاد تهيئتها عند كل نشر).

## بعد النشر

### الوصول إلى Control UI

تتوفر لوحة التحكم على الويب على `https://<your-service>.onrender.com/`.

اتصل باستخدام السر المشترك المضبوط. يقوم قالب النشر هذا بإنشاء
`OPENCLAW_GATEWAY_TOKEN` تلقائيًا (اعثر عليه في **Dashboard → خدمتك →
Environment**). وإذا استبدلته بمصادقة كلمة مرور، فاستخدم كلمة المرور تلك
بدلًا منه.

## ميزات Render Dashboard

### السجلات

اعرض السجلات في الوقت الفعلي في **Dashboard → خدمتك → Logs**. يمكنك التصفية حسب:

- سجلات البناء (إنشاء صورة Docker)
- سجلات النشر (بدء تشغيل الخدمة)
- سجلات وقت التشغيل (مخرجات التطبيق)

### الوصول إلى Shell

لأغراض التصحيح، افتح جلسة shell عبر **Dashboard → خدمتك → Shell**. يتم تحميل القرص الدائم عند `/data`.

### متغيرات البيئة

عدّل المتغيرات في **Dashboard → خدمتك → Environment**. تؤدي التغييرات إلى إعادة نشر تلقائية.

### النشر التلقائي

إذا كنت تستخدم مستودع OpenClaw الأصلي، فلن يقوم Render بالنشر التلقائي لـ OpenClaw لديك. لتحديثه، شغّل مزامنة Blueprint يدوية من لوحة التحكم.

## نطاق مخصص

1. انتقل إلى **Dashboard → خدمتك → Settings → Custom Domains**
2. أضف نطاقك
3. اضبط DNS حسب التعليمات (CNAME إلى `*.onrender.com`)
4. يوفّر Render شهادة TLS تلقائيًا

## التوسع

يدعم Render التوسع الأفقي والرأسي:

- **رأسيًا**: غيّر الخطة للحصول على المزيد من CPU/RAM
- **أفقيًا**: زِد عدد المثيلات (خطة Standard وما فوق)

بالنسبة إلى OpenClaw، يكون التوسع الرأسي كافيًا عادةً. أما التوسع الأفقي فيتطلب جلسات sticky أو إدارة حالة خارجية.

## النسخ الاحتياطية والترحيل

يمكنك تصدير حالتك وتكوينك وملفات تعريف المصادقة ومساحة العمل في أي وقت باستخدام
الوصول إلى shell في Render Dashboard:

```bash
openclaw backup create
```

يؤدي هذا إلى إنشاء أرشيف نسخ احتياطي محمول يتضمن حالة OpenClaw بالإضافة إلى أي
مساحة عمل مضبوطة. راجع [Backup](/ar/cli/backup) للتفاصيل.

## استكشاف الأخطاء وإصلاحها

### الخدمة لا تبدأ

تحقق من سجلات النشر في Render Dashboard. من المشكلات الشائعة:

- غياب `OPENCLAW_GATEWAY_TOKEN` — تحقّق من تعيينه في **Dashboard → Environment**
- عدم تطابق المنفذ — تأكد من ضبط `OPENCLAW_GATEWAY_PORT=8080` حتى يربط gateway على المنفذ الذي يتوقعه Render

### بدايات باردة بطيئة (الفئة المجانية)

تتوقف خدمات الفئة المجانية بعد 15 دقيقة من عدم النشاط. يستغرق أول طلب بعد الإيقاف التلقائي بضع ثوانٍ أثناء بدء الحاوية. قم بالترقية إلى خطة Starter للحصول على خدمة تعمل دائمًا.

### فقدان البيانات بعد إعادة النشر

يحدث هذا في الفئة المجانية (لا يوجد قرص دائم). قم بالترقية إلى خطة مدفوعة، أو
صدّر نسخة احتياطية كاملة بانتظام عبر `openclaw backup create` في shell الخاص بـ Render.

### فشل التحقق الصحي

يتوقع Render استجابة 200 من `/health` خلال 30 ثانية. إذا نجحت عمليات البناء لكن فشلت عمليات النشر، فقد تكون الخدمة تستغرق وقتًا طويلًا جدًا لبدء التشغيل. تحقق من:

- سجلات البناء بحثًا عن أخطاء
- ما إذا كانت الحاوية تعمل محليًا باستخدام `docker build && docker run`

## الخطوات التالية

- اضبط قنوات المراسلة: [القنوات](/ar/channels)
- اضبط Gateway: [تكوين Gateway](/ar/gateway/configuration)
- حافظ على تحديث OpenClaw: [التحديث](/ar/install/updating)
