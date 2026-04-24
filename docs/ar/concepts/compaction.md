---
read_when:
    - تريد فهم Compaction التلقائي و`/compact`
    - أنت تصحّح جلسات طويلة تصطدم بحدود السياق
summary: كيف يلخّص OpenClaw المحادثات الطويلة للبقاء ضمن حدود النموذج
title: Compaction
x-i18n:
    generated_at: "2026-04-24T07:36:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

لكل نموذج نافذة سياق — وهي الحد الأقصى لعدد الرموز التي يمكنه معالجتها.
عندما تقترب المحادثة من ذلك الحد، يجري OpenClaw **Compaction** للرسائل الأقدم
في ملخص بحيث يمكن متابعة الدردشة.

## كيف يعمل

1. تُلخَّص أدوار المحادثة الأقدم في إدخال مضغوط.
2. يُحفَظ الملخص في سجل الجلسة.
3. تُحفَظ الرسائل الحديثة كما هي.

عندما يقسم OpenClaw السجل إلى مقاطع Compaction، فإنه يُبقي استدعاءات أدوات
المساعد مقترنة بإدخالات `toolResult` المطابقة لها. وإذا وقعت نقطة التقسيم
داخل كتلة أداة، ينقل OpenClaw الحد بحيث تبقى الأزواج معًا
ويتم الحفاظ على الذيل الحالي غير الملخص.

يبقى سجل المحادثة الكامل محفوظًا على القرص. يغيّر Compaction فقط ما
يراه النموذج في الدور التالي.

## Compaction التلقائي

يكون Compaction التلقائي مفعّلًا افتراضيًا. ويعمل عندما تقترب الجلسة من حد
السياق، أو عندما يعيد النموذج خطأ تجاوز السياق (وفي هذه الحالة
يجري OpenClaw عملية Compaction ثم يعيد المحاولة). تتضمن أنماط تجاوز الحد الشائعة
`request_too_large` و`context length exceeded` و`input exceeds the maximum
number of tokens` و`input token count exceeds the maximum number of input
tokens` و`input is too long for the model` و`ollama error: context length
exceeded`.

<Info>
قبل إجراء Compaction، يذكّر OpenClaw الوكيل تلقائيًا بحفظ
الملاحظات المهمة في ملفات [الذاكرة](/ar/concepts/memory). وهذا يمنع فقدان السياق.
</Info>

استخدم الإعداد `agents.defaults.compaction` في ملف `openclaw.json` لضبط سلوك Compaction (الوضع، والرموز المستهدفة، وغير ذلك).
تحافظ عملية تلخيص Compaction على المعرّفات المعتمة افتراضيًا (`identifierPolicy: "strict"`). ويمكنك تجاوز ذلك باستخدام `identifierPolicy: "off"` أو توفير نص مخصص باستخدام `identifierPolicy: "custom"` و`identifierInstructions`.

يمكنك اختياريًا تحديد نموذج مختلف لتلخيص Compaction عبر `agents.defaults.compaction.model`. ويكون هذا مفيدًا عندما يكون نموذجك الأساسي نموذجًا محليًا أو صغيرًا وتريد أن تُنتَج ملخصات Compaction بواسطة نموذج أكثر قدرة. يقبل هذا التجاوز أي سلسلة `provider/model-id`:

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

يعمل هذا أيضًا مع النماذج المحلية، مثل نموذج Ollama ثانٍ مخصص للتلخيص أو مختص Compaction مضبوط بدقة:

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

عندما لا يتم ضبطه، يستخدم Compaction النموذج الأساسي للوكيل.

## موفرو Compaction القابلون للتوصيل

يمكن لـ Plugins تسجيل موفر Compaction مخصص عبر `registerCompactionProvider()` في Plugin API. وعندما يكون موفر مسجلًا ومضبوطًا، يفوض OpenClaw التلخيص إليه بدلًا من مسار LLM المضمّن.

لاستخدام موفر مسجل، اضبط معرّف الموفر في إعداداتك:

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

