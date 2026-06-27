---
read_when:
    - تريد خطوة LLM تقتصر على JSON داخل مسارات العمل
    - تحتاج إلى مخرجات LLM متحقَّق منها وفق المخطط للأتمتة
summary: مهام LLM بصيغة JSON فقط لسير العمل (أداة Plugin اختيارية)
title: مهمة نموذج لغوي كبير
x-i18n:
    generated_at: "2026-06-27T18:43:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` هي **أداة Plugin اختيارية** تشغّل مهمة LLM مقيّدة بـ JSON فقط وتُرجع مخرجات منظّمة (مع إمكانية التحقق منها اختياريًا مقابل JSON Schema).

هذا مثالي لمحركات سير العمل مثل Lobster: يمكنك إضافة خطوة LLM واحدة دون كتابة كود OpenClaw مخصص لكل سير عمل.

## تفعيل Plugin

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

2. اسمح بالأداة الاختيارية:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

استخدم `tools.allow` فقط عندما تريد وضع قائمة سماح مقيّدة.

## الإعدادات (اختيارية)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` هي قائمة سماح لسلاسل `provider/model`. إذا ضُبطت، فسيُرفض أي طلب خارج القائمة.

## معلمات الأداة

- `prompt` (سلسلة نصية، مطلوب)
- `input` (أي قيمة، اختياري)
- `schema` (كائن، JSON Schema اختياري)
- `provider` (سلسلة نصية، اختياري)
- `model` (سلسلة نصية، اختياري)
- `thinking` (سلسلة نصية، اختياري)
- `authProfileId` (سلسلة نصية، اختياري)
- `temperature` (رقم، اختياري)
- `maxTokens` (رقم، اختياري)
- `timeoutMs` (رقم، اختياري)

يقبل `thinking` إعدادات الاستدلال القياسية المسبقة في OpenClaw، مثل `low` أو `medium`.

## المخرجات

تُرجع `details.json` يحتوي على JSON المحلّل (وتتحقق منه مقابل `schema` عند توفيره).

## مثال: خطوة سير عمل Lobster

### قيد مهم

يفترض المثال أدناه أن **Lobster CLI المستقل** يعمل في بيئة يكون فيها `openclaw.invoke` لديه بالفعل عنوان URL الصحيح لـ Gateway وسياق المصادقة الصحيح.

بالنسبة إلى مشغّل Lobster **المضمّن** داخل OpenClaw، فإن نمط CLI المتداخل هذا **غير موثوق حاليًا**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

إلى أن يتوفر في Lobster المضمّن جسر مدعوم لهذا التدفق، فضّل أحد الخيارين:

- استدعاءات أداة `llm-task` مباشرة خارج Lobster، أو
- خطوات Lobster التي لا تعتمد على استدعاءات `openclaw.invoke` المتداخلة.

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

- الأداة **مقيّدة بـ JSON فقط** وتوجّه النموذج إلى إخراج JSON فقط (دون
  أسوار كود، ودون تعليقات).
- لا تُعرَض أي أدوات على النموذج في هذا التشغيل.
- تعامل مع المخرجات على أنها غير موثوقة ما لم تتحقق منها باستخدام `schema`.
- ضع الموافقات قبل أي خطوة لها آثار جانبية (إرسال، نشر، تنفيذ).

## ذات صلة

- [مستويات التفكير](/ar/tools/thinking)
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
