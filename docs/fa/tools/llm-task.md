---
read_when:
    - می‌خواهید یک مرحلهٔ LLM فقط با JSON درون گردش‌کارها داشته باشید
    - برای خودکارسازی، به خروجی اعتبارسنجی‌شده با اسکیما از مدل زبانی بزرگ نیاز دارید
summary: وظایف LLM فقط با JSON برای گردش‌کارها (ابزار Plugin اختیاری)
title: وظیفه LLM
x-i18n:
    generated_at: "2026-05-04T02:27:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` یک **ابزار Plugin اختیاری** است که یک وظیفه LLM فقط-JSON را اجرا می‌کند و
خروجی ساخت‌یافته برمی‌گرداند (در صورت تمایل، با JSON Schema اعتبارسنجی می‌شود).

این برای موتورهای گردش کار مانند Lobster ایدئال است: می‌توانید یک مرحله LLM تکی اضافه کنید
بدون اینکه برای هر گردش کار کد سفارشی OpenClaw بنویسید.

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

2. ابزار اختیاری را مجاز کنید:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

از `tools.allow` فقط زمانی استفاده کنید که حالت فهرست مجاز محدودکننده را می‌خواهید.

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

`allowedModels` یک فهرست مجاز از رشته‌های `provider/model` است. اگر تنظیم شود، هر درخواستی
خارج از فهرست رد می‌شود.

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

## مثال: مرحله گردش کار Lobster

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

- این ابزار **فقط-JSON** است و به مدل دستور می‌دهد فقط JSON خروجی دهد (بدون
  code fence و بدون توضیح).
- هیچ ابزاری در این اجرا در اختیار مدل قرار نمی‌گیرد.
- خروجی را نامطمئن در نظر بگیرید مگر اینکه با `schema` اعتبارسنجی کنید.
- تأییدها را پیش از هر مرحله دارای اثر جانبی قرار دهید (ارسال، پست، اجرا).

## مرتبط

- [سطوح تفکر](/fa/tools/thinking)
- [زیرعامل‌ها](/fa/tools/subagents)
- [دستورات اسلش](/fa/tools/slash-commands)
