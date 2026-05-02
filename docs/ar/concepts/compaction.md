---
read_when:
    - تريد فهم الـ Compaction التلقائي و /compact
    - أنت تصحّح أخطاء الجلسات الطويلة التي تصل إلى حدود السياق
summary: كيف يلخّص OpenClaw المحادثات الطويلة للبقاء ضمن حدود النموذج
title: Compaction
x-i18n:
    generated_at: "2026-05-02T07:24:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

لكل نموذج نافذة سياق: وهي الحد الأقصى لعدد الرموز التي يمكنه معالجتها. عندما تقترب محادثة من ذلك الحد، يقوم OpenClaw بعمل **Compaction** للرسائل الأقدم في ملخص حتى تتمكن الدردشة من الاستمرار.

## كيف يعمل

1. تُلخَّص أدوار المحادثة الأقدم في إدخال مضغوط.
2. يُحفَظ الملخص في سجل الجلسة.
3. تُترك الرسائل الحديثة كما هي.

عندما يقسم OpenClaw السجل إلى أجزاء Compaction، فإنه يبقي استدعاءات أدوات المساعد مقترنة بإدخالات `toolResult` المطابقة لها. إذا وقعت نقطة التقسيم داخل كتلة أداة، ينقل OpenClaw الحد بحيث يبقى الزوج معا ويتم الحفاظ على الذيل الحالي غير الملخص.

يبقى سجل المحادثة الكامل على القرص. لا يغير Compaction إلا ما يراه النموذج في الدور التالي.

## Compaction التلقائي

يكون Compaction التلقائي مفعلا افتراضيا. يعمل عندما تقترب الجلسة من حد السياق، أو عندما يعيد النموذج خطأ فيض السياق، وفي هذه الحالة يجري OpenClaw عملية Compaction ويعيد المحاولة.

سترى:

- `🧹 Auto-compaction complete` في الوضع المطوّل.
- يعرض `/status` العبارة `🧹 Compactions: <count>`.

<Info>
قبل إجراء Compaction، يذكّر OpenClaw الوكيل تلقائيا بحفظ الملاحظات المهمة في ملفات [الذاكرة](/ar/concepts/memory). يمنع ذلك فقدان السياق.
</Info>

<AccordionGroup>
  <Accordion title="تواقيع الفيض المعروفة">
    يكتشف OpenClaw فيض السياق من أنماط أخطاء المزوّدين هذه:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction اليدوي

اكتب `/compact` في أي دردشة لفرض عملية Compaction. أضف تعليمات لتوجيه الملخص:

```
/compact Focus on the API design decisions
```

عند ضبط `agents.defaults.compaction.keepRecentTokens`، يحترم Compaction اليدوي نقطة القطع الخاصة بـ Pi ويحافظ على الذيل الحديث في السياق المعاد بناؤه. من دون ميزانية احتفاظ صريحة، يتصرف Compaction اليدوي كنقطة تحقق صارمة ويستمر من الملخص الجديد وحده.

## التكوين

