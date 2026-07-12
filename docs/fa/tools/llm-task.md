---
read_when:
    - شما یک مرحلهٔ LLM با خروجی صرفاً JSON درون گردش‌کارها می‌خواهید
    - برای خودکارسازی به خروجی LLM اعتبارسنجی‌شده با طرح‌واره نیاز دارید
summary: وظایف LLM صرفاً با خروجی JSON برای گردش‌های کاری (ابزار اختیاری Plugin)
title: وظیفهٔ LLM
x-i18n:
    generated_at: "2026-07-12T10:55:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` یک **ابزار Plugin اختیاری** همراه‌شده است که یک فراخوانی LLM با خروجی صرفاً JSON اجرا می‌کند و خروجی ساخت‌یافته برمی‌گرداند؛ این خروجی در صورت تمایل، با یک JSON Schema اعتبارسنجی می‌شود. این ابزار به موتورهای گردش کاری مانند Lobster امکان می‌دهد بدون نیاز به کد سفارشی OpenClaw برای هر گردش کار، یک مرحله LLM داشته باشند.

## فعال‌سازی

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

2. ابزار را مجاز کنید:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow`، ابزار `llm-task` را بدون محدود کردن سایر ابزارهای اصلی به نمایه ابزار فعال اضافه می‌کند. تنها در صورتی از `tools.allow` استفاده کنید که به‌جای آن، حالت فهرست مجاز محدودکننده می‌خواهید.

## پیکربندی (اختیاری)

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

`allowedModels` فهرستی مجاز از رشته‌های `provider/model` است؛ درخواست هر مدل دیگری رد می‌شود. همه کلیدهای دیگر، مقادیر جایگزین هر فراخوانی هستند که وقتی فراخوانی ابزار آن پارامتر را مشخص نکند، استفاده می‌شوند.

## پارامترهای ابزار

| پارامتر         | نوع    | توضیحات                                                                                                                                                     |
| --------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | الزامی. دستور وظیفه برای LLM.                                                                                                                               |
| `input`         | any    | بار داده اختیاری؛ به JSON سریال‌سازی و به پرامپت افزوده می‌شود.                                                                                             |
| `schema`        | object | JSON Schema اختیاری که خروجی تجزیه‌شده باید در برابر آن اعتبارسنجی شود.                                                                                     |
| `provider`      | string | `defaultProvider` / ارائه‌دهنده پیش‌فرض عامل را لغو می‌کند.                                                                                                 |
| `model`         | string | `defaultModel` را لغو می‌کند؛ شناسه‌های ساده مدل، نام‌های مستعار یا ارجاع `provider/model` را می‌پذیرد (پیشوند تکراری ارائه‌دهنده به‌طور خودکار حذف می‌شود). |
| `thinking`      | string | سطح استدلال (برای مثال `low` یا `medium`)؛ باید یکی از سطوح پشتیبانی‌شده مدل انتخاب‌شده باشد.                                                                |
| `authProfileId` | string | `defaultAuthProfileId` را لغو می‌کند.                                                                                                                       |
| `temperature`   | number | به‌صورت بهترین تلاش؛ همه ارائه‌دهندگان آن را رعایت نمی‌کنند.                                                                                                |
| `maxTokens`     | number | سقف توکن‌های خروجی به‌صورت بهترین تلاش.                                                                                                                     |
| `timeoutMs`     | number | مهلت اجرای عملیات؛ پیش‌فرض `30000` است.                                                                                                                     |

## خروجی

`details.json` (JSON تجزیه‌شده و اعتبارسنجی‌شده با اسکیما) را به‌همراه `details.provider` و `details.model` برمی‌گرداند که ارائه‌دهنده و مدل واقعاً اجراشده را مشخص می‌کنند.

## مثال: مرحله گردش کار Lobster

### محدودیت مهم

مثال زیر فرض می‌کند **Lobster CLI مستقل** در محیطی اجرا می‌شود که `openclaw.invoke` از قبل نشانی Gateway و زمینه احراز هویت درست را دارد.

برای اجراکننده **تعبیه‌شده** Lobster که همراه OpenClaw ارائه می‌شود، این الگوی CLI تودرتو **در حال حاضر قابل اتکا نیست**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

تا زمانی که Lobster تعبیه‌شده پل پشتیبانی‌شده‌ای برای این جریان داشته باشد، یکی از گزینه‌های زیر را ترجیح دهید:

- فراخوانی مستقیم ابزار `llm-task` خارج از Lobster، یا
- مراحل Lobster که به فراخوانی‌های تودرتوی `openclaw.invoke` متکی نیستند.

مثال Lobster CLI مستقل:

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

- **صرفاً JSON**: به مدل دستور داده می‌شود فقط یک مقدار JSON برگرداند؛ بدون حصار کد و بدون توضیحات.
- **بدون ابزار**: ابزارها در اجرای زیربنایی غیرفعال‌اند، بنابراین مدل نمی‌تواند در میانه وظیفه فراخوانی بیرونی انجام دهد.
- خروجی را نامطمئن در نظر بگیرید، مگر اینکه آن را با `schema` اعتبارسنجی کنید.
- تأییدها را پیش از هر مرحله دارای اثر جانبی (ارسال، انتشار، اجرا) که این خروجی را مصرف می‌کند، قرار دهید.

## مرتبط

- [سطوح تفکر](/fa/tools/thinking)
- [عامل‌های فرعی](/fa/tools/subagents)
- [دستورهای اسلش](/fa/tools/slash-commands)
