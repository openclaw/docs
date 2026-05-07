---
read_when:
    - می‌خواهید در گردش‌کارها یک مرحلهٔ مدل زبانی بزرگ با خروجی فقط JSON داشته باشید
    - برای اتوماسیون به خروجی LLM اعتبارسنجی‌شده با طرح‌واره نیاز دارید
summary: وظایف LLM مختص JSON برای گردش‌های کاری (ابزار اختیاری Plugin)
title: وظیفهٔ مدل زبانی بزرگ
x-i18n:
    generated_at: "2026-05-07T13:32:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` یک **ابزار Plugin اختیاری** است که یک وظیفه LLM فقط-JSON را اجرا می‌کند و
خروجی ساختاریافته برمی‌گرداند (به‌صورت اختیاری با اعتبارسنجی در برابر JSON Schema).

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

2. ابزار اختیاری را مجاز کنید:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

از `tools.allow` فقط زمانی استفاده کنید که حالت فهرست مجاز محدودکننده می‌خواهید.

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

### محدودیت مهم

مثال زیر فرض می‌کند **CLI مستقل Lobster** در محیطی اجرا می‌شود که در آن `openclaw.invoke` از قبل URL Gateway/زمینه احراز هویت درست را دارد.

برای اجراکننده Lobster **تعبیه‌شده** داخل OpenClaw، این الگوی CLI تودرتو **در حال حاضر قابل اتکا نیست**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

تا زمانی که Lobster تعبیه‌شده یک پل پشتیبانی‌شده برای این جریان داشته باشد، ترجیحاً از یکی از این‌ها استفاده کنید:

- فراخوانی مستقیم ابزار `llm-task` خارج از Lobster، یا
- گام‌های Lobster که به فراخوانی‌های تودرتوی `openclaw.invoke` وابسته نیستند.

مثال CLI مستقل Lobster:

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

- این ابزار **فقط-JSON** است و به مدل دستور می‌دهد فقط JSON خروجی بدهد (بدون
  code fence و بدون توضیح).
- هیچ ابزاری برای این اجرا در اختیار مدل قرار داده نمی‌شود.
- خروجی را نامطمئن در نظر بگیرید مگر اینکه با `schema` اعتبارسنجی کنید.
- تأییدها را پیش از هر گامی که اثر جانبی دارد قرار دهید (send، post، exec).

## مرتبط

- [سطوح تفکر](/fa/tools/thinking)
- [زیرعامل‌ها](/fa/tools/subagents)
- [دستورهای اسلش](/fa/tools/slash-commands)
