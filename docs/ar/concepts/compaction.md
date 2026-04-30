---
read_when:
    - تريد فهم Compaction التلقائي و /compact
    - أنت تصحح أخطاء الجلسات الطويلة التي تصل إلى حدود السياق
summary: كيف يلخّص OpenClaw المحادثات الطويلة للبقاء ضمن حدود النموذج
title: Compaction
x-i18n:
    generated_at: "2026-04-30T07:51:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

لكل نموذج نافذة سياق: الحد الأقصى لعدد الرموز التي يمكنه معالجتها. عندما تقترب محادثة من ذلك الحد، يقوم OpenClaw بعملية **Compaction** للرسائل الأقدم في ملخص حتى يمكن أن تستمر الدردشة.

## كيف يعمل

1. تُلخَّص دورات المحادثة الأقدم في إدخال مضغوط.
2. يُحفظ الملخص في نص جلسة المحادثة.
3. تُبقى الرسائل الحديثة كما هي.

عندما يقسم OpenClaw السجل إلى أجزاء Compaction، فإنه يبقي استدعاءات أدوات المساعد مقترنة بإدخالات `toolResult` المطابقة لها. إذا وقع موضع التقسيم داخل كتلة أداة، ينقل OpenClaw الحد بحيث يبقى الزوج معًا ويُحافظ على الذيل الحالي غير الملخص.

يبقى سجل المحادثة الكامل على القرص. تغيّر Compaction فقط ما يراه النموذج في الدور التالي.

## Compaction التلقائية

تكون Compaction التلقائية مفعلة افتراضيًا. تعمل عندما تقترب الجلسة من حد السياق، أو عندما يُرجع النموذج خطأ تجاوز السياق (وفي هذه الحالة يقوم OpenClaw بعملية Compaction ثم يعيد المحاولة).

سترى:

- `🧹 Auto-compaction complete` في الوضع المطوّل.
- `/status` يعرض `🧹 Compactions: <count>`.

<Info>
قبل إجراء Compaction، يذكّر OpenClaw الوكيل تلقائيًا بحفظ الملاحظات المهمة في ملفات [الذاكرة](/ar/concepts/memory). يمنع هذا فقدان السياق.
</Info>

<AccordionGroup>
  <Accordion title="تواقيع التجاوز المعروفة">
    يكتشف OpenClaw تجاوز السياق من أنماط أخطاء المزوّدين هذه:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction اليدوية

اكتب `/compact` في أي دردشة لفرض Compaction. أضف تعليمات لتوجيه الملخص:

```
/compact Focus on the API design decisions
```

عند ضبط `agents.defaults.compaction.keepRecentTokens`، تحترم Compaction اليدوية نقطة قص Pi هذه وتبقي الذيل الحديث في السياق المعاد بناؤه. من دون ميزانية إبقاء صريحة، تعمل Compaction اليدوية كنقطة تحقق صارمة وتستمر من الملخص الجديد وحده.

## التكوين

