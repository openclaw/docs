---
read_when:
    - أبلغ مستخدم عن تعلّق الوكلاء أثناء تكرار استدعاءات الأدوات
    - تحتاج إلى ضبط حماية الاستدعاءات المتكررة
    - أنت تعدّل سياسات أدوات الوكيل ووقت التشغيل
    - تواجه حالات إجهاض `compaction_loop_persisted` بعد إعادة محاولة بسبب تجاوز سعة السياق
summary: كيفية تمكين وضبط ضوابط الحماية التي تكتشف حلقات استدعاء الأدوات المتكررة
title: اكتشاف حلقة الأدوات
x-i18n:
    generated_at: "2026-05-06T08:18:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

لدى OpenClaw آليتا حماية متعاونتان لأنماط استدعاء الأدوات المتكررة:

1. **اكتشاف الحلقات** (`tools.loopDetection.enabled`) — معطّل افتراضيًا. يراقب سجل استدعاءات الأدوات المتحرك بحثًا عن الأنماط المتكررة ومحاولات إعادة الأدوات غير المعروفة.
2. **حارس ما بعد Compaction** (`tools.loopDetection.postCompactionGuard`) — مفعّل افتراضيًا ما لم تكن `tools.loopDetection.enabled` مضبوطة صراحةً على `false`. يتسلّح بعد كل إعادة محاولة عقب Compaction ويجهض التشغيل عندما يصدر الوكيل الثلاثية نفسها `(tool, args, result)` ضمن النافذة.

كلاهما يُهيّأ ضمن كتلة `tools.loopDetection` نفسها، لكن حارس ما بعد Compaction يعمل كلما لم يكن المفتاح الرئيسي مغلقًا صراحةً. اضبط `tools.loopDetection.enabled: false` لإسكات السطحين كليهما.

## سبب وجود هذا

- اكتشاف التسلسلات المتكررة التي لا تحقق تقدمًا.
- اكتشاف حلقات عدم وجود نتائج عالية التكرار (الأداة نفسها، والمدخلات نفسها، والأخطاء المتكررة).
- اكتشاف أنماط محددة للاستدعاءات المتكررة لأدوات الاستطلاع المعروفة.
- منع دورات فيض السياق ثم Compaction ثم تكرار الحلقة نفسها من العمل إلى أجل غير مسمى.

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

تجاوز اختياري لكل وكيل:

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
| `warningThreshold`               | `10`    | الحد الذي يُصنّف قبله النمط على أنه تحذير فقط.                                                                       |
| `criticalThreshold`              | `20`    | حد حظر أنماط الحلقات المتكررة.                                                                                |
| `unknownToolThreshold`           | `10`    | حظر الاستدعاءات المتكررة للأداة غير المتاحة نفسها بعد هذا العدد من الإخفاقات.                                                       |
| `globalCircuitBreakerThreshold`  | `30`    | حد قاطع عدم التقدم العام عبر جميع الكواشف.                                                                      |
| `detectors.genericRepeat`        | `true`  | يكتشف أنماط تكرار الأداة نفسها + المعلمات نفسها.                                                                              |
| `detectors.knownPollNoProgress`  | `true`  | يكتشف الأنماط المعروفة الشبيهة بالاستطلاع دون تغير في الحالة.                                                                       |
| `detectors.pingPong`             | `true`  | يكتشف أنماط التناوب ذهابًا وإيابًا.                                                                                         |
| `postCompactionGuard.windowSize` | `3`     | عدد استدعاءات الأدوات بعد Compaction التي يبقى الحارس خلالها مسلحًا، وعدد الثلاثيات المتطابقة التي تجهض التشغيل. |

بالنسبة إلى `exec`، تقارن فحوصات عدم التقدم نتائج الأوامر المستقرة وتتجاهل بيانات وقت التشغيل المتقلبة مثل المدة وPID ومعرّف الجلسة ودليل العمل. عند توفر معرّف تشغيل، لا يُقيَّم سجل استدعاءات الأدوات الحديث إلا ضمن ذلك التشغيل، حتى لا ترث دورات Heartbeat المجدولة والتشغيلات الجديدة عدادات حلقات قديمة من تشغيلات سابقة.

