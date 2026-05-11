---
read_when:
    - تريد فهم الضغط التلقائي و /compact
    - أنت تعمل على تصحيح أخطاء الجلسات الطويلة التي تصل إلى حدود السياق
summary: كيف يلخّص OpenClaw المحادثات الطويلة للبقاء ضمن حدود النموذج
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

لكل نموذج نافذة سياق: الحد الأقصى لعدد الرموز التي يمكنه معالجتها. عندما تقترب محادثة من ذلك الحد، ينفّذ OpenClaw **Compaction** للرسائل الأقدم في ملخص حتى تتمكن الدردشة من المتابعة.

## كيف يعمل

1. تُلخَّص أدوار المحادثة الأقدم في إدخال مضغوط.
2. يُحفَظ الملخص في سجل الجلسة.
3. تُبقى الرسائل الحديثة كما هي.

عندما يقسّم OpenClaw السجل إلى أجزاء Compaction، فإنه يُبقي استدعاءات أدوات المساعد مقترنة بإدخالات `toolResult` المطابقة لها. إذا وقع موضع التقسيم داخل كتلة أداة، ينقل OpenClaw الحد بحيث يبقى الزوج معًا ويُحفَظ الذيل الحالي غير الملخّص.

يبقى سجل المحادثة الكامل على القرص. يغيّر Compaction فقط ما يراه النموذج في الدور التالي.

## Compaction التلقائي

يكون Compaction التلقائي مفعّلًا افتراضيًا. يعمل عندما تقترب الجلسة من حد السياق، أو عندما يعيد النموذج خطأ تجاوز السياق (وفي هذه الحالة ينفّذ OpenClaw عملية Compaction ثم يعيد المحاولة).

سترى:

- `embedded run auto-compaction start` / `complete` في سجلات Gateway العادية.
- `🧹 Auto-compaction complete` في الوضع المطوّل.
- يعرض `/status` القيمة `🧹 Compactions: <count>`.

<Info>
قبل تنفيذ Compaction، يذكّر OpenClaw الوكيل تلقائيًا بحفظ الملاحظات المهمة في ملفات [الذاكرة](/ar/concepts/memory). يمنع ذلك فقدان السياق.
</Info>

<AccordionGroup>
  <Accordion title="توقيعات التجاوز المعروفة">
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

عند ضبط `agents.defaults.compaction.keepRecentTokens`، يحترم Compaction اليدوي نقطة قطع Pi تلك ويبقي الذيل الحديث في السياق المعاد بناؤه. من دون ميزانية إبقاء صريحة، يتصرف Compaction اليدوي كنقطة تحقق صارمة ويتابع من الملخص الجديد وحده.

## التهيئة