يؤدي ضبط `provider` تلقائيًا إلى فرض `mode: "safeguard"`. وتتلقى الموفرات تعليمات Compaction نفسها وسياسة الحفاظ على المعرّفات نفسها كما في المسار المضمّن، كما يحافظ OpenClaw أيضًا على سياق لاحقة الأدوار الحديثة والأدوار المنقسمة بعد مخرجات الموفر. وإذا فشل الموفر أو أعاد نتيجة فارغة، يعود OpenClaw إلى التلخيص المضمّن باستخدام LLM.

## Compaction التلقائي (مفعّل افتراضيًا)

عندما تقترب الجلسة من نافذة سياق النموذج أو تتجاوزها، يطلق OpenClaw Compaction التلقائي وقد يعيد محاولة الطلب الأصلي باستخدام السياق المضغوط.

سترى:

- `🧹 Auto-compaction complete` في الوضع المفصل
- إظهار `/status` للقيمة `🧹 Compactions: <count>`

قبل Compaction، يمكن لـ OpenClaw تشغيل دور **تفريغ ذاكرة صامت** لتخزين
الملاحظات الدائمة على القرص. راجع [الذاكرة](/ar/concepts/memory) لمعرفة التفاصيل والإعدادات.

## Compaction اليدوي

اكتب `/compact` في أي دردشة لفرض Compaction. أضف تعليمات لتوجيه
الملخص:

```
/compact Focus on the API design decisions
```

## استخدام نموذج مختلف

افتراضيًا، يستخدم Compaction النموذج الأساسي للوكيل. يمكنك استخدام نموذج
أكثر قدرة للحصول على ملخصات أفضل:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## إشعارات Compaction

افتراضيًا، يعمل Compaction بصمت. ولإظهار إشعارات مختصرة عند بدء Compaction
وعند اكتماله، فعّل `notifyUser`:

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

عند التفعيل، يرى المستخدم رسائل حالة قصيرة حول كل تشغيل Compaction
(مثل "جارٍ ضغط السياق..." و"اكتمل Compaction").

## Compaction مقابل التقليص

| | Compaction | التقليص |
| ---------------- | ----------------------------- | -------------------------------- |
| **ما الذي يفعله** | يلخص المحادثة الأقدم | يزيل نتائج الأدوات القديمة |
| **هل يُحفَظ؟** | نعم (في سجل الجلسة) | لا (داخل الذاكرة فقط، لكل طلب) |
| **النطاق** | المحادثة كاملة | نتائج الأدوات فقط |

يُعد [تقليص الجلسة](/ar/concepts/session-pruning) مكمّلًا أخف وزنًا
يقص مخرجات الأدوات من دون تلخيص.

## استكشاف الأخطاء وإصلاحها

**هل يحدث Compaction كثيرًا؟** قد تكون نافذة سياق النموذج صغيرة، أو قد تكون
مخرجات الأدوات كبيرة. جرّب تفعيل
[تقليص الجلسة](/ar/concepts/session-pruning).

**هل يبدو السياق قديمًا بعد Compaction؟** استخدم `/compact Focus on <topic>` لتوجيه
الملخص، أو فعّل [تفريغ الذاكرة](/ar/concepts/memory) حتى
تظل الملاحظات محفوظة.

**هل تحتاج إلى بداية نظيفة؟** يبدأ `/new` جلسة جديدة من دون Compaction.

للحصول على إعدادات متقدمة (الرموز الاحتياطية، والحفاظ على المعرّفات، ومحركات
السياق المخصصة، وCompaction من جهة الخادم في OpenAI)، راجع
[التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

## ذو صلة

- [الجلسة](/ar/concepts/session) — إدارة الجلسات ودورة الحياة
- [تقليص الجلسة](/ar/concepts/session-pruning) — إزالة نتائج الأدوات
- [السياق](/ar/concepts/context) — كيفية بناء السياق لأدوار الوكيل
- [الخطافات](/ar/automation/hooks) — خطافات دورة حياة Compaction ‏(before_compaction, after_compaction)
