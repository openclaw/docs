---
read_when:
    - تريد خطوة LLM تُخرج JSON فقط داخل سير العمل
    - تحتاج إلى مخرجات LLM مُتحقَّق منها وفق المخطط للأتمتة
summary: مهام LLM بصيغة JSON فقط لسير العمل (أداة Plugin اختيارية)
title: مهمة نموذج اللغة الكبير
x-i18n:
    generated_at: "2026-05-04T07:10:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` هي **أداة Plugin اختيارية** تشغّل مهمة نموذج لغوي كبير مقتصرة على JSON وتُرجع
مخرجات منظمة (يمكن اختياريًا التحقق منها مقابل JSON Schema).

هذا مثالي لمحركات سير العمل مثل Lobster: يمكنك إضافة خطوة نموذج لغوي كبير واحدة
من دون كتابة كود OpenClaw مخصص لكل سير عمل.

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

استخدم `tools.allow` فقط عندما تريد وضع قائمة سماح تقييدية.

## الإعدادات (اختياري)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` هي قائمة سماح لسلاسل `provider/model`. إذا ضُبطت، فسيتم رفض أي طلب
خارج القائمة.

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

يقبل `thinking` إعدادات الاستدلال القياسية في OpenClaw، مثل `low` أو `medium`.

## المخرجات

تُرجع `details.json` الذي يحتوي على JSON المحلّل (وتتحقق منه مقابل
`schema` عند توفيره).

## مثال: خطوة سير عمل Lobster

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

- الأداة **مقتصرة على JSON** وتوجه النموذج إلى إخراج JSON فقط (من دون
  أسوار كود، ومن دون تعليقات).
- لا تُعرَض أي أدوات للنموذج في هذا التشغيل.
- تعامل مع المخرجات على أنها غير موثوقة ما لم تتحقق منها باستخدام `schema`.
- ضع الموافقات قبل أي خطوة ذات آثار جانبية (إرسال، نشر، تنفيذ).

## ذو صلة

- [مستويات التفكير](/ar/tools/thinking)
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