هيّئ Compaction ضمن `agents.defaults.compaction` في ملف `openclaw.json` لديك. المقابض الأكثر شيوعًا مذكورة أدناه؛ وللمرجع الكامل، راجع [التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

### استخدام نموذج مختلف

افتراضيًا، يستخدم Compaction النموذج الأساسي للوكيل. اضبط `agents.defaults.compaction.model` لتفويض التلخيص إلى نموذج أكثر قدرة أو أكثر تخصصًا. يقبل التجاوز أي سلسلة `provider/model-id`:

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

يعمل هذا أيضًا مع النماذج المحلية، مثل نموذج Ollama ثانٍ مخصص للتلخيص:

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

عند عدم ضبطه، يبدأ Compaction بنموذج الجلسة النشط. إذا فشل التلخيص بسبب خطأ مزوّد مؤهل للرجوع الاحتياطي إلى نموذج آخر، يعيد OpenClaw محاولة عملية Compaction تلك عبر سلسلة الرجوع الاحتياطي الحالية لنموذج الجلسة. يكون اختيار الرجوع الاحتياطي مؤقتًا ولا يُكتب مرة أخرى إلى حالة الجلسة. يظل تجاوز `agents.defaults.compaction.model` الصريح دقيقًا ولا يرث سلسلة الرجوع الاحتياطي للجلسة.

### الحفاظ على المعرّفات

يحافظ تلخيص Compaction على المعرّفات المعتمة افتراضيًا (`identifierPolicy: "strict"`). تجاوز ذلك باستخدام `identifierPolicy: "off"` للتعطيل، أو `identifierPolicy: "custom"` مع `identifierInstructions` للحصول على إرشادات مخصصة.

### حارس بايتات السجل النشط

عند ضبط `agents.defaults.compaction.maxActiveTranscriptBytes`، يشغّل OpenClaw عملية Compaction محلية عادية قبل التشغيل إذا بلغ ملف JSONL النشط ذلك الحجم. هذا مفيد للجلسات طويلة التشغيل التي قد تحافظ فيها إدارة السياق من جهة المزوّد على سلامة سياق النموذج بينما يستمر السجل المحلي في النمو. لا يقسم بايتات JSONL الخام؛ بل يطلب من مسار Compaction العادي إنشاء ملخص دلالي.

<Warning>
يتطلب حارس البايتات `truncateAfterCompaction: true`. من دون تدوير السجل، لن يتقلص الملف النشط ويبقى الحارس غير نشط.
</Warning>

### السجلات اللاحقة

عند تمكين `agents.defaults.compaction.truncateAfterCompaction`، لا يعيد OpenClaw كتابة السجل الحالي في مكانه. ينشئ سجلًا لاحقًا نشطًا جديدًا من ملخص Compaction والحالة المحفوظة والذيل غير الملخّص، ثم يُبقي ملف JSONL السابق كمصدر مؤرشف لنقطة التحقق.
تُسقط السجلات اللاحقة أيضًا أدوار المستخدم الطويلة المكررة تطابقًا تامًا التي تصل
داخل نافذة إعادة محاولة قصيرة، بحيث لا تُحمَل عواصف إعادة محاولة القنوات إلى
السجل النشط التالي بعد Compaction.

لا تُحتفظ بنقاط التحقق السابقة لـ Compaction إلا ما دامت دون حد حجم نقاط التحقق في OpenClaw؛
تظل السجلات النشطة الضخمة تُضغط، لكن OpenClaw
يتجاوز لقطة التصحيح الكبيرة بدلًا من مضاعفة استخدام القرص.

### إشعارات Compaction

افتراضيًا، يعمل Compaction بصمت. اضبط `notifyUser` لإظهار رسائل حالة موجزة عند بدء Compaction واكتماله:

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

قبل Compaction، يمكن لـ OpenClaw تشغيل دور **تفريغ ذاكرة صامت** لتخزين ملاحظات دائمة على القرص. اضبط `agents.defaults.compaction.memoryFlush.model` عندما ينبغي أن يستخدم دور الصيانة هذا نموذجًا محليًا بدلًا من نموذج المحادثة النشط:

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

تجاوز نموذج تفريغ الذاكرة دقيق ولا يرث سلسلة الرجوع الاحتياطي للجلسة النشطة. راجع [الذاكرة](/ar/concepts/memory) للتفاصيل والتهيئة.

## مزوّدو Compaction القابلون للتوصيل

يمكن لـ Plugins تسجيل مزوّد Compaction مخصص عبر `registerCompactionProvider()` في واجهة برمجة تطبيقات Plugin. عند تسجيل مزوّد وتهيئته، يفوّض OpenClaw التلخيص إليه بدلًا من مسار LLM المضمّن.

لاستخدام مزوّد مسجّل، اضبط معرّفه في التهيئة لديك:

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

يؤدي ضبط `provider` تلقائيًا إلى فرض `mode: "safeguard"`. يتلقى المزوّدون تعليمات Compaction نفسها وسياسة الحفاظ على المعرّفات نفسها التي يستخدمها المسار المضمّن، ويظل OpenClaw يحافظ على سياق لاحقة الأدوار الحديثة والأدوار المقسّمة بعد إخراج المزوّد.

<Note>
إذا فشل المزوّد أو أعاد نتيجة فارغة، يرجع OpenClaw إلى تلخيص LLM المضمّن.
</Note>

## Compaction مقابل التقليم

|                  | Compaction                    | التقليم                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **ما الذي يفعله** | يلخص المحادثة الأقدم | يقتطع نتائج الأدوات القديمة           |
| **محفوظ؟**       | نعم (في سجل الجلسة)   | لا (في الذاكرة فقط، لكل طلب) |
| **النطاق**        | المحادثة بأكملها           | نتائج الأدوات فقط                |

[تقليم الجلسة](/ar/concepts/session-pruning) مكمل أخف وزنًا يقتطع إخراج الأدوات من دون تلخيص.

## استكشاف الأخطاء وإصلاحها

**هل يحدث Compaction كثيرًا؟** قد تكون نافذة سياق النموذج صغيرة، أو قد تكون مخرجات الأدوات كبيرة. جرّب تمكين [تقليم الجلسة](/ar/concepts/session-pruning).

**هل يبدو السياق قديمًا بعد Compaction؟** استخدم `/compact Focus on <topic>` لتوجيه الملخص، أو فعّل [تفريغ الذاكرة](/ar/concepts/memory) حتى تبقى الملاحظات.

**هل تحتاج إلى صفحة جديدة؟** يبدأ `/new` جلسة جديدة من دون تنفيذ Compaction.

لتهيئة متقدمة (الرموز الاحتياطية، الحفاظ على المعرّفات، محركات السياق المخصصة، Compaction من جهة خادم OpenAI)، راجع [التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

## ذات صلة

- [الجلسة](/ar/concepts/session): إدارة الجلسة ودورة حياتها.
- [تقليم الجلسة](/ar/concepts/session-pruning): اقتطاع نتائج الأدوات.
- [السياق](/ar/concepts/context): كيفية بناء السياق لأدوار الوكيل.
- [الخطافات](/ar/automation/hooks): خطافات دورة حياة Compaction (`before_compaction`, `after_compaction`).
