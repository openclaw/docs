---
read_when:
    - تريد فهم الضغط التلقائي و/compact
    - أنت تصحح أخطاء الجلسات الطويلة التي تصل إلى حدود السياق
summary: كيف يلخّص OpenClaw المحادثات الطويلة للبقاء ضمن حدود النموذج
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:27:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

لكل نموذج نافذة سياق: الحد الأقصى لعدد الرموز التي يمكنه معالجتها. عندما تقترب محادثة من ذلك الحد، يقوم OpenClaw بعمل **Compaction** للرسائل الأقدم وتحويلها إلى ملخص حتى يمكن أن تستمر الدردشة.

## كيف يعمل

1. تُلخّص أدوار المحادثة الأقدم في إدخال مضغوط.
2. يُحفظ الملخص في نسخة الجلسة النصية.
3. تُبقى الرسائل الحديثة كما هي.

عندما يقسم OpenClaw السجل إلى أجزاء Compaction، فإنه يبقي استدعاءات أدوات المساعد مقترنة بإدخالات `toolResult` المطابقة لها. إذا وقع موضع التقسيم داخل كتلة أداة، ينقل OpenClaw الحد بحيث يبقى الزوج معًا ويُحفظ الذيل الحالي غير الملخص.

يبقى سجل المحادثة الكامل على القرص. يغيّر Compaction فقط ما يراه النموذج في الدور التالي.

## Compaction التلقائي

يكون Compaction التلقائي مفعّلًا افتراضيًا. يعمل عندما تقترب الجلسة من حد السياق، أو عندما يعيد النموذج خطأ في تجاوز السياق (وفي هذه الحالة يقوم OpenClaw بعمل Compaction ثم يعيد المحاولة).

سترى:

- `embedded run auto-compaction start` / `complete` في سجلات Gateway العادية.
- `🧹 Auto-compaction complete` في الوضع المفصل.
- `/status` يعرض `🧹 Compactions: <count>`.

<Info>
قبل عمل Compaction، يذكّر OpenClaw الوكيل تلقائيًا بحفظ الملاحظات المهمة في ملفات [الذاكرة](/ar/concepts/memory). يمنع هذا فقدان السياق.
</Info>

<AccordionGroup>
  <Accordion title="Recognized overflow signatures">
    يكتشف OpenClaw تجاوز السياق من أنماط أخطاء المزوّدين هذه:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction اليدوي

اكتب `/compact` في أي دردشة لفرض Compaction. أضف تعليمات لتوجيه الملخص:

```
/compact Focus on the API design decisions
```

عند ضبط `agents.defaults.compaction.keepRecentTokens`، يحترم Compaction اليدوي نقطة القطع الخاصة بـ OpenClaw ويبقي الذيل الحديث في السياق المعاد بناؤه. من دون ميزانية احتفاظ صريحة، يتصرف Compaction اليدوي كنقطة تحقق صارمة ويتابع من الملخص الجديد وحده.

## الإعداد