اضبط Compaction ضمن `agents.defaults.compaction` في ملف `openclaw.json` لديك. أكثر عناصر التحكم شيوعًا مذكورة أدناه؛ وللمرجع الكامل، راجع [التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

### استخدام نموذج مختلف

افتراضيًا، تستخدم Compaction النموذج الأساسي للوكيل. عيّن `agents.defaults.compaction.model` لتفويض التلخيص إلى نموذج أكثر قدرة أو تخصصًا. يقبل التجاوز أي سلسلة `provider/model-id`:

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

عند عدم ضبطه، تستخدم Compaction النموذج الأساسي للوكيل.

### الحفاظ على المعرّفات

يحافظ تلخيص Compaction على المعرّفات المعتمة افتراضيًا (`identifierPolicy: "strict"`). تجاوز ذلك باستخدام `identifierPolicy: "off"` للتعطيل، أو `identifierPolicy: "custom"` مع `identifierInstructions` لإرشادات مخصصة.

### حارس بايتات نص الجلسة النشط

عند ضبط `agents.defaults.compaction.maxActiveTranscriptBytes`، يفعّل OpenClaw عملية Compaction محلية عادية قبل التشغيل إذا بلغ ملف JSONL النشط ذلك الحجم. هذا مفيد للجلسات طويلة التشغيل حيث قد تبقي إدارة السياق من جهة المزوّد سياق النموذج سليمًا بينما يستمر نص الجلسة المحلي في النمو. لا يقسم بايتات JSONL الخام؛ بل يطلب من مسار Compaction العادي إنشاء ملخص دلالي.

<Warning>
يتطلب حارس البايتات `truncateAfterCompaction: true`. من دون تدوير نص الجلسة، لن ينكمش الملف النشط وسيبقى الحارس غير نشط.
</Warning>

### نصوص جلسة لاحقة

عند تفعيل `agents.defaults.compaction.truncateAfterCompaction`، لا يعيد OpenClaw كتابة نص الجلسة الحالي في مكانه. ينشئ نص جلسة لاحقًا نشطًا جديدًا من ملخص Compaction والحالة المحفوظة والذيل غير الملخص، ثم يحتفظ بملف JSONL السابق كمصدر نقطة تحقق مؤرشف.
تحذف نصوص الجلسة اللاحقة أيضًا التكرارات المطابقة الطويلة لأدوار المستخدم التي تصل
داخل نافذة إعادة محاولة قصيرة، بحيث لا تُنقل عواصف إعادة المحاولة في القناة إلى
نص الجلسة النشط التالي بعد Compaction.

لا تُحتفظ بنقاط التحقق السابقة لـ Compaction إلا ما دامت أقل من حد حجم نقاط
التحقق في OpenClaw؛ لا تزال نصوص الجلسة النشطة كبيرة الحجم تُضغط، لكن OpenClaw
يتخطى لقطة التصحيح الكبيرة بدلًا من مضاعفة استخدام القرص.

### إشعارات Compaction

افتراضيًا، تعمل Compaction بصمت. عيّن `notifyUser` لإظهار رسائل حالة موجزة عند بدء Compaction واكتمالها:

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

قبل Compaction، يمكن لـ OpenClaw تشغيل دور **تفريغ ذاكرة صامت** لتخزين الملاحظات الدائمة على القرص. عيّن `agents.defaults.compaction.memoryFlush.model` عندما يجب أن يستخدم دور الصيانة هذا نموذجًا محليًا بدلًا من نموذج المحادثة النشط:

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

تجاوز نموذج تفريغ الذاكرة دقيق ولا يرث سلسلة الرجوع الاحتياطي للجلسة النشطة. راجع [الذاكرة](/ar/concepts/memory) للتفاصيل والتكوين.

## مزوّدو Compaction القابلون للتوصيل

يمكن لـ Plugins تسجيل مزوّد Compaction مخصص عبر `registerCompactionProvider()` في واجهة Plugin البرمجية. عند تسجيل مزوّد وتكوينه، يفوّض OpenClaw التلخيص إليه بدلًا من مسار LLM المدمج.

لاستخدام مزوّد مسجل، عيّن معرّفه في تكوينك:

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

يفرض ضبط `provider` تلقائيًا `mode: "safeguard"`. يتلقى المزوّدون تعليمات Compaction نفسها وسياسة الحفاظ على المعرّفات نفسها مثل المسار المدمج، ولا يزال OpenClaw يحافظ على سياق لاحقة الأدوار الحديثة والأدوار المقسمة بعد إخراج المزوّد.

<Note>
إذا فشل المزوّد أو أرجع نتيجة فارغة، يعود OpenClaw إلى تلخيص LLM المدمج.
</Note>

## Compaction مقابل التشذيب

|                  | Compaction                    | التشذيب                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **ماذا يفعل** | يلخّص المحادثة الأقدم | يقتطع نتائج الأدوات القديمة           |
| **محفوظ؟**       | نعم (في نص جلسة المحادثة)   | لا (في الذاكرة فقط، لكل طلب) |
| **النطاق**        | المحادثة كاملة           | نتائج الأدوات فقط                |

[تشذيب الجلسة](/ar/concepts/session-pruning) مكمل أخف يقتطع مخرجات الأدوات من دون تلخيص.

## استكشاف الأخطاء وإصلاحها

**تحدث Compaction كثيرًا جدًا؟** قد تكون نافذة سياق النموذج صغيرة، أو قد تكون مخرجات الأدوات كبيرة. جرّب تفعيل [تشذيب الجلسة](/ar/concepts/session-pruning).

**يبدو السياق قديمًا بعد Compaction؟** استخدم `/compact Focus on <topic>` لتوجيه الملخص، أو فعّل [تفريغ الذاكرة](/ar/concepts/memory) حتى تبقى الملاحظات.

**تحتاج إلى بداية نظيفة؟** يبدأ `/new` جلسة جديدة من دون إجراء Compaction.

للتكوين المتقدم (الرموز المحجوزة، الحفاظ على المعرّفات، محركات السياق المخصصة، Compaction من جهة خادم OpenAI)، راجع [التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

## ذات صلة

- [الجلسة](/ar/concepts/session): إدارة الجلسة ودورة حياتها.
- [تشذيب الجلسة](/ar/concepts/session-pruning): اقتطاع نتائج الأدوات.
- [السياق](/ar/concepts/context): كيف يُبنى السياق لأدوار الوكيل.
- [الخطافات](/ar/automation/hooks): خطافات دورة حياة Compaction (`before_compaction`, `after_compaction`).
