---
read_when:
    - تريد خطوة لنموذج لغوي كبير تُخرج JSON فقط داخل سير العمل
    - تحتاج إلى مخرجات من نموذج لغوي كبير تم التحقق من صحتها وفق مخطط لاستخدامها في الأتمتة
summary: مهام نماذج اللغة الكبيرة التي تستخدم JSON فقط لسير العمل (أداة Plugin اختيارية)
title: مهمة نموذج اللغة الكبير
x-i18n:
    generated_at: "2026-07-12T06:36:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` هي **أداة Plugin اختيارية مضمّنة** تُجري استدعاءً واحدًا إلى LLM لا يُرجع إلا JSON، وتُعيد مخرجات منظَّمة، مع إمكانية التحقق منها اختياريًا باستخدام مخطط JSON. وتوفّر لمحركات سير العمل مثل Lobster خطوة LLM من دون الحاجة إلى كتابة شيفرة OpenClaw مخصّصة لكل سير عمل.

## التفعيل

1. فعّل Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. اسمح بالأداة:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

يضيف `alsoAllow` الأداة `llm-task` إلى ملف تعريف الأدوات النشط من دون تقييد أدوات النواة الأخرى. استخدم `tools.allow` بدلًا منه فقط إذا كنت تريد وضع قائمة سماح تقييدية.

## الإعداد (اختياري)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` هي قائمة سماح من سلاسل `provider/model`؛ ويُرفض طلب أي نموذج آخر. أما جميع المفاتيح الأخرى فهي قيم احتياطية لكل استدعاء، وتُستخدم عندما لا يتضمن استدعاء الأداة ذلك المَعْلَمة.

## مَعْلَمات الأداة

| المَعْلَمة       | النوع   | ملاحظات                                                                                                                                         |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | مطلوبة. تعليمات المهمة الموجّهة إلى LLM.                                                                                                       |
| `input`         | any    | حمولة اختيارية؛ تُسلسل إلى JSON وتُلحق بالموجّه.                                                                              |
| `schema`        | object | مخطط JSON اختياري يجب أن تجتاز المخرجات المحلَّلة التحقق وفقًا له.                                                                                 |
| `provider`      | string | يتجاوز `defaultProvider` / المزوّد الافتراضي للوكيل.                                                                                   |
| `model`         | string | يتجاوز `defaultModel`؛ ويقبل معرّفات النماذج المجرّدة أو الأسماء البديلة أو مرجعًا بصيغة `provider/model` (تُزال بادئة المزوّد المكررة تلقائيًا). |
| `thinking`      | string | مستوى الاستدلال (مثل `low` و`medium`)؛ ويجب أن يكون أحد المستويات التي يدعمها النموذج المحدد.                                                          |
| `authProfileId` | string | يتجاوز `defaultAuthProfileId`.                                                                                                             |
| `temperature`   | number | يُطبَّق بأفضل جهد؛ ولا تلتزم به جميع المزوّدات.                                                                                                      |
| `maxTokens`     | number | حدّ أقصى يُطبَّق بأفضل جهد على رموز المخرجات.                                                                                                             |
| `timeoutMs`     | number | مهلة التشغيل؛ القيمة الافتراضية `30000`.                                                                                                                 |

## المخرجات

تُعيد `details.json` (بيانات JSON المحلَّلة والمتحقَّق منها وفق المخطط)، إضافةً إلى `details.provider` و`details.model` اللذين يحددان ما تم تشغيله فعليًا.

## مثال: خطوة في سير عمل Lobster

### قيد مهم

يفترض المثال أدناه أن **Lobster CLI المستقل** يعمل في بيئة يتوفر فيها مسبقًا لـ `openclaw.invoke` عنوان URL الصحيح للـ Gateway وسياق المصادقة الصحيح.

بالنسبة إلى مشغّل Lobster **المضمّن** والمرفق داخل OpenClaw، فإن نمط CLI المتداخل هذا **غير موثوق حاليًا**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

إلى أن يتوفر في Lobster المضمّن جسر مدعوم لهذا التدفق، يُفضَّل استخدام أحد الخيارين التاليين:

- استدعاءات مباشرة لأداة `llm-task` خارج Lobster، أو
- خطوات Lobster لا تعتمد على استدعاءات `openclaw.invoke` المتداخلة.

مثال على Lobster CLI المستقل:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## ملاحظات السلامة

- **JSON فقط**: يُوجَّه النموذج إلى إرجاع قيمة JSON فقط، من دون أسوار شيفرة أو تعليقات.
- **من دون أدوات**: تكون الأدوات معطّلة في التشغيل الأساسي، لذلك لا يستطيع النموذج إجراء استدعاءات خارجية في منتصف المهمة.
- تعامل مع المخرجات على أنها غير موثوقة ما لم تتحقق منها باستخدام `schema`.
- ضع الموافقات قبل أي خطوة ذات آثار جانبية (الإرسال أو النشر أو التنفيذ) تستهلك هذه المخرجات.

## ذو صلة

- [مستويات الاستدلال](/ar/tools/thinking)
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