اضبط Compaction ضمن `agents.defaults.compaction` في ملف `openclaw.json`. أكثر عناصر التحكم شيوعًا مدرجة أدناه؛ وللمرجع الكامل، راجع [التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

### استخدام نموذج مختلف

افتراضيًا، يستخدم Compaction النموذج الأساسي للوكيل. اضبط `agents.defaults.compaction.model` لتفويض التلخيص إلى نموذج أكثر قدرة أو أكثر تخصصًا. يقبل التجاوز سلسلة `provider/model-id` أو اسمًا مستعارًا مجردًا مضبوطًا ضمن `agents.defaults.models`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

تُحل الأسماء المستعارة المجردة المضبوطة إلى المزوّد والنموذج القانونيين قبل بدء Compaction. إذا طابقت قيمة مجردة اسمًا مستعارًا ومعرّف نموذج حرفيًا مضبوطًا في الوقت نفسه، ينتصر معرّف النموذج الحرفي. تبقى القيمة المجردة غير المطابقة معرّف نموذج على المزوّد النشط.

يعمل هذا مع النماذج المحلية أيضًا، مثل نموذج Ollama ثانٍ مخصص للتلخيص:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

عند عدم ضبطه، يبدأ Compaction بنموذج الجلسة النشط. إذا فشل التلخيص بسبب خطأ مزوّد مؤهل للرجوع إلى نموذج بديل، يعيد OpenClaw محاولة Compaction تلك عبر سلسلة الرجوع إلى النماذج الحالية للجلسة. يكون اختيار الرجوع مؤقتًا ولا يُكتب مرة أخرى إلى حالة الجلسة. يبقى تجاوز `agents.defaults.compaction.model` الصريح دقيقًا ولا يرث سلسلة الرجوع الخاصة بالجلسة.

### الحفاظ على المعرّفات

يحافظ تلخيص Compaction على المعرّفات المعتمة افتراضيًا (`identifierPolicy: "strict"`). تجاوز ذلك باستخدام `identifierPolicy: "off"` للتعطيل، أو `identifierPolicy: "custom"` مع `identifierInstructions` لتوجيه مخصص.

### حارس بايتات النسخة النصية النشطة

عند ضبط `agents.defaults.compaction.maxActiveTranscriptBytes`، يفعّل OpenClaw Compaction المحلي العادي قبل التشغيل إذا وصل ملف JSONL النشط إلى ذلك الحجم. يفيد هذا في الجلسات طويلة التشغيل حيث قد تحافظ إدارة السياق من جهة المزوّد على سلامة سياق النموذج بينما تستمر النسخة النصية المحلية في النمو. لا يقسم بايتات JSONL الخام؛ بل يطلب من مسار Compaction العادي إنشاء ملخص دلالي.

<Warning>
يتطلب حارس البايتات `truncateAfterCompaction: true`. من دون تدوير النسخة النصية، لن يصغر الملف النشط وسيبقى الحارس غير نشط.
</Warning>

### النسخ النصية اللاحقة

عند تفعيل `agents.defaults.compaction.truncateAfterCompaction`، لا يعيد OpenClaw كتابة النسخة النصية الحالية في مكانها. ينشئ نسخة نصية لاحقة نشطة جديدة من ملخص Compaction والحالة المحفوظة والذيل غير الملخص، ثم يسجل بيانات تعريف نقطة التحقق التي توجه تدفقات التفريع/الاستعادة إلى تلك النسخة اللاحقة المضغوطة.
تُسقط النسخ النصية اللاحقة أيضًا أدوار المستخدم الطويلة المكررة تمامًا التي تصل
داخل نافذة إعادة محاولة قصيرة، بحيث لا تُنقل عواصف إعادة محاولة القنوات إلى
النسخة النصية النشطة التالية بعد Compaction.

لم يعد OpenClaw يكتب نسخًا منفصلة بصيغة `.checkpoint.*.jsonl` لعمليات
Compaction الجديدة. لا يزال يمكن استخدام ملفات نقاط التحقق القديمة الموجودة أثناء الإشارة إليها
وتُزال بواسطة تنظيف الجلسة العادي.

### إشعارات Compaction

افتراضيًا، يعمل Compaction بصمت. اضبط `notifyUser` لعرض رسائل حالة موجزة عند بدء Compaction واكتماله:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### تفريغ الذاكرة

قبل Compaction، يمكن لـ OpenClaw تشغيل دور **تفريغ ذاكرة صامت** لتخزين ملاحظات دائمة على القرص. اضبط `agents.defaults.compaction.memoryFlush.model` عندما يجب أن يستخدم دور الصيانة هذا نموذجًا محليًا بدل نموذج المحادثة النشط:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

تجاوز نموذج تفريغ الذاكرة دقيق ولا يرث سلسلة الرجوع الخاصة بالجلسة النشطة. راجع [الذاكرة](/ar/concepts/memory) للتفاصيل والإعداد.

## مزوّدو Compaction القابلون للتوصيل

يمكن للـ Plugins تسجيل مزوّد Compaction مخصص عبر `registerCompactionProvider()` على واجهة Plugin البرمجية. عندما يكون مزوّد مسجلًا ومضبوطًا، يفوّض OpenClaw التلخيص إليه بدل مسار LLM المدمج.

لاستخدام مزوّد مسجل، اضبط معرّفه في إعدادك:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

يؤدي ضبط `provider` تلقائيًا إلى فرض `mode: "safeguard"`. يتلقى المزوّدون تعليمات Compaction نفسها وسياسة الحفاظ على المعرّفات نفسها مثل المسار المدمج، ولا يزال OpenClaw يحافظ على سياق لاحقة الأدوار الحديثة والأدوار المقسمة بعد مخرجات المزوّد.

<Note>
إذا فشل المزوّد أو أعاد نتيجة فارغة، يرجع OpenClaw إلى تلخيص LLM المدمج.
</Note>

## Compaction مقابل التقليم

|                  | Compaction                    | التقليم                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **ما يفعله** | يلخص المحادثة الأقدم | يقص نتائج الأدوات القديمة           |
| **محفوظ؟**       | نعم (في نسخة الجلسة النصية)   | لا (في الذاكرة فقط، لكل طلب) |
| **النطاق**        | المحادثة بأكملها           | نتائج الأدوات فقط                |

[تقليم الجلسة](/ar/concepts/session-pruning) هو مكمل أخف وزنًا يقص مخرجات الأدوات من دون تلخيص.

## استكشاف الأخطاء وإصلاحها

**هل يحدث Compaction كثيرًا؟** قد تكون نافذة سياق النموذج صغيرة، أو قد تكون مخرجات الأدوات كبيرة. جرّب تفعيل [تقليم الجلسة](/ar/concepts/session-pruning).

**هل يبدو السياق قديمًا بعد Compaction؟** استخدم `/compact Focus on <topic>` لتوجيه الملخص، أو فعّل [تفريغ الذاكرة](/ar/concepts/memory) حتى تبقى الملاحظات.

**هل تحتاج إلى بداية نظيفة؟** يبدأ `/new` جلسة جديدة من دون Compaction.

للإعداد المتقدم (حجز الرموز، الحفاظ على المعرّفات، محركات السياق المخصصة، Compaction من جهة خادم OpenAI)، راجع [التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

## ذو صلة

- [الجلسة](/ar/concepts/session): إدارة الجلسة ودورة حياتها.
- [تقليم الجلسة](/ar/concepts/session-pruning): قص نتائج الأدوات.
- [السياق](/ar/concepts/context): كيف يُبنى السياق لأدوار الوكيل.
- [الخطافات](/ar/automation/hooks): خطافات دورة حياة Compaction (`before_compaction`, `after_compaction`).
