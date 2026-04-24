---
read_when:
    - أبلغ أحد المستخدمين عن تعليق الوكلاء في تكرار استدعاءات الأدوات
    - تحتاج إلى ضبط الحماية من الاستدعاءات المتكررة
    - أنت تعدّل سياسات الأدوات/وقت التشغيل الخاصة بالوكيل
summary: كيفية تمكين وضبط الحواجز الوقائية التي تكتشف حلقات استدعاء الأدوات المتكررة
title: اكتشاف حلقات الأدوات
x-i18n:
    generated_at: "2026-04-24T08:09:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

يمكن لـ OpenClaw منع الوكلاء من التعثر في أنماط متكررة من استدعاءات الأدوات.
ويكون هذا الحاجز الوقائي **معطّلًا افتراضيًا**.

فعّله فقط عند الحاجة، لأنه قد يحظر استدعاءات متكررة مشروعة عند الإعدادات الصارمة.

## لماذا يوجد هذا

- اكتشاف التسلسلات المتكررة التي لا تحقق تقدمًا.
- اكتشاف الحلقات عالية التكرار التي لا تعطي نتائج (الأداة نفسها، والمدخلات نفسها، والأخطاء المتكررة).
- اكتشاف أنماط الاستدعاء المتكررة المحددة للأدوات المعروفة الخاصة بالاستطلاع.

## كتلة التهيئة

الإعدادات الافتراضية العامة:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

تجاوز لكل وكيل (اختياري):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### سلوك الحقول

- `enabled`: مفتاح التشغيل الرئيسي. تعني `false` عدم تنفيذ أي اكتشاف للحلقات.
- `historySize`: عدد استدعاءات الأدوات الأخيرة المحفوظة للتحليل.
- `warningThreshold`: العتبة قبل تصنيف النمط على أنه تحذير فقط.
- `criticalThreshold`: العتبة التي تؤدي إلى حظر أنماط الحلقات المتكررة.
- `globalCircuitBreakerThreshold`: عتبة قاطع الدائرة العامة لعدم وجود تقدم.
- `detectors.genericRepeat`: يكتشف أنماط الأداة نفسها + المعلمات نفسها المتكررة.
- `detectors.knownPollNoProgress`: يكتشف الأنماط الشبيهة بالاستطلاع المعروفة عندما لا يحدث تغير في الحالة.
- `detectors.pingPong`: يكتشف الأنماط المتناوبة من نوع ping-pong.

## الإعداد الموصى به

- ابدأ بـ `enabled: true` مع إبقاء الإعدادات الافتراضية كما هي.
- حافظ على ترتيب العتبات بالشكل `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- إذا ظهرت نتائج إيجابية كاذبة:
  - ارفع `warningThreshold` و/أو `criticalThreshold`
  - (اختياريًا) ارفع `globalCircuitBreakerThreshold`
  - عطّل فقط detector الذي يسبب المشكلة
  - خفّض `historySize` للحصول على سياق تاريخي أقل صرامة

## السجلات والسلوك المتوقع

عند اكتشاف حلقة، يبلغ OpenClaw عن حدث حلقة ويمنع أو يخفف دورة الأداة التالية بحسب مستوى الخطورة.
ويحمي هذا المستخدمين من الإنفاق المنفلت على tokens ومن حالات التعليق، مع الحفاظ على الوصول العادي إلى الأدوات.

- فضّل التحذير والقمع المؤقت أولًا.
- لا تصعّد إلا عندما تتراكم أدلة متكررة.

## ملاحظات

- يُدمج `tools.loopDetection` مع التجاوزات على مستوى الوكيل.
- تتجاوز التهيئة الخاصة بكل وكيل القيم العامة أو توسعها بالكامل.
- إذا لم توجد أي تهيئة، تبقى الحواجز الوقائية معطلة.

## ذو صلة

- [Exec approvals](/ar/tools/exec-approvals)
- [Thinking levels](/ar/tools/thinking)
- [Sub-agents](/ar/tools/subagents)
