---
read_when:
    - أبلغ مستخدم عن أن الوكلاء يعلقون في تكرار استدعاءات الأدوات
    - تحتاج إلى ضبط الحماية من الاستدعاءات المتكررة
    - أنت تعدّل سياسات أدوات/وقت تشغيل الوكيل
    - تواجه حالات إيقاف `compaction_loop_persisted` بعد إعادة محاولة بسبب تجاوز سعة السياق
summary: كيفية تفعيل وضبط حواجز الحماية التي تكتشف حلقات استدعاء الأدوات المتكررة
title: اكتشاف حلقة الأدوات
x-i18n:
    generated_at: "2026-05-11T20:43:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
---

لدى OpenClaw آليتا حماية متعاونتان لأنماط استدعاء الأدوات المتكررة:

1. **اكتشاف الحلقات** (`tools.loopDetection.enabled`) — معطل افتراضيًا. يراقب سجل استدعاءات الأدوات المتحرك بحثًا عن الأنماط المتكررة وإعادات المحاولة لأدوات غير معروفة.
2. **حارس ما بعد Compaction** (`tools.loopDetection.postCompactionGuard`) — مفعّل افتراضيًا ما لم تكن `tools.loopDetection.enabled` مضبوطة صراحةً على `false`. يتسلح بعد كل إعادة محاولة بعد Compaction ويجهض التشغيل عندما يصدر الوكيل الثلاثية نفسها `(tool, args, result)` ضمن النافذة.

تتم تهيئة كليهما ضمن كتلة `tools.loopDetection` نفسها، لكن حارس ما بعد Compaction يعمل كلما لم يكن المفتاح الرئيسي متوقفًا صراحةً. اضبط `tools.loopDetection.enabled: false` لإسكات السطحين كليهما.

## سبب وجود هذا

- اكتشاف التسلسلات المتكررة التي لا تحقق تقدمًا.
- اكتشاف حلقات عدم وجود نتائج عالية التكرار (الأداة نفسها، المدخلات نفسها، أخطاء متكررة).
- اكتشاف أنماط استدعاءات متكررة محددة لأدوات polling معروفة.
- منع دورات تجاوز السياق ثم Compaction ثم الحلقة نفسها من الاستمرار إلى أجل غير مسمى.

## كتلة التهيئة

الإعدادات الافتراضية العامة، مع عرض كل حقل موثق:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
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

| الحقل                            | الافتراضي | التأثير                                                                                                                          |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | المفتاح الرئيسي لكواشف السجل المتحرك. يؤدي ضبطه على `false` أيضًا إلى تعطيل حارس ما بعد Compaction.                       |
| `historySize`                    | `30`    | عدد استدعاءات الأدوات الحديثة المحتفظ بها للتحليل.                                                                                  |
| `warningThreshold`               | `10`    | العتبة التي قبلها يُصنف النمط كتحذير فقط.                                                                       |
| `criticalThreshold`              | `20`    | عتبة حظر أنماط حلقات عدم التقدم المتكررة.                                                                    |
| `unknownToolThreshold`           | `10`    | حظر الاستدعاءات المتكررة إلى الأداة غير المتاحة نفسها بعد هذا العدد من الإخفاقات.                                                       |
| `globalCircuitBreakerThreshold`  | `30`    | عتبة قاطع عدم التقدم العام عبر جميع الكواشف.                                                                      |
| `detectors.genericRepeat`        | `true`  | يحذر من أنماط تكرار الأداة نفسها + المعلمات نفسها، ويحظر عندما تعيد الاستدعاءات نفسها نتائج متطابقة أيضًا.               |
| `detectors.knownPollNoProgress`  | `true`  | يكتشف الأنماط المعروفة الشبيهة بـ polling دون تغير في الحالة.                                                                       |
| `detectors.pingPong`             | `true`  | يكتشف أنماط ping-pong المتناوبة.                                                                                         |
| `postCompactionGuard.windowSize` | `3`     | عدد استدعاءات الأدوات بعد Compaction التي يبقى الحارس خلالها مسلحًا، وعدد الثلاثيات المتطابقة الذي يجهض التشغيل. |

بالنسبة إلى `exec`، تقارن فحوص عدم التقدم نتائج الأوامر المستقرة وتتجاهل بيانات وقت التشغيل المتقلبة مثل المدة وPID ومعرّف الجلسة ودليل العمل. عندما يكون معرّف تشغيل متاحًا، يُقيّم سجل استدعاءات الأدوات الحديثة ضمن ذلك التشغيل فقط، بحيث لا ترث دورات Heartbeat المجدولة وعمليات التشغيل الجديدة أعداد حلقات قديمة من عمليات تشغيل سابقة.

