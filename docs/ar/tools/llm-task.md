---
read_when:
    - تريد خطوة LLM بصيغة JSON فقط داخل سير العمل
    - تحتاج إلى مخرجات LLM متحقَّق من مخططها من أجل الأتمتة
summary: مهام LLM بصيغة JSON فقط من أجل سير العمل (أداة Plugin اختيارية)
title: مهمة LLM
x-i18n:
    generated_at: "2026-04-24T08:09:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` هي **أداة Plugin اختيارية** تشغّل مهمة LLM بصيغة JSON فقط
وتعيد مخرجات منظّمة (مع تحقق اختياري وفق JSON Schema).

وهذا مثالي لمحركات سير العمل مثل Lobster: إذ يمكنك إضافة خطوة LLM واحدة
من دون كتابة شيفرة OpenClaw مخصصة لكل سير عمل.

## تمكين Plugin

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

2. أضف الأداة إلى قائمة السماح (إذ يتم تسجيلها مع `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## الإعداد (اختياري)

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

تمثل `allowedModels` قائمة سماح من سلاسل `provider/model`. وإذا تم ضبطها، فسيُرفض أي طلب
خارج القائمة.

## معلمات الأداة

- `prompt` ‏(سلسلة، مطلوب)
- `input` ‏(أي نوع، اختياري)
- `schema` ‏(كائن، JSON Schema اختياري)
- `provider` ‏(سلسلة، اختياري)
- `model` ‏(سلسلة، اختياري)
- `thinking` ‏(سلسلة، اختياري)
- `authProfileId` ‏(سلسلة، اختياري)
- `temperature` ‏(رقم، اختياري)
- `maxTokens` ‏(رقم، اختياري)
- `timeoutMs` ‏(رقم، اختياري)

تقبل `thinking` الإعدادات المسبقة القياسية للتفكير في OpenClaw، مثل `low` أو `medium`.

## المخرجات

تعيد `details.json` التي تحتوي على JSON المحللة (وتتحقق وفق
`schema` عند توفيرها).

## مثال: خطوة سير عمل في Lobster

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

- الأداة **JSON فقط** وتوجه النموذج لإخراج JSON فقط (من دون
  code fences، ومن دون تعليق).
- لا يتم كشف أي أدوات للنموذج أثناء هذا التشغيل.
- تعامل مع المخرجات على أنها غير موثوقة ما لم تتحقق منها باستخدام `schema`.
- ضع الموافقات قبل أي خطوة ذات آثار جانبية (send, post, exec).

## ذو صلة

- [مستويات التفكير](/ar/tools/thinking)
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
