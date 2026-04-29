---
read_when:
    - می‌خواهید یک گام LLM فقط با JSON درون گردش‌های کاری داشته باشید
    - برای خودکارسازی به خروجی مدل زبانی بزرگ اعتبارسنجی‌شده با طرح‌واره نیاز دارید
summary: وظایف LLM فقط JSON برای جریان‌های کاری (ابزار Plugin اختیاری)
title: وظیفهٔ LLM
x-i18n:
    generated_at: "2026-04-29T23:43:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` یک **ابزار اختیاری Plugin** است که یک وظیفه LLM فقط JSON را اجرا می‌کند و
خروجی ساختاریافته برمی‌گرداند (که در صورت تمایل با JSON Schema اعتبارسنجی می‌شود).

این برای موتورهای گردش‌کار مانند Lobster ایده‌آل است: می‌توانید یک گام LLM واحد اضافه کنید
بدون اینکه برای هر گردش‌کار کد سفارشی OpenClaw بنویسید.

## فعال‌سازی Plugin

1. Plugin را فعال کنید:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. ابزار را در فهرست مجاز قرار دهید (با `optional: true` ثبت شده است):

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

## پیکربندی (اختیاری)

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

`allowedModels` فهرست مجازی از رشته‌های `provider/model` است. اگر تنظیم شود، هر درخواستی
خارج از این فهرست رد می‌شود.

## پارامترهای ابزار

- `prompt` (رشته، الزامی)
- `input` (هر نوع، اختیاری)
- `schema` (شیء، JSON Schema اختیاری)
- `provider` (رشته، اختیاری)
- `model` (رشته، اختیاری)
- `thinking` (رشته، اختیاری)
- `authProfileId` (رشته، اختیاری)
- `temperature` (عدد، اختیاری)
- `maxTokens` (عدد، اختیاری)
- `timeoutMs` (عدد، اختیاری)

`thinking` پیش‌تنظیم‌های استاندارد استدلال OpenClaw را می‌پذیرد، مانند `low` یا `medium`.

## خروجی

`details.json` را برمی‌گرداند که شامل JSON تجزیه‌شده است (و در صورت ارائه شدن
`schema`، آن را اعتبارسنجی می‌کند).

## مثال: گام گردش‌کار Lobster

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

## نکات ایمنی

- این ابزار **فقط JSON** است و به مدل دستور می‌دهد فقط JSON خروجی دهد (بدون
  حصار کد و بدون توضیح).
- هیچ ابزاری برای این اجرا در اختیار مدل قرار نمی‌گیرد.
- خروجی را نامطمئن در نظر بگیرید مگر اینکه آن را با `schema` اعتبارسنجی کنید.
- تأییدها را پیش از هر گام دارای اثر جانبی قرار دهید (ارسال، پست کردن، اجرا).

## مرتبط

- [سطوح تفکر](/fa/tools/thinking)
- [زیرعامل‌ها](/fa/tools/subagents)
- [دستورهای اسلش](/fa/tools/slash-commands)