## الإعداد الموصى به

- للنماذج الأصغر، اضبط `enabled: true` واترك العتبات على قيمها الافتراضية. نادرًا ما تحتاج النماذج الرائدة إلى اكتشاف السجل المتحرك، ويمكنها إبقاء المفتاح الرئيسي على `false` مع الاستفادة من حارس ما بعد Compaction.
- أبقِ العتبات مرتبة على النحو `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- إذا حدثت نتائج إيجابية كاذبة:
  - ارفع `warningThreshold` و/أو `criticalThreshold`.
  - اختياريًا ارفع `globalCircuitBreakerThreshold`.
  - عطّل الكاشف المحدد الذي يسبب المشكلات فقط (`detectors.<name>: false`).
  - قلّل `historySize` لسياق تاريخي أقل صرامة.
- لتعطيل كل شيء (بما في ذلك حارس ما بعد Compaction)، اضبط `tools.loopDetection.enabled: false` صراحةً.

## حارس ما بعد Compaction

عندما يكمل المشغّل إعادة محاولة Compaction بعد تجاوز السياق، يسلّح حارسًا قصير النافذة يراقب استدعاءات الأدوات القليلة التالية. إذا أصدر الوكيل الثلاثية نفسها `(toolName, argsHash, resultHash)` عدة مرات ضمن النافذة، يستنتج الحارس أن Compaction لم يكسر الحلقة ويجهض التشغيل بخطأ `compaction_loop_persisted`.

يُضبط الحارس عبر علم `tools.loopDetection.enabled` الرئيسي مع تفصيل واحد: يبقى **مفعّلًا عندما يكون العلم غير مضبوط أو `true`** ولا يتعطل إلا عندما يكون العلم `false` صراحةً. هذا مقصود. يوجد الحارس للخروج من حلقات Compaction التي كانت ستحرق رموزًا غير محدودة، لذا يحصل المستخدم بلا تهيئة على الحماية كذلك.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- قيمة `windowSize` الأقل أكثر صرامة (محاولات أقل قبل الإجهاض).
- قيمة `windowSize` الأعلى تمنح الوكيل محاولات تعافٍ أكثر.
- لا يجهض الحارس أبدًا عندما تتغير النتائج، بل فقط عندما تكون النتائج متطابقة بايتًا عبر النافذة.
- نطاقه ضيق عمدًا: لا يعمل إلا مباشرةً بعد إعادة محاولة Compaction.

<Note>
  يعمل حارس ما بعد Compaction كلما لم يكن العلم الرئيسي `false` صراحةً، حتى إذا لم تكتب كتلة `tools.loopDetection` مطلقًا. للتحقق، ابحث عن `post-compaction guard armed for N attempts` في سجل Gateway مباشرةً بعد حدث Compaction.
</Note>

## السجلات والسلوك المتوقع

عند اكتشاف حلقة، يبلغ OpenClaw عن حدث حلقة وإما يخفف دورة الأداة التالية أو يحظرها حسب الشدة. يحمي هذا المستخدمين من إنفاق الرموز المنفلت والتوقفات مع الحفاظ على وصول الأدوات الطبيعي.

- تأتي التحذيرات أولًا.
- يتبعها الكبح عندما تستمر الأنماط بعد عتبة التحذير.
- تحظر العتبات الحرجة دورة الأداة التالية وتعرض سبب اكتشاف الحلقة بوضوح في سجل التشغيل.
- يصدر حارس ما بعد Compaction أخطاء `compaction_loop_persisted` مع اسم الأداة المخالفة وعدد الاستدعاءات المتطابقة.

## ذات صلة

<CardGroup cols={2}>
  <Card title="موافقات Exec" href="/ar/tools/exec-approvals" icon="shield">
    سياسة السماح/الرفض لتنفيذ shell.
  </Card>
  <Card title="مستويات التفكير" href="/ar/tools/thinking" icon="brain">
    مستويات جهد الاستدلال وتفاعل سياسة المزوّد.
  </Card>
  <Card title="الوكلاء الفرعيون" href="/ar/tools/subagents" icon="users">
    إنشاء وكلاء معزولين لحصر السلوك المنفلت.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط `tools.loopDetection` الكامل ودلالات الدمج.
  </Card>
</CardGroup>
