---
read_when:
    - شما یک گام LLM فقط JSON درون گردش‌کارها می‌خواهید
    - برای خودکارسازی به خروجی LLM اعتبارسنجی‌شده با schema نیاز دارید
summary: وظایف LLM فقط JSON برای گردش‌کارها (ابزار اختیاری Plugin)
title: وظیفهٔ LLM
x-i18n:
    generated_at: "2026-06-27T19:01:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` یک **ابزار Plugin اختیاری** است که یک وظیفه LLM فقط-JSON را اجرا می‌کند و
خروجی ساختاریافته برمی‌گرداند (به‌صورت اختیاری با JSON Schema اعتبارسنجی می‌شود).

این برای موتورهای گردش‌کار مانند Lobster ایدئال است: می‌توانید یک گام LLM واحد اضافه کنید
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

`details.json` را برمی‌گرداند که شامل JSON تجزیه‌شده است (و هنگام ارائه شدن
`schema`، در برابر آن اعتبارسنجی می‌کند).

## مثال: گام گردش‌کار Lobster

### محدودیت مهم

مثال زیر فرض می‌کند **CLI مستقل Lobster** در محیطی اجرا می‌شود که `openclaw.invoke` از پیش URL/auth context درست Gateway را دارد.

برای اجراکننده **embedded** بسته‌بندی‌شده Lobster داخل OpenClaw، این الگوی CLI تو در تو **در حال حاضر قابل اتکا نیست**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

تا زمانی که Lobster embedded یک پل پشتیبانی‌شده برای این جریان داشته باشد، ترجیح دهید یکی از این‌ها را استفاده کنید:

- فراخوانی‌های مستقیم ابزار `llm-task` خارج از Lobster، یا
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
- هیچ ابزاری برای این اجرا در اختیار مدل قرار نمی‌گیرد.
- خروجی را نامطمئن در نظر بگیرید، مگر اینکه با `schema` اعتبارسنجی کنید.
- تأییدها را پیش از هر گام دارای اثر جانبی قرار دهید (ارسال، پست کردن، اجرا).

## مرتبط

- [سطوح تفکر](/fa/tools/thinking)
- [زیرعامل‌ها](/fa/tools/subagents)
- [دستورهای اسلش](/fa/tools/slash-commands)