## الإعداد الموصى به

- للنماذج الأصغر، اضبط `enabled: true` واترك الحدود بقيمها الافتراضية. نادرًا ما تحتاج النماذج الرائدة إلى اكتشاف السجل المتحرك، ويمكنها ترك المفتاح الرئيسي عند `false` مع الاستمرار في الاستفادة من حارس ما بعد Compaction.
- أبقِ الحدود مرتبة بالشكل `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- إذا حدثت نتائج إيجابية كاذبة:
  - ارفع `warningThreshold` و/أو `criticalThreshold`.
  - ارفع `globalCircuitBreakerThreshold` اختياريًا.
  - عطّل فقط الكاشف المحدد الذي يسبب المشكلات (`detectors.<name>: false`).
  - قلل `historySize` لسياق تاريخي أقل صرامة.
- لتعطيل كل شيء (بما في ذلك حارس ما بعد Compaction)، اضبط `tools.loopDetection.enabled: false` صراحةً.

## حارس ما بعد Compaction

عندما يكمل المشغّل إعادة محاولة Compaction بعد فيض في السياق، فإنه يسلّح حارسًا قصير النافذة يراقب استدعاءات الأدوات القليلة التالية. إذا أصدر الوكيل الثلاثية نفسها `(toolName, argsHash, resultHash)` عدة مرات ضمن النافذة، يستنتج الحارس أن Compaction لم تكسر الحلقة ويجهض التشغيل بخطأ `compaction_loop_persisted`.

يتحكم العلم الرئيسي `tools.loopDetection.enabled` في الحارس مع تفصيل واحد: يبقى **مفعّلًا عندما يكون العلم غير مضبوط أو `true`** ولا يتوقف إلا عندما يكون العلم مضبوطًا صراحةً على `false`. هذا مقصود. يوجد الحارس للخروج من حلقات Compaction التي كانت ستستهلك رموزًا بلا حدود، لذلك يحصل المستخدم بلا تهيئة على الحماية أيضًا.

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
- قيمة `windowSize` الأعلى تمنح الوكيل محاولات استرداد أكثر.
- لا يجهض الحارس أبدًا عندما تتغير النتائج، بل فقط عندما تكون النتائج متطابقة بالبايت عبر النافذة.
- وهو ضيق النطاق عن قصد: لا يعمل إلا مباشرةً بعد إعادة محاولة Compaction.

<Note>
  يعمل حارس ما بعد Compaction كلما لم يكن العلم الرئيسي مضبوطًا صراحةً على `false`، حتى إذا لم تكتب كتلة `tools.loopDetection` مطلقًا. للتحقق، ابحث عن `post-compaction guard armed for N attempts` في سجل Gateway مباشرةً بعد حدث Compaction.
</Note>

## السجلات والسلوك المتوقع

عند اكتشاف حلقة، يبلغ OpenClaw عن حدث حلقة ويخفف أو يحظر دورة الأداة التالية حسب درجة الخطورة. يحمي هذا المستخدمين من الإنفاق المنفلت للرموز وحالات التجمّد مع الحفاظ على الوصول العادي إلى الأدوات.

- تأتي التحذيرات أولًا.
- يتبعها الكبح عندما تستمر الأنماط بعد حد التحذير.
- تحظر الحدود الحرجة دورة الأداة التالية وتعرض سببًا واضحًا لاكتشاف الحلقة في سجل التشغيل.
- يصدر حارس ما بعد Compaction أخطاء `compaction_loop_persisted` مع اسم الأداة المخالفة وعدد الاستدعاءات المتطابقة.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/ar/tools/exec-approvals" icon="shield">
    سياسة السماح/الرفض لتنفيذ shell.
  </Card>
  <Card title="Thinking levels" href="/ar/tools/thinking" icon="brain">
    مستويات جهد الاستدلال وتفاعل سياسة المزوّد.
  </Card>
  <Card title="Sub-agents" href="/ar/tools/subagents" icon="users">
    إنشاء وكلاء معزولين للحد من السلوك المنفلت.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط `tools.loopDetection` الكامل ودلالات الدمج.
  </Card>
</CardGroup>