اضبط Compaction ضمن `agents.defaults.compaction` في ملف `openclaw.json`. أكثر عناصر التحكم شيوعا مذكورة أدناه؛ وللمرجع الكامل، راجع [التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

### استخدام نموذج مختلف

افتراضيا، يستخدم Compaction النموذج الأساسي للوكيل. اضبط `agents.defaults.compaction.model` لتفويض التلخيص إلى نموذج أكثر قدرة أو أكثر تخصصا. يقبل التجاوز أي سلسلة `provider/model-id`:

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

يعمل هذا أيضا مع النماذج المحلية، مثل نموذج Ollama ثان مخصص للتلخيص:

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

عند عدم ضبطه، يبدأ Compaction بنموذج الجلسة النشط. إذا فشل التلخيص بسبب خطأ مزوّد مؤهل للرجوع الاحتياطي بين النماذج، يعيد OpenClaw محاولة Compaction تلك عبر سلسلة الرجوع الاحتياطي الحالية لنماذج الجلسة. يكون اختيار الرجوع الاحتياطي مؤقتا ولا يُكتب مرة أخرى إلى حالة الجلسة. يبقى تجاوز `agents.defaults.compaction.model` الصريح دقيقا ولا يرث سلسلة الرجوع الاحتياطي للجلسة.

### الحفاظ على المعرّفات

يحافظ تلخيص Compaction على المعرّفات المعتمة افتراضيا (`identifierPolicy: "strict"`). تجاوز ذلك باستخدام `identifierPolicy: "off"` للتعطيل، أو `identifierPolicy: "custom"` مع `identifierInstructions` لتوجيه مخصص.

### حارس بايتات السجل النشط

عند ضبط `agents.defaults.compaction.maxActiveTranscriptBytes`، يشغّل OpenClaw عملية Compaction محلية عادية قبل التشغيل إذا وصل ملف JSONL النشط إلى ذلك الحجم. يفيد ذلك في الجلسات طويلة التشغيل حيث قد تحافظ إدارة السياق من جهة المزوّد على سلامة سياق النموذج بينما يستمر السجل المحلي في النمو. لا يقسم بايتات JSONL الخام؛ بل يطلب من مسار Compaction العادي إنشاء ملخص دلالي.

<Warning>
يتطلب حارس البايتات `truncateAfterCompaction: true`. من دون تدوير السجل، لن ينكمش الملف النشط وسيبقى الحارس غير نشط.
</Warning>

### السجلات اللاحقة

عند تفعيل `agents.defaults.compaction.truncateAfterCompaction`، لا يعيد OpenClaw كتابة السجل الحالي في مكانه. بل ينشئ سجل لاحق نشط جديد من ملخص Compaction والحالة المحفوظة والذيل غير الملخص، ثم يحتفظ بملف JSONL السابق كمصدر نقطة تحقق مؤرشف.
تُسقط السجلات اللاحقة أيضا أدوار المستخدم الطويلة المكررة حرفيا التي تصل
داخل نافذة إعادة محاولة قصيرة، بحيث لا تنتقل عواصف إعادة المحاولة في القناة إلى
السجل النشط التالي بعد Compaction.

لا يُحتفظ بنقاط التحقق السابقة لـ Compaction إلا ما دامت دون حد حجم نقاط التحقق
في OpenClaw؛ لا تزال السجلات النشطة الضخمة تخضع لـ Compaction، لكن OpenClaw
يتخطى لقطة التصحيح الكبيرة بدلا من مضاعفة استخدام القرص.

### إشعارات Compaction

افتراضيا، يعمل Compaction بصمت. اضبط `notifyUser` لإظهار رسائل حالة موجزة عند بدء Compaction واكتماله:

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

قبل Compaction، يستطيع OpenClaw تشغيل دور **تفريغ ذاكرة صامت** لتخزين الملاحظات الدائمة على القرص. اضبط `agents.defaults.compaction.memoryFlush.model` عندما يجب أن يستخدم دور الصيانة هذا نموذجا محليا بدلا من نموذج المحادثة النشط:

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

يمكن لـ Plugins تسجيل مزوّد Compaction مخصص عبر `registerCompactionProvider()` على واجهة برمجة تطبيقات Plugin. عند تسجيل مزوّد وتكوينه، يفوّض OpenClaw التلخيص إليه بدلا من مسار LLM المدمج.

لاستخدام مزوّد مسجل، اضبط معرّفه في تكوينك:

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

يفرض ضبط `provider` تلقائيا `mode: "safeguard"`. يتلقى المزوّدون تعليمات Compaction نفسها وسياسة الحفاظ على المعرّفات نفسها مثل المسار المدمج، ويظل OpenClaw يحافظ على سياق لاحقة الأدوار الحديثة والأدوار المقسمة بعد خرج المزوّد.

<Note>
إذا فشل المزوّد أو أعاد نتيجة فارغة، يرجع OpenClaw إلى تلخيص LLM المدمج.
</Note>

## Compaction مقابل التقليم

|                  | Compaction                    | التقليم                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **ما يفعله** | يلخص المحادثة الأقدم | يقتطع نتائج الأدوات القديمة           |
| **محفوظ؟**       | نعم، في سجل الجلسة   | لا، في الذاكرة فقط، لكل طلب |
| **النطاق**        | المحادثة كاملة           | نتائج الأدوات فقط                |

[تقليم الجلسة](/ar/concepts/session-pruning) هو مكمل أخف وزنا يقتطع خرج الأدوات من دون تلخيص.

## استكشاف الأخطاء وإصلاحها

**هل يحدث Compaction كثيرا؟** قد تكون نافذة سياق النموذج صغيرة، أو قد تكون مخرجات الأدوات كبيرة. جرّب تفعيل [تقليم الجلسة](/ar/concepts/session-pruning).

**هل يبدو السياق قديما بعد Compaction؟** استخدم `/compact Focus on <topic>` لتوجيه الملخص، أو فعّل [تفريغ الذاكرة](/ar/concepts/memory) حتى تبقى الملاحظات محفوظة.

**هل تحتاج إلى بداية نظيفة؟** يبدأ `/new` جلسة جديدة من دون Compaction.

للتكوين المتقدم، مثل الرموز المحجوزة، والحفاظ على المعرّفات، ومحركات السياق المخصصة، وCompaction من جهة خادم OpenAI، راجع [التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

## ذو صلة

- [الجلسة](/ar/concepts/session): إدارة الجلسة ودورة حياتها.
- [تقليم الجلسة](/ar/concepts/session-pruning): اقتطاع نتائج الأدوات.
- [السياق](/ar/concepts/context): كيف يُبنى السياق لأدوار الوكيل.
- [الخطافات](/ar/automation/hooks): خطافات دورة حياة Compaction (`before_compaction`, `after_compaction`).
